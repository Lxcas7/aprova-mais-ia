/**
 * Componente: Modal de Raio-X Completo do Concurso, Disciplinas por Peso e Checklist de Materiais
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.openConcursoModal = async function (concursoId) {
  const modal = document.getElementById('concurso-modal');
  const content = document.getElementById('concurso-modal-body');
  if (!modal || !content) return;

  modal.classList.add('open');
  content.innerHTML = `<div style="padding:32px; text-align:center; color:var(--muted); font-size:0.9375rem;">Carregando Raio-X da IA e materiais vinculados...</div>`;

  const c = await window.AprovaAPI.obterConcurso(concursoId);
  if (!c) return;

  const clean = window.AprovaUtils.cleanText;
  const badgeClass = window.AprovaUtils.getStatusBadgeClass(c.status);
  const statusDot = window.AprovaUtils.getStatusDot(c.status);

  const probVal = c.probabilidade_ia || c.prob_ia || 100;
  const inscrVal = c.inscricoes || c.prazo || 'Consulte o edital';
  const corteVal = c.nota_corte_historica || c.nota_corte_anterior || 'Referência oficial';
  const fonteVal = c.fonte_oficial || c.fontes_internet || 'Diário Oficial e Banca';

  const disciplinasRows = (c.disciplinas || []).map(d => {
    const prioColor = d.prioridade === 'Crítica' ? '#8c3d19' : (d.prioridade === 'Alta' ? '#664d03' : '#0b4f6c');
    return `
      <tr>
        <td><strong>${clean(d.nome)}</strong></td>
        <td>${d.questoes}</td>
        <td><strong>${clean(d.peso)}</strong></td>
        <td><span style="color:${prioColor}; font-weight:700;">${clean(d.prioridade)}</span></td>
      </tr>
    `;
  }).join('');

  const materiaisHtml = (c.materiais || []).map(m => {
    return `
      <div class="mat-item" id="modal-mat-${m.id}">
        <div>
          <div style="font-weight:700; font-size:0.9375rem; color:var(--text); margin-bottom:4px;">
            ${clean(m.titulo)}
          </div>
          <div style="font-size:0.8125rem; color:var(--muted); display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <span class="badge badge-purple">${clean(m.categoria)}</span>
            <span>Extensão: <strong>${clean(m.paginas)}</strong></span>
            <span>Acesso: <strong style="color:var(--green);">${m.gratuito ? 'Gratuito' : 'PRO'}</strong></span>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button
            type="button"
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'}"
            onclick="window.AprovaComponents.toggleEstudadoNoModal(${m.id}, '${c.id}')"
          >
            ${m.estudado ? window.AprovaUtils.icon('check') : ''}
            <span>${m.estudado ? 'Concluído' : 'Marcar Estudado'}</span>
          </button>
          <button
            type="button"
            class="btn btn-purple"
            onclick="window.AprovaAPI.baixarMaterial(${m.id})"
          >
            ${window.AprovaUtils.icon('download')}
            <span>Baixar Guia</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div style="padding-right:42px;">
      <h2 style="font-size:1.5rem; font-weight:800; color:var(--text); margin-bottom:6px;">
        ${clean(c.sigla)} · ${clean(c.titulo)}
      </h2>
      <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:12px;">
        Órgão: <strong>${clean(c.orgao)}</strong> · Banca: <strong>${clean(c.banca)}</strong> · Área: <strong>${clean(c.area)}</strong>
      </p>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:14px;">
        <span class="badge ${badgeClass}">${statusDot} <span>${clean(c.status_label)}</span></span>
        <span class="badge badge-encerrado">Índice IA: ${probVal}%</span>
      </div>
    </div>

    <div class="card-divider-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
      <div class="meta-item"><span>Salário Inicial</span><strong style="color:var(--green);">${clean(c.salario)}</strong></div>
      <div class="meta-item"><span>Vagas Totais</span><strong>${clean(c.vagas)}</strong></div>
      <div class="meta-item"><span>Inscrições / Situação</span><strong>${clean(inscrVal)}</strong></div>
      <div class="meta-item"><span>Prova / Previsão</span><strong>${clean(c.data_prova)}</strong></div>
      <div class="meta-item"><span>Nota de Corte Histórica</span><strong>${clean(corteVal)}</strong></div>
      <div class="meta-item"><span>Fontes Monitoradas</span><strong>${clean(fonteVal)}</strong></div>
    </div>

    <div class="ai-editorial-note" style="margin:16px 0;">
      <div class="ai-editorial-head">
        <span>Diagnóstico de Inteligência Artificial e Radar Web</span>
      </div>
      <p style="font-size:0.9375rem; color:var(--text); margin-bottom:6px;">${clean(c.resumo_ia)}</p>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:1.125rem; font-weight:800; margin-bottom:10px; color:var(--text);">
        Matriz de Disciplinas e Pesos (Edital Verticalizado)
      </h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Disciplina / Bloco Temático</th>
              <th>Qtd. Questões</th>
              <th>Peso na Nota</th>
              <th>Prioridade IA</th>
            </tr>
          </thead>
          <tbody>
            ${disciplinasRows}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <h3 style="font-size:1.125rem; font-weight:800; color:var(--text);">
          Materiais de Estudo Relacionados (${(c.materiais || []).length})
        </h3>
        <span style="font-size:0.875rem; color:var(--muted);">Clique em "Baixar Guia" para obter o material completo</span>
      </div>
      ${materiaisHtml}
    </div>
  `;
};

window.AprovaComponents.closeConcursoModal = function () {
  const modal = document.getElementById('concurso-modal');
  if (modal) modal.classList.remove('open');
};

window.AprovaComponents.toggleEstudadoNoModal = async function (materialId, concursoId) {
  const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
  window.AprovaUtils.showToast(
    res.estudado ? 'Material marcado como concluído no seu caderno.' : 'Material marcado como pendente.'
  );
  await window.AprovaComponents.openConcursoModal(concursoId);
  window.AprovaApp.carregarConcursos();
  window.AprovaApp.atualizarIndicadoresUsuario();
};
