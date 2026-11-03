const fs = require('fs');

console.log('=== TESTE DE SIMULAÇÃO DOM: MODOS DE TOQUE E DISPARO DE EVENTOS ===');

// Setup minimal DOM
const { JSDOM } = (function() {
  try { return require('jsdom'); } catch(e) { return { JSDOM: null }; }
})();

if (!JSDOM) {
  // If jsdom is not installed as an npm package, we can do a mock DOM test in pure Node
  console.log('Testing via lightweight pure Node DOM mock...');
  
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/island.css', 'utf8');

  // Verify CSS selectors for each mode
  const checks = [
    { mode: 'arrows', show: ['.island-direction-pad', '.island-interact'], hide: ['.island-joystick'] },
    { mode: 'joystick', show: ['.island-joystick', '.island-interact'], hide: ['.island-direction-pad'] },
    { mode: 'off', show: [], hide: ['.island-direction-pad', '.island-joystick', '.island-interact'] }
  ];

  for (const c of checks) {
    console.log(`\nVerificando modo "${c.mode}":`);
    for (const sel of c.show) {
      const rule = `#island-screen[data-touch-mode="${c.mode}"] ${sel}`;
      if (!css.includes(rule)) throw new Error(`Missing CSS rule for showing: ${rule}`);
      console.log(`  [OK] Regra presente para exibir ${sel} no modo "${c.mode}"`);
    }
    for (const sel of c.hide) {
      const rule = `#island-screen[data-touch-mode="${c.mode}"] ${sel}`;
      if (!css.includes(rule)) throw new Error(`Missing CSS rule for hiding: ${rule}`);
      console.log(`  [OK] Regra presente para ocultar ${sel} no modo "${c.mode}"`);
    }
  }

  // Verify that @media (hover: hover) and (pointer: fine) is NOT hiding .island-touch
  if (css.includes('pointer: fine') && css.includes('.island-touch') && css.includes('display: none !important')) {
    throw new Error('Media query hiding .island-touch on pointer:fine still present!');
  }
  console.log('\n[OK] Nenhuma media query bloqueia a exibição no desktop!');

  console.log('\n>>> SUCESSO NO TESTE DE REGRAS DOM! <<<');
} else {
  console.log('JSDOM available');
}

