# Ilha principal — exploração e entrada nas fases

Este documento registra a estrutura de exploração criada na versão 3, com ambientação da versão 4 e ligação às fases de puzzle e ao resgate da versão 5. Veja `ambientacao-v4.md` para imagens e escala dos cenários e `puzzles.md` para regras das fases e do progresso.

## Escala e composição

O mundo mede 4.608 × 3.456 pixels, com células de 48 pixels. A imagem `assets/mapa/ilha-referencia.png` continua sendo referência de conceito; ela não foi ampliada nem utilizada como terreno jogável.

`js/island-world.js` define o contorno da ilha, a praia, o rio, os caminhos e duas pontes. Todas as regiões de exploração compartilham o mesmo mundo. Interagir com as quatro placas regionais abre ambientes próprios de puzzle; interagir com o gato abre a tela de resgate. Ao sair dessas telas, a personagem retorna ao ponto de onde saiu. A distribuição de vegetação usa uma função determinística: abrir o jogo novamente produz o mesmo cenário.

O início fica na praça central, perto do portal e da placa de orientação. Caminhos levam às quatro regiões e à montanha. Há uma rota adicional ao sul entre vila e fazenda. É possível explorar o terreno fora das estradas.

## Fontes visuais

- A árvore e as poses da personagem e do gato são reutilizadas do kit de assets, sem alterar os PNGs originais.
- Na versão 3, a personagem usava uma caixa de 48 × 60 pixels; a árvore, 120 × 150; e o gato, 52 × 65. A versão 4 mantém a personagem e usa gato menor, de 36 × 45, além de árvores variadas e sprites em escala uniforme.
- A versão 3 desenhava terreno, construções e objetos com primitivas de Canvas 2D. A versão 4 usa imagens locais centralizadas em `js/island-art.js`, com texturas e sprites preparados a partir de três atlas gerados com ImageGen; a origem e os prompts estão em `ambientacao-v4.md`.
- O renderer preserva proporção e transparência das imagens. As texturas de teste do kit original não são tratadas como tiles seamless; a ambientação atual usa os recortes registrados na versão 4.
- Os rótulos da interface e os textos de interação ficam em HTML. Os pequenos nomes no mapa e na fachada da biblioteca são desenhados no canvas; orientação e nomes das regiões também estão disponíveis em HTML.
- O arquivo de referência e todos os arquivos arquivados foram preservados.

## Movimento e colisões

A posição representa a linha dos pés. O corpo usa largura de 22 pixels e profundidade de aproximadamente 12 pixels. Água é intransponível. Objetos têm caixas de colisão junto à base, permitindo passar atrás de elementos altos. O deslocamento é subdividido em passos de até 6 pixels para evitar atravessar limites em intervalos longos; cada eixo é resolvido separadamente, permitindo deslizar ao longo de obstáculos.

A câmera acompanha a personagem e fica contida no mundo. Não altera a escala dos objetos quando se aproxima da borda. Redimensionar a janela recalcula a área visível. A caminhada usa o tempo entre quadros, com limite para evitar saltos após interrupções, e normaliza a direção diagonal.

O controlador aceita teclado, ponteiros com captura e passos por ativação de botão com teclado. Teclas e ponteiros são limpos ao perder foco, trocar a visibilidade da página, abrir diálogos ou entrar em uma fase. Movimento fica suspenso enquanto qualquer diálogo estiver aberto ou uma tela de puzzle ou resgate estiver ativa. Escape fecha os diálogos e abre a pausa quando a exploração está livre; nas fases e no resgate, retorna à ilha. O foco retorna ao botão que abriu a interface, ou ao canvas quando a interação foi aberta por atalho.

## Interações e progresso

Existem sete pontos de interação: placa central, portal, quatro placas regionais e ponto do gato. O raio de interação é de 112 pixels. A interface mostra E e habilita o botão quando há um ponto próximo.

O HUD registra seis lugares descobertos e as quatro chaves. As placas da floresta, vila, ruínas e fazenda abrem diretamente os desafios de sequências, número faltando, giro de peça e contas, respectivamente. Cada fase tem três rodadas e concede a chave de sua região uma única vez. O tutorial permanece independente do progresso da aventura.

Encontrar o gato abre a tela dos cadeados. Uma chave conquistada permite abrir o cadeado correspondente, sem exigir uma ordem entre as regiões. Cada cadeado aberto deixa de ser desenhado na ilha; depois dos quatro, a cerca é removida e o final confirma o resgate.

`js/adventure-progress.js` centraliza chaves, cadeados e estado do gato. Posição, lugares descobertos, progresso parcial dos puzzles e resgate persistem apenas enquanto a página continua aberta, inclusive ao voltar ao menu. Nenhum dado da aventura é salvo no armazenamento local.

## Verificação

`tools/verificar-ilha.cjs` faz busca por posições acessíveis usando o corpo e os obstáculos reais, conferindo acesso às seis regiões e proximidade aos sete pontos. Verifica ainda as duas pontes, bloqueio do rio, colisão no tronco, passagem sob a copa, deslizamento e geração estável. No DOM simulado, verifica velocidade, diagonais, retorno ao menu, mapa, pausa, cancelamento de toque e perda de foco.

`tools/verificar-puzzles.cjs` complementa a verificação com os fluxos das fases, dicas, tentativas incorretas, avanço, saída e retomada, chave única, prática e resgate condicionado às quatro chaves.

Esses utilitários não executam um navegador nem validam o desenho, o áudio ou eventos de toque reais. A versão 4 acrescentou inspeção visual com Canvas nativo, documentada em `ambientacao-v4.md`; isso não equivale a um teste de navegador. Na versão 5, a ferramenta de navegador recusou o acesso ao arquivo local `file://` por sua política; a validação visual no navegador ficou pendente e o bloqueio não foi contornado.
