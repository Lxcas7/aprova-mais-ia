window.AprovaUtils = {
  _modalTriggers: {},
  _modalStack: [],
  _trapHandler: null,

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
    return str.replace(/\s*—\s*/g, ' · ');
  },

  safeText(str) {
    if (str === null || str === undefined) return '';
    return this.escapeHtml(this.cleanText(String(str)));
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
      : (options.actionLabel ? 5200 : 3200);
    setTimeout(dismiss, duration);
  },

  _setBackgroundInert(isInert) {
    const selectors = ['.top-status-bar', '.app-header', '#hero-workspace', '#main-content', '.app-footer'];
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
          <strong class="material-preview-kicker">Pré-visualização do Roteiro (PDF)</strong>
          <div class="material-preview-sub">
            ${safe(preview.concurso_sigla)} · ${safe(preview.banca)} · ${safe(preview.salario)}
          </div>
        </div>
        <button type="button" class="btn btn-accent btn-sm" onclick="window.AprovaAPI.baixarMaterial(${Number(preview.id)})">
          ${this.icon('download')}
          <span>Baixar PDF</span>
        </button>
      </div>
      <div class="material-preview-body">
        <p><strong>Escopo do guia:</strong> ${safe(preview.resumo_conteudo)}</p>
        <p><strong>Direcionamento da prova:</strong> ${safe(preview.resumo_ia)}</p>
        ${discs ? `
          <div class="material-preview-section">
            <strong>Checklist Verticalizado de Disciplinas:</strong>
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
    box.innerHTML = '<div class="material-preview-loading">Carregando pré-visualização do roteiro...</div>';

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
      book: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
      radar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 12 19 5"/><circle cx="12" cy="12" r="4"/></svg>',
      user: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      reset: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
      upvote: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
      send: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      x: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    };
    return icons[name] || '';
  }
};
