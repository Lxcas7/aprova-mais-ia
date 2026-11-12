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
            status_badge = "🟢 ATIVO COM EDITAL ABERTO" if c["status"] == "aberto" else (
                f"🟡 PREVISTO PELA IA ({c['prob_label']})" if c["status"] == "previsto" else "🔵 JÁ ACONTECEU (HISTÓRICO)"
            )
            resposta = (
                f"📌 <strong>Raio-X IA — {c['titulo']}</strong><br>"
                f"• <strong>Status:</strong> {status_badge}<br>"
                f"• <strong>Banca:</strong> {c['banca']} | <strong>Vagas:</strong> {c['vagas']}<br>"
                f"• <strong>Remuneração:</strong> {c['salario']} | <strong>Escolaridade:</strong> {c['escolaridade']}<br>"
                f"• <strong>Prazo / Prova:</strong> {c['prazo']} ({c['data_prova']})<br>"
                f"• <strong>Último Concurso / Corte:</strong> {c['ultimo_concurso_ano']} — {c['nota_corte_anterior']}<br><br>"
                f"🤖 <strong>Análise da IA:</strong> {c['resumo_ia']}<br><br>"
                f"📚 <strong>Matérias Prioritárias para Estudar:</strong> {top_disc}.<br>"
                f"Clique no card do concurso <strong>{c['sigla']}</strong> para baixar o Edital Verticalizado e as apostilas específicas!"
            )
            return {"resposta": resposta, "concurso_sugerido": c["id"]}

    if any(k in q for k in ["médio", "medio", "ensino médio"]):
        medios = [c for c in rows if "Médio" in c["escolaridade"]]
        lista = "<br>".join([
            f"• <strong>[{c['status'].upper()}] {c['titulo']}</strong> — Salário: {c['salario']} ({c['vagas']}, Banca {c['banca']})"
            for c in medios
        ])
        return {
            "resposta": (
                f"🎓 Encontrei <strong>{len(medios)} concursos que aceitam Nível Médio</strong> (entre abertos, previstos e históricos):<br><br>"
                f"{lista}<br><br>"
                f"💡 <strong>Dica da IA:</strong> Se quer edital aberto imediato, foque na <strong>Caixa Econômica</strong> ou <strong>Correios</strong>. "
                f"Se quer estudar antecipado no pré-edital, foque no <strong>Banco do Brasil (92% iminente)</strong> ou <strong>INSS (88% quente)</strong>!"
            ),
            "concurso_sugerido": "caixa-2026"
        }

    if any(k in q for k in ["previsto", "internet", "rumor", "boato", "vai abrir", "autorizado"]):
        lista = "<br>".join([
            f"• 🔥 <strong>{c['sigla']} ({c['prob_ia']}% IA):</strong> {c['titulo']} — <em>{c['resumo_ia'][:135]}...</em>"
            for c in previstos
        ])
        return {
            "resposta": (
                f"📡 <strong>Radar IA — O que estão falando na internet sobre próximos concursos:</strong><br><br>"
                f"{lista}<br><br>"
                f"Todos esses concursos já possuem pacote de <strong>Materiais Pré-Edital</strong> liberado na aba <em>Materiais por Concurso</em>!"
            ),
            "concurso_sugerido": "bb-previsto"
        }

    if any(k in q for k in ["ativo", "aberto", "edital aberto", "inscrição", "inscricao"]):
        lista = "<br>".join([
            f"• 🟢 <strong>{c['titulo']}</strong> — {c['vagas']} | {c['salario']} | {c['prazo']}"
            for c in abertos
        ])
        return {
            "resposta": (
                f"🟢 Atualmente monitoramos <strong>{len(abertos)} grandes concursos ATIVOS com edital aberto</strong>:<br><br>"
                f"{lista}<br><br>"
                f"Use o filtro <strong>🟢 Ativos / Com Edital</strong> para acessar o Raio-X e baixar o edital verticalizado de cada um."
            ),
            "concurso_sugerido": "pf-2026"
        }

    if any(k in q for k in ["passado", "aconteceu", "aconteceram", "encerrado", "histórico", "historico", "prova anterior"]):
        lista = "<br>".join([
            f"• 🔵 <strong>{c['titulo']}</strong> — Banca {c['banca']} | Corte anterior: {c['nota_corte_anterior']}"
            for c in encerrados
        ])
        return {
            "resposta": (
                f"🔵 <strong>Concursos que já aconteceram (Histórico + Provas Reais):</strong><br><br>"
                f"{lista}<br><br>"
                f"Estudar pelas provas que já aconteceram é o melhor termômetro para o próximo edital!"
            ),
            "concurso_sugerido": "cnu-historico"
        }

    return {
        "resposta": (
            f"🤖 Posso cruzar todos os dados da plataforma para você! Hoje monitoramos:<br>"
            f"• <strong>{len(abertos)} Concursos Ativos com Edital Aberto</strong> (PF, Caixa, TSE, Correios, IBAMA)<br>"
            f"• <strong>{len(previstos)} Concursos Previstos pelo que falam na Internet</strong> (Banco do Brasil 92%, INSS 88%, PRF 79%, Receita Federal 71%)<br>"
            f"• <strong>{len(encerrados)} Concursos que Já Aconteceram com Provas Passadas</strong> (CNU, TJ-SP, BACEN, CGU)<br><br>"
            f"Pergunte pelo nome de qualquer órgão (ex.: <em>'Polícia Federal'</em>, <em>'INSS'</em>, <em>'Caixa'</em>) ou use o <strong>Simulador de Match IA</strong> ao lado!"
        ),
        "concurso_sugerido": None
    }


def calcular_match_perfil(escolaridade: str, area: str, horas_dia: int, foco_status: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM concursos")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

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
            motivos.append(f"Foco exato na carreira {c['area']}")
        elif area == "todas":
            score += 8

        if foco_status != "todos" and c["status"] == foco_status:
            score += 12
            motivos.append(f"Status desejado ({c['status_label']})")

        if horas_dia <= 2 and c["id"] in ("correios-2026", "caixa-2026", "tjsp-historico", "bb-previsto"):
            score += 10
            motivos.append("Edital enxuto ideal para quem tem poucas horas por dia")
        elif horas_dia >= 4 and c["salario_max"] >= 10000:
            score += 10
            motivos.append("Carga horária compatível com concursos de alta remuneração (> R$ 10 mil)")

        score = min(score, 99)
        disciplinas = json.loads(c["disciplinas_json"])
        horas_semanais = horas_dia * 6
        plano_semanal = []
        for idx, d in enumerate(disciplinas):
            fatia = round(horas_semanais * (0.30 if idx == 0 else (0.25 if idx == 1 else 0.15)), 1)
            plano_semanal.append({
                "disciplina": d["nome"],
                "prioridade": d["prioridade"],
                "peso": d["peso"],
                "horas_semana": f"{fatia}h/semana"
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
            "horas_por_dia": horas_dia,
            "horas_semanais_uteis": horas_dia * 6
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
        f"Classificação automática Aprova+ IA ({confianca}% de maturidade): Notícia referente a {orgao_sigla.upper()} "
        f"enquadrada no estágio '{estagio}' com base na fonte '{fonte_portal}'. Recomendado iniciar estudo das disciplinas básicas."
    )
    return {"estagio_maturidade": estagio, "confianca_ia": confianca, "analise_ia": analise}

