// Escala do JPEG no mundo e altura máxima da personagem na tela (px CSS).
const WORLD_SCALE = 0.6;
const PLAYER_HEIGHT = 40;
// Colisão: coordenadas da imagem, exceto a pegada em px de tela/mundo.
const COLLISION_CELL_SIZE = 4;
const FOOT_W = 12; // Largura da pegada, centrada nos pés (px de tela).
const FOOT_H = 6; // Altura da pegada acima da base dos pés (px de tela).
const CORNER_NUDGE = 3; // Ajuste lateral máximo para contornar cantos (px de tela).
const WATER_H_MIN = 190, WATER_H_MAX = 222;
const WATER_S_MIN = 0.5, WATER_V_MIN = 0.6;
const WATER_MIN_COMPONENT_CELLS = 30;
const WATER_MARGIN_CELLS = 5; // Margem de proteção ao redor da água, em células.
const SPAWN = {x:1290,y:945};
const CHECKPOINTS = [
  {name:'Entrada do labirinto',x:630,y:650}, {name:'Fonte da vila',x:690,y:1035},
  {name:'Platô do deserto',x:1700,y:470}, {name:'Moinho',x:1880,y:915},
  {name:'Base da montanha',x:1290,y:925}
];
