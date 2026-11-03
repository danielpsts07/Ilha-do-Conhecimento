const fs = require('fs');

const css = fs.readFileSync('css/style.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('tutorial-view') || l.includes('practice-board') || l.includes('direction-pad') || l.includes('interaction-scene') || l.includes('region-grid') || l.includes('book-content') || l.includes('book-actions')) {
    console.log(`${i + 1}: ${l}`);
  }
});

