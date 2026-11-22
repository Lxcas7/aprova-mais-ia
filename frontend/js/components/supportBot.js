/**
 * Componente: Central de Ajuda do Theo (Ancorada à direita do rodapé, abre acima sem sobreposição)
 */
window.AprovaComponents = window.AprovaComponents || {};

(function () {
  const botState = {
    open: false,
    humanFormOpen: false,
    messages: []
  };

  window.AprovaComponents.initSupportBot = function () {
    const trigger = document.getElementById('theo-footer-trigger');
    const root = document.getElementById('theo-support-root');
    if (!trigger || !root) return;

    trigger.addEventListener('click', () => {
      botState.open = !botState.open;
      trigger.setAttribute('aria-expanded', botState.open ? 'true' : 'false');
      if (botState.open && botState.messages.length === 0) {
        const user = window.AprovaAPI.obterUsuarioAtual();
        const greeting = user
          ? `Oi, <strong>${window.AprovaUtils.safeText(user.nome.split(' ')[0])}</strong>! Identifiquei sua conta no plano <strong>${window.AprovaUtils.safeText(user.plano || 'Gratuito')}</strong>. Como posso te ajudar agora?`
          : 'Oi! Sou o <strong>Theo</strong> da equipe Aprova+ IA. Como posso ajudar você nos estudos ou sobre os planos?';
        botState.messages = [{ role: 'theo', html: greeting }];
      }
      renderSupportPanel();
    });

    renderSupportPanel();
  };

  window.AprovaComponents.closeSupportBot = function () {
    botState.open = false;
    const trigger = document.getElementById('theo-footer-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    renderSupportPanel();
  };

  window.AprovaComponents.toggleHumanSupportForm = function (openFlag) {
    botState.humanFormOpen = Boolean(openFlag);
    renderSupportPanel();
  };

  window.AprovaComponents.askTheoQuick = async function (text) {
    const input = document.getElementById('theo-msg-input');
    if (input) input.value = text;
    await submitTheoMessage(text);
  };

  window.AprovaComponents.submeterPerguntaTheo = async function (event) {
    event.preventDefault();
    const input = document.getElementById('theo-msg-input');
    const txt = (input?.value || '').trim();
    if (!txt) return;
    if (input) input.value = '';
    await submitTheoMessage(txt);
  };

  async function submitTheoMessage(txt) {
    botState.messages.push({ role: 'user', text: txt });
    renderSupportPanel();
    try {
      const resp = await window.AprovaAPI.perguntarTheoSuporte(txt);
      botState.messages.push({ role: 'theo', html: resp.resposta_html });
    } catch (e) {
      botState.messages.push({ role: 'theo', html: 'Não consegui responder agora. Você pode falar diretamente com um atendente humano abaixo.' });
    }
    renderSupportPanel();
  }

  window.AprovaComponents.submeterChamadoHumano = async function (event) {
    event.preventDefault();
    const user = window.AprovaAPI.obterUsuarioAtual();
    const nome = user?.nome || document.getElementById('theo-human-nome')?.value.trim() || 'Aluno';
    const email = user?.email || document.getElementById('theo-human-email')?.value.trim() || '';
    const msg = document.getElementById('theo-human-msg')?.value.trim() || '';
    const btn = document.getElementById('theo-human-submit');
    window.AprovaUtils.setButtonLoading(btn, true, 'Enviando...');
    try {
      const resp = await window.AprovaAPI.abrirChamadoSuporte({
        nome,
        email,
        categoria: 'Atendimento Humano · Central do Theo',
        mensagem: msg
      });
      botState.humanFormOpen = false;
      botState.messages.push({
        role: 'theo',
        html: `<strong>Chamado ${window.AprovaUtils.safeText(resp.protocolo)} aberto!</strong> ${window.AprovaUtils.safeText(resp.mensagem)}`
      });
      window.AprovaUtils.showToast(`Chamado ${resp.protocolo} enviado para atendimento humano.`);
    } catch (err) {
      window.AprovaUtils.setButtonLoading(btn, false);
      window.AprovaUtils.showToast(err.message || 'Erro ao enviar chamado.', { variant: 'error' });
      return;
    }
    renderSupportPanel();
  };

  function renderSupportPanel() {
    const root = document.getElementById('theo-support-root');
    if (!root) return;
    if (!botState.open) {
      root.innerHTML = `<div id="theo-support-panel" class="theo-support-panel" hidden></div>`;
      return;
    }

    const utils = window.AprovaUtils;
    const safe = (v) => utils.safeText(v);
    const user = window.AprovaAPI.obterUsuarioAtual();

    root.innerHTML = `
      <section id="theo-support-panel" class="theo-support-panel" role="dialog" aria-label="Central de Ajuda do Theo">
        <div class="theo-panel-header">
          <div>
            <strong style="font-size:0.9375rem; display:block;">Theo · Central de Ajuda A+</strong>
            <span style="font-size:0.75rem; color:#cbd5e1;">
              ${user ? `${safe(user.nome)} · Plano ${safe(user.plano || 'Gratuito')}` : 'Atendimento imediato e humano'}
            </span>
          </div>
          <button type="button" class="btn btn-hero-ghost btn-sm" style="padding:0 10px;" onclick="window.AprovaComponents.closeSupportBot()" aria-label="Fechar Theo">
            ${utils.icon('x')}
          </button>
        </div>

        <div class="theo-panel-body" id="theo-panel-scroll">
          ${botState.messages.map(m => m.role === 'user'
            ? `<div class="theo-msg user">${safe(m.text)}</div>`
            : `<div class="theo-msg">${utils.sanitizeRichHtml(m.html)}</div>`
          ).join('')}

          ${botState.humanFormOpen ? `
            <form onsubmit="window.AprovaComponents.submeterChamadoHumano(event)" class="form-stack" style="background:var(--bg); padding:12px; border-radius:12px; border:1px solid var(--border-subtle);">
              <strong style="font-size:0.8125rem;">Atendimento Humano (${user ? 'Conta reconhecida' : 'Identificação rápida'})</strong>
              ${!user ? `
                <input type="text" id="theo-human-nome" class="field-input" placeholder="Seu nome" required />
                <input type="email" id="theo-human-email" class="field-input" placeholder="Seu e-mail para resposta" required />
              ` : `<div class="text-caption-muted">Vinculado automaticamente a ${safe(user.nome)} (${safe(user.email)})</div>`}
              <textarea id="theo-human-msg" class="field-input" placeholder="Conte como nossa equipe pode ajudar..." minlength="5" required></textarea>
              <div style="display:flex; gap:8px;">
                <button type="submit" id="theo-human-submit" class="btn btn-primary btn-sm">Enviar para Atendente</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.toggleHumanSupportForm(false)">Cancelar</button>
              </div>
            </form>
          ` : ''}
        </div>

        <div class="theo-panel-footer">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="choice-pill" style="padding:4px 10px; font-size:0.75rem;" onclick="window.AprovaComponents.askTheoQuick('Como funciona o PDF A4?')">PDF A4</button>
            <button type="button" class="choice-pill" style="padding:4px 10px; font-size:0.75rem;" onclick="window.AprovaComponents.askTheoQuick('Limites dos planos')">Planos</button>
            <button type="button" class="choice-pill" style="padding:4px 10px; font-size:0.75rem;" onclick="window.AprovaComponents.askTheoQuick('Como funciona o nivelamento?')">Nivelamento</button>
          </div>
          <form onsubmit="window.AprovaComponents.submeterPerguntaTheo(event)" style="display:flex; gap:6px;">
            <input type="text" id="theo-msg-input" class="field-input" style="height:36px;" placeholder="Pergunte ao Theo..." />
            <button type="submit" class="btn btn-primary btn-sm">${utils.icon('send')}</button>
          </form>
          <button type="button" class="btn btn-soft btn-sm btn-block" onclick="window.AprovaComponents.toggleHumanSupportForm(true)">
            Falar com um Atendente Humano →
          </button>
        </div>
      </section>
    `;

    const scroll = document.getElementById('theo-panel-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }
})();
