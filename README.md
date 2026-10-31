# Ilha do Conhecimento

Jogo educativo em HTML, CSS e JavaScript puros, com assets locais; sem instalação, build ou dependências de execução.

Abra `index.html` no navegador e selecione **Iniciar**.
Servidor opcional, na raiz: `python -m http.server 8765 --bind 127.0.0.1`; acesse `http://127.0.0.1:8765`.

```text
index.html
css/                         estilos
js/                          módulos atuais, com nomes preservados
assets/{tela-inicial,configuracoes,ilha,personagem,hud,puzzles,final}/
referencia/                  documentação, fontes e material de consulta
_lixeira/                    arquivos antigos, tools, ambiente Python e caches
AGENTS.md  README.md  .gitignore  .gitattributes
```

Controles: WASD/setas e toque; E interage, M abre o mapa, Escape pausa e F3 mostra coordenadas da imagem.
Fundo intacto: `assets/ilha/ilha.jpeg`, escala 0,6 e personagem de 40 px. Colisão usa água automática e `assets/ilha/island_mask.png`; os pontos antigos aguardam reposicionamento.
As quatro chaves do mapa usam as posições de imagem em `js/config.js`, com ajuste à célula livre mais próxima em até 40 células e diagnóstico BFS no console. `js/island-keys.js` carrega imagens e brilhos uma vez e mantém a coleta em memória, separada das recompensas dos puzzles existentes.
Perto de uma chave ou da cela liberada, E abre a cena registrada em `PuzzleScenes`, sem mostrar o painel DEV (preservado apenas como fallback sem cena). `js/dev-puzzle-screen.js` cobre abertura e fechamento com fades de 250 ms; aguarda prepare/primeiro desenho, mostra Carregando após 250 ms de espera e bloqueia input/foco até terminar. Falha ou 10 s de carregamento devolvem à ilha com aviso. A pré-carga sequencial começa durante a exploração em idle/intervalos de 300 ms, compartilha as Promises da abertura e registra `puzzle X pronto em N ms`. F3 e depois K, na ilha, restauram as quatro chaves de teste. Recarregar reinicia a coleta; retornar ao menu a preserva nesta sessão.

Teste das transições: abra cada chave com E, segure E/movimento durante o fade e feche por Esc/X ou conclusão; nenhum painel DEV deve aparecer e o foco só volta ao fim. Após a pré-carga, a abertura leva cerca de 0,5 s sem Carregando. Para simular espera/erro pelo console, guarde o carregador com `const carregar = PuzzleScenes.algebra`, substitua-o por `() => new Promise(resolve => setTimeout(() => carregar().then(resolve), 2000))` ou `() => Promise.reject(new Error('teste'))` e pressione E na chave azul. Use `() => new Promise(() => {})` para conferir o limite de 10 s; depois restaure `PuzzleScenes.algebra = carregar`. Verifique aviso, retorno do controle e ausência de abertura tardia.

Lógica — Checkpoint 2: `js/labirinto-puzzle.js` controla os três cruzamentos, a câmara, a coleta da chave e a saída pelo portal; `js/labirinto-logica.js` contém sorteio, colisão e BFS. `data/labirinto.json` guarda runas e coordenadas; `js/config.js` mantém seu espelho e os espelhos PNG binários das máscaras para funcionar também em `file://`. Ao mudar as máscaras, atualizar seus espelhos (alfa >40) em config. `loadMemoryMaze()` prepara a cena nova; `island-game.js`, o labirinto antigo e as imagens foram preservados.

Para testar: abra `index.html`, Iniciar, aproxime-se da chave verde de Lógica e pressione E. Memorize as três runas durante 4 s (ou use **Já memorizei** após 1,5 s). Use WASD/setas ou toque no caminho e escolha a 1ª, 2ª e 3ª runa nos cruzamentos com 2, 3 e 4 saídas. Uma saída errada mantém a sequência, refaz apenas o cruzamento atual e embaralha os pedestais; acertar segue sem nova memorização. Na câmara, aproxime-se até 100 px dos pés do pedestal e pressione E/Enter ou toque na chave/botão. A chave sobe e desaparece; a menina segue sozinha até o portal, contornando o pedestal, diminui e some; a transição branca chama o contrato de vitória já existente, com recompensa, HUD e teleporte. A recompensa só ocorre ao terminar o portal. O painel provisório foi removido. Esc/X saem sem recompensa, inclusive durante a coleta/portal; ↻ reinicia do primeiro caminho. F3 liga a depuração local e N simula o acerto do caminho ou a coleta na câmara apenas com F3 ligado. Sem som nem progresso salvo.

Os fundos definitivos são `fase1_v2.webp`, `fase2_v2.webp` e `fase3_v2.webp`, carregados diretamente conforme autorizado pelo usuário; a câmara usa `camara_chave_bg.jpg`. Falta apenas `pedestal_pedra.png`: o pedestal é desenhado por código, com aviso no console e na tela. As máscaras reais são carregadas uma vez. A caixa herdada é 36×36, velocidade 220 px/s e personagem 75,6 px. Os gargalos das máscaras 1/2 exigem grade BFS de 4 px sem margem extra; fase 3 e câmara usam 8 px com 4 px de margem. O vetor inteiro é dividido em subpassos de até 1 px, testando X e depois Y em cada um para evitar travar nas diagonais com intervalos maiores entre frames. Autotestes ao carregar: 300 sorteios, spawn, cobertura ≥60% e alcance de todas as zonas nas três fases; na câmara, acesso à interação, soleira e alvo exato do portal considerando o bloqueio circular.

Validação do CP2: sintaxe, funções puras, máscaras originais/espelhos, três fases por toque, erro/retomada nas fases 2/3, restrição de distância da chave, coleta por E/Enter/toque/botão, caminhada automática com bloqueio do pedestal, comandos/perda de foco e redimensionamento durante portal, toque com DPR 2 e margem vertical, menos animações, reinício, X/Esc e limpeza dos listeners em DOM simulado. A integração real dos controladores simulados confirma E → cena → três caminhos/câmara/portal → recompensa/HUD/teleporte e foco. Regressão de caminhada conferida em 144 Hz, 60 Hz e dt de 0,05 s; telas também renderizadas em Canvas offline. Acesso `file://` pelo navegador automatizado foi bloqueado pela política; layout CSS e FPS no navegador continuam pendentes. Os utilitários arquivados foram executados por wrappers temporários com raiz corrigida: menu falha em `SettingsBook` ausente na fixture, ilha em spawn sem máscara preparada e integração dos puzzles em `forest` sem posição livre; as mesmas falhas ocorrem com config anterior. O subconjunto isolado de puzzles/resgate passa. Nenhum utilitário arquivado foi alterado.
Pontos antigos (mundo): guia (2424,2088), portal (2136,2088), floresta (1032,1128), vila (1272,2616), ruínas (3720,1176), fazenda (3768,2616), montanha (2328,552).

## Tela cheia e Configurações

- Tela cheia: `html`, `body`, `.game-shell` e `.island-screen` usam `100dvh` (fallback `100vh`) e `overflow: hidden`; o viewport tem `viewport-fit=cover` e HUD, cantos e fechar respeitam `env(safe-area-inset-*)`. O canvas da ilha reajusta em `resize`, `orientationchange` e `visualViewport` (câmera, escala 0,6 e personagem de 40 px intactos). Configurações (`#book-dialog`) cobre a janela inteira; o livro (1280 × 854) escala sem esticar e as sobras mostram a mesa (cor `#27140a` + arte borrada). Até 700 px de largura vira coluna com rolagem interna e alvos de 44 px. `#settings-fullscreen` no sumário usa a Fullscreen API só após clique e fica indisponível onde não existe (ex.: iPhone). A pausa da ilha também abre Configurações; o foco volta à engrenagem.
