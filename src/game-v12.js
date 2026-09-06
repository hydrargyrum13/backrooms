"use strict";

// Per-session randomized world seed.
const originalImul=Math.imul.bind(Math);
const seedWords=new Uint32Array(1);
if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(seedWords);
else seedWords[0]=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);
const sessionSeed=seedWords[0]>>>0;
window.__BACKROOMS_SESSION_SEED=sessionSeed;
const hashMultipliers=new Set([374761393|0,668265263|0,1442695041|0,1274126177|0]);
Math.imul=function(a,b){if(hashMultipliers.has(b|0))a=((a|0)^(sessionSeed|0))|0;return originalImul(a,b)};

// Build the current runtime from v9, then apply gameplay systems in one place.
const sourceUrl=new URL("./game-v9.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v9.js yüklenemedi: ${r.status}`);return r.text()});
source=source.replace('new URL("./game-v3.js",import.meta.url)',`new URL("./game-v3.js",${JSON.stringify(import.meta.url)})`);

// Inventory / stamina / sanity state.
source=source.replace(
  'let selectedSlot=0,boostTimer=0;',
  'let selectedSlot=0,boostTimer=0,maxStamina=140,stamina=140,sanity=100;'
);

// New permanent stamina-up item sprite.
source=source.replace(
  'lidar:["00088000","00888800","08899880","08999980","08899880","00888800","00088000","00033000"]};',
  'lidar:["00088000","00888800","08899880","08999980","08899880","00888800","00088000","00033000"],energy:["00066000","00666600","06677660","06788760","06788760","06677660","00666600","00066000"]};'
);

// Rare Energy Bar spawn after Almond Water.
source=source.replace(
  'else if(r<.00245)it={id,type:"almond",name:"Almond Water"}',
  'else if(r<.00245)it={id,type:"almond",name:"Almond Water"};else if(r<.00265)it={id,type:"energy",name:"Energy Bar"}'
);

// Energy Bar permanently raises max stamina. Existing pickup types remain unchanged.
source=source.replace(
  'function collect(){const it=nearItem();if(!it)return;st(level).col.add(it.id);if(it.type==="flashlight"){inv.flashlight=true;inv.flashlightOn=true;inv.charge=Math.max(inv.charge,100)}else if(it.type==="battery")inv.batteries++;else if(it.type==="almond")inv.almondWater++;else if(it.type==="lidar")inv.lidarLevel++}',
  'function collect(){const it=nearItem();if(!it)return;st(level).col.add(it.id);if(it.type==="flashlight"){inv.flashlight=true;inv.flashlightOn=true;inv.charge=Math.max(inv.charge,100)}else if(it.type==="battery")inv.batteries++;else if(it.type==="almond")inv.almondWater++;else if(it.type==="lidar")inv.lidarLevel++;else if(it.type==="energy"){maxStamina+=20;stamina=maxStamina}}'
);

// Faster base movement, longer stamina, and sprint stops on the exact depletion frame.
source=source.replace(
  'const sp=player.speed*((keys.ShiftLeft||keys.ShiftRight)?1.65:1)*(boostTimer>0?1.4:1),stp=sp*dt',
  'const wantsSprint=(keys.ShiftLeft||keys.ShiftRight)&&L>0;let sprinting=wantsSprint&&stamina>0;if(sprinting){stamina=Math.max(0,stamina-dt*20);if(stamina<=0)sprinting=false}else if(!wantsSprint)stamina=Math.min(maxStamina,stamina+dt*16);const sp=3.4*(sprinting?2.2:1)*(boostTimer>0?1.4:1),stp=sp*dt'
);

// Auto-pickup when actually walking over an item. Sanity drains slowly over time.
source=source.replace(
  'if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);if(titleTimer>0){titleTimer-=dt;if(titleTimer<=0)levelTitle.style.opacity="0"}if(transitionCooldown>0)transitionCooldown-=dt;maybeTransition()',
  'sanity=Math.max(0,sanity-dt*.11);if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);const autoItem=nearItem();if(autoItem&&Math.hypot(autoItem.x+.5-player.x,autoItem.y+.5-player.y)<.34)collect();if(titleTimer>0){titleTimer-=dt;if(titleTimer<=0)levelTitle.style.opacity="0"}if(transitionCooldown>0)transitionCooldown-=dt;maybeTransition()'
);

// Almond Water: speed boost + sanity restoration.
source=source.replace(
  'else if(selectedSlot===1){if(inv.almondWater>0){inv.almondWater--;boostTimer=Math.max(boostTimer,10)}}',
  'else if(selectedSlot===1){if(inv.almondWater>0){inv.almondWater--;boostTimer=Math.max(boostTimer,10);sanity=Math.min(100,sanity+35)}}'
);

// HUD text includes sanity and permanent max stamina.
source=source.replace(
  '${boostTimer>0?`<br>Speed boost: ${boostTimer.toFixed(1)}s`:""}`;',
  '${boostTimer>0?`<br>Speed boost: ${boostTimer.toFixed(1)}s`:""}<br>Sanity: ${Math.ceil(sanity)}% · Max stamina: ${Math.round(maxStamina)}`;'
);

// Stamina stays immediately above the hotbar. Sanity gets its own bar above stamina.
source=source.replace(
  'function renderHotbar(){',
  'function renderSanity(){const w=198,h=7,x=(canvas.width-w)/2,y=canvas.height-94;ctx.save();ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#77746d";ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=sanity>30?"#cbc7b8":"#a98282";ctx.fillRect(x+2,y+2,(w-4)*(sanity/100),h-4);ctx.fillStyle="#d9d4bd";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("SANITY",canvas.width/2,y-3);ctx.restore()}function renderStamina(){const w=198,h=7,x=(canvas.width-w)/2,y=canvas.height-78;ctx.save();ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#8a8678";ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=stamina/maxStamina>.25?"#d9d4bd":"#bfa48d";ctx.fillRect(x+2,y+2,(w-4)*(stamina/maxStamina),h-4);ctx.fillStyle="#d9d4bd";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("STAMINA",canvas.width/2,y-3);ctx.restore()}function renderHotbar(){'
);

// Stronger proximity feedback around the forward exit. Existing arrow remains, plus pulse/vignette/text.
source=source.replace(
  'function renderExitHint(){if(level>=10)return;let best=null,bd=1e9;for(const r of transitions(level)){if(r.target!==level+1)continue;const d=Math.hypot(r.cx-player.x,r.cy-player.y);if(d<bd){bd=d;best=r}}if(!best||bd>34)return;',
  'function renderExitHint(){if(level>=10)return;let best=null,bd=1e9;for(const r of transitions(level)){if(r.target!==level+1)continue;const d=Math.hypot(r.cx-player.x,r.cy-player.y);if(d<bd){bd=d;best=r}}if(!best||bd>48)return;const closeness=1-bd/48,pulse=.55+.45*Math.sin(performance.now()*.006);ctx.save();ctx.globalAlpha=Math.max(.06,closeness*.34*pulse);ctx.strokeStyle="#e8dfb8";ctx.lineWidth=Math.max(2,canvas.height*.006);ctx.strokeRect(5,5,canvas.width-10,canvas.height-10);ctx.fillStyle="#e8dfb8";ctx.font=Math.max(10,Math.floor(canvas.height*.016))+"px monospace";ctx.textAlign="center";ctx.fillText("ÇIKIŞ SİNYALİ",canvas.width/2,canvas.height*.12);ctx.restore();if(bd>34)return;'
);

// Render new meters with the existing UI.
source=source.replace(
  'renderExitHint();renderLidar();renderHotbar();hud()',
  'renderExitHint();renderLidar();renderSanity();renderStamina();renderHotbar();hud()'
);

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
