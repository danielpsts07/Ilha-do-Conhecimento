const fs = require('fs');
let code = fs.readFileSync('js/island-game.js', 'utf8');

// 1. joystick pointermove: zona morta de 20%
code = code.replace(/Math\.hypot\(vx, vy\) < \.18/, 'Math.hypot(vx, vy) < 0.20');

// 2. Localiza o bloco de clearInput até updateCamera
const startMarker = 'function clearInput()';
const endMarker = 'function updateCamera';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  throw new Error('Marcadores não encontrados');
}

const targetBlock = code.substring(startIdx, endIdx);

const newBlock = `let joystickSector = null;
  const SECTOR_ANGLES = [90, 180, 0, 270, 135, 45, 225, 315]; // dir index -> deg
  const ANGLE_TO_DIR = [2, 5, 0, 4, 1, 6, 3, 7];

  function angleDiff(a, b) {
    let d = (a - b + 180) % 360 - 180;
    return d < -180 ? d + 360 : d;
  }

  function resolveJoystickDir(vx, vy) {
    if (Math.hypot(vx, vy) < 0.20) {
      joystickSector = null;
      return null;
    }
    const deg = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
    // Histerese de ~8° (±4° além da margem nominal de 22,5° = 26,5°)
    if (joystickSector !== null) {
      const center = SECTOR_ANGLES[joystickSector];
      if (Math.abs(angleDiff(deg, center)) <= 26.5) return joystickSector;
    }
    const sectorIdx = Math.floor(((deg + 22.5) % 360) / 45);
    joystickSector = ANGLE_TO_DIR[sectorIdx];
    return joystickSector;
  }

  function clearInput() {
    joystickSector = null;
    held.length = 0; pointers.clear(); resetJoystick();
    // Para no ponto atual do passo: o mapa não é uma grade fixa, então não há salto.
    Object.assign(player, { moving: false, prog: 0, walk: 0, turn: 0, was: false, steps: 0, idle: 0, frame: HeroAnimation.IDLE });
  }
  function press(id, dir) { release(id); held.push({ id, dir }); }
  function release(id) { const i = held.findIndex(entry => entry.id === id); if (i > -1) held.splice(i, 1); }
  function wantedDir() {
    // Joystick analógico em 8 setores com zona morta de 20% e histerese de 8°
    for (const value of pointers.values()) {
      if (!value || (!value.x && !value.y)) continue;
      const joyDir = resolveJoystickDir(value.x, value.y);
      if (joyDir !== null) return joyDir;
    }

    if (!held.length) return null;

    // Teclado e toque: última tecla manda só entre teclas opostas; eixos ortogonais combinam em diagonal.
    let lastHoriz = null, lastVert = null;
    for (let i = held.length - 1; i >= 0; i--) {
      const d = held[i].dir;
      if (lastHoriz === null && (d === 1 || d === 2)) lastHoriz = d;
      if (lastVert === null && (d === 0 || d === 3)) lastVert = d;
      if (lastHoriz !== null && lastVert !== null) break;
    }

    if (lastHoriz !== null && lastVert !== null) {
      if (lastVert === 0 && lastHoriz === 1) return 4; // down-left
      if (lastVert === 0 && lastHoriz === 2) return 5; // down-right
      if (lastVert === 3 && lastHoriz === 1) return 6; // up-left
      if (lastVert === 3 && lastHoriz === 2) return 7; // up-right
    }
    if (lastHoriz !== null) return lastHoriz;
    if (lastVert !== null) return lastVert;
    return null;
  }
  // Procura o passo: inteiro se livre; senão contorna cantos de lado; senão anda até a parede.
  function pathFree(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 1; i <= n; i++) if (!IslandWorld.isWalkable(world, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
    return true;
  }
  function findStep(dir) {
    const { x, y } = player;
    if (dir < 4) {
      const dx = DX[dir], dy = DY[dir], px = -dy, py = dx;
      if (pathFree(x, y, x + dx * STEP_TILE, y + dy * STEP_TILE)) return { x: x + dx * STEP_TILE, y: y + dy * STEP_TILE, len: 1 };
      for (let o = 2; o <= STEP_TILE / 2; o += 2) for (const s of [1, -1]) {
        const lx = x + px * o * s, ly = y + py * o * s;
        if (pathFree(x, y, lx, ly) && pathFree(lx, ly, lx + dx * STEP_TILE, ly + dy * STEP_TILE)) return { x: lx + dx * STEP_TILE, y: ly + dy * STEP_TILE, len: 1 };
      }
      let free = 0; while (free < STEP_TILE && IslandWorld.isWalkable(world, x + dx * (free + 1), y + dy * (free + 1))) free++;
      return free >= 4 ? { x: x + dx * free, y: y + dy * free, len: free / STEP_TILE } : null;
    }

    // Movimento em diagonal (fator 1/√2 por eixo para velocidade idêntica à ortogonal)
    const dx = DX[dir] * STEP_TILE, dy = DY[dir] * STEP_TILE;
    const signX = DX[dir] < 0 ? -1 : 1, signY = DY[dir] < 0 ? -1 : 1;

    // Prevenção de corte de quina: as duas células vizinhas e o ponto final precisam estar livres
    const xFree = pathFree(x, y, x + dx, y);
    const yFree = pathFree(x, y, x, y + dy);
    const diagFree = pathFree(x, y, x + dx, y + dy);

    if (xFree && yFree && diagFree) {
      return { x: x + dx, y: y + dy, len: 1 };
    }

    // Diagonal bloqueada: deslize pelo eixo livre (resolvendo X e Y separadamente)
    const fullXFree = pathFree(x, y, x + signX * STEP_TILE, y);
    const fullYFree = pathFree(x, y, x, y + signY * STEP_TILE);

    if (fullXFree && !fullYFree) {
      return { x: x + signX * STEP_TILE, y, len: 1 };
    }
    if (fullYFree && !fullXFree) {
      return { x, y: y + signY * STEP_TILE, len: 1 };
    }
    if (fullXFree && fullYFree) {
      return { x: x + signX * STEP_TILE, y, len: 1 };
    }

    // Passo parcial em caso de colisão próxima
    let freeX = 0;
    while (freeX < STEP_TILE && IslandWorld.isWalkable(world, x + signX * (freeX + 1), y)) freeX++;
    if (freeX >= 4) return { x: x + signX * freeX, y, len: freeX / STEP_TILE };

    let freeY = 0;
    while (freeY < STEP_TILE && IslandWorld.isWalkable(world, x, y + signY * (freeY + 1))) freeY++;
    if (freeY >= 4) return { x, y: y + signY * freeY, len: freeY / STEP_TILE };

    return null;
  }
  // Um tick de 1/60 s, seguindo o teste de caminhada: virar parado e passo de 16 ticks.
  function advance(want) {
    const p = player;
    if (!p.moving) {
      if (want === null) { p.walk = 0; p.was = false; p.turn = 0; p.steps = 0; p.idle++; return; }
      p.idle = 0;
      if (want !== p.dir && !p.was) { p.dir = want; p.facing = DIRS[want]; p.turn = TURN_TICKS; p.walk = 0; return; }
      if (p.turn > 0) { p.turn--; if (p.turn > 0) return; }
      p.dir = want; p.facing = DIRS[want];
      const step = findStep(want);
      if (!step) { p.walk++; p.was = true; return; } // bate na parede e anda no lugar
      Object.assign(p, { moving: true, prog: 0, dur: Math.max(1, Math.round(ticksPerTile() * step.len)), fromX: p.x, fromY: p.y, toX: step.x, toY: step.y });
    }
    p.prog++; p.was = true; p.walk = 0;
    const t = Math.min(1, p.prog / p.dur);
    p.x = p.fromX + (p.toX - p.fromX) * t; p.y = p.fromY + (p.toY - p.fromY) * t;
  }
  function tick() {
    if (world.spawnPending) { Object.assign(player, world.spawn); world.spawnPending = false; }
    const p = player; advance(wantedDir());
    // O quadro sai antes de fechar o passo, para o último quadro do passo também aparecer.
    p.frame = HeroAnimation.column(p,calmMotion());
    if (p.moving && p.prog >= p.dur) { p.x = p.toX; p.y = p.toY; p.moving = false; p.prog = 0; p.steps++; }
  }
  function resetJoystick() { joystickSector = null; const stick = $('#joystick-stick'), joystick = $('#island-joystick'); if (stick) stick.style.transform = 'translate(-50%,-50%)'; if (joystick) joystick.classList.remove('is-active'); }
  `;

code = code.replace(targetBlock, newBlock);
fs.writeFileSync('js/island-game.js', code);
console.log('js/island-game.js atualizado com sucesso!');
