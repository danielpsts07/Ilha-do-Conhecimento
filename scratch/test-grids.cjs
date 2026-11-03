const fs = require('fs');
const path = require('path');

global.window = {};
const logicaCode = fs.readFileSync('js/labirinto-logica.js', 'utf8');
eval(logicaCode);
const L = global.window.LabirintoLogica;

const gridsData = JSON.parse(fs.readFileSync('scratch/generated-grids.json', 'utf8'));

// Test both grid8 and grid4
for (const gridKey of ['grid8', 'grid4']) {
  console.log(`\n================== TESTING ${gridKey.toUpperCase()} ==================`);
  
  for (let phaseIdx = 0; phaseIdx < 3; phaseIdx++) {
    const pNum = phaseIdx + 1;
    const gInfo = gridsData['fase' + pNum][gridKey];
    const { cols, rows, cell, gridRows } = gInfo;
    
    // Construct Uint8Array mask from gridRows
    const mask = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      const row = gridRows[r];
      for (let c = 0; c < cols; c++) {
        if (row[c] === '1') mask[r * cols + c] = 1;
      }
    }

    // Spawn:
    const spawn = [512, 400];

    // Pedestals / Exits for this phase:
    let saidas = [];
    if (pNum === 1) {
      saidas = [
        { id: 'esq', pe: [369, 172], zona: [369 - 30, 172 - 30, 60, 60] },
        { id: 'dir', pe: [661, 171], zona: [661 - 30, 171 - 30, 60, 60] }
      ];
    } else if (pNum === 2) {
      saidas = [
        { id: 'topo', pe: [516, 82], zona: [516 - 30, 82 - 30, 60, 60] },
        { id: 'esq', pe: [369, 171], zona: [369 - 30, 171 - 30, 60, 60] },
        { id: 'dir', pe: [662, 171], zona: [662 - 30, 171 - 30, 60, 60] }
      ];
    } else if (pNum === 3) {
      saidas = [
        { id: 'topo_esq', pe: [429, 82], zona: [429 - 30, 82 - 30, 60, 60] },
        { id: 'topo_dir', pe: [602, 82], zona: [602 - 30, 82 - 30, 60, 60] },
        { id: 'esq', pe: [368, 171], zona: [368 - 30, 171 - 30, 60, 60] },
        { id: 'dir', pe: [664, 171], zona: [664 - 30, 171 - 30, 60, 60] }
      ];
    }

    const field = L.field(mask, cols, rows, cell, 8, 4, null, 4);
    // Test BFS grid with cell 8 (margin 2) and cell 4 (margin 0)
    const nav = L.grid(field, cell, 0);
    const fails = L.geometryTest(nav, spawn, saidas.map(s => s.zona), null);

    console.log(`Fase ${pNum} (${cols}x${rows}, cell=${cell}):`);
    console.log(`  Spawn [${spawn.join(', ')}] fits: ${L.fits(field, spawn[0], spawn[1])}`);
    for (const s of saidas) {
      const p = L.path(nav, spawn[0], spawn[1], s.pe[0], s.pe[1]);
      const reached = p.length > 0 && Math.hypot(p[p.length-1].x - s.pe[0], p[p.length-1].y - s.pe[1]) < 10;
      console.log(`  Pedestal ${s.id} at [${s.pe.join(', ')}]: path length=${p.length}, reached=${reached}`);
    }
    if (fails.length === 0) {
      console.log(`  geometryTest: ALL OK!`);
    } else {
      console.log(`  geometryTest failures:`, fails);
    }
  }
}

