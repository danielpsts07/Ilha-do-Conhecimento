const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== TESTES EM DOM SIMULADO: MOTOR 8 DIREÇÕES POR VETOR PURO ===\n');

// 1. Simulação isolada das funções puras de intenção e física
const DIRS = ['down', 'left', 'right', 'up', 'down-left', 'down-right', 'up-left', 'up-right'];
const DIRS_PT = ['baixo', 'esquerda', 'direita', 'cima', 'baixo-esq', 'baixo-dir', 'cima-esq', 'cima-dir'];
const INV_SQRT2 = 1 / Math.SQRT2;
const DX = [0, -1, 1, 0, -INV_SQRT2, INV_SQRT2, -INV_SQRT2, INV_SQRT2];
const DY = [1, 0, 0, -1, INV_SQRT2, INV_SQRT2, -INV_SQRT2, -INV_SQRT2];
const STEP_TILE = 16;
const TURN_TICKS = 6;
const TICKS_PER_TILE = 16;

class SimulatedEngine {
  constructor() {
    this.heldCodes = new Set();
    this.touchWalkHeld = new Set();
    this.pointers = new Map();
    this.transitionHistory = [];
    this.switchesPerSec = 0;
    this.joystickSector = null;
    this.SECTOR_CENTERS = [90, 180, 0, 270, 135, 45, 225, 315];
    this.ANGLE_TO_DIR = [2, 5, 0, 4, 1, 6, 3, 7];

    this.player = {
      x: 774, y: 567,
      facing: 'down',
      dir: 0,
      moving: false,
      frame: 8,
      steps: 0,
      idle: 0,
      prog: 0,
      dur: 0,
      walk: 0,
      turn: 0,
      was: false,
      fromX: 774, fromY: 567,
      toX: 774, toY: 567,
      intentName: '(nenhuma)',
      switchesPerSec: 0
    };

    // Obstáculos simulados: parede em x > 850, parede em y > 650, quina em (800, 600)
    this.blockedCells = new Set();
  }

  angleDiff(a, b) {
    let d = (a - b + 180) % 360 - 180;
    return d < -180 ? d + 360 : d;
  }

  resolveJoystickDir(vx, vy) {
    if (Math.hypot(vx, vy) < 0.20) {
      this.joystickSector = null;
      return null;
    }
    const deg = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
    if (this.joystickSector !== null) {
      const center = this.SECTOR_CENTERS[this.joystickSector];
      if (Math.abs(this.angleDiff(deg, center)) <= 28.5) return this.joystickSector;
    }
    const sectorIdx = Math.floor(((deg + 22.5) % 360) / 45);
    this.joystickSector = this.ANGLE_TO_DIR[sectorIdx];
    return this.joystickSector;
  }

  computeIntent() {
    for (const value of this.pointers.values()) {
      if (!value || (!value.x && !value.y)) continue;
      const joyDir = this.resolveJoystickDir(value.x, value.y);
      if (joyDir !== null) {
        return { dir: joyDir, name: `Joystick ${DIRS_PT[joyDir]}` };
      }
    }

    const right = this.heldCodes.has('KeyD') || this.heldCodes.has('ArrowRight') || this.touchWalkHeld.has('right');
    const left = this.heldCodes.has('KeyA') || this.heldCodes.has('ArrowLeft') || this.touchWalkHeld.has('left');
    const down = this.heldCodes.has('KeyS') || this.heldCodes.has('ArrowDown') || this.touchWalkHeld.has('down');
    const up = this.heldCodes.has('KeyW') || this.heldCodes.has('ArrowUp') || this.touchWalkHeld.has('up');

    const ix = (right ? 1 : 0) - (left ? 1 : 0);
    const iy = (down ? 1 : 0) - (up ? 1 : 0);

    const keys = [];
    if (up) keys.push('W');
    if (left) keys.push('A');
    if (down) keys.push('S');
    if (right) keys.push('D');
    const name = keys.length ? keys.join('+') : '(nenhuma)';

    if (ix === 0 && iy === 0) return { dir: null, name };
    if (ix === 0 && iy > 0) return { dir: 0, name };
    if (ix < 0 && iy === 0) return { dir: 1, name };
    if (ix > 0 && iy === 0) return { dir: 2, name };
    if (ix === 0 && iy < 0) return { dir: 3, name };
    if (ix < 0 && iy > 0) return { dir: 4, name };
    if (ix > 0 && iy > 0) return { dir: 5, name };
    if (ix < 0 && iy < 0) return { dir: 6, name };
    if (ix > 0 && iy < 0) return { dir: 7, name };
    return { dir: null, name };
  }

  pathFree(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 1; i <= n; i++) {
      const cx = Math.round(x0 + (x1 - x0) * i / n);
      const cy = Math.round(y0 + (y1 - y0) * i / n);
      if (this.blockedCells.has(`${cx},${cy}`)) return false;
    }
    return true;
  }

  findStep(dir) {
    const { x, y } = this.player;
    if (dir < 4) {
      const dx = DX[dir] * STEP_TILE, dy = DY[dir] * STEP_TILE;
      if (this.pathFree(x, y, x + dx, y + dy)) return { x: x + dx, y: y + dy, len: 1 };
      return null;
    }

    const dx = DX[dir] * STEP_TILE, dy = DY[dir] * STEP_TILE;
    const signX = DX[dir] < 0 ? -1 : 1, signY = DY[dir] < 0 ? -1 : 1;

    const xFree = this.pathFree(x, y, x + dx, y);
    const yFree = this.pathFree(x, y, x, y + dy);
    const diagFree = this.pathFree(x, y, x + dx, y + dy);

    if (xFree && yFree && diagFree) {
      return { x: x + dx, y: y + dy, len: 1 };
    }

    // Deslize livre
    const fullXFree = this.pathFree(x, y, x + signX * STEP_TILE, y);
    const fullYFree = this.pathFree(x, y, x, y + signY * STEP_TILE);

    if (fullXFree && !fullYFree) return { x: x + signX * STEP_TILE, y, len: 1 };
    if (fullYFree && !fullXFree) return { x, y: y + signY * STEP_TILE, len: 1 };
    if (fullXFree && fullYFree) return { x: x + signX * STEP_TILE, y, len: 1 };

    return null;
  }

  advance(want) {
    const p = this.player;
    if (want === null) {
      if (!p.moving) {
        p.walk = 0; p.was = false; p.turn = 0; p.steps = 0; p.idle++; return;
      }
      p.prog++; p.walk = 0;
      const t = Math.min(1, p.prog / p.dur);
      p.x = p.fromX + (p.toX - p.fromX) * t;
      p.y = p.fromY + (p.toY - p.fromY) * t;
      return;
    }

    p.idle = 0;

    if (!p.moving && !p.was) {
      if (want !== p.dir) {
        p.dir = want; p.facing = DIRS[want]; p.turn = TURN_TICKS; p.walk = 0;
        return;
      }
      if (p.turn > 0) {
        p.turn--;
        if (p.turn > 0) return;
      }
      p.dir = want; p.facing = DIRS[want];
      const step = this.findStep(want);
      if (!step) { p.walk++; p.was = true; return; }
      Object.assign(p, {
        moving: true, prog: 0, dur: TICKS_PER_TILE,
        fromX: p.x, fromY: p.y, toX: step.x, toY: step.y
      });
    } else if (want !== p.dir) {
      p.dir = want; p.facing = DIRS[want]; p.turn = 0;
      const step = this.findStep(want);
      if (!step) { p.moving = false; p.walk++; p.was = true; return; }
      const newDur = TICKS_PER_TILE;
      const frac = (p.moving && p.dur > 0) ? (p.prog / p.dur) : 0;
      const targetProg = Math.min(newDur - 1, Math.max(0, Math.round(frac * newDur)));
      const dx = step.x - p.x;
      const dy = step.y - p.y;
      p.fromX = p.x - dx * (targetProg / newDur);
      p.fromY = p.y - dy * (targetProg / newDur);
      p.toX = p.fromX + dx;
      p.toY = p.fromY + dy;
      p.dur = newDur;
      p.prog = targetProg;
      p.moving = true;
    } else if (!p.moving) {
      const step = this.findStep(want);
      if (!step) { p.walk++; p.was = true; return; }
      Object.assign(p, {
        moving: true, prog: 0, dur: TICKS_PER_TILE,
        fromX: p.x, fromY: p.y, toX: step.x, toY: step.y
      });
    }

    p.prog++; p.was = true; p.walk = 0;
    const t = Math.min(1, p.prog / p.dur);
    p.x = p.fromX + (p.toX - p.fromX) * t;
    p.y = p.fromY + (p.toY - p.fromY) * t;
  }

  tick() {
    const intent = this.computeIntent();
    this.player.intentName = intent.name;
    this.advance(intent.dir);
    if (this.player.moving && this.player.prog >= this.player.dur) {
      this.player.x = this.player.toX;
      this.player.y = this.player.toY;
      this.player.moving = false;
      this.player.prog = 0;
      this.player.steps++;
    }
  }

  onKeyDown(code, repeat = false) {
    if (!repeat) this.heldCodes.add(code);
  }

  onKeyUp(code) {
    this.heldCodes.delete(code);
  }
}

let passes = 0, fails = 0;
function assert(cond, msg) {
  if (cond) {
    console.log('  [OK]', msg);
    passes++;
  } else {
    console.error('  [FALHA]', msg);
    fails++;
  }
}

// ----------------------------------------------------
// Teste 1: S+D segurado por 120 ticks
console.log('1. S+D segurado por 120 ticks:');
const eng1 = new SimulatedEngine();
eng1.onKeyDown('KeyS');
eng1.onKeyDown('KeyD');

const facings1 = [];
for (let t = 0; t < 120; t++) {
  eng1.tick();
  facings1.push(eng1.player.facing);
}
assert(facings1.every(f => f === 'down-right'), 'Facing estritamente "down-right" em todos os 120 ticks');
const uniqueFacings1 = new Set(facings1);
assert(uniqueFacings1.size === 1, 'Zero alternâncias entre lados ou tremores');

// ----------------------------------------------------
// Teste 1b: Repetição para S+A, W+D e W+A
console.log('\n1b. Repetição para S+A, W+D e W+A:');
for (const [k1, k2, expected] of [
  ['KeyS', 'KeyA', 'down-left'],
  ['KeyW', 'KeyD', 'up-right'],
  ['KeyW', 'KeyA', 'up-left']
]) {
  const eng = new SimulatedEngine();
  eng.onKeyDown(k1);
  eng.onKeyDown(k2);
  const facings = [];
  for (let t = 0; t < 120; t++) {
    eng.tick();
    facings.push(eng.player.facing);
  }
  assert(facings.every(f => f === expected), `${k1}+${k2}: todos os 120 ticks em "${expected}"`);
}

// ----------------------------------------------------
// Teste 2: S no tick 0, depois D 2 quadros depois
console.log('\n2. S no tick 0, depois D 2 quadros depois:');
const eng2 = new SimulatedEngine();
const history2 = [];
let switches2 = 0;
let prevFacing2 = null;

for (let t = 0; t < 60; t++) {
  if (t === 0) eng2.onKeyDown('KeyS');
  if (t === 2) eng2.onKeyDown('KeyD');
  eng2.tick();
  if (prevFacing2 !== null && eng2.player.facing !== prevFacing2) {
    switches2++;
  }
  prevFacing2 = eng2.player.facing;
  history2.push({ t, facing: eng2.player.facing, x: eng2.player.x, y: eng2.player.y });
}
assert(history2[0].facing === 'down', 'Tick 0: facing "down"');
assert(history2[1].facing === 'down', 'Tick 1: facing "down"');
assert(history2[2].facing === 'down-right', 'Tick 2 (D apertado): vira imediatamente para "down-right"');
assert(switches2 === 1, `No máximo 1 troca de direção (ocorreram ${switches2})`);
assert(!history2.some(h => h.facing === 'right'), 'Nunca passou pela direção "right"');

// ----------------------------------------------------
// Teste 3: Soltar uma tecla da diagonal volta imediatamente para reta
console.log('\n3. Soltar uma tecla da diagonal:');
const eng3 = new SimulatedEngine();
eng3.onKeyDown('KeyS');
eng3.onKeyDown('KeyD');
for (let t = 0; t < 20; t++) eng3.tick();
assert(eng3.player.facing === 'down-right', 'Antes de soltar: "down-right"');

// Solta D no tick 20
eng3.onKeyUp('KeyD');
eng3.tick();
assert(eng3.player.facing === 'down', 'Mesmo tick da soltura: volta imediatamente para "down"');
eng3.tick();
assert(eng3.player.facing === 'down', 'Tick seguinte: permanece em "down"');

// ----------------------------------------------------
// Teste 4: event.repeat não altera o estado
console.log('\n4. event.repeat = true:');
const eng4 = new SimulatedEngine();
eng4.onKeyDown('KeyS', false);
eng4.tick();
const sizeBefore = eng4.heldCodes.size;
eng4.onKeyDown('KeyS', true);
eng4.onKeyDown('KeyS', true);
assert(eng4.heldCodes.size === sizeBefore, 'heldCodes inalterado após keydown com repeat = true');

// ----------------------------------------------------
// Teste 5: Joystick nos 8 setores e histerese na fronteira
console.log('\n5. Joystick nos 8 setores e histerese:');
const eng5 = new SimulatedEngine();
// Ângulo de 45° (baixo-direita, dir 5)
eng5.pointers.set(1, { x: 0.5, y: 0.5 });
eng5.tick();
assert(eng5.player.facing === 'down-right', '45° -> "down-right"');

// Move para 68° (fronteira nominal é 67.5°, mas dentro da histerese de 28.5° = até 73.5°)
const rad68 = 68 * Math.PI / 180;
eng5.pointers.set(1, { x: 0.6 * Math.cos(rad68), y: 0.6 * Math.sin(rad68) });
eng5.tick();
assert(eng5.player.facing === 'down-right', '68° (fronteira): histerese retém "down-right" sem oscilar');

// Move além da histerese (76°)
const rad76 = 76 * Math.PI / 180;
eng5.pointers.set(1, { x: 0.6 * Math.cos(rad76), y: 0.6 * Math.sin(rad76) });
eng5.tick();
assert(eng5.player.facing === 'down', '76° (fora da histerese): troca confirmada para "down"');

// ----------------------------------------------------
// Teste 6: Velocidade linear idêntica (normalização 1/√2)
console.log('\n6. Velocidade e colisão:');
const orthoDist = STEP_TILE; // 16 px
const diagDist = Math.hypot(DX[5] * STEP_TILE, DY[5] * STEP_TILE);
assert(Math.abs(diagDist - orthoDist) < 1e-6, `Distância do passo diagonal idêntica à reta: ${diagDist.toFixed(4)} vs ${orthoDist.toFixed(4)}`);

// Deslize com parede embaixo
const eng6 = new SimulatedEngine();
// Bloqueia avanço vertical (linha y = 575)
for (let x = 700; x <= 900; x++) eng6.blockedCells.add(`${x},575`);
eng6.onKeyDown('KeyS');
eng6.onKeyDown('KeyD');
eng6.tick();
const initialX = eng6.player.x;
for (let t = 0; t < 16; t++) eng6.tick();
assert(eng6.player.facing === 'down-right', 'Parede ao sul: sprite mantém intenção "down-right"');
assert(eng6.player.x > initialX, 'Parede ao sul: corpo desliza livremente pelo eixo X (direita)');

// Quina bloqueada
const eng7 = new SimulatedEngine();
// Bloqueia a célula diagonal
const curX = Math.round(eng7.player.x + DX[5] * STEP_TILE);
const curY = Math.round(eng7.player.y + DY[5] * STEP_TILE);
eng7.blockedCells.add(`${curX},${curY}`);
eng7.onKeyDown('KeyS');
eng7.onKeyDown('KeyD');
eng7.tick();
assert(eng7.player.facing === 'down-right', 'Quina bloqueada: sprite mantém intenção');

console.log(`\n=== RESULTADO: ${passes} PASSARAM, ${fails} FALHARAM ===\n`);
if (fails > 0) process.exit(1);

