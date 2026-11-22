import re
import unicodedata
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query, Response

from backend.database.connection import get_db_connection
from backend.routes.auth_routes import obter_usuario_autenticado
from backend.services.desempenho_engine import normalize_plano, obter_cotas_plano
from backend.services.pdf_generator import (
    gerar_pdf_material_download,
    gerar_preview_material,
)

router = APIRouter(prefix="/api/materiais", tags=["Materiais por Concurso"])


def _safe_filename_part(value: str) -> str:
    norm = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", norm).strip("_")
    return cleaned or "Guia"


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

    plano = "Gratuito"
    if uid is not None:
        cur.execute("SELECT plano FROM usuarios WHERE id = ?", (uid,))
        ur = cur.fetchone()
        if ur:
            plano = normalize_plano(ur["plano"])

    cotas = obter_cotas_plano(conn, uid, plano)

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
        if categoria == "Guia do Edital":
            query += " AND m.categoria IN ('Guia do Edital', 'Edital Verticalizado')"
        else:
            query += " AND m.categoria = ?"
            params.append(categoria)

    query += " ORDER BY m.destaque DESC, m.id ASC"
    cur.execute(query, params)
    raw_rows = cur.fetchall()
    total_filtered = len(raw_rows)

    if cotas["guias_qtd_limite"] is not None:
        unlocked_limit = cotas["guias_qtd_limite"]
    elif cotas["guias_pct_limite"] < 1.0:
        unlocked_limit = max(1, round(total_filtered * cotas["guias_pct_limite"])) if total_filtered > 0 else 0
    else:
        unlocked_limit = total_filtered

    rows = []
    for idx, r in enumerate(raw_rows):
        d = dict(r)
        if d.get("categoria") == "Edital Verticalizado":
            d["categoria"] = "Guia do Edital"
        d["gratuito"] = bool(d["gratuito"])
        d["destaque"] = bool(d["destaque"])
        d["estudado"] = d["id"] in studied_ids
        d["acesso_liberado"] = idx < unlocked_limit
        d["pode_baixar_pdf"] = cotas["pode_baixar_pdf"]
        rows.append(d)

    total = len(rows)
    estudados = sum(1 for x in rows if x["estudado"])
    conn.close()
    return {
        "total": total,
        "estudados": estudados,
        "progresso_pct": round((estudados / total) * 100, 1) if total > 0 else 0,
        "plano": cotas["plano"],
        "pode_baixar_pdf": cotas["pode_baixar_pdf"],
        "materiais": rows,
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
        (f"Checklist estudado (user={uid}): {row['titulo']}",),
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
def baixar_material(
    material_id: int,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nome, email, plano FROM usuarios WHERE id = ?", (uid,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=401, detail="Faça login para exportar guias em PDF A4.")

    plano = normalize_plano(user_row["plano"])
    if plano not in ("Pro", "Pro+"):
        conn.close()
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PLAN_LIMIT",
                "recurso": "download_pdf",
                "plano_atual": plano,
                "plano_recomendado": "Pro",
                "mensagem": "A exportação personalizada em PDF A4 está disponível nos planos Pro e Pro+. No seu plano atual você pode ler os guias liberados diretamente na tela.",
            },
        )

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
        (f"Download PDF A4 (user={uid}): {mat['titulo']}",),
    )
    conn.commit()
    conn.close()

    pdf_bytes = gerar_pdf_material_download(dict(conc), dict(mat), usuario=dict(user_row))
    sigla_part = _safe_filename_part(conc["sigla"])
    cat_name = "Guia_do_Edital" if mat["categoria"] == "Edital Verticalizado" else mat["categoria"]
    cat_part = _safe_filename_part(cat_name)
    nome_arquivo = f"AprovaMais_{sigla_part}_{cat_part}_{material_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'},
    )
