// Testes do cartão de tutorial no Labirinto (Lógica) em DOM simulado.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..');
const els = [];
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.id = ''; this.className = ''; this.textContent = ''; this.innerHTML = ''; this.hidden = false; this.disabled = false; this.style = {}; this.children = []; this.parentNode = null; this.attrs = {}; this.listeners = {}; els.push(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; } prepend(c) { return this.appendChild(c); }
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; } remove() { this.parentNode?.removeChild(this); }
  focus() { doc.activeElement = this; } addEventListener(e, f) { (this.listeners[e] ||= []).push(f); } removeEventListener() {}
  querySelectorAll(s) { return s.includes('button') ? els.filter(e => e.tagName === 'BUTTON') : []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  getContext() { return new Proxy({}, { get: (t, k) => k === 'getImageData' ? (() => ({ data: new Uint8ClampedArray(4) })) : k === 'createImageData' ? ((w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })) : k === 'createRadialGradient' || k === 'createLinearGradient' ? (() => ({ addColorStop() {} })) : k === 'measureText' ? (() => ({ width: 100 })) : (t[k] ?? (() => {})), set: (t, k, v) => { t[k] = v; return true; } }); }
}
const docListeners = {};
const doc = { hidden: false, activeElement: null, body: new El('body'), head: new El('head'), createElement: t => new El(t), getElementById: id => els.find(e => e.id === id) || null, querySelector: s => s.startsWith('.') ? els.find(e => e.className.includes(s.slice(1))) || null : null, querySelectorAll: () => [], addEventListener: (e, f) => { (docListeners[e] ||= []).push(f); }, removeEventListener: () => {} };
let rafCb = null;
const win = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, matchMedia: () => ({ matches: false }), addEventListener() {}, removeEventListener() {}, GameSettings: { calm: false }, Music: { entrarNaCena() {}, sairDaCena() {}, precarregarCena() {} } };
const sb = { console: { ...console, info() {} }, window: win, document: doc, location: { search: '', protocol: 'file:' }, performance: { now: () => 0 }, getComputedStyle: () => ({ fontFamily: 'x' }), requestAnimationFrame: f => { rafCb = f; return 1; }, cancelAnimationFrame() {}, setTimeout: f => { f(); return 1; }, clearTimeout() {}, Image: class { constructor() { this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 64; } set src(v) { this._s = v; Promise.resolve().then(() => this.onload?.()); } get src() { return this._s; } }, Uint8Array, Int8Array, Float32Array, Int16Array, Uint8ClampedArray, Promise, Math, JSON, Object, Array, Set, Map, Number, Error, Boolean, String };
win.document = doc; vm.createContext(sb);
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8') + `\n;for (const k of ['LABIRINTO','LABIRINTO_LOCAL','LABIRINTO_CONFIG','HERO_SHEET']) if (typeof globalThis[k]==='undefined') try { globalThis[k]=eval(k) } catch(_){}`, sb, { filename: f });
for (const f of ['js/config.js']) { try { run(f); } catch (e) {} }
for (const k of Object.keys(win)) if (!(k in sb)) sb[k] = win[k];
for (const f of ['js/walk-animation.js', 'js/hero-animation.js', 'js/labirinto-mascaras.js', 'js/labirinto-logica.js', 'js/tutorial-data.js', 'js/tutorial-demos.js', 'js/tutorial-card.js', 'js/labirinto-puzzle.js']) { try { run(f); } catch (e) { if (!/walk|hero/.test(f)) throw e; } }
for (const k of Object.keys(win)) if (!(k in sb)) sb[k] = win[k];

(async () => {
  const W = win;
  // 1) Dados: 2 passos
  const d = W.TutorialData.logica;
  assert.strictEqual(d.passos.length, 2);
  assert.strictEqual(JSON.stringify(d.passos.map(p => p.titulo)), JSON.stringify(['Siga a ordem das runas', 'Errou? Volta ao início']));
  assert.strictEqual(JSON.stringify(d.passos.map(p => p.texto)), JSON.stringify([
    'Veja quais runas acendem. Depois vá até elas na mesma ordem!',
    'Se for na runa errada, você volta ao começo. Sem problema: tente de novo!'
  ]));
  assert.strictEqual(JSON.stringify(d.passos.map(p => p.demo)), JSON.stringify(['logica-ordem', 'logica-erro']));
  console.log('✓ 1: TutorialData.logica com 2 passos, títulos, textos e demos');

  // 2) Abre o labirinto real: cartão aberto e sequência ainda não começou
  assert(sb.LABIRINTO_LOCAL, 'LABIRINTO_LOCAL disponível');
  await W.LabirintoPuzzle.prepare(sb.LABIRINTO_LOCAL);
  let exited = null;
  W.LabirintoPuzzle.open({ onExit: v => { exited = v; }, debug: () => false });
  assert(W.TutorialCard.isAberto(), 'cartão abre ao entrar no labirinto');
  const principal = els.find(e => e.className === 'tutorial-btn-principal'), voltar = els.find(e => e.className === 'tutorial-btn-voltar');
  const help = els.find(e => e.attrs['aria-label'] === 'Ajuda: como jogar');
  const skip = els.find(e => e.textContent === 'Já memorizei');
  assert(help && skip);
  assert.strictEqual(skip.hidden, true, 'tela de memorização ainda não apareceu (sequência não acendeu)');
  for (let i = 0; i < 300; i++) rafCb?.(i * 16.7); // 5 s com o cartão aberto
  assert.strictEqual(skip.hidden, true, 'puzzle parado: sem MEMORIZAR com o cartão aberto');
  console.log('✓ 2: cartão abre antes da sequência; puzzle parado por 5 s');

  // 3) Rótulos Próximo -> OK, Voltar
  assert.strictEqual(principal.textContent, 'Próximo'); assert.strictEqual(voltar.hidden, true);
  principal.onclick(); assert.strictEqual(principal.textContent, 'OK'); assert.strictEqual(voltar.hidden, false);
  voltar.onclick(); assert.strictEqual(principal.textContent, 'Próximo');
  principal.onclick(); principal.onclick();
  assert(!W.TutorialCard.isAberto(), 'OK fecha');
  console.log('✓ 3: rótulos "Próximo" → "OK", Voltar funciona, OK fecha');

  // 4) Ao fechar, a sequência começa (MEMORIZAR) e "?" fica desativado
  assert.strictEqual(skip.hidden, false, 'MEMORIZAR começa depois de fechar');
  assert.strictEqual(help.disabled, true, '"?" desativado enquanto a sequência acende');
  help.onclick(); assert(!W.TutorialCard.isAberto(), '"?" desativado não abre');
  console.log('✓ 4: sequência só começa após fechar; "?" desativado durante a sequência');

  // 5) Passada a memorização (8 s), "?" reativa e reabre o cartão
  for (let i = 300; i < 900; i++) rafCb?.(i * 16.7);
  assert.strictEqual(skip.hidden, true); assert.strictEqual(help.disabled, false, '"?" ativo ao andar');
  help.onclick(); assert(W.TutorialCard.isAberto(), '"?" reabre');
  assert.strictEqual(W.TutorialCard.getPassoAtual(), 0, 'reabre no passo 1');
  W.TutorialCard.fechar();
  console.log('✓ 5: "?" reativa ao andar e reabre o cartão no passo 1');

  // 6) Frequência: segunda entrada na sessão não abre sozinho
  W.LabirintoPuzzle.open({ onExit() {}, debug: () => false });
  const skip2 = els.filter(e => e.textContent === 'Já memorizei').at(-1);
  assert(!W.TutorialCard.isAberto(), 'já visto na sessão');
  assert.strictEqual(skip2.hidden, false);
  console.log('✓ 6: "primeira-vez-na-sessao" respeitada na reentrada');

  // 7) Demos rodam deterministicamente em vários tempos e em reduced-motion
  const cv = new El('canvas'); cv.width = 815; cv.height = 526;
  for (const id of ['logica-ordem', 'logica-erro']) {
    const r = W.TutorialDemos.iniciar(id, cv); assert(r, id);
    await new Promise(res => setImmediate(res));
    for (const t of [0, 600, 1200, 2000, 3500, 4800, 6500, 7500, 8300, 9500, 11000, 13000]) {
      rafCb?.(t);
    }
    W.TutorialDemos.parar();
  }
  win.GameSettings.calm = true;
  for (const id of ['logica-ordem', 'logica-erro']) {
    const r = W.TutorialDemos.iniciar(id, cv); assert(r, id);
    await new Promise(res => setImmediate(res));
    r.tocarUmaVez();
    for (const t of [0, 2000, 6000, 9000, 15000]) rafCb?.(t);
    W.TutorialDemos.parar();
  }
  win.GameSettings.calm = false;
  console.log('✓ 7: demos logica-ordem e logica-erro registradas e executáveis (animado + quadro estático)');
  console.log('\nTODOS OS 7 TESTES DO TUTORIAL DE LÓGICA PASSARAM!');
})().catch(e => { console.error(e); process.exit(1); });
