/**
 * Componente: Central de Materiais por Concurso (Apostilas PDF, Editais Verticalizados, Provas Passadas)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.estadoMateriais = {
  concursoId: 'todos',
  categoria: 'todas'
};

window.AprovaComponents.renderMateriaisHub = async function (concursoIdOverride, categoriaOverride) {
  if (concursoIdOverride !== undefined) window.AprovaComponents.estadoMateriais.concursoId = concursoIdOverride;
  if (categoriaOverride !== undefined) window.AprovaComponents.estadoMateriais.categoria = categoriaOverride;

  const { concursoId, categoria } = window.AprovaComponents.estadoMateriais;
  const container = document.getElementById('materiais-hub-container');
  if (!container) return;

  const [concursosResp, matResp] = await Promise.all([
    window.AprovaAPI.listarConcursos(),
    window.AprovaAPI.listarMateriais(concursoId, categoria)
  ]);

  const clean = window.AprovaUtils.cleanText;
  const todosConcursos = concursosResp.concursos || [];
  const materiais = matResp.materiais || [];

  const optionsConcursos = [
    `<option value="todos" ${concursoId === 'todos' ? 'selected' : ''}>Todos os Concursos (${todosConcursos.length} editais mapeados)</option>`,
    ...todosConcursos.map(c => `
      <option value="${c.id}" ${concursoId === c.id ? 'selected' : ''}>
        ${clean(c.sigla)} · ${clean(c.titulo)} (${clean(c.status_label)})
      </option>
    `)
  ].join('');

  const categorias = ['todas', 'Edital Verticalizado', 'Apostila PDF', 'Prova Passada + Gabarito', 'Caderno de Questões', 'Mapa Mental'];
  const optionsCategorias = categorias.map(cat => `
    <option value="${cat}" ${categoria === cat ? 'selected' : ''}>
      ${cat === 'todas' ? 'Todas as Categorias de Material' : cat}
    </option>
  `).join('');

  const rowsHtml = materiais.map(m => {
    return `
      <div class="mat-item">
        <div>
          <div style="font-size:1rem; font-weight:700; color:var(--text); margin-bottom:4px;">
            ${clean(m.titulo)}
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:0.8125rem; color:var(--muted);">
            <span class="badge badge-aberto">${clean(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
            <span class="badge badge-purple">${clean(m.categoria)}</span>
            <span>Banca: <strong>${clean(m.concurso_banca || 'Oficial')}</strong></span>
            <span>Extensão: <strong>${clean(m.paginas)}</strong></span>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button
            type="button"
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'}"
            onclick="window.AprovaComponents.alternarEstudoHub(${m.id})"
          >
            ${m.estudado ? window.AprovaUtils.icon('check') : ''}
            <span>${m.estudado ? 'Estudado' : 'Marcar Estudado'}</span>
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

  container.innerHTML = `
    <div class="concurso-card" style="margin-bottom:22px;">
      <div style="display:grid; grid-template-columns: 1.4fr 1fr 1fr; gap:16px; align-items:end;">
        <div class="field-group">
          <label for="mat-select-concurso">Filtrar por Concurso Específico</label>
          <select id="mat-select-concurso" class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(this.value, undefined)">
            ${optionsConcursos}
          </select>
        </div>
        <div class="field-group">
          <label for="mat-select-categoria">Tipo de Material de Estudo</label>
          <select id="mat-select-categoria" class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(undefined, this.value)">
            ${optionsCategorias}
          </select>
        </div>
        <div style="padding:4px 0;">
          <div style="display:flex; justify-content:space-between; font-size:0.8125rem; font-weight:700; color:var(--text);">
            <span>Progresso de Estudo</span>
            <span>${matResp.estudados}/${matResp.total} (${matResp.progresso_pct}%)</span>
          </div>
          <div class="thermometer-bar" style="margin:8px 0 0;">
            <div class="thermometer-fill" style="width:${matResp.progresso_pct}%; background-color:var(--green);"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="concurso-card">
      ${rowsHtml || `<p style="font-size:0.9375rem; color:var(--muted);">Nenhum material encontrado para este filtro.</p>`}
    </div>
  `;
};

window.AprovaComponents.alternarEstudoHub = async function (materialId) {
  const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
  window.AprovaUtils.showToast(
    res.estudado ? 'Progresso salvo no seu caderno de estudos.' : 'Material marcado como pendente.'
  );
  window.AprovaComponents.renderMateriaisHub();
  window.AprovaApp.atualizarIndicadoresUsuario();
};
