# Kit inicial de assets

Abra `catalogo.html` para conferir as imagens em fundos quadriculado, escuro e claro.

## Padrões

- Botões: 320 × 96; ícones: 64 × 64; personagens: 64 × 80, pés alinhados.
- Árvore: 128 × 160; chaves: 48 × 64; trilhos: 320 × 32.
- Redimensionamento uniforme com margem transparente, sem deformar proporções.
- Fundos têm largura de 1280; a altura respeita a proporção da fonte.
- PNG RGBA: fundo de papel removido por conexão às bordas, preservando interiores dos botões.
- Os desenhos de play e sair incluem sua placa colorida intencional.

## Limites desta versão

- Não é um pacote de gameplay completo: mapas de colisão, tiles conectáveis, peças de puzzles, cela separada e ciclos de caminhada ainda precisam de produção.
- As duas poses frontais dos personagens foram mantidas como alternativas, não rotuladas como direções ausentes.
- O mapa é uma referência visual composta, não um tilemap.
- O quarto teve as regiões cobertas por interface reconstruídas por IA; não é um recorte idêntico nesses pontos.
- Logo preparado com extração por IA; demais sprites recortados das fontes.
- Livro isolado por contorno: textura de página e sombras fazem parte do asset.
- A versão atual na raiz utiliza os assets separados. A primeira versão está preservada em `archive/prototipo-v1/`.

## Arquivos

| Arquivo | Tamanho | Origem |
| --- | --- | --- |
| `ui/botoes/botao-pergaminho.png` | 320 × 96 | extra |
| `ui/botoes/botao-pergaminho-curto.png` | 320 × 96 | extra |
| `ui/botoes/botao-quadrado.png` | 96 × 96 | extra |
| `ui/botoes/botao-verde.png` | 320 × 96 | config |
| `ui/botoes/botao-vermelho.png` | 320 × 96 | config |
| `ui/botoes/botao-continuar.png` | 320 × 96 | config |
| `ui/botoes/botao-sair.png` | 320 × 96 | config |
| `ui/botoes/botao-som.png` | 320 × 96 | config |
| `ui/botoes/botao-musica.png` | 320 × 96 | config |
| `ui/botoes/botao-como-jogar.png` | 320 × 96 | extra |
| `ui/paineis/painel-pergaminho.png` | 480 × 320 | config |
| `ui/icones/som.png` | 64 × 64 | config |
| `ui/icones/musica.png` | 64 × 64 | config |
| `ui/icones/pata.png` | 64 × 64 | config |
| `ui/icones/gato-rosto.png` | 64 × 64 | config |
| `ui/icones/slider-pata.png` | 64 × 64 | extra |
| `ui/icones/configuracoes.png` | 64 × 64 | extra |
| `ui/icones/controle.png` | 64 × 64 | extra |
| `ui/icones/livro.png` | 64 × 64 | extra |
| `ui/icones/fechar.png` | 64 × 64 | pdf |
| `ui/icones/play.png` | 64 × 64 | config |
| `ui/icones/sair.png` | 64 × 64 | config |
| `ui/ilustracoes/gato-tutorial.png` | 192 × 224 | config |
| `ui/controles/slider-vazio.png` | 320 × 32 | config |
| `ui/controles/slider-verde.png` | 320 × 32 | config |
| `ui/controles/slider-azul.png` | 320 × 32 | config |
| `personagens/personagem-frente.png` | 64 × 80 | pdf |
| `personagens/personagem-frente-alternativa.png` | 64 × 80 | pdf |
| `personagens/personagem-lado.png` | 64 × 80 | pdf |
| `personagens/personagem-costas.png` | 64 × 80 | pdf |
| `personagens/gato-frente.png` | 64 × 80 | pdf |
| `personagens/gato-frente-alternativa.png` | 64 × 80 | pdf |
| `personagens/gato-costas.png` | 64 × 80 | pdf |
| `personagens/gato-lado.png` | 64 × 80 | pdf |
| `ambiente/arvore.png` | 128 × 160 | pdf |
| `objetos/chave-amarela.png` | 48 × 64 | pdf |
| `objetos/chave-azul.png` | 48 × 64 | pdf |
| `objetos/chave-vermelha.png` | 48 × 64 | pdf |
| `objetos/chave-verde.png` | 48 × 64 | pdf |
| `mapa/ilha-referencia.png` | 768 × 576 | pdf |
| `ambiente/tiles/tile-grama.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `ambiente/tiles/tile-pedra.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `ambiente/tiles/tile-caminho.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `ambiente/tiles/tile-agua.png` | 64 × 64 | pdf; textura de teste, bordas não validadas como seamless |
| `puzzles/peca-triangulo.png` | 64 × 64 | pdf |
| `puzzles/peca-circulo.png` | 64 × 64 | pdf |
| `puzzles/peca-quadrado.png` | 64 × 64 | pdf |
| `objetos/cadeado-cinza.png` | 48 × 64 | pdf |
| `objetos/cadeado-verde.png` | 48 × 64 | pdf |
| `fundos/livro-cenario.png` | 1280 × 854 | anexo livro vazio |
| `ui/paineis/livro-aberto.png` | 1200 × 800 | anexo livro vazio; recorte de contorno |
| `fundos/quarto-sem-interface.png` | 1280 × 614 | edição IA do quarto semifinal |
| `ui/logo/logo-ilha-do-conhecimento.png` | 640 × 384 | extração IA do logo semifinal |

## Segunda versão

Quatro recortes adicionais do último anexo foram integrados à tela inicial. Veja `docs/assets-v2.md` na raiz do projeto. O catálogo inclui os novos arquivos.
