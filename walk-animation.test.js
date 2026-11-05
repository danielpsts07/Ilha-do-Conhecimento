const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FW,
  FH,
  FRAME_TIME,
  SECTOR_TO_ROW,
  sectorFromVector,
  rowFromSector,
  advanceAnim,
  frameColumn
} = require('./walk-animation.js');

test('1. Linhas das 8 direções: (x,y) -> linha', () => {
  const cases = [
    { x: 1, y: 0, expectedRow: 2, name: 'direita' },
    { x: 1, y: -1, expectedRow: 7, name: 'cima-direita' },
    { x: 0, y: -1, expectedRow: 3, name: 'cima' },
    { x: -1, y: -1, expectedRow: 6, name: 'cima-esquerda' },
    { x: -1, y: 0, expectedRow: 1, name: 'esquerda' },
    { x: -1, y: 1, expectedRow: 4, name: 'baixo-esquerda' },
    { x: 0, y: 1, expectedRow: 0, name: 'baixo' },
    { x: 1, y: 1, expectedRow: 5, name: 'baixo-direita' }
  ];

  for (const { x, y, expectedRow, name } of cases) {
    const sector = sectorFromVector(x, y);
    const row = rowFromSector(sector);
    assert.equal(row, expectedRow, `Vetor (${x}, ${y}) [${name}] deve resultar na linha ${expectedRow}, obteve ${row}`);
  }
});

test('2. Sequência de colunas: 60 ticks de 1/60s com moving = true resulta em [0,1,2,3,0,1,2,3]', () => {
  const dt = 1 / 60;
  let animTime = 0;
  const colunas = [];

  for (let tick = 0; tick < 60; tick++) {
    const col = frameColumn(true, animTime);
    colunas.push(col);
    animTime = advanceAnim(true, animTime, dt);
  }

  // Elimina repetições consecutivas para obter as transições
  const transicoes = colunas.filter((col, idx) => idx === 0 || col !== colunas[idx - 1]);
  assert.deepEqual(transicoes, [0, 1, 2, 3, 0, 1, 2, 3], `Sequência esperada [0,1,2,3,0,1,2,3], obteve ${JSON.stringify(transicoes)}`);
});

test('3. Parado: frameColumn(false, qualquerCoisa) é 0 e advanceAnim(false, ...) é 0', () => {
  assert.equal(frameColumn(false, 0), 0);
  assert.equal(frameColumn(false, 0.5), 0);
  assert.equal(frameColumn(false, 100), 0);
  assert.equal(advanceAnim(false, 10, 0.016), 0);
  assert.equal(advanceAnim(false, 0, 0.016), 0);
});

test('4. advanceAnim com moving = true nunca diminui nem zera animTime (troca de direção não reinicia)', () => {
  let animTime = 0;
  const dt = 1 / 60;

  // Anda por 20 ticks
  for (let i = 0; i < 20; i++) {
    const prev = animTime;
    animTime = advanceAnim(true, animTime, dt);
    assert.ok(animTime > prev, 'animTime deve crescer monotonicamente');
  }

  // Simula troca de direção mantendo moving = true (ex: de direita para cima-direita)
  const timeBeforeTurn = animTime;
  // Mantém moving = true e avança mais 10 ticks
  for (let i = 0; i < 10; i++) {
    animTime = advanceAnim(true, animTime, dt);
  }
  assert.ok(animTime > timeBeforeTurn, 'animTime deve continuar crescendo sem reiniciar após mudar de direção');
});

test('5. Histerese: ângulo de 25° com prevSector = 0 e histerese 6 continua no setor 0; sem histerese vai para 1', () => {
  // Vetor correspondente a 25 graus (y negativo é para cima):
  // x = cos(25°), y = -sin(25°)
  const rad = 25 * Math.PI / 180;
  const x = Math.cos(rad);
  const y = -Math.sin(rad);

  // Sem histerese: 25° está mais próximo de 45° (setor 1) que de 0° (setor 0), pois 25 > 22.5
  const semHisterese = sectorFromVector(x, y, 0, 0);
  assert.equal(semHisterese, 1, 'Sem histerese, 25° deve ir para o setor 1');

  // Com histerese de 6°: limite para sair de 0° é 22.5° + 6° = 28.5°. 25° continua no setor 0!
  const comHisterese = sectorFromVector(x, y, 0, 6);
  assert.equal(comHisterese, 0, 'Com histerese de 6°, 25° deve continuar no setor 0');
});

