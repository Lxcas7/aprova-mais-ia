/**
 * Componente: Plano Premium (Aprova+ PRO)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderPremiumView = function () {
  const container = document.getElementById('premium-smoke-container');
  if (!container) return;

  const user = window.AprovaAPI.obterUsuarioAtual();

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1.15fr; gap:22px; align-items:start;">
      <!-- Comparativo Plano Gratuito vs Aprova+ PRO -->
      <div class="concurso-card">
        <div>
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text); margin-bottom:6px;">
            Acesso Essencial Gratuito vs. Aprova+ PRO
          </h3>
          <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:14px;">
            Tudo o que você precisa para encontrar editais abertos, acompanhar rumores reais da internet e baixar materiais base já está liberado gratuitamente na sua conta:
          </p>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:10px; font-size:0.9375rem; margin-bottom:20px; padding:0;">
            <li><strong>Busca Centralizada em 3 Status:</strong> Concursos Ativos, Previstos na Internet e Históricos.</li>
            <li><strong>Radar IA de Rumores Web:</strong> Termômetro de autorização, comissão formada e banca.</li>
            <li><strong>Materiais Vinculados por Edital:</strong> Editais verticalizados, apostilas PDF e provas passadas.</li>
            <li><strong>Checklist de Estudo na Conta:</strong> Marcação de materiais concluídos e favoritos.</li>
          </ul>

          <div style="border-top:1px solid var(--border); padding-top:16px;">
            <h4 style="font-size:1.125rem; font-weight:800; color:var(--text); margin-bottom:10px;">
              Recursos Avançados do Plano Aprova+ PRO:
            </h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:10px; font-size:0.9375rem; color:var(--text-secondary); padding:0;">
              <li><strong>Alertas Instantâneos no WhatsApp e Telegram</strong> no minuto em que sair edital ou rumor quente da sua carreira.</li>
              <li><strong>Corretor de Redação e Discursivas por IA</strong> treinado nos espelhos da Cebraspe, FGV e FCC.</li>
              <li><strong>Cronograma Dinâmico Adaptativo</strong> que recalcula suas metas diárias conforme seus acertos em simulados.</li>
              <li><strong>Simulador de Nota de Corte Personalizado</strong> com predição de ranking.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Formulário de Pré-Inscrição VIP Aprova+ PRO -->
      <div class="concurso-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <h3 style="font-size:1.3125rem; font-weight:800; color:var(--text);">
              Entre na Lista VIP do Aprova+ PRO
            </h3>
            <span class="badge badge-aberto">30 Dias Grátis + 50% OFF</span>
          </div>
          <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:16px;">
            Reserve sua vaga gratuitamente abaixo para ganhar <strong>30 dias de teste grátis e 50% de desconto vitalício</strong> no lançamento do módulo PRO.
          </p>

          <form onsubmit="window.AprovaComponents.salvarLeadSmokeTest(event)" style="display:flex; flex-direction:column; gap:14px;">
            <div class="field-group">
              <label for="lead-nome">Seu Nome Completo</label>
              <input type="text" id="lead-nome" class="field-input" placeholder="Ex: Carlos Eduardo" value="${user ? user.nome : ''}" required />
            </div>
            <div class="field-group">
              <label for="lead-contato">WhatsApp ou E-mail para Receber o Convite VIP</label>
              <input type="text" id="lead-contato" class="field-input" placeholder="Ex: (11) 99999-8888 ou seu@email.com" value="${user ? user.email : ''}" required />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="field-group">
                <label for="lead-carreira">Sua Carreira Foco</label>
                <select id="lead-carreira" class="field-input">
                  <option value="Policial (PF / PRF / PC)">Policial (PF / PRF / PC)</option>
                  <option value="Bancária (Caixa / BB / BACEN)">Bancária (Caixa / BB / BACEN)</option>
                  <option value="Tribunais e Judiciário">Tribunais e Judiciário</option>
                  <option value="Administrativa / INSS / CNU">Administrativa / INSS / CNU</option>
                  <option value="Fiscal e Controle (Receita / CGU)">Fiscal e Controle (Receita / CGU)</option>
                </select>
              </div>
              <div class="field-group">
                <label for="lead-preco">Plano de Interesse</label>
                <select id="lead-preco" class="field-input">
                  <option value="R$ 19,90/mês (Anual)">Anual: R$ 19,90/mês</option>
                  <option value="R$ 29,90/mês (Mensal)" selected>Mensal: R$ 29,90/mês</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label for="lead-recurso">Qual ferramenta PRO você quer usar primeiro?</label>
              <select id="lead-recurso" class="field-input">
                <option value="Alertas WhatsApp de Rumores e Editais">Alertas no WhatsApp sobre Rumores e Abertura de Edital</option>
                <option value="Cronograma Adaptativo por IA">Cronograma de Estudos Adaptativo por IA</option>
                <option value="Corretor de Discursivas IA (Padrão Banca)">Corretor de Redação e Discursivas por IA</option>
                <option value="Simulados Inéditos Comentados">Gerador de Simulados Inéditos no Estilo da Banca</option>
              </select>
            </div>
            <button type="submit" class="btn btn-purple" style="padding:12px; font-size:0.9375rem; margin-top:4px;">
              Ativar Minha Reserva na Lista VIP PRO
            </button>
          </form>

          <div id="smoke-test-feedback" style="margin-top:14px;"></div>
        </div>
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
      <p style="color:var(--green); padding-top:10px; border-top:1px solid var(--border); font-size:0.9375rem; font-weight:600;">
        Reserva VIP confirmada! Seu perfil agora possui o selo Lista VIP PRO com 50% OFF garantido.
      </p>
    `;
  }
};
