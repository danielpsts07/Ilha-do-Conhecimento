const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === '_lixeira') continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (f.endsWith('.css') || f.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('practice-board') || content.includes('tutorial-copy')) {
        console.log(`Found in: ${full}`);
      }
    }
  }
}
searchDir('.');

