# Ilha do Conhecimento

Versão 3 — primeira etapa de exploração jogável. HTML, CSS e JavaScript puros, com assets locais, sem framework, dependências de execução, JSON, instalação ou build.

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

## Controles e o que testar

| Controle | Ação |
| --- | --- |
| W/A/S/D ou setas | Caminhar; segure para continuar |
| Botões de direção | Segure com mouse ou toque; Tab/Enter também permitem passos individuais |
| E ou botão de interação | Ler uma placa ou observar um ponto próximo |
| M ou Mapa | Abrir o mapa com a posição atual |
| Escape ou Pausa | Pausar; Escape fecha o diálogo aberto |

A caminhada tem velocidade constante de 210 pixels por segundo. As diagonais são normalizadas. Abrir um diálogo ou perder o foco interrompe o movimento. O mapa indica a posição e o HUD mostra o lugar atual e os locais descobertos. Vá até a montanha para encontrar o gato e interagir com o ponto de resgate.

**Voltar ao menu preserva a posição nesta sessão. Recarregar a página reinicia a exploração.** O jogo ainda não salva progresso permanente.

Tutorial e configurações continuam disponíveis pelo menu e dentro da ilha. O tutorial tem três páginas e práticas independentes do mundo. O áudio sintetizado continua sendo um teste dos volumes; a trilha final ainda não existe. Os volumes ficam salvos quando o navegador permite armazenamento local.

## Limites desta etapa

Esta versão implementa exploração, limites e interação. As placas apresentam a proposta de cada região, mas **os desafios matemáticos, as quatro chaves, a abertura dos cadeados e o final ainda não estão implementados**. Não há combate ou inventário.

A personagem usa as poses existentes de frente, costas e lado, com espelhamento à esquerda e leve deslocamento ao caminhar; não há uma sequência completa de quadros de caminhada. O movimento reduzido do sistema desativa esse deslocamento, a suavização da câmera e as animações ambientais. O gato permanece em pose estática.

## Organização

```text
index.html               entrada da versão atual
css/style.css            tela inicial, livro e estilos compartilhados
css/island.css           exploração, HUD, controles e diálogos
js/main.js               menu, configurações e práticas do tutorial
js/audio.js              áudio temporário de teste
js/island-world.js       terreno, regiões, objetos e colisões
js/island-renderer.js    Canvas 2D, profundidade e mapas
js/island-game.js        movimento, câmera e ciclo de exploração
assets/                  imagens locais por categoria
docs/                    documentação e notas sobre os assets
tools/                   preparação e verificações auxiliares
archive/prototipo-v1/     primeira versão preservada
```

O [catálogo de assets](assets/catalogo.html) mostra o kit existente. A composição da ilha está descrita em [docs/ilha-principal.md](docs/ilha-principal.md); os recortes do menu estão em [docs/assets-v2.md](docs/assets-v2.md).

## Validação

Execute `node --check` para os scripts alterados, `node tools/verificar-menu.cjs` e `node tools/verificar-ilha.cjs` quando Node estiver disponível. Node é necessário apenas para esses utilitários, não para jogar.

As verificações cobrem sintaxe, referências locais, fluxos de menu e controles em DOM simulado, além de acessibilidade das regiões e colisões usando a geometria real do mundo. **Não substituem uma inspeção visual, um teste de áudio ou um teste real de toque.** Nesta entrega, a prévia no navegador não foi executada porque a autorização para iniciar o servidor local foi recusada.
