/**
 * Telas 2A, 2B, 2C, 2D: Meu Estudo (Hoje + Cross-fade Analítico + Cronograma 6 colunas + Nivelamento & Radar)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const uiState = {
    subtab: 'hoje', // 'hoje' | 'cronograma' | 'nivelamento'
    analyticsView: 'tabela', // 'tabela' | 'graficos' (sem giro 3D — usa cross-fade suave)
    data: null
  };

  window.AprovaComponents.setMeuEstudoSubtab = function (subtab, pushHash = true) {
    const valid = ['hoje', 'cronograma', 'nivelamento'];
    uiState.subtab = valid.includes(subtab) ? subtab : 'hoje';
    if (pushHash && window.AprovaApp?.state?.currentView === 'estudo') {
      const targetHash = uiState.subtab === 'hoje' ? '#estudo' : `#estudo/${uiState.subtab}`;
      if (window.location.hash !== targetHash) {
        history.pushState({ view: 'estudo', subtab: uiState.subtab }, '', targetHash);
      }
    }
    const container = document.getElementById('meu-estudo-container');
    if (container && uiState.data) {
      drawMeuEstudo(container, uiState.data);
    }
  };

  window.AprovaComponents.toggleAnalyticsPanel = function (mode) {
    uiState.analyticsView = mode === 'graficos' ? 'graficos' : 'tabela';
    const box = document.getElementById('estudo-analytics-card');
    if (box && uiState.data) {
      box.innerHTML = renderAnalyticsCardInner(uiState.data);
    }
  };

  window.AprovaComponents.renderMeuEstudo = async function (subtabOverride) {
    const container = document.getElementById('meu-estudo-container');
    if (!container) return;
    if (subtabOverride && ['hoje', 'cronograma', 'nivelamento'].includes(subtabOverride)) {
      uiState.subtab = subtabOverride;
    }

    container.innerHTML = `<div class="empty-state-sheet" role="status">Calculando seu desempenho e plano de estudo...</div>`;
    try {
      const dash = await window.AprovaAPI.obterDashboardEstudo();
      uiState.data = dash;
      drawMeuEstudo(container, dash);
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state-sheet" role="alert">
          <h3>Não foi possível carregar Meu Estudo</h3>
          <p>${window.AprovaUtils.escapeHtml(err.message || 'Erro ao consultar indicadores de estudo.')}</p>
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.renderMeuEstudo()">
            Tentar novamente
          </button>
        </div>
      `;
    }
  };

  window.AprovaComponents.alternarBlocoEstudo = async function (blocoId) {
    const user = window.AprovaAPI.obterUsuarioAtual();
    if (!user) {
      window.AprovaUtils.showToast('Entre ou crie uma conta gratuita para salvar blocos concluídos no cronograma.', {
        actionLabel: 'Entrar',
        onAction: () => window.AprovaComponents.openAuthModal('login')
      });
      return;
    }
    try {
      await window.AprovaAPI.alternarBlocoCronograma(blocoId);
      const dash = await window.AprovaAPI.obterDashboardEstudo();
      uiState.data = dash;
      const container = document.getElementById('meu-estudo-container');
      if (container) drawMeuEstudo(container, dash);
    } catch (err) {
      window.AprovaUtils.showToast(err.message || 'Não foi possível atualizar bloco.', { variant: 'error' });
    }
  };

  function buildLineChartSvg(points) {
    const pts = points && points.length ? points : [{ label: 'Início', taxa_pct: 0, meta_pct: 75 }];
    const W = 640;
    const H = 190;
    const padL = 40;
    const padR = 24;
    const padT = 20;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const toY = (v) => padT + plotH - (Math.max(0, Math.min(100, Number(v) || 0)) / 100) * plotH;
    const toX = (i) => pts.length === 1 ? padL + plotW / 2 : padL + (i / (pts.length - 1)) * plotW;

    const metaVal = pts[0].meta_pct || 75;
    const metaY = toY(metaVal).toFixed(1);

    const coords = pts.map((p, i) => [toX(i), toY(p.taxa_pct), p]);
    const polyline = coords.map(c => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    const areaPath = `M ${coords[0][0].toFixed(1)} ${(padT + plotH).toFixed(1)} `
      + coords.map(c => `L ${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ')
      + ` L ${coords[coords.length - 1][0].toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Evolução semanal em percentual de acertos">
        <defs>
          <linearGradient id="aprovaAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0b4f6c" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#0b4f6c" stop-opacity="0.01" />
          </linearGradient>
        </defs>
        ${[25, 50, 75, 100].map(tick => {
          const y = toY(tick).toFixed(1);
          return `
            <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e5e2d9" stroke-width="1" />
            <text x="${padL - 8}" y="${Number(y) + 4}" text-anchor="end" font-size="11" fill="#4a5d70">${tick}%</text>
          `;
        }).join('')}
        <line x1="${padL}" y1="${metaY}" x2="${W - padR}" y2="${metaY}" stroke="#0f5132" stroke-width="1.5" stroke-dasharray="5 4" />
        <text x="${W - padR}" y="${Number(metaY) - 6}" text-anchor="end" font-size="11" font-weight="700" fill="#0f5132">Meta ${metaVal}%</text>
        ${coords.length > 1 ? `<path d="${areaPath}" fill="url(#aprovaAreaGrad)" />` : ''}
        ${coords.length > 1 ? `<polyline points="${polyline}" fill="none" stroke="#0b4f6c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${coords.map(([cx, cy, p]) => `
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="#0b4f6c" stroke="#ffffff" stroke-width="2" />
          <text x="${cx.toFixed(1)}" y="${(cy - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#102338">${Number(p.taxa_pct).toFixed(0)}%</text>
          <text x="${cx.toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#4a5d70">${window.AprovaUtils.escapeHtml(p.label)}</text>
        `).join('')}
      </svg>
    `;
  }

  function buildRadarSvg(eixos) {
    const items = (eixos && eixos.length >= 3) ? eixos : [
      { label: 'Informática', inicial: 45, atual: 72, meta: 75 },
      { label: 'Português', inicial: 55, atual: 78, meta: 75 },
      { label: 'Contabilidade', inicial: 40, atual: 56, meta: 75 },
      { label: 'Direito', inicial: 50, atual: 71, meta: 75 },
      { label: 'Raciocínio', inicial: 48, atual: 55, meta: 75 }
    ];
    const n = items.length;
    const cx = 180;
    const cy = 155;
    const R = 104;

    const pt = (idx, pct) => {
      const ang = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
      const r = (Math.max(5, Math.min(100, Number(pct) || 0)) / 100) * R;
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    };

    const polyStr = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    const rings = [25, 50, 75, 100].map(pct => {
      const rpts = items.map((_, i) => pt(i, pct));
      return `<polygon points="${polyStr(rpts)}" fill="none" stroke="#e5e2d9" stroke-width="1" />`;
    }).join('');

    const axesLines = items.map((it, i) => {
      const [ox, oy] = pt(i, 100);
      const [lx, ly] = pt(i, 122);
      return `
        <line x1="${cx}" y1="${cy}" x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="#dddad0" stroke-width="1" />
        <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#102338">${window.AprovaUtils.escapeHtml(it.label.slice(0, 14))}</text>
      `;
    }).join('');

    const polyMeta = polyStr(items.map((it, i) => pt(i, it.meta || 75)));
    const polyInicial = polyStr(items.map((it, i) => pt(i, it.inicial || 0)));
    const polyAtual = polyStr(items.map((it, i) => pt(i, it.atual || 0)));

    return `
      <svg viewBox="0 0 360 310" width="100%" role="img" aria-label="Radar pentagonal comparando nivelamento inicial, desempenho atual e meta">
        ${rings}
        ${axesLines}
        <polygon points="${polyMeta}" fill="rgba(15, 81, 50, 0.08)" stroke="#0f5132" stroke-width="1.5" stroke-dasharray="4 3" />
        <polygon points="${polyInicial}" fill="rgba(140, 61, 25, 0.14)" stroke="#8c3d19" stroke-width="2" />
        <polygon points="${polyAtual}" fill="rgba(11, 79, 108, 0.24)" stroke="#0b4f6c" stroke-width="2.5" />
      </svg>
    `;
  }

  function renderAnalyticsCardInner(dash) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const conc = dash.concurso_alvo;
    const discs = dash.desempenho_disciplinas || [];
    const g2b = dash.graficos_2b || { evolucao_periodo: [], acertos_erros_area: [] };

    if (uiState.analyticsView === 'graficos') {
      const hbars = g2b.acertos_erros_area || [];
      return `
        <div class="analytics-panel">
          <div class="card-head-row">
            <div>
              <h2 class="card-head-title">Evolução e Acertos por Área do Edital (${safe(conc.sigla)})</h2>
              <p class="card-head-sub">Leitura visual consolidada de acertos, erros e evolução semanal em ${safe(conc.banca)}.</p>
            </div>
            <span class="auto-sync-pill">${utils.icon('check')} Atualização automática</span>
          </div>

          <div class="charts-stack">
            <div class="chart-box">
              <div class="chart-box-title">Evolução × Período (%)</div>
              <div class="chart-box-sub">Curva de acerto entre o nivelamento inicial e os ciclos recentes de questões</div>
              ${buildLineChartSvg(g2b.evolucao_periodo)}
            </div>

            <div class="chart-box">
              <div class="chart-box-title">Acertos Totais / Erros Totais × Área do Edital</div>
              <div class="chart-box-sub">Distribuição de respostas certas (verde) e erros (terracota) nos últimos 30 dias</div>
              <div class="hbar-list">
                ${hbars.map(h => {
                  const tot = Math.max(h.total || 0, 1);
                  const pctOk = Math.round(((h.acertos || 0) / tot) * 100);
                  const pctErr = Math.round(((h.erros || 0) / tot) * 100);
                  return `
                    <div class="hbar-row">
                      <div class="hbar-label-row">
                        <span>${safe(h.disciplina)}</span>
                        <span>${h.acertos} acertos · ${h.erros} erros (${h.total ? `${Number(h.taxa_pct).toFixed(0)}%` : '0%'})</span>
                      </div>
                      <div class="hbar-track">
                        <div class="hbar-hit" style="width:${h.total ? pctOk : 0}%"></div>
                        <div class="hbar-miss" style="width:${h.total ? pctErr : 0}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="charts-footer-action">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.toggleAnalyticsPanel('tabela')">
              ↻ Voltar para tabela
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="analytics-panel">
        <div class="card-head-row">
          <div>
            <h2 class="card-head-title">Desempenho por Disciplina do Edital</h2>
            <p class="card-head-sub">Atualizado automaticamente após cada questão resolvida em Nivelamento &amp; IA.</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="auto-sync-pill">${utils.icon('check')} Atualização automática</span>
            <button type="button" class="btn btn-soft btn-sm" onclick="window.AprovaComponents.toggleAnalyticsPanel('graficos')">
              ${utils.icon('chart')} Ver gráficos →
            </button>
          </div>
        </div>

        <div class="table-scroll-wrap">
          <table class="perf-table">
            <thead>
              <tr>
                <th>Disciplina / Peso</th>
                <th>Taxa 30d</th>
                <th>Evolução</th>
                <th>Questões</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${discs.map(d => {
                const taxa = Number(d.taxa_atual_pct || 0);
                const fillCls = taxa >= d.meta_pct ? 'good' : (taxa > 0 && taxa < 60 ? 'warn' : '');
                const ev = Number(d.evolucao_pp || 0);
                const evTxt = d.questoes_resolvidas === 0 ? '—' : (ev >= 0 ? `+${ev.toFixed(1)} p.p.` : `${ev.toFixed(1)} p.p.`);
                return `
                  <tr>
                    <td>
                      <strong style="display:block; color:var(--text);">${safe(d.nome_curto)}</strong>
                      <span class="text-caption-muted">${safe(d.peso)} · ${safe(d.prioridade)}</span>
                    </td>
                    <td>
                      <div class="mini-progress-track"><div class="mini-progress-fill ${fillCls}" style="width:${Math.min(100, taxa)}%"></div></div>
                      <strong>${d.questoes_resolvidas ? `${taxa.toFixed(1)}%` : '—'}</strong>
                    </td>
                    <td>
                      <span class="badge ${ev > 0 ? 'badge-aberto' : (d.questoes_resolvidas === 0 ? 'badge-neutral' : 'badge-previsto')}">${safe(evTxt)}</span>
                    </td>
                    <td><strong>${d.questoes_resolvidas}</strong> (${d.acertos}✓ / ${d.erros}✕)</td>
                    <td>
                      <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(conc.id)}', disciplina: '${esc(d.disciplina)}', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'simulado_rapido' })">
                        Praticar
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderHojeTab(dash) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const conc = dash.concurso_alvo;
    const hero = dash.resumo_hero;
    const proximas = dash.cronograma_2c?.proximas_atividades || [];
    const theo = dash.sugestao_theo;

    return `
      <div class="estudo-hero-card">
        <div>
          <span class="hero-kicker">
            ${utils.icon('target')}
            <span>Concurso-alvo ativo · ${safe(conc.banca)}</span>
          </span>
          <h1 class="estudo-hero-title">${safe(conc.sigla)} · ${safe(conc.titulo)}</h1>
          <p class="estudo-hero-sub">
            ${hero.questoes_30d > 0
              ? `Você resolveu ${hero.questoes_30d} questões nos últimos 30 dias com ${hero.taxa_atual_30d}% de acertos e completou ${hero.horas_semana_feitas} de ${hero.horas_semana_meta} previstas esta semana.`
              : `Tudo pronto para iniciar sua preparação em ${safe(conc.sigla)}. Resolva o simulado diagnóstico para medir seu ponto de partida automaticamente.`}
          </p>
          <div class="estudo-hero-actions">
            <button type="button" class="btn btn-hero-primary" onclick="window.AprovaComponents.setMeuEstudoSubtab('cronograma')">
              ${utils.icon('play')}
              <span>Retomar estudo</span>
            </button>
            <button type="button" class="btn btn-hero-ghost" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(conc.id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'simulado_rapido' })">
              Simulado Rápido
            </button>
            <button type="button" class="btn btn-hero-ghost" onclick="window.AprovaApp.switchView('onboarding')">
              Ajustar plano
            </button>
          </div>
        </div>

        <div class="hero-metrics-grid">
          <div class="hero-stat-box">
            <span class="hero-stat-label">Taxa Atual (30d)</span>
            <strong class="hero-stat-value">${hero.questoes_30d ? `${hero.taxa_atual_30d}%` : '—'}</strong>
            <span class="hero-stat-delta">Meta edital: ${hero.meta_aprovacao}%</span>
          </div>
          <div class="hero-stat-box">
            <span class="hero-stat-label">${hero.is_cebraspe ? 'Escore Líquido Proj.' : 'Evolução'}</span>
            <strong class="hero-stat-value">${hero.questoes_30d ? (hero.is_cebraspe ? `${hero.escore_liquido} pts` : `+${hero.evolucao_pp} p.p.`) : '—'}</strong>
            <span class="hero-stat-delta">Ofensiva: ${hero.streak_dias || 0} dias</span>
          </div>
          <div class="hero-stat-box">
            <span class="hero-stat-label">Questões (30d)</span>
            <strong class="hero-stat-value">${hero.questoes_30d}</strong>
            <span class="hero-stat-delta">${hero.acertos_30d} acertos · ${hero.erros_30d} erros</span>
          </div>
          <div class="hero-stat-box">
            <span class="hero-stat-label">Carga na Semana</span>
            <strong class="hero-stat-value">${safe(hero.horas_semana_feitas)}</strong>
            <span class="hero-stat-delta">Meta semanal: ${safe(hero.horas_semana_meta)}</span>
          </div>
        </div>
      </div>

      <div class="estudo-main-grid">
        <div id="estudo-analytics-card" class="surface-card analytics-swap-stage">
          ${renderAnalyticsCardInner(dash)}
        </div>

        <aside class="surface-card">
          <div class="card-head-row" style="margin-bottom:12px;">
            <div>
              <h3 class="card-head-title">Próximas Atividades</h3>
              <p class="card-head-sub">Sequência sugerida para hoje</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.setMeuEstudoSubtab('cronograma')">
              Ver semana
            </button>
          </div>

          <div class="activity-list">
            ${proximas.length ? proximas.map(b => `
              <div class="activity-item">
                <div>
                  <strong>${safe(b.disciplina_curta)}</strong>
                  <span>${safe(b.dia_semana)} · ${safe(b.tipo_bloco)} (${b.minutos_planejados} min)</span>
                </div>
                <button type="button" class="btn btn-soft btn-sm" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(conc.id)}', disciplina: '${esc(b.disciplina)}', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'simulado_rapido' })">
                  Iniciar
                </button>
              </div>
            `).join('') : `<p class="text-caption-muted">Todos os blocos desta semana concluídos! Excelente ritmo.</p>`}
          </div>

          <div class="practice-now-panel">
            <span class="badge badge-cobalt">Praticar Agora · Sugestão do Theo</span>
            <strong style="font-size:0.9375rem; color:var(--text);">${safe(theo.titulo)}</strong>
            <p class="text-caption-muted">${safe(theo.justificativa)}</p>
            <button type="button" class="btn btn-primary btn-block" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(theo.concurso_id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: ${Number(theo.quantidade || 20)}, tipo_sessao: 'simulado_theo' })">
              ${utils.icon('play')}
              <span>Iniciar Simulado do Theo (${Number(theo.quantidade || 20)} qst)</span>
            </button>
          </div>
        </aside>
      </div>
    `;
  }

  function renderCronogramaTab(dash) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const crono = dash.cronograma_2c;
    const conc = dash.concurso_alvo;
    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mapHoje = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaHojeNome = mapHoje[new Date().getDay()] || 'Qui';

    return `
      <div class="crono-summary-banner">
        <div>
          <span class="badge badge-cobalt">Semana Ativa · ${safe(conc.sigla)}</span>
          <h2 class="card-head-title" style="margin-top:6px;">
            ${safe(crono.horas_feitas_label)} de ${safe(crono.horas_meta_label)} concluídas (${crono.percentual_semana}%)
          </h2>
          <p class="card-head-sub">Clique em qualquer bloco abaixo para marcar ou desmarcar sua conclusão.</p>
        </div>
        <div style="min-width:220px;">
          <div class="thermometer-bar" style="height:10px; margin:0 0 6px;">
            <div class="thermometer-fill fill-green" style="width:${Math.min(100, crono.percentual_semana)}%"></div>
          </div>
          <span class="text-caption-muted">${dash.resumo_hero.blocos_concluidos} de ${dash.resumo_hero.blocos_totais} sessões finalizadas</span>
        </div>
      </div>

      <div class="crono-grid-6">
        ${dias.map(dia => {
          const isToday = dia === diaHojeNome;
          const blocosDia = (crono.blocos || []).filter(b => b.dia_semana === dia);
          return `
            <div class="crono-day-col ${isToday ? 'today' : ''}">
              <div class="crono-day-head">
                <span>${dia}</span>
                ${isToday ? `<span class="badge badge-cobalt" style="padding:2px 8px;">Hoje</span>` : ''}
              </div>
              ${blocosDia.map(b => `
                <button type="button" class="crono-block-card ${b.concluido ? 'done' : ''}" onclick="window.AprovaComponents.alternarBlocoEstudo(${b.id})">
                  ${b.concluido ? `<div class="crono-done-row">${utils.icon('check')} <span>Concluído</span></div>` : ''}
                  <span class="crono-block-title">${safe(b.disciplina_curta)}</span>
                  <span class="crono-block-meta">${safe(b.tipo_bloco)} · ${b.minutos_planejados}m</span>
                </button>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>

      <div class="surface-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <span class="badge badge-previsto">Opcional de Domingo</span>
          <h3 class="card-head-title" style="margin-top:6px;">Simulado Cronometrado Completo · ${safe(conc.sigla)} (${safe(conc.banca)})</h3>
          <p class="card-head-sub">Consolidar toda a semana em condições reais de prova e recalibrar seus gráficos automaticamente.</p>
        </div>
        <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(conc.id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 30, tipo_sessao: 'simulado_rapido' })">
          ${utils.icon('play')}
          <span>Abrir Simulado de Domingo</span>
        </button>
      </div>
    `;
  }

  function renderNivelamentoTab(dash) {
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const conc = dash.concurso_alvo;
    const niv = dash.nivelamento_2d;
    const discs = dash.desempenho_disciplinas || [];

    return `
      <div class="estudo-hero-card">
        <div>
          <span class="hero-kicker">${utils.icon('target')} Maturidade no Edital ${safe(conc.sigla)}</span>
          <h2 class="estudo-hero-title">
            ${niv.taxa_inicial}% inicial → ${niv.taxa_atual}% atual (Meta ${niv.meta_aprovacao}%)
          </h2>
          <p class="estudo-hero-sub">
            Compare seu diagnóstico de partida com seu rendimento atual por matéria e acompanhe quanto falta para bater a nota de corte.
          </p>
          <div class="estudo-hero-actions">
            <button type="button" class="btn btn-hero-primary" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${esc(conc.id)}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 20, tipo_sessao: 'nivelamento' })">
              ${utils.icon('play')}
              <span>Iniciar Novo Nivelamento</span>
            </button>
          </div>
        </div>
        <div class="hero-metrics-grid">
          <div class="hero-stat-box">
            <span class="hero-stat-label">Ponto de Partida</span>
            <strong class="hero-stat-value">${niv.taxa_inicial}%</strong>
          </div>
          <div class="hero-stat-box">
            <span class="hero-stat-label">Evolução Geral</span>
            <strong class="hero-stat-value">+${niv.evolucao_pp} p.p.</strong>
          </div>
        </div>
      </div>

      <div class="maturity-cards-grid">
        ${discs.slice(0, 5).map(d => `
          <div class="maturity-card">
            <strong style="font-size:0.875rem; color:var(--text);">${safe(d.nome_curto)}</strong>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--muted);">
              <span>Base: ${d.nivelamento_pct}%</span>
              <strong style="color:var(--primary);">Atual: ${d.taxa_atual_pct}%</strong>
              <span>Meta: ${d.meta_pct}%</span>
            </div>
            <div class="thermometer-bar" style="margin:0;">
              <div class="thermometer-fill ${d.taxa_atual_pct >= d.meta_pct ? 'fill-green' : ''}" style="width:${Math.min(100, d.taxa_atual_pct)}%"></div>
            </div>
            <span class="badge ${d.taxa_atual_pct >= d.meta_pct ? 'badge-aberto' : 'badge-cobalt'}" style="align-self:flex-start;">
              ${safe(d.status_badge)}
            </span>
          </div>
        `).join('')}
      </div>

      <div class="estudo-main-grid">
        <div class="surface-card" style="text-align:center;">
          <h3 class="card-head-title" style="text-align:left;">Radar de Maturidade por Disciplina</h3>
          <p class="card-head-sub" style="text-align:left; margin-bottom:10px;">
            <span style="color:#8c3d19; font-weight:700;">■ Inicial</span> ·
            <span style="color:#0b4f6c; font-weight:700;">■ Atual</span> ·
            <span style="color:#0f5132; font-weight:700;">-- Meta</span>
          </p>
          <div style="max-width:380px; margin:0 auto;">
            ${buildRadarSvg(niv.radar_eixos)}
          </div>
        </div>

        <div class="surface-card">
          <h3 class="card-head-title">Histórico de Nivelamentos</h3>
          <p class="card-head-sub" style="margin-bottom:14px;">Avaliações registradas automaticamente em seu perfil</p>
          ${(niv.historico_nivelamentos || []).length ? niv.historico_nivelamentos.map(h => `
            <div class="mat-item">
              <div>
                <div class="mat-item-title">${safe(h.titulo)}</div>
                <div class="mat-item-meta">${safe(h.data)} · ${h.acertos}/${h.total} acertos</div>
              </div>
              <span class="badge badge-cobalt">${h.taxa_pct}%</span>
            </div>
          `).join('') : `<p class="text-caption-muted">Nenhum nivelamento completo ainda. Clique em "Iniciar Novo Nivelamento" para registrar sua linha de base.</p>`}
        </div>
      </div>
    `;
  }

  function drawMeuEstudo(container, dash) {
    let tabHtml = '';
    if (uiState.subtab === 'cronograma') {
      tabHtml = renderCronogramaTab(dash);
    } else if (uiState.subtab === 'nivelamento') {
      tabHtml = renderNivelamentoTab(dash);
    } else {
      tabHtml = renderHojeTab(dash);
    }

    container.innerHTML = `
      <div class="estudo-subtabs-bar">
        <div class="subtabs-pill-group" role="tablist" aria-label="Visões de Meu Estudo">
          <button type="button" class="subtab-btn ${uiState.subtab === 'hoje' ? 'active' : ''}" role="tab" aria-selected="${uiState.subtab === 'hoje'}" onclick="window.AprovaComponents.setMeuEstudoSubtab('hoje')">
            Hoje
          </button>
          <button type="button" class="subtab-btn ${uiState.subtab === 'cronograma' ? 'active' : ''}" role="tab" aria-selected="${uiState.subtab === 'cronograma'}" onclick="window.AprovaComponents.setMeuEstudoSubtab('cronograma')">
            Cronograma
          </button>
          <button type="button" class="subtab-btn ${uiState.subtab === 'nivelamento' ? 'active' : ''}" role="tab" aria-selected="${uiState.subtab === 'nivelamento'}" onclick="window.AprovaComponents.setMeuEstudoSubtab('nivelamento')">
            Nivelamento
          </button>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('explorar')">
            Trocar concurso-alvo
          </button>
        </div>
      </div>
      ${tabHtml}
    `;
  }
})();
