/**
 * Aprova+ IA — REST API Client
 * - Em ambiente local com servidor Python (127.0.0.1:8000): consome a API FastAPI + SQLite3 real.
 * - No GitHub Pages (github.io) ou modo estático: utiliza motor em memória com persistência em localStorage e gerador Blob para download real de apostilas.
 */
(function () {
  const isGitHubPages = window.location.hostname.includes('github.io');
  const API_BASE = (!isGitHubPages && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000/api';

  let backendOnline = false;

  // Estado persistido no navegador para uso no GitHub Pages / Modo Estático
  const STORAGE_KEY = 'aprova_mais_mvp_state_v1';
  function getLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const initial = {
      concursos: JSON.parse(JSON.stringify(window.AprovaFallback.concursos)),
      rumores: JSON.parse(JSON.stringify(window.AprovaFallback.rumores)),
      telemetria: { buscas: 5, materiais_acessados: 6, radar_views: 4, consultas_ia: 3, leads_premium: 3, total_interacoes: 21 },
      leads: [
        { nome: "Mariana Souza", contato: "mariana.concursos@email.com", carreira_foco: "Bancária (Caixa / BB)", recurso_favorito: "Alertas WhatsApp de Rumores e Editais", faixa_preco: "R$ 29,90/mês" },
        { nome: "Rafael Oliveira", contato: "(11) 98765-4321", carreira_foco: "Policial (PF / PRF)", recurso_favorito: "Cronograma Adaptativo por IA", faixa_preco: "R$ 29,90/mês" },
        { nome: "Camila Ferreira", contato: "camila.tribunais@email.com", carreira_foco: "Tribunais (TSE / TJ)", recurso_favorito: "Corretor de Discursivas IA (Padrão Banca)", faixa_preco: "R$ 39,90/mês" }
      ]
    };
    saveLocalState(initial);
    return initial;
  }

  function saveLocalState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  async function request(endpoint, options = {}) {
    if (isGitHubPages) {
      throw new Error('GitHub Pages static mode');
    }
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    backendOnline = true;
    updateStatusBadge(true);
    return await res.json();
  }

  function updateStatusBadge(isOnline) {
    const badge = document.getElementById('api-conn-badge');
    if (!badge) return;
    if (isOnline) {
      badge.className = 'api-status-badge';
      badge.innerHTML = '🟢 Backend FastAPI + SQLite Conectado';
    } else if (isGitHubPages) {
      badge.className = 'api-status-badge';
      badge.innerHTML = '🟢 GitHub Pages Online (Persistência Local Ativa)';
    } else {
      badge.className = 'api-status-badge offline';
      badge.innerHTML = '🟡 Modo Local (Rode iniciar_mvp.bat para API Python + SQLite)';
    }
  }

  window.AprovaAPI = {
    getBaseUrl() {
      return API_BASE;
    },

    isBackendOnline() {
      return backendOnline;
    },

    async checkHealth() {
      try {
        return await request('/health');
      } catch (e) {
        backendOnline = false;
        updateStatusBadge(false);
        return { status: isGitHubPages ? 'github_pages' : 'offline' };
      }
    },

    async listarConcursos(params = {}) {
      try {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', params.status);
        if (params.area) qs.set('area', params.area);
        if (params.escolaridade) qs.set('escolaridade', params.escolaridade);
        if (params.uf) qs.set('uf', params.uf);
        if (params.q) qs.set('q', params.q);
        if (params.apenas_salvos) qs.set('apenas_salvos', 'true');
        return await request(`/concursos?${qs.toString()}`);
      } catch (e) {
        updateStatusBadge(false);
        const st = getLocalState();
        if (params.q || (params.area && params.area !== 'todas') || (params.status && params.status !== 'todos')) {
          st.telemetria.buscas += 1;
          saveLocalState(st);
        }
        const list = st.concursos.filter(c => {
          if (params.apenas_salvos && !c.salvo) return false;
          if (params.status && params.status !== 'todos' && c.status !== params.status) return false;
          if (params.area && params.area !== 'todas' && c.area !== params.area) return false;
          if (params.escolaridade && params.escolaridade !== 'todos' && !c.escolaridade.includes(params.escolaridade)) return false;
          if (params.uf && params.uf !== 'todas' && c.uf !== params.uf) return false;
          if (params.q && !`${c.sigla} ${c.titulo} ${c.orgao} ${c.banca} ${c.cargos}`.toLowerCase().includes(params.q.toLowerCase())) return false;
          return true;
        });
        const all = st.concursos;
        return {
          resumo: {
            total: all.length,
            abertos: all.filter(x => x.status === 'aberto').length,
            previstos: all.filter(x => x.status === 'previsto').length,
            encerrados: all.filter(x => x.status === 'encerrado').length,
            salvos: all.filter(x => x.salvo).length,
            vagas_abertas: 9625
          },
          concursos: list
        };
      }
    },

    async obterConcurso(id) {
      try {
        return await request(`/concursos/${id}`);
      } catch (e) {
        const st = getLocalState();
        return st.concursos.find(c => c.id === id) || st.concursos[0];
      }
    },

    async alternarFavorito(id) {
      try {
        return await request(`/concursos/${id}/favorito`, { method: 'POST' });
      } catch (e) {
        const st = getLocalState();
        const c = st.concursos.find(x => x.id === id);
        if (c) c.salvo = !c.salvo;
        saveLocalState(st);
        return { id, salvo: c ? c.salvo : false };
      }
    },

    async listarMateriais(concursoId = 'todos', categoria = 'todas') {
      try {
        const qs = new URLSearchParams({ concurso_id: concursoId, categoria });
        return await request(`/materiais?${qs.toString()}`);
      } catch (e) {
        const st = getLocalState();
        let mats = [];
        st.concursos.forEach(c => {
          if (concursoId === 'todos' || c.id === concursoId) {
            c.materiais.forEach(m => {
              if (categoria === 'todas' || m.categoria === categoria) {
                mats.push({ ...m, concurso_id: c.id, concurso_titulo: c.titulo, concurso_sigla: c.sigla, concurso_banca: c.banca });
              }
            });
          }
        });
        const est = mats.filter(x => x.estudado).length;
        return { total: mats.length, estudados: est, progresso_pct: mats.length ? Math.round((est / mats.length) * 100) : 0, materiais: mats };
      }
    },

    async alternarMaterialEstudado(materialId) {
      try {
        return await request(`/materiais/${materialId}/estudado`, { method: 'POST' });
      } catch (e) {
        const st = getLocalState();
        let novo = false;
        st.concursos.forEach(c => {
          c.materiais.forEach(m => {
            if (m.id === materialId) {
              m.estudado = !m.estudado;
              novo = m.estudado;
            }
          });
        });
        st.telemetria.materiais_acessados += 1;
        saveLocalState(st);
        return { id: materialId, estudado: novo };
      }
    },

    baixarMaterial(materialId) {
      if (backendOnline && !isGitHubPages) {
        window.open(`${API_BASE}/materiais/${materialId}/download`, '_blank');
        window.AprovaUtils.showToast('📥 Gerando apostila/guia verticalizado via Backend FastAPI...', '#2563eb');
        setTimeout(() => window.AprovaApp.atualizarTelemetriaTopo(), 700);
        return;
      }

      // Geração instantânea de arquivo no navegador (GitHub Pages / Modo Estático)
      const st = getLocalState();
      let matEncontrado = null;
      let concEncontrado = null;
      st.concursos.forEach(c => {
        c.materiais.forEach(m => {
          if (m.id === materialId) {
            matEncontrado = m;
            concEncontrado = c;
          }
        });
      });

      if (!matEncontrado || !concEncontrado) return;
      st.telemetria.materiais_acessados += 1;
      saveLocalState(st);

      const disciplinasTxt = (concEncontrado.disciplinas || [])
        .map((d, i) => `  ${i + 1}. ${d.nome} — Questões: ${d.questoes} | Peso: ${d.peso} | Prioridade IA: ${d.prioridade}`)
        .join('\n');

      const conteudo = [
        '================================================================================',
        'APROVA+ IA — CENTRAL INTELIGENTE DE CONCURSOS PÚBLICOS (MATERIAL OFICIAL DO MVP)',
        '================================================================================',
        '',
        `MATERIAL: ${matEncontrado.titulo}`,
        `CATEGORIA: ${matEncontrado.categoria} (${matEncontrado.formato} • ${matEncontrado.paginas})`,
        `CONCURSO VINCULADO: ${concEncontrado.sigla} — ${concEncontrado.titulo}`,
        `ÓRGÃO: ${concEncontrado.orgao}`,
        `BANCA ORGANIZADORA: ${concEncontrado.banca}`,
        `REMUNERAÇÃO: ${concEncontrado.salario} | VAGAS: ${concEncontrado.vagas}`,
        `STATUS ATUAL: ${concEncontrado.status_label}`,
        '',
        '--------------------------------------------------------------------------------',
        '1. DIAGNÓSTICO DE INTELIGÊNCIA ARTIFICIAL (APROVA+ IA)',
        '--------------------------------------------------------------------------------',
        concEncontrado.resumo_ia,
        '',
        `Movimentação / Radar Web: ${concEncontrado.tendencia_rumor}`,
        `Nota de Corte de Referência: ${concEncontrado.nota_corte_historica}`,
        '',
        '--------------------------------------------------------------------------------',
        '2. MATRIZ DE DISCIPLINAS VERTICALIZADAS POR PRIORIDADE',
        '--------------------------------------------------------------------------------',
        disciplinasTxt,
        '',
        '--------------------------------------------------------------------------------',
        '3. CHECKLIST DE ESTUDO RECOMENDADO PELA IA',
        '--------------------------------------------------------------------------------',
        '[ ] Passo 1: Ler a teoria direcionada das disciplinas de Prioridade CRÍTICA.',
        `[ ] Passo 2: Resolver 50 questões recentes da banca ${concEncontrado.banca}.`,
        '[ ] Passo 3: Revisar os erros através de Mapas Mentais e marcar como Estudado na plataforma.',
        '================================================================================'
      ].join('\n');

      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AprovaMais_${concEncontrado.sigla}_Material_${materialId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      window.AprovaUtils.showToast(`📥 Guia "${matEncontrado.titulo}" baixado com sucesso!`, '#2563eb');
      window.AprovaApp.atualizarTelemetriaTopo();
    },

    async listarRumores() {
      try {
        return await request('/radar');
      } catch (e) {
        const st = getLocalState();
        st.telemetria.radar_views += 1;
        saveLocalState(st);
        return { total: st.rumores.length, rumores: st.rumores };
      }
    },

    async enviarRumor(payload) {
      try {
        return await request('/radar', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        const st = getLocalState();
        const txt = `${payload.titulo_noticia} ${payload.fonte_portal}`.toLowerCase();
        let confianca = 64;
        let estagio = 'Rumor Inicial em Verificação';
        if (txt.includes('banca') || txt.includes('dispensa') || txt.includes('contrato')) {
          confianca = 91;
          estagio = 'Banca em Contratação / Edital Iminente';
        } else if (txt.includes('comissão') || txt.includes('autorizado') || txt.includes('portaria')) {
          confianca = 84;
          estagio = 'Comissão Formada / Autorizado';
        }
        const novo = {
          id: Date.now(),
          concurso_id: 'geral',
          orgao_sigla: payload.orgao_sigla.toUpperCase(),
          titulo_noticia: payload.titulo_noticia,
          fonte_portal: payload.fonte_portal,
          data_captura: 'Enviado agora (Cocriação)',
          estagio_maturidade: estagio,
          confianca_ia: confianca,
          analise_ia: `Notícia submetida pela comunidade e classificada automaticamente pelo motor NLP como "${estagio}" (${confianca}% de confiança).`,
          votos_comunidade: 1
        };
        st.rumores.unshift(novo);
        st.telemetria.radar_views += 1;
        saveLocalState(st);
        return { ...novo, mensagem: 'Rumor registrado!' };
      }
    },

    async votarRumor(rumorId) {
      try {
        return await request(`/radar/${rumorId}/votar`, { method: 'POST' });
      } catch (e) {
        const st = getLocalState();
        const r = st.rumores.find(x => x.id === rumorId);
        if (r) r.votos_comunidade++;
        saveLocalState(st);
        return { id: rumorId, votos_comunidade: r ? r.votos_comunidade : 1 };
      }
    },

    async enviarChatIA(mensagem) {
      try {
        return await request('/ia/chat', { method: 'POST', body: JSON.stringify({ mensagem }) });
      } catch (e) {
        const st = getLocalState();
        st.telemetria.consultas_ia += 1;
        saveLocalState(st);
        const q = mensagem.toLowerCase();
        for (const c of st.concursos) {
          if (q.includes(c.sigla.toLowerCase()) || q.includes(c.titulo.toLowerCase().split(' ')[0])) {
            return {
              resposta: `🤖 <strong>Diagnóstico Aprova+ IA para ${c.sigla} (${c.titulo}):</strong><br>• <strong>Status:</strong> ${c.status_label} (${c.probabilidade_ia}% índice IA)<br>• <strong>Banca:</strong> ${c.banca} | <strong>Remuneração:</strong> ${c.salario}<br>• <strong>Análise IA:</strong> ${c.resumo_ia}<br>• <strong>Materiais vinculados:</strong> ${c.materiais.length} materiais gratuitos prontos para download.`,
              concurso_sugerido: c.id
            };
          }
        }
        return {
          resposta: `🤖 <strong>Copiloto Aprova+ IA:</strong> Monitoramos atualmente <strong>5 concursos com edital aberto</strong> (PF, Caixa, TSE, Correios, IBAMA — 9.625 vagas), <strong>4 previstos na internet</strong> (Banco do Brasil 92%, INSS 88%, PRF 79%, Receita Federal 71%) e <strong>4 históricos com provas passadas</strong> (CNU, TJ-SP, BACEN, CGU). Sobre qual deles você quer ver a matriz de disciplinas e materiais?`,
          concurso_sugerido: 'pf-2026'
        };
      }
    },

    async calcularMatchPerfil(payload) {
      try {
        return await request('/ia/match-perfil', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        const st = getLocalState();
        st.telemetria.consultas_ia += 1;
        saveLocalState(st);
        const horasSem = (payload.horas_por_dia || 4) * 6;
        const candidatos = st.concursos
          .filter(c => c.status !== 'encerrado')
          .map(c => {
            let score = 65;
            const motivos = [];
            if (c.area.toLowerCase().includes((payload.area_interesse || '').toLowerCase())) {
              score += 22;
              motivos.push(`Carreira ${c.area} alinhada ao seu objetivo`);
            }
            if (payload.escolaridade === 'Superior' || c.escolaridade.includes('Médio')) {
              score += 10;
              motivos.push(`Compatível com escolaridade (${c.escolaridade})`);
            }
            return {
              id: c.id,
              sigla: c.sigla,
              titulo: c.titulo,
              status: c.status,
              status_label: c.status_label,
              banca: c.banca,
              salario: c.salario,
              vagas: c.vagas,
              match_score: Math.min(score, 98),
              motivos: motivos.length ? motivos : ['Excelente oportunidade mapeada pela IA'],
              plano_semanal: (c.disciplinas || []).map(d => ({
                disciplina: d.nome,
                prioridade: d.prioridade,
                peso: d.peso,
                horas_semana: `${Math.max(2, Math.round(horasSem / (c.disciplinas.length || 3)))}h/sem`
              }))
            };
          })
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 3);

        return {
          perfil_analisado: {
            escolaridade: payload.escolaridade,
            area: payload.area_interesse,
            horas_por_dia: payload.horas_por_dia,
            horas_semanais_uteis: horasSem
          },
          top_recomendacoes: candidatos
        };
      }
    },

    async obterDashboardMvp() {
      try {
        return await request('/mvp/dashboard');
      } catch (e) {
        const st = getLocalState();
        const contagemRecursos = {};
        st.leads.forEach(l => {
          contagemRecursos[l.recurso_favorito] = (contagemRecursos[l.recurso_favorito] || 0) + 1;
        });
        const pref = Object.entries(contagemRecursos).map(([recurso_favorito, qtd]) => ({ recurso_favorito, qtd }));
        return {
          telemetria: st.telemetria,
          leads_cadastrados: st.leads,
          preferencia_recursos_premium: pref,
          disposicao_pagamento: [{ faixa_preco: 'R$ 29,90/mês', qtd: st.leads.length }]
        };
      }
    },

    async cadastrarLeadPremium(payload) {
      try {
        return await request('/mvp/leads-premium', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        const st = getLocalState();
        st.leads.unshift(payload);
        st.telemetria.leads_premium += 1;
        saveLocalState(st);
        return {
          id: st.leads.length,
          sucesso: true,
          mensagem: `Parabéns, ${payload.nome}! Você entrou na Lista VIP do Aprova+ PRO com 50% OFF no lançamento.`
        };
      }
    }
  };
})();
