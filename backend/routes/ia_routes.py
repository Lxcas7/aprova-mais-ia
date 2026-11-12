from fastapi import APIRouter
from backend.database.connection import get_db_connection
from backend.models.schemas import ChatRequest, MatchPerfilRequest
from backend.services.ia_engine import responder_chat, calcular_match_perfil

router = APIRouter(prefix="/api/ia", tags=["Inteligência Artificial (Aprova+ IA)"])


@router.post("/chat")
def chat_ia(req: ChatRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('chat_ia', ?)",
        (req.mensagem[:100],)
    )
    conn.commit()
    conn.close()
    return responder_chat(req.mensagem)


@router.post("/match-perfil")
def match_perfil_concurseiro(req: MatchPerfilRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('chat_ia', ?)",
        (f"Match Perfil: {req.escolaridade} | {req.area_interesse} | {req.horas_por_dia}h/dia",)
    )
    conn.commit()
    conn.close()
    return calcular_match_perfil(
        req.escolaridade,
        req.area_interesse,
        req.horas_por_dia,
        req.foco_status
    )

