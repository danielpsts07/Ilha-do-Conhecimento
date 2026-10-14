# Ambientação visual — versão 4

## Direção

A ilha mantém pixel art acolhedora, personagem infantil e gato alaranjado. A nova ambientação usa madeira desgastada, telhados de cerâmica e azul, pedra com musgo, água turquesa e vegetação em tons de oliva. Iluminação e perspectiva são consistentes entre os novos elementos; pequenas diferenças de vegetação e composições por região reduzem o aspecto de cenário vazio e feito apenas de formas geométricas.

As imagens foram geradas primeiro, depois recortadas, conferidas e integradas. A origem por IA permanece registrada aqui; a mudança busca consistência visual e detalhes de ambiente, sem afirmar autoria manual das imagens.

## Fontes e preparação

ImageGen integrada ao Codex, modo padrão, produziu três atlas: construções, vegetação/objetos e terrenos. Os atlas estão em `assets/ambiente/ilha-v4/fontes/`, e os prompts exatos em `assets/ambiente/ilha-v4/prompts.md`. Os arquivos originais do kit não foram sobrescritos.

`tools/preparar_ambientacao.py` recorta os atlas em caixas medidas na imagem. O gerador não produziu linhas de sprites com alturas iguais; os recortes usam as posições reais. A normalização preserva a proporção com nearest-neighbor, margem transparente e base alinhada. A transparência original foi mantida; não há quadriculado desenhado nos sprites. O alpha é conferido na preparação.

24 sprites foram preparados:

- Casa, biblioteca, celeiro, moinho, portal, fonte, poço, arco, coluna, rochedo, horta e placa.
- Árvore de copa, cipreste, arbustos de flores e frutos, pedra com musgo, toco, flores, samambaia, banco, cerca, colheita e feno.

Seis texturas de 96 × 96 pixels foram recortadas para grama, floresta, terra, areia, pedra e água. Seus fragmentos de 48 pixels usam uma fase comum no mundo; caminhos usam o padrão da textura sobre curvas. Repetição e escala foram inspecionadas nas prévias do renderer. Não se presume que as texturas antigas do kit sejam seamless.

O catálogo específico é `assets/ambiente/ilha-v4/catalogo.html`; o contato visual é `conferencia.jpg`. Todos os assets consumidos estão dentro do projeto.

## Integração

`js/island-art.js` centraliza 39 caminhos locais: 30 novas imagens e nove assets reutilizados. `js/island-renderer.js` desenha sprites com escala uniforme, sem esticar um eixo. A personagem continua na caixa de 48 × 60; o gato do mundo usa 36 × 45 para ficar menor que a personagem. As poses não são novos ciclos de animação.

`js/island-world.js` distribui as novas imagens nas regiões existentes. Há composições de bancos e arbustos na praça, tocos e frutos na floresta, colheitas na vila, musgo nas ruínas e hortas/cercas na fazenda. Clareiras têm pequenos grupos de flores e folhas. Elementos físicos têm caixas junto à base; flores e folhas são decorativas e caminháveis. Árvores variam entre as duas novas imagens e o sprite original.

As trilhas passam a ser desenhadas com curvas e cantos arredondados sobre as superfícies caminháveis. A praça tem terreiro arredondado e piso de pedra junto à fonte. A estrutura física da ilha, o rio e as pontes são mantidos; o desenho de trilhas não muda a área geral onde é possível andar. O minimapa continua sendo esquemático.

Água, brilho da fonte, pontos de luz do portal, vegetação e partículas de pólen têm movimentos discretos. `prefers-reduced-motion` mantém esses elementos estáticos. O moinho agora usa o sprite com pás estáticas; não há novos quadros animados do moinho nesta etapa.

As formas nas ruínas e os cadeados reutilizam imagens do kit. Os desafios e o resgate final continuam em desenvolvimento. Não foi adicionada nova mecânica de gameplay.

## Verificação e prévias

`tools/renderizar-ilha.cjs` executa o renderer real com Canvas nativo para conferir imagens, proporção e profundidade. A ferramenta auxiliar usa `@napi-rs/canvas` do runtime de desenvolvimento; o jogo continua sem dependências de execução, servidor ou build.

Prévia das seis regiões e área pequena em `docs/previews/ilha-v4/`. Essas imagens foram inspecionadas. O utilitário não executa o navegador, o CSS, o áudio ou o toque real. A permissão recusada para servidor local na etapa anterior foi respeitada; nenhum novo servidor foi iniciado.

Os testes de exploração verificam novamente acesso às regiões, proximidade das interações, pontes, rio, obstáculos, velocidade, diagonais, pausa, foco e retorno. `tools/verificar-menu.cjs` continua verificando os fluxos existentes em DOM simulado.
