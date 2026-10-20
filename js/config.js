// Escala do JPEG no mundo; câmera amplia o mundo inteiro sem mudar a física.
const WORLD_SCALE = 0.6;
const CAMERA_ZOOM = 1.90;
const DEBUG_PANEL_CORNER = 'bottom-left'; // Também aceita 'bottom-right' e 'top-right'.
const HUD_KEYS_CORNER = 'top-left'; // Aceita 'top-left', 'top-right', 'bottom-left' e 'bottom-right'.
const HUD_MARGIN = 12, HUD_KEY_H = 38, HUD_GAP = 8;
const PLAYER_HEIGHT = 40;
// Caminhada estilo Pokémon 2D: folha 10×4 de 48×56, pés em (24,52).
// Linhas: 0 baixo, 1 esquerda, 2 direita, 3 cima. Colunas 0–7 = ciclo de 8 quadros
// (gerado de menina-caminhada.png por assets/ferramentas-sprites/gerar-ciclo-8.cjs); 8–9 = respiração.
const HERO_SHEET = {src:'personagem/menina-caminhada-8.png',frameW:48,frameH:56,pivotX:24,pivotY:52};
const TICK_HZ = 60;            // Lógica em passo fixo de 60 ticks por segundo.
const STEP_TILE = 32;          // Tamanho de um passo, em unidades de mundo.
const TICKS_PER_TILE = 16;     // Um passo dura 16 ticks na velocidade normal.
const TICKS_PER_FRAME = 4;     // 4 quadros por passo: cada um fica 4 ticks (15 trocas por segundo).
const IDLE_BREATH_TICKS = 36;  // Parada, a respiração alterna a cada 0,6 s.
const TURN_TICKS = 6;          // Toque rápido só vira a personagem; segurar depois disso anda.
const HERO_SCALE = 1.2;        // Quadro 48×56 → unidades de mundo (personagem com ~58 de altura).
const KEY_HEIGHT = 36, KEY_HOVER = 8, INTERACT_RADIUS = 64;
const KEYS = [
  {id:'geometria',label:'Geometria',x:2060,y:390,img:'assets/hud/chave_geometria.png',color:'#a855f7'},
  {id:'logica',label:'Raciocínio Lógico',x:670,y:650,img:'assets/hud/chave_logica.png',color:'#4ade80'},
  {id:'algebra',label:'Álgebra Inicial',x:763,y:1050,img:'assets/hud/chave_algebra.png',color:'#60a5fa'},
  {id:'operacoes',label:'Operações',x:2370,y:1000,img:'assets/hud/chave_operacoes.png',color:'#fb923c'}
];
// Colisão: coordenadas da imagem, exceto a pegada em px de tela/mundo.
const COLLISION_CELL_SIZE = 4;
const FOOT_W = 3; // Largura da pegada, centrada nos pés (unidades de mundo).
const FOOT_H = 2; // Altura acima da base dos pés (unidades de mundo).
const CORNER_NUDGE = 3; // Ajuste lateral máximo para contornar cantos (unidades de mundo).
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
