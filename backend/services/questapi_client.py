import html
import json
import random
import re
import sqlite3
from typing import Any, Dict, List, Optional
import httpx

from backend.config.settings import settings


import time

_TAG_RE = re.compile(r"<[^>]+>")
_REMOTE_UNREACHABLE_UNTIL = 0.0


def _clean_html_text(raw: Optional[str]) -> str:
    if not raw:
        return ""
    text = str(raw)
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</\s*(p|div|li|tr)\s*>", "\n", text, flags=re.IGNORECASE)
    text = _TAG_RE.sub("", text)
    text = html.unescape(text)
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.splitlines()]
    return "\n".join(ln for ln in lines if ln).strip()


def _map_dificuldade_to_label(raw_dif: Any) -> str:
    if isinstance(raw_dif, str):
        low = raw_dif.strip().lower()
        if low in ("facil", "fácil", "easy"):
            return "facil"
        if low in ("dificil", "difícil", "hard"):
            return "dificil"
        if low in ("intermediario", "intermediário", "medio", "médio", "medium"):
            return "intermediario"
    try:
        val = int(raw_dif)
        if val <= 2:
            return "facil"
        if val >= 4:
            return "dificil"
        return "intermediario"
    except (TypeError, ValueError):
        return "intermediario"


def _map_label_to_api_dificuldade(label: str) -> Optional[int]:
    if label == "facil":
        return 1
    if label == "intermediario":
        return 3
    if label == "dificil":
        return 5
    return None


def _normalize_banca_query(banca: str) -> Optional[str]:
    low = (banca or "").lower()
    if "cebr" in low or "cespe" in low:
        return "CEBRASPE"
    if "cesgran" in low:
        return "CESGRANRIO"
    if "fgv" in low:
        return "FGV"
    if "ibfc" in low:
        return "IBFC"
    if "vunesp" in low:
        return "VUNESP"
    return None


def sincronizar_externo_para_cache(
    conn: sqlite3.Connection,
    concurso_id: str,
    banca: str,
    dificuldade: str = "sorteado",
    limite: int = 4,
) -> int:
    """
    Consulta o serviço externo configurado no servidor para enriquecer o cache local.
    Respeita estritamente limites de taxa e timeouts, nunca expondo credenciais ao navegador.
    """
    global _REMOTE_UNREACHABLE_UNTIL
    if not settings.QUESTAPI_API_KEY or time.monotonic() < _REMOTE_UNREACHABLE_UNTIL:
        return 0

    headers = {
        "X-API-Key": settings.QUESTAPI_API_KEY,
        "Accept": "application/json",
    }
    params: Dict[str, Any] = {"per_page": max(2, min(limite, 8))}
    api_dif = _map_label_to_api_dificuldade(dificuldade)
    if api_dif is not None:
        params["dificuldade"] = api_dif
    banca_norm = _normalize_banca_query(banca)
    if banca_norm:
        params["banca"] = banca_norm

    inserted = 0
    try:
        with httpx.Client(
            base_url=settings.QUESTAPI_BASE_URL,
            headers=headers,
            timeout=min(settings.QUESTAPI_TIMEOUT_SEC, 6.0),
        ) as client:
            resp = client.get("/questoes", params=params)
            if resp.status_code != 200:
                return 0
            items = (resp.json().get("data") or {}).get("items") or []
            if not items and "banca" in params:
                # Algumas bancas usam nomenclatura alternativa no catálogo remoto
                params.pop("banca", None)
                resp = client.get("/questoes", params=params)
                if resp.status_code != 200:
                    return 0
                items = (resp.json().get("data") or {}).get("items") or []

            cur = conn.cursor()
            gab_lookups = 0
            for it in items:
                if it.get("anulada"):
                    continue
                ext_id = f"qapi_{it.get('id')}"
                cur.execute("SELECT 1 FROM questoes_cache WHERE external_id = ?", (ext_id,))
                if cur.fetchone():
                    continue

                gabarito = it.get("gabarito")
                if not gabarito and gab_lookups < 3:
                    rg = client.get(f"/questoes/{it.get('id')}/gabarito")
                    gab_lookups += 1
                    if rg.status_code == 200:
                        gabarito = (rg.json().get("data") or {}).get("gabarito")
                    elif rg.status_code == 429:
                        break
                if not gabarito:
                    continue

                raw_alts = it.get("alternativas") or []
                clean_alts = [
                    {
                        "letra": str(a.get("letra", "")).strip().upper(),
                        "texto": _clean_html_text(a.get("texto")),
                    }
                    for a in raw_alts
                    if isinstance(a, dict)
                ]
                tipo_raw = str(it.get("tipo") or "").lower()
                is_ce = "certo" in tipo_raw or len(clean_alts) == 2
                tipo_q = "certo_errado" if is_ce else "multipla_escolha"
                if is_ce and not clean_alts:
                    clean_alts = [{"letra": "C", "texto": "Certo"}, {"letra": "E", "texto": "Errado"}]

                prova_meta = (it.get("provas") or [{}])[0] if it.get("provas") else {}
                classif = it.get("classificacao") or {}
                enunciado = _clean_html_text(it.get("enunciado"))
                if not enunciado or len(enunciado) < 12:
                    continue

                ano_val = 2024
                try:
                    ano_val = int(prova_meta.get("ano") or 2024)
                except (TypeError, ValueError):
                    ano_val = 2024

                banca_item = str(prova_meta.get("banca") or banca or "Oficial")
                orgao_item = str(prova_meta.get("orgao") or "")
                disc_item = str(classif.get("materia") or "Conhecimentos Gerais")
                assunto_item = str(classif.get("assunto") or "")
                dif_label = _map_dificuldade_to_label(it.get("dificuldade"))

                cur.execute(
                    """
                    INSERT OR IGNORE INTO questoes_cache (
                        external_id, banca, orgao, concurso_id, ano, disciplina, assunto,
                        dificuldade, tipo_questao, enunciado, alternativas_json, gabarito,
                        comentario, is_prova_anterior, prova_titulo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                    """,
                    (
                        ext_id,
                        banca_item,
                        orgao_item,
                        concurso_id,
                        ano_val,
                        disc_item,
                        assunto_item,
                        dif_label,
                        tipo_q,
                        enunciado,
                        json.dumps(clean_alts, ensure_ascii=False),
                        str(gabarito).strip().upper(),
                        f"Gabarito oficial ({banca_item}, {ano_val}) · Assunto: {assunto_item or disc_item}.",
                        f"Prova {orgao_item} {ano_val} ({banca_item})".strip(),
                    ),
                )
                inserted += cur.rowcount

            if inserted > 0:
                conn.commit()
    except (httpx.ConnectError, httpx.TimeoutException):
        _REMOTE_UNREACHABLE_UNTIL = time.monotonic() + 60.0
        return inserted
    except Exception:
        # Falha externa nunca bloqueia o treino do aluno
        return inserted

    return inserted


def serializar_questao_publica(row: sqlite3.Row) -> Dict[str, Any]:
    """Serializa questão para o navegador OMITINDO estritamente gabarito e comentário."""
    alts = []
    try:
        alts = json.loads(row["alternativas_json"] or "[]")
    except Exception:
        alts = []
    return {
        "id": row["id"],
        "concurso_id": row["concurso_id"],
        "banca": row["banca"],
        "orgao": row["orgao"],
        "ano": row["ano"],
        "disciplina": row["disciplina"],
        "assunto": row["assunto"],
        "dificuldade": row["dificuldade"],
        "tipo_questao": row["tipo_questao"],
        "enunciado": row["enunciado"],
        "alternativas": alts,
        "is_prova_anterior": bool(row["is_prova_anterior"]),
        "prova_titulo": row["prova_titulo"] or "",
    }


def selecionar_questoes_para_sessao(
    conn: sqlite3.Connection,
    concurso_id: str,
    banca: str = "",
    disciplina: str = "todas",
    dificuldade: str = "sorteado",
    quantidade: int = 10,
    is_prova_anterior: bool = False,
    disciplinas_concurso: Optional[List[str]] = None,
    permitir_sync_remoto: bool = False,
) -> List[sqlite3.Row]:
    """
    Seleciona questões para sessão usando prioridade:
    1) Mesmo concurso + disciplina + dificuldade;
    2) Mesmo concurso + dificuldade;
    3) Mesma banca / área ou todo o edital sorteando dificuldades quando 'sorteado'.
    """
    cur = conn.cursor()

    def _query(cid: Optional[str], disc: str, dif: str, only_prova: bool) -> List[sqlite3.Row]:
        sql = "SELECT * FROM questoes_cache WHERE 1=1"
        params: List[Any] = []
        if cid:
            sql += " AND concurso_id = ?"
            params.append(cid)
        if disc and disc != "todas":
            sql += " AND lower(disciplina) = lower(?)"
            params.append(disc)
        if dif and dif != "sorteado":
            sql += " AND dificuldade = ?"
            params.append(dif)
        if only_prova:
            sql += " AND is_prova_anterior = 1"
        cur.execute(sql, params)
        return cur.fetchall()

    pool = _query(concurso_id, disciplina, dificuldade, is_prova_anterior)

    if len(pool) < quantidade and is_prova_anterior:
        # Expande para outras provas da mesma banca/concurso sem exigir flag restrita se faltar
        extra = _query(concurso_id, disciplina, dificuldade, False)
        seen = {r["id"] for r in pool}
        pool.extend([r for r in extra if r["id"] not in seen])

    if len(pool) < quantidade and disciplina != "todas":
        # Mantém concurso-alvo priorizando itens da mesma disciplina primeiro
        extra = _query(concurso_id, "todas", dificuldade, False)
        seen = {r["id"] for r in pool}
        pool.extend([r for r in extra if r["id"] not in seen])

    if len(pool) < quantidade and dificuldade != "sorteado":
        extra = _query(concurso_id, disciplina, "sorteado", False)
        seen = {r["id"] for r in pool}
        pool.extend([r for r in extra if r["id"] not in seen])

    if len(pool) < quantidade:
        # Expande para mesma banca em outros editais (sinergia de banca)
        if banca:
            b_short = banca.split()[0].split("(")[0].strip()
            cur.execute("SELECT * FROM questoes_cache WHERE lower(banca) LIKE ?", (f"%{b_short.lower()}%",))
            seen = {r["id"] for r in pool}
            pool.extend([r for r in cur.fetchall() if r["id"] not in seen])

    if len(pool) < quantidade and permitir_sync_remoto:
        synced = sincronizar_externo_para_cache(conn, concurso_id, banca, dificuldade, limite=4)
        if synced > 0:
            extra = _query(concurso_id, "todas", "sorteado", False)
            seen = {r["id"] for r in pool}
            pool.extend([r for r in extra if r["id"] not in seen])

    if len(pool) < quantidade:
        cur.execute("SELECT * FROM questoes_cache")
        seen = {r["id"] for r in pool}
        pool.extend([r for r in cur.fetchall() if r["id"] not in seen])

    if not pool:
        return []

    if dificuldade == "sorteado":
        por_dif = {"facil": [], "intermediario": [], "dificil": []}
        for r in pool:
            d = r["dificuldade"] if r["dificuldade"] in por_dif else "intermediario"
            por_dif[d].append(r)
        for lst in por_dif.values():
            random.shuffle(lst)
        selected: List[sqlite3.Row] = []
        used_ids = set()
        order = ["facil", "intermediario", "dificil"]
        idx = 0
        while len(selected) < min(quantidade, len(pool)):
            bucket = por_dif[order[idx % 3]]
            if bucket:
                item = bucket.pop(0)
                if item["id"] not in used_ids:
                    selected.append(item)
                    used_ids.add(item["id"])
            idx += 1
            if idx > len(pool) * 4:
                break
        if len(selected) < min(quantidade, len(pool)):
            for r in pool:
                if r["id"] not in used_ids:
                    selected.append(r)
                    used_ids.add(r["id"])
                if len(selected) >= min(quantidade, len(pool)):
                    break
        return selected

    shuffled = list(pool)
    random.shuffle(shuffled)
    return shuffled[: min(quantidade, len(shuffled))]
