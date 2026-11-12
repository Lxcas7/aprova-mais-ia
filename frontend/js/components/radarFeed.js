/**
 * Componente: Radar IA de Concursos Previstos (O que estão falando na internet) + Submissão Colaborativa
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderRadar = async function () {
  const container = document.getElementById('radar-feed-container');
  if (!container) return;

  container.innerHTML = `<div style="padding:24px; color:#64748b;">🔄 Consultando motor de NLP e rumores da internet no banco SQLite...</div>`;
  const data = await window.AprovaAPI.listarRumores();
  const rumores = data.rumores || [];

  const cardsHtml = rumores.map(r => `
    <div class="concurso-card" style="border-left: 5px solid #f59e0b;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
          <span class="badge badge-previsto">📡 ${r.orgao_sigla} • ${r.estagio_maturidade}</span>
          <span style="font-size:0.76rem; color:#64748b; font-weight:700;">🕒 ${r.data_captura}</span>
        </div>

        <h3 style="font-size:1.05rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
          "${r.titulo_noticia}"
        </h3>
        <p style="font-size:0.8rem; color:#475569; margin-bottom:10px;">
          🌐 <strong>Fontes rastreadas pela IA:</strong> ${r.fonte_portal}
        </p>

        <div style="background:#fffbeb; border:1px solid #fde68a; padding:10px 12px; border-radius:10px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800; color:#b45309;">
            <span>TERMÔMETRO DE CONFIANÇA IA</span>
            <span>${r.confianca_ia}% de probabilidade de edital</span>
          </div>
          <div class="thermometer-bar">
            <div class="thermometer-fill" style="width:${r.confianca_ia}%;"></div>
          </div>
          <p style="font-size:0.81rem; color:#78350f; margin-top:4px;">
            🤖 <strong>Parecer da IA:</strong> ${r.analise_ia}
          </p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9;">
        <button class="btn btn-outline" style="padding:7px 12px; font-size:0.8rem;" onclick="window.AprovaComponents.votarRumor(${r.id})">
          🔥 Confirmar Rumor (${r.votos_comunidade} concurseiros)
        </button>
        ${r.concurso_id && r.concurso_id !== 'geral' ? `
          <button class="btn btn-primary" style="padding:7px 12px; font-size:0.8rem;" onclick="window.AprovaComponents.openConcursoModal('${r.concurso_id}')">
            📚 Estudar Pré-Edital Agora
          </button>
        ` : `<span class="badge badge-purple">Monitoramento Ativo</span>`}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="cards-grid" style="margin-bottom:24px;">
      ${cardsHtml}
    </div>

    <div class="concurso-card" style="background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border:1px dashed #94a3b8;">
      <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:4px; color:#0f172a;">
        🕵️ Cocriação com Concurseiros: Viu alguma notícia ou rumor na internet?
      </h3>
      <p style="font-size:0.84rem; color:#475569; margin-bottom:14px;">
        Envie o rumor abaixo! Nossa IA classifica automaticamente o estágio de maturidade (Dispensa de Licitação, Comissão Formada, Pedido no MGI ou Boato) e calcula a probabilidade no banco SQLite.
      </p>
      <form onsubmit="window.AprovaComponents.submeterRumor(event)" style="display:grid; grid-template-columns:1fr 2fr 1.5fr auto; gap:10px; align-items:end;">
        <div class="field-group">
          <label>Sigla do Órgão</label>
          <input type="text" id="rumor-sigla" class="field-input" placeholder="Ex: MPU, TRF-1, BNDES" required />
        </div>
        <div class="field-group">
          <label>O que estão falando na internet / Notícia</label>
          <input type="text" id="rumor-noticia" class="field-input" placeholder="Ex: Comissão formada e contrato com banca Cebraspe em assinatura" required />
        </div>
        <div class="field-group">
          <label>Fonte / Portal / Fórum</label>
          <input type="text" id="rumor-fonte" class="field-input" placeholder="Ex: DOU / Folha Dirigida / Instagram" required />
        </div>
        <button type="submit" class="btn btn-primary" style="height:41px;">
          🤖 Classificar com IA
        </button>
      </form>
    </div>
  `;
};

window.AprovaComponents.votarRumor = async function (rumorId) {
  await window.AprovaAPI.votarRumor(rumorId);
  window.AprovaUtils.showToast('🔥 Voto de relevância computado no Radar IA!', '#f59e0b');
  window.AprovaComponents.renderRadar();
  window.AprovaApp.atualizarTelemetriaTopo();
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
    `📡 IA classificou rumor de <strong>${res.orgao_sigla}</strong>: ${res.estagio_maturidade} (${res.confianca_ia}% confiança)`,
    '#2563eb'
  );
  window.AprovaComponents.renderRadar();
  window.AprovaApp.atualizarTelemetriaTopo();
};

