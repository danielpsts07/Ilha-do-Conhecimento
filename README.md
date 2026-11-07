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

Controles: WASD/setas no teclado físico (E interage, M abre o mapa, Escape pausa e F3 mostra coordenadas e região). Na tela da ilha, os controles táteis em pixel art (`assets/hud/controles/`) incluem direcional em cruz com setas individuais (`seta-*.webp`), joystick analógico (`joystick-base.webp`, `joystick-manche.webp`) e botão de ação com o "E" desenhado (`botao-interagir.webp`). Estados visuais gerenciados por CSS: pulso suave de escala ao aproximar-se de placas/chaves, escurecimento e rebaixamento ao pressionar (`:active` e `.is-pressed`), opacidade atenuada em repouso e fallback sólido (fundo `#f7e3bf` e borda `#8c6f48`). Regra de exibição: a escolha do jogador em Configurações prevalece sobre qualquer detecção de dispositivo (sem ocultação por pointer, hover ou largura de tela), gerenciada pelo atributo `data-touch-mode` em `#island-screen` (`arrows`, `joystick` ou `off`), com atualização imediata sem recarregar a página. Na tela de Controles das Configurações, as opções "Setas" e "Joystick" trazem as novas miniaturas em pixel art (`setas-completo.webp`).
Fundo intacto: `assets/ilha/ilha.jpeg`, escala 0,6 e personagem de 40 px. Colisão usa água automática e `assets/ilha/island_mask.png`; os pontos antigos aguardam reposicionamento.
Regiões da ilha: o mapa é dividido em 6 ambientes com zonas em coordenadas da imagem (2752 × 1536) definidas em `js/config.js` (`ISLAND_REGIONS`):
- `Praça do Portal` (centro, spawn): `[1080, 760, 500, 776]`
- `Pico do Miau` (norte, penhascos e escadas): `[1080, 0, 500, 760]`
- `Floresta dos Padrões` (noroeste, labirinto): `[0, 0, 1080, 760]`
- `Aldeia do Saber` (sudoeste, biblioteca e casas): `[0, 760, 1080, 776]`
- `Ruínas das Formas` (nordeste, deserto e pirâmides): `[1580, 0, 1172, 760]`
- `Campos Contados` (sudeste, moinho e fazenda): `[1580, 760, 1172, 776]`
Ao trocar de região (ou ao iniciar a aventura), a placa de pergaminho (`.island-place`) realiza fade-in (~300 ms), permanece por 5 s e realiza fade-out (~400 ms), ficando oculta e sem bloquear cliques fora da exibição. Histerese de fronteira exige penetração de 24 px ou 150 ms estável para evitar oscilações; áreas externas mantêm a região anterior por fallback. Leitores de tela recebem o anúncio a cada troca via `#island-announcement`. O painel F3 exibe a região ativa.
As quatro chaves do mapa usam as posições de imagem em `js/config.js`, com ajuste à célula livre mais próxima em até 40 células e diagnóstico BFS no console. `js/island-keys.js` carrega imagens e brilhos uma vez e mantém a coleta em memória, separada das recompensas dos puzzles existentes.
Perto de uma chave ou da cela liberada, E abre a cena registrada em `PuzzleScenes`, sem mostrar o painel DEV (preservado apenas como fallback sem cena). `js/dev-puzzle-screen.js` cobre abertura e fechamento com fades de 250 ms; aguarda prepare/primeiro desenho, mostra Carregando após 250 ms de espera e bloqueia input/foco até terminar. Falha ou 10 s de carregamento devolvem à ilha com aviso. A pré-carga sequencial começa durante a exploração em idle/intervalos de 300 ms, compartilha as Promises da abertura e registra `puzzle X pronto em N ms`. F3 e depois K, na ilha, restauram as quatro chaves de teste. Recarregar reinicia a coleta; retornar ao menu a preserva nesta sessão.

Teste das transições: abra cada chave com E, segure E/movimento durante o fade e feche por Esc/X ou conclusão; nenhum painel DEV deve aparecer e o foco só volta ao fim. Após a pré-carga, a abertura leva cerca de 0,5 s sem Carregando. Para simular espera/erro pelo console, guarde o carregador com `const carregar = PuzzleScenes.algebra`, substitua-o por `() => new Promise(resolve => setTimeout(() => carregar().then(resolve), 2000))` ou `() => Promise.reject(new Error('teste'))` e pressione E na chave azul. Use `() => new Promise(() => {})` para conferir o limite de 10 s; depois restaure `PuzzleScenes.algebra = carregar`. Verifique aviso, retorno do controle e ausência de abertura tardia.

Lógica — Checkpoint 2: `js/labirinto-puzzle.js` controla os três cruzamentos, a câmara, a coleta da chave e a saída pelo portal; `js/labirinto-logica.js` contém sorteio, colisão e BFS. `js/labirinto-mascaras.js` fornece as grades de colisão pré-calculadas (128×55 células de 8×8 px para as fases 1–3 e 256×109 para a câmara) para compatibilidade total sob `file://` sem `getImageData` em tempo de execução. `data/labirinto.json` guarda coordenadas e métricas (1024×434 px); `js/config.js` mantém seu espelho. `loadMemoryMaze()` prepara a cena nova; `island-game.js`, o labirinto antigo e as imagens foram preservados.

Para testar: abra `index.html`, Iniciar, aproxime-se da chave verde de Lógica e pressione E. Memorize a ordem dos três símbolos durante 4 s (ou use **Já memorizei** após 1,5 s). Use WASD/setas ou toque no caminho e escolha a 1ª, 2ª e 3ª laje nos cruzamentos com 2, 3 e 4 saídas. Uma saída errada mantém a sequência, refaz apenas o cruzamento atual e embaralha os pedestais; acertar segue sem nova memorização. Na câmara, a chave flutua sem pedestal no centro da praça (512, 218.2) com oscilação suave de ±5.2 px (período 2,4 s), sombra elíptica e brilho suave. Aproxime-se até 39 px da vaga central (ou pressione E/Enter ou toque na chave/botão). A chave sobe com partículas e desaparece; a menina segue sozinha por BFS até a soleira do portal (512, 160), diminui e some; a transição branca chama o contrato de vitória já existente, com recompensa, HUD e teleporte. A recompensa só ocorre ao terminar o portal. O painel provisório foi removido. Esc/X saem sem recompensa, inclusive durante a coleta/portal; ↻ reinicia do primeiro caminho. F3 liga a depuração local e N simula o acerto do caminho ou a coleta na câmara apenas com F3 ligado. Sem som nem progresso salvo.

Cenários e lajes de símbolos: os cruzamentos usam as cenas em 1024×434 nativo (proporção ~2,36:1: `assets/puzzles/labirinto/fase1_v3.webp`, `fase2_v3.webp`, `fase3_v3.webp`), com versões anteriores v2 preservadas em `_lixeira/historico/`. A câmara usa `camara_chave_bg.jpg` (1376×768). As lajes gravadas (`assets/puzzles/simbolos/laje-*.webp`) são renderizadas sobre os pedestais de pedra com assentamento centralizado e suavização em alta qualidade (`imageSmoothingEnabled = true`). A heroína nasce na soleira do caminho inferior em (512, 400). A exibição usa enquadramento cover centralizado com zona segura horizontal x entre 12% e 88% (122,9 px a 901,1 px), mantendo todos os pedestais e arcos 100% visíveis em celulares ultrawide (20:9) e 16:9; em telas com proporção abaixo de 16:9 (como 16:10 e 4:3), o clamp de escala garante visibilidade total da zona segura e as sobras verticais são preenchidas pelo fundo ampliado, borrado e escurecido (`filter: blur(16px) brightness(0.4)`), sem barras pretas:
- `lua` → `laje-lua.webp` (#38bdf8)
- `estrela` → `laje-estrela.webp` (#facc15)
- `flor` → `laje-flor.webp` (#f472b6)
- `pata` → `laje-pata.webp` (#fb923c)
- `borboleta` → `laje-borboleta.webp` (#a855f7)
- `folha` → `laje-folha.webp` (#4ade80)
Estados visuais: repouso (brilho suave na cor da runa), ativação/memorização (brilho forte radial), acerto (brilho intenso, opacidade total e explosão de partículas coloridas, com distratores atenuados a 0.35) e erro (tremor horizontal e flash vermelho). Posições dos pedestais e arcos (em pixels 1024×434): fase 1 com 2 saídas nas laterais (pedestais em 369, 172 e 661, 171; arcos em 205, 170 e 830, 170); fase 2 com 3 saídas (topo 516, 82 e arco 516, 45; laterais 369, 171 e 662, 171 com arcos 205, 170 e 830, 170); fase 3 com 4 saídas (topo-esq 429, 82 e arco 420, 45; topo-dir 602, 82 e arco 604, 45; laterais 368, 171 e 664, 171 com arcos 205, 170 e 830, 170). Spawn em (512, 400).

Validação do CP2: autoteste de 300 sorteios sem distratores duplicados; verificação automatizada por BFS (`node _lixeira/tools/gerar-grades-labirinto.cjs`) confirmando 100% de alcance a partir do spawn para todos os pedestais e arcos nas fases 1 a 3, e para o disco da chave e portal na câmara. Cobertura de caminho caminhável: 14,41% na fase 1 (64.053 px), 15,70% na fase 2 (69.752 px) e 21,26% na fase 3 (94.472 px). Testes de colisão com sebes e árvores comprovam bloqueio lateral e contenção nos limites da tela. Validação visual e de gameplay no Chrome Headless cobrindo 20:9, 16:9, 16:10 (com blur) e 4:3 (com blur) e caminhada real até os arcos. Sintaxe validada via `node --check`.
Pontos antigos (mundo): guia (2424,2088), portal (2136,2088), floresta (1032,1128), vila (1272,2616), ruínas (3720,1176), fazenda (3768,2616), montanha (2328,552).

## Tela cheia e Configurações

- Tela cheia: `html`, `body`, `.game-shell` e `.island-screen` usam `100dvh` (fallback `100vh`) e `overflow: hidden`; o viewport tem `viewport-fit=cover` e HUD, cantos e fechar respeitam `env(safe-area-inset-*)`. O canvas da ilha reajusta em `resize`, `orientationchange` e `visualViewport` (câmera, escala 0,6 e personagem de 40 px intactos).
- Configurações (`#book-dialog`): reformulado com o tema Mural de Cortiça. O palco tem proporção 1024 × 572 em cover, corte vertical ancorado em 30% topo / 70% base, zona segura protegida (x 18% a 84%, y 6% a 86%) e sobras preenchidas com o fundo borrado e escurecido. A cortiça (55,3% × 60,3%) usa `container-type: size` e medidas relativas (`cqw`/`cqh`), eliminando barras de rolagem. A tela inicial do mural conta com placa de título suspensa, grade 4×2 de cartões temáticos com leve rotação (-1,5° a +1,5°) e barra de ações (Continuar e Restaurar padrões). Os submenus abrem sobre a folha pautada (`folha-caderno-com-gato.webp`) via transição FLIP (450 ms; 150 ms em modo calmo), com layout em fluxo (flex/grid): cabeçalho estruturado (`#settings-back` em pílula contrastante de toque ≥ 48 px e texto ≥ 18 px, título ≥ 20 px), introdução com respiro reservado e conteúdo adaptativo à esquerda respeitando a margem vermelha e a reserva do gato (`x >= 72%` e `y >= 60%`). Tipografia fluida com `clamp()` e mínimos legíveis (corpo ≥ 14 px, títulos ≥ 20 px), sem barras de rolagem em todas as resoluções (667×375 até 1920×1080 com e sem "Letras maiores"). Botão fechar (56 px) fixo no canto superior direito respeitando safe areas. Inclui modo de diagnóstico visual `?calibrar`. Histórico do livro preservado em `_lixeira/historico/menu-livro/`. Imagens do fundo e peças de interface foram geradas por IA.
- Tutorial (`#tutorial-view`): reformulado para viver dentro do tema Mural de Cortiça, compartilhando a folha pautada (`folha-caderno-com-gato.webp`) e container queries. Bloco de conteúdo centralizado vertical e horizontalmente entre o cabeçalho e a barra inferior, com altura comum reservada de 48cqh nas duas colunas (sem saltos de layout ao trocar de etapa). Em paisagem, usa layout em duas colunas com gap de 3.5–4cqw: esquerda com cabeçalho seguro abaixo do alfinete e da fita ('COMO JOGAR 01 / 03'), título com clamp(24px, 3.2cqw, 32px), texto de corpo com max-width de 34ch, guia de teclas WASD em cruz com teclas mecânicas estilizadas (`kbd`) e legenda legível logo abaixo, e dica em caixa destacada (`#tutorial-tip`); direita com moldura de prática contida na folha para movimento (área de 16:10 ocupando ~42–45% da altura útil, com grama, árvore, personagem e botões de seta em teclas estilo WASD em cruz), interação (caixa em 16:10, personagem e chave ampliados, pedestal, botão 'Interagir E' com largura fit-content centralizado e mensagem de resultado) e regiões (grade 2×2 com botões ampliados, descrição dinâmica e gato de resgate). Barra inferior com Voltar ('Voltar ao menu' na etapa inicial e 'Voltar' nas demais; altura ≥ 48 px, texto ≥ 18 px), pontinhos de etapa com alvo de toque de 28 px e botão verde Próxima ('Próxima' / 'Entendi!'; altura ≥ 48 px, texto ≥ 18 px). Proteção estrita da reserva do gato (`x >= 72%` e `y >= 60%`) e suporte a retrato (empilhamento em uma coluna), sem rolagem em todas as resoluções testadas (667×375 até 1920×1080 com e sem "Letras maiores").
- Movimento em 8 direções e redução de passo com troca imediata: a ilha utiliza a folha unificada `assets/personagem/personagem_spritesheet_8_direcoes_v2.png` (192×448 px, 4 colunas × 8 linhas de 48×56 px, pés em 24, 52) com ciclo de 4 quadros (0 parado, 1 passo A, 2 parado, 3 passo B) a 7,5 quadros/s (8 ticks por quadro) por tempo contínuo (`animTime += dt`). Ao parar, fixa a coluna 0 preservando a direção olhada. O passo foi reduzido a 1/4 do valor anterior: `STEP_TILE = 32 * (0.5 - 0.17) / 4` (≈ 2,64 px de mundo, 4,4 px de imagem) com 4 ticks por passo na reta e 6 ticks na diagonal normalizada, mantendo a velocidade média estritamente inalterada (39,6 px/s na reta e 37,3 px/s na diagonal). A troca de direção é imediata no mesmo tick da nova tecla/comando, recalculando o vetor de destino a partir da posição atual sem terminar o passo antigo (latência ≤ 1 tick / 16,7 ms). Entrada por teclado: WASD suporta diagonais em ordem de pressão; setas direcionais são restritas a 4 direções ortogonais (a última pressionada prevalece, nunca diagonal). Tolerância de 50 ms ao soltar diagonais do WASD. Joystick analógico com zona morta histerética (0,25/0,20) e histerese angular de 6°. Colisão resolve eixos X e Y separadamente com deslizamento em paredes e bloqueio de quinas. O painel F3 exibe linha, coluna, velocidade real (px/s), distância percorrida desde o comando, estado andando, setor e `animTime`. Testes automatizados em `walk-animation.test.js`, `scratch/test-step-reduction.cjs` e `scratch/test-browser-acceptance.cjs`.

## Áudio e Gerenciador de Música

- **Gerenciador central (`js/music.js`)**: singleton `window.Music` responsável pela reprodução de trilhas musicais no jogo, desacoplado da lógica interna dos puzzles e 100% compatível com execução local via `file://` (sem `fetch`, sem bibliotecas externas e sem dependências de compilação).
  - **API Pública**:
    - `Music.entrarNaCena(nome)`: inicia a trilha mapeada para a cena com fade-in suave (800 ms). Se a cena atual já estiver com a mesma faixa tocando (ex.: avanço de fase ou transição para a câmara da chave), a música continua sem interrupção nem reinício.
    - `Music.sairDaCena(nome)`: realiza fade-out suave (600 ms), pausa a reprodução e redefine `currentTime = 0`.
    - `Music.atualizarVolume()`: recalcula o volume em tempo real baseado nas preferências ativas de `#music-volume` e `#toggle-mute`.
    - `Music.precarregarFaixa(faixaId)` / `Music.precarregarCena(nome)`: pré-carrega os arquivos com `audio.load()`.
    - `Music.isTocando()`: informa se há música sendo reproduzida no momento.
  - **Como adicionar novas trilhas**:
    1. Registre os arquivos e o ganho em `FAIXAS`:
       ```javascript
       FAIXAS.minha_faixa = {
         arquivos: ['assets/audio/minha-faixa.ogg', 'assets/audio/minha-faixa.mp3'],
         ganho: 1.0 // ajuste de ganho se a gravação for mais alta ou mais baixa
       };
       ```
    2. Mapeie as cenas correspondentes em `CENAS`:
       ```javascript
       CENAS.operacoes = 'minha_faixa';
       ```
    3. Chame `window.Music.entrarNaCena('operacoes')` e `window.Music.sairDaCena('operacoes')` na abertura e encerramento do puzzle.
- **Trilha exclusiva do Labirinto (Floresta)**:
  - Arquivo primário: `assets/audio/musica-labirinto.ogg` (Opus, 48 kHz, estéreo, exatamente 90,000 s).
  - Arquivo reserva: `assets/audio/musica-labirinto.mp3` (fallback transparente via detecção `canPlayType`).
  - Métrica musical: 96 BPM em 4/4 (90 s correspondem com exatidão a 36 compassos de 4 tempos, garantindo emenda sem perda de pulso).
  - Modo de loop: `LOOP_MODO = 'nativo'` (`audio.loop = true`). A emenda de 90 s repete de forma contínua e sem engasgos perceptíveis.
- **Ciclo de vida e navegação**:
  - Entrada: fade-in suave de 0 até o volume final ao longo de 800 ms.
  - Persistência: a música permanece contínua sem reiniciar ao avançar entre os cruzamentos (fases 1 → 2 → 3), ao reiniciar o desafio no botão (↻), ao abrir o menu de Configurações sobre a cena ou durante pausas.
  - Câmara da chave: ao concluir o 3º cruzamento e entrar na câmara ("Pegue a chave!"), a cena transiciona para `camara` mapeada para `FAIXA_CENA_CHAVE = 'labirinto'`, mantendo a música contínua.
  - Saída: fade-out suave de 600 ms até 0, pausando e zerando `currentTime = 0` ao clicar em X, pressionar Escape, cruzar o portal de saída concluído ou qualquer saída programática.
  - Proteção contra saída/entrada rápida: tokens sequenciais (`fadeToken`) invalidam imediatamente fades anteriores, impedindo sobreposição ou encerramentos tardios indevidos.
- **Configurações e Volume**:
  - Fórmula: `volumeFinal = (musicVolume / 100) * (muted ? 0 : 1) * MUSIC_GANHO_MESTRE * ganhoFaixa`, com `MUSIC_GANHO_MESTRE = 0.8` e ganho da faixa 1.0 (resultando em 0.28 no padrão de 35%).
  - O slider "Som" (#sound-volume) afeta unicamente efeitos sonoros, sem interferir na música.
  - Ajustes em tempo real: movimentar o controle deslizante de Música ou alternar Silenciar com o labirinto aberto atualiza o volume instantaneamente.
  - Acessibilidade e Resiliência: modo "Menos animações" (`calm`) aplica volumes de forma imediata (sem rampa de fade); bloqueios de autoplay pelo navegador são capturados sem erro e retomados no primeiro clique/toque/tecla do usuário; abas em segundo plano pausam o áudio e o retomam com fade suave ao retornar; o botão "Ouvir música de teste" de `js/audio.js` é bloqueado enquanto o labirinto estiver ativo para evitar sobreposição.
- **Testes automatizados**: suíte completa em `scratch/test-music-manager.cjs` com 10 testes cobrindo todo o ciclo de vida, idempotência, fades, configurações, resiliência e bloqueio de teste.

## Áudio e Música de Geometria

- **Trilha exclusiva de Geometria**: `assets/audio/musica-geometria.ogg` (Opus 48 kHz estéreo) com fallback transparente para `musica-geometria.mp3`.
- **Ciclo de reprodução**: toca exclusivamente dentro da tela do puzzle de Geometria, iniciando após o fade de entrada de 250 ms e pausando com fade-out suave (~0,7 s) e reset para `currentTime = 0` ao sair (botão X, tecla Escape, botão "Voltar à ilha" ou vitória do puzzle). Reabrir a tela recomeça a música do início.
- **Configurações e Volume**: ao abrir o livro de Configurações sobre o puzzle de Geometria, a música segue tocando e responde imediatamente às alterações de `#music-volume` (padrão 35%) e `#toggle-mute`. O botão "Ouvir música de teste" é desabilitado/bloqueado enquanto Geometria estiver aberta para impedir sobreposição de áudio.
- **Resiliência e Acessibilidade**:
  - Instância única de `HTMLAudioElement` reutilizada (`preload="auto"`, sem uso de `fetch` para compatibilidade `file://`).
  - Detecção de formato com `canPlayType` priorizando OGG/Opus sobre MP3.
  - Fade-in de 1,0 s e fade-out de 0,7 s; em modo "Menos animações" (`calm`), a troca de volume é imediata.
  - Autoplay bloqueado é tratado de forma silenciosa e rearmado para iniciar no primeiro clique/toque do jogador.
  - Aba em segundo plano (`document.visibilitychange`) pausa a trilha e retoma ao voltar.
  - Falhas de arquivo são capturadas com aviso discreto no console, mantendo o puzzle plenamente jogável sem som.
  - Coexistência com música tema: pontos de extensão (`pauseThemeMusic` / `resumeThemeMusic`) integrados para pausar a música tema ao entrar em Geometria e retomá-la ao sair, sem nunca sobrepor ambas.
- **Testes automatizados**: suíte em `scratch/test-geometria-audio.cjs` cobrindo 11 casos de teste (ciclo, volume, fade, mute, visibility, autoplay, calma, bloqueio de teste e isolamento entre fases).

## Cartão de Tutorial dos Puzzles (Álgebra, Geometria e Raciocínio Lógico)

- **Arquitetura e Módulos**:
  - `js/tutorial-card.js`: modal acessível (`role="dialog"`, `aria-modal="true"`) genérico e dirigido por dados, com controle de passos, bolinhas de etapa (`ponto-ativo.webp` / `ponto-inativo.webp`), botões `"Voltar"`, `"Próximo"` / `"OK"` e `"Fechar"` (`×`), retenção de foco (`Tab`), atalhos de teclado (`Escape` fecha só o cartão; `←`/`→` trocam de passo) e memória de sessão (`TUTORIAL_FREQUENCIA = 'primeira-vez-na-sessao'`).
  - `js/tutorial-demos.js`: motor de demonstração em Canvas 2D no palco `815 × 526` px (`1,55:1`), com suporte a `prefers-reduced-motion` / modo calmo (quadro estático com setas pontilhadas e botão `"Ver de novo"`), alinhamento exato das âncoras da mão (`mao-apontando`: `x=0.19, y=0.02`; `mao-pressionando`: `x=0.38, y=0.10`, escala `0.18`), anéis de toque (`toque-1..3`), selos (`selo-certo`, `selo-erro`, `selo-reiniciar`) e brilhos (`brilho-1..3`).
  - `js/tutorial-data.js`: catálogo declarativo dos passos e textos de cada puzzle (sem JSON, compatível com `file://`).
  - `css/tutorial-card.css`: layout responsivo sobre `assets/tutorial/tutorial-cartao.webp` (`1373 × 1116`, área segura x `8%–92%`, y `16%–94%` preservando o pino no topo) e `assets/tutorial/tutorial-moldura-video.webp` (`1008 × 751`, janela transparente em x `9,5%–90,3%`, y `14,2%–84,2%`).
- **Tutorial do Puzzle de Geometria (3 passos: `"Próximo"`, `"Próximo"`, `"OK"`)**:
  - Abre automaticamente ao entrar em Geometria antes da primeira rodada começar, mantendo o puzzle parado atrás até fechar; o botão `?` (`botao-ajuda-normal.webp` / `botao-ajuda-pressionado.webp`) no HUD (ao lado de `↻` e `×`) reabre o cartão no 1º passo a qualquer momento.
  - **Passo 1 — "Arraste a peça"** (*"Puxe a peça até o lugar de encaixe."*, `geometria-arrastar`, ~8 s): mostra o tabuleiro reduzido do Ciclo 1 (4×3) com as peças reais (`peca_02.png`, `peca_05.png`) e o encaixe vazio destacado; a mão pega `peca_04.png` na barra inferior (levanta com escala `1,08` e sombra), arrasta em arco até o encaixe (que pulsa em verde), solta com pequeno quique, selo `"certo"` e brilhos.
  - **Passo 2 — "Gire a peça"** (*"Toque na peça da barra para ela girar."*, `geometria-girar`, ~8 s): mostra a peça na barra em rotação diferente da silhueta-alvo ao lado; a mão toca duas vezes (com anel de toque e selo `"reiniciar"` ao lado), girando 90° por toque (~250 ms de easing) até corresponder à silhueta, exibindo selo `"certo"` e brilhos.
  - **Passo 3 — "Tire a peça"** (*"Toque numa peça já encaixada e ela volta para a barra."*, `geometria-tirar`, ~7 s): mostra a peça já encaixada no tabuleiro e a vaga na barra inferior; a mão toca na peça encaixada (anel de toque), que voa em arco de volta ao seu lugar na barra (~500 ms), deixando o encaixe vazio e destacado novamente.
- **Tutorial do Puzzle de Raciocínio Lógico — Labirinto das Runas (2 passos: `"Próximo"`, `"OK"`)**:
  - Abre automaticamente ao entrar no labirinto **antes** de a sequência de runas acender (`MEMORIZAR`), mantendo o puzzle e a contagem da sequência parados até o cartão fechar; o botão `?` no HUD reabre o cartão e fica **desativado** enquanto a sequência de runas está acendendo (`state === 'MEMORIZAR'`), habilitando assim que o jogador pode andar (`ANDAR`).
  - **Passo 1 — "Siga a ordem das runas"** (*"Veja quais runas acendem. Depois vá até elas na mesma ordem!"*, `logica-ordem`, ~11 s): usa `assets/puzzles/floresta/cenario-2-runas.webp` em `cover` centralizado com duas lajes reais (`laje-estrela.webp` em `16,8%; 39,4%` e `laje-lua.webp` em `83,5%; 39,4%`). Acende Estrela (`"1"`) e Lua (`"2"`), depois a personagem caminha de `(50%; 89,6%)` **só até a 1ª runa (a Estrela)** e para, acendendo apenas a 1ª das 2 bolinhas de progresso com `"selo-certo"` e brilhos.
  - **Passo 2 — "Errou? Volta ao início"** (*"Se for na runa errada, você volta ao começo. Sem problema: tente de novo!"*, `logica-erro`, ~12 s): acende Estrela (`"1"`) e Lua (`"2"`), a personagem caminha até a runa errada primeiro (a Lua), exibe `"selo-erro"` com tremor (`±6 px`, `400 ms`) e flash avermelhado leve, e reproduz o comportamento real de erro do labirinto (escurece em `0,4 s` e clareia de volta no início com as bolinhas apagadas e `"selo-reiniciar"` sobre a personagem).
- **Testes automatizados**: `node scratch/test-tutorial-card.cjs`, `node scratch/test-algebra-tutorial-integration.cjs`, `node scratch/test-geometria-tutorial-integration.cjs`, `node scratch/test-logica-tutorial-integration.cjs` e `node _lixeira/tools/verificar-puzzles.cjs`.
