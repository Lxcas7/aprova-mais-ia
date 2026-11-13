# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Concurseiros (Candidatos a Concursos Públicos no Brasil):**
  - **Iniciantes / Nível Médio:** Foco em certames de grande volume (ex.: Caixa, Correios, INSS, TJ-SP), buscando descobrir editais abertos a tempo e encontrar apostilas e provas passadas sem dispersão.
  - **Avançados / Pré-Edital:** Foco em carreiras policiais (PF, PRF), tribunais e áreas fiscais, monitorando movimentações antecipadas para iniciar o estudo antes da publicação oficial do edital.
  - **Trabalhadores / Conciliadores de Rotina:** Candidatos que estudam entre 2 e 6 horas por dia (em navegadores desktop ou mobile) e dependem de curadoria direta, editais verticalizados e zero ruído visual para aproveitar o tempo líquido de estudo.
- **Parceiros B2B de Conteúdo:** Cursinhos preparatórios, editoras de apostilas, plataformas de questões e professores independentes que recebem tráfego qualificado por edital via modelo de afiliados (CPA) e destaques patrocinados.

## Product Purpose

**Aprova+ IA** é uma plataforma centralizada de inteligência e curadoria para concursos públicos que unifica a jornada de descoberta, monitoramento e estudo em um único espaço operacional. O produto existe para eliminar o tempo perdido em dezenas de portais fragmentados, sites de bancas organizadoras e boatos sem fonte verificada na internet.

O sucesso do produto significa que o candidato consegue:
1. Filtrar rapidamente concursos nos **3 horizontes temporais** (**Ativos com Edital Aberto**, **Previstos na Internet / Radar IA** e **Históricos / Já Aconteceram**);
2. Avaliar a probabilidade real de publicação de um edital previsto com base em fontes rastreáveis;
3. Acessar imediatamente o material de estudo específico vinculado àquele certame (edital verticalizado, apostilas direcionadas, cadernos de questões e provas anteriores) e registrar seu progresso.

## Positioning

Diferentemente de portais estáticos de listagem (poluídos por anúncios e *clickbait*) ou de assinaturas genéricas e caras de cursinhos tradicionais, o **Aprova+ IA** conecta em tela única os **3 status de concursos** (**Ativos**, **Previstos na Internet via Termômetro de Confiança IA** e **Encerrados com notas de corte e histórico de bancas**) diretamente ao **acervo de materiais específicos e edital verticalizado de cada concurso**, operando como um agregador inteligente com validação comunitária de rumores.

## Operating Context

- **Ambiente e Rotina de Uso:** Sessões diárias de estudo de 2 a 6 horas em navegadores web (desktop e mobile), exigindo alta densidade informacional, tabelas escaneáveis e leitura confortável por longos períodos.
- **Fontes e Rituais do Concurseiro:** Consulta a publicações no Diário Oficial da União (DOU) e autorizações do MGI, acompanhamento de dispensas de licitação e definição de bancas organizadoras (ex.: Cebraspe, FGV, FCC, Cesgranrio), análise de notas de corte históricas, resolução de provas anteriores e checklist de disciplinas estudadas por peso no edital.
- **Fluxo Operacional na Plataforma (6 Superfícies/Abas):**
  1. **Concursos (3 Status):** Painel de busca e filtragem por status (`aberto`, `previsto`, `encerrado`), área, escolaridade, UF e salário, com modal de Raio-X de disciplinas por peso.
  2. **Radar IA (Na Internet):** Feed de rumores monitorados na web com índice percentual de probabilidade (Termômetro IA), votos da comunidade e submissão colaborativa de novas movimentações.
  3. **Materiais por Concurso:** Repositório filtrado por certame e categoria (Editais Verticalizados, Apostilas PDF, Mapas Mentais, Provas Anteriores) com geração dinâmica de guias e marcação de concluídos.
  4. **Copiloto e Match IA:** Simulador de compatibilidade de perfil com concursos, gerador de cronograma semanal e assistente de dúvidas 24/7.
  5. **Plano PRO (Smoke Test — Fase 2):** Página de validação de demanda e Lista VIP para recursos avançados futuros (Alertas WhatsApp em tempo real, Corretor IA de discursivas e Cronograma Adaptativo a R$ 29,90/mês).
  6. **Minha Conta:** Autenticação, gerenciamento de perfil de estudo, concursos favoritados e telemetria de progresso.

## Capabilities and Constraints

- **Arquitetura Atual (MVP Full-Stack + Fallback Estático):**
  - **Frontend:** SPA modular em HTML5, CSS3 e JavaScript puro (`frontend/`), hospedável estaticamente no GitHub Pages com persistência local (`localStorage` + `fallbackData.js`).
  - **Backend Local/API:** Servidor Python com FastAPI e banco relacional SQLite (`backend/database/aprova_mais.db`), expondo rotas REST para autenticação (`/api/auth`), concursos (`/api/concursos`), materiais e gerador de guias (`/api/materiais`), radar comunitário (`/api/radar`), motor IA (`/api/ia`) e captação de leads VIP (`/api/mvp/leads-premium`).
- **Modelo Operacional e de Negócio:** Operação enxuta (*concierge* / semi-automatizada) gratuita para o concurseiro no MVP (monetizada via afiliados B2B com CPA médio estimado em R$ 35/venda), mantendo o **Plano Aprova+ PRO** estritamente como *Smoke Test* (captura de leads e pesquisa de disposição de pagamento) antes do desenvolvimento de cobrança recorrente ou integrações externas pagas na Fase 2.
- **Terminologia de Domínio Obrigatória:** *Concursos Ativos (Com Edital Aberto)*, *Previstos na Internet (Radar IA / Termômetro IA)*, *Já Aconteceram (Históricos)*, *Banca Organizadora*, *Nota de Corte*, *Edital Verticalizado*, *Raio-X do Edital*.

## Brand Commitments

- **Nome e Identidade:** **Aprova+ IA** (selo `A+`, subtítulo *Central de Concursos · Radar da Internet · Materiais*).
- **Voz e Postura:** Direta, transparente quanto às fontes de cada rumor ou edital, isenta de sensacionalismo (*clickbait*) e orientada à execução prática do estudo.

## Evidence on Hand

- **Base de Dados Real do MVP (`backend/database/seed.py` e `frontend/js/api/fallbackData.js`):** 13 concursos públicos estruturados nos 3 status, 34 materiais de estudo vinculados e 4 rumores rastreados no Radar IA.
- **Gerador Dinâmico de Materiais (`backend/services/pdf_generator.py`):** Emissão de guias e apostilas verticalizadas para download imediato.
- **Artefatos Estratégicos e Financeiros:** Business Model Canvas revisado (`canvas_corrigido.png`, `docs/canvas_corrigido.pdf`), especificação teórica e métricas de validação para amostra de 400 concurseiros (`MVP_Teorico_Completo_AprovaMais.md`) e planilha financeira de 5 anos (`docs/Modelagem_Financeira_AprovaMais.xlsx`).
- **Ausências Confirmadas (Não Fabricar):** O projeto ainda não possui depoimentos reais de alunos aprovados, números auditados de aprovação em massa, certificações governamentais nem cobertura de imprensa externa; nenhuma peça ou interface deve inventar provas sociais, citações de clientes ou estatísticas de aprovação não verificadas.

## Product Principles

1. **Três Horizontes, Um Único Fluxo:** Todo concurso (Ativo, Previsto na Internet ou Histórico) deve coexistir na mesma arquitetura de busca e levar diretamente aos materiais específicos daquele edital em no máximo um clique.
2. **Transparência de Fonte contra Clickbait:** Rumores e previsões pré-edital nunca são apresentados como certezas absolutas; devem exibir fonte identificável, classificação de probabilidade (Termômetro IA) e validação da comunidade.
3. **Densidade Operacional sem Ruído:** Priorizar leitura rápida de metadados críticos (vagas, remuneração, banca, datas, nota de corte e pesos de disciplinas) acima de ornamentos visuais que atrasem a rotina do candidato.
4. **Estudo Acionável Imediato:** A descoberta de um edital só se completa quando o usuário consegue baixar o guia verticalizado, acessar as provas anteriores e marcar seu progresso real de estudo.
5. **Validação Enxuta antes de Escala:** Recursos de assinatura (Aprova+ PRO) são validados via *Smoke Test* transparente e métricas de intenção real antes de adicionar complexidade de faturamento ou infraestrutura pesada.

## Accessibility & Inclusion

- **Conforto Visual em Longas Sessões (2–6h/dia):** Contraste tipográfico elevado (nível WCAG AA+ verificado sobre superfícies claras), hierarquia tabular legível (`tabular-nums`) para comparação de salários, vagas e notas de corte, navegação clara por teclado (`:focus-visible`) e funcionamento pleno tanto em conexões/dispositivos móveis quanto em desktops, inclusive em modo estático offline/fallback quando a API não estiver ativa.
