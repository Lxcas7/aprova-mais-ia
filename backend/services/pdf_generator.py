import json
from datetime import datetime


def gerar_conteudo_material_download(concurso: dict, material: dict) -> str:
    disciplinas = json.loads(concurso.get("disciplinas_json", "[]"))
    linhas_disc = "\n".join([
        f"  [ ] {idx+1}. {d['nome']} — {d['questoes']} questões ({d['peso']}) | Prioridade: {d['prioridade']}"
        for idx, d in enumerate(disciplinas)
    ])

    data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")
    return f"""================================================================================
APROVA+ IA — CENTRAL INTELIGENTE DE CONCURSOS PÚBLICOS (MATERIAL OFICIAL DO MVP)
================================================================================
MATERIAL: {material['titulo']}
CATEGORIA: {material['categoria']} | DISCIPLINA: {material['disciplina']} | EXTENSÃO: {material['paginas']}
GERADO EM: {data_hoje}
--------------------------------------------------------------------------------
1. DADOS DO CONCURSO VINCULADO
--------------------------------------------------------------------------------
• Concurso: {concurso['titulo']} ({concurso['sigla']})
• Órgão: {concurso['orgao']}
• Status Atual: {concurso['status_label']}
• Banca Organizadora: {concurso['banca']}
• Vagas: {concurso['vagas']}
• Remuneração: {concurso['salario']}
• Escolaridade Exigida: {concurso['escolaridade']}
• Cronograma / Situação: {concurso['prazo']} ({concurso['data_prova']})
• Histórico de Corte Anterior ({concurso['ultimo_concurso_ano']}): {concurso['nota_corte_anterior']}

--------------------------------------------------------------------------------
2. RAIO-X E DIRECIONAMENTO DA INTELIGÊNCIA ARTIFICIAL (APROVA+ IA)
--------------------------------------------------------------------------------
{concurso['resumo_ia']}

Fontes Monitoradas pela IA: {concurso['fontes_internet']}

--------------------------------------------------------------------------------
3. RESUMO EXECUTIVO DESTE MATERIAL
--------------------------------------------------------------------------------
{material['resumo_conteudo']}

--------------------------------------------------------------------------------
4. EDITAL VERTICALIZADO & CHECKLIST DE ESTUDO POR PESO DA BANCA ({concurso['banca']})
--------------------------------------------------------------------------------
Marque com [X] conforme concluir a Teoria, Revisão e Bateria de Questões:

{linhas_disc}

--------------------------------------------------------------------------------
5. ESTRATÉGIA DE APROVAÇÃO RECOMENDADA PELA IA
--------------------------------------------------------------------------------
1) Dedique 70% do seu tempo às disciplinas marcadas com Prioridade CRÍTICA e ALTA.
2) Resolva no mínimo 50 questões anteriores da banca {concurso['banca']} por semana.
3) Refaça a última prova realizada ({concurso['ultimo_concurso_ano']}) simulando o tempo real.

================================================================================
Aprova+ IA — Plataforma Centralizada de Busca de Concursos e Materiais
================================================================================
"""

