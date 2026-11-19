/**
 * Componente: Dossiê de Concurso (Ativo, Previsto pela IA na Internet ou Histórico/Encerrado)
 * Hierarquia tipográfica plana (sem cards aninhados), contrastes WCAG AA+ e classes semânticas.
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderConcursoCard = function (concurso) {
  const safe = (v) => window.AprovaUtils.safeText(v);
  const badgeClass = window.AprovaUtils.getStatusBadgeClass(concurso.status);
  const statusDot = window.AprovaUtils.getStatusDot(concurso.status);
  const materiaisCount = (concurso.materiais || []).length;
  const estudadosCount = (concurso.materiais || []).filter(m => m.estudado).length;

  const probVal = concurso.probabilidade_ia || concurso.prob_ia || 100;
  const inscrVal = concurso.inscricoes || concurso.prazo || 'Consulte o edital';
  const corteVal = concurso.nota_corte_historica || concurso.nota_corte_anterior || 'Referência oficial';
  const safeId = window.AprovaUtils.escapeHtml(concurso.id);

  const secondaryBadge = concurso.status === 'previsto'
    ? `<span class="badge badge-previsto">${safe(probVal)}% Confiança IA</span>`
    : `<span class="badge badge-cobalt">${estudadosCount}/${materiaisCount} Materiais</span>`;

  return `
    <article class="concurso-card">
      <div>
        <div class="dossier-header">
          <h3 class="dossier-title">
            ${safe(concurso.sigla)} · ${safe(concurso.titulo)}
          </h3>
          <button
            type="button"
            class="btn ${concurso.salvo ? 'btn-primary' : 'btn-outline'} btn-sm"
            aria-pressed="${concurso.salvo ? 'true' : 'false'}"
            onclick="window.AprovaApp.toggleFavorito('${safeId}')"
            title="${concurso.salvo ? 'Remover dos salvos' : 'Salvar concurso no caderno'}"
          >
            ${concurso.salvo ? window.AprovaUtils.icon('bookmarkFilled') : window.AprovaUtils.icon('bookmark')}
            <span>${concurso.salvo ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>

        <p class="dossier-subtitle">
          ${safe(concurso.orgao)} · Banca: <strong>${safe(concurso.banca)}</strong> · UF: <strong>${safe(concurso.uf)}</strong>
        </p>

        <div class="dossier-badges">
          <span class="badge ${badgeClass}">${statusDot} <span>${safe(concurso.status_label)}</span></span>
          ${secondaryBadge}
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
            <span class="corte-ref">Corte ref.: ${safe(corteVal)}</span>
          </div>
          <p class="ai-editorial-body">
            ${safe(concurso.resumo_ia)}
          </p>
        </div>
      </div>

      <div class="dossier-actions">
        <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${safeId}', this)">
          <span>Raio-X e Materiais (${materiaisCount})</span>
        </button>
        <button type="button" class="btn btn-outline" onclick="window.AprovaApp.irParaMateriaisDoConcurso('${safeId}')">
          ${window.AprovaUtils.icon('download')}
          <span>Roteiros PDF</span>
        </button>
      </div>
    </article>
  `;
};
