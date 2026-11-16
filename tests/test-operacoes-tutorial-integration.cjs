/* Teste automatizado da integração do Cartão de Tutorial com o puzzle de Operações (Moinho Encantado). */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function createMockDOM() {
  const elements = [];
  const listeners = {};

  function makeCtx() {
    return new Proxy({}, {
      get(_target, prop) {
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
          return () => ({ addColorStop() {} });
        }
        if (prop === 'measureText') return () => ({ width: 40 });
        return () => {};
      },
      set() { return true; }
    });
  }

  function makeElement(tag) {
    const el = {
      tagName: String(tag).toUpperCase(),
      id: '',
      className: '',
      style: { setProperty() {} },
      dataset: {},
      attributes: {},
      children: [],
      parentNode: null,
      hidden: false,
      disabled: false,
      tabIndex: -1,
      textContent: '',
      innerHTML: '',
      width: 815,
      height: 526,
      naturalWidth: 1024,
      naturalHeight: 572,
      listeners: {},
      classList: {
        _set: new Set(),
        add(...cls) { cls.forEach(c => this._set.add(c)); },
        remove(...cls) { cls.forEach(c => this._set.delete(c)); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._set.has(c)) { this._set.delete(c); return false; }
            this._set.add(c); return true;
          }
          if (force) this._set.add(c); else this._set.delete(c);
          return force;
        },
        contains(c) { return this._set.has(c); }
      },
      setAttribute(k, v) {
        this.attributes[k] = String(v);
        if (k === 'id') this.id = String(v);
      },
      getAttribute(k) { return this.attributes[k] ?? null; },
      removeAttribute(k) { delete this.attributes[k]; },
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        elements.push(child);
        return child;
      },
      prepend(child) {
        child.parentNode = this;
        this.children.unshift(child);
        elements.push(child);
        return child;
      },
      remove() {
        if (this.parentNode) {
          const idx = this.parentNode.children.indexOf(this);
          if (idx >= 0) this.parentNode.children.splice(idx, 1);
        }
      },
      addEventListener(type, fn) {
        (this.listeners[type] ||= []).push(fn);
      },
      removeEventListener(type, fn) {
        if (!this.listeners[type]) return;
        this.listeners[type] = this.listeners[type].filter(f => f !== fn);
      },
      dispatchEvent(ev) {
        ev.target ||= this;
        ev.preventDefault ||= () => {};
        ev.stopPropagation ||= () => {};
        ev.stopImmediatePropagation ||= () => {};
        for (const fn of (this.listeners[ev.type] || [])) fn(ev);
        if (ev.type === 'click' && typeof this.onclick === 'function' && !this.disabled) {
          this.onclick(ev);
        }
      },
      click() {
        if (this.disabled) return;
        this.dispatchEvent({ type: 'click' });
      },
      focus() { document.activeElement = this; },
      getContext() { return makeCtx(); },
      getBoundingClientRect() { return { left: 0, top: 0, width: 1024, height: 572 }; },
      hasPointerCapture() { return false; },
      setPointerCapture() {},
      releasePointerCapture() {},
      querySelector(sel) {
        if (sel.startsWith('#')) {
          const id = sel.slice(1);
          return elements.find(e => e.id === id) || null;
        }
        return null;
      },
      querySelectorAll() { return []; }
    };
    return el;
  }

  const body = makeElement('body');
  const document = {
    body,
    hidden: false,
    activeElement: body,
    createElement: makeElement,
    getElementById(id) { return elements.find(e => e.id === id) || null; },
    querySelector(sel) { return body.querySelector(sel); },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(f => f !== fn);
    },
    dispatchKey(key, extra = {}) {
      const ev = {
        type: 'keydown',
        key,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
        ...extra
      };
      for (const fn of [...(listeners.keydown || [])]) fn(ev);
    }
  };

  let rafCounter = 1;
  const rafCallbacks = new Map();

  const window = {
    document,
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    GameSettings: { calm: false },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: () => ({ fontFamily: 'sans-serif' }),
    requestAnimationFrame(fn) {
      const id = rafCounter++;
      rafCallbacks.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) { rafCallbacks.delete(id); },
    setTimeout,
    clearTimeout,
    addEventListener(type, fn) { (listeners['win:' + type] ||= []).push(fn); },
    removeEventListener() {},
    Image: class MockImage {
      constructor() {
        this.naturalWidth = 1024;
        this.naturalHeight = 572;
      }
      set src(v) {
        this._src = v;
        if (v.includes('velas_frames')) {
          this.naturalWidth = 3584;
          this.naturalHeight = 224;
        } else if (v.includes('saco_')) {
          this.naturalWidth = 130;
          this.naturalHeight = 151;
        } else if (v.includes('mao-apontando')) {
          this.naturalWidth = 386;
          this.naturalHeight = 429;
        } else if (v.includes('mao-pressionando')) {
          this.naturalWidth = 364;
          this.naturalHeight = 386;
        }
        Promise.resolve().then(() => { if (this.onload) this.onload(); });
      }
      get src() { return this._src; }
    },
    stepRaf(timeMs) {
      const entries = [...rafCallbacks.entries()];
      rafCallbacks.clear();
      for (const [, fn] of entries) fn(timeMs);
    }
  };

  return { window, document, elements };
}

async function runTests() {
  const { window, document, elements } = createMockDOM();
  const context = vm.createContext(Object.assign(window, {
    window,
    document,
    console,
    Math,
    Promise,
    Int8Array,
    Uint8Array,
    Float32Array,
    Set,
    Map,
    Error,
    Boolean,
    String,
    Number,
    Object,
    Array,
    getComputedStyle: window.getComputedStyle,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    setTimeout,
    clearTimeout
  }));

  const scripts = [
    'js/config.js',
    'js/tutorial-data.js',
    'js/tutorial-demos.js',
    'js/tutorial-card.js',
    'js/operacoes-layout.js',
    'js/operacoes-puzzle.js'
  ];

  for (const rel of scripts) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }

  // 1. Verificar dados de tutorial de Operações (2 passos: operacoes-placa e operacoes-arrastar)
  const opData = window.TutorialData.operacoes;
  assert.ok(opData, 'TutorialData.operacoes deve existir');
  assert.strictEqual(opData.passos.length, 2, 'Operações deve ter exatamente 2 passos de tutorial');
  assert.strictEqual(opData.passos[0].titulo, 'Leia a placa');
  assert.strictEqual(opData.passos[0].texto, 'Tudo o que você precisa fazer está escrito na placa, lá em cima.');
  assert.strictEqual(opData.passos[0].demo, 'operacoes-placa');
  assert.strictEqual(opData.passos[1].titulo, 'Coloque os sacos no moinho');
  assert.strictEqual(opData.passos[1].texto, 'Leve os sacos da mesa até o moinho. Aqui são dois sacos!');
  assert.strictEqual(opData.passos[1].demo, 'operacoes-arrastar');

  // 2. Verificar renderização das 2 demos de Operações (estático e animado)
  for (const demoId of ['operacoes-placa', 'operacoes-arrastar']) {
    const testCanvas = document.createElement('canvas');
    const runner = window.TutorialDemos.iniciar(demoId, testCanvas);
    assert.ok(runner, `Runner da demo ${demoId} deve iniciar`);
    await new Promise(r => setTimeout(r, 20));
    window.stepRaf(100);
    window.stepRaf(2500);
    window.stepRaf(5000);
    window.stepRaf(7500);
    runner.tocarUmaVez();
    window.stepRaf(1000);
    runner.parar();
  }

  // 3. Preparar e abrir o puzzle de Operações
  const opLocal = vm.runInContext('OPERACOES_LOCAL', context);
  const opLayoutLocal = vm.runInContext('OPERACOES_LAYOUT_LOCAL', context);
  await window.OperacoesPuzzle.prepare(opLocal, opLayoutLocal);

  let exited = null;
  let debugOn = false;
  window.OperacoesPuzzle.open({
    onExit(won) { exited = won; },
    debug: () => debugOn,
    toggleDebug() { debugOn = !debugOn; }
  });

  // 4. O cartão de tutorial deve abrir automaticamente ao entrar no puzzle
  assert.strictEqual(window.TutorialCard.isAberto(), true, 'O cartão deve abrir ao entrar no puzzle de Operações');
  assert.strictEqual(window.TutorialCard.getPassoAtual(), 0);
  const titleEl = document.getElementById('tutorial-card-title');
  assert.strictEqual(titleEl.textContent, 'Leia a placa');

  const btnPrimary = elements.find(e => e.className === 'tutorial-btn-principal');
  const btnBack = elements.find(e => e.className === 'tutorial-btn-voltar');
  assert.ok(btnPrimary, 'Botão principal do cartão deve existir');
  assert.strictEqual(btnPrimary.textContent, 'Próximo', 'No 1º passo o botão deve ser "Próximo"');
  assert.strictEqual(btnBack.hidden, true, 'No 1º passo o botão Voltar deve ficar oculto');

  // 5. Enquanto o cartão está aberto, o puzzle deve ficar parado (N em debug não avança e Escape fecha só o cartão)
  debugOn = true;
  document.dispatchKey('n');
  window.stepRaf(1000);
  assert.strictEqual(exited, null, 'O puzzle não deve sair nem avançar enquanto o cartão está aberto');

  // Avançar para o 2º passo ("OK")
  btnPrimary.click();
  assert.strictEqual(window.TutorialCard.getPassoAtual(), 1, 'Deve avançar para o 2º passo');
  assert.strictEqual(titleEl.textContent, 'Coloque os sacos no moinho');
  assert.strictEqual(btnPrimary.textContent, 'OK', 'No 2º passo o botão deve ser "OK"');
  assert.strictEqual(btnBack.hidden, false, 'No 2º passo o botão Voltar deve aparecer');

  // Fechar clicando em OK
  btnPrimary.click();
  assert.strictEqual(window.TutorialCard.isAberto(), false, 'Clicar em OK no 2º passo deve fechar o cartão');

  // 6. Botão "?" no HUD reabre o cartão no passo 1 e desativa durante animações do puzzle
  const helpBtn = elements.find(e => e.tagName === 'BUTTON' && e.getAttribute('aria-label') === 'Ajuda: como jogar');
  assert.ok(helpBtn, 'Botão "?" (Ajuda: como jogar) deve existir no HUD do puzzle de Operações');
  assert.strictEqual(helpBtn.disabled, false, 'Botão "?" deve estar habilitado durante o estado JOGANDO');

  helpBtn.click();
  assert.strictEqual(window.TutorialCard.isAberto(), true, 'Clicar em "?" deve reabrir o cartão');
  assert.strictEqual(window.TutorialCard.getPassoAtual(), 0, 'Reabrir por "?" deve iniciar no 1º passo');

  // Fechar com Escape sem sair do puzzle
  document.dispatchKey('Escape');
  assert.strictEqual(window.TutorialCard.isAberto(), false, 'Escape deve fechar o cartão');
  assert.strictEqual(exited, null, 'Escape com cartão aberto não deve sair do puzzle');

  // 7. Quando uma animação do puzzle está rodando (ex.: SUCESSO após resolver e assentar por 0.6s), "?" fica desativado
  document.dispatchKey('n'); // resolve a fase 1 em modo debug
  for (let i = 1; i <= 15; i++) {
    window.stepRaf(1000 + i * 50); // avança em passos de 50ms até atingir ASSENTA_S (0.6s) e entrar em SUCESSO
  }
  assert.strictEqual(helpBtn.disabled, true, 'Botão "?" deve ficar desativado enquanto uma animação do puzzle estiver rodando');

  console.log('PASS: todos os testes de integração do tutorial de Operações passaram!');
}

runTests().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
