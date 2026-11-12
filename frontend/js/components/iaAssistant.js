/**
 * Componente: Copiloto Aprova+ IA (Simulador de Match de Perfil + Cronograma Semanal + Chat NLP)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderIAAssistant = function () {
  const container = document.getElementById('ia-assistant-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1.15fr 1fr; gap:22px; align-items:start;">
      <!-- Coluna 1: Simulador de Match de Perfil e Trilha -->
      <div class="concurso-card">
        <div>
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text); margin-bottom:6px;">
            Simulador de Match de Concurso e Trilha Semanal
          </h3>
          <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:16px;">
            Informe sua escolaridade, área foco e horas disponíveis por dia. O algoritmo calcula os concursos mais compatíveis (abertos e previstos) e distribui sua carga horária semanal por peso de disciplina.
          </p>

          <form onsubmit="window.AprovaComponents.executarMatchIA(event)" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding-bottom:18px; border-bottom:1px solid var(--border); margin-bottom:16px;">
            <div class="field-group">
              <label for="ia-escolaridade">Sua Escolaridade</label>
              <select id="ia-escolaridade" class="field-input">
                <option value="Superior">Ensino Superior Completo</option>
                <option value="Médio">Ensino Médio Completo</option>
              </select>
            </div>
            <div class="field-group">
              <label for="ia-area">Carreira / Área de Interesse</label>
              <select id="ia-area" class="field-input">
                <option value="Policial">Carreira Policial (PF, PRF)</option>
                <option value="Bancária">Carreira Bancária (Caixa, BB)</option>
                <option value="Tribunais">Tribunais e Judiciário (TSE, TJ-SP)</option>
                <option value="Administrativa">Administrativa / Previdenciária (INSS, CNU)</option>
                <option value="Fiscal">Fiscal e Controle (Receita, BACEN, CGU)</option>
                <option value="Ambiental">Ambiental (IBAMA)</option>
              </select>
            </div>
            <div class="field-group">
              <label for="ia-horas">Horas líquidas de estudo por dia</label>
              <select id="ia-horas" class="field-input">
                <option value="2">2 horas/dia (12h/semana)</option>
                <option value="3">3 horas/dia (18h/semana)</option>
                <option value="4" selected>4 horas/dia (24h/semana)</option>
                <option value="6">6 horas/dia (36h/semana)</option>
              </select>
            </div>
            <div class="field-group">
              <label for="ia-foco">Objetivo de Prazo</label>
              <select id="ia-foco" class="field-input">
                <option value="todos">Abertos + Previstos</option>
                <option value="aberto">Somente Editais Abertos</option>
                <option value="previsto">Pré-Edital (Previstos na Internet)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="grid-column: span 2;">
              Gerar Diagnóstico e Cronograma Semanal
            </button>
          </form>

          <div id="ia-match-results"></div>
        </div>
      </div>

      <!-- Coluna 2: Chat Interativo Aprova+ IA -->
      <div class="concurso-card">
        <div>
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text); margin-bottom:6px;">
            Pergunte ao Copiloto Aprova+ IA
          </h3>
          <p style="font-size:0.9375rem; color:var(--text-secondary); margin-bottom:14px;">
            Tire dúvidas sobre editais abertos, rumores na internet, notas de corte históricas ou peça recomendação de material.
          </p>

          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
            <button type="button" class="btn btn-outline" style="font-size:0.8125rem; padding:6px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('Quais concursos estão com edital aberto agora?')">
              Editais abertos hoje
            </button>
            <button type="button" class="btn btn-outline" style="font-size:0.8125rem; padding:6px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estão falando na internet sobre INSS e Banco do Brasil?')">
              Rumores INSS e BB
            </button>
            <button type="button" class="btn btn-outline" style="font-size:0.8125rem; padding:6px 10px;" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estudar para a Polícia Federal PF?')">
              O que estudar para PF
            </button>
          </div>

          <div id="ia-chat-log" style="border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:16px 0; height:320px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; margin-bottom:14px;">
            <div style="font-size:0.9375rem; color:var(--text);">
              <strong>Aprova+ IA:</strong> Olá! Estou conectado à base com <strong>13 concursos mapeados</strong> (5 abertos, 4 previstos por rumores na web e 4 históricos com provas passadas) e <strong>34 materiais gratuitos</strong>. Como posso apoiar seu estudo hoje?
            </div>
          </div>

          <form onsubmit="window.AprovaComponents.enviarMensagemChat(event)" style="display:flex; gap:10px;">
            <input type="text" id="ia-chat-input" class="field-input" style="flex:1;" placeholder="Pergunte sobre PF, Caixa, INSS, BB, Receita, Nível Médio..." required />
            <button type="submit" class="btn btn-primary">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  `;

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

  window.AprovaComponents.executarMatchIA();
};

window.AprovaComponents.executarMatchIA = async function (event) {
  if (event) event.preventDefault();
  const box = document.getElementById('ia-match-results');
  if (!box) return;

  const clean = window.AprovaUtils.cleanText;
  const payload = {
    escolaridade: document.getElementById('ia-escolaridade')?.value || 'Superior',
    area_interesse: document.getElementById('ia-area')?.value || 'Policial',
    horas_por_dia: parseInt(document.getElementById('ia-horas')?.value || '4', 10),
    foco_status: document.getElementById('ia-foco')?.value || 'todos'
  };

  const res = await window.AprovaAPI.calcularMatchPerfil(payload);
  const recs = res.recomendacoes || res.top_recomendacoes || [];
  const horasSemanais = res.horas_semanais || res.perfil_analisado?.horas_semanais_uteis || payload.horas_por_dia * 6;

  box.innerHTML = recs.map((r, idx) => {
    const cObj = r.concurso || r;
    const score = r.compatibilidade_pct || r.match_score || 92;
    const plano = r.cronograma_sugerido || r.plano_semanal || [];
    return `
      <div style="padding:14px 0; border-bottom:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px; margin-bottom:4px;">
          <h4 style="font-size:1.0625rem; font-weight:800; color:var(--text);">
            #${idx + 1} · ${clean(cObj.sigla)} (${clean(cObj.titulo)})
          </h4>
          <span class="badge ${idx === 0 ? 'badge-aberto' : 'badge-purple'}">${score}% Compatível</span>
        </div>
        <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:8px;">
          ${clean(cObj.status_label)} · Salário: <strong>${clean(cObj.salario)}</strong> · Banca: <strong>${clean(cObj.banca)}</strong>
        </p>
        <div style="font-size:0.8125rem; color:var(--muted); margin-bottom:10px;">
          <strong>Divisão Semanal Sugerida (${horasSemanais}h/sem):</strong>
          ${plano.map(p => `${clean(p.disciplina)} (${p.horas_semanais ? p.horas_semanais + 'h' : p.horas_semana})`).join(' · ')}
        </div>
        <button type="button" class="btn btn-outline" style="padding:6px 12px; font-size:0.8125rem;" onclick="window.AprovaComponents.openConcursoModal('${cObj.id}')">
          Abrir Raio-X e Materiais de ${clean(cObj.sigla)}
        </button>
      </div>
    `;
  }).join('');
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

  const clean = window.AprovaUtils.cleanText;
  const pergunta = input.value.trim();
  input.value = '';

  log.innerHTML += `
    <div style="font-size:0.9375rem; color:var(--primary); font-weight:600; padding-top:8px; border-top:1px solid var(--border);">
      <strong>Você:</strong> ${clean(pergunta)}
    </div>
  `;
  log.scrollTop = log.scrollHeight;

  const res = await window.AprovaAPI.enviarChatIA(pergunta);
  log.innerHTML += `
    <div style="font-size:0.9375rem; color:var(--text);">
      ${clean(res.resposta)}
      ${res.concurso_sugerido ? `
        <div style="margin-top:8px;">
          <button type="button" class="btn btn-outline" style="padding:6px 12px; font-size:0.8125rem;" onclick="window.AprovaComponents.openConcursoModal('${res.concurso_sugerido}')">
            Abrir Raio-X e Materiais deste Concurso
          </button>
        </div>
      ` : ''}
    </div>
  `;
  log.scrollTop = log.scrollHeight;
};
