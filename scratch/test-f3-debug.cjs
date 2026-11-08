const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const islandGameCode = fs.readFileSync(path.join(root, 'js/island-game.js'), 'utf8');
const mazeTriggersCode = fs.readFileSync(path.join(root, 'js/maze-triggers.js'), 'utf8');
const labirintoCode = fs.readFileSync(path.join(root, 'js/labirinto-puzzle.js'), 'utf8');

const islandWorldCode = fs.readFileSync(path.join(root, 'js/island-world.js'), 'utf8');

assert(islandWorldCode.includes('window.IslandWorld'), 'island-world.js define window.IslandWorld');
assert(/debug\s*=\s*false/.test(labirintoCode), 'labirinto-puzzle.js deve inicializar debug = false');
assert(islandGameCode.includes('window.GameIsland'), 'island-game.js define window.GameIsland');

console.log('✓ Verificação da Ilha e do estado F3 inicial (desligado por padrão) concluída com sucesso.');
