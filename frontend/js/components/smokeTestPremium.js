/**
 * Tela 5: Planos e Assinaturas (Gratuito, Básico R$ 19,90, Pro R$ 37,90, Pro+ R$ 67,90 · Mensal / Anual 24% OFF)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  let billingPeriod = 'mensal'; // 'mensal' | 'anual'

  window.AprovaComponents.setPlanBilling = function (period) {
    billingPeriod = period === 'anual' ? 'anual' : 'mensal';
    window.AprovaComponents.renderPremiumView();
  };

  window.AprovaComponents.ativarPlanoSelecionado = async function (planoNome, btnEl) {
    const user = window.AprovaAPI.obterUsuarioAtual();
    const utils = window.AprovaUtils;
    if (!user) {
      window.AprovaComponents.openAuthModal('register', btnEl);
      utils.showToast(`Crie sua conta gratuita para experimentar ou ativar o plano ${planoNome}.`);
      return;
    }

    utils.setButtonLoading(btnEl, true, 'Atualizando plano...');
    try {
      const resp = await window.AprovaAPI.atualizarPerfilUsuario({
        nome: user.nome,
        carreira_foco: user.carreira_foco || 'Policial',
        escolaridade: user.escolaridade || 'Superior',
        uf_interesse: user.ufs_interesse || user.uf_interesse || 'Nacional',
        horas_estudo_dia: Number(user.horas_estudo_dia || 4),
        plano: planoNome,
        concurso_alvo_id: user.concurso_alvo_id || 'pf-2026'
      });
      if (resp?.usuario) {
        window.AprovaAPI.salvarSessaoUsuario(resp.usuario);
      }
      utils.showToast(`Plano atualizado para ${planoNome}! Todas as permissões e selos foram aplicados.`);
      window.AprovaComponents.renderHeaderUserWidget();
      window.AprovaComponents.renderPremiumView();
    } catch (err) {
      utils.setButtonLoading(btnEl, false);
      utils.showToast(err.message || 'Não foi possível atualizar o plano.', { variant: 'error' });
    }
  };

  window.AprovaComponents.renderPremiumView = function () {
    const container = document.getElementById('premium-smoke-container');
    if (!container) return;

    const user = window.AprovaAPI.obterUsuarioAtual();
    const activePlan = user?.plano || 'Gratuito';
    const checkIcon = window.AprovaUtils.icon('check');
    const esc = (v) => window.AprovaUtils.escapeHtml(v);
    const isAnual = billingPeriod === 'anual';

    const tiers = [
      {
        id: 'Gratuito',
        badge: 'Para começar',
        precoMensal: 'R$ 0',
        precoAnual: 'R$ 0',
        desc: 'Conheça seu nível inicial e organize o edital escolhido.',
        featured: false,
        itens: [
          '1 simulado de nivelamento — independentemente da banca',
          '15 questões comentadas por dia',
          '1 guia do edital na tela (sem download PDF)',
          'Painel de evolução por disciplina'
        ]
      },
      {
        id: 'Básico',
        badge: 'Ritmo constante',
        precoMensal: 'R$ 19,90',
        precoAnual: 'R$ 15,10',
        desc: 'Prática diária com provas oficiais todas as semanas.',
        featured: false,
        itens: [
          '50 questões comentadas por dia',
          '1 prova anterior oficial por semana',
          '40% dos guias do edital na tela (sem download PDF)',
          'Cronograma semanal por peso de prova'
        ]
      },
      {
        id: 'Pro',
        badge: 'Mais escolhido',
        precoMensal: 'R$ 37,90',
        precoAnual: 'R$ 28,80',
        desc: 'Preparação completa com PDF A4 e Simulados Dirigidos do Theo.',
        featured: true,
        itens: [
          'Questões, nivelamentos e provas anteriores ilimitados',
          'Simulados Dirigidos do Theo cruzando todo o concurso',
          '100% dos roteiros organizados por tópico + Download em PDF A4',
          'Cronograma adaptativo automático'
        ]
      },
      {
        id: 'Pro+',
        badge: 'Acompanhamento VIP',
        precoMensal: 'R$ 67,90',
        precoAnual: 'R$ 51,60',
        desc: 'Para quem busca correção de discursivas e alertas em tempo real.',
        featured: false,
        itens: [
          'Tudo do plano Pro ilimitado + PDF A4',
          'Correção detalhada de redação e discursivas por banca',
          'Alertas imediatos de movimentações e abertura de edital',
          'Prioridade máxima no atendimento humano'
        ]
      }
    ];

    container.innerHTML = `
      <div class="section-banner">
        <div>
          <h1>Escolha o plano ideal para o seu momento de aprovação</h1>
          <p>Alterne entre os planos a qualquer instante para testar os recursos completos, download em PDF A4 e regras automáticas da conta.</p>
        </div>
        <span class="badge badge-cobalt">Plano atual: ${window.AprovaUtils.safeText(activePlan)}</span>
      </div>

      <div class="planos-billing-bar">
        <div class="subtabs-pill-group" role="group" aria-label="Ciclo de cobrança">
          <button type="button" class="subtab-btn ${!isAnual ? 'active' : ''}" onclick="window.AprovaComponents.setPlanBilling('mensal')">
            Mensal
          </button>
          <button type="button" class="subtab-btn ${isAnual ? 'active' : ''}" onclick="window.AprovaComponents.setPlanBilling('anual')">
            Anual · Economize 24%
          </button>
        </div>
      </div>

      <div class="planos-grid-4">
        ${tiers.map(t => {
          const isCurrent = activePlan.toLowerCase() === t.id.toLowerCase();
          const price = isAnual ? t.precoAnual : t.precoMensal;
          return `
            <article class="plano-card ${t.featured ? 'featured' : ''}">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px;">
                  <strong style="font-size:1.125rem; color:var(--text);">${t.id}</strong>
                  <span class="badge ${t.featured ? 'badge-cobalt' : 'badge-neutral'}">${t.badge}</span>
                </div>
                <div class="plano-price">
                  ${price}${t.id === 'Gratuito' ? '' : '<small>/mês</small>'}
                </div>
                <p class="text-caption-muted" style="margin-top:8px;">${t.desc}</p>

                <ul class="pro-feature-list" style="margin-top:16px;">
                  ${t.itens.map(it => `<li>${checkIcon}<span>${it}</span></li>`).join('')}
                </ul>
              </div>

              <button
                type="button"
                class="btn ${isCurrent ? 'btn-soft' : (t.featured ? 'btn-primary' : 'btn-outline')} btn-block"
                ${isCurrent ? 'disabled' : ''}
                onclick="window.AprovaComponents.ativarPlanoSelecionado('${esc(t.id)}', this)"
              >
                ${isCurrent ? 'Plano ativo agora' : (user ? `Selecionar plano ${t.id}` : `Começar no ${t.id}`)}
              </button>
            </article>
          `;
        }).join('')}
      </div>

      <div class="surface-card">
        <h2 class="card-head-title" style="margin-bottom:4px;">Comparativo Detalhado dos Planos</h2>
        <p class="card-head-sub" style="margin-bottom:16px;">Transparência total sobre limites diários, semanais e exportação.</p>
        <div class="table-scroll-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Gratuito</th>
                <th>Básico</th>
                <th>Pro</th>
                <th>Pro+</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Simulados de Nivelamento Diagnóstico</strong></td>
                <td>1 simulado (qualquer banca)</td>
                <td>Ilimitado</td>
                <td>Ilimitado</td>
                <td>Ilimitado</td>
              </tr>
              <tr>
                <td><strong>Banco de Questões Comentadas</strong></td>
                <td>15 questões/dia</td>
                <td>50 questões/dia</td>
                <td>Ilimitado</td>
                <td>Ilimitado</td>
              </tr>
              <tr>
                <td><strong>Provas Anteriores Oficiais</strong></td>
                <td>Amostra</td>
                <td>1 prova anterior por semana</td>
                <td>Ilimitado</td>
                <td>Ilimitado</td>
              </tr>
              <tr>
                <td><strong>Guias de Estudo &amp; Download em PDF</strong><br><span class="text-caption-muted">Roteiros organizados por tópico do edital</span></td>
                <td>1 guia na tela (sem PDF)</td>
                <td>40% do edital na tela (sem PDF)</td>
                <td>Ilimitado + Download PDF A4</td>
                <td>Ilimitado + Download PDF A4</td>
              </tr>
              <tr>
                <td><strong>Simulados Dirigidos do Theo</strong></td>
                <td>—</td>
                <td>—</td>
                <td>Incluído</td>
                <td>Incluído</td>
              </tr>
              <tr>
                <td><strong>Discursivas IA &amp; Alertas Pré-Edital</strong></td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>VIP em tempo real</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  };
})();
