from fastapi import APIRouter
from backend.database.connection import get_db_connection
from backend.models.schemas import LeadPremiumInput, EventoTelemetriaInput

router = APIRouter(prefix="/api/mvp", tags=["Métricas de Validação do MVP & Smoke Test"])


@router.get("/dashboard")
def obter_dashboard_mvp():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT tipo_evento, COUNT(*) as qtd FROM metricas_mvp GROUP BY tipo_evento")
    contagens = {r["tipo_evento"]: r["qtd"] for r in cur.fetchall()}

    cur.execute("SELECT * FROM leads_premium ORDER BY id DESC")
    leads = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT recurso_favorito, COUNT(*) as qtd FROM leads_premium GROUP BY recurso_favorito ORDER BY qtd DESC")
    votos_recursos = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT faixa_preco, COUNT(*) as qtd FROM leads_premium GROUP BY faixa_preco ORDER BY qtd DESC")
    votos_precos = [dict(r) for r in cur.fetchall()]

    conn.close()

    buscas = contagens.get("busca", 0)
    materiais = contagens.get("material_acesso", 0)
    radar = contagens.get("radar_view", 0)
    chat = contagens.get("chat_ia", 0)
    total_leads = len(leads)

    return {
        "telemetria": {
            "buscas": buscas,
            "materiais_acessados": materiais,
            "radar_views": radar,
            "consultas_ia": chat,
            "leads_premium": total_leads,
            "total_interacoes": buscas + materiais + radar + chat + total_leads
        },
        "leads_cadastrados": leads,
        "preferencia_recursos_premium": votos_recursos,
        "disposicao_pagamento": votos_precos
    }


@router.post("/leads-premium")
def cadastrar_lead_smoke_test(lead: LeadPremiumInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO leads_premium (nome, contato, carreira_foco, recurso_favorito, faixa_preco)
        VALUES (?, ?, ?, ?, ?)
        """,
        (lead.nome, lead.contato, lead.carreira_foco, lead.recurso_favorito, lead.faixa_preco)
    )
    novo_id = cur.lastrowid
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('lead_premium', ?)",
        (f"{lead.nome} - {lead.recurso_favorito} ({lead.faixa_preco})",)
    )
    conn.commit()
    conn.close()
    return {
        "id": novo_id,
        "sucesso": True,
        "mensagem": f"Inscrição prioritária de {lead.nome} confirmada! Recurso selecionado: {lead.recurso_favorito}."
    }


@router.post("/telemetria")
def registrar_telemetria(ev: EventoTelemetriaInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES (?, ?)",
        (ev.tipo_evento, ev.detalhe or "")
    )
    conn.commit()
    conn.close()
    return {"registrado": True}

