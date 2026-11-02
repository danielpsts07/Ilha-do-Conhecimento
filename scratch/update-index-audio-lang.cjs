const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

// 1. Language update
const oldLang = `<p class="section-copy intro-language">A ilha fala português do Brasil. A versão em inglês ainda está sendo escrita.</p>
                  <div class="language-cards">
                    <button id="lang-pt" class="mural-lang-card lang-pt is-selected" aria-pressed="true">
                      <img src="assets/configuracoes/mural/ui/cartao-selecionado.webp" alt="" class="lang-card-bg">
                      <span class="flag flag-br" aria-hidden="true"></span>
                      <span class="lang-card-name">Português</span>
                      <span class="lang-card-sub">PT-BR · em uso</span>
                      <span class="lang-check" aria-hidden="true">✓</span>
                    </button>
                    <button id="lang-en" class="mural-lang-card lang-en" aria-pressed="false" aria-disabled="true" aria-describedby="language-note">
                      <img src="assets/configuracoes/mural/ui/cartao-azul.webp" alt="" class="lang-card-bg">
                      <span class="flag flag-us" aria-hidden="true"></span>
                      <span class="lang-card-name">English</span>
                      <span class="lang-card-sub">EN</span>
                      <span class="lang-soon">Em breve</span>
                    </button>
                  </div>
                  <img src="assets/configuracoes/mural/ui/icone-idioma.webp" alt="" class="mural-decor-idioma" aria-hidden="true">
                  <p id="language-note" class="settings-note lang-note" role="status" aria-live="polite">O inglês ainda não está disponível.</p>`;

const newLang = `<p class="section-copy intro-language">A ilha fala português. O inglês está a caminho!</p>
                  <div class="language-content-row">
                    <div class="language-cards">
                      <button id="lang-pt" class="mural-lang-card lang-pt is-selected" aria-pressed="true">
                        <img src="assets/configuracoes/mural/ui/cartao-selecionado.webp" alt="" class="lang-card-bg">
                        <span class="flag flag-br" aria-hidden="true"></span>
                        <span class="lang-card-name">Português</span>
                        <span class="lang-card-sub">PT-BR · em uso</span>
                        <span class="lang-check" aria-hidden="true">✓</span>
                      </button>
                      <button id="lang-en" class="mural-lang-card lang-en" aria-pressed="false" aria-disabled="true" aria-describedby="language-note">
                        <img src="assets/configuracoes/mural/ui/cartao-azul.webp" alt="" class="lang-card-bg">
                        <span class="flag flag-us" aria-hidden="true"></span>
                        <span class="lang-card-name">English</span>
                        <span class="lang-card-sub">EN</span>
                        <span class="lang-soon">Em breve</span>
                      </button>
                    </div>
                    <img src="assets/configuracoes/mural/ui/icone-idioma.webp" alt="" class="mural-decor-idioma" aria-hidden="true">
                  </div>
                  <p id="language-note" class="settings-note lang-note" role="status" aria-live="polite">O inglês ainda não está disponível.</p>`;

// 2. Audio update
const oldAudio = `<div class="sheet-page" data-page-section="audio" data-page="1">
                  <!-- Linha Som -->
                  <div class="mural-audio-row row-som">
                    <img src="assets/configuracoes/mural/ui/icone-som.webp" alt="" class="audio-row-icon">
                    <label for="sound-volume" class="audio-row-label">Som</label>
                    <output id="sound-value" for="sound-volume" class="audio-row-value">70%</output>
                  </div>
                  <div class="mural-slider-wrap slider-som">
                    <input id="sound-volume" type="range" min="0" max="100" value="70">
                  </div>

                  <!-- Linha Música -->
                  <div class="mural-audio-row row-musica">
                    <img src="assets/configuracoes/musica.png" alt="" class="audio-row-icon">
                    <label for="music-volume" class="audio-row-label">Música</label>
                    <output id="music-value" for="music-volume" class="audio-row-value">35%</output>
                  </div>
                  <div class="mural-slider-wrap slider-musica">
                    <input id="music-volume" type="range" min="0" max="100" value="35">
                  </div>

                  <!-- Ouvir um efeito -->
                  <button class="mural-link-efeito text-link" id="test-sound">♪ Ouvir um efeito</button>

                  <!-- Ouvir música de teste -->
                  <button class="mural-btn-musica music-toggle" id="music-toggle" aria-pressed="false">
                    <span class="status-dot"></span>
                    <span id="music-status">Ouvir música de teste</span>
                  </button>

                  <!-- Cartão Silenciar tudo (coluna direita) -->
                  <div class="mural-card-silenciar">
                    <button id="toggle-mute" class="mural-switch switch-mute" role="switch" aria-checked="false" data-setting="mute">
                      <span class="switch-img"></span>
                    </button>
                    <span id="toggle-mute-state" class="switch-state-mute">Desligado</span>
                    <span class="mute-title">Silenciar tudo</span>
                    <p class="mute-desc">Nenhum som toca enquanto estiver ligado.</p>
                  </div>
                  <div class="mural-notes-decor" aria-hidden="true">♪ ♫ ♪</div>
                </div>`;

const newAudio = `<div class="sheet-page" data-page-section="audio" data-page="1">
                  <div class="audio-sliders-column">
                    <!-- Linha Som -->
                    <div class="mural-audio-row row-som">
                      <div class="audio-row-header">
                        <img src="assets/configuracoes/mural/ui/icone-som.webp" alt="" class="audio-row-icon">
                        <label for="sound-volume" class="audio-row-label">Som</label>
                      </div>
                      <output id="sound-value" for="sound-volume" class="audio-row-value">70%</output>
                    </div>
                    <div class="mural-slider-wrap slider-som">
                      <input id="sound-volume" type="range" min="0" max="100" value="70">
                    </div>

                    <!-- Linha Música -->
                    <div class="mural-audio-row row-musica">
                      <div class="audio-row-header">
                        <img src="assets/configuracoes/musica.png" alt="" class="audio-row-icon">
                        <label for="music-volume" class="audio-row-label">Música</label>
                      </div>
                      <output id="music-value" for="music-volume" class="audio-row-value">35%</output>
                    </div>
                    <div class="mural-slider-wrap slider-musica">
                      <input id="music-volume" type="range" min="0" max="100" value="35">
                    </div>

                    <div class="audio-actions-row">
                      <!-- Ouvir um efeito -->
                      <button class="mural-link-efeito text-link" id="test-sound">♪ Ouvir um efeito</button>

                      <!-- Ouvir música de teste -->
                      <button class="mural-btn-musica music-toggle" id="music-toggle" aria-pressed="false">
                        <span class="status-dot"></span>
                        <span id="music-status">Ouvir música de teste</span>
                      </button>
                    </div>
                  </div>

                  <!-- Cartão Silenciar tudo (coluna direita) -->
                  <div class="mural-card-silenciar">
                    <button id="toggle-mute" class="mural-switch switch-mute" role="switch" aria-checked="false" data-setting="mute">
                      <span class="switch-img"></span>
                    </button>
                    <div class="mute-info">
                      <span class="mute-title">Silenciar tudo</span>
                      <p class="mute-desc">Nenhum som toca enquanto estiver ligado.</p>
                      <span id="toggle-mute-state" class="switch-state-mute">Desligado</span>
                    </div>
                  </div>
                  <div class="mural-notes-decor" aria-hidden="true">♪ ♫ ♪</div>
                </div>`;

if (!html.includes(oldLang)) console.error('oldLang not matched');
else html = html.replace(oldLang, newLang);

if (!html.includes(oldAudio)) console.error('oldAudio not matched');
else html = html.replace(oldAudio, newAudio);

fs.writeFileSync('index.html', html.replace(/\n/g, '\r\n'), 'utf8');
console.log('index.html successfully updated for Audio & Lang!');

