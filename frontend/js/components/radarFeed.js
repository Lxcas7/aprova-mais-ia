/**
 * Componente: Radar IA de Concursos Previstos (O que estão falando na internet) + Submissão Colaborativa
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderRadar = async function () {
  const container = document.getElementById('radar-feed-container');
  if (!container) return;

  container.innerHTML = `<div style="padding:24px; color:var(--muted); font-size:0.9375rem;">Consultando motor de NLP e rumores da internet...</div>`;
  const data = await window.AprovaAPI.listarRumores();
  const rumores = data.rumores || [];
  const clean = window.AprovaUtils.cleanText;

  const cardsHtml = rumores.map(r => `
    <article class="concurso-card">
      <div>
        <h3 style="font-size:1.125rem; font-weight:800; color:var(--text); margin-bottom:8px;">
          "${clean(r.titulo_noticia)}"
        </h3>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="badge badge-previsto">${clean(r.orgao_sigla)} · ${clean(r.estagio_maturidade)}</span>
          <span style="font-size:0.8125rem; color:var(--muted); font-weight:600;">${clean(r.data_captura)}</span>
        </div>

        <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:12px;">
          <strong>Fontes rastreadas pela IA:</strong> ${clean(r.fonte_portal)}
        </p>

        <div style="padding:12px 0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8125rem; font-weight:700; color:var(--amber);">
            <span>Termômetro de Confiança IA</span>
            <span>${r.confianca_ia}% de probabilidade de edital</span>
          </div>
          <div class="thermometer-bar">
            <div class="thermometer-fill" style="width:${r.confianca_ia}%;"></div>
          </div>
          <p style="font-size:0.875rem; color:var(--text-secondary); margin-top:6px;">
            <strong>Parecer da IA:</strong> ${clean(r.analise_ia)}
          </p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; padding-top:8px;">
        <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.votarRumor(${r.id})">
          <span>Confirmar Rumor (${r.votos_comunidade} concurseiros)</span>
        </button>
        ${r.concurso_id && r.concurso_id !== 'geral' ? `
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${r.concurso_id}')">
            <span>Estudar Pré-Edital Agora</span>
          </button>
        ` : `<span class="badge badge-purple">Monitoramento Ativo</span>`}
      </div>
    </article>
  `).join('');

  container.innerHTML = `
    <div class="cards-grid" style="margin-bottom:24px;">
      ${cardsHtml}
    </div>

    <div class="concurso-card">
      <h3 style="font-size:1.125rem; font-weight:800; margin-bottom:6px; color:var(--text);">
        Cocriação com Concurseiros: Viu alguma notícia ou movimentação na internet?
      </h3>
      <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:16px;">
        Envie a notícia abaixo. Nossa IA classifica automaticamente o estágio de maturidade (Dispensa de Licitação, Comissão Formada, Pedido no MGI ou Boato) e calcula o índice de confiança.
      </p>
      <form onsubmit="window.AprovaComponents.submeterRumor(event)" style="display:grid; grid-template-columns:1fr 2fr 1.5fr auto; gap:12px; align-items:end;">
        <div class="field-group">
          <label for="rumor-sigla">Sigla do Órgão</label>
          <input type="text" id="rumor-sigla" class="field-input" placeholder="Ex: MPU, TRF-1, BNDES" required />
        </div>
        <div class="field-group">
          <label for="rumor-noticia">O que estão falando na internet / Notícia</label>
          <input type="text" id="rumor-noticia" class="field-input" placeholder="Ex: Comissão formada e contrato com banca Cebraspe em assinatura" required />
        </div>
        <div class="field-group">
          <label for="rumor-fonte">Fonte / Portal / Fórum</label>
          <input type="text" id="rumor-fonte" class="field-input" placeholder="Ex: DOU / Folha Dirigida / Fórum" required />
        </div>
        <button type="submit" class="btn btn-primary" style="height:42px;">
          Classificar com IA
        </button>
      </form>
    </div>
  `;
};

window.AprovaComponents.votarRumor = async function (rumorId) {
  await window.AprovaAPI.votarRumor(rumorId);
  window.AprovaUtils.showToast('Voto de relevância computado no Radar IA.');
  window.AprovaComponents.renderRadar();
};

window.AprovaComponents.submeterRumor = async function (event) {
  event.preventDefault();
  const payload = {
    orgao_sigla: document.getElementById('rumor-sigla').value.trim(),
    titulo_noticia: document.getElementById('rumor-noticia').value.trim(),
    fonte_portal: document.getElementById('rumor-fonte').value.trim()
  };
  const res = await window.AprovaAPI.enviarRumor(payload);
  window.AprovaUtils.showToast(
    `IA classificou rumor de ${res.orgao_sigla}: ${res.estagio_maturidade} (${res.confianca_ia}% confiança).`
  );
  window.AprovaComponents.renderRadar();
};
