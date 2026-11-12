/**
 * Componente: Copiloto Aprova+ IA (Simulador de Match de Perfil + Cronograma Semanal + Chat NLP)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderIAAssistant = function () {
  const container = document.getElementById('ia-assistant-container');
  if (!container || container.dataset.rendered === 'true') return;
  container.dataset.rendered = 'true';

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1.15fr 1fr; gap:20px; align-items:start;">
      <!-- Coluna 1: Simulador de Match de Perfil & Gerador de Trilha -->
      <div class="concurso-card">
        <div>
          <span class="badge badge-purple" style="margin-bottom:8px;">🎯 ALGORITMO DE RECOMENDAÇÃO IA</span>
          <h3 style="font-size:1.2rem; font-weight:800; color:#0f172a; margin-bottom:4px;">
            Simulador de Match de Concurso + Trilha de Estudo
          </h3>
          <p style="font-size:0.84rem; color:#475569; margin-bottom:14px;">
            Informe sua escolaridade, área foco e horas disponíveis por dia. O motor Python calcula os concursos ideais (abertos e previstos) e distribui sua carga horária semanal por peso de disciplina.
          </p>

          <form onsubmit="window.AprovaComponents.executarMatchIA(event)" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div class="field-group">
              <label>Sua Escolaridade</label>
              <select id="ia-escolaridade" class="field-input">
                <option value="Superior">Ensino Superior Completo</option>
                <option value="Médio">Ensino Médio Completo</option>
              </select>
            </div>
            <div class="field-group">
              <label>Carreira / Área de Interesse</label>
              <select id="ia-area" class="field-input">
                <option value="Policial">Carreira Policial (PF, PRF)</option>
                <option value="Bancária">Carreira Bancária (Caixa, BB)</option>
                <option value="Tribunais">Tribunais e Judiciário (TSE, TJ-SP)</option>
                <option value="Administrativa">Administrativa / Previdenciária (INSS, CNU)</option>
                <option value="Fiscal & Controle">Fiscal e Controle (Receita, BACEN, CGU)</option>
                <option value="Ambiental">Ambiental (IBAMA)</option>
              </select>
            </div>
            <div class="field-group">
              <label>Horas líquidas de estudo por dia</label>
              <select id="ia-horas" class="field-input">
                <option value="2">2 horas/dia (12h/semana)</option>
                <option value="3">3 horas/dia (18h/semana)</option>
                <option value="4" selected>4 horas/dia (24h/semana)</option>
                <option value="6">6 horas/dia (36h/semana)</option>
              </select>
            </div>
            <div class="field-group">
              <label>Objetivo de Prazo</label>
              <select id="ia-foco" class="field-input">
                <option value="imediato">Edital Aberto (Prova em 60-90 dias)</option>
                <option value="antecipado">Pré-Edital / Previstos na Internet</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="grid-column: span 2;">
              ⚡ Gerar Diagnóstico e Cronograma Semanal com IA
            </button>
          </form>

          <div id="ia-match-results"></div>
        </div>
      </div>

      <!-- Coluna 2: Chat Interativo Aprova+ IA -->
      <div class="concurso-card">
        <div>
          <span class="badge badge-aberto" style="margin-bottom:8px;">💬 ASSISTENTE CONVERSACIONAL 24/7</span>
          <h3 style="font-size:1.2rem; font-weight:800; color:#0f172a; margin-bottom:4px;">
            Pergunte ao Copiloto Aprova+ IA
          </h3>
          <p style="font-size:0.84rem; color:#475569; margin-bottom:10px;">
            Tire dúvidas sobre editais abertos, rumores na internet, notas de corte históricas ou peça recomendação de material.
          </p>

          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
            <button class="btn btn-outline" style="font-size:0.75rem; padding:5px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('Quais concursos estão com edital aberto agora?')">
              🟢 Editais abertos hoje?
            </button>
            <button class="btn btn-outline" style="font-size:0.75rem; padding:5px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estão falando na internet sobre INSS e Banco do Brasil?')">
              📡 Rumores INSS e BB?
            </button>
            <button class="btn btn-outline" style="font-size:0.75rem; padding:5px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estudar para a Polícia Federal PF?')">
              🚓 O que estudar para PF?
            </button>
            <button class="btn btn-outline" style="font-size:0.75rem; padding:5px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('Quais concursos de nível médio pagam bem?')">
              🎓 Melhores de Nível Médio?
            </button>
          </div>

          <div id="ia-chat-log" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; height:320px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px 12px; border-radius:10px; font-size:0.84rem;">
              🤖 <strong>Aprova+ IA:</strong> Olá, concurseiro! Estou conectado ao banco SQLite com <strong>13 concursos mapeados</strong> (5 abertos, 4 previstos por rumores na web e 4 históricos com provas passadas) e <strong>34 materiais gratuitos</strong>. Como posso acelerar sua aprovação hoje?
            </div>
          </div>

          <form onsubmit="window.AprovaComponents.enviarMensagemChat(event)" style="display:flex; gap:8px;">
            <input type="text" id="ia-chat-input" class="field-input" style="flex:1;" placeholder="Pergunte sobre PF, Caixa, INSS, BB, Receita, Nível Médio..." required />
            <button type="submit" class="btn btn-purple">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Sincroniza automaticamente com as preferências do usuário logado, se houver
  const user = window.AprovaAPI.obterUsuarioAtual();
  if (user) {
    if (document.getElementById('ia-escolaridade') && user.escolaridade) {
      document.getElementById('ia-escolaridade').value = user.escolaridade;
    }
    if (document.getElementById('ia-area') && user.carreira_foco) {
      document.getElementById('ia-area').value = user.carreira_foco;
    }
    if (document.getElementById('ia-horas') && user.horas_estudo_dia) {
      document.getElementById('ia-horas').value = String(user.horas_estudo_dia);
    }
  }

  // Executa um cálculo inicial padrão para já mostrar resultado rico na tela
  window.AprovaComponents.executarMatchIA();
};

window.AprovaComponents.executarMatchIA = async function (event) {
  if (event) event.preventDefault();
  const box = document.getElementById('ia-match-results');
  if (!box) return;

  const payload = {
    escolaridade: document.getElementById('ia-escolaridade')?.value || 'Superior',
    area_interesse: document.getElementById('ia-area')?.value || 'Policial',
    horas_por_dia: parseInt(document.getElementById('ia-horas')?.value || '4', 10),
    foco_prazo: document.getElementById('ia-foco')?.value || 'imediato'
  };

  const res = await window.AprovaAPI.calcularMatchPerfil(payload);
  const recs = res.top_recomendacoes || [];

  box.innerHTML = recs.map((r, idx) => `
    <div style="border:1px solid #cbd5e1; border-radius:12px; padding:14px; margin-top:12px; background:${idx === 0 ? '#f0fdf4' : '#fff'};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
        <span class="badge ${idx === 0 ? 'badge-aberto' : 'badge-purple'}">
          🏆 #${idx + 1} Match IA: ${r.match_score}% Compatível
        </span>
        <span style="font-size:0.78rem; font-weight:700; color:#475569;">${r.status_label} • ${r.salario}</span>
      </div>
      <h4 style="font-size:1rem; font-weight:800; color:#0f172a;">${r.sigla} — ${r.titulo}</h4>
      <p style="font-size:0.79rem; color:#334155; margin:4px 0 8px;">
        ✅ ${r.motivos.join(' • ')}
      </p>
      <div style="font-size:0.76rem; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px;">
        <strong>📅 Divisão Semanal Sugerida (${res.perfil_analisado.horas_semanais_uteis}h/sem):</strong>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
          ${(r.plano_semanal || []).map(p => `
            <span style="background:#f1f5f9; padding:3px 8px; border-radius:6px;">
              <strong>${p.disciplina}:</strong> ${p.horas_semana} (${p.prioridade})
            </span>
          `).join('')}
        </div>
      </div>
      <div style="margin-top:8px; text-align:right;">
        <button class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.AprovaComponents.openConcursoModal('${r.id}')">
          Abrir Materiais de ${r.sigla}
        </button>
      </div>
    </div>
  `).join('');

  window.AprovaApp.atualizarTelemetriaTopo();
};

window.AprovaComponents.enviarPerguntaRapida = function (texto) {
  const input = document.getElementById('ia-chat-input');
  if (!input) return;
  input.value = texto;
  window.AprovaComponents.enviarMensagemChat();
};

window.AprovaComponents.enviarMensagemChat = async function (event) {
  if (event) event.preventDefault();
  const input = document.getElementById('ia-chat-input');
  const log = document.getElementById('ia-chat-log');
  if (!input || !log || !input.value.trim()) return;

  const pergunta = input.value.trim();
  input.value = '';

  log.innerHTML += `
    <div style="align-self:flex-end; background:#1e293b; color:#fff; padding:9px 13px; border-radius:10px; font-size:0.84rem; max-width:85%;">
      👤 <strong>Você:</strong> ${pergunta}
    </div>
  `;
  log.scrollTop = log.scrollHeight;

  const res = await window.AprovaAPI.enviarChatIA(pergunta);
  log.innerHTML += `
    <div style="align-self:flex-start; background:#eff6ff; border:1px solid #bfdbfe; color:#0f172a; padding:10px 13px; border-radius:10px; font-size:0.84rem; max-width:92%;">
      ${res.resposta}
      ${res.concurso_sugerido ? `
        <div style="margin-top:8px;">
          <button class="btn btn-primary" style="padding:5px 10px; font-size:0.76rem;" onclick="window.AprovaComponents.openConcursoModal('${res.concurso_sugerido}')">
            📂 Abrir Raio-X e Materiais deste Concurso
          </button>
        </div>
      ` : ''}
    </div>
  `;
  log.scrollTop = log.scrollHeight;
  window.AprovaApp.atualizarTelemetriaTopo();
};

