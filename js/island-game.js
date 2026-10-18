/* Ciclo de exploração, câmera, teclado, controles de toque e diálogos. */
window.GameIsland = (() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const screen=$('#island-screen'),canvas=$('#island-canvas');
  const world=IslandWorld.create();
  const renderer=IslandRenderer.create(canvas,$('#island-minimap'),$('#island-map'),world);
  const player={...world.spawn,facing:'down',moving:false},camera={x:0,y:0};
  const dev=world.devScreen=window.DevPuzzleScreen?.create(canvas,world,clearInput);
  const visited=new Set(['center']),keys=new Set(),pointers=new Map();
  const info=$('#island-info-dialog'),pause=$('#island-pause-dialog'),map=$('#island-map-dialog');
  const dialogs=Array.from(document.querySelectorAll('dialog'));
  const directionKeys={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Preferências do livro de configurações: "Menos animações" e velocidade da caminhada.
  const calmMotion=()=>reducedMotion.matches||Boolean(window.GameSettings?.calm);
  const walkSpeed=()=>210*(window.GameSettings?.walkSpeed||1);
  let active=false,loaded=false,frame=0,lastTime=0,near=null,currentRegion='center',dialogTrigger=null,foundCat=false;
  const inChallenge=()=>Boolean(window.PuzzleGame?.active||window.GameRescue?.active);
  const blocked=()=>!loaded||document.hidden||inChallenge()||dev?.active||dialogs.some(dialog=>dialog.open);
  function updateProgress() {
    const progress=window.AdventureProgress;
    if(!progress)return;
    $('#island-key-count').textContent=`${progress.keyCount} de 4 chaves`;
    for(const region of progress.regions) {
      const slot=$(`#island-key-${region}`),owned=progress.hasKey(region);
      slot.dataset.owned=String(owned);
      slot.setAttribute('aria-label',`${slot.dataset.keyName}: ${owned?'conquistada':'a encontrar'}`);
    }
    world.unlockedLocks=progress.regions.filter(id=>progress.isUnlocked(id));
    world.catRescued=progress.rescued;
    $('#island-objective').textContent=progress.rescued?'Você libertou seu gato! A ilha continua aberta para explorar.':progress.keyCount===4?'Você tem as quatro chaves! Volte à montanha para libertar seu gato.':foundCat?`Seu gato espera na montanha. Conquiste as chaves: ${progress.keyCount} de 4.`:'Conquiste as quatro chaves e encontre seu gato na montanha.';
    near=null;updateNearby();
  }
  function returnFromChallenge(trigger) {
    if(!active)return;
    clearInput();screen.hidden=false;renderer.resize();updateCamera(true);lastTime=0;
    updateProgress();(trigger||canvas).focus();
  }
  function clearInput(){keys.clear();pointers.clear();player.moving=false;resetJoystick();}
  function resetJoystick(){const stick=$('#joystick-stick'),joystick=$('#island-joystick');if(stick)stick.style.transform='translate(-50%,-50%)';if(joystick)joystick.classList.remove('is-active');}
  function updateCamera(snap,dt=0) {
    const tx=Math.max(0,Math.min(world.width-renderer.width,player.x-renderer.width/2));
    const ty=Math.max(0,Math.min(world.height-renderer.height,player.y-renderer.height*.58));
    const follow=snap||calmMotion()?1:1-Math.exp(-dt*10);
    camera.x+=(tx-camera.x)*follow;camera.y+=(ty-camera.y)*follow;
    camera.x=Math.max(0,Math.min(Math.max(0,world.width-renderer.width),camera.x));
    camera.y=Math.max(0,Math.min(Math.max(0,world.height-renderer.height),camera.y));
  }
  function updateLocation() {
    const region=IslandWorld.regionAt(player.x,player.y);
    if(region.id===currentRegion)return;
    currentRegion=region.id;$('#island-region').textContent=region.name;
    if(!visited.has(region.id)) {
      visited.add(region.id);$('#island-discovery').textContent=`${visited.size} de 6 lugares descobertos`;
      $('#island-announcement').textContent=`Você descobriu: ${region.name}. ${visited.size} de 6 lugares.`;
    }
  }
  function updateNearby() {
    const key=window.IslandKeys?.nearest(world,player);
    if(key){near=key;$('#island-interact').disabled=false;$('#island-interact-label').textContent='E — Interagir';return;}
    const next=world.points.filter(point=>Math.hypot(point.x-player.x,point.y-player.y)<112).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
    if(next===near)return;
    near=next;$('#island-interact').disabled=!near;
    $('#island-interact-label').textContent=near?near.action:'Aproxime-se de uma placa';
    if(near)$('#island-announcement').textContent=`${near.action}. Aperte E ou use o botão Interagir.`;
  }
  function loop(time) {
    if(!active)return;
    if(inChallenge()) {clearInput();lastTime=0;frame=requestAnimationFrame(loop);return;}
    const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;
    if(blocked())clearInput();
    else {
      // Teclas e d-pad dão direções fixas; o joystick dá um vetor analógico {x,y}.
      const dirs=new Set(Array.from(keys,key=>directionKeys[key]));
      let dx=0,dy=0;
      for(const value of pointers.values()) {
        if(typeof value==='string')dirs.add(value);
        else {dx+=value.x;dy+=value.y;}
      }
      if(dirs.has('right'))dx+=1; if(dirs.has('left'))dx-=1;
      if(dirs.has('down'))dy+=1; if(dirs.has('up'))dy-=1;
      const length=Math.hypot(dx,dy),oldX=player.x,oldY=player.y;
      if(length) {
        player.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
        const magnitude=Math.min(1,length),speed=walkSpeed();
        IslandWorld.movePlayer(world,player,dx/length*speed*magnitude*dt,dy/length*speed*magnitude*dt);
      }
      player.moving=Math.hypot(player.x-oldX,player.y-oldY)>.1;
      updateLocation();updateNearby();
    }
    updateCamera(false,dt);renderer.draw(player,camera,near,time,calmMotion(),visited);
    frame=requestAnimationFrame(loop);
  }
  function start() {
    if(active)return;
    active=true;$('#home-screen').hidden=true;screen.hidden=false;document.body.classList.add('is-playing');
    renderer.resize();updateCamera(true);updateNearby();updateProgress();lastTime=0;canvas.focus();frame=requestAnimationFrame(loop);
  }
  function stop() {
    dev?.close();
    active=false;cancelAnimationFrame(frame);clearInput();lastTime=0;
    window.PuzzleGame?.stop();window.GameRescue?.stop();
    for(const dialog of [info,pause,map])if(dialog.open)dialog.close();
    screen.hidden=true;$('#home-screen').hidden=false;document.body.classList.remove('is-playing');
    document.querySelector('[data-open="start"]').focus();
  }
  function showDialog(dialog,trigger) {
    if(!active||blocked())return;
    clearInput();dialogTrigger=trigger||canvas;
    GameAudio.click();dialog.showModal();
  }
  function interact(trigger) {
    if(active&&!blocked())updateNearby();
    const key=window.IslandKeys?.nearest(world,player);
    if(key&&active&&!blocked()){dev.open(key);return;}
    if(!near||!active||blocked())return;
    if(window.AdventureProgress?.regions.includes(near.id)&&window.PuzzleGame) {
      const region=near.id;
      clearInput();screen.hidden=true;GameAudio.click();
      window.PuzzleGame.open(region,{
        onComplete(id){
          if(AdventureProgress.award(id)) {
            updateProgress();$('#island-announcement').textContent=`Chave conquistada! Você tem ${AdventureProgress.keyCount} de 4 chaves.`;
          }
        },
        onExit(){returnFromChallenge(trigger);}
      });
      return;
    }
    if(near.id==='mountain'&&window.GameRescue) {
      foundCat=true;clearInput();screen.hidden=true;GameAudio.click();
      window.GameRescue.open({onProgress:updateProgress,onExit(){returnFromChallenge(trigger);},onMenu:stop});
      return;
    }
    $('#island-info-title').textContent=near.title;$('#island-info-chapter').textContent=near.chapter;
    $('#island-info-copy').textContent=near.text;$('#island-info-note').textContent=near.note;
    showDialog(info,trigger);
  }
  function openMap(trigger) {
    if(!active||blocked())return;
    renderer.renderOverview(player,camera,visited,true);showDialog(map,trigger);
  }
  $('#island-interact').addEventListener('click',event=>interact(event.currentTarget));
  $('#island-pause-button').addEventListener('click',event=>showDialog(pause,event.currentTarget));
  $('#island-map-button').addEventListener('click',event=>openMap(event.currentTarget));
  $('#island-minimap-button').addEventListener('click',event=>openMap(event.currentTarget));
  $('#island-return-menu').addEventListener('click',stop);
  for(const dialog of [info,pause,map]) {
    dialog.addEventListener('close',()=>{clearInput();if(active)(dialogTrigger||canvas).focus();});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const bounds=dialog.getBoundingClientRect();
      if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
    });
  }
  document.addEventListener('keydown',event=>{
    if(!active||event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey)return;
    const key=event.key.toLowerCase();
    if(key==='k'&&renderer.debug&&!event.repeat&&!document.hidden&&!inChallenge()&&!dialogs.some(dialog=>dialog.open)) {
      event.preventDefault();window.IslandKeys?.reset(world);updateNearby();return;
    }
    if(dev?.input(event))return;
    if(blocked())return;
    const direction=directionKeys[key];
    if(direction){event.preventDefault();keys.add(key);}
    else if(key==='e'){event.preventDefault();if(!event.repeat)interact();}
    else if(key==='m'){event.preventDefault();if(!event.repeat)openMap();}
    else if(key==='f3'){event.preventDefault();if(!event.repeat)renderer.toggleDebug();}
    else if(key==='escape'){event.preventDefault();if(!event.repeat)showDialog(pause);}
  });
  document.addEventListener('keyup',event=>{
    const direction=directionKeys[event.key.toLowerCase()];
    if(direction)keys.delete(event.key.toLowerCase());
  });
  // Captura garante que soltar fora do botão também encerra a caminhada.
  document.querySelectorAll('[data-walk]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{
      if(!active||blocked())return;
      event.preventDefault();button.focus();button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,button.dataset.walk);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>pointers.delete(event.pointerId));
    button.addEventListener('click',event=>{
      if(event.detail!==0||!active||blocked())return;
      const [dx,dy]={up:[0,-24],down:[0,24],left:[-24,0],right:[24,0]}[button.dataset.walk];
      player.facing=button.dataset.walk;IslandWorld.movePlayer(world,player,dx,dy);updateLocation();updateNearby();
    });
  });
  // Joystick analógico: arrastar o bastão dá um vetor {x,y} dentro de pointers.
  const joystick=$('#island-joystick'),stick=$('#joystick-stick');
  if(joystick) {
    const radius=46; // alcance do bastão em pixels, limitado ao anel da base
    const setStick=(nx,ny)=>{stick.style.transform=`translate(calc(-50% + ${nx*radius}px),calc(-50% + ${ny*radius}px))`;};
    joystick.addEventListener('pointerdown',event=>{
      if(!active||blocked())return;
      event.preventDefault();joystick.setPointerCapture(event.pointerId);joystick.classList.add('is-active');
      pointers.set(event.pointerId,{x:0,y:0});
    });
    joystick.addEventListener('pointermove',event=>{
      if(!pointers.has(event.pointerId))return;
      event.preventDefault();
      const base=joystick.getBoundingClientRect();
      const cx=(base.left+base.right)/2,cy=(base.top+base.bottom)/2;
      let vx=(event.clientX-cx)/radius,vy=(event.clientY-cy)/radius;
      const len=Math.hypot(vx,vy);
      if(len>1){vx/=len;vy/=len;} // mantém o bastão dentro do anel
      // Pequena zona morta no centro evita andar sem querer com um toque parado.
      const vec=Math.hypot(vx,vy)<.18?{x:0,y:0}:{x:vx,y:vy};
      pointers.set(event.pointerId,vec);setStick(vec.x,vec.y);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,event=>{
      if(!pointers.has(event.pointerId))return;
      pointers.delete(event.pointerId);resetJoystick();
    });
  }
  window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;});
  window.addEventListener('resize',()=>{if(active&&!inChallenge()){renderer.resize();updateCamera(true);}});
  renderer.ready.then(()=>{
    loaded=true;$('#island-loading').hidden=renderer.failed.length===0;
    if(active)updateCamera(true);
    if(renderer.failed.length)$('#island-loading').textContent='Algumas imagens não abriram. Confira se a pasta assets está junto do index.html.';
  });
  return {start,stop,get active(){return active;}};
})();
