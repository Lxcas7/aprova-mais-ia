/**
 * Aprova+ IA — REST API Client + Gerenciador de Autenticação, Isolamento por Usuário e Rascunho de Visitante
 * - Em ambiente local com servidor Python (127.0.0.1:8000): consome a API FastAPI + SQLite3 real.
 * - No GitHub Pages (github.io) ou modo estático/offline: utiliza motor em memória com persistência em localStorage e gerador PDF 1.4 local.
 */
(function () {
  const isGitHubPages = window.location.hostname.includes('github.io');
  const API_BASE = (!isGitHubPages && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:8000/api';

  let backendOnline = false;

  const STORAGE_KEY = 'aprova_mais_mvp_state_v3';
  const USER_SESSION_KEY = 'aprova_mais_user_session_v1';
  const GUEST_STATE_KEY = 'aprova_mais_guest_draft_v1';

  function gerarIniciais(nome) {
    const partes = (nome || 'Usuário').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'U';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function getGuestDraft() {
    try {
      const raw = localStorage.getItem(GUEST_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          salvos: Array.isArray(parsed?.salvos) ? parsed.salvos : [],
          estudados: Array.isArray(parsed?.estudados) ? parsed.estudados : []
        };
      }
    } catch (e) {}
    return { salvos: [], estudados: [] };
  }

  function saveGuestDraft(draft) {
    try {
      localStorage.setItem(GUEST_STATE_KEY, JSON.stringify({
        salvos: Array.from(new Set(draft.salvos || [])),
        estudados: Array.from(new Set((draft.estudados || []).map(Number)))
      }));
    } catch (e) {}
  }

  function clearGuestDraft() {
    try {
      localStorage.removeItem(GUEST_STATE_KEY);
    } catch (e) {}
  }

  function hashSenhaLocal(email, senha) {
    const input = `aprovamais:${String(email || '').trim().toLowerCase()}:${String(senha || '')}`;
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (ch + i);
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    h1 ^= h1 >>> 16;
    h2 ^= h2 >>> 15;
    return `local_v1$${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
  }

  function getLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.concursos) && parsed.concursos.length >= 13) {
          parsed.userData = parsed.userData || {};
          if (Array.isArray(parsed.usuarios)) {
            let migrated = false;
            parsed.usuarios = parsed.usuarios.map(u => {
              if (u && typeof u.senha === 'string') {
                const { senha, ...rest } = u;
                migrated = true;
                return { ...rest, senha_hash: rest.senha_hash || hashSenhaLocal(rest.email, senha) };
              }
              return u;
            });
            if (migrated) saveLocalState(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {}
    const initial = {
      concursos: JSON.parse(JSON.stringify(window.AprovaFallback.concursos)),
      rumores: JSON.parse(JSON.stringify(window.AprovaFallback.rumores)),
      usuarios: [
        {
          id: 1,
          nome: 'Carlos Lucas',
          email: 'carlos@aprovamais.com.br',
          senha_hash: hashSenhaLocal('carlos@aprovamais.com.br', '123456'),
          carreira_foco: 'Policial',
          escolaridade: 'Superior',
          uf_interesse: 'Nacional',
          horas_estudo_dia: 4,
          plano: 'Gratuito',
          iniciais: 'CL'
        }
      ],
      userData: {},
      leads: []
    };
    saveLocalState(initial);
    return initial;
  }

  function saveLocalState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function getLocalUserData(st, user) {
    st.userData = st.userData || {};
    const key = String(user.id);
    if (!st.userData[key]) {
      const isDemoUser = user.id === 1 || (user.email || '').toLowerCase() === 'carlos@aprovamais.com.br';
      if (isDemoUser) {
        const salvos = st.concursos.filter(c => c.salvo).map(c => c.id);
        const estudados = [];
        st.concursos.forEach(c => {
          (c.materiais || []).forEach(m => {
            if (m.estudado) estudados.push(m.id);
          });
        });
        st.userData[key] = { salvos, estudados };
      } else {
        st.userData[key] = { salvos: [], estudados: [] };
      }
      saveLocalState(st);
    }
    return st.userData[key];
  }

  function getActiveUserSetsOffline(st) {
    const user = window.AprovaAPI.obterUsuarioAtual();
    if (!user) {
      const g = getGuestDraft();
      return { savedSet: new Set(g.salvos), studiedSet: new Set(g.estudados) };
    }
    const uData = getLocalUserData(st, user);
    return { savedSet: new Set(uData.salvos || []), studiedSet: new Set(uData.estudados || []) };
  }

  function overlayConcursoWithSets(c, savedSet, studiedSet) {
    return {
      ...c,
      salvo: savedSet.has(c.id),
      materiais: (c.materiais || []).map(m => ({
        ...m,
        estudado: studiedSet.has(m.id)
      }))
    };
  }

  function formatApiErrorDetail(detail, status) {
    if (!detail) return `Erro ao processar solicitação (HTTP ${status}).`;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const fieldNames = {
        nome: 'Nome',
        email: 'E-mail',
        senha: 'Senha',
        contato: 'Contato',
        orgao_sigla: 'Sigla do órgão',
        titulo_noticia: 'Resumo da movimentação',
        fonte_portal: 'Fonte documental',
        carreira_foco: 'Carreira foco',
        recurso_favorito: 'Recurso prioritário',
        faixa_preco: 'Modalidade',
        mensagem: 'Mensagem'
      };
      const msgs = detail.map(item => {
        if (typeof item === 'string') return item;
        const loc = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : '';
        const field = fieldNames[loc] || (loc ? String(loc) : 'Campo');
        const rawMsg = String(item?.msg || 'valor inválido');
        const minMatch = rawMsg.match(/at least (\d+) character/i);
        if (minMatch) return `${field} deve ter pelo menos ${minMatch[1]} caracteres.`;
        if (/valid email/i.test(rawMsg)) return `${field}: informe um e-mail válido.`;
        if (/field required/i.test(rawMsg)) return `${field} é obrigatório.`;
        return `${field}: ${rawMsg}`;
      });
      return msgs.join(' ');
    }
    if (typeof detail === 'object') {
      return detail.message || detail.detail || `Erro ao processar solicitação (HTTP ${status}).`;
    }
    return String(detail);
  }

  function updateStatusBadge(isOnline) {
    const badge = document.getElementById('api-conn-badge');
    if (!badge) return;
    if (isOnline) {
      badge.className = 'api-status-badge';
      badge.textContent = 'Sincronizado';
    } else if (isGitHubPages) {
      badge.className = 'api-status-badge';
      badge.textContent = 'Modo Estático (Navegador)';
    } else {
      badge.className = 'api-status-badge offline';
      badge.textContent = 'Modo Local (Offline)';
    }
  }

  async function request(endpoint, options = {}) {
    if (isGitHubPages) {
      throw new Error('GitHub Pages static mode');
    }
    const url = `${API_BASE}${endpoint}`;
    const user = window.AprovaAPI?.obterUsuarioAtual();
    const headers = {
      'Content-Type': 'application/json',
      ...(user && user.id ? { 'X-User-Id': String(user.id) } : {}),
      ...(user && user.token ? { 'Authorization': `Bearer ${user.token}` } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, {
      ...options,
      headers
    });
    if (!res.ok) {
      let errMsg = `Erro HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail !== undefined) {
          errMsg = formatApiErrorDetail(errJson.detail, res.status);
        }
      } catch (_) {}
      const error = new Error(errMsg);
      error.isApiError = true;
      error.status = res.status;
      throw error;
    }
    backendOnline = true;
    updateStatusBadge(true);
    return await res.json();
  }

  // ==================== BUILDER PDF 1.4 PURO (MODO OFFLINE / ESTÁTICO) ====================
  function wrapText(text, width) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let current = '';
    words.forEach(w => {
      if (!w) return;
      if (!current) {
        current = w;
      } else if ((current + ' ' + w).length <= width) {
        current += ' ' + w;
      } else {
        lines.push(current);
        current = w;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  function pdfEscapeWinAnsi(text) {
    const cp1252Extras = {
      0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
      0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
      0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
      0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
      0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
      0x017E: 0x9E, 0x0178: 0x9F
    };
    const norm = String(text || '')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/✓|✔/g, '[X]')
      .replace(/☐/g, '[ ]')
      .replace(/\u00a0/g, ' ')
      .replace(/[\r\n]+/g, ' ');
    let out = '';
    for (let i = 0; i < norm.length; i++) {
      const code = norm.charCodeAt(i);
      let b;
      if (code <= 0xFF) {
        b = code;
      } else if (cp1252Extras[code] !== undefined) {
        b = cp1252Extras[code];
      } else {
        b = 0x3F; // '?'
      }
      if (b === 0x5C) out += '\\\\';
      else if (b === 0x28) out += '\\(';
      else if (b === 0x29) out += '\\)';
      else if (b >= 32 && b <= 126) out += String.fromCharCode(b);
      else if (b >= 128) out += '\\' + b.toString(8).padStart(3, '0');
      else out += ' ';
    }
    return out;
  }

  function buildPdfBlob(concurso, material) {
    const now = new Date();
    const pad2 = n => String(n).padStart(2, '0');
    const dataHoje = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    const blocks = [
      ['title', material.titulo],
      ['subtitle', `${material.categoria}  ·  Disciplina: ${material.disciplina || 'Geral'}  ·  Formato: Roteiro Verticalizado (PDF)`],
      ['spacer', ''],
      ['section', '1. DADOS DO CONCURSO VINCULADO'],
      ['bullet', `Concurso: ${concurso.titulo} (${concurso.sigla})`],
      ['bullet', `Órgão: ${concurso.orgao}`],
      ['bullet', `Status: ${concurso.status_label}  |  Banca: ${concurso.banca}`],
      ['bullet', `Vagas: ${concurso.vagas}  |  Escolaridade: ${concurso.escolaridade}`],
      ['bullet', `Remuneração: ${concurso.salario}`],
      ['bullet', `Inscrições / Situação: ${concurso.prazo || ''}  |  Prova / Previsão: ${concurso.data_prova || ''}`],
      ['bullet', `Corte anterior (${concurso.ultimo_concurso_ano || 'Último Edital'}): ${concurso.nota_corte_anterior || 'Consulte edital'}`],
      ['spacer', ''],
      ['section', '2. RAIO-X E ESTRATÉGIA APROVA+ IA'],
      ['body', concurso.resumo_ia || ''],
      ['bullet', `Fontes monitoradas: ${concurso.fontes_internet || 'Diário Oficial e Banca'}`],
      ['spacer', ''],
      ['section', '3. ESCOPO DESTE ROTEIRO'],
      ['body', material.resumo_conteudo || ''],
      ['spacer', ''],
      ['section', `4. EDITAL VERTICALIZADO E CHECKLIST POR PESO (${concurso.banca})`],
      ['body', 'Marque com [X] conforme concluir Teoria, Revisão e Bateria de Questões:']
    ];

    (concurso.disciplinas || []).forEach((d, idx) => {
      blocks.push([
        'bullet',
        `[ ] ${idx + 1}. ${d.nome} — ${d.questoes} questões (${d.peso}) | Prioridade: ${d.prioridade}`
      ]);
    });

    blocks.push(
      ['spacer', ''],
      ['section', '5. ROTEIRO RECOMENDADO DE EXECUÇÃO'],
      ['bullet', '1) Dedique 70% do seu tempo às disciplinas de Prioridade Crítica e Alta.'],
      ['bullet', `2) Resolva no mínimo 50 questões anteriores da banca ${concurso.banca} por semana.`],
      ['bullet', `3) Refaça a prova anterior (${concurso.ultimo_concurso_ano || 'Último Edital'}) simulando o tempo real.`]
    );

    const lines = [];
    blocks.forEach(([kind, text]) => {
      if (kind === 'spacer') {
        lines.push(['spacer', '', 8]);
      } else if (kind === 'title') {
        wrapText(text, 64).forEach(w => lines.push(['title', w, 18]));
      } else if (kind === 'subtitle') {
        wrapText(text, 84).forEach(w => lines.push(['subtitle', w, 14]));
      } else if (kind === 'section') {
        lines.push(['section', text, 18]);
      } else if (kind === 'body') {
        wrapText(text, 86).forEach(w => lines.push(['body', w, 14]));
      } else if (kind === 'bullet') {
        const wrapped = wrapText(text, 80);
        wrapped.forEach((w, idx) => {
          const skipBullet = w.startsWith('[ ]') || /^[123]\)/.test(w);
          const prefix = idx === 0 && !skipBullet ? '• ' : '  ';
          lines.push(['bullet', `${prefix}${w}`, 14]);
        });
      }
    });

    const pagesCmds = [];
    const bottomLimit = 64;

    function startPage(pageIndex) {
      const cmds = [];
      if (pageIndex === 0) {
        cmds.push('0.063 0.137 0.220 rg');
        cmds.push('0 762 595 80 re f');
        cmds.push(`BT /F2 16 Tf 1 1 1 rg 44 804 Td (${pdfEscapeWinAnsi('APROVA+ IA')}) Tj ET`);
        cmds.push(`BT /F1 10 Tf 0.84 0.89 0.94 rg 44 784 Td (${pdfEscapeWinAnsi('Roteiro de Estudo Verticalizado e Checklist Oficial (PDF)')}) Tj ET`);
        return [cmds, 738];
      }
      cmds.push('0.847 0.835 0.796 RG 0.8 w 44 806 m 551 806 l S');
      cmds.push(`BT /F2 9 Tf 0.067 0.110 0.141 rg 44 814 Td (${pdfEscapeWinAnsi(`APROVA+ IA · ${concurso.sigla} · Roteiro de Estudo`)}) Tj ET`);
      return [cmds, 784];
    }

    let [curCmds, y] = startPage(0);
    lines.forEach(([style, text, lh]) => {
      if (y - lh < bottomLimit) {
        pagesCmds.push(curCmds);
        [curCmds, y] = startPage(pagesCmds.length);
      }
      if (style === 'spacer') {
        y -= lh;
        return;
      }
      if (style === 'title') {
        curCmds.push(`BT /F2 13 Tf 0.067 0.110 0.141 rg 44 ${y} Td (${pdfEscapeWinAnsi(text)}) Tj ET`);
      } else if (style === 'subtitle') {
        curCmds.push(`BT /F1 9.5 Tf 0.290 0.365 0.439 rg 44 ${y} Td (${pdfEscapeWinAnsi(text)}) Tj ET`);
      } else if (style === 'section') {
        curCmds.push(`0.043 0.310 0.424 RG 0.8 w 44 ${y - 3} m 551 ${y - 3} l S`);
        curCmds.push(`BT /F2 10.5 Tf 0.043 0.310 0.424 rg 44 ${y + 2} Td (${pdfEscapeWinAnsi(text)}) Tj ET`);
        y -= 4;
      } else {
        curCmds.push(`BT /F1 10 Tf 0.176 0.243 0.306 rg 44 ${y} Td (${pdfEscapeWinAnsi(text)}) Tj ET`);
      }
      y -= lh;
    });
    pagesCmds.push(curCmds);

    const totalPages = pagesCmds.length;
    pagesCmds.forEach((cmds, idx) => {
      cmds.push('0.847 0.835 0.796 RG 0.6 w 44 46 m 551 46 l S');
      const footer = `Aprova+ IA · Gerado em ${dataHoje}   |   Página ${idx + 1} de ${totalPages}`;
      cmds.push(`BT /F1 8.5 Tf 0.290 0.365 0.439 rg 44 32 Td (${pdfEscapeWinAnsi(footer)}) Tj ET`);
    });

    const pageObjIds = pagesCmds.map((_, i) => 5 + i * 2);
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${totalPages} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
    ];

    pagesCmds.forEach((cmds, i) => {
      const contentId = 6 + i * 2;
      const streamStr = cmds.join('\n') + '\n';
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      objects.push(`<< /Length ${streamStr.length} >>\nstream\n${streamStr}endstream`);
    });

    const encoder = new TextEncoder();
    const parts = [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])];
    let byteLen = parts[0].length;
    const offsets = [0];

    objects.forEach((body, idx) => {
      offsets.push(byteLen);
      const chunk = encoder.encode(`${idx + 1} 0 obj\n${body}\nendobj\n`);
      parts.push(chunk);
      byteLen += chunk.length;
    });

    const xrefPos = byteLen;
    let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(off => {
      xrefStr += `${String(off).padStart(10, '0')} 00000 n \n`;
    });
    xrefStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    parts.push(encoder.encode(xrefStr));

    return new Blob(parts, { type: 'application/pdf' });
  }

  function safeFilenamePart(str) {
    return String(str || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Roteiro';
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.AprovaAPI = {
    getBaseUrl() {
      return API_BASE;
    },

    isBackendOnline() {
      return backendOnline;
    },

    obterRascunhoVisitante() {
      return getGuestDraft();
    },

    // ==================== AUTENTICAÇÃO E SESSÃO DO USUÁRIO ====================
    obterUsuarioAtual() {
      try {
        const raw = localStorage.getItem(USER_SESSION_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    },

    salvarSessaoUsuario(usuario) {
      try {
        if (!usuario.iniciais) usuario.iniciais = gerarIniciais(usuario.nome);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(usuario));
      } catch (e) {}
      return usuario;
    },

    logoutUsuario() {
      try {
        localStorage.removeItem(USER_SESSION_KEY);
      } catch (e) {}
    },

    async sincronizarRascunhoVisitante() {
      const user = this.obterUsuarioAtual();
      const draft = getGuestDraft();
      if (!user || (!draft.salvos.length && !draft.estudados.length)) {
        return { salvos_sincronizados: 0, estudados_sincronizados: 0 };
      }
      try {
        const resp = await request(`/auth/usuarios/${user.id}/sincronizar-rascunho`, {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        clearGuestDraft();
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const uData = getLocalUserData(st, user);
        const sSet = new Set(uData.salvos || []);
        const eSet = new Set(uData.estudados || []);
        draft.salvos.forEach(id => sSet.add(id));
        draft.estudados.forEach(id => eSet.add(Number(id)));
        uData.salvos = Array.from(sSet);
        uData.estudados = Array.from(eSet);
        saveLocalState(st);
        clearGuestDraft();
        return { salvos_sincronizados: draft.salvos.length, estudados_sincronizados: draft.estudados.length };
      }
    },

    async loginUsuario(email, senha) {
      try {
        const resp = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, senha })
        });
        this.salvarSessaoUsuario(resp.usuario);
        await this.sincronizarRascunhoVisitante();
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const emailLimpo = (email || '').trim().toLowerCase();
        const expectedHash = hashSenhaLocal(emailLimpo, senha);
        const user = (st.usuarios || []).find(
          u => u.email.toLowerCase() === emailLimpo && (u.senha_hash ? u.senha_hash === expectedHash : u.senha === senha)
        );
        if (!user) {
          throw new Error('E-mail ou senha incorretos. Utilize a conta de demonstração ou crie uma conta gratuita.');
        }
        const { senha: _, senha_hash: _sh, ...userSemSenha } = user;
        userSemSenha.iniciais = gerarIniciais(userSemSenha.nome);
        userSemSenha.token = userSemSenha.token || `local.${userSemSenha.id}.${Date.now()}`;
        this.salvarSessaoUsuario(userSemSenha);
        await this.sincronizarRascunhoVisitante();
        return {
          sucesso: true,
          mensagem: `Sessão iniciada: ${userSemSenha.nome}.`,
          usuario: userSemSenha
        };
      }
    },

    async registrarUsuario(payload) {
      try {
        const resp = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        this.salvarSessaoUsuario(resp.usuario);
        await this.sincronizarRascunhoVisitante();
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        st.usuarios = st.usuarios || [];
        const emailLimpo = (payload.email || '').trim().toLowerCase();
        if (st.usuarios.some(u => u.email.toLowerCase() === emailLimpo)) {
          throw new Error('Este e-mail já está cadastrado na plataforma.');
        }
        const novoId = Date.now();
        const novo = {
          id: novoId,
          nome: payload.nome.trim(),
          email: emailLimpo,
          senha_hash: hashSenhaLocal(emailLimpo, payload.senha),
          carreira_foco: payload.carreira_foco || 'Policial',
          escolaridade: payload.escolaridade || 'Superior',
          uf_interesse: payload.uf_interesse || 'Nacional',
          horas_estudo_dia: parseInt(payload.horas_estudo_dia || 4, 10),
          plano: 'Gratuito',
          iniciais: gerarIniciais(payload.nome)
        };
        st.usuarios.push(novo);
        saveLocalState(st);
        const { senha_hash: _sh, ...userSemSenha } = novo;
        userSemSenha.token = `local.${novoId}.${Date.now()}`;
        this.salvarSessaoUsuario(userSemSenha);
        await this.sincronizarRascunhoVisitante();
        return {
          sucesso: true,
          mensagem: `Conta criada com sucesso para ${novo.nome}.`,
          usuario: userSemSenha
        };
      }
    },

    async atualizarPerfilUsuario(payload) {
      const atual = this.obterUsuarioAtual();
      if (!atual) throw new Error('Faça login para atualizar seu perfil.');

      try {
        const resp = await request(`/auth/usuarios/${atual.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        this.salvarSessaoUsuario(resp.usuario);
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        st.usuarios = st.usuarios || [];
        const idx = st.usuarios.findIndex(u => u.id === atual.id || u.email === atual.email);
        const atualizado = {
          ...atual,
          nome: payload.nome.trim(),
          carreira_foco: payload.carreira_foco,
          escolaridade: payload.escolaridade,
          uf_interesse: payload.uf_interesse,
          horas_estudo_dia: parseInt(payload.horas_estudo_dia || 4, 10),
          plano: payload.plano || atual.plano || 'Gratuito',
          iniciais: gerarIniciais(payload.nome)
        };
        if (idx >= 0) {
          st.usuarios[idx] = { ...st.usuarios[idx], ...atualizado };
          saveLocalState(st);
        }
        this.salvarSessaoUsuario(atualizado);
        return {
          sucesso: true,
          mensagem: 'Parâmetros de perfil e estudo atualizados.',
          usuario: atualizado
        };
      }
    },

    // ==================== CONCURSOS, MATERIAIS, RADAR E IA ====================
    async checkHealth() {
      try {
        return await request('/health');
      } catch (e) {
        backendOnline = false;
        updateStatusBadge(false);
        return { status: isGitHubPages ? 'github_pages' : 'offline' };
      }
    },

    async listarConcursos(params = {}) {
      const user = this.obterUsuarioAtual();
      try {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', params.status);
        if (params.area) qs.set('area', params.area);
        if (params.escolaridade) qs.set('escolaridade', params.escolaridade);
        if (params.uf) qs.set('uf', params.uf);
        if (params.q) qs.set('q', params.q);
        if (user && params.apenas_salvos) qs.set('apenas_salvos', 'true');

        const resp = await request(`/concursos?${qs.toString()}`);
        if (!user) {
          const g = getGuestDraft();
          const savedSet = new Set(g.salvos);
          const studiedSet = new Set(g.estudados);
          const hydrated = (resp.concursos || []).map(c => overlayConcursoWithSets(c, savedSet, studiedSet));
          return {
            resumo: {
              ...(resp.resumo || {}),
              salvos: savedSet.size
            },
            concursos: params.apenas_salvos ? hydrated.filter(c => c.salvo) : hydrated
          };
        }
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        backendOnline = false;
        updateStatusBadge(false);
        const st = getLocalState();
        const { savedSet, studiedSet } = getActiveUserSetsOffline(st);
        const all = st.concursos.map(c => overlayConcursoWithSets(c, savedSet, studiedSet));
        const list = all.filter(c => {
          if (params.apenas_salvos && !c.salvo) return false;
          if (params.status && params.status !== 'todos' && c.status !== params.status) return false;
          if (params.area && params.area !== 'todas' && c.area.toLowerCase() !== params.area.toLowerCase()) return false;
          if (params.escolaridade && params.escolaridade !== 'todos' && !c.escolaridade.toLowerCase().includes(params.escolaridade.toLowerCase())) return false;
          if (params.uf && params.uf !== 'todas' && c.uf.toLowerCase() !== params.uf.toLowerCase()) return false;
          if (params.q && !`${c.sigla} ${c.titulo} ${c.orgao} ${c.banca} ${c.area} ${c.resumo_ia}`.toLowerCase().includes(params.q.toLowerCase())) return false;
          return true;
        });
        return {
          resumo: {
            total: all.length,
            abertos: all.filter(x => x.status === 'aberto').length,
            previstos: all.filter(x => x.status === 'previsto').length,
            encerrados: all.filter(x => x.status === 'encerrado').length,
            salvos: savedSet.size,
            vagas_abertas: all.filter(x => x.status === 'aberto').reduce((acc, x) => acc + (x.vagas_num || 0), 0)
          },
          concursos: list
        };
      }
    },

    async obterConcurso(id) {
      const user = this.obterUsuarioAtual();
      try {
        const c = await request(`/concursos/${id}`);
        if (!user) {
          const g = getGuestDraft();
          return overlayConcursoWithSets(c, new Set(g.salvos), new Set(g.estudados));
        }
        return c;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const found = st.concursos.find(c => c.id === id);
        if (!found) return null;
        const { savedSet, studiedSet } = getActiveUserSetsOffline(st);
        return overlayConcursoWithSets(found, savedSet, studiedSet);
      }
    },

    async alternarFavorito(id) {
      const user = this.obterUsuarioAtual();
      if (!user) {
        const g = getGuestDraft();
        const set = new Set(g.salvos);
        let salvo;
        if (set.has(id)) {
          set.delete(id);
          salvo = false;
        } else {
          set.add(id);
          salvo = true;
        }
        saveGuestDraft({ salvos: Array.from(set), estudados: g.estudados });
        return { id, salvo, isGuest: true };
      }

      try {
        return await request(`/concursos/${id}/favorito`, { method: 'POST' });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const uData = getLocalUserData(st, user);
        const set = new Set(uData.salvos || []);
        let salvo;
        if (set.has(id)) {
          set.delete(id);
          salvo = false;
        } else {
          set.add(id);
          salvo = true;
        }
        uData.salvos = Array.from(set);
        saveLocalState(st);
        return { id, salvo };
      }
    },

    async listarMateriais(concursoId = 'todos', categoria = 'todas') {
      const user = this.obterUsuarioAtual();
      try {
        const qs = new URLSearchParams({ concurso_id: concursoId, categoria });
        const resp = await request(`/materiais?${qs.toString()}`);
        if (!user) {
          const g = getGuestDraft();
          const studiedSet = new Set(g.estudados);
          const mats = (resp.materiais || []).map(m => ({ ...m, estudado: studiedSet.has(m.id) }));
          const est = mats.filter(x => x.estudado).length;
          return {
            total: mats.length,
            estudados: est,
            progresso_pct: mats.length ? Math.round((est / mats.length) * 1000) / 10 : 0,
            materiais: mats
          };
        }
        return resp;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const { studiedSet } = getActiveUserSetsOffline(st);
        let mats = [];
        st.concursos.forEach(c => {
          if (concursoId === 'todos' || c.id === concursoId) {
            c.materiais.forEach(m => {
              if (categoria === 'todas' || m.categoria === categoria) {
                mats.push({
                  ...m,
                  estudado: studiedSet.has(m.id),
                  concurso_id: c.id,
                  concurso_titulo: c.titulo,
                  concurso_sigla: c.sigla,
                  concurso_status: c.status,
                  concurso_banca: c.banca
                });
              }
            });
          }
        });
        const est = mats.filter(x => x.estudado).length;
        return {
          total: mats.length,
          estudados: est,
          progresso_pct: mats.length ? Math.round((est / mats.length) * 1000) / 10 : 0,
          materiais: mats
        };
      }
    },

    async alternarMaterialEstudado(materialId) {
      const user = this.obterUsuarioAtual();
      const mid = Number(materialId);
      if (!user) {
        const g = getGuestDraft();
        const set = new Set((g.estudados || []).map(Number));
        let estudado;
        if (set.has(mid)) {
          set.delete(mid);
          estudado = false;
        } else {
          set.add(mid);
          estudado = true;
        }
        saveGuestDraft({ salvos: g.salvos, estudados: Array.from(set) });
        return { id: mid, estudado, isGuest: true };
      }

      try {
        return await request(`/materiais/${mid}/estudado`, { method: 'POST' });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const uData = getLocalUserData(st, user);
        const set = new Set((uData.estudados || []).map(Number));
        let estudado;
        if (set.has(mid)) {
          set.delete(mid);
          estudado = false;
        } else {
          set.add(mid);
          estudado = true;
        }
        uData.estudados = Array.from(set);
        saveLocalState(st);
        return { id: mid, estudado };
      }
    },

    async obterPreviewMaterial(materialId) {
      try {
        return await request(`/materiais/${materialId}/preview`);
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        let matEncontrado = null;
        let concEncontrado = null;
        st.concursos.forEach(c => {
          c.materiais.forEach(m => {
            if (m.id === Number(materialId)) {
              matEncontrado = m;
              concEncontrado = c;
            }
          });
        });
        if (!matEncontrado || !concEncontrado) {
          throw new Error('Material não encontrado para pré-visualização.');
        }
        const banca = concEncontrado.banca || 'Oficial';
        const ultimoAno = concEncontrado.ultimo_concurso_ano || 'Último Edital';
        return {
          id: matEncontrado.id,
          titulo: matEncontrado.titulo,
          categoria: matEncontrado.categoria,
          disciplina: matEncontrado.disciplina || 'Geral',
          formato: 'Roteiro Verticalizado (PDF)',
          concurso_id: concEncontrado.id,
          concurso_sigla: concEncontrado.sigla,
          concurso_titulo: concEncontrado.titulo,
          orgao: concEncontrado.orgao,
          banca,
          salario: concEncontrado.salario,
          vagas: concEncontrado.vagas,
          status_label: concEncontrado.status_label,
          prazo: concEncontrado.prazo,
          data_prova: concEncontrado.data_prova,
          nota_corte_anterior: concEncontrado.nota_corte_anterior || 'Consulte edital',
          ultimo_concurso_ano: ultimoAno,
          fontes_internet: concEncontrado.fontes_internet || 'Diário Oficial e Banca',
          resumo_conteudo: matEncontrado.resumo_conteudo || '',
          resumo_ia: concEncontrado.resumo_ia || '',
          disciplinas: concEncontrado.disciplinas || [],
          passos_estudo: [
            'Dedique 70% do tempo às disciplinas marcadas com Prioridade Crítica e Alta.',
            `Resolva no mínimo 50 questões recentes da banca ${banca} por semana.`,
            `Refaça a prova anterior (${ultimoAno}) simulando o tempo oficial.`
          ]
        };
      }
    },

    async baixarMaterial(materialId) {
      const mid = Number(materialId);
      if (backendOnline && !isGitHubPages) {
        try {
          const res = await fetch(`${API_BASE}/materiais/${mid}/download`);
          if (!res.ok) {
            let errMsg = `Não foi possível baixar o PDF (HTTP ${res.status}).`;
            try {
              const errJson = await res.json();
              if (errJson?.detail) errMsg = formatApiErrorDetail(errJson.detail, res.status);
            } catch (_) {}
            window.AprovaUtils.showToast(errMsg, { variant: 'error' });
            return;
          }
          const blob = await res.blob();
          const disp = res.headers.get('Content-Disposition') || '';
          const match = disp.match(/filename="?([^";]+)"?/i);
          const filename = match ? match[1] : `AprovaMais_Material_${mid}.pdf`;
          triggerBlobDownload(blob, filename);
          window.AprovaUtils.showToast('Roteiro verticalizado em PDF baixado.');
          setTimeout(() => window.AprovaApp.atualizarIndicadoresUsuario(), 500);
          return;
        } catch (e) {
          // Segue para fallback PDF local apenas em erro de rede
        }
      }

      const st = getLocalState();
      let matEncontrado = null;
      let concEncontrado = null;
      st.concursos.forEach(c => {
        c.materiais.forEach(m => {
          if (m.id === mid) {
            matEncontrado = m;
            concEncontrado = c;
          }
        });
      });

      if (!matEncontrado || !concEncontrado) {
        window.AprovaUtils.showToast('Material não encontrado para download.', { variant: 'error' });
        return;
      }

      const pdfBlob = buildPdfBlob(concEncontrado, matEncontrado);
      const filename = `AprovaMais_${safeFilenamePart(concEncontrado.sigla)}_${safeFilenamePart(matEncontrado.categoria)}_${mid}.pdf`;
      triggerBlobDownload(pdfBlob, filename);

      window.AprovaUtils.showToast(`Roteiro em PDF "${matEncontrado.titulo}" baixado.`);
      window.AprovaApp.atualizarIndicadoresUsuario();
    },

    async listarRumores() {
      try {
        return await request('/radar');
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        return { total: st.rumores.length, rumores: st.rumores };
      }
    },

    async enviarRumor(payload) {
      try {
        return await request('/radar', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const txt = `${payload.titulo_noticia} ${payload.fonte_portal}`.toLowerCase();
        let confianca = 64;
        let estagio = 'Rumor Inicial em Verificação';
        if (txt.includes('banca') || txt.includes('dispensa') || txt.includes('contrato')) {
          confianca = 91;
          estagio = 'Banca em Contratação / Edital Iminente';
        } else if (txt.includes('comissão') || txt.includes('comissao') || txt.includes('autorizado') || txt.includes('portaria')) {
          confianca = 84;
          estagio = 'Comissão Formada / Autorizado';
        } else if (txt.includes('pedido') || txt.includes('mgi') || txt.includes('vagas')) {
          confianca = 74;
          estagio = 'Solicitação Enviada ao Ministério';
        }
        const novo = {
          id: Date.now(),
          concurso_id: 'geral',
          orgao_sigla: payload.orgao_sigla.toUpperCase(),
          titulo_noticia: payload.titulo_noticia,
          fonte_portal: payload.fonte_portal,
          data_captura: 'Enviado agora (Cocriação)',
          estagio_maturidade: estagio,
          confianca_ia: confianca,
          analise_ia: `Notícia classificada automaticamente como "${estagio}" (${confianca}% de confiança).`,
          votos_comunidade: 1
        };
        st.rumores.unshift(novo);
        saveLocalState(st);
        return { ...novo, mensagem: 'Movimentação classificada e registrada no Radar.' };
      }
    },

    async votarRumor(rumorId) {
      try {
        return await request(`/radar/${rumorId}/votar`, { method: 'POST' });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const r = st.rumores.find(x => x.id === rumorId);
        if (r) r.votos_comunidade++;
        saveLocalState(st);
        return { id: rumorId, votos_comunidade: r ? r.votos_comunidade : 1 };
      }
    },

    async enviarChatIA(mensagem) {
      try {
        return await request('/ia/chat', { method: 'POST', body: JSON.stringify({ mensagem }) });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const q = mensagem.toLowerCase();
        for (const c of st.concursos) {
          if (q.includes(c.sigla.toLowerCase()) || q.includes(c.id.split('-')[0]) || q.includes(c.titulo.toLowerCase().split(' ')[0])) {
            const topDisc = (c.disciplinas || []).slice(0, 3).map(d => `<strong>${d.nome}</strong> (${d.peso})`).join(', ');
            return {
              resposta: `<strong>Raio-X Técnico · ${c.sigla} (${c.titulo}):</strong><br>• <strong>Status:</strong> ${c.status_label} (Índice IA: ${c.prob_ia || 100}%)<br>• <strong>Banca:</strong> ${c.banca} · <strong>Remuneração:</strong> ${c.salario}<br>• <strong>Corte anterior (${c.ultimo_concurso_ano}):</strong> ${c.nota_corte_anterior}<br>• <strong>Parecer IA:</strong> ${c.resumo_ia}<br>• <strong>Disciplinas nucleares:</strong> ${topDisc}.<br>• <strong>Acervo vinculado:</strong> ${c.materiais.length} guias disponíveis para estudo imediato.`,
              concurso_sugerido: c.id
            };
          }
        }
        if (q.includes('médio') || q.includes('medio')) {
          const medios = st.concursos.filter(c => c.escolaridade.includes('Médio'));
          const lista = medios.map(c => `• <strong>[${c.sigla}] ${c.titulo}</strong> · ${c.salario} (${c.banca})`).join('<br>');
          return {
            resposta: `<strong>Concursos compatíveis com Ensino Médio (${medios.length} mapeados):</strong><br>${lista}<br><br><strong>Recomendação técnica:</strong> Para edital aberto imediato, priorize <strong>Caixa Econômica Federal</strong> ou <strong>Correios</strong>. Para preparação antecipada de pré-edital, priorize <strong>Banco do Brasil (92% IA)</strong> ou <strong>INSS (88% IA)</strong>.`,
            concurso_sugerido: 'caixa-2026'
          };
        }
        return {
          resposta: `<strong>Síntese da Base Aprova+ IA:</strong> Monitoramos <strong>5 concursos com edital aberto</strong> (PF, Caixa, TSE, Correios, IBAMA · 9.625 vagas), <strong>4 previstos por movimentações na internet</strong> (Banco do Brasil 92%, INSS 88%, PRF 79%, Receita Federal 71%) e <strong>4 históricos com provas comentadas</strong> (CNU, TJ-SP, BACEN, CGU). Informe a sigla de um órgão (ex.: PF, Caixa, INSS, BB, RFB) para consultar a matriz de disciplinas e o acervo.`,
          concurso_sugerido: 'pf-2026'
        };
      }
    },

    async calcularMatchPerfil(payload) {
      try {
        return await request('/ia/match-perfil', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        const horasDia = Math.max(1, Math.min(16, Number(payload.horas_por_dia || 4)));
        const diasSem = Math.max(1, Math.min(7, Number(payload.dias_por_semana || 6)));
        const horasSem = horasDia * diasSem;
        const candidatos = st.concursos
          .filter(c => {
            if (payload.escolaridade === 'Médio' && !c.escolaridade.includes('Médio')) return false;
            if (payload.foco_status && payload.foco_status !== 'todos' && c.status !== payload.foco_status) return false;
            return true;
          })
          .map(c => {
            let score = 62;
            const motivos = [];
            if (c.area.toLowerCase() === (payload.area_interesse || '').toLowerCase()) {
              score += 22;
              motivos.push(`Carreira ${c.area} alinhada ao seu objetivo`);
            }
            if (c.escolaridade.includes(payload.escolaridade || 'Superior')) {
              score += 12;
              motivos.push(`Compatível com escolaridade (${c.escolaridade})`);
            }
            if (horasDia >= 4 && c.salario_max >= 10000) {
              score += 8;
              motivos.push('Carga horária compatível com edital de alta complexidade');
            }
            const discs = c.disciplinas || [];
            const totalQuestoes = discs.reduce((acc, d) => acc + Math.max(Number(d.questoes) || 1, 1), 0) || 1;
            let acumulado = 0;
            const planoSemanal = discs.map((d, idx) => {
              let fatia;
              if (idx === discs.length - 1) {
                fatia = Math.round(Math.max(0, horasSem - acumulado) * 10) / 10;
              } else {
                const qVal = Math.max(Number(d.questoes) || 1, 1);
                fatia = Math.round(horasSem * (qVal / totalQuestoes) * 10) / 10;
                acumulado += fatia;
              }
              return {
                disciplina: d.nome,
                prioridade: d.prioridade,
                peso: d.peso,
                horas_semanais: fatia,
                horas_semana: `${fatia}h/sem`
              };
            });
            return {
              id: c.id,
              sigla: c.sigla,
              titulo: c.titulo,
              status: c.status,
              status_label: c.status_label,
              banca: c.banca,
              salario: c.salario,
              vagas: c.vagas,
              match_score: Math.min(score, 98),
              motivos: motivos.length ? motivos : ['Oportunidade compatível com os parâmetros informados'],
              plano_semanal: planoSemanal
            };
          })
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 4);

        return {
          perfil_analisado: {
            escolaridade: payload.escolaridade,
            area: payload.area_interesse,
            horas_por_dia: horasDia,
            dias_por_semana: diasSem,
            horas_semanais_uteis: horasSem
          },
          top_recomendacoes: candidatos
        };
      }
    },

    async cadastrarLeadPremium(payload) {
      try {
        const res = await request('/mvp/leads-premium', { method: 'POST', body: JSON.stringify(payload) });
        const user = this.obterUsuarioAtual();
        if (user) {
          user.plano = 'Acesso Prioritário PRO';
          this.salvarSessaoUsuario(user);
        }
        return res;
      } catch (e) {
        if (e.isApiError) throw e;
        const st = getLocalState();
        st.leads.unshift(payload);
        saveLocalState(st);
        const user = this.obterUsuarioAtual();
        if (user) {
          user.plano = 'Acesso Prioritário PRO';
          this.salvarSessaoUsuario(user);
        }
        return {
          id: st.leads.length,
          sucesso: true,
          mensagem: `Inscrição prioritária confirmada para ${payload.nome}. Recurso selecionado: ${payload.recurso_favorito}.`
        };
      }
    }
  };
})();
