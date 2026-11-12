/**
 * Componente: Central de Materiais por Concurso (Apostilas PDF, Editais Verticalizados, Provas Passadas)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.estadoMateriais = {
  concursoId: 'todos',
  categoria: 'todas'
};

window.AprovaComponents.renderMateriaisHub = async function (concursoIdOverride, categoriaOverride) {
  if (concursoIdOverride !== undefined) window.AprovaComponents.estadoMateriais.concursoId = concursoIdOverride;
  if (categoriaOverride !== undefined) window.AprovaComponents.estadoMateriais.categoria = categoriaOverride;

  const { concursoId, categoria } = window.AprovaComponents.estadoMateriais;
  const container = document.getElementById('materiais-hub-container');
  if (!container) return;

  const [concursosResp, matResp] = await Promise.all([
    window.AprovaAPI.listarConcursos(),
    window.AprovaAPI.listarMateriais(concursoId, categoria)
  ]);

  const todosConcursos = concursosResp.concursos || [];
  const materiais = matResp.materiais || [];

  const optionsConcursos = [
    `<option value="todos" ${concursoId === 'todos' ? 'selected' : ''}>📚 Todos os Concursos (${todosConcursos.length} editais mapeados)</option>`,
    ...todosConcursos.map(c => `
      <option value="${c.id}" ${concursoId === c.id ? 'selected' : ''}>
        ${c.sigla} — ${c.titulo} (${c.status_label})
      </option>
    `)
  ].join('');

  const categorias = ['todas', 'Edital Verticalizado', 'Apostila PDF', 'Prova Passada + Gabarito', 'Caderno de Questões', 'Mapa Mental'];
  const optionsCategorias = categorias.map(cat => `
    <option value="${cat}" ${categoria === cat ? 'selected' : ''}>
      ${cat === 'todas' ? '🗂️ Todas as Categorias de Material' : cat}
    </option>
  `).join('');

  const rowsHtml = materiais.map(m => {
    return `
      <div class="mat-item ${m.estudado ? 'studied' : ''}">
        <div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:4px;">
            <span class="badge badge-aberto">${m.concurso_sigla || m.concurso_id.toUpperCase()}</span>
            <span class="badge badge-purple">${m.categoria}</span>
            <span style="font-size:0.75rem; color:#64748b;">Banca: <strong>${m.concurso_banca || 'Oficial'}</strong></span>
          </div>
          <div style="font-size:0.96rem; font-weight:800; color:#0f172a;">${m.titulo}</div>
          <div style="font-size:0.79rem; color:#475569;">
            Concurso: <strong>${m.concurso_titulo || m.concurso_id}</strong> • Formato: <strong>${m.formato}</strong> • Extensão: <strong>${m.paginas}</strong>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'}"
            onclick="window.AprovaComponents.alternarEstudoHub(${m.id})"
          >
            ${m.estudado ? '✅ Estudado' : '⬜ Marcar Estudado'}
          </button>
          <button
            type="button"
            class="btn btn-purple"
            onclick="window.AprovaAPI.baixarMaterial(${m.id})"
          >
            📥 Baixar Guia (${m.formato})
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="concurso-card" style="margin-bottom:20px;">
      <div style="display:grid; grid-template-columns: 1.4fr 1fr 1fr; gap:14px; align-items:end;">
        <div class="field-group">
          <label>Filtrar por Concurso Específico</label>
          <select class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(this.value, undefined)">
            ${optionsConcursos}
          </select>
        </div>
        <div class="field-group">
          <label>Tipo de Material de Estudo</label>
          <select class="field-input" onchange="window.AprovaComponents.renderMateriaisHub(undefined, this.value)">
            ${optionsCategorias}
          </select>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px;">
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800; color:#0f172a;">
            <span>SEU PROGRESSO DE ESTUDO</span>
            <span>${matResp.estudados}/${matResp.total} (${matResp.progresso_pct}%)</span>
          </div>
          <div class="thermometer-bar" style="margin:6px 0 0;">
            <div class="thermometer-fill" style="width:${matResp.progresso_pct}%; background:linear-gradient(90deg, #22c55e, #16a34a);"></div>
          </div>
        </div>
      </div>
    </div>

    <div>
      ${rowsHtml || `<div class="concurso-card"><p>Nenhum material encontrado para este filtro.</p></div>`}
    </div>
  `;
};

window.AprovaComponents.alternarEstudoHub = async function (materialId) {
  const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
  window.AprovaUtils.showToast(
    res.estudado ? '✅ Progresso salvo no banco SQLite!' : '⬜ Material marcado como pendente.',
    res.estudado ? '#22c55e' : '#64748b'
  );
  window.AprovaComponents.renderMateriaisHub();
  window.AprovaApp.atualizarTelemetriaTopo();
};

