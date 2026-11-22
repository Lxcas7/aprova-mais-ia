window.AprovaUtils = {
  _modalTriggers: {},
  _modalStack: [],
  _trapHandler: null,
  _ufControls: {},
  _ufOutsideBound: false,

  BR_UFS: [
    { code: 'Nacional', name: 'Nacional (Todo o Brasil)' },
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' }
  ],

  parseUfsList(raw, { allowEmpty = false } = {}) {
    const validMap = new Map(this.BR_UFS.map(u => [u.code.toLowerCase(), u.code]));
    const parts = Array.isArray(raw) ? raw : (raw ? String(raw).split(',') : []);
    const out = [];
    parts.forEach(p => {
      const t = String(p || '').trim().toLowerCase();
      if (!t || t === 'todas') return;
      const canonical = validMap.get(t);
      if (canonical && !out.includes(canonical)) {
        out.push(canonical);
      }
    });
    if (!out.length && !allowEmpty) return ['Nacional'];
    return out;
  },

  formatHorasDiarias(val) {
    const n = Math.max(0.5, Math.min(16, Number(val) || 4));
    const totalMins = Math.round(n * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m/dia`;
    return m ? `${h}h ${String(m).padStart(2, '0')}m/dia` : `${h}h/dia`;
  },

  formatHorasSemanais(val) {
    const n = Math.max(0.5, Number(val) || 0);
    const totalMins = Math.round(n * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    return m ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  cleanText(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
      .replace(/\s*—\s*/g, ' · ')
      .replace(/Edital Verticalizado/gi, 'Guia do Edital')
      .replace(/verticalizados/gi, 'organizados por tópico')
      .replace(/verticalizado/gi, 'organizado por tópico');
  },

  safeText(str) {
    if (str === null || str === undefined) return '';
    return this.escapeHtml(this.cleanText(String(str)));
  },

  formatConcursoHeading(sigla, titulo) {
    const cleanSigla = this.cleanText(String(sigla || '')).trim();
    let cleanTitulo = this.cleanText(String(titulo || '')).trim();
    if (cleanSigla) {
      const escapedSigla = cleanSigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanTitulo = cleanTitulo.replace(new RegExp(`\\s*\\(${escapedSigla}\\)`, 'gi'), '');
      if (cleanTitulo.toUpperCase().startsWith(cleanSigla.toUpperCase() + ' ·')) {
        return this.escapeHtml(cleanTitulo);
      }
      if (cleanTitulo.toUpperCase().startsWith(cleanSigla.toUpperCase() + ' ')) {
        return this.escapeHtml(cleanTitulo);
      }
    }
    return this.escapeHtml(cleanSigla ? `${cleanSigla} · ${cleanTitulo}` : cleanTitulo);
  },

  getShortStatusLabel(status) {
    if (status === 'aberto') return 'Edital Aberto';
    if (status === 'previsto') return 'Previsão de edital';
    return 'Histórico · Provas';
  },

  getPlanBadgeMeta(planoRaw) {
    const p = String(planoRaw || 'Gratuito').trim();
    const low = p.toLowerCase();
    if (low === 'pro+') return { label: 'PRO+', cls: 'tier-proplus' };
    if (low === 'pro') return { label: 'PRO', cls: 'tier-pro' };
    if (low === 'básico' || low === 'basico') return { label: 'Básico', cls: 'tier-basico' };
    return { label: 'Gratuito', cls: 'tier-gratuito' };
  },

  formatSourceWithLinks(str) {
    if (!str) return '';
    const raw = this.cleanText(String(str));
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const parts = raw.split(urlRegex);
    return parts.map(part => {
      if (/^https?:\/\//i.test(part)) {
        const safeUrl = this.escapeHtml(part);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
      }
      return this.escapeHtml(part);
    }).join('');
  },

  setButtonLoading(btn, isLoading, loadingText = 'Processando...') {
    if (!btn) return;
    if (isLoading) {
      if (btn.dataset.origHtml === undefined) {
        btn.dataset.origHtml = btn.innerHTML;
      }
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = loadingText;
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.dataset.origHtml !== undefined) {
        btn.innerHTML = btn.dataset.origHtml;
        delete btn.dataset.origHtml;
      }
    }
  },

  sanitizeRichHtml(str) {
    if (!str) return '';
    const cleaned = this.cleanText(String(str));
    const parts = cleaned.split(/(<\/?(?:strong|em)>|<br\s*\/?>)/gi);
    return parts.map(part => {
      if (!part) return '';
      if (/^<strong>$/i.test(part)) return '<strong>';
      if (/^<\/strong>$/i.test(part)) return '</strong>';
      if (/^<em>$/i.test(part)) return '<em>';
      if (/^<\/em>$/i.test(part)) return '</em>';
      if (/^<br\s*\/?>$/i.test(part)) return '<br>';
      return this.escapeHtml(part);
    }).join('');
  },

  showToast(message, options = {}) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'toast-msg' + (options.variant === 'error' ? ' toast-error' : '');

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-text';
    textSpan.textContent = this.cleanText(String(message || ''));
    el.appendChild(textSpan);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    };

    if (options.actionLabel && typeof options.onAction === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = options.actionLabel;
      actionBtn.addEventListener('click', () => {
        dismiss();
        options.onAction();
      });
      el.appendChild(actionBtn);
    }

    container.appendChild(el);
    const duration = typeof options.duration === 'number'
      ? options.duration
      : (options.actionLabel ? 5200 : 3400);
    setTimeout(dismiss, duration);
  },

  _setBackgroundInert(isInert) {
    const selectors = ['.app-header', '#main-content', '.app-footer'];
    selectors.forEach(sel => {
      const node = document.querySelector(sel);
      if (!node) return;
      if (isInert) {
        node.inert = true;
        node.setAttribute('aria-hidden', 'true');
      } else {
        node.inert = false;
        node.removeAttribute('aria-hidden');
      }
    });
  },

  _getFocusableElements(root) {
    if (!root) return [];
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll(selector)).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  },

  openAccessibleModal(modalId, triggerEl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (!modal.classList.contains('open')) {
      this._modalTriggers[modalId] = triggerEl || document.activeElement;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    if (!this._modalStack.includes(modalId)) {
      this._modalStack.push(modalId);
    }

    this._setBackgroundInert(true);
    document.body.style.overflow = 'hidden';

    if (!this._trapHandler) {
      this._trapHandler = (e) => {
        if (e.key !== 'Tab' || this._modalStack.length === 0) return;
        const activeModalId = this._modalStack[this._modalStack.length - 1];
        const activeModal = document.getElementById(activeModalId);
        const dialogWin = activeModal?.querySelector('.modal-window');
        const focusables = this._getFocusableElements(dialogWin);
        if (!focusables.length) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !dialogWin.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogWin.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', this._trapHandler);
    }
  },

  closeAccessibleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !modal.classList.contains('open')) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    this._modalStack = this._modalStack.filter(id => id !== modalId);

    if (this._modalStack.length === 0) {
      this._setBackgroundInert(false);
      document.body.style.overflow = '';
      if (this._trapHandler) {
        document.removeEventListener('keydown', this._trapHandler);
        this._trapHandler = null;
      }
    }

    const trigger = this._modalTriggers[modalId];
    delete this._modalTriggers[modalId];
    if (trigger && trigger.isConnected && typeof trigger.focus === 'function') {
      trigger.focus();
    }
  },

  renderMaterialPreviewContent(preview) {
    const safe = (v) => this.safeText(v);
    const discs = (preview.disciplinas || []).map((d, idx) => `
      <li>
        <span>${idx + 1}. <strong>${safe(d.nome)}</strong> — ${safe(d.questoes)} questões (${safe(d.peso)})</span>
        <span class="badge badge-neutral">${safe(d.prioridade)}</span>
      </li>
    `).join('');
    const passos = (preview.passos_estudo || []).map(p => `<li>${safe(p)}</li>`).join('');

    return `
      <div class="material-preview-header">
        <div>
          <strong class="material-preview-kicker">Pré-visualização do Guia (Formato A4)</strong>
          <div class="material-preview-sub">
            ${safe(preview.concurso_sigla)} · ${safe(preview.banca)} · ${safe(preview.salario)}
          </div>
        </div>
        <button type="button" class="btn btn-accent btn-sm" onclick="window.AprovaAPI.baixarMaterial(${Number(preview.id)})">
          ${this.icon('download')}
          <span>Exportar PDF A4</span>
        </button>
      </div>
      <div class="material-preview-body">
        <p><strong>Escopo do guia:</strong> ${safe(preview.resumo_conteudo)}</p>
        <p><strong>Direcionamento da prova:</strong> ${safe(preview.resumo_ia)}</p>
        ${discs ? `
          <div class="material-preview-section">
            <strong>Tópicos do Edital por Disciplina:</strong>
            <ul class="material-preview-disc-list">${discs}</ul>
          </div>
        ` : ''}
        ${passos ? `
          <div class="material-preview-section">
            <strong>Roteiro de Execução:</strong>
            <ol class="material-preview-steps">${passos}</ol>
          </div>
        ` : ''}
      </div>
    `;
  },

  async toggleMaterialPreview(materialId, prefix, triggerBtn) {
    const box = document.getElementById(`${prefix}-preview-${materialId}`);
    if (!box) return;

    const isOpen = box.classList.contains('open');
    if (isOpen) {
      box.classList.remove('open');
      box.hidden = true;
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
      return;
    }

    box.hidden = false;
    box.classList.add('open');
    if (triggerBtn) {
      triggerBtn.setAttribute('aria-expanded', 'true');
      triggerBtn.disabled = true;
    }
    box.innerHTML = '<div class="material-preview-loading">Carregando pré-visualização do guia...</div>';

    try {
      const preview = await window.AprovaAPI.obterPreviewMaterial(materialId);
      box.innerHTML = this.renderMaterialPreviewContent(preview);
    } catch (err) {
      box.innerHTML = `
        <div class="auth-error-banner visible" role="alert">
          ${this.escapeHtml(err.message || 'Não foi possível carregar a pré-visualização deste material.')}
        </div>
      `;
    } finally {
      if (triggerBtn) triggerBtn.disabled = false;
    }
  },

  getStatusBadgeClass(status) {
    if (status === 'aberto') return 'badge-aberto';
    if (status === 'previsto') return 'badge-previsto';
    return 'badge-encerrado';
  },

  getStatusDot(status) {
    const color = status === 'aberto' ? '#0f5132' : (status === 'previsto' ? '#664d03' : '#084298');
    return `<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="${color}"/></svg>`;
  },

  icon(name) {
    const icons = {
      bookmark: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
      bookmarkFilled: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
      download: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
      eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
      eyeOff: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>',
      help: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
      book: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
      play: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
      radar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 12 19 5"/><circle cx="12" cy="12" r="4"/></svg>',
      user: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      reset: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
      upvote: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
      send: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      target: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      chart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      x: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    };
    return icons[name] || '';
  },

  /* ==================== MULTI-SELECT UF + META DIÁRIA FLEXÍVEL ==================== */
  _ensureUfOutsideListener() {
    if (this._ufOutsideBound) return;
    this._ufOutsideBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.uf-multiselect')) return;
      document.querySelectorAll('.uf-popover.open').forEach(p => {
        p.classList.remove('open');
        p.hidden = true;
        const trig = p.closest('.uf-multiselect')?.querySelector('.uf-chips-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'false');
      });
    });
  },

  renderUfMultiSelect(id, initialValues, options = {}) {
    this._ensureUfOutsideListener();
    const allowEmpty = Boolean(options.allowEmpty);
    const placeholder = options.placeholder || 'Selecione uma ou mais UFs...';
    const onChange = options.onChange || '';
    const selected = this.parseUfsList(initialValues, { allowEmpty });

    this._ufControls[id] = {
      selected,
      allowEmpty,
      placeholder,
      onChange,
      search: ''
    };

    return `
      <div id="${this.escapeHtml(id)}-wrap" class="uf-multiselect" data-uf-control="${this.escapeHtml(id)}">
        ${this._buildUfInnerHtml(id)}
      </div>
    `;
  },

  _buildUfInnerHtml(id) {
    const ctrl = this._ufControls[id] || { selected: [], allowEmpty: true, placeholder: 'Selecionar UFs', search: '' };
    const esc = (v) => this.escapeHtml(v);
    const q = (ctrl.search || '').trim().toLowerCase();

    const chipsHtml = ctrl.selected.length
      ? ctrl.selected.map(code => `
          <span class="uf-chip">
            <span>${esc(code)}</span>
            <button
              type="button"
              class="uf-chip-remove"
              aria-label="Remover ${esc(code)}"
              onclick="event.stopPropagation(); window.AprovaUtils._ufToggleCode('${esc(id)}', '${esc(code)}')"
            >×</button>
          </span>
        `).join('')
      : `<span class="uf-placeholder">${esc(ctrl.placeholder)}</span>`;

    const matchingUfs = this.BR_UFS.filter(u =>
      !q || u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );

    return `
      <div
        role="button"
        tabindex="0"
        id="${esc(id)}-trigger"
        class="uf-chips-trigger"
        aria-haspopup="listbox"
        aria-expanded="false"
        onclick="window.AprovaUtils._ufToggleDropdown('${esc(id)}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.AprovaUtils._ufToggleDropdown('${esc(id)}');}"
      >
        <div class="uf-chips-list">${chipsHtml}</div>
        <span class="uf-caret" aria-hidden="true">▾</span>
      </div>

      <div id="${esc(id)}-popover" class="uf-popover" hidden>
        <div class="uf-popover-top">
          <input
            type="search"
            id="${esc(id)}-search"
            class="field-input uf-search-input"
            value="${esc(ctrl.search || '')}"
            placeholder="Buscar sigla ou estado (ex: MG, São Paulo)..."
            oninput="window.AprovaUtils._ufFilterSearch('${esc(id)}', this.value)"
          />
          <div class="uf-popover-actions">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaUtils._ufSelectAllStates('${esc(id)}')">
              Todos (27 UFs + Nacional)
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaUtils._ufClear('${esc(id)}')">
              Limpar
            </button>
          </div>
        </div>
        <div class="uf-popover-grid" role="listbox" aria-multiselectable="true">
          ${matchingUfs.map(u => {
            const isSel = ctrl.selected.includes(u.code);
            const isNac = u.code === 'Nacional';
            return `
              <button
                type="button"
                role="option"
                aria-selected="${isSel ? 'true' : 'false'}"
                title="${esc(u.name)}"
                class="uf-option-pill ${isSel ? 'selected' : ''} ${isNac ? 'uf-option-nacional' : ''}"
                onclick="window.AprovaUtils._ufToggleCode('${esc(id)}', '${esc(u.code)}')"
              >
                <strong>${esc(u.code)}</strong>
                <span>${esc(u.name.replace(' (Todo o Brasil)', ''))}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  _refreshUfWidget(id, keepOpen = true) {
    const wrap = document.getElementById(`${id}-wrap`);
    if (!wrap) return;
    const prevSearchFocused = document.activeElement?.id === `${id}-search`;
    wrap.innerHTML = this._buildUfInnerHtml(id);
    if (keepOpen) {
      const pop = document.getElementById(`${id}-popover`);
      const trig = document.getElementById(`${id}-trigger`);
      if (pop) {
        pop.hidden = false;
        pop.classList.add('open');
      }
      if (trig) trig.setAttribute('aria-expanded', 'true');
      if (prevSearchFocused) {
        const sEl = document.getElementById(`${id}-search`);
        if (sEl) {
          sEl.focus();
          const len = sEl.value.length;
          sEl.setSelectionRange(len, len);
        }
      }
    }
  },

  _resolveCallback(path) {
    if (typeof path === 'function') return path;
    if (typeof path !== 'string' || !path.trim()) return null;
    const clean = path.trim().replace(/^window\./, '');
    const fn = clean.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), window);
    return typeof fn === 'function' ? fn : null;
  },

  _notifyUfChanged(id) {
    const ctrl = this._ufControls[id];
    if (!ctrl || !ctrl.onChange) return;
    const vals = this.getUfMultiSelectValues(id);
    const fn = this._resolveCallback(ctrl.onChange);
    if (fn) fn(vals, id);
  },

  _ufToggleDropdown(id) {
    const pop = document.getElementById(`${id}-popover`);
    const trig = document.getElementById(`${id}-trigger`);
    if (!pop) return;
    const willOpen = pop.hidden || !pop.classList.contains('open');

    document.querySelectorAll('.uf-popover.open').forEach(other => {
      if (other.id !== `${id}-popover`) {
        other.classList.remove('open');
        other.hidden = true;
        const t = other.closest('.uf-multiselect')?.querySelector('.uf-chips-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });

    pop.hidden = !willOpen;
    pop.classList.toggle('open', willOpen);
    if (trig) trig.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) {
      document.getElementById(`${id}-search`)?.focus();
    }
  },

  _ufFilterSearch(id, query) {
    const ctrl = this._ufControls[id];
    if (!ctrl) return;
    ctrl.search = query || '';
    this._refreshUfWidget(id, true);
  },

  _ufToggleCode(id, code) {
    const ctrl = this._ufControls[id];
    if (!ctrl) return;
    const idx = ctrl.selected.indexOf(code);
    if (idx >= 0) {
      if (!ctrl.allowEmpty && ctrl.selected.length === 1) {
        this.showToast('Mantenha pelo menos 1 UF ou marque "Nacional".');
        return;
      }
      ctrl.selected.splice(idx, 1);
    } else {
      ctrl.selected.push(code);
    }
    const wasOpen = Boolean(document.getElementById(`${id}-popover`)?.classList.contains('open'));
    this._refreshUfWidget(id, wasOpen);
    this._notifyUfChanged(id);
  },

  _ufSelectAllStates(id) {
    const ctrl = this._ufControls[id];
    if (!ctrl) return;
    ctrl.selected = this.BR_UFS.map(u => u.code);
    this._refreshUfWidget(id, true);
    this._notifyUfChanged(id);
  },

  _ufClear(id) {
    const ctrl = this._ufControls[id];
    if (!ctrl) return;
    ctrl.selected = ctrl.allowEmpty ? [] : ['Nacional'];
    this._refreshUfWidget(id, true);
    this._notifyUfChanged(id);
  },

  getUfMultiSelectValues(id) {
    const ctrl = this._ufControls[id];
    if (!ctrl) return ['Nacional'];
    if (!ctrl.selected.length && !ctrl.allowEmpty) return ['Nacional'];
    return [...ctrl.selected];
  },

  renderDailyGoalControl(id, initialValue, options = {}) {
    const val = Math.max(0.5, Math.min(16, Number(initialValue) || 4));
    const presets = [1, 2, 3, 4, 6, 8];
    const onChange = options.onChange || '';
    const esc = (v) => this.escapeHtml(v);

    return `
      <div class="daily-goal-control">
        <div class="daily-goal-input-wrap">
          <input
            type="number"
            id="${esc(id)}"
            class="field-input daily-goal-num-input"
            min="0.5"
            max="16"
            step="0.5"
            value="${val}"
            aria-describedby="${esc(id)}-hint"
            oninput="window.AprovaUtils._onDailyGoalInput('${esc(id)}', this.value, '${esc(onChange)}')"
            required
          />
          <span id="${esc(id)}-human-badge" class="daily-goal-human-badge">
            ${esc(this.formatHorasDiarias(val))}
          </span>
        </div>
        <div class="daily-goal-presets" role="group" aria-label="Atalhos rápidos de meta diária">
          ${presets.map(p => `
            <button
              type="button"
              class="choice-pill daily-preset-pill ${Math.abs(val - p) < 0.01 ? 'selected' : ''}"
              data-goal-id="${esc(id)}"
              data-goal-val="${p}"
              onclick="window.AprovaUtils._dailyGoalSetPreset('${esc(id)}', ${p}, '${esc(onChange)}')"
            >
              ${p}h
            </button>
          `).join('')}
        </div>
        <span id="${esc(id)}-hint" class="text-caption-muted">
          Digite qualquer carga entre 0,5h (30 min) e 16h/dia ou escolha um atalho.
        </span>
      </div>
    `;
  },

  _dailyGoalSetPreset(id, val, onChangePath) {
    const inp = document.getElementById(id);
    if (inp) {
      inp.value = String(val);
    }
    this._onDailyGoalInput(id, val, onChangePath);
  },

  _onDailyGoalInput(id, rawVal, onChangePath) {
    const parsed = parseFloat(String(rawVal).replace(',', '.'));
    const valid = !Number.isNaN(parsed) && parsed >= 0.5 && parsed <= 16;
    const badge = document.getElementById(`${id}-human-badge`);
    if (badge) {
      badge.textContent = valid ? this.formatHorasDiarias(parsed) : '0,5h a 16h';
    }
    document.querySelectorAll(`.daily-preset-pill[data-goal-id="${id}"]`).forEach(btn => {
      const pv = parseFloat(btn.dataset.goalVal);
      btn.classList.toggle('selected', valid && Math.abs(parsed - pv) < 0.01);
    });
    if (valid && onChangePath) {
      const fn = this._resolveCallback(onChangePath);
      if (fn) fn(parsed, id);
    }
  }
};
