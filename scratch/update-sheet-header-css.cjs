const fs = require('fs');

let css = fs.readFileSync('css/settings.css', 'utf8').replace(/\r\n/g, '\n');

// Update header rules and sheet-page top in css
const oldRules = `/* Botão Voltar (#settings-back): Alvo de toque min 48px, texto >= 18px, pill contrastante */
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
}`;

const newRules = `/* Cabeçalho do Submenu: Voltar + Ícone + Título em fluxo vertical garantido */
.sheet-header {
  position: absolute;
  left: 13.5cqw;
  top: 3.5cqh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8cqh;
  z-index: 15;
}

/* Botão Voltar (#settings-back): Alvo de toque min 48px, texto >= 18px, pill contrastante */
.sheet-back-btn {
  position: relative;
  left: auto;
  top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.8cqw;
  min-height: clamp(44px, 8.5cqh, 54px);
  padding: 0 clamp(16px, 2.0cqw, 24px);
  background: #f7e0bc;
  border: 2px solid #5c3818;
  border-radius: 999px;
  box-shadow: 0 2px 5px rgba(74, 42, 20, 0.35);
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition: transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

.sheet-back-btn:hover {
  background: #ebd1aa;
  transform: translateX(-2px);
  box-shadow: 0 3px 7px rgba(74, 42, 20, 0.45);
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

/* Linha do título */
.sheet-title-group {
  position: relative;
  left: auto;
  top: auto;
  display: flex;
  align-items: center;
  gap: 1.0cqw;
}

.sheet-header-icon {
  width: clamp(24px, 3.8cqw, 34px);
  height: auto;
  object-fit: contain;
}

.sheet-title {
  margin: 0;
  padding: 0;
  font: bold clamp(19px, 3.0cqw, 26px) Georgia, serif;
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
  top: 29.5cqh;
  width: 82.5cqw;
  bottom: 3.5cqh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  pointer-events: auto;
}`;

if (!css.includes(oldRules)) {
  console.error('oldRules not found in css/settings.css');
} else {
  css = css.replace(oldRules, newRules);
  fs.writeFileSync('css/settings.css', css.replace(/\n/g, '\r\n'), 'utf8');
  console.log('css/settings.css updated with sheet-header rules');
}

