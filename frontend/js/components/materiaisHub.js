/**
 * Componente: Central de Materiais por Concurso (Barra de Filtro com Busca Textual + Ledger Documental)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.estadoMateriais = {
  concursoId: 'todos',
  categoria: 'todas',
  statusEstudo: 'todos',
  busca: ''
};

window.AprovaComponents._matSearchTimer = null;

window.AprovaComponents.onMateriaisSearch = function (valor) {
  window.AprovaComponents.estadoMateriais.busca = valor || '';
  clearTimeout(window.AprovaComponents._matSearchTimer);
  window.AprovaComponents._matSearchTimer = setTimeout(() => {
    window.AprovaComponents.atualizarListaMateriaisHub();
  }, 200);
};

window.AprovaComponents.removerFiltroMateriais = function (chave) {
  if (chave === 'concursoId') {
    window.AprovaComponents.estadoMateriais.concursoId = 'todos';
    const sel = document.getElementById('mat-select-concurso');
    if (sel) sel.value = 'todos';
  } else if (chave === 'categoria') {
    window.AprovaComponents.estadoMateriais.categoria = 'todas';
    const sel = document.getElementById('mat-select-categoria');
    if (sel) sel.value = 'todas';
  } else if (chave === 'statusEstudo') {
    window.AprovaComponents.estadoMateriais.statusEstudo = 'todos';
    const sel = document.getElementById('mat-select-status');
    if (sel) sel.value = 'todos';
  } else if (chave === 'busca') {
    window.AprovaComponents.estadoMateriais.busca = '';
    const inp = document.getElementById('mat-search-input');
    if (inp) inp.value = '';
  }
  window.AprovaComponents.atualizarListaMateriaisHub();
};

window.AprovaComponents.renderMateriaisHub = async function (concursoIdOverride, categoriaOverride, statusOverride) {
  if (concursoIdOverride !== undefined) window.AprovaComponents.estadoMateriais.concursoId = concursoIdOverride;
  if (categoriaOverride !== undefined) window.AprovaComponents.estadoMateriais.categoria = categoriaOverride;
  if (statusOverride !== undefined) window.AprovaComponents.estadoMateriais.statusEstudo = statusOverride;

  const { concursoId, categoria, statusEstudo, busca } = window.AprovaComponents.estadoMateriais;
  const container = document.getElementById('materiais-hub-container');
  if (!container) return;

  const concursosResp = await window.AprovaAPI.listarConcursos();
  const utils = window.AprovaUtils;
  const safe = (v) => utils.safeText(v);
  const esc = (v) => utils.escapeHtml(v);
  const todosConcursos = concursosResp.concursos || [];

  const optionsConcursos = [
    `<option value="todos" ${concursoId === 'todos' ? 'selected' : ''}>Todos os Concursos (${todosConcursos.length} editais)</option>`,
    ...todosConcursos.map(c => `
      <option value="${esc(c.id)}" ${concursoId === c.id ? 'selected' : ''}>
        ${safe(c.sigla)} · ${safe(c.titulo)} (${safe(utils.getShortStatusLabel(c.status))})
      </option>
    `)
  ].join('');

  const categorias = ['todas', 'Edital Verticalizado', 'Apostila PDF', 'Prova Passada + Gabarito', 'Caderno de Questões', 'Mapa Mental'];
  const optionsCategorias = categorias.map(cat => `
    <option value="${esc(cat)}" ${categoria === cat ? 'selected' : ''}>
      ${cat === 'todas' ? 'Todas as Categorias' : safe(cat)}
    </option>
  `).join('');

  container.innerHTML = `
    <div class="acervo-toolbar">
      <div class="field-group">
        <label for="mat-search-input">Buscar por disciplina, título ou banca (Atalho: /)</label>
        <input
          type="search"
          id="mat-search-input"
          class="field-input"
          value="${esc(busca)}"
          placeholder="Ex: Contabilidade, Cebraspe, Informática, Gabarito..."
          oninput="window.AprovaComponents.onMateriaisSearch(this.value)"
        />
      </div>
      <div class="field-group">
        <label for="mat-select-concurso">Concurso</label>
        <select id="mat-select-concurso" class="field-input" onchange="window.AprovaComponents.estadoMateriais.concursoId=this.value; window.AprovaComponents.atualizarListaMateriaisHub()">
          ${optionsConcursos}
        </select>
      </div>
      <div class="field-group">
        <label for="mat-select-categoria">Categoria</label>
        <select id="mat-select-categoria" class="field-input" onchange="window.AprovaComponents.estadoMateriais.categoria=this.value; window.AprovaComponents.atualizarListaMateriaisHub()">
          ${optionsCategorias}
        </select>
      </div>
      <div class="field-group">
        <label for="mat-select-status">Situação no Caderno</label>
        <select id="mat-select-status" class="field-input" onchange="window.AprovaComponents.estadoMateriais.statusEstudo=this.value; window.AprovaComponents.atualizarListaMateriaisHub()">
          <option value="todos" ${statusEstudo === 'todos' ? 'selected' : ''}>Todos</option>
          <option value="pendentes" ${statusEstudo === 'pendentes' ? 'selected' : ''}>Pendentes de estudo</option>
          <option value="estudados" ${statusEstudo === 'estudados' ? 'selected' : ''}>Estudados</option>
        </select>
      </div>
      <div id="acervo-progress-box" class="acervo-progress-box"></div>
    </div>

    <div id="materiais-active-chips" class="active-filter-chips" hidden></div>

    <div id="acervo-ledger-container" class="acervo-ledger-sheet">
      <div class="empty-state-sheet empty-state-borderless" role="status">Carregando acervo de materiais...</div>
    </div>
  `;

  await window.AprovaComponents.atualizarListaMateriaisHub();
};

window.AprovaComponents.atualizarListaMateriaisHub = async function () {
  const ledger = document.getElementById('acervo-ledger-container');
  const progressBox = document.getElementById('acervo-progress-box');
  const chipsBox = document.getElementById('materiais-active-chips');
  if (!ledger) return;

  const { concursoId, categoria, statusEstudo, busca } = window.AprovaComponents.estadoMateriais;
  const utils = window.AprovaUtils;
  const safe = (v) => utils.safeText(v);
  const esc = (v) => utils.escapeHtml(v);

  let matResp;
  let allResp;
  try {
    [matResp, allResp] = await Promise.all([
      window.AprovaAPI.listarMateriais(concursoId, categoria),
      window.AprovaAPI.listarMateriais('todos', 'todas')
    ]);
  } catch (err) {
    ledger.innerHTML = `
      <div class="empty-state-sheet empty-state-borderless" role="alert">
        <h3>Não foi possível carregar os materiais</h3>
        <p>${esc(err.message || 'Erro ao consultar o acervo.')}</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.atualizarListaMateriaisHub()">
          ${utils.icon('reset')}
          <span>Tentar novamente</span>
        </button>
      </div>
    `;
    return;
  }

  const totalIndexado = allResp?.total || matResp.total || 0;
  const bannerCountEl = document.getElementById('materiais-banner-count');
  if (bannerCountEl) {
    bannerCountEl.textContent = `${totalIndexado} Roteiros e Provas Indexados`;
  }

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

  // Progresso real calculado sobre os itens exibidos no recorte atual
  const totalExibido = materiais.length;
  const estudadosExibidos = materiais.filter(m => m.estudado).length;
  const pct = totalExibido ? Math.round((estudadosExibidos / totalExibido) * 100) : 0;

  if (progressBox) {
    progressBox.innerHTML = `
      <div class="acervo-progress-head">
        <span>Progresso do Recorte</span>
        <span>${estudadosExibidos}/${totalExibido} (${pct}%)</span>
      </div>
      <div
        class="thermometer-bar thermometer-on-subtle"
        role="progressbar"
        aria-valuenow="${pct}"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Progresso do recorte atual: ${pct}%"
      >
        <div class="thermometer-fill fill-green" style="width:${pct}%;"></div>
      </div>
    `;
  }

  // Active filter chips
  const activeChips = [];
  if (busca && busca.trim()) activeChips.push({ key: 'busca', label: `Busca: "${busca.trim()}"` });
  if (concursoId !== 'todos') {
    const concLabel = (materiais[0]?.concurso_sigla) || concursoId.toUpperCase();
    activeChips.push({ key: 'concursoId', label: `Concurso: ${concLabel}` });
  }
  if (categoria !== 'todas') activeChips.push({ key: 'categoria', label: `Categoria: ${categoria}` });
  if (statusEstudo !== 'todos') {
    activeChips.push({ key: 'statusEstudo', label: `Situação: ${statusEstudo === 'estudados' ? 'Estudados' : 'Pendentes'}` });
  }

  if (chipsBox) {
    if (!activeChips.length) {
      chipsBox.hidden = true;
      chipsBox.innerHTML = '';
    } else {
      chipsBox.hidden = false;
      chipsBox.innerHTML = `
        <span class="active-chips-label">Filtros ativos:</span>
        ${activeChips.map(c => `
          <button type="button" class="filter-chip-btn" onclick="window.AprovaComponents.removerFiltroMateriais('${esc(c.key)}')">
            <span>${esc(c.label)}</span>
            ${utils.icon('x')}
          </button>
        `).join('')}
        ${activeChips.length >= 2 ? `
          <button type="button" class="filter-chip-clear" onclick="window.AprovaComponents.renderMateriaisHub('todos', 'todas', 'todos'); window.AprovaComponents.estadoMateriais.busca=''; document.getElementById('mat-search-input').value=''; window.AprovaComponents.atualizarListaMateriaisHub();">
            Limpar tudo
          </button>
        ` : ''}
      `;
    }
  }

  const rowsHtml = materiais.map(m => {
    const statusBadgeClass = utils.getStatusBadgeClass(m.concurso_status || 'aberto');
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
              ${m.estudado ? utils.icon('check') : ''}
              <span>${m.estudado ? 'Estudado' : 'Marcar estudado'}</span>
            </button>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              aria-expanded="false"
              aria-controls="hub-mat-preview-${mid}"
              onclick="window.AprovaUtils.toggleMaterialPreview(${mid}, 'hub-mat', this)"
            >
              ${utils.icon('eye')}
              <span>Pré-visualizar</span>
            </button>
            <button
              type="button"
              class="btn btn-accent btn-sm"
              onclick="window.AprovaAPI.baixarMaterial(${mid})"
            >
              ${utils.icon('download')}
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
        <div id="hub-mat-preview-${mid}" class="material-preview-panel" hidden></div>
      </div>
    `;
  }).join('');

  if (!rowsHtml) {
    const chipsRecovery = activeChips.length
      ? `<div class="empty-state-actions" style="margin-bottom: 14px;">
          ${activeChips.map(c => `
            <button type="button" class="filter-chip-btn" onclick="window.AprovaComponents.removerFiltroMateriais('${esc(c.key)}')">
              <span>Remover: ${esc(c.label)}</span>
              ${utils.icon('x')}
            </button>
          `).join('')}
        </div>`
      : '';
    ledger.innerHTML = `
      <div class="empty-state-sheet empty-state-borderless">
        <h3>Nenhum material encontrado para este recorte</h3>
        <p>${activeChips.length ? 'Ajuste ou remova um dos filtros ativos abaixo para localizar os guias:' : 'Nenhum material disponível no acervo.'}</p>
        ${chipsRecovery}
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.estadoMateriais.busca=''; window.AprovaComponents.renderMateriaisHub('todos', 'todas', 'todos')">
          ${utils.icon('reset')}
          <span>Exibir todos os ${totalIndexado} materiais</span>
        </button>
      </div>
    `;
    return;
  }

  ledger.innerHTML = rowsHtml;
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
          : 'Material marcado como estudado no seu caderno.'
      );
    }
    window.AprovaComponents.atualizarListaMateriaisHub();
    window.AprovaApp.atualizarIndicadoresUsuario();
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Não foi possível atualizar o progresso do material.', { variant: 'error' });
  }
};
