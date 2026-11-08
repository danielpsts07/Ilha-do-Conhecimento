/* ==========================================================================
   HISTÓRIA DE INTRODUÇÃO EM QUADRINHOS (HQ) — Ilha do Conhecimento
   Toca sempre que o jogador clica em "Jogar" (e ao clicar em "Rever a história"
   nas Configurações). Cada toque/clique revela UM item (painel -> balão/legenda
   -> onomatopeia) e depois vira a página até o Cartão Final "Seu objetivo".
   100% HTML/CSS/JS puro, compatível com file:// (sem fetch, sem JSON externo).
   ========================================================================== */
const PULAR_APARECE_PRIMEIRA_VEZ_MS = 6000;

window.IntroStory = (() => {
  'use strict';

  const INTRO_SEEN_STORAGE_KEY = 'ilha.introSeen';
  const IDLE_HINT_MS = 3000;
  const PAGE_TURN_MS = 280;
  const FINAL_KEY_STAGGER_MS = 250;
  const MINI_PANEL_DELAY_MS = 180;
  const MAX_SFX_VOLUME_RATIO = 0.60; // no máximo 60% do volume geral

  let memoryIntroSeen = false;

  function hasSeenIntro() {
    try {
      const raw = localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
      if (raw === 'true') return true;
    } catch {}
    return memoryIntroSeen;
  }

  function markIntroSeen() {
    memoryIntroSeen = true;
    try {
      localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true');
    } catch {}
  }

  function resetSeenForTest() {
    memoryIntroSeen = false;
    try {
      localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
    } catch {}
  }

  function isCalmMode() {
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    return Boolean(
      window.GameSettings?.calm ||
      window.GameSettings?.get?.('calm') ||
      (mq && mq.matches) ||
      document.body?.classList?.contains('calm-motion')
    );
  }

  // Nomes reais das 4 regiões dos cantos da ilha (ISLAND_REGIONS em js/config.js)
  // e cores das 4 chaves (verde, azul, vermelha, amarela).
  function getObjectiveRegions() {
    const regions = window.ISLAND_REGIONS || [];
    const findName = (id, fallback) => {
      const found = regions.find(r => r.id === id);
      return found ? found.name : fallback;
    };
    return [
      { id: 'forest', colorKey: 'green', fill: '#22c55e', stroke: '#14532d', label: 'Chave verde', regionName: findName('forest', 'Floresta dos Padrões') },
      { id: 'village', colorKey: 'blue', fill: '#38bdf8', stroke: '#0c4a6e', label: 'Chave azul', regionName: findName('village', 'Aldeia do Saber') },
      { id: 'ruins', colorKey: 'red', fill: '#ef4444', stroke: '#7f1d1d', label: 'Chave vermelha', regionName: findName('ruins', 'Ruínas das Formas') },
      { id: 'farm', colorKey: 'yellow', fill: '#facc15', stroke: '#713f12', label: 'Chave amarela', regionName: findName('farm', 'Campos Contados') }
    ];
  }

  // Coordenadas em % das 4 chaves e dos 4 cadeados em intro/intro-07.webp
  const INTRO_07_SPOTS = Object.freeze([
    { kind: 'key', color: 'green', x: 19.8, y: 26.5 },
    { kind: 'key', color: 'blue', x: 25.0, y: 66.5 },
    { kind: 'key', color: 'red', x: 80.2, y: 26.5 },
    { kind: 'key', color: 'yellow', x: 79.5, y: 66.5 },
    { kind: 'lock', color: 'green', x: 45.2, y: 18.2 },
    { kind: 'lock', color: 'blue', x: 48.5, y: 19.3 },
    { kind: 'lock', color: 'red', x: 52.1, y: 19.3 },
    { kind: 'lock', color: 'yellow', x: 55.4, y: 18.2 }
  ]);

  /* ==========================================================================
     GERENCIADOR DE EFEITOS SONOROS OPCIONAIS DA HQ (assets/audio/sfx-intro/)
     Usa .ogg com fallback .mp3, respeita #toggle-mute e #sound-volume (<= 60%).
     ========================================================================== */
  const SFX_NAMES = Object.freeze([
    'sfx-painel',
    'sfx-balao',
    'sfx-pagina',
    'sfx-livro-acorda',
    'sfx-risada-livro',
    'sfx-miau',
    'sfx-portal',
    'sfx-pulo',
    'sfx-queda',
    'sfx-puf',
    'sfx-cadeado',
    'sfx-chave',
    'sfx-botao'
  ]);

  // Pesos relativos dentro do teto de 60% do volume geral (painel/balão/página mais baixos)
  const SFX_WEIGHTS = Object.freeze({
    'sfx-painel': 0.55,
    'sfx-balao': 0.50,
    'sfx-pagina': 0.60,
    'sfx-livro-acorda': 0.90,
    'sfx-risada-livro': 0.95,
    'sfx-miau': 0.95,
    'sfx-portal': 0.90,
    'sfx-pulo': 0.85,
    'sfx-queda': 0.85,
    'sfx-puf': 0.85,
    'sfx-cadeado': 0.90,
    'sfx-chave': 0.85,
    'sfx-botao': 0.90
  });

  const sfxCache = new Map();
  let preferredExt = null;

  function detectAudioExtension() {
    if (preferredExt) return preferredExt;
    try {
      if (typeof Audio !== 'undefined') {
        const probe = new Audio();
        if ( typeof probe.canPlayType === 'function' && probe.canPlayType('audio/ogg; codecs="vorbis"') !== '' ) {
          preferredExt = 'ogg';
          return preferredExt;
        }
      }
    } catch {}
    preferredExt = 'mp3';
    return preferredExt;
  }

  function isMuted() {
    try {
      const muteToggle = document.getElementById('toggle-mute');
      if (muteToggle && muteToggle.checked) return true;
      if (window.GameSettings?.get?.('mute')) return true;
      if (window.GameAudio?.getPreferences?.()?.mute) return true;
    } catch {}
    return false;
  }

  function getMasterSoundFraction() {
    try {
      const slider = document.getElementById('sound-volume');
      if (slider && slider.value !== undefined && slider.value !== '') {
        const v = Number(slider.value);
        if (Number.isFinite(v)) return Math.max(0, Math.min(100, v)) / 100;
      }
      const pref = window.GameAudio?.getPreferences?.();
      if (pref && Number.isFinite(pref.soundVolume)) {
        return Math.max(0, Math.min(100, pref.soundVolume)) / 100;
      }
    } catch {}
    return 0.7;
  }

  function playSfx(name) {
    if (!name || isMuted()) return;
    const master = getMasterSoundFraction();
    if (master <= 0) return;

    const weight = SFX_WEIGHTS[name] ?? 0.8;
    const volume = Math.max(0, Math.min(MAX_SFX_VOLUME_RATIO, master * MAX_SFX_VOLUME_RATIO * weight));
    if (volume <= 0) return;

    try {
      if (typeof Audio === 'undefined') return;
      const ext = detectAudioExtension();
      const fallbackExt = ext === 'ogg' ? 'mp3' : 'ogg';
      let audio = sfxCache.get(name);
      if (!audio) {
        audio = new Audio();
        audio.preload = 'auto';
        let triedFallback = false;
        audio.onerror = () => {
          if (!triedFallback) {
            triedFallback = true;
            try {
              audio.src = `assets/audio/sfx-intro/${name}.${fallbackExt}`;
            } catch {}
          }
        };
        audio.src = `assets/audio/sfx-intro/${name}.${ext}`;
        sfxCache.set(name, audio);
      }
      audio.volume = volume;
      try { audio.currentTime = 0; } catch {}
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
  }

  /* ==========================================================================
     DEFINIÇÃO DAS 5 PÁGINAS DA HQ (4 páginas de quadrinhos + Cartão Final)
     Cada item em `steps` é revelado individualmente a cada toque/clique:
       - kind: 'panel'   -> revela o painel (e seu mini-painel opcional hq-*)
       - kind: 'caption' -> revela legenda do narrador (ou voz do Livro Malvado)
       - kind: 'bubble'  -> revela balão de fala com cauda e cor por personagem
       - kind: 'sfx'     -> revela palavra de efeito (onomatopeia) com tremidinha
     ========================================================================== */
  const PAGES = Object.freeze([
    // PÁGINA 1 (2 painéis: intro-01 e intro-01b)
    {
      id: 'hq-page-1',
      pageNumber: 1,
      layout: 'layout-p1',
      panels: [
        {
          id: 'panel-a',
          sceneId: 'intro-01',
          src: 'intro/intro-01.webp',
          alt: 'Quarto tranquilo à noite: a menina estuda na escrivaninha, o gato dorme na cama e um livro antigo brilha na estante.',
          tilt: -0.6,
          miniPanel: null
        },
        {
          id: 'panel-b',
          sceneId: 'intro-01b',
          src: 'intro/intro-01b.webp',
          alt: 'O livro antigo flutua e cresce com brilho mágico diante da estante.',
          tilt: 0.7,
          miniPanel: {
            src: 'intro/hq-livro-sorriso.webp',
            alt: 'Detalhe do Livro Malvado abrindo um sorriso travesso.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p1-s1',
          kind: 'panel',
          panelId: 'panel-a',
          sfx: ['sfx-painel'],
          announce: 'Painel 1: Quarto tranquilo à noite.'
        },
        {
          id: 'p1-s2',
          kind: 'caption',
          panelId: 'panel-a',
          speaker: 'Narrador',
          text: 'Numa noite tranquila, uma menina estudava ao lado do seu gatinho…',
          pos: 'pos-top-left',
          sfx: ['sfx-balao']
        },
        {
          id: 'p1-s3',
          kind: 'caption',
          panelId: 'panel-a',
          speaker: 'Narrador',
          text: 'Mas, na estante, um livro muito antigo estava acordando…',
          pos: 'pos-bottom-center',
          sfx: ['sfx-balao']
        },
        {
          id: 'p1-s4',
          kind: 'panel',
          panelId: 'panel-b',
          sfx: ['sfx-painel', 'sfx-livro-acorda'],
          announce: 'Painel 2: O livro antigo flutua e cresce!'
        },
        {
          id: 'p1-s5',
          kind: 'sfx',
          panelId: 'panel-b',
          text: 'FUUUSH!',
          pos: 'sfx-pos-book-left',
          rotate: -8,
          sfx: []
        },
        {
          id: 'p1-s6',
          kind: 'caption',
          panelId: 'panel-b',
          speaker: 'Narrador',
          text: 'O livro acordou… e começou a crescer!',
          pos: 'pos-top-right',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 2 (3 painéis: intro-02, intro-02b e intro-03)
    {
      id: 'hq-page-2',
      pageNumber: 2,
      layout: 'layout-p2',
      panels: [
        {
          id: 'panel-c',
          sceneId: 'intro-02',
          src: 'intro/intro-02.webp',
          alt: 'O Livro Malvado abre um portal brilhante no quarto enquanto a menina e o gato se assustam.',
          tilt: -0.5,
          miniPanel: {
            src: 'intro/hq-rosto-menina.webp',
            alt: 'Rosto surpreso da menina.',
            pos: 'pos-bottom-right'
          }
        },
        {
          id: 'panel-d',
          sceneId: 'intro-02b',
          src: 'intro/intro-02b.webp',
          alt: 'O Livro Malvado puxa o gatinho laranja no ar em direção ao portal.',
          tilt: 0.6,
          miniPanel: {
            src: 'intro/hq-gato-susto.webp',
            alt: 'Gatinho assustado sendo puxado pela magia.',
            pos: 'pos-bottom-left'
          }
        },
        {
          id: 'panel-e',
          sceneId: 'intro-03',
          src: 'intro/intro-03.webp',
          alt: 'A menina salta em direção ao portal para tentar alcançar o gatinho.',
          tilt: -0.4,
          miniPanel: {
            src: 'intro/hq-pulo.webp',
            alt: 'Detalhe do salto da menina rumo ao portal.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p2-s1',
          kind: 'panel',
          panelId: 'panel-c',
          sfx: ['sfx-painel'],
          announce: 'Página 2, Painel 1: O Livro Malvado abre um portal.'
        },
        {
          id: 'p2-s2',
          kind: 'bubble',
          panelId: 'panel-c',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Hehehe! Há muito tempo eu espero por isso!',
          pos: 'pos-top-right',
          tail: 'tail-down-left',
          sfx: ['sfx-balao', 'sfx-risada-livro']
        },
        {
          id: 'p2-s3',
          kind: 'bubble',
          panelId: 'panel-c',
          speaker: 'Menina',
          theme: 'girl',
          text: 'O que está acontecendo?!',
          pos: 'pos-top-left',
          tail: 'tail-down',
          sfx: ['sfx-balao']
        },
        {
          id: 'p2-s4',
          kind: 'panel',
          panelId: 'panel-d',
          sfx: ['sfx-painel', 'sfx-portal'],
          announce: 'Painel 2: O portal puxa o gatinho.'
        },
        {
          id: 'p2-s5',
          kind: 'sfx',
          panelId: 'panel-d',
          text: 'ZUUUM!',
          pos: 'sfx-pos-portal',
          rotate: -6,
          sfx: []
        },
        {
          id: 'p2-s6',
          kind: 'bubble',
          panelId: 'panel-d',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Esse gatinho agora é meu!',
          pos: 'pos-bottom-right',
          tail: 'tail-up',
          sfx: ['sfx-balao']
        },
        {
          id: 'p2-s7',
          kind: 'bubble',
          panelId: 'panel-d',
          speaker: 'Gato',
          theme: 'cat',
          text: 'Miaaau!',
          pos: 'pos-top-center',
          tail: 'tail-down',
          sfx: ['sfx-balao', 'sfx-miau']
        },
        {
          id: 'p2-s8',
          kind: 'panel',
          panelId: 'panel-e',
          sfx: ['sfx-painel', 'sfx-pulo'],
          announce: 'Painel 3: A menina pula atrás do gato.'
        },
        {
          id: 'p2-s9',
          kind: 'sfx',
          panelId: 'panel-e',
          text: 'HUP!',
          pos: 'sfx-pos-feet',
          rotate: -10,
          sfx: []
        },
        {
          id: 'p2-s10',
          kind: 'bubble',
          panelId: 'panel-e',
          speaker: 'Menina',
          theme: 'girl',
          text: 'Meu gato! Devolve ele!',
          pos: 'pos-top-left',
          tail: 'tail-down-right',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 3 (2 painéis: intro-04 e intro-05)
    {
      id: 'hq-page-3',
      pageNumber: 3,
      layout: 'layout-p3',
      panels: [
        {
          id: 'panel-f',
          sceneId: 'intro-04',
          src: 'intro/intro-04.webp',
          alt: 'A menina sai do portal no céu e cai em direção a uma ilha mágica.',
          tilt: -0.6,
          miniPanel: null
        },
        {
          id: 'panel-g',
          sceneId: 'intro-05',
          src: 'intro/intro-05.webp',
          alt: 'A menina aterrissa sentada na Praça do Portal da ilha entre nuvens de poeira.',
          tilt: 0.6,
          miniPanel: null
        }
      ],
      steps: [
        {
          id: 'p3-s1',
          kind: 'panel',
          panelId: 'panel-f',
          sfx: ['sfx-painel', 'sfx-queda'],
          announce: 'Página 3, Painel 1: A menina cai pelo céu sobre a ilha.'
        },
        {
          id: 'p3-s2',
          kind: 'sfx',
          panelId: 'panel-f',
          text: 'AAAAH!',
          pos: 'sfx-pos-sky-left',
          rotate: -9,
          sfx: []
        },
        {
          id: 'p3-s3',
          kind: 'caption',
          panelId: 'panel-f',
          speaker: 'Narrador',
          text: 'A menina pulou atrás do gato… e caiu em uma ilha mágica!',
          pos: 'pos-bottom-left',
          sfx: ['sfx-balao']
        },
        {
          id: 'p3-s4',
          kind: 'panel',
          panelId: 'panel-g',
          sfx: ['sfx-painel', 'sfx-puf'],
          announce: 'Painel 2: A menina cai sentada na praça da ilha.'
        },
        {
          id: 'p3-s5',
          kind: 'sfx',
          panelId: 'panel-g',
          text: 'PUF!',
          pos: 'sfx-pos-dust-left',
          rotate: -7,
          sfx: []
        },
        {
          id: 'p3-s6',
          kind: 'bubble',
          panelId: 'panel-g',
          speaker: 'Menina',
          theme: 'girl',
          text: 'Ai! Onde eu estou?',
          pos: 'pos-top-right',
          tail: 'tail-down-left',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 4 (2 painéis: intro-06 e intro-07)
    {
      id: 'hq-page-4',
      pageNumber: 4,
      layout: 'layout-p4',
      panels: [
        {
          id: 'panel-h',
          sceneId: 'intro-06',
          src: 'intro/intro-06.webp',
          alt: 'O Livro Malvado flutua diante da montanha onde o gato está preso com 4 cadeados.',
          tilt: -0.4,
          miniPanel: {
            src: 'intro/hq-gato-preso.webp',
            alt: 'Detalhe do gatinho preso atrás dos 4 cadeados coloridos no Pico do Miau.',
            pos: 'pos-top-right'
          }
        },
        {
          id: 'panel-i',
          sceneId: 'intro-07',
          src: 'intro/intro-07.webp',
          alt: 'Visão geral da Ilha do Conhecimento com as 4 chaves brilhando nos 4 cantos e os 4 cadeados no Pico do Miau.',
          tilt: 0.5,
          hasKeyLockGlow: true,
          miniPanel: {
            src: 'intro/hq-menina-determinada.webp',
            alt: 'A menina olha determinada para a montanha pronta para a aventura.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p4-s1',
          kind: 'panel',
          panelId: 'panel-h',
          sfx: ['sfx-painel', 'sfx-cadeado'],
          announce: 'Página 4, Painel 1: O Livro Malvado mostra o gato preso no alto do Pico do Miau.'
        },
        {
          id: 'p4-s2',
          kind: 'bubble',
          panelId: 'panel-h',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Bem-vinda à Ilha do Conhecimento! Seu gato está preso lá no alto, no Pico do Miau.',
          pos: 'pos-top-left',
          tail: 'tail-right',
          sfx: ['sfx-balao']
        },
        {
          id: 'p4-s3',
          kind: 'bubble',
          panelId: 'panel-h',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Para libertá-lo, você precisa vencer todos os desafios da ilha!',
          pos: 'pos-bottom-left',
          tail: 'tail-up-right',
          sfx: ['sfx-balao']
        },
        {
          id: 'p4-s4',
          kind: 'panel',
          panelId: 'panel-i',
          sfx: ['sfx-painel'],
          announce: 'Painel 2: Os quatro cantos da ilha brilham com as quatro chaves.'
        },
        {
          id: 'p4-s5',
          kind: 'caption',
          panelId: 'panel-i',
          speaker: 'Livro Malvado',
          theme: 'villain-caption',
          text: 'Ele está trancado com 4 cadeados! Cada chave está escondida em um canto da ilha.',
          pos: 'pos-bottom-left',
          glowKeysLocks: true,
          sfx: ['sfx-balao', 'sfx-cadeado']
        },
        {
          id: 'p4-s6',
          kind: 'caption',
          panelId: 'panel-i',
          speaker: 'Narrador',
          text: 'Explore os 4 cantos da ilha, resolva os desafios, ache as 4 chaves e salve o gato!',
          pos: 'pos-top-center',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 5 — CARTÃO FINAL "SEU OBJETIVO"
    {
      id: 'hq-page-final',
      pageNumber: 5,
      isFinalCard: true,
      layout: 'layout-final',
      panels: [],
      steps: [
        {
          id: 'p5-s1',
          kind: 'final-card',
          sfx: ['sfx-pagina'],
          announce: 'Seu objetivo: Ache as 4 chaves, abra os 4 cadeados e salve o gato!'
        }
      ]
    }
  ]);

  // Lista plana de referências às cenas para compatibilidade de inspeção
  const SCENES = Object.freeze([
    { id: 'intro-01', src: 'intro/intro-01.webp' },
    { id: 'intro-01b', src: 'intro/intro-01b.webp' },
    { id: 'intro-02', src: 'intro/intro-02.webp' },
    { id: 'intro-02b', src: 'intro/intro-02b.webp' },
    { id: 'intro-03', src: 'intro/intro-03.webp' },
    { id: 'intro-04', src: 'intro/intro-04.webp' },
    { id: 'intro-05', src: 'intro/intro-05.webp' },
    { id: 'intro-06', src: 'intro/intro-06.webp' },
    { id: 'intro-07', src: 'intro/intro-07.webp' },
    { id: 'intro-final', src: 'intro/intro-07.webp', isFinalCard: true }
  ]);

  const preloadedImages = new Map();

  function preloadImage(src) {
    if (!src || preloadedImages.has(src)) return preloadedImages.get(src);
    if (typeof Image === 'undefined') return null;
    const img = new Image();
    img.src = src;
    preloadedImages.set(src, img);
    return img;
  }

  function preloadPageAssets(pIdx) {
    for (const idx of [pIdx, pIdx + 1]) {
      const page = PAGES[idx];
      if (!page) continue;
      for (const panel of page.panels) {
        preloadImage(panel.src);
        if (panel.miniPanel?.src) preloadImage(panel.miniPanel.src);
      }
      if (page.isFinalCard) {
        preloadImage('intro/intro-07.webp');
        preloadImage('intro/hq-quatro-chaves.webp');
      }
    }
  }

  function createKeySvgMarkup(fill, stroke) {
    return (
      '<svg class="intro-key-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="22" cy="22" r="14" fill="' + fill + '" stroke="' + stroke + '" stroke-width="4"/>' +
      '<circle cx="22" cy="22" r="5" fill="#fff8eb" stroke="' + stroke + '" stroke-width="3"/>' +
      '<path d="M32 28 L56 52 L50 58 L44 52 L39 57 L34 52 L39 47 L26 34 Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="4" stroke-linejoin="round"/>' +
      '</svg>'
    );
  }

  // Referências de DOM
  let rootEl = null;
  let viewportEl = null;
  let pageSheetEl = null;
  let idleHintEl = null;
  let finalCardWrapEl = null;
  let finalKeysContainerEl = null;
  let letsGoBtnEl = null;
  let liveAnnounceEl = null;
  let prevBtnEl = null;
  let nextBtnEl = null;
  let dotsContainerEl = null;
  let dotEls = [];
  let skipBtnEl = null;

  // Mapas de elementos da página atual
  const panelElsById = new Map();
  const stepElsById = new Map();
  let currentGlowLayerEl = null;

  // Estado de execução
  let active = false;
  let pageIndex = 0;
  let stepIndex = 0; // índice do último passo revelado na página atual
  let skipTimer = null;
  let idleHintTimer = null;
  let pageTurnTimer = null;
  let miniPanelTimers = [];
  let keyStaggerTimers = [];
  let skipVisible = false;
  let seenBeforeThisRun = false;
  let finishCallback = null;
  let returnFocusEl = null;
  let touchStartX = null;
  let touchStartY = null;

  function ensureDom() {
    if (rootEl && rootEl.parentNode) return;

    rootEl = document.getElementById('intro-story-screen');
    if (!rootEl) {
      rootEl = document.createElement('section');
      rootEl.id = 'intro-story-screen';
      rootEl.className = 'intro-overlay hq-mode';
      rootEl.setAttribute('role', 'dialog');
      rootEl.setAttribute('aria-modal', 'true');
      rootEl.setAttribute('aria-label', 'História em quadrinhos de introdução da Ilha do Conhecimento');
      rootEl.hidden = true;
      document.body.appendChild(rootEl);
    } else {
      rootEl.classList.add('hq-mode');
    }

    rootEl.innerHTML = '';

    // 1. Área principal da página de HQ (clicável para avançar item a item)
    viewportEl = document.createElement('div');
    viewportEl.id = 'intro-hq-viewport';
    viewportEl.className = 'hq-viewport';

    pageSheetEl = document.createElement('div');
    pageSheetEl.id = 'intro-hq-sheet';
    pageSheetEl.className = 'hq-sheet';
    viewportEl.appendChild(pageSheetEl);

    // Indicador discreto "▶" após 3s sem tocar
    idleHintEl = document.createElement('div');
    idleHintEl.id = 'intro-idle-hint';
    idleHintEl.className = 'hq-idle-hint';
    idleHintEl.textContent = '▶';
    idleHintEl.setAttribute('aria-hidden', 'true');
    idleHintEl.hidden = true;
    viewportEl.appendChild(idleHintEl);

    viewportEl.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      revealSkipOnInteraction();
      handleAdvance();
    });

    // Suporte a swipe esquerda (avançar) / direita (voltar)
    viewportEl.addEventListener('pointerdown', (event) => {
      touchStartX = event.clientX;
      touchStartY = event.clientY;
    });
    viewportEl.addEventListener('pointerup', (event) => {
      if (touchStartX === null || touchStartY === null) return;
      const dx = event.clientX - touchStartX;
      const dy = event.clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        revealSkipOnInteraction();
        if (dx < 0) handleAdvance();
        else handleBack();
      }
    });

    rootEl.appendChild(viewportEl);

    // 2. Cartão Final "Seu objetivo" (Página 5)
    finalCardWrapEl = document.createElement('div');
    finalCardWrapEl.id = 'intro-final-card-wrap';
    finalCardWrapEl.className = 'intro-final-card-wrap';
    finalCardWrapEl.hidden = true;

    const finalBgBlur = document.createElement('img');
    finalBgBlur.className = 'intro-final-bg-img';
    finalBgBlur.src = 'intro/intro-07.webp';
    finalBgBlur.alt = '';
    finalBgBlur.setAttribute('aria-hidden', 'true');
    finalBgBlur.draggable = false;
    finalCardWrapEl.appendChild(finalBgBlur);

    const finalCard = document.createElement('div');
    finalCard.className = 'intro-final-card';

    const finalTitle = document.createElement('h2');
    finalTitle.id = 'intro-final-title';
    finalTitle.className = 'intro-final-title';
    finalTitle.textContent = 'Seu objetivo';
    finalCard.appendChild(finalTitle);

    // Faixa decorativa opcional hq-quatro-chaves.webp (removida silenciosamente se faltar)
    const bannerWrap = document.createElement('div');
    bannerWrap.className = 'intro-final-banner-wrap';
    const bannerImg = document.createElement('img');
    bannerImg.className = 'intro-final-banner-img';
    bannerImg.src = 'intro/hq-quatro-chaves.webp';
    bannerImg.alt = 'As quatro chaves mágicas brilhando';
    bannerImg.draggable = false;
    bannerImg.onerror = () => { bannerWrap.remove(); };
    bannerWrap.appendChild(bannerImg);
    finalCard.appendChild(bannerWrap);

    finalKeysContainerEl = document.createElement('div');
    finalKeysContainerEl.id = 'intro-final-keys';
    finalKeysContainerEl.className = 'intro-final-keys';
    finalCard.appendChild(finalKeysContainerEl);

    const finalSummary = document.createElement('p');
    finalSummary.id = 'intro-final-summary';
    finalSummary.className = 'intro-final-summary';
    finalSummary.textContent = 'Ache as 4 chaves → abra os 4 cadeados → salve o gato!';
    finalCard.appendChild(finalSummary);

    letsGoBtnEl = document.createElement('button');
    letsGoBtnEl.type = 'button';
    letsGoBtnEl.id = 'intro-lets-go-btn';
    letsGoBtnEl.className = 'intro-lets-go-btn';
    letsGoBtnEl.textContent = 'Vamos lá!';
    letsGoBtnEl.addEventListener('click', (event) => {
      event.stopPropagation();
      playSfx('sfx-botao');
      window.GameAudio?.start?.();
      finishIntro('complete');
    });
    finalCard.appendChild(letsGoBtnEl);

    finalCardWrapEl.appendChild(finalCard);
    rootEl.appendChild(finalCardWrapEl);

    // 3. Região aria-live educada para leitura de cada novo balão/legenda
    liveAnnounceEl = document.createElement('p');
    liveAnnounceEl.id = 'intro-live-region';
    liveAnnounceEl.className = 'sr-only';
    liveAnnounceEl.setAttribute('aria-live', 'polite');
    rootEl.appendChild(liveAnnounceEl);

    // 4. Barra inferior de controles (Anterior, 5 Bolinhas de página, Próximo e Pular na safe area)
    const controlsBar = document.createElement('div');
    controlsBar.className = 'intro-controls-bar';

    const navGroup = document.createElement('div');
    navGroup.className = 'intro-nav-group';

    prevBtnEl = document.createElement('button');
    prevBtnEl.type = 'button';
    prevBtnEl.id = 'intro-prev-btn';
    prevBtnEl.className = 'intro-nav-btn';
    prevBtnEl.textContent = '◀ Anterior';
    prevBtnEl.setAttribute('aria-label', 'Voltar item anterior');
    prevBtnEl.addEventListener('click', (event) => {
      event.stopPropagation();
      revealSkipOnInteraction();
      handleBack();
    });
    navGroup.appendChild(prevBtnEl);

    dotsContainerEl = document.createElement('div');
    dotsContainerEl.id = 'intro-progress-dots';
    dotsContainerEl.className = 'intro-dots';
    dotsContainerEl.setAttribute('role', 'group');
    dotsContainerEl.setAttribute('aria-label', 'Páginas da história em quadrinhos');
    dotEls = [];

    for (let i = 0; i < PAGES.length; i++) {
      const dot = document.createElement('span');
      dot.className = 'intro-dot';
      dot.dataset.page = String(i + 1);
      dotsContainerEl.appendChild(dot);
      dotEls.push(dot);
    }
    navGroup.appendChild(dotsContainerEl);

    nextBtnEl = document.createElement('button');
    nextBtnEl.type = 'button';
    nextBtnEl.id = 'intro-next-btn';
    nextBtnEl.className = 'intro-nav-btn';
    nextBtnEl.textContent = 'Avançar ▶';
    nextBtnEl.setAttribute('aria-label', 'Avançar na história');
    nextBtnEl.addEventListener('click', (event) => {
      event.stopPropagation();
      revealSkipOnInteraction();
      handleAdvance();
    });
    navGroup.appendChild(nextBtnEl);

    controlsBar.appendChild(navGroup);

    skipBtnEl = document.createElement('button');
    skipBtnEl.type = 'button';
    skipBtnEl.id = 'intro-skip-btn';
    skipBtnEl.className = 'intro-skip-btn';
    skipBtnEl.textContent = 'Pular ⏭';
    skipBtnEl.setAttribute('aria-label', 'Pular história de introdução');
    skipBtnEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!skipVisible) return;
      playSfx('sfx-botao');
      window.GameAudio?.click?.();
      finishIntro('skip');
    });
    controlsBar.appendChild(skipBtnEl);

    rootEl.appendChild(controlsBar);
  }

  function clearIdleHintTimer() {
    if (idleHintTimer) {
      clearTimeout(idleHintTimer);
      idleHintTimer = null;
    }
    if (idleHintEl) idleHintEl.hidden = true;
  }

  function scheduleIdleHint() {
    clearIdleHintTimer();
    const page = PAGES[pageIndex];
    if (!active || !page || page.isFinalCard) return;
    idleHintTimer = setTimeout(() => {
      idleHintTimer = null;
      if (active && idleHintEl && !PAGES[pageIndex]?.isFinalCard) {
        idleHintEl.hidden = false;
      }
    }, IDLE_HINT_MS);
  }

  function clearMiniPanelTimers() {
    while (miniPanelTimers.length) {
      clearTimeout(miniPanelTimers.pop());
    }
  }

  function clearKeyStaggerTimers() {
    while (keyStaggerTimers.length) {
      clearTimeout(keyStaggerTimers.pop());
    }
  }

  function showSkipButton() {
    skipVisible = true;
    if (!skipBtnEl) return;
    skipBtnEl.hidden = false;
    skipBtnEl.disabled = false;
    skipBtnEl.setAttribute('aria-hidden', 'false');
    skipBtnEl.classList.add('is-visible');
  }

  function hideSkipButtonInitially() {
    skipVisible = false;
    if (!skipBtnEl) return;
    skipBtnEl.hidden = false;
    skipBtnEl.disabled = true;
    skipBtnEl.setAttribute('aria-hidden', 'true');
    skipBtnEl.classList.remove('is-visible');
  }

  function revealSkipOnInteraction() {
    if (skipTimer) {
      clearTimeout(skipTimer);
      skipTimer = null;
    }
    if (!skipVisible) {
      showSkipButton();
    }
  }

  function buildPageDom(page) {
    panelElsById.clear();
    stepElsById.clear();
    currentGlowLayerEl = null;
    clearMiniPanelTimers();

    pageSheetEl.innerHTML = '';
    pageSheetEl.className = 'hq-sheet ' + page.layout + (isCalmMode() ? ' is-calm' : '');
    pageSheetEl.dataset.pageNumber = String(page.pageNumber);

    // Cria os painéis da página
    for (const pDef of page.panels) {
      const panelWrap = document.createElement('article');
      panelWrap.className = 'hq-panel hq-' + pDef.id;
      panelWrap.dataset.panelId = pDef.id;
      panelWrap.dataset.sceneId = pDef.sceneId;
      panelWrap.style.setProperty('--panel-tilt', (pDef.tilt || 0) + 'deg');
      panelWrap.hidden = true;

      const artBox = document.createElement('div');
      artBox.className = 'hq-panel-art';

      const img = document.createElement('img');
      img.className = 'hq-panel-img';
      img.src = pDef.src;
      img.alt = pDef.alt;
      img.draggable = false;
      artBox.appendChild(img);

      // Camada de brilhos das 4 chaves e 4 cadeados no painel I (intro-07)
      if (pDef.hasKeyLockGlow) {
        const glowLayer = document.createElement('div');
        glowLayer.id = 'intro-highlights-layer';
        glowLayer.className = 'intro-highlights-layer';
        glowLayer.setAttribute('aria-hidden', 'true');
        glowLayer.hidden = true;
        for (const spot of INTRO_07_SPOTS) {
          const s = document.createElement('span');
          s.className = 'intro-glow-spot is-' + spot.kind + ' glow-' + spot.color;
          s.style.left = spot.x + '%';
          s.style.top = spot.y + '%';
          glowLayer.appendChild(s);
        }
        artBox.appendChild(glowLayer);
        currentGlowLayerEl = glowLayer;
      }

      // Mini-painel opcional (hq-*.webp): removido automaticamente se a imagem não existir
      if (pDef.miniPanel && pDef.miniPanel.src) {
        const mini = document.createElement('figure');
        mini.className = 'hq-mini-panel ' + (pDef.miniPanel.pos || 'pos-bottom-right');
        mini.hidden = true;

        const miniImg = document.createElement('img');
        miniImg.className = 'hq-mini-img';
        miniImg.src = pDef.miniPanel.src;
        miniImg.alt = pDef.miniPanel.alt || '';
        miniImg.draggable = false;
        miniImg.onerror = () => {
          mini.remove();
        };
        mini.appendChild(miniImg);
        artBox.appendChild(mini);
        panelWrap._miniEl = mini;
      }

      const overlaysBox = document.createElement('div');
      overlaysBox.className = 'hq-panel-overlays';
      artBox.appendChild(overlaysBox);

      panelWrap.appendChild(artBox);
      panelWrap._overlaysBox = overlaysBox;
      pageSheetEl.appendChild(panelWrap);
      panelElsById.set(pDef.id, panelWrap);
    }

    // Cria os elementos de texto (legendas, balões e palavras de efeito) nos respectivos painéis
    for (const step of page.steps) {
      if (step.kind === 'panel' || step.kind === 'final-card') continue;
      const panelWrap = panelElsById.get(step.panelId);
      if (!panelWrap) continue;

      let el;
      if (step.kind === 'caption') {
        el = document.createElement('div');
        const isVillainVoice = step.theme === 'villain-caption';
        el.className = 'hq-item hq-caption ' + (step.pos || 'pos-top-left') + (isVillainVoice ? ' hq-caption--villain' : '');
        if (isVillainVoice && step.speaker) {
          const badge = document.createElement('span');
          badge.className = 'hq-speaker-tag';
          badge.textContent = step.speaker;
          el.appendChild(badge);
        }
        const p = document.createElement('p');
        p.className = 'hq-item-text';
        p.textContent = step.text;
        el.appendChild(p);
      } else if (step.kind === 'bubble') {
        el = document.createElement('div');
        el.className =
          'hq-item hq-bubble theme-' + (step.theme || 'girl') + ' ' +
          (step.pos || 'pos-top-left') + ' ' +
          (step.tail || 'tail-down');
        if (step.speaker) {
          const tag = document.createElement('span');
          tag.className = 'hq-speaker-tag';
          tag.textContent = step.speaker;
          el.appendChild(tag);
        }
        const p = document.createElement('p');
        p.className = 'hq-item-text';
        p.textContent = step.text;
        el.appendChild(p);
      } else if (step.kind === 'sfx') {
        el = document.createElement('div');
        el.className = 'hq-item hq-sfx-word ' + (step.pos || '');
        el.style.setProperty('--sfx-rot', (step.rotate || -6) + 'deg');
        const span = document.createElement('span');
        span.className = 'hq-sfx-inner';
        span.textContent = step.text;
        el.appendChild(span);
      }

      if (el) {
        el.hidden = true;
        el.dataset.stepId = step.id;
        panelWrap._overlaysBox.appendChild(el);
        stepElsById.set(step.id, el);
      }
    }
  }

  function renderFinalCard() {
    clearKeyStaggerTimers();
    if (!finalKeysContainerEl) return;
    finalKeysContainerEl.innerHTML = '';

    const calm = isCalmMode();
    const regions = getObjectiveRegions();

    regions.forEach((reg, idx) => {
      const item = document.createElement('div');
      item.className = 'intro-key-item';
      item.dataset.regionId = reg.id;
      item.dataset.keyColor = reg.colorKey;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'intro-key-icon-wrap';
      iconWrap.setAttribute('aria-label', reg.label);
      iconWrap.innerHTML = createKeySvgMarkup(reg.fill, reg.stroke);

      const nameEl = document.createElement('span');
      nameEl.className = 'intro-key-region';
      nameEl.textContent = reg.regionName;

      item.appendChild(iconWrap);
      item.appendChild(nameEl);
      finalKeysContainerEl.appendChild(item);

      if (calm) {
        item.classList.add('is-entered');
        if (idx === 0) playSfx('sfx-chave');
      } else {
        const timer = setTimeout(() => {
          item.classList.add('is-entered');
          playSfx('sfx-chave');
        }, (idx + 1) * FINAL_KEY_STAGGER_MS);
        keyStaggerTimers.push(timer);
      }
    });

    if (liveAnnounceEl) {
      liveAnnounceEl.textContent =
        'Seu objetivo: Ache as 4 chaves nas regiões ' +
        regions.map(r => r.regionName).join(', ') +
        ', abra os 4 cadeados e salve o gato!';
    }

    if (letsGoBtnEl) {
      letsGoBtnEl.classList.toggle('is-calm', calm);
      letsGoBtnEl.focus();
    }
  }

  function applyRevealedStepsUpTo(targetStepIndex, animateLast = true) {
    const page = PAGES[pageIndex];
    if (!page || page.isFinalCard) return;

    const calm = isCalmMode();
    let glowActive = false;

    for (let i = 0; i < page.steps.length; i++) {
      const step = page.steps[i];
      const isVisible = i <= targetStepIndex;
      const isCurrentNew = (i === targetStepIndex) && animateLast && !calm;

      if (step.kind === 'panel') {
        const panelEl = panelElsById.get(step.panelId);
        if (panelEl) {
          panelEl.hidden = !isVisible;
          panelEl.classList.toggle('is-revealed', isVisible);
          panelEl.classList.toggle('anim-panel-in', isCurrentNew);

          const miniEl = panelEl._miniEl;
          if (miniEl) {
            if (!isVisible) {
              miniEl.hidden = true;
              miniEl.classList.remove('is-revealed', 'anim-mini-in');
            } else if (isCurrentNew) {
              miniEl.hidden = true;
              const t = setTimeout(() => {
                if (!active) return;
                miniEl.hidden = false;
                miniEl.classList.add('is-revealed', 'anim-mini-in');
              }, MINI_PANEL_DELAY_MS);
              miniPanelTimers.push(t);
            } else {
              miniEl.hidden = false;
              miniEl.classList.add('is-revealed');
              miniEl.classList.remove('anim-mini-in');
            }
          }

          if (isVisible && i === targetStepIndex && typeof panelEl.scrollIntoView === 'function') {
            try {
              panelEl.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
            } catch {}
          }
        }
      } else {
        const stepEl = stepElsById.get(step.id);
        if (stepEl) {
          stepEl.hidden = !isVisible;
          stepEl.classList.toggle('is-revealed', isVisible);
          stepEl.classList.toggle('anim-item-in', isCurrentNew);
        }
        if (isVisible && step.glowKeysLocks) {
          glowActive = true;
        }
      }
    }

    if (currentGlowLayerEl) {
      currentGlowLayerEl.hidden = !glowActive;
    }

    // Atualiza anúncio acessível e toca sons do passo recém-revelado
    const currentStep = page.steps[targetStepIndex];
    if (currentStep) {
      if (liveAnnounceEl) {
        if (currentStep.text) {
          liveAnnounceEl.textContent = (currentStep.speaker ? currentStep.speaker + ': ' : '') + currentStep.text;
        } else if (currentStep.announce) {
          liveAnnounceEl.textContent = currentStep.announce;
        }
      }
      if (animateLast && Array.isArray(currentStep.sfx)) {
        for (const sfxName of currentStep.sfx) {
          playSfx(sfxName);
        }
      }
    }
  }

  function updateDotsAndNav() {
    for (let i = 0; i < dotEls.length; i++) {
      const d = dotEls[i];
      d.classList.toggle('is-active', i === pageIndex);
      d.classList.toggle('is-completed', i < pageIndex);
      if (i === pageIndex) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    }

    const atVeryStart = pageIndex === 0 && stepIndex === 0;
    const isFinal = Boolean(PAGES[pageIndex]?.isFinalCard);
    if (prevBtnEl) prevBtnEl.disabled = atVeryStart;
    if (nextBtnEl) {
      nextBtnEl.hidden = isFinal;
      nextBtnEl.disabled = isFinal;
    }
  }

  function openPage(targetPageIdx, targetStepIdx = 0, animateEntry = true) {
    if (pageTurnTimer) {
      clearTimeout(pageTurnTimer);
      pageTurnTimer = null;
    }

    pageIndex = Math.max(0, Math.min(PAGES.length - 1, targetPageIdx));
    const page = PAGES[pageIndex];
    stepIndex = Math.max(0, Math.min(page.steps.length - 1, targetStepIdx));

    preloadPageAssets(pageIndex);

    if (page.isFinalCard) {
      viewportEl.hidden = true;
      finalCardWrapEl.hidden = false;
      clearIdleHintTimer();
      if (animateEntry) playSfx('sfx-pagina');
      renderFinalCard();
      updateDotsAndNav();
      return;
    }

    finalCardWrapEl.hidden = true;
    viewportEl.hidden = false;

    buildPageDom(page);
    applyRevealedStepsUpTo(stepIndex, animateEntry);
    updateDotsAndNav();
    scheduleIdleHint();
  }

  function turnToPage(nextPageIdx, nextStepIdx = 0) {
    const calm = isCalmMode();
    playSfx('sfx-pagina');

    if (calm || !pageSheetEl) {
      openPage(nextPageIdx, nextStepIdx, true);
      return;
    }

    pageSheetEl.classList.add('is-turning-out');
    pageTurnTimer = setTimeout(() => {
      pageTurnTimer = null;
      if (!active) return;
      pageSheetEl.classList.remove('is-turning-out');
      openPage(nextPageIdx, nextStepIdx, true);
      pageSheetEl.classList.add('is-turning-in');
      setTimeout(() => {
        if (pageSheetEl) pageSheetEl.classList.remove('is-turning-in');
      }, PAGE_TURN_MS);
    }, PAGE_TURN_MS / 2);
  }

  function handleAdvance() {
    if (!active) return;
    const page = PAGES[pageIndex];
    if (!page) return;

    if (page.isFinalCard) {
      playSfx('sfx-botao');
      finishIntro('complete');
      return;
    }

    // Se ainda há itens para revelar nesta página, revela o próximo item
    if (stepIndex + 1 < page.steps.length) {
      stepIndex++;
      applyRevealedStepsUpTo(stepIndex, true);
      updateDotsAndNav();
      scheduleIdleHint();
      return;
    }

    // Página concluída: próximo toque vira a página
    if (pageIndex + 1 < PAGES.length) {
      turnToPage(pageIndex + 1, 0);
    } else {
      finishIntro('complete');
    }
  }

  function handleBack() {
    if (!active) return;
    const page = PAGES[pageIndex];
    if (!page) return;

    if (!page.isFinalCard && stepIndex > 0) {
      stepIndex--;
      applyRevealedStepsUpTo(stepIndex, false);
      updateDotsAndNav();
      scheduleIdleHint();
      return;
    }

    if (pageIndex > 0) {
      const prevIdx = pageIndex - 1;
      const prevPage = PAGES[prevIdx];
      const lastStep = prevPage.steps.length - 1;
      openPage(prevIdx, lastStep, false);
    }
  }

  function onKeyDown(event) {
    if (!active) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key;

    if (key === 'Tab') {
      const focusable = [];
      if (PAGES[pageIndex]?.isFinalCard && letsGoBtnEl && !finalCardWrapEl.hidden) {
        focusable.push(letsGoBtnEl);
      }
      if (prevBtnEl && !prevBtnEl.disabled) focusable.push(prevBtnEl);
      if (nextBtnEl && !nextBtnEl.disabled && !nextBtnEl.hidden) focusable.push(nextBtnEl);
      if (skipBtnEl && skipVisible && !skipBtnEl.disabled) focusable.push(skipBtnEl);

      if (focusable.length > 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const currentIdx = focusable.indexOf(document.activeElement);
        const dir = event.shiftKey ? -1 : 1;
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + dir + focusable.length) % focusable.length;
        focusable[nextIdx].focus();
      }
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (skipVisible) {
        playSfx('sfx-botao');
        window.GameAudio?.click?.();
        finishIntro('skip');
      }
      return;
    }

    if (key === 'ArrowRight' || key === 'Enter' || key === ' ') {
      if ((key === 'Enter' || key === ' ') && document.activeElement === skipBtnEl && skipVisible) {
        event.preventDefault();
        event.stopImmediatePropagation();
        playSfx('sfx-botao');
        window.GameAudio?.click?.();
        finishIntro('skip');
        return;
      }
      if ((key === 'Enter' || key === ' ') && document.activeElement === prevBtnEl) {
        event.preventDefault();
        event.stopImmediatePropagation();
        revealSkipOnInteraction();
        handleBack();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      revealSkipOnInteraction();
      handleAdvance();
      return;
    }

    if (key === 'ArrowLeft') {
      event.preventDefault();
      event.stopImmediatePropagation();
      revealSkipOnInteraction();
      handleBack();
    }
  }

  function cleanupTimersAndListeners() {
    clearIdleHintTimer();
    clearMiniPanelTimers();
    clearKeyStaggerTimers();
    if (skipTimer) {
      clearTimeout(skipTimer);
      skipTimer = null;
    }
    if (pageTurnTimer) {
      clearTimeout(pageTurnTimer);
      pageTurnTimer = null;
    }
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function finishIntro(reason = 'complete') {
    if (!active) return;
    active = false;
    cleanupTimersAndListeners();
    if (rootEl) rootEl.hidden = true;

    const cb = finishCallback;
    finishCallback = null;

    if (typeof cb === 'function') {
      cb(reason);
    } else if (returnFocusEl && typeof returnFocusEl.focus === 'function') {
      returnFocusEl.focus();
    }
  }

  function play(onFinish) {
    ensureDom();
    cleanupTimersAndListeners();

    returnFocusEl = document.activeElement;
    finishCallback = typeof onFinish === 'function' ? onFinish : null;

    // 1. Lê o sinal "intro já vista" ANTES de começar
    seenBeforeThisRun = hasSeenIntro();
    // 2. Grava assim que a intro abre
    markIntroSeen();

    active = true;
    pageIndex = 0;
    stepIndex = 0;
    rootEl.hidden = false;

    // 3. Regra do botão Pular:
    // - Primeira vez: começa escondido e aparece ao tocar/clicar OU após PULAR_APARECE_PRIMEIRA_VEZ_MS (6000 ms)
    // - Próximas vezes: já aparece desde o primeiro quadro
    if (seenBeforeThisRun) {
      showSkipButton();
    } else {
      hideSkipButtonInitially();
      skipTimer = setTimeout(() => {
        skipTimer = null;
        if (active) showSkipButton();
      }, PULAR_APARECE_PRIMEIRA_VEZ_MS);
    }

    openPage(0, 0, true);
    document.addEventListener('keydown', onKeyDown, true);

    if (nextBtnEl) nextBtnEl.focus();
  }

  return {
    PULAR_APARECE_PRIMEIRA_VEZ_MS,
    IDLE_HINT_MS,
    INTRO_SEEN_STORAGE_KEY,
    PAGES,
    SCENES,
    SFX_NAMES,
    play,
    playSfx,
    close: () => finishIntro('close'),
    hasSeenIntro,
    markIntroSeen,
    resetSeenForTest,
    get active() { return active; },
    get pageIndex() { return pageIndex; },
    get stepIndex() { return stepIndex; },
    get sceneIndex() { return pageIndex; },
    get lineIndex() { return stepIndex; },
    get isTyping() { return false; },
    get skipVisible() { return skipVisible; }
  };
})();
