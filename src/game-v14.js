"use strict";

const sourceUrl=new URL("./game-v13.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v13.js failed to load: ${r.status}`);return r.text()});

// v13 is executed as text here, so preserve its module-relative v9 load.
source=source.replace('new URL("./game-v9.js",import.meta.url)',`new URL("./game-v9.js",${JSON.stringify(import.meta.url)})`);

// English-only player-facing text.
const textReplacements=[
  ['sub.textContent="ZORLUK";','sub.textContent="DIFFICULTY";'],
  ['[["easy","KOLAY"],["normal","ORTA"],["hard","ZOR"]]','[["easy","EASY"],["normal","NORMAL"],["hard","HARD"]]'],
  ['"v13: "+name+" bulunamadı"','"v14: "+name+" not found"'],
  ['"v13: "+name+" sonu bulunamadı"','"v14: end of "+name+" not found"'],
  ['"ÖLDÜN"','"YOU DIED"'],
  ['"TEKRAR"','"RESTART"'],
  ['"ELEKTRİK ÇARPMASI"','"ELECTROCUTION"'],
  ['"SANITY TÜKENDİ"','"SANITY DEPLETED"'],
  ['"ÇIKIŞ YAKIN"','"EXIT NEARBY"'],
  ['"yok"','"none"'],
  ['"[E] Al: "','"[E] Pick up: "'],
  ['" yüklenemedi: "','" failed to load: "'],
  ['" eşleşmedi"','" did not match"']
];
for(const [a,b] of textReplacements)source=source.split(a).join(b);

// Add LIDAR scan state to the runtime variables created by v13.
source=source.replace(
  'let selectedSlot=0,boostTimer=0,coffee=0,sanity=100,gameDead=false,maxStamina=0,stamina=0;',
  'let selectedSlot=0,boostTimer=0,coffee=0,sanity=100,gameDead=false,maxStamina=0,stamina=0,lidarNotice="",lidarNoticeTimer=0;'
);

// Scale every normal prop model down to 72%. Keep the transition doorframe full-size.
source=source.replace(
  '});\nlet level=0,titleTimer=0,transitionCooldown=0;',
  '});\nfor(const modelName in MODELS){if(modelName==="doorframe")continue;MODELS[modelName]=MODELS[modelName].map(a=>[a[0]*.72,a[1]*.72,a[2]*.72,a[3]*.72,a[4]*.72,a[5]*.72,a[6]])}\nlet level=0,titleTimer=0,transitionCooldown=0;'
);

// Inject deterministic, level-themed safe zones into the generated runtime.
source=source.replace(
  '  replaceFn("renderStuff",',
  '  patched=patched.replace("function renderStuff(){","const SAFE_ZONE_PROPS=[\\"lamp\\",\\"locker\\",\\"pipeRack\\",\\"panel\\",\\"terminal\\",\\"bed\\",\\"lamp\\",\\"buoy\\",\\"rockTall\\",\\"mailbox\\",\\"haybale\\"];function safeZone(l){const s=hash(321,777,880,l),ang=(s%6283)/1000,dist=20+((s>>>8)%14),bx=Math.round(2.5+Math.cos(ang)*dist),by=Math.round(2.5+Math.sin(ang)*dist);for(let r=0;r<10;r++)for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(r&&Math.abs(xx)!==r&&Math.abs(yy)!==r)continue;const x=bx+xx,y=by+yy;if(!cellAt(x,y)&&!trAt(l,x,y))return{x:x+.5,y:y+.5,type:SAFE_ZONE_PROPS[l]}}return{x:3.5,y:3.5,type:SAFE_ZONE_PROPS[l]}}function renderStuff(){");\n\n  replaceFn("renderStuff",'
);

// Draw the themed safe-zone prop along with normal props/items.
source=source.replace(
  'r.sort((a,b)=>b.d-a.d);for(const q of r)',
  'const sz=safeZone(level),sd=Math.hypot(sz.x-player.x,sz.y-player.y);if(sd<14)r.push({k:0,d:sd,o:{x:sz.x,z:sz.y,y:0,yaw:0,type:sz.type}});r.sort((a,b)=>b.d-a.d);for(const q of r)'
);

// Safe-zone proximity indicator is minimal and only appears nearby.
source=source.replace(
  '  replaceFn("render",',
  '  patched=patched.replace("function render(t){","function renderSafeZone(){const s=safeZone(level),d=Math.hypot(s.x-player.x,s.y-player.y);if(d>6)return;ctx.save();ctx.globalAlpha=Math.max(.18,1-d/6);ctx.fillStyle=\\"#e8e5da\\";ctx.font=Math.max(10,Math.floor(canvas.height*.015))+\\"px monospace\\";ctx.textAlign=\\"center\\";ctx.fillText(\\"SAFE ZONE\\",canvas.width/2,canvas.height*.18);ctx.restore()}function render(t){");\n\n  replaceFn("render",'
);
source=source.replace(
  'renderHotbar();renderSanityFX();hud()',
  'renderHotbar();renderSanityFX();renderSafeZone();hud()'
);

// Sanity restores inside the safe zone instead of draining there.
source=source.replace(
  'sanity=Math.max(0,sanity-dt*.08*DIFF.sanity);',
  'const safe=safeZone(level),inSafe=Math.hypot(safe.x-player.x,safe.y-player.y)<4.2;if(inSafe)sanity=Math.min(100,sanity+dt*4.5);else sanity=Math.max(0,sanity-dt*.08*DIFF.sanity);'
);

// LIDAR left click reports the nearest exit distance. It does not consume a module.
source=source.replace(
  'else if(selectedSlot===3){if(coffee>0){coffee--;stamina=maxStamina;sanity=Math.min(100,sanity+8)}}',
  'else if(selectedSlot===2){if(inv.lidarLevel>0){let bd=1e9;for(const r of transitions(level)){const d=Math.hypot(r.cx+.5-player.x,r.cy+.5-player.y);if(d<bd)bd=d}lidarNotice=bd<1e9?"NEAREST EXIT: "+Math.round(bd)+"m":"NO EXIT SIGNAL";lidarNoticeTimer=4}}else if(selectedSlot===3){if(coffee>0){coffee--;stamina=maxStamina;sanity=Math.min(100,sanity+8)}}'
);

// Keep the scan message visible for a few seconds.
source=source.replace(
  'if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);',
  'if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);if(lidarNoticeTimer>0)lidarNoticeTimer=Math.max(0,lidarNoticeTimer-dt);'
);
source=source.replace(
  '+(boostTimer>0?"<br>Speed boost: "+boostTimer.toFixed(1)+"s":"");',
  '+(boostTimer>0?"<br>Speed boost: "+boostTimer.toFixed(1)+"s":"")+(lidarNoticeTimer>0?"<br>"+lidarNotice:"");'
);

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
