/* Sobreposição Canvas independente dos puzzles existentes. */
window.DevPuzzleScreen = (() => {
  'use strict';
  function create(canvas,world,clearInput) {
    let current=null,selected=0,hover=-1,buttons=[],notice='',until=0;
    const hit=event=>{
      const box=canvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
      return buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    };
    function close(complete=false) {
      if(!current)return;
      if(complete) {
        const state=world.keyState;state.keys[current.id]=true;
        notice=`Chave de ${current.label} obtida! (${KEYS.filter(k=>state.keys[k.id]).length}/4)`;
        until=performance.now()+2000;
      }
      current=null;buttons=[];hover=-1;canvas.style.cursor='';clearInput();canvas.focus();
      canvas.setAttribute('aria-label','Ilha do Conhecimento. WASD ou setas para explorar, E para interagir.');
    }
    canvas.addEventListener('pointermove',event=>{if(current){hover=hit(event);canvas.style.cursor=hover<0?'':'pointer';}});
    canvas.addEventListener('pointerleave',()=>{hover=-1;});
    canvas.addEventListener('click',event=>{if(current){const index=hit(event);if(index>=0)close(index===1);}});
    function open(key) {
      current=key;selected=0;hover=-1;buttons=[];clearInput();canvas.focus();
      canvas.setAttribute('aria-label',`Puzzle de ${key.label}. Tela de desenvolvimento. Escape: voltar. Enter: simular conclusão.`);
    }
    function input(event) {
      if(window.MemoryMazeGame?.active)return true;
      if(!current)return false;
      event.preventDefault();if(event.repeat)return true;
      const key=event.key.toLowerCase();
      if(key==='escape')close();
      else if(key==='enter')close(true);
      else if(key==='tab'||key==='arrowleft'||key==='arrowright')selected=1-selected;
      else if(key===' ')close(selected===1);
      return true;
    }
    function draw(ctx,width,height,time) {
      ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
      if(current) {
        ctx.fillStyle='#07111dcc';ctx.fillRect(0,0,width,height);
        const w=Math.min(560,width-24),h=Math.min(320,height-16),x=(width-w)/2,y=(height-h)/2;
        ctx.fillStyle='#20374a';ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();
        const compact=h<300;
        IslandKeys.icon(ctx,current,width/2,y+(compact?42:78),compact?32:54);
        ctx.fillStyle='#fff';ctx.font='bold 22px system-ui';ctx.fillText(`Puzzle de ${current.label}`,width/2,y+(compact?70:113),w-24);
        ctx.font='15px system-ui';ctx.fillText('Tela de desenvolvimento — puzzle ainda não implementado',width/2,y+(compact?96:145),w-24);
        buttons=['Voltar','[DEV] Simular conclusão'].map((label,i)=>({label,x:x+16,y:y+h-108+i*48,w:w-32,h:40}));
        buttons.forEach((b,i)=>{
          ctx.fillStyle=hover===i?'#53738c':selected===i?'#42647e':'#304e66';
          ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,8);ctx.fill();
          if(selected===i){ctx.strokeStyle='#f9de8c';ctx.lineWidth=2;ctx.stroke();}
          ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.fillText(b.label,b.x+b.w/2,b.y+26);
        });
      } else if(time<until) {
        const w=Math.min(width-20,520);ctx.fillStyle='#12202deb';ctx.beginPath();ctx.roundRect((width-w)/2,18,w,48,10);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.fillText(notice,width/2,48,w-16);
      }
      ctx.restore();
    }
    return {open,close,input,draw,get active(){return Boolean(current);}};
  }
  return {create};
})();
