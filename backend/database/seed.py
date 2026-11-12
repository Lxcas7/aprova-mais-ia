import hashlib
import json
from backend.database.connection import get_db_connection, init_db


def _hash_pw(senha: str) -> str:
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()


def seed_database() -> None:
    init_db()
    conn = get_db_connection()
    cur = conn.cursor()

    # Garante usuário padrão de demonstração na tabela usuarios
    cur.execute("SELECT COUNT(*) as total FROM usuarios")
    if cur.fetchone()["total"] == 0:
        cur.execute(
            """
            INSERT INTO usuarios (nome, email, senha_hash, carreira_foco, escolaridade, uf_interesse, horas_estudo_dia, plano)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("Carlos Lucas", "carlos@aprovamais.com.br", _hash_pw("123456"), "Policial", "Superior", "Nacional", 4, "Gratuito")
        )
        conn.commit()

    cur.execute("SELECT COUNT(*) as total FROM concursos")
    if cur.fetchone()["total"] > 0:
        conn.close()
        return

    concursos_data = [
        # ==================== 1. ATIVOS (COM EDITAL ABERTO) ====================
        {
            "id": "pf-2026",
            "sigla": "PF",
            "titulo": "Polícia Federal (PF) — Agente, Escrivão e Administrativo",
            "orgao": "Ministério da Justiça e Segurança Pública (MJSP)",
            "status": "aberto",
            "status_label": "Edital Aberto (Ativo)",
            "banca": "Cebraspe",
            "vagas": "1.192 vagas + CR",
            "vagas_num": 1192,
            "salario": "R$ 7.444,80 a R$ 13.900,54",
            "salario_max": 13900.54,
            "escolaridade": "Médio e Superior",
            "area": "Policial",
            "uf": "Nacional",
            "prazo": "Inscrições até 18/12/2026",
            "data_prova": "14/02/2027",
            "prob_ia": 100,
            "prob_label": "100% Edital Publicado",
            "resumo_ia": "Edital publicado no DOU! A banca Cebraspe mantém o modelo Certo/Errado (120 itens) com forte peso em Informática/TI (36 questões), Contabilidade Geral (24 questões) e Língua Portuguesa (24 questões). Juntas, essas 3 disciplinas somam 70% da prova objetiva.",
            "fontes_internet": "Diário Oficial da União (DOU) + Página Oficial Cebraspe.",
            "ultimo_concurso_ano": "2021 (Cebraspe)",
            "nota_corte_anterior": "75,00 líquidos (Agente) | 71,00 líquidos (Escrivão)",
            "salvo": 1,
            "disciplinas": [
                {"nome": "Informática, Redes e Banco de Dados", "questoes": 36, "peso": "30% da Prova", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa e Redação Oficial", "questoes": 24, "peso": "20% da Prova", "prioridade": "Crítica"},
                {"nome": "Contabilidade Geral", "questoes": 24, "peso": "20% da Prova", "prioridade": "Alta"},
                {"nome": "Direito Administrativo, Constitucional e Penal", "questoes": 24, "peso": "20% da Prova", "prioridade": "Média"},
                {"nome": "Raciocínio Lógico e Estatística", "questoes": 12, "peso": "10% da Prova", "prioridade": "Média"}
            ]
        },
        {
            "id": "caixa-2026",
            "sigla": "CAIXA",
            "titulo": "Caixa Econômica Federal — Técnico Bancário Novo & TI",
            "orgao": "Caixa Econômica Federal (CEF)",
            "status": "aberto",
            "status_label": "Edital Aberto (Ativo)",
            "banca": "Cesgranrio",
            "vagas": "4.050 vagas",
            "vagas_num": 4050,
            "salario": "R$ 3.762,00 + R$ 1.800 Auxílios + PLR",
            "salario_max": 5562.00,
            "escolaridade": "Médio",
            "area": "Bancária",
            "uf": "Nacional",
            "prazo": "Inscrições até 08/12/2026",
            "data_prova": "24/01/2027",
            "prob_ia": 100,
            "prob_label": "100% Edital Publicado",
            "resumo_ia": "Melhor oportunidade atual de Nível Médio! Permite escolher entre o polo Comercial ou o polo de Tecnologia da Informação (sem exigir faculdade de TI). Prova de 60 questões múltipla escolha (A-E) + Redação Dissertativa.",
            "fontes_internet": "Portal Oficial da Caixa + Fundação Cesgranrio.",
            "ultimo_concurso_ano": "2024 (Cesgranrio)",
            "nota_corte_anterior": "80% a 85% dos pontos (dependendo do macrorpolo)",
            "salvo": 1,
            "disciplinas": [
                {"nome": "Conhecimentos Bancários e SFN", "questoes": 15, "peso": "25% da Prova", "prioridade": "Crítica"},
                {"nome": "Atendimento Bancário e Comportamentos Digitais", "questoes": 15, "peso": "25% da Prova", "prioridade": "Crítica"},
                {"nome": "Tecnologia da Informação / Noções de Probabilidade", "questoes": 10, "peso": "17% da Prova", "prioridade": "Alta"},
                {"nome": "Matemática Financeira", "questoes": 10, "peso": "17% da Prova", "prioridade": "Alta"},
                {"nome": "Língua Portuguesa e Inglês Básico", "questoes": 10, "peso": "16% da Prova", "prioridade": "Média"}
            ]
        },
        {
            "id": "tse-unificado",
            "sigla": "TSE / TREs",
            "titulo": "TSE Unificado + 26 TREs — Técnico e Analista Judiciário",
            "orgao": "Tribunal Superior Eleitoral e Justiça Eleitoral",
            "status": "aberto",
            "status_label": "Edital Aberto (Ativo)",
            "banca": "Cebraspe",
            "vagas": "412 vagas + CR Nacional",
            "vagas_num": 412,
            "salario": "R$ 8.529,65 a R$ 13.994,78",
            "salario_max": 13994.78,
            "escolaridade": "Superior",
            "area": "Tribunais",
            "uf": "Nacional",
            "prazo": "Inscrições até 30/11/2026",
            "data_prova": "17/01/2027",
            "prob_ia": 100,
            "prob_label": "100% Edital Publicado",
            "resumo_ia": "Os Tribunais Regionais Eleitorais historicamente nomeiam até 10x o número de vagas imediatas durante a validade do certame. Conhecimentos Específicos (Direito Eleitoral, Administrativo e Constitucional) têm peso 2.",
            "fontes_internet": "Diário da Justiça Eletrônico (TSE) + Banca Cebraspe.",
            "ultimo_concurso_ano": "2024 (Cebraspe)",
            "nota_corte_anterior": "92 pontos líquidos (ponderados)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Direito Eleitoral e Resoluções do TSE", "questoes": 28, "peso": "Peso 2 (Específicos)", "prioridade": "Crítica"},
                {"nome": "Direito Administrativo e Licitações (Lei 14.133)", "questoes": 22, "peso": "Peso 2 (Específicos)", "prioridade": "Crítica"},
                {"nome": "Direito Constitucional", "questoes": 20, "peso": "Peso 2 (Específicos)", "prioridade": "Alta"},
                {"nome": "Língua Portuguesa", "questoes": 30, "peso": "Peso 1 (Básicos)", "prioridade": "Alta"},
                {"nome": "Noções de Administração Pública", "questoes": 20, "peso": "Peso 1 (Básicos)", "prioridade": "Média"}
            ]
        },
        {
            "id": "correios-2026",
            "sigla": "CORREIOS",
            "titulo": "Correios — Agente de Correios (Carteiro) e Analista",
            "orgao": "Empresa Brasileira de Correios e Telégrafos (ECT)",
            "status": "aberto",
            "status_label": "Edital Aberto (Ativo)",
            "banca": "IBFC",
            "vagas": "3.511 vagas imediatas",
            "vagas_num": 3511,
            "salario": "R$ 2.429,26 a R$ 6.872,48 + Benefícios",
            "salario_max": 6872.48,
            "escolaridade": "Médio e Superior",
            "area": "Administrativa",
            "uf": "Nacional",
            "prazo": "Inscrições até 28/11/2026",
            "data_prova": "20/12/2026",
            "prob_ia": 100,
            "prob_label": "100% Edital Publicado",
            "resumo_ia": "Edital enxuto e altamente acessível para quem trabalha 8h por dia: cobra apenas 5 matérias objetivas na modalidade múltipla escolha (A-D) da banca IBFC, sem redação para o cargo de Nível Médio.",
            "fontes_internet": "Portal Oficial dos Correios + Banca IBFC.",
            "ultimo_concurso_ano": "2011 / 2024 (IBFC)",
            "nota_corte_anterior": "51 de 60 pontos (85%)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Língua Portuguesa", "questoes": 15, "peso": "30% da Prova", "prioridade": "Crítica"},
                {"nome": "Matemática Básica e Proporcionalidade", "questoes": 10, "peso": "20% da Prova", "prioridade": "Crítica"},
                {"nome": "Conhecimentos Gerais e Geografia do Brasil", "questoes": 10, "peso": "20% da Prova", "prioridade": "Alta"},
                {"nome": "Noções de Informática", "questoes": 10, "peso": "20% da Prova", "prioridade": "Média"},
                {"nome": "Código de Conduta Ética e Integridade dos Correios", "questoes": 5, "peso": "10% da Prova", "prioridade": "Alta"}
            ]
        },
        {
            "id": "ibama-2026",
            "sigla": "IBAMA",
            "titulo": "IBAMA — Analista Ambiental e Analista Administrativo",
            "orgao": "Instituto Brasileiro do Meio Ambiente (IBAMA)",
            "status": "aberto",
            "status_label": "Edital Aberto (Ativo)",
            "banca": "Cebraspe",
            "vagas": "460 vagas",
            "vagas_num": 460,
            "salario": "R$ 8.817,72 a R$ 10.294,30",
            "salario_max": 10294.30,
            "escolaridade": "Superior",
            "area": "Ambiental",
            "uf": "Nacional",
            "prazo": "Inscrições até 15/12/2026",
            "data_prova": "31/01/2027",
            "prob_ia": 100,
            "prob_label": "100% Edital Publicado",
            "resumo_ia": "Aceita diploma de Nível Superior em QUALQUER área de formação! Forte cobrança em Licenciamento Ambiental, SNUC, Código Florestal, Geoprocessamento e Redação Discursiva sobre mudanças climáticas.",
            "fontes_internet": "Ministério do Meio Ambiente (MMA) + DOU + Cebraspe.",
            "ultimo_concurso_ano": "2022 (Cebraspe)",
            "nota_corte_anterior": "72,00 líquidos (Analista Ambiental)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Legislação e Políticas de Meio Ambiente (SNUC/Código Florestal)", "questoes": 35, "peso": "29% da Prova", "prioridade": "Crítica"},
                {"nome": "Licenciamento, Monitoramento e Regulação Ambiental", "questoes": 35, "peso": "29% da Prova", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa e Discursiva Ambiental", "questoes": 20, "peso": "17% + Discursiva", "prioridade": "Alta"},
                {"nome": "Direito Administrativo e Constitucional", "questoes": 15, "peso": "13% da Prova", "prioridade": "Média"},
                {"nome": "Administração Financeira e Orçamentária (AFO)", "questoes": 15, "peso": "12% da Prova", "prioridade": "Média"}
            ]
        },

        # ==================== 2. PREVISTOS (RADAR IA NA INTERNET) ====================
        {
            "id": "bb-previsto",
            "sigla": "BB",
            "titulo": "Banco do Brasil — Escriturário (Agente Comercial e Agente de TI)",
            "orgao": "Banco do Brasil S.A.",
            "status": "previsto",
            "status_label": "Previsto (Radar IA: 92% Iminente)",
            "banca": "Cesgranrio (Contrato Vigente)",
            "vagas": "4.000+ vagas estimadas",
            "vagas_num": 4000,
            "salario": "R$ 5.436,03 + Vale R$ 1.800 + PLR",
            "salario_max": 7236.03,
            "escolaridade": "Médio",
            "area": "Bancária",
            "uf": "Nacional",
            "prazo": "Previsão IA: Edital Iminente (Contrato ativo com banca)",
            "data_prova": "Prevista: 1º Semestre",
            "prob_ia": 92,
            "prob_label": "92% Iminente (Banca Contratada)",
            "resumo_ia": "O que estão falando na internet: O Banco do Brasil já convocou praticamente todos os aprovados do último cadastro reserva e mantém contrato ativo com a Fundação Cesgranrio. Portais de notícias e sindicatos bancários confirmam estudos finais de distribuição de vagas por microrregião.",
            "fontes_internet": "Folha Dirigida, Direção Concursos, Sindicato dos Bancários e DOU.",
            "ultimo_concurso_ano": "2023 (Cesgranrio)",
            "nota_corte_anterior": "78,5 a 84,0 pontos (Agente Comercial)",
            "salvo": 1,
            "disciplinas": [
                {"nome": "Vendas e Negociação", "questoes": 15, "peso": "22,5 pontos", "prioridade": "Crítica"},
                {"nome": "Conhecimentos Bancários e PIX/Open Finance", "questoes": 10, "peso": "15,0 pontos", "prioridade": "Crítica"},
                {"nome": "Conhecimentos de Informática", "questoes": 15, "peso": "22,5 pontos", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa e Matemática Financeira", "questoes": 15, "peso": "22,5 pontos", "prioridade": "Alta"},
                {"nome": "Atualidades do Mercado Financeiro e Inglês", "questoes": 15, "peso": "17,5 pontos", "prioridade": "Média"}
            ]
        },
        {
            "id": "inss-previsto",
            "sigla": "INSS",
            "titulo": "INSS — Técnico do Seguro Social e Analista do Seguro Social",
            "orgao": "Instituto Nacional do Seguro Social (MPS)",
            "status": "previsto",
            "status_label": "Previsto (Radar IA: 88% Quente)",
            "banca": "Cebraspe (Mais Cotada)",
            "vagas": "1.500+ vagas solicitadas ao MGI",
            "vagas_num": 1500,
            "salario": "R$ 5.905,79 a R$ 9.767,20",
            "salario_max": 9767.20,
            "escolaridade": "Médio e Superior",
            "area": "Administrativa",
            "uf": "Nacional",
            "prazo": "Previsão IA: Pedido em tramitação avançada no MGI",
            "data_prova": "Prevista: Próximo Semestre",
            "prob_ia": 88,
            "prob_label": "88% Quente (Pedido no MGI + Déficit Crítico)",
            "resumo_ia": "O que estão falando na internet: Movimentações de processos no SEI/MGI e declarações públicas do Ministério da Previdência apontam necessidade urgente de recomposição da fila do INSS. Direito Previdenciário representa quase 60% da prova (70 de 120 questões) — exige preparação antecipada!",
            "fontes_internet": "Processos SEI/MGI, Canal Estratégia/Gran, Fóruns Telegram e Reddit.",
            "ultimo_concurso_ano": "2022 (Cebraspe)",
            "nota_corte_anterior": "82,00 a 94,00 líquidos (por Gerência Executiva)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Seguridade Social e Direito Previdenciário (Leis 8.212 e 8.213)", "questoes": 70, "peso": "58% da Prova!", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa", "questoes": 15, "peso": "12,5% da Prova", "prioridade": "Alta"},
                {"nome": "Direito Constitucional e Administrativo", "questoes": 15, "peso": "12,5% da Prova", "prioridade": "Alta"},
                {"nome": "Ética no Serviço Público e Regime Jurídico (Lei 8.112)", "questoes": 10, "peso": "8,5% da Prova", "prioridade": "Média"},
                {"nome": "Noções de Informática e Raciocínio Lógico", "questoes": 10, "peso": "8,5% da Prova", "prioridade": "Média"}
            ]
        },
        {
            "id": "prf-previsto",
            "sigla": "PRF",
            "titulo": "Polícia Rodoviária Federal (PRF) — Policial e Agente Administrativo",
            "orgao": "Ministério da Justiça e Segurança Pública (MJSP)",
            "status": "previsto",
            "status_label": "Previsto (Radar IA: 79% Em Movimentação)",
            "banca": "Cebraspe (Histórica)",
            "vagas": "4.902 Policiais + 235 Administrativos (Solicitados)",
            "vagas_num": 5137,
            "salario": "R$ 5.800,00 a R$ 11.114,60",
            "salario_max": 11114.60,
            "escolaridade": "Médio e Superior",
            "area": "Policial",
            "uf": "Nacional",
            "prazo": "Previsão IA: Nota Técnica enviada ao MJSP/MGI",
            "data_prova": "Aguardando Autorização Oficial",
            "prob_ia": 79,
            "prob_label": "79% No Radar (Nota Técnica Protocolada)",
            "resumo_ia": "O que estão falando na internet: Ofício oficial da Direção-Geral da PRF solicita ampliação do quadro legal para 18 mil policiais rodoviários e abertura de 235 vagas administrativas de Nível Médio. Legislação de Trânsito (CTB + Resoluções CONTRAN) sozinha vale 30 questões da prova.",
            "fontes_internet": "Ofício SEI PRF/MJSP + Canais Policiais no YouTube e Instagram.",
            "ultimo_concurso_ano": "2021 (Cebraspe)",
            "nota_corte_anterior": "73,00 líquidos",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Legislação de Trânsito (CTB e Resoluções do CONTRAN)", "questoes": 30, "peso": "25% da Prova", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa", "questoes": 20, "peso": "17% da Prova", "prioridade": "Crítica"},
                {"nome": "Direito Penal, Processual Penal e Legislação Especial", "questoes": 20, "peso": "17% da Prova", "prioridade": "Alta"},
                {"nome": "Física Aplicada, Raciocínio Lógico e Informática", "questoes": 20, "peso": "17% da Prova", "prioridade": "Alta"},
                {"nome": "Direito Administrativo, Constitucional e Direitos Humanos", "questoes": 30, "peso": "24% da Prova", "prioridade": "Média"}
            ]
        },
        {
            "id": "receita-previsto",
            "sigla": "RFB",
            "titulo": "Receita Federal do Brasil — Auditor-Fiscal e Analista-Tributário",
            "orgao": "Ministério da Fazenda",
            "status": "previsto",
            "status_label": "Previsto (Radar IA: 71% Monitorado)",
            "banca": "FGV (Referência)",
            "vagas": "699 vagas solicitadas ao MGI",
            "vagas_num": 699,
            "salario": "R$ 13.678,00 a R$ 23.568,00",
            "salario_max": 23568.00,
            "escolaridade": "Superior",
            "area": "Fiscal",
            "uf": "Nacional",
            "prazo": "Previsão IA: Pedido anual no MGI + Reforma Tributária",
            "data_prova": "Médio Prazo (Preparação de Alta Complexidade)",
            "prob_ia": 71,
            "prob_label": "71% Monitorado (Demanda Pós-Reforma Tributária)",
            "resumo_ia": "O que estão falando na internet: Fóruns da área fiscal e notas do Sindifisco/Sindireceita apontam necessidade de novos concursos para operacionalizar o IBS/CBS da Reforma Tributária e reforçar postos de fronteira.",
            "fontes_internet": "Notas Sindifisco, Sindireceita e Portais da Área Fiscal.",
            "ultimo_concurso_ano": "2023 (FGV)",
            "nota_corte_anterior": "68% (Auditor) | 71% (Analista)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Direito Tributário e Reforma Tributária (EC 132)", "questoes": 25, "peso": "Altíssimo", "prioridade": "Crítica"},
                {"nome": "Legislação Tributária e Aduaneira", "questoes": 25, "peso": "Altíssimo", "prioridade": "Crítica"},
                {"nome": "Contabilidade Geral e Avançada", "questoes": 20, "peso": "Alto", "prioridade": "Crítica"},
                {"nome": "Auditoria Fiscal e Comércio Internacional", "questoes": 20, "peso": "Alto", "prioridade": "Alta"},
                {"nome": "Língua Portuguesa (Padrão FGV) e Fluência em Dados", "questoes": 25, "peso": "Alto", "prioridade": "Alta"}
            ]
        },

        # ==================== 3. ENCERRADOS / JÁ ACONTECERAM ====================
        {
            "id": "cnu-historico",
            "sigla": "CNU",
            "titulo": "Concurso Nacional Unificado (CNU — 1ª Edição Blocos 1 a 8)",
            "orgao": "Ministério da Gestão e da Inovação em Serviços Públicos (MGI)",
            "status": "encerrado",
            "status_label": "Já Aconteceu (Histórico + Provas)",
            "banca": "Cesgranrio",
            "vagas": "6.640 vagas (Realizado)",
            "vagas_num": 6640,
            "salario": "R$ 5.866,69 a R$ 22.921,71",
            "salario_max": 22921.71,
            "escolaridade": "Médio e Superior",
            "area": "Administrativa",
            "uf": "Nacional",
            "prazo": "Concurso Realizado — Provas e Cortes Disponíveis",
            "data_prova": "Realizada em 18/08/2024",
            "prob_ia": 100,
            "prob_label": "Acervo Histórico Oficial Completo",
            "resumo_ia": "Concurso já realizado! Base obrigatória de estudo para o próximo CNU e concursos federais do Executivo: acesse os cadernos de provas reais dos 8 blocos temáticos, gabaritos definitivos e a tabela oficial de notas de corte por cargo.",
            "fontes_internet": "Acervo Oficial Gov.br / MGI / Fundação Cesgranrio.",
            "ultimo_concurso_ano": "2024 (Cesgranrio)",
            "nota_corte_anterior": "74,50 a 86,20 pontos (variável por Bloco e Cargo)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Políticas Públicas e Desafios do Estado de Direito", "questoes": 20, "peso": "Conhecimentos Gerais", "prioridade": "Crítica"},
                {"nome": "Eixos Temáticos Específicos (1 a 5 por Bloco)", "questoes": 50, "peso": "Conhecimentos Específicos", "prioridade": "Crítica"},
                {"nome": "Prova Discursiva / Redação de Políticas Públicas", "questoes": 1, "peso": "20% da Nota Final", "prioridade": "Alta"}
            ]
        },
        {
            "id": "tjsp-historico",
            "sigla": "TJ-SP",
            "titulo": "Tribunal de Justiça de São Paulo (TJ-SP) — Escrevente Técnico Judiciário",
            "orgao": "Tribunal de Justiça do Estado de São Paulo",
            "status": "encerrado",
            "status_label": "Já Aconteceu (Histórico + Provas)",
            "banca": "Vunesp",
            "vagas": "572 vagas (Realizado)",
            "vagas_num": 572,
            "salario": "R$ 6.043,54 + Auxílio Saúde e Alimentação",
            "salario_max": 7800.00,
            "escolaridade": "Médio",
            "area": "Tribunais",
            "uf": "SP",
            "prazo": "Concurso Realizado — Última Prova Comentada Disponível",
            "data_prova": "Realizada (Ciclo Anual Vunesp)",
            "prob_ia": 100,
            "prob_label": "Acervo Histórico + Ciclo Recorrente",
            "resumo_ia": "O TJ-SP realiza concursos para Escrevente quase todos os anos com a banca Vunesp e o mesmo edital! Resolver a última prova que já aconteceu (100 questões) é a melhor estratégia para passar no próximo edital.",
            "fontes_internet": "Acervo Fundação Vunesp + Diário da Justiça Eletrônico de SP.",
            "ultimo_concurso_ano": "2024 (Vunesp)",
            "nota_corte_anterior": "86 de 100 acertos (Capital)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Bloco II — Direito (Penal, Proc. Penal, Proc. Civil, Const., Adm. e Normas CGJ)", "questoes": 40, "peso": "40% (Eliminatório)", "prioridade": "Crítica"},
                {"nome": "Bloco I — Língua Portuguesa (Padrão Vunesp)", "questoes": 24, "peso": "24% (Eliminatório)", "prioridade": "Crítica"},
                {"nome": "Bloco III — Informática (14), Raciocínio Lógico (10), Matemática (6) e Atualidades (6)", "questoes": 36, "peso": "36% da Prova", "prioridade": "Alta"}
            ]
        },
        {
            "id": "bacen-historico",
            "sigla": "BACEN",
            "titulo": "Banco Central do Brasil (BACEN) — Analista (TI e Economia/Finanças)",
            "orgao": "Banco Central do Brasil",
            "status": "encerrado",
            "status_label": "Já Aconteceu (Histórico + Provas)",
            "banca": "Cebraspe",
            "vagas": "100 vagas + CR (Realizado)",
            "vagas_num": 100,
            "salario": "R$ 20.924,80",
            "salario_max": 20924.80,
            "escolaridade": "Superior",
            "area": "Bancária",
            "uf": "DF",
            "prazo": "Concurso Realizado — Provas Objetivas e Discursivas no Acervo",
            "data_prova": "Realizada em 2024",
            "prob_ia": 100,
            "prob_label": "Acervo Histórico Oficial Completo",
            "resumo_ia": "Prova realizada de altíssimo nível da banca Cebraspe. Excelente fonte de questões reais sobre Sistema Financeiro Nacional, Macroeconomia, Regulação Bancária e Engenharia de Software/Ciência de Dados.",
            "fontes_internet": "Acervo Oficial Cebraspe + Banco Central do Brasil.",
            "ultimo_concurso_ano": "2024 (Cebraspe)",
            "nota_corte_anterior": "69,00 líquidos (TI) | 74,00 líquidos (Economia)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Conhecimentos Específicos (Economia/Finanças ou Engenharia de Software/Dados)", "questoes": 70, "peso": "58% da Prova", "prioridade": "Crítica"},
                {"nome": "Sistema Financeiro Nacional e Autoridade Monetária", "questoes": 25, "peso": "21% da Prova", "prioridade": "Alta"},
                {"nome": "Língua Portuguesa, Inglês e Raciocínio Lógico", "questoes": 25, "peso": "21% da Prova", "prioridade": "Média"}
            ]
        },
        {
            "id": "cgu-historico",
            "sigla": "CGU",
            "titulo": "Controladoria-Geral da União (CGU) — Técnico e Auditor Federal de Finanças",
            "orgao": "Controladoria-Geral da União",
            "status": "encerrado",
            "status_label": "Já Aconteceu (Histórico + Provas)",
            "banca": "FGV",
            "vagas": "375 vagas (Realizado)",
            "vagas_num": 375,
            "salario": "R$ 8.210,00 a R$ 20.924,80",
            "salario_max": 20924.80,
            "escolaridade": "Médio e Superior",
            "area": "Fiscal",
            "uf": "DF",
            "prazo": "Concurso Realizado — Provas FGV Comentadas Disponíveis",
            "data_prova": "Realizada (Acervo FGV)",
            "prob_ia": 100,
            "prob_label": "Acervo Histórico Oficial Completo",
            "resumo_ia": "Material histórico fundamental para quem se prepara para Controladorias (CGE, CGM) e Tribunais de Contas (TCU, TCE) organizados pela banca FGV.",
            "fontes_internet": "Acervo FGV Conhecimento.",
            "ultimo_concurso_ano": "2022 (FGV)",
            "nota_corte_anterior": "66% (Auditor) | 73% (Técnico)",
            "salvo": 0,
            "disciplinas": [
                {"nome": "Auditoria Governamental, Controle Interno e AFO", "questoes": 30, "peso": "38% da Prova", "prioridade": "Crítica"},
                {"nome": "Direito Administrativo, Constitucional e Lei Anticorrupção", "questoes": 25, "peso": "31% da Prova", "prioridade": "Crítica"},
                {"nome": "Língua Portuguesa (Interpretação e Gramática FGV)", "questoes": 25, "peso": "31% da Prova", "prioridade": "Alta"}
            ]
        }
    ]

    for c in concursos_data:
        cur.execute(
            """
            INSERT INTO concursos (
                id, sigla, titulo, orgao, status, status_label, banca, vagas, vagas_num,
                salario, salario_max, escolaridade, area, uf, prazo, data_prova,
                prob_ia, prob_label, resumo_ia, fontes_internet,
                ultimo_concurso_ano, nota_corte_anterior, salvo, disciplinas_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                c["id"], c["sigla"], c["titulo"], c["orgao"], c["status"], c["status_label"],
                c["banca"], c["vagas"], c["vagas_num"], c["salario"], c["salario_max"],
                c["escolaridade"], c["area"], c["uf"], c["prazo"], c["data_prova"],
                c["prob_ia"], c["prob_label"], c["resumo_ia"], c["fontes_internet"],
                c["ultimo_concurso_ano"], c["nota_corte_anterior"], c["salvo"],
                json.dumps(c["disciplinas"], ensure_ascii=False)
            )
        )

    # Seed Materials linked to each specific Concurso
    materiais_data = [
        # PF
        ("pf-2026", "Edital Verticalizado PF (Agente, Escrivão e Administrativo) — Checklist Completo", "Edital Verticalizado", "Geral / Planejamento", "28 págs", 1, 1, "Checklist tópico por tópico do edital oficial da Polícia Federal organizado por peso estatístico da Cebraspe."),
        ("pf-2026", "Apostila Intensiva de Informática, Redes, Segurança e Banco de Dados (36 questões PF)", "Apostila PDF", "Informática & TI", "142 págs", 1, 1, "Cobre 100% do bloco de TI da PF: Redes TCP/IP, Linux/Windows, Python/SQL, Segurança da Informação e Cloud."),
        ("pf-2026", "Caderno das Últimas 3 Provas da Polícia Federal Comentadas Item a Item (Cebraspe)", "Prova Passada + Gabarito", "Provas Anteriores", "96 págs", 1, 0, "Provas oficiais de 2014, 2018 e 2021 com gabarito definitivo e comentários explicativos."),
        ("pf-2026", "Contabilidade Geral Esquematizada para Carreiras Policiais (CPC 00, Balanço e DRE)", "Apostila PDF", "Contabilidade Geral", "84 págs", 1, 0, "Focado nas 24 questões de Contabilidade cobradas pela Cebraspe na Polícia Federal."),
        ("pf-2026", "Mapas Mentais de Direito Penal, Processual Penal e Legislação Especial", "Mapa Mental", "Direito Policial", "54 págs", 1, 0, "Revisão visual rápida de Lei de Drogas, Crimes Hediondos, Abuso de Autoridade e Lavagem de Dinheiro."),

        # CAIXA
        ("caixa-2026", "Edital Verticalizado Caixa Econômica Federal (Técnico Bancário Novo & TI)", "Edital Verticalizado", "Geral / Planejamento", "22 págs", 1, 1, "Quadro completo de matérias da Fundação Cesgranrio com metas diárias de leitura e resolução de questões."),
        ("caixa-2026", "Apostila Completa de Conhecimentos Bancários, SFN, PIX e Open Finance", "Apostila PDF", "Conhecimentos Bancários", "118 págs", 1, 1, "Todo o conteúdo atualizado do Sistema Financeiro Nacional, CMN, BACEN, CVM, produtos bancários e garantias."),
        ("caixa-2026", "Guia de Atendimento Bancário, Comportamentos Digitais e Código de Ética Caixa", "Apostila PDF", "Atendimento & Ética", "65 págs", 1, 0, "Focado nas 15 questões de Atendimento e Compliance exigidas no edital da Caixa."),
        ("caixa-2026", "Caderno de 150 Questões Resolvidas de Matemática Financeira (Banca Cesgranrio)", "Caderno de Questões", "Matemática Financeira", "78 págs", 1, 0, "Juros simples e compostos, sistemas de amortização SAC/Price e desconto de títulos passo a passo."),
        ("caixa-2026", "10 Modelos de Redação Nota 100 no Padrão Oficial da Cesgranrio + Prova 2024", "Prova Passada + Gabarito", "Redação & Provas", "44 págs", 1, 0, "Inclui a última prova realizada da Caixa + esqueletos prontos para a redação dissertativa-argumentativa."),

        # TSE
        ("tse-unificado", "Código Eleitoral e Resoluções do TSE Esquematizadas para o Concurso Unificado", "Apostila PDF", "Direito Eleitoral", "130 págs", 1, 1, "Material completo de Direito Eleitoral, partidos políticos, inelegibilidades e processo eleitoral."),
        ("tse-unificado", "Direito Constitucional e Administrativo Focado em Tribunais (Banca Cebraspe)", "Apostila PDF", "Direito Público", "155 págs", 1, 1, "Teoria grifada + jurisprudência do STF/STJ + Nova Lei de Licitações (Lei 14.133/2021)."),
        ("tse-unificado", "Simulado Nacional TSE Unificado (120 itens Certo/Errado + Gabarito Comentado)", "Caderno de Questões", "Simulado Completo", "34 págs", 1, 0, "Simulado inédito calibrado com os pesos oficiais do edital do TSE."),

        # CORREIOS
        ("correios-2026", "Código de Conduta Ética e Integridade dos Correios Comentado + 80 Questões", "Apostila PDF", "Ética Correios", "42 págs", 1, 1, "Leitura obrigatória que garante 100% dos pontos de Ética na prova dos Correios."),
        ("correios-2026", "Português e Matemática Básica no Estilo da Banca IBFC (250 Questões Comentadas)", "Caderno de Questões", "Português & Matemática", "88 págs", 1, 1, "Questões reais da banca IBFC separadas por assunto: crase, sintaxe, frações, regra de três e porcentagem."),
        ("correios-2026", "Resumo Visual de Geografia e Conhecimentos Gerais do Brasil (Mapas e Tabelas)", "Mapa Mental", "Conhecimentos Gerais", "50 págs", 1, 0, "Biomas, urbanização, matriz energética, transportes e divisão regional do IBGE."),

        # IBAMA
        ("ibama-2026", "Coletânea Completa de Legislação Ambiental Federal Esquematizada (IBAMA/ICMBio)", "Apostila PDF", "Legislação Ambiental", "160 págs", 1, 1, "Lei 9.985 (SNUC), Lei 12.651 (Código Florestal), Lei de Crimes Ambientais e Resoluções CONAMA."),
        ("ibama-2026", "Última Prova Oficial do IBAMA (Cebraspe) Resolvida e Comentada + Padrão Discursiva", "Prova Passada + Gabarito", "Provas Anteriores", "48 págs", 1, 0, "Análise completa da última prova de Analista Ambiental e Analista Administrativo."),

        # BB PREVISTO
        ("bb-previsto", "Plano de Estudo Antecipado Banco do Brasil (Pré-Edital 90 Dias) + Edital Verticalizado", "Edital Verticalizado", "Planejamento Pré-Edital", "24 págs", 1, 1, "Roteiro estratégico para fechar o edital do Banco do Brasil antes da publicação oficial."),
        ("bb-previsto", "Apostila de Vendas e Negociação + Conhecimentos Bancários para o Banco do Brasil", "Apostila PDF", "Vendas & Bancários", "140 págs", 1, 1, "Foco nas duas matérias de maior peso eliminatório e classificatório da Cesgranrio no BB."),
        ("bb-previsto", "Acervo de Provas Anteriores do Banco do Brasil (Cesgranrio 2021 e 2023 — Cadernos A, B e C)", "Prova Passada + Gabarito", "Provas Anteriores", "112 págs", 1, 0, "Todas as provas aplicadas nos dois últimos concursos do BB com gabaritos oficiais."),

        # INSS PREVISTO
        ("inss-previsto", "Direito Previdenciário do Zero ao Avançado (Leis 8.212, 8.213 e EC 103 Atualizadas)", "Apostila PDF", "Direito Previdenciário", "195 págs", 1, 1, "Cobre os 70 itens de Seguridade Social que representam quase 60% da prova do INSS."),
        ("inss-previsto", "Última Prova Oficial do INSS (Cebraspe 2022) + Gabarito Comentado Item por Item", "Prova Passada + Gabarito", "Provas Anteriores", "64 págs", 1, 1, "Prova real aplicada pela Cebraspe com resolução detalhada de cada assertiva."),
        ("inss-previsto", "Edital Verticalizado Pré-Edital INSS + Cronograma de Ciclos de Estudo", "Edital Verticalizado", "Planejamento Pré-Edital", "18 págs", 1, 0, "Organização semanal de estudos para quem tem de 2h a 4h disponíveis por dia."),

        # PRF PREVISTO
        ("prf-previsto", "Código de Trânsito Brasileiro (CTB Atualizado) + Resoluções do CONTRAN Esquematizadas", "Apostila PDF", "Legislação de Trânsito", "175 págs", 1, 1, "Disciplina mais importante da PRF (30 questões da prova objetiva)."),
        ("prf-previsto", "Prova Anterior PRF 2021 (Cebraspe) Comentada + Guia de Preparação para o TAF", "Prova Passada + Gabarito", "Provas Anteriores", "74 págs", 1, 0, "Prova completa resolvida + protocolo de treino para o Teste de Aptidão Física."),

        # RECEITA FEDERAL PREVISTO
        ("receita-previsto", "Guia Completo da Reforma Tributária (EC 132 — IBS/CBS) + Direito Tributário FGV", "Apostila PDF", "Direito Tributário", "122 págs", 1, 1, "Atualização indispensável para o próximo concurso de Auditor e Analista da Receita Federal."),
        ("receita-previsto", "Provas da Receita Federal 2023 (Banca FGV — Auditor e Analista) Comentadas", "Prova Passada + Gabarito", "Provas Anteriores", "140 págs", 1, 0, "Cadernos de provas objetivas e discursivas do último concurso da RFB."),

        # CNU HISTÓRICO
        ("cnu-historico", "Pacote Oficial de Provas Reais CNU (Blocos 1 a 8 — Manhã e Tarde) + Gabaritos Definitivos", "Prova Passada + Gabarito", "Provas Oficiais CNU", "320 págs", 1, 1, "Acervo histórico integral da 1ª edição do Concurso Nacional Unificado."),
        ("cnu-historico", "Raio-X Estatístico de Notas de Corte e Relação Candidato/Vaga de Todos os Cargos do CNU", "Edital Verticalizado", "Estatísticas & Corte", "26 págs", 1, 1, "Comparativo completo das notas mínimas de aprovação na ampla concorrência e cotas."),

        # TJ-SP HISTÓRICO
        ("tjsp-historico", "Última Prova Real TJ-SP Escrevente (100 Questões Vunesp) Comentada Alternativa por Alternativa", "Prova Passada + Gabarito", "Prova Real Vunesp", "82 págs", 1, 1, "As 100 questões do último concurso do TJ-SP resolvidas pelos professores."),
        ("tjsp-historico", "Apostila de Normas da Corregedoria Geral da Justiça do TJ-SP + Bloco de Direito Grifado", "Apostila PDF", "Direito & Normas CGJ", "134 págs", 1, 1, "Toda a legislação seca com destaques nos artigos mais cobrados pela Vunesp."),

        # BACEN HISTÓRICO
        ("bacen-historico", "Prova Objetiva e Discursiva BACEN 2024 (TI e Economia) + Espelho de Correção Cebraspe", "Prova Passada + Gabarito", "Provas Anteriores", "76 págs", 1, 1, "Caderno de prova real do Banco Central com padrões oficiais de resposta discursiva."),

        # CGU HISTÓRICO
        ("cgu-historico", "Provas CGU (Técnico e Auditor Federal — Banca FGV) Comentadas + AFO Esquematizado", "Prova Passada + Gabarito", "Provas Anteriores", "115 págs", 1, 1, "Excelente material base para qualquer concurso da área de Controle e Auditoria.")
    ]

    for m in materiais_data:
        cur.execute(
            """
            INSERT INTO materiais (
                concurso_id, titulo, categoria, disciplina, paginas, gratuito, destaque, resumo_conteudo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            m
        )

    # Seed Rumores da Internet (Radar IA)
    rumores_data = [
        (
            "bb-previsto", "BB",
            "Banco do Brasil esgota cadastro reserva em mais de 80% dos polos e acelera estudos com a Cesgranrio para novo edital",
            "Folha Dirigida / Sindicato dos Bancários / Fóruns de Concurseiros",
            "Capturado há 2 horas pela IA",
            "Banca Contratada / Estudos Finais",
            92,
            "Alta confiabilidade: O contrato com a Fundação Cesgranrio segue vigente e o banco confirmou publicamente que realiza levantamentos contínuos de vagas para Agente Comercial e Agente de Tecnologia.",
            48
        ),
        (
            "inss-previsto", "INSS",
            "Processo SEI no MGI avança com solicitação de 1.500+ vagas para Técnico e Analista do Seguro Social para reduzir fila previdenciária",
            "Movimentação SEI/MGI + Portais Direção & Estratégia",
            "Capturado há 5 horas pela IA",
            "Pedido em Análise no MGI / Comissão Interna",
            88,
            "Alta confiabilidade: Mais de 19 mil cargos vagos no quadro do INSS; entrevistas recentes da presidência da autarquia confirmam negociação ativa com o Ministério da Gestão (MGI).",
            63
        ),
        (
            "prf-previsto", "PRF",
            "Nota Técnica da PRF solicita criação de cargos para atingir 18 mil policiais rodoviários e 235 vagas de Agente Administrativo",
            "Ofício Oficial SEI PRF/MJSP + Comunidades Policiais no Telegram",
            "Capturado ontem pela IA",
            "Solicitação Formal Enviada ao Ministério",
            79,
            "Confiabilidade moderada-alta: Documento oficial existe e foi protocolado no MJSP; depende de autorização orçamentária na LOA para publicação do edital.",
            37
        ),
        (
            "receita-previsto", "RFB",
            "Entidades sindicais (Sindifisco e Sindireceita) cobram novo concurso da Receita Federal para implementação da Reforma Tributária",
            "Portal Sindifisco Nacional + Fóruns da Área Fiscal",
            "Capturado há 2 dias pela IA",
            "Pressão Institucional + Pedido Anual MGI",
            71,
            "Confiabilidade moderada: Concurso de preparação longa (12 a 18 meses de estudo necessários); recomendado iniciar base em Direito Tributário e Contabilidade.",
            29
        )
    ]

    for r in rumores_data:
        cur.execute(
            """
            INSERT INTO rumores_web (
                concurso_id, orgao_sigla, titulo_noticia, fonte_portal, data_captura,
                estagio_maturidade, confianca_ia, analise_ia, votos_comunidade
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            r
        )

    # Seed initial leads & telemetry for MVP demonstration
    leads_seed = [
        ("Mariana Souza", "mariana.concurseira@email.com", "Bancária", "Alertas WhatsApp de Rumores e Editais", "R$ 29,90/mês"),
        ("Rafael Oliveira", "(11) 98765-4321", "Policial", "Cronograma Adaptativo por IA", "R$ 29,90/mês"),
        ("Fernanda Lima", "fernanda.tribunais@email.com", "Tribunais", "Raio-X e Edital Verticalizado Automático", "R$ 49,90/mês")
    ]
    for l in leads_seed:
        cur.execute(
            "INSERT INTO leads_premium (nome, contato, carreira_foco, recurso_favorito, faixa_preco) VALUES (?, ?, ?, ?, ?)",
            l
        )

    eventos_seed = [
        ("busca", "Filtro por status: aberto"),
        ("busca", "Pesquisa por: Polícia Federal"),
        ("busca", "Filtro por status: previsto"),
        ("radar_view", "Visualização do Termômetro IA de Rumores"),
        ("material_acesso", "Download: Edital Verticalizado PF"),
        ("material_acesso", "Download: Apostila Conhecimentos Bancários Caixa"),
        ("material_acesso", "Download: Provas Passadas CNU"),
        ("chat_ia", "Consulta sobre INSS e Banco do Brasil")
    ]
    for ev in eventos_seed:
        cur.execute("INSERT INTO metricas_mvp (tipo_evento, detalhe) VALUES (?, ?)", ev)

    conn.commit()
    conn.close()

