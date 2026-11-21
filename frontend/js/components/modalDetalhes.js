/**
 * Componente: Modal de Raio-X Completo do Concurso, Disciplinas por Peso e Checklist de Materiais
 */
window.AprovaComponents = window.AprovaComponents || {};

window.AprovaComponents.openConcursoModal = async function (concursoId, triggerEl, options = {}) {
  const modal = document.getElementById('concurso-modal');
  const content = document.getElementById('concurso-modal-body');
  if (!modal || !content) return;

  const utils = window.AprovaUtils;
  if (!options.skipHash) {
    const desiredHash = `#concurso/${encodeURIComponent(concursoId)}`;
    if (window.location.hash !== desiredHash) {
      history.pushState({ concursoId }, '', desiredHash);
    }
  }

  utils.openAccessibleModal('concurso-modal', triggerEl || document.activeElement);
  content.innerHTML = `<h2 id="concurso-modal-title" class="sr-only">Raio-X do Concurso e Materiais</h2><div class="empty-state-sheet empty-state-borderless" role="status">Carregando dossiê técnico e acervo vinculado...</div>`;

  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.focus();

  const safe = (v) => utils.safeText(v);
  const safeId = utils.escapeHtml(concursoId);

  let c = null;
  try {
    c = await window.AprovaAPI.obterConcurso(concursoId);
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state-sheet empty-state-borderless" role="alert">
        <h2 id="concurso-modal-title" class="modal-title">Não foi possível carregar este concurso</h2>
        <p>${utils.escapeHtml(err.message || 'Ocorreu uma falha ao consultar os dados do edital.')}</p>
        <div class="empty-state-actions">
          <button type="button" class="btn btn-primary" onclick="window.AprovaComponents.openConcursoModal('${safeId}', null, { skipHash: true })">
            ${utils.icon('reset')}
            <span>Tentar novamente</span>
          </button>
          <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.closeConcursoModal()">
            Fechar
          </button>
        </div>
      </div>
    `;
    return;
  }

  if (!c) {
    content.innerHTML = `
      <div class="empty-state-sheet empty-state-borderless" role="alert">
        <h2 id="concurso-modal-title" class="modal-title">Concurso não encontrado</h2>
        <p>O edital solicitado não está disponível na base no momento.</p>
        <div class="empty-state-actions">
          <button type="button" class="btn btn-outline" onclick="window.AprovaComponents.closeConcursoModal()">
            Fechar
          </button>
        </div>
      </div>
    `;
    return;
  }

  const badgeClass = utils.getStatusBadgeClass(c.status);
  const statusDot = utils.getStatusDot(c.status);
  const shortStatus = utils.getShortStatusLabel(c.status);
  const heading = utils.formatConcursoHeading(c.sigla, c.titulo);

  const probVal = c.probabilidade_ia || c.prob_ia || 100;
  const inscrVal = c.inscricoes || c.prazo || 'Consulte o edital';
  const corteVal = c.nota_corte_historica || c.nota_corte_anterior || 'Referência oficial';
  const fonteVal = c.fonte_oficial || c.fontes_internet || 'Diário Oficial e Banca';

  const disciplinasRows = (c.disciplinas || []).map(d => {
    const prioBadge = d.prioridade === 'Crítica'
      ? 'badge-previsto'
      : (d.prioridade === 'Alta' ? 'badge-cobalt' : 'badge-neutral');
    return `
      <tr>
        <td><strong>${safe(d.nome)}</strong></td>
        <td>${safe(d.questoes)}</td>
        <td><strong>${safe(d.peso)}</strong></td>
        <td><span class="badge ${prioBadge}">${safe(d.prioridade)}</span></td>
      </tr>
    `;
  }).join('');

  const materiaisHtml = (c.materiais || []).map(m => {
    const mid = Number(m.id);
    return `
      <div class="mat-item-wrap" id="modal-mat-${mid}">
        <div class="mat-item">
          <div class="mat-item-info">
            <div class="mat-item-title">
              ${safe(m.titulo)}
            </div>
            <div class="mat-item-meta">
              <span class="badge badge-cobalt">${safe(m.categoria)}</span>
              <span>Disciplina: <strong>${safe(m.disciplina || 'Geral')}</strong></span>
              <span>Formato: <strong>Roteiro + Checklist (PDF)</strong></span>
              <span>Acesso: <strong class="text-green">${m.gratuito ? 'Gratuito' : 'PRO'}</strong></span>
            </div>
            ${m.resumo_conteudo ? `<p class="mat-item-desc">${safe(m.resumo_conteudo)}</p>` : ''}
          </div>
          <div class="mat-item-actions">
            <button
              type="button"
              class="btn ${m.estudado ? 'btn-primary' : 'btn-outline'} btn-sm"
              aria-pressed="${m.estudado ? 'true' : 'false'}"
              onclick="window.AprovaComponents.toggleEstudadoNoModal(${mid}, '${safeId}', this)"
            >
              ${m.estudado ? utils.icon('check') : ''}
              <span>${m.estudado ? 'Estudado' : 'Marcar estudado'}</span>
            </button>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              aria-expanded="false"
              aria-controls="modal-mat-preview-${mid}"
              onclick="window.AprovaUtils.toggleMaterialPreview(${mid}, 'modal-mat', this)"
            >
              ${utils.icon('eye')}
              <span>Pré-visualizar</span>
            </button>
            <button
              type="button"
              class="btn btn-accent btn-sm"
              onclick="window.AprovaAPI.baixarMaterial(${mid})"
            >
              ${utils.icon('download')}
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
        <div id="modal-mat-preview-${mid}" class="material-preview-panel" hidden></div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div class="modal-header-block">
      <div class="modal-title-row">
        <h2 id="concurso-modal-title" class="modal-title">
          ${heading}
        </h2>
        <button
          type="button"
          id="modal-fav-btn"
          class="btn ${c.salvo ? 'btn-primary' : 'btn-outline'} btn-sm"
          aria-pressed="${c.salvo ? 'true' : 'false'}"
          onclick="window.AprovaComponents.toggleFavoritoNoModal('${safeId}', this)"
        >
          ${c.salvo ? utils.icon('bookmarkFilled') : utils.icon('bookmark')}
          <span>${c.salvo ? 'Salvo no caderno' : 'Salvar no caderno'}</span>
        </button>
      </div>
      <p class="dossier-subtitle">
        Órgão: <strong>${safe(c.orgao)}</strong> · Banca: <strong>${safe(c.banca)}</strong> · Área: <strong>${safe(c.area)}</strong> · UF: <strong>${safe(c.uf)}</strong>
      </p>
      <div class="dossier-badges">
        <span class="badge ${badgeClass}">${statusDot} <span>${safe(shortStatus)}</span></span>
        ${c.status === 'previsto' ? `<span class="badge badge-cobalt">Probabilidade IA: ${safe(probVal)}%</span>` : ''}
        <span class="badge badge-neutral">Último edital: ${safe(c.ultimo_concurso_ano || 'Consulte histórico')}</span>
      </div>
    </div>

    <div class="card-divider-grid modal-meta-grid">
      <div class="meta-item"><span>Salário Inicial</span><strong class="salary-highlight">${safe(c.salario)}</strong></div>
      <div class="meta-item"><span>Vagas e Nível</span><strong>${safe(c.vagas)} (${safe(c.escolaridade)})</strong></div>
      <div class="meta-item"><span>Inscrições / Situação</span><strong>${safe(inscrVal)}</strong></div>
      <div class="meta-item"><span>Prova / Previsão</span><strong>${safe(c.data_prova)}</strong></div>
      <div class="meta-item"><span>Nota de Corte Histórica</span><strong>${safe(corteVal)}</strong></div>
      <div class="meta-item"><span>Fontes Monitoradas</span><strong>${safe(fonteVal)}</strong></div>
    </div>

    <div class="ai-editorial-note">
      <div class="ai-editorial-head">
        <span>Parecer de Inteligência Artificial e Estratégia de Prova</span>
      </div>
      <p class="ai-editorial-body text-primary-ink">${safe(c.resumo_ia)}</p>
    </div>

    <div class="modal-section-block">
      <h3 class="modal-section-title">
        Matriz de Disciplinas e Pesos (Edital Verticalizado)
      </h3>
      <details class="domain-glossary">
        <summary>
          ${utils.icon('help')}
          <span>Entenda os termos desta matriz (Prioridade, Pontos Líquidos e Edital Verticalizado)</span>
        </summary>
        <p>
          <strong>Prioridade IA:</strong> calculada pelo peso percentual da disciplina na nota final. Foque ~70% do tempo nas matérias <em>Crítica</em> e <em>Alta</em>.
          <strong>Pontos Líquidos (Cebraspe):</strong> itens errados podem anular acertos.
          <strong>Edital Verticalizado:</strong> distribuição estruturada para você acompanhar o estudo por bloco.
        </p>
      </details>
      <div class="table-scroll-wrap">
        <table class="data-table" aria-label="Matriz de Disciplinas e Pesos">
          <thead>
            <tr>
              <th scope="col">Disciplina / Bloco Temático</th>
              <th scope="col">Itens / Questões</th>
              <th scope="col">Peso na Nota</th>
              <th scope="col">Prioridade IA</th>
            </tr>
          </thead>
          <tbody>
            ${disciplinasRows}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div class="match-result-head">
        <h3 class="modal-section-title">
          Acervo de Estudo Vinculado (${(c.materiais || []).length} roteiros disponíveis)
        </h3>
        <span class="text-caption-muted">Pré-visualize inline ou baixe o roteiro verticalizado em PDF</span>
      </div>
      <div>
        ${materiaisHtml}
      </div>
    </div>
  `;
};

window.AprovaComponents.closeConcursoModal = function () {
  window.AprovaUtils.closeAccessibleModal('concurso-modal');
  if (window.location.hash.startsWith('#concurso/')) {
    const fallbackView = window.AprovaApp?.state?.currentView || 'explorar';
    history.replaceState({ view: fallbackView }, '', `#${fallbackView}`);
  }
};

window.AprovaComponents.toggleFavoritoNoModal = async function (concursoId, btnEl) {
  const res = await window.AprovaApp.toggleFavorito(concursoId);
  if (!res || !btnEl) return;
  const utils = window.AprovaUtils;
  btnEl.className = `btn ${res.salvo ? 'btn-primary' : 'btn-outline'} btn-sm`;
  btnEl.setAttribute('aria-pressed', res.salvo ? 'true' : 'false');
  btnEl.innerHTML = `${res.salvo ? utils.icon('bookmarkFilled') : utils.icon('bookmark')}<span>${res.salvo ? 'Salvo no caderno' : 'Salvar no caderno'}</span>`;
};

window.AprovaComponents.toggleEstudadoNoModal = async function (materialId, concursoId, btnEl) {
  try {
    const res = await window.AprovaAPI.alternarMaterialEstudado(materialId);
    const utils = window.AprovaUtils;

    if (btnEl) {
      btnEl.className = `btn ${res.estudado ? 'btn-primary' : 'btn-outline'} btn-sm`;
      btnEl.setAttribute('aria-pressed', res.estudado ? 'true' : 'false');
      btnEl.innerHTML = `${res.estudado ? utils.icon('check') : ''}<span>${res.estudado ? 'Estudado' : 'Marcar estudado'}</span>`;
    }

    if (!res.estudado) {
      utils.showToast('Material marcado como pendente.', {
        actionLabel: 'Desfazer',
        onAction: () => window.AprovaComponents.toggleEstudadoNoModal(materialId, concursoId, btnEl)
      });
    } else {
      utils.showToast(
        res.isGuest
          ? 'Concluído neste dispositivo. Entre ou crie conta para salvar na nuvem.'
          : 'Material marcado como estudado no seu caderno.'
      );
    }

    window.AprovaApp.carregarConcursos();
    window.AprovaApp.atualizarIndicadoresUsuario();
  } catch (err) {
    window.AprovaUtils.showToast(err.message || 'Erro ao atualizar status do material.', { variant: 'error' });
  }
};
