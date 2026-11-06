const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

async function runGeometriaIntegrationTest() {
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
    prepend(child) { child.parentNode = this; this.children.unshift(child); return child; }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parentNode = null;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    focus() { mockDoc.activeElement = this; }
    addEventListener(evt, fn) { this.listeners[evt] = this.listeners[evt] || []; this.listeners[evt].push(fn); }
    removeEventListener(evt, fn) {}
    setPointerCapture() {}
    releasePointerCapture() {}
    hasPointerCapture() { return false; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 815, height: 526 }; }
    getContext() {
      return {
        setTransform: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        drawImage: () => {},
        fillText: () => {},
        beginPath: () => {},
        arc: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        ellipse: () => {},
        fill: () => {},
        rect: () => {},
        clip: () => {},
        setLineDash: () => {},
        roundRect: () => {},
        clearRect: () => {},
        quadraticCurveTo: () => {}
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
      if (sel.startsWith('.')) return elements.find(e => (e.className || '').includes(sel.slice(1))) || null;
      return elements.find(e => e.tagName.toLowerCase() === sel.toLowerCase()) || null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('button')) return elements.filter(e => e.tagName === 'BUTTON');
      return [];
    },
    body: new MockElement('BODY'),
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const sandbox = {
    console,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    Image: class { constructor() { this.src = ''; setTimeout(() => { if (this.onload) this.onload(); }, 1); } },
    window: {
      matchMedia: () => ({ matches: false }),
      getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
      addEventListener: () => {},
      removeEventListener: () => {},
      GameSettings: { get: () => false, calm: false },
      GameAudio: { playGeometryMusic: () => {}, stopGeometryMusic: () => {}, preloadGeometryMusic: () => {} },
      innerWidth: 1280,
      innerHeight: 714,
      devicePixelRatio: 1
    },
    document: mockDoc,
    HERO_SHEET: { src: 'personagem/personagem_spritesheet_8_direcoes_v2.png', frameW: 48, frameH: 56, pivotX: 24, pivotY: 52 },
    HeroAnimation: { IDLE: 0, column: () => 0 }
  };

  sandbox.window.document = mockDoc;
  sandbox.window.HERO_SHEET = sandbox.HERO_SHEET;
  sandbox.window.HeroAnimation = sandbox.HeroAnimation;

  vm.createContext(sandbox);

  // 1. Load modules
  const polyominoCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'polyomino.js'), 'utf8');
  vm.runInContext(polyominoCode, sandbox);
  sandbox.Polyomino = sandbox.window.Polyomino;

  const tutDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-data.js'), 'utf8');
  vm.runInContext(tutDataCode, sandbox);

  const tutDemosCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-demos.js'), 'utf8');
  vm.runInContext(tutDemosCode, sandbox);

  const tutCardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-card.js'), 'utf8');
  vm.runInContext(tutCardCode, sandbox);

  const geoCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'geometria-puzzle.js'), 'utf8');
  vm.runInContext(geoCode, sandbox);

  // TESTE 1: Estrutura de dados de Geometria em TutorialData
  const geoData = sandbox.window.TutorialData.geometria;
  assert(geoData, 'TutorialData.geometria deve existir');
  assert.strictEqual(geoData.passos.length, 3, 'Geometria deve ter exatamente 3 passos');
  assert.strictEqual(geoData.passos[0].titulo, 'Arraste a peça');
  assert.strictEqual(geoData.passos[0].texto, 'Puxe a peça até o lugar de encaixe.');
  assert.strictEqual(geoData.passos[0].demo, 'geometria-arrastar');

  assert.strictEqual(geoData.passos[1].titulo, 'Gire a peça');
  assert.strictEqual(geoData.passos[1].texto, 'Toque na peça da barra para ela girar.');
  assert.strictEqual(geoData.passos[1].demo, 'geometria-girar');

  assert.strictEqual(geoData.passos[2].titulo, 'Tire a peça');
  assert.strictEqual(geoData.passos[2].texto, 'Toque numa peça já encaixada e ela volta para a barra.');
  assert.strictEqual(geoData.passos[2].demo, 'geometria-tirar');
  console.log('✓ Teste 1: TutorialData possui os 3 passos de Geometria com títulos e textos exatos');

  // TESTE 2: Navegação entre os 3 passos com botões "Próximo", "Próximo" e "OK"
  sandbox.window.TutorialCard.abrir('geometria');
  assert(sandbox.window.TutorialCard.isAberto(), 'TutorialCard deve estar aberto');
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 0, 'Passo inicial deve ser 0');

  const btnPrincipal = elements.find(e => e.className === 'tutorial-btn-principal');
  const btnVoltar = elements.find(e => e.className === 'tutorial-btn-voltar');
  assert(btnPrincipal, 'Botão principal deve existir');
  assert(btnVoltar, 'Botão voltar deve existir');

  // Passo 0 (Passo 1): "Próximo", voltar oculto
  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Passo 1 deve ter botão "Próximo"');
  assert.strictEqual(btnVoltar.hidden, true, 'Botão voltar deve estar oculto no passo 1');

  // Avança para Passo 1 (Passo 2): "Próximo", voltar visível
  btnPrincipal.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 1, 'Passo atual deve ser 1');
  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Passo 2 deve ter botão "Próximo"');
  assert.strictEqual(btnVoltar.hidden, false, 'Botão voltar deve estar visível no passo 2');

  // Avança para Passo 2 (Passo 3): "OK", voltar visível
  btnPrincipal.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 2, 'Passo atual deve ser 2');
  assert.strictEqual(btnPrincipal.textContent, 'OK', 'Passo 3 (último) deve ter botão "OK"');
  assert.strictEqual(btnVoltar.hidden, false, 'Botão voltar deve estar visível no passo 3');

  // Volta para Passo 1
  btnVoltar.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 1, 'Voltar deve retornar ao passo 1');
  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Voltar ao passo 2 restaura botão "Próximo"');

  // Volta para Passo 0
  btnVoltar.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 0, 'Voltar deve retornar ao passo 0');
  assert.strictEqual(btnVoltar.hidden, true, 'Passo 0 oculta botão voltar novamente');

  // Avança até o fim e clica em OK
  btnPrincipal.onclick(); // vai para 1
  btnPrincipal.onclick(); // vai para 2
  btnPrincipal.onclick(); // clica em OK no passo 2
  assert(!sandbox.window.TutorialCard.isAberto(), 'Clicar em OK no último passo fecha o tutorial');
  console.log('✓ Teste 2: Navegação com rótulos "Próximo", "Próximo" e "OK", avançar e voltar validada');

  // TESTE 3: Integração com GeometriaPuzzle (abertura automática e HUD "?")
  sandbox.window.TutorialCard.limparVistos();

  const dataGeometria = {
    metrics: { WIDTH: 1280, HEIGHT: 714, GAP_LEFT: 410, GAP_RIGHT: 866, CENTER_X: 638, WALK_Y: 260, SLOT_Y0: 262, BOTTOM: 610, TRAY_LEFT: 5, TRAY_RIGHT: 1275, TRAY_BOTTOM: 702, TRAY_CELL: 40, CHAR_H: 150, WALK_SPEED: 260 },
    background: 'assets/puzzles/geometria/fundo.jpeg',
    backgroundFallback: 'assets/puzzles/geometria/fundo.jpeg',
    key: 'assets/hud/chave_geometria.png',
    pieces: {
      '02': { matrix: ['.#', '.#', '##'], sprite: 'assets/puzzles/geometria/pecas/peca_02.png' },
      '04': { matrix: ['#.', '##'], sprite: 'assets/puzzles/geometria/pecas/peca_04.png' },
      '05': { matrix: ['..#', '.##', '##.'], sprite: 'assets/puzzles/geometria/pecas/peca_05.png' }
    },
    cycles: [
      { cols: 4, rows: 3, pieces: ['02', '04', '05'], solution: [['02', '02', '05', '05'], ['02', '05', '05', '04'], ['02', '05', '04', '04']] }
    ]
  };

  await sandbox.window.GeometriaPuzzle.prepare(dataGeometria);

  let exitCalled = false;
  sandbox.window.GeometriaPuzzle.open({
    onExit: (won) => { exitCalled = true; },
    debug: () => false,
    toggleDebug: () => {}
  });

  // O tutorial deve abrir automaticamente na primeira vez
  assert(sandbox.window.TutorialCard.isAberto(), 'Tutorial deve abrir automaticamente ao entrar em Geometria');
  console.log('✓ Teste 3: Abertura automática ao entrar no puzzle de Geometria');

  // Verifica que o botão de ajuda "?" está no HUD de Geometria
  const buttons = elements.filter(e => e.tagName === 'BUTTON' && e.attrs['aria-label']);
  const helpBtn = buttons.find(b => b.attrs['aria-label'] && b.attrs['aria-label'].includes('Ajuda'));
  assert(helpBtn, 'Botão de ajuda (?) deve existir no HUD de Geometria');
  assert.strictEqual(helpBtn.disabled, false, 'Botão de ajuda habilitado em estado JOGANDO');
  console.log('✓ Teste 4: Botão de ajuda (?) presente no HUD e habilitado');

  // Fechar o tutorial
  sandbox.window.TutorialCard.fechar();
  assert(!sandbox.window.TutorialCard.isAberto(), 'Tutorial fecha via fechar()');

  // Clicar em "?" reabre o tutorial
  helpBtn.onclick();
  assert(sandbox.window.TutorialCard.isAberto(), 'Clicar em "?" reabre o tutorial');
  sandbox.window.TutorialCard.fechar();
  console.log('✓ Teste 5: Clicar em "?" reabre o tutorial de Geometria');

  // TESTE 6: Demos de Geometria registradas e executáveis em TutorialDemos
  const demos = ['geometria-arrastar', 'geometria-girar', 'geometria-tirar'];
  const testCanvas = new MockElement('CANVAS');
  testCanvas.width = 815;
  testCanvas.height = 526;

  for (const demoId of demos) {
    const runner = sandbox.window.TutorialDemos.iniciar(demoId, testCanvas);
    assert(runner, `Demonstração ${demoId} deve iniciar`);
    sandbox.window.TutorialDemos.parar();
  }
  console.log('✓ Teste 6: As 3 demonstrações de Geometria estão registradas e funcionam no TutorialDemos');

  console.log('\nTODOS OS 6 TESTES DE INTEGRAÇÃO DE GEOMETRIA PASSARAM COM SUCESSO!');
}

runGeometriaIntegrationTest().catch(err => {
  console.error('Falha no teste de Geometria:', err);
  process.exit(1);
});
