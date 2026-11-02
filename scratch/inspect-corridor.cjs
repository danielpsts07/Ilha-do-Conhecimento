const fs = require('fs');
const gridsData = JSON.parse(fs.readFileSync('scratch/generated-grids.json', 'utf8'));

for (let pNum = 1; pNum <= 3; pNum++) {
  const g = gridsData['fase' + pNum].grid8;
  const rIdx = Math.floor(170 / 8); // row 21
  const row = g.gridRows[rIdx];
  console.log(`\nFase ${pNum} Row ${rIdx} (y ~ 168..176):`);
  // Let's print columns 15 to 110 (x: 120 to 880)
  let s = '';
  for (let c = 15; c <= 115; c++) {
    s += (c % 10 === 0) ? '|' : row[c];
  }
  console.log('Cols 15..115:\n' + s);
}

