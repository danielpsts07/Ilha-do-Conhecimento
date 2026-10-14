# Ilha do Conhecimento

Versão 5 — exploração, quatro fases de puzzle e resgate do gato. HTML, CSS e JavaScript puros, com assets locais, sem framework, dependências de execução, JSON, instalação ou build.

**Abra `index.html` no navegador e selecione Iniciar.** O jogo funciona diretamente do arquivo; não usa `fetch` nem precisa de servidor.

## A ilha principal

Uma única ilha de **4.608 × 3.456 pixels**, com 96 × 72 células de 48 pixels. A câmera mostra parte do mundo e acompanha a personagem, mantendo os sprites em escala proporcional aos caminhos, árvores e construções. Em uma janela de 960 × 600 pixels, o mundo ocupa aproximadamente 4,8 larguras e 5,8 alturas de tela.

- Praça central com fonte e portal de chegada.
- Floresta dos Padrões a noroeste.
- Vila do Conhecimento a sudoeste.
- Ruínas das Formas a nordeste.
- Fazenda dos Números a sudeste.
- Montanha do Gato ao norte.

Os caminhos conectam todas as regiões. Duas pontes permitem atravessar o rio. Água, troncos, pedras e bases de construções bloqueiam a caminhada; é possível passar atrás das copas. Objetos são desenhados conforme a linha dos pés, para dar profundidade à cena.

A ambientação usa 24 novos sprites e seis texturas: casas, biblioteca, celeiro, moinho, portal, fonte, ruínas, árvores variadas, hortas, bancos, cercas e pequenos grupos de flores. Os caminhos têm curvas e a vegetação recebe movimento discreto. Imagens foram criadas com ImageGen e preparadas para manter proporção, transparência e coerência visual. Veja o [catálogo da ambientação](assets/ambiente/ilha-v4/catalogo.html) e o [panorama das seis regiões](docs/previews/ilha-v4/panorama.png).

## Controles e o que testar

| Controle | Ação |
| --- | --- |
| W/A/S/D ou setas | Caminhar; segure para continuar |
| Botões de direção | Segure com mouse ou toque; Tab/Enter também permitem passos individuais |
| E ou botão de interação | Interagir; as placas regionais abrem seus puzzles e o gato abre o resgate |
| M ou Mapa | Abrir o mapa com a posição atual |
| Escape ou Pausa | Pausar na ilha; Escape fecha diálogos ou retorna do puzzle e resgate à ilha |

A caminhada tem velocidade constante de 210 pixels por segundo. As diagonais são normalizadas. Abrir um diálogo, entrar em uma fase ou perder o foco interrompe o movimento. O mapa indica a posição e o HUD mostra o lugar atual, os locais descobertos e as chaves conquistadas.

**Voltar ao menu preserva posição, descobertas, progresso parcial das fases, chaves e cadeados nesta sessão. Recarregar a página reinicia a aventura.** O jogo ainda não salva progresso permanente.

Tutorial e configurações continuam disponíveis pelo menu e dentro da ilha. O tutorial tem três páginas e práticas independentes do mundo. O áudio sintetizado continua sendo um teste dos volumes; a trilha final ainda não existe. Os volumes ficam salvos quando o navegador permite armazenamento local.

## Fases e resgate

Aproxime-se de uma placa regional e aperte E para entrar no ambiente do puzzle. Cada fase ocupa uma tela própria, com três rodadas curtas, dicas e novas tentativas sem punição. Use **Próximo desafio** depois de cada acerto. Ao resolver a terceira rodada, toque em **Receber a chave**; depois use **Voltar à ilha** para retornar ao ponto de onde saiu.

| Região | Desafio | Chave |
| --- | --- | --- |
| Floresta dos Padrões | Observar e reproduzir sequências | Verde |
| Vila do Conhecimento | Descobrir o número que falta | Azul |
| Ruínas das Formas | Girar uma peça até corresponder ao encaixe | Vermelha |
| Fazenda dos Números | Escolher a resposta de uma conta | Amarela |

Sair antes de concluir preserva o progresso da fase nesta sessão. Uma fase concluída pode ser refeita para praticar; sua chave é concedida apenas uma vez. A chave de demonstração do tutorial continua independente da aventura.

Volte à Montanha do Gato e interaja com E. Cada chave abre seu cadeado; você pode abrir os cadeados conforme conquista as chaves. Os cadeados abertos permanecem assim. Abrir os quatro liberta o gato e apresenta o final. Depois é possível continuar a exploração ou voltar ao menu.

Veja [docs/puzzles.md](docs/puzzles.md) para conteúdo, estrutura e regras de progresso das fases.

## Limites desta etapa

O ciclo educativo de explorar, resolver, conquistar chaves e resgatar o gato está implementado. O progresso existe somente na sessão aberta; ainda não há trilha final ou animações detalhadas de transição. Não há combate ou inventário complexo.

A personagem usa as poses existentes de frente, costas e lado, com espelhamento à esquerda e leve deslocamento ao caminhar; não há uma sequência completa de quadros de caminhada. O movimento reduzido do sistema desativa esse deslocamento, a suavização da câmera e as animações ambientais. O gato permanece em pose estática.

## Organização

```text
index.html               entrada da versão atual
css/style.css            tela inicial, livro e estilos compartilhados
css/island.css           exploração, HUD, controles e diálogos
css/puzzles.css          ambientes e controles das quatro fases
css/rescue.css           tela dos cadeados e final do gato
js/main.js               menu, configurações e práticas do tutorial
js/audio.js              áudio temporário de teste
js/adventure-progress.js chaves, cadeados e estado da aventura nesta sessão
js/puzzle-data.js        conteúdo e respostas das rodadas
js/puzzle-game.js        fases, dicas, tentativas e retomada
js/rescue-game.js        abertura dos cadeados e final
js/island-world.js       terreno, regiões, objetos e colisões
js/island-art.js         catálogo de imagens locais da ilha
js/island-renderer.js    Canvas 2D, profundidade e mapas
js/island-game.js        movimento, câmera e ciclo de exploração
assets/                  imagens locais por categoria
docs/                    documentação e notas sobre os assets
tools/                   preparação e verificações auxiliares
archive/prototipo-v1/     primeira versão preservada
```

O [catálogo de assets](assets/catalogo.html) mostra o kit existente. A composição da ilha está descrita em [docs/ilha-principal.md](docs/ilha-principal.md); os recortes do menu estão em [docs/assets-v2.md](docs/assets-v2.md).

A ambientação atual, sua origem e os prompts estão registrados em [docs/ambientacao-v4.md](docs/ambientacao-v4.md).

## Validação

Execute `node --check` para os scripts alterados, `node tools/verificar-menu.cjs`, `node tools/verificar-ilha.cjs` e `node tools/verificar-puzzles.cjs` quando Node estiver disponível. Node é necessário apenas para esses utilitários, não para jogar.

Na versão 5, a sintaxe dos scripts e os três utilitários passaram. As verificações cobrem referências locais, fluxos de menu, movimento e colisões, as 12 rodadas, dicas, tentativas, retomada, quatro chaves únicas, cadeados, final, foco e retorno à ilha em DOM simulado. As prévias de ambientação da versão 4 usam o renderer real em Canvas nativo.

**Simulações e prévias de Canvas não equivalem a testes de navegador, CSS, áudio ou toque real.** A validação visual da versão 5 no navegador ficou pendente: a ferramenta recusou abrir o arquivo local `file://` por sua política de acesso. O bloqueio foi respeitado; nenhum servidor ou navegador alternativo foi usado para contorná-lo. O jogo continua abrível pelo arquivo.
