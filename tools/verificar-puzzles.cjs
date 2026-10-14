// Regras, telas e integração em DOM simulado. Não valida navegador, CSS, áudio ou toque real.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const camel = value => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

class EventTarget {
  constructor() { this.events = new Map(); }
  addEventListener(type, listener) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(listener);
  }
  emit(type, options = {}) {
    const event = {
      target: this, currentTarget: this, defaultPrevented: false, repeat: false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
      ...options
    };
    for (const listener of this.events.get(type) || []) {
      listener(event);
      if (event.stopped) break;
    }
    return event;
  }
}

function makeDOM() {
  let document;
  class Element extends EventTarget {
    constructor(tag, attributes = {}) {
      super();
      this.tagName = tag.toUpperCase();
      this.attributes = {};
      this.dataset = {};
      this.style = {};
      this.children = [];
      this.parentElement = null;
      this.hidden = false;
      this.disabled = false;
      this.open = false;
      this._text = '';
      this.classes = new Set();
      this.classList = {
        add: (...values) => values.forEach(value => this.classes.add(value)),
        remove: (...values) => values.forEach(value => this.classes.delete(value)),
        contains: value => this.classes.has(value),
        toggle: (value, force) => {
          const enabled = force === undefined ? !this.classes.has(value) : force;
          if (enabled) this.classes.add(value); else this.classes.delete(value);
          return enabled;
        }
      };
      for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value);
    }
    get id() { return this.attributes.id || ''; }
    set id(value) { this.setAttribute('id', value); }
    get className() { return [...this.classes].join(' '); }
    set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name.startsWith('data-')) this.dataset[camel(name.slice(5))] = String(value);
      if (name === 'class') this.className = String(value);
      if (name === 'hidden' || name === 'disabled' || name === 'open') this[name] = true;
    }
    getAttribute(name) {
      if (name === 'class') return this.className;
      return this.attributes[name] ?? null;
    }
    removeAttribute(name) {
      delete this.attributes[name];
      if (name === 'hidden' || name === 'disabled' || name === 'open') this[name] = false;
    }
    appendChild(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(item => item !== child);
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    replaceChildren(...children) {
      for (const child of this.children) child.parentElement = null;
      this.children = [];
      this._text = '';
      for (const child of children) this.appendChild(child);
    }
    matches(selector) {
      const id = selector.match(/#([\w-]+)/);
      if (id && this.id !== id[1]) return false;
      const tag = selector.match(/^[\w-]+/);
      if (tag && this.tagName.toLowerCase() !== tag[0]) return false;
      for (const match of selector.matchAll(/\.([\w-]+)/g)) if (!this.classes.has(match[1])) return false;
      for (const match of selector.matchAll(/\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]/g)) {
        const name = match[1];
        const value = name.startsWith('data-') ? this.dataset[camel(name.slice(5))] : name === 'open' ? (this.open ? '' : undefined) : this.attributes[name];
        if (value === undefined || match[2] !== undefined && value !== match[2]) return false;
      }
      return true;
    }
    querySelectorAll(selector) {
      const output = [];
      const visit = node => {
        for (const child of node.children) {
          if (child.matches(selector)) output.push(child);
          visit(child);
        }
      };
      visit(this);
      return output;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() { document.activeElement = this; }
    click() { if (!this.disabled) return this.emit('click', {detail: 1}); }
    showModal() { assert(!this.open); this.open = true; }
    close() { this.open = false; this.emit('close'); }
    setPointerCapture() {}
    getBoundingClientRect() { return {left: 0, top: 0, right: 960, bottom: 600}; }
  }
  document = new Element('document');
  document.hidden = false;
  document.activeElement = null;
  document.createElement = tag => new Element(tag);
  document.createElementNS = (_, tag) => new Element(tag);
  const stack = [document];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const match of html.matchAll(/<(\/)?([a-z][\w-]*)\b([^>]*?)(\/?)>/gi)) {
    const tag = match[2].toLowerCase();
    if (match[1]) {
      const index = stack.findLastIndex(node => node.tagName.toLowerCase() === tag);
      if (index > 0) stack.length = index;
      continue;
    }
    const attributes = {};
    for (const attr of match[3].matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)) attributes[attr[1]] = attr[2] ?? attr[3] ?? '';
    const node = new Element(tag, attributes);
    stack.at(-1).appendChild(node);
    if (!voidTags.has(tag) && !match[4]) stack.push(node);
  }
  document.body = document.querySelector('body');
  return {document, Element};
}

function makeHarness(islandAt) {
  const {document, Element} = makeDOM();
  const window = new EventTarget();
  window.matchMedia = () => ({matches: false});
  const timers = new Map();
  let timerId = 0, clock = 0, animation = null, animationId = 0, lastPlayer, playerReference, world;
  const audio = {click() {}, success() { audio.successes++; }, successes: 0};
  window.GameAudio = audio;
  const context = vm.createContext({
    document, window, GameAudio: audio,
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, {callback, at: clock + delay}); return id; },
    clearTimeout: id => timers.delete(id),
    requestAnimationFrame: callback => { animation = callback; return ++animationId; },
    cancelAnimationFrame: () => { animation = null; }
  });
  const load = filename => {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', filename), 'utf8'), context, {filename});
    Object.assign(context, window);
  };
  for (const filename of ['adventure-progress.js', 'puzzle-data.js', 'puzzle-game.js', 'rescue-game.js']) load(filename);
  if (islandAt) {
    load('island-world.js');
    const World = window.IslandWorld;
    world = World.create();
    const point = world.points.find(item => item.id === islandAt);
    assert(point, `Ponto da ilha ausente: ${islandAt}`);
    const candidates = [];
    for (let x = -84; x <= 84; x += 12) for (let y = -84; y <= 84; y += 12) {
      if (Math.hypot(x, y) < 100 && World.isWalkable(world, point.x + x, point.y + y)) candidates.push({x: point.x + x, y: point.y + y});
    }
    assert(candidates.length, `Sem posição livre para ${islandAt}`);
    world.spawn = candidates[0];
    context.IslandWorld = {...World, create: () => world};
    const renderer = {
      ready: Promise.resolve(), failed: [], width: 960, height: 600,
      resize() {}, renderOverview() {},
      draw(player) { playerReference = player; lastPlayer = {...player}; }
    };
    context.IslandRenderer = {create: () => renderer};
    load('island-game.js');
  }
  const $ = selector => { const node = document.querySelector(selector); assert(node, `Elemento ausente: ${selector}`); return node; };
  return {
    document, window, context, load, $, timers, audio, world,
    puzzle: window.PuzzleGame, progress: window.AdventureProgress, rescue: window.GameRescue,
    action: name => $(`[data-puzzle-action="${name}"]`),
    key: (key, options) => document.emit('keydown', {key, ...options}),
    nextTimer() {
      assert(timers.size, 'Esperava um timer da demonstração.');
      const [id, task] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      clock = task.at; timers.delete(id); task.callback();
    },
    drainTimers() { for (let count = 0; timers.size; count++) { assert(count < 1000, 'Timer não encerrou.'); this.nextTimer(); } },
    tick() { assert(animation, 'O loop da ilha deveria estar ativo.'); const callback = animation; animation = null; callback(clock += 50); },
    get lastPlayer() { return lastPlayer; },
    get playerReference() { return playerReference; },
    Element
  };
}

function verifyReferencesAndContent(h) {
  const exists = (source, relative) => {
    if (!relative || /^[a-z]+:|^#|^\/\//i.test(relative)) return;
    assert(fs.existsSync(path.resolve(path.dirname(source), relative.split(/[?#]/)[0])), `Referência ausente: ${relative}`);
  };
  const index = path.join(root, 'index.html');
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) exists(index, match[1]);
  for (const filename of fs.readdirSync(path.join(root, 'css')).filter(file => file.endsWith('.css'))) {
    const source = path.join(root, 'css', filename);
    for (const match of fs.readFileSync(source, 'utf8').matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) exists(source, match[1]);
  }
  const {regions, tokens} = h.window.PuzzleData;
  assert.deepEqual(Object.keys(regions), ['forest', 'village', 'ruins', 'farm']);
  assert.equal(new Set(tokens.map(token => token.id)).size, tokens.length);
  for (const [id, region] of Object.entries(regions)) {
    assert.equal(region.rounds.length, 3, `${id}: três rodadas`);
    exists(index, region.key); exists(index, region.scene);
    for (const round of region.rounds) {
      assert(round.hint.length > 0);
      if (region.kind === 'sequence') {
        assert(round.sequence.every(token => tokens.some(item => item.id === token)));
      } else if (region.kind === 'rotation') {
        for (const angle of [round.start, round.target]) assert([0, 90, 180, 270].includes(angle));
        assert.notEqual(round.start, round.target);
      } else {
        assert.equal(new Set(round.options).size, round.options.length, 'Alternativas únicas.');
        assert.equal(round.options.filter(value => value === round.answer).length, 1, 'Uma resposta correta nas alternativas.');
        const left = round.left ?? round.answer, right = round.right ?? round.answer;
        const result = round.operator === '+' ? left + right : left - right;
        assert.equal(result, region.kind === 'missing' ? round.result : round.answer, `${id}: resposta matemática correta`);
      }
    }
  }
  assert.deepEqual(Array.from(regions.forest.rounds, round => round.sequence.length), [2, 3, 4]);
}

function solveRound(h, id, index) {
  const data = h.window.PuzzleData.regions[id], round = data.rounds[index];
  if (data.kind === 'sequence') {
    h.drainTimers();
    for (const token of round.sequence) h.action(`token-${token}`).click();
    h.action('check-sequence').click();
  } else if (data.kind === 'rotation') {
    let rotation = Number(h.$('.puzzle-rotation-label').textContent.match(/\d+/)[0]);
    while (rotation !== round.target) { h.action('rotate-right').click(); rotation = (rotation + 90) % 360; }
    h.action('check-rotation').click();
  } else h.action(`answer-${round.answer}`).click();
  assert.equal(h.$('#puzzle-screen').dataset.state, 'solved', `${id} rodada ${index + 1}`);
}

function finishRegion(h, id) {
  for (let index = 0; index < 3; index++) { solveRound(h, id, index); h.$('#puzzle-next').click(); }
  assert.equal(h.$('#puzzle-screen').dataset.state, 'reward');
}

function verifyProgressInvariants() {
  const h = makeHarness(), p = h.progress;
  assert.equal(p.award('center'), false);
  assert.equal(p.unlock('forest'), false);
  assert.equal(p.rescue(), false);
  for (const id of p.regions) {
    assert(p.award(id)); assert.equal(p.award(id), false);
    assert(p.unlock(id)); assert.equal(p.unlock(id), false);
    if (p.unlockedCount < 4) assert.equal(p.rescue(), false);
  }
  assert.equal(p.keyCount, 4); assert.equal(p.unlockedCount, 4);
  assert(p.rescue()); assert(p.rescued); assert.equal(p.rescue(), false);
}

function verifyPuzzleAndRescueScreens() {
  const h = makeHarness(), completed = new Map();
  let exits = 0, rescueExits = 0, rescueUpdates = 0, menus = 0;
  const open = id => h.puzzle.open(id, {
    onComplete(region) { completed.set(region, (completed.get(region) || 0) + 1); h.progress.award(region); },
    onExit() { exits++; h.$('#island-canvas').focus(); }
  });
  const openRescue = () => h.rescue.open({onExit() { rescueExits++; }, onProgress() { rescueUpdates++; }, onMenu() { menus++; }});
  verifyReferencesAndContent(h);
  assert.equal(h.puzzle.open('unknown'), false); assert(!h.puzzle.active);
  openRescue();
  for (const id of h.progress.regions) {
    assert(h.$(`#rescue-lock-${id}`).disabled);
    h.$(`#rescue-lock-${id}`).emit('click');
  }
  assert.equal(h.progress.unlockedCount, 0); assert(!h.progress.rescued);
  h.key('Escape', {repeat: true}); assert(h.rescue.active);
  h.key('Escape', {ctrlKey: true}); assert(h.rescue.active);
  h.key('Escape'); assert.equal(rescueExits, 1); assert(!h.rescue.active);

  open('forest');
  assert.equal(h.document.activeElement.id, 'puzzle-title');
  assert.equal(h.$('#puzzle-screen').dataset.state, 'observing');
  assert(h.action('token-circle').disabled);
  h.$('#puzzle-help').click(); assert(!h.$('#puzzle-hint').hidden);
  h.nextTimer();
  h.window.emit('blur'); assert.equal(h.timers.size, 0);
  assert.match(h.$('#puzzle-feedback').textContent, /interrompida/);
  assert(h.action('token-circle').disabled); assert(!h.action('replay-sequence').disabled);
  h.action('replay-sequence').click(); h.document.hidden = true; h.document.emit('visibilitychange');
  assert.equal(h.timers.size, 0); h.document.hidden = false;
  h.action('replay-sequence').click(); h.$('#book-dialog').showModal(); h.nextTimer();
  assert.equal(h.timers.size, 0); h.$('#book-dialog').close();
  h.action('replay-sequence').click(); h.drainTimers();
  h.action('token-circle').click();
  h.key('Escape'); assert(!h.puzzle.active); assert.equal(exits, 1);
  assert.equal(h.document.activeElement.id, 'island-canvas');
  open('forest'); assert.equal(h.$('.puzzle-answer-trail').querySelectorAll('.is-filled').length, 1, 'Retomar preserva sequência parcial.');
  h.action('clear-sequence').click();
  h.action('token-star').click(); h.action('token-star').click(); h.action('check-sequence').click();
  assert.equal(h.$('#puzzle-screen').dataset.state, 'playing');
  assert.equal(h.$('.puzzle-answer-trail').querySelectorAll('.is-filled').length, 0, 'Erro permite nova tentativa.');
  solveRound(h, 'forest', 0);
  h.key('Escape'); open('forest');
  assert.equal(h.$('#puzzle-screen').dataset.state, 'solved', 'Retomar mantém rodada resolvida.');
  h.$('#puzzle-next').click();
  for (let index = 1; index < 3; index++) { solveRound(h, 'forest', index); h.$('#puzzle-next').click(); }
  assert(h.progress.hasKey('forest')); assert.equal(completed.get('forest'), 1);
  h.key('Escape'); openRescue();
  h.$('#rescue-lock-forest').click();
  assert.equal(h.progress.unlockedCount, 1); assert(!h.progress.rescued);
  h.key('Escape'); openRescue(); assert(h.$('#rescue-lock-forest').disabled);
  assert.equal(h.$('#rescue-lock-forest').dataset.unlocked, 'true'); h.key('Escape');
  open('forest'); assert.equal(h.$('#puzzle-screen').dataset.state, 'reward');
  h.action('replay-region').click();
  h.puzzle.stop(); assert.equal(h.timers.size, 0);
  const feedbackAfterStop = h.$('#puzzle-feedback').textContent;
  h.drainTimers(); assert.equal(h.$('#puzzle-feedback').textContent, feedbackAfterStop);
  assert.equal(completed.get('forest'), 1); assert(h.$('#puzzle-screen').hidden);
  open('forest'); finishRegion(h, 'forest');
  assert.equal(completed.get('forest'), 1, 'Prática não repete entrega da chave.');
  assert.equal(h.progress.keyCount, 1); h.key('Escape');

  open('village'); h.action('answer-2').click(); assert.equal(h.$('#puzzle-screen').dataset.state, 'playing');
  h.$('#puzzle-help').click(); assert.match(h.$('#puzzle-hint').textContent, /2/);
  solveRound(h, 'village', 0); h.$('#puzzle-next').click();
  h.key('Escape'); open('village'); assert.equal(h.$('#puzzle-round').textContent, 'Desafio 2 de 3');
  for (let index = 1; index < 3; index++) { solveRound(h, 'village', index); h.$('#puzzle-next').click(); }
  h.key('Escape');

  open('ruins'); h.action('check-rotation').click(); assert.equal(h.$('#puzzle-screen').dataset.state, 'playing');
  const rotationEvent = h.key('ArrowLeft'); assert(rotationEvent.defaultPrevented);
  assert.match(h.$('.puzzle-rotation-label').textContent, /270/);
  h.key('ArrowLeft', {repeat: true}); assert.match(h.$('.puzzle-rotation-label').textContent, /270/);
  h.$('#book-dialog').showModal(); h.key('ArrowRight'); assert.match(h.$('.puzzle-rotation-label').textContent, /270/); h.$('#book-dialog').close();
  h.key('Escape'); open('ruins'); assert.match(h.$('.puzzle-rotation-label').textContent, /270/, 'Retomar preserva giro parcial.');
  finishRegion(h, 'ruins'); h.key('Escape');
  open('farm'); h.action('answer-4').click(); assert.equal(h.$('#puzzle-screen').dataset.state, 'playing');
  finishRegion(h, 'farm'); h.key('Escape');
  assert.equal(h.progress.keyCount, 4);
  for (const id of h.progress.regions) assert.equal(completed.get(id), 1);

  openRescue(); h.$('#book-dialog').showModal(); h.$('#rescue-lock-village').click();
  assert.equal(h.progress.unlockedCount, 1, 'Diálogo suspende cadeados.'); h.$('#book-dialog').close();
  for (const id of ['village', 'ruins', 'farm']) h.$(`#rescue-lock-${id}`).click();
  assert(h.progress.rescued); assert.equal(h.progress.unlockedCount, 4); assert.equal(rescueUpdates, 4);
  assert.equal(h.$('#rescue-screen').dataset.rescued, 'true'); assert(!h.$('#rescue-menu').hidden);
  assert.equal(h.document.activeElement.id, 'rescue-title');
  h.$('#rescue-menu').click(); assert.equal(menus, 1); assert(!h.rescue.active);
  openRescue(); assert.equal(h.$('#rescue-screen').dataset.rescued, 'true');
  h.rescue.stop(); h.$('#rescue-lock-farm').emit('click'); assert.equal(rescueUpdates, 4);

  // Callback de conclusão pode encerrar a tela sem renderizar recompensa depois.
  const stopped = makeHarness();
  stopped.puzzle.open('farm', {onComplete() { stopped.puzzle.stop(); }});
  for (let index = 0; index < 3; index++) { solveRound(stopped, 'farm', index); stopped.$('#puzzle-next').click(); }
  assert(!stopped.puzzle.active); assert(stopped.$('#puzzle-screen').hidden);
  assert.notEqual(stopped.$('#puzzle-screen').dataset.state, 'reward');
}

async function verifyIslandIntegration() {
  for (const id of ['forest', 'village', 'ruins', 'farm', 'mountain']) {
    const h = makeHarness(id);
    await Promise.resolve();
    const island = h.window.GameIsland;
    island.start(); h.tick();
    const origin = {...h.lastPlayer};
    h.key('e');
    assert(h.$('#island-screen').hidden, `${id}: entra em outra tela`);
    assert(id === 'mountain' ? h.rescue.active : h.puzzle.active);
    for (const key of ['w', 'd', 'm', 'e']) h.key(key);
    for (let count = 0; count < 3; count++) h.tick();
    assert.deepEqual(h.lastPlayer, origin, `${id}: exploração suspensa`);
    assert(!h.$('#island-map-dialog').open); assert(!h.$('#island-info-dialog').open);
    const escape = h.key('Escape'); assert(escape.defaultPrevented);
    assert(!h.puzzle.active && !h.rescue.active); assert(!h.$('#island-screen').hidden);
    assert(!h.$('#island-pause-dialog').open, 'Escape da fase não abre pausa no mesmo evento.');
    assert.equal(h.document.activeElement.id, 'island-canvas');
    for (let count = 0; count < 3; count++) h.tick();
    assert.equal(h.lastPlayer.x, origin.x); assert.equal(h.lastPlayer.y, origin.y, 'Retorno não deixa tecla presa.');
    h.$('#island-interact').click();
    if (id === 'mountain') h.$('#rescue-return').click(); else h.$('#puzzle-return').click();
    assert.equal(h.document.activeElement.id, 'island-interact', 'Foco retorna ao botão de origem.');
    h.key('e'); island.stop(); assert(!h.puzzle.active && !h.rescue.active);
    assert.equal(h.timers.size, 0); assert.equal(h.document.activeElement.getAttribute('data-open'), 'start');
    island.start(); h.tick(); h.key('e');
    if (id !== 'mountain') {
      finishRegion(h, id);
      assert(h.progress.hasKey(id)); assert.equal(h.$('#island-key-count').textContent, '1 de 4 chaves');
      h.key('Escape'); island.stop(); island.start(); h.tick();
      assert(h.progress.hasKey(id), 'Menu mantém chave da aventura.');
      h.key('e'); assert.equal(h.$('#puzzle-screen').dataset.state, 'reward');
    } else {
      h.progress.award('forest'); h.rescue.stop(); h.key('e');
      h.$('#rescue-lock-forest').click(); assert.deepEqual(Array.from(h.world.unlockedLocks), ['forest']);
      assert.equal(h.world.catRescued, false);
      for (const region of ['village', 'ruins', 'farm']) h.progress.award(region);
      h.rescue.stop(); h.key('e');
      for (const region of ['village', 'ruins', 'farm']) h.$(`#rescue-lock-${region}`).click();
      assert.equal(h.world.catRescued, true); assert.equal(h.world.unlockedLocks.length, 4);
      h.$('#rescue-menu').click(); assert(!island.active); assert(!h.$('#home-screen').hidden);
      island.start(); h.tick(); assert(h.progress.rescued); assert.equal(h.world.catRescued, true);
    }
    island.stop();
  }
}

(async () => {
  verifyProgressInvariants();
  verifyPuzzleAndRescueScreens();
  await verifyIslandIntegration();
  console.log('Puzzles verificados: referências locais, 12 rodadas, respostas, dicas, erro e retomada, demonstração interrompida, prática, quatro chaves únicas, cadeados e final, foco, Escape e integração com a ilha em DOM simulado.');
})().catch(error => { console.error(error); process.exitCode = 1; });
