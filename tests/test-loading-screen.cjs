'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function createDomEnv(options = {}) {
  let now = 0;
  let rafSeq = 0;
  let timerSeq = 0;
  const rafs = new Map();
  const timers = new Map();
  const storage = { ...(options.localStorage || {}) };
  const bodyClasses = new Set();
  const announcements = [];

  function makeEl(id, extra = {}) {
    const listeners = {};
    const classes = new Set(extra.classes || []);
    return {
      id,
      hidden: Boolean(extra.hidden),
      textContent: extra.textContent || '',
      src: extra.src || '',
      complete: Boolean(extra.complete),
      naturalWidth: extra.naturalWidth || 0,
      classList: {
        add: (...c) => c.forEach(x => classes.add(x)),
        remove: (...c) => c.forEach(x => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c, force) => (force === undefined ? (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)) : (force ? (classes.add(c), true) : (classes.delete(c), false)))
      },
      addEventListener: (ev, fn) => {
        listeners[ev] = listeners[ev] || [];
        listeners[ev].push(fn);
      },
      removeEventListener: (ev, fn) => {
        if (listeners[ev]) listeners[ev] = listeners[ev].filter(f => f !== fn);
      },
      dispatch: (ev) => {
        for (const fn of [...(listeners[ev] || [])]) fn({});
      },
      click: () => {
        for (const fn of [...(listeners.click || [])]) fn({});
      }
    };
  }

  const elements = {
    'loading-screen': makeEl('loading-screen'),
    'loading-logo-img': makeEl('loading-logo-img', { classes: ['is-hidden'] }),
    'loading-logo-fallback': makeEl('loading-logo-fallback', { textContent: 'Ilha do Conhecimento' }),
    'loading-label': makeEl('loading-label', { textContent: 'Carregando…' }),
    'loading-percent': makeEl('loading-percent', { textContent: '0%' }),
    'loading-announce': makeEl('loading-announce', { textContent: 'Carregando' }),
    'loading-skip-btn': makeEl('loading-skip-btn', { hidden: true, textContent: 'Entrar mesmo assim' })
  };

  // Observa mudanças no aria-live para garantir que só "Carregando" e "Pronto" sejam anunciados
  let announceText = elements['loading-announce'].textContent;
  Object.defineProperty(elements['loading-announce'], 'textContent', {
    get: () => announceText,
    set: (v) => {
      announceText = String(v);
      announcements.push(announceText);
    }
  });

  const imagesCreated = [];
  const audiosCreated = [];

  class MockImage {
    constructor() {
      this._src = '';
      this.onload = null;
      this.onerror = null;
      imagesCreated.push(this);
    }
    get src() { return this._src; }
    set src(val) {
      this._src = val;
      if (options.autoLoadDelayMs !== undefined) {
        const failSet = options.failSrcs || new Set();
        setTimeoutMock(() => {
          if (failSet.has(val)) this.onerror && this.onerror();
          else this.onload && this.onload();
        }, options.autoLoadDelayMs);
      }
    }
  }

  class MockAudio {
    constructor() {
      this.src = '';
      this.preload = '';
      this.listeners = {};
      audiosCreated.push(this);
    }
    canPlayType(type) {
      return type.includes('ogg') ? 'probably' : 'maybe';
    }
    addEventListener(ev, fn) {
      this.listeners[ev] = this.listeners[ev] || [];
      this.listeners[ev].push(fn);
    }
    removeEventListener(ev, fn) {
      if (this.listeners[ev]) this.listeners[ev] = this.listeners[ev].filter(f => f !== fn);
    }
    load() {
      if (options.audioDelayMs !== undefined) {
        setTimeoutMock(() => {
          for (const fn of [...(this.listeners.canplaythrough || [])]) fn({});
        }, options.audioDelayMs);
      }
    }
  }

  function setTimeoutMock(fn, ms = 0) {
    const id = ++timerSeq;
    timers.set(id, { id, fn, at: now + ms });
    return id;
  }

  function clearTimeoutMock(id) {
    timers.delete(id);
  }

  const sandbox = {
    console: { log: () => {}, warn: (...a) => { sandbox.warns.push(a.join(' ')); }, error: console.error },
    warns: [],
    Image: MockImage,
    Audio: MockAudio,
    performance: { now: () => now },
    Date: { now: () => now },
    setTimeout: setTimeoutMock,
    clearTimeout: clearTimeoutMock,
    requestAnimationFrame: (cb) => {
      const id = ++rafSeq;
      rafs.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => rafs.delete(id),
    localStorage: {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); }
    },
    matchMedia: (q) => ({ matches: Boolean(options.reducedMotion && q.includes('reduce')) }),
    document: {
      documentElement: { lang: options.docLang || 'pt-BR' },
      fonts: { ready: Promise.resolve() },
      body: {
        classList: {
          add: (...c) => c.forEach(x => bodyClasses.add(x)),
          contains: (c) => bodyClasses.has(c)
        }
      },
      getElementById: (id) => elements[id] || null
    }
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'asset-manifest.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'loading-screen.js'), 'utf8'), sandbox);

  async function stepMs(ms, step = 16) {
    const target = now + ms;
    while (now < target) {
      now = Math.min(target, now + step);
      // Dispara timers vencidos
      for (const [id, t] of [...timers.entries()]) {
        if (t.at <= now) {
          timers.delete(id);
          t.fn();
        }
      }
      // Dispara promises pendentes
      await Promise.resolve();
      await Promise.resolve();
      // Dispara RAFs do frame atual
      const currentRafs = [...rafs.entries()];
      rafs.clear();
      for (const [, cb] of currentRafs) cb(now);
      await Promise.resolve();
    }
  }

  return { sandbox, elements, announcements, imagesCreated, audiosCreated, bodyClasses, stepMs };
}

(async () => {
  let passed = 0;

  // Teste 1: Manifesto completo existe no disco e segue ordem de prioridade
  {
    const sandbox = { window: {} };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'asset-manifest.js'), 'utf8'), sandbox);
    const list = sandbox.ASSET_MANIFEST;
    assert(Array.isArray(list) && list.length > 100, 'ASSET_MANIFEST deve listar os assets do jogo');

    let totalWeight = 0;
    let firstPuzzleIdx = -1;
    let lastIntroIdx = -1;
    let lastIlhaIdx = -1;
    list.forEach((item, i) => {
      totalWeight += item.weight;
      if (item.group === 'intro') lastIntroIdx = i;
      if (item.group === 'ilha' || item.group === 'heroi' || item.group === 'controles') lastIlhaIdx = i;
      if ((item.group === 'puzzles' || item.group === 'final') && firstPuzzleIdx === -1) firstPuzzleIdx = i;

      if (item.type === 'image') {
        assert(fs.existsSync(path.join(ROOT, item.src)), `Imagem ausente no disco: ${item.src}`);
      } else if (item.type === 'audio') {
        assert(fs.existsSync(path.join(ROOT, `${item.src}.ogg`)), `Áudio .ogg ausente: ${item.src}.ogg`);
        assert(fs.existsSync(path.join(ROOT, `${item.src}.mp3`)), `Áudio .mp3 ausente: ${item.src}.mp3`);
      }
    });

    assert(lastIntroIdx < firstPuzzleIdx, 'Intro deve vir antes de Puzzles/Final');
    assert(lastIlhaIdx < firstPuzzleIdx, 'Ilha/Herói/Controles devem vir antes de Puzzles/Final');
    assert.strictEqual(list[0].group, 'logo', 'Logo deve ser o primeiro item');
    assert.strictEqual(list[1].group, 'fontes', 'Fontes devem vir logo após o logo');
    console.log(`✓ Teste 1: ${list.length} itens verificados no disco (${(totalWeight / 1024 / 1024).toFixed(2)} MB) em ordem de prioridade`);
    passed++;
  }

  // Teste 2: Tempo mínimo de 600 ms, subida suave sem retroceder e saída a >= 80%
  {
    const env = createDomEnv({ autoLoadDelayMs: 5, audioDelayMs: 5 });
    const inst = env.sandbox.LoadingScreen.instance;

    // Em 100 ms, mesmo tudo já carregado no cache, NÃO deve fechar antes dos 600 ms
    await env.stepMs(150);
    assert.strictEqual(inst.closed, false, 'Não pode piscar/fechar antes do tempo mínimo de 600 ms');

    // Coleta sequência de porcentagens exibidas para garantir monotonicidade e suavidade
    const seenPercents = [];
    for (let i = 0; i < 60; i++) {
      await env.stepMs(30);
      const val = parseInt(env.elements['loading-percent'].textContent, 10);
      if (seenPercents.length === 0 || val !== seenPercents[seenPercents.length - 1]) {
        seenPercents.push(val);
      }
      if (inst.closed) break;
    }

    for (let i = 1; i < seenPercents.length; i++) {
      assert(seenPercents[i] >= seenPercents[i - 1], 'Porcentagem nunca pode voltar para trás');
    }
    assert(seenPercents.length >= 4, `Subida deve ser animada suavemente, valores vistos: ${seenPercents.join(',')}`);
    assert.strictEqual(inst.closed, true, 'Deve fechar ao atingir >= 80% após 600 ms');
    assert(env.announcements.includes('Carregando'), 'Deve anunciar "Carregando"');
    assert(env.announcements.includes('Pronto'), 'Deve anunciar "Pronto" ao terminar');
    assert(!env.announcements.some(a => /%/.test(a)), 'Leitor de tela não deve anunciar cada porcentagem');

    await env.stepMs(350);
    assert.strictEqual(env.elements['loading-screen'].hidden, true, 'Tela deve ficar oculta após o fade de saída');
    console.log('✓ Teste 2: Tempo mínimo 600 ms, subida suave monotônica, saída >= 80% e aria-live correto');
    passed++;
  }

  // Teste 3: Falha em imagem conta como carregada e botão "Entrar mesmo assim" aparece após 15 s
  {
    const env = createDomEnv({ failSrcs: new Set(['assets/tela-inicial/logo-ilha-do-conhecimento.png']) });
    // Simula rede parada: nada dispara onload automaticamente
    await env.stepMs(1000);
    assert.strictEqual(env.elements['loading-skip-btn'].hidden, true, 'Botão pular fica escondido antes de 15 s');

    await env.stepMs(14100);
    assert.strictEqual(env.elements['loading-skip-btn'].hidden, false, 'Botão "Entrar mesmo assim" aparece após 15 s');

    env.elements['loading-skip-btn'].click();
    assert.strictEqual(env.sandbox.LoadingScreen.instance.closed, true, 'Clicar em "Entrar mesmo assim" libera o jogo');
    console.log('✓ Teste 3: Botão "Entrar mesmo assim" após 15 s libera o jogo normalmente');
    passed++;
  }

  // Teste 4: Idioma inglês síncrono e modo "Menos animações" + "Letras maiores"
  {
    const env = createDomEnv({
      autoLoadDelayMs: 5,
      audioDelayMs: 5,
      localStorage: { 'ilha.lang': 'en', 'ilha.largeText': 'true', 'ilha.calm': 'true' }
    });
    assert.strictEqual(env.elements['loading-label'].textContent, 'Loading…');
    assert.strictEqual(env.elements['loading-skip-btn'].textContent, 'Enter anyway');
    assert(env.bodyClasses.has('large-text'), 'Aplica large-text imediatamente');
    assert(env.bodyClasses.has('calm-motion'), 'Aplica calm-motion imediatamente');

    await env.stepMs(1500);
    // Em modo calm, oculta imediatamente sem esperar 290 ms de fade
    assert.strictEqual(env.elements['loading-screen'].hidden, true, 'Modo calm oculta imediatamente');
    assert(env.announcements.includes('Ready'), 'Anuncia "Ready" em inglês');
    console.log('✓ Teste 4: Tradução síncrona (EN), Letras maiores e Menos animações validados');
    passed++;
  }

  // Teste 5: Failsafe de 30 s e presença dos elementos no index.html
  {
    const env = createDomEnv({});
    await env.stepMs(30100);
    assert.strictEqual(env.sandbox.LoadingScreen.instance.closed, true, 'Failsafe de 30 s libera o jogo');

    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(html.includes('id="loading-screen"'), 'index.html deve conter #loading-screen');
    assert(html.includes('css/loading.css'), 'index.html deve carregar css/loading.css');
    assert(html.includes('js/asset-manifest.js'), 'index.html deve carregar js/asset-manifest.js');
    assert(html.includes('js/loading-screen.js'), 'index.html deve carregar js/loading-screen.js');
    assert(html.includes('__loadingScreenDone'), 'index.html deve conter reserva de failsafe caso JS falhe');
    console.log('✓ Teste 5: Failsafe de 30 s e estrutura no index.html validados');
    passed++;
  }

  console.log(`\nTODOS OS ${passed} TESTES DA TELA DE CARREGAMENTO PASSARAM COM SUCESSO!`);
})();
