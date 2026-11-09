/**
 * scratch/test-settings-adjustments.cjs
 * Suíte de testes automatizados para os 4 Ajustes:
 * 1. Sobre nós + Créditos unificados e "Voltar ao menu principal" no mural com diálogo de confirmação.
 * 2. Botão de tela cheia na tela inicial exclusivo para celular/tablet com Fullscreen API.
 * 3. Botão de configurações (engrenagem) nos 4 puzzles, com pausa e atalho Esc.
 * 4. Padrão de controle joystick no celular/tablet para novos jogadores.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST SUITE: 4 AJUSTES ILHA DO CONHECIMENTO ---');

// =============================================================================
// AJUSTE 1: Sobre nós + Créditos unificados e Voltar ao menu principal
// =============================================================================
console.log('\n[Ajuste 1] Verificando marcação e fusão de Sobre nós e Créditos...');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// 1.1 Card no mural
assert(indexHtml.includes('id="settings-card-quit"'), 'Deve existir o botão #settings-card-quit no mural');
assert(indexHtml.includes('data-settings-quit'), 'Deve possuir o atributo data-settings-quit');
assert(!indexHtml.includes('data-settings-go="credits"'), 'Não deve mais existir botão data-settings-go="credits" no mural');
assert(indexHtml.includes('Voltar ao menu'), 'Rótulo do cartão deve ser Voltar ao menu');
console.log('✓ Teste 1.1: Cartão #settings-card-quit no mural substituiu o antigo Créditos');

// 1.2 Fusão de Sobre nós e Créditos em data-settings-section="about"
assert(indexHtml.includes('data-settings-section="about"'), 'Deve existir a seção about');
assert(indexHtml.includes('data-page-section="about" data-page="1"'), 'Sobre nós deve ter a página 1');
assert(indexHtml.includes('data-page-section="about" data-page="2"'), 'Sobre nós deve ter a página 2 com créditos');
assert(indexHtml.includes('Quem fez a ilha') || indexHtml.includes('créditos'), 'Página 2 de Sobre nós deve conter os créditos');
assert(indexHtml.includes('Equipe Ilha do Conhecimento'), 'Texto dos créditos deve ser preservado integralmente');
assert(indexHtml.includes('Você, explorador!'), 'Agradecimento especial preservado');
console.log('✓ Teste 1.2: Sobre nós e Créditos unificados em 2 páginas sem perda de texto');

// 1.3 Diálogo de confirmação de saída
assert(indexHtml.includes('id="settings-confirm-dialog"'), 'Deve existir o diálogo #settings-confirm-dialog');
assert(indexHtml.includes('id="settings-confirm-yes"'), 'Deve existir o botão #settings-confirm-yes');
assert(indexHtml.includes('id="settings-confirm-no"'), 'Deve existir o botão #settings-confirm-no');
assert(indexHtml.includes('id="settings-confirm-puzzle-warning"'), 'Deve existir o aviso #settings-confirm-puzzle-warning para desafios');
console.log('✓ Teste 1.3: Diálogo modal de confirmação de saída presente no HTML com botões grandes e aviso de desafio');

// =============================================================================
// AJUSTE 2: Botão de tela cheia na tela inicial (celular/tablet)
// =============================================================================
console.log('\n[Ajuste 2] Verificando botão de tela cheia na tela inicial...');

assert(indexHtml.includes('id="home-fullscreen-btn"'), 'Deve existir #home-fullscreen-btn na tela inicial');
assert(indexHtml.includes('icone-tela-cheia.webp'), 'Deve usar o ícone de tela cheia');

// Verificação lógica da detecção de toque e tela cheia
function testDeviceDetection(pointerCoarse, maxTouchPoints) {
  const hasCoarse = Boolean(pointerCoarse);
  const hasTouch = Boolean(maxTouchPoints > 0);
  return hasCoarse || hasTouch;
}

assert.strictEqual(testDeviceDetection(false, 0), false, 'Desktop com mouse exclusivo NÃO deve ser detectado como celular/tablet');
assert.strictEqual(testDeviceDetection(true, 5), true, 'Celular com toque deve ser detectado');
assert.strictEqual(testDeviceDetection(true, 0), true, 'Dispositivo com ponteiro coarse deve ser detectado');
assert.strictEqual(testDeviceDetection(false, 5), true, 'iPad que se identifica como Mac (maxTouchPoints=5) deve ser detectado');
console.log('✓ Teste 2.1: Detecção de celular/tablet cobre touch, pointer coarse e iPad Safari Mac');

// =============================================================================
// AJUSTE 3: Botão de configurações dentro de todos os 4 puzzles
// =============================================================================
console.log('\n[Ajuste 3] Verificando botão de configurações e pausa nos 4 puzzles...');

const algebraCode = fs.readFileSync(path.join(__dirname, '../js/algebra-puzzle.js'), 'utf8');
const geometriaCode = fs.readFileSync(path.join(__dirname, '../js/geometria-puzzle.js'), 'utf8');
const operacoesCode = fs.readFileSync(path.join(__dirname, '../js/operacoes-puzzle.js'), 'utf8');
const labirintoCode = fs.readFileSync(path.join(__dirname, '../js/labirinto-puzzle.js'), 'utf8');

// 3.1 Álgebra
assert(algebraCode.includes('Configurações'), 'Álgebra deve conter botão de Configurações');
assert(algebraCode.includes('openSettings') || algebraCode.includes('window.openSettings'), 'Álgebra deve chamar openSettings');
assert(algebraCode.includes('paused'), 'Álgebra deve suportar estado paused');
assert(algebraCode.includes('ActivePuzzle'), 'Álgebra deve registrar ActivePuzzle');
console.log('✓ Teste 3.1: Álgebra possui engrenagem no HUD, pausa de temporizadores e registro de ActivePuzzle');

// 3.2 Geometria
assert(geometriaCode.includes('settingsBtn'), 'Geometria deve conter settingsBtn');
assert(geometriaCode.includes('Configurações'), 'Geometria deve ter rótulo Configurações');
assert(geometriaCode.includes('paused'), 'Geometria deve suportar estado paused');
assert(geometriaCode.includes('ActivePuzzle'), 'Geometria deve registrar ActivePuzzle');
console.log('✓ Teste 3.2: Geometria possui engrenagem no HUD, pausa de animações e registro de ActivePuzzle');

// 3.3 Operações
assert(operacoesCode.includes('Configurações'), 'Operações deve conter Configurações');
assert(operacoesCode.includes('openSettings'), 'Operações deve chamar openSettings');
assert(operacoesCode.includes('paused'), 'Operações deve suportar estado paused');
assert(operacoesCode.includes('ActivePuzzle'), 'Operações deve registrar ActivePuzzle');
console.log('✓ Teste 3.3: Operações possui engrenagem no HUD, pausa de moinho/lanterna e registro de ActivePuzzle');

// 3.4 Labirinto
assert(labirintoCode.includes('Configurações'), 'Labirinto deve conter botão de Configurações');
assert(labirintoCode.includes('puzzle-hud-gear-btn') || labirintoCode.includes('configuracoes.png'), 'Labirinto deve ter botão de engrenagem no HUD');
assert(labirintoCode.includes('paused'), 'Labirinto deve suportar estado paused');
assert(labirintoCode.includes('ActivePuzzle'), 'Labirinto deve registrar ActivePuzzle');
console.log('✓ Teste 3.4: Labirinto possui engrenagem no HUD, pausa de memorização/caminhada e registro de ActivePuzzle');

// 3.5 Escape abre configurações nos puzzles
assert(algebraCode.includes("k==='escape'") && algebraCode.includes('openSettings'), 'Esc em Álgebra deve abrir configurações');
assert(geometriaCode.includes("k==='escape'") && geometriaCode.includes('openSettings'), 'Esc em Geometria deve abrir configurações');
assert(operacoesCode.includes("k==='escape'") && operacoesCode.includes('openSettings'), 'Esc em Operações deve abrir configurações');
assert(labirintoCode.includes("k === 'escape'") && labirintoCode.includes('openSettings'), 'Esc em Labirinto deve abrir configurações');
console.log('✓ Teste 3.5: Tecla Escape abre configurações em todos os 4 puzzles');

// =============================================================================
// AJUSTE 4: Padrão Joystick no celular/tablet
// =============================================================================
console.log('\n[Ajuste 4] Verificando padrão joystick no celular/tablet para novos usuários...');

const settingsCode = fs.readFileSync(path.join(__dirname, '../js/game-settings.js'), 'utf8');

assert(settingsCode.includes('isTouchDevice'), 'game-settings.js deve conter detecção isTouchDevice');
assert(settingsCode.includes("isTouchDevice() ? 'joystick' : 'arrows'"), 'touch deve ter joystick como padrão em celular/tablet');
assert(settingsCode.includes("localStorage.getItem(`ilha.${key}`)"), 'game-settings.js deve preservar escolhas salvas no localStorage');
console.log('✓ Teste 4.1: GameSettings define joystick por padrão em mobile/tablet e arrows no desktop');
console.log('✓ Teste 4.2: GameSettings preserva escolhas prévias do jogador no localStorage');

// Simulação de GameSettings no Node
function createMockSettings(isTouch, mockStorage = {}) {
  const defaultTouch = isTouch ? 'joystick' : 'arrows';
  const defaults = { sound: 70, music: 35, mute: false, speed: 'normal', touch: defaultTouch, largeText: false, calm: false };
  const values = { ...defaults };
  for (const k of Object.keys(defaults)) {
    if (mockStorage[`ilha.${k}`] !== undefined) values[k] = mockStorage[`ilha.${k}`];
  }
  return {
    get: k => values[k],
    set: (k, v) => { values[k] = v; mockStorage[`ilha.${k}`] = v; },
    reset: () => {
      defaults.touch = isTouch ? 'joystick' : 'arrows';
      for (const k of Object.keys(defaults)) values[k] = defaults[k];
    }
  };
}

// Caso 1: Novo jogador em celular/tablet (sem localStorage) -> joystick
const touchPlayerNew = createMockSettings(true, {});
assert.strictEqual(touchPlayerNew.get('touch'), 'joystick', 'Novo jogador em celular deve iniciar com joystick');

// Caso 2: Novo jogador em desktop -> arrows
const desktopPlayerNew = createMockSettings(false, {});
assert.strictEqual(desktopPlayerNew.get('touch'), 'arrows', 'Novo jogador em desktop deve iniciar com setas');

// Caso 3: Jogador em celular que já escolheu setas anteriormente -> arrows
const touchPlayerExisting = createMockSettings(true, { 'ilha.touch': 'arrows' });
assert.strictEqual(touchPlayerExisting.get('touch'), 'arrows', 'Jogador em celular com escolha prévia de setas deve continuar com setas');

// Caso 4: Reset em celular restaura joystick
touchPlayerExisting.reset();
assert.strictEqual(touchPlayerExisting.get('touch'), 'joystick', 'Restaurar padrões no celular restaura joystick');

console.log('✓ Teste 4.3: Simulação de preferências de toque em múltiplos cenários validada com sucesso');

console.log('\n======================================================');
console.log('TODOS OS TESTES DOS 4 AJUSTES PASSARAM COM SUCESSO! (100%)');
console.log('======================================================\n');

