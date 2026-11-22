import json
from typing import Dict, Any, List
from backend.database.connection import get_db_connection


def responder_chat(mensagem: str) -> Dict[str, Any]:
    q = mensagem.lower().strip()
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM concursos")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    abertos = [c for c in rows if c["status"] == "aberto"]
    previstos = [c for c in rows if c["status"] == "previsto"]
    encerrados = [c for c in rows if c["status"] == "encerrado"]

    # Check if user asked about a specific exam by sigla or name
    for c in rows:
        if c["sigla"].lower() in q.split() or c["id"].split("-")[0] in q or c["titulo"].split("—")[0].strip().lower() in q:
            disciplinas = json.loads(c["disciplinas_json"])
            top_disc = ", ".join([f"<strong>{d['nome']}</strong> ({d['peso']})" for d in disciplinas[:3]])
            status_badge = "ATIVO COM EDITAL ABERTO" if c["status"] == "aberto" else (
                f"PREVISTO PELA IA ({c['prob_label']})" if c["status"] == "previsto" else "JÁ ACONTECEU (HISTÓRICO)"
            )
            resposta = (
                f"<strong>Raio-X Técnico · {c['titulo']}</strong><br>"
                f"• <strong>Status:</strong> {status_badge}<br>"
                f"• <strong>Banca:</strong> {c['banca']} | <strong>Vagas:</strong> {c['vagas']}<br>"
                f"• <strong>Remuneração:</strong> {c['salario']} | <strong>Escolaridade:</strong> {c['escolaridade']}<br>"
                f"• <strong>Prazo / Prova:</strong> {c['prazo']} ({c['data_prova']})<br>"
                f"• <strong>Último Concurso / Corte:</strong> {c['ultimo_concurso_ano']} · {c['nota_corte_anterior']}<br><br>"
                f"<strong>Parecer Técnico IA:</strong> {c['resumo_ia']}<br><br>"
                f"<strong>Disciplinas Prioritárias:</strong> {top_disc}.<br>"
                f"Abra o dossiê do concurso <strong>{c['sigla']}</strong> para baixar o Edital Verticalizado e as apostilas específicas."
            )
            return {"resposta": resposta, "concurso_sugerido": c["id"]}

    if any(k in q for k in ["médio", "medio", "ensino médio"]):
        medios = [c for c in rows if "Médio" in c["escolaridade"]]
        lista = "<br>".join([
            f"• <strong>[{c['status'].upper()}] {c['titulo']}</strong> · Salário: {c['salario']} ({c['vagas']}, Banca {c['banca']})"
            for c in medios
        ])
        return {
            "resposta": (
                f"<strong>Concursos que aceitam Ensino Médio ({len(medios)} mapeados entre abertos, previstos e históricos):</strong><br><br>"
                f"{lista}<br><br>"
                f"<strong>Recomendação Técnica:</strong> Para edital aberto imediato, priorize <strong>Caixa Econômica</strong> ou <strong>Correios</strong>. "
                f"Para estudo antecipado de pré-edital, priorize <strong>Banco do Brasil (92% iminente)</strong> ou <strong>INSS (88% quente)</strong>."
            ),
            "concurso_sugerido": "caixa-2026"
        }

    if any(k in q for k in ["previsto", "internet", "rumor", "boato", "vai abrir", "autorizado"]):
        lista = "<br>".join([
            f"• <strong>{c['sigla']} ({c['prob_ia']}% IA):</strong> {c['titulo']} · <em>{c['resumo_ia'][:135]}...</em>"
            for c in previstos
        ])
        return {
            "resposta": (
                f"<strong>Radar IA · Movimentações monitoradas na internet sobre próximos concursos:</strong><br><br>"
                f"{lista}<br><br>"
                f"Todos esses certames já contam com pacote de <strong>Materiais Pré-Edital</strong> liberado na aba <em>Materiais por Concurso</em>."
            ),
            "concurso_sugerido": "bb-previsto"
        }

    if any(k in q for k in ["ativo", "aberto", "edital aberto", "inscrição", "inscricao"]):
        lista = "<br>".join([
            f"• <strong>{c['titulo']}</strong> · {c['vagas']} | {c['salario']} | {c['prazo']}"
            for c in abertos
        ])
        return {
            "resposta": (
                f"Atualmente monitoramos <strong>{len(abertos)} concursos ATIVOS com edital aberto</strong>:<br><br>"
                f"{lista}<br><br>"
                f"Utilize o filtro <strong>Ativos / Com Edital</strong> para consultar o Raio-X e baixar o edital verticalizado de cada certame."
            ),
            "concurso_sugerido": "pf-2026"
        }

    if any(k in q for k in ["passado", "aconteceu", "aconteceram", "encerrado", "histórico", "historico", "prova anterior"]):
        lista = "<br>".join([
            f"• <strong>{c['titulo']}</strong> · Banca {c['banca']} | Corte anterior: {c['nota_corte_anterior']}"
            for c in encerrados
        ])
        return {
            "resposta": (
                f"<strong>Concursos realizados (Acervo Histórico + Provas Reais):</strong><br><br>"
                f"{lista}<br><br>"
                f"Resolver as provas anteriores comentadas é a referência mais fiel para calibrar seu desempenho na banca."
            ),
            "concurso_sugerido": "cnu-historico"
        }

    return {
        "resposta": (
            f"<strong>Síntese Operacional Aprova+ IA:</strong> Hoje monitoramos:<br>"
            f"• <strong>{len(abertos)} Concursos Ativos com Edital Aberto</strong> (PF, Caixa, TSE, Correios, IBAMA)<br>"
            f"• <strong>{len(previstos)} Concursos Previstos na Internet</strong> (Banco do Brasil 92%, INSS 88%, PRF 79%, Receita Federal 71%)<br>"
            f"• <strong>{len(encerrados)} Concursos Históricos com Provas Passadas</strong> (CNU, TJ-SP, BACEN, CGU)<br><br>"
            f"Informe a sigla ou o nome de qualquer órgão (ex.: <em>Polícia Federal</em>, <em>INSS</em>, <em>Caixa</em>) ou utilize o <strong>Simulador de Compatibilidade</strong> ao lado."
        ),
        "concurso_sugerido": None
    }


def calcular_match_perfil(
    escolaridade: str,
    area: str,
    horas_dia: float,
    foco_status: str,
    dias_semana: int = 6,
) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM concursos")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    dias_validos = max(1, min(7, int(dias_semana or 6)))
    horas_dia_validas = max(0.5, min(16.0, float(horas_dia or 4.0)))
    horas_semanais = round(horas_dia_validas * dias_validos, 1)

    recomendados = []
    for c in rows:
        score = 60
        motivos = []

        if escolaridade == "Médio" and "Médio" not in c["escolaridade"]:
            continue
        if escolaridade in c["escolaridade"]:
            score += 15
            motivos.append(f"Compatível com escolaridade ({c['escolaridade']})")

        if area != "todas" and c["area"].lower() == area.lower():
            score += 20
            motivos.append(f"Foco direto na carreira {c['area']}")
        elif area == "todas":
            score += 8

        if foco_status != "todos" and c["status"] == foco_status:
            score += 12
            motivos.append(f"Horizonte desejado ({c['status_label']})")

        if horas_dia_validas <= 2 and c["id"] in ("correios-2026", "caixa-2026", "tjsp-historico", "bb-previsto"):
            score += 10
            motivos.append("Edital enxuto adequado para rotina compacta")
        elif horas_dia_validas >= 4 and c["salario_max"] >= 10000:
            score += 10
            motivos.append("Carga horária compatível com edital de alta remuneração (> R$ 10 mil)")

        score = min(score, 99)
        disciplinas = json.loads(c["disciplinas_json"])
        total_questoes = sum(max(int(d.get("questoes", 1)), 1) for d in disciplinas) or 1
        plano_semanal = []
        acumulado = 0.0
        for idx, d in enumerate(disciplinas):
            if idx == len(disciplinas) - 1:
                fatia = round(max(0.0, horas_semanais - acumulado), 1)
            else:
                q_val = max(int(d.get("questoes", 1)), 1)
                fatia = round(horas_semanais * (q_val / total_questoes), 1)
                acumulado += fatia
            plano_semanal.append({
                "disciplina": d["nome"],
                "prioridade": d["prioridade"],
                "peso": d["peso"],
                "horas_semanais": fatia,
                "horas_semana": f"{fatia}h/sem"
            })

        recomendados.append({
            "id": c["id"],
            "sigla": c["sigla"],
            "titulo": c["titulo"],
            "status": c["status"],
            "status_label": c["status_label"],
            "banca": c["banca"],
            "salario": c["salario"],
            "vagas": c["vagas"],
            "match_score": score,
            "motivos": motivos,
            "plano_semanal": plano_semanal
        })

    recomendados.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "perfil_analisado": {
            "escolaridade": escolaridade,
            "area": area,
            "horas_por_dia": horas_dia_validas,
            "dias_por_semana": dias_validos,
            "horas_semanais_uteis": horas_semanais
        },
        "top_recomendacoes": recomendados[:4]
    }


def analisar_novo_rumor(orgao_sigla: str, titulo_noticia: str, fonte_portal: str) -> Dict[str, Any]:
    texto = (titulo_noticia + " " + fonte_portal).lower()
    if any(k in texto for k in ["banca", "dispensa", "contrato", "cesgranrio", "cebraspe", "fgv", "vunesp"]):
        estagio = "Banca em Definição / Contratação"
        confianca = 89
    elif any(k in texto for k in ["comissão", "comissao", "portaria", "autorizado", "autorização", "dou"]):
        estagio = "Comissão Formada / Autorizado"
        confianca = 82
    elif any(k in texto for k in ["pedido", "mgi", "solicita", "vagas", "ofício", "oficio"]):
        estagio = "Solicitação Enviada ao Ministério"
        confianca = 72
    else:
        estagio = "Rumor Inicial na Comunidade (Em Verificação)"
        confianca = 58

    analise = (
        f"Análise de maturidade pré-edital ({confianca}%): movimentação de {orgao_sigla.upper()} "
        f"classificada no estágio '{estagio}' com base na fonte '{fonte_portal}'. Recomendado iniciar estudo das disciplinas nucleares."
    )
    return {"estagio_maturidade": estagio, "confianca_ia": confianca, "analise_ia": analise}
