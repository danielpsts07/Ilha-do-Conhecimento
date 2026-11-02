const fs = require('fs');

let css = fs.readFileSync('css/settings.css', 'utf8').replace(/\r\n/g, '\n');

// 1. Update sheet-header, sheet-page, sheet-pagination, credits-tag
const oldHeaderBlock = `/* Cabeçalho do Submenu: Voltar + Ícone + Título em fluxo vertical garantido */
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

const newHeaderBlock = `/* Cabeçalho do Submenu: Voltar + Ícone + Título em fluxo vertical garantido */
.sheet-header {
  position: absolute;
  left: 13.5cqw;
  top: 2.8cqh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5cqh;
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
  min-height: clamp(44px, 8.0cqh, 52px);
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
  width: clamp(22px, 3.5cqw, 32px);
  height: auto;
  object-fit: contain;
}

.sheet-title {
  margin: 0;
  padding: 0;
  font: bold clamp(18px, 2.8cqw, 26px) Georgia, serif;
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
  top: 25.5cqh;
  width: 82.5cqw;
  bottom: 8.5cqh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  pointer-events: auto;
}`;

// Update credits-tag and sheet-pagination
const oldPagination = `/* Rodapé de Paginação */
.sheet-pagination {
  position: absolute;
  left: 13.5cqw;
  bottom: 3.2cqh;
  display: flex;
  align-items: center;
  gap: 1.0cqw;
  z-index: 10;
}`;

const newPagination = `/* Rodapé de Paginação */
.sheet-pagination {
  position: absolute;
  left: 13.5cqw;
  bottom: 2.2cqh;
  display: flex;
  align-items: center;
  gap: 1.0cqw;
  z-index: 10;
}`;

const oldCreditsTag = `.credits-tag {
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
}`;

const newCreditsTag = `.credits-tag {
  min-width: clamp(100px, 17.5cqw, 140px);
  padding: 0 clamp(6px, 1cqw, 10px);
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #784e2d;
  border-radius: 4px;
  font: bold clamp(9.5px, 1.25cqw, 13px) Georgia, serif;
  color: #4a2a14;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
}`;

if (!css.includes(oldHeaderBlock)) console.error('oldHeaderBlock not found');
else css = css.replace(oldHeaderBlock, newHeaderBlock);

if (!css.includes(oldPagination)) console.error('oldPagination not found');
else css = css.replace(oldPagination, newPagination);

if (!css.includes(oldCreditsTag)) console.error('oldCreditsTag not found');
else css = css.replace(oldCreditsTag, newCreditsTag);

fs.writeFileSync('css/settings.css', css.replace(/\n/g, '\r\n'), 'utf8');
console.log('css/settings.css fine-tuned successfully!');

