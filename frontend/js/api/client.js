/**
 * Aprova+ IA — REST API Client + Gerenciador de Autenticação e Sessão de Usuário
 * - Em ambiente local com servidor Python (127.0.0.1:8000): consome a API FastAPI + SQLite3 real.
 * - No GitHub Pages (github.io) ou modo estático: utiliza motor em memória com persistência em localStorage e gerador Blob para download real de apostilas.
 */
(function () {
  const isGitHubPages = window.location.hostname.includes('github.io');
  const API_BASE = (!isGitHubPages && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000/api';

  let backendOnline = false;

  const STORAGE_KEY = 'aprova_mais_mvp_state_v2';
  const USER_SESSION_KEY = 'aprova_mais_user_session_v1';

  function gerarIniciais(nome) {
    const partes = (nome || 'Usuário').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'U';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function getLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const initial = {
      concursos: JSON.parse(JSON.stringify(window.AprovaFallback.concursos)),
      rumores: JSON.parse(JSON.stringify(window.AprovaFallback.rumores)),
      usuarios: [
        {
          id: 1,
          nome: 'Carlos Lucas',
          email: 'carlos@aprovamais.com.br',
          senha: '123456',
          carreira_foco: 'Policial',
          escolaridade: 'Superior',
          uf_interesse: 'Nacional',
          horas_estudo_dia: 4,
          plano: 'Gratuito',
          iniciais: 'CL'
        }
      ],
      leads: []
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
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errMsg = errJson.detail;
      } catch (_) {}
      const error = new Error(errMsg);
      error.isApiError = true;
      throw error;
    }
    backendOnline = true;
    updateStatusBadge(true);
    return await res.json();
  }

  function updateStatusBadge(isOnline) {
    const badge = document.getElementById('api-conn-badge');
    if (!badge) return;
    if (isOnline) {
      badge.className = 'api-status-badge';
      badge.innerHTML = 'Aprova+ IA Online (FastAPI + SQLite)';
    } else if (isGitHubPages) {
      badge.className = 'api-status-badge';
      badge.innerHTML = 'Aprova+ IA Online (Nuvem GitHub Pages)';
    } else {
      badge.className = 'api-status-badge';
      badge.innerHTML = 'Aprova+ IA Ativo (Modo Local)';
    }
  }

  window.AprovaAPI = {
    getBaseUrl() {
      return API_BASE;
    },

    isBackendOnline() {
      return backendOnline;
    },

    // ==================== AUTENTICAÇÃO E SESSÃO DO USUÁRIO ====================
    obterUsuarioAtual() {
      try {
        const raw = localStorage.getItem(USER_SESSION_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    salvarSessaoUsuario(usuario) {
      try {
        if (!usuario.iniciais) usuario.iniciais = gerarIniciais(usuario.nome);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(usuario));
      } catch (e) {}
      return usuario;
    },

    logoutUsuario() {
      try {
        localStorage.removeItem(USER_SESSION_KEY);
      } catch (e) {}
    },

    async loginUsuario(email, senha) {
      try {
        const resp = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha })
        });
        this.salvarSessaoUsuario(resp.usuario);
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const emailLimpo = (email || '').trim().toLowerCase();
        const user = (st.usuarios || []).find(
          u => u.email.toLowerCase() === emailLimpo && u.senha === senha
        );
        if (!user) {
          throw new Error('E-mail ou senha incorretos. Use a conta demo ou crie sua conta gratuita!');
        }
        const { senha: _, ...userSemSenha } = user;
        userSemSenha.iniciais = gerarIniciais(userSemSenha.nome);
        this.salvarSessaoUsuario(userSemSenha);
        return {
          sucesso: true,
          mensagem: `Bem-vindo de volta, ${userSemSenha.nome}!`,
          usuario: userSemSenha
        };
      }
    },

    async registrarUsuario(payload) {
      try {
        const resp = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        this.salvarSessaoUsuario(resp.usuario);
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        st.usuarios = st.usuarios || [];
        const emailLimpo = (payload.email || '').trim().toLowerCase();
        if (st.usuarios.some(u => u.email.toLowerCase() === emailLimpo)) {
          throw new Error('Este e-mail já está cadastrado na plataforma.');
        }
        const novo = {
          id: Date.now(),
          nome: payload.nome.trim(),
          email: emailLimpo,
          senha: payload.senha,
          carreira_foco: payload.carreira_foco || 'Policial',
          escolaridade: payload.escolaridade || 'Superior',
          uf_interesse: payload.uf_interesse || 'Nacional',
          horas_estudo_dia: parseInt(payload.horas_estudo_dia || 4, 10),
          plano: 'Gratuito',
          iniciais: gerarIniciais(payload.nome)
        };
        st.usuarios.push(novo);
        saveLocalState(st);
        const { senha: _, ...userSemSenha } = novo;
        this.salvarSessaoUsuario(userSemSenha);
        return {
          sucesso: true,
          mensagem: `Conta criada com sucesso! Bem-vindo(a), ${novo.nome}!`,
          usuario: userSemSenha
        };
      }
    },

    async atualizarPerfilUsuario(payload) {
      const atual = this.obterUsuarioAtual();
      if (!atual) throw new Error('Faça login para atualizar seu perfil.');

      try {
        const resp = await request(`/auth/usuarios/${atual.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        this.salvarSessaoUsuario(resp.usuario);
        return resp;
      } catch (e) {
        const st = getLocalState();
        st.usuarios = st.usuarios || [];
        const idx = st.usuarios.findIndex(u => u.id === atual.id || u.email === atual.email);
        const atualizado = {
          ...atual,
          nome: payload.nome.trim(),
          carreira_foco: payload.carreira_foco,
          escolaridade: payload.escolaridade,
          uf_interesse: payload.uf_interesse,
          horas_estudo_dia: parseInt(payload.horas_estudo_dia || 4, 10),
          plano: payload.plano || atual.plano || 'Gratuito',
          iniciais: gerarIniciais(payload.nome)
        };
        if (idx >= 0) {
          st.usuarios[idx] = { ...st.usuarios[idx], ...atualizado };
          saveLocalState(st);
        }
        this.salvarSessaoUsuario(atualizado);
        return {
          sucesso: true,
          mensagem: 'Perfil e metas de estudo atualizados com sucesso!',
          usuario: atualizado
        };
      }
    },

    // ==================== CONCURSOS, MATERIAIS, RADAR E IA ====================
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
        saveLocalState(st);
        return { id: materialId, estudado: novo };
      }
    },

    baixarMaterial(materialId) {
      if (backendOnline && !isGitHubPages) {
        window.open(`${API_BASE}/materiais/${materialId}/download`, '_blank');
        window.AprovaUtils.showToast('📥 Gerando apostila/guia verticalizado...', '#2563eb');
        setTimeout(() => window.AprovaApp.atualizarIndicadoresUsuario(), 700);
        return;
      }

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

      const disciplinasTxt = (concEncontrado.disciplinas || [])
        .map((d, i) => `  ${i + 1}. ${d.nome} — Questões: ${d.questoes} | Peso: ${d.peso} | Prioridade IA: ${d.prioridade}`)
        .join('\n');

      const conteudo = [
        '================================================================================',
        'APROVA+ IA — CENTRAL INTELIGENTE DE CONCURSOS PÚBLICOS',
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
      window.AprovaApp.atualizarIndicadoresUsuario();
    },

    async listarRumores() {
      try {
        return await request('/radar');
      } catch (e) {
        const st = getLocalState();
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
          data_captura: 'Enviado agora pela comunidade',
          estagio_maturidade: estagio,
          confianca_ia: confianca,
          analise_ia: `Notícia classificada automaticamente pelo motor NLP como "${estagio}" (${confianca}% de confiança).`,
          votos_comunidade: 1
        };
        st.rumores.unshift(novo);
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

    async cadastrarLeadPremium(payload) {
      try {
        const res = await request('/mvp/leads-premium', { method: 'POST', body: JSON.stringify(payload) });
        const user = this.obterUsuarioAtual();
        if (user) {
          user.plano = 'Lista VIP PRO';
          this.salvarSessaoUsuario(user);
        }
        return res;
      } catch (e) {
        const st = getLocalState();
        st.leads.unshift(payload);
        saveLocalState(st);
        const user = this.obterUsuarioAtual();
        if (user) {
          user.plano = 'Lista VIP PRO';
          this.salvarSessaoUsuario(user);
        }
        return {
          id: st.leads.length,
          sucesso: true,
          mensagem: `Parabéns, ${payload.nome}! Você entrou na Lista VIP do Aprova+ PRO com 50% OFF no lançamento.`
        };
      }
    }
  };
})();
