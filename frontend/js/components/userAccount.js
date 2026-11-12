/**
 * Componente: Sistema de Autenticação (Login / Cadastro) e Painel do Concurseiro (Minha Conta & Estudos)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.renderHeaderUserWidget = function () {
  const box = document.getElementById('header-user-area');
  if (!box) return;

  const user = window.AprovaAPI.obterUsuarioAtual();
  if (!user) {
    box.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="btn btn-outline" style="padding:7px 13px; font-size:0.82rem;" onclick="window.AprovaComponents.openAuthModal('login')">
          🔐 Entrar
        </button>
        <button class="btn btn-primary" style="padding:7px 13px; font-size:0.82rem;" onclick="window.AprovaComponents.openAuthModal('register')">
          ✨ Criar Conta
        </button>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div
        onclick="window.AprovaApp.switchView('conta')"
        style="display:flex; align-items:center; gap:9px; background:#f8fafc; border:1px solid #cbd5e1; padding:5px 12px 5px 6px; border-radius:999px; cursor:pointer;"
        title="Abrir Meu Painel de Estudos e Conta"
      >
        <div style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg, #2563eb, #7c3aed); color:#fff; font-weight:800; font-size:0.78rem; display:flex; align-items:center; justify-content:center;">
          ${user.iniciais || 'CL'}
        </div>
        <div style="line-height:1.15;">
          <div style="font-size:0.8rem; font-weight:800; color:#0f172a;">${user.nome}</div>
          <div style="font-size:0.68rem; color:#64748b;">Foco: ${user.carreira_foco} • ${user.plano || 'Gratuito'}</div>
        </div>
      </div>
      <button
        class="btn btn-outline"
        style="padding:6px 10px; font-size:0.76rem;"
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
    <div style="padding-right:28px; margin-bottom:16px;">
      <span class="badge badge-purple" style="margin-bottom:6px;">🔐 ÁREA DO CONCURSEIRO</span>
      <h2 style="font-size:1.4rem; font-weight:800; color:#0f172a;">
        ${isLogin ? 'Entrar na sua Conta Aprova+ IA' : 'Criar sua Conta Gratuita'}
      </h2>
      <p style="font-size:0.84rem; color:#475569;">
        Salve seus concursos favoritos, acompanhe os materiais estudados e personalize seu Copiloto IA.
      </p>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#f1f5f9; padding:5px; border-radius:10px; margin-bottom:18px;">
      <button
        type="button"
        class="btn ${isLogin ? 'btn-primary' : 'btn-outline'}"
        style="border:none;"
        onclick="window.AprovaComponents.openAuthModal('login')"
      >
        🔐 Já tenho conta (Login)
      </button>
      <button
        type="button"
        class="btn ${!isLogin ? 'btn-primary' : 'btn-outline'}"
        style="border:none;"
        onclick="window.AprovaComponents.openAuthModal('register')"
      >
        ✨ Criar nova conta
      </button>
    </div>

    <div id="auth-error-box" style="display:none; background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:10px 12px; border-radius:9px; font-size:0.83rem; font-weight:600; margin-bottom:12px;"></div>

    ${isLogin ? `
      <form onsubmit="window.AprovaComponents.submeterLogin(event)" style="display:flex; flex-direction:column; gap:12px;">
        <div class="field-group">
          <label>Seu E-mail</label>
          <input type="email" id="login-email" class="field-input" placeholder="Ex: carlos@aprovamais.com.br" value="carlos@aprovamais.com.br" required />
        </div>
        <div class="field-group">
          <label>Sua Senha</label>
          <input type="password" id="login-senha" class="field-input" placeholder="Digite sua senha" value="123456" required />
        </div>
        <button type="submit" class="btn btn-primary" style="padding:12px; font-size:0.92rem; margin-top:4px;">
          🚀 Entrar na Plataforma
        </button>
      </form>

      <div style="margin-top:14px; padding-top:14px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.79rem; color:#64748b;">Conta demonstração pré-configurada:</span>
        <button type="button" class="btn btn-purple" style="padding:7px 12px; font-size:0.79rem;" onclick="window.AprovaComponents.entrarContaDemo()">
          ⚡ Entrar com 1 Clique (Carlos Lucas)
        </button>
      </div>
    ` : `
      <form onsubmit="window.AprovaComponents.submeterCadastro(event)" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="field-group" style="grid-column: span 2;">
          <label>Seu Nome Completo</label>
          <input type="text" id="reg-nome" class="field-input" placeholder="Ex: Ana Beatriz Silva" required />
        </div>
        <div class="field-group">
          <label>Seu Melhor E-mail</label>
          <input type="email" id="reg-email" class="field-input" placeholder="seu@email.com" required />
        </div>
        <div class="field-group">
          <label>Crie uma Senha</label>
          <input type="password" id="reg-senha" class="field-input" placeholder="Mínimo 4 caracteres" minlength="4" required />
        </div>
        <div class="field-group">
          <label>Carreira Principal de Foco</label>
          <select id="reg-carreira" class="field-input">
            <option value="Policial">Policial (PF, PRF, PC)</option>
            <option value="Bancária">Bancária (Caixa, BB, BACEN)</option>
            <option value="Tribunais">Tribunais (TSE, TJ-SP)</option>
            <option value="Administrativa">Administrativa / INSS / CNU</option>
            <option value="Fiscal & Controle">Fiscal & Controle (Receita, CGU)</option>
            <option value="Ambiental">Ambiental (IBAMA)</option>
          </select>
        </div>
        <div class="field-group">
          <label>Sua Escolaridade Atual</label>
          <select id="reg-escolaridade" class="field-input">
            <option value="Superior">Ensino Superior Completo</option>
            <option value="Médio">Ensino Médio Completo</option>
          </select>
        </div>
        <div class="field-group">
          <label>UF de Interesse</label>
          <select id="reg-uf" class="field-input">
            <option value="Nacional">Nacional (Qualquer Estado)</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="DF">Distrito Federal (DF)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
          </select>
        </div>
        <div class="field-group">
          <label>Meta de Horas de Estudo / Dia</label>
          <select id="reg-horas" class="field-input">
            <option value="2">2 horas/dia</option>
            <option value="3">3 horas/dia</option>
            <option value="4" selected>4 horas/dia</option>
            <option value="6">6 horas/dia</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="grid-column: span 2; padding:12px; font-size:0.92rem; margin-top:4px;">
          ✨ Criar Minha Conta e Acessar Painel
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
    window.AprovaUtils.showToast(`👋 ${resp.mensagem}`, '#22c55e');
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
  window.AprovaUtils.showToast(`⚡ ${resp.mensagem}`, '#2563eb');
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
    window.AprovaUtils.showToast(`🎉 ${resp.mensagem}`, '#22c55e');
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
  window.AprovaUtils.showToast('🔒 Você saiu da sua conta.', '#64748b');
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
        <div style="font-size:2.4rem; margin-bottom:8px;">🔐</div>
        <h3 style="font-size:1.35rem; font-weight:800; color:#0f172a; margin-bottom:8px;">
          Entre na sua Conta para Acessar seu Painel de Estudos
        </h3>
        <p style="font-size:0.9rem; color:#475569; margin-bottom:20px;">
          Com uma conta gratuita você salva seus concursos favoritos, acompanha seu progresso em cada apostila/edital verticalizado e sincroniza suas metas com o Copiloto IA.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.AprovaComponents.openAuthModal('login')">
            🔐 Entrar na Conta
          </button>
          <button class="btn btn-purple" onclick="window.AprovaComponents.openAuthModal('register')">
            ✨ Criar Conta Gratuita
          </button>
          <button class="btn btn-outline" onclick="window.AprovaComponents.entrarContaDemo()">
            ⚡ Entrar com Conta Demo (1 Clique)
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

  const salvos = (concursosResp.concursos || []).filter(c => c.salvo);
  const estudadosList = (materiaisResp.materiais || []).filter(m => m.estudado);

  const salvosHtml = salvos.map(c => `
    <div class="mat-item">
      <div>
        <span class="badge ${window.AprovaUtils.getStatusBadgeClass(c.status)}" style="margin-bottom:4px;">
          ${window.AprovaUtils.getStatusDot(c.status)} ${c.status_label}
        </span>
        <div style="font-weight:800; font-size:0.95rem; color:#0f172a;">${c.sigla} — ${c.titulo}</div>
        <div style="font-size:0.78rem; color:#64748b;">Banca: <strong>${c.banca}</strong> • Salário: <strong style="color:#15803d;">${c.salario}</strong></div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" style="padding:7px 12px; font-size:0.78rem;" onclick="window.AprovaComponents.openConcursoModal('${c.id}')">
          📂 Raio-X & Materiais
        </button>
      </div>
    </div>
  `).join('');

  const estudadosHtml = estudadosList.map(m => `
    <div class="mat-item studied">
      <div>
        <span class="badge badge-aberto" style="margin-bottom:4px;">✅ Concluído • ${m.concurso_sigla || m.concurso_id.toUpperCase()}</span>
        <div style="font-weight:800; font-size:0.9rem; color:#0f172a;">${m.titulo}</div>
        <div style="font-size:0.76rem; color:#475569;">Categoria: ${m.categoria} • ${m.paginas}</div>
      </div>
      <button class="btn btn-outline" style="padding:6px 11px; font-size:0.76rem;" onclick="window.AprovaAPI.baixarMaterial(${m.id})">
        📥 Baixar Novamente
      </button>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- Resumo do Usuário e Indicadores de Estudo -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:22px;">
      <div class="concurso-card" style="padding:18px; background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color:#fff;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #38bdf8, #a855f7); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.15rem;">
            ${user.iniciais || 'CL'}
          </div>
          <div>
            <div style="font-size:1.05rem; font-weight:800;">${user.nome}</div>
            <div style="font-size:0.76rem; color:#94a3b8;">${user.email}</div>
            <span class="badge badge-purple" style="margin-top:4px; display:inline-block;">✨ Plano: ${user.plano || 'Gratuito'}</span>
          </div>
        </div>
      </div>

      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">⭐ Concursos Salvos</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#2563eb;">${salvos.length}</strong>
        <span style="font-size:0.78rem; color:#475569;">Monitorados no seu caderno</span>
      </div>

      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">✅ Materiais Concluídos</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#16a34a;">${materiaisResp.estudados}/${materiaisResp.total}</strong>
        <span style="font-size:0.78rem; color:#15803d;">${materiaisResp.progresso_pct}% do acervo estudado</span>
      </div>

      <div class="concurso-card" style="padding:16px;">
        <span style="font-size:0.74rem; font-weight:800; color:#64748b; text-transform:uppercase;">⏱️ Meta de Estudo Semanal</span>
        <strong style="font-size:1.9rem; font-weight:800; color:#7c3aed;">${(user.horas_estudo_dia || 4) * 6}h/sem</strong>
        <span style="font-size:0.78rem; color:#6d28d9;">Foco: Carreira ${user.carreira_foco}</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; align-items:start;">
      <!-- Coluna 1:Editar Perfil & Preferências de Estudo -->
      <div class="concurso-card">
        <div>
          <span class="badge badge-purple" style="margin-bottom:6px;">⚙️ CONFIGURAÇÕES DA CONTA</span>
          <h3 style="font-size:1.15rem; font-weight:800; color:#0f172a; margin-bottom:6px;">
            Meus Dados e Preferências de Estudo
          </h3>
          <p style="font-size:0.82rem; color:#475569; margin-bottom:14px;">
            Suas preferências abaixo calibram automaticamente o <strong>Copiloto & Match IA</strong>.
          </p>

          <form onsubmit="window.AprovaComponents.salvarPerfilUsuario(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div class="field-group">
              <label>Nome Completo</label>
              <input type="text" id="prof-nome" class="field-input" value="${user.nome}" required />
            </div>
            <div class="field-group">
              <label>E-mail da Conta</label>
              <input type="email" class="field-input" value="${user.email}" disabled style="opacity:0.7;" />
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="field-group">
                <label>Carreira Foco</label>
                <select id="prof-carreira" class="field-input">
                  <option value="Policial" ${user.carreira_foco === 'Policial' ? 'selected' : ''}>Policial (PF, PRF)</option>
                  <option value="Bancária" ${user.carreira_foco === 'Bancária' ? 'selected' : ''}>Bancária (Caixa, BB)</option>
                  <option value="Tribunais" ${user.carreira_foco === 'Tribunais' ? 'selected' : ''}>Tribunais (TSE, TJ-SP)</option>
                  <option value="Administrativa" ${user.carreira_foco === 'Administrativa' ? 'selected' : ''}>Administrativa (INSS, CNU)</option>
                  <option value="Fiscal & Controle" ${user.carreira_foco === 'Fiscal & Controle' ? 'selected' : ''}>Fiscal & Controle (Receita)</option>
                  <option value="Ambiental" ${user.carreira_foco === 'Ambiental' ? 'selected' : ''}>Ambiental (IBAMA)</option>
                </select>
              </div>
              <div class="field-group">
                <label>Escolaridade</label>
                <select id="prof-escolaridade" class="field-input">
                  <option value="Superior" ${user.escolaridade === 'Superior' ? 'selected' : ''}>Ensino Superior</option>
                  <option value="Médio" ${user.escolaridade === 'Médio' ? 'selected' : ''}>Ensino Médio</option>
                </select>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div class="field-group">
                <label>UF de Interesse</label>
                <select id="prof-uf" class="field-input">
                  <option value="Nacional" ${user.uf_interesse === 'Nacional' ? 'selected' : ''}>Nacional</option>
                  <option value="SP" ${user.uf_interesse === 'SP' ? 'selected' : ''}>São Paulo (SP)</option>
                  <option value="DF" ${user.uf_interesse === 'DF' ? 'selected' : ''}>Distrito Federal (DF)</option>
                </select>
              </div>
              <div class="field-group">
                <label>Horas de Estudo / Dia</label>
                <select id="prof-horas" class="field-input">
                  <option value="2" ${user.horas_estudo_dia == 2 ? 'selected' : ''}>2 horas/dia</option>
                  <option value="3" ${user.horas_estudo_dia == 3 ? 'selected' : ''}>3 horas/dia</option>
                  <option value="4" ${user.horas_estudo_dia == 4 ? 'selected' : ''}>4 horas/dia</option>
                  <option value="6" ${user.horas_estudo_dia == 6 ? 'selected' : ''}>6 horas/dia</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:4px;">
              💾 Salvar Preferências no Perfil
            </button>
          </form>
        </div>
      </div>

      <!-- Coluna 2: Meus Concursos Salvos e Materiais Concluídos -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="concurso-card">
          <h3 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:10px;">
            ⭐ Meus Concursos Salvos (${salvos.length})
          </h3>
          ${salvosHtml || `<p style="font-size:0.85rem; color:#64748b;">Você ainda não favoritou nenhum concurso. Clique em "☆ Salvar" nos cards da aba Concursos!</p>`}
        </div>

        <div class="concurso-card">
          <h3 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:10px;">
            ✅ Meus Materiais Estudados (${estudadosList.length})
          </h3>
          ${estudadosHtml || `<p style="font-size:0.85rem; color:#64748b;">Nenhum material marcado como concluído ainda. Marque seus PDFs na aba Materiais!</p>`}
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
  window.AprovaUtils.showToast(`✅ ${resp.mensagem}`, '#22c55e');
  window.AprovaComponents.renderHeaderUserWidget();
  window.AprovaComponents.renderUserDashboard();
};
