const fs = require('fs');
const js = fs.readFileSync('js/main.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, i) => {
  if (l.includes('tutorial') || l.includes('practice') || l.includes('step') || l.includes('renderPage')) {
    console.log(`${i + 1}: ${l.substring(0, 100)}`);
  }
});

