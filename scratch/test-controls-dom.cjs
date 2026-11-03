const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== TESTE DE DOM SIMULADO DOS NOVOS CONTROLES ===');

// Check D-Pad
const dpadMatch = html.match(/<div class="island-direction-pad island-touch"[^>]*>([\s\S]*?)<\/div>/);
if (!dpadMatch) throw new Error('D-Pad container not found');
console.log('[OK] D-Pad container found with .island-direction-pad and .island-touch');

const walkButtons = ['up', 'left', 'down', 'right'];
for (const dir of walkButtons) {
  const btnRegex = new RegExp(`<button data-walk="${dir}" aria-label="[^"]+"><span class="visually-hidden">([^<]+)</span></button>`);
  if (!btnRegex.test(html)) {
    throw new Error(`Button data-walk="${dir}" missing or malformed`);
  }
}
console.log('[OK] All 4 data-walk buttons found with aria-label and visually-hidden fallback text');

// Check Joystick
const joystickMatch = html.match(/<div id="island-joystick" class="island-joystick island-touch"[^>]*>([\s\S]*?)<\/div>/);
if (!joystickMatch) throw new Error('Joystick container not found');
if (!html.includes('<span class="joystick-base"><span id="joystick-stick" class="joystick-stick"></span></span>')) {
  throw new Error('Joystick base or stick markup mismatch');
}
console.log('[OK] Joystick container found with .joystick-base and #joystick-stick');

// Check Interact Button
const interactMatch = html.match(/<button id="island-interact" class="island-interact island-touch" disabled><kbd class="visually-hidden">E<\/kbd><span id="island-interact-label">Aproxime-se de uma placa<\/span><\/button>/);
if (!interactMatch) throw new Error('Interact button markup mismatch');
console.log('[OK] Interact button found with hidden kbd and #island-interact-label');

// Check Settings Touch Cards
const cards = ['arrows', 'joystick', 'off'];
for (const c of cards) {
  const cardRegex = new RegExp(`id="touch-${c}" role="radio" aria-checked="[^"]*" data-touch="${c}"`);
  if (!cardRegex.test(html)) throw new Error(`Touch card ${c} missing or malformed attributes`);
}
if (!html.includes('src="assets/hud/controles/setas-completo.webp"')) throw new Error('setas-completo.webp missing in demo-arrows');
if (!html.includes('src="assets/hud/controles/joystick-base.webp"')) throw new Error('joystick-base.webp missing in demo-joystick');
if (!html.includes('src="assets/hud/controles/joystick-manche.webp"')) throw new Error('joystick-manche.webp missing in demo-joystick');
console.log('[OK] All 3 touch cards in Settings have correct demo assets and attributes');

console.log('>>> TODOS OS TESTES DE DOM SIMULADO PASSARAM COM SUCESSO! <<<');

