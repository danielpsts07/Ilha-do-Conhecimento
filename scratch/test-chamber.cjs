const fs = require('fs');
global.window = {};
eval(fs.readFileSync('js/labirinto-logica.js', 'utf8'));
eval(fs.readFileSync('js/labirinto-mascaras.js', 'utf8'));
const L = global.window.LabirintoLogica;
const G = global.window.LABIRINTO_GRADES;

const camaraMask = G.getMask(3);
const camaraField = L.field(camaraMask, 172, 96, 8, 8, 4, { x: 691, y: 480, r: 30 }, 4);
const camaraNav = L.grid(camaraField, 8, 2);
const camaraFails = L.geometryTest(camaraNav, [700, 720], [[625, 252, 140, 48]], { x: 691, y: 480, r: 30 });
const pathPortal = L.path(camaraNav, 700, 720, 695, 272);
const finalPortal = pathPortal[pathPortal.length - 1];
const portalOk = finalPortal && Math.hypot(finalPortal.x - 695, finalPortal.y - 272) <= 1;

console.log('Chamber fails:', camaraFails, 'Portal reached:', portalOk);

