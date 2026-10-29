/* Labirinto das runas: três cruzamentos, câmara e portal; contrato onExit preservado. */
window.LabirintoPuzzle = (() => {
  'use strict';
  const W=1376,H=768,K=W/1024,base='assets/puzzles/labirinto/',cache=new Map(),art={},surfaces=[],runes={};
  let ready,data,current,warning='';
  function image(src) {
    if(!cache.has(src))cache.set(src,new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{console.warn(`[Labirinto] Ausente: ${src}. Placeholder ativado.`);resolve(null);};im.src=src;}));
    return cache.get(src);
  }
  function prepare(input) {
    return ready ||= (async()=>{
      const cfg=LABIRINTO_CONFIG,c=input.camara;
      data={...input,metrics:{...input.metrics,footW:cfg.FOOT_W,footH:cfg.FOOT_H},camara:{...c,pedestal:{...c.pedestal,altura:cfg.PEDESTAL_H_CAMARA},chave:{...c.chave,centro:[c.pedestal.pe[0],c.pedestal.pe[1]-cfg.PEDESTAL_H_CAMARA-8-c.chave.altura/2]}}};
      const L=window.LabirintoLogica,m=data.metrics,ids=data.runas.map(r=>r.id);
      console.info(`[Labirinto] ${L.randomTest(ids)}`);
      await Promise.all(data.runas.map(async r=>{
        const glow=document.createElement('canvas');glow.width=glow.height=160;
        const c=glow.getContext('2d'),g=c.createRadialGradient(80,80,0,80,80,80);g.addColorStop(0,r.cor);g.addColorStop(1,r.cor+'00');c.fillStyle=g;c.fillRect(0,0,160,160);
        runes[r.id]={...r,glow,image:await image(`${base}runas/runa_${r.id}.png`)};
      }));
      [art.hero,art.pedestal,art.key]=await Promise.all([image(`assets/${HERO_SHEET.src}`),image(base+'pedestal_pedra.png'),image('assets/hud/chave_logica.png')]);
      if(art.pedestal)try{
        const im=art.pedestal,canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),removed=L.removeBlackBorder(pixels.data,canvas.width,canvas.height);ctx.putImageData(pixels,0,0);art.pedestal=canvas;
        if(removed)console.warn(`[Labirinto] Fundo quase preto removido em memória (${removed} pixels). Substitua pedestal_pedra.png por uma versão transparente.`);
      }catch(error){console.warn('[Labirinto] Não foi possível ler os pixels do pedestal; usando marcador.',error);art.pedestal=null;}
      warning=art.pedestal?'':'Placeholder: pedestal indisponível';
      for(const name of ['portalGlow','keyGlow']){
        const glow=art[name]=document.createElement('canvas');glow.width=glow.height=280;
        const c=glow.getContext('2d'),g=c.createRadialGradient(140,140,0,140,140,140);g.addColorStop(0,name==='portalGlow'?'#c58bff':'#8affb5');g.addColorStop(1,name==='portalGlow'?'#a855f700':'#4ade8000');c.fillStyle=g;c.fillRect(0,0,280,280);
      }
      for(let n=0;n<4;n++){
        const chamber=n===3,k=chamber?1:K,w=chamber?W:1024,h=chamber?H:572;
        const bg=await image(base+(chamber?'camara_chave_bg.jpg':`fase${n+1}_v2.webp`));
        // Em file://, o espelho PNG do alfa evita a restrição de leitura de canvas local.
        const src=window.location.protocol==='file:'?LABIRINTO_MASKS_LOCAL[n]:base+(chamber?'camara_mascara.png':`fase${n+1}_mascara.png`);
        const im=await image(src),read=document.createElement('canvas');read.width=w;read.height=h;const c=read.getContext('2d');
        if(!im)throw Error(`Máscara ${n+1} ausente: não é seguro abrir os caminhos sem colisão.`);
        if(im.naturalWidth!==w||im.naturalHeight!==h)throw Error(`Máscara ${n+1}: dimensões inválidas`);
        c.drawImage(im,0,0);const pixels=c.getImageData(0,0,w,h),mask=new Uint8Array(w*h);
        for(let i=0;i<mask.length;i++){mask[i]=pixels.data[i*4+3]>40?1:0;pixels.data[i*4]=0;pixels.data[i*4+1]=255;pixels.data[i*4+2]=0;pixels.data[i*4+3]=mask[i]?75:0;}
        const overlay=document.createElement('canvas');overlay.width=w;overlay.height=h;overlay.getContext('2d').putImageData(pixels,0,0);read.width=read.height=0;
        const config=chamber?data.camara:data.fases[n],spawn=chamber?config.spawn:config.spawn.map(v=>Math.round(v*K));
        const exits=chamber?[]:config.saidas.map(e=>({id:e.id,zone:e.zona.map(v=>v*K),x:e.pe[0]*K,y:e.pe[1]*K}));
        const obstacle=chamber?{x:config.pedestal.pe[0],y:config.pedestal.pe[1],r:config.pedestal.raio}:null;
        const field=L.field(mask,w,h,k,m.footW,m.footH,obstacle,LABIRINTO_CONFIG.CORNER_NUDGE);
        const nav=L.grid(field,8,2),zones=chamber?[config.soleira]:exits.map(e=>e.zone);
        const failures=L.geometryTest(nav,spawn,zones,obstacle),label=chamber?'Câmara':`Fase ${n+1}`;
        if(chamber){const path=L.path(nav,spawn[0],spawn[1],config.alvo[0],config.alvo[1]),end=path[path.length-1];if(!end||Math.hypot(end.x-config.alvo[0],end.y-config.alvo[1])>1)failures.push('alvo final do portal sem acesso');}
        console[failures.length?'error':'info'](`[Labirinto] ${label}: ${failures.join('; ')||'spawn, cobertura e BFS OK'}`);
        if(failures.length)throw Error(`${label}: ${failures.join('; ')}`);
        surfaces[n]={bg,overlay,field,nav,spawn,exits};
      }
      console.info('[Labirinto] Pés 8×4; grade 8 px, margem 2 px em todas as telas.');
    })().catch(error=>{ready=null;throw error;});
  }
  function open(options={}) {
    if(current)current(false);
    const L=window.LabirintoLogica,cfg=LABIRINTO_CONFIG,m=data.metrics,c=data.camara,ids=data.runas.map(r=>r.id),returnFocus=document.activeElement;
    const host=document.createElement('div'),frame=document.createElement('div'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),status=document.createElement('p');
    host.style.cssText='position:fixed;inset:0;z-index:1000;background:#101c19;display:flex;justify-content:center;';frame.style.cssText='position:relative;height:100%;';
    host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Labirinto das runas');
    canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;';canvas.tabIndex=0;
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';
    frame.appendChild(canvas);frame.appendChild(status);host.appendChild(frame);document.body.appendChild(host);
    const controls=[],labels=['X','↻','Já memorizei','E — Pegar a chave'];
    for(let i=0;i<4;i++){
      const b=document.createElement('button');b.type='button';b.textContent=labels[i];b.setAttribute('aria-label',i===0?'Sair do labirinto':i===1?'Reiniciar com nova sequência':labels[i]);
      b.style.cssText='position:absolute;min-height:44px;min-width:44px;border:2px solid #b9dc9a;border-radius:10px;background:#183a30ed;color:#fff5d7;font:inherit;font-size:16px;cursor:pointer;padding:5px 12px;';
      b.onfocus=()=>{b.style.outline='3px solid #ffe591';};b.onblur=()=>{b.style.outline='';};frame.appendChild(b);controls.push(b);
    }
    const font=getComputedStyle(document.body).fontFamily||'sans-serif',calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches||Boolean(window.GameSettings?.calm);
    const hero={x:688,y:670,dir:3,moving:false,walk:0,idle:0},held=new Uint8Array(8),particles=new Float32Array(24*5),empty=[];
    let s=1,offset=0,width=1376,state='',elapsed=0,time=0,last=0,raf=0,closed=false,debug=false,seq=[],ped=[],order=[],route=empty,waypoint=0,chosen=-1,completed=0,phase=0,f=surfaces[0],claimed=false,sparkColor='#4ade80';
    let routeTime=0,routeX=0,routeY=0,targetX=0,targetY=0,routeRetried=false;
    const dirs={arrowleft:0,a:1,arrowright:2,d:3,arrowup:4,w:5,arrowdown:6,s:7};
    function say(message){status.textContent=message;canvas.setAttribute('aria-label',`${message} WASD/setas ou toque para andar. Escape sai. F3 depura; N avança com F3.`);}
    function canTake(){return state==='CAMARA_ANDAR'&&!claimed&&Math.hypot(hero.x-c.pedestal.pe[0],hero.y-c.pedestal.pe[1])<=c.interacao;}
    function change(next){state=next;elapsed=0;held.fill(0);route=empty;hero.walk=0;controls[2].hidden=next!=='MEMORIZAR';controls[2].disabled=true;controls[3].hidden=true;
      if(next==='MEMORIZAR')say(`Memorize a ordem das runas! 1ª: ${runes[seq[0]].nome}; 2ª: ${runes[seq[1]].nome}; 3ª: ${runes[seq[2]].nome}.`);
      else if(next==='ANDAR')say(`Escolha a ${phase+1}ª runa da sequência!`);else if(next==='ERRO')say('Ainda não é essa! Vamos recomeçar!');
      else if(next==='FEEDBACK_CERTO')say(`Muito bem! Caminho ${completed} de 3 concluído.`);else if(next==='CAMARA_ANDAR')say('Pegue a chave! Aproxime-se do pedestal.');
      else if(next==='PEGAR_CHAVE')say('Chave encontrada!');else if(next==='PORTAL')say('O portal está aberto! Vamos voltar à ilha.');
      else if(next==='ENTRAR_PORTAL')say('Entrando no portal...');
    }
    function round(memorize=true){f=surfaces[phase];ped=phase<3?L.pedestals(ids,seq,phase+1):empty;order=f.exits.map((_,i)=>i).sort((a,b)=>f.exits[a].y-f.exits[b].y);hero.x=f.spawn[0];hero.y=f.spawn[1];hero.dir=3;hero.idle=0;chosen=-1;particles.fill(0);change(phase===3?'CAMARA_ANDAR':memorize?'MEMORIZAR':'ANDAR');}
    function restart(){seq=L.sequence(ids);completed=phase=0;claimed=false;round();canvas.focus();}
    function resize(){width=Math.min(window.innerWidth,window.innerHeight*W/H);const dpr=Math.min(2,window.devicePixelRatio||1);frame.style.width=`${width}px`;canvas.width=Math.round(width*dpr);canvas.height=Math.round(window.innerHeight*dpr);s=canvas.width/W;offset=(canvas.height-H*s)/2;
      const top=offset/s*width/W;for(let i=0;i<2;i++){controls[i].style.top=`${top+8}px`;controls[i].style.right=`${8+i*54}px`;}
      for(let i=2;i<4;i++){controls[i].style.left=`${(i===2?688:c.chave.centro[0])*width/W}px`;controls[i].style.transform='translateX(-50%)';controls[i].style.top=`${top+(i===2?518:c.chave.centro[1]-c.chave.altura/2)*width/W-(i===3?52:0)}px`;controls[i].style.width='200px';}
    }
    function choose(index){if(state!=='ANDAR')return;chosen=index;
      if(ped[index]!==seq[phase]){change('ERRO');return;}
      completed=phase+1;change('FEEDBACK_CERTO');const e=f.exits[index];burst(e.x,e.y-96,runes[seq[phase]].cor);
    }
    function burst(x,y,color){sparkColor=color;for(let i=0;i<24;i++){const j=i*5;particles[j]=x;particles[j+1]=y;particles[j+2]=(Math.random()-.5)*170;particles[j+3]=-30-Math.random()*100;particles[j+4]=.9;}}
    function collect(dev=false){if(state!=='CAMARA_ANDAR'||claimed||!dev&&!canTake())return;claimed=true;change('PEGAR_CHAVE');burst(c.chave.centro[0],c.chave.centro[1],'#4ade80');canvas.focus();}
    function follow(x,y,retry=false){route=L.path(f.nav,hero.x,hero.y,x,y);waypoint=0;targetX=x;targetY=y;routeX=hero.x;routeY=hero.y;routeTime=0;routeRetried=retry;}
    function beginPortal(){change('PORTAL');follow(c.alvo[0],c.alvo[1]);
      // A busca considera a caixa de pés e o bloqueio circular: nunca atravessa o pedestal.
      if(!route.length){console.error('[Labirinto] Não foi possível traçar o caminho do portal.');claimed=false;change('CAMARA_ANDAR');}
    }
    function down(event){event.preventDefault();if(state!=='ANDAR'&&state!=='CAMARA_ANDAR')return;const r=canvas.getBoundingClientRect();
      // client → pixels do canvas → design; y desconta a centralização vertical.
      const x=((event.clientX-r.left)*canvas.width/r.width)/s,y=(((event.clientY-r.top)*canvas.height/r.height)-offset)/s;
      if(state==='CAMARA_ANDAR'&&Math.abs(x-c.chave.centro[0])<=45&&Math.abs(y-c.chave.centro[1])<=c.chave.altura/2+8){collect();return;}
      follow(x,y);canvas.focus();
    }
    function key(event){if(event.ctrlKey||event.altKey||event.metaKey)return;const k=event.key.toLowerCase();event.stopImmediatePropagation();
      if(k==='tab'){event.preventDefault();let i=controls.indexOf(document.activeElement);const step=event.shiftKey?-1:1;for(let n=0;n<4;n++){i=(i+step+4)%4;if(!controls[i].hidden&&!controls[i].disabled){controls[i].focus();break;}}return;}
      if((k==='enter'||k===' ')&&controls.includes(event.target))return;
      event.preventDefault();if(k in dirs){if(state==='ANDAR'||state==='CAMARA_ANDAR'){held[dirs[k]]=1;route=empty;}return;}if(event.repeat)return;
      if(k==='escape')close(false);else if(k==='f3'){if(options.toggleDebug)options.toggleDebug();else debug=!debug;}
      else if((k==='e'||k==='enter')&&state==='CAMARA_ANDAR')collect();
      else if(k==='n'&&(options.debug?options.debug():debug)){if(state==='CAMARA_ANDAR')collect(true);else if(state==='ANDAR'||state==='MEMORIZAR'){if(state==='MEMORIZAR')change('ANDAR');choose(ped.indexOf(seq[phase]));}}
    }
    function up(event){const k=event.key.toLowerCase();if(k in dirs){event.preventDefault();event.stopImmediatePropagation();held[dirs[k]]=0;}}
    function blur(){held.fill(0);if(state!=='PORTAL')route=empty;last=0;}
    function close(won=false){if(closed)return;closed=true;held.fill(0);route=empty;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key,true);document.removeEventListener('keyup',up,true);window.removeEventListener('resize',resize);window.removeEventListener('blur',blur);host.remove();current=null;returnFocus?.focus();options.onExit?.(won);}
    function walk(dt){let vx=Number(held[2]||held[3])-Number(held[0]||held[1]),vy=Number(held[6]||held[7])-Number(held[4]||held[5]),distance=m.speed*dt;
      const following=!vx&&!vy&&waypoint<route.length;
      if(!vx&&!vy&&waypoint<route.length){const p=route[waypoint];vx=p.x-hero.x;vy=p.y-hero.y;const d=Math.hypot(vx,vy);if(d<.5){waypoint++;return;}distance=Math.min(distance,d);}
      const len=Math.hypot(vx,vy),x=hero.x,y=hero.y;if(len){L.move(f.field,hero,vx/len*distance,vy/len*distance);hero.dir=Math.abs(vx)>Math.abs(vy)?vx<0?1:2:vy<0?3:0;}
      // HeroAnimation conta a partir de 1; em 120/144 Hz o primeiro dt tem menos de um tick.
      const moving=Math.hypot(hero.x-x,hero.y-y)>.001;hero.walk=moving?Math.max(1,hero.walk+dt*60):0;hero.idle=moving?0:hero.idle+dt*60;
      // No toque, menos de 1 px em 0,5 s pede uma nova rota; uma segunda parada cancela o toque.
      if(following&&state!=='PORTAL'&&(routeTime+=dt)>=.5){
        if(Math.hypot(hero.x-routeX,hero.y-routeY)<1){if(routeRetried)route=empty;else follow(targetX,targetY,true);}
        routeX=hero.x;routeY=hero.y;routeTime=0;
      }
      if(state==='ANDAR')for(let i=0;i<f.exits.length;i++)if(L.hit(hero,f.exits[i].zone,m.footW,m.footH)){choose(i);break;}
    }
    function update(dt){time+=dt;elapsed+=dt;
      if(state==='MEMORIZAR'){controls[2].disabled=elapsed<1.5;if(elapsed>=m.memorizeSeconds)change('ANDAR');}
      else if(state==='ANDAR'||state==='CAMARA_ANDAR')walk(dt);
      else if(state==='FEEDBACK_CERTO'&&elapsed>=.9)change('ESCURECER_CERTO');
      else if(state==='ERRO'&&elapsed>=1.1)change('ESCURECER_ERRO');
      else if(state==='ESCURECER_ERRO'&&elapsed>=.4){completed=phase=0;claimed=false;if(cfg.ERRO_NOVA_SEQUENCIA)seq=L.sequence(ids);round();}
      else if(state==='ESCURECER_CERTO'&&elapsed>=.4)change('TRANSICAO');
      else if(state==='TRANSICAO'&&elapsed>=1){phase++;round(false);}
      else if(state==='PEGAR_CHAVE'&&elapsed>=.8)beginPortal();
      else if(state==='PORTAL'){walk(dt);if(waypoint>=route.length&&L.hit(hero,c.soleira,m.footW,m.footH))change('ENTRAR_PORTAL');}
      else if(state==='ENTRAR_PORTAL'&&elapsed>=.6)change('BRANCO');
      else if(state==='BRANCO'&&elapsed>=.4){close(true);return;}
      controls[3].hidden=!canTake();
      for(let i=0;i<24;i++){const j=i*5;if(particles[j+4]>0){particles[j]+=particles[j+2]*dt;particles[j+1]+=particles[j+3]*dt;particles[j+4]-=dt;}}
    }
    function text(value,x,y,size=26,color='#fff5d7'){ctx.fillStyle=color;ctx.font=`bold ${size}px ${font}`;ctx.textAlign='center';ctx.fillText(value,x,y);}
    function panel(x,y,w,h){ctx.fillStyle='#112b26df';ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill();ctx.strokeStyle='#b9dc9a';ctx.lineWidth=2;ctx.stroke();}
    function rune(id,x,y,size,alpha=1,strong=false){const r=runes[id];ctx.globalAlpha=alpha*(strong?.9:calm?.35:.35+.1*Math.sin(2.2*time));ctx.drawImage(r.glow,x-size*.9,y-size*.9,size*1.8,size*1.8);ctx.globalAlpha=alpha;
      if(r.image)ctx.drawImage(r.image,x-size/2,y-size/2,size,size);else{ctx.fillStyle=r.cor;ctx.fillRect(x-size/2,y-size/2,size,size);text(r.nome,x,y+5,14,'#102820');}ctx.globalAlpha=1;
    }
    function stone(x,y,height){
      ctx.imageSmoothingEnabled=true;
      if(art.pedestal){const w=height*art.pedestal.width/art.pedestal.height;ctx.drawImage(art.pedestal,x-w/2,y-height,w,height);}
      else text('?',x,y-height/2,height*.6,'#ffe591');
    }
    function pedestal(index){const e=f.exits[index],chosenHere=chosen===index,success=completed>phase,alpha=success&&!chosenHere?.35:1,shake=!calm&&state==='ERRO'&&elapsed<.3&&chosenHere?Math.sin(elapsed*90)*3:0;
      ctx.globalAlpha=alpha;const x=e.x+shake,y=e.y;
      stone(x,y,cfg.PEDESTAL_H);
      const ry=Math.max(38,y-cfg.PEDESTAL_H-4-34+(calm?0:Math.sin(2.2*time+index)*3));rune(ped[index],x,ry,68,alpha,success&&chosenHere);
      if(chosenHere&&state==='ERRO'&&elapsed<.3){ctx.fillStyle='#ff384baa';ctx.fillRect(x-34,ry-34,68,68);}ctx.globalAlpha=1;
    }
    function keyArt(){if(claimed&&state!=='PEGAR_CHAVE')return;
      const t=state==='PEGAR_CHAVE'?Math.min(1,elapsed/.8):0,x=c.chave.centro[0],y=c.chave.centro[1]+(calm?0:Math.sin(time*2.2)*c.chave.flutuacao)-48*t,height=c.chave.altura,width=height*(art.key?.naturalWidth||229)/(art.key?.naturalHeight||482),size=140+80*t;
      ctx.globalAlpha=(1-t)*(calm?.35:.35+.1*Math.sin(time*2.2));ctx.drawImage(art.keyGlow,x-size/2,y-size/2,size,size);ctx.globalAlpha=1-t;
      if(art.key)ctx.drawImage(art.key,x-width/2,y-height/2,width,height);else{ctx.fillStyle='#4ade80';ctx.fillRect(x-8,y-32,16,64);ctx.fillRect(x,y+20,22,8);}ctx.globalAlpha=1;
    }
    function portalArt(){const r=c.portal.raio,x=c.portal.centro[0],y=c.portal.centro[1];ctx.globalAlpha=claimed?(calm?.55:.55+.1*Math.sin(time*3)):.16;ctx.drawImage(art.portalGlow,x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
    function player(){if(state==='BRANCO')return;const t=state==='ENTRAR_PORTAL'?Math.min(1,elapsed/.6):0,hs=HERO_SHEET,scale=m.heroH/hs.frameH*Math.max(.001,1-t),col=window.HeroAnimation.column(hero,calm);ctx.globalAlpha=1-t;ctx.fillStyle='#10251d77';ctx.beginPath();ctx.ellipse(hero.x,hero.y,16*(1-t),6*(1-t),0,0,Math.PI*2);ctx.fill();ctx.imageSmoothingEnabled=false;
      if(art.hero)ctx.drawImage(art.hero,col*hs.frameW,hero.dir*hs.frameH,hs.frameW,hs.frameH,hero.x-hs.pivotX*scale,hero.y-hs.pivotY*scale,hs.frameW*scale,hs.frameH*scale);else{ctx.fillStyle='#efba78';ctx.fillRect(hero.x-15*(1-t),hero.y-m.heroH*(1-t),30*(1-t),m.heroH*(1-t));}ctx.imageSmoothingEnabled=true;ctx.globalAlpha=1;
    }
    function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#101c19';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,offset);ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
      ctx.imageSmoothingEnabled=true;if(f.bg)ctx.drawImage(f.bg,0,0,W,H);else{ctx.fillStyle='#304e39';ctx.fillRect(0,0,W,H);ctx.drawImage(f.overlay,0,0,W,H);}
      let drawn=false;
      if(phase===3){portalArt();if(hero.y<c.pedestal.pe[1]){player();drawn=true;}stone(c.pedestal.pe[0],c.pedestal.pe[1],cfg.PEDESTAL_H_CAMARA);keyArt();}
      else for(let i=0;i<order.length;i++){const n=order[i];if(!drawn&&hero.y<f.exits[n].y){player();drawn=true;}pedestal(n);}if(!drawn)player();
      for(let i=0;i<24&&!calm;i++){const j=i*5;if(particles[j+4]>0){ctx.globalAlpha=particles[j+4]/.9;ctx.fillStyle=sparkColor;ctx.fillRect(particles[j],particles[j+1],5,5);}}ctx.globalAlpha=1;
      if(options.debug?options.debug():debug){ctx.drawImage(f.overlay,0,0,f.field.w*f.field.k,f.field.h*f.field.k);ctx.lineWidth=2;
        for(let i=0;i<f.exits.length;i++){const e=f.exits[i],z=e.zone;ctx.strokeStyle=ped[i]===seq[phase]?'#28ff35':'#ffe230';ctx.strokeRect(z[0],z[1],z[2],z[3]);text(runes[ped[i]].nome+(ped[i]===seq[phase]?' — CORRETA':''),e.x,z[1]-18,18,ctx.strokeStyle);ctx.fillStyle='#ff42d0';ctx.fillRect(e.x-4,e.y-4,8,8);}
        if(phase===3){ctx.strokeStyle='#ff42d0';ctx.beginPath();ctx.arc(c.pedestal.pe[0],c.pedestal.pe[1],c.pedestal.raio,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ffe230';ctx.strokeRect(c.soleira[0],c.soleira[1],c.soleira[2],c.soleira[3]);}
        ctx.strokeStyle='#fff';ctx.strokeRect(hero.x-m.footW/2,hero.y-m.footH/2,m.footW,m.footH);ctx.fillStyle='#fff';ctx.fillRect(f.spawn[0]-4,f.spawn[1]-4,8,8);
        panel(200,694,976,56);text(`${phase===3?'Câmara':`Cruzamento ${phase+1}`} · S: ${seq.join(' → ')} · (${hero.x.toFixed(1)}, ${hero.y.toFixed(1)}) · N avança`,688,729,21);
      }
      if(state==='MEMORIZAR'){ctx.fillStyle='#000a';ctx.fillRect(0,0,W,H);for(let i=0;i<3;i++){const x=488+i*200;rune(seq[i],x,350,120);text(`${i+1}ª`,x,450,29);}ctx.fillStyle='#d8e7c444';ctx.fillRect(438,480,500,12);ctx.fillStyle='#b4ed92';ctx.fillRect(438,480,500*Math.max(0,1-elapsed/m.memorizeSeconds),12);}
      // Placa compacta nos caminhos 2/3 para não cobrir as runas das saídas superiores.
      const compact=phase===1||phase===2,header=compact?20:width<700?190:62;panel(350,compact?0:header-38,676,compact?26:65);
      text(state==='MEMORIZAR'?'Memorize a ordem das runas!':phase===3?claimed?'Chave conquistada!':'Pegue a chave!':`Escolha a ${phase+1}ª runa da sequência!`,688,compact?20:header+5,compact?20:27);
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(42+i*48,40,15,0,Math.PI*2);ctx.fillStyle=i<completed?'#4ade80':'#14362ddd';ctx.fill();ctx.strokeStyle='#a5dfac';ctx.lineWidth=3;ctx.stroke();}
      if(state==='ERRO'||state==='FEEDBACK_CERTO'){panel(state==='ERRO'?258:410,530,state==='ERRO'?860:556,70);text(state==='ERRO'?'Ainda não é essa! Vamos recomeçar!':'Muito bem! Caminho encontrado!',688,574,29);}
      if(state==='ESCURECER_CERTO'||state==='ESCURECER_ERRO'){ctx.fillStyle=`rgba(0,0,0,${Math.min(1,elapsed/.4)})`;ctx.fillRect(0,0,W,H);}
      if(state==='TRANSICAO'){ctx.fillStyle='#0b1c18';ctx.fillRect(0,0,W,H);text(completed===3?'Câmara da chave':`Caminho ${completed+1} de 3`,688,390,40);}
      if(warning){ctx.fillStyle='#17271deb';ctx.fillRect(0,752,W,16);text(warning,688,765,13,'#ffe59f');}ctx.restore();
      if(state==='BRANCO'){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(255,255,255,${Math.min(1,elapsed/.4)})`;ctx.fillRect(0,0,canvas.width,canvas.height);}
    }
    function loop(stamp){if(closed)return;const dt=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;update(dt);if(closed)return;draw();raf=requestAnimationFrame(loop);}
    controls[0].onclick=()=>close(false);controls[1].onclick=restart;controls[2].onclick=()=>{if(state==='MEMORIZAR'&&elapsed>=1.5){change('ANDAR');canvas.focus();}};controls[3].onclick=()=>collect();
    canvas.addEventListener('pointerdown',down);document.addEventListener('keydown',key,true);document.addEventListener('keyup',up,true);window.addEventListener('resize',resize);window.addEventListener('blur',blur);current=close;restart();resize();raf=requestAnimationFrame(loop);
  }
  return {prepare,open,get active(){return Boolean(current);}};
})();
