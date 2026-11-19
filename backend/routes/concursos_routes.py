import json
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query
from backend.database.connection import get_db_connection
from backend.routes.auth_routes import obter_usuario_autenticado

router = APIRouter(prefix="/api/concursos", tags=["Concursos"])


def _get_user_sets(cur, user_id: Optional[int]) -> tuple[set[str], set[int]]:
    if user_id is None:
        return set(), set()
    cur.execute("SELECT concurso_id FROM usuario_concursos_salvos WHERE user_id = ?", (user_id,))
    saved_ids = {r["concurso_id"] for r in cur.fetchall()}
    cur.execute("SELECT material_id FROM usuario_materiais_estudados WHERE user_id = ?", (user_id,))
    studied_ids = {r["material_id"] for r in cur.fetchall()}
    return saved_ids, studied_ids


def _hydrate_concurso(row: dict, cur, saved_ids: set[str], studied_ids: set[int]) -> dict:
    c = dict(row)
    c["salvo"] = c["id"] in saved_ids
    c["disciplinas"] = json.loads(c.pop("disciplinas_json", "[]"))
    cur.execute("SELECT * FROM materiais WHERE concurso_id = ? ORDER BY destaque DESC, id ASC", (c["id"],))
    mats = []
    for m in cur.fetchall():
        md = dict(m)
        md["gratuito"] = bool(md["gratuito"])
        md["destaque"] = bool(md["destaque"])
        md["estudado"] = md["id"] in studied_ids
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
    apenas_salvos: bool = Query(False),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()

    saved_ids, studied_ids = _get_user_sets(cur, uid)
    cur.execute("SELECT * FROM concursos")
    rows = [_hydrate_concurso(r, cur, saved_ids, studied_ids) for r in cur.fetchall()]

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
def obter_concurso(
    concurso_id: str,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM concursos WHERE id = ?", (concurso_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso não encontrado")

    saved_ids, studied_ids = _get_user_sets(cur, uid)
    concurso = _hydrate_concurso(row, cur, saved_ids, studied_ids)
    conn.close()
    return concurso


@router.post("/{concurso_id}/favorito")
def alternar_favorito(
    concurso_id: str,
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

    cur.execute("SELECT sigla FROM concursos WHERE id = ?", (concurso_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso não encontrado")

    cur.execute(
        "SELECT 1 FROM usuario_concursos_salvos WHERE user_id = ? AND concurso_id = ?",
        (uid, concurso_id),
    )
    ja_salvo = cur.fetchone() is not None
    if ja_salvo:
        cur.execute(
            "DELETE FROM usuario_concursos_salvos WHERE user_id = ? AND concurso_id = ?",
            (uid, concurso_id),
        )
        novo_salvo = False
    else:
        cur.execute(
            "INSERT INTO usuario_concursos_salvos (user_id, concurso_id) VALUES (?, ?)",
            (uid, concurso_id),
        )
        novo_salvo = True

    conn.commit()
    conn.close()
    return {"id": concurso_id, "sigla": row["sigla"], "salvo": novo_salvo}

