# Assets da versão 2

A página principal usa os assets preparados anteriormente, com quatro recortes do novo anexo:

| Arquivo | Dimensões | Uso |
| --- | --- | --- |
| `assets/ui/botoes/iniciar.png` | 480 × 128 | Botão principal |
| `assets/ui/botoes/tutorial.png` | 480 × 128 | Abrir tutorial |
| `assets/ui/icones/sair-menu.png` | 96 × 96 | Sair |
| `assets/ui/icones/configuracoes-menu.png` | 96 × 96 | Configurações |

O quadriculado da imagem de origem foi removido por conexão às bordas. O texto claro dentro dos botões foi preservado; os arquivos têm alpha real. As proporções foram preservadas dentro de caixas padronizadas.

As páginas do livro são HTML sobre `assets/fundos/livro-cenario.png`. Os textos não fazem parte da imagem e permanecem legíveis e acessíveis. Em telas pequenas, o conteúdo do livro se organiza em uma coluna com rolagem.

O quarto sem interface foi reconstruído pela ferramenta de imagem na etapa anterior. A personagem e o gato usados na prática são poses estáticas do PDF, sem ciclos de animação.

Na versão 3, a exploração reutiliza as poses da personagem e do gato e a árvore do kit. Terreno e construções foram criados em Canvas 2D; nenhum PNG foi modificado ou reconstruído por IA nesta etapa. Veja `ilha-principal.md` para escala, composição e limites.
