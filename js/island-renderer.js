/* Desenho em Canvas 2D: imagens locais, terreno, profundidade e orientação. */
window.IslandRenderer = (() => {
  'use strict';
  const T=48, types=IslandWorld.terrain, noise=IslandWorld.noise;
  const sources={island:'ilha/ilha.jpeg',front:IslandArt.sources.front,back:IslandArt.sources.back,side:IslandArt.sources.side};
  function create(canvas,miniCanvas,mapCanvas,world) {
    const ctx=canvas.getContext('2d'),mini=miniCanvas.getContext('2d'),map=mapCanvas.getContext('2d');
    const images={},failed=[],patterns={};
    const ready=Promise.all(Object.entries(sources).map(([name,path])=>new Promise(resolve=>{
      const img=new Image();images[name]=img;
      img.onload=async()=>{
        if(name==='island') {
          world.width=img.naturalWidth*WORLD_SCALE;world.height=img.naturalHeight*WORLD_SCALE;
          overviewCtx.drawImage(img,0,0,overview.width,overview.height);
          try {await IslandWorld.buildCollision(world,img);}
          catch(error){world.collision=null;console.error('[Colisão] Falha ao preparar terreno; movimento bloqueado.',error);failed.push('colisão do terreno');}
        }
        resolve();
      };img.onerror=()=>{failed.push(path);resolve();};img.src=`assets/${path}`;
    }))).then(()=>window.IslandKeys?.load());
    let width=960,height=600,dpr=1,debug=false,zoom=CAMERA_ZOOM;
    // Única escala mapa → tela; o mínimo de encaixe evita expor área fora do JPEG.
    const scale=()=>Math.max(WORLD_SCALE*zoom,width/(images.island?.naturalWidth||Infinity),height/(images.island?.naturalHeight||Infinity));
    const viewSize=()=>{const s=scale();return {width:width*WORLD_SCALE/s,height:height*WORLD_SCALE/s};};
    document.addEventListener('keydown',event=>{
      if(!debug||canvas.closest('[hidden]')||document.querySelector('dialog[open]')||event.ctrlKey||event.altKey||event.metaKey)return;
      if(!['+','=','-','_'].includes(event.key))return;
      event.preventDefault();
      zoom=Math.max(.8,Math.min(2,Math.round((zoom+(['-','_'].includes(event.key)?-.05:.05))*100)/100));
    });
    const overview=document.createElement('canvas');overview.width=world.cols*3;overview.height=world.rows*3;
    const overviewCtx=overview.getContext('2d');
    function resize() {
      const rect=canvas.getBoundingClientRect();
      width=Math.max(320,Math.round(rect.width));height=Math.max(240,Math.round(rect.height));
      dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.imageSmoothingEnabled=false;
    }
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    function polygon(coords,color) {
      ctx.fillStyle=color;ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
    }
    function ellipse(x,y,rx,ry,color) {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
    function sprite(name,x,y,w,h,flip=false) {
      const img=images[name];if(!img?.complete||!img.naturalWidth)return false;
      const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);
      const sw=Math.round(img.naturalWidth*ratio),sh=Math.round(img.naturalHeight*ratio);
      ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.drawImage(img,-sw/2,-sh,sw,sh);ctx.restore();
      return true;
    }
    function fallbackTile(x,y,time,reducedMotion) {
      const type=world.at(x,y),px=x*T,py=y*T,n=noise(x,y);
      if(type===types.water) {
        rect(px,py,T,T,'#55acbc');
        const phase=reducedMotion?0:Math.floor(time/1300)%3;
        rect(px+8+n*19,py+12+((x+y+phase)%3)*7,16,2,'#88cdd0');
        rect(px+13+n*15,py+14+((x+y+phase)%3)*7,7,2,'#b5e5db');
        if(world.at(x-1,y)!==types.water)rect(px,py,5,T,'#9cd6cb');
        if(world.at(x+1,y)!==types.water)rect(px+T-5,py,5,T,'#9cd6cb');
        if(world.at(x,y-1)!==types.water)rect(px,py,T,5,'#9cd6cb');
        if(world.at(x,y+1)!==types.water)rect(px,py+T-5,T,5,'#9cd6cb');
        return;
      }
      if(type===types.grass) {
        const forest=x<36&&y<38;
        rect(px,py,T,T,forest?'#7b9b55':'#91ad61');
        for(let i=0;i<5;i++) {
          const a=noise(x,y,i+1),b=noise(x,y,i+11);
          rect(px+5+a*36,py+5+b*36,3,2,i%2?'#a5bc72':forest?'#658a4e':'#7d9d54');
          if(i===0&&a>.76){rect(px+5+a*36,py+1+b*36,2,4,'#5e8447');rect(px+3+a*36,py+b*36,5,2,'#e9d782');}
        }
      } else if(type===types.sand) {
        rect(px,py,T,T,'#e5cb93');
        for(let i=0;i<4;i++)rect(px+6+noise(x,y,i+2)*35,py+6+noise(y,x,i+9)*35,3,2,'#cbb27d');
      } else if(type===types.stone) {
        rect(px,py,T,T,'#9cab9d');
        rect(px+3,py+3,42,19,n>.5?'#adb8a4':'#a4b29f');
        rect(px+3,py+25,20,20,'#b1b8a6');rect(px+26,py+25,19,20,'#a9b6a2');
        rect(px+5,py+4,36,2,'#c4ccaf');
      } else if(type===types.path) {
        rect(px,py,T,T,'#ccaf79');
        rect(px+7+n*26,py+8+noise(y,x)*28,7,3,'#b99c6d');
        rect(px+4+noise(x,y,5)*33,py+4+noise(x,y,7)*34,4,2,'#e3ca91');
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(world.at(x+dx,y+dy)===types.grass) {
          if(dx)rect(px+(dx<0?0:44),py,4,T,'#a1a96b');
          if(dy)rect(px,py+(dy<0?0:44),T,4,'#a1a96b');
        }
      } else if(type===types.bridge) {
        rect(px,py,T,T,'#70533f');
        for(let i=0;i<4;i++){rect(px+2+i*12,py+2,9,44,i%2?'#b68a5b':'#c29a67');rect(px+3+i*12,py+3,7,2,'#d7b481');}
        if(world.at(x,y-1)!==types.bridge||world.at(x,y+1)!==types.bridge) {
          const railY=world.at(x,y-1)!==types.bridge?py+3:py+41;
          rect(px,railY,T,6,'#4e4435');rect(px,railY-6,6,15,'#796345');rect(px+42,railY-6,6,15,'#796345');
        }
      }
    }
    function house(o,barn=false) {
      const {x,y,width:w,height:h}=o,top=y-h;
      ellipse(x,y+2,w*.54,12,'#3e593b33');
      rect(x-w*.42,top+h*.38,w*.84,h*.62,'#624b3b');
      rect(x-w*.40,top+h*.4,w*.8,h*.58,barn?'#b7644c':'#eed4a2');
      rect(x-w*.4,y-12,w*.8,12,'#b09670');
      polygon([[x-w*.52,top+h*.42],[x-w*.45,top+h*.12],[x,top],[x+w*.45,top+h*.12],[x+w*.52,top+h*.42]],'#574737');
      polygon([[x-w*.48,top+h*.37],[x-w*.42,top+h*.14],[x,top+7],[x+w*.42,top+h*.14],[x+w*.48,top+h*.37]],o.color||'#a85743');
      for(let i=0;i<4;i++)rect(x-w*.38,top+h*(.18+i*.052),w*.76,3,barn?'#d48760':'#ffffff20');
      rect(x-w*.3,top+h*.05,18,h*.17,'#736555');rect(x-w*.32,top+h*.04,23,6,'#9d9379');
      rect(x-19,y-57,38,57,'#6c513d');rect(x-14,y-53,28,49,barn?'#834e39':'#ae8556');
      rect(x+7,y-29,4,4,'#f2d797');
      if(barn){rect(x-40,y-74,80,6,'#e8d3a1');polygon([[x-33,y-7],[x+33,y-57],[x+36,y-51],[x-30,y-1]],'#e8d3a1');}
      else for(const dx of [-w*.27,w*.27]){rect(x+dx-15,y-66,30,35,'#6a604c');rect(x+dx-11,y-62,22,26,'#7caca8');rect(x+dx-1,y-63,3,29,'#ede0b6');rect(x+dx-13,y-51,26,3,'#ede0b6');rect(x+dx-18,y-29,36,6,'#a37650');}
      rect(x-28,y-3,56,10,'#b8b096');rect(x-32,y+7,64,5,'#93977d');
      if(o.library){rect(x-43,y-100,86,23,'#5c7057');ctx.fillStyle='#f8e3ac';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('BIBLIOTECA',x,y-84);}
    }
    function fallbackObject(o,time,reducedMotion) {
      const {x,y,width:w,height:h}=o;
      if(o.kind==='tree'){ellipse(x,y,43,12,'#415b3933');sprite('treeOriginal',x,y,w,h);return;}
      if(o.kind==='cat'){sprite('cat',x,y,w,h);return;}
      if(o.kind==='house'||o.kind==='barn'){house(o,o.kind==='barn');return;}
      if(o.kind==='portal') {
        ellipse(x,y+2,51,13,'#4c5a5944');rect(x-43,y-12,86,15,'#7b8d89');
        polygon([[x-34,y-12],[x-34,y-80],[x-20,y-104],[x+20,y-104],[x+34,y-80],[x+34,y-12]],'#485a6e');
        polygon([[x-25,y-14],[x-25,y-75],[x-13,y-95],[x+13,y-95],[x+25,y-75],[x+25,y-14]],'#9eb7c1');
        rect(x-22,y-72,44,57,'#b1b1d8');rect(x-18,y-64,36,49,'#cbd5e7');
        for(let i=0;i<4;i++){rect(x-40,y-75+i*18,12,13,'#899d9d');rect(x+28,y-75+i*18,12,13,'#899d9d');}
        rect(x-27,y-94,54,12,'#a2b5ae');rect(x-14,y-105,28,11,'#bccaba');
        const drift=reducedMotion?0:Math.sin(time/600)*4;rect(x-3,y-56+drift,6,6,'#fff3c3');rect(x+11,y-34-drift,3,3,'#fff3c3');
      } else if(o.kind==='sign') {
        ellipse(x,y+2,22,6,'#415b3933');rect(x-4,y-34,8,36,'#775334');rect(x-24,y-55,48,30,'#674c32');rect(x-21,y-52,42,23,'#deb575');rect(x-15,y-46,30,3,'#8f7048');rect(x-12,y-40,24,3,'#8f7048');
      } else if(o.kind==='fountain') {
        ellipse(x,y,69,28,'#64786f');ellipse(x,y-7,64,26,'#c4c7aa');ellipse(x,y-12,53,21,'#67b2b8');ellipse(x,y-13,43,16,'#92d1c8');
        rect(x-14,y-66,28,51,'#7d918d');rect(x-10,y-65,20,46,'#b3bfaa');ellipse(x,y-61,27,12,'#657d78');ellipse(x,y-67,28,11,'#c8d1b2');ellipse(x,y-70,20,7,'#82bdbc');
        rect(x-3,y-84,6,16,'#d4eee0');rect(x-19,y-56,3,24,'#bce6d5');rect(x+17,y-56,3,24,'#bce6d5');
      } else if(o.kind==='well') {
        ellipse(x,y,37,16,'#626c60');rect(x-33,y-35,66,29,'#acb39b');ellipse(x,y-34,33,13,'#d2cdb0');ellipse(x,y-35,22,8,'#4e6967');rect(x-31,y-68,7,47,'#765b40');rect(x+24,y-68,7,47,'#765b40');polygon([[x-42,y-64],[x,y-91],[x+42,y-64]],'#986648');
      } else if(o.kind==='column') {
        ellipse(x,y+3,34,9,'#a1896033');rect(x-28,y-12,56,15,'#998e72');rect(x-22,y-21,44,10,'#c8bd97');rect(x-17,y-90,34,70,'#b6ac8c');rect(x-12,y-88,7,63,'#dfd2a8');rect(x+10,y-88,5,67,'#978f75');rect(x-25,y-102,50,15,'#958e73');rect(x-22,y-105,44,8,'#e0d0a5');
      } else if(o.kind==='arch') {
        for(const dx of [-55,55]){rect(x+dx-17,y-128,34,128,'#b9ae8d');rect(x+dx-12,y-121,7,112,'#d6c9a0');rect(x+dx-23,y-12,46,15,'#9d957b');}
        rect(x-72,y-141,144,30,'#8d8a75');rect(x-67,y-143,134,19,'#d2c49a');rect(x-22,y-157,44,25,'#aa9b7e');rect(x-15,y-151,30,14,'#e0cf9e');
      } else if(o.kind==='tablet') {
        rect(x-33,y-50,66,51,'#9f9275');rect(x-29,y-54,58,48,'#d2bd8e');rect(x-24,y-49,48,38,'#bba678');
        if(o.shape==='triangle')polygon([[x,y-44],[x-17,y-17],[x+17,y-17]],'#776f5e');
        if(o.shape==='square')rect(x-14,y-42,28,25,'#776f5e');
        if(o.shape==='circle')ellipse(x,y-29,14,13,'#776f5e');
      } else if(o.kind==='mill') {
        rect(x-48,y-135,96,135,'#b9b69c');rect(x-42,y-132,84,127,'#d5ceb0');polygon([[x-63,y-134],[x,y-193],[x+63,y-134]],'#8d644f');rect(x-15,y-47,30,47,'#715a42');rect(x-12,y-104,24,28,'#7ba6a5');
        const angle=reducedMotion?Math.PI/4:time/4200;
        ctx.save();ctx.translate(x,y-158);ctx.rotate(angle);
        for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);rect(-5,4,10,84,'#705b45');rect(5,22,28,66,'#ece0b6');for(let j=0;j<4;j++)rect(5,25+j*17,28,3,'#a7946a');}ellipse(0,0,11,11,'#685741');ctx.restore();
      } else if(o.kind==='crops') {
        rect(x-w/2,y-h,w,h,'#82674c');rect(x-w/2+5,y-h+5,w-10,h-10,'#ac8053');
        for(let row=0;row<4;row++)for(let col=0;col<7;col++) {
          const sx=x-w/2+16+col*24,sy=y-h+18+row*26;rect(sx-6,sy+4,17,3,'#795f44');rect(sx,sy-4,5,15,'#5d883f');rect(sx-6,sy-2,6,7,'#78a64b');rect(sx+5,sy-7,6,9,'#adc265');rect(sx+1,sy+2,4,5,'#de9856');
        }
      } else if(o.kind==='hay') {
        rect(x-30,y-38,60,38,'#b89b52');rect(x-27,y-41,54,36,'#e1c276');for(let i=0;i<5;i++)rect(x-23+i*10,y-36,3,27,'#cbae5e');rect(x-12,y-42,5,39,'#947548');rect(x+12,y-42,5,39,'#947548');
      } else if(o.kind==='rock'||o.kind==='cliff') {
        polygon([[x-w/2,y],[x-w*.48,y-h*.55],[x-w*.23,y-h],[x+w*.27,y-h*.92],[x+w*.5,y-h*.46],[x+w/2,y]],o.kind==='rock'?'#839181':'#6f807e');
        polygon([[x-w*.44,y-h*.56],[x-w*.21,y-h+6],[x+w*.24,y-h*.88],[x+w*.42,y-h*.46],[x+w*.15,y-h*.36],[x-w*.17,y-h*.4]],'#a6b0a1');rect(x-w*.31,y-h*.31,w*.21,4,'#899993');rect(x+w*.12,y-h*.17,w*.24,4,'#536e6b');
      } else if(o.kind==='rescue') {
        rect(x-61,y+3,122,9,'#7c8074');
        for(const dx of [-54,54]){rect(x+dx-5,y-104,10,107,'#9d9b83');rect(x+dx-7,y-108,14,8,'#d0c3a0');}
        rect(x-57,y-105,114,8,'#b4ae91');
        for(let i=0;i<4;i++){const lx=x-33+i*22;rect(lx-6,y-12,12,17,'#676d65');rect(lx-4,y-16,8,7,'#c5b895');rect(lx-2,y-9,4,5,'#d9c38b');}
      }
    }
    function ground(name,x,y) {
      const img=images[`ground-${name}`];
      if(!img?.complete||!img.naturalWidth)return false;
      const sx=((x%96)+96)%96,sy=((y%96)+96)%96;
      ctx.drawImage(img,sx,sy,T,T,x,y,T,T);return true;
    }
    function tile(x,y,time,reducedMotion) {
      const type=world.at(x,y),px=x*T,py=y*T;
      if(type===types.bridge){fallbackTile(x,y,time,reducedMotion);return;}
      const region=IslandWorld.regionAt(px,py).id;
      const name=type===types.path?(region==='ruins'?'sand':region==='mountain'?'paving':'grass'):
        type===types.stone&&y>25?'grass':{0:'water',1:'grass',2:'sand',4:'paving'}[type];
      if(!ground(name,px,py)){fallbackTile(x,y,time,reducedMotion);return;}
      if(name==='grass') {
        // A sombra da floresta se mistura à campina em uma faixa de transição.
        const shade=Math.max(0,Math.min(1,(37-x)/6))*Math.max(0,Math.min(1,(39-y)/6));
        if(shade){ctx.globalAlpha=shade;ground('forest',px,py);ctx.globalAlpha=1;}
      }
      if(type===types.sand) {
        const grassAt=(dx,dy)=>world.at(x+dx,y+dy)===types.grass;
        // Cantos recortados suavizam as trilhas sem alterar a área caminhável.
        for(const [cx,cy,dx,dy] of [[0,0,-1,-1],[T,0,1,-1],[0,T,-1,1],[T,T,1,1]]) {
          if(!grassAt(dx,0)||!grassAt(0,dy))continue;
          ctx.save();ctx.beginPath();
          for(let row=0;row<3;row++) {
            const size=12-row*4;
            ctx.rect(px+cx+(dx<0?0:-size),py+cy+(dy<0?row*4:-row*4-4),size,4);
          }
          ctx.clip();ground(x<34&&y<35?'forest':'grass',px,py);ctx.restore();
        }
      }
      if(type===types.water) {
        const drift=reducedMotion?0:Math.sin(time/950+x*.7+y*.4)*2;
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(world.at(x+dx,y+dy)!==types.water) {
          const tint='#c4e4ca';
          if(dx){rect(px+(dx<0?2:43),py+3+drift,3,20,tint);rect(px+(dx<0?4:41),py+27-drift,2,16,'#96d4c6');}
          else {rect(px+3+drift,py+(dy<0?2:43),20,3,tint);rect(px+27-drift,py+(dy<0?4:41),16,2,'#96d4c6');}
        }
        if(!reducedMotion&&noise(x,y,31)>.8) {
          const shimmer=(Math.sin(time/1400+x+y)+1)/2;
          ctx.globalAlpha=shimmer*.28;rect(px+12,py+20,16,2,'#d6f1de');ctx.globalAlpha=1;
        }
      }
    }
    function roads(minX,minY,maxX,maxY) {
      for(const name of ['dirt','paving']) {
        const img=images[`ground-${name}`];
        if(!img?.complete||!img.naturalWidth)return;
        if(!patterns[name])patterns[name]=ctx.createPattern(img,'repeat');
      }
      ctx.save();ctx.beginPath();
      // Água mantém seu contorno físico. A trilha pode curvar sobre a grama.
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(world.at(x,y)!==types.water)ctx.rect(x*T,y*T,T,T);
      ctx.clip();ctx.strokeStyle=patterns.dirt;ctx.lineWidth=126;ctx.lineCap='round';ctx.lineJoin='round';
      for(const route of world.routes) {
        const points=route.map(([x,y])=>[(x+.5)*T,(y+.5)*T]);
        ctx.beginPath();ctx.moveTo(...points[0]);
        for(let i=1;i<points.length-1;i++) {
          const next=points[i+1],current=points[i];
          ctx.quadraticCurveTo(...current,(current[0]+next[0])/2,(current[1]+next[1])/2);
        }
        ctx.lineTo(...points[points.length-1]);ctx.stroke();
      }
      ctx.fillStyle=patterns.dirt;ctx.beginPath();ctx.ellipse(48.5*T,38.5*T,262,244,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=patterns.paving;ctx.beginPath();ctx.ellipse(48.5*T,35.5*T,146,132,0,0,Math.PI*2);ctx.fill();ctx.restore();
      // O piso e os corrimãos ficam por cima da trilha, atravessando o rio.
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(world.at(x,y)===types.bridge)fallbackTile(x,y,0,true);
    }
    function object(o,time,reducedMotion) {
      let name=o.art||o.kind;
      if(o.kind==='house')name=o.library?'library':'cottage';
      if(o.kind==='tree')name=o.art||'treeOriginal';
      if(o.kind==='tablet')name=`${o.shape}Tile`;
      if(o.kind==='rescue') {
        sprite('arch',o.x,o.y,134,122);
        if(!world.catRescued)sprite('fence',o.x,o.y+5,112,30);
        const regions=['forest','village','ruins','farm'];
        for(let i=0;i<4;i++)if(!(world.unlockedLocks||[]).includes(regions[i]))sprite('lock',o.x-33+i*22,o.y+6,15,20);
        return;
      }
      const organic=['tree','fern','flowers','flowerBush','berryBush'].includes(o.kind);
      const sway=!reducedMotion&&organic?Math.sin(time/1900+o.x*.015)*.7:0;
      if(!['crops','fern','flowers'].includes(o.kind))ellipse(o.x,o.y+1,Math.min(48,o.width*.35),Math.min(10,o.width*.09),'#3d56342a');
      const mirror=o.kind==='house'&&!o.library&&Math.floor(o.x/T)%2===0;
      if(!sprite(name,o.x+sway,o.y,o.width,o.height,mirror)){fallbackObject(o,time,reducedMotion);return;}
      if(o.kind==='portal'&&!reducedMotion) {
        for(let i=0;i<3;i++) {
          const drift=((time/70+i*19)%64);
          ctx.globalAlpha=Math.sin(drift/64*Math.PI)*.8;
          rect(o.x-16+i*15+Math.sin(time/800+i)*5,o.y-25-drift,2,2,'#fff0bd');
        }
        ctx.globalAlpha=1;
      }
      if(o.kind==='fountain'&&!reducedMotion) {
        const shine=(Math.sin(time/450)+1)/2;
        ctx.globalAlpha=shine*.6;rect(o.x-23,o.y-29,7,1,'#e1faf0');rect(o.x+16,o.y-37,5,1,'#e1faf0');ctx.globalAlpha=1;
      }
    }
    function pollen(camera,time,reducedMotion) {
      if(reducedMotion)return;
      const spots=[[40,40],[54,47],[22,24],[25,54],[78,54]];
      for(const [tx,ty] of spots)for(let i=0;i<4;i++) {
        const px=(tx+.5)*T+Math.sin(time/2900+i*2+tx)*120;
        const py=(ty+.5)*T+Math.cos(time/3300+i*3+ty)*85;
        if(px<camera.x||px>camera.x+width||py<camera.y||py>camera.y+height)continue;
        ctx.globalAlpha=.3+Math.sin(time/1800+i)*.15;rect(px,py,2,2,'#fff3b5');
      }
      ctx.globalAlpha=1;
    }
    function marker(context,px,py,r=4) {
      context.fillStyle='#4e493f';context.beginPath();context.arc(px,py,r+2,0,Math.PI*2);context.fill();
      context.fillStyle='#fff4c8';context.beginPath();context.arc(px,py,r,0,Math.PI*2);context.fill();
    }
    function renderOverview(player,camera,visited,large=false) {
      const target=large?map:mini,c=large?mapCanvas:miniCanvas;
      target.imageSmoothingEnabled=false;target.clearRect(0,0,c.width,c.height);target.drawImage(overview,0,0,c.width,c.height);
      if(!world.width||!world.height)return;
      const sx=c.width/world.width,sy=c.height/world.height;
      if(!large){const view=viewSize();target.strokeStyle='#fff1c399';target.lineWidth=1;target.strokeRect(camera.x*sx,camera.y*sy,view.width*sx,view.height*sy);}
      for(const region of world.regions) {
        const rx=(region.x+.5)*T*sx,ry=(region.y+.5)*T*sy;
        target.fillStyle=visited.has(region.id)?'#fbefc1':'#454e40';target.fillRect(rx-2,ry-2,4,4);
        if(large){target.font='bold 13px system-ui';target.textAlign='center';target.strokeStyle='#344b45';target.lineWidth=3;target.strokeText(region.short,rx,ry-10);target.fillStyle='#fff4d2';target.fillText(region.short,rx,ry-10);}
      }
      marker(target,player.x*sx,player.y*sy,large?6:3);
    }
    function draw(player,camera,near,time,reducedMotion,visited) {
      if(world.spawnPending){Object.assign(player,world.spawn);world.spawnPending=false;}
      const view=viewSize(),factor=scale()/WORLD_SCALE;
      // Janela em mundo, centralizada no jogador e limitada pelo tamanho real do mapa.
      camera={x:Math.max(0,Math.min(world.width-view.width,player.x-view.width/2)),y:Math.max(0,Math.min(world.height-view.height,player.y-view.height/2))};
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(factor,factor);ctx.translate(-camera.x,-camera.y);
      const background=images.island,vw=Math.min(view.width,world.width-camera.x),vh=Math.min(view.height,world.height-camera.y);
      if(background.naturalWidth&&vw>0&&vh>0) {
        // Câmera em px do mundo → JPEG: sx = cam.x / WORLD_SCALE (idem y e tamanho).
        ctx.drawImage(background,camera.x/WORLD_SCALE,camera.y/WORLD_SCALE,vw/WORLD_SCALE,vh/WORLD_SCALE,camera.x,camera.y,vw,vh);
        if(debug&&world.collision) {
          const unit=COLLISION_CELL_SIZE*WORLD_SCALE;
          ctx.drawImage(world.collision.overlay,camera.x/unit,camera.y/unit,vw/unit,vh/unit,camera.x,camera.y,vw,vh);
        }
      }
      window.IslandKeys?.draw(ctx,world,player,camera,view,factor,time,reducedMotion);
      ellipse(player.x,player.y-2,9,3,'#3b593a55');
      const bob=!reducedMotion&&player.moving?Math.sin(time/80)*1.5:0;
      sprite(player.facing==='up'?'back':player.facing==='down'?'front':'side',player.x,player.y+bob,PLAYER_HEIGHT,PLAYER_HEIGHT,player.facing==='left');
      if(near) {
        const px=near.x,py=near.y-(near.id==='portal'?142:near.id==='mountain'?105:76);
        rect(px-14,py-14,28,28,'#574a38');rect(px-11,py-11,22,22,'#ffefba');ctx.fillStyle='#584634';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('E',px,py+6);
      }
      if(debug) {
        ctx.strokeStyle='#ffff00';ctx.lineWidth=1;
        ctx.strokeRect(player.x-FOOT_W/2,player.y-FOOT_H,FOOT_W,FOOT_H);
      }
      ctx.restore();
      if(debug) {
        rect(8,8,Math.min(width-16,360),88,'#172c37e8');ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.textAlign='left';
        ctx.fillText(`Imagem: x=${(player.x/WORLD_SCALE).toFixed(1)} y=${(player.y/WORLD_SCALE).toFixed(1)} px`,16,27);
        ctx.fillText(`Célula: ${IslandWorld.cellAt(world,player.x,player.y)?'andável':'bloqueada'}`,16,47);
        ctx.fillText(`Zoom: ${zoom.toFixed(2)}${factor>zoom+.001?` (encaixe: ${factor.toFixed(2)})`:''} [+/-]`,16,67);
        ctx.fillText(`Largura visível: ${(Math.min(1,view.width/world.width)*100).toFixed(2)}%`,16,87);
      }
      renderOverview(player,camera,visited);
      world.devScreen?.draw(ctx,width,height,time);
    }
    return {ready,failed,resize,draw,renderOverview,toggleDebug(){debug=!debug;},get debug(){return debug;},get width(){return viewSize().width;},get height(){return viewSize().height;}};
  }
  return {create};
})();
