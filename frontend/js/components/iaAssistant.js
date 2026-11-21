/**
 * Componente: Copiloto Aprova+ IA (Simulador de Compatibilidade + Cronograma Proporcional + Chat Persistente)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const CHAT_HISTORY_KEY = 'aprova_mais_chat_history_v1';

  const DEFAULT_WELCOME = {
    role: 'assistant',
    html: 'Base operacional sincronizada com <strong>13 concursos mapeados</strong> (5 com edital aberto, 4 previstos pelo Radar IA e 4 históricos com provas comentadas) e <strong>34 roteiros de estudo</strong>. Qual órgão ou carreira você deseja analisar?'
  };

  function getChatHistory() {
    try {
      const raw = sessionStorage.getItem(CHAT_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [DEFAULT_WELCOME];
  }

  function saveChatHistory(entries) {
    try {
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(entries.slice(-30)));
    } catch (e) {}
  }

  function renderChatEntries(logEl) {
    if (!logEl) return;
    const utils = window.AprovaUtils;
    const esc = (v) => utils.escapeHtml(v);
    const entries = getChatHistory();

    logEl.innerHTML = entries.map(item => {
      if (item.role === 'user') {
        return `
          <div class="chat-entry chat-entry-user">
            <span class="chat-entry-role">Sua Consulta</span>
            ${esc(utils.cleanText(item.text || ''))}
          </div>
        `;
      }
      const html = utils.sanitizeRichHtml(item.html || '');
      return `
        <div class="chat-entry">
          <span class="chat-entry-role">Copiloto Aprova+ IA</span>
          ${html}
          ${item.concursoId ? `
            <div class="chat-action-row">
              <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openConcursoModal('${esc(item.concursoId)}', this)">
                <span>Abrir Dossiê e Materiais deste Concurso</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  window.AprovaComponents.renderIAAssistant = function () {
    const container = document.getElementById('ia-assistant-container');
    if (!container) return;

    const utils = window.AprovaUtils;
    container.innerHTML = `
      <div class="split-workspace-ia">
        <!-- Coluna 1: Simulador de Compatibilidade e Alocação Semanal -->
        <div class="ia-sheet">
          <h3 class="sheet-title">
            Simulador de Compatibilidade e Carga Horária
          </h3>
          <p class="sheet-desc">
            Defina sua escolaridade, carreira foco e disponibilidade semanal. O motor distribui suas horas proporcionalmente ao número de questões de cada disciplina.
          </p>

          <form id="ia-match-form" onsubmit="window.AprovaComponents.executarMatchIA(event)" class="form-grid-2 form-divider-bottom">
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
              <label for="ia-horas">Horas líquidas por dia</label>
              <select id="ia-horas" class="field-input">
                <option value="2">2 horas/dia</option>
                <option value="3">3 horas/dia</option>
                <option value="4" selected>4 horas/dia</option>
                <option value="6">6 horas/dia</option>
              </select>
            </div>
            <div class="field-group">
              <label for="ia-dias">Dias de estudo por semana</label>
              <select id="ia-dias" class="field-input">
                <option value="5">5 dias/semana (Seg–Sex)</option>
                <option value="6" selected>6 dias/semana (Seg–Sáb)</option>
                <option value="7">7 dias/semana (Todos os dias)</option>
              </select>
            </div>
            <div class="field-group form-span-2">
              <label for="ia-foco">Horizonte de Edital</label>
              <select id="ia-foco" class="field-input">
                <option value="todos">Todos os Horizontes</option>
                <option value="aberto">Somente Editais Abertos</option>
                <option value="previsto">Pré-Edital (Previstos no Radar IA)</option>
              </select>
            </div>
            <button type="submit" id="ia-match-submit-btn" class="btn btn-primary form-span-2">
              Calcular Compatibilidade e Cronograma Semanal
            </button>
          </form>

          <div id="ia-match-results"></div>
        </div>

        <!-- Coluna 2: Terminal de Consulta Técnica Aprova+ IA -->
        <div class="ia-sheet">
          <div class="chat-header-row">
            <div>
              <h3 class="sheet-title">
                Consulta Técnica ao Copiloto IA
              </h3>
              <p class="sheet-desc">
                Consulte editais abertos, estágio de rumores na web, notas de corte e disciplinas prioritárias.
              </p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.limparChatIA()">
              ${utils.icon('reset')}
              <span>Limpar conversa</span>
            </button>
          </div>

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

          <div id="ia-chat-log" class="chat-log-window" aria-live="polite"></div>

          <form onsubmit="window.AprovaComponents.enviarMensagemChat(event)" class="chat-form-row">
            <label for="ia-chat-input" class="sr-only">Digite sua pergunta para o Copiloto Aprova+ IA</label>
            <input type="text" id="ia-chat-input" class="field-input" placeholder="Consulte por PF, Caixa, INSS, BB, Receita, Nível Médio..." required />
            <button type="submit" id="ia-chat-submit-btn" class="btn btn-primary">
              ${utils.icon('send')}
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

    renderChatEntries(document.getElementById('ia-chat-log'));
    window.AprovaComponents.executarMatchIA();
  };

  window.AprovaComponents.limparChatIA = function () {
    saveChatHistory([DEFAULT_WELCOME]);
    renderChatEntries(document.getElementById('ia-chat-log'));
    window.AprovaUtils.showToast('Histórico da conversa reiniciado.');
  };

  window.AprovaComponents.executarMatchIA = async function (event) {
    if (event) event.preventDefault();
    const box = document.getElementById('ia-match-results');
    const submitBtn = document.getElementById('ia-match-submit-btn');
    if (!box) return;

    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const esc = (v) => utils.escapeHtml(v);
    const horasDia = parseInt(document.getElementById('ia-horas')?.value || '4', 10);
    const diasSem = parseInt(document.getElementById('ia-dias')?.value || '6', 10);
    const payload = {
      escolaridade: document.getElementById('ia-escolaridade')?.value || 'Superior',
      area_interesse: document.getElementById('ia-area')?.value || 'Policial',
      horas_por_dia: horasDia,
      dias_por_semana: diasSem,
      foco_status: document.getElementById('ia-foco')?.value || 'todos'
    };

    if (event) utils.setButtonLoading(submitBtn, true, 'Calculando...');
    box.setAttribute('aria-busy', 'true');

    let res;
    try {
      res = await window.AprovaAPI.calcularMatchPerfil(payload);
    } catch (err) {
      box.removeAttribute('aria-busy');
      if (event) utils.setButtonLoading(submitBtn, false);
      box.innerHTML = `
        <div class="auth-error-banner visible" role="alert">
          ${esc(err.message || 'Erro ao calcular compatibilidade de perfil.')}
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.executarMatchIA()">
          ${utils.icon('reset')}
          <span>Tentar novamente</span>
        </button>
      `;
      return;
    }

    box.removeAttribute('aria-busy');
    if (event) utils.setButtonLoading(submitBtn, false);

    const recs = res.recomendacoes || res.top_recomendacoes || [];
    const horasSemanais = res.perfil_analisado?.horas_semanais_uteis || (horasDia * diasSem);

    if (!recs.length) {
      box.innerHTML = `<p class="empty-inline-note">Nenhum concurso compatível encontrado para os parâmetros selecionados.</p>`;
      return;
    }

    box.innerHTML = recs.map((r, idx) => {
      const cObj = r.concurso || r;
      const score = r.compatibilidade_pct || r.match_score || 92;
      const plano = r.cronograma_sugerido || r.plano_semanal || [];
      const motivos = Array.isArray(r.motivos) ? r.motivos : [];
      const statusBadge = utils.getStatusBadgeClass(cObj.status || 'aberto');
      const shortStatus = utils.getShortStatusLabel(cObj.status || 'aberto');
      const heading = utils.formatConcursoHeading(cObj.sigla, cObj.titulo);

      const pillsHtml = plano.map(p => {
        const hrs = p.horas_semanais !== undefined ? `${p.horas_semanais}h/sem` : p.horas_semana;
        return `<span class="schedule-pill">${safe(p.disciplina)}: <strong>${safe(hrs)}</strong></span>`;
      }).join('');

      const motivosHtml = motivos.length
        ? `<ul class="match-reasons-list">${motivos.map(m => `<li>${safe(m)}</li>`).join('')}</ul>`
        : '';

      return `
        <div class="match-result-item">
          <div class="match-result-head">
            <h4 class="match-item-title">
              ${idx + 1}. ${heading}
            </h4>
            <span class="badge ${idx === 0 ? 'badge-aberto' : 'badge-cobalt'}">${safe(score)}% Compatível</span>
          </div>
          <p class="match-item-meta">
            <span class="badge ${statusBadge}">${safe(shortStatus)}</span>
            Salário: <strong class="text-green">${safe(cObj.salario)}</strong> · Banca: <strong>${safe(cObj.banca)}</strong>
          </p>
          ${motivosHtml}
          <div class="match-schedule-heading">
            Distribuição Semanal Proporcional (${horasSemanais}h líquidas em ${diasSem} dias/sem):
          </div>
          <div class="match-schedule-pills">
            ${pillsHtml}
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openConcursoModal('${esc(cObj.id)}', this)">
            <span>Abrir Raio-X e Materiais de ${safe(cObj.sigla)}</span>
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
    const submitBtn = document.getElementById('ia-chat-submit-btn');
    if (!input || !log || !input.value.trim()) return;

    const utils = window.AprovaUtils;
    const esc = (v) => utils.escapeHtml(v);
    const pergunta = input.value.trim();
    input.value = '';

    const history = getChatHistory();
    history.push({ role: 'user', text: pergunta });
    saveChatHistory(history);
    renderChatEntries(log);

    // Indicador temporário de processamento
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-entry chat-entry-typing';
    typingEl.setAttribute('role', 'status');
    typingEl.innerHTML = `<span class="chat-entry-role">Copiloto Aprova+ IA</span>Analisando sua consulta na base de editais...`;
    log.appendChild(typingEl);
    log.scrollTop = log.scrollHeight;

    utils.setButtonLoading(submitBtn, true, 'Consultando...');
    try {
      const res = await window.AprovaAPI.enviarChatIA(pergunta);
      typingEl.remove();
      history.push({
        role: 'assistant',
        html: res.resposta || '',
        concursoId: res.concurso_sugerido || null
      });
      saveChatHistory(history);
      renderChatEntries(log);
    } catch (err) {
      typingEl.remove();
      log.innerHTML += `
        <div class="chat-entry" role="alert">
          <span class="chat-entry-role">Copiloto Aprova+ IA</span>
          <span class="auth-error-banner visible">${esc(err.message || 'Não foi possível processar sua consulta no momento.')}</span>
        </div>
      `;
      log.scrollTop = log.scrollHeight;
    } finally {
      utils.setButtonLoading(submitBtn, false);
      input.focus();
    }
  };
})();
