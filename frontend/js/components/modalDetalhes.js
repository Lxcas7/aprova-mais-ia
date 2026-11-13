/**
 * Componente: Modal de Raio-X Completo do Concurso, Disciplinas por Peso e Checklist de Materiais
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.openConcursoModal = async function (concursoId) {
  const modal = document.getElementById('concurso-modal');
  const content = document.getElementById('concurso-modal-body');
  if (!modal || !content) return;

  modal.classList.add('open');
  content.innerHTML = `<div class="empty-state-sheet" style="border:none;">Carregando dossiê técnico e acervo vinculado...</div>`;

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
    const prioBadge = d.prioridade === 'Crítica'
      ? 'badge-previsto'
      : (d.prioridade === 'Alta' ? 'badge-cobalt' : 'badge-neutral');
    return `
      <tr>
        <td><strong>${clean(d.nome)}</strong></td>
        <td>${d.questoes}</td>
        <td><strong>${clean(d.peso)}</strong></td>
        <td><span class="badge ${prioBadge}">${clean(d.prioridade)}</span></td>
      </tr>
    `;
  }).join('');

  const materiaisHtml = (c.materiais || []).map(m => {
    return `
      <div class="mat-item" id="modal-mat-${m.id}">
        <div class="mat-item-info">
          <div class="mat-item-title">
            ${clean(m.titulo)}
          </div>
          <div class="mat-item-meta">
            <span class="badge badge-cobalt">${clean(m.categoria)}</span>
            <span>Disciplina: <strong>${clean(m.disciplina || 'Geral')}</strong></span>
            <span>Extensão: <strong>${clean(m.paginas)}</strong></span>
            <span>Acesso: <strong style="color:var(--green);">${m.gratuito ? 'Gratuito' : 'PRO'}</strong></span>
          </div>
          ${m.resumo_conteudo ? `<p class="mat-item-desc">${clean(m.resumo_conteudo)}</p>` : ''}
        </div>
        <div class="mat-item-actions">
          <button
            type="button"
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="window.AprovaComponents.toggleEstudadoNoModal(${m.id}, '${c.id}')"
          >
            ${m.estudado ? window.AprovaUtils.icon('check') : ''}
            <span>${m.estudado ? 'Concluído' : 'Marcar Estudado'}</span>
          </button>
          <button
            type="button"
            class="btn btn-accent btn-sm"
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
    <div style="padding-right:44px;">
      <h2 style="font-size:1.4375rem; font-weight:800; color:var(--text); margin-bottom:6px;">
        ${clean(c.sigla)} · ${clean(c.titulo)}
      </h2>
      <p class="dossier-subtitle" style="font-size:0.875rem;">
        Órgão: <strong>${clean(c.orgao)}</strong> · Banca: <strong>${clean(c.banca)}</strong> · Área: <strong>${clean(c.area)}</strong> · UF: <strong>${clean(c.uf)}</strong>
      </p>
      <div class="dossier-badges" style="margin-bottom:14px;">
        <span class="badge ${badgeClass}">${statusDot} <span>${clean(c.status_label)}</span></span>
        <span class="badge badge-encerrado">Índice IA: ${probVal}%</span>
        <span class="badge badge-neutral">Último edital: ${clean(c.ultimo_concurso_ano || 'Consulte histórico')}</span>
      </div>
    </div>

    <div class="card-divider-grid" style="grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));">
      <div class="meta-item"><span>Salário Inicial</span><strong class="salary-highlight">${clean(c.salario)}</strong></div>
      <div class="meta-item"><span>Vagas e Nível</span><strong>${clean(c.vagas)} (${clean(c.escolaridade)})</strong></div>
      <div class="meta-item"><span>Inscrições / Situação</span><strong>${clean(inscrVal)}</strong></div>
      <div class="meta-item"><span>Prova / Previsão</span><strong>${clean(c.data_prova)}</strong></div>
      <div class="meta-item"><span>Nota de Corte Histórica</span><strong>${clean(corteVal)}</strong></div>
      <div class="meta-item"><span>Fontes Monitoradas</span><strong>${clean(fonteVal)}</strong></div>
    </div>

    <div class="ai-editorial-note">
      <div class="ai-editorial-head">
        <span>Parecer de Inteligência Artificial e Estratégia de Prova</span>
      </div>
      <p class="ai-editorial-body" style="color:var(--text);">${clean(c.resumo_ia)}</p>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:1.0625rem; font-weight:800; margin-bottom:10px; color:var(--text);">
        Matriz de Disciplinas e Pesos (Edital Verticalizado)
      </h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Disciplina / Bloco Temático</th>
              <th>Itens / Questões</th>
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
      <div class="match-result-head" style="margin-bottom:8px;">
        <h3 style="font-size:1.0625rem; font-weight:800; color:var(--text);">
          Acervo de Estudo Vinculado (${(c.materiais || []).length} guias disponíveis)
        </h3>
        <span style="font-size:0.8125rem; color:var(--muted);">Clique em "Baixar Guia" para emitir o roteiro verticalizado</span>
      </div>
      <div>
        ${materiaisHtml}
      </div>
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
