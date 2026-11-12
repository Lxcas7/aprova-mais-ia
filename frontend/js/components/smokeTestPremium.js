/**
 * Componente: Plano Premium — Aprova+ PRO (Lista VIP de Lançamento)
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
          <span class="badge badge-aberto" style="margin-bottom:8px;">🟢 PLANO GRATUITO (INCLUSO NA SUA CONTA)</span>
          <h3 style="font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            Acesso Essencial para Concurseiros
          </h3>
          <p style="font-size:0.85rem; color:#475569; margin-bottom:14px;">
            Tudo o que você precisa para encontrar editais abertos, acompanhar rumores reais da internet e baixar materiais base gratuitamente:
          </p>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:9px; font-size:0.86rem; margin-bottom:20px;">
            <li>✅ <strong>Busca Centralizada em 3 Status:</strong> Concursos Ativos, Previstos na Internet e Históricos.</li>
            <li>✅ <strong>Radar IA de Rumores Web:</strong> Termômetro de autorização, comissão formada e banca.</li>
            <li>✅ <strong>Materiais Vinculados por Edital:</strong> Editais verticalizados, apostilas PDF e provas passadas.</li>
            <li>✅ <strong>Checklist de Estudo na Conta:</strong> Marcação de materiais concluídos e favoritos.</li>
          </ul>

          <div style="border-top:1px solid #e2e8f0; padding-top:16px;">
            <span class="badge badge-purple" style="margin-bottom:8px;">✨ EM BREVE — PLANO APROVA+ PRO</span>
            <h4 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:8px;">
              Recursos Avançados do Plano Premium:
            </h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.85rem; color:#334155;">
              <li>🚀 <strong>Alertas Instantâneos no WhatsApp & Telegram</strong> no minuto em que sair edital ou rumor quente da sua carreira.</li>
              <li>✍️ <strong>Corretor de Redação e Discursivas por IA</strong> treinado nos espelhos da Cebraspe, FGV e FCC.</li>
              <li>📅 <strong>Cronograma Dinâmico Adaptativo</strong> que recalcula suas metas diárias conforme seus acertos em simulados.</li>
              <li>📊 <strong>Simulador de Nota de Corte Personalizado</strong> com predição de ranking.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Formulário de Pré-Inscrição VIP Aprova+ PRO -->
      <div class="concurso-card" style="border:2px solid #8b5cf6; background:linear-gradient(180deg, #ffffff 0%, #faf5ff 100%);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <span class="badge badge-purple">✨ PRÉ-LANÇAMENTO EXCLUSIVO</span>
            <span style="font-size:0.78rem; font-weight:800; color:#6d28d9;">30 Dias Grátis + 50% OFF Vitalício</span>
          </div>
          <h3 style="font-size:1.3rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            Entre na Lista VIP do Aprova+ PRO
          </h3>
          <p style="font-size:0.84rem; color:#475569; margin-bottom:16px;">
            O Plano PRO está em fase final de desenvolvimento. Reserve sua vaga gratuitamente abaixo para ganhar <strong>30 dias de teste grátis + 50% de desconto vitalício</strong> assim que for liberado!
          </p>

          <form onsubmit="window.AprovaComponents.salvarLeadSmokeTest(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div class="field-group">
              <label>Seu Nome Completo</label>
              <input type="text" id="lead-nome" class="field-input" placeholder="Ex: Carlos Eduardo" value="${user ? user.nome : ''}" required />
            </div>
            <div class="field-group">
              <label>WhatsApp ou E-mail para Receber o Convite VIP</label>
              <input type="text" id="lead-contato" class="field-input" placeholder="Ex: (11) 99999-8888 ou seu@email.com" value="${user ? user.email : ''}" required />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="field-group">
                <label>Sua Carreira Foco</label>
                <select id="lead-carreira" class="field-input">
                  <option value="Policial (PF / PRF / PC)">Policial (PF / PRF / PC)</option>
                  <option value="Bancária (Caixa / BB / BACEN)">Bancária (Caixa / BB / BACEN)</option>
                  <option value="Tribunais e Judiciário">Tribunais e Judiciário</option>
                  <option value="Administrativa / INSS / CNU">Administrativa / INSS / CNU</option>
                  <option value="Fiscal e Controle (Receita / CGU)">Fiscal e Controle (Receita / CGU)</option>
                </select>
              </div>
              <div class="field-group">
                <label>Plano de Interesse</label>
                <select id="lead-preco" class="field-input">
                  <option value="R$ 19,90/mês (Anual)">Anual — R$ 19,90/mês</option>
                  <option value="R$ 29,90/mês (Mensal)" selected>Mensal — R$ 29,90/mês</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label>Qual ferramenta PRO você quer usar primeiro?</label>
              <select id="lead-recurso" class="field-input">
                <option value="Alertas WhatsApp de Rumores e Editais">📲 Alertas no WhatsApp sobre Rumores e Abertura de Edital</option>
                <option value="Cronograma Adaptativo por IA">📅 Cronograma de Estudos Adaptativo por IA</option>
                <option value="Corretor de Discursivas IA (Padrão Banca)">✍️ Corretor de Redação/Discursivas por IA</option>
                <option value="Simulados Inéditos Comentados">📝 Gerador de Simulados Inéditos no Estilo da Banca</option>
              </select>
            </div>
            <button type="submit" class="btn btn-purple" style="padding:13px; font-size:0.95rem; margin-top:4px;">
              🚀 Ativar Minha Reserva na Lista VIP PRO
            </button>
          </form>

          <div id="smoke-test-feedback" style="margin-top:12px;"></div>
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
  window.AprovaUtils.showToast(`🎉 ${res.mensagem}`, '#7c3aed');
  window.AprovaComponents.renderHeaderUserWidget();

  const feedback = document.getElementById('smoke-test-feedback');
  if (feedback) {
    feedback.innerHTML = `
      <div style="background:#f0fdf4; border:1px solid #86efac; color:#15803d; padding:12px; border-radius:10px; font-size:0.84rem; font-weight:600;">
        ✅ <strong>Reserva VIP confirmada!</strong> Seu perfil agora possui o selo <em>Lista VIP PRO</em> e você receberá o acesso antecipado com 50% OFF.
      </div>
    `;
  }
};
