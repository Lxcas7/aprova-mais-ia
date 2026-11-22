/**
 * Tela 7: Radar Pré-Edital (Feed Curado + Sinergia + Termômetro Pré-Edital + Avisos + Enviar Movimentação)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const RADAR_VOTES_KEY = 'aprova_mais_radar_votes_v1';
  const RADAR_ALERT_KEY = 'aprova_mais_radar_alert_v1';

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

  function isAlertsEnabled() {
    try {
      return localStorage.getItem(RADAR_ALERT_KEY) !== 'off';
    } catch (e) {
      return true;
    }
  }

  window.AprovaComponents.toggleRadarAlerts = function (checked) {
    try {
      localStorage.setItem(RADAR_ALERT_KEY, checked ? 'on' : 'off');
    } catch (e) {}
    window.AprovaUtils.showToast(
      checked ? 'Avisos de edital pré-autorizado ativados.' : 'Avisos silenciosos pausados.'
    );
  };

  function renderEntriesHtml(rumores, alvoObj, concMap) {
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
      const relConc = concMap[r.concurso_id];
      const synergy = (relConc && alvoObj) ? window.AprovaComponents.computeSynergyPct(relConc, alvoObj) : null;

      return `
        <article class="radar-entry">
          <div class="radar-entry-top">
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <span class="badge badge-previsto">${safe(r.orgao_sigla)} · ${safe(r.estagio_maturidade)}</span>
              ${synergy ? `<span class="badge badge-cobalt">Sinergia ${synergy}% c/ ${safe(alvoObj.sigla)}</span>` : ''}
            </div>
            <span class="text-caption-muted">${safe(r.data_captura)}</span>
          </div>

          <h3 class="radar-entry-title">"${safe(r.titulo_noticia)}"</h3>

          <p class="text-caption-muted" style="margin-bottom:8px;">
            <strong>Fontes rastreadas:</strong> ${fonteHtml}
          </p>

          <div class="radar-meter-block">
            <div class="radar-meter-head">
              <span>Termômetro Pré-Edital</span>
              <span>${pct}% de probabilidade estimada</span>
            </div>
            <div class="thermometer-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
              <div class="thermometer-fill ${fillClass}" style="width:${pct}%;"></div>
            </div>
            <p style="font-size:0.875rem; color:var(--text-secondary);">
              <strong>Análise de Sinergia e Contexto:</strong> ${safe(r.analise_ia)}
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
              <span>${alreadyVoted ? `Confirmado (${votes})` : `▲ Faz sentido (${votes})`}</span>
            </button>
            ${r.concurso_id && r.concurso_id !== 'geral' ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openConcursoModal('${esc(r.concurso_id)}', this)">
                Abrir Raio-X e Guias →
              </button>
            ` : `<span class="badge badge-neutral">Em acompanhamento comunitário</span>`}
          </div>
        </article>
      `;
    }).join('');
  }

  window.AprovaComponents.renderRadar = async function () {
    const container = document.getElementById('radar-feed-container');
    if (!container) return;

    const utils = window.AprovaUtils;
    container.innerHTML = `<div class="empty-state-sheet" role="status">Consultando movimentações de pré-edital...</div>`;
    let data;
    let concResp = { concursos: [] };
    try {
      [data, concResp] = await Promise.all([
        window.AprovaAPI.listarRumores(),
        window.AprovaAPI.listarConcursos()
      ]);
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state-sheet" role="alert">
          <h3>Não foi possível carregar o Radar</h3>
          <p>${utils.escapeHtml(err.message || 'Erro ao consultar movimentações.')}</p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.renderRadar()">Tentar novamente</button>
        </div>
      `;
      return;
    }

    const user = window.AprovaAPI.obterUsuarioAtual();
    const guestOb = window.AprovaAPI.obterOnboardingVisitante();
    const alvoId = user?.concurso_alvo_id || guestOb?.concurso_alvo_id || 'pf-2026';
    const concList = concResp.concursos || [];
    const alvoObj = concList.find(c => c.id === alvoId) || concList[0] || null;
    const concMap = {};
    concList.forEach(c => { concMap[c.id] = c; });

    const rumores = data.rumores || [];
    const alertsOn = isAlertsEnabled();

    container.innerHTML = `
      <div class="split-workspace-radar">
        <div id="radar-feed-ledger" class="radar-feed-ledger">
          ${renderEntriesHtml(rumores, alvoObj, concMap)}
        </div>

        <aside class="radar-submit-sheet">
          <div class="switch-row">
            <div>
              <strong style="font-size:0.875rem; display:block;">Avisos de Pré-Edital</strong>
              <span class="text-caption-muted">Alertar sobre bancas e editais afins</span>
            </div>
            <input type="checkbox" ${alertsOn ? 'checked' : ''} aria-label="Ativar avisos pré-edital" onchange="window.AprovaComponents.toggleRadarAlerts(this.checked)" style="width:20px; height:20px; accent-color:var(--primary); cursor:pointer;" />
          </div>

          <h2 class="sheet-title-sm">Enviar Movimentação</h2>
          <p class="sheet-desc">
            Viu portaria no DOU, processo no MGI ou escolha de banca? Envie para avaliação do Termômetro Pré-Edital.
          </p>

          <form id="radar-submit-form" onsubmit="window.AprovaComponents.submeterRumor(event)" class="form-stack">
            <div class="field-group">
              <label for="rumor-sigla">Sigla do Órgão ou Certame</label>
              <input type="text" id="rumor-sigla" class="field-input" placeholder="Ex: MPU, TRF-1, SEFAZ" minlength="2" required />
            </div>
            <div class="field-group">
              <label for="rumor-noticia">Resumo da Movimentação</label>
              <textarea id="rumor-noticia" class="field-input" placeholder="Ex: Comissão formada e contrato com banca em fase final" minlength="5" required></textarea>
            </div>
            <div class="field-group">
              <label for="rumor-fonte">Fonte Documental</label>
              <input type="text" id="rumor-fonte" class="field-input" placeholder="Ex: Diário Oficial / Processo SEI" minlength="3" required />
            </div>
            <div id="radar-error-box" class="auth-error-banner" role="alert"></div>
            <button type="submit" id="radar-submit-btn" class="btn btn-primary btn-block">
              ${utils.icon('radar')}
              <span>Enviar Movimentação</span>
            </button>
          </form>
        </aside>
      </div>
    `;
  };

  window.AprovaComponents.votarRumor = async function (rumorId, btnEl) {
    const rid = Number(rumorId);
    if (getVotedSet().has(rid)) {
      window.AprovaUtils.showToast('Você já validou esta movimentação.');
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
        btnEl.innerHTML = `${utils.icon('check')}<span>Confirmado (${totalVotos})</span>`;
      }
      utils.showToast('Voto registrado no Termômetro Pré-Edital.');
    } catch (err) {
      utils.setButtonLoading(btnEl, false);
      utils.showToast(err.message || 'Erro ao votar.', { variant: 'error' });
    }
  };

  window.AprovaComponents.submeterRumor = async function (event) {
    event.preventDefault();
    const errBox = document.getElementById('radar-error-box');
    const submitBtn = document.getElementById('radar-submit-btn');
    const utils = window.AprovaUtils;

    const payload = {
      orgao_sigla: document.getElementById('rumor-sigla').value.trim(),
      titulo_noticia: document.getElementById('rumor-noticia').value.trim(),
      fonte_portal: document.getElementById('rumor-fonte').value.trim()
    };

    utils.setButtonLoading(submitBtn, true, 'Enviando...');
    try {
      const res = await window.AprovaAPI.enviarRumor(payload);
      utils.showToast(`Movimentação classificada (${res.confianca_ia}% no Termômetro Pré-Edital).`);
      window.AprovaComponents.renderRadar();
    } catch (err) {
      utils.setButtonLoading(submitBtn, false);
      if (errBox) {
        errBox.classList.add('visible');
        errBox.textContent = err.message || 'Erro ao enviar movimentação.';
      }
    }
  };
})();
