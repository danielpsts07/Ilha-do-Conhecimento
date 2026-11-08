const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function runIntroStoryTests() {
  const elements = [];
  let timers = [];
  let nextTimerId = 1;
  const playedAudio = [];

  class MockClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    add(...cls) { cls.forEach(c => this.set.add(c)); this.sync(); }
    remove(...cls) { cls.forEach(c => this.set.delete(c)); this.sync(); }
    toggle(c, force) {
      const on = force !== undefined ? Boolean(force) : !this.set.has(c);
      if (on) this.set.add(c); else this.set.delete(c);
      this.sync();
      return on;
    }
    contains(c) { return this.set.has(c); }
    sync() { this.el._className = Array.from(this.set).join(' '); }
  }

  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.id = '';
      this._className = '';
      this.classList = new MockClassList(this);
      this.textContent = '';
      this._innerHTML = '';
      this.hidden = false;
      this.disabled = false;
      this.style = { setProperty(k, v) { this[k] = v; } };
      this.dataset = {};
      this.children = [];
      this.parentNode = null;
      this.attrs = {};
      this.listeners = {};
      this.offsetWidth = 800;
      this.scrollTop = 0;
      this.scrolledIntoView = false;
      elements.push(this);
    }
    get className() { return this._className; }
    set className(v) {
      this._className = String(v || '');
      this.classList.set = new Set(this._className.split(/\s+/).filter(Boolean));
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) {
      this._innerHTML = String(v || '');
      if (v === '') this.children = [];
    }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i >= 0) this.children.splice(i, 1);
      child.parentNode = null;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    addEventListener(type, fn) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(fn);
    }
    removeEventListener(type, fn) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter(f => f !== fn);
    }
    click() {
      const list = this.listeners.click || [];
      for (const fn of list) fn({ target: this, preventDefault: () => {}, stopPropagation: () => {}, stopImmediatePropagation: () => {} });
    }
    focus() { mockDocument.activeElement = this; }
    scrollIntoView() { this.scrolledIntoView = true; }
    closest(sel) {
      if (sel === 'button' && this.tagName === 'BUTTON') return this;
      return null;
    }
    querySelectorAll(sel) {
      const results = [];
      const visit = (node) => {
        for (const c of node.children) {
          if (sel.startsWith('.') && c.classList.contains(sel.slice(1))) results.push(c);
          visit(c);
        }
      };
      visit(this);
      return results;
    }
  }

  const docListeners = {};
  const mockDocument = {
    body: new MockElement('BODY'),
    activeElement: null,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.find(e => e.id === id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.find(e => e.id === sel.slice(1)) || null;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: (type, fn) => {
      docListeners[type] = docListeners[type] || [];
      docListeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!docListeners[type]) return;
      docListeners[type] = docListeners[type].filter(f => f !== fn);
    }
  };

  // Mock controls for sound volume and mute
  const toggleMuteEl = new MockElement('INPUT');
  toggleMuteEl.id = 'toggle-mute';
  toggleMuteEl.checked = false;
  const soundVolEl = new MockElement('INPUT');
  soundVolEl.id = 'sound-volume';
  soundVolEl.value = '80';

  function dispatchKey(key, opts = {}) {
    const list = docListeners.keydown ? [...docListeners.keydown] : [];
    for (const fn of list) {
      fn({
        key,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: Boolean(opts.shiftKey),
        preventDefault: () => {},
        stopImmediatePropagation: () => {}
      });
    }
  }

  const storageMap = new Map();
  const mockLocalStorage = {
    getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k)
  };

  class MockAudio {
    constructor() {
      this.src = '';
      this.volume = 1;
      this.currentTime = 0;
      this.preload = 'auto';
      this.onerror = null;
    }
    play() {
      playedAudio.push({ src: this.src, volume: this.volume });
      return Promise.resolve();
    }
  }

  const sandbox = {
    console,
    localStorage: mockLocalStorage,
    Image: class { constructor() { this.src = ''; } },
    Audio: MockAudio,
    setTimeout: (fn, ms) => {
      const id = nextTimerId++;
      timers.push({ id, fn, ms, type: 'timeout' });
      return id;
    },
    clearTimeout: (id) => {
      timers = timers.filter(t => t.id !== id);
    },
    setInterval: (fn, ms) => {
      const id = nextTimerId++;
      timers.push({ id, fn, ms, type: 'interval' });
      return id;
    },
    clearInterval: (id) => {
      timers = timers.filter(t => t.id !== id);
    },
    GameAudio: { click: () => {} },
    window: {
      innerWidth: 1280,
      innerHeight: 720,
      Audio: MockAudio,
      matchMedia: () => ({ matches: false }),
      addEventListener: () => {},
      removeEventListener: () => {},
      GameSettings: { calm: false, get: () => false },
      ISLAND_REGIONS: [
        { id: 'mountain', name: 'Pico do Miau' },
        { id: 'center', name: 'Praça do Portal' },
        { id: 'ruins', name: 'Ruínas das Formas' },
        { id: 'farm', name: 'Campos Contados' },
        { id: 'forest', name: 'Floresta dos Padrões' },
        { id: 'village', name: 'Aldeia do Saber' }
      ]
    },
    document: mockDocument
  };
  sandbox.window.document = mockDocument;
  sandbox.window.localStorage = mockLocalStorage;
  sandbox.window.GameAudio = sandbox.GameAudio;

  vm.createContext(sandbox);

  const introCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'intro-story.js'), 'utf8');
  vm.runInContext(introCode, sandbox);

  const IntroStory = sandbox.window.IntroStory;
  assert(IntroStory, 'window.IntroStory deve estar definido');

  // TESTE 1: Constantes, 5 páginas (4 páginas de HQ + 1 Cartão Final) e arquivos opcionais
  assert.strictEqual(IntroStory.PULAR_APARECE_PRIMEIRA_VEZ_MS, 6000, 'PULAR_APARECE_PRIMEIRA_VEZ_MS deve ser 6000');
  assert.strictEqual(IntroStory.IDLE_HINT_MS, 3000, 'IDLE_HINT_MS deve ser 3000 (3 s sem tocar)');
  assert.strictEqual(IntroStory.PAGES.length, 5, 'Devem existir 5 páginas (4 páginas de HQ + 1 Cartão Final)');
  assert.strictEqual(IntroStory.isTyping, false, 'HQ não usa efeito de máquina de escrever (isTyping sempre false)');

  // Verifica que os 7 arquivos hq-*.webp e 26 arquivos de áudio estão nas pastas esperadas
  const hqImages = [
    'hq-livro-sorriso.webp',
    'hq-rosto-menina.webp',
    'hq-gato-susto.webp',
    'hq-pulo.webp',
    'hq-gato-preso.webp',
    'hq-menina-determinada.webp',
    'hq-quatro-chaves.webp'
  ];
  for (const f of hqImages) {
    assert(fs.existsSync(path.join(__dirname, '..', 'intro', f)), `Mini-quadrinho opcional intro/${f} deve existir`);
  }
  const sfxNames = [
    'sfx-painel', 'sfx-balao', 'sfx-pagina', 'sfx-livro-acorda',
    'sfx-risada-livro', 'sfx-miau', 'sfx-portal', 'sfx-pulo',
    'sfx-queda', 'sfx-puf', 'sfx-cadeado', 'sfx-chave', 'sfx-botao'
  ];
  for (const s of sfxNames) {
    assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'audio', 'sfx-intro', `${s}.ogg`)), `Áudio ${s}.ogg deve existir`);
    assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'audio', 'sfx-intro', `${s}.mp3`)), `Áudio ${s}.mp3 deve existir`);
  }
  console.log('✓ Teste 1: 5 páginas de HQ, sem máquina de escrever e assets opcionais verificados');

  // TESTE 2: Primeira vez — sinal lido antes, gravado ao abrir, botão Pular começa escondido e aparece aos 6000 ms
  IntroStory.resetSeenForTest();
  assert.strictEqual(IntroStory.hasSeenIntro(), false, 'Antes da 1ª vez, introSeen deve ser false');

  let finishedCount = 0;
  let lastReason = null;
  IntroStory.play((reason) => { finishedCount++; lastReason = reason; });

  assert.strictEqual(IntroStory.active, true, 'Intro deve estar ativa');
  assert.strictEqual(IntroStory.hasSeenIntro(), true, 'Sinal introSeen deve ser gravado assim que a intro abre');
  assert.strictEqual(mockLocalStorage.getItem('ilha.introSeen'), 'true', 'Salvo em localStorage sob ilha.introSeen');
  assert.strictEqual(IntroStory.skipVisible, false, 'Na 1ª vez, botão Pular começa escondido');

  // Escape enquanto Pular está escondido NÃO deve fechar a intro
  dispatchKey('Escape');
  assert.strictEqual(IntroStory.active, true, 'Escape não deve pular enquanto o botão Pular estiver escondido');

  // Verifica bolinhas de progresso: 5 bolinhas (4 páginas + cartão final)
  const dotsWrap = mockDocument.getElementById('intro-progress-dots');
  assert.strictEqual(dotsWrap.children.length, 5, 'Devem existir 5 bolinhas de progresso no rodapé');

  // Verifica seta discreta "▶" após 3 segundos sem tocar
  const idleHint = mockDocument.getElementById('intro-idle-hint');
  assert.strictEqual(idleHint.hidden, true, 'Seta discreta ▶ começa escondida');
  const idleTimeout = timers.find(t => t.type === 'timeout' && t.ms === 3000);
  assert(idleTimeout, 'Deve existir timer de 3000 ms para mostrar a seta discreta ▶');
  idleTimeout.fn();
  assert.strictEqual(idleHint.hidden, false, 'Após 3 s sem tocar, seta discreta ▶ aparece');

  // Dispara o timer de 6000 ms do botão Pular
  const skipTimeout = timers.find(t => t.type === 'timeout' && t.ms === 6000);
  assert(skipTimeout, 'Deve existir timer de 6000 ms para mostrar o botão Pular na 1ª vez');
  skipTimeout.fn();
  assert.strictEqual(IntroStory.skipVisible, true, 'Após 6000 ms na 1ª vez, botão Pular fica visível');

  // Agora Escape pula direto para o jogo
  dispatchKey('Escape');
  assert.strictEqual(IntroStory.active, false, 'Escape com botão Pular visível fecha a intro');
  assert.strictEqual(finishedCount, 1);
  assert.strictEqual(lastReason, 'skip');
  console.log('✓ Teste 2: Regra da 1ª vez (6000 ms), 5 bolinhas, seta ▶ de 3 s e tecla Escape validadas');

  // TESTE 3: Primeira vez — toque/clique antes de 6s revela o botão Pular e avança 1 item da HQ
  IntroStory.resetSeenForTest();
  IntroStory.play(() => { finishedCount++; });
  assert.strictEqual(IntroStory.skipVisible, false, 'Começa escondido quando resetado');
  assert.strictEqual(IntroStory.pageIndex, 0);
  assert.strictEqual(IntroStory.stepIndex, 0, 'Ao abrir Página 1, stepIndex começa em 0 (1º quadro visível)');

  const viewportEl = mockDocument.getElementById('intro-hq-viewport');
  viewportEl.click(); // 1º toque: revela Pular e avança para o stepIndex 1 (1ª legenda)
  assert.strictEqual(IntroStory.skipVisible, true, 'Primeiro toque/clique na tela revela o botão Pular imediatamente');
  assert.strictEqual(IntroStory.stepIndex, 1, 'Toque revela o próximo item da página');
  IntroStory.close();
  console.log('✓ Teste 3: Primeiro toque/clique revela o botão Pular e avança 1 item');

  // TESTE 4: Das próximas vezes (sinal já existe) — botão Pular aparece desde o 1º quadro
  assert.strictEqual(IntroStory.hasSeenIntro(), true, 'Sinal já existe para as próximas vezes');
  IntroStory.play((reason) => { finishedCount++; lastReason = reason; });
  assert.strictEqual(IntroStory.skipVisible, true, 'Nas próximas vezes, o botão Pular já aparece desde o 1º quadro');
  IntroStory.close();
  console.log('✓ Teste 4: Nas próximas vezes, Pular aparece desde o primeiro quadro');

  // TESTE 5: Ritmo passo a passo pelas 4 páginas de HQ + Cartão Final "Seu objetivo"
  sandbox.window.GameSettings.calm = true;
  playedAudio.length = 0;
  IntroStory.play((reason) => { finishedCount++; lastReason = reason; });

  const sheetEl = mockDocument.getElementById('intro-hq-sheet');
  const finalWrapEl = mockDocument.getElementById('intro-final-card-wrap');
  const letsGoBtn = mockDocument.getElementById('intro-lets-go-btn');

  // PÁGINA 1: "O Livro Acorda" (layout-p1, 6 passos: índices 0..5)
  assert.strictEqual(IntroStory.pageIndex, 0);
  assert(sheetEl.classList.contains('layout-p1'), 'Página 1 usa layout-p1');
  assert.strictEqual(IntroStory.stepIndex, 0, 'P1 Step 0: Painel A visível');

  for (let s = 1; s < IntroStory.PAGES[0].steps.length; s++) {
    dispatchKey('ArrowRight');
    assert.strictEqual(IntroStory.pageIndex, 0);
    assert.strictEqual(IntroStory.stepIndex, s);
  }

  // Testa Seta Esquerda na Página 1 (volta 1 item dentro da página)
  const lastStepP1 = IntroStory.PAGES[0].steps.length - 1;
  dispatchKey('ArrowLeft');
  assert.strictEqual(IntroStory.stepIndex, lastStepP1 - 1, 'Seta esquerda volta 1 passo dentro da página');
  dispatchKey('ArrowRight');
  assert.strictEqual(IntroStory.stepIndex, lastStepP1);

  // Próximo toque vira para a PÁGINA 2 ("O Rapto do Gato", layout-p2, 10 passos: índices 0..9)
  dispatchKey('ArrowRight');
  assert.strictEqual(IntroStory.pageIndex, 1, 'Após último item da Página 1, próximo toque vira para a Página 2');
  assert(sheetEl.classList.contains('layout-p2'), 'Página 2 usa layout-p2');
  assert.strictEqual(IntroStory.stepIndex, 0);

  for (let s = 1; s < IntroStory.PAGES[1].steps.length; s++) {
    dispatchKey('ArrowRight');
    assert.strictEqual(IntroStory.pageIndex, 1);
    assert.strictEqual(IntroStory.stepIndex, s);
  }

  // Próximo toque vira para a PÁGINA 3 ("O Pulo no Portal", layout-p3, 6 passos: índices 0..5)
  dispatchKey('ArrowRight');
  assert.strictEqual(IntroStory.pageIndex, 2, 'Vira para a Página 3');
  assert(sheetEl.classList.contains('layout-p3'), 'Página 3 usa layout-p3');
  assert.strictEqual(IntroStory.stepIndex, 0);

  for (let s = 1; s < IntroStory.PAGES[2].steps.length; s++) {
    dispatchKey('ArrowRight');
    assert.strictEqual(IntroStory.pageIndex, 2);
    assert.strictEqual(IntroStory.stepIndex, s);
  }

  // Próximo toque vira para a PÁGINA 4 ("A Missão na Ilha", layout-p4, 6 passos: índices 0..5)
  dispatchKey('ArrowRight');
  assert.strictEqual(IntroStory.pageIndex, 3, 'Vira para a Página 4');
  assert(sheetEl.classList.contains('layout-p4'), 'Página 4 usa layout-p4');
  assert.strictEqual(IntroStory.stepIndex, 0);

  for (let s = 1; s < IntroStory.PAGES[3].steps.length; s++) {
    dispatchKey('ArrowRight');
    assert.strictEqual(IntroStory.pageIndex, 3);
    assert.strictEqual(IntroStory.stepIndex, s);
  }

  // Verifica que na Página 4 o Quadro 2 (intro-07) tem os 8 pontos de brilho (4 chaves + 4 cadeados)
  const highlights = sheetEl.querySelectorAll('.intro-glow-spot');
  assert.strictEqual(highlights.length, 8, 'Quadro 2 da Página 4 (intro-07) deve ter 8 brilhos (4 chaves + 4 cadeados)');
  const highlightsLayer = mockDocument.getElementById('intro-highlights-layer');
  assert.strictEqual(highlightsLayer.hidden, false, 'Camada de brilhos das 4 chaves e 4 cadeados deve estar ativa');

  // Próximo toque vira para a PÁGINA 5 (Cartão Final "Seu objetivo")
  dispatchKey('ArrowRight');
  assert.strictEqual(IntroStory.pageIndex, 4, 'Vira para o Cartão Final (página 5)');
  assert.strictEqual(finalWrapEl.hidden, false, 'Cartão final "Seu objetivo" visível');
  assert.strictEqual(mockDocument.activeElement, letsGoBtn, 'Botão "Vamos lá!" recebe foco automático');

  const finalTitle = mockDocument.getElementById('intro-final-title');
  const finalSummary = mockDocument.getElementById('intro-final-summary');
  const finalKeys = mockDocument.getElementById('intro-final-keys');
  assert.strictEqual(finalTitle.textContent, 'Seu objetivo');
  assert.strictEqual(finalSummary.textContent, 'Ache as 4 chaves → abra os 4 cadeados → salve o gato!');
  assert.strictEqual(finalKeys.children.length, 4, 'Cartão final exibe as 4 chaves em linha');

  // Verifica volume dos efeitos sonoros (<= 60% do volume de efeitos)
  assert(playedAudio.length > 0, 'Efeitos sonoros de assets/audio/sfx-intro/ devem ser disparados');
  for (const a of playedAudio) {
    assert(a.volume <= 0.6001, `Volume do efeito (${a.volume}) não pode ultrapassar 60%`);
  }

  // Verifica mudo (#toggle-mute)
  toggleMuteEl.checked = true;
  const countBeforeMute = playedAudio.length;
  IntroStory.playSfx('sfx-botao');
  assert.strictEqual(playedAudio.length, countBeforeMute, 'Com #toggle-mute ativo, nenhum efeito sonoro deve tocar');
  toggleMuteEl.checked = false;

  // Clique em "Vamos lá!" fecha a intro e inicia o jogo
  letsGoBtn.click();
  assert.strictEqual(IntroStory.active, false, 'Clicar em "Vamos lá!" fecha a intro');
  assert.strictEqual(lastReason, 'complete');
  console.log('✓ Teste 5: Todas as 4 páginas de HQ, passos, brilhos da intro-07, áudios e Cartão Final validados');

  // TESTE 6: Fallback gracioso de mini-quadrinho hq-*.webp caso imagem falhe
  IntroStory.play(() => {});
  const miniBoxes = sheetEl.querySelectorAll('.hq-mini-panel');
  assert(miniBoxes.length >= 1, 'Página 1 possui mini-quadrinho hq-livro-sorriso.webp');
  const miniImg = miniBoxes[0].children[0];
  assert(typeof miniImg.onerror === 'function', 'Mini-quadrinho possui handler onerror para remoção graciosa');
  miniImg.onerror();
  assert.strictEqual(miniBoxes[0].parentNode, null, 'Se a imagem hq-* falhar, o mini-quadrinho é removido sem quebrar');
  IntroStory.close();
  console.log('✓ Teste 6: Fallback gracioso de mini-quadrinhos hq-*.webp validado');

  console.log('\nTODOS OS 6 TESTES DA HQ DE INTRODUÇÃO PASSARAM COM SUCESSO!');
}

runIntroStoryTests();
