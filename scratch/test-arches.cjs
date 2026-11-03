const fs = require('fs');
global.window = {};
eval(fs.readFileSync('js/labirinto-logica.js', 'utf8'));
const L = global.window.LabirintoLogica;
const gridsData = JSON.parse(fs.readFileSync('scratch/generated-grids.json', 'utf8'));

for (let pNum = 1; pNum <= 3; pNum++) {
  const gInfo = gridsData['fase' + pNum].grid8;
  const { cols, rows, cell, gridRows } = gInfo;
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (gridRows[r][c] === '1') mask[r * cols + c] = 1;
    }
  }
  const field = L.field(mask, cols, rows, cell, 8, 4, null, 4);
  const nav = L.grid(field, cell, 0);
  const spawn = [512, 400];

  const arches = [
    { name: 'Arco Esquerda', x: 205, y: 155 },
    { name: 'Arco Direita', x: 830, y: 155 }
  ];
  if (pNum === 2) arches.push({ name: 'Arco Topo', x: 516, y: 55 });
  if (pNum === 3) {
    arches.push({ name: 'Arco Topo-Esq', x: 420, y: 55 });
    arches.push({ name: 'Arco Topo-Dir', x: 604, y: 55 });
  }

  console.log(`\nFase ${pNum} Arch Reachability:`);
  for (const a of arches) {
    const p = L.path(nav, spawn[0], spawn[1], a.x, a.y);
    const reached = p.length > 0 && Math.hypot(p[p.length-1].x - a.x, p[p.length-1].y - a.y) < 15;
    console.log(`  ${a.name} at [${a.x}, ${a.y}]: reached=${reached}, path length=${p.length}`);
  }
}

