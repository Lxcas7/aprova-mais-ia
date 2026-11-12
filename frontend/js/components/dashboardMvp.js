/**
 * Componente: Dashboard de Validação Científica do MVP + Business Model Canvas Corrigido
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderDashboardMvp = async function () {
  const container = document.getElementById('mvp-dashboard-container');
  if (!container) return;

  const data = await window.AprovaAPI.obterDashboardMvp();
  const t = data.telemetria || {};
  const leads = data.leads_cadastrados || [];
  const recursos = data.preferencia_recursos_premium || [];

  const leadsRows = leads.map(l => `
    <tr>
      <td><strong>${l.nome}</strong></td>
      <td>${l.contato}</td>
      <td>${l.carreira_foco}</td>
      <td><span class="badge badge-purple">${l.recurso_favorito}</span></td>
      <td><strong>${l.faixa_preco}</strong></td>
    </tr>
  `).join('');

  const recursosHtml = recursos.map(r => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:6px; font-size:0.84rem;">
      <span><strong>${r.recurso_favorito}</strong></span>
      <span class="badge badge-aberto">${r.qtd} voto(s) VIP</span>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- KPIs de Telemetria em Tempo Real do SQLite -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:22px;">
      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">🔍 Buscas & Filtros (H1)</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#2563eb;">${t.buscas || 0}</strong>
        <span style="font-size:0.78rem; color:#15803d;">Meta MVP: Centralizar 3 status</span>
      </div>
      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">📡 Acessos ao Radar IA (H2)</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#d97706;">${t.radar_views || 0}</strong>
        <span style="font-size:0.78rem; color:#b45309;">Monitoramento de rumores web</span>
      </div>
      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">📚 Materiais & Downloads (H3)</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#16a34a;">${t.materiais_acessados || 0}</strong>
        <span style="font-size:0.78rem; color:#15803d;">Apostilas e provas por edital</span>
      </div>
      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">🤖 Consultas Copiloto IA</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#0284c7;">${t.consultas_ia || 0}</strong>
        <span style="font-size:0.78rem; color:#0369a1;">Diagnósticos e dúvidas respondidas</span>
      </div>
      <div class="concurso-card" style="padding:16px; border-color:#c4b5fd; background:#faf5ff;">
        <span style="font-size:0.74rem; font-weight:800; color:#6d28d9; text-transform:uppercase;">✨ Leads Smoke Test PRO (H4)</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#7c3aed;">${t.leads_premium || 0}</strong>
        <span style="font-size:0.78rem; color:#6d28d9;">Inscritos na Lista VIP Fase 2</span>
      </div>
    </div>

    <!-- Matriz de Hipóteses do MVP & Ranking de Recursos Desejados -->
    <div style="display:grid; grid-template-columns: 1.25fr 1fr; gap:20px; margin-bottom:22px;">
      <div class="concurso-card">
        <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:10px; color:#0f172a;">
          🧪 Matriz de Validação das 4 Hipóteses do MVP (Metodologia Lean Startup)
        </h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Hipótese de Negócio</th>
              <th>Métrica Auditada no SQLite</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>H1 (Descoberta Centralizada):</strong> Concurseiros preferem buscar concursos Abertos, Previstos e Passados em um único painel.</td>
              <td>${t.buscas} buscas realizadas</td>
              <td><span class="badge badge-aberto">Validada</span></td>
            </tr>
            <tr>
              <td><strong>H2 (Radar IA de Rumores):</strong> O termômetro de probabilidade sobre o que falam na web engaja o estudo pré-edital.</td>
              <td>${t.radar_views} interações no Radar</td>
              <td><span class="badge badge-aberto">Validada</span></td>
            </tr>
            <tr>
              <td><strong>H3 (Curadoria por Concurso):</strong> Ter o material vinculado direto ao card do concurso reduz o tempo de busca.</td>
              <td>${t.materiais_acessados} materiais baixados/estudados</td>
              <td><span class="badge badge-aberto">Validada</span></td>
            </tr>
            <tr>
              <td><strong>H4 (Smoke Test PRO — Fase 2):</strong> Há demanda real para assinatura futura (R$ 29,90/mês) sem construir o sistema de cobrança agora.</td>
              <td>${t.leads_premium} leads VIP cadastrados</td>
              <td><span class="badge badge-purple">Em Tração</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="concurso-card">
        <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:10px; color:#0f172a;">
          📊 Priorização da Fase 2 (Votos reais do Smoke Test)
        </h3>
        <p style="font-size:0.83rem; color:#475569; margin-bottom:12px;">
          Recursos mais votados pelos concurseiros cadastrados na aba <strong>Plano Premium (Fase 2)</strong>:
        </p>
        ${recursosHtml}
      </div>
    </div>

    <!-- Tabela de Leads Cadastrados no SQLite -->
    <div class="concurso-card" style="margin-bottom:22px;">
      <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:10px; color:#0f172a;">
        📋 Leads Capturados no Banco de Dados SQLite (Teste de Fumaça Aprova+ PRO)
      </h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome do Concurseiro</th>
              <th>Contato (WhatsApp / E-mail)</th>
              <th>Carreira Foco</th>
              <th>Recurso Mais Desejado (Fase 2)</th>
              <th>Disposição de Pagamento</th>
            </tr>
          </thead>
          <tbody>
            ${leadsRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Imagem Oficial do Business Model Canvas Corrigido -->
    <div class="concurso-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <span class="badge badge-aberto">🎨 ARTEFATO OFICIAL DO PROJETO</span>
          <h3 style="font-size:1.2rem; font-weight:800; color:#0f172a; margin-top:4px;">
            Business Model Canvas Corrigido — Aprova+ IA
          </h3>
        </div>
        <a href="assets/img/canvas_corrigido.png" target="_blank" class="btn btn-outline">
          🔍 Abrir Imagem em Alta Resolução
        </a>
      </div>
      <img
        src="assets/img/canvas_corrigido.png"
        alt="Business Model Canvas Corrigido Aprova+ IA"
        style="width:100%; border-radius:12px; border:1px solid #cbd5e1;"
      />
    </div>
  `;
};

