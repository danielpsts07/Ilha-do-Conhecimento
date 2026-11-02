const fs = require('fs');
const css = fs.readFileSync('css/settings.css', 'utf8');

// Simple bracket balancing check
let open = 0;
const lines = css.split('\n');
lines.forEach((line, i) => {
  const o = (line.match(/{/g) || []).length;
  const c = (line.match(/}/g) || []).length;
  open += o - c;
  if (open < 0) {
    console.error(`Negative brace balance at line ${i + 1}: ${line}`);
    open = 0;
  }
});
console.log('Final open brace count:', open);

