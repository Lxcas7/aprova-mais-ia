/**
 * Componente: Dossiê de Concurso (Ativo, Previsto pela IA na Internet ou Histórico/Encerrado)
 * Hierarquia tipográfica plana (sem cards aninhados), contrastes WCAG AA+ e classes semânticas.
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderConcursoCard = function (concurso) {
  const utils = window.AprovaUtils;
  const safe = (v) => utils.safeText(v);
  const badgeClass = utils.getStatusBadgeClass(concurso.status);
  const statusDot = utils.getStatusDot(concurso.status);
  const shortStatus = utils.getShortStatusLabel(concurso.status);
  const heading = utils.formatConcursoHeading(concurso.sigla, concurso.titulo);
  const materiaisCount = (concurso.materiais || []).length;
  const estudadosCount = (concurso.materiais || []).filter(m => m.estudado).length;

  const probVal = concurso.probabilidade_ia || concurso.prob_ia || 100;
  const inscrVal = concurso.inscricoes || concurso.prazo || 'Consulte o edital';
  const corteVal = concurso.nota_corte_historica || concurso.nota_corte_anterior || 'Referência oficial';
  const safeId = utils.escapeHtml(concurso.id);

  const probBadge = concurso.status === 'previsto'
    ? `<span class="badge badge-previsto">${safe(probVal)}% Confiança IA</span>`
    : '';
  const materiaisBadge = `<span class="badge badge-cobalt">${estudadosCount}/${materiaisCount} Materiais</span>`;

  return `
    <article class="concurso-card">
      <div>
        <div class="dossier-header">
          <h3 class="dossier-title">
            ${heading}
          </h3>
          <button
            type="button"
            class="btn ${concurso.salvo ? 'btn-primary' : 'btn-outline'} btn-sm"
            aria-pressed="${concurso.salvo ? 'true' : 'false'}"
            onclick="window.AprovaApp.toggleFavorito('${safeId}')"
            title="${concurso.salvo ? 'Remover do caderno de estudos' : 'Salvar no caderno de estudos'}"
          >
            ${concurso.salvo ? utils.icon('bookmarkFilled') : utils.icon('bookmark')}
            <span>${concurso.salvo ? 'Salvo no caderno' : 'Salvar no caderno'}</span>
          </button>
        </div>

        <p class="dossier-subtitle">
          ${safe(concurso.orgao)} · Banca: <strong>${safe(concurso.banca)}</strong> · UF: <strong>${safe(concurso.uf)}</strong>
        </p>

        <div class="dossier-badges">
          <span class="badge ${badgeClass}">${statusDot} <span>${safe(shortStatus)}</span></span>
          ${probBadge}
          ${materiaisBadge}
          <span class="badge badge-neutral">${safe(concurso.area)}</span>
        </div>

        <div class="card-divider-grid">
          <div class="meta-item">
            <span>Remuneração Inicial</span>
            <strong class="salary-highlight">${safe(concurso.salario)}</strong>
          </div>
          <div class="meta-item">
            <span>Vagas e Escolaridade</span>
            <strong>${safe(concurso.vagas)} (${safe(concurso.escolaridade)})</strong>
          </div>
          <div class="meta-item">
            <span>Inscrições / Situação</span>
            <strong>${safe(inscrVal)}</strong>
          </div>
          <div class="meta-item">
            <span>Prova / Previsão</span>
            <strong>${safe(concurso.data_prova)}</strong>
          </div>
        </div>

        <div class="ai-editorial-note">
          <div class="ai-editorial-head">
            <span>Diagnóstico Aprova+ IA</span>
            <span class="corte-ref">Último corte: ${safe(corteVal)}</span>
          </div>
          <p class="ai-editorial-body">
            ${safe(concurso.resumo_ia)}
          </p>
          <button type="button" class="link-expand-note" onclick="window.AprovaComponents.openConcursoModal('${safeId}', this)">
            Ler parecer completo e matriz no Raio-X →
          </button>
        </div>
      </div>

      <div class="dossier-actions">
        <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${safeId}', this)">
          <span>Raio-X e Materiais (${materiaisCount})</span>
        </button>
        <button type="button" class="btn btn-outline" onclick="window.AprovaApp.irParaMateriaisDoConcurso('${safeId}')">
          ${utils.icon('download')}
          <span>Roteiros PDF</span>
        </button>
      </div>
    </article>
  `;
};
