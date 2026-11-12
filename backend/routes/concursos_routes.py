import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.database.connection import get_db_connection

router = APIRouter(prefix="/api/concursos", tags=["Concursos"])


def _hydrate_concurso(row: dict, cur) -> dict:
    c = dict(row)
    c["salvo"] = bool(c["salvo"])
    c["disciplinas"] = json.loads(c.pop("disciplinas_json", "[]"))
    cur.execute("SELECT * FROM materiais WHERE concurso_id = ? ORDER BY destaque DESC, id ASC", (c["id"],))
    mats = []
    for m in cur.fetchall():
        md = dict(m)
        md["gratuito"] = bool(md["gratuito"])
        md["destaque"] = bool(md["destaque"])
        md["estudado"] = bool(md["estudado"])
        mats.append(md)
    c["materiais"] = mats
    return c


@router.get("")
def listar_concursos(
    status: Optional[str] = Query(None, description="aberto | previsto | encerrado | todos"),
    area: Optional[str] = Query(None),
    escolaridade: Optional[str] = Query(None),
    uf: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    apenas_salvos: bool = Query(False)
):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM concursos")
    rows = [_hydrate_concurso(r, cur) for r in cur.fetchall()]

    # Log search telemetry if query/filter was explicitly applied
    if any([q, status and status != "todos", area and area != "todas"]):
        detalhe = f"status={status or 'todos'}, area={area or 'todas'}, q={q or ''}"
        cur.execute("INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('busca', ?)", (detalhe,))
        conn.commit()

    conn.close()

    filtrados = []
    for c in rows:
        if apenas_salvos and not c["salvo"]:
            continue
        if status and status != "todos" and c["status"] != status:
            continue
        if area and area != "todas" and c["area"].lower() != area.lower():
            continue
        if escolaridade and escolaridade != "todos" and escolaridade.lower() not in c["escolaridade"].lower():
            continue
        if uf and uf != "todas" and c["uf"].lower() != uf.lower():
            continue
        if q:
            termo = q.lower().strip()
            texto_busca = f"{c['sigla']} {c['titulo']} {c['orgao']} {c['banca']} {c['area']} {c['resumo_ia']}".lower()
            if termo not in texto_busca:
                continue
        filtrados.append(c)

    resumo_counts = {
        "total": len(rows),
        "abertos": sum(1 for x in rows if x["status"] == "aberto"),
        "previstos": sum(1 for x in rows if x["status"] == "previsto"),
        "encerrados": sum(1 for x in rows if x["status"] == "encerrado"),
        "salvos": sum(1 for x in rows if x["salvo"]),
        "vagas_abertas": sum(x["vagas_num"] for x in rows if x["status"] == "aberto")
    }

    return {"resumo": resumo_counts, "concursos": filtrados}


@router.get("/{concurso_id}")
def obter_concurso(concurso_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM concursos WHERE id = ?", (concurso_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso não encontrado")

    concurso = _hydrate_concurso(row, cur)
    conn.close()
    return concurso


@router.post("/{concurso_id}/favorito")
def alternar_favorito(concurso_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT salvo, sigla FROM concursos WHERE id = ?", (concurso_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso não encontrado")

    novo_estado = 0 if row["salvo"] else 1
    cur.execute("UPDATE concursos SET salvo = ? WHERE id = ?", (novo_estado, concurso_id))
    conn.commit()
    conn.close()
    return {"id": concurso_id, "salvo": bool(novo_estado)}

