# Ilha principal — etapa de exploração

## Escala e composição

O mundo mede 4.608 × 3.456 pixels, com células de 48 pixels. A imagem `assets/mapa/ilha-referencia.png` continua sendo referência de conceito; ela não foi ampliada nem utilizada como terreno jogável.

`js/island-world.js` define o contorno da ilha, a praia, o rio, os caminhos e duas pontes. As regiões compartilham o mesmo mundo, sem telas separadas ou teletransporte. A distribuição de vegetação usa uma função determinística: abrir o jogo novamente produz o mesmo cenário.

O início fica na praça central, perto do portal e da placa de orientação. Caminhos levam às quatro regiões e à montanha. Há uma rota adicional ao sul entre vila e fazenda. É possível explorar o terreno fora das estradas.

## Fontes visuais

- A árvore e as poses da personagem e do gato são reutilizadas do kit de assets, sem alterar os PNGs originais.
- A personagem usa uma caixa de 48 × 60 pixels; a árvore, 120 × 150. Ambas mantêm a proporção original de 4:5. A caixa do gato mede 52 × 65.
- Terreno, fonte, portal, casas, biblioteca, placas, poço, colunas, peças das ruínas, celeiro, moinho, horta, feno e rochas são desenhados com primitivas de Canvas 2D por `js/island-renderer.js`.
- Esses desenhos são elementos criados em código nesta etapa, sem novas reconstruções de imagem por IA. As texturas de teste do kit não foram usadas como tiles seamless, pois suas bordas ainda não foram validadas.
- Os rótulos da interface e os textos de interação ficam em HTML. Os pequenos nomes no mapa e na fachada da biblioteca são desenhados no canvas; orientação e nomes das regiões também estão disponíveis em HTML.
- O arquivo de referência e todos os arquivos arquivados foram preservados.

## Movimento e colisões

A posição representa a linha dos pés. O corpo usa largura de 22 pixels e profundidade de aproximadamente 12 pixels. Água é intransponível. Objetos têm caixas de colisão junto à base, permitindo passar atrás de elementos altos. O deslocamento é subdividido em passos de até 6 pixels para evitar atravessar limites em intervalos longos; cada eixo é resolvido separadamente, permitindo deslizar ao longo de obstáculos.

A câmera acompanha a personagem e fica contida no mundo. Não altera a escala dos objetos quando se aproxima da borda. Redimensionar a janela recalcula a área visível. A caminhada usa o tempo entre quadros, com limite para evitar saltos após interrupções, e normaliza a direção diagonal.

O controlador aceita teclado, ponteiros com captura e passos por ativação de botão com teclado. Teclas e ponteiros são limpos ao perder foco, trocar a visibilidade da página ou abrir diálogos. Movimento fica suspenso enquanto qualquer diálogo estiver aberto. Escape usa o fechamento nativo dos diálogos e abre a pausa quando a exploração está livre. O foco retorna ao botão que abriu o diálogo, ou ao canvas quando foi aberto por atalho.

## Interações e progresso

Existem sete pontos de interação: placa central, portal, quatro placas regionais e ponto do gato. O raio de interação é de 112 pixels. A interface mostra E e habilita o botão quando há um ponto próximo.

O HUD registra seis lugares descobertos, sem premiar chaves nesta etapa. Encontrar e interagir com o gato altera a orientação do objetivo. Posição, descoberta de lugares e esse objetivo persistem apenas enquanto a página continua aberta. Nenhum dado do mapa é salvo no armazenamento local.

As próximas etapas podem implementar o primeiro desafio na floresta sobre essa estrutura, mantendo as demais regiões como explorações com placas até que seus puzzles sejam construídos.

## Verificação

`tools/verificar-ilha.cjs` faz busca por posições acessíveis usando o corpo e os obstáculos reais, conferindo acesso às seis regiões e proximidade aos sete pontos. Verifica ainda as duas pontes, bloqueio do rio, colisão no tronco, passagem sob a copa, deslizamento e geração estável. No DOM simulado, verifica velocidade, diagonais, retorno ao menu, mapa, pausa, cancelamento de toque e perda de foco.

Esse utilitário não executa um navegador nem valida o desenho, o áudio ou eventos de toque reais. A inspeção visual no navegador continua pendente nesta entrega.
