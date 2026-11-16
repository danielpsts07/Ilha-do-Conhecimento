const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

async function runLogicaIntegrationTest() {
  const elements = [];
  let lastRafCallback = null;

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
        quadraticCurveTo: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: () => {}
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
    requestAnimationFrame: (cb) => { lastRafCallback = cb; return 1; },
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    Image: class {
      constructor() {
        this.src = '';
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        this.width = 100;
        this.height = 100;
        setTimeout(() => { if (this.onload) this.onload(); }, 1);
      }
    },
    window: {
      matchMedia: () => ({ matches: false }),
      getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
      addEventListener: () => {},
      removeEventListener: () => {},
      GameSettings: { get: () => false, calm: false },
      Music: { entrarNaCena: () => {}, sairDaCena: () => {}, preCarregar: () => {} },
      innerWidth: 1280,
      innerHeight: 714,
      devicePixelRatio: 1
    },
    document: mockDoc,
    getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
    HERO_SHEET: { src: 'personagem/personagem_spritesheet_8_direcoes_v2.png', frameW: 48, frameH: 56, pivotX: 24, pivotY: 52 },
    HeroAnimation: { IDLE: 0, column: () => 0 }
  };

  sandbox.window.document = mockDoc;
  sandbox.window.HERO_SHEET = sandbox.HERO_SHEET;
  sandbox.window.HeroAnimation = sandbox.HeroAnimation;

  vm.createContext(sandbox);

  // 1. Carregar módulos
  const configCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
  vm.runInContext(configCode, sandbox);

  const mascarasCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'labirinto-mascaras.js'), 'utf8');
  vm.runInContext(mascarasCode, sandbox);

  const logicaCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'labirinto-logica.js'), 'utf8');
  vm.runInContext(logicaCode, sandbox);

  const tutDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-data.js'), 'utf8');
  vm.runInContext(tutDataCode, sandbox);

  const tutDemosCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-demos.js'), 'utf8');
  vm.runInContext(tutDemosCode, sandbox);

  const tutCardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'tutorial-card.js'), 'utf8');
  vm.runInContext(tutCardCode, sandbox);

  const labirintoCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'labirinto-puzzle.js'), 'utf8');
  vm.runInContext(labirintoCode, sandbox);

  // TESTE 1: Estrutura de dados de Raciocínio Lógico em TutorialData (2 passos)
  const logicaData = sandbox.window.TutorialData.logica;
  assert(logicaData, 'TutorialData.logica deve existir');
  assert.strictEqual(logicaData.passos.length, 2, 'Raciocínio Lógico deve ter exatamente 2 passos');
  assert.strictEqual(logicaData.passos[0].titulo, 'Siga a ordem das runas');
  assert.strictEqual(logicaData.passos[0].texto, 'Veja quais runas acendem. Depois vá até elas na mesma ordem!');
  assert.strictEqual(logicaData.passos[0].demo, 'logica-ordem');

  assert.strictEqual(logicaData.passos[1].titulo, 'Errou? Volta ao início');
  assert.strictEqual(logicaData.passos[1].texto, 'Se for na runa errada, você volta ao começo. Sem problema: tente de novo!');
  assert.strictEqual(logicaData.passos[1].demo, 'logica-erro');
  console.log('✓ Teste 1: TutorialData possui os 2 passos de Raciocínio Lógico com títulos e textos exatos');

  // TESTE 2: Navegação entre os 2 passos com rótulos "Próximo" e "OK"
  sandbox.window.TutorialCard.abrir('logica');
  assert(sandbox.window.TutorialCard.isAberto(), 'TutorialCard deve estar aberto');
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 0, 'Passo inicial deve ser 0');

  const btnPrincipal = elements.find(e => e.className === 'tutorial-btn-principal');
  const btnVoltar = elements.find(e => e.className === 'tutorial-btn-voltar');
  assert(btnPrincipal, 'Botão principal deve existir');
  assert(btnVoltar, 'Botão voltar deve existir');

  // Passo 0 (Passo 1): "Próximo", voltar oculto
  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Passo 1 deve ter botão "Próximo"');
  assert.strictEqual(btnVoltar.hidden, true, 'Botão voltar deve estar oculto no passo 1');

  // Avança para Passo 1 (Passo 2): "OK", voltar visível
  btnPrincipal.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 1, 'Passo atual deve ser 1');
  assert.strictEqual(btnPrincipal.textContent, 'OK', 'Passo 2 (último) deve ter botão "OK"');
  assert.strictEqual(btnVoltar.hidden, false, 'Botão voltar deve estar visível no passo 2');

  // Volta para Passo 0
  btnVoltar.onclick();
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 0, 'Voltar deve retornar ao passo 0');
  assert.strictEqual(btnPrincipal.textContent, 'Próximo', 'Voltar ao passo 1 restaura botão "Próximo"');

  // Avança para Passo 1 e clica em OK
  btnPrincipal.onclick();
  btnPrincipal.onclick();
  assert(!sandbox.window.TutorialCard.isAberto(), 'Clicar em OK no 2º passo fecha o tutorial');
  console.log('✓ Teste 2: Navegação com rótulos "Próximo" e "OK", avançar e voltar validada');

  // TESTE 3: Integração com LabirintoPuzzle — espera o cartão fechar antes da sequência acender e desativa "?" durante a sequência
  sandbox.window.TutorialCard.limparVistos();

  const labirintoJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'labirinto.json'), 'utf8'));
  await sandbox.window.LabirintoPuzzle.prepare(labirintoJson);

  let exitCalled = false;
  sandbox.window.LabirintoPuzzle.open({
    onExit: (won) => { exitCalled = true; },
    debug: () => false
  });

  // O tutorial deve abrir automaticamente na primeira entrada
  assert(sandbox.window.TutorialCard.isAberto(), 'Tutorial deve abrir automaticamente ao entrar no Labirinto');

  const buttons = elements.filter(e => e.tagName === 'BUTTON' && e.attrs['aria-label']);
  const helpBtn = buttons.find(b => b.attrs['aria-label'] && b.attrs['aria-label'].includes('Ajuda'));
  const skipMemBtn = elements.find(e => e.tagName === 'BUTTON' && e.textContent === 'Já memorizei');
  assert(helpBtn, 'Botão de ajuda (?) deve existir no HUD do Labirinto');
  assert(skipMemBtn, 'Botão "Já memorizei" deve existir no Labirinto');

  // Enquanto o cartão de tutorial está aberto, o botão "Já memorizei" fica oculto/desabilitado e o temporizador de MEMORIZAR não avança
  assert.strictEqual(skipMemBtn.hidden, true, 'Enquanto o cartão está aberto, a sequência de memorização ainda não começou');
  assert.strictEqual(helpBtn.disabled, true, 'Botão "?" fica desabilitado antes de o jogador poder andar');

  // Simula 10 segundos de loop enquanto o cartão ainda está aberto
  if (lastRafCallback) {
    lastRafCallback(1000);
    lastRafCallback(5000);
    lastRafCallback(11000);
  }
  assert.strictEqual(skipMemBtn.disabled, true, 'O temporizador da sequência NÃO deve avançar enquanto o cartão estiver aberto');
  console.log('✓ Teste 3: Labirinto espera o cartão fechar antes de acender/contar a sequência de runas');

  // TESTE 4: Fecha o cartão -> sequência acende (MEMORIZAR) com "?" desativado; após acender (ANDAR), "?" ativa e reabre o cartão
  sandbox.window.TutorialCard.fechar();
  assert(!sandbox.window.TutorialCard.isAberto(), 'Cartão fechou');
  assert.strictEqual(skipMemBtn.hidden, false, 'Sequência de memorização começa após o cartão fechar');
  assert.strictEqual(helpBtn.disabled, true, 'Botão "?" permanece desativado enquanto a sequência de runas acende (MEMORIZAR)');

  // Tentar clicar em "?" enquanto desativado durante MEMORIZAR não deve abrir o cartão
  helpBtn.onclick();
  assert(!sandbox.window.TutorialCard.isAberto(), 'Clicar em "?" desativado durante a sequência não abre o cartão');

  // Avança o tempo em 2 segundos (em fatias <= 50ms) para habilitar "Já memorizei" e pula para ANDAR
  let tStamp = 11000;
  for (let i = 0; i < 45; i++) {
    tStamp += 40;
    if (lastRafCallback) lastRafCallback(tStamp);
  }
  assert.strictEqual(skipMemBtn.disabled, false, 'Após 1,5s com o cartão fechado, o botão "Já memorizei" habilita');
  skipMemBtn.onclick();

  // Agora em estado ANDAR, o botão "?" deve estar habilitado!
  assert.strictEqual(helpBtn.disabled, false, 'Botão "?" deve ficar habilitado assim que a sequência termina (estado ANDAR)');

  // Clicar em "?" reabre o cartão no passo 1
  helpBtn.onclick();
  assert(sandbox.window.TutorialCard.isAberto(), 'Clicar em "?" em estado ANDAR reabre o cartão de tutorial');
  assert.strictEqual(sandbox.window.TutorialCard.getPassoAtual(), 0, 'Reabrir pelo "?" começa no passo 1');
  sandbox.window.TutorialCard.fechar();
  console.log('✓ Teste 4: Botão "?" desativado enquanto a sequência acende e ativo durante a caminhada');

  // TESTE 5: Execução das 2 demos de Raciocínio Lógico (logica-ordem e logica-erro)
  const demoCanvas = new MockElement('CANVAS');
  demoCanvas.width = 815;
  demoCanvas.height = 526;
  for (const demoId of ['logica-ordem', 'logica-erro']) {
    sandbox.window.TutorialDemos.iniciar(demoId, demoCanvas, { reducedMotion: false });
    sandbox.window.TutorialDemos.parar();
    sandbox.window.TutorialDemos.iniciar(demoId, demoCanvas, { reducedMotion: true });
    sandbox.window.TutorialDemos.parar();
  }
  console.log('✓ Teste 5: Demos logica-ordem e logica-erro executadas nos modos animado e estático');

  const closeBtn = buttons.find(b => b.attrs['aria-label'] === 'Sair do labirinto');
  if (closeBtn && closeBtn.onclick) closeBtn.onclick();
  console.log('ALL LOGICA TUTORIAL INTEGRATION TESTS PASSED!');
}

runLogicaIntegrationTest().catch(err => {
  console.error(err);
  process.exit(1);
});
