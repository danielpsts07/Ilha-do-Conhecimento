const ratios = [
  { name: '20:9 (celular ultra-wide)', w: 20, h: 9, ar: 20/9 },
  { name: '16:9 (padrão landscape)', w: 16, h: 9, ar: 16/9 },
  { name: '16:10 (laptop / tablet)', w: 16, h: 10, ar: 1.6 },
  { name: '4:3 (iPad / monitor clássico)', w: 4, h: 3, ar: 4/3 }
];

const W = 1024, H = 434;
const safeXMin = W * 0.12; // 122.88
const safeXMax = W * 0.88; // 901.12
const safeW = safeXMax - safeXMin; // 778.24
const safeAR = safeW / H; // ~1.793

const elements = [
  { name: 'Spawn', x: 512, y: 400 },
  { name: 'Pedestal Esquerdo', x: 368, y: 171 },
  { name: 'Pedestal Direito', x: 664, y: 171 },
  { name: 'Pedestal Topo', x: 516, y: 82 },
  { name: 'Pedestal Topo Esq', x: 429, y: 82 },
  { name: 'Pedestal Topo Dir', x: 602, y: 82 },
  { name: 'Arco Esquerda', x: 205, y: 170 },
  { name: 'Arco Direita', x: 830, y: 170 },
  { name: 'Arco Topo', x: 516, y: 45 },
  { name: 'Arco Topo Esq', x: 420, y: 45 },
  { name: 'Arco Topo Dir', x: 604, y: 45 }
];

console.log('=== VERIFICAÇÃO DE ELEMENTOS ESSENCIAIS NA ZONA SEGURA ===');
console.log(`Zona segura: x entre ${safeXMin.toFixed(1)} px e ${safeXMax.toFixed(1)} px (${safeW.toFixed(1)} px)\n`);

let allInsideSafeZone = true;
for (const el of elements) {
  const inSafe = el.x >= safeXMin && el.x <= safeXMax;
  if (!inSafe) allInsideSafeZone = false;
  console.log(`  ${el.name.padEnd(22)} (${el.x}, ${el.y}): ${inSafe ? 'OK (dentro da zona segura)' : 'FORA!'}`);
}

console.log(`\nTodos os elementos dentro da zona segura [12%, 88%]: ${allInsideSafeZone ? 'SIM!' : 'NÃO!'}\n`);

console.log('=== VISIBILIDADE POR PROPORÇÃO DE TELA (com escala e cover adaptativo) ===');
for (const r of ratios) {
  let scale, visibleXMin, visibleXMax, visibleW, excessY = 0;
  if (r.ar >= safeAR) {
    // Screen is wide enough: cover using scale based on height
    scale = 1; // normalized
    // visible width in image space:
    visibleW = H * r.ar;
    visibleXMin = (W - visibleW) / 2;
    visibleXMax = (W + visibleW) / 2;
  } else {
    // Screen is narrower than safeAR: scale is limited to fit safeW exactly
    visibleW = safeW;
    visibleXMin = safeXMin;
    visibleXMax = safeXMax;
    // vertical sobras:
    excessY = (H * (safeAR / r.ar) - H);
  }

  const cropEachSide = Math.max(0, -visibleXMin);
  const cropPct = (cropEachSide / W * 100).toFixed(1);

  console.log(`\n--- ${r.name} (AR = ${r.ar.toFixed(3)}) ---`);
  console.log(`  Janela visível em X: [${visibleXMin.toFixed(1)}, ${visibleXMax.toFixed(1)}] (largura visível: ${visibleW.toFixed(1)} px)`);
  console.log(`  Corte lateral: ${cropPct}% em cada lado`);
  if (excessY > 0) {
    console.log(`  Sobras verticais: ${excessY.toFixed(1)} px cobertas com fundo borrado (sem faixas pretas)`);
  }

  let ratioAllVisible = true;
  for (const el of elements) {
    const visible = el.x >= visibleXMin && el.x <= visibleXMax;
    if (!visible) ratioAllVisible = false;
  }
  console.log(`  Resultado: ${ratioAllVisible ? '100% dos elementos essenciais visíveis' : 'ELEMENTO CORTADO!'}`);
}

