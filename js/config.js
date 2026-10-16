// Escala do JPEG no mundo e altura máxima da personagem na tela (px CSS).
const WORLD_SCALE = 0.6;
const PLAYER_HEIGHT = 40;
// Colisão: coordenadas da imagem, exceto a pegada em px de tela/mundo.
const COLLISION_CELL_SIZE = 4;
const FOOT_W = 22, FOOT_H = 10;
const WATER_H_MIN = 190, WATER_H_MAX = 222;
const WATER_S_MIN = 0.5, WATER_V_MIN = 0.6;
// 8 (inicial), 7 e 6 estreitavam passagens; 5 preserva pontes e checkpoints com a pegada.
const WATER_MIN_COMPONENT_CELLS = 30, WATER_MARGIN_CELLS = 5;
const SPAWN = {x:1290,y:945};
const CHECKPOINTS = [
  {name:'Entrada do labirinto',x:630,y:650}, {name:'Fonte da vila',x:690,y:1035},
  {name:'Platô do deserto',x:1700,y:470}, {name:'Moinho',x:1880,y:915},
  {name:'Base da montanha',x:1290,y:925}
];
