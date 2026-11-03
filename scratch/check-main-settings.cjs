const fs = require('fs');
const mainJs = fs.readFileSync('js/main.js', 'utf8');
const lines = mainJs.split('\n');
lines.forEach((l, i) => {
  if (l.includes('SettingsBook') || l.includes('openSettings') || l.includes('book-dialog')) {
    console.log(`${i + 1}: ${l}`);
  }
});

