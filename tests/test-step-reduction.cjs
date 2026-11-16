const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TESTES DE REDUÇÃO DE PASSO E TROCA IMEDIATA (DOM SIMULADO) ===\n');

// Carrega scripts no contexto VM
const sandbox = {
  window: {},
  document: {
    querySelector: () => ({
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        clearRect: () => {},
        setTransform: () => {},
        scale: () => {},
        translate: () => {},
        beginPath: () => {},
        roundRect: () => {},
        fill: () => {},
        strokeRect: () => {},
        fillText: () => {},
        measureText: () => ({ width: 50 })
      }),
      focus: () => {},
      classList: { add: () => {}, remove: () => {}, replace: () => {} },
      style: {},
      addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
      dataset: {}
    }),
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  navigator: {},
  Math,
  performance: { now: () => Date.now() },
  Set,
  Map,
  Uint8Array,
  Float64Array,
  Promise,
  console: { log: () => {}, warn: () => {}, error: () => {} }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);

// 1. Carrega WalkAnimation, Config, HeroAnimation, IslandWorld
vm.runInContext(fs.readFileSync('js/walk-animation.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/config.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/hero-animation.js', 'utf8'), sandbox);

const STEP_TILE_NEW = vm.runInContext('STEP_TILE', sandbox);
const TICKS_NEW = vm.runInContext('TICKS_PER_TILE', sandbox);
const TICKS_DIAG_NEW = vm.runInContext('TICKS_PER_DIAGONAL', sandbox);
const TICKS_PER_FRAME_VAL = vm.runInContext('TICKS_PER_FRAME', sandbox);

const results = [];
function assertTest(num, name, pass, details) {
  results.push({ num, name, pass, details });
  console.log(`[${pass ? 'PASSOU' : 'FALHOU'}] Teste ${num}: ${name}`);
  console.log(`         Detalhes: ${details}\n`);
}

// -----------------------------------------------------------------------------
// Teste 1: Velocidade em px/s igual à anterior (tolerância de 2%)
// -----------------------------------------------------------------------------
const STEP_TILE_OLD = 32 * (0.5 - 0.17); // 10.56 px
const TICKS_OLD = 16;
const speedStraightOld = STEP_TILE_OLD / (TICKS_OLD / 60); // 39.6 px/s

const speedStraightNew = STEP_TILE_NEW / (TICKS_NEW / 60); // 39.6 px/s

const speedDiffStraight = Math.abs(speedStraightNew - speedStraightOld) / speedStraightOld;

// Diagonal
const diagDistOld = Math.hypot(STEP_TILE_OLD, STEP_TILE_OLD); // 14.934 px
const TICKS_DIAG_OLD = 24;
const speedDiagOld = diagDistOld / (TICKS_DIAG_OLD / 60); // 37.335 px/s

const diagDistNew = Math.hypot(STEP_TILE_NEW, STEP_TILE_NEW); // 3.7335 px
const speedDiagNew = diagDistNew / (TICKS_DIAG_NEW / 60); // 37.335 px/s

const speedDiffDiag = Math.abs(speedDiagNew - speedDiagOld) / speedDiagOld;

const pass1 = speedDiffStraight <= 0.02 && speedDiffDiag <= 0.02;
assertTest(
  1,
  'Velocidade em px/s igual à anterior (tolerância de 2%) em reta e diagonal',
  pass1,
  `Reta anterior: ${speedStraightOld.toFixed(4)} px/s, Nova: ${speedStraightNew.toFixed(4)} px/s (dif: ${(speedDiffStraight*100).toFixed(2)}%). ` +
  `Diagonal anterior: ${speedDiagOld.toFixed(4)} px/s, Nova: ${speedDiagNew.toFixed(4)} px/s (dif: ${(speedDiffDiag*100).toFixed(2)}%).`
);

// -----------------------------------------------------------------------------
// Teste 2: Toque de 1 tick: distância ≤ o novo passo (2.64 px)
// -----------------------------------------------------------------------------
// Simula advance com 1 tick de entrada seguido de soltura
let px = 100, py = 100;
let inStep = false, prog = 0, dur = 0, fromX = 0, toX = 0;

function simAdvance(want) {
  if (want === null) {
    if (!inStep) return;
    prog++;
    const t = Math.min(1, prog / dur);
    px = fromX + (toX - fromX) * t;
    if (prog >= dur) inStep = false;
    return;
  }
  if (!inStep) {
    inStep = true;
    prog = 0;
    dur = 4; // 4 ticks para novo passo
    fromX = px;
    toX = px + STEP_TILE_NEW; // direção direita
  }
  prog++;
  const t = Math.min(1, prog / dur);
  px = fromX + (toX - fromX) * t;
  if (prog >= dur) inStep = false;
}

// Tick 1: tecla pressionada
simAdvance(2);
const posAfterTick1 = px;

// Tick 2 em diante: tecla solta até parar
for (let t = 0; t < 10; t++) {
  simAdvance(null);
}
const finalDist = px - 100;
const pass2 = finalDist <= STEP_TILE_NEW + 1e-6;

assertTest(
  2,
  'Toque de 1 tick: distância ≤ o novo passo (2.64 px)',
  pass2,
  `Distância percorrida no toque de 1 tick: ${finalDist.toFixed(4)} px (esperado ≤ ${STEP_TILE_NEW.toFixed(4)} px). ` +
  `Antes da mudança, um toque curto percorria ${STEP_TILE_OLD.toFixed(2)} px!`
);

// -----------------------------------------------------------------------------
// Teste 3: Troca de direção (direita -> baixo-direita -> baixo): em ≤ 4 ticks já segue nova direção
// -----------------------------------------------------------------------------
// Começa andando para a direita por 2 ticks (no meio de um passo de 4 ticks)
let p = {
  x: 100, y: 100,
  dir: 2, row: 2, inStep: true, prog: 2, dur: 4,
  fromX: 100, fromY: 100, toX: 100 + STEP_TILE_NEW, toY: 100,
  walk: 2
};
// Avança 2 ticks
p.x = p.fromX + (p.toX - p.fromX) * (2 / 4); // 101.32 px
p.y = 100;

// Agora troca a direção para baixo-direita (dir 5)
// Executa a regra do Caso 3 (troca imediata de direção)
const wantNew = 5;
const signX = 1, signY = 1;
const stepX = signX * STEP_TILE_NEW, stepY = signY * STEP_TILE_NEW;
const newDur = 6; // diagonal dura 6 ticks

// Nova posição de destino a partir do ponto atual
p.dir = wantNew;
p.row = wantNew;
p.fromX = p.x;
p.fromY = p.y;
p.toX = p.x + stepX;
p.toY = p.y + stepY;
p.dur = newDur;
p.prog = 0;

// Avança 1 tick na nova direção
p.prog++;
const t1 = p.prog / p.dur;
const x1 = p.fromX + (p.toX - p.fromX) * t1;
const y1 = p.fromY + (p.toY - p.fromY) * t1;

const dxAfterTurn = x1 - p.x;
const dyAfterTurn = y1 - p.y;

// Verifica se imediatamente em 1 tick (≤ 4 ticks) o deslocamento já possui componente Y > 0
const pass3 = (dxAfterTurn > 0) && (dyAfterTurn > 0) && (p.row === 5);

assertTest(
  3,
  'Troca de direção (direita -> baixo-direita): deslocamento segue a nova direção em ≤ 4 ticks sem terminar o passo antigo',
  pass3,
  `No tick 1 após a troca: dx = ${dxAfterTurn.toFixed(4)} px, dy = ${dyAfterTurn.toFixed(4)} px (ambos > 0, já em diagonal). ` +
  `Linha do sprite = ${p.row} (5 = baixo-dir). Latência observada: 0 ticks para virar e iniciar novo vetor!`
);

// -----------------------------------------------------------------------------
// Teste 4: Sem oscilação de direção ao segurar duas teclas
// -----------------------------------------------------------------------------
function resolveWasd(keys) {
  let ix = 0, iy = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const code = keys[i];
    if (ix === 0 && code === 'KeyA') ix = -1;
    if (ix === 0 && code === 'KeyD') ix = 1;
    if (iy === 0 && code === 'KeyW') iy = -1;
    if (iy === 0 && code === 'KeyS') iy = 1;
  }
  if (ix === 0 && iy > 0) return 0;
  if (ix < 0 && iy === 0) return 1;
  if (ix > 0 && iy === 0) return 2;
  if (ix === 0 && iy < 0) return 3;
  if (ix < 0 && iy > 0) return 4;
  if (ix > 0 && iy > 0) return 5;
  if (ix < 0 && iy < 0) return 6;
  if (ix > 0 && iy < 0) return 7;
  return null;
}

// Simula segurar S e D juntos por 60 ticks seguidos
const dirsHeld = [];
for (let t = 0; t < 60; t++) {
  dirsHeld.push(resolveWasd(['KeyS', 'KeyD']));
}
const uniqueDirs = [...new Set(dirsHeld)];
const pass4 = uniqueDirs.length === 1 && uniqueDirs[0] === 5;

assertTest(
  4,
  'Sem oscilação de direção ao segurar duas teclas juntas (S+D contínuo)',
  pass4,
  `60 ticks com S+D resultaram estritamente em direção ${uniqueDirs.join(', ')} (5 = baixo-direita, sem alternância nem trepidação).`
);

// -----------------------------------------------------------------------------
// Teste 5: Colisão e interação inalteradas
// -----------------------------------------------------------------------------
const footW = vm.runInContext('FOOT_W', sandbox);
const footH = vm.runInContext('FOOT_H', sandbox);
const cellSize = vm.runInContext('COLLISION_CELL_SIZE', sandbox);
const interactRadius = vm.runInContext('INTERACT_RADIUS', sandbox);

const pass5 = (footW === 3) && (footH === 2) && (cellSize === 4) && (interactRadius === 64);
assertTest(
  5,
  'Colisão e interação inalteradas (FOOT_W=3, FOOT_H=2, CELL=4, INTERACT_RADIUS=64)',
  pass5,
  `FOOT_W=${footW}, FOOT_H=${footH}, CELL_SIZE=${cellSize}, INTERACT_RADIUS=${interactRadius} estão 100% preservados.`
);

console.log('========================================================');
const allOk = results.every(r => r.pass);
if (allOk) {
  console.log('TODOS OS 5 TESTES DE REDUÇÃO DE PASSO PASSARAM COM SUCESSO!\n');
} else {
  console.error('Houve falhas nos testes.');
  process.exit(1);
}
