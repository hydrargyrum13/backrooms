"use strict";

const bootError=document.createElement("pre");
bootError.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;max-width:75vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(bootError);

try{
  const sourceUrl=new URL("./game-v13.js",import.meta.url);
  let source=await fetch(sourceUrl).then(r=>{
    if(!r.ok)throw new Error(`game-v13.js failed to load: ${r.status}`);
    return r.text();
  });

  // v13 runs as a real module Blob, so make every nested source URL absolute to the page.
  source=source.replace(
    'new URL("./game-v9.js",import.meta.url)',
    'new URL("./src/game-v9.js",location.href)'
  );
  source=source.replace(
    'source=source.replace(\'new URL("./game-v3.js",import.meta.url)\',`new URL("./game-v3.js",${JSON.stringify(import.meta.url)})`);',
    'source=source.replace(\'new URL("./game-v3.js",import.meta.url)\',\'new URL("./src/game-v3.js",location.href)\');'
  );

  // v13 used AsyncFunction for the v9 runtime. That source is module code, so import it as a module instead.
  source=source.replace(
    'const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;\nawait new AsyncFunction(source)();',
    'const runtimeBlob=new Blob([source],{type:"text/javascript"});const runtimeUrl=URL.createObjectURL(runtimeBlob);try{await import(runtimeUrl)}finally{URL.revokeObjectURL(runtimeUrl)}'
  );

  // Equal horizontal / vertical mouse sensitivity.
  source=source.split('player.pitch-=e.movementY*.0017').join('player.pitch-=e.movementY*.0025');

  // Level 0 carpet: finer weave, worn patches, restrained geometric border.
  source=source.replace(
    'if(t==="yellow")f=((ix+iy)&1?0.94:1.02)*(Math.abs(fx-.5)+Math.abs(fy-.5)<.23?1.07:1);',
    'if(t==="yellow"){const weave=(Math.floor(fx*22)+Math.floor(fy*22))%7===0?.965:1,diamond=Math.abs(fx-.5)+Math.abs(fy-.5),edge=(fx<.03||fy<.03)?.88:1,worn=rnd(ix,iy,881)<.075?.90:1,grain=.985+rnd(ix*3,iy*3,891)*.035;f=((ix+iy)&1?.975:1.012)*weave*(diamond>.30&&diamond<.35?1.075:1)*edge*worn*grain}'
  );

  // Level 4: commercial carpet tiles with alternating pile direction and seams.
  source=source.replace(
    'else if(t==="office")f=((ix+iy)&1?.92:1.03)*(Math.floor(fx*6)%3===0?.96:1);',
    'else if(t==="office"){const tile=((ix&1)^(iy&1))?1.025:.965,stripe=((ix+iy)&1)?(Math.floor(fx*18)%6===0?.92:1):(Math.floor(fy*18)%6===0?.92:1),seam=(fx<.028||fy<.028)?.78:1,fleck=rnd(ix*5+Math.floor(fx*4),iy*5+Math.floor(fy*4),882)>.82?1.045:1;f=tile*stripe*seam*fleck*(.987+rnd(ix,iy,892)*.026)}'
  );

  // Level 5: burgundy hotel runner / medallion language.
  source=source.replace(
    'else if(t==="hotel")f=((Math.floor(fx*8)+Math.floor(fy*8))%6===0?1.08:.86)*(Math.abs(fx-.5)<.08?1.06:1);',
    'else if(t==="hotel"){const cx=Math.abs(fx-.5),cy=Math.abs(fy-.5),med=(cx+cy<.20?1.11:1),ring=(cx+cy>.27&&cx+cy<.32?1.07:1),runner=(cx<.05||cy<.05)?1.075:1,border=(fx<.032||fy<.032)?.70:1,grain=(Math.floor((fx+fy)*24)%7===0?.945:1);f=.89*med*ring*runner*border*grain*(.965+rnd(ix,iy,883)*.07)}'
  );

  // Suspended ceilings: visible grid, inset panels, subtle dirty panel variance.
  source=source.replace(
    'if(t==="yellow"||t==="office")f=(fx<.055||fy<.055)?.68:1;',
    'if(t==="yellow"||t==="office"){const seam=(fx<.038||fy<.038),inner=(fx>.10&&fx<.90&&fy>.10&&fy<.90),panel=((ix*3+iy*5)&7)===0,dirty=rnd(ix,iy,884)<.08?.91:1;f=seam?.58:(inner?(panel?1.07:.995):.90);f*=dirty*(.99+rnd(ix*2,iy*2,894)*.025)}'
  );

  // Hotel ceiling: framed plaster panels instead of generic tiles.
  source=source.replace(
    'else if(t==="hotel")f=(fx<.04||fy<.04)?.70:.94;',
    'else if(t==="hotel"){const frame=fx<.038||fy<.038||fx>.962||fy>.962,inner=fx>.17&&fx<.83&&fy>.17&&fy<.83,center=Math.abs(fx-.5)<.20&&Math.abs(fy-.5)<.20;f=frame?.62:(center?1.045:(inner?1.02:.90));f*=.975+rnd(ix,iy,885)*.045}'
  );

  // Wallpaper / wall detail: seams, stains, panels, richer hotel motif.
  source=source.replace(
    'if(wt==="yellow")tex=.88+(Math.floor(hit.wallX*10)%4===0?.10:0);',
    'if(wt==="yellow"){const u=hit.wallX,vertical=Math.floor(u*28)%7===0,trim=(u<.028||u>.972),stain=rnd(hit.mx,hit.my,886)<.095,age=.975+rnd(hit.mx*3,hit.my*3,896)*.045;tex=(vertical?.945:1.005)*(trim?.84:1)*(stain?.885:1)*age}'
  );
  source=source.replace(
    'else if(wt==="office")tex=.91+(Math.floor(hit.wallX*16)%8===0?.05:0);',
    'else if(wt==="office"){const u=hit.wallX,seam=Math.floor(u*24)%12===0,panel=(Math.floor(u*12)&1)===0,scuff=rnd(hit.mx,hit.my,887)<.07;tex=(seam?.86:(panel?.995:.955))*(scuff?.91:1)*(.985+rnd(hit.mx*2,hit.my*2,897)*.03)}'
  );
  source=source.replace(
    'else if(wt==="hotel")tex=.80+(Math.floor(hit.wallX*12)%3===0?.15:0);',
    'else if(wt==="hotel"){const u=hit.wallX,rail=Math.floor(u*20)%10===0,damask=Math.sin(u*Math.PI*14)>.72,secondary=Math.cos(u*Math.PI*28)>.86;tex=(rail?.76:(damask?1.065:(secondary?.97:.885)))*(.965+rnd(hit.mx,hit.my,888)*.065)}'
  );

  // Subtle destination ceiling color shift when approaching the forward exit.
  source=source.replace(
    'drawPlanePattern(lv,horizon);if(level===0||level===4)',
    'drawPlanePattern(lv,horizon);if(level<10){let exitD=1e9,exitT=null;for(const rr of transitions(level)){if(rr.target!==level+1)continue;const dd=Math.hypot(rr.cx+.5-player.x,rr.cy+.5-player.y);if(dd<exitD){exitD=dd;exitT=rr}}if(exitT&&exitD<48){const k=1-exitD/48,pulse=.75+.25*Math.sin(time*.004),hh=Math.max(0,Math.min(H,horizon));vctx.save();vctx.globalAlpha=k*.09*pulse;vctx.fillStyle=LEVELS[exitT.target].ceil[1]||LEVELS[exitT.target].ceil[0];vctx.fillRect(0,0,W,hh);vctx.restore()}}if(level===0||level===4)'
  );

  const blob=new Blob([source],{type:"text/javascript"});
  const blobUrl=URL.createObjectURL(blob);
  try{
    await import(blobUrl);
  }finally{
    URL.revokeObjectURL(blobUrl);
  }
}catch(err){
  bootError.style.display="block";
  bootError.textContent="Backrooms v15 bootstrap failed.\n"+(err?.stack||err?.message||String(err));
  console.error(err);
}
