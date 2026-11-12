/**
 * Aprova+ IA — Controlador Principal da Aplicação Frontend (SPA Modular com Sistema de Usuário)
 */
window.AprovaApp = {
  state: {
    currentView: 'explorar',
    status: 'todos',
    area: 'todas',
    escolaridade: 'todos',
    uf: 'todas',
    q: '',
    apenas_salvos: false
  },

  async init() {
    window.AprovaComponents.renderHeaderUserWidget();
    await window.AprovaAPI.checkHealth();
    await this.carregarConcursos();
    await this.atualizarIndicadoresUsuario();

    // Fecha modais ao clicar fora da janela ou pressionar ESC
    ['concurso-modal', 'auth-modal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.AprovaComponents.closeConcursoModal();
        window.AprovaComponents.closeAuthModal();
      }
    });
  },

  switchView(viewName) {
    this.state.currentView = viewName;

    // Atualiza botões da barra de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Exibe apenas a seção ativa
    document.querySelectorAll('.view-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `view-${viewName}`);
    });

    // Mostra a barra de busca global apenas na visão Explorar Concursos
    const heroFilterBar = document.getElementById('hero-filter-bar');
    if (heroFilterBar) {
      heroFilterBar.style.display = viewName === 'explorar' ? 'grid' : 'none';
    }

    // Carrega dados específicos da aba selecionada
    if (viewName === 'explorar') {
      this.carregarConcursos();
    } else if (viewName === 'radar') {
      window.AprovaComponents.renderRadar();
    } else if (viewName === 'materiais') {
      window.AprovaComponents.renderMateriaisHub();
    } else if (viewName === 'ia') {
      window.AprovaComponents.renderIAAssistant();
    } else if (viewName === 'premium') {
      window.AprovaComponents.renderPremiumView();
    } else if (viewName === 'conta') {
      window.AprovaComponents.renderUserDashboard();
    }

    this.atualizarIndicadoresUsuario();
  },

  setStatusFilter(novoStatus) {
    this.state.status = novoStatus;
    this.state.apenas_salvos = false;

    if (this.state.currentView !== 'explorar') {
      this.switchView('explorar');
    }

    document.querySelectorAll('.status-pill').forEach(pill => {
      const s = pill.dataset.status;
      pill.className = 'status-pill';
      if (s === novoStatus) {
        pill.classList.add(`active-${s}`);
      }
    });

    this.carregarConcursos();
  },

  aplicarFiltrosDaBarra() {
    this.state.q = document.getElementById('filter-q')?.value.trim() || '';
    this.state.area = document.getElementById('filter-area')?.value || 'todas';
    this.state.escolaridade = document.getElementById('filter-escolaridade')?.value || 'todos';
    this.state.uf = document.getElementById('filter-uf')?.value || 'todas';
    this.carregarConcursos();
  },

  limparFiltros() {
    this.state.status = 'todos';
    this.state.area = 'todas';
    this.state.escolaridade = 'todos';
    this.state.uf = 'todas';
    this.state.q = '';
    this.state.apenas_salvos = false;

    if (document.getElementById('filter-q')) document.getElementById('filter-q').value = '';
    if (document.getElementById('filter-area')) document.getElementById('filter-area').value = 'todas';
    if (document.getElementById('filter-escolaridade')) document.getElementById('filter-escolaridade').value = 'todos';
    if (document.getElementById('filter-uf')) document.getElementById('filter-uf').value = 'todas';

    this.setStatusFilter('todos');
  },

  toggleApenasSalvos() {
    this.state.apenas_salvos = !this.state.apenas_salvos;
    const btn = document.getElementById('btn-filtro-salvos');
    if (btn) {
      btn.className = this.state.apenas_salvos ? 'btn btn-primary' : 'btn btn-outline';
    }
    this.carregarConcursos();
  },

  async carregarConcursos() {
    const grid = document.getElementById('concursos-grid');
    if (!grid) return;

    const resp = await window.AprovaAPI.listarConcursos(this.state);
    const resumo = resp.resumo || {};
    const lista = resp.concursos || [];

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.textContent = val;
    };
    setTxt('kpi-abertos-count', resumo.abertos);
    setTxt('kpi-previstos-count', resumo.previstos);
    setTxt('kpi-encerrados-count', resumo.encerrados);
    setTxt('pill-count-todos', resumo.total);
    setTxt('pill-count-aberto', resumo.abertos);
    setTxt('pill-count-previsto', resumo.previstos);
    setTxt('pill-count-encerrado', resumo.encerrados);
    setTxt('count-salvos-badge', resumo.salvos);
    setTxt('top-salvos-count', resumo.salvos);

    if (lista.length === 0) {
      grid.innerHTML = `
        <div class="concurso-card" style="grid-column: 1 / -1; text-align:center; padding:38px;">
          <h3 style="font-size:1.15rem; font-weight:800; margin-bottom:6px;">Nenhum concurso encontrado com estes filtros</h3>
          <p style="color:#64748b; margin-bottom:14px;">Experimente limpar os filtros ou buscar por todos os status.</p>
          <div>
            <button class="btn btn-primary" onclick="window.AprovaApp.limparFiltros()">🔄 Mostrar Todos os Concursos</button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = lista.map(c => window.AprovaComponents.renderConcursoCard(c)).join('');
  },

  async toggleFavorito(concursoId) {
    const res = await window.AprovaAPI.alternarFavorito(concursoId);
    window.AprovaUtils.showToast(
      res.salvo ? '⭐ Concurso salvo no seu caderno!' : '☆ Concurso removido dos salvos.',
      res.salvo ? '#f59e0b' : '#64748b'
    );
    this.carregarConcursos();
    this.atualizarIndicadoresUsuario();
  },

  irParaMateriaisDoConcurso(concursoId) {
    window.AprovaComponents.estadoMateriais.concursoId = concursoId;
    window.AprovaComponents.estadoMateriais.categoria = 'todas';
    this.switchView('materiais');
    window.AprovaUtils.showToast('📚 Exibindo materiais filtrados para este concurso!', '#2563eb');
  },

  async atualizarIndicadoresUsuario() {
    const [concResp, matResp] = await Promise.all([
      window.AprovaAPI.listarConcursos(),
      window.AprovaAPI.listarMateriais('todos', 'todas')
    ]);
    const resumo = concResp.resumo || {};
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.textContent = val;
    };
    setTxt('top-salvos-count', resumo.salvos || 0);
    setTxt('top-estudados-count', `${matResp.estudados || 0}/${matResp.total || 34}`);
    setTxt('top-progresso-pct', `${matResp.progresso_pct || 0}%`);
  },

  // Alias para compatibilidade com chamadas nos componentes
  atualizarTelemetriaTopo() {
    return this.atualizarIndicadoresUsuario();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AprovaApp.init();
});
