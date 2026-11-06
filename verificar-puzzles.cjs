// Wrapper de verificação automatizada dos puzzles (Ilha do Conhecimento)
const { execSync } = require('child_process');

console.log('--- VERIFICANDO SINTAXE DOS MÓDULOS DE PUZZLES E TUTORIAL ---');
execSync('node --check js/tutorial-data.js js/tutorial-demos.js js/tutorial-card.js js/algebra-puzzle.js js/geometria-puzzle.js js/labirinto-puzzle.js', { stdio: 'inherit' });
console.log('✓ Sintaxe de todos os módulos validada com sucesso.');

console.log('\n--- EXECUTANDO TESTES DE TUTORIAL CARD ---');
execSync('node scratch/test-tutorial-card.cjs', { stdio: 'inherit' });

console.log('\n--- EXECUTANDO TESTES DE INTEGRAÇÃO COM ÁLGEBRA ---');
execSync('node scratch/test-algebra-tutorial-integration.cjs', { stdio: 'inherit' });

console.log('\n--- EXECUTANDO TESTES DE INTEGRAÇÃO COM GEOMETRIA ---');
execSync('node scratch/test-geometria-tutorial-integration.cjs', { stdio: 'inherit' });

console.log('\n--- EXECUTANDO TESTES DE INTEGRAÇÃO COM LÓGICA (LABIRINTO) ---');
execSync('node scratch/test-logica-tutorial-integration.cjs', { stdio: 'inherit' });

console.log('\nTODOS OS PUZZLES E CARTÕES DE TUTORIAL VERIFICADOS COM SUCESSO!');
