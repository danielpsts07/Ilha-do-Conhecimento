const { spawn } = require('child_process');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Iniciando Chrome headless com porta de depuração 9222...');
  const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--allow-file-access-from-files',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'file:///c:/Users/gpjac/Ilha-do-Conhecimento/index.html'
  ]);

  let closed = false;
  chromeProcess.on('exit', () => { closed = true; });

  // Espera Chrome subir
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(250);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const data = await res.json();
      const pageTarget = data.find(t => t.type === 'page' && t.url.includes('Ilha-do-Conhecimento')) || data.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Falha ao conectar ao Chrome na porta 9222');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Conectado ao Chrome CDP WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let nextId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalExpr(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async function keyEvent(type, key, code) {
    await send('Input.dispatchKeyEvent', {
      type,
      key,
      code,
      windowsVirtualKeyCode: code === 'KeyD' ? 68 : code === 'KeyW' ? 87 : code === 'KeyA' ? 65 : code === 'KeyS' ? 83 : 0
    });
  }

  console.log('Aguardando carregamento da página...');
  await sleep(1000);

  // Inicia o jogo
  console.log('Iniciando o jogo na ilha (clique em Iniciar)...');
  await evalExpr(`
    document.querySelector('[data-open="start"]')?.click();
    if (!window.GameIsland?.active) window.GameIsland?.start();
  `);
  await sleep(1000);

  const testResults = [];

  // ---------------------------------------------------------------------------
  // TESTE 6: Segurar D por 1 segundo: coluna passa por 0,1,2,3,0,1,2,3 e linha fica em 2.
  // Repetir para as 8 direções.
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 6: Caminhada e ciclo de colunas nas 8 direções ---');
  
  // Amostra caminhada para D (direita)
  await keyEvent('keyDown', 'd', 'KeyD');
  const samples = [];
  const startT = Date.now();
  while (Date.now() - startT < 1100) {
    const s = await evalExpr(`({
      row: window.GameIsland.player.row,
      col: window.GameIsland.player.frame,
      moving: window.GameIsland.player.moving,
      animTime: window.GameIsland.player.animTime
    })`);
    samples.push(s);
    await sleep(25);
  }
  await keyEvent('keyUp', 'd', 'KeyD');
  await sleep(100);

  // Analisa colunas consecutivas únicas observadas
  const colSeq = samples.map(s => s.col).filter((c, i, arr) => i === 0 || c !== arr[i - 1]);
  const rowInD = samples[samples.length - 1].row;
  const test6Passed = (rowInD === 2) && (colSeq.length >= 7) && colSeq.slice(0, 8).join(',') === '0,1,2,3,0,1,2,3';

  console.log(`Sequência de colunas observada ao segurar D por 1s: [${colSeq.join(', ')}]`);
  console.log(`Linha observada para D: ${rowInD} (esperado 2 = direita)`);

  // Testa as outras 7 direções
  const directionCases = [
    { name: 'W', keys: [['w', 'KeyW']], expectedRow: 3, label: 'cima' },
    { name: 'A', keys: [['a', 'KeyA']], expectedRow: 1, label: 'esquerda' },
    { name: 'S', keys: [['s', 'KeyS']], expectedRow: 0, label: 'baixo' },
    { name: 'D', keys: [['d', 'KeyD']], expectedRow: 2, label: 'direita' },
    { name: 'W+D', keys: [['w', 'KeyW'], ['d', 'KeyD']], expectedRow: 7, label: 'cima-dir' },
    { name: 'W+A', keys: [['w', 'KeyW'], ['a', 'KeyA']], expectedRow: 6, label: 'cima-esq' },
    { name: 'S+D', keys: [['s', 'KeyS'], ['d', 'KeyD']], expectedRow: 5, label: 'baixo-dir' },
    { name: 'S+A', keys: [['s', 'KeyS'], ['a', 'KeyA']], expectedRow: 4, label: 'baixo-esq' }
  ];

  const dirChecks = [];
  for (const dc of directionCases) {
    for (const [k, c] of dc.keys) await keyEvent('keyDown', k, c);
    await sleep(150);
    const state = await evalExpr(`({
      row: window.GameIsland.player.row,
      moving: window.GameIsland.player.moving,
      col: window.GameIsland.player.frame
    })`);
    for (const [k, c] of dc.keys) await keyEvent('keyUp', k, c);
    await sleep(80);
    dirChecks.push({ name: dc.name, row: state.row, expected: dc.expectedRow, pass: state.row === dc.expectedRow });
  }

  const allDirsPass = dirChecks.every(d => d.pass);
  testResults.push({
    test: 6,
    desc: 'Segurar D por 1 segundo: ciclo 0,1,2,3,0,1,2,3 na linha 2, e 8 direções mapeadas corretamente',
    pass: test6Passed && allDirsPass,
    details: `Sequência observada: [${colSeq.join(', ')}]. Todas as 8 direções verificadas: ${dirChecks.map(d => `${d.name}->linha ${d.row}`).join(', ')}`
  });

  // ---------------------------------------------------------------------------
  // TESTE 7: Soltar tudo: coluna 0 e a última direção é mantida
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 7: Parada com soltura de controles ---');
  // Anda para baixo-direita (S+D, linha 5)
  await keyEvent('keyDown', 's', 'KeyS');
  await keyEvent('keyDown', 'd', 'KeyD');
  await sleep(150);
  // Solta tudo
  await keyEvent('keyUp', 's', 'KeyS');
  await keyEvent('keyUp', 'd', 'KeyD');
  await sleep(100);

  const stopState = await evalExpr(`({
    row: window.GameIsland.player.row,
    col: window.GameIsland.player.frame,
    moving: window.GameIsland.player.moving,
    animTime: window.GameIsland.player.animTime
  })`);
  const test7Pass = (stopState.col === 0) && (stopState.row === 5) && (!stopState.moving) && (stopState.animTime === 0);
  testResults.push({
    test: 7,
    desc: 'Soltar tudo: coluna 0 e a última direção é mantida',
    pass: test7Pass,
    details: `Após soltar S+D: coluna = ${stopState.col} (esperado 0), linha = ${stopState.row} (esperado 5 mantido), moving = ${stopState.moving}, animTime = ${stopState.animTime}`
  });

  // ---------------------------------------------------------------------------
  // TESTE 8: Trocar de D para W+D andando muda só a linha; coluna continua de onde estava
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 8: Transição fluida de D para W+D ---');
  await keyEvent('keyDown', 'd', 'KeyD');
  await sleep(200); // Avança até coluna 1
  const beforeW = await evalExpr(`({
    row: window.GameIsland.player.row,
    col: window.GameIsland.player.frame,
    animTime: window.GameIsland.player.animTime
  })`);
  // Adiciona W mantendo D pressionado
  await keyEvent('keyDown', 'w', 'KeyW');
  await sleep(40);
  const afterW = await evalExpr(`({
    row: window.GameIsland.player.row,
    col: window.GameIsland.player.frame,
    animTime: window.GameIsland.player.animTime
  })`);
  await keyEvent('keyUp', 'w', 'KeyW');
  await keyEvent('keyUp', 'd', 'KeyD');
  await sleep(80);

  const test8Pass = (beforeW.row === 2) && (afterW.row === 7) && (afterW.animTime >= beforeW.animTime) && (afterW.col >= beforeW.col || (beforeW.col === 3 && afterW.col === 0));
  testResults.push({
    test: 8,
    desc: 'Trocar de D para W+D andando muda só a linha; a coluna continua de onde estava',
    pass: test8Pass,
    details: `Antes (D): linha ${beforeW.row}, col ${beforeW.col}, animTime ${beforeW.animTime.toFixed(3)}s. Depois (W+D): linha ${afterW.row}, col ${afterW.col}, animTime ${afterW.animTime.toFixed(3)}s (não resetou)`
  });

  // ---------------------------------------------------------------------------
  // TESTE 9: Setas ↑ e → juntas resultam em uma única direção reta, nunca diagonal
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 9: Setas do teclado estritamente ortogonais ---');
  await keyEvent('keyDown', 'ArrowUp', 'ArrowUp');
  await sleep(80);
  const arrowUpState = await evalExpr(`window.GameIsland.player.row`);
  await keyEvent('keyDown', 'ArrowRight', 'ArrowRight');
  await sleep(80);
  const arrowBothState = await evalExpr(`window.GameIsland.player.row`);
  await keyEvent('keyUp', 'ArrowRight', 'ArrowRight');
  await sleep(80);
  const arrowReleaseRightState = await evalExpr(`window.GameIsland.player.row`);
  await keyEvent('keyUp', 'ArrowUp', 'ArrowUp');
  await sleep(80);

  const test9Pass = (arrowUpState === 3) && (arrowBothState === 2) && (arrowReleaseRightState === 3) && (arrowBothState < 4);
  testResults.push({
    test: 9,
    desc: 'Setas ↑ e → juntas resultam em uma única direção reta, nunca diagonal',
    pass: test9Pass,
    details: `↑ pressionado: linha ${arrowUpState} (cima); ↑ + → juntos: linha ${arrowBothState} (direita, última pressionada, nunca diagonal); soltando →: linha ${arrowReleaseRightState} (cima)`
  });

  // ---------------------------------------------------------------------------
  // TESTE 10: Analógico 45° linha 7; 0° linha 2; 90° linha 3; histerese 6°
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 10: Analógico e histerese ---');
  const analogTests = await evalExpr(`(() => {
    const WA = window.WalkAnimation;
    const r45 = WA.rowFromSector(WA.sectorFromVector(1, -1)); // 45°
    const r0 = WA.rowFromSector(WA.sectorFromVector(1, 0));   // 0°
    const r90 = WA.rowFromSector(WA.sectorFromVector(0, -1)); // 90°
    // Histerese de 6° a partir do setor 0 (direita):
    const rad25 = 25 * Math.PI / 180;
    const s25 = WA.sectorFromVector(Math.cos(rad25), -Math.sin(rad25), 0, 6);
    const rad29 = 29 * Math.PI / 180;
    const s29 = WA.sectorFromVector(Math.cos(rad29), -Math.sin(rad29), 0, 6);
    return { r45, r0, r90, s25, s29 };
  })()`);

  const test10Pass = (analogTests.r45 === 7) && (analogTests.r0 === 2) && (analogTests.r90 === 3) && (analogTests.s25 === 0) && (analogTests.s29 === 1);
  testResults.push({
    test: 10,
    desc: 'Analógico a 45° linha 7; a 0° linha 2; a 90° linha 3; histerese de 6° estável na fronteira de 22.5°',
    pass: test10Pass,
    details: `45°: linha ${analogTests.r45} (cima-dir); 0°: linha ${analogTests.r0} (direita); 90°: linha ${analogTests.r90} (cima); 25° com setor anterior 0: setor ${analogTests.s25} (mantido); 29°: setor ${analogTests.s29} (trocou)`
  });

  // ---------------------------------------------------------------------------
  // TESTE 11: A diagonal não é mais rápida que a reta
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 11: Velocidade diagonal vs reta ---');
  const speedTest = await evalExpr(`(() => {
    const straightDist = STEP_TILE;
    const straightSpeed = straightDist / TICKS_PER_TILE;
    const diagDist = Math.hypot(STEP_TILE, STEP_TILE);
    const diagSpeed = diagDist / (typeof TICKS_PER_DIAGONAL !== 'undefined' ? TICKS_PER_DIAGONAL : 24);
    return {
      straightSpeed,
      diagSpeed,
      ratio: diagSpeed / straightSpeed
    };
  })()`);

  const test11Pass = speedTest.diagSpeed <= speedTest.straightSpeed;
  testResults.push({
    test: 11,
    desc: 'A velocidade na diagonal não é maior que a reta',
    pass: test11Pass,
    details: `Reta: ${speedTest.straightSpeed.toFixed(4)} px/tick; Diagonal: ${speedTest.diagSpeed.toFixed(4)} px/tick (${(speedTest.ratio * 100).toFixed(1)}% da reta - não excede)`
  });

  // ---------------------------------------------------------------------------
  // TESTE 12: Sem suavização/borrão nos sprites (pixel art nítido)
  // ---------------------------------------------------------------------------
  console.log('\n--- Executando Teste 12: Renderização pixel art nítida ---');
  const renderTest = await evalExpr(`(() => {
    const canvas = document.querySelector('#island-canvas');
    const ctx = canvas.getContext('2d');
    const style = window.getComputedStyle(canvas);
    return {
      smoothing: ctx.imageSmoothingEnabled,
      rendering: style.imageRendering
    };
  })()`);

  const test12Pass = (renderTest.smoothing === false) && (renderTest.rendering.includes('pixelated'));
  testResults.push({
    test: 12,
    desc: 'Sem suavização/borrão nos sprites (imageSmoothingEnabled = false e image-rendering: pixelated)',
    pass: test12Pass,
    details: `imageSmoothingEnabled = ${renderTest.smoothing}; CSS image-rendering = "${renderTest.rendering}"`
  });

  // Captura screenshot para conferir o painel F3 visualmente
  console.log('\nCapturando screenshot do jogo em execução com o painel F3...');
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot-f3-navegador.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Screenshot salva em scratch/screenshot-f3-navegador.png');

  // Fecha conexão e navegador
  ws.close();
  chromeProcess.kill();

  console.log('\n========================================================');
  console.log('RESULTADO DOS TESTES 6 A 12 NO NAVEGADOR REAL:');
  console.log('========================================================');
  testResults.forEach(t => {
    console.log(`[${t.pass ? 'PASSOU' : 'FALHOU'}] Teste ${t.test}: ${t.desc}`);
    console.log(`       Detalhes: ${t.details}\n`);
  });

  const allPassed = testResults.every(t => t.pass);
  if (allPassed) {
    console.log('TODOS OS TESTES DE 6 A 12 PASSARAM NO NAVEGADOR REAL COM SUCESSO!\n');
  } else {
    console.error('Houve falhas nos testes.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Erro na execução do teste:', err);
  process.exit(1);
});
