const fs = require('fs');

let css = fs.readFileSync('css/settings.css', 'utf8').replace(/\r\n/g, '\n');

const altStart = css.indexOf('TUTORIAL NO MURAL DE CORTI');
let startIndex = css.lastIndexOf('/*', altStart);

const altEnd = css.indexOf('ACÚMULO E PREFERS-REDUCED-MOTION');
let endIndex = css.lastIndexOf('/*', altEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Tutorial bounds not found:', { startIndex, endIndex });
  process.exit(1);
}

const refinedTutCss = `/* ==========================================================================
   TUTORIAL NO MURAL DE CORTIÇA (#tutorial-view)
   Folha pautada, bloco centralizado vertical e horizontalmente,
   altura reservada unificada entre etapas (sem pular), teclas e botões ampliados,
   respeito à reserva do gato (x >= 72% e y >= 60%) e sem rolagem em paisagem.
   ========================================================================== */
#tutorial-view.mural-tutorial {
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
  box-sizing: border-box;

  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
  grid-template-rows: 48cqh 1fr;
  column-gap: 3.5cqw;
  padding: 10.5cqh 7.0cqw 2.5cqh 14.0cqw;
  overflow: hidden;
  inset: auto;
}

/* Colunas com altura unificada de 48cqh: evita pulos de layout entre etapas */
#tutorial-view .left-page,
#tutorial-view .right-page.tutorial-practice {
  height: 48cqh;
  max-height: 48cqh;
  min-height: 48cqh;
  min-width: 0;
  box-sizing: border-box;
}

/* Coluna Esquerda: Cabeçalho fixo no topo, texto e teclas organizadas */
#tutorial-view .left-page {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-top: 0;
  padding: 0;
  overflow: visible;
}

#tutorial-view .chapter {
  display: block;
  font: bold clamp(12px, 1.4cqw, 14px) Georgia, serif;
  color: #8b572a;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin: 0 0 0.3cqh 0;
  line-height: 1.2;
}

#tutorial-view #step-count {
  float: none;
  display: inline;
  margin-left: 0.5ch;
  font-weight: bold;
  color: #5c3818;
}

#tutorial-view #tutorial-title {
  margin: 0 0 0.6cqh 0;
  padding: 0;
  font: bold clamp(24px, 3.2cqw, 32px) Georgia, serif;
  color: #4a2a14;
  line-height: 1.12;
}

#tutorial-view .tutorial-copy {
  margin: 0 0 0.8cqh 0;
  font: calc(var(--ts) * clamp(15px, 1.7cqw, 17px)) / 1.35 Georgia, serif;
  color: #4a2a14;
  max-width: 34ch;
}

#tutorial-view .key-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4cqh;
  margin: 0.3cqh 0 0.6cqh 0;
  max-width: 34ch;
}

#tutorial-view .wasd-cluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

#tutorial-view .wasd-cluster > div {
  display: flex;
  gap: 3px;
  justify-content: center;
}

#tutorial-view .key-guide kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 4.5cqw, 46px);
  height: clamp(30px, 4.4cqh, 40px);
  min-width: 36px;
  min-height: 30px;
  padding: 0;
  background: #fdf4e2;
  border: 1.5px solid #784e2d;
  border-bottom: 3px solid #784e2d;
  border-radius: 5px;
  box-shadow: 0 1px 0 #966946;
  font: bold clamp(14px, 1.8cqw, 18px) monospace;
  color: #4a2a14;
  line-height: 1;
  box-sizing: border-box;
}

#tutorial-view .key-guide span {
  font: clamp(14px, 1.6cqw, 16px) Georgia, serif;
  color: #5c3818;
  white-space: nowrap;
  text-align: center;
}

#tutorial-view .tutorial-tip {
  margin: 0.4cqh 0 0 0;
  padding: 0.4cqh 0.8cqw;
  background: #fff8eb;
  border-left: 3px solid #784e2d;
  border-radius: 0 4px 4px 0;
  font: italic calc(var(--ts) * clamp(12px, 1.35cqw, 14.5px)) / 1.3 Georgia, serif;
  color: #6e4d30;
  max-width: 34ch;
  box-sizing: border-box;
}

/* Coluna Direita: Área de Prática em moldura (Centralizada e Proporcional) */
#tutorial-view .right-page.tutorial-practice {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-top: 0;
  padding: 0;
}

#tutorial-view #movement-practice,
#tutorial-view #interaction-practice,
#tutorial-view #regions-practice {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
}

/* Etapa 0: Movimento */
#tutorial-view .practice-board {
  position: relative;
  width: min(100%, 31cqw);
  max-width: 215px;
  aspect-ratio: 16 / 10;
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  border: 2px solid #784e2d;
  border-radius: 8px;
  background: url('../assets/ilha/tile-grama.png') repeat;
  background-size: 48px;
  box-shadow: inset 0 0 25px rgba(66, 88, 58, 0.45);
  box-sizing: border-box;
}

#tutorial-view .practice-tree {
  position: absolute;
  height: 70%;
  right: 5%;
  top: 5%;
  pointer-events: none;
  image-rendering: pixelated;
}

#tutorial-view #practice-player {
  position: absolute;
  width: clamp(26px, 3.8cqw, 36px);
  height: auto;
  left: 42%;
  top: 65%;
  image-rendering: pixelated;
  transition: left 100ms linear, top 100ms linear;
  transform: translate(-50%, -100%);
}

#tutorial-view .direction-pad {
  display: grid;
  grid-template-columns: repeat(3, clamp(36px, 4.5cqw, 44px));
  grid-template-rows: repeat(2, clamp(26px, 3.8cqh, 36px));
  gap: 3px;
  justify-content: center;
  margin-top: clamp(2px, 0.4cqh, 5px);
}

#tutorial-view .direction-pad button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 36px;
  min-height: 26px;
  background: #fdf4e2;
  border: 1.5px solid #784e2d;
  border-bottom: 3px solid #784e2d;
  border-radius: 5px;
  box-shadow: 0 2px 0 #966946, 0 2px 4px rgba(74, 42, 20, 0.2);
  font: bold clamp(16px, 2.2cqw, 22px) sans-serif;
  color: #4a2a14;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition: transform 80ms, background 80ms, box-shadow 80ms;
}

#tutorial-view .direction-pad button:hover {
  background: #ffeec9;
}

#tutorial-view .direction-pad button:active {
  transform: translateY(2px);
  border-bottom-width: 1px;
  box-shadow: 0 0 0 #966946;
}

#tutorial-view .direction-pad button:focus-visible {
  outline: 2px dashed #4a2a14;
  outline-offset: 2px;
}

#tutorial-view .direction-pad [data-move="up"] {
  grid-column: 2;
  grid-row: 1;
}

#tutorial-view .direction-pad [data-move="left"] {
  grid-column: 1;
  grid-row: 2;
}

#tutorial-view .direction-pad [data-move="down"] {
  grid-column: 2;
  grid-row: 2;
}

#tutorial-view .direction-pad [data-move="right"] {
  grid-column: 3;
  grid-row: 2;
}

#tutorial-view .practice-caption {
  font: italic clamp(11.5px, 1.35cqw, 14px) Georgia, serif;
  color: #6e4d30;
  text-align: center;
  margin: 1px 0 0 0;
}

/* Etapa 1: Interação */
#tutorial-view .interaction-scene {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(14px, 2.2cqw, 26px);
  width: min(100%, 31cqw);
  max-width: 215px;
  aspect-ratio: 16 / 10;
  height: auto;
  margin: 0 auto;
  background: #fffdf8;
  border: 2px solid #784e2d;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 0 10px 10px;
  box-shadow: inset 0 0 20px rgba(120, 78, 45, 0.15);
}

#tutorial-view .interaction-scene img[src*="personagem"] {
  height: clamp(44px, 9.5cqh, 58px);
  width: auto;
  image-rendering: pixelated;
}

#tutorial-view .key-pedestal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#tutorial-view #practice-key {
  width: clamp(22px, 3.2cqw, 30px);
  height: auto;
  margin-bottom: 3px;
  animation: practiceKeyFloat 1.8s ease-in-out infinite alternate;
}

@keyframes practiceKeyFloat {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

#tutorial-view .key-pedestal span {
  display: block;
  width: clamp(36px, 4.8cqw, 46px);
  height: clamp(8px, 1.2cqh, 11px);
  background: #a87a46;
  border: 1px solid #784e2d;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(74, 42, 20, 0.35);
}

#tutorial-view #interact-button {
  align-self: center;
  width: fit-content;
  max-width: max-content;
  min-height: 48px;
  height: clamp(48px, 7.8cqh, 52px);
  padding: 0 clamp(18px, 2.4cqw, 28px);
  background: #f7e0bc;
  border: 2px solid #5c3818;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.35);
  font: bold clamp(16px, 2.0cqw, 19px) Georgia, serif;
  color: #4a2a14;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  margin: clamp(4px, 0.8cqh, 7px) auto 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 100ms ease, background-color 100ms ease, box-shadow 100ms ease;
}

#tutorial-view #interact-button:hover:not([disabled]) {
  background: #ebd1aa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(74, 42, 20, 0.45);
}

#tutorial-view #interact-button:active:not([disabled]) {
  transform: translateY(1px);
}

#tutorial-view #interact-button:focus-visible {
  outline: 3px dashed #4a2a14;
  outline-offset: 3px;
}

#tutorial-view #interact-button[disabled] {
  opacity: 0.6;
  cursor: default;
}

#tutorial-view #interact-button kbd {
  background: #fdf4e2;
  border: 1px solid #784e2d;
  border-radius: 3px;
  padding: 2px 6px;
  font: bold clamp(11px, 1.4cqw, 14px) monospace;
  box-shadow: 0 1px 0 #966946;
}

#tutorial-view #interaction-result {
  font: clamp(12px, 1.45cqw, 15px) Georgia, serif;
  color: #1e5622;
  text-align: center;
  margin: 2px auto 0;
  max-width: 32ch;
}

/* Etapa 2: Regiões (Grade com botões ampliados e gato de resgate) */
#tutorial-view #regions-practice {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
}

#tutorial-view .region-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(4px, 0.8cqw, 8px);
  width: 100%;
  min-width: 0;
}

#tutorial-view .region-grid button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 0.8cqw, 8px);
  padding: clamp(4px, 0.8cqh, 8px) clamp(6px, 1.0cqw, 12px);
  min-width: 0;
  min-height: 48px;
  height: clamp(48px, 8.2cqh, 54px);
  background: #fff8eb;
  border: 1.5px solid #784e2d;
  border-radius: 6px;
  cursor: pointer;
  font: bold clamp(13px, 1.6cqw, 16px) Georgia, serif;
  color: #4a2a14;
  box-shadow: 0 1px 3px rgba(74, 42, 20, 0.15);
  box-sizing: border-box;
  transition: background 120ms, border-color 120ms, transform 120ms;
}

#tutorial-view .region-grid button img {
  width: clamp(20px, 2.6cqw, 26px);
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

#tutorial-view .region-grid button:hover,
#tutorial-view .region-grid button[aria-pressed="true"] {
  background: #ffe6a3;
  border-color: #5c3818;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.25);
}

#tutorial-view #region-description {
  font: clamp(12px, 1.4cqw, 14.5px) / 1.25 Georgia, serif;
  color: #5c3818;
  text-align: center;
  margin: clamp(4px, 0.8cqh, 7px) 0 0 0;
  min-height: 22px;
  width: 100%;
  min-width: 0;
}

#tutorial-view .rescue-cat {
  display: block;
  width: clamp(30px, 4.0cqw, 38px);
  height: auto;
  margin: clamp(3px, 0.5cqh, 6px) auto 0;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 4px rgba(74, 42, 20, 0.25));
}

/* Barra Inferior de Ações: Voltar / Pontinhos / Próxima */
#tutorial-view .book-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 58cqw; /* protege a reserva do gato x >= 72% e y >= 60% */
  margin: auto 0 0 0;
  padding: 0;
  box-sizing: border-box;
  z-index: 5;
}

#tutorial-view #previous-step {
  min-height: 48px;
  height: clamp(48px, 8.2cqh, 52px);
  padding: 0 clamp(16px, 2.2cqw, 24px);
  background: #f7e0bc;
  border: 2px solid #5c3818;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.35);
  font: bold clamp(18px, 2.2cqw, 20px) Georgia, serif;
  color: #4a2a14;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  white-space: nowrap;
  transition: transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

#tutorial-view #previous-step:hover {
  background: #ebd1aa;
  transform: translateX(-2px);
  box-shadow: 0 3px 7px rgba(74, 42, 20, 0.45);
}

#tutorial-view #previous-step:focus-visible {
  outline: 3px dashed #4a2a14;
  outline-offset: 3px;
}

#tutorial-view .page-dots {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.2cqw, 14px);
}

#tutorial-view .page-dots button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  outline: none;
}

#tutorial-view .page-dots button::before {
  content: '';
  display: block;
  width: clamp(9px, 1.3cqw, 13px);
  height: clamp(9px, 1.3cqw, 13px);
  border-radius: 50%;
  background: #cbb292;
  border: 1.5px solid #784e2d;
  transition: transform 120ms ease, background-color 120ms ease;
}

#tutorial-view .page-dots button[aria-current="step"]::before,
#tutorial-view .page-dots button[aria-current]::before {
  background: #5c3818;
  transform: scale(1.4);
}

#tutorial-view .page-dots button:focus-visible {
  outline: 2px dashed #4a2a14;
  outline-offset: 2px;
}

#tutorial-view #next-step {
  min-height: 48px;
  height: clamp(48px, 8.2cqh, 52px);
  padding: 0 clamp(20px, 2.6cqw, 32px);
  background: #467a3c;
  border: 2px solid #284e21;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(40, 78, 33, 0.4);
  font: bold clamp(18px, 2.2cqw, 20px) Georgia, serif;
  color: #fff8eb;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  transition: transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

#tutorial-view #next-step:hover {
  background: #528c46;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 78, 33, 0.5);
}

#tutorial-view #next-step:focus-visible {
  outline: 3px dashed #1e3a18;
  outline-offset: 3px;
}

/* Modo Retrato */
@media (max-aspect-ratio: 1/1) {
  #tutorial-view.mural-tutorial {
    display: flex;
    flex-direction: column;
    aspect-ratio: auto;
    height: 93.1%;
    padding: 6.0cqh 5.0cqw 3.0cqh 13.5cqw;
    overflow-y: auto;
  }
  #tutorial-view .left-page,
  #tutorial-view .right-page.tutorial-practice {
    width: 100%;
    min-height: auto;
    max-height: none;
    height: auto;
    align-self: auto;
  }
  #tutorial-view .book-actions {
    max-width: 100%;
    margin-top: 15px;
  }
}
`;

css = css.slice(0, startIndex) + refinedTutCss + '\n' + css.slice(endIndex);
fs.writeFileSync('css/settings.css', css, 'utf8');
console.log('Applied perfected tutorial CSS to css/settings.css');
