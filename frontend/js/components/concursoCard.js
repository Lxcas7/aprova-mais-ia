/**
 * Tela 6: Card de Concurso (Concurso-Alvo Ativo + Sinergia de Editais + Resolver Prova)
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.computeSynergyPct = function (concurso, alvoObj) {
  if (!alvoObj || concurso.id === alvoObj.id) return 100;
  let score = 38;
  if (concurso.area === alvoObj.area) score += 28;
  const bancaC = (concurso.banca || '').split(' ')[0].toLowerCase();
  const bancaA = (alvoObj.banca || '').split(' ')[0].toLowerCase();
  if (bancaC && bancaA && bancaC === bancaA) score += 16;
  const targetDiscs = (alvoObj.disciplinas || []).map(d => d.nome.toLowerCase());
  const curDiscs = (concurso.disciplinas || []).map(d => d.nome.toLowerCase());
  const sharedWords = ['portuguesa', 'informática', 'administrativo', 'constitucional', 'raciocínio', 'contabilidade', 'bancários'];
  sharedWords.forEach(w => {
    if (targetDiscs.some(td => td.includes(w)) && curDiscs.some(cd => cd.includes(w))) {
      score += 6;
    }
  });
  return Math.min(96, score);
};

window.AprovaComponents.renderConcursoCard = function (concurso, alvoObj = null) {
  const utils = window.AprovaUtils;
  const safe = (v) => utils.safeText(v);
  const esc = (v) => utils.escapeHtml(v);
  const badgeClass = utils.getStatusBadgeClass(concurso.status);
  const statusDot = utils.getStatusDot(concurso.status);
  const shortStatus = utils.getShortStatusLabel(concurso.status);
  const heading = utils.formatConcursoHeading(concurso.sigla, concurso.titulo);
  const isTarget = Boolean(alvoObj && alvoObj.id === concurso.id);
  const synergy = window.AprovaComponents.computeSynergyPct(concurso, alvoObj);

  const probVal = concurso.probabilidade_ia || concurso.prob_ia || 100;
  const inscrVal = concurso.inscricoes || concurso.prazo || 'Consulte o edital';
  const safeId = esc(concurso.id);

  return `
    <article class="concurso-card ${isTarget ? 'is-target' : ''}">
      <div>
        <div class="dossier-header" style="margin-bottom:8px;">
          <h3 class="dossier-title">${heading}</h3>
          <button
            type="button"
            class="btn ${concurso.salvo ? 'btn-primary' : 'btn-outline'} btn-sm"
            aria-pressed="${concurso.salvo ? 'true' : 'false'}"
            onclick="window.AprovaApp.toggleFavorito('${safeId}')"
            title="${concurso.salvo ? 'Remover dos salvos' : 'Salvar concurso'}"
          >
            ${concurso.salvo ? utils.icon('bookmarkFilled') : utils.icon('bookmark')}
          </button>
        </div>

        <p class="dossier-subtitle" style="margin-bottom:10px;">
          ${safe(concurso.orgao)} · Banca: <strong>${safe(concurso.banca)}</strong> · UF: <strong>${safe(concurso.uf)}</strong>
        </p>

        <div class="dossier-badges" style="margin-bottom:10px;">
          ${isTarget ? `<span class="badge badge-cobalt">★ Concurso-Alvo Ativo</span>` : ''}
          <span class="badge ${badgeClass}">${statusDot} <span>${safe(shortStatus)}</span></span>
          ${!isTarget && alvoObj ? `<span class="badge badge-neutral">Sinergia ${synergy}% c/ ${safe(alvoObj.sigla)}</span>` : ''}
          ${concurso.status === 'previsto' ? `<span class="badge badge-previsto">${safe(probVal)}% Radar</span>` : ''}
        </div>

        <div class="card-divider-grid">
          <div class="meta-item">
            <span>Remuneração</span>
            <strong class="text-green">${safe(concurso.salario)}</strong>
          </div>
          <div class="meta-item">
            <span>Vagas</span>
            <strong>${safe(concurso.vagas)}</strong>
          </div>
          <div class="meta-item">
            <span>Situação</span>
            <strong>${safe(inscrVal)}</strong>
          </div>
          <div class="meta-item">
            <span>Prova / Previsão</span>
            <strong>${safe(concurso.data_prova)}</strong>
          </div>
        </div>

        <p class="text-caption-muted" style="margin:10px 0;">
          ${safe(concurso.resumo_ia)}
        </p>
      </div>

      <div class="dossier-actions">
        ${isTarget ? `
          <button type="button" class="btn btn-primary btn-sm" onclick="window.AprovaApp.switchView('estudo')">
            Meu Estudo (${safe(concurso.sigla)})
          </button>
        ` : `
          <button type="button" class="btn btn-soft btn-sm" onclick="window.AprovaApp.escolherConcursoAlvo('${safeId}')">
            Definir como Alvo
          </button>
        `}
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.iniciarPraticaDirecionada({ concurso_id: '${safeId}', disciplina: 'todas', dificuldade: 'sorteado', quantidade: 10, tipo_sessao: 'prova_anterior' })">
          Resolver Prova →
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.AprovaComponents.openConcursoModal('${safeId}', this)">
          Raio-X
        </button>
      </div>
    </article>
  `;
};
