const fs = require('fs');

let css = fs.readFileSync('css/settings.css', 'utf8').replace(/\r\n/g, '\n');

const tutStart = css.indexOf('/* ==========================================================================\n   TUTORIAL NO MURAL DE CORTIÇA (#tutorial-view)');
const tutEnd = css.indexOf('/* ==========================================================================\n   ACÚMULO E PREFERS-REDUCED-MOTION');

if (tutStart === -1 || tutEnd === -1) {
  console.error('Tutorial bounds not found');
  process.exit(1);
}

const refinedTutCss = `/* ==========================================================================
   TUTORIAL NO MURAL DE CORTIÇA (#tutorial-view)
   Folha pautada, layout em 2 colunas, botões em teclas, tipografia fluida,
   respeito à reserva do gato (x >= 72% e y >= 60%) e sem rolagem.
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
  grid-template-columns: 1.15fr 0.95fr;
  grid-template-rows: 1fr auto;
  column-gap: 3.5cqw;
  padding: 8.5cqh 4.0cqw 3.5cqh 13.5cqw;
  overflow: hidden;
  inset: auto;
}

/* Coluna Esquerda: Etapa, Título, Texto, Teclas e Dica */
#tutorial-view .left-page {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
  box-sizing: border-box;
  overflow: visible;
}

#tutorial-view .chapter {
  display: block;
  font: bold clamp(11px, 1.3cqw, 13px) Georgia, serif;
  color: #8b572a;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin: 0;
  line-height: 1;
}

#tutorial-view #step-count {
  font-weight: bold;
  color: #5c3818;
}

#tutorial-view #tutorial-title {
  margin: 0.6cqh 0 1.0cqh 0;
  padding: 0;
  font: bold clamp(19px, 2.7cqw, 25px) Georgia, serif;
  color: #4a2a14;
  line-height: 1.15;
}

#tutorial-view .tutorial-copy {
  margin: 0 0 1.0cqh 0;
  font: calc(var(--ts) * clamp(13px, 1.5cqw, 16px)) / 1.35 Georgia, serif;
  color: #4a2a14;
}

#tutorial-view .key-guide {
  display: flex;
  align-items: center;
  gap: 1.4cqw;
  margin: 0.6cqh 0 1.0cqh 0;
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
  min-width: clamp(22px, 3.0cqw, 28px);
  height: clamp(22px, 4.6cqh, 28px);
  padding: 0 4px;
  background: #fdf4e2;
  border: 1px solid #784e2d;
  border-radius: 4px;
  box-shadow: 0 2px 0 #966946;
  font: bold clamp(11px, 1.35cqw, 14px) monospace;
  color: #4a2a14;
  line-height: 1;
  box-sizing: border-box;
}

#tutorial-view .key-guide span {
  font: clamp(12px, 1.4cqw, 15px) Georgia, serif;
  color: #5c3818;
  white-space: nowrap;
}

#tutorial-view .tutorial-tip {
  margin: 0.8cqh 0 0 0;
  padding: 0.6cqh 1.0cqw;
  background: #fff8eb;
  border-left: 3px solid #784e2d;
  border-radius: 0 4px 4px 0;
  font: italic calc(var(--ts) * clamp(11px, 1.3cqw, 13.5px)) / 1.3 Georgia, serif;
  color: #6e4d30;
  box-sizing: border-box;
}

/* Coluna Direita: Área de Prática em moldura */
#tutorial-view .right-page.tutorial-practice {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
  box-sizing: border-box;
  border-top: 0;
  padding-top: 0;
}

#tutorial-view #movement-practice,
#tutorial-view #interaction-practice,
#tutorial-view #regions-practice {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Etapa 0: Movimento */
#tutorial-view .practice-board {
  position: relative;
  width: 100%;
  height: clamp(85px, 20cqh, 120px);
  margin: 0;
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
  grid-template-columns: repeat(3, clamp(36px, 4.5cqw, 46px));
  grid-template-rows: repeat(2, clamp(30px, 4.0cqw, 40px));
  gap: clamp(3px, 0.5cqw, 5px);
  justify-content: center;
  margin-top: clamp(4px, 0.8cqh, 8px);
}

#tutorial-view .direction-pad button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 36px;
  min-height: 30px;
  background: #fdf4e2;
  border: 1px solid #784e2d;
  border-radius: 4px;
  box-shadow: 0 2px 0 #966946;
  font: bold clamp(16px, 2.2cqw, 22px) sans-serif;
  color: #4a2a14;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition: transform 80ms, background 80ms, box-shadow 80ms;
}

#tutorial-view .direction-pad button:hover {
  background: #faeed0;
}

#tutorial-view .direction-pad button:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 #966946;
  background: #ffd35a;
}

#tutorial-view .direction-pad button:focus-visible {
  outline: 2px dashed #4a2a14;
  outline-offset: 2px;
}

#tutorial-view .direction-pad [data-move="up"] { grid-column: 2; }
#tutorial-view .direction-pad [data-move="left"] { grid-row: 2; grid-column: 1; }
#tutorial-view .direction-pad [data-move="down"] { grid-row: 2; grid-column: 2; }
#tutorial-view .direction-pad [data-move="right"] { grid-row: 2; grid-column: 3; }

#tutorial-view .practice-caption {
  font: italic clamp(11px, 1.35cqw, 14px) Georgia, serif;
  text-align: center;
  color: #6e4d30;
  margin: 3px 0 0 0;
}

/* Etapa 1: Interação */
#tutorial-view .interaction-scene {
  position: relative;
  width: 100%;
  height: clamp(85px, 20cqh, 120px);
  background: #f8eed6;
  border: 2px solid #784e2d;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(20px, 3.5cqw, 36px);
  padding-bottom: clamp(10px, 2.0cqh, 16px);
  margin: 0;
  box-sizing: border-box;
}

#tutorial-view .interaction-scene > img {
  width: clamp(34px, 4.4cqw, 46px);
  height: auto;
  image-rendering: pixelated;
}

#tutorial-view .key-pedestal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

#tutorial-view .key-pedestal img {
  width: clamp(24px, 3.5cqw, 34px);
  height: auto;
  image-rendering: pixelated;
  animation: keyfloat 2s ease-in-out infinite;
}

#tutorial-view .key-pedestal span {
  display: block;
  width: clamp(36px, 5.0cqw, 50px);
  height: clamp(12px, 2.2cqh, 16px);
  border: 2px solid #784e2d;
  border-bottom-width: 4px;
  background: #b2ac8f;
  border-radius: 4px;
}

#tutorial-view .key-pedestal.collected img {
  visibility: hidden;
}

#tutorial-view #interact-button {
  margin: clamp(6px, 1.2cqh, 10px) auto 0;
  width: 100%;
  max-width: 240px;
  min-height: clamp(44px, 7.8cqh, 50px);
  padding: 0 clamp(16px, 2.0cqw, 22px);
  background: #f7e0bc;
  border: 2px solid #5c3818;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.35);
  font: bold clamp(15px, 1.9cqw, 19px) Georgia, serif;
  color: #4a2a14;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  transition: background 120ms, transform 120ms;
}

#tutorial-view #interact-button:hover:not(:disabled) {
  background: #ebd1aa;
  transform: translateY(-2px);
}

#tutorial-view #interact-button:disabled {
  background: #e2cca6;
  border-color: #8c653e;
  color: #2e623a;
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
  font: clamp(11.5px, 1.4cqw, 14.5px) Georgia, serif;
  color: #2e623a;
  text-align: center;
  margin-top: 3px;
}

/* Etapa 2: Regiões */
#tutorial-view #regions-practice {
  display: flex;
  flex-direction: column;
  width: 100%;
}

#tutorial-view .region-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(6px, 1.0cqw, 10px);
  margin: 0;
}

#tutorial-view .region-grid button {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.0cqw, 10px);
  padding: clamp(5px, 0.9cqh, 8px) clamp(8px, 1.2cqw, 14px);
  background: #fff8eb;
  border: 1px solid #784e2d;
  border-radius: 6px;
  cursor: pointer;
  font: bold clamp(12px, 1.5cqw, 16px) Georgia, serif;
  color: #4a2a14;
  box-shadow: 0 1px 3px rgba(74, 42, 20, 0.15);
  box-sizing: border-box;
  transition: background 120ms, border-color 120ms, transform 120ms;
}

#tutorial-view .region-grid button img {
  width: clamp(20px, 2.8cqw, 28px);
  height: auto;
  object-fit: contain;
}

#tutorial-view .region-grid button:hover,
#tutorial-view .region-grid button[aria-pressed="true"] {
  background: #ffe6a3;
  border-color: #5c3818;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.25);
}

#tutorial-view #region-description {
  font: clamp(11.5px, 1.4cqw, 14px) / 1.3 Georgia, serif;
  color: #5c3818;
  text-align: center;
  margin: 4px 0 0 0;
  min-height: 24px;
}

#tutorial-view .rescue-cat {
  display: block;
  width: clamp(26px, 3.6cqw, 36px);
  height: auto;
  margin: 2px auto 0;
  image-rendering: pixelated;
}

/* Barra Inferior de Ações: Voltar / Pontinhos / Próxima */
#tutorial-view .book-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 58cqw; /* protege a zona do gato x >= 72% e y >= 60% */
  margin: auto 0 0 0;
  padding: 0 0 1.0cqh 0;
  box-sizing: border-box;
  z-index: 5;
}

#tutorial-view #previous-step {
  min-height: clamp(44px, 7.8cqh, 50px);
  padding: 0 clamp(16px, 2.2cqw, 24px);
  background: #f7e0bc;
  border: 2px solid #5c3818;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.35);
  font: bold clamp(15px, 2.0cqw, 19px) Georgia, serif;
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
  width: clamp(8px, 1.2cqw, 12px);
  height: clamp(8px, 1.2cqw, 12px);
  border-radius: 50%;
  background: #cbb292;
  border: 1.5px solid #784e2d;
  transition: transform 120ms ease, background-color 120ms ease;
}

#tutorial-view .page-dots button[aria-current="step"]::before,
#tutorial-view .page-dots button[aria-current]::before {
  background: #5c3818;
  transform: scale(1.35);
}

#tutorial-view .page-dots button:focus-visible {
  outline: 2px dashed #4a2a14;
  outline-offset: 2px;
}

#tutorial-view #next-step {
  min-height: clamp(44px, 7.8cqh, 50px);
  padding: 0 clamp(20px, 2.6cqw, 30px);
  background: #467a3c;
  border: 2px solid #284e21;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(40, 78, 33, 0.4);
  font: bold clamp(15px, 2.0cqw, 19px) Georgia, serif;
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
    padding: 6.0cqh 4.0cqw 3.0cqh 12.0cqw;
    overflow-y: auto;
  }
  #tutorial-view .left-page,
  #tutorial-view .right-page {
    width: 100%;
  }
  #tutorial-view .book-actions {
    max-width: 100%;
    margin-top: 15px;
  }
}
`;

css = css.slice(0, tutStart) + refinedTutCss + '\n' + css.slice(tutEnd);
fs.writeFileSync('css/settings.css', css.replace(/\n/g, '\r\n'), 'utf8');
console.log('Refined tutorial CSS applied successfully!');

