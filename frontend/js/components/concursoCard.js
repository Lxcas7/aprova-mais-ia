/**
 * Componente: Card de Concurso (Ativo, Previsto pela IA na Internet ou Histórico/Encerrado)
 * Segue estritamente o sistema visual Impeccable: hierarquia tipográfica plana (sem cards aninhados),
 * sem eyebrow acima do título, contrastes AA+ e texto mínimo >= 13px.
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderConcursoCard = function (concurso) {
  const clean = window.AprovaUtils.cleanText;
  const badgeClass = window.AprovaUtils.getStatusBadgeClass(concurso.status);
  const statusDot = window.AprovaUtils.getStatusDot(concurso.status);
  const materiaisCount = (concurso.materiais || []).length;
  const estudadosCount = (concurso.materiais || []).filter(m => m.estudado).length;

  const probVal = concurso.probabilidade_ia || concurso.prob_ia || 100;
  const inscrVal = concurso.inscricoes || concurso.prazo || 'Consulte o edital';
  const corteVal = concurso.nota_corte_historica || concurso.nota_corte_anterior || 'Referência oficial';

  const probBadge = concurso.status === 'previsto'
    ? `<span class="badge badge-previsto">${probVal}% Confiança IA</span>`
    : `<span class="badge badge-purple">${estudadosCount}/${materiaisCount} Materiais</span>`;

  const topMateriais = (concurso.materiais || []).slice(0, 2).map(m => `
    <li style="font-size:0.875rem; color:var(--text-secondary); padding:3px 0; list-style:none; display:flex; align-items:center; gap:8px;">
      ${m.estudado ? window.AprovaUtils.icon('check') : window.AprovaUtils.icon('book')}
      <span><strong>${clean(m.categoria)}:</strong> ${clean(m.titulo.length > 48 ? m.titulo.slice(0, 48) + '...' : m.titulo)}</span>
    </li>
  `).join('');

  return `
    <article class="concurso-card">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:6px;">
          <h3 style="font-size:1.125rem; font-weight:800; color:var(--text);">
            ${clean(concurso.sigla)} · ${clean(concurso.titulo)}
          </h3>
          <button
            type="button"
            class="btn btn-outline"
            style="padding:6px 10px; font-size:0.8125rem; flex-shrink:0;"
            onclick="window.AprovaApp.toggleFavorito('${concurso.id}')"
            title="${concurso.salvo ? 'Remover dos salvos' : 'Salvar concurso no caderno'}"
          >
            ${concurso.salvo ? window.AprovaUtils.icon('bookmarkFilled') : window.AprovaUtils.icon('bookmark')}
            <span>${concurso.salvo ? 'Salvo' : 'Salvar'}</span>
          </button>
        </div>

        <p style="font-size:0.875rem; color:var(--muted); margin-bottom:12px;">
          ${clean(concurso.orgao)} · Banca: <strong>${clean(concurso.banca)}</strong> · Abrangência: <strong>${clean(concurso.uf)}</strong>
        </p>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:4px;">
          <span class="badge ${badgeClass}">${statusDot} <span>${clean(concurso.status_label)}</span></span>
          ${probBadge}
        </div>

        <div class="card-divider-grid">
          <div class="meta-item">
            <span>Remuneração Inicial</span>
            <strong style="color:var(--green);">${clean(concurso.salario)}</strong>
          </div>
          <div class="meta-item">
            <span>Vagas e Escolaridade</span>
            <strong>${clean(concurso.vagas)} (${clean(concurso.escolaridade)})</strong>
          </div>
          <div class="meta-item">
            <span>Inscrições / Situação</span>
            <strong>${clean(inscrVal)}</strong>
          </div>
          <div class="meta-item">
            <span>Data da Prova / Previsão</span>
            <strong>${clean(concurso.data_prova)}</strong>
          </div>
        </div>

        <div class="ai-editorial-note">
          <div class="ai-editorial-head">
            <span>Diagnóstico Aprova+ IA</span>
            <span style="color:var(--muted); font-weight:600;">Corte ref.: ${clean(corteVal)}</span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.875rem; line-height:1.5;">
            ${clean(concurso.resumo_ia)}
          </p>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:0.8125rem; font-weight:700; color:var(--text); margin-bottom:6px;">
            Materiais direcionados (${materiaisCount} disponíveis):
          </div>
          <ul style="margin:0; padding:0;">
            ${topMateriais}
          </ul>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding-top:14px; border-top:1px solid var(--border);">
        <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${concurso.id}')">
          <span>Raio-X e Materiais (${materiaisCount})</span>
        </button>
        <button type="button" class="btn btn-outline" onclick="window.AprovaApp.irParaMateriaisDoConcurso('${concurso.id}')">
          ${window.AprovaUtils.icon('download')}
          <span>Apostilas e Provas</span>
        </button>
      </div>
    </article>
  `;
};
