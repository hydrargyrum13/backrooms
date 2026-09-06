"use strict";

// v5 patches v3 directly with corrected prop transforms plus v4 transition rules.
const source = await fetch("./game-v3.js").then(r => {
  if (!r.ok) throw new Error(`game-v3.js yüklenemedi: ${r.status}`);
  return r.text();
});

let patched = source;

// Keep the farther, smaller transition rooms from v4.
patched = patched.replace(
  /function transitions\(l\)\{.*?return a\}/s,
  `function transitions(l){
    const a=[];
    if(l<10){
      const s=hash(701,911,500,l),ang=(s%8)*Math.PI/4,dist=46+((s>>>5)%22);
      a.push({cx:Math.round(Math.cos(ang)*dist),cy:Math.round(Math.sin(ang)*dist),target:l+1});
    }
    if(l>0){
      const s=hash(-877,613,501,l),ang=(s%8)*Math.PI/4+Math.PI/8,dist=50+((s>>>6)%24);
      a.push({cx:Math.round(Math.cos(ang)*dist),cy:Math.round(Math.sin(ang)*dist),target:l-1});
    }
    const o=[[72,-54],[-68,66],[86,42],[-82,-58],[34,88],[-94,30],[104,-72],[-108,76],[58,112],[-118,-44]];
    for(const[ox,oy]of o){
      const s=hash(ox,oy,500,l);
      if(s%100<48){
        const t=l+(s%100<24?1:-1);
        if(t>=0&&t<=10)a.push({cx:ox+s%9-4,cy:oy+(s>>>4)%9-4,target:t});
      }
    }
    return a;
  }`
);

patched = patched.replace(
  /function trAt\(l,x,y\)\{.*?return null\}/s,
  `function trAt(l,x,y){
    const half=2,approach=1;
    for(const r of transitions(l)){
      if(x>=r.cx-half-approach&&x<=r.cx+half+approach&&y>=r.cy-half-approach&&y<=r.cy+half+approach){
        const inner=x>=r.cx-half&&x<=r.cx+half&&y>=r.cy-half&&y<=r.cy+half;
        if(!inner)return{solid:false,target:r.target,isRoom:false};
        const e=x===r.cx-half||x===r.cx+half||y===r.cy-half||y===r.cy+half;
        const door=((x===r.cx-half||x===r.cx+half)&&y===r.cy)||((y===r.cy-half||y===r.cy+half)&&x===r.cx);
        if(e&&!door)return{solid:true,target:r.target,isRoom:true};
        return{solid:false,target:r.target,isRoom:true,cx:r.cx,cy:r.cy};
      }
    }
    return null;
  }`
);

// Match the prop projection exactly to the raycaster's angular screen convention.
// Raycaster: angle to the player's left -> smaller screen X, right -> larger screen X.
patched = patched.replace(
  /function proj\(wx,wy,wz\)\{.*?\}/s,
  `function proj(wx,wy,wz){
    const dx=wx-player.x,dz=wz-player.y;
    const c=Math.cos(player.angle),s=Math.sin(player.angle);
    const forward=dx*c+dz*s;
    if(forward<=.05)return null;
    const right=-dx*s+dz*c;
    const k=H/forward;
    return{sx:W/2+right*k,sy:H/2-wy*k,rz:forward};
  }`
);

// Replace model local->world yaw transform with the same basis as player heading:
// local +X is model-right, local +Z is model-forward.
// At yaw 0 forward is +world X; at yaw PI/2 forward is +world Y.
patched = patched.replace(
  /const tr=\(x,z\)=>\(\{x:o\.x\+x\*cy-z\*sy,z:o\.z\+x\*sy\+z\*cy\}\)/,
  `const tr=(x,z)=>({x:o.x+z*cy-x*sy,z:o.z+z*sy+x*cy})`
);

new Function(patched)();
