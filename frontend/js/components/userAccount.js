/**
 * Tela 8 & Single-Source-of-Truth Profile Widget:
 * - Widget único `.header-profile-pill` (Avatar circular + Nome 1 linha + Badge do plano)
 * - Painel `Minha Conta & Central do Theo` (Dados Pessoais, Preferências Iniciais c/ Refazer/Apagar, Assinatura & Salvos)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderHeaderUserWidget = function () {
  const box = document.getElementById('header-user-area');
  if (!box) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  const isContaActive = window.AprovaApp?.state?.currentView === 'conta';
  const utils = window.AprovaUtils;

  if (!user) {
    box.innerHTML = `
      <div class="header-user-actions">
        <button type="button" class="header-guest-btn header-guest-outline" onclick="window.AprovaComponents.openAuthModal('login', this)">
          Entrar
        </button>
        <button type="button" class="header-guest-btn header-guest-primary" onclick="window.AprovaComponents.openAuthModal('register', this)">
          Criar Conta
        </button>
      </div>
    `;
    return;
  }

  const safe = (v) => utils.safeText(v);
  const tierMeta = utils.getPlanBadgeMeta(user.plano);

  box.innerHTML = `
    <div class="header-user-actions">
      <button
        type="button"
        class="header-profile-pill ${isContaActive ? 'active' : ''}"
        aria-current="${isContaActive ? 'page' : 'false'}"
        onclick="window.AprovaApp.switchView('conta')"
        title="Abrir Minha Conta e Preferências"
      >
        <span class="header-avatar-circle">${safe(user.iniciais || 'CL')}</span>
        <span class="header-profile-name">${safe(user.nome)}</span>
        <span class="header-plan-badge ${tierMeta.cls}">${safe(tierMeta.label)}</span>
      </button>
    </div>
  `;
};

window.AprovaComponents.togglePasswordVisibility = function (inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input || !btnEl) return;
  const utils = window.AprovaUtils;
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btnEl.setAttribute('aria-pressed', showing ? 'false' : 'true');
  btnEl.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  btnEl.title = showing ? 'Mostrar senha' : 'Ocultar senha';
  btnEl.innerHTML = showing ? utils.icon('eye') : utils.icon('eyeOff');
};

window.AprovaComponents.openAuthModal = function (modo = 'login', triggerEl) {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('auth-modal-body');
  if (!modal || !body) return;

  const utils = window.AprovaUtils;
  utils.openAccessibleModal('auth-modal', triggerEl || document.activeElement);

  const isLogin = modo === 'login';
  body.innerHTML = `
    <div class="modal-header-block">
      <h2 id="auth-modal-title" class="modal-title">
        ${isLogin ? 'Entrar na sua Conta Aprova+ IA' : 'Criar Conta Gratuita no Aprova+ IA'}
      </h2>
      <p class="modal-subtitle">
        Salve seu progresso em questões, cronograma semanal, guias e preferências de preparação.
      </p>
    </div>

    <div class="form-grid-2 auth-mode-switcher">
      <button type="button" class="btn ${isLogin ? 'btn-primary' : 'btn-outline'}" aria-pressed="${isLogin}" onclick="window.AprovaComponents.openAuthModal('login')">
        Já possuo conta
      </button>
      <button type="button" class="btn ${!isLogin ? 'btn-primary' : 'btn-outline'}" aria-pressed="${!isLogin}" onclick="window.AprovaComponents.openAuthModal('register')">
        Criar nova conta
      </button>
    </div>

    <div id="auth-error-box" class="auth-error-banner" role="alert"></div>

    ${isLogin ? `
      <form id="auth-login-form" onsubmit="window.AprovaComponents.submeterLogin(event)" class="form-stack">
        <div class="field-group">
          <label for="login-email">E-mail Cadastrado</label>
          <input type="email" id="login-email" class="field-input" placeholder="Ex: seu@email.com" autocomplete="email" required />
        </div>
        <div class="field-group">
          <label for="login-senha">Senha de Acesso</label>
          <div class="password-field-wrap">
            <input type="password" id="login-senha" class="field-input" placeholder="Digite sua senha" autocomplete="current-password" required />
            <button type="button" class="password-toggle-btn" aria-label="Mostrar senha" aria-pressed="false" onclick="window.AprovaComponents.togglePasswordVisibility('login-senha', this)">
              ${utils.icon('eye')}
            </button>
          </div>
        </div>
        <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block">
          Entrar na Plataforma
        </button>
      </form>

      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span class="text-caption-muted">Acesso rápido de demonstração:</span>
        <button type="button" class="btn btn-accent btn-sm" onclick="window.AprovaComponents.entrarContaDemo(this)">
          Entrar como Carlos Lucas (PRO)
        </button>
      </div>
    ` : `
      <form id="auth-register-form" onsubmit="window.AprovaComponents.submeterCadastro(event)" class="form-grid-2">
        <div class="field-group form-span-2">
          <label for="reg-nome">Nome Completo</label>
          <input type="text" id="reg-nome" class="field-input" placeholder="Ex: Ana Beatriz Silva" autocomplete="name" minlength="2" required />
        </div>
        <div class="field-group">
          <label for="reg-email">E-mail Principal</label>
          <input type="email" id="reg-email" class="field-input" placeholder="seu@email.com" autocomplete="email" minlength="5" required />
        </div>
        <div class="field-group">
          <label for="reg-senha">Senha</label>
          <div class="password-field-wrap">
            <input type="password" id="reg-senha" class="field-input" placeholder="Mínimo 4 caracteres" autocomplete="new-password" minlength="4" required />
            <button type="button" class="password-toggle-btn" aria-label="Mostrar senha" aria-pressed="false" onclick="window.AprovaComponents.togglePasswordVisibility('reg-senha', this)">
              ${utils.icon('eye')}
            </button>
          </div>
        </div>
        <div class="field-group">
          <label for="reg-carreira">Área de Foco</label>
          <select id="reg-carreira" class="field-input">
            <option value="Policial">Policial (PF, PRF)</option>
            <option value="Bancária">Bancária (Caixa, BB)</option>
            <option value="Tribunais">Tribunais (TSE, TJ-SP)</option>
            <option value="Administrativa">Administrativa (INSS, CNU)</option>
            <option value="Fiscal">Fiscal e Controle (Receita, CGU)</option>
            <option value="Ambiental">Ambiental (IBAMA)</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-escolaridade">Escolaridade</label>
          <select id="reg-escolaridade" class="field-input">
            <option value="Superior">Ensino Superior</option>
            <option value="Médio">Ensino Médio</option>
          </select>
        </div>
        <div class="field-group form-span-2">
          <label for="reg-uf-trigger">UFs de Interesse (múltipla escolha)</label>
          ${utils.renderUfMultiSelect('reg-uf', ['Nacional'])}
        </div>
        <div class="field-group form-span-2">
          <label for="reg-horas">Meta Diária de Estudo</label>
          ${utils.renderDailyGoalControl('reg-horas', 4)}
        </div>
        <button type="submit" id="register-submit-btn" class="btn btn-primary form-span-2">
          Criar Conta e Calibrar Estudo
        </button>
      </form>
    `}
  `;

  const firstInput = body.querySelector('input');
  if (firstInput) firstInput.focus();
};

window.AprovaComponents.closeAuthModal = function () {
  window.AprovaUtils.closeAccessibleModal('auth-modal');
};

window.AprovaComponents.submeterLogin = async function (event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const errBox = document.getElementById('auth-error-box');
  const submitBtn = document.getElementById('login-submit-btn');

  window.AprovaUtils.setButtonLoading(submitBtn, true, 'Entrando...');
  try {
    const resp = await window.AprovaAPI.loginUsuario(email, senha);
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.switchView(resp.usuario?.onboarding_concluido ? 'estudo' : 'onboarding');
  } catch (err) {
    window.AprovaUtils.setButtonLoading(submitBtn, false);
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Erro ao realizar login.';
    }
  }
};

window.AprovaComponents.entrarContaDemo = async function (triggerBtn) {
  window.AprovaUtils.setButtonLoading(triggerBtn, true, 'Entrando...');
  try {
    const resp = await window.AprovaAPI.loginUsuario('carlos@aprovamais.com.br', '123456');
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.switchView('estudo');
  } catch (err) {
    window.AprovaUtils.setButtonLoading(triggerBtn, false);
    window.AprovaUtils.showToast(err.message || 'Não foi possível entrar na conta demo.', { variant: 'error' });
  }
};

window.AprovaComponents.submeterCadastro = async function (event) {
  event.preventDefault();
  const errBox = document.getElementById('auth-error-box');
  if (errBox) {
    errBox.classList.remove('visible');
    errBox.textContent = '';
  }
  const horasVal = parseFloat(String(document.getElementById('reg-horas').value).replace(',', '.'));
  if (Number.isNaN(horasVal) || horasVal < 0.5 || horasVal > 16) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = 'Informe uma meta diária válida entre 0,5h (30 min) e 16h por dia.';
    }
    return;
  }
  const submitBtn = document.getElementById('register-submit-btn');
  const ufsSel = window.AprovaUtils.getUfMultiSelectValues('reg-uf');
  const payload = {
    nome: document.getElementById('reg-nome').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    senha: document.getElementById('reg-senha').value,
    carreira_foco: document.getElementById('reg-carreira').value,
    escolaridade: document.getElementById('reg-escolaridade').value,
    uf_interesse: ufsSel,
    horas_estudo_dia: horasVal
  };

  window.AprovaUtils.setButtonLoading(submitBtn, true, 'Criando conta...');
  try {
    const resp = await window.AprovaAPI.registrarUsuario(payload);
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.switchView('onboarding');
  } catch (err) {
    window.AprovaUtils.setButtonLoading(submitBtn, false);
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Erro ao criar conta.';
    }
  }
};

window.AprovaComponents.fazerLogout = function () {
  window.AprovaAPI.logoutUsuario();
  window.AprovaComponents.renderHeaderUserWidget();
  window.AprovaUtils.showToast('Sessão encerrada com segurança.');
  window.AprovaApp.switchView('conta');
};

window.AprovaComponents.apagarRespostasOnboarding = async function () {
  try {
    const resp = await window.AprovaAPI.apagarOnboarding();
    window.AprovaUtils.showToast(resp?.mensagem || 'Preferências iniciais apagadas.');
    window.AprovaComponents.renderUserDashboard();
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Não foi possível apagar suas respostas.', { variant: 'error' });
  }
};

window.AprovaComponents.renderUserDashboard = async function () {
  const container = document.getElementById('user-dashboard-container');
  if (!container) return;

  const utils = window.AprovaUtils;
  const user = window.AprovaAPI.obterUsuarioAtual();

  if (!user) {
    container.innerHTML = `
      <div class="section-banner">
        <div>
          <h1>Minha Conta &amp; Central do Theo</h1>
          <p>Entre para salvar seus simulados, guias concluídos e preferências em qualquer dispositivo.</p>
        </div>
      </div>

      <div class="empty-state-sheet" style="max-width:660px; margin:0 auto;">
        <h3>Acesse sua conta Aprova+ IA</h3>
        <p>Entre com seu e-mail, crie uma conta gratuita ou utilize o perfil de demonstração (Carlos Lucas · PRO) com histórico completo.</p>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openAuthModal('login', this)">
            Entrar na Conta
          </button>
          <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.openAuthModal('register', this)">
            Criar Conta Gratuita
          </button>
          <button type="button" class="btn btn-accent" onclick="window.AprovaComponents.entrarContaDemo(this)">
            Entrar como Carlos Lucas (Demo PRO)
          </button>
        </div>
      </div>
    `;
    return;
  }

  let concursosResp = { concursos: [] };
  let obResp = { concluido: false, dados: {} };
  try {
    [concursosResp, obResp] = await Promise.all([
      window.AprovaAPI.listarConcursos(),
      window.AprovaAPI.obterOnboarding()
    ]);
  } catch (e) {}

  const safe = (v) => utils.safeText(v);
  const esc = (v) => utils.escapeHtml(v);
  const salvos = (concursosResp.concursos || []).filter(c => c.salvo);
  const tierMeta = utils.getPlanBadgeMeta(user.plano);
  const userUfs = utils.parseUfsList(user.ufs_interesse || user.uf_interesse || ['Nacional']);
  const userHoras = Number(user.horas_estudo_dia || 4);
  const obDados = obResp.dados || {};
  const momentMap = {
    comecando_agora: 'Começando do zero',
    estudando_edital: 'Já estudando com foco',
    reta_final: 'Reta final de prova'
  };

  container.innerHTML = `
    <div class="section-banner">
      <div>
        <h1>Minha Conta &amp; Central do Theo</h1>
        <p>Gerencie seus dados pessoais, preferências da pesquisa inicial, assinatura ativa e concursos salvos.</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <span class="header-plan-badge ${tierMeta.cls}">${safe(tierMeta.label)}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.fazerLogout()">
          Sair da conta
        </button>
      </div>
    </div>

    <div class="split-workspace-conta">
      <div class="surface-card">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
          <div class="header-avatar-circle" style="width:48px; height:48px; font-size:1.125rem;">${safe(user.iniciais || 'CL')}</div>
          <div>
            <strong style="font-size:1.125rem; display:block;">${safe(user.nome)}</strong>
            <span class="text-caption-muted">${safe(user.email)}</span>
          </div>
        </div>

        <h2 class="sheet-title-sm">Dados Pessoais e Rotina</h2>
        <div id="profile-error-box" class="auth-error-banner" role="alert"></div>

        <form id="profile-settings-form" onsubmit="window.AprovaComponents.salvarPerfilUsuario(event)" class="form-stack">
          <div class="field-group">
            <label for="prof-nome">Nome Completo</label>
            <input type="text" id="prof-nome" class="field-input" value="${esc(user.nome)}" minlength="2" required />
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label for="prof-carreira">Área de Foco</label>
              <select id="prof-carreira" class="field-input">
                ${['Policial', 'Bancária', 'Tribunais', 'Administrativa', 'Fiscal', 'Ambiental'].map(a => `
                  <option value="${a}" ${user.carreira_foco === a ? 'selected' : ''}>${a}</option>
                `).join('')}
              </select>
            </div>
            <div class="field-group">
              <label for="prof-escolaridade">Escolaridade</label>
              <select id="prof-escolaridade" class="field-input">
                <option value="Superior" ${user.escolaridade === 'Superior' ? 'selected' : ''}>Ensino Superior</option>
                <option value="Médio" ${user.escolaridade === 'Médio' ? 'selected' : ''}>Ensino Médio</option>
              </select>
            </div>
          </div>
          <div class="field-group">
            <label for="prof-uf-trigger">UFs de Interesse (múltipla escolha)</label>
            ${utils.renderUfMultiSelect('prof-uf', userUfs)}
          </div>
          <div class="field-group">
            <label for="prof-horas">Meta Diária de Estudo</label>
            ${utils.renderDailyGoalControl('prof-horas', userHoras)}
          </div>
          <button type="submit" id="profile-submit-btn" class="btn btn-primary">
            Salvar Alterações
          </button>
        </form>
      </div>

      <div class="stack-col-lg">
        <div class="surface-card">
          <h2 class="sheet-title-sm">Preferências Iniciais de Estudo</h2>
          <p class="sheet-desc">
            ${obResp.concluido
              ? `Calibrado para <strong>${safe(user.concurso_alvo_id || 'pf-2026')}</strong> · ${safe(momentMap[obDados.momento_jornada] || 'Preparação contínua')} · ${(obDados.dias_semana || []).join(', ') || 'Seg–Sáb'}.`
              : 'Você ainda não possui respostas ativas na pesquisa inicial de personalização.'}
          </p>
          <div class="pill-toggle-row" style="margin-bottom:12px;">
            <span class="badge badge-cobalt">Meta diária: ${safe(utils.formatHorasDiarias(userHoras))}</span>
            <span class="badge badge-neutral">UFs: ${safe(userUfs.join(', '))}</span>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="btn btn-soft btn-sm" onclick="window.AprovaApp.switchView('onboarding')">
              ↻ Refazer pesquisa inicial
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.apagarRespostasOnboarding()">
              ${utils.icon('trash')} Apagar minhas respostas de perfil
            </button>
          </div>
        </div>

        <div class="surface-card">
          <div class="card-head-row" style="margin-bottom:10px;">
            <div>
              <h2 class="sheet-title-sm">Assinatura &amp; Concursos Salvos (${salvos.length})</h2>
              <span class="text-caption-muted">Plano atual: <strong>${safe(tierMeta.label)}</strong></span>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('premium')">
              Gerenciar Plano
            </button>
          </div>

          ${salvos.length ? salvos.map(c => `
            <div class="mat-item">
              <div>
                <div class="mat-item-title">${utils.formatConcursoHeading(c.sigla, c.titulo)}</div>
                <div class="mat-item-meta">${safe(c.banca)} · ${safe(c.salario)}</div>
              </div>
              <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.escolherConcursoAlvo('${esc(c.id)}')">
                Definir como Alvo
              </button>
            </div>
          `).join('') : `<p class="text-caption-muted">Nenhum concurso favoritado no momento.</p>`}
        </div>
      </div>
    </div>
  `;
};

window.AprovaComponents.salvarPerfilUsuario = async function (event) {
  event.preventDefault();
  const errBox = document.getElementById('profile-error-box');
  if (errBox) {
    errBox.classList.remove('visible');
    errBox.textContent = '';
  }
  const horasVal = parseFloat(String(document.getElementById('prof-horas').value).replace(',', '.'));
  if (Number.isNaN(horasVal) || horasVal < 0.5 || horasVal > 16) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = 'Informe uma meta diária válida entre 0,5h (30 min) e 16h por dia.';
    }
    return;
  }
  const submitBtn = document.getElementById('profile-submit-btn');
  const ufsSel = window.AprovaUtils.getUfMultiSelectValues('prof-uf');
  const payload = {
    nome: document.getElementById('prof-nome').value.trim(),
    carreira_foco: document.getElementById('prof-carreira').value,
    escolaridade: document.getElementById('prof-escolaridade').value,
    uf_interesse: ufsSel,
    horas_estudo_dia: horasVal
  };

  window.AprovaUtils.setButtonLoading(submitBtn, true, 'Salvando...');
  try {
    const resp = await window.AprovaAPI.atualizarPerfilUsuario(payload);
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaComponents.renderUserDashboard();
  } catch (err) {
    window.AprovaUtils.setButtonLoading(submitBtn, false);
    window.AprovaUtils.showToast(err.message || 'Erro ao atualizar perfil.', { variant: 'error' });
  }
};
