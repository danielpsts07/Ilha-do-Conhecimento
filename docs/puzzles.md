# Fases de puzzle — versão 5

## Fontes e direção

As mecânicas seguem as orientações em `AGENTS.md`, os textos das placas regionais e o tutorial existente. O pedido atual do usuário define que cada desafio acontece em uma tela própria: a personagem interage com um ponto da ilha, entra no ambiente do puzzle, conquista a chave e retorna à exploração.

O guia de desenvolvimento e os PDFs citados na documentação anterior não estão presentes nos arquivos atuais do projeto, incluindo o histórico. O requerimento de registro de software foi conferido em leitura: identifica o jogo educacional e a linguagem JavaScript, mas não descreve as fases. As sequências, números e orientações de cada rodada são conteúdo preparado para esta implementação, sem atribuir detalhes ao guia ausente. Nenhum documento de referência ou arquivo arquivado foi alterado.

## Estrutura das quatro fases

| Ponto da ilha | Ambiente da fase | Mecânica | Chave |
| --- | --- | --- | --- |
| Floresta dos Padrões | Clareira entre árvores | Observar e reproduzir uma sequência de símbolos | Verde |
| Vila do Conhecimento | Ambiente de estudos da vila | Escolher o número que falta em uma igualdade | Azul |
| Ruínas das Formas | Espaço de encaixe entre ruínas | Girar uma peça em L, em quartos de volta, até corresponder ao modelo e ao canto marcado | Vermelha |
| Fazenda dos Números | Ambiente de colheita e moinho | Escolher a resposta correta de uma conta | Amarela |

Cada fase tem três rodadas curtas com dificuldade crescente, instrução em linguagem infantil, dica e feedback. Não há cronômetro, perda de vidas, pontuação punitiva ou bloqueio depois de errar. A resposta incorreta permite uma nova tentativa na mesma rodada; a resposta correta libera **Próximo desafio**. Depois do terceiro acerto, **Receber a chave** confirma a conclusão e concede somente a chave correspondente. A tela mostra a recompensa até a criança usar **Voltar à ilha** ou Escape.

Na floresta, as sequências têm dois, três e quatro símbolos, apresentados um de cada vez. A criança pode rever a sequência ou apagar suas escolhas; o tempo de resposta é livre. Na vila, as igualdades são `2 + ? = 5`, `? + 3 = 7` e `9 − ? = 5`. Na fazenda, as contas são `3 + 2`, `7 − 3` e `4 + 5`. Pontinhos apoiam a contagem nas duas fases numéricas. Nas ruínas, a peça em L tem um canto amarelo e alvos de 90°, 270° e 180°; sua assimetria permite identificar a orientação sem ambiguidade. As setas esquerda e direita também giram a peça.

As quatro telas são ambientes próprios dentro do mesmo `index.html`. Trocar de tela não recarrega o arquivo nem depende de servidor. A exploração da ilha fica suspensa enquanto uma fase está aberta.

## Fluxo e progresso

O fluxo é aproximar-se da placa regional → interagir com E ou o botão de interação → entrar no desafio → concluir três rodadas → usar **Receber a chave** → usar **Voltar à ilha**. A personagem retorna ao ponto de onde saiu, para continuar explorando.

Ao sair de uma fase antes de concluí-la, o progresso parcial é mantido nesta sessão. Ao retornar ao menu, continuam disponíveis posição, lugares descobertos, rodadas concluídas, chaves, cadeados abertos e estado do resgate. Recarregar a página reinicia a aventura. Apenas os volumes usam o armazenamento local opcional existente.

Uma região já concluída pode ser praticada novamente. Repetir a fase não duplica a chave nem retira o progresso das outras regiões. A prática de coleta do tutorial continua independente: a chave de demonstração não abre cadeados da aventura.

## Montanha e final

Interagir com o gato abre uma tela própria com os quatro cadeados, identificados por nome e cor. Cada chave conquistada permite abrir seu cadeado individualmente; os demais continuam fechados e informam qual região falta concluir. Os cadeados já abertos continuam nesse estado ao sair da tela. Abrir os quatro liberta o gato e apresenta o final, com opção de continuar explorando ou retornar ao menu.

O renderer da ilha também acompanha o resgate: deixa de desenhar cada cadeado aberto e remove a cerca quando os quatro estão abertos. Não é preciso conquistar as chaves em uma ordem específica.

## Organização do código

| Arquivo | Responsabilidade |
| --- | --- |
| `js/adventure-progress.js` | Estado da sessão e regras de conquista de chaves, abertura de cadeados e resgate |
| `js/puzzle-data.js` | Conteúdo e respostas das três rodadas de cada região em estruturas JavaScript |
| `js/puzzle-game.js` | Troca para a tela de puzzle, interação, dicas, feedback e retomada |
| `css/puzzles.css` | Ambientes e controles das quatro fases, layout e foco |
| `js/rescue-game.js` | Tela da montanha, ações dos cadeados e final |
| `css/rescue.css` | Apresentação dos cadeados, gato e final |
| `js/island-game.js` | Entrada nas fases e resgate a partir dos pontos de interação e retorno à exploração |
| `js/island-renderer.js` | Desenho dos cadeados restantes e do gato na ilha |

## Interação e acessibilidade

Os controles e instruções são HTML, com botões reais, rótulos legíveis, foco visível e navegação por Tab e Enter. Cor aparece junto a nomes e símbolos; não é a única indicação de uma resposta ou chave. O feedback é anunciado em uma região `aria-live`.

Escape permite sair do puzzle ou da tela de resgate e retornar à ilha, preservando o progresso. A troca de tela limpa teclas e ponteiros de movimento e restaura o foco. Animações respeitam `prefers-reduced-motion`; observar a sequência não impõe um limite de tempo à criança.

## Assets e limites

As fases reutilizam imagens locais de personagens, cenário, chaves e cadeados. Os símbolos e textos são HTML, com estilos em CSS; a peça em L e seu encaixe são SVG criados pelo próprio JavaScript. Não foram produzidos novos bitmaps. Não há dependências de execução, backend, serviços externos ou conteúdo carregado com `fetch`.

Esta etapa busca completar o ciclo educativo. A trilha final, ciclos completos de caminhada, animações detalhadas do gato e transições mais elaboradas continuam como acabamento posterior.

## Verificação

A sintaxe dos scripts e os utilitários `tools/verificar-menu.cjs`, `tools/verificar-ilha.cjs` e `tools/verificar-puzzles.cjs` passaram. O teste de puzzles usa os controllers e dados reais com DOM simulado e timers controlados. Confere as 12 rodadas, respostas matemáticas e alternativas, referências locais, dicas, tentativas incorretas, avanço, retomada de escolhas/giro/rodada, interrupção da demonstração, cancelamento de timers, uma única chave por região e prática depois da conclusão.

O mesmo teste integra o controlador real da ilha, com o mundo real e desenho substituído, para conferir entrada pelos cinco pontos, suspensão do movimento, retorno ao mesmo lugar, foco, Escape sem abrir a pausa no mesmo evento e preservação ao menu. O resgate verifica bloqueio de cadeados sem chave, abertura individual, manutenção dos cadeados abertos e final após os quatro. Confere também os estados que o renderer recebe para remover cadeados e cerca, sem validar seu desenho.

Simulações de DOM e inspeção do renderer em Canvas nativo não equivalem a testes de navegador, CSS, áudio ou toque real. A ferramenta de navegador recusou abrir o `index.html` local (`file://`) por sua política de acesso, portanto a validação visual de navegador da versão 5 ficou pendente. O bloqueio foi respeitado, sem servidor ou navegador alternativo para contorná-lo.
