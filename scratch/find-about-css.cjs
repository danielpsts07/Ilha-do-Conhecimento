const fs = require('fs');
const css = fs.readFileSync('css/settings.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('about') || l.includes('item-1')) {
    console.log(`${i + 1}: ${l}`);
  }
});

