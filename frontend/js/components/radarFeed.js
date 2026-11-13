/**
 * Componente: Radar IA de Concursos Previstos (Layout Assimétrico: Ledger de Despachos + Painel de Cocriação)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderRadar = async function () {
  const container = document.getElementById('radar-feed-container');
  if (!container) return;

  container.innerHTML = `<div class="empty-state-sheet">Consultando motor de classificação e sinais de pré-edital...</div>`;
  const data = await window.AprovaAPI.listarRumores();
  const rumores = data.rumores || [];
  const clean = window.AprovaUtils.cleanText;

  const entriesHtml = rumores.map(r => {
    const fillClass = r.confianca_ia >= 85 ? 'fill-green' : 'fill-amber';
    return `
      <article class="radar-entry">
        <div class="radar-entry-top">
          <div class="dossier-badges">
            <span class="badge badge-previsto">${clean(r.orgao_sigla)} · ${clean(r.estagio_maturidade)}</span>
            <span class="badge badge-neutral">Índice IA: ${r.confianca_ia}%</span>
          </div>
          <span class="radar-entry-date">${clean(r.data_captura)}</span>
        </div>

        <h3 class="radar-entry-title">
          "${clean(r.titulo_noticia)}"
        </h3>

        <p class="radar-entry-source">
          <strong>Fontes rastreadas:</strong> ${clean(r.fonte_portal)}
        </p>

        <div class="radar-meter-block">
          <div class="radar-meter-head">
            <span>Termômetro de Maturidade de Edital</span>
            <span>${r.confianca_ia}% de probabilidade estimada</span>
          </div>
          <div class="thermometer-bar">
            <div class="thermometer-fill ${fillClass}" style="width:${r.confianca_ia}%;"></div>
          </div>
          <p class="ai-editorial-body">
            <strong>Parecer Técnico IA:</strong> ${clean(r.analise_ia)}
          </p>
        </div>

        <div class="radar-entry-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.votarRumor(${r.id})">
            ${window.AprovaUtils.icon('upvote')}
            <span>Confirmar Relevância (${r.votos_comunidade} validações)</span>
          </button>
          ${r.concurso_id && r.concurso_id !== 'geral' ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openConcursoModal('${r.concurso_id}')">
              <span>Abrir Dossiê e Materiais Pré-Edital</span>
            </button>
          ` : `<span class="badge badge-cobalt">Monitoramento Comunitário Ativo</span>`}
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = `
    <div class="split-workspace-radar">
      <!-- Coluna 1: Ledger de Sinais e Movimentações -->
      <div class="radar-feed-ledger">
        ${entriesHtml}
      </div>

      <!-- Coluna 2: Painel de Submissão e Classificação NLP -->
      <aside class="radar-submit-sheet">
        <h3 class="sheet-title-sm">
          Submeter Movimentação à IA
        </h3>
        <p class="sheet-desc">
          Identificou portaria no DOU, processo no SEI/MGI ou nota de comissão organizadora? Envie os dados abaixo para classificação automática de maturidade.
        </p>

        <form onsubmit="window.AprovaComponents.submeterRumor(event)" class="form-stack-tight">
          <div class="field-group">
            <label for="rumor-sigla">Sigla do Órgão ou Certame</label>
            <input type="text" id="rumor-sigla" class="field-input" placeholder="Ex: MPU, TRF-1, BNDES, SEFAZ" required />
          </div>
          <div class="field-group">
            <label for="rumor-noticia">Resumo da Movimentação / Notícia</label>
            <textarea id="rumor-noticia" class="field-input" placeholder="Ex: Comissão organizadora formada e termo de dispensa de licitação com a banca Cebraspe em assinatura" required></textarea>
          </div>
          <div class="field-group">
            <label for="rumor-fonte">Fonte Documental / Portal / Processo</label>
            <input type="text" id="rumor-fonte" class="field-input" placeholder="Ex: Diário Oficial da União / Processo SEI / Portal" required />
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            ${window.AprovaUtils.icon('radar')}
            <span>Classificar e Publicar no Radar</span>
          </button>
        </form>

        <div class="radar-stages-legend">
          <div class="legend-heading">Régua de Classificação NLP:</div>
          <div><strong>88%–95% (Banca em Contratação):</strong> Dispensa de licitação ou contrato vigente.</div>
          <div><strong>80%–87% (Comissão / Autorizado):</strong> Portaria publicada ou comissão instituída.</div>
          <div><strong>70%–79% (Pedido no MGI):</strong> Nota técnica ou solicitação formal em análise.</div>
          <div><strong>55%–69% (Rumor Inicial):</strong> Declaração institucional em verificação.</div>
        </div>
      </aside>
    </div>
  `;
};

window.AprovaComponents.votarRumor = async function (rumorId) {
  await window.AprovaAPI.votarRumor(rumorId);
  window.AprovaUtils.showToast('Validação comunitária registrada no Radar IA.');
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
    `Movimentação de ${res.orgao_sigla || payload.orgao_sigla.toUpperCase()} classificada: ${res.estagio_maturidade} (${res.confianca_ia}% confiança).`
  );
  window.AprovaComponents.renderRadar();
};
