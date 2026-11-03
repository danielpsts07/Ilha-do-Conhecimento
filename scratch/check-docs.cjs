const fs = require('fs');

const agentsMd = fs.readFileSync('AGENTS.md', 'utf8');
const lines = agentsMd.split('\n');
const idx = lines.findIndex(l => l.includes('Configurações (#book-dialog):'));
console.log('AGENTS.md:');
console.log(lines.slice(idx, idx + 10).join('\n'));

const readmeMd = fs.readFileSync('README.md', 'utf8');
const rlines = readmeMd.split('\n');
const ridx = rlines.findIndex(l => l.includes('Configurações') || l.includes('Mural de Cortiça'));
console.log('README.md:');
console.log(rlines.slice(ridx, ridx + 10).join('\n'));

