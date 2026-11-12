/**
 * Componente: Modal de Raio-X Completo do Concurso, Disciplinas por Peso e Checklist de Materiais
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.openConcursoModal = async function (concursoId) {
  const modal = document.getElementById('concurso-modal');
  const content = document.getElementById('concurso-modal-body');
  if (!modal || !content) return;

  modal.classList.add('open');
  content.innerHTML = `<div style="padding:32px; text-align:center; color:#64748b;">🔄 Carregando Raio-X da IA e materiais vinculados do banco de dados...</div>`;

  const c = await window.AprovaAPI.obterConcurso(concursoId);
  if (!c) return;

  const badgeClass = window.AprovaUtils.getStatusBadgeClass(c.status);
  const statusDot = window.AprovaUtils.getStatusDot(c.status);

  const disciplinasRows = (c.disciplinas || []).map(d => {
    const prioColor = d.prioridade === 'Crítica' ? '#dc2626' : (d.prioridade === 'Alta' ? '#d97706' : '#2563eb');
    return `
      <tr>
        <td><strong>${d.nome}</strong></td>
        <td>${d.questoes}</td>
        <td><strong>${d.peso}</strong></td>
        <td><span style="color:${prioColor}; font-weight:800;">● ${d.prioridade}</span></td>
      </tr>
    `;
  }).join('');

  const materiaisHtml = (c.materiais || []).map(m => {
    return `
      <div class="mat-item ${m.estudado ? 'studied' : ''}" id="modal-mat-${m.id}">
        <div>
          <span class="badge badge-purple" style="margin-bottom:4px;">${m.categoria}</span>
          <div style="font-weight:800; font-size:0.92rem; color:#0f172a;">${m.titulo}</div>
          <div style="font-size:0.78rem; color:#64748b;">
            Formato: <strong>${m.formato}</strong> • Extensão: <strong>${m.paginas}</strong> • Acesso: <strong style="color:#15803d;">${m.gratuito ? 'Gratuito no MVP' : 'PRO'}</strong>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button
            class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'}"
            style="padding:7px 12px; font-size:0.8rem;"
            onclick="window.AprovaComponents.toggleEstudadoNoModal(${m.id}, '${c.id}')"
          >
            ${m.estudado ? '✅ Concluído' : '⬜ Marcar Estudado'}
          </button>
          <button
            type="button"
            class="btn btn-purple"
            style="padding:7px 12px; font-size:0.8rem;"
            onclick="window.AprovaAPI.baixarMaterial(${m.id})"
          >
            📥 Baixar Guia / Material
          </button>
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div style="padding-right:34px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
        <span class="badge ${badgeClass}">${statusDot} ${c.status_label}</span>
        <span class="badge badge-purple">Área: ${c.area}</span>
        <span class="badge badge-encerrado">Probabilidade/Índice IA: ${c.probabilidade_ia}%</span>
      </div>
      <h2 style="font-size:1.45rem; font-weight:800; color:#0f172a;">${c.sigla} — ${c.titulo}</h2>
      <p style="font-size:0.88rem; color:#475569; margin-bottom:14px;">
        Órgão: <strong>${c.orgao}</strong> • Banca: <strong>${c.banca}</strong> • Cargos: <strong>${c.cargos}</strong>
      </p>
    </div>

    <div class="meta-box" style="grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));">
      <div class="meta-item"><span>Salário Inicial</span><strong style="color:#15803d;">${c.salario}</strong></div>
      <div class="meta-item"><span>Vagas Totais</span><strong>${c.vagas}</strong></div>
      <div class="meta-item"><span>Inscrições / Status</span><strong>${c.inscricoes}</strong></div>
      <div class="meta-item"><span>Prova / Previsão</span><strong>${c.data_prova}</strong></div>
      <div class="meta-item"><span>Nota de Corte Histórica</span><strong>${c.nota_corte_historica}</strong></div>
      <div class="meta-item"><span>Fonte Oficial / Radar</span><strong>${c.fonte_oficial}</strong></div>
    </div>

    <div class="ai-callout" style="margin:16px 0;">
      <div class="ai-callout-head">
        <span>🤖 DIAGNÓSTICO DE INTELIGÊNCIA ARTIFICIAL & RADAR WEB</span>
        <span>Última prova base: ${c.ultima_prova}</span>
      </div>
      <p style="font-size:0.88rem; color:#0f172a; margin-bottom:6px;"><strong>Análise IA:</strong> ${c.resumo_ia}</p>
      <p style="font-size:0.82rem; color:#475569;"><strong>Rumor / Monitoramento Web:</strong> ${c.tendencia_rumor}</p>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="font-size:1rem; font-weight:800; margin-bottom:8px; color:#0f172a;">
        📊 Matriz de Disciplinas & Pesos Extraída pela IA (Edital Verticalizado)
      </h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Disciplina / Bloco Temático</th>
              <th>Qtd. Questões / Itens</th>
              <th>Peso na Nota</th>
              <th>Prioridade Recomendada IA</th>
            </tr>
          </thead>
          <tbody>
            ${disciplinasRows}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <h3 style="font-size:1rem; font-weight:800; color:#0f172a;">
          📚 Materiais de Estudo Relacionados a Este Concurso (${(c.materiais || []).length})
        </h3>
        <span style="font-size:0.78rem; color:#64748b;">Clique em "Baixar Guia / Material" para gerar o arquivo real no servidor Python</span>
      </div>
      ${materiaisHtml}
    </div>
  `;
};

window.AprovaComponents.closeConcursoModal = function () {
  const modal = document.getElementById('concurso-modal');
  if (modal) modal.classList.remove('open');
};

window.AprovaComponents.toggleEstudadoNoModal = async function (materialId, concursoId) {
  const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
  window.AprovaUtils.showToast(
    res.estudado ? '✅ Material marcado como estudado no SQLite!' : '⬜ Material desmarcado.',
    res.estudado ? '#22c55e' : '#64748b'
  );
  await window.AprovaComponents.openConcursoModal(concursoId);
  window.AprovaApp.carregarConcursos();
  window.AprovaApp.atualizarTelemetriaTopo();
};

