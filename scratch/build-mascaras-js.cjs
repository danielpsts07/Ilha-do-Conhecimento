const fs = require('fs');

const finalGrids = JSON.parse(fs.readFileSync('scratch/final-grids.json', 'utf8'));

// Read existing camara rows from js/labirinto-mascaras.js
const oldCode = fs.readFileSync('js/labirinto-mascaras.js', 'utf8');
const camaraMatch = oldCode.match(/camara:\s*\[([\s\S]*?)\]\s*};/);
if (!camaraMatch) {
  console.error('Could not find camara in old js/labirinto-mascaras.js');
  process.exit(1);
}
const camaraRawBlock = camaraMatch[1].trim();

const fase1Rows = finalGrids.fase1.gridRows.map(r => JSON.stringify(r)).join(',');
const fase2Rows = finalGrids.fase2.gridRows.map(r => JSON.stringify(r)).join(',');
const fase3Rows = finalGrids.fase3.gridRows.map(r => JSON.stringify(r)).join(',');

const newCode = `/* Grades de colisão pré-calculadas para o Labirinto das Runas.
 * Fases 1 a 3: 128×55 células de 8×8 px (Cenários 1024×434 px).
 * Câmara: 172×96 células de 8×8 px (Cenário 1376×768 px).
 * Evita leitura de pixels em tempo de execução via getImageData (bloqueado em protocolo file://).
 * 1 = andável (alfa > 40 na máscara original); 0 = bloqueado.
 */
window.LABIRINTO_GRADES = (() => {
  'use strict';
  const CELL = 8;
  const PHASES = [
    { cols: 128, rows: 55, cell: 8, width: 1024, height: 434 },
    { cols: 128, rows: 55, cell: 8, width: 1024, height: 434 },
    { cols: 128, rows: 55, cell: 8, width: 1024, height: 434 },
    { cols: 172, rows: 96, cell: 8, width: 1376, height: 768 }
  ];
  const COLS = 128, ROWS = 55;
  const RAW = {
    fase1: [${fase1Rows}],
    fase2: [${fase2Rows}],
    fase3: [${fase3Rows}],
    camara: [${camaraRawBlock}]
  };
  function getInfo(phaseIndex) {
    return PHASES[phaseIndex] || PHASES[0];
  }
  function getMask(phaseIndex) {
    const key = phaseIndex === 3 ? 'camara' : 'fase' + (phaseIndex + 1);
    const rows = RAW[key];
    if (!rows) return null;
    const info = getInfo(phaseIndex);
    const arr = new Uint8Array(info.cols * info.rows);
    for (let r = 0; r < info.rows; r++) {
      const row = rows[r];
      const offset = r * info.cols;
      for (let c = 0; c < info.cols; c++) {
        if (row.charCodeAt(c) === 49) arr[offset + c] = 1;
      }
    }
    return arr;
  }
  return { COLS, ROWS, CELL, PHASES, RAW, getInfo, getMask };
})();
`;

fs.writeFileSync('js/labirinto-mascaras.js', newCode);
console.log('Successfully wrote updated js/labirinto-mascaras.js');

