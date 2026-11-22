import json
import re
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple


PLAN_RULES: Dict[str, Dict[str, Any]] = {
    "Gratuito": {
        "nivelamentos_limite": 1,  # 1 simulado de nivelamento total (independentemente da banca)
        "questoes_dia_limite": 15,
        "provas_semana_limite": 0,
        "guias_pct_limite": 0.0,  # Regra especial: apenas 1 guia liberado na tela
        "guias_qtd_limite": 1,
        "pode_baixar_pdf": False,
        "pode_simulado_theo": False,
        "pode_cronograma_adaptativo": False,
    },
    "Básico": {
        "nivelamentos_limite": None,
        "questoes_dia_limite": 50,
        "provas_semana_limite": 1,  # 1 prova anterior por semana
        "guias_pct_limite": 0.40,  # 40% dos roteiros do edital na tela
        "guias_qtd_limite": None,
        "pode_baixar_pdf": False,
        "pode_simulado_theo": False,
        "pode_cronograma_adaptativo": True,
    },
    "Pro": {
        "nivelamentos_limite": None,
        "questoes_dia_limite": None,
        "provas_semana_limite": None,
        "guias_pct_limite": 1.0,
        "guias_qtd_limite": None,
        "pode_baixar_pdf": True,
        "pode_simulado_theo": True,
        "pode_cronograma_adaptativo": True,
    },
    "Pro+": {
        "nivelamentos_limite": None,
        "questoes_dia_limite": None,
        "provas_semana_limite": None,
        "guias_pct_limite": 1.0,
        "guias_qtd_limite": None,
        "pode_baixar_pdf": True,
        "pode_simulado_theo": True,
        "pode_cronograma_adaptativo": True,
    },
}


def normalize_plano(plano: Optional[str]) -> str:
    p = (plano or "Gratuito").strip()
    for valid in ("Gratuito", "Básico", "Pro", "Pro+"):
        if p.lower() == valid.lower():
            return valid
    if "pro+" in p.lower() or "plus" in p.lower():
        return "Pro+"
    if "pro" in p.lower():
        return "Pro"
    if "basic" in p.lower() or "básico" in p.lower():
        return "Básico"
    return "Gratuito"


def obter_cotas_plano(conn: sqlite3.Connection, user_id: Optional[int], plano_raw: Optional[str]) -> Dict[str, Any]:
    plano = normalize_plano(plano_raw)
    rules = PLAN_RULES[plano]

    niv_usados = 0
    qst_hoje = 0
    provas_sem = 0

    if user_id is not None:
        cur = conn.cursor()
        cur.execute(
            "SELECT COUNT(*) as c FROM sessoes_estudo_questoes WHERE user_id = ? AND tipo_sessao = 'nivelamento'",
            (user_id,),
        )
        niv_usados = int(cur.fetchone()["c"])

        hoje_ini = datetime.now().strftime("%Y-%m-%d 00:00:00")
        cur.execute(
            "SELECT COUNT(*) as c FROM usuario_respostas_questoes WHERE user_id = ? AND respondido_em >= ?",
            (user_id, hoje_ini),
        )
        qst_hoje = int(cur.fetchone()["c"])

        sem_ini = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            "SELECT COUNT(*) as c FROM sessoes_estudo_questoes WHERE user_id = ? AND tipo_sessao = 'prova_anterior' AND iniciado_em >= ?",
            (user_id, sem_ini),
        )
        provas_sem = int(cur.fetchone()["c"])

    return {
        "plano": plano,
        "nivelamentos_usados": niv_usados,
        "nivelamentos_limite": rules["nivelamentos_limite"],
        "questoes_hoje": qst_hoje,
        "questoes_dia_limite": rules["questoes_dia_limite"],
        "provas_semana_usadas": provas_sem,
        "provas_semana_limite": rules["provas_semana_limite"],
        "guias_pct_limite": rules["guias_pct_limite"],
        "guias_qtd_limite": rules["guias_qtd_limite"],
        "pode_baixar_pdf": rules["pode_baixar_pdf"],
        "pode_simulado_theo": rules["pode_simulado_theo"],
        "pode_cronograma_adaptativo": rules["pode_cronograma_adaptativo"],
    }


def verificar_cota_sessao(
    conn: sqlite3.Connection,
    user_id: Optional[int],
    plano_raw: Optional[str],
    tipo_sessao: str,
    quantidade: int,
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    if user_id is None:
        # Visitante sem login faz amostra limitada na hora
        return True, None

    cotas = obter_cotas_plano(conn, user_id, plano_raw)
    plano = cotas["plano"]

    if tipo_sessao == "nivelamento" and cotas["nivelamentos_limite"] is not None:
        if cotas["nivelamentos_usados"] >= cotas["nivelamentos_limite"]:
            return False, {
                "code": "PLAN_LIMIT",
                "recurso": "nivelamento",
                "plano_atual": plano,
                "plano_recomendado": "Básico",
                "mensagem": "No plano Gratuito você tem direito a 1 simulado de nivelamento diagnóstico (independentemente da banca). Faça upgrade para liberar novos diagnósticos contínuos.",
            }

    if tipo_sessao == "prova_anterior" and cotas["provas_semana_limite"] is not None:
        if cotas["provas_semana_limite"] == 0:
            return False, {
                "code": "PLAN_LIMIT",
                "recurso": "prova_anterior",
                "plano_atual": plano,
                "plano_recomendado": "Básico",
                "mensagem": "A resolução completa de Provas Anteriores Oficiais está disponível a partir do plano Básico (1 prova/semana) ou de forma ilimitada no Pro.",
            }
        if cotas["provas_semana_usadas"] >= cotas["provas_semana_limite"]:
            return False, {
                "code": "PLAN_LIMIT",
                "recurso": "prova_anterior",
                "plano_atual": plano,
                "plano_recomendado": "Pro",
                "mensagem": "Você já utilizou sua 1 prova anterior desta semana no plano Básico. Assine o plano Pro para resolver provas anteriores sem limite semanal.",
            }

    if tipo_sessao == "simulado_theo" and not cotas["pode_simulado_theo"]:
        return False, {
            "code": "PLAN_LIMIT",
            "recurso": "simulado_theo",
            "plano_atual": plano,
            "plano_recomendado": "Pro",
            "mensagem": "Os Simulados Dirigidos do Theo (cruzando todo o edital automaticamente) são exclusivos dos planos Pro e Pro+.",
        }

    if cotas["questoes_dia_limite"] is not None:
        if cotas["questoes_hoje"] >= cotas["questoes_dia_limite"]:
            rec = "Básico" if plano == "Gratuito" else "Pro"
            return False, {
                "code": "PLAN_LIMIT",
                "recurso": "questoes_dia",
                "plano_atual": plano,
                "plano_recomendado": rec,
                "mensagem": f"Limite diário de {cotas['questoes_dia_limite']} questões atingido hoje no plano {plano}.",
            }

    return True, None


def _parse_peso_num(peso_str: str, questoes_edital: int) -> float:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*%", peso_str or "")
    if m:
        return float(m.group(1).replace(",", "."))
    return float(max(questoes_edital, 5))


def _parse_meta_corte(nota_corte_str: str) -> float:
    if not nota_corte_str:
        return 75.0
    m = re.search(r"(\d{2,3}(?:[.,]\d+)?)", nota_corte_str)
    if m:
        val = float(m.group(1).replace(",", "."))
        if 45.0 <= val <= 95.0:
            return val
    return 75.0


def garantir_cronograma_usuario(
    conn: sqlite3.Connection,
    user_id: int,
    concurso_id: str,
    horas_dia: float = 4.0,
    dias_semana: Optional[List[str]] = None,
    reset: bool = False,
) -> None:
    cur = conn.cursor()
    if reset:
        cur.execute(
            "DELETE FROM usuario_cronograma_blocos WHERE user_id = ? AND concurso_id = ?",
            (user_id, concurso_id),
        )
    else:
        cur.execute(
            "SELECT COUNT(*) as c FROM usuario_cronograma_blocos WHERE user_id = ? AND concurso_id = ?",
            (user_id, concurso_id),
        )
        if cur.fetchone()["c"] > 0:
            return

    cur.execute("SELECT disciplinas_json FROM concursos WHERE id = ?", (concurso_id,))
    crow = cur.fetchone()
    disciplinas = json.loads(crow["disciplinas_json"]) if crow else []
    if not disciplinas:
        return

    dias = [d for d in (dias_semana or ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]) if d != "Dom"]
    if not dias:
        dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    # Distribui em 1 bloco focado quando < 90 min/dia ou 2 blocos proporcionais aos pesos do edital
    mins_por_dia = max(30, int(round(float(horas_dia or 4.0) * 60)))
    if mins_por_dia < 90:
        slot_durations = [mins_por_dia]
    else:
        b1 = mins_por_dia // 2
        b2 = mins_por_dia - b1
        slot_durations = [b1, b2]

    semana_ref = datetime.now().strftime("%Y-W%W")
    tipos = ["Guia + Questões", "Bateria Cronometrada", "Teoria + Resumo", "Revisão Ativa"]

    weighted_pool: List[str] = []
    for d in disciplinas:
        prio = (d.get("prioridade") or "Média").lower()
        rep = 3 if "crít" in prio else (2 if "alta" in prio else 1)
        for _ in range(rep):
            weighted_pool.append(d["nome"])

    idx = 0
    for dia in dias:
        for slot_idx, dur in enumerate(slot_durations, start=1):
            disc_nome = weighted_pool[idx % len(weighted_pool)]
            tipo_bloco = tipos[idx % len(tipos)]
            cur.execute(
                """
                INSERT INTO usuario_cronograma_blocos (
                    user_id, concurso_id, semana_ref, dia_semana, ordem,
                    disciplina, tipo_bloco, minutos_planejados, minutos_realizados, concluido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """,
                (user_id, concurso_id, semana_ref, dia, slot_idx, disc_nome, tipo_bloco, dur),
            )
            idx += 1
    conn.commit()


def calcular_sugestao_theo(
    disciplinas_perf: List[Dict[str, Any]],
    concurso: Dict[str, Any],
    meta_aprovacao: float,
) -> Dict[str, Any]:
    """
    Combina menor taxa de acertos com maior peso no edital e dificuldade variada
    considerando o concurso como um todo.
    """
    scored = []
    for d in disciplinas_perf:
        taxa_ref = d["taxa_atual_pct"] if d["questoes_resolvidas"] > 0 else (d["nivelamento_pct"] or 50.0)
        gap = max(12.0, meta_aprovacao - taxa_ref)
        urgencia = round((d["peso_num"] * gap) / 100.0, 2)
        scored.append((urgencia, taxa_ref, d))

    scored.sort(key=lambda x: x[0], reverse=True)
    foco_principal = [x[2] for x in scored[:3]] if scored else []
    nomes_foco = [d["disciplina"] for d in foco_principal]

    banca = concurso.get("banca") or "Oficial"
    if foco_principal:
        top1 = foco_principal[0]
        top2 = foco_principal[1] if len(foco_principal) > 1 else top1
        justificativa = (
            f"O Theo cruzou todo o edital {concurso['sigla']} ({banca}): "
            f"{top1['disciplina'].split('—')[0].strip()} ({round(top1['taxa_atual_pct'], 1)}%) e "
            f"{top2['disciplina'].split('—')[0].strip()} ({round(top2['taxa_atual_pct'], 1)}%) "
            f"concentram maior ganho de pontuação líquida nesta semana."
        )
    else:
        justificativa = f"Bateria mista equilibrada em todas as áreas do edital {concurso['sigla']} ({banca})."

    return {
        "concurso_id": concurso["id"],
        "sigla": concurso["sigla"],
        "banca": banca,
        "titulo": f"Simulado Dirigido do Theo · {concurso['sigla']}",
        "subtitulo": "Foco automático no concurso como um todo · Dificuldade sorteada (Fácil, Intermediário e Difícil)",
        "justificativa": justificativa,
        "quantidade": 20,
        "dificuldade": "sorteado",
        "tipo_sessao": "simulado_theo",
        "disciplinas_priorizadas": [
            {
                "disciplina": d["disciplina"],
                "peso": d["peso"],
                "taxa_atual_pct": round(d["taxa_atual_pct"], 1),
                "prioridade": d["prioridade"],
            }
            for d in foco_principal
        ],
    }


def _status_badge_disciplina(taxa: float, resolvidas: int, meta: float) -> str:
    if resolvidas == 0:
        return "Aguardando prática"
    if taxa >= meta:
        return "Acima da meta"
    if taxa >= meta - 10.0:
        return "Em evolução"
    return "Reforçar agora"


def obter_dashboard_estudo(
    conn: sqlite3.Connection,
    user_id: Optional[int],
    concurso_id_override: Optional[str] = None,
) -> Dict[str, Any]:
    cur = conn.cursor()

    user_row = None
    if user_id is not None:
        cur.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
        user_row = cur.fetchone()

    alvo_id = concurso_id_override or (user_row["concurso_alvo_id"] if user_row and user_row["concurso_alvo_id"] else "pf-2026")
    cur.execute("SELECT * FROM concursos WHERE id = ?", (alvo_id,))
    crow = cur.fetchone()
    if not crow:
        alvo_id = "pf-2026"
        cur.execute("SELECT * FROM concursos WHERE id = 'pf-2026'")
        crow = cur.fetchone()

    concurso = dict(crow)
    disciplinas = json.loads(concurso.pop("disciplinas_json", "[]"))
    concurso["disciplinas"] = disciplinas
    is_cebraspe = "cebraspe" in (concurso.get("banca") or "").lower()
    meta_aprovacao = _parse_meta_corte(concurso.get("nota_corte_anterior") or "")

    # Recupera respostas do usuário para este concurso nos últimos 30 dias + baseline de nivelamento
    respostas_30d: List[sqlite3.Row] = []
    respostas_niv: List[sqlite3.Row] = []
    sessoes_hist: List[sqlite3.Row] = []

    if user_id is not None:
        cur.execute(
            """
            SELECT r.*, s.tipo_sessao
            FROM usuario_respostas_questoes r
            JOIN sessoes_estudo_questoes s ON s.id = r.sessao_id
            WHERE r.user_id = ? AND r.concurso_id = ?
            ORDER BY r.respondido_em ASC
            """,
            (user_id, alvo_id),
        )
        todas_resps = cur.fetchall()
        limite_30d = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
        respostas_30d = [r for r in todas_resps if (r["respondido_em"] or "") >= limite_30d]

        cur.execute(
            """
            SELECT * FROM sessoes_estudo_questoes
            WHERE user_id = ? AND concurso_id = ? AND tipo_sessao = 'nivelamento'
            ORDER BY id ASC LIMIT 1
            """,
            (user_id, alvo_id),
        )
        first_niv = cur.fetchone()
        if first_niv:
            cur.execute(
                "SELECT * FROM usuario_respostas_questoes WHERE sessao_id = ?",
                (first_niv["id"],),
            )
            respostas_niv = cur.fetchall()

        cur.execute(
            """
            SELECT id, titulo, tipo_sessao, dificuldade_filtro, total_questoes, respondidas,
                   acertos, erros, branco, escore_liquido, status, iniciado_em, finalizado_em
            FROM sessoes_estudo_questoes
            WHERE user_id = ? AND concurso_id = ?
            ORDER BY id DESC LIMIT 12
            """,
            (user_id, alvo_id),
        )
        sessoes_hist = cur.fetchall()

    # Agrega desempenho por disciplina
    desempenho_disciplinas: List[Dict[str, Any]] = []
    tot_acertos = 0
    tot_erros = 0
    tot_branco = 0
    tot_resp = 0
    tot_niv_ok = 0
    tot_niv_n = 0

    for d in disciplinas:
        d_nome = d["nome"]
        d_resps = [r for r in respostas_30d if r["disciplina"] == d_nome]
        d_nivs = [r for r in respostas_niv if r["disciplina"] == d_nome]

        n_resp = len(d_resps)
        n_ok = sum(1 for r in d_resps if r["correta"] == 1)
        n_branco = sum(1 for r in d_resps if r["em_branco"] == 1)
        n_err = max(0, n_resp - n_ok - n_branco)

        taxa_atual = round((n_ok / n_resp) * 100, 1) if n_resp > 0 else 0.0
        niv_n = len(d_nivs)
        niv_ok = sum(1 for r in d_nivs if r["correta"] == 1)
        taxa_niv = round((niv_ok / niv_n) * 100, 1) if niv_n > 0 else (taxa_atual if n_resp > 0 else 0.0)
        evol_pp = round(taxa_atual - taxa_niv, 1) if n_resp > 0 else 0.0
        escore_liq = round(float(n_ok - n_err), 1) if is_cebraspe else float(n_ok)

        tot_acertos += n_ok
        tot_erros += n_err
        tot_branco += n_branco
        tot_resp += n_resp
        tot_niv_ok += niv_ok
        tot_niv_n += niv_n

        desempenho_disciplinas.append(
            {
                "disciplina": d_nome,
                "nome_curto": d_nome.split("(")[0].split("—")[0].strip(),
                "questoes_edital": int(d.get("questoes") or 10),
                "peso": d.get("peso") or "",
                "peso_num": _parse_peso_num(d.get("peso") or "", int(d.get("questoes") or 10)),
                "prioridade": d.get("prioridade") or "Média",
                "nivelamento_pct": taxa_niv,
                "taxa_atual_pct": taxa_atual,
                "evolucao_pp": evol_pp,
                "meta_pct": meta_aprovacao,
                "escore_liquido": escore_liq,
                "questoes_resolvidas": n_resp,
                "acertos": n_ok,
                "erros": n_err,
                "branco": n_branco,
                "status_badge": _status_badge_disciplina(taxa_atual, n_resp, meta_aprovacao),
            }
        )

    # Inclui respostas em disciplinas extras não mapeadas literalmente na lista principal
    nomes_conhecidos = {d["nome"] for d in disciplinas}
    extras = [r for r in respostas_30d if r["disciplina"] not in nomes_conhecidos]
    tot_resp += len(extras)
    tot_acertos += sum(1 for r in extras if r["correta"] == 1)
    tot_branco += sum(1 for r in extras if r["em_branco"] == 1)
    tot_erros = max(0, tot_resp - tot_acertos - tot_branco)

    taxa_geral_30d = round((tot_acertos / tot_resp) * 100, 1) if tot_resp > 0 else 0.0
    taxa_geral_niv = round((tot_niv_ok / tot_niv_n) * 100, 1) if tot_niv_n > 0 else taxa_geral_30d
    evolucao_geral = round(taxa_geral_30d - taxa_geral_niv, 1) if tot_resp > 0 else 0.0

    if is_cebraspe and tot_resp > 0:
        escore_liquido_proj = round(((tot_acertos - tot_erros) / tot_resp) * 120.0, 1)
    else:
        escore_liquido_proj = taxa_geral_30d

    # Gráficos 2B: Série temporal semanal a partir das sessões reais concluídas
    evolucao_periodo: List[Dict[str, Any]] = []
    sessoes_crono = [s for s in reversed(sessoes_hist) if (s["respondidas"] or 0) > 0]
    if sessoes_crono:
        for idx, s in enumerate(sessoes_crono[-6:]):
            resp_s = s["respondidas"] or 1
            pct_s = round(((s["acertos"] or 0) / resp_s) * 100, 1)
            lbl = "Nivelamento" if s["tipo_sessao"] == "nivelamento" else f"Ciclo {idx + 1}"
            evolucao_periodo.append({"label": lbl, "taxa_pct": pct_s, "meta_pct": meta_aprovacao})
    else:
        evolucao_periodo = [
            {"label": "Início", "taxa_pct": 0.0, "meta_pct": meta_aprovacao},
        ]

    acertos_erros_area = [
        {
            "disciplina": d["nome_curto"],
            "acertos": d["acertos"],
            "erros": d["erros"],
            "total": d["questoes_resolvidas"],
            "taxa_pct": d["taxa_atual_pct"],
        }
        for d in desempenho_disciplinas
    ]

    # Cronograma 2C
    cronograma_blocos: List[Dict[str, Any]] = []
    if user_id is not None:
        horas_pref = float(user_row["horas_estudo_dia"]) if user_row and user_row["horas_estudo_dia"] is not None else 4.0
        garantir_cronograma_usuario(conn, user_id, alvo_id, horas_dia=horas_pref)
        cur.execute(
            """
            SELECT * FROM usuario_cronograma_blocos
            WHERE user_id = ? AND concurso_id = ?
            ORDER BY id ASC
            """,
            (user_id, alvo_id),
        )
        cronograma_blocos = [
            {
                "id": b["id"],
                "dia_semana": b["dia_semana"],
                "ordem": b["ordem"],
                "disciplina": b["disciplina"],
                "disciplina_curta": b["disciplina"].split("(")[0].split("—")[0].strip(),
                "tipo_bloco": b["tipo_bloco"],
                "minutos_planejados": b["minutos_planejados"],
                "minutos_realizados": b["minutos_realizados"],
                "concluido": bool(b["concluido"]),
            }
            for b in cur.fetchall()
        ]

    mins_planejados_tot = sum(b["minutos_planejados"] for b in cronograma_blocos) or 1440
    mins_realizados_tot = sum(
        (b["minutos_planejados"] if b["concluido"] else b["minutos_realizados"])
        for b in cronograma_blocos
    )
    blocos_concluidos = sum(1 for b in cronograma_blocos if b["concluido"])
    proximas_atividades = [b for b in cronograma_blocos if not b["concluido"]][:3]

    def _fmt_hhmm(mins: int) -> str:
        h = mins // 60
        m = mins % 60
        return f"{h}h {m:02d}m" if m else f"{h}h"

    sugestao_theo = calcular_sugestao_theo(desempenho_disciplinas, concurso, meta_aprovacao)

    nivelamentos_lista = [
        {
            "id": s["id"],
            "titulo": s["titulo"] or f"Nivelamento {concurso['sigla']}",
            "data": (s["finalizado_em"] or s["iniciado_em"] or "")[:10],
            "acertos": s["acertos"],
            "total": s["total_questoes"],
            "taxa_pct": round((s["acertos"] / s["total_questoes"]) * 100, 1) if s["total_questoes"] else 0.0,
            "escore_liquido": s["escore_liquido"],
        }
        for s in sessoes_hist
        if s["tipo_sessao"] == "nivelamento"
    ]

    cotas = obter_cotas_plano(conn, user_id, user_row["plano"] if user_row else "Gratuito")

    return {
        "concurso_alvo": concurso,
        "meta_aprovacao": meta_aprovacao,
        "resumo_hero": {
            "taxa_atual_30d": taxa_geral_30d,
            "taxa_nivelamento": taxa_geral_niv,
            "evolucao_pp": evolucao_geral,
            "meta_aprovacao": meta_aprovacao,
            "escore_liquido": escore_liquido_proj,
            "is_cebraspe": is_cebraspe,
            "questoes_30d": tot_resp,
            "acertos_30d": tot_acertos,
            "erros_30d": tot_erros,
            "streak_dias": int(user_row["streak_dias"]) if user_row and user_row["streak_dias"] else 0,
            "horas_semana_feitas": _fmt_hhmm(mins_realizados_tot),
            "horas_semana_meta": _fmt_hhmm(mins_planejados_tot),
            "blocos_concluidos": blocos_concluidos,
            "blocos_totais": len(cronograma_blocos),
        },
        "desempenho_disciplinas": desempenho_disciplinas,
        "graficos_2b": {
            "evolucao_periodo": evolucao_periodo,
            "acertos_erros_area": acertos_erros_area,
        },
        "cronograma_2c": {
            "minutos_planejados": mins_planejados_tot,
            "minutos_realizados": mins_realizados_tot,
            "horas_feitas_label": _fmt_hhmm(mins_realizados_tot),
            "horas_meta_label": _fmt_hhmm(mins_planejados_tot),
            "percentual_semana": round((mins_realizados_tot / mins_planejados_tot) * 100, 1) if mins_planejados_tot else 0.0,
            "blocos": cronograma_blocos,
            "proximas_atividades": proximas_atividades,
        },
        "nivelamento_2d": {
            "taxa_inicial": taxa_geral_niv,
            "taxa_atual": taxa_geral_30d,
            "meta_aprovacao": meta_aprovacao,
            "evolucao_pp": evolucao_geral,
            "radar_eixos": [
                {
                    "label": d["nome_curto"],
                    "inicial": d["nivelamento_pct"],
                    "atual": d["taxa_atual_pct"],
                    "meta": meta_aprovacao,
                }
                for d in desempenho_disciplinas[:5]
            ],
            "historico_nivelamentos": nivelamentos_lista,
        },
        "sugestao_theo": sugestao_theo,
        "cotas_plano": cotas,
        "sessoes_recentes": [
            {
                "id": s["id"],
                "titulo": s["titulo"],
                "tipo_sessao": s["tipo_sessao"],
                "dificuldade_filtro": s["dificuldade_filtro"],
                "total_questoes": s["total_questoes"],
                "respondidas": s["respondidas"],
                "acertos": s["acertos"],
                "erros": s["erros"],
                "escore_liquido": s["escore_liquido"],
                "status": s["status"],
                "data": (s["finalizado_em"] or s["iniciado_em"] or "")[:16],
            }
            for s in sessoes_hist[:6]
        ],
    }
