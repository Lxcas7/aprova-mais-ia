import json
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query

from backend.database.connection import get_db_connection
from backend.models.schemas import IniciarSessaoQuestoesInput, ResponderQuestaoInput
from backend.routes.auth_routes import obter_usuario_autenticado
from backend.services.desempenho_engine import (
    normalize_plano,
    obter_dashboard_estudo,
    verificar_cota_sessao,
)
from backend.services.questapi_client import (
    selecionar_questoes_para_sessao,
    serializar_questao_publica,
)

router = APIRouter(prefix="/api/questoes", tags=["Banco de Questões e Nivelamento"])


@router.post("/sessoes/iniciar")
def iniciar_sessao_questoes(
    payload: IniciarSessaoQuestoesInput,
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
        if not ur:
            conn.close()
            raise HTTPException(status_code=401, detail="Sessão inválida. Faça login novamente.")
        plano = normalize_plano(ur["plano"])

    ok, err_detail = verificar_cota_sessao(conn, uid, plano, payload.tipo_sessao, payload.quantidade)
    if not ok:
        conn.close()
        raise HTTPException(status_code=403, detail=err_detail)

    cur.execute("SELECT * FROM concursos WHERE id = ?", (payload.concurso_id,))
    crow = cur.fetchone()
    if not crow:
        cur.execute("SELECT * FROM concursos WHERE id = 'pf-2026'")
        crow = cur.fetchone()
    concurso_id = crow["id"]
    banca = crow["banca"]
    disciplinas = [d["nome"] for d in json.loads(crow["disciplinas_json"] or "[]")]

    dificuldade = payload.dificuldade if payload.dificuldade in ("facil", "intermediario", "dificil", "sorteado") else "sorteado"
    is_prova = payload.tipo_sessao == "prova_anterior"

    selecionadas = selecionar_questoes_para_sessao(
        conn,
        concurso_id=concurso_id,
        banca=banca,
        disciplina=payload.disciplina or "todas",
        dificuldade=dificuldade,
        quantidade=payload.quantidade,
        is_prova_anterior=is_prova,
        disciplinas_concurso=disciplinas,
        permitir_sync_remoto=True,
    )

    if not selecionadas:
        conn.close()
        raise HTTPException(status_code=404, detail="Nenhuma questão disponível para os filtros selecionados.")

    titulo_map = {
        "nivelamento": f"Simulado de Nivelamento · {crow['sigla']} ({banca})",
        "simulado_theo": f"Simulado Dirigido do Theo · {crow['sigla']}",
        "prova_anterior": payload.prova_titulo or f"Prova Anterior Oficial · {crow['sigla']} ({crow['ultimo_concurso_ano']})",
        "topico_guia": f"Prática do Guia · {payload.disciplina}",
        "caderno_erros": f"Revisão de Erros · {crow['sigla']}",
        "simulado_rapido": f"Bateria Rápida · {crow['sigla']} ({banca})",
    }
    titulo_sessao = titulo_map.get(payload.tipo_sessao, f"Bateria de Questões · {crow['sigla']}")
    q_ids = [r["id"] for r in selecionadas]

    cur.execute(
        """
        INSERT INTO sessoes_estudo_questoes (
            user_id, concurso_id, tipo_sessao, titulo, dificuldade_filtro,
            disciplina_filtro, questoes_ids_json, total_questoes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'em_andamento')
        """,
        (
            uid,
            concurso_id,
            payload.tipo_sessao,
            titulo_sessao,
            dificuldade,
            payload.disciplina or "todas",
            json.dumps(q_ids),
            len(selecionadas),
        ),
    )
    sessao_id = cur.lastrowid
    conn.commit()
    conn.close()

    # Garante estritamente que gabarito/comentário NÃO são enviados ao cliente na abertura
    questoes_publicas = [serializar_questao_publica(r) for r in selecionadas]

    return {
        "sessao": {
            "id": sessao_id,
            "concurso_id": concurso_id,
            "concurso_sigla": crow["sigla"],
            "banca": banca,
            "tipo_sessao": payload.tipo_sessao,
            "titulo": titulo_sessao,
            "dificuldade_filtro": dificuldade,
            "total_questoes": len(questoes_publicas),
            "respondidas": 0,
            "acertos": 0,
            "erros": 0,
            "branco": 0,
            "escore_liquido": 0.0,
            "status": "em_andamento",
        },
        "questoes": questoes_publicas,
    }


@router.post("/sessoes/{sessao_id}/responder")
def responder_questao_sessao(
    sessao_id: int,
    payload: ResponderQuestaoInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM sessoes_estudo_questoes WHERE id = ?", (sessao_id,))
    sessao = cur.fetchone()
    if not sessao:
        conn.close()
        raise HTTPException(status_code=404, detail="Sessão de questões não encontrada.")

    if sessao["user_id"] is not None:
        auth_uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
        if auth_uid != sessao["user_id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Sem permissão para responder a sessão de outro usuário.")

    cur.execute("SELECT * FROM questoes_cache WHERE id = ?", (payload.questao_id,))
    qrow = cur.fetchone()
    if not qrow:
        conn.close()
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    # Evita duplicidade caso o usuário reenvie resposta na mesma sessão
    cur.execute(
        "SELECT id FROM usuario_respostas_questoes WHERE sessao_id = ? AND questao_id = ?",
        (sessao_id, payload.questao_id),
    )
    existing_resp = cur.fetchone()

    gabarito = (qrow["gabarito"] or "").strip().upper()
    resp_user = (payload.resposta_usuario or "").strip().upper()
    em_branco = bool(payload.em_branco) or not resp_user
    correta = (not em_branco) and (resp_user == gabarito)

    if existing_resp:
        cur.execute(
            """
            UPDATE usuario_respostas_questoes
            SET resposta_usuario = ?, correta = ?, em_branco = ?, tempo_segundos = ?, respondido_em = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            ("" if em_branco else resp_user, 1 if correta else 0, 1 if em_branco else 0, payload.tempo_segundos, existing_resp["id"]),
        )
    else:
        cur.execute(
            """
            INSERT INTO usuario_respostas_questoes (
                sessao_id, user_id, questao_id, concurso_id, disciplina, banca,
                dificuldade, resposta_usuario, correta, em_branco, tempo_segundos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                sessao_id,
                sessao["user_id"],
                qrow["id"],
                sessao["concurso_id"],
                qrow["disciplina"],
                qrow["banca"],
                qrow["dificuldade"],
                "" if em_branco else resp_user,
                1 if correta else 0,
                1 if em_branco else 0,
                payload.tempo_segundos,
            ),
        )

    # Recalcula totais da sessão diretamente do banco
    cur.execute(
        """
        SELECT
            COUNT(*) as respondidas,
            COALESCE(SUM(CASE WHEN correta = 1 THEN 1 ELSE 0 END), 0) as acertos,
            COALESCE(SUM(CASE WHEN em_branco = 1 THEN 1 ELSE 0 END), 0) as branco,
            COALESCE(SUM(CASE WHEN correta = 0 AND em_branco = 0 THEN 1 ELSE 0 END), 0) as erros
        FROM usuario_respostas_questoes
        WHERE sessao_id = ?
        """,
        (sessao_id,),
    )
    ag = cur.fetchone()
    respondidas = int(ag["respondidas"])
    acertos = int(ag["acertos"])
    branco = int(ag["branco"])
    erros = int(ag["erros"])
    is_cebraspe = "cebraspe" in (qrow["banca"] or "").lower()
    escore_liquido = float(acertos - erros) if is_cebraspe else float(acertos)

    cur.execute(
        """
        UPDATE sessoes_estudo_questoes
        SET respondidas = ?, acertos = ?, erros = ?, branco = ?, escore_liquido = ?
        WHERE id = ?
        """,
        (respondidas, acertos, erros, branco, escore_liquido, sessao_id),
    )

    if sessao["user_id"] is not None:
        cur.execute(
            "UPDATE usuarios SET ultimo_estudo_em = CURRENT_TIMESTAMP WHERE id = ?",
            (sessao["user_id"],),
        )

    conn.commit()
    conn.close()

    return {
        "questao_id": qrow["id"],
        "correta": correta,
        "em_branco": em_branco,
        "gabarito": gabarito,
        "comentario": qrow["comentario"] or "Gabarito oficial conferido no servidor.",
        "sessao": {
            "id": sessao_id,
            "respondidas": respondidas,
            "total_questoes": sessao["total_questoes"],
            "acertos": acertos,
            "erros": erros,
            "branco": branco,
            "escore_liquido": escore_liquido,
        },
    }


@router.post("/sessoes/{sessao_id}/finalizar")
def finalizar_sessao_questoes(
    sessao_id: int,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM sessoes_estudo_questoes WHERE id = ?", (sessao_id,))
    sessao = cur.fetchone()
    if not sessao:
        conn.close()
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    if sessao["user_id"] is not None:
        auth_uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
        if auth_uid != sessao["user_id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Sem permissão para finalizar sessão de outro usuário.")

    cur.execute(
        "UPDATE sessoes_estudo_questoes SET status = 'concluida', finalizado_em = CURRENT_TIMESTAMP WHERE id = ?",
        (sessao_id,),
    )
    if sessao["user_id"] is not None and sessao["status"] != "concluida":
        cur.execute(
            "UPDATE usuarios SET streak_dias = COALESCE(streak_dias, 0) + 1, ultimo_estudo_em = CURRENT_TIMESTAMP WHERE id = ?",
            (sessao["user_id"],),
        )
    conn.commit()
    cur.execute("SELECT * FROM sessoes_estudo_questoes WHERE id = ?", (sessao_id,))
    final_row = dict(cur.fetchone())
    conn.close()

    return {
        "sucesso": True,
        "sessao": final_row,
        "mensagem": "Sessão concluída! Seus gráficos e metas semanais foram recalculados automaticamente.",
    }


@router.get("/sugestao-theo")
def obter_sugestao_theo_endpoint(
    concurso_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    dash = obter_dashboard_estudo(conn, uid, concurso_id_override=concurso_id)
    conn.close()
    return dash["sugestao_theo"]


@router.get("/provas-anteriores")
def listar_provas_anteriores(concurso_id: Optional[str] = Query(None)):
    conn = get_db_connection()
    cur = conn.cursor()
    sql = "SELECT id, sigla, titulo, orgao, banca, area, status, ultimo_concurso_ano, nota_corte_anterior FROM concursos"
    params = []
    if concurso_id and concurso_id != "todos":
        sql += " WHERE id = ?"
        params.append(concurso_id)
    sql += " ORDER BY CASE WHEN status='aberto' THEN 0 WHEN status='previsto' THEN 1 ELSE 2 END, sigla ASC"
    cur.execute(sql, params)
    concursos_rows = cur.fetchall()

    provas = []
    for c in concursos_rows:
        cur.execute(
            "SELECT COUNT(*) as total FROM questoes_cache WHERE concurso_id = ? AND is_prova_anterior = 1",
            (c["id"],),
        )
        qtd_banco = int(cur.fetchone()["total"])
        provas.append(
            {
                "concurso_id": c["id"],
                "sigla": c["sigla"],
                "titulo": f"Prova Oficial {c['sigla']} · {c['ultimo_concurso_ano']}",
                "orgao": c["orgao"],
                "banca": c["banca"],
                "area": c["area"],
                "ano_label": c["ultimo_concurso_ano"],
                "nota_corte_anterior": c["nota_corte_anterior"],
                "questoes_disponiveis": max(qtd_banco, 5),
            }
        )
    conn.close()
    return {"provas": provas}
