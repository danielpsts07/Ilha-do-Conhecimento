const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Audio submenu update
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
                  <div class="mural-notes-decor" aria-hidden="true">♪ ♫</div>
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
                  <div class="mural-notes-decor" aria-hidden="true">♪ ♫</div>
                </div>`;

// Controls Page 2 update
const oldControlsP2 = `<div class="sheet-page" data-page-section="controls" data-page="2" hidden>
                  <div class="mural-speed-header">
                    <img src="assets/hud/pata.png" alt="" class="speed-icon">
                    <span class="speed-label" id="speed-label">Velocidade da caminhada</span>
                  </div>
                  <div class="stepper-mural stepper" role="group" aria-labelledby="speed-label">
                    <button id="speed-prev" class="mural-page-arrow prev" aria-label="Mais devagar"></button>
                    <output id="speed-value" class="stepper-value" aria-live="polite">Normal</output>
                    <button id="speed-next" class="mural-page-arrow next" aria-label="Mais rápido"></button>
                  </div>
                  <div class="mural-walk-box">
                    <div id="walk-preview" class="walk-preview" data-speed="normal" aria-hidden="true">
                      <img src="assets/personagem/personagem-lado.png" alt="" class="walk-preview-hero">
                    </div>
                    <span class="walk-preview-caption">prévia da caminhada</span>
                  </div>

                  <div class="mural-touch-header">
                    <img src="assets/configuracoes/mural/ui/icone-controles.webp" alt="" class="touch-icon">
                    <span class="touch-title" id="touch-label">Controle na tela</span>
                    <span class="touch-hint">Para jogar com o dedo no tablet ou no celular.</span>
                  </div>
                  <div class="touch-choice mural-card-choices" role="radiogroup" aria-labelledby="touch-label">
                    <button class="mural-touch-card touch-option is-selected" id="touch-arrows" role="radio" aria-checked="true" data-touch="arrows">
                      <div class="touch-card-demo demo-arrows">
                        <span class="mini-key">↑</span>
                        <div class="mini-key-row">
                          <span class="mini-key">←</span>
                          <span class="mini-key">↓</span>
                          <span class="mini-key">→</span>
                        </div>
                      </div>
                      <span class="touch-name">Setas</span>
                    </button>
                    <button class="mural-touch-card touch-option" id="touch-joystick" role="radio" aria-checked="false" data-touch="joystick">
                      <div class="touch-card-demo demo-joystick">
                        <span class="joystick-ring"><span class="joystick-dot"></span></span>
                      </div>
                      <span class="touch-name">Joystick</span>
                    </button>
                    <button class="mural-touch-card touch-option" id="touch-off" role="radio" aria-checked="false" data-touch="off">
                      <div class="touch-card-demo demo-off">
                        <span class="off-icon">⌨</span>
                      </div>
                      <span class="touch-name">Nenhum</span>
                    </button>
                  </div>
                </div>`;

const newControlsP2 = `<div class="sheet-page" data-page-section="controls" data-page="2" hidden>
                  <div class="mural-speed-row">
                    <div class="speed-control-group">
                      <div class="mural-speed-header">
                        <img src="assets/hud/pata.png" alt="" class="speed-icon">
                        <span class="speed-label" id="speed-label">Velocidade da caminhada</span>
                      </div>
                      <div class="stepper-mural stepper" role="group" aria-labelledby="speed-label">
                        <button id="speed-prev" class="mural-page-arrow prev" aria-label="Mais devagar"></button>
                        <output id="speed-value" class="stepper-value" aria-live="polite">Normal</output>
                        <button id="speed-next" class="mural-page-arrow next" aria-label="Mais rápido"></button>
                      </div>
                    </div>
                    <div class="mural-walk-box">
                      <div id="walk-preview" class="walk-preview" data-speed="normal" aria-hidden="true">
                        <img src="assets/personagem/personagem-lado.png" alt="" class="walk-preview-hero">
                      </div>
                      <span class="walk-preview-caption">prévia da caminhada</span>
                    </div>
                  </div>

                  <div class="mural-touch-section">
                    <div class="mural-touch-header">
                      <img src="assets/configuracoes/mural/ui/icone-controles.webp" alt="" class="touch-icon">
                      <span class="touch-title" id="touch-label">Controle na tela</span>
                      <span class="touch-hint">Para jogar com o dedo no tablet ou no celular.</span>
                    </div>
                    <div class="touch-choice mural-card-choices" role="radiogroup" aria-labelledby="touch-label">
                      <button class="mural-touch-card touch-option is-selected" id="touch-arrows" role="radio" aria-checked="true" data-touch="arrows">
                        <div class="touch-card-demo demo-arrows">
                          <span class="mini-key">↑</span>
                          <div class="mini-key-row">
                            <span class="mini-key">←</span>
                            <span class="mini-key">↓</span>
                            <span class="mini-key">→</span>
                          </div>
                        </div>
                        <span class="touch-name">Setas</span>
                      </button>
                      <button class="mural-touch-card touch-option" id="touch-joystick" role="radio" aria-checked="false" data-touch="joystick">
                        <div class="touch-card-demo demo-joystick">
                          <span class="joystick-ring"><span class="joystick-dot"></span></span>
                        </div>
                        <span class="touch-name">Joystick</span>
                      </button>
                      <button class="mural-touch-card touch-option" id="touch-off" role="radio" aria-checked="false" data-touch="off">
                        <div class="touch-card-demo demo-off">
                          <span class="off-icon">⌨</span>
                        </div>
                        <span class="touch-name">Nenhum</span>
                      </button>
                    </div>
                  </div>
                </div>`;

// Language update
const oldLang = `<p class="section-copy intro-language">A ilha fala português do Brasil. A versão em inglês ainda está sendo escrita.</p>
                  <div class="language-cards">
                    <button id="lang-pt" class="mural-lang-card lang-pt" aria-pressed="true">
                      <img src="assets/configuracoes/mural/ui/cartao-amarelo.webp" alt="" class="lang-card-bg">
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
                      <button id="lang-pt" class="mural-lang-card lang-pt" aria-pressed="true">
                        <img src="assets/configuracoes/mural/ui/cartao-amarelo.webp" alt="" class="lang-card-bg">
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

// Access update
const oldAccess = `<p class="section-copy intro-access">Letras maiores ajudam a ler. Menos animações deixam a tela mais calminha.</p>
                  
                  <div class="mural-access-card card-large-text">
                    <button id="toggle-large-text" class="mural-switch switch-access" role="switch" aria-checked="false" data-setting="largeText">
                      <span class="switch-img"></span>
                    </button>
                    <div class="access-info">
                      <span class="access-title">Letras maiores</span>
                      <span class="access-desc">Textos do livro, da ilha e dos desafios crescem.</span>
                    </div>
                    <span id="toggle-large-text-state" class="access-state">Desligado</span>
                  </div>

                  <div class="mural-access-card card-calm">
                    <button id="toggle-calm" class="mural-switch switch-access" role="switch" aria-checked="false" data-setting="calm">
                      <span class="switch-img"></span>
                    </button>
                    <div class="access-info">
                      <span class="access-title">Menos animações</span>
                      <span class="access-desc">As páginas trocam sem virar e a ilha fica mais paradinha.</span>
                    </div>
                    <span id="toggle-calm-state" class="access-state">Desligado</span>
                  </div>

                  <img src="assets/configuracoes/mural/ui/icone-acessibilidade.webp" alt="" class="mural-decor-access" aria-hidden="true">

                  <div class="mural-access-preview" aria-hidden="true">
                    <span class="preview-aa">Aa</span>
                    <span class="preview-text">A ilha espera por você!</span>
                  </div>`;

const newAccess = `<p class="section-copy intro-access">Letras maiores ajudam a ler. Menos animações deixam a tela mais calminha.</p>
                  
                  <div class="access-cards-column">
                    <div class="mural-access-card card-large-text">
                      <button id="toggle-large-text" class="mural-switch switch-access" role="switch" aria-checked="false" data-setting="largeText">
                        <span class="switch-img"></span>
                      </button>
                      <div class="access-info">
                        <span class="access-title">Letras maiores</span>
                        <span class="access-desc">Textos do livro, da ilha e dos desafios crescem.</span>
                      </div>
                      <span id="toggle-large-text-state" class="access-state">Desligado</span>
                    </div>

                    <div class="mural-access-card card-calm">
                      <button id="toggle-calm" class="mural-switch switch-access" role="switch" aria-checked="false" data-setting="calm">
                        <span class="switch-img"></span>
                      </button>
                      <div class="access-info">
                        <span class="access-title">Menos animações</span>
                        <span class="access-desc">As páginas trocam sem virar e a ilha fica mais paradinha.</span>
                      </div>
                      <span id="toggle-calm-state" class="access-state">Desligado</span>
                    </div>

                    <div class="mural-access-preview" aria-hidden="true">
                      <span class="preview-aa">Aa</span>
                      <span class="preview-text">A ilha espera por você!</span>
                    </div>
                  </div>

                  <img src="assets/configuracoes/mural/ui/icone-acessibilidade.webp" alt="" class="mural-decor-access" aria-hidden="true">`;

function replaceNormalized(full, needle, repl) {
  const normFull = full.replace(/\r\n/g, '\n');
  const normNeedle = needle.replace(/\r\n/g, '\n');
  if (!normFull.includes(normNeedle)) {
    console.error('Needle not found:', normNeedle.substring(0, 60));
    return full;
  }
  return normFull.replace(normNeedle, repl).replace(/\n/g, '\r\n');
}

html = replaceNormalized(html, oldAudio, newAudio);
html = replaceNormalized(html, oldControlsP2, newControlsP2);
html = replaceNormalized(html, oldLang, newLang);
html = replaceNormalized(html, oldAccess, newAccess);

fs.writeFileSync('index.html', html, 'utf8');
console.log('HTML updated successfully!');

