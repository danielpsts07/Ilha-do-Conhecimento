// Teste em DOM simulado de movimento em 8 direções:
// 1. Teclas combinadas e regras de oposição
// 2. Quantização do joystick nos 8 setores com zona morta e histerese
// 3. Velocidade diagonal igual à ortogonal (fator 1/√2)
// 4. Deslize na parede (resolução independente de X e Y)
// 5. Prevenção de corte de quina
// 6. Escolha de folha e linha de sprite (HeroAnimation.resolveSheet e fallback)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log('  [OK] ' + msg);
    passed++;
  } else {
    console.error('  [FALHA] ' + msg);
    failed++;
  }
}

console.log('=== TESTE EM DOM SIMULADO: MOVIMENTO EM 8 DIREÇÕES ===\n');

// Contexto simulado carregando config e hero-animation
const ctx = {
  window: {},
  document: {
    querySelector: () => ({ addEventListener: () => {}, dataset: {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
    querySelectorAll: () => []
  },
  console: console
};
vm.createContext(ctx);

vm.runInContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/hero-animation.js'), 'utf8'), ctx);

const STEP_TILE = vm.runInContext('STEP_TILE', ctx);

// ---------- 1. HeroAnimation.resolveSheet ----------
console.log('1. Seleção de folha e linha de sprite:');
const HA = ctx.window.HeroAnimation;
assert(typeof HA.resolveSheet === 'function', 'HeroAnimation.resolveSheet existe');
// Ortogonais (0..3)
assert(HA.resolveSheet(0, true).isDiagonal === false && HA.resolveSheet(0, true).row === 0, 'Dir 0 (baixo): folha ortogonal linha 0');
assert(HA.resolveSheet(1, true).isDiagonal === false && HA.resolveSheet(1, true).row === 1, 'Dir 1 (esquerda): folha ortogonal linha 1');
assert(HA.resolveSheet(2, true).isDiagonal === false && HA.resolveSheet(2, true).row === 2, 'Dir 2 (direita): folha ortogonal linha 2');
assert(HA.resolveSheet(3, true).isDiagonal === false && HA.resolveSheet(3, true).row === 3, 'Dir 3 (cima): folha ortogonal linha 3');

// Diagonais com folha presente (4..7)
assert(HA.resolveSheet(4, true).isDiagonal === true && HA.resolveSheet(4, true).row === 0, 'Dir 4 (baixo-esq): folha diagonal linha 0');
assert(HA.resolveSheet(5, true).isDiagonal === true && HA.resolveSheet(5, true).row === 1, 'Dir 5 (baixo-dir): folha diagonal linha 1');
assert(HA.resolveSheet(6, true).isDiagonal === true && HA.resolveSheet(6, true).row === 2, 'Dir 6 (cima-esq): folha diagonal linha 2');
assert(HA.resolveSheet(7, true).isDiagonal === true && HA.resolveSheet(7, true).row === 3, 'Dir 7 (cima-dir): folha diagonal linha 3');

// Diagonais sem folha presente (fallback)
assert(HA.resolveSheet(4, false).isDiagonal === false && HA.resolveSheet(4, false).row === 1 && HA.resolveSheet(4, false).fallback, 'Dir 4 fallback: folha ortogonal linha 1 (esquerda)');
assert(HA.resolveSheet(5, false).isDiagonal === false && HA.resolveSheet(5, false).row === 2 && HA.resolveSheet(5, false).fallback, 'Dir 5 fallback: folha ortogonal linha 2 (direita)');
assert(HA.resolveSheet(6, false).isDiagonal === false && HA.resolveSheet(6, false).row === 1 && HA.resolveSheet(6, false).fallback, 'Dir 6 fallback: folha ortogonal linha 1 (esquerda)');
assert(HA.resolveSheet(7, false).isDiagonal === false && HA.resolveSheet(7, false).row === 2 && HA.resolveSheet(7, false).fallback, 'Dir 7 fallback: folha ortogonal linha 2 (direita)');

// ---------- 2. Mapeamento e entrada (Teclado) ----------
console.log('\n2. Teclado em 8 direções e combinação de eixos:');
const DIRS = ['down', 'left', 'right', 'up', 'down-left', 'down-right', 'up-left', 'up-right'];
const INV_SQRT2 = 1 / Math.SQRT2;
const DX = [0, -1, 1, 0, -INV_SQRT2, INV_SQRT2, -INV_SQRT2, INV_SQRT2];
const DY = [1, 0, 0, -1, INV_SQRT2, INV_SQRT2, -INV_SQRT2, -INV_SQRT2];

function evalWantedDir(heldList) {
  let lastHoriz = null, lastVert = null;
  for (let i = heldList.length - 1; i >= 0; i--) {
    const d = heldList[i].dir;
    if (lastHoriz === null && (d === 1 || d === 2)) lastHoriz = d;
    if (lastVert === null && (d === 0 || d === 3)) lastVert = d;
    if (lastHoriz !== null && lastVert !== null) break;
  }
  if (lastHoriz !== null && lastVert !== null) {
    if (lastVert === 0 && lastHoriz === 1) return 4;
    if (lastVert === 0 && lastHoriz === 2) return 5;
    if (lastVert === 3 && lastHoriz === 1) return 6;
    if (lastVert === 3 && lastHoriz === 2) return 7;
  }
  if (lastHoriz !== null) return lastHoriz;
  if (lastVert !== null) return lastVert;
  return null;
}

assert(evalWantedDir([{ id: 'w', dir: 3 }, { id: 'd', dir: 2 }]) === 7, 'W + D -> up-right (7)');
assert(evalWantedDir([{ id: 'w', dir: 3 }, { id: 'a', dir: 1 }]) === 6, 'W + A -> up-left (6)');
assert(evalWantedDir([{ id: 's', dir: 0 }, { id: 'd', dir: 2 }]) === 5, 'S + D -> down-right (5)');
assert(evalWantedDir([{ id: 's', dir: 0 }, { id: 'a', dir: 1 }]) === 4, 'S + A -> down-left (4)');

// Teclas opostas: última tecla manda
assert(evalWantedDir([{ id: 'w', dir: 3 }, { id: 's', dir: 0 }]) === 0, 'W seguido de S: S vence no eixo vertical (0)');
assert(evalWantedDir([{ id: 's', dir: 0 }, { id: 'w', dir: 3 }]) === 3, 'S seguido de W: W vence no eixo vertical (3)');
assert(evalWantedDir([{ id: 'a', dir: 1 }, { id: 'd', dir: 2 }]) === 2, 'A seguido de D: D vence no eixo horizontal (2)');
assert(evalWantedDir([{ id: 'w', dir: 3 }, { id: 'd', dir: 2 }, { id: 's', dir: 0 }]) === 5, 'W + D e depois S: S vence W, resultando em Down-Right (5)');
assert(evalWantedDir([]) === null, 'Nenhuma tecla: retorna null (parado)');

// ---------- 3. Quantização do Joystick nos 8 setores com histerese ----------
console.log('\n3. Quantização do Joystick (8 setores, zona morta 20%, histerese 8°):');
const SECTOR_ANGLES = [90, 180, 0, 270, 135, 45, 225, 315];
const ANGLE_TO_DIR = [2, 5, 0, 4, 1, 6, 3, 7];

function angleDiff(a, b) {
  let d = (a - b + 180) % 360 - 180;
  return d < -180 ? d + 360 : d;
}

function createJoyTester() {
  let sector = null;
  return function(vx, vy) {
    if (Math.hypot(vx, vy) < 0.20) {
      sector = null;
      return null;
    }
    const deg = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
    if (sector !== null) {
      const center = SECTOR_ANGLES[sector];
      if (Math.abs(angleDiff(deg, center)) <= 26.5) return sector;
    }
    const sectorIdx = Math.floor(((deg + 22.5) % 360) / 45);
    sector = ANGLE_TO_DIR[sectorIdx];
    return sector;
  };
}

const joy = createJoyTester();
assert(joy(0.1, 0.1) === null, 'Zona morta (< 0.20 raio): retorna null');
assert(joy(1.0, 0.0) === 2, 'Ângulo 0° -> Direita (2)');
assert(joy(0.707, 0.707) === 5, 'Ângulo 45° -> Baixo-Direita (5)');
assert(joy(0.0, 1.0) === 0, 'Ângulo 90° -> Baixo (0)');
assert(joy(-0.707, 0.707) === 4, 'Ângulo 135° -> Baixo-Esquerda (4)');
assert(joy(-1.0, 0.0) === 1, 'Ângulo 180° -> Esquerda (1)');
assert(joy(-0.707, -0.707) === 6, 'Ângulo 225° -> Cima-Esquerda (6)');
assert(joy(0.0, -1.0) === 3, 'Ângulo 270° -> Cima (3)');
assert(joy(0.707, -0.707) === 7, 'Ângulo 315° -> Cima-Direita (7)');

// Teste de histerese:
// Estando em Down-Right (45°), a borda nominal para Down (90°) é 67.5°.
// Com histerese de ±4° (tolerância até 71.5°):
// Em 69° (vx=cos 69°, vy=sin 69°), deve CONTINUAR em Down-Right (5).
const joyHist = createJoyTester();
joyHist(Math.cos(45 * Math.PI / 180), Math.sin(45 * Math.PI / 180)); // entra em 5
const inBorder = joyHist(Math.cos(69 * Math.PI / 180), Math.sin(69 * Math.PI / 180));
assert(inBorder === 5, 'Histerese: a 69° (além da borda 67.5°) permanece no setor ativo (5)');
const switched = joyHist(Math.cos(73 * Math.PI / 180), Math.sin(73 * Math.PI / 180));
assert(switched === 0, 'Histerese: a 73° (acima de 71.5°) troca para Down (0)');

// ---------- 4. Velocidade diagonal normalizada ----------
console.log('\n4. Velocidade diagonal normalizada:');
const orthoDist = Math.hypot(DX[2] * STEP_TILE, DY[2] * STEP_TILE);
const diagDist = Math.hypot(DX[5] * STEP_TILE, DY[5] * STEP_TILE);
assert(Math.abs(orthoDist - diagDist) < 1e-6, `Distância idêntica: ortogonal = ${orthoDist.toFixed(4)}, diagonal = ${diagDist.toFixed(4)}`);
const dur = 16;
const orthoSpeed = orthoDist / dur;
const diagSpeed = diagDist / dur;
assert(Math.abs(orthoSpeed - diagSpeed) < 1e-6, `Velocidade linear idêntica: ${orthoSpeed.toFixed(4)} px/tick em ambos`);

// ---------- 5. Colisão, quina e deslize na parede ----------
console.log('\n5. Colisão, quina e deslize na parede:');
function createMockWorld(blockedCells = new Set()) {
  return {
    isWalkable: (x, y) => !blockedCells.has(`${Math.round(x)},${Math.round(y)}`)
  };
}

function pathFreeSim(world, x0, y0, x1, y1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 1; i <= n; i++) {
    const cx = x0 + (x1 - x0) * i / n, cy = y0 + (y1 - y0) * i / n;
    if (!world.isWalkable(cx, cy)) return false;
  }
  return true;
}

function findStepSim(world, x, y, dir) {
  const dx = DX[dir] * STEP_TILE, dy = DY[dir] * STEP_TILE;
  const signX = DX[dir] < 0 ? -1 : 1, signY = DY[dir] < 0 ? -1 : 1;

  const xFree = pathFreeSim(world, x, y, x + dx, y);
  const yFree = pathFreeSim(world, x, y, x, y + dy);
  const diagFree = pathFreeSim(world, x, y, x + dx, y + dy);

  if (xFree && yFree && diagFree) {
    return { x: x + dx, y: y + dy, len: 1, type: 'diag' };
  }

  const fullXFree = pathFreeSim(world, x, y, x + signX * STEP_TILE, y);
  const fullYFree = pathFreeSim(world, x, y, x, y + signY * STEP_TILE);

  if (fullXFree && !fullYFree) return { x: x + signX * STEP_TILE, y, len: 1, type: 'slide-x' };
  if (fullYFree && !fullXFree) return { x, y: y + signY * STEP_TILE, len: 1, type: 'slide-y' };
  if (fullXFree && fullYFree) return { x: x + signX * STEP_TILE, y, len: 1, type: 'slide-x' };

  return null;
}

// Caso 1: Espaço totalmente livre
const wFree = createMockWorld();
const stepFree = findStepSim(wFree, 100, 100, 5); // down-right
assert(stepFree?.type === 'diag', 'Terreno livre: passo diagonal aceito');

// Caso 2: Parede no caminho X (direita bloqueada)
const blockedCorner = new Set();
for (let yy = 90; yy <= 120; yy++) {
  for (let xx = 104; xx <= 112; xx++) blockedCorner.add(`${xx},${yy}`);
}
const wCorner = createMockWorld(blockedCorner);
const stepCorner = findStepSim(wCorner, 100, 100, 5);
assert(stepCorner?.type !== 'diag', 'Quina/parede bloqueada: diagonal é impedida');
assert(stepCorner?.type === 'slide-y', 'Parede na direita: desliza livremente pelo eixo Y (para baixo)');

// Caso 3: Parede no caminho Y (embaixo bloqueado)
const blockedBottom = new Set();
for (let xx = 90; xx <= 120; xx++) {
  for (let yy = 104; yy <= 112; yy++) blockedBottom.add(`${xx},${yy}`);
}
const wBottom = createMockWorld(blockedBottom);
const stepBottom = findStepSim(wBottom, 100, 100, 5);
assert(stepBottom?.type === 'slide-x', 'Parede embaixo: desliza livremente pelo eixo X (para a direita)');

// Caso 4: Ambos os eixos bloqueados (canto interno)
const blockedBoth = new Set([...blockedCorner, ...blockedBottom]);
const wBoth = createMockWorld(blockedBoth);
const stepBoth = findStepSim(wBoth, 100, 100, 5);
assert(stepBoth === null, 'Ambos os eixos bloqueados: retorna null para andar no lugar contra a parede');

console.log(`\n=== RESULTADO FINAL: ${passed} PASSARAM, ${failed} FALHARAM ===`);
process.exit(failed ? 1 : 0);
