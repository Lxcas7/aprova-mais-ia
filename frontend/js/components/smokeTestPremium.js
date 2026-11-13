/**
 * Componente: Plano Premium (Aprova+ PRO · Matriz Comparativa e Lista VIP Smoke Test)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderPremiumView = function () {
  const container = document.getElementById('premium-smoke-container');
  if (!container) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  const checkIcon = window.AprovaUtils.icon('check');
  const shieldIcon = window.AprovaUtils.icon('shield');

  container.innerHTML = `
    <div class="split-workspace-pro">
      <!-- Coluna 1: Matriz Comparativa Plano Gratuito vs Aprova+ PRO -->
      <div class="ia-sheet">
        <div class="match-result-head">
          <h3 class="sheet-title">
            Acesso Gratuito (MVP) vs. Aprova+ PRO
          </h3>
          <span class="badge badge-neutral">Comparativo de Escopo</span>
        </div>
        <p class="sheet-desc">
          Toda a infraestrutura essencial de descoberta de editais, verificação de rumores e acervo base permanece gratuita para o candidato:
        </p>

        <ul class="pro-feature-list">
          <li>
            ${checkIcon}
            <div><strong>Busca Centralizada em 3 Horizontes:</strong> Concursos Ativos com edital aberto, Previstos na Internet e Históricos com notas de corte.</div>
          </li>
          <li>
            ${checkIcon}
            <div><strong>Radar IA de Movimentações Web:</strong> Termômetro percentual de maturidade (comissão formada, dispensa de banca e pedidos no MGI).</div>
          </li>
          <li>
            ${checkIcon}
            <div><strong>Acervo Vinculado por Edital:</strong> Download imediato de editais verticalizados, apostilas direcionadas e provas passadas.</div>
          </li>
          <li>
            ${checkIcon}
            <div><strong>Caderno de Estudos Pessoal:</strong> Marcação de materiais concluídos, favoritos e telemetria de evolução na barra superior.</div>
          </li>
        </ul>

        <div class="pro-tier-divider">
          <div class="match-result-head">
            <h4 class="sheet-subtitle">
              Especificação Exclusiva Aprova+ PRO (Fase 2)
            </h4>
            <span class="badge badge-previsto">Em Validação</span>
          </div>
          <ul class="pro-feature-list pro-tier">
            <li>
              ${shieldIcon}
              <div><strong>Alertas Instantâneos via WhatsApp e Telegram:</strong> Notificação imediata na publicação de portarias no DOU ou contratação de banca da sua carreira foco.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Corretor de Discursivas e Redação por IA:</strong> Avaliação analítica baseada nos espelhos oficiais de correção da Cebraspe, FGV, FCC e Cesgranrio.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Cronograma Dinâmico Adaptativo:</strong> Recálculo automático das metas semanais conforme sua taxa de acerto em baterias de questões.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Preditor de Nota de Corte por Polo/Região:</strong> Simulação estatística de concorrência para escolha estratégica de lotação.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Coluna 2: Dossiê de Pré-Inscrição VIP Aprova+ PRO -->
      <div class="ia-sheet">
        <div class="match-result-head">
          <h3 class="sheet-title">
            Reserva na Lista VIP · Aprova+ PRO
          </h3>
          <span class="badge badge-aberto">30 Dias Grátis + 50% OFF</span>
        </div>
        <p class="sheet-desc">
          Registre seu interesse prioritário sem custo para assegurar <strong>30 dias de acesso gratuito e 50% de desconto vitalício</strong> na abertura da Fase 2, além de votar na ferramenta que devemos liberar primeiro.
        </p>

        <form onsubmit="window.AprovaComponents.salvarLeadSmokeTest(event)" class="form-stack">
          <div class="field-group">
            <label for="lead-nome">Nome Completo</label>
            <input type="text" id="lead-nome" class="field-input" placeholder="Ex: Carlos Eduardo Silva" value="${user ? user.nome : ''}" required />
          </div>
          <div class="field-group">
            <label for="lead-contato">WhatsApp ou E-mail para Convite VIP</label>
            <input type="text" id="lead-contato" class="field-input" placeholder="Ex: (11) 99999-8888 ou seu@email.com" value="${user ? user.email : ''}" required />
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label for="lead-carreira">Carreira Foco</label>
              <select id="lead-carreira" class="field-input">
                <option value="Policial (PF / PRF / PC)">Policial (PF / PRF / PC)</option>
                <option value="Bancária (Caixa / BB / BACEN)">Bancária (Caixa / BB / BACEN)</option>
                <option value="Tribunais e Judiciário">Tribunais e Judiciário</option>
                <option value="Administrativa / INSS / CNU">Administrativa / INSS / CNU</option>
                <option value="Fiscal e Controle (Receita / CGU)">Fiscal e Controle (Receita / CGU)</option>
              </select>
            </div>
            <div class="field-group">
              <label for="lead-preco">Modalidade de Interesse</label>
              <select id="lead-preco" class="field-input">
                <option value="R$ 19,90/mês (Anual)">Plano Anual · R$ 19,90/mês</option>
                <option value="R$ 29,90/mês (Mensal)" selected>Plano Mensal · R$ 29,90/mês</option>
              </select>
            </div>
          </div>
          <div class="field-group">
            <label for="lead-recurso">Qual recurso PRO tem maior utilidade para a sua rotina?</label>
            <select id="lead-recurso" class="field-input">
              <option value="Alertas WhatsApp de Rumores e Editais">Alertas no WhatsApp sobre Rumores e Abertura de Edital</option>
              <option value="Cronograma Adaptativo por IA">Cronograma de Estudos Adaptativo por IA</option>
              <option value="Corretor de Discursivas IA (Padrão Banca)">Corretor de Redação e Discursivas por IA</option>
              <option value="Simulados Inéditos Comentados">Gerador de Simulados Inéditos no Estilo da Banca</option>
            </select>
          </div>
          <button type="submit" class="btn btn-accent btn-block">
            Confirmar Reserva na Lista VIP PRO
          </button>
        </form>

        <div id="smoke-test-feedback" class="smoke-feedback-box"></div>
      </div>
    </div>
  `;
};

window.AprovaComponents.salvarLeadSmokeTest = async function (event) {
  event.preventDefault();
  const payload = {
    nome: document.getElementById('lead-nome').value.trim(),
    contato: document.getElementById('lead-contato').value.trim(),
    carreira_foco: document.getElementById('lead-carreira').value,
    recurso_favorito: document.getElementById('lead-recurso').value,
    faixa_preco: document.getElementById('lead-preco').value
  };

  const res = await window.AprovaAPI.cadastrarLeadPremium(payload);
  window.AprovaUtils.showToast(res.mensagem);
  window.AprovaComponents.renderHeaderUserWidget();

  const feedback = document.getElementById('smoke-test-feedback');
  if (feedback) {
    feedback.innerHTML = `
      <div class="smoke-feedback-banner">
        ${window.AprovaUtils.icon('check')}
        <span>Reserva VIP confirmada. Seu perfil recebeu o selo Lista VIP PRO com 50% de desconto garantido.</span>
      </div>
    `;
  }
};
