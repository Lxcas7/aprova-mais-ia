/**
 * Tela 1: Pesquisa Inicial de Personalização (Fluxo em 3 etapas · grid fluido 5fr / 7fr)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const st = {
    step: 1,
    momento_jornada: 'estudando_edital',
    concurso_alvo_id: 'pf-2026',
    areas_interesse: ['Policial'],
    ufs_interesse: ['Nacional'],
    horas_dia: 4,
    dias_semana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    nivel_base: {},
    estilo_estudo: 'equilibrado',
    concursos: []
  };

  function getSelectedConcurso() {
    return st.concursos.find(c => c.id === st.concurso_alvo_id) || st.concursos[0] || {
      id: 'pf-2026',
      sigla: 'PF',
      titulo: 'Polícia Federal (PF) — Agente, Escrivão e Administrativo',
      banca: 'Cebraspe',
      disciplinas: []
    };
  }

  window.AprovaComponents.renderOnboardingSurvey = async function () {
    const container = document.getElementById('onboarding-survey-container');
    if (!container) return;

    const utils = window.AprovaUtils;
    try {
      const [concResp, obResp] = await Promise.all([
        window.AprovaAPI.listarConcursos(),
        window.AprovaAPI.obterOnboarding()
      ]);
      st.concursos = concResp.concursos || [];
      const curUser = window.AprovaAPI.obterUsuarioAtual();
      if (obResp?.dados) {
        const d = obResp.dados;
        st.momento_jornada = d.momento_jornada || st.momento_jornada;
        st.concurso_alvo_id = d.concurso_alvo_id || st.concurso_alvo_id;
        st.areas_interesse = Array.isArray(d.areas_interesse) && d.areas_interesse.length ? d.areas_interesse : st.areas_interesse;
        st.ufs_interesse = utils.parseUfsList(d.ufs_interesse || curUser?.ufs_interesse || curUser?.uf_interesse || st.ufs_interesse);
        st.horas_dia = Number(d.horas_dia || curUser?.horas_estudo_dia || st.horas_dia);
        st.dias_semana = Array.isArray(d.dias_semana) && d.dias_semana.length ? d.dias_semana : st.dias_semana;
        st.nivel_base = d.nivel_base || {};
        st.estilo_estudo = d.estilo_estudo || 'equilibrado';
      } else if (curUser) {
        st.ufs_interesse = utils.parseUfsList(curUser.ufs_interesse || curUser.uf_interesse || st.ufs_interesse);
        st.horas_dia = Number(curUser.horas_estudo_dia || st.horas_dia);
      }
    } catch (e) {}

    drawSurvey(container);
  };

  function drawSurvey(container) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const conc = getSelectedConcurso();
    const user = window.AprovaAPI.obterUsuarioAtual();

    const moments = [
      { id: 'comecando_agora', title: 'Estou começando agora', desc: 'Quero construir base sólida e descobrir prioridades.' },
      { id: 'estudando_edital', title: 'Já estudo com foco', desc: 'Quero medir desempenho por matéria e corrigir lacunas.' },
      { id: 'reta_final', title: 'Reta final de prova', desc: 'Priorizar peso alto no edital e baterias da banca.' }
    ];

    const areasAll = ['Policial', 'Bancária', 'Tribunais', 'Administrativa', 'Fiscal', 'Ambiental'];
    const diasAll = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const niveisList = ['Iniciante', 'Intermediário', 'Avançado'];
    const estilosList = [
      { id: 'equilibrado', title: 'Equilibrado (Teoria + Questões)', desc: 'Ideal para avançar no edital e fixar toda semana.' },
      { id: 'pratico', title: 'Intensivo em Questões e Simulados', desc: 'Foco maior em bateria da banca e revisão pelos erros.' },
      { id: 'leitura', title: 'Leitura Guiada + Revisão Progressiva', desc: 'Prioriza guias organizados por tópico antes dos simulados.' }
    ];

    let stepBody = '';
    if (st.step === 1) {
      stepBody = `
        <div>
          <span class="badge badge-cobalt">Etapa 1 de 3 · Objetivo e Edital</span>
          <h2 class="sheet-title" style="margin-top:10px;">Em que momento você está e qual prova quer conquistar?</h2>
          <p class="sheet-desc">Usamos essas respostas para calibrar sua meta semanal, os guias prioritários e a banca das questões.</p>
        </div>

        <div class="field-group">
          <label>Momento atual da sua preparação</label>
          <div class="onboarding-option-grid">
            ${moments.map(m => `
              <button type="button" class="choice-tile ${st.momento_jornada === m.id ? 'selected' : ''}" onclick="window.AprovaComponents._obSet('momento_jornada', '${m.id}')">
                <strong>${safe(m.title)}</strong>
                <span>${safe(m.desc)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="field-group">
          <label for="ob-concurso-select">Concurso-alvo principal</label>
          <select id="ob-concurso-select" class="field-input" onchange="window.AprovaComponents._obSet('concurso_alvo_id', this.value)">
            ${st.concursos.map(c => `
              <option value="${esc(c.id)}" ${c.id === st.concurso_alvo_id ? 'selected' : ''}>
                ${safe(c.sigla)} · ${safe(c.titulo)} (${safe(c.banca)})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="field-group">
          <label>Áreas de interesse para comparação de sinergia</label>
          <div class="pill-toggle-row">
            ${areasAll.map(area => {
              const active = st.areas_interesse.includes(area);
              return `
                <button type="button" class="choice-pill ${active ? 'selected' : ''}" onclick="window.AprovaComponents._obToggleArea('${esc(area)}')">
                  ${safe(area)}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="field-group">
          <label for="ob-uf-trigger">UFs de interesse (Nacional e/ou estados)</label>
          ${utils.renderUfMultiSelect('ob-uf', st.ufs_interesse, { onChange: 'AprovaComponents._obSyncUfs' })}
        </div>
      `;
    } else if (st.step === 2) {
      const discs = conc.disciplinas || [];
      stepBody = `
        <div>
          <span class="badge badge-cobalt">Etapa 2 de 3 · Rotina &amp; Disciplinas (${safe(conc.sigla)})</span>
          <h2 class="sheet-title" style="margin-top:10px;">Quanto tempo você tem e qual seu nível em cada matéria?</h2>
          <p class="sheet-desc">Distribuímos suas <strong id="ob-weekly-desc">${safe(utils.formatHorasSemanais(st.horas_dia * st.dias_semana.length))}</strong> semanais respeitando os pesos da banca ${safe(conc.banca)}.</p>
        </div>

        <div class="form-grid-2">
          <div class="field-group">
            <label for="ob-horas">Horas líquidas por dia</label>
            ${utils.renderDailyGoalControl('ob-horas', st.horas_dia, { onChange: 'AprovaComponents._obSyncHoras' })}
          </div>
          <div class="field-group">
            <label>Dias disponíveis na semana</label>
            <div class="day-pill-row">
              ${diasAll.map(dia => {
                const active = st.dias_semana.includes(dia);
                return `
                  <button type="button" class="choice-pill ${active ? 'selected' : ''}" onclick="window.AprovaComponents._obToggleDia('${dia}')">
                    ${dia}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="field-group">
          <label>Como você se avalia hoje nas disciplinas de ${safe(conc.sigla)}?</label>
          <div class="disc-level-list">
            ${discs.map(d => {
              const cur = st.nivel_base[d.nome] || 'Intermediário';
              return `
                <div class="disc-level-row">
                  <div>
                    <div class="disc-level-name">${safe(d.nome)}</div>
                    <span class="text-caption-muted">${safe(d.peso)} · Prioridade ${safe(d.prioridade)}</span>
                  </div>
                  <div class="pill-toggle-row">
                    ${niveisList.map(nv => `
                      <button type="button" class="choice-pill ${cur === nv ? 'selected' : ''}" onclick="window.AprovaComponents._obSetNivel('${esc(d.nome)}', '${nv}')">
                        ${nv}
                      </button>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      const cargas = utils.formatHorasSemanais(st.horas_dia * st.dias_semana.length);
      stepBody = `
        <div>
          <span class="badge badge-aberto">Etapa 3 de 3 · Plano Pronto</span>
          <h2 class="sheet-title" style="margin-top:10px;">Seu plano semanal para ${safe(conc.sigla)} está calibrado</h2>
          <p class="sheet-desc">Escolha como prefere praticar e confirme para abrir o painel principal em tempo real.</p>
        </div>

        <div class="field-group">
          <label>Preferência de estudo semanal</label>
          <div class="onboarding-option-grid">
            ${estilosList.map(es => `
              <button type="button" class="choice-tile ${st.estilo_estudo === es.id ? 'selected' : ''}" onclick="window.AprovaComponents._obSet('estilo_estudo', '${es.id}')">
                <strong>${safe(es.title)}</strong>
                <span>${safe(es.desc)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-box-title">Resumo da sua configuração inicial</div>
          <div class="chart-box-sub" style="margin-bottom:8px;">Cada questão resolvida recalibra esses indicadores automaticamente.</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <span class="badge badge-cobalt">Alvo: ${safe(conc.sigla)} (${safe(conc.banca)})</span>
            <span class="badge badge-aberto">Carga: ${safe(utils.formatHorasDiarias(st.horas_dia))} · ${safe(cargas)}/sem (${st.dias_semana.length} dias)</span>
            <span class="badge badge-neutral">UFs: ${safe(st.ufs_interesse.join(', '))}</span>
            <span class="badge badge-neutral">Áreas: ${safe(st.areas_interesse.join(', ') || conc.area)}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="onboarding-shell">
        <aside class="onboarding-intro-card">
          <div class="onboarding-step-pills">
            <span class="onboarding-step-pill ${st.step === 1 ? 'active' : 'done'}">1. Objetivo</span>
            <span class="onboarding-step-pill ${st.step === 2 ? 'active' : (st.step > 2 ? 'done' : '')}">2. Rotina</span>
            <span class="onboarding-step-pill ${st.step === 3 ? 'active' : ''}">3. Plano</span>
          </div>
          <h1>Comece seu estudo sabendo exatamente o que estudar hoje.</h1>
          <p>
            Em menos de 1 minuto organizamos o seu cronograma por peso do edital, preparamos os guias por tópico e calibramos seu simulado diagnóstico inicial.
          </p>
          <ul class="onboarding-bullets">
            <li>${utils.icon('check')} <span>Zero lançamentos manuais: suas taxas atualizam ao responder questões.</span></li>
            <li>${utils.icon('check')} <span>Banco de provas oficiais no estilo exato da sua banca (${safe(conc.banca)}).</span></li>
            <li>${utils.icon('check')} <span>Você pode alterar ou apagar essas respostas a qualquer momento na conta.</span></li>
          </ul>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
            <button type="button" class="btn btn-hero-ghost btn-sm" onclick="window.AprovaComponents.pularOnboardingParaEstudo()">
              Já sei meu foco · ir para Meu Estudo
            </button>
            ${!user ? `
              <button type="button" class="btn btn-hero-primary btn-sm" onclick="window.AprovaComponents.entrarContaDemo(this)">
                Entrar com Conta Demo (Carlos Lucas · PRO)
              </button>
            ` : ''}
          </div>
        </aside>

        <section class="onboarding-form-card">
          ${stepBody}

          <div class="onboarding-actions">
            <div>
              ${st.step > 1 ? `
                <button type="button" class="btn btn-outline" onclick="window.AprovaComponents._obStep(${st.step - 1})">
                  ← Voltar
                </button>
              ` : '<span></span>'}
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${st.step < 3 ? `
                <button type="button" class="btn btn-primary" onclick="window.AprovaComponents._obStep(${st.step + 1})">
                  Continuar →
                </button>
              ` : `
                <button type="button" id="ob-finish-btn" class="btn btn-primary" onclick="window.AprovaComponents.finalizarOnboarding(this)">
                  Concluir e abrir Meu Estudo →
                </button>
              `}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  window.AprovaComponents._obStep = function (next) {
    if (st.step === 2 && next > 2) {
      const inp = document.getElementById('ob-horas');
      if (inp) {
        const parsed = parseFloat(String(inp.value).replace(',', '.'));
        if (Number.isNaN(parsed) || parsed < 0.5 || parsed > 16) {
          window.AprovaUtils.showToast('Informe uma meta diária entre 0,5h (30 min) e 16h/dia.', { variant: 'error' });
          inp.focus();
          return;
        }
        st.horas_dia = parsed;
      }
    }
    st.step = Math.max(1, Math.min(3, next));
    const container = document.getElementById('onboarding-survey-container');
    if (container) drawSurvey(container);
  };

  window.AprovaComponents._obSyncUfs = function (vals) {
    st.ufs_interesse = window.AprovaUtils.parseUfsList(vals);
  };

  window.AprovaComponents._obSyncHoras = function (val) {
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 0.5 && num <= 16) {
      st.horas_dia = num;
      const weeklyEl = document.getElementById('ob-weekly-desc');
      if (weeklyEl) {
        weeklyEl.textContent = window.AprovaUtils.formatHorasSemanais(st.horas_dia * st.dias_semana.length);
      }
    }
  };

  window.AprovaComponents._obSet = function (key, val) {
    st[key] = val;
    if (key === 'concurso_alvo_id') {
      const c = getSelectedConcurso();
      if (c && c.area && !st.areas_interesse.includes(c.area)) {
        st.areas_interesse = [c.area];
      }
    }
    const container = document.getElementById('onboarding-survey-container');
    if (container) drawSurvey(container);
  };

  window.AprovaComponents._obToggleArea = function (area) {
    if (st.areas_interesse.includes(area)) {
      if (st.areas_interesse.length > 1) {
        st.areas_interesse = st.areas_interesse.filter(a => a !== area);
      }
    } else {
      st.areas_interesse = [...st.areas_interesse, area];
    }
    const container = document.getElementById('onboarding-survey-container');
    if (container) drawSurvey(container);
  };

  window.AprovaComponents._obToggleDia = function (dia) {
    if (st.dias_semana.includes(dia)) {
      if (st.dias_semana.length > 1) {
        st.dias_semana = st.dias_semana.filter(d => d !== dia);
      }
    } else {
      st.dias_semana = [...st.dias_semana, dia];
    }
    const container = document.getElementById('onboarding-survey-container');
    if (container) drawSurvey(container);
  };

  window.AprovaComponents._obSetNivel = function (disc, nivel) {
    st.nivel_base[disc] = nivel;
    const container = document.getElementById('onboarding-survey-container');
    if (container) drawSurvey(container);
  };

  window.AprovaComponents.pularOnboardingParaEstudo = function () {
    window.AprovaAPI.salvarOnboardingVisitante({
      momento_jornada: st.momento_jornada,
      concurso_alvo_id: st.concurso_alvo_id,
      areas_interesse: st.areas_interesse,
      ufs_interesse: st.ufs_interesse,
      horas_dia: Number(st.horas_dia),
      dias_semana: st.dias_semana,
      nivel_base: st.nivel_base,
      estilo_estudo: st.estilo_estudo
    });
    window.AprovaApp.switchView('estudo');
  };

  window.AprovaComponents.finalizarOnboarding = async function (btnEl) {
    const utils = window.AprovaUtils;
    utils.setButtonLoading(btnEl, true, 'Calibrando plano...');
    try {
      const resp = await window.AprovaAPI.salvarOnboarding({
        momento_jornada: st.momento_jornada,
        concurso_alvo_id: st.concurso_alvo_id,
        areas_interesse: st.areas_interesse,
        ufs_interesse: st.ufs_interesse,
        horas_dia: Number(st.horas_dia),
        dias_semana: st.dias_semana,
        nivel_base: st.nivel_base,
        estilo_estudo: st.estilo_estudo
      });
      utils.showToast(resp?.mensagem || 'Plano calibrado com sucesso!');
      window.AprovaComponents.renderHeaderUserWidget();
      window.AprovaApp.switchView('estudo');
    } catch (err) {
      utils.setButtonLoading(btnEl, false);
      utils.showToast(err.message || 'Não foi possível salvar preferências.', { variant: 'error' });
    }
  };
})();
