/**
 * Componente: Teste de Fumaça (Smoke Test) do Plano Premium — Aprova+ PRO (Fase 2 Futura)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderPremiumView = function () {
  const container = document.getElementById('premium-smoke-container');
  if (!container || container.dataset.rendered === 'true') return;
  container.dataset.rendered = 'true';

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1.15fr; gap:22px; align-items:start;">
      <!-- Comparativo Free (MVP Atual) vs PRO (Fase 2) -->
      <div class="concurso-card">
        <div>
          <span class="badge badge-aberto" style="margin-bottom:8px;">🟢 PLANO GRATUITO (MVP ATUAL — 100% LIBERADO)</span>
          <h3 style="font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            Comunidade & Busca Centralizada Aprova+
          </h3>
          <p style="font-size:0.85rem; color:#475569; margin-bottom:14px;">
            Tudo o que o concurseiro precisa para descobrir editais abertos, monitorar rumores reais da internet e baixar materiais base gratuitamente:
          </p>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:9px; font-size:0.86rem; margin-bottom:20px;">
            <li>✅ <strong>Busca Centralizada 3 Status:</strong> Concursos Ativos, Previstos na Internet e Históricos.</li>
            <li>✅ <strong>Radar IA de Rumores Web:</strong> Termômetro de autorização, comissão formada e banca.</li>
            <li>✅ <strong>Materiais Vinculados por Edital:</strong> Editais verticalizados, apostilas PDF e provas passadas.</li>
            <li>✅ <strong>Checklist de Estudo Persistente:</strong> Marcação de materiais estudados no banco de dados.</li>
          </ul>

          <div style="border-top:1px solid #e2e8f0; padding-top:16px;">
            <span class="badge badge-purple" style="margin-bottom:8px;">✨ FASE 2 FUTURA — PLANO APROVA+ PRO</span>
            <h4 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:8px;">
              O que estamos construindo para a versão Premium:
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

      <!-- Formulário Smoke Test (Validação de Demanda Real & Disposição a Pagar) -->
      <div class="concurso-card" style="border:2px solid #8b5cf6; background:linear-gradient(180deg, #ffffff 0%, #faf5ff 100%);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <span class="badge badge-purple">🧪 SMOKE TEST (VALIDAÇÃO DE DEMANDA)</span>
            <span style="font-size:0.78rem; font-weight:800; color:#6d28d9;">50% OFF Vitalício para Early Adopters</span>
          </div>
          <h3 style="font-size:1.3rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            Entre na Lista VIP do Aprova+ PRO
          </h3>
          <p style="font-size:0.84rem; color:#475569; margin-bottom:16px;">
            Ainda estamos desenvolvendo o módulo Premium (Fase 2). Cadastre-se gratuitamente abaixo para garantir <strong>30 dias grátis + 50% de desconto no lançamento</strong> e escolha qual recurso devemos priorizar!
          </p>

          <form onsubmit="window.AprovaComponents.salvarLeadSmokeTest(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div class="field-group">
              <label>Seu Nome Completo</label>
              <input type="text" id="lead-nome" class="field-input" placeholder="Ex: Carlos Eduardo" required />
            </div>
            <div class="field-group">
              <label>WhatsApp ou E-mail para Receber o Convite VIP</label>
              <input type="text" id="lead-contato" class="field-input" placeholder="Ex: (11) 99999-8888 ou seu@email.com" required />
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
                <label>Quanto seria justo pagar no PRO?</label>
                <select id="lead-preco" class="field-input">
                  <option value="R$ 19,90/mês">R$ 19,90/mês</option>
                  <option value="R$ 29,90/mês" selected>R$ 29,90/mês (Mais votado)</option>
                  <option value="R$ 39,90/mês">R$ 39,90/mês</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label>Qual ferramenta Premium é MAIS importante para você?</label>
              <select id="lead-recurso" class="field-input">
                <option value="Alertas WhatsApp de Rumores e Editais">📲 Alertas no WhatsApp sobre Rumores e Abertura de Edital</option>
                <option value="Cronograma Adaptativo por IA">📅 Cronograma de Estudos Adaptativo por IA</option>
                <option value="Corretor de Discursivas IA (Padrão Banca)">✍️ Corretor de Redação/Discursivas por IA</option>
                <option value="Simulados Inéditos Comentados">📝 Gerador de Simulados Inéditos no Estilo da Banca</option>
              </select>
            </div>
            <button type="submit" class="btn btn-purple" style="padding:13px; font-size:0.95rem; margin-top:4px;">
              🚀 Garantir Vaga na Lista VIP (Registrar no SQLite)
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

  const feedback = document.getElementById('smoke-test-feedback');
  if (feedback) {
    feedback.innerHTML = `
      <div style="background:#f0fdf4; border:1px solid #86efac; color:#15803d; padding:12px; border-radius:10px; font-size:0.84rem; font-weight:600;">
        ✅ <strong>Lead #${res.id} gravado no banco SQLite!</strong> Vá até a aba <em>"📊 Canvas & Métricas MVP"</em> para ver seu registro contabilizado nas métricas de validação da startup.
      </div>
    `;
  }

  document.getElementById('lead-nome').value = '';
  document.getElementById('lead-contato').value = '';
  window.AprovaApp.atualizarTelemetriaTopo();
};

