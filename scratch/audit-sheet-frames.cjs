const png = require('../assets/ferramentas-sprites/png.cjs');
const img = png.read('assets/personagem/menina-diagonal-8.png');

console.log('Auditoria dos 40 quadros de assets/personagem/menina-diagonal-8.png:');
const rows = ['0 (baixo-esq)', '1 (baixo-dir)', '2 (cima-esq)', '3 (cima-dir)'];

let passes = 0, fails = 0;

for (let r = 0; r < 4; r++) {
  console.log(`\n--- Linha ${rows[r]} ---`);
  for (let c = 0; c < 10; c++) {
    let minY = 56, maxY = 0;
    let totalWeightX = 0, count = 0;
    for (let y = 0; y < 56; y++) {
      for (let x = 0; x < 48; x++) {
        const a = img.data[((r * 56 + y) * img.w + (c * 48 + x)) * 4 + 3];
        if (a > 128) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          // Cabeça (y entre 0 e 24)
          if (y >= 2 && y <= 24) {
            totalWeightX += x;
            count++;
          }
        }
      }
    }
    const headX = count ? totalWeightX / count : 24;
    const diff = headX - 24; // > 0: rabo na direita -> rosto à ESQUERDA; < 0: rabo na esquerda -> rosto à DIREITA

    let looking = '';
    if (r === 0 || r === 2) {
      // Linhas da esquerda devem ter diff > 0 (rabo na direita)
      looking = diff > 0 ? 'ESQUERDA' : 'DIREITA (INCORRETO)';
      if (diff > 0) passes++; else fails++;
    } else {
      // Linhas da direita devem ter diff < 0 (rabo na esquerda)
      looking = diff < 0 ? 'DIREITA' : 'ESQUERDA (INCORRETO)';
      if (diff < 0) passes++; else fails++;
    }

    console.log(`  Col ${c}: topo=${minY}, pé=${maxY}, altura=${maxY - minY + 1} px | centro_cabeça=${headX.toFixed(1)} (diff ${diff > 0 ? '+' : ''}${diff.toFixed(1)}) -> ${looking}`);
  }
}

console.log(`\nResultado da auditoria: ${passes} quadros corretos, ${fails} falhas.`);
if (fails > 0) process.exit(1);

