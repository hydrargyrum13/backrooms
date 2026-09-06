"use strict";

const sourceUrl=new URL("./game-v13.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v13.js failed to load: ${r.status}`);return r.text()});

source=source.replace('new URL("./game-v9.js",import.meta.url)',`new URL("./game-v9.js",${JSON.stringify(import.meta.url)})`);

// Equal mouse sensitivity on both axes.
source=source.split('player.pitch-=e.movementY*.0017').join('player.pitch-=e.movementY*.0025');

// Level 0 carpet: weave, wear, border rhythm.
source=source.replace(
  'if(t==="yellow")f=((ix+iy)&1?0.94:1.02)*(Math.abs(fx-.5)+Math.abs(fy-.5)<.23?1.07:1);',
  'if(t==="yellow"){const weave=(Math.floor(fx*18)+Math.floor(fy*18))%5===0?.955:1,diamond=Math.abs(fx-.5)+Math.abs(fy-.5),edge=(fx<.035||fy<.035)?.90:1,worn=rnd(ix,iy,881)<.08?.91:1;f=((ix+iy)&1?.965:1.015)*weave*(diamond>.31&&diamond<.36?1.07:1)*edge*worn}'
);

// Level 4 carpet: commercial tiles with alternating fiber direction.
source=source.replace(
  'else if(t==="office")f=((ix+iy)&1?.92:1.03)*(Math.floor(fx*6)%3===0?.96:1);',
  'else if(t==="office"){const tile=((ix&1)^(iy&1))?1.025:.955,stripe=((ix+iy)&1)?(Math.floor(fx*14)%5===0?.91:1):(Math.floor(fy*14)%5===0?.91:1),seam=(fx<.035||fy<.035)?.82:1;f=tile*stripe*seam*(.985+rnd(ix,iy,882)*.03)}'
);

// Level 5 carpet: richer burgundy runner / medallion motif.
source=source.replace(
  'else if(t==="hotel")f=((Math.floor(fx*8)+Math.floor(fy*8))%6===0?1.08:.86)*(Math.abs(fx-.5)<.08?1.06:1);',
  'else if(t==="hotel"){const cx=Math.abs(fx-.5),cy=Math.abs(fy-.5),med=(cx+cy<.22?1.10:1),runner=(cx<.055||cy<.055)?1.08:1,border=(fx<.04||fy<.04)?.72:1,grain=(Math.floor((fx+fy)*20)%6===0?.94:1);f=.88*med*runner*border*grain*(.96+rnd(ix,iy,883)*.08)}'
);

// Better suspended ceilings for yellow halls / office.
source=source.replace(
  'if(t==="yellow"||t==="office")f=(fx<.055||fy<.055)?.68:1;',
  'if(t==="yellow"||t==="office"){const seam=(fx<.045||fy<.045),inner=(fx>.12&&fx<.88&&fy>.12&&fy<.88),panel=((ix*3+iy*5)&7)===0;f=seam?.61:(inner?(panel?1.08:.985):.91);f*=.985+rnd(ix,iy,884)*.035}'
);

// Hotel ceiling: framed plaster panels.
source=source.replace(
  'else if(t==="hotel")f=(fx<.04||fy<.04)?.70:.94;',
  'else if(t==="hotel"){const frame=fx<.045||fy<.045||fx>.955||fy>.955,inner=fx>.18&&fx<.82&&fy>.18&&fy<.82;f=frame?.64:(inner?1.035:.90);f*=.97+rnd(ix,iy,885)*.05}'
);

// Wallpaper / wall surface detail.
source=source.replace(
  'if(wt==="yellow")tex=.88+(Math.floor(hit.wallX*10)%4===0?.10:0);',
  'if(wt==="yellow"){const u=hit.wallX,vertical=Math.floor(u*24)%6===0,trim=(u<.035||u>.965),stain=rnd(hit.mx,hit.my,886)<.10;tex=(vertical?.94:1.00)*(trim?.86:1)*(stain?.89:1)}'
);
source=source.replace(
  'else if(wt==="office")tex=.91+(Math.floor(hit.wallX*16)%8===0?.05:0);',
  'else if(wt==="office"){const u=hit.wallX,seam=Math.floor(u*20)%10===0,panel=(Math.floor(u*10)&1)===0;tex=(seam?.87:(panel?.99:.945))*(.98+rnd(hit.mx,hit.my,887)*.04)}'
);
source=source.replace(
  'else if(wt==="hotel")tex=.80+(Math.floor(hit.wallX*12)%3===0?.15:0);',
  'else if(wt==="hotel"){const u=hit.wallX,rail=Math.floor(u*18)%9===0,damask=Math.sin(u*Math.PI*12)>.68;tex=(rail?.78:(damask?1.05:.89))*(.96+rnd(hit.mx,hit.my,888)*.07)}'
);

// A subtle destination-ceiling tint near the forward exit.
source=source.replace(
  'drawPlanePattern(lv,horizon);if(level===0||level===4)',
  'drawPlanePattern(lv,horizon);if(level<10){let exitD=1e9,exitT=null;for(const rr of transitions(level)){if(rr.target!==level+1)continue;const dd=Math.hypot(rr.cx+.5-player.x,rr.cy+.5-player.y);if(dd<exitD){exitD=dd;exitT=rr}}if(exitT&&exitD<48){const k=1-exitD/48,pulse=.72+.28*Math.sin(time*.004),hh=Math.max(0,Math.min(H,horizon));vctx.save();vctx.globalAlpha=k*.105*pulse;vctx.fillStyle=LEVELS[exitT.target].ceil[1]||LEVELS[exitT.target].ceil[0];vctx.fillRect(0,0,W,hh);vctx.restore()}}if(level===0||level===4)'
);

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
