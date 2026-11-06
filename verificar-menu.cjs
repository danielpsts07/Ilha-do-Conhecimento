// Wrapper de verificação automatizada dos menus e configurações (Ilha do Conhecimento)
const { execSync } = require('child_process');

console.log('--- VERIFICANDO SINTAXE DOS MÓDULOS DE MENU E CONFIGURAÇÕES ---');
execSync('node --check js/settings-book.js js/game-settings.js js/audio.js js/music.js js/main.js', { stdio: 'inherit' });
console.log('✓ Sintaxe dos módulos de menu validada com sucesso.');

console.log('\n--- EXECUTANDO TESTES DE ÁUDIO E MÚSICA DO MENU/JOGO ---');
execSync('node scratch/test-music-manager.cjs', { stdio: 'inherit' });
execSync('node scratch/test-geometria-audio.cjs', { stdio: 'inherit' });

console.log('\nTODOS OS MENUS E MÓDULOS DE CONFIGURAÇÃO VERIFICADOS COM SUCESSO!');
