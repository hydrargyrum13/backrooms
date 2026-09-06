"use strict";

const sourceUrl=new URL("./game-v14.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v14.js failed to load: ${r.status}`);return r.text()});

// v14 is executed as text here, so preserve its module-relative v13 load.
source=source.replace('new URL("./game-v13.js",import.meta.url)',`new URL("./game-v13.js",${JSON.stringify(import.meta.url)})`);

// Before v14 executes v13, patch the generated runtime so vertical and horizontal mouse sensitivity match.
source=source.replace(
  'const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;\nawait new AsyncFunction(source)();',
  `source=source.split("player.pitch-=e.movementY*.0017").join("player.pitch-=e.movementY*.0025");
// Add a subtle ceiling tint as the player approaches the nearest forward exit.
source=source.split("drawPlanePattern(lv,horizon);if(level===0||level===4)").join("drawPlanePattern(lv,horizon);if(level<10){let exitD=1e9;for(const er of transitions(level)){if(er.target!==level+1)continue;const ed=Math.hypot(er.cx+.5-player.x,er.cy+.5-player.y);if(ed<exitD)exitD=ed}if(exitD<48){const ca=(1-exitD/48)*.12;if(ca>0){vctx.save();vctx.globalAlpha=ca;vctx.fillStyle=\\\"#d7c896\\\";vctx.fillRect(0,0,W,Math.max(0,Math.min(H,horizon)));vctx.restore()}}}if(level===0||level===4)");
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();`
);

const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
