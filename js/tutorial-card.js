/* Componente Modal: Cartão de Tutorial com Vinheta Animada (Ilha do Conhecimento).
   Construído de forma genérica e dirigida por dados (TutorialData e TutorialDemos).
   Suporta múltiplos passos, foco acessível, focus trap, teclado e modo calmo. */
window.TutorialCard = (() => {
  'use strict';

  // Frequência de exibição automática: 'primeira-vez-na-sessao' (padrão) ou 'sempre'
  const TUTORIAL_FREQUENCIA = 'primeira-vez-na-sessao';

  // Memória da sessão (sem localStorage)
  const vistosNaSessao = new Set();

  let dialogEl = null;
  let wrapperEl = null;
  let titleEl = null;
  let textEl = null;
  let canvasEl = null;
  let videoEl = null;
  let replayBtn = null;
  let dotsContainer = null;
  let btnVoltar = null;
  let btnPrincipal = null;
  let btnFechar = null;

  let currentPuzzleId = null;
  let currentStep = 0;
  let currentOptions = {};
  let currentData = null;
  let isAberto = false;
  let lastActiveElement = null;

  function isCalm() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function createDOM() {
    if (dialogEl) return;

    dialogEl = document.createElement('div');
    dialogEl.id = 'tutorial-card-dialog';
    dialogEl.setAttribute('role', 'dialog');
    dialogEl.setAttribute('aria-modal', 'true');
    dialogEl.setAttribute('aria-labelledby', 'tutorial-card-title');
    dialogEl.setAttribute('aria-describedby', 'tutorial-card-text');
    dialogEl.hidden = true;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'tutorial-card-wrapper';

    // Botão Fechar (X)
    btnFechar = document.createElement('button');
    btnFechar.type = 'button';
    btnFechar.className = 'tutorial-card-close';
    btnFechar.setAttribute('aria-label', 'Fechar tutorial');
    const closeImg = document.createElement('img');
    closeImg.src = 'assets/configuracoes/mural/ui/fechar-normal.webp';
    closeImg.alt = '';
    btnFechar.appendChild(closeImg);
    btnFechar.onclick = () => fechar();
    wrapperEl.appendChild(btnFechar);

    // Área Segura do Conteúdo
    const content = document.createElement('div');
    content.className = 'tutorial-card-content';

    // Cabeçalho / Título
    const header = document.createElement('header');
    header.className = 'tutorial-card-header';
    titleEl = document.createElement('h2');
    titleEl.id = 'tutorial-card-title';
    titleEl.className = 'tutorial-card-title';
    header.appendChild(titleEl);
    content.appendChild(header);

    // Moldura e Palco de Vídeo (815 x 526 px)
    const videoBox = document.createElement('div');
    videoBox.className = 'tutorial-video-box';

    const stageViewport = document.createElement('div');
    stageViewport.className = 'tutorial-stage-viewport';
    stageViewport.setAttribute('aria-hidden', 'true');
    stageViewport.inert = true;

    canvasEl = document.createElement('canvas');
    canvasEl.className = 'tutorial-stage-canvas';
    canvasEl.width = 815;
    canvasEl.height = 526;
    canvasEl.setAttribute('aria-hidden', 'true');
    canvasEl.inert = true;
    stageViewport.appendChild(canvasEl);

    videoEl = document.createElement('video');
    videoEl.className = 'tutorial-stage-canvas';
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.playsInline = true;
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('loop', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.hidden = true;
    stageViewport.appendChild(videoEl);

    videoBox.appendChild(stageViewport);

    // Botão "Ver de novo" (apenas em prefers-reduced-motion)
    replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 'tutorial-replay-btn';
    replayBtn.textContent = 'Ver de novo';
    replayBtn.hidden = true;
    replayBtn.onclick = () => {
      const runner = window.TutorialDemos?.getActiveRunner?.();
      if (runner?.tocarUmaVez) runner.tocarUmaVez();
      else if (videoEl && !videoEl.hidden) { videoEl.currentTime = 0; videoEl.play?.().catch(() => {}); }
    };
    videoBox.appendChild(replayBtn);

    // Moldura decorativa sobreposta
    const molduraImg = document.createElement('img');
    molduraImg.className = 'tutorial-moldura-img';
    molduraImg.src = 'assets/tutorial/tutorial-moldura-video.webp';
    molduraImg.alt = '';
    videoBox.appendChild(molduraImg);

    content.appendChild(videoBox);

    // Texto Explicativo (Transcrição acessível)
    const copyBox = document.createElement('div');
    copyBox.className = 'tutorial-card-copy-box';
    textEl = document.createElement('p');
    textEl.id = 'tutorial-card-text';
    textEl.className = 'tutorial-card-copy';
    copyBox.appendChild(textEl);
    content.appendChild(copyBox);

    // Barra Inferior de Ações
    const actions = document.createElement('footer');
    actions.className = 'tutorial-card-actions';

    btnVoltar = document.createElement('button');
    btnVoltar.type = 'button';
    btnVoltar.className = 'tutorial-btn-voltar';
    btnVoltar.textContent = 'Voltar';
    btnVoltar.onclick = () => {
      if (currentStep > 0) renderStep(currentStep - 1);
    };
    actions.appendChild(btnVoltar);

    dotsContainer = document.createElement('div');
    dotsContainer.className = 'tutorial-step-dots';
    dotsContainer.setAttribute('aria-hidden', 'true');
    actions.appendChild(dotsContainer);

    btnPrincipal = document.createElement('button');
    btnPrincipal.type = 'button';
    btnPrincipal.className = 'tutorial-btn-principal';
    btnPrincipal.textContent = 'OK';
    btnPrincipal.onclick = () => {
      const passos = currentData?.passos || [];
      if (currentStep < passos.length - 1) {
        renderStep(currentStep + 1);
      } else {
        fechar();
      }
    };
    actions.appendChild(btnPrincipal);

    content.appendChild(actions);
    wrapperEl.appendChild(content);
    dialogEl.appendChild(wrapperEl);
    if (document.body.prepend) {
      document.body.prepend(dialogEl);
    } else {
      document.body.appendChild(dialogEl);
    }

    // Listener de teclado acessível (Tab trap, Escape, Setas)
    dialogEl.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keydown', (e) => {
      if (!isAberto) return;
      // Se o evento já veio de dentro do dialogEl (ou for mock sem contains), dialogEl já tratou
      if (e.target && (e.target === dialogEl || e.target === btnPrincipal || e.target === btnVoltar || e.target === btnFechar || e.target === replayBtn)) return;
      onKeyDown(e);
    }, true);
  }

  function onKeyDown(e) {
    if (!isAberto) return;
    const k = e.key;

    if (k === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      fechar();
      return;
    }

    if (k === 'ArrowLeft') {
      if (currentStep > 0) {
        e.preventDefault();
        renderStep(currentStep - 1);
      }
      return;
    }

    if (k === 'ArrowRight') {
      const passos = currentData?.passos || [];
      if (currentStep < passos.length - 1) {
        e.preventDefault();
        renderStep(currentStep + 1);
      }
      return;
    }

    // Focus trap dentro do cartão
    if (k === 'Tab') {
      const focusables = Array.from(dialogEl.querySelectorAll('button:not([hidden]):not([disabled])'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function renderStep(stepIndex) {
    if (!currentData || !currentData.passos) return;
    const passos = currentData.passos;
    currentStep = Math.max(0, Math.min(passos.length - 1, stepIndex));
    const passo = passos[currentStep];

    titleEl.textContent = passo.titulo;
    textEl.textContent = passo.texto;

    // Botão Voltar: visível apenas a partir do 2º passo
    btnVoltar.hidden = (currentStep === 0);

    // Botão Principal: "OK" no último passo; "Próximo" nos intermediários
    const isLast = (currentStep === passos.length - 1);
    btnPrincipal.textContent = isLast ? 'OK' : 'Próximo';

    // Bolinhas de etapa
    dotsContainer.innerHTML = '';
    if (passos.length > 1) {
      dotsContainer.hidden = false;
      for (let i = 0; i < passos.length; i++) {
        const dot = document.createElement('span');
        dot.className = `tutorial-step-dot ${i === currentStep ? 'active' : 'inactive'}`;
        dotsContainer.appendChild(dot);
      }
    } else {
      dotsContainer.hidden = true;
    }

    // Botão "Ver de novo" em modo reduzido
    const calm = isCalm();
    replayBtn.hidden = !calm;

    // Inicia demonstração animada correspondente (ou vídeo futuro { tipo: 'video', arquivo })
    const videoSpec = (passo.demo && typeof passo.demo === 'object' && passo.demo.tipo === 'video') ? passo.demo : (passo.tipo === 'video' ? passo : null);
    if (videoSpec && videoSpec.arquivo) {
      if (window.TutorialDemos) window.TutorialDemos.parar();
      canvasEl.hidden = true;
      videoEl.hidden = false;
      videoEl.src = videoSpec.arquivo;
      if (!calm) videoEl.play?.().catch(() => {});
    } else {
      if (videoEl) { videoEl.pause?.(); videoEl.hidden = true; }
      canvasEl.hidden = false;
      if (passo.demo && window.TutorialDemos) {
        window.TutorialDemos.iniciar(passo.demo, canvasEl, { forcePlay: false });
      }
    }

    // Foco padrão no botão principal para avanço imediato (e re-foco após o fade de 250 ms da transição)
    setTimeout(() => {
      if (isAberto) btnPrincipal?.focus();
    }, 40);
    setTimeout(() => {
      if (isAberto && document.activeElement !== btnVoltar && document.activeElement !== btnFechar && document.activeElement !== replayBtn) {
        btnPrincipal?.focus();
      }
    }, 300);
  }

  function abrir(puzzleId, options = {}) {
    createDOM();
    const data = window.TutorialData?.[puzzleId];
    if (!data || !data.passos || !data.passos.length) {
      console.warn(`[TutorialCard] Nenhum passo de tutorial encontrado para '${puzzleId}'.`);
      options.onFechar?.();
      return false;
    }

    lastActiveElement = document.activeElement;
    currentPuzzleId = puzzleId;
    currentOptions = options;
    currentData = data;
    isAberto = true;

    dialogEl.hidden = false;
    renderStep(0);

    options.onAbrir?.();
    return true;
  }

  function verificarEabrir(puzzleId, options = {}) {
    if (TUTORIAL_FREQUENCIA === 'primeira-vez-na-sessao' && vistosNaSessao.has(puzzleId)) {
      // Já visto nesta sessão: não interrompe o puzzle
      options.onFechar?.();
      return false;
    }

    return abrir(puzzleId, options);
  }

  function fechar() {
    if (!isAberto) return;
    isAberto = false;

    // Para qualquer animação da demo em execução
    if (window.TutorialDemos) {
      window.TutorialDemos.parar();
    }

    if (dialogEl) {
      dialogEl.hidden = true;
    }

    if (currentPuzzleId) {
      vistosNaSessao.add(currentPuzzleId);
    }

    const callback = currentOptions.onFechar;
    currentOptions = {};
    currentData = null;

    if (typeof callback === 'function') {
      callback();
    } else if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      try { lastActiveElement.focus(); } catch (_) {}
    }
  }

  return {
    TUTORIAL_FREQUENCIA,
    abrir,
    verificarEabrir,
    fechar,
    isAberto: () => isAberto,
    getPassoAtual: () => currentStep,
    getVistos: () => Array.from(vistosNaSessao),
    limparVistos: () => vistosNaSessao.clear()
  };
})();
