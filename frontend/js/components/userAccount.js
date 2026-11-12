/**
 * Componente: Sistema de Autenticação (Login / Cadastro) e Painel do Concurseiro (Minha Conta)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderHeaderUserWidget = function () {
  const box = document.getElementById('header-user-area');
  if (!box) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  if (!user) {
    box.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button type="button" class="btn btn-outline" style="padding:8px 14px;" onclick="window.AprovaComponents.openAuthModal('login')">
          ${window.AprovaUtils.icon('user')}
          <span>Entrar</span>
        </button>
        <button type="button" class="btn btn-primary" style="padding:8px 14px;" onclick="window.AprovaComponents.openAuthModal('register')">
          <span>Criar Conta</span>
        </button>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <button
        type="button"
        class="btn btn-outline"
        onclick="window.AprovaApp.switchView('conta')"
        style="padding:6px 12px;"
        title="Abrir Meu Painel de Estudos e Conta"
      >
        <span style="width:24px; height:24px; border-radius:50%; background-color:var(--primary); color:#ffffff; font-weight:800; font-size:0.8125rem; display:inline-flex; align-items:center; justify-content:center;">
          ${user.iniciais || 'CL'}
        </span>
        <span style="font-weight:700; color:var(--text);">${user.nome}</span>
      </button>
      <button
        type="button"
        class="btn btn-outline"
        style="padding:6px 12px;"
        onclick="window.AprovaComponents.fazerLogout()"
        title="Sair da conta"
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
      <h2 style="font-size:1.375rem; font-weight:800; color:var(--text); margin-bottom:6px;">
        ${isLogin ? 'Entrar na sua Conta Aprova+ IA' : 'Criar sua Conta Gratuita'}
      </h2>
      <p style="font-size:0.9375rem; color:var(--text-secondary);">
        Salve seus concursos favoritos, acompanhe os materiais estudados e personalize seu Copiloto IA.
      </p>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-bottom:16px; border-bottom:1px solid var(--border); margin-bottom:18px;">
      <button
        type="button"
        class="btn ${isLogin ? 'btn-primary' : 'btn-outline'}"
        onclick="window.AprovaComponents.openAuthModal('login')"
      >
        Já tenho conta (Login)
      </button>
      <button
        type="button"
        class="btn ${!isLogin ? 'btn-primary' : 'btn-outline'}"
        onclick="window.AprovaComponents.openAuthModal('register')"
      >
        Criar nova conta
      </button>
    </div>

    <div id="auth-error-box" style="display:none; color:#8c3d19; padding-bottom:12px; font-size:0.875rem; font-weight:700;"></div>

    ${isLogin ? `
      <form onsubmit="window.AprovaComponents.submeterLogin(event)" style="display:flex; flex-direction:column; gap:14px;">
        <div class="field-group">
          <label for="login-email">Seu E-mail</label>
          <input type="email" id="login-email" class="field-input" placeholder="Ex: carlos@aprovamais.com.br" value="carlos@aprovamais.com.br" required />
        </div>
        <div class="field-group">
          <label for="login-senha">Sua Senha</label>
          <input type="password" id="login-senha" class="field-input" placeholder="Digite sua senha" value="123456" required />
        </div>
        <button type="submit" class="btn btn-primary" style="padding:12px; font-size:0.9375rem; margin-top:4px;">
          Entrar na Plataforma
        </button>
      </form>

      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.875rem; color:var(--muted);">Conta demonstração rápida:</span>
        <button type="button" class="btn btn-purple" onclick="window.AprovaComponents.entrarContaDemo()">
          Entrar com 1 Clique (Carlos Lucas)
        </button>
      </div>
    ` : `
      <form onsubmit="window.AprovaComponents.submeterCadastro(event)" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="field-group" style="grid-column: span 2;">
          <label for="reg-nome">Seu Nome Completo</label>
          <input type="text" id="reg-nome" class="field-input" placeholder="Ex: Ana Beatriz Silva" required />
        </div>
        <div class="field-group">
          <label for="reg-email">Seu Melhor E-mail</label>
          <input type="email" id="reg-email" class="field-input" placeholder="seu@email.com" required />
        </div>
        <div class="field-group">
          <label for="reg-senha">Crie uma Senha</label>
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
          <label for="reg-escolaridade">Sua Escolaridade Atual</label>
          <select id="reg-escolaridade" class="field-input">
            <option value="Superior">Ensino Superior Completo</option>
            <option value="Médio">Ensino Médio Completo</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-uf">UF de Interesse</label>
          <select id="reg-uf" class="field-input">
            <option value="Nacional">Nacional (Qualquer Estado)</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="DF">Distrito Federal (DF)</option>
          </select>
        </div>
        <div class="field-group">
          <label for="reg-horas">Meta de Horas de Estudo / Dia</label>
          <select id="reg-horas" class="field-input">
            <option value="2">2 horas/dia</option>
            <option value="3">3 horas/dia</option>
            <option value="4" selected>4 horas/dia</option>
            <option value="6">6 horas/dia</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="grid-column: span 2; padding:12px; font-size:0.9375rem; margin-top:4px;">
          Criar Minha Conta e Acessar Painel
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
      <div class="concurso-card" style="text-align:center; padding:42px 24px; max-width:620px; margin:0 auto;">
        <h3 style="font-size:1.375rem; font-weight:800; color:var(--text); margin-bottom:10px;">
          Entre na sua Conta para Acessar seu Painel de Estudos
        </h3>
        <p style="font-size:0.9375rem; color:var(--text-secondary); margin:0 auto 22px;">
          Com uma conta gratuita você salva seus concursos favoritos, acompanha seu progresso em cada apostila e sincroniza suas metas com o Copiloto IA.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openAuthModal('login')">
            Entrar na Conta
          </button>
          <button type="button" class="btn btn-purple" onclick="window.AprovaComponents.openAuthModal('register')">
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
      <div>
        <div style="font-weight:700; font-size:0.9375rem; color:var(--text); margin-bottom:4px;">
          ${clean(c.sigla)} · ${clean(c.titulo)}
        </div>
        <div style="font-size:0.8125rem; color:var(--muted);">
          <span class="badge ${window.AprovaUtils.getStatusBadgeClass(c.status)}">${clean(c.status_label)}</span>
          <span style="margin-left:8px;">Banca: <strong>${clean(c.banca)}</strong> · Salário: <strong style="color:var(--green);">${clean(c.salario)}</strong></span>
        </div>
      </div>
      <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${c.id}')">
        Raio-X e Materiais
      </button>
    </div>
  `).join('');

  const estudadosHtml = estudadosList.map(m => `
    <div class="mat-item">
      <div>
        <div style="font-weight:700; font-size:0.9375rem; color:var(--text); margin-bottom:4px;">
          ${clean(m.titulo)}
        </div>
        <div style="font-size:0.8125rem; color:var(--muted);">
          <span class="badge badge-aberto">Concluído · ${clean(m.concurso_sigla || m.concurso_id.toUpperCase())}</span>
          <span style="margin-left:8px;">Categoria: ${clean(m.categoria)} · ${clean(m.paginas)}</span>
        </div>
      </div>
      <button type="button" class="btn btn-outline" onclick="window.AprovaAPI.baixarMaterial(${m.id})">
        Baixar Novamente
      </button>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="concurso-card" style="padding:20px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:44px; height:44px; border-radius:50%; background-color:var(--primary); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.0625rem;">
            ${user.iniciais || 'CL'}
          </div>
          <div>
            <div style="font-size:1.0625rem; font-weight:800; color:var(--text);">${clean(user.nome)}</div>
            <div style="font-size:0.8125rem; color:var(--muted);">${clean(user.email)}</div>
            <span class="badge badge-purple" style="margin-top:4px;">Plano: ${clean(user.plano || 'Gratuito')}</span>
          </div>
        </div>
      </div>

      <div class="concurso-card" style="padding:20px;">
        <span style="font-size:0.8125rem; font-weight:700; color:var(--muted);">Concursos Salvos</span>
        <strong style="font-size:1.875rem; font-weight:800; color:var(--primary);">${salvos.length}</strong>
        <span style="font-size:0.8125rem; color:var(--text-secondary);">Monitorados no seu caderno</span>
      </div>

      <div class="concurso-card" style="padding:20px;">
        <span style="font-size:0.8125rem; font-weight:700; color:var(--muted);">Materiais Concluídos</span>
        <strong style="font-size:1.875rem; font-weight:800; color:var(--green);">${materiaisResp.estudados}/${materiaisResp.total}</strong>
        <span style="font-size:0.8125rem; color:var(--text-secondary);">${materiaisResp.progresso_pct}% do acervo estudado</span>
      </div>

      <div class="concurso-card" style="padding:20px;">
        <span style="font-size:0.8125rem; font-weight:700; color:var(--muted);">Meta de Estudo Semanal</span>
        <strong style="font-size:1.875rem; font-weight:800; color:var(--accent);">${(user.horas_estudo_dia || 4) * 6}h/sem</strong>
        <span style="font-size:0.8125rem; color:var(--text-secondary);">Foco: Carreira ${clean(user.carreira_foco)}</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:22px; align-items:start;">
      <div class="concurso-card">
        <div>
          <h3 style="font-size:1.1875rem; font-weight:800; color:var(--text); margin-bottom:6px;">
            Meus Dados e Preferências de Estudo
          </h3>
          <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:16px;">
            Suas preferências abaixo calibram automaticamente o Copiloto e Match IA.
          </p>

          <form onsubmit="window.AprovaComponents.salvarPerfilUsuario(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div class="field-group">
              <label for="prof-nome">Nome Completo</label>
              <input type="text" id="prof-nome" class="field-input" value="${user.nome}" required />
            </div>
            <div class="field-group">
              <label for="prof-email-ro">E-mail da Conta</label>
              <input type="email" id="prof-email-ro" class="field-input" value="${user.email}" disabled style="background-color:var(--bg-subtle);" />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="field-group">
                <label for="prof-carreira">Carreira Foco</label>
                <select id="prof-carreira" class="field-input">
                  <option value="Policial" ${user.carreira_foco === 'Policial' ? 'selected' : ''}>Policial (PF, PRF)</option>
                  <option value="Bancária" ${user.carreira_foco === 'Bancária' ? 'selected' : ''}>Bancária (Caixa, BB)</option>
                  <option value="Tribunais" ${user.carreira_foco === 'Tribunais' ? 'selected' : ''}>Tribunais (TSE, TJ-SP)</option>
                  <option value="Administrativa" ${user.carreira_foco === 'Administrativa' ? 'selected' : ''}>Administrativa (INSS, CNU)</option>
                  <option value="Fiscal" ${user.carreira_foco === 'Fiscal' ? 'selected' : ''}>Fiscal e Controle (Receita)</option>
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
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="field-group">
                <label for="prof-uf">UF de Interesse</label>
                <select id="prof-uf" class="field-input">
                  <option value="Nacional" ${user.uf_interesse === 'Nacional' ? 'selected' : ''}>Nacional</option>
                  <option value="SP" ${user.uf_interesse === 'SP' ? 'selected' : ''}>São Paulo (SP)</option>
                  <option value="DF" ${user.uf_interesse === 'DF' ? 'selected' : ''}>Distrito Federal (DF)</option>
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
            <button type="submit" class="btn btn-primary" style="margin-top:6px;">
              Salvar Preferências no Perfil
            </button>
          </form>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="concurso-card">
          <h3 style="font-size:1.125rem; font-weight:800; color:var(--text); margin-bottom:10px;">
            Meus Concursos Salvos (${salvos.length})
          </h3>
          ${salvosHtml || `<p style="font-size:0.9375rem; color:var(--muted);">Você ainda não favoritou nenhum concurso. Clique em "Salvar" nos cards da aba Concursos.</p>`}
        </div>

        <div class="concurso-card">
          <h3 style="font-size:1.125rem; font-weight:800; color:var(--text); margin-bottom:10px;">
            Meus Materiais Estudados (${estudadosList.length})
          </h3>
          ${estudadosHtml || `<p style="font-size:0.9375rem; color:var(--muted);">Nenhum material marcado como concluído ainda. Marque seus PDFs na aba Materiais.</p>`}
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
