# Kit inicial de assets

Abra `_lixeira/assets/catalogo.html` para conferir as imagens em fundos quadriculado, escuro e claro.

## Padrões

- Botões: 320 × 96; ícones: 64 × 64; personagens: 64 × 80, pés alinhados.
- Árvore: 128 × 160; chaves: 48 × 64; trilhos: 320 × 32.
- Redimensionamento uniforme com margem transparente, sem deformar proporções.
- Fundos têm largura de 1280; a altura respeita a proporção da fonte.
- PNG RGBA: fundo de papel removido por conexão às bordas, preservando interiores dos botões.
- Os desenhos de play e sair incluem sua placa colorida intencional.

## Limites desta versão

- Não é um pacote de animação completo: tiles conectáveis, uma cela ilustrada separada e ciclos de caminhada ainda precisam de produção. A exploração usa colisões em JavaScript; as fases usam os assets existentes e elementos de HTML/CSS.
- As duas poses frontais dos personagens foram mantidas como alternativas, não rotuladas como direções ausentes.
- O mapa é uma referência visual composta, não um tilemap.
- O quarto teve as regiões cobertas por interface reconstruídas por IA; não é um recorte idêntico nesses pontos.
- Logo preparado com extração por IA; demais sprites recortados das fontes.
- Livro isolado por contorno: textura de página e sombras fazem parte do asset.
- A versão atual na raiz utiliza os assets separados. A primeira versão está preservada em `_lixeira/archive/prototipo-v1/`.

## Arquivos

| Arquivo | Tamanho | Origem |
| --- | --- | --- |
| `assets/hud/botao-pergaminho.png` | 320 × 96 | extra |
| `_lixeira/assets/ui/botoes/botao-pergaminho-curto.png` | 320 × 96 | extra |
| `_lixeira/assets/ui/botoes/botao-quadrado.png` | 96 × 96 | extra |
| `assets/hud/botao-verde.png` | 320 × 96 | config |
| `assets/hud/botao-vermelho.png` | 320 × 96 | config |
| `_lixeira/assets/ui/botoes/botao-continuar.png` | 320 × 96 | config |
| `_lixeira/assets/ui/botoes/botao-sair.png` | 320 × 96 | config |
| `_lixeira/assets/ui/botoes/botao-som.png` | 320 × 96 | config |
| `_lixeira/assets/ui/botoes/botao-musica.png` | 320 × 96 | config |
| `_lixeira/assets/ui/botoes/botao-como-jogar.png` | 320 × 96 | extra |
| `_lixeira/assets/ui/paineis/painel-pergaminho.png` | 480 × 320 | config |
| `assets/configuracoes/som.png` | 64 × 64 | config |
| `assets/configuracoes/musica.png` | 64 × 64 | config |
| `assets/hud/pata.png` | 64 × 64 | config |
| `assets/hud/gato-rosto.png` | 64 × 64 | config |
| `assets/configuracoes/slider-pata.png` | 64 × 64 | extra |
| `assets/hud/configuracoes.png` | 64 × 64 | extra |
| `_lixeira/assets/ui/icones/controle.png` | 64 × 64 | extra |
| `assets/hud/livro.png` | 64 × 64 | extra |
| `assets/hud/fechar.png` | 64 × 64 | pdf |
| `_lixeira/assets/ui/icones/play.png` | 64 × 64 | config |
| `_lixeira/assets/ui/icones/sair.png` | 64 × 64 | config |
| `assets/configuracoes/gato-tutorial.png` | 192 × 224 | config |
| `_lixeira/assets/ui/controles/slider-vazio.png` | 320 × 32 | config |
| `_lixeira/assets/ui/controles/slider-verde.png` | 320 × 32 | config |
| `_lixeira/assets/ui/controles/slider-azul.png` | 320 × 32 | config |
| `assets/personagem/personagem-frente.png` | 64 × 80 | pdf |
| `_lixeira/assets/personagens/personagem-frente-alternativa.png` | 64 × 80 | pdf |
| `assets/personagem/personagem-lado.png` | 64 × 80 | pdf |
| `assets/personagem/personagem-costas.png` | 64 × 80 | pdf |
| `assets/personagem/gato-frente.png` | 64 × 80 | pdf |
| `_lixeira/assets/personagens/gato-frente-alternativa.png` | 64 × 80 | pdf |
| `_lixeira/assets/personagens/gato-costas.png` | 64 × 80 | pdf |
| `_lixeira/assets/personagens/gato-lado.png` | 64 × 80 | pdf |
| `assets/ilha/arvore.png` | 128 × 160 | pdf |
| `assets/hud/chave-amarela.png` | 48 × 64 | pdf |
| `assets/hud/chave-azul.png` | 48 × 64 | pdf |
| `assets/hud/chave-vermelha.png` | 48 × 64 | pdf |
| `assets/hud/chave-verde.png` | 48 × 64 | pdf |
| `assets/ilha/ilha-referencia.png` | 768 × 576 | pdf |
| `assets/ilha/tile-grama.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `_lixeira/assets/ambiente/tiles/tile-pedra.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `_lixeira/assets/ambiente/tiles/tile-caminho.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `_lixeira/assets/ambiente/tiles/tile-agua.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `puzzles/peca-triangulo.png` | 64 × 64 | pdf |
| `puzzles/peca-circulo.png` | 64 × 64 | pdf |
| `puzzles/peca-quadrado.png` | 64 × 64 | pdf |
| `assets/final/cadeado-cinza.png` | 48 × 64 | pdf |
| `_lixeira/assets/objetos/cadeado-verde.png` | 48 × 64 | pdf |
| `assets/configuracoes/livro-cenario.png` | 1280 × 854 | anexo livro vazio |
| `_lixeira/assets/ui/paineis/livro-aberto.png` | 1200 × 800 | anexo livro vazio; recorte de contorno |
| `assets/tela-inicial/quarto-sem-interface.png` | 1280 × 614 | edição IA do quarto semifinal |
| `assets/tela-inicial/logo-ilha-do-conhecimento.png` | 640 × 384 | extração IA do logo semifinal |

## Segunda versão

Quatro recortes adicionais do último anexo foram integrados à tela inicial. Veja `referencia/docs/assets-v2.md` na raiz do projeto. O catálogo inclui os novos arquivos.

## Ambientação da ilha — versão 4

30 imagens novas estão em `ambiente/ilha-v4/`: 24 sprites com alpha real e seis texturas. Abra [o catálogo da ambientação](../../_lixeira/assets/ambiente/ilha-v4/catalogo.html) ou `conferencia.jpg` para conferir. Três atlas gerados com ImageGen estão preservados em `fontes/`, com prompts em `prompts.md`. Os recortes preservam a proporção e alinham as bases; os assets anteriores não foram modificados.

A exploração já tem colisões definidas em JavaScript; o mapa de referência continua sendo uma ilustração. A composição, preparação e validação visual em Canvas nativo estão documentadas em `referencia/docs/ambientacao-v4.md` na raiz do projeto.

## Fases de puzzle e resgate — versão 5

As quatro telas de puzzle e a tela de resgate reutilizam imagens locais do kit e da ambientação da ilha: personagens, árvores, construções, chaves e cadeados. Textos e símbolos ficam em HTML/CSS; a peça assimétrica em L e o encaixe das ruínas são SVG criados pelo JavaScript para permitir identificar cada quarto de volta. As peças geométricas do kit continuam disponíveis na ilha e no catálogo. Não foi criado um novo atlas ou reconstruído um PNG nesta etapa.

As chaves mantêm a associação existente: verde para lógica na floresta, azul para álgebra na vila, vermelha para geometria nas ruínas e amarela para operações na fazenda. Os cadeados usam nomes junto às cores. As regras e o uso de cada fase estão em `referencia/docs/puzzles.md` na raiz do projeto.

Os ciclos completos de personagem e gato continuam pendentes. O resgate usa as poses existentes, abertura dos cadeados pela interface e remoção da cerca no renderer da ilha.
