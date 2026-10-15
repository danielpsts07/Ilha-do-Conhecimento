// Gera os ícones em pixel art do livro de configurações a partir de desenhos em texto.
// Uso: node tools/gerar-icones-pixel.cjs  (grava SVGs 16 × 16 em assets/ui/icones/)
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '..', 'assets', 'ui', 'icones');

const palette = {
  k: '#4a2f24', // contorno
  b: '#4f93c9', B: '#8cc4e6', // azuis
  g: '#6aa84f', G: '#4a7f3a', // verdes
  w: '#fff6dc', y: '#f2c14e', Y: '#d99a2b',
  o: '#9a6a3f', r: '#d9544f'
};

const icons = {
  globo: [
    '................',
    '.....kkkkkk.....',
    '...kkbbggbbkk...',
    '..kbBbgggbbbbk..',
    '..kBggggbbbbbk..',
    '.kbbgggbbbggbbk.',
    '.kbbbggbbbgggbk.',
    '.kbbbbbbbggggbk.',
    '.kbgbbbbbbggbbk.',
    '.kbggbbbbbbbbbk.',
    '..kbggbbbbbbbk..',
    '..kbbbbbbbbbbk..',
    '...kkbbbbbbkk...',
    '.....kkkkkk.....',
    '.......oo.......',
    '....kkkkkkkk....'
  ],
  olho: [
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwkkwwwwk..',
    '.kwwwwkbbkwwwwk.',
    'kwwwwkbwkbkwwwwk',
    'kwwwwkbkkbkwwwwk',
    '.kwwwwkbbkwwwwk.',
    '..kwwwwkkwwwwk..',
    '...kkwwwwwwkk...',
    '.....kkkkkk.....',
    '................',
    '................',
    '................'
  ],
  estrela: [
    '.......kk.......',
    '......kyyk......',
    '......kyyk......',
    '.....kywyyk.....',
    'kkkkkyywyyykkkkk',
    'kyyyyyyyyyyyyYYk',
    '.kyyyyyyyyyyyYk.',
    '..kyyyyyyyyyYk..',
    '...kyyyyyyyYk...',
    '...kyyyyyyyYk...',
    '..kyyyykkyyyYk..',
    '..kyyyk..kyyYk..',
    '.kyyyk....kyYYk.',
    '.kyyk......kYYk.',
    '.kkk........kkk.',
    '................'
  ]
};

for (const [name, rows] of Object.entries(icons)) {
  if (rows.length !== 16 || rows.some(row => row.length !== 16)) throw new Error(`${name}: o desenho precisa ter 16 × 16 pixels.`);
  const rects = [];
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '.') return;
    if (!palette[cell]) throw new Error(`${name}: cor desconhecida "${cell}".`);
    rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[cell]}"/>`);
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges">${rects.join('')}</svg>\n`;
  fs.writeFileSync(path.join(out, `${name}.svg`), svg);
  console.log(`assets/ui/icones/${name}.svg (${rects.length} pixels)`);
}
