// Geometria real do mapa + controles em DOM simulado. Não valida o desenho.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'js/island-world.js'),'utf8'),sandbox);
const World=sandbox.window.IslandWorld,world=World.create();
assert.equal(world.width,4608);assert.equal(world.height,3456);
assert(World.isWalkable(world,world.spawn.x,world.spawn.y),'O ponto inicial deve estar livre.');
// Busca em uma grade mais fina que os tiles, respeitando o corpo e os obstáculos.
const step=24,cols=world.width/step,rows=world.height/step,seen=new Uint8Array(cols*rows);
const queue=[[world.spawn.x/step,world.spawn.y/step]];seen[queue[0][1]*cols+queue[0][0]]=1;
for(let head=0;head<queue.length;head++) {
  const [x,y]=queue[head];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx=x+dx,ny=y+dy;
    if(nx<0||ny<0||nx>=cols||ny>=rows||seen[ny*cols+nx])continue;
    if(!World.isWalkable(world,nx*step,ny*step))continue;
    seen[ny*cols+nx]=1;queue.push([nx,ny]);
  }
}
for(const point of world.points)assert(queue.some(([x,y])=>Math.hypot(x*step-point.x,y*step-point.y)<100),`Sem acesso ao ponto ${point.id}`);
for(const region of world.regions)assert(queue.some(([x,y])=>World.regionAt(x*step,y*step).id===region.id),`Região inacessível: ${region.id}`);
for(const cy of [38,55])for(let x=61;x<=67;x++)assert(World.isWalkable(world,(x+.5)*48,(cy+.5)*48),'Ponte deve estar livre.');
assert(!World.isWalkable(world,64.5*48,45.5*48),'Rio bloqueia a caminhada.');
assert(World.isWalkable(world,77.5*48,20.5*48-20),'É possível passar por baixo do arco das ruínas.');
const waterEdge={x:61.5*48,y:45.5*48};World.movePlayer(world,waterEdge,500,0);
assert(waterEdge.x<63*48,'Movimento longo não pode atravessar o rio.');
const tree=world.objects.find(o=>o.kind==='tree');assert(tree);
assert(!World.isWalkable(world,tree.x,tree.y-8),'Tronco deve bloquear.');
assert(World.isWalkable(world,tree.x,tree.y-85),'Copa permite caminhar atrás.');
const fountain=world.colliders.find(o=>o.kind==='fountain');
const sliding={x:fountain.x-15,y:fountain.y+fountain.height/2};
World.movePlayer(world,sliding,20,20);assert(sliding.x<fountain.x-10&&sliding.y>fountain.y+fountain.height/2,'A personagem deve deslizar junto ao obstáculo.');
const second=World.create();assert.deepEqual(world.tiles,second.tiles,'Mapa deve ser estável entre aberturas.');

// Controlador: usa o mundo real e substitui apenas DOM e desenho.
class Element {
  constructor(id){this.id=id;this.events={};this.hidden=false;this.open=false;this.disabled=false;this.dataset={};this.classList={add(){},remove(){}};}
  addEventListener(type,fn){(this.events[type]||=[]).push(fn);}
  emit(type,event={}){for(const fn of this.events[type]||[])fn({target:this,currentTarget:this,preventDefault(){},...event});}
  focus(){focused=this.id;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  setPointerCapture(){}
  getBoundingClientRect(){return{left:0,top:0,right:600,bottom:400};}
}
let focused='',nextFrame,lastPlayer;
const ids=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const elements=new Map(ids.map(id=>[id,new Element(id)]));
const movement=['up','left','down','right'].map(d=>{const e=new Element(d);e.dataset.walk=d;return e;});
const start=new Element('start');
const document=new Element('document');document.hidden=false;document.body=new Element('body');
document.querySelector=s=>s==='[data-open="start"]'?start:elements.get(s.slice(1));
document.querySelectorAll=s=>s==='dialog'?ids.filter(id=>id.endsWith('-dialog')).map(id=>elements.get(id)):s==='[data-walk]'?movement:[];
const window=new Element('window');window.matchMedia=()=>({matches:false});
const renderer={ready:Promise.resolve(),failed:[],width:960,height:600,resize(){},draw(p){lastPlayer={...p};},renderOverview(){}};
const context=vm.createContext({document,window,IslandWorld:World,IslandRenderer:{create:()=>renderer},GameAudio:{click(){}},requestAnimationFrame:fn=>{nextFrame=fn;return 1;},cancelAnimationFrame(){nextFrame=null;}});
vm.runInContext(fs.readFileSync(path.join(root,'js/island-game.js'),'utf8'),context);
const game=window.GameIsland,$=id=>elements.get(id),key=(type,key)=>document.emit(type,{key});
let time=100;const tick=()=>{assert(nextFrame);nextFrame(time+=50);};
(async()=>{
  await Promise.resolve();game.start();tick();assert(game.active);assert.equal(focused,'island-canvas');
  key('keydown','e');assert($('island-info-dialog').open);assert.match($('island-info-title').textContent,/ilha inteira/);
  $('island-info-dialog').close();tick();
  const initial={...lastPlayer};key('keydown','w');for(let i=0;i<20;i++)tick();key('keyup','w');
  assert(Math.abs(lastPlayer.y-initial.y+210)<.01,'Velocidade: 210 px/s na trilha livre.');
  game.stop();game.start();tick();assert.equal(lastPlayer.y,initial.y-210,'Retorno ao menu preserva posição.');
  // Uma diagonal livre percorre a mesma distância que o movimento reto.
  const before={...lastPlayer};key('keydown','w');key('keydown','d');for(let i=0;i<10;i++)tick();key('keyup','w');key('keyup','d');
  assert(Math.abs(Math.hypot(lastPlayer.x-before.x,lastPlayer.y-before.y)-105)<.01,'Diagonal não deve ser mais rápida.');
  key('keydown','d');tick();key('keydown','m');assert($('island-map-dialog').open);const stopped={...lastPlayer};tick();tick();
  assert.equal(lastPlayer.x,stopped.x,'Mapa aberto deve interromper movimento.');$('island-map-dialog').close();tick();assert.equal(lastPlayer.x,stopped.x,'Fechar diálogo não deixa tecla presa.');assert.equal(focused,'island-canvas');
  key('keydown','w');$('book-dialog').showModal();tick();const bookPosition={...lastPlayer};tick();assert.equal(lastPlayer.y,bookPosition.y,'Livro pausa a exploração.');$('book-dialog').close();tick();assert.equal(lastPlayer.y,bookPosition.y,'Fechar o livro limpa o movimento.');
  key('keydown','Escape');assert($('island-pause-dialog').open);$('island-pause-dialog').close();
  movement[3].emit('pointerdown',{pointerId:7});tick();const movedX=lastPlayer.x;movement[3].emit('pointercancel',{pointerId:7});tick();assert.equal(lastPlayer.x,movedX,'Cancelar toque interrompe movimento.');
  key('keydown','s');window.emit('blur');tick();const afterBlur=lastPlayer.y;tick();assert.equal(lastPlayer.y,afterBlur,'Perder foco limpa o teclado.');
  // Teclas alternativas da mesma direção podem ser soltas independentemente.
  key('keydown','s');key('keydown','ArrowDown');key('keyup','s');tick();assert(lastPlayer.y>afterBlur);key('keyup','ArrowDown');
  game.stop();assert(!game.active);assert.equal(focused,'start');
  console.log(`Ilha verificada: ${queue.length} posições alcançáveis, 6 regiões, 7 interações, pontes, rio, obstáculos, velocidade, diagonais, toque, foco, pausa e retorno.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
