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
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openAuthModal('login')">
          ${window.AprovaUtils.icon('user')}
          <span>Entrar</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openAuthModal('register')">
          <span>Criar Conta</span>
        </button>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="header-user-actions">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        onclick="window.AprovaApp.switchView('conta')"
        title="Abrir Meu Painel de Estudos e Conta"
      >
        <span class="user-avatar-chip">${user.iniciais || 'CL'}</span>
        <span>${window.AprovaUtils.cleanText(user.nome)}</span>
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

window.AprovaComponents.openAuthModal = function (modo = 'login') {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('auth-modal-body');
  if (!modal || !body) return;

  modal.classList.add('open');

  const isLogin = modo === 'login';
  body.innerHTML = `
    <div style="padding-right:36px; margin-bottom:18px;">
      <h2 style="font-size:1.3125rem; font-weight:800; color:var(--text); margin-bottom:6px;">
        ${isLogin ? 'Entrar na sua Conta Aprova+ IA' : 'Criar Conta Gratuita no Aprova+ IA'}
      </h2>
      <p style="font-size:0.875rem; color:var(--text-secondary);">
        Sincronize seus concursos salvos, o histórico de apostilas estudadas e os parâmetros do Copiloto IA.
      </p>
    </div>

    <div class="form-grid-2" style="padding-bottom:16px; border-bottom:1px solid var(--border); margin-bottom:18px;">
      <button
        type="button"
        class="btn ${isLogin ? 'btn-primary' : 'btn-outline'}"
        onclick="window.AprovaComponents.openAuthModal('login')"
      >
        Já possuo conta
      </button>
      <button
        type="button"
        class="btn ${!isLogin ? 'btn-primary' : 'btn-outline'}"
        onclick="window.AprovaComponents.openAuthModal('register')"
      >
        Criar nova conta
      </button>
    </div>

    <div id="auth-error-box" style="display:none; color:var(--accent); padding-bottom:12px; font-size:0.875rem; font-weight:700;"></div>

    ${isLogin ? `
      <form onsubmit="window.AprovaComponents.submeterLogin(event)" style="display:flex; flex-direction:column; gap:14px;">
        <div class="field-group">
          <label for="login-email">E-mail Cadastrado</label>
          <input type="email" id="login-email" class="field-input" placeholder="Ex: carlos@aprovamais.com.br" value="carlos@aprovamais.com.br" required />
        </div>
        <div class="field-group">
          <label for="login-senha">Senha de Acesso</label>
          <input type="password" id="login-senha" class="field-input" placeholder="Digite sua senha" value="123456" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:4px;">
          Entrar na Plataforma
        </button>
      </form>

      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.8125rem; color:var(--muted);">Acesso rápido de avaliação:</span>
        <button type="button" class="btn btn-accent btn-sm" onclick="window.AprovaComponents.entrarContaDemo()">
          Entrar com Conta Demo (Carlos Lucas)
        </button>
      </div>
    ` : `
      <form onsubmit="window.AprovaComponents.submeterCadastro(event)" class="form-grid-2">
        <div class="field-group form-span-2">
          <label for="reg-nome">Nome Completo</label>
          <input type="text" id="reg-nome" class="field-input" placeholder="Ex: Ana Beatriz Silva" required />
        </div>
        <div class="field-group">
          <label for="reg-email">E-mail Principal</label>
          <input type="email" id="reg-email" class="field-input" placeholder="seu@email.com" required />
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
        <button type="submit" class="btn btn-primary form-span-2" style="margin-top:4px;">
          Criar Conta e Abrir Caderno de Estudos
        </button>
      </form>
    `}
  `;
};

window.AprovaComponents.closeAuthModal = function () {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
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
    window.AprovaApp.atualizarIndicadoresUsuario();
    if (window.AprovaApp.state.currentView === 'conta') {
      window.AprovaComponents.renderUserDashboard();
    }
  } catch (err) {
    if (errBox) {
      errBox.style.display = 'block';
      errBox.textContent = err.message || 'Erro ao realizar login.';
    }
  }
};

window.AprovaComponents.entrarContaDemo = async function () {
  const resp = await window.AprovaAPI.loginUsuario('carlos@aprovamais.com.br', '123456');
  window.AprovaComponents.closeAuthModal();
  window.AprovaComponents.renderHeaderUserWidget();
  window.AprovaUtils.showToast(resp.mensagem);
  window.AprovaApp.atualizarIndicadoresUsuario();
  if (window.AprovaApp.state.currentView === 'conta') {
    window.AprovaComponents.renderUserDashboard();
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
      errBox.style.display = 'block';
      errBox.textContent = err.message || 'Erro ao criar conta.';
    }
  }
};

window.AprovaComponents.fazerLogout = function () {
  window.AprovaAPI.logoutUsuario();
  window.AprovaComponents.renderHeaderUserWidget();
  window.AprovaUtils.showToast('Sessão encerrada com segurança.');
  if (window.AprovaApp.state.currentView === 'conta') {
    window.AprovaComponents.renderUserDashboard();
  }
};

window.AprovaComponents.renderUserDashboard = async function () {
  const container = document.getElementById('user-dashboard-container');
  if (!container) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  if (!user) {
    container.innerHTML = `
      <div class="empty-state-sheet" style="max-width:620px; margin:0 auto;">
        <h3>Identifique-se para Acessar seu Caderno de Estudos</h3>
        <p>Com uma conta gratuita você salva editais prioritários, registra os materiais concluídos e mantém suas metas calibradas no Copiloto IA.</p>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openAuthModal('login')">
            Entrar na Conta
          </button>
          <button type="button" class="btn btn-accent" onclick="window.AprovaComponents.openAuthModal('register')">
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

  const [concursosResp, materiaisResp] = await Promise.all([
    window.AprovaAPI.listarConcursos(),
    window.AprovaAPI.listarMateriais('todos', 'todas')
  ]);

  const clean = window.AprovaUtils.cleanText;
  const salvos = (concursosResp.concursos || []).filter(c => c.salvo);
  const estudadosList = (materiaisResp.materiais || []).filter(m => m.estudado);

  const salvosHtml = salvos.map(c => `
    <div class="mat-item">
      <div class="mat-item-info">
        <div class="mat-item-title">
          ${clean(c.sigla)} · ${clean(c.titulo)}
        </div>
        <div class="mat-item-meta">
          <span class="badge ${window.AprovaUtils.getStatusBadgeClass(c.status)}">${clean(c.status_label)}</span>
          <span>Banca: <strong>${clean(c.banca)}</strong></span>
          <span>Salário: <strong style="color:var(--green);">${clean(c.salario)}</strong></span>
        </div>
      </div>
      <div class="mat-item-actions">
        <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaComponents.openConcursoModal('${c.id}')">
          Raio-X e Materiais
        </button>
      </div>
    </div>
  `).join('');

  const estudadosHtml = estudadosList.map(m => `
    <div class="mat-item">
      <div class="mat-item-info">
        <div class="mat-item-title">
          ${clean(m.titulo)}
        </div>
        <div class="mat-item-meta">
          <span class="badge badge-aberto">${clean(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
          <span class="badge badge-cobalt">${clean(m.categoria)}</span>
          <span>Extensão: <strong>${clean(m.paginas)}</strong></span>
        </div>
      </div>
      <div class="mat-item-actions">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaAPI.baixarMaterial(${m.id})">
          ${window.AprovaUtils.icon('download')}
          <span>Baixar Guia</span>
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- Barra Tipográfica Plana do Candidato (Sem cards KPI repetitivos) -->
    <div class="account-ledger-bar">
      <div class="account-ledger-cell">
        <div class="account-user-identity">
          <div class="account-avatar-lg">${user.iniciais || 'CL'}</div>
          <div>
            <div style="font-size:1.0625rem; font-weight:800; color:var(--text);">${clean(user.nome)}</div>
            <div style="font-size:0.8125rem; color:var(--muted); margin-bottom:4px;">${clean(user.email)}</div>
            <span class="badge badge-cobalt">Plano: ${clean(user.plano || 'Gratuito')}</span>
          </div>
        </div>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Concursos Salvos</span>
        <strong class="account-metric-value" style="color:var(--primary);">${salvos.length}</strong>
        <span class="account-metric-sub">Monitorados no caderno</span>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Materiais Concluídos</span>
        <strong class="account-metric-value" style="color:var(--green);">${materiaisResp.estudados}/${materiaisResp.total}</strong>
        <span class="account-metric-sub">${materiaisResp.progresso_pct}% do acervo estudado</span>
      </div>

      <div class="account-ledger-cell">
        <span class="account-metric-label">Carga Semanal Alvo</span>
        <strong class="account-metric-value" style="color:var(--accent);">${(user.horas_estudo_dia || 4) * 6}h/sem</strong>
        <span class="account-metric-sub">Foco: Carreira ${clean(user.carreira_foco)}</span>
      </div>
    </div>

    <div class="split-workspace-conta">
      <!-- Coluna 1: Dados e Parâmetros de Calibragem -->
      <div class="ia-sheet">
        <h3 style="font-size:1.125rem; font-weight:800; color:var(--text); margin-bottom:6px;">
          Parâmetros de Estudo e Perfil
        </h3>
        <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:16px;">
          Estes parâmetros calibram automaticamente as recomendações do Copiloto e Match IA.
        </p>

        <form onsubmit="window.AprovaComponents.salvarPerfilUsuario(event)" style="display:flex; flex-direction:column; gap:12px;">
          <div class="field-group">
            <label for="prof-nome">Nome Completo</label>
            <input type="text" id="prof-nome" class="field-input" value="${user.nome}" required />
          </div>
          <div class="field-group">
            <label for="prof-email-ro">E-mail da Conta</label>
            <input type="email" id="prof-email-ro" class="field-input" value="${user.email}" disabled />
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
          <button type="submit" class="btn btn-primary" style="margin-top:4px;">
            Salvar Alterações no Perfil
          </button>
        </form>
      </div>

      <!-- Coluna 2: Caderno Ativo (Concursos Salvos + Materiais Concluídos) -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="ia-sheet">
          <div class="match-result-head" style="margin-bottom:8px;">
            <h3 style="font-size:1.125rem; font-weight:800; color:var(--text);">
              Concursos Salvos no Caderno (${salvos.length})
            </h3>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('explorar')">
              Explorar Editais
            </button>
          </div>
          ${salvosHtml || `<p style="font-size:0.875rem; color:var(--muted); padding:8px 0;">Nenhum concurso salvo no momento. Utilize o botão "Salvar" nos dossiês da aba Concursos para monitorá-los aqui.</p>`}
        </div>

        <div class="ia-sheet">
          <div class="match-result-head" style="margin-bottom:8px;">
            <h3 style="font-size:1.125rem; font-weight:800; color:var(--text);">
              Materiais Concluídos (${estudadosList.length})
            </h3>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaApp.switchView('materiais')">
              Abrir Acervo
            </button>
          </div>
          ${estudadosHtml || `<p style="font-size:0.875rem; color:var(--muted); padding:8px 0;">Nenhum guia marcado como concluído ainda. Marque os materiais estudados no Acervo ou dentro do Raio-X de cada concurso.</p>`}
        </div>
      </div>
    </div>
  `;
};

window.AprovaComponents.salvarPerfilUsuario = async function (event) {
  event.preventDefault();
  const payload = {
    nome: document.getElementById('prof-nome').value.trim(),
    carreira_foco: document.getElementById('prof-carreira').value,
    escolaridade: document.getElementById('prof-escolaridade').value,
    uf_interesse: document.getElementById('prof-uf').value,
    horas_estudo_dia: parseInt(document.getElementById('prof-horas').value, 10)
  };

  const resp = await window.AprovaAPI.atualizarPerfilUsuario(payload);
  window.AprovaUtils.showToast(resp.mensagem);
  window.AprovaComponents.renderHeaderUserWidget();
  window.AprovaComponents.renderUserDashboard();
};
