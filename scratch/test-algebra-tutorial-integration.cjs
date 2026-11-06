const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

async function runIntegrationTest() {
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
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parentNode = null;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    focus() { mockDoc.activeElement = this; }
    addEventListener(evt, fn) { this.listeners[evt] = this.listeners[evt] || []; this.listeners[evt].push(fn); }
    removeEventListener(evt, fn) {}
    getContext() {
      return {
        setTransform: () => {},
        fillRect: () => {},
        drawImage: () => {},
        fillText: () => {},
        beginPath: () => {},
        arc: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        ellipse: () => {},
        fill: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} })
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
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: new MockElement('body')
  };

  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: console.error, info: () => {} },
    performance: { now: () => 1000 },
    requestAnimationFrame: (cb) => 1,
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    Image: class { constructor() { this.src = ''; setTimeout(() => { if (this.onload) this.onload(); }, 1); } },
    window: {
      matchMedia: () => ({ matches: false }),
      getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
      addEventListener: () => {},
      removeEventListener: () => {},
      GameSettings: { get: () => false, calm: false }
    },
    document: mockDoc,
    ALGEBRA: {
      ASSENTA_S: 0.5,
      FASES: [
        { estoque: null },
        { estoque: null },
        { estoque: null }
      ]
    },
    ALGEBRA_LOCAL: {
      fases: [
        { tipo: 'equilibrar', missao: 'Fase 1', peso_caixa: null, esq: ['rubi'], dir: [], bandeja: ['rubi'], caixa_na_bandeja: false },
        { tipo: 'equilibrar', missao: 'Fase 2', peso_caixa: null, esq: ['rubi'], dir: [], bandeja: ['rubi'], caixa_na_bandeja: false },
        { tipo: 'equilibrar', missao: 'Fase 3', peso_caixa: null, esq: ['rubi'], dir: [], bandeja: ['rubi'], caixa_na_bandeja: false }
      ]
    },
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
      travessa_frames: { meia_dist_ganchos: 153 },
      pesos: { rubi: 1 }
    }
  };

  sandbox.window.document = mockDoc;
  sandbox.window.ALGEBRA = sandbox.ALGEBRA;
  sandbox.window.ALGEBRA_LOCAL = sandbox.ALGEBRA_LOCAL;
  sandbox.window.ALGEBRA_LAYOUT_LOCAL = sandbox.ALGEBRA_LAYOUT_LOCAL;

  vm.createContext(sandbox);

  // Load modules
  const balancaCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'balanca.js'), 'utf8');
  vm.runInContext(balancaCode, sandbox);
  sandbox.Balanca = sandbox.window.Balanca;

  const tutDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-data.js'), 'utf8');
  vm.runInContext(tutDataCode, sandbox);

  const tutDemosCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-demos.js'), 'utf8');
  vm.runInContext(tutDemosCode, sandbox);

  const tutCardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-card.js'), 'utf8');
  vm.runInContext(tutCardCode, sandbox);


  const algebraCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'algebra-puzzle.js'), 'utf8');
  vm.runInContext(algebraCode, sandbox);

  // Prepare and open
  await sandbox.window.AlgebraPuzzle.prepare(sandbox.ALGEBRA_LOCAL, sandbox.ALGEBRA_LAYOUT_LOCAL);

  let exitCalled = false;
  sandbox.window.AlgebraPuzzle.open({
    onExit: (won) => { exitCalled = true; }
  });

  // Verify that TutorialCard is open initially (first time in session)
  assert(sandbox.window.TutorialCard.isAberto(), 'TutorialCard deve abrir na primeira entrada de Álgebra');
  console.log('✓ Integração 1: TutorialCard aberto automaticamente ao entrar em Álgebra');

  // Verify that the 4 buttons exist in Álgebra: Sair (0), Reiniciar (1), Chave (2), Ajuda (3)
  const buttons = elements.filter(e => e.tagName === 'BUTTON' && e.attrs['aria-label']);
  const helpBtn = buttons.find(b => b.attrs['aria-label'].includes('Ajuda'));
  assert(helpBtn, 'Botão de Ajuda (?) deve existir nos botões da Balança');
  assert.strictEqual(helpBtn.disabled, false, 'Botão de Ajuda habilitado no estado JOGANDO');
  console.log('✓ Integração 2: Botão de ajuda (?) presente no HUD e habilitado');

  // Fechar o tutorial deve retomar o foco
  sandbox.window.TutorialCard.fechar();
  assert(!sandbox.window.TutorialCard.isAberto(), 'TutorialCard deve fechar');
  console.log('✓ Integração 3: TutorialCard fecha e devolve o foco ao puzzle');

  // Clicar no botão "?" deve reabrir o tutorial
  helpBtn.onclick();
  assert(sandbox.window.TutorialCard.isAberto(), 'Clicar em "?" deve reabrir o tutorial');
  console.log('✓ Integração 4: Clicar em "?" reabre o tutorial');

  sandbox.window.TutorialCard.fechar();
  console.log('\nTODOS OS TESTES DE INTEGRAÇÃO COM ÁLGEBRA PASSARAM!');
}

runIntegrationTest();
