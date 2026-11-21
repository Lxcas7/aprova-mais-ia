/**
 * Aprova+ IA — Controlador Principal da Aplicação Frontend (SPA Modular, Histórico Hash, Filtros Combináveis)
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

  _searchTimer: null,
  _concursosReqSeq: 0,
  _validViews: ['explorar', 'radar', 'materiais', 'ia', 'premium', 'conta'],

  async init() {
    window.AprovaComponents.renderHeaderUserWidget();
    this._initHeaderHeightObserver();
    this._initScrollAffordances();

    const concursoModal = document.getElementById('concurso-modal');
    if (concursoModal) {
      concursoModal.addEventListener('click', (e) => {
        if (e.target === concursoModal) window.AprovaComponents.closeConcursoModal();
      });
    }
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) window.AprovaComponents.closeAuthModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.AprovaComponents.closeConcursoModal();
        window.AprovaComponents.closeAuthModal();
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        const tag = active?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;
        if (document.querySelector('.modal-overlay.open')) return;
        e.preventDefault();
        if (this.state.currentView === 'materiais') {
          document.getElementById('mat-search-input')?.focus();
        } else {
          if (this.state.currentView !== 'explorar') {
            this.switchView('explorar');
          }
          document.getElementById('filter-q')?.focus();
        }
      }
    });

    window.addEventListener('hashchange', () => this._applyHashRoute());

    await window.AprovaAPI.checkHealth();
    await this._applyHashRoute(true);
    await this.atualizarIndicadoresUsuario();
  },

  async _applyHashRoute(isInitial = false) {
    const rawHash = (window.location.hash || '').replace(/^#/, '');
    if (rawHash.startsWith('concurso/')) {
      const cid = decodeURIComponent(rawHash.slice('concurso/'.length));
      if (isInitial) {
        this.switchView('explorar', { pushHash: false });
      }
      if (cid) {
        window.AprovaComponents.openConcursoModal(cid, null, { skipHash: true });
      }
      return;
    }

    const modal = document.getElementById('concurso-modal');
    if (modal && modal.classList.contains('open')) {
      window.AprovaUtils.closeAccessibleModal('concurso-modal');
    }

    const targetView = this._validViews.includes(rawHash) ? rawHash : 'explorar';
    if (isInitial || targetView !== this.state.currentView) {
      this.switchView(targetView, { pushHash: false });
    }
  },

  _initHeaderHeightObserver() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const syncHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    syncHeight();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncHeight).observe(header);
    }
    window.addEventListener('resize', syncHeight);
  },

  _initScrollAffordances() {
    const bindScroller = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const update = () => {
        const maxScroll = el.scrollWidth - el.clientWidth;
        el.classList.toggle('can-scroll-left', el.scrollLeft > 4);
        el.classList.toggle('can-scroll-right', maxScroll > 4 && el.scrollLeft < maxScroll - 4);
      };
      update();
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(update).observe(el);
      }
    };
    bindScroller('.nav-menu');
    bindScroller('.status-pills');
  },

  switchView(viewName, options = {}) {
    const target = this._validViews.includes(viewName) ? viewName : 'explorar';
    this.state.currentView = target;

    if (options.pushHash !== false) {
      const desiredHash = `#${target}`;
      if (window.location.hash !== desiredHash) {
        history.pushState({ view: target }, '', desiredHash);
      }
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.view === target;
      btn.classList.toggle('active', isCurrent);
      if (isCurrent) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    window.AprovaComponents.renderHeaderUserWidget();

    document.querySelectorAll('.view-pane').forEach(pane => {
      const isActive = pane.id === `view-${target}`;
      pane.classList.toggle('active', isActive);
      pane.hidden = !isActive;
    });

    const heroWorkspace = document.getElementById('hero-workspace');
    if (heroWorkspace) {
      const showHero = target === 'explorar';
      heroWorkspace.style.display = showHero ? 'block' : 'none';
      heroWorkspace.hidden = !showHero;
    }

    if (target === 'explorar') {
      this.carregarConcursos();
    } else if (target === 'radar') {
      window.AprovaComponents.renderRadar();
    } else if (target === 'materiais') {
      window.AprovaComponents.renderMateriaisHub();
    } else if (target === 'ia') {
      window.AprovaComponents.renderIAAssistant();
    } else if (target === 'premium') {
      window.AprovaComponents.renderPremiumView();
    } else if (target === 'conta') {
      window.AprovaComponents.renderUserDashboard();
    }

    this.atualizarIndicadoresUsuario();
  },

  setStatusFilter(novoStatus) {
    let targetStatus = novoStatus || 'todos';
    if (
      targetStatus !== 'todos' &&
      this.state.status === targetStatus &&
      document.activeElement?.classList?.contains('ledger-item')
    ) {
      targetStatus = 'todos';
    }
    this.state.status = targetStatus;

    if (this.state.currentView !== 'explorar') {
      this.switchView('explorar');
    }

    document.querySelectorAll('.status-pill').forEach(pill => {
      const s = pill.dataset.status;
      pill.className = 'status-pill';
      const isCurrent = s === targetStatus;
      if (isCurrent) {
        pill.classList.add(`active-${s}`);
      }
      pill.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });

    document.querySelectorAll('.ledger-item').forEach(item => {
      const ls = item.dataset.ledgerStatus;
      const isActive = ls === targetStatus;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    this.carregarConcursos();
  },

  setSortOrder(novoSort) {
    this.state.sortBy = novoSort || 'padrao';
    this.carregarConcursos();
  },

  onSearchInput() {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.aplicarFiltrosDaBarra();
    }, 250);
  },

  aplicarFiltrosDaBarra() {
    this.state.q = document.getElementById('filter-q')?.value.trim() || '';
    this.state.area = document.getElementById('filter-area')?.value || 'todas';
    this.state.escolaridade = document.getElementById('filter-escolaridade')?.value || 'todos';
    this.state.uf = document.getElementById('filter-uf')?.value || 'todas';
    this.carregarConcursos();
  },

  removerFiltroIndividual(chave) {
    if (chave === 'status') {
      this.setStatusFilter('todos');
      return;
    }
    if (chave === 'apenas_salvos') {
      if (this.state.apenas_salvos) this.toggleApenasSalvos();
      return;
    }
    if (chave === 'q') {
      this.state.q = '';
      if (document.getElementById('filter-q')) document.getElementById('filter-q').value = '';
    } else if (chave === 'area') {
      this.state.area = 'todas';
      if (document.getElementById('filter-area')) document.getElementById('filter-area').value = 'todas';
    } else if (chave === 'escolaridade') {
      this.state.escolaridade = 'todos';
      if (document.getElementById('filter-escolaridade')) document.getElementById('filter-escolaridade').value = 'todos';
    } else if (chave === 'uf') {
      this.state.uf = 'todas';
      if (document.getElementById('filter-uf')) document.getElementById('filter-uf').value = 'todas';
    }
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

    const btnSalvos = document.getElementById('btn-filtro-salvos');
    if (btnSalvos) {
      btnSalvos.className = 'btn btn-outline btn-sm';
      btnSalvos.setAttribute('aria-pressed', 'false');
    }

    this.setStatusFilter('todos');
  },

  toggleApenasSalvos() {
    this.state.apenas_salvos = !this.state.apenas_salvos;
    const btn = document.getElementById('btn-filtro-salvos');
    if (btn) {
      btn.className = this.state.apenas_salvos ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
      btn.setAttribute('aria-pressed', this.state.apenas_salvos ? 'true' : 'false');
    }
    this.carregarConcursos();
  },

  _getActiveFilterDescriptors() {
    const chips = [];
    if (this.state.status !== 'todos') {
      chips.push({ key: 'status', label: `Situação: ${window.AprovaUtils.getShortStatusLabel(this.state.status)}` });
    }
    if (this.state.q) {
      chips.push({ key: 'q', label: `Busca: "${this.state.q}"` });
    }
    if (this.state.area !== 'todas') {
      chips.push({ key: 'area', label: `Área: ${this.state.area}` });
    }
    if (this.state.escolaridade !== 'todos') {
      chips.push({ key: 'escolaridade', label: `Escolaridade: ${this.state.escolaridade}` });
    }
    if (this.state.uf !== 'todas') {
      chips.push({ key: 'uf', label: `UF: ${this.state.uf}` });
    }
    if (this.state.apenas_salvos) {
      chips.push({ key: 'apenas_salvos', label: 'Apenas salvos no caderno' });
    }
    return chips;
  },

  _renderActiveFilterChips() {
    const container = document.getElementById('explorar-active-chips');
    if (!container) return;
    const chips = this._getActiveFilterDescriptors();
    if (!chips.length) {
      container.hidden = true;
      container.innerHTML = '';
      return;
    }

    const esc = (v) => window.AprovaUtils.escapeHtml(v);
    container.hidden = false;
    container.innerHTML = `
      <span class="active-chips-label">Filtros ativos:</span>
      ${chips.map(c => `
        <button type="button" class="filter-chip-btn" onclick="window.AprovaApp.removerFiltroIndividual('${esc(c.key)}')" title="Remover filtro ${esc(c.label)}">
          <span>${esc(c.label)}</span>
          ${window.AprovaUtils.icon('x')}
        </button>
      `).join('')}
      ${chips.length >= 2 ? `
        <button type="button" class="filter-chip-clear" onclick="window.AprovaApp.limparFiltros()">
          Limpar tudo
        </button>
      ` : ''}
    `;
  },

  renderContinueStudyStrip(salvos) {
    const strip = document.getElementById('continue-study-strip');
    if (!strip) return;
    if (!salvos || !salvos.length) {
      strip.hidden = true;
      strip.innerHTML = '';
      return;
    }
    const safe = (v) => window.AprovaUtils.safeText(v);
    const esc = (v) => window.AprovaUtils.escapeHtml(v);
    const itemsHtml = salvos.slice(0, 3).map(c => {
      const mats = c.materiais || [];
      const feitos = mats.filter(m => m.estudado).length;
      return `
        <button type="button" class="continue-study-pill" onclick="window.AprovaComponents.openConcursoModal('${esc(c.id)}', this)">
          <strong>${safe(c.sigla)}</strong>
          <span>${feitos}/${mats.length} materiais</span>
        </button>
      `;
    }).join('');
    const extraCount = salvos.length > 3 ? ` +${salvos.length - 3}` : '';
    strip.hidden = false;
    strip.innerHTML = `
      <div class="continue-study-left">
        <span class="continue-study-title">Retomar preparação${extraCount ? ` (${salvos.length} editais no caderno)` : ''}:</span>
        <div class="continue-study-pills">${itemsHtml}</div>
      </div>
      <div class="continue-study-actions">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('ia')">
          Montar cronograma IA
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('conta')">
          Meu caderno
        </button>
      </div>
    `;
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

    const seq = ++this._concursosReqSeq;
    grid.setAttribute('aria-busy', 'true');
    this._renderActiveFilterChips();

    let resp;
    try {
      resp = await window.AprovaAPI.listarConcursos(this.state);
    } catch (err) {
      if (seq !== this._concursosReqSeq) return;
      grid.removeAttribute('aria-busy');
      grid.innerHTML = `
        <div class="empty-state-sheet" role="alert">
          <h3>Não foi possível carregar os concursos</h3>
          <p>${window.AprovaUtils.escapeHtml(err.message || 'Erro ao consultar a lista de editais.')}</p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaApp.carregarConcursos()">
            ${window.AprovaUtils.icon('reset')}
            <span>Tentar novamente</span>
          </button>
        </div>
      `;
      return;
    }

    if (seq !== this._concursosReqSeq) return;
    grid.removeAttribute('aria-busy');

    const resumo = resp.resumo || {};
    const totalBase = resumo.total ?? 0;
    const lista = this.ordenarLista(resp.concursos || []);

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.textContent = val;
    };
    setTxt('kpi-abertos-count', resumo.abertos);
    setTxt('kpi-previstos-count', resumo.previstos);
    setTxt('kpi-encerrados-count', resumo.encerrados);
    setTxt('pill-count-todos', totalBase);
    setTxt('pill-count-aberto', resumo.abertos);
    setTxt('pill-count-previsto', resumo.previstos);
    setTxt('pill-count-encerrado', resumo.encerrados);
    setTxt('count-salvos-badge', resumo.salvos);
    setTxt('top-salvos-count', resumo.salvos);

    const summaryEl = document.getElementById('results-summary-text');
    if (summaryEl) {
      summaryEl.textContent = `${lista.length} de ${totalBase} editais`;
    }

    if (lista.length === 0) {
      const chips = this._getActiveFilterDescriptors();
      const esc = (v) => window.AprovaUtils.escapeHtml(v);
      const chipsRecovery = chips.length
        ? `<div class="empty-state-actions" style="margin-bottom: 14px;">
            ${chips.map(c => `
              <button type="button" class="filter-chip-btn" onclick="window.AprovaApp.removerFiltroIndividual('${esc(c.key)}')">
                <span>Remover: ${esc(c.label)}</span>
                ${window.AprovaUtils.icon('x')}
              </button>
            `).join('')}
          </div>`
        : '';
      grid.innerHTML = `
        <div class="empty-state-sheet">
          <h3>Nenhum concurso corresponde aos filtros selecionados</h3>
          <p>${chips.length ? 'A combinação atual de filtros não encontrou editais. Remova um filtro específico abaixo ou restaure todos os concursos:' : 'Nenhum edital disponível no momento.'}</p>
          ${chipsRecovery}
          <button type="button" class="btn btn-primary" onclick="window.AprovaApp.limparFiltros()">
            ${window.AprovaUtils.icon('reset')}
            <span>Restaurar todos os ${totalBase} concursos</span>
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = lista.map(c => window.AprovaComponents.renderConcursoCard(c)).join('');
  },

  async toggleFavorito(concursoId) {
    try {
      const res = await window.AprovaAPI.alternarFavorito(concursoId);
      if (!res.salvo) {
        window.AprovaUtils.showToast('Concurso removido do seu caderno.', {
          actionLabel: 'Desfazer',
          onAction: () => window.AprovaApp.toggleFavorito(concursoId)
        });
      } else {
        window.AprovaUtils.showToast(
          res.isGuest
            ? 'Salvo neste dispositivo. Entre ou crie conta para sincronizar.'
            : 'Concurso salvo no seu caderno de estudos.'
        );
      }
      this.carregarConcursos();
      this.atualizarIndicadoresUsuario();
      return res;
    } catch (err) {
      window.AprovaUtils.showToast(err.message || 'Erro ao atualizar favorito.', { variant: 'error' });
      return null;
    }
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
    try {
      const [concResp, matResp] = await Promise.all([
        window.AprovaAPI.listarConcursos(),
        window.AprovaAPI.listarMateriais('todos', 'todas')
      ]);
      const resumo = concResp.resumo || {};
      const salvos = (concResp.concursos || []).filter(c => c.salvo);
      const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.textContent = val;
      };
      setTxt('top-salvos-count', resumo.salvos ?? salvos.length);
      setTxt('top-estudados-count', `${matResp.estudados ?? 0}/${matResp.total ?? 0}`);
      setTxt('top-progresso-pct', `${matResp.progresso_pct ?? 0}%`);
      this.renderContinueStudyStrip(salvos);
    } catch (e) {}
  },

  atualizarTelemetriaTopo() {
    return this.atualizarIndicadoresUsuario();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.AprovaApp.init();
});
