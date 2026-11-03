const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

const oldHeader = `              <!-- Botão Voltar -->
              <button id="settings-back" class="sheet-back-btn" type="button" aria-label="Voltar ao mural" hidden>
                <img src="assets/configuracoes/mural/ui/icone-voltar.webp" alt="" class="back-icon">
                <span>Voltar</span>
              </button>

              <!-- Cabeçalho do Submenu -->
              <div class="sheet-title-group">
                <img id="sheet-header-icon" src="assets/configuracoes/mural/ui/icone-som.webp" alt="" class="sheet-header-icon">
                <h2 id="sheet-main-title" class="sheet-title" tabindex="-1">Sons da aventura</h2>
              </div>`;

const newHeader = `              <!-- Cabeçalho do Submenu (Voltar + Ícone + Título em fluxo) -->
              <header class="sheet-header">
                <button id="settings-back" class="sheet-back-btn" type="button" aria-label="Voltar ao mural" hidden>
                  <img src="assets/configuracoes/mural/ui/icone-voltar.webp" alt="" class="back-icon">
                  <span>Voltar</span>
                </button>

                <div class="sheet-title-group">
                  <img id="sheet-header-icon" src="assets/configuracoes/mural/ui/icone-som.webp" alt="" class="sheet-header-icon">
                  <h2 id="sheet-main-title" class="sheet-title" tabindex="-1">Sons da aventura</h2>
                </div>
              </header>`;

if (!html.includes(oldHeader)) {
  console.error('oldHeader not found in index.html');
} else {
  html = html.replace(oldHeader, newHeader);
  fs.writeFileSync('index.html', html.replace(/\n/g, '\r\n'), 'utf8');
  console.log('index.html updated with sheet-header');
}

