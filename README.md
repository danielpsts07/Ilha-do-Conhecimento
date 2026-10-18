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
Perto de uma chave, E abre `js/dev-puzzle-screen.js`: Voltar/Esc mantém a chave; Simular conclusão/Enter remove a chave e mostra um aviso por 2 s. Tab/setas selecionam um botão e Espaço ativa; mouse também funciona. F3 e depois K restauram as quatro chaves. Recarregar reinicia a coleta; retornar ao menu a preserva nesta sessão. Os puzzles e o resgate existentes permanecem inalterados.
Pontos antigos (mundo): guia (2424,2088), portal (2136,2088), floresta (1032,1128), vila (1272,2616), ruínas (3720,1176), fazenda (3768,2616), montanha (2328,552).
