const fs = require('fs');

const cssFiles = ['css/settings.css', 'css/island.css'];
cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('tutorial') || l.includes('practice-board') || l.includes('direction-pad') || l.includes('book-actions') || l.includes('page-dots')) {
        console.log(`${file}:${i + 1}: ${l.substring(0, 80)}`);
      }
    });
  }
});

