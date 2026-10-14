/* Mapa e colisões em coordenadas do mundo. Sem servidor ou arquivos de dados. */
window.IslandWorld = (() => {
  'use strict';
  const TILE = 48, COLS = 96, ROWS = 72;
  const terrain = {water:0, grass:1, sand:2, path:3, stone:4, bridge:5};
  const routes = [
    [[48,42],[48,36],[41,33],[33,29],[24,25],[20,21]],
    [[48,36],[55,38],[64,38],[72,36],[76,29],[77,22]],
    [[48,42],[43,46],[35,49],[26,53],[21,54]],
    [[72,36],[77,43],[78,53],[83,57]],
    [[26,53],[36,57],[47,58],[57,55],[64,55],[77,53]],
    [[48,36],[48,27],[48,20],[48,11]]
  ];
  const regions = [
    {id:'center', name:'Praça do Portal', short:'Praça', x:48, y:39, color:'#efd599'},
    {id:'forest', name:'Floresta dos Padrões', short:'Floresta', x:22, y:23, color:'#56844b'},
    {id:'village', name:'Vila do Conhecimento', short:'Vila', x:25, y:53, color:'#c88864'},
    {id:'ruins', name:'Ruínas das Formas', short:'Ruínas', x:77, y:23, color:'#e2c383'},
    {id:'farm', name:'Fazenda dos Números', short:'Fazenda', x:78, y:53, color:'#b0bc62'},
    {id:'mountain', name:'Montanha do Gato', short:'Montanha', x:48, y:12, color:'#8997a1'}
  ];
  const points = [
    {id:'guide', x:50, y:43, title:'Uma ilha inteira para descobrir', chapter:'PLACA DA PRAÇA', text:'O portal trouxe você até aqui! Siga os caminhos: a floresta fica à esquerda e acima; a vila, à esquerda e abaixo. Do outro lado das pontes estão as ruínas e a fazenda. O gato espera na montanha, ao norte.', note:'Explore com WASD ou setas. Perto de uma placa, use E. M abre o mapa e Esc pausa a aventura.', action:'Ler a placa'},
    {id:'portal', x:44, y:43, title:'O começo da sua aventura', chapter:'PORTAL DE CHEGADA', text:'Foi por este portal que você chegou à ilha em busca do seu gato. Guarde este lugar na memória: ele fica pertinho da praça central.', note:'Encontre as placas das quatro regiões. Cada uma leva a um desafio em um ambiente próprio. Conquiste as chaves e volte à montanha!', action:'Olhar o portal'},
    {id:'forest', x:21, y:23, title:'Floresta dos Padrões', chapter:'RACIOCÍNIO LÓGICO', text:'Entre árvores e trilhas, os padrões escondem pistas. Observe e repita sequências para conquistar a chave verde.', note:'Três desafios na clareira. Você pode rever a sequência e tentar de novo.', action:'Entrar na clareira'},
    {id:'village', x:26, y:54, title:'Vila do Conhecimento', chapter:'ÁLGEBRA INICIAL', text:'As casinhas desta vila guardam números misteriosos. Descubra o número que falta para conquistar a chave azul.', note:'Três desafios na biblioteca. Escolha o número que completa cada conta.', action:'Entrar na biblioteca'},
    {id:'ruins', x:77, y:24, title:'Ruínas das Formas', chapter:'GEOMETRIA', text:'As peças destas ruínas guardam um segredo. Gire cada peça até encontrar o encaixe e conquistar a chave vermelha.', note:'Três desafios no pátio. Compare a peça com o encaixe e gire um quarto de volta.', action:'Entrar no pátio das formas'},
    {id:'farm', x:78, y:54, title:'Fazenda dos Números', chapter:'OPERAÇÕES', text:'O moinho gira e a horta cresce! Escolha a resposta das contas para conquistar a chave amarela.', note:'Três desafios no moinho. Use as pistas e tente quantas vezes quiser.', action:'Entrar no moinho'},
    {id:'mountain', x:48, y:11, title:'Você encontrou seu gato!', chapter:'MONTANHA DO GATO', text:'Miau! Seu amigo está aqui, esperando por você. As quatro chaves abrem os cadeados para libertá-lo.', note:'Cada chave abre o cadeado correspondente. Volte às regiões para buscar as chaves que faltam.', action:'Ajudar o gato'}
  ];
  function noise(x,y,seed=0) {
    let n = Math.imul(x + seed * 71,374761393) ^ Math.imul(y + seed * 19,668265263);
    n = Math.imul(n ^ (n >>> 13),1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  const ellipse = (x,y,cx,cy,rx,ry) => ((x-cx)/rx)**2 + ((y-cy)/ry)**2;
  function regionAt(x,y) {
    const tx=x/TILE, ty=y/TILE;
    if(ty<23 && tx>36 && tx<59)return regions[5];
    if(tx<37 && ty<39)return regions[1];
    if(tx<38 && ty>=39)return regions[2];
    if(tx>66 && ty<40)return regions[3];
    if(tx>65 && ty>=40)return regions[4];
    return regions[0];
  }
  function create() {
    const tiles=new Uint8Array(COLS*ROWS), objects=[], colliders=[];
    const at=(x,y)=>x<0||y<0||x>=COLS||y>=ROWS?terrain.water:tiles[y*COLS+x];
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++) {
      const edge=Math.sin(x*.59+y*.28)*.035+Math.cos(y*.73-x*.23)*.035;
      const land=Math.min(ellipse(x,y,48,39,40,28),ellipse(x,y,22,25,19,18),ellipse(x,y,25,52,21,17),ellipse(x,y,75,25,18,19),ellipse(x,y,76,53,18,17),ellipse(x,y,48,16,14,13)) < 1+edge;
      const river=y>=27 && y<69 && Math.abs(x-64)<1.55;
      const lake=ellipse(x,y,64,26,4,4)<1;
      tiles[y*COLS+x]=land&&!river&&!lake?terrain.grass:terrain.water;
    }
    const original=tiles.slice();
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(at(x,y)!==terrain.water) {
      let coast=false;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++) {
        if(x+dx<0||y+dy<0||x+dx>=COLS||y+dy>=ROWS||original[(y+dy)*COLS+x+dx]===terrain.water)coast=true;
      }
      if(coast||ellipse(x,y,77,24,12,12)<1)tiles[y*COLS+x]=terrain.sand;
      if(ellipse(x,y,48,12,11,9)<1)tiles[y*COLS+x]=terrain.stone;
    }
    function disk(cx,cy,r,type) {
      for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++) {
        if(x<0||y<0||x>=COLS||y>=ROWS||at(x,y)===terrain.water)continue;
        if((x-cx)**2+(y-cy)**2<=r*r)tiles[y*COLS+x]=type;
      }
    }
    for(const route of routes)for(let p=1;p<route.length;p++) {
      const [ax,ay]=route[p-1], [bx,by]=route[p], length=Math.hypot(bx-ax,by-ay);
      for(let i=0;i<=length*3;i++)disk(ax+(bx-ax)*i/(length*3),ay+(by-ay)*i/(length*3),1.45,terrain.path);
    }
    disk(48,38,5.8,terrain.path);
    disk(48,35,3.1,terrain.stone);
    for(const cy of [38,55])for(let y=cy-1;y<=cy+1;y++)for(let x=61;x<=67;x++)tiles[y*COLS+x]=terrain.bridge;
    // É possível passar sob a copa; só a base da árvore bloqueia os pés.
    function add(kind,tx,ty,width,height,extra={}) {
      const object={kind,x:(tx+.5)*TILE,y:(ty+.5)*TILE,width,height,...extra};
      objects.push(object);
      if(extra.solid!==false) {
        const footprint=extra.footprint||[width*.68,height*.26];
        if(kind==='arch') {
          for(const side of [-1,1])colliders.push({x:object.x+side*55-17,y:object.y-42,width:34,height:42,kind});
        } else colliders.push({x:object.x-footprint[0]/2,y:object.y-footprint[1],width:footprint[0],height:footprint[1],kind});
      }
      return object;
    }
    add('fountain',48,35,138,100,{footprint:[114,66]});
    add('portal',44,43,140,148,{footprint:[98,32]});
    for(const point of points.filter(p=>p.id!=='portal'&&p.id!=='mountain'))add('sign',point.x,point.y,46,56,{footprint:[24,16],point:point.id});
    // Vila: as portas e as ruas permanecem livres.
    for(const [x,y,color] of [[20,50,'#b96650'],[26,49,'#578a8d'],[31,52,'#aa735d'],[19,57,'#77894b'],[29,58,'#a97696']])add('house',x,y,182,166,{color,footprint:[150,75]});
    add('well',24,57,76,85,{footprint:[56,42]});
    add('house',23,44,230,200,{color:'#7289a0',library:true,footprint:[196,96]});
    // Ruínas: um pátio e colunas separadas por passagens largas.
    for(const [x,y] of [[72,18],[77,17],[82,18],[71,24],[83,24],[72,29],[82,29]])add('column',x,y,60,106,{footprint:[46,36]});
    add('arch',77,20,156,156,{footprint:[136,42]});
    for(const [x,y,shape] of [[74,26,'triangle'],[78,28,'square'],[81,22,'circle']])add('tablet',x,y,66,66,{shape,footprint:[54,40]});
    // Fazenda e moinho. A horta é decorativa e pode ser atravessada.
    add('barn',73,49,228,204,{footprint:[200,110]});
    add('mill',82,49,200,256,{footprint:[104,70]});
    for(const [x,y] of [[73,57],[79,58],[84,55],[85,60]])add('crops',x,y,180,132,{solid:false});
    for(const [x,y] of [[70,58],[82,62],[87,53]])add('hay',x,y,60,50,{footprint:[52,32]});
    // Os paredões ladeiam a subida da montanha, sem fechar a trilha.
    for(const [x,y,w,h] of [[41,18,190,110],[55,18,200,124],[42,14,162,118],[54,13,170,110],[43,9,138,110],[53,8,170,118]])add('cliff',x,y,w,h,{footprint:[w*.82,60]});
    add('cat',48,10,36,45,{solid:false});
    add('rescue',48,10,122,114,{solid:false});
    // Distribuição estável; árvores nunca ocupam estradas ou pontos de interação.
    for(let y=5;y<ROWS-4;y++)for(let x=5;x<COLS-4;x++) {
      if(at(x,y)!==terrain.grass||noise(x,y,4)>(x<36&&y<37?.29:.085))continue;
      if(points.some(p=>Math.hypot(p.x-x,p.y-y)<3.2))continue;
      if(objects.some(o=>Math.abs(o.x/TILE-x)<o.width/TILE/2+1.5&&Math.abs(o.y/TILE-y)<o.height/TILE+1))continue;
      if([[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>[terrain.path,terrain.bridge,terrain.stone].includes(at(x+dx,y+dy))))continue;
      const variant=noise(x,y,12);
      add('tree',x+noise(x,y,7)*.35,y,variant>.82?82:120,150,{footprint:[28,23],art:variant>.82?'treeCypress':variant>.30?'treeCanopy':'treeOriginal'});
    }
    for(let i=0;i<80;i++) {
      const x=7+Math.floor(noise(i,8,9)*82),y=6+Math.floor(noise(i,9,10)*59);
      if(at(x,y)!==terrain.grass||points.some(p=>Math.hypot(p.x-x,p.y-y)<3))continue;
      if(objects.some(o=>Math.abs(o.x/TILE-x)<3&&Math.abs(o.y/TILE-y)<3))continue;
      add('rock',x,y,42,28,{footprint:[32,18]});
    }
    // Pequenas composições por lugar: a decoração segue os espaços de uso.
    const props=[
      ['bench',45,36,86,54],['bench',51,36,86,54],
      ['flowerBush',43,34,66,55],['flowerBush',53,34,66,55],
      ['flowerBush',42,41,68,56],['flowerBush',53,44,64,54],
      ['flowers',45.8,43.2,38,32],['flowers',51.4,43.4,38,32],
      ['fern',43.5,42.5,36,30],['flowerBush',42.8,45.2,66,54],
      ['stump',19,26,64,52],['berryBush',25,20,68,56],['fern',18,22,45,36],
      ['flowerBush',23,29,68,56],['stump',15,18,58,48],['berryBush',29,23,68,56],
      ['bench',27,56,80,52],['harvest',18,51,70,62],['flowerBush',32.7,52,66,56],
      ['flowerBush',27.8,49.5,60,52],['flowerBush',21.7,57.4,60,52],['harvest',30.8,58.5,64,58],
      ['berryBush',22,46,68,56],['bench',25,45,78,52],
      ['fern',73,19,42,34],['flowerBush',80.8,20.8,64,52],['rock',80,26,52,38],
      ['fern',75,28,42,34],['flowers',74,23,38,32],
      ['harvest',71,50,70,62],['harvest',80,49,70,62],
      ['fence',72,58.8,110,54],['fence',74.3,58.8,110,54],
      ['fence',83,56.8,110,54],['fence',85.3,56.8,110,54],
      ['flowerBush',80.2,52,64,54],['berryBush',86,49,64,54],
      ['fern',45.6,17,40,34],['fern',51,15,40,34],['flowers',45.8,11.2,36,30]
    ];
    for(const [kind,x,y,w,h] of props) {
      const solid=['bench','stump','harvest','fence','rock'].includes(kind);
      add(kind,x,y,w,h,{solid,footprint:kind==='fence'?[w*.88,12]:[w*.65,Math.min(24,h*.3)]});
    }
    // Clareiras com manchas de flores e folhas, evitando uma grade de enfeites.
    const meadows=[[40,40,7],[54,47,7],[30,37,8],[19,61,6],[78,61,7],[84,33,5]];
    for(let i=0;i<310;i++) {
      const [cx,cy,r]=meadows[i%meadows.length];
      const angle=noise(i,4,20)*Math.PI*2,dist=Math.sqrt(noise(i,6,21))*r;
      const tx=cx+Math.cos(angle)*dist,ty=cy+Math.sin(angle)*dist;
      if(at(Math.floor(tx),Math.floor(ty))!==terrain.grass)continue;
      const wx=(tx+.5)*TILE,wy=(ty+.5)*TILE;
      if(points.some(p=>Math.hypot(p.x-tx,p.y-ty)<1.7))continue;
      if(objects.some(o=>Math.abs(o.x-wx)<(o.width/2+18)&&Math.abs(o.y-wy)<28))continue;
      add(i%3?'fern':'flowers',tx,ty,i%3?32:38,i%3?27:32,{solid:false});
    }
    return {tile:TILE,cols:COLS,rows:ROWS,width:COLS*TILE,height:ROWS*TILE,tiles,objects,colliders,regions,routes,points:points.map(p=>({...p,x:(p.x+.5)*TILE,y:(p.y+.5)*TILE})),spawn:{x:48.5*TILE,y:43.5*TILE},at};
  }
  function isWalkable(world,x,y,radius=11) {
    for(const [dx,dy] of [[0,0],[-radius,0],[radius,0],[0,-radius*.55],[0,radius*.55],[-radius*.7,-radius*.4],[radius*.7,radius*.4]]) {
      if(world.at(Math.floor((x+dx)/TILE),Math.floor((y+dy)/TILE))===terrain.water)return false;
    }
    return !world.colliders.some(box=>x+radius>box.x&&x-radius<box.x+box.width&&y+6>box.y&&y-6<box.y+box.height);
  }
  function movePlayer(world,position,dx,dy) {
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));
    for(let i=0;i<steps;i++) {
      if(isWalkable(world,position.x+dx/steps,position.y))position.x+=dx/steps;
      if(isWalkable(world,position.x,position.y+dy/steps))position.y+=dy/steps;
    }
  }
  return {create,terrain,noise,regionAt,isWalkable,movePlayer};
})();
