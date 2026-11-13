/**
 * Componente: Copiloto Aprova+ IA (Simulador de Compatibilidade + Cronograma Semanal + Terminal de Consulta)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderIAAssistant = function () {
  const container = document.getElementById('ia-assistant-container');
  if (!container) return;

  container.innerHTML = `
    <div class="split-workspace-ia">
      <!-- Coluna 1: Simulador de Compatibilidade e Alocação Semanal -->
      <div class="ia-sheet">
        <h3 class="sheet-title">
          Simulador de Compatibilidade e Carga Horária
        </h3>
        <p class="sheet-desc">
          Defina sua escolaridade, carreira foco e horas líquidas por dia. O motor calcula a aderência aos editais mapeados e distribui a carga horária semanal conforme o peso estatístico das disciplinas.
        </p>

        <form onsubmit="window.AprovaComponents.executarMatchIA(event)" class="form-grid-2 form-divider-bottom">
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
              <option value="Bancária">Carreira Bancária (Caixa, BB, BACEN)</option>
              <option value="Tribunais">Tribunais e Judiciário (TSE, TJ-SP)</option>
              <option value="Administrativa">Administrativa / Previdenciária (INSS, CNU)</option>
              <option value="Fiscal">Fiscal e Controle (Receita, CGU)</option>
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
            <label for="ia-foco">Horizonte de Edital</label>
            <select id="ia-foco" class="field-input">
              <option value="todos">Todos os Horizontes</option>
              <option value="aberto">Somente Editais Abertos</option>
              <option value="previsto">Pré-Edital (Previstos na Internet)</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary form-span-2">
            Calcular Compatibilidade e Cronograma Semanal
          </button>
        </form>

        <div id="ia-match-results"></div>
      </div>

      <!-- Coluna 2: Terminal de Consulta Técnica Aprova+ IA -->
      <div class="ia-sheet">
        <h3 class="sheet-title">
          Consulta Técnica ao Copiloto IA
        </h3>
        <p class="sheet-desc">
          Consulte dados de editais abertos, estágio de maturidade de rumores na web, notas de corte históricas ou disciplinas prioritárias por órgão.
        </p>

        <div class="chat-quick-prompts">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.enviarPerguntaRapida('Quais concursos estão com edital aberto agora?')">
            Editais abertos hoje
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estão falando na internet sobre INSS e Banco do Brasil?')">
            Rumores INSS e BB
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.enviarPerguntaRapida('O que estudar para a Polícia Federal PF?')">
            Matriz da Polícia Federal
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.enviarPerguntaRapida('Quais concursos aceitam ensino médio?')">
            Concursos Nível Médio
          </button>
        </div>

        <div id="ia-chat-log" class="chat-log-window">
          <div class="chat-entry">
            <span class="chat-entry-role">Copiloto Aprova+ IA</span>
            Base operacional sincronizada com <strong>13 concursos mapeados</strong> (5 ativos com edital aberto, 4 previstos por movimentações na internet e 4 históricos com provas comentadas) e <strong>34 materiais gratuitos</strong>. Qual órgão ou carreira você deseja analisar?
          </div>
        </div>

        <form onsubmit="window.AprovaComponents.enviarMensagemChat(event)" class="chat-form-row">
          <input type="text" id="ia-chat-input" class="field-input" placeholder="Consulte por PF, Caixa, INSS, BB, Receita, Nível Médio..." required />
          <button type="submit" class="btn btn-primary">
            ${window.AprovaUtils.icon('send')}
            <span>Consultar</span>
          </button>
        </form>
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

  if (!recs.length) {
    box.innerHTML = `<p class="empty-inline-note">Nenhum concurso compatível encontrado para os parâmetros selecionados.</p>`;
    return;
  }

  box.innerHTML = recs.map((r, idx) => {
    const cObj = r.concurso || r;
    const score = r.compatibilidade_pct || r.match_score || 92;
    const plano = r.cronograma_sugerido || r.plano_semanal || [];
    const statusBadge = window.AprovaUtils.getStatusBadgeClass(cObj.status || 'aberto');

    const pillsHtml = plano.map(p => {
      const hrs = p.horas_semanais ? `${p.horas_semanais}h/sem` : p.horas_semana;
      return `<span class="schedule-pill">${clean(p.disciplina)}: <strong>${clean(hrs)}</strong></span>`;
    }).join('');

    return `
      <div class="match-result-item">
        <div class="match-result-head">
          <h4 class="match-item-title">
            ${idx + 1}. ${clean(cObj.sigla)} · ${clean(cObj.titulo)}
          </h4>
          <span class="badge ${idx === 0 ? 'badge-aberto' : 'badge-cobalt'}">${score}% Compatível</span>
        </div>
        <p class="match-item-meta">
          <span class="badge ${statusBadge}">${clean(cObj.status_label)}</span>
          Salário: <strong class="text-green">${clean(cObj.salario)}</strong> · Banca: <strong>${clean(cObj.banca)}</strong>
        </p>
        <div class="match-schedule-heading">
          Distribuição Semanal Recomendada (${horasSemanais}h líquidas/semana):
        </div>
        <div class="match-schedule-pills">
          ${pillsHtml}
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openConcursoModal('${cObj.id}')">
          <span>Abrir Raio-X e Materiais de ${clean(cObj.sigla)}</span>
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
    <div class="chat-entry chat-entry-user">
      <span class="chat-entry-role">Sua Consulta</span>
      ${clean(pergunta)}
    </div>
  `;
  log.scrollTop = log.scrollHeight;

  const res = await window.AprovaAPI.enviarChatIA(pergunta);
  log.innerHTML += `
    <div class="chat-entry">
      <span class="chat-entry-role">Copiloto Aprova+ IA</span>
      ${clean(res.resposta)}
      ${res.concurso_sugerido ? `
        <div class="chat-action-row">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openConcursoModal('${res.concurso_sugerido}')">
            <span>Abrir Dossiê e Materiais deste Concurso</span>
          </button>
        </div>
      ` : ''}
    </div>
  `;
  log.scrollTop = log.scrollHeight;
};
