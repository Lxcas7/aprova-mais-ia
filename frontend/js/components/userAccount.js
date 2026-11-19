/**
 * Componente: Sistema de Autenticação (Login / Cadastro) e Painel do Concurseiro (Minha Conta)
 * Utiliza Ledger de Telemetria Plano (`.account-ledger-bar`) em vez de cards genéricos repetitivos.
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderHeaderUserWidget = function () {
  const box = document.getElementById('header-user-area');
  if (!box) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  if (!user) {
    box.innerHTML = `
      <div class="header-user-actions">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openAuthModal('login', this)">
          ${window.AprovaUtils.icon('user')}
          <span>Entrar</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openAuthModal('register', this)">
          <span>Criar Conta</span>
        </button>
      </div>
    `;
    return;
  }

  const safe = (v) => window.AprovaUtils.safeText(v);
  box.innerHTML = `
    <div class="header-user-actions">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        onclick="window.AprovaApp.switchView('conta')"
        title="Abrir Meu Painel de Estudos e Conta"
      >
        <span class="user-avatar-chip">${safe(user.iniciais || 'CL')}</span>
        <span>${safe(user.nome)}</span>
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        onclick="window.AprovaComponents.fazerLogout()"
        title="Encerrar sessão"
      >
        Sair
      </button>
    </div>
  `;
};

window.AprovaComponents.openAuthModal = function (modo = 'login', triggerEl) {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('auth-modal-body');
  if (!modal || !body) return;

  window.AprovaUtils.openAccessibleModal('auth-modal', triggerEl || document.activeElement);

  const isLogin = modo === 'login';
  body.innerHTML = `
    <div class="modal-header-block">
      <h2 id="auth-modal-title" class="modal-title">
        ${isLogin ? 'Entrar na sua Conta Aprova+ IA' : 'Criar Conta Gratuita no Aprova+ IA'}
      </h2>
      <p class="modal-subtitle">
        Sincronize seus concursos salvos, o histórico de apostilas estudadas e os parâmetros do Copiloto IA.
      </p>
    </div>

    <div class="form-grid-2 auth-mode-switcher">
      <button
        type="button"
        class="btn ${isLogin ? 'btn-primary' : 'btn-outline'}"
        aria-pressed="${isLogin ? 'true' : 'false'}"
        onclick="window.AprovaComponents.openAuthModal('login')"
      >
        Já possuo conta
      </button>
      <button
        type="button"
        class="btn ${!isLogin ? 'btn-primary' : 'btn-outline'}"
        aria-pressed="${!isLogin ? 'true' : 'false'}"
        onclick="window.AprovaComponents.openAuthModal('register')"
      >
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
          <input type="password" id="login-senha" class="field-input" placeholder="Digite sua senha" autocomplete="current-password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">
          Entrar na Plataforma
        </button>
      </form>

      <div class="auth-demo-bar">
        <span class="text-caption-muted">Acesso rápido de avaliação:</span>
        <button type="button" class="btn btn-accent btn-sm" onclick="window.AprovaComponents.entrarContaDemo()">
          Entrar com Conta Demo (Carlos Lucas)
        </button>
      </div>
    ` : `
      <form id="auth-register-form" onsubmit="window.AprovaComponents.submeterCadastro(event)" class="form-grid-2">
        <div class="field-group form-span-2">
          <label for="reg-nome">Nome Completo</label>
          <input type="text" id="reg-nome" class="field-input" placeholder="Ex: Ana Beatriz Silva" minlength="2" required />
        </div>
        <div class="field-group">
          <label for="reg-email">E-mail Principal</label>
          <input type="email" id="reg-email" class="field-input" placeholder="seu@email.com" minlength="5" required />
        </div>
        <div class="field-group">
          <label for="reg-senha">Senha</label>
          <input type="password" id="reg-senha" class="field-input" placeholder="Mínimo 4 caracteres" minlength="4" required />
        </div>
        <div class="field-group">
          <label for="reg-carreira">Carreira Principal de Foco</label>
          <select id="reg-carreira" class="field-input">
            <option value="Policial">Policial (PF, PRF, PC)</option>
            <option value="Bancária">Bancária (Caixa, BB, BACEN)</option>
            <option value="Tribunais">Tribunais (TSE, TJ-SP)</option>
            <option value="Administrativa">Administrativa / INSS / CNU</option>
            <option value="Fiscal">Fiscal e Controle (Receita, CGU)</option>
            <option value="Ambiental">Ambiental (IBAMA)</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-escolaridade">Escolaridade Atual</label>
          <select id="reg-escolaridade" class="field-input">
            <option value="Superior">Ensino Superior Completo</option>
            <option value="Médio">Ensino Médio Completo</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-uf">UF de Interesse</label>
          <select id="reg-uf" class="field-input">
            <option value="Nacional">Nacional (Qualquer Estado)</option>
            <option value="DF">Distrito Federal (DF)</option>
            <option value="SP">São Paulo (SP)</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-horas">Meta de Horas / Dia</label>
          <select id="reg-horas" class="field-input">
            <option value="2">2 horas/dia</option>
            <option value="3">3 horas/dia</option>
            <option value="4" selected>4 horas/dia</option>
            <option value="6">6 horas/dia</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary form-span-2">
          Criar Conta e Abrir Caderno de Estudos
        </button>
      </form>
    `}
  `;

  body.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      const errBox = document.getElementById('auth-error-box');
      if (errBox) {
        errBox.classList.remove('visible');
        errBox.textContent = '';
      }
    });
  });

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

  try {
    const resp = await window.AprovaAPI.loginUsuario(email, senha);
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.carregarConcursos();
    window.AprovaApp.atualizarIndicadoresUsuario();
    if (window.AprovaApp.state.currentView === 'conta') {
      window.AprovaComponents.renderUserDashboard();
    } else if (window.AprovaApp.state.currentView === 'materiais') {
      window.AprovaComponents.renderMateriaisHub();
    }
  } catch (err) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Erro ao realizar login.';
    }
  }
};

window.AprovaComponents.entrarContaDemo = async function () {
  const errBox = document.getElementById('auth-error-box');
  try {
    const resp = await window.AprovaAPI.loginUsuario('carlos@aprovamais.com.br', '123456');
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.carregarConcursos();
    window.AprovaApp.atualizarIndicadoresUsuario();
    if (window.AprovaApp.state.currentView === 'conta') {
      window.AprovaComponents.renderUserDashboard();
    } else if (window.AprovaApp.state.currentView === 'materiais') {
      window.AprovaComponents.renderMateriaisHub();
    }
  } catch (err) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Não foi possível entrar na conta demo.';
    } else {
      window.AprovaUtils.showToast(err.message || 'Não foi possível entrar na conta demo.', { variant: 'error' });
    }
  }
};

window.AprovaComponents.submeterCadastro = async function (event) {
  event.preventDefault();
  const errBox = document.getElementById('auth-error-box');
  const payload = {
    nome: document.getElementById('reg-nome').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    senha: document.getElementById('reg-senha').value,
    carreira_foco: document.getElementById('reg-carreira').value,
    escolaridade: document.getElementById('reg-escolaridade').value,
    uf_interesse: document.getElementById('reg-uf').value,
    horas_estudo_dia: parseInt(document.getElementById('reg-horas').value, 10)
  };

  try {
    const resp = await window.AprovaAPI.registrarUsuario(payload);
    window.AprovaComponents.closeAuthModal();
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaApp.switchView('conta');
  } catch (err) {
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
  window.AprovaApp.carregarConcursos();
  window.AprovaApp.atualizarIndicadoresUsuario();
  if (window.AprovaApp.state.currentView === 'conta') {
    window.AprovaComponents.renderUserDashboard();
  } else if (window.AprovaApp.state.currentView === 'materiais') {
    window.AprovaComponents.renderMateriaisHub();
  }
};

window.AprovaComponents.renderUserDashboard = async function () {
  const container = document.getElementById('user-dashboard-container');
  if (!container) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  if (!user) {
    const draft = window.AprovaAPI.obterRascunhoVisitante();
    const hasDraft = (draft.salvos?.length || 0) > 0 || (draft.estudados?.length || 0) > 0;
    const draftInfo = hasDraft
      ? `<p class="text-caption-muted" style="margin-bottom: 14px;">Você tem <strong>${draft.salvos.length}</strong> concurso(s) salvo(s) e <strong>${draft.estudados.length}</strong> material(is) concluído(s) neste dispositivo. Ao entrar ou criar uma conta, eles serão sincronizados automaticamente.</p>`
      : '';
    container.innerHTML = `
      <div class="empty-state-sheet empty-state-narrow">
        <h3>Identifique-se para Acessar seu Caderno de Estudos</h3>
        <p>Com uma conta gratuita você salva editais prioritários, registra os materiais concluídos e mantém suas metas calibradas no Copiloto IA.</p>
        ${draftInfo}
        <div class="empty-state-actions">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openAuthModal('login', this)">
            Entrar na Conta
          </button>
          <button type="button" class="btn btn-accent" onclick="window.AprovaComponents.openAuthModal('register', this)">
            Criar Conta Gratuita
          </button>
          <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.entrarContaDemo()">
            Entrar com Conta Demo (1 Clique)
          </button>
        </div>
      </div>
    `;
    return;
  }

  let concursosResp;
  let materiaisResp;
  try {
    [concursosResp, materiaisResp] = await Promise.all([
      window.AprovaAPI.listarConcursos(),
      window.AprovaAPI.listarMateriais('todos', 'todas')
    ]);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state-sheet empty-state-narrow" role="alert">
        <h3>Não foi possível carregar seu painel de estudos</h3>
        <p>${window.AprovaUtils.escapeHtml(err.message || 'Falha ao consultar concursos e materiais.')}</p>
        <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.renderUserDashboard()">
          ${window.AprovaUtils.icon('reset')}
          <span>Tentar novamente</span>
        </button>
      </div>
    `;
    return;
  }

  const safe = (v) => window.AprovaUtils.safeText(v);
  const esc = (v) => window.AprovaUtils.escapeHtml(v);
  const salvos = (concursosResp.concursos || []).filter(c => c.salvo);
  const estudadosList = (materiaisResp.materiais || []).filter(m => m.estudado);

  const salvosHtml = salvos.map(c => {
    const safeId = esc(c.id);
    return `
      <div class="mat-item">
        <div class="mat-item-info">
          <div class="mat-item-title">
            ${safe(c.sigla)} · ${safe(c.titulo)}
          </div>
          <div class="mat-item-meta">
            <span class="badge ${window.AprovaUtils.getStatusBadgeClass(c.status)}">${safe(c.status_label)}</span>
            <span>Banca: <strong>${safe(c.banca)}</strong></span>
            <span>Salário: <strong class="text-green">${safe(c.salario)}</strong></span>
          </div>
        </div>
        <div class="mat-item-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openConcursoModal('${safeId}', this)">
            Raio-X e Materiais
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.removerFavoritoDaConta('${safeId}')">
            ${window.AprovaUtils.icon('trash')}
            <span>Remover</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const estudadosHtml = estudadosList.map(m => {
    const mid = Number(m.id);
    return `
      <div class="mat-item-wrap">
        <div class="mat-item">
          <div class="mat-item-info">
            <div class="mat-item-title">
              ${safe(m.titulo)}
            </div>
            <div class="mat-item-meta">
              <span class="badge ${window.AprovaUtils.getStatusBadgeClass(m.concurso_status || 'aberto')}">${safe(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
              <span class="badge badge-cobalt">${safe(m.categoria)}</span>
              <span>Formato: <strong>Roteiro + Checklist (PDF)</strong></span>
            </div>
          </div>
          <div class="mat-item-actions">
            <button type="button" class="btn btn-outline btn-sm" aria-expanded="false" aria-controls="conta-mat-preview-${mid}" onclick="window.AprovaUtils.toggleMaterialPreview(${mid}, 'conta-mat', this)">
              ${window.AprovaUtils.icon('eye')}
              <span>Pré-visualizar</span>
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaAPI.baixarMaterial(${mid})">
              ${window.AprovaUtils.icon('download')}
              <span>Baixar PDF</span>
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.desmarcarMaterialDaConta(${mid})">
              ${window.AprovaUtils.icon('x')}
              <span>Desmarcar</span>
            </button>
          </div>
        </div>
        <div id="conta-mat-preview-${mid}" class="material-preview-panel" hidden></div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Barra Tipográfica Plana do Candidato (Sem cards KPI repetitivos) -->
    <div class="account-ledger-bar">
      <div class="account-ledger-cell">
        <div class="account-user-identity">
          <div class="account-avatar-lg">${safe(user.iniciais || 'CL')}</div>
          <div>
            <div class="account-user-name">${safe(user.nome)}</div>
            <div class="account-user-email">${safe(user.email)}</div>
            <span class="badge badge-cobalt">Plano: ${safe(user.plano || 'Gratuito')}</span>
          </div>
        </div>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Concursos Salvos</span>
        <strong class="account-metric-value metric-cobalt">${salvos.length}</strong>
        <span class="account-metric-sub">Monitorados no caderno</span>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Materiais Concluídos</span>
        <strong class="account-metric-value metric-green">${materiaisResp.estudados}/${materiaisResp.total}</strong>
        <span class="account-metric-sub">${materiaisResp.progresso_pct}% do acervo estudado</span>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Carga Semanal Alvo</span>
        <strong class="account-metric-value metric-accent">${(user.horas_estudo_dia || 4) * 6}h/sem</strong>
        <span class="account-metric-sub">Foco: Carreira ${safe(user.carreira_foco)}</span>
      </div>
    </div>

    <div class="split-workspace-conta">
      <!-- Coluna 1: Dados e Parâmetros de Calibragem -->
      <div class="ia-sheet">
        <h3 class="sheet-title-sm">
          Parâmetros de Estudo e Perfil
        </h3>
        <p class="sheet-desc">
          Estes parâmetros calibram automaticamente as recomendações do Copiloto e Match IA.
        </p>

        <div id="profile-error-box" class="auth-error-banner" role="alert"></div>

        <form id="profile-settings-form" onsubmit="window.AprovaComponents.salvarPerfilUsuario(event)" class="form-stack-tight">
          <div class="field-group">
            <label for="prof-nome">Nome Completo</label>
            <input type="text" id="prof-nome" class="field-input" value="${esc(user.nome)}" minlength="2" required />
          </div>
          <div class="field-group">
            <label for="prof-email-ro">E-mail da Conta</label>
            <input type="email" id="prof-email-ro" class="field-input" value="${esc(user.email)}" disabled />
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label for="prof-carreira">Carreira Foco</label>
              <select id="prof-carreira" class="field-input">
                <option value="Policial" ${user.carreira_foco === 'Policial' ? 'selected' : ''}>Policial (PF, PRF)</option>
                <option value="Bancária" ${user.carreira_foco === 'Bancária' ? 'selected' : ''}>Bancária (Caixa, BB, BACEN)</option>
                <option value="Tribunais" ${user.carreira_foco === 'Tribunais' ? 'selected' : ''}>Tribunais (TSE, TJ-SP)</option>
                <option value="Administrativa" ${user.carreira_foco === 'Administrativa' ? 'selected' : ''}>Administrativa (INSS, CNU)</option>
                <option value="Fiscal" ${user.carreira_foco === 'Fiscal' ? 'selected' : ''}>Fiscal e Controle (Receita, CGU)</option>
                <option value="Ambiental" ${user.carreira_foco === 'Ambiental' ? 'selected' : ''}>Ambiental (IBAMA)</option>
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
          <div class="form-grid-2">
            <div class="field-group">
              <label for="prof-uf">UF de Interesse</label>
              <select id="prof-uf" class="field-input">
                <option value="Nacional" ${user.uf_interesse === 'Nacional' ? 'selected' : ''}>Nacional</option>
                <option value="DF" ${user.uf_interesse === 'DF' ? 'selected' : ''}>Distrito Federal (DF)</option>
                <option value="SP" ${user.uf_interesse === 'SP' ? 'selected' : ''}>São Paulo (SP)</option>
              </select>
            </div>
            <div class="field-group">
              <label for="prof-horas">Horas de Estudo / Dia</label>
              <select id="prof-horas" class="field-input">
                <option value="2" ${user.horas_estudo_dia == 2 ? 'selected' : ''}>2 horas/dia</option>
                <option value="3" ${user.horas_estudo_dia == 3 ? 'selected' : ''}>3 horas/dia</option>
                <option value="4" ${user.horas_estudo_dia == 4 ? 'selected' : ''}>4 horas/dia</option>
                <option value="6" ${user.horas_estudo_dia == 6 ? 'selected' : ''}>6 horas/dia</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            Salvar Alterações no Perfil
          </button>
        </form>
      </div>

      <!-- Coluna 2: Caderno Ativo (Concursos Salvos + Materiais Concluídos) -->
      <div class="stack-col-lg">
        <div class="ia-sheet">
          <div class="match-result-head">
            <h3 class="sheet-title-sm">
              Concursos Salvos no Caderno (${salvos.length})
            </h3>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('explorar')">
              Explorar Editais
            </button>
          </div>
          ${salvosHtml || `<p class="empty-inline-note">Nenhum concurso salvo no momento. Utilize o botão "Salvar" nos dossiês da aba Concursos para monitorá-los aqui.</p>`}
        </div>

        <div class="ia-sheet">
          <div class="match-result-head">
            <h3 class="sheet-title-sm">
              Materiais Concluídos (${estudadosList.length})
            </h3>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('materiais')">
              Abrir Acervo
            </button>
          </div>
          ${estudadosHtml || `<p class="empty-inline-note">Nenhum guia marcado como concluído ainda. Marque os materiais estudados no Acervo ou dentro do Raio-X de cada concurso.</p>`}
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('#profile-settings-form input, #profile-settings-form select').forEach(el => {
    el.addEventListener('input', () => {
      const errBox = document.getElementById('profile-error-box');
      if (errBox) {
        errBox.classList.remove('visible');
        errBox.textContent = '';
      }
    });
  });
};

window.AprovaComponents.removerFavoritoDaConta = async function (concursoId) {
  try {
    const res = await window.AprovaAPI.alternarFavorito(concursoId);
    window.AprovaComponents.renderUserDashboard();
    window.AprovaApp.carregarConcursos();
    window.AprovaApp.atualizarIndicadoresUsuario();
    if (!res.salvo) {
      window.AprovaUtils.showToast('Concurso removido do seu caderno.', {
        actionLabel: 'Desfazer',
        onAction: async () => {
          await window.AprovaAPI.alternarFavorito(concursoId);
          window.AprovaComponents.renderUserDashboard();
          window.AprovaApp.carregarConcursos();
          window.AprovaApp.atualizarIndicadoresUsuario();
        }
      });
    }
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Erro ao remover concurso.', { variant: 'error' });
  }
};

window.AprovaComponents.desmarcarMaterialDaConta = async function (materialId) {
  try {
    const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
    window.AprovaComponents.renderUserDashboard();
    window.AprovaApp.carregarConcursos();
    window.AprovaApp.atualizarIndicadoresUsuario();
    if (!res.estudado) {
      window.AprovaUtils.showToast('Material marcado como pendente.', {
        actionLabel: 'Desfazer',
        onAction: async () => {
          await window.AprovaAPI.alternarMaterialEstudado(materialId);
          window.AprovaComponents.renderUserDashboard();
          window.AprovaApp.carregarConcursos();
          window.AprovaApp.atualizarIndicadoresUsuario();
        }
      });
    }
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Erro ao atualizar material.', { variant: 'error' });
  }
};

window.AprovaComponents.salvarPerfilUsuario = async function (event) {
  event.preventDefault();
  const errBox = document.getElementById('profile-error-box');
  const payload = {
    nome: document.getElementById('prof-nome').value.trim(),
    carreira_foco: document.getElementById('prof-carreira').value,
    escolaridade: document.getElementById('prof-escolaridade').value,
    uf_interesse: document.getElementById('prof-uf').value,
    horas_estudo_dia: parseInt(document.getElementById('prof-horas').value, 10)
  };

  try {
    const resp = await window.AprovaAPI.atualizarPerfilUsuario(payload);
    window.AprovaUtils.showToast(resp.mensagem);
    window.AprovaComponents.renderHeaderUserWidget();
    window.AprovaComponents.renderUserDashboard();
  } catch (err) {
    if (errBox) {
      errBox.classList.add('visible');
      errBox.textContent = err.message || 'Erro ao atualizar perfil.';
    } else {
      window.AprovaUtils.showToast(err.message || 'Erro ao atualizar perfil.', { variant: 'error' });
    }
  }
};
