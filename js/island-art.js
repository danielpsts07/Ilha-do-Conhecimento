/* Catálogo visual da ilha. Caminhos locais, sem dados carregados por fetch. */
window.IslandArt = (() => {
  const root='ambiente/ilha-v4/';
  const sprites={
    cottage:'casa',library:'biblioteca',barn:'celeiro',mill:'moinho',portal:'portal',
    fountain:'fonte',well:'poco',arch:'arco',column:'coluna',cliff:'rochedo',crops:'horta',sign:'placa',
    treeCanopy:'arvore-copa',treeCypress:'arvore-cipreste',flowerBush:'arbusto-florido',berryBush:'arbusto-frutas',
    rock:'pedra-musgo',stump:'toco',flowers:'flores',fern:'samambaia',bench:'banco',fence:'cerca',harvest:'colheita',hay:'feno'
  };
  const grounds={grass:'grama',forest:'grama-floresta',dirt:'terra',sand:'areia',paving:'pedra',water:'agua'};
  const sources={treeOriginal:'ambiente/arvore.png',front:'personagens/personagem-frente.png',back:'personagens/personagem-costas.png',side:'personagens/personagem-lado.png',cat:'personagens/gato-frente.png',lock:'objetos/cadeado-cinza.png',triangleTile:'puzzles/peca-triangulo.png',squareTile:'puzzles/peca-quadrado.png',circleTile:'puzzles/peca-circulo.png'};
  for(const [key,name] of Object.entries(sprites))sources[key]=`${root}${name}.png`;
  for(const [key,name] of Object.entries(grounds))sources[`ground-${key}`]=`${root}terreno-${name}.png`;
  return Object.freeze({sources:Object.freeze(sources)});
})();
