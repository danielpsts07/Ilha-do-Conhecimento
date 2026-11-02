const fs = require('fs');

const agentsPath = 'AGENTS.md';
let agents = fs.readFileSync(agentsPath, 'utf8');
const isCRLF = agents.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
let agentsLines = agents.split(/\r?\n/);

agentsLines[54] = '- Lógica abre o CP2 completo por `loadMemoryMaze()` em `js/config.js`, sem alterar o ramo de recompensa/teleporte em `island-game.js`. `js/labirinto-puzzle.js` usa Canvas/Pointer Events/teclado em captura como Geometria, Operações e Álgebra; `js/labirinto-logica.js` contém funções puras; `js/labirinto-mascaras.js` fornece as grades de colisão pré-calculadas (128×55 células de 8×8 px para as fases 1–3 e 172×96 para a câmara) para compatibilidade total sob `file://`. `data/labirinto.json` guarda os dados e config mantém seu espelho. Os três cruzamentos usam cenários 1024×434 (`assets/puzzles/labirinto/fase1_v3.webp`, `fase2_v3.webp`, `fase3_v3.webp`, com versões antigas `_v2` preservadas em `_lixeira/historico/`) e lajes de pedra gravadas (`assets/puzzles/simbolos/laje-*.webp`). Enquadramento em cover centralizado com zona segura horizontal x entre 12% e 88%; em telas mais estreitas que 16:9 (16:10, 4:3), o clamp de escala preserva a zona segura e preenche sobras verticais com a imagem borrada e escurecida. Spawn em (512, 400). Estados visuais: repouso com brilho suave, ativação/memorização com brilho forte, acerto com partículas/brilho intenso e erro com tremor/flash vermelho. Após o terceiro cruzamento, a câmara (1376×768) permite pegar a chave a até 100 px dos pés do pedestal por E/Enter/toque; a personagem segue por BFS até o portal desviando do pedestal, diminui em 0,6 s e a tela clareia em 0,4 s antes de `onExit(true)`. O painel provisório foi removido. Esc/X sempre chamam `onExit(false)`; reiniciar sorteia outra sequência e volta ao caminho 1. F3 é local (overlay da grade, zonas de ativação em verde/amarelo, nomes das runas e coordenadas) e N exige debug para avançar/coletar. Movimento e blur não cancelam a caminhada automática. Fontes antigas e imagens estão intactas.';

agentsLines[55] = '- As colisões do labirinto usam a grade pré-calculada de 128×55 células (8×8 px) nos cruzamentos e 172×96 na câmara. O vetor de movimento é dividido em subpassos de até 1 px, testando X e depois Y em cada subpasso, bloqueando sebes e árvores e contendo a personagem nos limites da tela nas saídas. Autotestes verificam 300 sorteios sem distratores duplicados, spawn, cobertura (14,4% na fase 1, 15,7% na fase 2 e 21,3% na fase 3) e alcance BFS de todos os pedestais, arcos e alvos com obstáculo via `_lixeira/tools/gerar-grades-labirinto.cjs`. Ver README para testar.';

fs.writeFileSync(agentsPath, agentsLines.join(eol), 'utf8');

const readmePath = 'README.md';
let readme = fs.readFileSync(readmePath, 'utf8');
const isCRLFR = readme.includes('\r\n');
const eolR = isCRLFR ? '\r\n' : '\n';
let readmeLines = readme.split(/\r?\n/);

readmeLines[32] = 'Lógica — Checkpoint 2: `js/labirinto-puzzle.js` controla os três cruzamentos, a câmara, a coleta da chave e a saída pelo portal; `js/labirinto-logica.js` contém sorteio, colisão e BFS. `js/labirinto-mascaras.js` fornece as grades de colisão pré-calculadas (128×55 células de 8×8 px para as fases 1–3 e 172×96 para a câmara) para compatibilidade total sob `file://` sem `getImageData` em tempo de execução. `data/labirinto.json` guarda coordenadas e métricas (1024×434 px); `js/config.js` mantém seu espelho. `loadMemoryMaze()` prepara a cena nova; `island-game.js`, o labirinto antigo e as imagens foram preservados.';

readmeLines[36] = 'Cenários e lajes de símbolos: os cruzamentos usam as cenas em 1024×434 nativo (proporção ~2,36:1: `assets/puzzles/labirinto/fase1_v3.webp`, `fase2_v3.webp`, `fase3_v3.webp`), com versões anteriores v2 preservadas em `_lixeira/historico/`. A câmara usa `camara_chave_bg.jpg` (1376×768). As lajes gravadas (`assets/puzzles/simbolos/laje-*.webp`) são renderizadas sobre os pedestais de pedra com assentamento centralizado e suavização em alta qualidade (`imageSmoothingEnabled = true`). A heroína nasce na soleira do caminho inferior em (512, 400). A exibição usa enquadramento cover centralizado com zona segura horizontal x entre 12% e 88% (122,9 px a 901,1 px), mantendo todos os pedestais e arcos 100% visíveis em celulares ultrawide (20:9) e 16:9; em telas com proporção abaixo de 16:9 (como 16:10 e 4:3), o clamp de escala garante visibilidade total da zona segura e as sobras verticais são preenchidas pelo fundo ampliado, borrado e escurecido (`filter: blur(16px) brightness(0.4)`), sem barras pretas:';

readmeLines[43] = 'Estados visuais: repouso (brilho suave na cor da runa), ativação/memorização (brilho forte radial), acerto (brilho intenso, opacidade total e explosão de partículas coloridas, com distratores atenuados a 0.35) e erro (tremor horizontal e flash vermelho). Posições dos pedestais e arcos (em pixels 1024×434): fase 1 com 2 saídas nas laterais (pedestais em 369, 172 e 661, 171; arcos em 205, 170 e 830, 170); fase 2 com 3 saídas (topo 516, 82 e arco 516, 45; laterais 369, 171 e 662, 171 com arcos 205, 170 e 830, 170); fase 3 com 4 saídas (topo-esq 429, 82 e arco 420, 45; topo-dir 602, 82 e arco 604, 45; laterais 368, 171 e 664, 171 com arcos 205, 170 e 830, 170). Spawn em (512, 400).';

readmeLines[45] = 'Validação do CP2: autoteste de 300 sorteios sem distratores duplicados; verificação automatizada por BFS (`node _lixeira/tools/gerar-grades-labirinto.cjs`) confirmando 100% de alcance a partir do spawn para todos os pedestais e arcos nas fases 1 a 3, e para o pedestal, chave e portal na câmara contornando o obstáculo. Cobertura de caminho caminhável: 14,41% na fase 1 (64.053 px), 15,70% na fase 2 (69.752 px) e 21,26% na fase 3 (94.472 px). Testes de colisão com sebes e árvores comprovam bloqueio lateral e contenção nos limites da tela. Validação visual e de gameplay no Chrome Headless cobrindo 20:9, 16:9, 16:10 (com blur) e 4:3 (com blur) e caminhada real até os arcos. Sintaxe validada via `node --check`.';

fs.writeFileSync(readmePath, readmeLines.join(eolR), 'utf8');
console.log('Script updated AGENTS.md and README.md with perfect backticks and paths.');

