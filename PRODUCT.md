# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Concurseiros (Candidatos a Concursos Públicos no Brasil):**
  - **Iniciantes / Nível Médio:** Foco em certames de grande volume (ex.: Caixa, Correios, INSS, TJ-SP), buscando descobrir editais abertos a tempo e encontrar apostilas e provas passadas sem dispersão.
  - **Avançados / Pré-Edital:** Foco em carreiras policiais (PF, PRF), tribunais e áreas fiscais, monitorando movimentações antecipadas para iniciar o estudo antes da publicação oficial do edital.
  - **Trabalhadores / Conciliadores de Rotina:** Candidatos que estudam entre 2 e 6 horas por dia (em navegadores desktop ou mobile) e dependem de curadoria direta, editais verticalizados e zero ruído visual para aproveitar o tempo líquido de estudo.
- **Parceiros B2B de Conteúdo (secundários):** Editoras, plataformas de questões, cursinhos preparatórios e professores independentes podem complementar o catálogo por licenciamento ou indicação afiliada; não são o público central nem a base da proposta de preparação.

## Product Purpose

**Aprova+ IA** é uma plataforma de preparação para concursos que ajuda o candidato a escolher um objetivo, transformar esse objetivo em uma rotina de estudos, praticar, revisar e acompanhar a própria evolução. A busca e o monitoramento de concursos apoiam a preparação, mas não são o produto inteiro nem o principal motivo para usar a plataforma.

O sucesso do produto significa que o candidato consegue:
1. Definir objetivo, perfil e disponibilidade e iniciar um plano de estudos acionável;
2. Praticar, revisar e acompanhar seu progresso ao longo do tempo;
3. Encontrar concursos nos **3 horizontes temporais** (**Ativos com Edital Aberto**, **Previstos na Internet / Radar IA** e **Históricos / Já Aconteceram**) e conectar oportunidades e materiais ao plano de preparação.

## Positioning

Diferentemente de portais centrados apenas em listagens, o **Aprova+ IA** coloca a preparação diária do candidato no centro: plano de estudos, prática, revisão e acompanhamento. A descoberta de concursos, o Radar IA e os materiais por edital são recursos conectados a essa jornada. Conteúdos de cursinhos ou editoras podem ser complementares, mas não substituem a experiência de preparação própria da plataforma.

## Operating Context

- **Ambiente e Rotina de Uso:** Sessões diárias de estudo de 2 a 6 horas em navegadores web (desktop e mobile), exigindo alta densidade informacional, tabelas escaneáveis e leitura confortável por longos períodos.
- **Fontes e Rituais do Concurseiro:** Consulta a publicações no Diário Oficial da União (DOU) e autorizações do MGI, acompanhamento de dispensas de licitação e definição de bancas organizadoras (ex.: Cebraspe, FGV, FCC, Cesgranrio), análise de notas de corte históricas, resolução de provas anteriores e checklist de disciplinas estudadas por peso no edital.
- **Fluxo Operacional na Plataforma (6 Superfícies/Abas):**
  1. **Preparação / Copiloto e Match IA (Home):** Ponto inicial da experiência para definir objetivo, consultar recomendações, seguir cronograma, praticar, revisar e acompanhar evolução.
  2. **Concursos (3 Status):** Busca e filtragem por status (`aberto`, `previsto`, `encerrado`), área, escolaridade, UF e salário; resultados informam e alimentam a preparação.
  3. **Materiais por Concurso:** Repositório filtrado por certame e categoria (editais verticalizados, apostilas, mapas mentais e provas anteriores), com marcação de progresso.
  4. **Radar IA (Na Internet):** Feed de movimentações e rumores com fontes rastreáveis, índice de probabilidade e validação comunitária.
  5. **Planos e Acesso:** Apresentação clara do teste de 14 dias, do freemium básico limitado e das assinaturas pagas; limites e preços são decisões a validar.
  6. **Minha Conta:** Autenticação, gerenciamento de perfil de estudo, concursos favoritos e progresso.

## Capabilities and Constraints

- **Arquitetura Atual (MVP Full-Stack + Fallback Estático):**
  - **Frontend:** SPA modular em HTML5, CSS3 e JavaScript puro (`frontend/`), hospedável estaticamente no GitHub Pages com persistência local (`localStorage` + `fallbackData.js`).
  - **Backend Local/API:** Servidor Python com FastAPI e banco relacional SQLite (`backend/database/aprova_mais.db`), expondo rotas REST para autenticação (`/api/auth`), concursos (`/api/concursos`), materiais e gerador de guias (`/api/materiais`), radar comunitário (`/api/radar`), motor IA (`/api/ia`) e captação de leads VIP (`/api/mvp/leads-premium`).
- **Modelo de Acesso e Negócio (direção do produto):** Teste de 14 dias para experimentar a preparação; após o teste, permanece uma experiência freemium básica e limitada, enquanto o acesso ampliado requer assinatura paga. Todos os planos de assinatura são pagos. Assinaturas são a receita principal; afiliados e parcerias de conteúdo são complementares, opcionais e não substituem a preparação do Aprova+ IA. Preços, limites e funcionalidades de cada nível ainda precisam ser validados.
- **Terminologia de Domínio Obrigatória:** *Concursos Ativos (Com Edital Aberto)*, *Previstos na Internet (Radar IA / Termômetro IA)*, *Já Aconteceram (Históricos)*, *Banca Organizadora*, *Nota de Corte*, *Edital Verticalizado*, *Raio-X do Edital*.

## Brand Commitments

- **Nome e Identidade:** **Aprova+ IA** (selo `A+`, subtítulo *Central de Concursos · Radar da Internet · Materiais*).
- **Voz e Postura:** Direta, transparente quanto às fontes de cada rumor ou edital, isenta de sensacionalismo (*clickbait*) e orientada à execução prática do estudo.

## Evidence on Hand

- **Base de Dados Real do MVP (`backend/database/seed.py` e `frontend/js/api/fallbackData.js`):** 13 concursos públicos estruturados nos 3 status, 34 materiais de estudo vinculados e 4 rumores rastreados no Radar IA.
- **Gerador Dinâmico de Materiais (`backend/services/pdf_generator.py`):** Emissão de guias e apostilas verticalizadas para download imediato.
- **Artefatos Estratégicos e Financeiros:** Business Model Canvas atualizado (`canvas_corrigido.svg`, `canvas_corrigido.png`, `docs/canvas_corrigido.pdf`), especificação teórica e métricas de validação para amostra de 400 concurseiros (`MVP_Teorico_Completo_AprovaMais.md`) e planilha financeira de 5 anos (`docs/Modelagem_Financeira_AprovaMais.xlsx`).
- **Ausências Confirmadas (Não Fabricar):** O projeto ainda não possui depoimentos reais de alunos aprovados, números auditados de aprovação em massa, certificações governamentais nem cobertura de imprensa externa; nenhuma peça ou interface deve inventar provas sociais, citações de clientes ou estatísticas de aprovação não verificadas.

## Product Principles

1. **Preparação em Primeiro Lugar:** A tela inicial e a jornada principal devem ajudar o candidato a estudar, praticar e acompanhar sua evolução; busca e Radar IA direcionam essa preparação.
2. **Transparência de Fonte contra Clickbait:** Rumores e previsões pré-edital nunca são apresentados como certezas absolutas; devem exibir fonte identificável, classificação de probabilidade (Termômetro IA) e validação da comunidade.
3. **Densidade Operacional sem Ruído:** Priorizar leitura rápida de metadados críticos (vagas, remuneração, banca, datas, nota de corte e pesos de disciplinas) acima de ornamentos visuais que atrasem a rotina do candidato.
4. **Estudo Acionável Imediato:** O candidato deve conseguir transformar seu objetivo em plano, executar atividades de estudo e registrar seu progresso; materiais e editais apoiam essas ações.
5. **Acesso e Monetização Transparentes:** O teste dura 14 dias; ao terminar, o usuário pode continuar no básico limitado ou escolher uma assinatura paga. Não apresentar afiliados de cursos como receita central nem prometer acesso gratuito ilimitado.

## Accessibility & Inclusion

- **Conforto Visual em Longas Sessões (2–6h/dia):** Contraste tipográfico elevado (nível WCAG AA+ verificado sobre superfícies claras), hierarquia tabular legível (`tabular-nums`) para comparação de salários, vagas e notas de corte, navegação clara por teclado (`:focus-visible`) e funcionamento pleno tanto em conexões/dispositivos móveis quanto em desktops, inclusive em modo estático offline/fallback quando a API não estiver ativa.
