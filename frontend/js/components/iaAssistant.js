/**
 * Tela 3: Nivelamento & IA (Gerador Rápido + Caderno Interativo + Sugestão do Theo + Provas Anteriores Oficiais)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const gen = {
    concurso_id: 'pf-2026',
    disciplina: 'todas',
    dificuldade: 'sorteado',
    quantidade: 10,
    concursos: [],
    provas: []
  };

  window.AprovaComponents.renderSugestaoTheoCard = async function (concursoIdOverride) {
    const box = document.getElementById('theo-sidebar-box');
    if (!box) return;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);

    try {
      const theo = await window.AprovaAPI.obterSugestaoTheo(concursoIdOverride || gen.concurso_id);
      const prios = theo.disciplinas_priorizadas || [];
      box.innerHTML = `
        <div class="theo-rec-card">
          <span class="badge badge-aberto" style="margin-bottom:10px;">Sugestão do Theo · Concurso Completo</span>
          <h3>${safe(theo.titulo)}</h3>
          <p>${safe(theo.justificativa)}</p>
          ${prios.length ? `
            <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">
              ${prios.map(p => `
                <div style="display:flex; justify-content:space-between; font-size:0.8125rem; background:rgba(255,255,255,0.08); padding:8px 12px; border-radius:10px;">
                  <span>${safe(p.disciplina.split('—')[0].trim())}</span>
                  <strong>${p.taxa_atual_pct}% · ${safe(p.peso)}</strong>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <button type="button" class="btn btn-hero-primary btn-block" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(theo.concurso_id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: ${Number(theo.quantidade || 20)}, tipo_sessao: 'simulado_theo' })">
            ${utils.icon('play')}
            <span>Montar Simulado do Theo (${Number(theo.quantidade || 20)} qst)</span>
          </button>
        </div>
      `;
    } catch (e) {
      box.innerHTML = '';
    }
  };

  window.AprovaComponents.iniciarPraticaDirecionada = async function (cfg = {}) {
    gen.concurso_id = cfg.concurso_id || gen.concurso_id || 'pf-2026';
    gen.disciplina = cfg.disciplina || 'todas';
    gen.dificuldade = cfg.dificuldade || 'sorteado';
    gen.quantidade = Number(cfg.quantidade || 10);
    const tipo = cfg.tipo_sessao || 'simulado_rapido';

    if (window.AprovaApp?.state?.currentView !== 'ia') {
      window.AprovaApp.switchView('ia');
      await new Promise(r => setTimeout(r, 80));
    }

    await launchSession(tipo, cfg.prova_titulo || null);
  };

  async function launchSession(tipoSessao = 'simulado_rapido', provaTitulo = null) {
    const utils = window.AprovaUtils;
    const mount = document.getElementById('question-player-mount');
    if (mount) {
      mount.innerHTML = `<div class="surface-card"><p class="text-caption-muted">Selecionando questões da banca e embaralhando dificuldades...</p></div>`;
    }
    try {
      const resp = await window.AprovaAPI.iniciarSessaoQuestoes({
        concurso_id: gen.concurso_id,
        tipo_sessao: tipoSessao,
        disciplina: gen.disciplina,
        dificuldade: gen.dificuldade,
        quantidade: gen.quantidade,
        prova_titulo: provaTitulo
      });
      window.AprovaComponents.mountQuestionSession(resp);
    } catch (err) {
      if (mount) {
        mount.innerHTML = `
          <div class="surface-card" role="alert">
            <span class="badge badge-accent">Limite do Plano</span>
            <h3 class="sheet-title" style="margin-top:8px;">Não foi possível iniciar esta bateria</h3>
            <p class="sheet-desc">${utils.escapeHtml(err.message || 'Ajuste seu plano ou tente outra configuração.')}</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" onclick="window.AprovaApp.switchView('premium')">
                Conhecer Planos e Liberar Recursos →
              </button>
              <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.renderIAAssistant()">
                Voltar ao Gerador
              </button>
            </div>
          </div>
        `;
      }
      utils.showToast(err.message || 'Não foi possível iniciar a bateria.', {
        variant: 'error',
        actionLabel: err.status === 403 ? 'Ver planos' : undefined,
        onAction: () => window.AprovaApp.switchView('premium')
      });
    }
  }

  window.AprovaComponents._genSet = function (key, val) {
    gen[key] = val;
    if (key === 'concurso_id') {
      gen.disciplina = 'todas';
    }
    drawGerador();
    if (key === 'concurso_id') {
      window.AprovaComponents.renderSugestaoTheoCard(gen.concurso_id);
    }
  };

  window.AprovaComponents.dispararGeradorRapido = function (tipoSessao = 'simulado_rapido') {
    launchSession(tipoSessao);
  };

  function drawGerador() {
    const box = document.getElementById('gerador-rapido-mount');
    if (!box) return;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const conc = gen.concursos.find(c => c.id === gen.concurso_id) || gen.concursos[0];
    const discs = conc?.disciplinas || [];
    const difs = [
      { id: 'facil', label: 'Fácil' },
      { id: 'intermediario', label: 'Intermediário' },
      { id: 'dificil', label: 'Difícil' },
      { id: 'sorteado', label: 'Sorteado' }
    ];
    const qtds = [10, 20, 30, 60, 120];

    box.innerHTML = `
      <div class="gerador-rapido-card">
        <div class="card-head-row" style="margin-bottom:14px;">
          <div>
            <h1 class="card-head-title">Gerador Rápido de Simulados e Questões</h1>
            <p class="card-head-sub">Monte baterias sob medida no formato oficial da banca ${safe(conc?.banca || '')} com atualização automática dos gráficos.</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.dispararGeradorRapido('nivelamento')">
            ${utils.icon('target')} Simulado de Nivelamento
          </button>
        </div>

        <div class="gerador-controls-grid">
          <div class="field-group">
            <label for="gen-concurso">Concurso / Banca</label>
            <select id="gen-concurso" class="field-input" onchange="window.AprovaComponents._genSet('concurso_id', this.value)">
              ${gen.concursos.map(c => `
                <option value="${esc(c.id)}" ${c.id === gen.concurso_id ? 'selected' : ''}>
                  ${safe(c.sigla)} · ${safe(c.banca)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="field-group">
            <label for="gen-disciplina">Disciplina</label>
            <select id="gen-disciplina" class="field-input" onchange="window.AprovaComponents._genSet('disciplina', this.value)">
              <option value="todas" ${gen.disciplina === 'todas' ? 'selected' : ''}>Todas as disciplinas do edital</option>
              ${discs.map(d => `
                <option value="${esc(d.nome)}" ${gen.disciplina === d.nome ? 'selected' : ''}>${safe(d.nome)} (${safe(d.peso)})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="gerador-controls-grid" style="align-items:center;">
          <div class="field-group">
            <label>Nível de Dificuldade</label>
            <div class="pill-toggle-row">
              ${difs.map(d => `
                <button type="button" class="choice-pill ${gen.dificuldade === d.id ? 'selected' : ''}" onclick="window.AprovaComponents._genSet('dificuldade', '${d.id}')">
                  ${d.label}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="field-group">
            <label>Quantidade de Questões</label>
            <div class="pill-toggle-row">
              ${qtds.map(q => `
                <button type="button" class="choice-pill ${Number(gen.quantidade) === q ? 'selected' : ''}" onclick="window.AprovaComponents._genSet('quantidade', ${q})">
                  ${q}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.dispararGeradorRapido('simulado_rapido')">
            ${utils.icon('play')}
            <span>Iniciar Bateria (${gen.quantidade} questões)</span>
          </button>
        </div>
      </div>
    `;
  }

  window.AprovaComponents.renderIAAssistant = async function () {
    const container = document.getElementById('ia-assistant-container');
    if (!container) return;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);

    try {
      const user = window.AprovaAPI.obterUsuarioAtual();
      const [concResp, provasResp] = await Promise.all([
        window.AprovaAPI.listarConcursos(),
        window.AprovaAPI.listarProvasAnteriores()
      ]);
      gen.concursos = concResp.concursos || [];
      gen.provas = provasResp.provas || [];
      if (user?.concurso_alvo_id) gen.concurso_id = user.concurso_alvo_id;
    } catch (e) {}

    container.innerHTML = `
      <div id="gerador-rapido-mount"></div>

      <div class="questoes-workspace">
        <div id="question-player-mount">
          <div class="surface-card">
            <h2 class="card-head-title">Caderno Interativo Pronto para Iniciar</h2>
            <p class="sheet-desc">Escolha a dificuldade acima (incluindo <strong>Sorteado</strong>) e clique em <strong>Iniciar Bateria</strong>, ou aceite o Simulado Dirigido do Theo ao lado.</p>
            <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.dispararGeradorRapido('simulado_rapido')">
              ${utils.icon('play')} Começar Bateria de ${gen.quantidade} Questões Agora
            </button>
          </div>

          <div class="surface-card" style="margin-top:20px;">
            <div class="card-head-row">
              <div>
                <h3 class="card-head-title">Provas Anteriores Oficiais</h3>
                <p class="card-head-sub">Resolva provas reais organizadas por banca e edital.</p>
              </div>
              <span class="badge badge-neutral">Básico: 1/sem · Pro: Ilimitado</span>
            </div>
            <div>
              ${(gen.provas || []).slice(0, 6).map(p => `
                <div class="mat-item">
                  <div>
                    <div class="mat-item-title">${safe(p.titulo)}</div>
                    <div class="mat-item-meta">${safe(p.orgao)} · Banca ${safe(p.banca)}</div>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(p.concurso_id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'prova_anterior', prova_titulo: '${esc(p.titulo)}' })">
                    Resolver Prova →
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <aside id="theo-sidebar-box"></aside>
      </div>
    `;

    drawGerador();
    window.AprovaComponents.renderSugestaoTheoCard(gen.concurso_id);
  };
})();
