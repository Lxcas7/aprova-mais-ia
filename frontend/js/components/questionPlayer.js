/**
 * Componente: Caderno Interativo de Questões Polimórfico (Certo/Errado Cebraspe & Múltipla Escolha A–E com Riscador)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const player = {
    sessao: null,
    questoes: [],
    currentIndex: 0,
    answers: {}, // questaoId -> { resposta_usuario, em_branco, correta, gabarito, comentario }
    eliminated: {}, // questaoId -> Set(letras)
    secondsElapsed: 0,
    timerId: null
  };

  function stopTimer() {
    if (player.timerId) {
      clearInterval(player.timerId);
      player.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    player.secondsElapsed = 0;
    player.timerId = setInterval(() => {
      player.secondsElapsed++;
      const el = document.getElementById('qp-timer-display');
      if (el) {
        const m = String(Math.floor(player.secondsElapsed / 60)).padStart(2, '0');
        const s = String(player.secondsElapsed % 60).padStart(2, '0');
        el.textContent = `${m}:${s}`;
      }
    }, 1000);
  }

  window.AprovaComponents.mountQuestionSession = function (sessionPayload) {
    player.sessao = sessionPayload.sessao;
    player.questoes = sessionPayload.questoes || [];
    player.currentIndex = 0;
    player.answers = {};
    player.eliminated = {};
    startTimer();
    drawPlayer();
  };

  window.AprovaComponents.goToQuestionIndex = function (idx) {
    if (idx < 0 || idx >= player.questoes.length) return;
    player.currentIndex = idx;
    drawPlayer();
  };

  window.AprovaComponents.toggleStrikeOption = function (questaoId, letra) {
    if (player.answers[questaoId]) return;
    if (!player.eliminated[questaoId]) player.eliminated[questaoId] = new Set();
    const set = player.eliminated[questaoId];
    if (set.has(letra)) set.delete(letra);
    else set.add(letra);
    drawPlayer();
  };

  window.AprovaComponents.submeterRespostaQuestao = async function (questaoId, letra, emBranco = false) {
    if (!player.sessao) return;
    const utils = window.AprovaUtils;
    try {
      const res = await window.AprovaAPI.responderQuestao(player.sessao.id, {
        questao_id: questaoId,
        resposta_usuario: emBranco ? '' : letra,
        em_branco: Boolean(emBranco),
        tempo_segundos: Math.max(5, player.secondsElapsed)
      });
      player.answers[questaoId] = {
        resposta_usuario: emBranco ? '' : letra,
        em_branco: Boolean(res.em_branco),
        correta: Boolean(res.correta),
        gabarito: res.gabarito,
        comentario: res.comentario
      };
      if (res.sessao) {
        player.sessao = { ...player.sessao, ...res.sessao };
      }
      drawPlayer();
    } catch (err) {
      utils.showToast(err.message || 'Erro ao registrar resposta.', { variant: 'error' });
    }
  };

  window.AprovaComponents.finalizarBateriaAtual = async function () {
    if (!player.sessao) return;
    stopTimer();
    try {
      const resp = await window.AprovaAPI.finalizarSessaoQuestoes(player.sessao.id);
      player.sessao.status = 'concluida';
      window.AprovaUtils.showToast(resp?.mensagem || 'Bateria finalizada! Métricas recalculadas.');
      drawSummary();
      if (window.AprovaComponents.renderSugestaoTheoCard) {
        window.AprovaComponents.renderSugestaoTheoCard(player.sessao.concurso_id);
      }
    } catch (err) {
      window.AprovaUtils.showToast(err.message || 'Erro ao finalizar bateria.', { variant: 'error' });
    }
  };

  function drawSummary() {
    const mount = document.getElementById('question-player-mount');
    if (!mount || !player.sessao) return;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);

    const vals = Object.values(player.answers);
    const acertos = vals.filter(a => a.correta).length;
    const branco = vals.filter(a => a.em_branco).length;
    const erros = vals.filter(a => !a.correta && !a.em_branco).length;
    const total = player.questoes.length || 1;
    const pct = Math.round((acertos / total) * 1000) / 10;

    mount.innerHTML = `
      <div class="surface-card">
        <span class="badge badge-aberto">Bateria Concluída · Atualização Automática Aplicada</span>
        <h2 class="sheet-title" style="margin-top:10px;">${safe(player.sessao.titulo)}</h2>
        <p class="sheet-desc">Suas respostas já foram consolidadas no painel de evolução e na recomendação do Theo.</p>

        <div class="card-divider-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));">
          <div class="meta-item"><span>Aproveitamento</span><strong class="text-green">${pct}%</strong></div>
          <div class="meta-item"><span>Acertos</span><strong>${acertos}/${total}</strong></div>
          <div class="meta-item"><span>Erros</span><strong>${erros}</strong></div>
          <div class="meta-item"><span>Em branco</span><strong>${branco}</strong></div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
          <button type="button" class="btn btn-primary" onclick="window.AprovaApp.switchView('estudo')">
            Ver evolução em Meu Estudo →
          </button>
          <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.renderIAAssistant()">
            Montar nova bateria
          </button>
        </div>
      </div>
    `;
  }

  function drawPlayer() {
    const mount = document.getElementById('question-player-mount');
    if (!mount || !player.sessao || !player.questoes.length) return;
    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const q = player.questoes[player.currentIndex];
    const ans = player.answers[q.id];
    const elim = player.eliminated[q.id] || new Set();
    const isCE = q.tipo_questao === 'certo_errado' || (q.alternativas || []).length === 2;
    const difLabels = { facil: 'Fácil', intermediario: 'Intermediário', dificil: 'Difícil' };
    const m = String(Math.floor(player.secondsElapsed / 60)).padStart(2, '0');
    const s = String(player.secondsElapsed % 60).padStart(2, '0');

    const dotsHtml = player.questoes.map((item, idx) => {
      const stA = player.answers[item.id];
      let cls = idx === player.currentIndex ? 'current' : '';
      if (stA) cls += stA.correta ? ' hit' : (stA.em_branco ? ' blank' : ' miss');
      return `<button type="button" class="q-dot-btn ${cls}" onclick="window.AprovaComponents.goToQuestionIndex(${idx})" aria-label="Questão ${idx + 1}">${idx + 1}</button>`;
    }).join('');

    const optsHtml = (q.alternativas || []).map(opt => {
      const isSelected = ans && !ans.em_branco && ans.resposta_usuario === opt.letra;
      const isCorrect = ans && ans.gabarito === opt.letra;
      const isWrong = isSelected && !ans.correta;
      const isElim = !ans && elim.has(opt.letra);
      const cls = isCorrect ? 'correct' : (isWrong ? 'wrong' : (isSelected ? 'selected' : (isElim ? 'eliminated' : '')));

      return `
        <div class="option-row">
          <button
            type="button"
            class="option-btn ${cls}"
            ${ans ? 'disabled' : ''}
            onclick="window.AprovaComponents.submeterRespostaQuestao(${q.id}, '${utils.escapeHtml(opt.letra)}', false)"
          >
            <span class="option-letter-badge">${safe(opt.letra)}</span>
            <span class="option-text">${safe(opt.texto)}</span>
          </button>
          ${!isCE && !ans ? `
            <button type="button" class="strike-btn ${isElim ? 'active' : ''}" title="Riscar alternativa" onclick="window.AprovaComponents.toggleStrikeOption(${q.id}, '${utils.escapeHtml(opt.letra)}')">
              ✕
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="surface-card">
        <div class="card-head-row" style="margin-bottom:12px;">
          <div>
            <span class="badge badge-cobalt">${safe(q.banca)} · ${q.ano}</span>
            <span class="badge badge-neutral">${safe(q.disciplina)}</span>
            <span class="badge badge-previsto">${safe(difLabels[q.dificuldade] || 'Intermediário')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge badge-neutral">⏱ <span id="qp-timer-display">${m}:${s}</span></span>
            <span class="text-caption-muted"><strong>${player.currentIndex + 1}</strong> / ${player.questoes.length}</span>
          </div>
        </div>

        <div class="questao-nav-strip">${dotsHtml}</div>

        ${q.prova_titulo ? `<div class="text-caption-muted" style="font-weight:700;">Fonte: ${safe(q.prova_titulo)} · ${safe(q.assunto)}</div>` : ''}

        <p class="question-enunciado">${safe(q.enunciado)}</p>

        <div class="options-stack">${optsHtml}</div>

        ${isCE && !ans ? `
          <div style="margin-bottom:16px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.submeterRespostaQuestao(${q.id}, '', true)">
              Deixar em branco (evita anulação no estilo Cebraspe)
            </button>
          </div>
        ` : ''}

        ${ans ? `
          <div class="answer-feedback-box ${ans.em_branco ? 'blank' : (ans.correta ? 'ok' : 'err')}" role="status">
            <strong>
              ${ans.em_branco ? 'Questão deixada em branco.' : (ans.correta ? '✓ Resposta correta!' : `✕ Resposta incorreta · Gabarito oficial: ${safe(ans.gabarito)}`)}
            </strong>
            <p style="margin-top:6px;">${safe(ans.comentario)}</p>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:14px; border-top:1px solid var(--border-subtle);">
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-outline btn-sm" ${player.currentIndex === 0 ? 'disabled' : ''} onclick="window.AprovaComponents.goToQuestionIndex(${player.currentIndex - 1})">
              ← Anterior
            </button>
            <button type="button" class="btn btn-outline btn-sm" ${player.currentIndex >= player.questoes.length - 1 ? 'disabled' : ''} onclick="window.AprovaComponents.goToQuestionIndex(${player.currentIndex + 1})">
              Próxima →
            </button>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.finalizarBateriaAtual()">
            Finalizar e Atualizar Painel →
          </button>
        </div>
      </div>
    `;
  }
})();
