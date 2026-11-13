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
    apenas_salvos: false,
    sortBy: 'padrao'
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
      const isCurrent = btn.dataset.view === viewName;
      btn.classList.toggle('active', isCurrent);
      if (isCurrent) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
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
    const btnSalvos = document.getElementById('btn-filtro-salvos');
    if (btnSalvos) btnSalvos.className = 'btn btn-outline btn-sm';

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

  setSortOrder(novoSort) {
    this.state.sortBy = novoSort || 'padrao';
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
    this.state.sortBy = 'padrao';

    if (document.getElementById('filter-q')) document.getElementById('filter-q').value = '';
    if (document.getElementById('filter-area')) document.getElementById('filter-area').value = 'todas';
    if (document.getElementById('filter-escolaridade')) document.getElementById('filter-escolaridade').value = 'todos';
    if (document.getElementById('filter-uf')) document.getElementById('filter-uf').value = 'todas';
    if (document.getElementById('filter-sort')) document.getElementById('filter-sort').value = 'padrao';

    this.setStatusFilter('todos');
  },

  toggleApenasSalvos() {
    this.state.apenas_salvos = !this.state.apenas_salvos;
    const btn = document.getElementById('btn-filtro-salvos');
    if (btn) {
      btn.className = this.state.apenas_salvos ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    }
    this.carregarConcursos();
  },

  ordenarLista(lista) {
    const copia = [...lista];
    const modo = this.state.sortBy;
    if (modo === 'salario') {
      return copia.sort((a, b) => (b.salario_max || 0) - (a.salario_max || 0));
    }
    if (modo === 'vagas') {
      return copia.sort((a, b) => (b.vagas_num || 0) - (a.vagas_num || 0));
    }
    if (modo === 'probabilidade') {
      return copia.sort((a, b) => (b.prob_ia || 0) - (a.prob_ia || 0));
    }
    return copia;
  },

  async carregarConcursos() {
    const grid = document.getElementById('concursos-grid');
    if (!grid) return;

    const resp = await window.AprovaAPI.listarConcursos(this.state);
    const resumo = resp.resumo || {};
    const lista = this.ordenarLista(resp.concursos || []);

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

    const summaryEl = document.getElementById('results-summary-text');
    if (summaryEl) {
      summaryEl.textContent = `Exibindo ${lista.length} de ${resumo.total || 13} concursos mapeados`;
    }

    if (lista.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-sheet">
          <h3>Nenhum concurso corresponde aos filtros selecionados</h3>
          <p>Ajuste os parâmetros de busca por área, escolaridade ou abrangência, ou redefina os filtros para visualizar todos os 13 editais mapeados.</p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaApp.limparFiltros()">
            ${window.AprovaUtils.icon('reset')}
            <span>Restaurar Todos os Concursos</span>
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = lista.map(c => window.AprovaComponents.renderConcursoCard(c)).join('');
  },

  async toggleFavorito(concursoId) {
    const res = await window.AprovaAPI.alternarFavorito(concursoId);
    window.AprovaUtils.showToast(
      res.salvo ? 'Concurso adicionado ao seu caderno de estudos.' : 'Concurso removido dos salvos.'
    );
    this.carregarConcursos();
    this.atualizarIndicadoresUsuario();
  },

  irParaMateriaisDoConcurso(concursoId) {
    window.AprovaComponents.estadoMateriais.concursoId = concursoId;
    window.AprovaComponents.estadoMateriais.categoria = 'todas';
    window.AprovaComponents.estadoMateriais.statusEstudo = 'todos';
    window.AprovaComponents.estadoMateriais.busca = '';
    this.switchView('materiais');
    window.AprovaUtils.showToast('Exibindo acervo de materiais filtrado para este concurso.');
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

  atualizarTelemetriaTopo() {
    return this.atualizarIndicadoresUsuario();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AprovaApp.init();
});
