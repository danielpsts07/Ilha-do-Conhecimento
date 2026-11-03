/* Profundidade em pixels nativos do mapa; a câmera só projeta o resultado. */
window.IslandOcclusion = (() => {
  'use strict';
  async function create(map) {
    const mask=await new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
      image.src=OCCLUSION_MASK_SRC;
    });
    if(!mask){console.warn('[Oclusão] island_occlusion.png ausente: sem oclusão.');return null;}
    const W=map.naturalWidth,H=map.naturalHeight,n=W*H;
    const occ=new Uint8Array(n),runBottom=new Uint16Array(n);
    const source=document.createElement('canvas');source.width=mask.naturalWidth;source.height=mask.naturalHeight;
    const sourceCtx=source.getContext('2d',{willReadFrequently:true});sourceCtx.drawImage(mask,0,0);
    let rgba=sourceCtx.getImageData(0,0,source.width,source.height).data;
    const sx=source.width/W,sy=source.height/H;let pixels=0,runs=0,first=-1;
    // Vizinho mais próximo: cada pixel do mapa consulta floor(x*sx), floor(y*sy) na máscara.
    for(let y=0;y<H;y++)for(let x=0;x<W;x++) {
      const i=y*W+x,p=(Math.floor(y*sy)*source.width+Math.floor(x*sx))*4;
      if(rgba[p+3]>=MASK_ALPHA_MIN&&rgba[p]>200&&rgba[p+2]>200&&rgba[p+1]<80){occ[i]=1;pixels++;}
    }
    rgba=null;source.width=source.height=0;
    // De baixo para cima, todos os pixels roxos do trecho recebem a mesma base.
    // Até quatro pixels vazios não separam o trecho; os buracos continuam transparentes.
    for(let x=0;x<W;x++) {
      let bottom=-1,gap=0;
      for(let y=H-1;y>=0;y--) {
        const i=y*W+x;
        if(occ[i]) {
          if(bottom<0){bottom=y;runs++;}
          runBottom[i]=bottom;gap=0;if(first<0)first=i;
        } else if(bottom>=0&&++gap>OCCLUSION_RUN_GAP_PX)bottom=-1;
      }
    }
    const mapCanvas=document.createElement('canvas');mapCanvas.width=W;mapCanvas.height=H;
    const mapCtx=mapCanvas.getContext('2d',{willReadFrequently:true});mapCtx.drawImage(map,0,0);
    const mapPixels=new Uint32Array(mapCtx.getImageData(0,0,W,H).data.buffer);
    mapCanvas.width=mapCanvas.height=0;
    const pw=OCCLUSION_PATCH_W,ph=OCCLUSION_PATCH_H,patchCanvas=document.createElement('canvas');
    patchCanvas.width=pw;patchCanvas.height=ph;
    const patchCtx=patchCanvas.getContext('2d'),patchData=patchCtx.createImageData(pw,ph);
    const patchPixels=new Uint32Array(patchData.data.buffer);
    // Overlay de diagnóstico pré-renderizado: nenhum percurso da máscara durante o desenho.
    const overlay=document.createElement('canvas');overlay.width=W;overlay.height=H;
    const overlayCtx=overlay.getContext('2d'),overlayData=overlayCtx.createImageData(W,H);
    for(let i=0;i<n;i++)if(occ[i]) {
      overlayData.data[i*4]=255;overlayData.data[i*4+2]=255;overlayData.data[i*4+3]=90;
    }
    overlayCtx.putImageData(overlayData,0,0);
    const covers=(footY,bottom)=>footY<bottom-OCCLUSION_MARGIN_PX;
    const selfTest=first>=0&&covers(runBottom[first]-10,runBottom[first])&&!covers(runBottom[first]+10,runBottom[first]);
    const report={pixels,runs,selfTest};
    console.info(`[Oclusão] ${pixels} pixels roxos; ${runs} trechos; profundidade ±10: ${selfTest?'OK':'FALHA'}.`);
    let lastX=NaN,lastY=NaN,x0=0,y0=0,behind=false;
    function update(heroX,footY) {
      if(heroX===lastX&&footY===lastY)return;
      lastX=heroX;lastY=footY;
      x0=Math.max(0,Math.min(W-pw,Math.round(heroX-pw/2)));
      y0=Math.max(0,Math.min(H-ph,Math.round(footY-ph+8)));
      patchPixels.fill(0);let count=0;
      // Pés acima da base => atrás. Pés abaixo da base => à frente do objeto.
      for(let y=0;y<ph&&y+y0<H;y++)for(let x=0;x<pw&&x+x0<W;x++) {
        const i=(y+y0)*W+x+x0;
        if(occ[i]&&covers(footY,runBottom[i])){patchPixels[y*pw+x]=mapPixels[i];count++;}
      }
      behind=count>0;patchCtx.putImageData(patchData,0,0);
    }
    function draw(ctx) {
      if(!behind)return;
      // Origem inteira na imagem, convertida pela mesma escala e transformação do mapa.
      // Não arredondar novamente no mundo: isso deslocaria o recorte e criaria costuras.
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.drawImage(patchCanvas,x0*WORLD_SCALE,y0*WORLD_SCALE,pw*WORLD_SCALE,ph*WORLD_SCALE);ctx.restore();
    }
    return {occ,runBottom,report,patchCanvas,overlay,update,draw,get behind(){return behind;}};
  }
  return {create};
})();
