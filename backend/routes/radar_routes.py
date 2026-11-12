from fastapi import APIRouter, HTTPException
from backend.database.connection import get_db_connection
from backend.models.schemas import NovoRumorInput
from backend.services.ia_engine import analisar_novo_rumor

router = APIRouter(prefix="/api/radar", tags=["Radar IA de Rumores na Internet"])


@router.get("")
def listar_rumores_radar():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM rumores_web ORDER BY confianca_ia DESC, id DESC")
    rumores = [dict(r) for r in cur.fetchall()]
    cur.execute("INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('radar_view', 'Consulta ao Radar IA')")
    conn.commit()
    conn.close()
    return {"total": len(rumores), "rumores": rumores}


@router.post("")
def submeter_rumor_cocriacao(dados: NovoRumorInput):
    analise = analisar_novo_rumor(dados.orgao_sigla, dados.titulo_noticia, dados.fonte_portal)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO rumores_web (
            concurso_id, orgao_sigla, titulo_noticia, fonte_portal, data_captura,
            estagio_maturidade, confianca_ia, analise_ia, votos_comunidade
        ) VALUES (?, ?, ?, ?, 'Enviado agora (Cocriação)', ?, ?, ?, 1)
        """,
        (
            dados.concurso_id or "geral",
            dados.orgao_sigla.upper(),
            dados.titulo_noticia,
            dados.fonte_portal,
            analise["estagio_maturidade"],
            analise["confianca_ia"],
            analise["analise_ia"]
        )
    )
    novo_id = cur.lastrowid
    cur.execute(
        "INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES ('radar_view', ?)",
        (f"Cocriação Rumor: {dados.orgao_sigla}",)
    )
    conn.commit()
    conn.close()
    return {"id": novo_id, "mensagem": "Rumor analisado pela IA e publicado no Radar!", **analise}


@router.post("/{rumor_id}/votar")
def votar_rumor(rumor_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT votos_comunidade FROM rumores_web WHERE id = ?", (rumor_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Rumor não encontrado")

    novo_voto = row["votos_comunidade"] + 1
    cur.execute("UPDATE rumores_web SET votos_comunidade = ? WHERE id = ?", (novo_voto, rumor_id))
    conn.commit()
    conn.close()
    return {"id": rumor_id, "votos_comunidade": novo_voto}

