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

// Run v9 after adjusting its generated runtime for faster movement + stamina.
const sourceUrl=new URL("./game-v9.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v9.js yüklenemedi: ${r.status}`);return r.text()});

source=source.replace('new URL("./game-v3.js",import.meta.url)',`new URL("./game-v3.js",${JSON.stringify(import.meta.url)})`);
source=source.replace('let selectedSlot=0,boostTimer=0;','let selectedSlot=0,boostTimer=0,stamina=100;');
source=source.replace(
  'const sp=player.speed*((keys.ShiftLeft||keys.ShiftRight)?1.65:1)*(boostTimer>0?1.4:1),stp=sp*dt',
  'const sprinting=(keys.ShiftLeft||keys.ShiftRight)&&L>0&&stamina>0,sp=3.4*(sprinting?2.2:1)*(boostTimer>0?1.4:1),stp=sp*dt'
);
source=source.replace(
  'if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);if(titleTimer>0){titleTimer-=dt;if(titleTimer<=0)levelTitle.style.opacity="0"}if(transitionCooldown>0)transitionCooldown-=dt;maybeTransition()',
  'if(sprinting)stamina=Math.max(0,stamina-dt*24);else stamina=Math.min(100,stamina+dt*18);if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);if(titleTimer>0){titleTimer-=dt;if(titleTimer<=0)levelTitle.style.opacity="0"}if(transitionCooldown>0)transitionCooldown-=dt;maybeTransition()'
);
source=source.replace(
  'function renderHotbar(){',
  'function renderStamina(){const w=198,h=7,x=(canvas.width-w)/2,y=canvas.height-78;ctx.save();ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#8a8678";ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=stamina>25?"#d9d4bd":"#bfa48d";ctx.fillRect(x+2,y+2,(w-4)*(stamina/100),h-4);ctx.fillStyle="#d9d4bd";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("STAMINA",canvas.width/2,y-3);ctx.restore()}function renderHotbar(){'
);
source=source.replace(
  'renderExitHint();renderLidar();renderHotbar();hud()',
  'renderExitHint();renderLidar();renderStamina();renderHotbar();hud()'
);

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
