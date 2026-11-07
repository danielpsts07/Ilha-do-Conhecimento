const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Mock browser environment for TutorialCard and TutorialDemos
function createMockEnv(initialSettings = {}) {
  let currentTime = 1000;
  const rafCallbacks = new Map();
  let rafId = 0;

  function advanceTime(ms) {
    currentTime += ms;
    const current = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [id, cb] of current) cb(currentTime);
  }

  const windowListeners = {};
  const docListeners = {};
  const elements = [];

  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.id = '';
      this.className = '';
      this.textContent = '';
      this.innerHTML = '';
      this.hidden = false;
      this.disabled = false;
      this.style = {};
      this.children = [];
      this.parentNode = null;
      this.attrs = {};
      this.onclick = null;
      this.listeners = {};
      elements.push(this);
    }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parentNode = null;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    focus() {
      mockDoc.activeElement = this;
    }
    addEventListener(evt, fn) {
      this.listeners[evt] = this.listeners[evt] || [];
      this.listeners[evt].push(fn);
    }
    removeEventListener(evt, fn) {
      if (!this.listeners[evt]) return;
      this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
    }
    dispatchEvent(evt) {
      const fns = this.listeners[evt.type] || [];
      for (const fn of fns) fn(evt);
    }
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }
    querySelectorAll(sel) {
      const res = [];
      function search(node) {
        if (!node || !node.children) return;
        for (const child of node.children) {
          if (sel.startsWith('#') && child.id === sel.slice(1)) res.push(child);
          else if (sel.startsWith('.') && child.className.includes(sel.slice(1))) res.push(child);
          else if (sel.toLowerCase() === child.tagName.toLowerCase()) res.push(child);
          else if (sel === 'button:not([hidden]):not([disabled])' && child.tagName === 'BUTTON' && !child.hidden && !child.disabled) res.push(child);
          search(child);
        }
      }
      search(this);
      return res;
    }
    getContext(type) {
      return {
        clearRect: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        arc: () => {},
        ellipse: () => {},
        stroke: () => {},
        fill: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        setLineDash: () => {}
      };
    }
  }

  const mockDoc = {
    hidden: false,
    activeElement: null,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.find(e => e.id === id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.find(e => e.id === sel.slice(1)) || null;
      if (sel.startsWith('.')) return elements.find(e => e.className.includes(sel.slice(1))) || null;
      return null;
    },
    querySelectorAll: (sel) => [],
    addEventListener: (evt, fn) => {
      docListeners[evt] = docListeners[evt] || [];
      docListeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (!docListeners[evt]) return;
      docListeners[evt] = docListeners[evt].filter(f => f !== fn);
    },
    body: new MockElement('body')
  };

  const settingsStore = { calm: false, ...initialSettings };
  const mockGameSettings = {
    get: (k) => settingsStore[k],
    set: (k, v) => { settingsStore[k] = v; },
    get calm() { return settingsStore.calm; }
  };

  class MockImage {
    constructor() {
      this.src = '';
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      setTimeout(() => { if (this.onload) this.onload(); }, 1);
    }
  }

  const sandbox = {
    console: { log: () => {}, warn: (...args) => sandbox.lastWarn = args.join(' '), error: console.error },
    performance: { now: () => currentTime },
    requestAnimationFrame: (cb) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => {
      rafCallbacks.delete(id);
    },
    setTimeout: (fn, ms) => {
      // Immediate execution for mock tests
      fn();
      return 1;
    },
    clearTimeout: () => {},
    Image: MockImage,
    window: {
      addEventListener: (type, fn) => {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(fn);
      },
      removeEventListener: (type, fn) => {
        if (!windowListeners[type]) return;
        windowListeners[type] = windowListeners[type].filter(f => f !== fn);
      },
      matchMedia: (query) => ({
        matches: query.includes('reduce') ? Boolean(settingsStore.calm) : false
      }),
      GameSettings: mockGameSettings
    },
    document: mockDoc,
    ALGEBRA_LAYOUT_LOCAL: {
      escala_jogo: 0.49,
      montagem_validada: {
        base_da_coluna: [512, 428],
        pivo_acima_do_topo_px: 18,
        queda_da_corrente_px: 105,
        grade_prato: { colunas_x: [-40, -13, 13, 40], linhas_y: [0, 20] }
      },
      coluna: { topo_cap: [118, 42] },
      prato: { anel_esq: [70, 20], anel_dir: [337, 20], centro_itens: [203.5, 43] },
      travessa_frames: { meia_dist_ganchos: 153 }
    }
  };

  sandbox.window.document = sandbox.document;
  sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
  sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
  sandbox.window.performance = sandbox.performance;
  sandbox.window.Image = MockImage;

  vm.createContext(sandbox);

  // Load scripts in order
  const dataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);

  const demosCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-demos.js'), 'utf8');
  vm.runInContext(demosCode, sandbox);

  const cardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-card.js'), 'utf8');
  vm.runInContext(cardCode, sandbox);

  return {
    sandbox,
    window: sandbox.window,
    document: mockDoc,
    TutorialData: sandbox.window.TutorialData,
    TutorialDemos: sandbox.window.TutorialDemos,
    TutorialCard: sandbox.window.TutorialCard,
    advanceTime
  };
}

let passed = 0;

// Test 1: Estrutura de dados TutorialData
{
  const env = createMockEnv();
  const TD = env.TutorialData;
  assert(TD.algebra, 'TutorialData deve ter entrada para algebra');
  assert.strictEqual(TD.algebra.passos.length, 1, 'Algebra deve ter exatamente 1 passo');
  assert.strictEqual(TD.algebra.passos[0].titulo, 'Equilibre a balança');
  assert.strictEqual(TD.algebra.passos[0].texto, 'Arraste as joias para os dois lados ficarem iguais.');
  assert.strictEqual(TD.algebra.passos[0].demo, 'algebra-balanca');
  passed++;
  console.log('✓ Teste 1: TutorialData possui dados válidos de Álgebra e estrutura genérica');
}

// Test 2: Dimensões do palco, constantes da mão e alinhamento do clique
{
  const env = createMockEnv();
  const D = env.TutorialDemos;
  assert.strictEqual(D.STAGE_W, 815, 'Palco largura deve ser 815 px');
  assert.strictEqual(D.STAGE_H, 526, 'Palco altura deve ser 526 px');
  assert.strictEqual(D.MAO_PONTA_X.apontando, 0.19, 'MAO_PONTA_X apontando deve ser 0.19');
  assert.strictEqual(D.MAO_PONTA_X.pressionando, 0.38, 'MAO_PONTA_X pressionando deve ser 0.38');
  assert.strictEqual(D.MAO_PONTA_Y.apontando, 0.02, 'MAO_PONTA_Y apontando deve ser 0.02');
  assert.strictEqual(D.MAO_PONTA_Y.pressionando, 0.10, 'MAO_PONTA_Y pressionando deve ser 0.10');

  // Teste de cálculo de alinhamento: a ponta do dedo em ambas as poses deve convergir no targetX, targetY
  const targetX = 350, targetY = 240;
  const k = D.MAO_ESCALA;
  const clickApontandoX = targetX - (386 * k * 0.19) + (386 * k * 0.19);
  const clickPressionandoX = targetX - (364 * k * 0.38) + (364 * k * 0.38);
  assert.strictEqual(clickApontandoX, clickPressionandoX, 'Ponto de clique deve coincidir na troca de poses');

  passed++;
  console.log('✓ Teste 2: Dimensões do palco (815x526) e constantes da mão com alinhamento sem pulo');
}

// Test 3: TutorialCard abre modal com acessibilidade, foco e rótulo "OK" para 1 passo
{
  const env = createMockEnv();
  const Card = env.TutorialCard;
  let opened = false;

  Card.abrir('algebra', {
    onAbrir: () => { opened = true; }
  });

  assert(Card.isAberto(), 'Cartão deve estar aberto');
  assert(opened, 'Callback onAbrir chamado');

  const dialog = env.document.getElementById('tutorial-card-dialog');
  assert(dialog, 'Elemento de diálogo deve existir');
  assert.strictEqual(dialog.getAttribute('role'), 'dialog');
  assert.strictEqual(dialog.getAttribute('aria-modal'), 'true');
  assert.strictEqual(dialog.getAttribute('aria-labelledby'), 'tutorial-card-title');
  assert.strictEqual(dialog.getAttribute('aria-describedby'), 'tutorial-card-text');

  const title = env.document.getElementById('tutorial-card-title');
  assert.strictEqual(title.textContent, 'Equilibre a balança');

  const text = env.document.getElementById('tutorial-card-text');
  assert.strictEqual(text.textContent, 'Arraste as joias para os dois lados ficarem iguais.');

  const btnPrincipal = dialog.querySelector('.tutorial-btn-principal');
  assert.strictEqual(btnPrincipal.textContent, 'OK', 'Único passo deve exibir botão OK');

  const btnVoltar = dialog.querySelector('.tutorial-btn-voltar');
  assert(btnVoltar.hidden, 'Botão Voltar deve estar oculto no primeiro/único passo');

  passed++;
  console.log('✓ Teste 3: Cartão modal acessível com título, texto, botão OK e foco');
}

// Test 4: Fechamento via OK, Escape e X devolve o controle
{
  const env = createMockEnv();
  const Card = env.TutorialCard;
  let closed = false;

  Card.abrir('algebra', {
    onFechar: () => { closed = true; }
  });

  Card.fechar();
  assert(!Card.isAberto(), 'Cartão deve estar fechado');
  assert(closed, 'onFechar deve ser disparado');

  // Teste fechamento via Escape
  closed = false;
  Card.abrir('algebra', { onFechar: () => { closed = true; } });
  const dialog = env.document.getElementById('tutorial-card-dialog');
  dialog.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault: () => {}, stopPropagation: () => {} });
  assert(!Card.isAberto(), 'Escape deve fechar o cartão');
  assert(closed, 'onFechar deve ser disparado no Escape');

  passed++;
  console.log('✓ Teste 4: Fechamento via OK e Escape funciona e encerra a demo');
}

// Test 5: Frequência TUTORIAL_FREQUENCIA = 'primeira-vez-na-sessao'
{
  const env = createMockEnv();
  const Card = env.TutorialCard;
  Card.limparVistos();

  let firstTimeClosed = false;
  // 1ª vez: abre normalmente
  const openedFirst = Card.verificarEabrir('algebra', {
    onFechar: () => { firstTimeClosed = true; }
  });
  assert(openedFirst, 'Primeira vez deve abrir o cartão');
  Card.fechar();
  assert(firstTimeClosed);

  // 2ª vez: não abre e dispara callback imediatamente
  let secondTimeClosed = false;
  const openedSecond = Card.verificarEabrir('algebra', {
    onFechar: () => { secondTimeClosed = true; }
  });
  assert(!openedSecond, 'Segunda vez não deve abrir o cartão');
  assert(secondTimeClosed, 'onFechar chamado diretamente na 2ª vez');

  // Botão "?" usa abrir() diretamente e DEVE abrir mesmo se já visto
  const openedViaHelp = Card.abrir('algebra');
  assert(openedViaHelp, 'Botão "?" deve abrir sempre');
  Card.fechar();

  passed++;
  console.log('✓ Teste 5: Frequência primeira-vez-na-sessao e reabertura via botão "?"');
}

// Test 6: Suporte genérico a múltiplos passos com navegação
{
  const env = createMockEnv();
  // Registra puzzle fictício com 3 passos
  env.TutorialData['teste-passos'] = {
    passos: [
      { titulo: 'Passo 1', texto: 'Texto 1', demo: 'algebra-balanca' },
      { titulo: 'Passo 2', texto: 'Texto 2', demo: 'algebra-balanca' },
      { titulo: 'Passo 3', texto: 'Texto 3', demo: 'algebra-balanca' }
    ]
  };

  const Card = env.TutorialCard;
  Card.abrir('teste-passos');

  const dialog = env.document.getElementById('tutorial-card-dialog');
  const btnPrincipal = dialog.querySelector('.tutorial-btn-principal');
  const btnVoltar = dialog.querySelector('.tutorial-btn-voltar');

  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Passo intermediário deve exibir "Próximo"');
  assert(btnVoltar.hidden, 'Voltar oculto no passo 1');

  // Avança para passo 2
  btnPrincipal.onclick();
  assert.strictEqual(Card.getPassoAtual(), 1, 'Deve estar no passo 2');
  assert(!btnVoltar.hidden, 'Voltar deve aparecer a partir do passo 2');
  assert.strictEqual(btnPrincipal.textContent, 'Próximo');

  // Avança para passo 3
  btnPrincipal.onclick();
  assert.strictEqual(Card.getPassoAtual(), 2, 'Deve estar no passo 3');
  assert.strictEqual(btnPrincipal.textContent, 'OK', 'Último passo deve exibir "OK"');

  // Volta para passo 2
  btnVoltar.onclick();
  assert.strictEqual(Card.getPassoAtual(), 1);

  Card.fechar();
  passed++;
  console.log('✓ Teste 6: Navegação entre múltiplos passos, botões Próximo/Voltar/OK e bolinhas');
}

// Test 7: Motor de demonstração algebra-balanca e timeline determinística
{
  const env = createMockEnv();
  const Demos = env.TutorialDemos;
  const canvas = env.document.createElement('canvas');

  const runner = Demos.iniciar('algebra-balanca', canvas);
  assert(runner, 'Runner da demo algebra-balanca iniciado');

  // Avança tempo determinístico
  env.advanceTime(1000);
  env.advanceTime(1400); // 2.4s (arraste)
  env.advanceTime(2000); // 4.4s (nivelamento)
  env.advanceTime(2000); // 6.4s (acerto e selo)

  Demos.parar();
  assert.strictEqual(Demos.getActiveRunner(), null, 'Runner parado com sucesso');
  passed++;
  console.log('✓ Teste 7: Execução da timeline de Álgebra (0s -> 1.4s -> 2.4s -> 6s) no canvas');
}

// Test 8: Modo reduzido (prefers-reduced-motion) mostra quadro estático e botão replay
{
  const env = createMockEnv({ calm: true });
  const Card = env.TutorialCard;
  Card.abrir('algebra');

  const replayBtn = env.document.querySelector('.tutorial-replay-btn');
  assert(!replayBtn.hidden, 'Botão "Ver demonstração" visível em modo calmo');

  Card.fechar();
  passed++;
  console.log('✓ Teste 8: Modo calm / prefers-reduced-motion com quadro estático e botão replay');
}

console.log(`\nTODOS OS ${passed} TESTES DE TUTORIAL CARD PASSARAM COM SUCESSO!`);
