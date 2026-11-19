import re
import unicodedata
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, Response
from backend.database.connection import get_db_connection
from backend.routes.auth_routes import obter_usuario_autenticado
from backend.services.pdf_generator import (
    gerar_pdf_material_download,
    gerar_preview_material,
)

router = APIRouter(prefix="/api/materiais", tags=["Materiais por Concurso"])


def _safe_filename_part(value: str) -> str:
    norm = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", norm).strip("_")
    return cleaned or "Roteiro"


@router.get("")
def listar_materiais(
    concurso_id: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()

    studied_ids: set[int] = set()
    if uid is not None:
        cur.execute("SELECT material_id FROM usuario_materiais_estudados WHERE user_id = ?", (uid,))
        studied_ids = {r["material_id"] for r in cur.fetchall()}

    query = """
        SELECT m.*, c.titulo as concurso_titulo, c.sigla as concurso_sigla, c.status as concurso_status, c.banca as concurso_banca
        FROM materiais m
        JOIN concursos c ON c.id = m.concurso_id
        WHERE 1=1
    """
    params = []
    if concurso_id and concurso_id != "todos":
        query += " AND m.concurso_id = ?"
        params.append(concurso_id)
    if categoria and categoria != "todas":
        query += " AND m.categoria = ?"
        params.append(categoria)

    query += " ORDER BY m.destaque DESC, m.id ASC"
    cur.execute(query, params)
    rows = []
    for r in cur.fetchall():
        d = dict(r)
        d["gratuito"] = bool(d["gratuito"])
        d["destaque"] = bool(d["destaque"])
        d["estudado"] = d["id"] in studied_ids
        rows.append(d)

    total = len(rows)
    estudados = sum(1 for x in rows if x["estudado"])
    conn.close()
    return {
        "total": total,
        "estudados": estudados,
        "progresso_pct": round((estudados / total) * 100, 1) if total > 0 else 0,
        "materiais": rows
    }


@router.post("/{material_id}/estudado")
def alternar_material_estudado(
    material_id: int,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM usuarios WHERE id = ?", (uid,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=401, detail="Sessão de usuário inválida. Faça login novamente.")

    cur.execute("SELECT id, titulo FROM materiais WHERE id = ?", (material_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Material não encontrado")

    cur.execute(
        "SELECT 1 FROM usuario_materiais_estudados WHERE user_id = ? AND material_id = ?",
        (uid, material_id),
    )
    ja_estudado = cur.fetchone() is not None
    if ja_estudado:
        cur.execute(
            "DELETE FROM usuario_materiais_estudados WHERE user_id = ? AND material_id = ?",
            (uid, material_id),
        )
        novo_estudado = False
    else:
        cur.execute(
            "INSERT INTO usuario_materiais_estudados (user_id, material_id) VALUES (?, ?)",
            (uid, material_id),
        )
        novo_estudado = True

    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('material_acesso', ?)",
        (f"Checklist estudado (user={uid}): {row['titulo']}",)
    )
    conn.commit()
    conn.close()
    return {"id": material_id, "estudado": novo_estudado}


@router.get("/{material_id}/preview")
def previsualizar_material(material_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM materiais WHERE id = ?", (material_id,))
    mat = cur.fetchone()
    if not mat:
        conn.close()
        raise HTTPException(status_code=404, detail="Material não encontrado")

    cur.execute("SELECT * FROM concursos WHERE id = ?", (mat["concurso_id"],))
    conc = cur.fetchone()
    conn.close()
    if not conc:
        raise HTTPException(status_code=404, detail="Concurso vinculado não encontrado")

    return gerar_preview_material(dict(conc), dict(mat))


@router.get("/{material_id}/download")
def baixar_material(material_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM materiais WHERE id = ?", (material_id,))
    mat = cur.fetchone()
    if not mat:
        conn.close()
        raise HTTPException(status_code=404, detail="Material não encontrado")

    cur.execute("SELECT * FROM concursos WHERE id = ?", (mat["concurso_id"],))
    conc = cur.fetchone()
    if not conc:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso vinculado não encontrado")

    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('material_acesso', ?)",
        (f"Download PDF: {mat['titulo']}",)
    )
    conn.commit()
    conn.close()

    pdf_bytes = gerar_pdf_material_download(dict(conc), dict(mat))
    sigla_part = _safe_filename_part(conc["sigla"])
    cat_part = _safe_filename_part(mat["categoria"])
    nome_arquivo = f"AprovaMais_{sigla_part}_{cat_part}_{material_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )

