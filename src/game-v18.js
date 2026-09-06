"use strict";
const bootError=document.createElement("pre");
bootError.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;max-width:78vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(bootError);
try{
  let source=await fetch(new URL("./game-v17.js",import.meta.url)).then(r=>{if(!r.ok)throw new Error("game-v17.js failed: "+r.status);return r.text()});
  source=source.replace('new URL("./game-v13.js",import.meta.url)','new URL("./src/game-v13.js",location.href)');

  source=source.split('for(let y=0;y<H;y++){const delta=Math.abs(y-horizon);').join('for(let y=0;y<H;y+=2){const delta=Math.abs(y-horizon);');
  source=source.split('for(let x=0;x<W;x+=2){const ix=Math.floor(wx)').join('for(let x=0;x<W;x+=4){const ix=Math.floor(wx)');
  source=source.split('vctx.fillRect(x,y,2,1);wx+=sx*2;wy+=sy*2').join('vctx.fillRect(x,y,4,2);wx+=sx*4;wy+=sy*4');

  const carpetRuntimeInject='patched=patched.replace(\\"function drawPlanePattern(\\",\\"const CARPET_TEX=new Float32Array(64*64);for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++){let h=((xx*374761393)^(yy*668265263)^0x5f3759df)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;const n=(h&1023)/1023,fiber=((xx+yy*3)%7===0?-.035:0)+((xx*5+yy)%11===0?.025:0),weave=((xx&1)?-.012:.012)+((yy&1)?.008:-.008),stain=((h>>>12)%97===0?-.11:0);CARPET_TEX[yy*64+xx]=.965+(n-.5)*.06+fiber+weave+stain;}function drawPlanePattern(\\");\\n  ';
  source=source.split('replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern').join(carpetRuntimeInject+'replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern');

  source=source.replace(
    'if(t===\\"yellow\\")f=macro*(.975+.022*Math.sin(wx*2.1+Math.sin(wy*.55))+.015*Math.sin(wy*4.6)+.012*Math.sin((wx+wy)*7.8))*(rnd(Math.floor(wx/5),Math.floor(wy/5),881)<.06?.93:1);',
    'if(t===\\"yellow\\"){const tx=((Math.floor(wx*13)%64)+64)%64,ty=((Math.floor(wy*13)%64)+64)%64,cloth=CARPET_TEX[ty*64+tx],wear=.975+.025*Math.sin(wx*.12+wy*.08),track=(Math.abs((((wx+wy*.22)%9)+9)%9-4.5)<.65?.965:1);f=cloth*wear*track*(rnd(Math.floor(wx/6),Math.floor(wy/6),881)<.045?.94:1)}'
  );

  source=source.replace(
    'if(wt===\\"yellow\\")tex=broad*(.965+.035*Math.sin(wu*2.15+Math.sin(wu*.47)))*(rnd(hit.mx,hit.my,886)<.08?.91:1);',
    'if(wt===\\"yellow\\"){const band=.975+.022*Math.sin(wu*.72)+.015*Math.sin(wu*1.44+.8),paper=.985+.018*Math.sin(wu*4.6),damp=rnd(hit.mx,hit.my,886)<.055?.90:1,fade=.97+.03*rnd(Math.floor(hit.mx/3),Math.floor(hit.my/3),896);tex=broad*band*paper*damp*fade}'
  );

  source=source.replace(
    'if(t===\\"yellow\\"||t===\\"office\\"){const seam=fx<.035||fy<.035;f=seam?.62:(.985+.02*Math.sin(ix*.8+iy*.55))}else if(t===\\"hotel\\"){const frame=fx<.035||fy<.035||fx>.965||fy>.965;f=frame?.66:.98+.02*Math.sin((ix+iy)*1.5)}else if(t===\\"concrete\\")f=.84+rnd(ix,iy,805)*.1;else if(t===\\"pipes\\"||t===\\"electrical\\")f=.78+.08*Math.sin(wx*3.1);else if(t===\\"darkness\\")f=.48+rnd(ix,iy,806)*.08;else if(t===\\"ocean\\")f=.84+.07*Math.sin((wx+wy)*1.9);else if(t===\\"caves\\")f=.56+rnd(ix,iy,807)*.22;else if(t===\\"suburb\\")f=.8+rnd(ix,iy,808)*.08;else if(t===\\"fields\\")f=.96',
    'if(t===\\"yellow\\"){const seam=fx<.032||fy<.032||fx>.968||fy>.968,panel=.982+.018*Math.sin(ix*.71+iy*.47)+.012*Math.sin((ix+iy)*1.83),lamp=Math.abs(fx-.5)<.17&&Math.abs(fy-.5)<.055?1.045:1,dust=rnd(ix,iy,1805)<.055?.925:1;f=seam?.63:macro*panel*lamp*dust}else if(t===\\"office\\"){const seam=fx<.03||fy<.03||fx>.97||fy>.97,speck=.978+rnd(ix,iy,1806)*.034,panel=.99+.014*Math.sin(ix*.89+iy*.63);f=seam?.67:macro*speck*panel}else if(t===\\"hotel\\"){const frame=fx<.042||fy<.042||fx>.958||fy>.958,center=Math.max(0,1-Math.hypot(fx-.5,fy-.5)*2.5),plaster=.97+.024*Math.sin(wx*.41)+.017*Math.sin(wy*.36);f=frame?.68:macro*plaster*(.975+center*.05)}else if(t===\\"concrete\\"){const stain=rnd(Math.floor(wx/3),Math.floor(wy/3),1808)<.075?.90:1;f=macro*(.83+rnd(ix,iy,1807)*.11)*stain}else if(t===\\"pipes\\"||t===\\"electrical\\"){const beam=Math.abs((((wx*.34)%1)+1)%1-.5)<.075?.88:1;f=macro*(.80+.055*Math.sin(wx*2.65)+.035*Math.sin(wy*1.85))*beam}else if(t===\\"darkness\\")f=.48+rnd(ix,iy,1809)*.08;else if(t===\\"ocean\\")f=macro*(.84+.05*Math.sin((wx+wy)*1.7));else if(t===\\"caves\\")f=.56+rnd(ix,iy,1810)*.22;else if(t===\\"suburb\\")f=macro*(.82+rnd(ix,iy,1811)*.07);else if(t===\\"fields\\")f=.95+.02*Math.sin(wx*.15+wy*.09)'
  );

  const blob=new Blob([source],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(err){
  bootError.style.display="block";
  bootError.textContent="Backrooms v18 bootstrap failed.\n"+(err?.stack||err?.message||String(err));
  console.error(err);
}
