/**
 * Componente: Radar IA de Concursos Previstos (Layout Assimétrico: Ledger de Despachos + Painel de Cocriação)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const RADAR_VOTES_KEY = 'aprova_mais_radar_votes_v1';

  function getVotedSet() {
    try {
      const raw = localStorage.getItem(RADAR_VOTES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.map(Number));
      }
    } catch (e) {}
    return new Set();
  }

  function markVoted(rumorId) {
    const set = getVotedSet();
    set.add(Number(rumorId));
    try {
      localStorage.setItem(RADAR_VOTES_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  function renderEntriesHtml(rumores) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const votedSet = getVotedSet();

    return rumores.map(r => {
      const rid = Number(r.id);
      const alreadyVoted = votedSet.has(rid);
      const fillClass = r.confianca_ia >= 85 ? 'fill-green' : 'fill-amber';
      const pct = Math.max(0, Math.min(100, Number(r.confianca_ia) || 0));
      const votes = Number(r.votos_comunidade) || 0;
      const fonteHtml = utils.formatSourceWithLinks(r.fonte_portal);

      return `
        <article class="radar-entry">
          <div class="radar-entry-top">
            <div class="dossier-badges">
              <span class="badge badge-previsto">${safe(r.orgao_sigla)} · ${safe(r.estagio_maturidade)}</span>
            </div>
            <span class="radar-entry-date">${safe(r.data_captura)}</span>
          </div>

          <h3 class="radar-entry-title">
            "${safe(r.titulo_noticia)}"
          </h3>

          <p class="radar-entry-source">
            <strong>Fontes rastreadas:</strong> ${fonteHtml}
          </p>

          <div class="radar-meter-block">
            <div class="radar-meter-head">
              <span>Termômetro de Maturidade Pré-Edital</span>
              <span>${pct}% de probabilidade estimada</span>
            </div>
            <div
              class="thermometer-bar"
              role="progressbar"
              aria-valuenow="${pct}"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Probabilidade estimada de edital: ${pct}%"
            >
              <div class="thermometer-fill ${fillClass}" style="width:${pct}%;"></div>
            </div>
            <p class="ai-editorial-body">
              <strong>Parecer Técnico IA:</strong> ${safe(r.analise_ia)}
            </p>
          </div>

          <div class="radar-entry-actions">
            <button
              type="button"
              class="btn ${alreadyVoted ? 'btn-primary' : 'btn-outline'} btn-sm"
              aria-pressed="${alreadyVoted ? 'true' : 'false'}"
              onclick="window.AprovaComponents.votarRumor(${rid}, this)"
            >
              ${alreadyVoted ? utils.icon('check') : utils.icon('upvote')}
              <span>${alreadyVoted ? `Relevância confirmada (${votes})` : `Confirmar Relevância (${votes} validações)`}</span>
            </button>
            ${r.concurso_id && r.concurso_id !== 'geral' ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openConcursoModal('${esc(r.concurso_id)}', this)">
                <span>Abrir Dossiê e Materiais Pré-Edital</span>
              </button>
            ` : `<span class="badge badge-cobalt">Monitoramento Comunitário Ativo</span>`}
          </div>
        </article>
      `;
    }).join('');
  }

  window.AprovaComponents.renderRadar = async function () {
    const container = document.getElementById('radar-feed-container');
    if (!container) return;

    const utils = window.AprovaUtils;
    container.innerHTML = `<div class="empty-state-sheet" role="status">Consultando sinais de pré-edital...</div>`;
    let data;
    try {
      data = await window.AprovaAPI.listarRumores();
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state-sheet" role="alert">
          <h3>Não foi possível carregar o Radar IA</h3>
          <p>${utils.escapeHtml(err.message || 'Erro ao consultar sinais de pré-edital.')}</p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.renderRadar()">
            ${utils.icon('reset')}
            <span>Tentar novamente</span>
          </button>
        </div>
      `;
      return;
    }

    const rumores = data.rumores || [];

    container.innerHTML = `
      <div class="split-workspace-radar">
        <!-- Coluna 1: Ledger de Sinais e Movimentações -->
        <div id="radar-feed-ledger" class="radar-feed-ledger">
          ${renderEntriesHtml(rumores)}
        </div>

        <!-- Coluna 2: Painel de Submissão e Classificação -->
        <aside class="radar-submit-sheet">
          <h3 class="sheet-title-sm">
            Submeter Movimentação à IA
          </h3>
          <p class="sheet-desc">
            Identificou portaria no DOU, processo no SEI/MGI ou nota de comissão organizadora? Envie os dados abaixo para classificação automática de maturidade.
          </p>

          <form id="radar-submit-form" onsubmit="window.AprovaComponents.submeterRumor(event)" class="form-stack-tight">
            <div class="field-group">
              <label for="rumor-sigla">Sigla do Órgão ou Certame</label>
              <input type="text" id="rumor-sigla" class="field-input" placeholder="Ex: MPU, TRF-1, BNDES, SEFAZ" minlength="2" required />
            </div>
            <div class="field-group">
              <label for="rumor-noticia">Resumo da Movimentação / Notícia</label>
              <textarea id="rumor-noticia" class="field-input" placeholder="Ex: Comissão organizadora formada e termo de dispensa de licitação com a banca Cebraspe em assinatura" minlength="5" required></textarea>
            </div>
            <div class="field-group">
              <label for="rumor-fonte">Fonte Documental ou Link Oficial (URL opcional)</label>
              <input type="text" id="rumor-fonte" class="field-input" placeholder="Ex: https://www.in.gov.br/... ou Diário Oficial / Processo SEI" minlength="3" required />
            </div>
            <div id="radar-error-box" class="auth-error-banner" role="alert"></div>
            <button type="submit" id="radar-submit-btn" class="btn btn-primary btn-block">
              ${utils.icon('radar')}
              <span>Classificar e Publicar no Radar</span>
            </button>
          </form>

          <div class="radar-stages-legend">
            <div class="legend-heading">Critérios de Maturidade Pré-Edital:</div>
            <div><strong>88%–95% (Banca em Contratação):</strong> Dispensa de licitação ou contrato vigente.</div>
            <div><strong>80%–87% (Comissão / Autorizado):</strong> Portaria publicada ou comissão instituída.</div>
            <div><strong>70%–79% (Pedido no MGI):</strong> Nota técnica ou solicitação formal em análise.</div>
            <div><strong>55%–69% (Rumor Inicial):</strong> Declaração institucional em verificação.</div>
          </div>
        </aside>
      </div>
    `;

    document.querySelectorAll('#radar-submit-form input, #radar-submit-form textarea').forEach(el => {
      el.addEventListener('input', () => {
        const errBox = document.getElementById('radar-error-box');
        if (errBox) {
          errBox.classList.remove('visible');
          errBox.textContent = '';
        }
      });
    });
  };

  window.AprovaComponents.votarRumor = async function (rumorId, btnEl) {
    const rid = Number(rumorId);
    if (getVotedSet().has(rid)) {
      window.AprovaUtils.showToast('Você já confirmou a relevância desta movimentação.');
      return;
    }

    const utils = window.AprovaUtils;
    utils.setButtonLoading(btnEl, true, 'Registrando...');
    try {
      const res = await window.AprovaAPI.votarRumor(rid);
      markVoted(rid);
      const totalVotos = Number(res.votos_comunidade) || 1;
      if (btnEl) {
        delete btnEl.dataset.origHtml;
        btnEl.disabled = false;
        btnEl.removeAttribute('aria-busy');
        btnEl.className = 'btn btn-primary btn-sm';
        btnEl.setAttribute('aria-pressed', 'true');
        btnEl.innerHTML = `${utils.icon('check')}<span>Relevância confirmada (${totalVotos})</span>`;
      }
      utils.showToast('Validação comunitária registrada no Radar IA.');
    } catch (err) {
      utils.setButtonLoading(btnEl, false);
      utils.showToast(err.message || 'Erro ao registrar validação.', { variant: 'error' });
    }
  };

  window.AprovaComponents.submeterRumor = async function (event) {
    event.preventDefault();
    const errBox = document.getElementById('radar-error-box');
    const submitBtn = document.getElementById('radar-submit-btn');
    const form = document.getElementById('radar-submit-form');
    const utils = window.AprovaUtils;

    const payload = {
      orgao_sigla: document.getElementById('rumor-sigla').value.trim(),
      titulo_noticia: document.getElementById('rumor-noticia').value.trim(),
      fonte_portal: document.getElementById('rumor-fonte').value.trim()
    };

    utils.setButtonLoading(submitBtn, true, 'Classificando...');
    try {
      const res = await window.AprovaAPI.enviarRumor(payload);
      utils.showToast(
        `Movimentação de ${res.orgao_sigla || payload.orgao_sigla.toUpperCase()} classificada: ${res.estagio_maturidade} (${res.confianca_ia}% confiança).`
      );
      if (form) form.reset();
      const updated = await window.AprovaAPI.listarRumores();
      const ledger = document.getElementById('radar-feed-ledger');
      if (ledger) {
        ledger.innerHTML = renderEntriesHtml(updated.rumores || []);
      }
    } catch (err) {
      if (errBox) {
        errBox.classList.add('visible');
        errBox.textContent = err.message || 'Não foi possível classificar a movimentação.';
      } else {
        utils.showToast(err.message || 'Não foi possível classificar a movimentação.', { variant: 'error' });
      }
    } finally {
      utils.setButtonLoading(submitBtn, false);
    }
  };
})();
