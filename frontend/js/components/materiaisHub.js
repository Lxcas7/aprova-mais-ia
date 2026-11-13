/**
 * Componente: Central de Materiais por Concurso (Barra de Filtro de Biblioteca + Ledger Documental)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.estadoMateriais = {
  concursoId: 'todos',
  categoria: 'todas',
  statusEstudo: 'todos',
  busca: ''
};

window.AprovaComponents.renderMateriaisHub = async function (concursoIdOverride, categoriaOverride, statusOverride) {
  if (concursoIdOverride !== undefined) window.AprovaComponents.estadoMateriais.concursoId = concursoIdOverride;
  if (categoriaOverride !== undefined) window.AprovaComponents.estadoMateriais.categoria = categoriaOverride;
  if (statusOverride !== undefined) window.AprovaComponents.estadoMateriais.statusEstudo = statusOverride;

  const { concursoId, categoria, statusEstudo, busca } = window.AprovaComponents.estadoMateriais;
  const container = document.getElementById('materiais-hub-container');
  if (!container) return;

  const [concursosResp, matResp] = await Promise.all([
    window.AprovaAPI.listarConcursos(),
    window.AprovaAPI.listarMateriais(concursoId, categoria)
  ]);

  const clean = window.AprovaUtils.cleanText;
  const todosConcursos = concursosResp.concursos || [];
  let materiais = matResp.materiais || [];

  if (statusEstudo === 'estudados') {
    materiais = materiais.filter(m => m.estudado);
  } else if (statusEstudo === 'pendentes') {
    materiais = materiais.filter(m => !m.estudado);
  }

  if (busca && busca.trim()) {
    const q = busca.trim().toLowerCase();
    materiais = materiais.filter(m =>
      `${m.titulo} ${m.disciplina || ''} ${m.concurso_sigla || ''} ${m.concurso_banca || ''} ${m.categoria}`.toLowerCase().includes(q)
    );
  }

  const optionsConcursos = [
    `<option value="todos" ${concursoId === 'todos' ? 'selected' : ''}>Todos os Concursos (${todosConcursos.length} editais)</option>`,
    ...todosConcursos.map(c => `
      <option value="${c.id}" ${concursoId === c.id ? 'selected' : ''}>
        ${clean(c.sigla)} · ${clean(c.titulo)} (${clean(c.status_label)})
      </option>
    `)
  ].join('');

  const categorias = ['todas', 'Edital Verticalizado', 'Apostila PDF', 'Prova Passada + Gabarito', 'Caderno de Questões', 'Mapa Mental'];
  const optionsCategorias = categorias.map(cat => `
    <option value="${cat}" ${categoria === cat ? 'selected' : ''}>
      ${cat === 'todas' ? 'Todas as Categorias' : cat}
    </option>
  `).join('');

  const rowsHtml = materiais.map(m => {
    const statusBadgeClass = window.AprovaUtils.getStatusBadgeClass(m.concurso_status || 'aberto');
    return `
      <div class="mat-item">
        <div class="mat-item-info">
          <div class="mat-item-title">
            ${clean(m.titulo)}
          </div>
          <div class="mat-item-meta">
            <span class="badge ${statusBadgeClass}">${clean(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
            <span class="badge badge-cobalt">${clean(m.categoria)}</span>
            <span>Disciplina: <strong>${clean(m.disciplina || 'Geral')}</strong></span>
            <span>Banca: <strong>${clean(m.concurso_banca || 'Oficial')}</strong></span>
            <span>Extensão: <strong>${clean(m.paginas)}</strong></span>
          </div>
          ${m.resumo_conteudo ? `<p class="mat-item-desc">${clean(m.resumo_conteudo)}</p>` : ''}
        </div>
        <div class="mat-item-actions">
          <button
            type="button"
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'} btn-sm"
            aria-pressed="${m.estudado ? 'true' : 'false'}"
            onclick="window.AprovaComponents.alternarEstudoHub(${m.id})"
          >
            ${m.estudado ? window.AprovaUtils.icon('check') : ''}
            <span>${m.estudado ? 'Estudado' : 'Marcar Estudado'}</span>
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

  container.innerHTML = `
    <div class="acervo-toolbar">
      <div class="field-group">
        <label for="mat-select-concurso">Filtrar por Concurso Específico</label>
        <select id="mat-select-concurso" class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(this.value, undefined, undefined)">
          ${optionsConcursos}
        </select>
      </div>
      <div class="field-group">
        <label for="mat-select-categoria">Categoria Documental</label>
        <select id="mat-select-categoria" class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(undefined, this.value, undefined)">
          ${optionsCategorias}
        </select>
      </div>
      <div class="field-group">
        <label for="mat-select-status">Situação no Caderno</label>
        <select id="mat-select-status" class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(undefined, undefined, this.value)">
          <option value="todos" ${statusEstudo === 'todos' ? 'selected' : ''}>Todos (${matResp.total})</option>
          <option value="pendentes" ${statusEstudo === 'pendentes' ? 'selected' : ''}>Pendentes de Estudo (${matResp.total - matResp.estudados})</option>
          <option value="estudados" ${statusEstudo === 'estudados' ? 'selected' : ''}>Concluídos (${matResp.estudados})</option>
        </select>
      </div>
      <div class="acervo-progress-box">
        <div class="acervo-progress-head">
          <span>Progresso do Filtro</span>
          <span>${matResp.estudados}/${matResp.total} (${matResp.progresso_pct}%)</span>
        </div>
        <div class="thermometer-bar thermometer-on-subtle">
          <div class="thermometer-fill fill-green" style="width:${matResp.progresso_pct}%;"></div>
        </div>
      </div>
    </div>

    <div class="acervo-ledger-sheet">
      ${rowsHtml || `
        <div class="empty-state-sheet empty-state-borderless">
          <h3>Nenhum material encontrado para este recorte</h3>
          <p>Selecione "Todos os Concursos" ou "Todas as Categorias" acima para visualizar o acervo completo de 34 materiais.</p>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.renderMateriaisHub('todos', 'todas', 'todos')">
            ${window.AprovaUtils.icon('reset')}
            <span>Exibir Todos os 34 Materiais</span>
          </button>
        </div>
      `}
    </div>
  `;
};

window.AprovaComponents.alternarEstudoHub = async function (materialId) {
  const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
  window.AprovaUtils.showToast(
    res.estudado ? 'Progresso registrado no seu caderno de estudos.' : 'Material marcado como pendente.'
  );
  window.AprovaComponents.renderMateriaisHub();
  window.AprovaApp.atualizarIndicadoresUsuario();
};
