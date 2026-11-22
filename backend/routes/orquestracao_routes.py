import json
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query

from backend.database.connection import get_db_connection
from backend.models.schemas import (
    ConcursoAlvoInput,
    OnboardingInput,
    SuporteChamadoInput,
    SuporteTheoInput,
    format_ufs_storage,
    parse_ufs_list,
)
from backend.routes.auth_routes import _formatar_usuario, obter_usuario_autenticado
from backend.services.desempenho_engine import (
    garantir_cronograma_usuario,
    normalize_plano,
    obter_dashboard_estudo,
)

router = APIRouter(tags=["Orquestração de Estudo e Suporte Theo"])


@router.get("/api/estudo/onboarding")
def obter_onboarding(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (uid,))
    urow = cur.fetchone()
    if not urow:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    cur.execute("SELECT * FROM usuario_onboarding WHERE user_id = ?", (uid,))
    ob = cur.fetchone()
    conn.close()

    if not ob:
        return {
            "concluido": bool(urow["onboarding_concluido"]),
            "dados": {
                "momento_jornada": "estudando_edital",
                "concurso_alvo_id": urow["concurso_alvo_id"] or "pf-2026",
                "areas_interesse": [urow["carreira_foco"] or "Policial"],
                "ufs_interesse": parse_ufs_list(urow["uf_interesse"]),
                "horas_dia": float(urow["horas_estudo_dia"] if urow["horas_estudo_dia"] is not None else 4.0),
                "dias_semana": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
                "nivel_base": {},
                "estilo_estudo": "equilibrado",
            },
        }

    return {
        "concluido": bool(urow["onboarding_concluido"]),
        "dados": {
            "momento_jornada": ob["momento_jornada"],
            "concurso_alvo_id": ob["concurso_alvo_id"],
            "areas_interesse": json.loads(ob["areas_interesse_json"] or "[]"),
            "ufs_interesse": parse_ufs_list(urow["uf_interesse"]),
            "horas_dia": float(ob["horas_dia"] if ob["horas_dia"] is not None else 4.0),
            "dias_semana": json.loads(ob["dias_semana_json"] or "[]"),
            "nivel_base": json.loads(ob["nivel_base_json"] or "{}"),
            "estilo_estudo": ob["estilo_estudo"],
            "atualizado_em": ob["atualizado_em"],
        },
    }


@router.put("/api/estudo/onboarding")
def salvar_onboarding(
    payload: OnboardingInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (uid,))
    urow = cur.fetchone()
    if not urow:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    cur.execute("SELECT id, area FROM concursos WHERE id = ?", (payload.concurso_alvo_id,))
    conc_row = cur.fetchone()
    alvo_id = conc_row["id"] if conc_row else "pf-2026"
    carreira_nova = conc_row["area"] if conc_row else (payload.areas_interesse[0] if payload.areas_interesse else urow["carreira_foco"])

    horas_val = round(float(payload.horas_dia), 2)
    uf_str = format_ufs_storage(payload.ufs_interesse) if payload.ufs_interesse else format_ufs_storage(urow["uf_interesse"])

    cur.execute(
        """
        INSERT INTO usuario_onboarding (
            user_id, momento_jornada, concurso_alvo_id, areas_interesse_json,
            horas_dia, dias_semana_json, nivel_base_json, estilo_estudo,
            concluido_em, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            momento_jornada = excluded.momento_jornada,
            concurso_alvo_id = excluded.concurso_alvo_id,
            areas_interesse_json = excluded.areas_interesse_json,
            horas_dia = excluded.horas_dia,
            dias_semana_json = excluded.dias_semana_json,
            nivel_base_json = excluded.nivel_base_json,
            estilo_estudo = excluded.estilo_estudo,
            atualizado_em = CURRENT_TIMESTAMP
        """,
        (
            uid,
            payload.momento_jornada,
            alvo_id,
            json.dumps(payload.areas_interesse, ensure_ascii=False),
            horas_val,
            json.dumps(payload.dias_semana, ensure_ascii=False),
            json.dumps(payload.nivel_base, ensure_ascii=False),
            payload.estilo_estudo,
        ),
    )

    cur.execute(
        """
        UPDATE usuarios
        SET concurso_alvo_id = ?, horas_estudo_dia = ?, carreira_foco = ?, uf_interesse = ?, onboarding_concluido = 1
        WHERE id = ?
        """,
        (alvo_id, horas_val, carreira_nova, uf_str, uid),
    )
    cur.execute(
        "INSERT OR IGNORE INTO usuario_concursos_salvos (user_id, concurso_id) VALUES (?, ?)",
        (uid, alvo_id),
    )
    conn.commit()

    garantir_cronograma_usuario(
        conn,
        uid,
        alvo_id,
        horas_dia=horas_val,
        dias_semana=payload.dias_semana,
        reset=True,
    )

    cur.execute("SELECT * FROM usuarios WHERE id = ?", (uid,))
    updated_user = cur.fetchone()
    conn.close()

    return {
        "sucesso": True,
        "mensagem": "Plano inicial calibrado com sucesso para o seu edital!",
        "usuario": _formatar_usuario(updated_user),
    }


@router.delete("/api/estudo/onboarding")
def apagar_onboarding(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM usuario_onboarding WHERE user_id = ?", (uid,))
    cur.execute("UPDATE usuarios SET onboarding_concluido = 0 WHERE id = ?", (uid,))
    conn.commit()
    cur.execute("SELECT * FROM usuarios WHERE id = ?", (uid,))
    updated_user = cur.fetchone()
    conn.close()
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {
        "sucesso": True,
        "mensagem": "Respostas de preferências iniciais apagadas da sua conta.",
        "usuario": _formatar_usuario(updated_user),
    }


@router.get("/api/estudo/dashboard")
def obter_dashboard(
    concurso_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    data = obter_dashboard_estudo(conn, uid, concurso_id_override=concurso_id)
    conn.close()
    return data


@router.post("/api/estudo/concurso-alvo")
def definir_concurso_alvo(
    payload: ConcursoAlvoInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, sigla, area FROM concursos WHERE id = ?", (payload.concurso_id,))
    conc = cur.fetchone()
    if not conc:
        conn.close()
        raise HTTPException(status_code=404, detail="Concurso não encontrado.")

    cur.execute("SELECT horas_estudo_dia FROM usuarios WHERE id = ?", (uid,))
    urow = cur.fetchone()
    if not urow:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    cur.execute(
        "UPDATE usuarios SET concurso_alvo_id = ?, carreira_foco = ? WHERE id = ?",
        (conc["id"], conc["area"], uid),
    )
    cur.execute(
        "INSERT OR IGNORE INTO usuario_concursos_salvos (user_id, concurso_id) VALUES (?, ?)",
        (uid, conc["id"]),
    )
    conn.commit()
    garantir_cronograma_usuario(conn, uid, conc["id"], horas_dia=float(urow["horas_estudo_dia"] if urow["horas_estudo_dia"] is not None else 4.0))

    cur.execute("SELECT * FROM usuarios WHERE id = ?", (uid,))
    updated_user = cur.fetchone()
    conn.close()
    return {
        "sucesso": True,
        "mensagem": f"Concurso-alvo alterado para {conc['sigla']}. Seu painel e cronograma foram recalibrados.",
        "usuario": _formatar_usuario(updated_user),
    }


@router.post("/api/estudo/cronograma/bloco/{bloco_id}/toggle")
def alternar_bloco_cronograma(
    bloco_id: int,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=True)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM usuario_cronograma_blocos WHERE id = ?", (bloco_id,))
    bloco = cur.fetchone()
    if not bloco:
        conn.close()
        raise HTTPException(status_code=404, detail="Bloco do cronograma não encontrado.")
    if bloco["user_id"] != uid:
        conn.close()
        raise HTTPException(status_code=403, detail="Sem permissão para alterar o cronograma de outro usuário.")

    novo_concluido = 0 if bloco["concluido"] else 1
    novos_min = bloco["minutos_planejados"] if novo_concluido else 0
    cur.execute(
        "UPDATE usuario_cronograma_blocos SET concluido = ?, minutos_realizados = ? WHERE id = ?",
        (novo_concluido, novos_min, bloco_id),
    )
    conn.commit()
    conn.close()
    return {
        "id": bloco_id,
        "concluido": bool(novo_concluido),
        "minutos_realizados": novos_min,
    }


@router.post("/api/suporte/theo")
def responder_theo_suporte(
    payload: SuporteTheoInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()

    user_ctx = None
    alvo_sigla = "seu edital"
    if uid is not None:
        cur.execute("SELECT id, nome, email, plano, concurso_alvo_id FROM usuarios WHERE id = ?", (uid,))
        urow = cur.fetchone()
        if urow:
            user_ctx = dict(urow)
            user_ctx["plano"] = normalize_plano(user_ctx.get("plano"))
            cur.execute("SELECT sigla FROM concursos WHERE id = ?", (user_ctx.get("concurso_alvo_id") or "pf-2026",))
            cr = cur.fetchone()
            if cr:
                alvo_sigla = cr["sigla"]
    conn.close()

    msg = payload.mensagem.strip().lower()
    saudacao = f"{user_ctx['nome'].split()[0]}, " if user_ctx else ""

    if any(k in msg for k in ("pdf", "baixar", "download", "imprimir")):
        plano_txt = user_ctx["plano"] if user_ctx else "Gratuito"
        resposta = (
            f"{saudacao}seu plano atual é <strong>{plano_txt}</strong>. "
            "A leitura na tela está disponível conforme a cota do seu plano e a exportação em <strong>PDF A4</strong> "
            "é liberada imediatamente nos planos <strong>Pro</strong> e <strong>Pro+</strong> pela aba <strong>Guias &amp; Caderno</strong>."
        )
    elif any(k in msg for k in ("nivelamento", "simulado", "quest", "banco")):
        resposta = (
            f"{saudacao}cada questão resolvida na aba <strong>Nivelamento &amp; IA</strong> corrige seu desempenho automaticamente "
            f"e atualiza o painel de <strong>{alvo_sigla}</strong> em tempo real. "
            "No plano <strong>Gratuito</strong> você conta com 1 simulado de nivelamento completo em qualquer banca; "
            "no <strong>Básico</strong> libera 50 questões/dia e 1 prova anterior por semana; e no <strong>Pro</strong> tudo é ilimitado."
        )
    elif any(k in msg for k in ("plano", "assinatura", "preço", "preco", "upgrade", "mensal", "anual")):
        resposta = (
            f"{saudacao}temos 4 opções na aba <strong>Planos</strong>: <strong>Gratuito</strong> (R$ 0), "
            "<strong>Básico</strong> (R$ 19,90/mês), <strong>Pro</strong> (R$ 37,90/mês, com PDF A4 e Simulados do Theo ilimitados) "
            "e <strong>Pro+</strong> (R$ 67,90/mês, com discursivas e alertas VIP). No plano anual você economiza 24%."
        )
    elif any(k in msg for k in ("atendente", "humano", "chamado", "falar", "erro", "problema")):
        resposta = (
            f"{saudacao}se preferir atendimento humano, clique no botão <strong>Falar com um Atendente Humano →</strong> "
            "logo abaixo neste painel — seus dados de conta já são vinculados automaticamente ao chamado."
        )
    else:
        plano_txt = f" no plano <strong>{user_ctx['plano']}</strong>" if user_ctx else ""
        resposta = (
            f"Oi {saudacao}! Estou acompanhando sua preparação para <strong>{alvo_sigla}</strong>{plano_txt}. "
            "Posso te ajudar com <strong>dúvidas de estudo</strong>, <strong>regras de planos</strong>, <strong>exportação em PDF A4</strong> "
            "ou encaminhar seu atendimento para um especialista humano."
        )

    return {
        "sucesso": True,
        "atendente": "Theo · Central de Ajuda A+",
        "usuario_reconhecido": (
            {
                "nome": user_ctx["nome"],
                "plano": user_ctx["plano"],
                "concurso_alvo_sigla": alvo_sigla,
            }
            if user_ctx
            else None
        ),
        "resposta_html": resposta,
    }


@router.post("/api/suporte/chamado")
def abrir_chamado_suporte(
    payload: SuporteChamadoInput,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    uid = obter_usuario_autenticado(authorization, x_user_id, exigir_token=False)
    conn = get_db_connection()
    cur = conn.cursor()

    nome = (payload.nome or "").strip() or "Visitante"
    email = (payload.email or "").strip() or "nao-informado@aprovamais.com.br"
    plano = "Gratuito"
    concurso_alvo = "pf-2026"

    if uid is not None:
        cur.execute("SELECT nome, email, plano, concurso_alvo_id FROM usuarios WHERE id = ?", (uid,))
        ur = cur.fetchone()
        if ur:
            nome = ur["nome"]
            email = ur["email"]
            plano = normalize_plano(ur["plano"])
            concurso_alvo = ur["concurso_alvo_id"] or "pf-2026"

    cur.execute(
        """
        INSERT INTO suporte_chamados (user_id, nome, email, plano, concurso_alvo_id, categoria, mensagem)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (uid, nome, email, plano, concurso_alvo, payload.categoria, payload.mensagem.strip()),
    )
    chamado_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        "sucesso": True,
        "chamado_id": chamado_id,
        "protocolo": f"AP-{chamado_id:05d}",
        "mensagem": f"Protocolo AP-{chamado_id:05d} aberto para {nome}. Nossa equipe responderá por e-mail em breve.",
    }
