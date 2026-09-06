"use strict";

// Randomize the deterministic world hash once per page load while keeping
// the generated world stable for the lifetime of this session.
const originalImul=Math.imul.bind(Math);
const seedWords=new Uint32Array(1);
if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(seedWords);
else seedWords[0]=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);
const sessionSeed=seedWords[0]>>>0;
window.__BACKROOMS_SESSION_SEED=sessionSeed;

const hashMultipliers=new Set([
  374761393|0,
  668265263|0,
  1442695041|0,
  1274126177|0
]);

Math.imul=function(a,b){
  if(hashMultipliers.has(b|0)){
    a=((a|0)^(sessionSeed|0))|0;
  }
  return originalImul(a,b);
};

await import("./game-v9.js");
