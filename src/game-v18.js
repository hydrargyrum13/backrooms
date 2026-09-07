"use strict";

const bootError=document.createElement("pre");
bootError.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;max-width:78vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(bootError);

try{
  let source=await fetch(new URL("./game-v17.js",import.meta.url)).then(r=>{
    if(!r.ok)throw new Error("game-v17.js failed: "+r.status);
    return r.text();
  });

  // v17 normally resolves game-v13 relative to its own module URL. Because v18
  // executes the optimized v17 source from a blob URL, import.meta.url becomes
  // blob:... and relative URL construction fails. Anchor it to the page instead.
  source=source.replace(
    'new URL("./game-v13.js",import.meta.url)',
    'new URL("./src/game-v13.js",location.href)'
  );

  // Floor/ceiling is the expensive part: render it at 4x2 pixel blocks instead
  // of evaluating every other pixel on every scanline.
  source=source.split('for(let y=0;y<H;y++){const delta=Math.abs(y-horizon);').join('for(let y=0;y<H;y+=2){const delta=Math.abs(y-horizon);');
  source=source.split('for(let x=0;x<W;x+=2){const ix=Math.floor(wx)').join('for(let x=0;x<W;x+=4){const ix=Math.floor(wx)');
  source=source.split('vctx.fillRect(x,y,2,1);wx+=sx*2;wy+=sy*2').join('vctx.fillRect(x,y,4,2);wx+=sx*4;wy+=sy*4');

  // Do not even enumerate distant props/items. Walls are already first-hit
  // raycasted, so geometry behind a wall is not drawn by the wall renderer.
  source=source.split('for(let y=py-12;y<=py+12;y++)for(let x=px-12;x<=px+12;x++){').join('for(let y=py-8;y<=py+8;y++)for(let x=px-8;x<=px+8;x++){');

  const blob=new Blob([source],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(err){
  bootError.style.display="block";
  bootError.textContent="Backrooms v18 bootstrap failed.\n"+(err?.stack||err?.message||String(err));
  console.error(err);
}
