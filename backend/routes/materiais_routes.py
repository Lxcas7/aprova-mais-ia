from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from backend.database.connection import get_db_connection
from backend.services.pdf_generator import gerar_conteudo_material_download

router = APIRouter(prefix="/api/materiais", tags=["Materiais por Concurso"])


@router.get("")
def listar_materiais(concurso_id: Optional[str] = Query(None), categoria: Optional[str] = Query(None)):
    conn = get_db_connection()
    cur = conn.cursor()

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
        d["estudado"] = bool(d["estudado"])
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
def alternar_material_estudado(material_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, titulo, estudado FROM materiais WHERE id = ?", (material_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Material não encontrado")

    novo = 0 if row["estudado"] else 1
    cur.execute("UPDATE materiais SET estudado = ? WHERE id = ?", (novo, material_id))
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('material_acesso', ?)",
        (f"Checklist estudado: {row['titulo']}",)
    )
    conn.commit()
    conn.close()
    return {"id": material_id, "estudado": bool(novo)}


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

    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('material_acesso', ?)",
        (f"Download: {mat['titulo']}",)
    )
    conn.commit()
    conn.close()

    conteudo = gerar_conteudo_material_download(dict(conc), dict(mat))
    nome_arquivo = f"AprovaMais_{conc['sigla']}_{mat['categoria'].replace(' ', '_')}_{material_id}.txt"
    return PlainTextResponse(
        content=conteudo,
        headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'}
    )

