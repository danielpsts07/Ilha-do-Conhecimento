# Livro de configurações

As configurações abrem no livro (`assets/fundos/livro-cenario.png`). O sumário é a primeira folha dupla: os botões de pergaminho das seções ficam divididos entre as duas páginas — Som, Controles, Idioma e Acessibilidade à esquerda; Como jogar, Sobre nós, Créditos e Restaurar padrões à direita. Não há barra de abas no topo: a navegação é feita só pelos botões do sumário. Escolher qualquer um **vira a folha do livro** e a nova página mostra as opções daquela seção. Os volumes de Som e Música ficam na própria página de Áudio (deslizadores e testes à esquerda; silenciar tudo à direita). **← Sumário** volta ao início, e o foco retorna ao botão de onde a criança saiu. O livro sempre reabre no sumário.

Não há ilustração do gato nas páginas das configurações; a decoração usa patinhas, corações, notas, chaves e os ícones em pixel art. O gato aparece apenas na aventura (ilha, resgate e tutorial).

As páginas não têm frases motivacionais soltas (subtítulos de capa, legendas e notas em itálico de rodapé foram removidos). Ficam apenas o título de cada seção, a instrução funcional logo abaixo e as notas de status que mudam ao interagir (restaurar padrões e idioma). Na primeira página (sumário), a barra de ações embaixo do livro mostra "Continuar" e "Sair do jogo". Nas páginas internas, mostra "← Sumário" e "Continuar"; "Sair do jogo" não aparece nelas.

| Página | Conteúdo |
| --- | --- |
| Áudio | Efeitos e música (deslizadores de pata), ouvir um efeito, música de teste, **Silenciar tudo**. Mexer em um volume tira o silêncio. |
| Controles | Mapa de teclas que acendem quando apertadas, velocidade da caminhada (Devagar 0,7× · Normal · Rápido 1,3×) com prévia animada e **Controle na tela** para tablet e celular: **Setas** (d-pad), **Joystick** (analógico) ou **Nenhum**. |
| Idioma | Português em uso. Inglês aparece como "em breve" e não traduz o jogo. |
| Acessibilidade | **Letras maiores** (livro, ilha, desafios, resgate e tutorial) e **Menos animações** (páginas trocam sem virar, ilha sem animações ambientais, câmera sem suavização). |
| Como jogar | Missão em quatro passos e botão para o tutorial, que troca a vista sem fechar o livro. |
| Sobre nós | Para quem é o jogo e o aviso de que a aventura não é salva. |
| Créditos | Equipes e origem da arte e dos sons. Os nomes ainda são genéricos: substituir "Equipe Ilha do Conhecimento" no `index.html`. |

Não há opção de salvar o jogo: o progresso dura apenas a sessão aberta. **Restaurar padrões**, no sumário, devolve as preferências ao começo.

## Animações

- **Virada de folha** (`turnLeaf` em `js/settings-book.js`): uma folha presa na lombada gira 180°. A frente mostra uma cópia da página antiga e o verso, uma cópia da nova; uma cópia parada cobre a página que ainda não foi alcançada. As cópias não têm ids, não recebem foco (`inert`) e saem da árvore de acessibilidade. As frações do papel na imagem do livro estão em `paper`.
- Em telas de até 700 px o livro é uma coluna: as páginas entram com um giro curto.
- Com **Menos animações** ou `prefers-reduced-motion`, as páginas trocam na hora.
- Detalhes: livro chegando à mesa, abas que sobem, cartões que entram em sequência, gato que respira e pula com um coração a cada escolha, notas musicais, bandeirolas, pegadas, giz escrevendo "créditos" e a personagem caminhando na velocidade escolhida.
- Sons sintetizados: `GameAudio.page()` (papel) e `GameAudio.toggle(on)` (interruptores).

## Preferências

`js/game-settings.js` guarda valores simples no `localStorage` (`ilha.sound`, `ilha.music`, `ilha.mute`, `ilha.speed`, `ilha.touch`, `ilha.largeText`, `ilha.calm`), sem JSON. Sem armazenamento disponível, os padrões são usados. A chave antiga `ilha.pad` ainda é lida uma vez para migrar quem já tinha as setas ligadas ou desligadas. As classes `large-text`, `calm-motion`, `touch-arrows`, `touch-joystick` e `touch-off` no `body` aplicam as escolhas; `js/island-game.js` lê `GameSettings.walkSpeed` e `GameSettings.calm`.

## Controle na tela (tablet e celular)

A página de Controles deixa escolher como andar com o dedo: **Setas** (o d-pad), **Joystick** (bastão analógico arrastável, onde inclinar pouco caminha devagar) ou **Nenhum** (só teclado). A ilha mostra o controle escolhido e esconde o outro, conforme a classe no `body`. O joystick fica em `#island-joystick`/`#joystick-stick` e usa eventos de ponteiro; o movimento vira um vetor em `js/island-game.js`.

## Ícones

`globo.svg`, `olho.svg` e `estrela.svg` (16 × 16, em `assets/ui/icones/`) são gerados por `node tools/gerar-icones-pixel.cjs` a partir de desenhos em texto. Os demais ícones e ilustrações reutilizam o kit existente. As bandeiras são desenhadas em CSS.
