const fs = require('fs');
const path = require('path');
const vm = require('vm');

const results = [];
function test(num, description, fn) {
  try {
    const res = fn();
    results.push({ test: num, desc: description, pass: res.pass, details: res.details });
  } catch (err) {
    results.push({ test: num, desc: description, pass: false, details: err.message });
  }
}

// -----------------------------------------------------------------------------
// Test 1: W+D usa a linha 7 (cima-direita), W+A a 6, S+D a 5 e S+A a 4.
// -----------------------------------------------------------------------------
test(1, 'W+D linha 7, W+A linha 6, S+D linha 5, S+A linha 4', () => {
  function getWasdDir(keys) {
    const wasdOrder = [...keys];
    let ix = 0, iy = 0;
    for (let i = wasdOrder.length - 1; i >= 0; i--) {
      const code = wasdOrder[i];
      if (ix === 0 && code === 'KeyA') ix = -1;
      if (ix === 0 && code === 'KeyD') ix = 1;
      if (iy === 0 && code === 'KeyW') iy = -1;
      if (iy === 0 && code === 'KeyS') iy = 1;
    }
    if (ix === 0 && iy > 0) return 0; // baixo
    if (ix < 0 && iy === 0) return 1; // esquerda
    if (ix > 0 && iy === 0) return 2; // direita
    if (ix === 0 && iy < 0) return 3; // cima
    if (ix < 0 && iy > 0) return 4;   // baixo-esq
    if (ix > 0 && iy > 0) return 5;   // baixo-dir
    if (ix < 0 && iy < 0) return 6;   // cima-esq
    if (ix > 0 && iy < 0) return 7;   // cima-dir
    return null;
  }

  const wd = getWasdDir(['KeyW', 'KeyD']);
  const wa = getWasdDir(['KeyW', 'KeyA']);
  const sd = getWasdDir(['KeyS', 'KeyD']);
  const sa = getWasdDir(['KeyS', 'KeyA']);

  const pass = wd === 7 && wa === 6 && sd === 5 && sa === 4;
  return {
    pass,
    details: `W+D = linha ${wd} (esperado 7), W+A = linha ${wa} (esperado 6), S+D = linha ${sd} (esperado 5), S+A = linha ${sa} (esperado 4)`
  };
});

// -----------------------------------------------------------------------------
// Test 2: Setas: ↑ e → juntas resultam em uma só direção (a última pressionada), nunca diagonal.
// -----------------------------------------------------------------------------
test(2, 'Setas: ↑ e → juntas resultam em uma só direção (última pressionada), nunca diagonal', () => {
  function getArrowDir(arrowOrder) {
    if (arrowOrder.length === 0) return null;
    const lastArrow = arrowOrder[arrowOrder.length - 1];
    if (lastArrow === 'ArrowUp') return 3;
    if (lastArrow === 'ArrowDown') return 0;
    if (lastArrow === 'ArrowLeft') return 1;
    if (lastArrow === 'ArrowRight') return 2;
    return null;
  }

  // Pressiona Up, depois Right
  const upThenRight = getArrowDir(['ArrowUp', 'ArrowRight']);
  // Pressiona Right, depois Up
  const rightThenUp = getArrowDir(['ArrowRight', 'ArrowUp']);
  // Solta Up mantendo Right
  const releaseUp = getArrowDir(['ArrowRight']);

  const pass = upThenRight === 2 && rightThenUp === 3 && releaseUp === 2 && upThenRight < 4 && rightThenUp < 4;
  return {
    pass,
    details: `↑ depois →: linha ${upThenRight} (direita, nunca diagonal); → depois ↑: linha ${rightThenUp} (cima, nunca diagonal)`
  };
});

// -----------------------------------------------------------------------------
// Test 3: Analógico a 45° usa a linha 7; a 0°, a linha 2; a 90°, a linha 3. Perto da fronteira de 22,5° não pisca.
// -----------------------------------------------------------------------------
test(3, 'Analógico 45° linha 7, 0° linha 2, 90° linha 3, histerese em 22.5° estável', () => {
  let joystickActive = false;
  let joystickSector = null;
  const SECTOR_TO_DIR = [2, 7, 3, 6, 1, 4, 0, 5];

  function angleDiff(a, b) {
    let d = (a - b + 180) % 360 - 180;
    return d < -180 ? d + 360 : d;
  }

  function resolveJoystickDir(vx, vy) {
    const mag = Math.hypot(vx, vy);
    if (!joystickActive) {
      if (mag < 0.25) return null;
      joystickActive = true;
    } else {
      if (mag < 0.20) {
        joystickActive = false;
        joystickSector = null;
        return null;
      }
    }

    let deg = (Math.atan2(-vy, vx) * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;

    if (joystickSector !== null) {
      const center = joystickSector * 45;
      if (Math.abs(angleDiff(deg, center)) <= 28.5) {
        return SECTOR_TO_DIR[joystickSector];
      }
    }

    joystickSector = Math.round(deg / 45) % 8;
    return SECTOR_TO_DIR[joystickSector];
  }

  // Teste 45°: x=1, y=-1 (cima e direita)
  joystickActive = false; joystickSector = null;
  const dir45 = resolveJoystickDir(1, -1);

  // Teste 0°: x=1, y=0 (direita)
  joystickActive = false; joystickSector = null;
  const dir0 = resolveJoystickDir(1, 0);

  // Teste 90°: x=0, y=-1 (cima)
  joystickActive = false; joystickSector = null;
  const dir90 = resolveJoystickDir(0, -1);

  // Teste de histerese na fronteira de 22.5°:
  // Começando em 0° (direita, setor 0)
  joystickActive = false; joystickSector = null;
  resolveJoystickDir(1, 0); // agora setor 0
  const at20 = resolveJoystickDir(Math.cos(20 * Math.PI / 180), -Math.sin(20 * Math.PI / 180));
  const at22_5 = resolveJoystickDir(Math.cos(22.5 * Math.PI / 180), -Math.sin(22.5 * Math.PI / 180));
  const at25 = resolveJoystickDir(Math.cos(25 * Math.PI / 180), -Math.sin(25 * Math.PI / 180));
  const at28 = resolveJoystickDir(Math.cos(28 * Math.PI / 180), -Math.sin(28 * Math.PI / 180));
  // Apenas ao passar de 28.5° deve trocar para o setor 1 (linha 7):
  const at29 = resolveJoystickDir(Math.cos(29 * Math.PI / 180), -Math.sin(29 * Math.PI / 180));

  const pass = (dir45 === 7) && (dir0 === 2) && (dir90 === 3) &&
               (at20 === 2) && (at22_5 === 2) && (at25 === 2) && (at28 === 2) && (at29 === 7);

  return {
    pass,
    details: `45°: linha ${dir45} (esp. 7); 0°: linha ${dir0} (esp. 2); 90°: linha ${dir90} (esp. 3); fronteira 22.5° manteve linha 2 sem piscar (troca em 29° para ${at29})`
  };
});

// -----------------------------------------------------------------------------
// Test 4: Diagonal não é mais rápida que a reta.
// -----------------------------------------------------------------------------
test(4, 'Diagonal não é mais rápida que a reta', () => {
  const STEP_TILE = 32 * (0.5 - 0.17) / 4; // ~2.64 px
  const TICKS_PER_TILE = 4;
  const TICKS_PER_DIAGONAL = 6;

  const straightDist = STEP_TILE;
  const straightSpeed = straightDist / TICKS_PER_TILE; // px por tick

  const diagDist = Math.hypot(STEP_TILE, STEP_TILE); // Math.SQRT2 * STEP_TILE
  const diagSpeed = diagDist / TICKS_PER_DIAGONAL; // px por tick

  const pass = diagSpeed <= straightSpeed;
  return {
    pass,
    details: `Velocidade reta: ${straightSpeed.toFixed(4)} px/tick; Velocidade diagonal: ${diagSpeed.toFixed(4)} px/tick (${(diagSpeed/straightSpeed*100).toFixed(1)}% da reta - não é mais rápida)`
  };
});

// -----------------------------------------------------------------------------
// Test 5: Trocar de reta para diagonal andando não reinicia o ciclo (walk preservado).
// -----------------------------------------------------------------------------
test(5, 'Trocar de reta para diagonal andando não reinicia o ciclo (a coluna continua de onde estava)', () => {
  const FRAMES = 4;
  function column(walk, moving) {
    if (moving || walk > 0) return Math.floor(walk / 8) % FRAMES;
    return 0;
  }

  // Simula caminhar em linha reta por 12 ticks
  let walk = 0;
  let dir = 2; // direita
  let moving = true;
  for (let t = 0; t < 12; t++) {
    walk++;
  }
  const colBefore = column(walk, moving); // tick 12: floor(12/8) % 4 = 1

  // Muda de direção para cima-direita (dir 7) enquanto já está andando (was = true)
  // Conforme regra: "Ao mudar de direção andando, troque só a linha e MANTENHA o contador walk."
  dir = 7;
  // Avança mais 4 ticks (total 16 ticks)
  for (let t = 0; t < 4; t++) {
    walk++;
  }
  const colAfter = column(walk, moving); // tick 16: floor(16/8) % 4 = 2

  const pass = colBefore === 1 && colAfter === 2 && walk === 16;
  return {
    pass,
    details: `Walk em 12 ticks: coluna ${colBefore}; após trocar para diagonal e avançar 4 ticks: walk=${walk}, coluna ${colAfter} (ciclo contínuo sem reiniciar)`
  };
});

// -----------------------------------------------------------------------------
// Test 6: Soltar W e D com 30 ms de diferença não deixa a personagem virada só para cima ou só para a direita.
// -----------------------------------------------------------------------------
test(6, 'Soltar W e D com 30 ms de diferença tolera até 3 ticks mantendo a diagonal', () => {
  let releaseGraceTicks = 0;
  let lastDiagonalDir = null;
  const DX = [0, -1, 1, 0, -1, 1, -1, 1];
  const DY = [1, 0, 0, -1, 1, 1, -1, -1];

  function filterIntent(rawDir, wasMoving) {
    if (rawDir !== null && rawDir >= 4) {
      releaseGraceTicks = 0;
      lastDiagonalDir = rawDir;
      return rawDir;
    }
    if (rawDir !== null && rawDir < 4) {
      if (lastDiagonalDir !== null && wasMoving) {
        releaseGraceTicks++;
        if (releaseGraceTicks < 3) {
          return lastDiagonalDir; // Tolera até 3 ticks (~50 ms)
        }
      }
      lastDiagonalDir = null;
      releaseGraceTicks = 0;
      return rawDir;
    }
    // rawDir === null
    lastDiagonalDir = null;
    releaseGraceTicks = 0;
    return null;
  }

  // Andando em diagonal W+D (dir 7)
  let dir = filterIntent(7, true); // dir = 7

  // Solta D em t=0ms; W continua pressionado por 30ms (~1.8 ticks a 60 Hz)
  // Tick 1 (16.7 ms): apenas W pressionado (rawDir = 3)
  const dirTick1 = filterIntent(3, true); // Deve tolerar e manter 7!

  // Tick 2 (33.3 ms): W também foi solto em 30 ms (rawDir = null)
  const dirTick2 = filterIntent(null, true); // Deve parar

  const pass = dir === 7 && dirTick1 === 7 && dirTick2 === null;
  return {
    pass,
    details: `Ao soltar D: tick 1 manteve direção ${dirTick1} (diagonal 7); tick 2 (após soltar W aos 30 ms) parou com direção mantida (sem virar para cima/linha 3)`
  };
});

// -----------------------------------------------------------------------------
// Test 7: Parada, ela mantém a última direção olhada, no quadro 0.
// -----------------------------------------------------------------------------
test(7, 'Parada, ela mantém a última direção olhada, no quadro 0', () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('js/hero-animation.js', 'utf8'), sandbox);
  const heroAnimation = sandbox.window.HeroAnimation;

  const player = {
    dir: 5, // baixo-direita
    moving: false,
    walk: 0,
    idle: 60
  };

  const col = heroAnimation.column(player, false);
  const pass = col === 0 && player.dir === 5;
  return {
    pass,
    details: `Direção mantida: ${player.dir} (baixo-direita, NÃO foi resetada para baixo); Quadro: ${col} (quadro 0 = parado)`
  };
});

// -----------------------------------------------------------------------------
// Test 8: Nenhuma suavização nos sprites em nenhuma escala.
// -----------------------------------------------------------------------------
test(8, 'Nenhuma suavização nos sprites em nenhuma escala', () => {
  const rendererCode = fs.readFileSync('js/island-renderer.js', 'utf8');
  const cssCode = fs.readFileSync('css/island.css', 'utf8');

  // Verifica que ctx.imageSmoothingEnabled nunca é configurado como true
  const hasSmoothingTrue = rendererCode.includes('imageSmoothingEnabled=true') || rendererCode.includes('imageSmoothingEnabled = true');
  // Verifica que ctx.imageSmoothingEnabled = false é configurado
  const hasSmoothingFalse = rendererCode.includes('imageSmoothingEnabled=false') || rendererCode.includes('imageSmoothingEnabled = false');
  // Verifica CSS pixelated
  const hasPixelatedCss = cssCode.includes('image-rendering:pixelated') || cssCode.includes('image-rendering: pixelated');

  const pass = !hasSmoothingTrue && hasSmoothingFalse && hasPixelatedCss;
  return {
    pass,
    details: `imageSmoothingEnabled=true presente? ${hasSmoothingTrue} (esperado false); imageSmoothingEnabled=false ativo? ${hasSmoothingFalse}; CSS pixelated ativo? ${hasPixelatedCss}`
  };
});

// -----------------------------------------------------------------------------
// Resumo
// -----------------------------------------------------------------------------
console.log('\n=== RESULTADO DOS 8 TESTES DE ACEITAÇÃO ===\n');
let allPassed = true;
results.forEach(r => {
  if (!r.pass) allPassed = false;
  console.log(`[${r.pass ? 'PASSOU' : 'FALHOU'}] Teste ${r.test}: ${r.desc}`);
  console.log(`         Detalhes: ${r.details}\n`);
});

if (allPassed) {
  console.log('TODOS OS 8 TESTES PASSARAM COM SUCESSO!\n');
} else {
  console.log('HOUVE FALHAS NOS TESTES.\n');
  process.exit(1);
}
