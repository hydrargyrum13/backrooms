"use strict";
const bootError=document.createElement("pre");
bootError.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;max-width:78vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(bootError);
try{
  let source=await fetch(new URL("./game-v17.js",import.meta.url)).then(r=>{if(!r.ok)throw new Error("game-v17.js failed: "+r.status);return r.text()});
  source=source.replace('new URL("./game-v13.js",import.meta.url)','new URL("./src/game-v13.js",location.href)');

  // Performance: draw floor/ceiling in 4x2 blocks instead of 2x1.
  source=source.split('for(let y=0;y<H;y++){const delta=Math.abs(y-horizon);').join('for(let y=0;y<H;y+=2){const delta=Math.abs(y-horizon);');
  source=source.split('for(let x=0;x<W;x+=2){const ix=Math.floor(wx)').join('for(let x=0;x<W;x+=4){const ix=Math.floor(wx)');
  source=source.split('vctx.fillRect(x,y,2,1);wx+=sx*2;wy+=sy*2').join('vctx.fillRect(x,y,4,2);wx+=sx*4;wy+=sy*4');

  // Precomputed Level 0 carpet lookup. Keep the injected newline escaped because this lands inside v17's generated string.
  const carpetInject='const CARPET_TEX=new Float32Array(64*64);for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++){let n=0;let h=((xx*374761393)^(yy*668265263)^0x5f3759df)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;n=(h&1023)/1023;const fiber=((xx+yy*3)%7===0?-.035:0)+((xx*5+yy)%11===0?.025:0);const weave=((xx&1)?-.012:.012)+((yy&1)?.008:-.008);const stain=((h>>>12)%97===0?-.11:0);CARPET_TEX[yy*64+xx]=.965+(n-.5)*.06+fiber+weave+stain;}\\n  ';
  source=source.split('replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern').join(carpetInject+'replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern');

  // Replace the Level 0 carpet formula with tile sampling + broad wear, so it reads like fabric instead of ceramic tiles.
  source=source.replace(
    'if(t===\\"yellow\\")f=macro*(.975+.022*Math.sin(wx*2.1+Math.sin(wy*.55))+.015*Math.sin(wy*4.6)+.012*Math.sin((wx+wy)*7.8))*(rnd(Math.floor(wx/5),Math.floor(wy/5),881)<.06?.93:1);',
    'if(t===\\"yellow\\"){const tx=((Math.floor(wx*13)%64)+64)%64,ty=((Math.floor(wy*13)%64)+64)%64,cloth=CARPET_TEX[ty*64+tx],wear=.975+.025*Math.sin(wx*.12+wy*.08),track=(Math.abs((((wx+wy*.22)%9)+9)%9-4.5)<.65?.965:1);f=cloth*wear*track*(rnd(Math.floor(wx/6),Math.floor(wy/6),881)<.045?.94:1)}'
  );

  // Level 0 wallpaper: broader repeat, faded paper bands, occasional damp patches. No tiny tile-grid look.
  source=source.replace(
    'if(wt===\\"yellow\\")tex=broad*(.965+.035*Math.sin(wu*2.15+Math.sin(wu*.47)))*(rnd(hit.mx,hit.my,886)<.08?.91:1);',
    'if(wt===\\"yellow\\"){const band=.975+.022*Math.sin(wu*.72)+.015*Math.sin(wu*1.44+.8),paper=.985+.018*Math.sin(wu*4.6),damp=rnd(hit.mx,hit.my,886)<.055?.90:1,fade=.97+.03*rnd(Math.floor(hit.mx/3),Math.floor(hit.my/3),896);tex=broad*band*paper*damp*fade}'
  );

  const blob=new Blob([source],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(err){
  bootError.style.display="block";
  bootError.textContent="Backrooms v18 bootstrap failed.\n"+(err?.stack||err?.message||String(err));
  console.error(err);
}
