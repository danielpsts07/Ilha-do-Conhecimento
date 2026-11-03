const fs = require('fs');

const css = fs.readFileSync('css/settings.css', 'utf8').replace(/\r\n/g, '\n');
const lines = css.split('\n');

const sheetStartIdx = lines.findIndex(l => l.includes('.mural-sheet-container {'));
const calibIdx = lines.findIndex(l => l.includes('/* ==========================================================================\n   MODO DE CALIBRAÇÃO') || l.includes('MODO DE CALIBRAÇÃO (?calibrar)'));

if (sheetStartIdx === -1 || calibIdx === -1) {
  console.error('Indices not found:', sheetStartIdx, calibIdx);
  process.exit(1);
}

// Line right before MODO DE CALIBRAÇÃO
let calibLineIdx = calibIdx;
while (calibLineIdx > 0 && !lines[calibLineIdx].includes('MODO DE CALIBRAÇÃO')) {
  calibLineIdx--;
}
// Find the comment start for MODO DE CALIBRAÇÃO
while (calibLineIdx > 0 && !lines[calibLineIdx].includes('/* ==========================================================================')) {
  calibLineIdx--;
}

console.log(`Replacing lines from ${sheetStartIdx} to ${calibLineIdx}`);

const newSheetCss = `/* ==========================================================================
   SUBMENUS NA FOLHA DE CADERNO (MURAL DE CORTIÇA)
   Layout em fluxo com flex/grid, fontes fluidas com clamp(cqh/cqw),
   respeito à reserva do gato (x >= 72% e y >= 60%) e acessibilidade total.
   ========================================================================== */
.mural-sheet-container {
  position: absolute;
  left: 2.0%;
  top: 4.0%;
  width: 96.0%;
  height: 93.1%;
  aspect-ratio: 584 / 345;
  background: url('../assets/configuracoes/mural/ui/folha-caderno-com-gato.webp') center / 100% 100% no-repeat;
  z-index: 20;
  container-type: size;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
}

.mural-sheet {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Botão Voltar (#settings-back): Alvo de toque min 48px, texto >= 18px, pill contrastante */
.sheet-back-btn {
  position: absolute;
  left: 13.5cqw;
  top: 4.2cqh;
  display: inline-flex;
  align-items: center;
  gap: 0.8cqw;
  min-height: clamp(48px, 9.5cqh, 56px);
  padding: 0 clamp(16px, 2.0cqw, 24px);
  background: #fff8eb;
  border: 2px solid #784e2d;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.25);
  cursor: pointer;
  outline: none;
  z-index: 15;
  box-sizing: border-box;
  transition: transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

.sheet-back-btn:hover {
  background: #fbf0d8;
  transform: translateX(-2px);
  box-shadow: 0 3px 7px rgba(74, 42, 20, 0.35);
}

.sheet-back-btn:focus-visible {
  outline: 3px dashed #4a2a14;
  outline-offset: 3px;
}

.sheet-back-btn .back-icon {
  width: clamp(18px, 2.4cqw, 24px);
  height: auto;
  object-fit: contain;
}

.sheet-back-btn span {
  font: bold clamp(18px, 2.2cqw, 22px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
  line-height: 1;
}

/* Cabeçalho do Submenu (Ícone + Título >= 20px) */
.sheet-title-group {
  position: absolute;
  left: 13.5cqw;
  top: 16.5cqh;
  display: flex;
  align-items: center;
  gap: 1.2cqw;
  z-index: 10;
}

.sheet-header-icon {
  width: clamp(26px, 4.2cqw, 36px);
  height: auto;
  object-fit: contain;
}

.sheet-title {
  margin: 0;
  padding: 0;
  font: bold clamp(20px, 3.2cqw, 28px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
  line-height: 1.1;
}

.sheet-title:focus {
  outline: none;
}

/* Zona proibida do gato: x >= 72% e y >= 60% */
.sheet-cat-reserve {
  position: absolute;
  left: 72%;
  top: 60%;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

/* Estrutura de conteúdo e páginas da folha */
.sheet-spread {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sheet-page {
  position: absolute;
  left: 13.5cqw;
  top: 26.5cqh;
  width: 82.5cqw;
  bottom: 3.5cqh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  pointer-events: auto;
}

/* Bloco de introdução: altura reservada para até 2 linhas e margem inferior mínima */
.section-copy {
  position: relative;
  margin: 0 0 2cqh 0;
  width: 100%;
  max-width: 58cqw;
  min-height: 5.2cqh;
  font: calc(var(--ts) * clamp(13px, 1.65cqw, 16px)) / 1.35 Georgia, serif;
  color: #4a2a14;
  flex-shrink: 0;
}

.settings-note {
  font: italic calc(var(--ts) * clamp(12px, 1.4cqw, 15px)) Georgia, serif;
  color: #6e4d30;
  margin: 0;
}

/* ==========================================================================
   TELA 1: SOM
   ========================================================================== */
.sheet-page[data-page-section="audio"] {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 3.5cqw;
}

.audio-sliders-column {
  display: flex;
  flex-direction: column;
  width: 33cqw;
  flex-shrink: 0;
}

.mural-audio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6cqh;
}

.audio-row-header {
  display: flex;
  align-items: center;
  gap: 0.8cqw;
}

.audio-row-icon {
  width: clamp(18px, 2.4cqw, 24px);
  height: auto;
  object-fit: contain;
}

.audio-row-label {
  font: bold clamp(14px, 1.8cqw, 18px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.audio-row-value {
  font: bold clamp(14px, 1.7cqw, 18px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.mural-slider-wrap {
  position: relative;
  width: 100%;
  height: clamp(28px, 9.8cqh, 42px);
  background: url('../assets/configuracoes/mural/ui/trilho-regua.webp') center / 100% 100% no-repeat !important;
  display: flex;
  align-items: center;
  margin-bottom: 1.8cqh;
  box-sizing: border-box;
}

.mural-slider-wrap input[type="range"],
#sound-volume,
#music-volume {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  -webkit-appearance: none !important;
  appearance: none !important;
  cursor: pointer !important;
  outline: none !important;
}

.mural-slider-wrap input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: clamp(24px, 4.6cqw, 34px) !important;
  height: clamp(28px, 9.8cqh, 42px) !important;
  background: url('../assets/configuracoes/mural/ui/marcador-patinha.webp') center / contain no-repeat !important;
  image-rendering: pixelated !important;
  border: 0 !important;
  cursor: grab !important;
  filter: none !important;
}

.mural-slider-wrap input[type="range"]::-moz-range-thumb {
  width: clamp(24px, 4.6cqw, 34px) !important;
  height: clamp(28px, 9.8cqh, 42px) !important;
  background: url('../assets/configuracoes/mural/ui/marcador-patinha.webp') center / contain no-repeat !important;
  image-rendering: pixelated !important;
  border: 0 !important;
  cursor: grab !important;
  filter: none !important;
}

.audio-actions-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.2cqh;
  margin-top: 0.6cqh;
}

.mural-link-efeito {
  font: bold clamp(13px, 1.6cqw, 16px) Georgia, serif;
  color: #2b557b;
  text-decoration: underline;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  white-space: nowrap;
}

.mural-btn-musica {
  padding: clamp(5px, 0.9cqh, 8px) clamp(10px, 1.4cqw, 16px);
  display: inline-flex;
  align-items: center;
  gap: 0.8cqw;
  background: #fff8eb;
  border: 1px solid #784e2d;
  border-radius: 999px;
  font: bold clamp(12px, 1.5cqw, 15px) Georgia, serif;
  line-height: 1;
  color: #4a2a14;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background-color 100ms ease, transform 100ms ease;
}

.mural-btn-musica:hover {
  background: #fdf0d5;
}

.mural-btn-musica .status-dot {
  width: clamp(7px, 0.9cqw, 10px);
  height: clamp(7px, 0.9cqw, 10px);
  border-radius: 50%;
  background: #967355;
  flex-shrink: 0;
}

.mural-btn-musica[aria-pressed="true"] .status-dot {
  background: #4caf50;
}

.mural-card-silenciar {
  width: clamp(190px, 28cqw, 240px);
  height: clamp(65px, 17cqh, 85px);
  background: #fff8eb;
  border: 1px solid #784e2d;
  border-radius: 8px;
  padding: clamp(8px, 1cqh, 12px) clamp(10px, 1.4cqw, 16px);
  display: flex;
  align-items: center;
  gap: 1.2cqw;
  box-sizing: border-box;
  flex-shrink: 0;
}

.switch-mute {
  width: clamp(38px, 6.2cqw, 50px);
  height: clamp(24px, 6cqh, 32px);
  cursor: pointer;
  flex-shrink: 0;
  background: transparent;
  border: 0;
  padding: 0;
}

.switch-mute .switch-img {
  width: 100%;
  height: 100%;
  background: url('../assets/configuracoes/mural/ui/interruptor-desligado.webp') center / contain no-repeat;
  display: block;
}

.switch-mute[aria-checked="true"] .switch-img {
  background-image: url('../assets/configuracoes/mural/ui/interruptor-ligado.webp');
}

.mute-info {
  display: flex;
  flex-direction: column;
}

.mute-title {
  font: bold clamp(13px, 1.8cqw, 17px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.mute-desc {
  margin: 2px 0 0;
  font: clamp(10px, 1.3cqw, 13px) / 1.25 Georgia, serif;
  color: #6e4d30;
}

.switch-state-mute {
  font: clamp(10px, 1.3cqw, 13px) Georgia, serif;
  color: #4a2a14;
  margin-top: 2px;
}

.mural-notes-decor {
  position: absolute;
  left: 42cqw;
  top: 21cqh;
  font: clamp(16px, 2cqw, 22px) Georgia, serif;
  color: #8b572a;
  letter-spacing: 0.6cqw;
  pointer-events: none;
}

/* ==========================================================================
   TELA 2: CONTROLES
   ========================================================================== */
/* Página 1: Teclado */
.mural-key-map {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 1.3cqh, 10px);
  width: 100%;
  max-width: 58cqw;
}

.key-row {
  display: grid;
  grid-template-columns: minmax(130px, 18.5cqw) 1fr;
  align-items: center;
  gap: 1.5cqw;
}

.key-caps {
  display: inline-flex;
  align-items: center;
  gap: 0.4cqw;
  flex-shrink: 0;
}

.key-caps kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(22px, 3.2cqw, 28px);
  height: clamp(22px, 5.0cqh, 28px);
  padding: 0 4px;
  box-sizing: border-box;
  background: #fdf4e2;
  border: 1px solid #784e2d;
  border-radius: 4px;
  box-shadow: 0 2px 0 #966946;
  font: bold clamp(11px, 1.4cqw, 15px) monospace;
  color: #4a2a14;
  line-height: 1;
  transition: background 80ms, transform 80ms, box-shadow 80ms;
}

.key-caps kbd.key-esc {
  min-width: clamp(34px, 4.6cqw, 42px);
}

.key-caps kbd.is-pressed,
.key-caps kbd:active {
  background: #ffd35a !important;
  transform: translateY(2px);
  box-shadow: 0 0 0 #966946;
}

.key-desc {
  font: clamp(13px, 1.6cqw, 17px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.mural-decor-controles {
  position: absolute;
  right: 6cqw;
  top: 0;
  width: clamp(60px, 12cqw, 95px);
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

/* Página 2: Velocidade e Toque */
.mural-speed-row {
  display: flex;
  align-items: center;
  gap: 3cqw;
  margin-bottom: 2.2cqh;
}

.speed-control-group {
  display: flex;
  flex-direction: column;
  gap: 0.8cqh;
}

.mural-speed-header {
  display: flex;
  align-items: center;
  gap: 0.8cqw;
}

.speed-icon {
  width: clamp(18px, 2.6cqw, 24px);
  height: auto;
  object-fit: contain;
}

.speed-label {
  font: bold clamp(14px, 1.8cqw, 18px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.stepper-mural {
  display: flex;
  align-items: center;
  gap: 0.8cqw;
}

.stepper-mural .prev,
.stepper-mural .next {
  width: clamp(24px, 4.6cqw, 36px);
  height: clamp(24px, 4.6cqw, 36px);
}

.stepper-value {
  width: clamp(90px, 16cqw, 130px);
  height: clamp(26px, 6.2cqh, 34px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff8eb;
  border: 1px solid #784e2d;
  border-radius: 999px;
  font: bold clamp(13px, 1.7cqw, 16px) Georgia, serif;
  color: #4a2a14;
  box-sizing: border-box;
}

.mural-walk-box {
  position: absolute;
  right: 6cqw;
  top: 0;
  width: clamp(90px, 16cqw, 130px);
  height: clamp(60px, 17cqh, 85px);
  background: #e2cdaa;
  border: 1px solid #784e2d;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.walk-preview-hero {
  height: clamp(22px, 5cqh, 30px);
  image-rendering: pixelated;
}

.walk-preview-caption {
  font: clamp(10px, 1.2cqw, 12px) Georgia, serif;
  color: #6e4d30;
  margin-top: 4px;
}

.mural-touch-section {
  display: flex;
  flex-direction: column;
  gap: 1cqh;
}

.mural-touch-header {
  display: flex;
  align-items: center;
  gap: 0.8cqw;
}

.touch-icon {
  width: clamp(18px, 2.6cqw, 24px);
  height: auto;
  object-fit: contain;
}

.touch-title {
  font: bold clamp(14px, 1.8cqw, 18px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.touch-hint {
  font: clamp(11px, 1.4cqw, 14px) Georgia, serif;
  color: #6e4d30;
  margin-left: 0.6cqw;
}

.touch-choice {
  display: flex;
  gap: 1.5cqw;
  max-width: 58cqw;
}

.mural-touch-card {
  position: relative;
  width: clamp(75px, 14.5cqw, 110px);
  height: clamp(55px, 15.5cqh, 78px);
  background: #fff8eb;
  border: 1px solid #967355;
  border-radius: 6px;
  cursor: pointer;
  box-sizing: border-box;
  outline: none;
  transition: background 120ms, border 120ms, transform 120ms;
}

.mural-touch-card.is-selected {
  background: #fff4d0;
  border: 2px solid #d6aa3c;
}

.touch-card-demo {
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.mini-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(12px, 1.6cqw, 16px);
  height: clamp(12px, 1.6cqw, 16px);
  background: #fff;
  border: 1px solid #784e2d;
  border-radius: 2px;
  font: bold clamp(8px, 1.0cqw, 11px) monospace;
  color: #4a2a14;
}

.mini-key-row {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.joystick-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(20px, 3.2cqw, 26px);
  height: clamp(20px, 3.2cqw, 26px);
  border: 2px solid #784e2d;
  border-radius: 50%;
}

.joystick-dot {
  width: clamp(8px, 1.4cqw, 12px);
  height: clamp(8px, 1.4cqw, 12px);
  background: #784e2d;
  border-radius: 50%;
}

.off-icon {
  font-size: clamp(16px, 2.4cqw, 22px);
  color: #784e2d;
}

.touch-name {
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  font: bold clamp(11px, 1.5cqw, 14px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

/* Rodapé de Paginação */
.sheet-pagination {
  position: absolute;
  left: 13.5cqw;
  bottom: 3.2cqh;
  display: flex;
  align-items: center;
  gap: 1.0cqw;
  z-index: 10;
}

.mural-page-arrow {
  width: clamp(24px, 4.4cqw, 36px);
  height: clamp(24px, 4.4cqw, 36px);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
}

.mural-page-arrow.prev {
  background: url('../assets/configuracoes/mural/ui/seta-pagina-esq.webp') center / contain no-repeat;
}

.mural-page-arrow.next {
  background: url('../assets/configuracoes/mural/ui/seta-pagina-dir.webp') center / contain no-repeat;
}

.mural-page-arrow:disabled,
.mural-page-arrow[aria-disabled="true"] {
  opacity: 0.35;
  cursor: default;
}

.sheet-page-num {
  font: bold clamp(14px, 1.7cqw, 18px) Georgia, serif;
  color: #4a2a14;
  min-width: 3.5cqw;
  text-align: center;
}

/* ==========================================================================
   TELA 3: IDIOMA
   ========================================================================== */
.language-content-row {
  display: flex;
  align-items: center;
  gap: 3.0cqw;
  margin-top: 1.0cqh;
}

.language-cards {
  display: flex;
  gap: 2.2cqw;
}

.mural-lang-card {
  position: relative;
  width: clamp(95px, 18cqw, 135px);
  aspect-ratio: 173 / 167;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.lang-card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.lang-en {
  opacity: 0.65;
  cursor: default;
}

.mural-lang-card .flag {
  position: absolute;
  left: 50%;
  top: 27%;
  transform: translate(-50%, -50%);
  width: clamp(24px, 3.4cqw, 30px);
  height: clamp(16px, 2.2cqw, 20px);
}

.flag-br {
  background: #009c3b;
  position: relative;
  border: 1px solid #784e2d;
}

.flag-br::before {
  content: '';
  position: absolute;
  inset: 2px 4px;
  background: #ffdf00;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

.flag-br::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: #002776;
  border-radius: 50%;
}

.flag-us {
  background: repeating-linear-gradient(#b22234, #b22234 2px, #fff 2px, #fff 4px);
  position: relative;
  border: 1px solid #784e2d;
}

.flag-us::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 11px;
  height: 9px;
  background: #3c3b6e;
}

.lang-card-name {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translate(-50%, -50%);
  font: bold clamp(12px, 1.7cqw, 16px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.lang-card-sub {
  position: absolute;
  left: 50%;
  top: 70%;
  transform: translate(-50%, -50%);
  font: clamp(10px, 1.3cqw, 13px) Georgia, serif;
  color: #6e4d30;
  white-space: nowrap;
}

.lang-check {
  position: absolute;
  left: 50%;
  top: 85%;
  transform: translate(-50%, -50%);
  width: clamp(16px, 2.2cqw, 20px);
  height: clamp(16px, 2.2cqw, 20px);
  border-radius: 50%;
  background: #4caf50;
  color: #fff;
  font: bold clamp(10px, 1.3cqw, 12px) sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lang-soon {
  position: absolute;
  left: 50%;
  top: 85%;
  transform: translate(-50%, -50%);
  padding: 2px 7px;
  background: #784e2d;
  color: #faecc9;
  border-radius: 999px;
  font: bold clamp(9px, 1.1cqw, 11px) Georgia, serif;
  white-space: nowrap;
}

.mural-decor-idioma {
  width: clamp(65px, 13cqw, 95px);
  height: auto;
  object-fit: contain;
  pointer-events: none;
  flex-shrink: 0;
}

.lang-note {
  margin-top: 1.8cqh;
}

/* ==========================================================================
   TELA 4: ACESSIBILIDADE
   ========================================================================== */
.access-cards-column {
  display: flex;
  flex-direction: column;
  gap: clamp(7px, 1.6cqh, 12px);
  width: 100%;
  max-width: 58cqw;
}

.mural-access-card {
  position: relative;
  width: 100%;
  height: clamp(46px, 12.5cqh, 60px);
  background: #fff8eb;
  border: 1px solid #784e2d;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0 clamp(8px, 1.4cqw, 16px);
  flex-shrink: 0;
}

.switch-access {
  width: clamp(38px, 6.2cqw, 48px);
  height: clamp(24px, 6cqh, 30px);
  cursor: pointer;
  flex-shrink: 0;
  background: transparent;
  border: 0;
  padding: 0;
}

.switch-access .switch-img {
  width: 100%;
  height: 100%;
  background: url('../assets/configuracoes/mural/ui/interruptor-desligado.webp') center / contain no-repeat;
  display: block;
}

.switch-access[aria-checked="true"] .switch-img {
  background-image: url('../assets/configuracoes/mural/ui/interruptor-ligado.webp');
}

.access-info {
  display: flex;
  flex-direction: column;
  margin-left: 1.5cqw;
}

.access-title {
  font: bold clamp(13px, 1.8cqw, 17px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.access-desc {
  font: clamp(10px, 1.3cqw, 13px) / 1.25 Georgia, serif;
  color: #6e4d30;
  margin-top: 1px;
}

.access-state {
  margin-left: auto;
  font: clamp(11px, 1.4cqw, 14px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.mural-decor-access {
  position: absolute;
  right: 6cqw;
  top: 0;
  width: clamp(60px, 12.5cqw, 95px);
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.mural-access-preview {
  margin-top: clamp(8px, 1.6cqh, 14px);
  display: flex;
  align-items: baseline;
  gap: 1.2cqw;
  pointer-events: none;
}

.preview-aa {
  font: bold calc(var(--ts) * clamp(22px, 3.6cqw, 34px)) Georgia, serif;
  color: #4a2a14;
  line-height: 1;
}

.preview-text {
  font: bold calc(var(--ts) * clamp(13px, 1.8cqw, 17px)) Georgia, serif;
  color: #4a2a14;
  line-height: 1;
}

/* ==========================================================================
   TELA 5: COMO JOGAR
   ========================================================================== */
.mural-steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 1.1cqh, 9px);
  max-width: 58cqw;
}

.step-row {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.4cqw, 14px);
}

.step-badge {
  width: clamp(18px, 2.2cqw, 24px);
  height: clamp(18px, 2.2cqw, 24px);
  border-radius: 50%;
  background: #fff8eb;
  border: 1px solid #784e2d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: bold clamp(11px, 1.35cqw, 14px) Georgia, serif;
  color: #4a2a14;
  flex-shrink: 0;
}

.step-text {
  font: clamp(13px, 1.6cqw, 16px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

.mural-keys-grid {
  position: absolute;
  right: 7cqw;
  top: 0;
  width: clamp(65px, 12cqw, 95px);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8cqw 1.2cqw;
  pointer-events: none;
}

.mural-keys-grid img {
  width: clamp(24px, 4cqw, 34px);
  height: auto;
  transform: rotate(-90deg);
  object-fit: contain;
}

.mural-btn-tutorial {
  position: relative;
  margin-top: clamp(8px, 1.8cqh, 14px);
  width: clamp(140px, 20cqw, 185px);
  height: clamp(38px, 8.2cqh, 48px);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  outline: none;
  align-self: flex-start;
  transition: transform 120ms ease;
}

.mural-btn-tutorial:hover {
  transform: scale(1.03);
}

.tutorial-btn-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.mural-btn-tutorial span {
  position: absolute;
  left: 60%;
  top: 50%;
  transform: translate(-50%, -50%);
  font: bold clamp(13px, 1.6cqw, 16px) Georgia, serif;
  color: #faecc9;
  white-space: nowrap;
  text-shadow: 1px 1px 0 rgba(70, 38, 18, 0.7);
  pointer-events: none;
}

/* ==========================================================================
   TELA 6: SOBRE NÓS
   ========================================================================== */
.mural-about-list {
  display: flex;
  flex-direction: column;
  gap: clamp(7px, 1.6cqh, 12px);
  width: 100%;
  max-width: 58cqw;
}

.about-item {
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 1.4cqw, 14px);
}

.about-icon {
  width: clamp(22px, 3.6cqw, 32px);
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
  margin-top: 2px;
}

.about-content strong {
  font: bold clamp(13px, 1.7cqw, 17px) Georgia, serif;
  color: #4a2a14;
  display: block;
}

.about-content p {
  margin: 1px 0 0;
  font: clamp(11px, 1.4cqw, 14px) / 1.25 Georgia, serif;
  color: #5c3818;
}

.mural-heart-decor {
  position: absolute;
  right: 7cqw;
  top: 0;
  font-size: clamp(32px, 6.5cqw, 52px);
  color: #c83c46;
  pointer-events: none;
}

/* ==========================================================================
   TELA 7: CRÉDITOS
   ========================================================================== */
.mural-blackboard {
  position: absolute;
  right: 6cqw;
  top: -7cqh;
  width: clamp(80px, 15cqw, 120px);
  height: clamp(26px, 6.5cqh, 34px);
  background: #283a32;
  border: 2px solid #6e4b2d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: bold clamp(11px, 1.4cqw, 15px) Georgia, serif;
  color: #faecc9;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.mural-credits-list {
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 1.2cqh, 9px);
  width: 100%;
  max-width: 58cqw;
}

.credits-row {
  display: flex;
  align-items: center;
  gap: 1.2cqw;
  height: clamp(24px, 5.2cqh, 30px);
}

.credits-tag {
  width: clamp(105px, 18.5cqw, 145px);
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #784e2d;
  border-radius: 4px;
  font: bold clamp(10px, 1.35cqw, 13px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
}

.tag-yellow { background: #ffe578; }
.tag-blue   { background: #b0d6eb; }
.tag-pink   { background: #f5b9c3; }
.tag-green  { background: #a0e6be; }

.credits-desc {
  font: clamp(11px, 1.4cqw, 14px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
}

`;

const updatedCss = lines.slice(0, sheetStartIdx).join('\n') + '\n' + newSheetCss + '\n' + lines.slice(calibLineIdx).join('\n');

fs.writeFileSync('css/settings.css', updatedCss.replace(/\n/g, '\r\n'), 'utf8');
console.log('css/settings.css updated successfully!');

