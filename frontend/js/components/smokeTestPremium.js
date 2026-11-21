/**
 * Componente: Planos e Acesso (Teste de 14 dias, Plano Básico Gratuito Limitado e Assinatura Aprova+ PRO)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderPremiumView = function () {
  const container = document.getElementById('premium-smoke-container');
  if (!container) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  const checkIcon = window.AprovaUtils.icon('check');
  const shieldIcon = window.AprovaUtils.icon('shield');
  const esc = (v) => window.AprovaUtils.escapeHtml(v);

  container.innerHTML = `
    <div class="split-workspace-pro">
      <!-- Coluna 1: Matriz Comparativa Plano Básico vs Assinatura Aprova+ PRO -->
      <div class="ia-sheet">
        <div class="match-result-head">
          <h3 class="sheet-title">
            Plano Básico Gratuito vs. Assinatura Aprova+ PRO
          </h3>
          <span class="badge badge-neutral">Teste de 14 Dias</span>
        </div>
        <p class="sheet-desc">
          Experimente a preparação completa por <strong>14 dias gratuitos</strong>. Após o período de teste, você mantém o acesso ao plano básico gratuito com recursos limitados ou escolhe uma assinatura paga:
        </p>

        <ul class="pro-feature-list">
          <li>
            ${checkIcon}
            <div><strong>Plano Básico Gratuito (Pós-teste):</strong> Busca nos 3 status de concursos, visualização resumida do Radar IA e acesso limitado aos roteiros básicos de estudo.</div>
          </li>
          <li>
            ${checkIcon}
            <div><strong>Caderno de Estudos Essencial:</strong> Acompanhamento básico de metas e marcação de materiais concluídos na sua conta.</div>
          </li>
        </ul>

        <div class="pro-tier-divider">
          <div class="match-result-head">
            <h4 class="sheet-subtitle">
              Assinatura Aprova+ PRO (Acesso Ampliado)
            </h4>
            <span class="badge badge-aberto">14 Dias de Teste Grátis</span>
          </div>
          <ul class="pro-feature-list pro-tier">
            <li>
              ${shieldIcon}
              <div><strong>Alertas em Tempo Real (WhatsApp e Telegram):</strong> Notificações imediatas de portarias no DOU, contratação de banca e abertura de editais da sua carreira foco.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Corretor de Discursivas e Redação por IA:</strong> Avaliação analítica baseada nos critérios das bancas Cebraspe, FGV, FCC e Cesgranrio.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Cronograma Dinâmico Adaptativo:</strong> Recálculo automático das metas semanais conforme seu ritmo de revisão e acertos.</div>
            </li>
            <li>
              ${shieldIcon}
              <div><strong>Acervo Completo & Preditor de Nota de Corte:</strong> Simulação estatística por polo/região e liberação irrestrita de cadernos e simulados comentados.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Coluna 2: Inscrição para Teste de 14 Dias e Acesso Prioritário PRO -->
      <div class="ia-sheet">
        <div class="match-result-head">
          <h3 class="sheet-title">
            Ativar Teste de 14 Dias · Aprova+ PRO
          </h3>
          <span class="badge badge-cobalt">Sem Compromisso</span>
        </div>
        <p class="sheet-desc">
          Registre seu interesse para receber o convite de <strong>14 dias gratuitos no Aprova+ PRO</strong> e indique qual recurso deve ter prioridade na sua rotina de estudos.
        </p>

        <form id="smoke-lead-form" onsubmit="window.AprovaComponents.salvarLeadSmokeTest(event)" class="form-stack">
          <div class="field-group">
            <label for="lead-nome">Nome Completo</label>
            <input type="text" id="lead-nome" class="field-input" placeholder="Ex: Carlos Eduardo Silva" value="${user ? esc(user.nome) : ''}" minlength="2" required />
          </div>
          <div class="field-group">
            <label for="lead-contato">WhatsApp (com DDD) ou E-mail</label>
            <input type="text" id="lead-contato" class="field-input" placeholder="Ex: (11) 99999-8888 ou seu@email.com" value="${user ? esc(user.email) : ''}" minlength="5" required />
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
              <label for="lead-preco">Plano de Preferência</label>
              <select id="lead-preco" class="field-input">
                <option value="R$ 19,90/mês (Anual)">Assinatura Anual · R$ 19,90/mês</option>
                <option value="R$ 29,90/mês (Mensal)" selected>Assinatura Mensal · R$ 29,90/mês</option>
              </select>
            </div>
          </div>
          <div class="field-group">
            <label for="lead-recurso">Qual recurso PRO tem maior utilidade para a sua rotina?</label>
            <select id="lead-recurso" class="field-input">
              <option value="Alertas WhatsApp de Rumores e Editais">Alertas no WhatsApp sobre movimentações e abertura de edital</option>
              <option value="Cronograma Adaptativo por IA">Cronograma de estudos adaptativo por IA</option>
              <option value="Corretor de Discursivas IA (Padrão Banca)">Corretor de redação e discursivas por IA</option>
              <option value="Simulados Inéditos Comentados">Gerador de simulados inéditos no estilo da banca</option>
            </select>
          </div>
          <div id="smoke-error-box" class="auth-error-banner" role="alert"></div>
          <button type="submit" id="smoke-submit-btn" class="btn btn-accent btn-block">
            Solicitar 14 Dias de Teste PRO
          </button>
        </form>

        <div id="smoke-test-feedback" class="smoke-feedback-box"></div>
      </div>
    </div>
  `;

  document.querySelectorAll('#smoke-lead-form input, #smoke-lead-form select').forEach(el => {
    el.addEventListener('input', () => {
      const errBox = document.getElementById('smoke-error-box');
      if (errBox) {
        errBox.classList.remove('visible');
        errBox.textContent = '';
      }
    });
  });
};

window.AprovaComponents._leadEnviado = false;

window.AprovaComponents.salvarLeadSmokeTest = async function (event) {
  event.preventDefault();
  const errBox = document.getElementById('smoke-error-box');
  const submitBtn = document.getElementById('smoke-submit-btn');
  const utils = window.AprovaUtils;

  if (window.AprovaComponents._leadEnviado) {
    utils.showToast('Sua solicitação de acesso já foi registrada.');
    return;
  }

  const nome = document.getElementById('lead-nome').value.trim();
  const contato = document.getElementById('lead-contato').value.trim();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato);
  const digits = contato.replace(/\D/g, '');
  const foneValido = digits.length >= 10 && digits.length <= 13;

  if (!emailValido && !foneValido) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = 'Informe um e-mail válido ou telefone/WhatsApp com DDD (ex: (11) 99999-8888).';
    }
    return;
  }

  const payload = {
    nome,
    contato,
    carreira_foco: document.getElementById('lead-carreira').value,
    recurso_favorito: document.getElementById('lead-recurso').value,
    faixa_preco: document.getElementById('lead-preco').value
  };

  utils.setButtonLoading(submitBtn, true, 'Registrando...');
  try {
    const res = await window.AprovaAPI.cadastrarLeadPremium(payload);
    window.AprovaComponents._leadEnviado = true;
    utils.showToast(res.mensagem);
    window.AprovaComponents.renderHeaderUserWidget();

    const feedback = document.getElementById('smoke-test-feedback');
    if (feedback) {
      feedback.innerHTML = `
        <div class="smoke-feedback-banner">
          ${utils.icon('check')}
          <span>Solicitação confirmada. Seu perfil recebeu acesso prioritário ao teste de 14 dias do plano Aprova+ PRO.</span>
        </div>
      `;
    }
    if (submitBtn) {
      delete submitBtn.dataset.origHtml;
      submitBtn.disabled = true;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Acesso Prioritário Confirmado';
    }
  } catch (err) {
    utils.setButtonLoading(submitBtn, false);
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Não foi possível registrar sua solicitação.';
    } else {
      utils.showToast(err.message || 'Não foi possível registrar sua solicitação.', { variant: 'error' });
    }
  }
};
