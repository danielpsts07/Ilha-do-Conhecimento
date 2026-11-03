const fs = require('fs');
global.window = {};
eval(fs.readFileSync('js/labirinto-logica.js', 'utf8'));
const L = global.window.LabirintoLogica;

const finalGrids = JSON.parse(fs.readFileSync('scratch/final-grids.json', 'utf8'));

for (let pNum = 1; pNum <= 3; pNum++) {
  const g = finalGrids['fase' + pNum];
  const { cols, rows, cell, gridRows } = g;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (gridRows[r][c] === '1') mask[r * cols + c] = 1;
    }
  }

  const spawn = [512, 400];
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
  const nav = L.grid(field, cell, 0);
  const fails = L.geometryTest(nav, spawn, saidas.map(s => s.zona), null);

  console.log(`\n================ FASE ${pNum} (${cols}x${rows}, cell=${cell}) ================`);
  console.log(`Spawn [${spawn.join(', ')}] fits: ${L.fits(field, spawn[0], spawn[1])}`);
  for (const s of saidas) {
    const p = L.path(nav, spawn[0], spawn[1], s.pe[0], s.pe[1]);
    const reached = p.length > 0 && Math.hypot(p[p.length-1].x - s.pe[0], p[p.length-1].y - s.pe[1]) < 10;
    console.log(`Pedestal ${s.id} at [${s.pe.join(', ')}]: path length=${p.length}, reached=${reached}`);
  }

  // Also test arch exits reachability
  const archExits = [
    { name: 'Arco Esquerda', x: 205, y: 170 },
    { name: 'Arco Direita', x: 830, y: 170 }
  ];
  if (pNum === 2) archExits.push({ name: 'Arco Topo', x: 516, y: 45 });
  if (pNum === 3) {
    archExits.push({ name: 'Arco Topo-Esq', x: 420, y: 45 });
    archExits.push({ name: 'Arco Topo-Dir', x: 604, y: 45 });
  }
  for (const a of archExits) {
    const p = L.path(nav, spawn[0], spawn[1], a.x, a.y);
    const reached = p.length > 0 && Math.hypot(p[p.length-1].x - a.x, p[p.length-1].y - a.y) < 15;
    console.log(`Exit ${a.name} at [${a.x}, ${a.y}]: path length=${p.length}, reached=${reached}`);
  }

  if (fails.length === 0) {
    console.log(`geometryTest: ALL OK! (100% coverage and BFS reachability)`);
  } else {
    console.error(`geometryTest FAILURES:`, fails);
  }
}

