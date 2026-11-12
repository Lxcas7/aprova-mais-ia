/**
 * Componente: Card de Concurso (Ativo, Previsto pela IA na Internet ou Histórico/Encerrado)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderConcursoCard = function (concurso) {
  const badgeClass = window.AprovaUtils.getStatusBadgeClass(concurso.status);
  const statusDot = window.AprovaUtils.getStatusDot(concurso.status);
  const materiaisCount = (concurso.materiais || []).length;
  const estudadosCount = (concurso.materiais || []).filter(m => m.estudado).length;

  const probBadge = concurso.status === 'previsto'
    ? `<span class="badge badge-previsto" title="Índice de confiança calculado pela IA">${concurso.probabilidade_ia}% Confiança IA</span>`
    : `<span class="badge badge-purple" title="Progresso nos materiais vinculados">📚 ${estudadosCount}/${materiaisCount} Materiais</span>`;

  const topMateriais = (concurso.materiais || []).slice(0, 2).map(m => `
    <span style="font-size:0.74rem; background:#f1f5f9; border:1px solid #cbd5e1; padding:3px 9px; border-radius:6px; color:#334155;">
      ${m.estudado ? '✅' : '📄'} ${m.categoria}: ${m.titulo.length > 34 ? m.titulo.slice(0, 34) + '...' : m.titulo}
    </span>
  `).join('');

  return `
    <article class="concurso-card">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
          <span class="badge ${badgeClass}">${statusDot} ${concurso.status_label}</span>
          <div style="display:flex; gap:6px; align-items:center;">
            ${probBadge}
            <button
              class="btn btn-outline"
              style="padding:4px 9px; font-size:0.78rem;"
              onclick="window.AprovaApp.toggleFavorito('${concurso.id}')"
              title="${concurso.salvo ? 'Remover dos salvos' : 'Salvar concurso no caderno'}"
            >
              ${concurso.salvo ? '⭐ Salvo' : '☆ Salvar'}
            </button>
          </div>
        </div>

        <h3 style="font-size:1.12rem; font-weight:800; color:#0f172a; margin-bottom:2px;">
          ${concurso.sigla} — ${concurso.titulo}
        </h3>
        <p style="font-size:0.81rem; color:#64748b; margin-bottom:8px;">
          🏛️ ${concurso.orgao} • <strong>Banca:</strong> ${concurso.banca} • <strong>UF:</strong> ${concurso.uf}
        </p>

        <div class="meta-box">
          <div class="meta-item">
            <span>Remuneração Inicial</span>
            <strong style="color:#15803d;">${concurso.salario}</strong>
          </div>
          <div class="meta-item">
            <span>Vagas / Escolaridade</span>
            <strong>${concurso.vagas} (${concurso.escolaridade})</strong>
          </div>
          <div class="meta-item">
            <span>Inscrições / Situação</span>
            <strong>${concurso.inscricoes}</strong>
          </div>
          <div class="meta-item">
            <span>Data da Prova / Previsão</span>
            <strong>${concurso.data_prova}</strong>
          </div>
        </div>

        <div class="ai-callout">
          <div class="ai-callout-head">
            <span>🤖 SÍNTESE APROVA+ IA</span>
            <span>Nota Corte / Ref: ${concurso.nota_corte_historica}</span>
          </div>
          <p style="color:#1e293b; font-size:0.81rem; line-height:1.42;">
            ${concurso.resumo_ia}
          </p>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:6px;">
            📚 Materiais Direcionados (${materiaisCount} disponíveis):
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${topMateriais}
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-top:10px; border-top:1px solid #f1f5f9;">
        <button class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${concurso.id}')">
          📂 Raio-X & Materiais (${materiaisCount})
        </button>
        <button class="btn btn-outline" onclick="window.AprovaApp.irParaMateriaisDoConcurso('${concurso.id}')">
          📥 Baixar Apostilas / Provas
        </button>
      </div>
    </article>
  `;
};

