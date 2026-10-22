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
const STEP_TILE = 32 * (0.5 - 0.17); // Passo em unidades de mundo: 0,33 dos 32 originais (≈10,56).
const TICKS_PER_TILE = 16;     // Um passo dura 16 ticks na velocidade normal.
const TICKS_PER_FRAME = 4;     // 4 quadros por passo: cada um fica 4 ticks (15 trocas por segundo).
const IDLE_BREATH_TICKS = 36;  // Parada, a respiração alterna a cada 0,6 s.
const TURN_TICKS = 6;          // Toque rápido só vira a personagem; segurar depois disso anda.
const HERO_SCALE = 1.2 / 7 * 3.5; // Quadro 48×56 → unidades de mundo: 0,6 (~33,6 de altura).
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
// Espelho local do JSON: mantém o duplo clique em index.html sem fetch em file://.
// Ao editar os dados para uso sem servidor, sincronize este bloco com data/geometria.json.
const GEOMETRIA_LOCAL = {
  metrics:{WIDTH:1280,HEIGHT:714,GAP_LEFT:410,GAP_RIGHT:866,CENTER_X:638,WALK_Y:260,SLOT_Y0:262,BOTTOM:610,TRAY_LEFT:5,TRAY_RIGHT:1275,TRAY_BOTTOM:702,TRAY_CELL:40,CHAR_H:150,WALK_SPEED:260},
  background:'assets/puzzles/geometria/fundo.png',backgroundFallback:'assets/puzzles/geometria/fundo.jpeg',key:'assets/hud/chave_geometria.png',
  pieces:{
    '01':{matrix:['##.','.##'],sprite:'assets/puzzles/geometria/pecas/peca_01.png'},
    '02':{matrix:['.#','.#','##'],sprite:'assets/puzzles/geometria/pecas/peca_02.png'},
    '03':{matrix:['###','.#.'],sprite:'assets/puzzles/geometria/pecas/peca_03.png'},
    '04':{matrix:['#.','##'],sprite:'assets/puzzles/geometria/pecas/peca_04.png'},
    '05':{matrix:['..#','.##','##.'],sprite:'assets/puzzles/geometria/pecas/peca_05.png'},
    '06':{matrix:['.#.','###','.#.'],sprite:'assets/puzzles/geometria/pecas/peca_06.png'}
  },
  cycles:[
    {cols:4,rows:3,pieces:['02','04','05'],solution:[['02','02','05','05'],['02','05','05','04'],['02','05','04','04']]},
    {cols:5,rows:3,pieces:['01','02','03','04'],solution:[['01','01','02','02','02'],['04','01','01','03','02'],['04','04','03','03','03']]},
    {cols:5,rows:4,pieces:['01','02','03','04','05'],solution:[['01','01','02','02','02'],['03','01','01','05','02'],['03','03','05','05','04'],['03','05','05','04','04']]}
  ]
};
let geometriaLoading;
window.loadGeometria = () => geometriaLoading ||= (async()=>{
  let data=GEOMETRIA_LOCAL;
  if(window.location.protocol!=='file:') {
    const response=await fetch('data/geometria.json');if(!response.ok)throw Error('Não foi possível abrir data/geometria.json');data=await response.json();
  }
  for(const src of ['js/polyomino.js','js/geometria-puzzle.js'])await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error(`Falha ao carregar ${src}`));document.head.appendChild(script);
  });
  await window.GeometriaPuzzle.prepare(data);return window.GeometriaPuzzle;
})().catch(error=>{geometriaLoading=null;throw error;});
