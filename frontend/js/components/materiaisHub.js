/**
 * Tela 4: Guias & Caderno (Sidebar 340px + Folha A4 Ergonômica com Leitura Fluida e Exportação PDF A4)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.estadoMateriais = {
  concursoId: 'todos',
  categoria: 'todas',
  statusEstudo: 'todos',
  busca: '',
  selectedId: null,
  readingMode: 'a4', // 'a4' | 'fluida'
  lista: [],
  plano: 'Gratuito',
  podeBaixarPdf: false
};

(function () {
  let _searchTimer = null;

  window.AprovaComponents.onMateriaisSearch = function (valor) {
    window.AprovaComponents.estadoMateriais.busca = valor || '';
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => window.AprovaComponents.atualizarListaMateriaisHub(), 200);
  };

  window.AprovaComponents.selecionarGuiaReader = function (materialId) {
    window.AprovaComponents.estadoMateriais.selectedId = Number(materialId);
    renderGuiasSplit();
  };

  window.AprovaComponents.setGuiaReadingMode = function (mode) {
    window.AprovaComponents.estadoMateriais.readingMode = mode === 'fluida' ? 'fluida' : 'a4';
    renderReaderPane();
  };

  window.AprovaComponents.renderMateriaisHub = async function () {
    const container = document.getElementById('materiais-hub-container');
    if (!container) return;

    const user = window.AprovaAPI.obterUsuarioAtual();
    const state = window.AprovaComponents.estadoMateriais;
    if (state.concursoId === 'todos' && user?.concurso_alvo_id) {
      // Inicia exibindo todos ou o selecionado explicitamente pelo usuário
    }

    container.innerHTML = `<div class="empty-state-sheet" role="status">Carregando guias de estudo organizados por tópico...</div>`;
    await window.AprovaComponents.atualizarListaMateriaisHub();
  };

  window.AprovaComponents.atualizarListaMateriaisHub = async function () {
    const state = window.AprovaComponents.estadoMateriais;
    try {
      const [concResp, matResp] = await Promise.all([
        window.AprovaAPI.listarConcursos(),
        window.AprovaAPI.listarMateriais(state.concursoId, state.categoria)
      ]);
      state._concursos = concResp.concursos || [];
      state.plano = matResp.plano || (window.AprovaAPI.obterUsuarioAtual()?.plano || 'Gratuito');
      state.podeBaixarPdf = Boolean(matResp.pode_baixar_pdf || ['Pro', 'Pro+'].includes(state.plano));

      let list = matResp.materiais || [];
      if (state.statusEstudo === 'estudados') list = list.filter(m => m.estudado);
      else if (state.statusEstudo === 'pendentes') list = list.filter(m => !m.estudado);
      if (state.busca) {
        const q = state.busca.toLowerCase().trim();
        list = list.filter(m =>
          `${m.titulo} ${m.disciplina} ${m.concurso_sigla} ${m.concurso_banca}`.toLowerCase().includes(q)
        );
      }

      state.lista = list;
      if (!state.selectedId || !list.some(m => m.id === state.selectedId)) {
        state.selectedId = list.length ? list[0].id : null;
      }
      renderGuiasSplit();
    } catch (err) {
      const container = document.getElementById('materiais-hub-container');
      if (container) {
        container.innerHTML = `<div class="empty-state-sheet" role="alert"><p>${window.AprovaUtils.escapeHtml(err.message || 'Erro ao carregar guias.')}</p></div>`;
      }
    }
  };

  window.AprovaComponents.toggleEstudadoGuiaAtual = async function (materialId) {
    try {
      const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
      const item = (window.AprovaComponents.estadoMateriais.lista || []).find(m => m.id === materialId);
      if (item) item.estudado = Boolean(res.estudado);
      window.AprovaUtils.showToast(res.estudado ? 'Tópico concluído no seu caderno!' : 'Tópico reaberto como pendente.');
      renderGuiasSplit();
    } catch (err) {
      window.AprovaUtils.showToast(err.message || 'Erro ao atualizar tópico.', { variant: 'error' });
    }
  };

  function renderGuiasSplit() {
    const container = document.getElementById('materiais-hub-container');
    if (!container) return;
    const state = window.AprovaComponents.estadoMateriais;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const concursos = state._concursos || [];

    container.innerHTML = `
      <div class="section-banner">
        <div>
          <h1>Guias do Edital &amp; Caderno A4</h1>
          <p>Roteiros organizados por tópico do edital com leitura em Folha A4 ou Fluida, checklist de conclusão e exportação em PDF A4.</p>
        </div>
        <span class="badge badge-cobalt">Plano atual: ${safe(state.plano)} · ${state.podeBaixarPdf ? 'PDF A4 liberado' : 'Leitura em tela'}</span>
      </div>

      <div class="guias-split-layout">
        <aside class="guias-sidebar">
          <div class="field-group">
            <label for="mat-search-input">Buscar tópico ou disciplina (Atalho: /)</label>
            <input type="search" id="mat-search-input" class="field-input" value="${esc(state.busca)}" placeholder="Ex: Informática, Contabilidade, PF..." oninput="window.AprovaComponents.onMateriaisSearch(this.value)" />
          </div>

          <div class="field-group">
            <label for="mat-select-concurso">Filtrar por edital</label>
            <select id="mat-select-concurso" class="field-input" onchange="window.AprovaComponents.estadoMateriais.concursoId=this.value; window.AprovaComponents.atualizarListaMateriaisHub()">
              <option value="todos" ${state.concursoId === 'todos' ? 'selected' : ''}>Todos os concursos (${concursos.length})</option>
              ${concursos.map(c => `<option value="${esc(c.id)}" ${state.concursoId === c.id ? 'selected' : ''}>${safe(c.sigla)} · ${safe(c.banca)}</option>`).join('')}
            </select>
          </div>

          <div class="field-group">
            <label for="mat-select-categoria">Tipo de guia</label>
            <select id="mat-select-categoria" class="field-input" onchange="window.AprovaComponents.estadoMateriais.categoria=this.value; window.AprovaComponents.atualizarListaMateriaisHub()">
              <option value="todas" ${state.categoria === 'todas' ? 'selected' : ''}>Todos os tipos</option>
              <option value="Guia do Edital" ${state.categoria === 'Guia do Edital' ? 'selected' : ''}>Guia do Edital (por tópico)</option>
              <option value="Apostila PDF" ${state.categoria === 'Apostila PDF' ? 'selected' : ''}>Apostila Completa</option>
              <option value="Prova Passada + Gabarito" ${state.categoria === 'Prova Passada + Gabarito' ? 'selected' : ''}>Prova Passada + Gabarito</option>
              <option value="Caderno de Questões" ${state.categoria === 'Caderno de Questões' ? 'selected' : ''}>Caderno de Questões</option>
              <option value="Mapa Mental" ${state.categoria === 'Mapa Mental' ? 'selected' : ''}>Mapa Mental</option>
            </select>
          </div>

          <div class="guia-list-scroll">
            ${state.lista.length ? state.lista.map(m => `
              <button type="button" class="guia-nav-item ${m.id === state.selectedId ? 'active' : ''}" onclick="window.AprovaComponents.selecionarGuiaReader(${m.id})">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                  <span>${safe(m.concurso_sigla)} · ${safe(m.categoria)}</span>
                  ${m.estudado ? `<span class="badge badge-aberto" style="padding:1px 7px;">✓ Concluído</span>` : (!m.acesso_liberado ? `<span class="badge badge-previsto" style="padding:1px 7px;">Básico/Pro</span>` : '')}
                </div>
                <strong>${safe(m.titulo)}</strong>
                <span>${safe(m.disciplina)} · ${safe(m.paginas)}</span>
              </button>
            `).join('') : `<p class="text-caption-muted">Nenhum guia encontrado para esses filtros.</p>`}
          </div>
        </aside>

        <div id="guias-reader-pane"></div>
      </div>
    `;

    renderReaderPane();
  }

  async function renderReaderPane() {
    const pane = document.getElementById('guias-reader-pane');
    if (!pane) return;
    const state = window.AprovaComponents.estadoMateriais;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);

    const mat = (state.lista || []).find(m => m.id === state.selectedId);
    if (!mat) {
      pane.innerHTML = `<div class="empty-state-sheet"><p>Selecione um guia na coluna à esquerda para iniciar sua leitura.</p></div>`;
      return;
    }

    const user = window.AprovaAPI.obterUsuarioAtual();
    const ownerName = user?.nome || 'Aluno Aprova+';
    const liberado = mat.acesso_liberado !== false;

    let preview = null;
    try {
      preview = await window.AprovaAPI.obterPreviewMaterial(mat.id);
    } catch (e) {}

    const discs = preview?.disciplinas || [];
    const passos = preview?.passos_estudo || [];

    pane.innerHTML = `
      <!-- Barra de Ações em 1 única linha no desktop -->
      <div class="a4-action-bar">
        <div class="a4-mode-pills" role="group" aria-label="Modo de leitura">
          <button type="button" class="choice-pill ${state.readingMode === 'a4' ? 'selected' : ''}" style="padding:6px 12px;" onclick="window.AprovaComponents.setGuiaReadingMode('a4')">
            Folha A4
          </button>
          <button type="button" class="choice-pill ${state.readingMode === 'fluida' ? 'selected' : ''}" style="padding:6px 12px;" onclick="window.AprovaComponents.setGuiaReadingMode('fluida')">
            Leitura Fluida
          </button>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:nowrap;">
          <button type="button" class="btn ${mat.estudado ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="window.AprovaComponents.toggleEstudadoGuiaAtual(${mat.id})">
            ${utils.icon('check')}
            <span>${mat.estudado ? 'Tópico concluído' : 'Marcar tópico concluído'}</span>
          </button>
          <button type="button" class="btn btn-dark btn-sm" onclick="window.AprovaAPI.baixarMaterial(${mat.id})">
            ${utils.icon('download')}
            <span>↓ Exportar PDF A4</span>
          </button>
        </div>
      </div>

      ${!liberado ? `
        <div class="surface-card" role="alert">
          <span class="badge badge-previsto">Conteúdo além da cota atual (${safe(state.plano)})</span>
          <h2 class="sheet-title" style="margin-top:10px;">${safe(mat.titulo)}</h2>
          <p class="sheet-desc">
            No plano Gratuito você acessa 1 guia completo na tela; no Básico, 40% de todo o edital na tela; e nos planos Pro e Pro+, 100% dos guias e exportação personalizada em PDF A4.
          </p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaApp.switchView('premium')">
            Desbloquear Guias &amp; PDF A4 →
          </button>
        </div>
      ` : `
        <article class="a4-paper-sheet ${state.readingMode === 'fluida' ? 'fluid-mode' : ''}">
          <div class="a4-watermark" aria-hidden="true">Aprova+ IA · ${safe(ownerName)}</div>

          <div class="a4-quiet-header">
            <span>Aprova+ IA · ${safe(mat.concurso_sigla)} (${safe(mat.concurso_banca)})</span>
            <span>Preparado para ${safe(ownerName)}</span>
          </div>

          <span class="badge badge-cobalt" style="margin-bottom:10px;">${safe(mat.categoria)} · ${safe(mat.disciplina)}</span>
          <h2 style="font-size:1.375rem; font-weight:800; color:var(--text); margin-bottom:10px;">${safe(mat.titulo)}</h2>
          <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:18px;">
            ${safe(mat.resumo_conteudo)}
          </p>

          ${preview?.resumo_ia ? `
            <div style="background:var(--bg); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:14px 16px; margin-bottom:20px;">
              <strong style="font-size:0.8125rem; color:var(--primary); display:block; margin-bottom:4px;">Estratégia para a banca ${safe(mat.concurso_banca)}</strong>
              <p style="font-size:0.875rem; color:var(--text-secondary);">${safe(preview.resumo_ia)}</p>
            </div>
          ` : ''}

          ${discs.length ? `
            <h3 style="font-size:1rem; font-weight:800; margin-bottom:10px;">Roteiro Organizado por Tópico e Peso do Edital</h3>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
              ${discs.map((d, i) => `
                <li style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 14px; background:var(--bg); border-radius:10px;">
                  <span style="font-size:0.875rem;"><strong>${i + 1}. ${safe(d.nome)}</strong> · ${d.questoes} questões (${safe(d.peso)})</span>
                  <span class="badge badge-neutral">${safe(d.prioridade)}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}

          ${passos.length ? `
            <h3 style="font-size:1rem; font-weight:800; margin-bottom:8px;">Ordem Recomendada de Execução</h3>
            <ol style="margin-left:18px; display:flex; flex-direction:column; gap:6px; font-size:0.875rem; color:var(--text-secondary);">
              ${passos.map(p => `<li>${safe(p)}</li>`).join('')}
            </ol>
          ` : ''}

          <div class="a4-quiet-footer">
            <span>Edital ${safe(preview?.concurso_sigla || mat.concurso_sigla)} · Documento de estudo individual</span>
            <span>Folha A4 · ${safe(mat.paginas)}</span>
          </div>
        </article>

        <div class="guias-practice-strip">
          <div>
            <strong style="font-size:0.9375rem; color:var(--primary); display:block;">⚡ Consolidar este assunto na prática</strong>
            <span class="text-caption-muted">Resolva 10 questões da banca ${safe(mat.concurso_banca)} e atualize automaticamente suas métricas em Meu Estudo.</span>
          </div>
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(mat.concurso_id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'topico_guia' })">
            ⚡ Praticar 10 questões sobre este assunto →
          </button>
        </div>
      `}
    `;
  }
})();
