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

  const safe = (v) => window.AprovaUtils.safeText(v);
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
      <option value="${window.AprovaUtils.escapeHtml(c.id)}" ${concursoId === c.id ? 'selected' : ''}>
        ${safe(c.sigla)} · ${safe(c.titulo)} (${safe(c.status_label)})
      </option>
    `)
  ].join('');

  const categorias = ['todas', 'Edital Verticalizado', 'Apostila PDF', 'Prova Passada + Gabarito', 'Caderno de Questões', 'Mapa Mental'];
  const optionsCategorias = categorias.map(cat => `
    <option value="${window.AprovaUtils.escapeHtml(cat)}" ${categoria === cat ? 'selected' : ''}>
      ${cat === 'todas' ? 'Todas as Categorias' : safe(cat)}
    </option>
  `).join('');

  const rowsHtml = materiais.map(m => {
    const statusBadgeClass = window.AprovaUtils.getStatusBadgeClass(m.concurso_status || 'aberto');
    const mid = Number(m.id);
    return `
      <div class="mat-item-wrap">
        <div class="mat-item">
          <div class="mat-item-info">
            <div class="mat-item-title">
              ${safe(m.titulo)}
            </div>
            <div class="mat-item-meta">
              <span class="badge ${statusBadgeClass}">${safe(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
              <span class="badge badge-cobalt">${safe(m.categoria)}</span>
              <span>Disciplina: <strong>${safe(m.disciplina || 'Geral')}</strong></span>
              <span>Banca: <strong>${safe(m.concurso_banca || 'Oficial')}</strong></span>
              <span>Formato: <strong>Roteiro + Checklist (PDF)</strong></span>
            </div>
            ${m.resumo_conteudo ? `<p class="mat-item-desc">${safe(m.resumo_conteudo)}</p>` : ''}
          </div>
          <div class="mat-item-actions">
            <button
              type="button"
              class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'} btn-sm"
              aria-pressed="${m.estudado ? 'true' : 'false'}"
              onclick="window.AprovaComponents.alternarEstudoHub(${mid})"
            >
              ${m.estudado ? window.AprovaUtils.icon('check') : ''}
              <span>${m.estudado ? 'Estudado' : 'Marcar Estudado'}</span>
            </button>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              aria-expanded="false"
              aria-controls="hub-mat-preview-${mid}"
              onclick="window.AprovaUtils.toggleMaterialPreview(${mid}, 'hub-mat', this)"
            >
              ${window.AprovaUtils.icon('eye')}
              <span>Pré-visualizar</span>
            </button>
            <button
              type="button"
              class="btn btn-accent btn-sm"
              onclick="window.AprovaAPI.baixarMaterial(${mid})"
            >
              ${window.AprovaUtils.icon('download')}
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
        <div id="hub-mat-preview-${mid}" class="material-preview-panel" hidden></div>
      </div>
    `;
  }).join('');

  const pct = Math.round(matResp.progresso_pct || 0);

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
        <div
          class="thermometer-bar thermometer-on-subtle"
          role="progressbar"
          aria-valuenow="${pct}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progresso de materiais estudados: ${pct}%"
        >
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
  try {
    const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
    if (!res.estudado) {
      window.AprovaUtils.showToast('Material marcado como pendente.', {
        actionLabel: 'Desfazer',
        onAction: () => window.AprovaComponents.alternarEstudoHub(materialId)
      });
    } else {
      window.AprovaUtils.showToast(
        res.isGuest
          ? 'Progresso salvo neste dispositivo. Entre ou crie conta para sincronizar.'
          : 'Progresso registrado no seu caderno de estudos.'
      );
    }
    window.AprovaComponents.renderMateriaisHub();
    window.AprovaApp.atualizarIndicadoresUsuario();
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Não foi possível atualizar o progresso do material.', { variant: 'error' });
  }
};
