// QA visual do renderer real em Canvas nativo. Não executa navegador ou CSS.
// Uso: node tools/renderizar-ilha.cjs [caminho para @napi-rs/canvas]
// O pacote é uma ferramenta de desenvolvimento; não é dependência do jogo.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image}=require(process.argv[2]||'@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs','previews','ilha-v4');
fs.mkdirSync(out,{recursive:true});
class LocalImage extends Image {
  set src(value){super.src=fs.readFileSync(path.join(root,value));}
  get naturalWidth(){return this.width;}
  get naturalHeight(){return this.height;}
  get complete(){return this.width>0;}
}
const context=vm.createContext({Image:LocalImage,window:{devicePixelRatio:1},document:{createElement:()=>createCanvas(1,1)}});
for(const file of ['island-world.js','island-art.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
context.IslandWorld=context.window.IslandWorld;context.IslandArt=context.window.IslandArt;
vm.runInContext(fs.readFileSync(path.join(root,'js/island-renderer.js'),'utf8'),context);
const world=context.IslandWorld.create(),canvas=createCanvas(960,600),mini=createCanvas(192,144),map=createCanvas(576,432);
canvas.getBoundingClientRect=()=>({width:960,height:600});
const renderer=context.window.IslandRenderer.create(canvas,mini,map,world);
(async()=>{
  await renderer.ready;assert.equal(renderer.failed.length,0,'Todas as imagens devem abrir.');renderer.resize();
  const contact=createCanvas(1440,664),contactCtx=contact.getContext('2d');
  contactCtx.fillStyle='#253d36';contactCtx.fillRect(0,0,1440,664);contactCtx.imageSmoothingEnabled=false;
  const points=[['praca',48,40,'Praça do Portal'],['floresta',21,24,'Floresta dos Padrões'],['vila',25,53,'Vila do Conhecimento'],['ruinas',77,24,'Ruínas das Formas'],['fazenda',78,54,'Fazenda dos Números'],['montanha',48,12,'Montanha do Gato']];
  const visited=new Set(world.regions.map(r=>r.id));
  for(let index=0;index<points.length;index++) {
    const [id,tx,ty,label]=points[index],player={x:(tx+.5)*48,y:(ty+.5)*48,facing:'down',moving:false};
    if(!context.IslandWorld.isWalkable(world,player.x,player.y))player.y+=48;
    assert(context.IslandWorld.isWalkable(world,player.x,player.y),`Posição de prévia livre: ${id}`);
    const camera={x:player.x-480,y:player.y-348};
    renderer.draw(player,camera,null,2200,true,visited);
    const buffer=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(out,id+'.png'),buffer);
    const x=index%3*480,y=Math.floor(index/3)*332;
    const snapshot=await new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=buffer;
    });
    contactCtx.drawImage(snapshot,x,y,480,300);contactCtx.fillStyle='#f3deb5';contactCtx.font='16px sans-serif';contactCtx.fillText(label,x+12,y+322);
  }
  fs.writeFileSync(path.join(out,'panorama.png'),contact.toBuffer('image/png'));
  renderer.renderOverview({x:world.spawn.x,y:world.spawn.y},{x:0,y:0},visited,true);
  fs.writeFileSync(path.join(out,'mapa.png'),map.toBuffer('image/png'));
  const garden=world.objects.find(o=>o.kind==='crops');
  const gardenPlayer={x:garden.x,y:garden.y-56,facing:'down',moving:false};
  renderer.draw(gardenPlayer,{x:gardenPlayer.x-480,y:gardenPlayer.y-348},null,2200,true,visited);
  fs.writeFileSync(path.join(out,'horta.png'),canvas.toBuffer('image/png'));
  // Imagens de movimento reduzido e uma janela menor usam o mesmo renderer.
  canvas.getBoundingClientRect=()=>({width:390,height:500});renderer.resize();
  renderer.draw({...world.spawn,facing:'down',moving:false},{x:world.spawn.x-195,y:world.spawn.y-290},world.points[0],500,false,visited);
  fs.writeFileSync(path.join(out,'janela-pequena.png'),canvas.toBuffer('image/png'));
  console.log(`Renderer verificado: ${Object.keys(context.IslandArt.sources).length} imagens locais abertas, seis regiões e área de 390 x 500 pixels renderizadas. Não é teste de navegador.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
