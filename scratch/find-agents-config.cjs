const fs = require('fs');

const agentsMd = fs.readFileSync('AGENTS.md', 'utf8');
const lines = agentsMd.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Configurações') || l.includes('book-dialog') || l.includes('Mural de Cortiça')) {
    console.log(`${i + 1}: ${l}`);
  }
});

