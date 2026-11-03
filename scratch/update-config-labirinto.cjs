const fs = require('fs');

const finalGrids = JSON.parse(fs.readFileSync('scratch/final-grids.json', 'utf8'));
const labirintoJson = fs.readFileSync('data/labirinto.json', 'utf8').trim();

// Read existing camara mask data URL from js/config.js
let configCode = fs.readFileSync('js/config.js', 'utf8');

// Match the 4th item in LABIRINTO_MASKS_LOCAL (camara)
const maskMatches = configCode.match(/"data:image\/png;base64,[^"]+"/g);
if (!maskMatches || maskMatches.length < 4) {
  console.error('Could not find existing mask URLs in js/config.js');
  process.exit(1);
}
const camaraMaskUrl = maskMatches[3]; // The 4th one (index 3) is camara

const newMasksArray = `const LABIRINTO_MASKS_LOCAL = [
${JSON.stringify(finalGrids.fase1.dataUrl)},
${JSON.stringify(finalGrids.fase2.dataUrl)},
${JSON.stringify(finalGrids.fase3.dataUrl)},
${camaraMaskUrl}
];`;

// Replace LABIRINTO_LOCAL
const labirintoLocalStr = `const LABIRINTO_LOCAL = ${JSON.stringify(JSON.parse(labirintoJson))};`;

configCode = configCode.replace(/const LABIRINTO_LOCAL = \{[\s\S]*?\};\n\/\/ Espelhos/, `${labirintoLocalStr}\n// Espelhos`);

// Replace LABIRINTO_MASKS_LOCAL
configCode = configCode.replace(/const LABIRINTO_MASKS_LOCAL = \[[\s\S]*?\];/, newMasksArray);

fs.writeFileSync('js/config.js', configCode);
console.log('Successfully updated js/config.js');

