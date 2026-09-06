"use strict";

const errorBox=document.createElement("pre");
errorBox.style.cssText="position:fixed;left:12px;bottom:12px;z-index:9999;max-width:70vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(errorBox);

function fail(message,err){
  errorBox.style.display="block";
  errorBox.textContent=message+(err?"\n"+(err.stack||err.message||err):"");
  console.error(message,err);
}

try{
  const sourceUrl=new URL("./game-v3.js",import.meta.url);
  let patched=await fetch(sourceUrl).then(r=>{
    if(!r.ok)throw new Error(`game-v3.js yüklenemedi: ${r.status}`);
    return r.text();
  });

  function mustReplace(from,to,label){
    if(!patched.includes(from))throw new Error(`${label} eşleşmedi`);
    patched=patched.replace(from,to);
  }

  mustReplace(
`function transitions(l){const a=[];if(l<10)a.push({cx:16,cy:3,target:l+1});if(l>0)a.push({cx:-16,cy:3,target:l-1});const o=[[32,-24],[-28,32],[44,20],[-40,-28],[12,46],[-52,12],[56,-36],[-60,40]];for(const[ox,oy]of o){const s=hash(ox,oy,500,l);if(s%100<52){let t=l+(s%100<26?1:-1);if(t>=0&&t<=10)a.push({cx:ox+s%7-3,cy:oy+(s>>>4)%7-3,target:t})}}return a}`,
`function transitions(l){const a=[];if(l<10){const s=hash(701,911,500,l),ang=s%16*Math.PI/8,dist=58+(s>>>5)%24;a.push({cx:Math.round(Math.cos(ang)*dist),cy:Math.round(Math.sin(ang)*dist),target:l+1})}if(l>0){const s=hash(-877,613,501,l),ang=s%16*Math.PI/8+Math.PI/16,dist=62+(s>>>6)%26;a.push({cx:Math.round(Math.cos(ang)*dist),cy:Math.round(Math.sin(ang)*dist),target:l-1})}const o=[[86,-66],[-82,78],[104,52],[-98,-72],[46,106],[-112,38],[124,-88],[-126,92],[72,132],[-138,-58]];for(const[ox,oy]of o){const s=hash(ox,oy,500,l);if(s%100<44){const t=l+(s%100<22?1:-1);if(t>=0&&t<=10)a.push({cx:ox+s%11-5,cy:oy+(s>>>4)%11-5,target:t})}}return a}`,
"transition patch"
  );

  mustReplace(
`function trAt(l,x,y){for(const r of transitions(l)){if(x>=r.cx-5&&x<=r.cx+5&&y>=r.cy-5&&y<=r.cy+5){const inner=x>=r.cx-4&&x<=r.cx+4&&y>=r.cy-4&&y<=r.cy+4;if(!inner)return{solid:false,target:r.target,isRoom:false};const e=x===r.cx-4||x===r.cx+4||y===r.cy-4||y===r.cy+4,door=(x===r.cx-4||x===r.cx+4)&&y>=r.cy-1&&y<=r.cy+1||(y===r.cy-4||y===r.cy+4)&&x>=r.cx-1&&x<=r.cx+1;if(e&&!door)return{solid:true,target:r.target,isRoom:true};return{solid:false,target:r.target,isRoom:true,cx:r.cx,cy:r.cy}}}return null}`,
`function trAt(l,x,y){const h=2,a=1;for(const r of transitions(l)){if(x>=r.cx-h-a&&x<=r.cx+h+a&&y>=r.cy-h-a&&y<=r.cy+h+a){const inner=x>=r.cx-h&&x<=r.cx+h&&y>=r.cy-h&&y<=r.cy+h;if(!inner)return{solid:false,target:r.target,isRoom:false};const e=x===r.cx-h||x===r.cx+h||y===r.cy-h||y===r.cy+h,door=((x===r.cx-h||x===r.cx+h)&&y===r.cy)||((y===r.cy-h||y===r.cy+h)&&x===r.cx);if(e&&!door)return{solid:true,target:r.target,isRoom:true};return{solid:false,target:r.target,isRoom:true,cx:r.cx,cy:r.cy}}}return null}`,
"transition room patch"
  );

  mustReplace(
`let level=0,titleTimer=0,transitionCooldown=0;const player={x:2.5,y:2.5,angle:0,fov:Math.PI/3,speed:2.65,radius:.18},keys={},zBuffer=new Float32Array(W),state=new Map();`,
`let level=0,titleTimer=0,transitionCooldown=0;const player={x:2.5,y:2.5,angle:0,pitch:0,fov:Math.PI/3,speed:2.65,radius:.18},keys={},zBuffer=new Float32Array(W),state=new Map();`,
"player pitch patch"
  );

  mustReplace(
`function proj(wx,wy,wz){const dx=wx-player.x,dz=wz-player.y,s=Math.sin(player.angle),c=Math.cos(player.angle),rx=dx*s-dz*c,rz=dx*c+dz*s;if(rz<=.05)return null;const k=H/rz;return{sx:W/2+rx*k,sy:H/2-wy*k,rz}}`,
`function proj(wx,wy,wz){const dx=wx-player.x,dz=wz-player.y,dist=Math.hypot(dx,dz);let rel=Math.atan2(dz,dx)-player.angle;while(rel>Math.PI)rel-=Math.PI*2;while(rel<-Math.PI)rel+=Math.PI*2;const forward=dist*Math.cos(rel);if(forward<=.05)return null;const k=H/forward,horizon=H/2+player.pitch*H;return{sx:W/2+(rel/player.fov)*W,sy:horizon+(0.5-wy)*k,rz:forward}}`,
"projection patch"
  );

  mustReplace(
`const tr=(x,z)=>({x:o.x+x*cy-z*sy,z:o.z+x*sy+z*cy})`,
`const tr=(x,z)=>({x:o.x+z*cy-x*sy,z:o.z+z*sy+x*cy})`,
"model yaw patch"
  );

  mustReplace(
`function drawSprite(wx,wy,type){const sp=SPRITES[type];if(!sp)return;const dx=wx-player.x,dy=wy-player.y,dist=Math.hypot(dx,dy);let a=Math.atan2(dy,dx)-player.angle;while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;if(Math.abs(a)>player.fov*.65||dist<.1)return;const cd=dist*Math.cos(a),tot=Math.max(8,Math.floor((H/cd)*.36)),pxs=Math.max(1,Math.floor(tot/8)),sx=Math.floor(W/2+(a/(player.fov/2))*(W/2)),L=sx-pxs*4,T=Math.floor(H/2+tot*.14-pxs*8);for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){const code=sp[yy][xx];if(code==="0")continue;const px=L+xx*pxs;if(px<0||px>=W||cd>zBuffer[px])continue;vctx.fillStyle=SC[code];vctx.fillRect(px,T+yy*pxs,pxs,pxs)}}`,
`function drawSprite(wx,wy,type){const sp=SPRITES[type];if(!sp)return;const dx=wx-player.x,dy=wy-player.y,dist=Math.hypot(dx,dy);let a=Math.atan2(dy,dx)-player.angle;while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;if(Math.abs(a)>player.fov*.65||dist<.1)return;const cd=dist*Math.cos(a),tot=Math.max(8,Math.floor((H/cd)*.36)),pxs=Math.max(1,Math.floor(tot/8)),sx=Math.floor(W/2+(a/(player.fov/2))*(W/2)),L=sx-pxs*4,horizon=H/2+player.pitch*H,T=Math.floor(horizon+tot*.14-pxs*8);for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){const code=sp[yy][xx];if(code==="0")continue;const px=L+xx*pxs;if(px<0||px>=W||cd>zBuffer[px])continue;vctx.fillStyle=SC[code];vctx.fillRect(px,T+yy*pxs,pxs,pxs)}}`,
"item pitch patch"
  );

  mustReplace(
`function renderWorld(time){const lv=LEVELS[level],cg=vctx.createLinearGradient(0,0,0,H/2);cg.addColorStop(0,lv.ceil[0]);cg.addColorStop(1,lv.ceil[1]);vctx.fillStyle=cg;vctx.fillRect(0,0,W,H/2);const fg=vctx.createLinearGradient(0,H/2,0,H);fg.addColorStop(0,lv.floor[0]);fg.addColorStop(1,lv.floor[1]);vctx.fillStyle=fg;vctx.fillRect(0,H/2,W,H/2);if(level===0||level===4){const f=.08+Math.sin(time*.013)*.012;for(let x=10;x<W;x+=30){vctx.fillStyle=\`rgba(255,255,220,${f})\`;vctx.fillRect(x,7,11,2)}}for(let x=0;x<W;x++){const cam=x/W-.5,a=player.angle+cam*player.fov,hit=cast(a),d=Math.max(.001,hit.dist*Math.cos(a-player.angle));zBuffer[x]=d;const wh=Math.min(H*3,Math.floor(H/d)),top=Math.floor((H-wh)/2),base=wallColor(hit.mx,hit.my);let tex=.92+Math.sin(hit.wallX*27)*.035;if(lv.type==="caves")tex=.72+rnd(hit.mx,hit.my,170)*.24;if(lv.type==="hotel")tex=.85+(Math.floor(hit.wallX*12)%3===0?.11:0);if(lv.type==="concrete")tex=.82+rnd(hit.mx,hit.my,171)*.18;let fog=Math.max(.12,Math.min(1,1.5/(d*.20+1)));if(lv.type==="darkness"){const c=Math.abs(x/W-.5);fog*=inv.flashlightOn?Math.max(.07,1-c*2.35):.045}else if(inv.flashlightOn){const c=Math.abs(x/W-.5);fog*=Math.min(1.25,1.02+Math.max(0,.22-c*.65))}vctx.fillStyle=sh(base,tex*fog*(hit.side===0?1:.82));vctx.fillRect(x,top,1,wh)}renderStuff();if(lv.type==="darkness"&&!inv.flashlightOn){vctx.fillStyle="rgba(0,0,0,.94)";vctx.fillRect(0,0,W,H)}else if(lv.type==="darkness"&&inv.flashlightOn){const g=vctx.createRadialGradient(W/2,H/2,4,W/2,H/2,90);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.42,"rgba(0,0,0,.24)");g.addColorStop(1,"rgba(0,0,0,.94)");vctx.fillStyle=g;vctx.fillRect(0,0,W,H)}}`,
`function renderWorld(time){const lv=LEVELS[level],horizon=Math.max(-H,Math.min(H*2,H/2+player.pitch*H)),cg=vctx.createLinearGradient(0,0,0,Math.max(1,horizon));cg.addColorStop(0,lv.ceil[0]);cg.addColorStop(1,lv.ceil[1]);vctx.fillStyle=cg;vctx.fillRect(0,0,W,Math.max(0,horizon));const fg=vctx.createLinearGradient(0,Math.min(H-1,Math.max(0,horizon)),0,H);fg.addColorStop(0,lv.floor[0]);fg.addColorStop(1,lv.floor[1]);vctx.fillStyle=fg;vctx.fillRect(0,Math.max(0,horizon),W,H-Math.max(0,horizon));if(level===0||level===4){const f=.08+Math.sin(time*.013)*.012;for(let x=10;x<W;x+=30){vctx.fillStyle=\`rgba(255,255,220,${f})\`;vctx.fillRect(x,7+player.pitch*H,11,2)}}for(let x=0;x<W;x++){const cam=x/W-.5,a=player.angle+cam*player.fov,hit=cast(a),d=Math.max(.001,hit.dist*Math.cos(a-player.angle));zBuffer[x]=d;const wh=Math.min(H*3,Math.floor(H/d)),top=Math.floor(horizon-wh/2),base=wallColor(hit.mx,hit.my);let tex=.92+Math.sin(hit.wallX*27)*.035;if(lv.type==="caves")tex=.72+rnd(hit.mx,hit.my,170)*.24;if(lv.type==="hotel")tex=.85+(Math.floor(hit.wallX*12)%3===0?.11:0);if(lv.type==="concrete")tex=.82+rnd(hit.mx,hit.my,171)*.18;let fog=Math.max(.12,Math.min(1,1.5/(d*.20+1)));if(lv.type==="darkness"){const c=Math.abs(x/W-.5);fog*=inv.flashlightOn?Math.max(.07,1-c*2.35):.045}else if(inv.flashlightOn){const c=Math.abs(x/W-.5);fog*=Math.min(1.25,1.02+Math.max(0,.22-c*.65))}vctx.fillStyle=sh(base,tex*fog*(hit.side===0?1:.82));vctx.fillRect(x,top,1,wh)}renderStuff();if(lv.type==="darkness"&&!inv.flashlightOn){vctx.fillStyle="rgba(0,0,0,.94)";vctx.fillRect(0,0,W,H)}else if(lv.type==="darkness"&&inv.flashlightOn){const g=vctx.createRadialGradient(W/2,horizon,4,W/2,horizon,90);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.42,"rgba(0,0,0,.24)");g.addColorStop(1,"rgba(0,0,0,.94)");vctx.fillStyle=g;vctx.fillRect(0,0,W,H)}}`,
"world pitch patch"
  );

  mustReplace(
`document.addEventListener("mousemove",e=>{if(document.pointerLockElement===canvas)player.angle+=e.movementX*.0025});requestAnimationFrame(loop);`,
`document.addEventListener("mousemove",e=>{if(document.pointerLockElement===canvas){player.angle+=e.movementX*.0025;player.pitch=Math.max(-.48,Math.min(.48,player.pitch+e.movementY*.0017))}});requestAnimationFrame(loop);`,
"mouse pitch patch"
  );

  mustReplace(
`table:[[-.52,.42,-.34,1.04,.68,.10,[124,94,64]],[-.44,0,-.26,.10,.10,.42,[92,69,49]],[.34,0,-.26,.10,.10,.42,[92,69,49]],[-.44,0,.16,.10,.10,.42,[92,69,49]],[.34,0,.16,.10,.10,.42,[92,69,49]]],`,
`table:[[-.68,.58,-.38,1.36,.76,.10,[126,96,64]],[-.58,0,-.29,.11,.11,.58,[88,66,45]],[.47,0,-.29,.11,.11,.58,[88,66,45]],[-.58,0,.18,.11,.11,.58,[88,66,45]],[.47,0,.18,.11,.11,.58,[88,66,45]],[-.58,.48,-.30,1.16,.08,.08,[102,76,51]],[-.58,.48,.22,1.16,.08,.08,[102,76,51]]],`,
"table model patch"
  );

  mustReplace(
`plant:[[-.18,0,-.18,.36,.36,.24,[126,92,58]],[-.05,.24,-.05,.10,.10,.32,[82,112,62]],[-.28,.46,-.08,.56,.16,.16,[101,148,79]],[-.08,.46,-.28,.16,.56,.16,[101,148,79]]],`,
`plant:[[-.13,0,-.13,.26,.26,.18,[126,92,58]],[-.035,.18,-.035,.07,.07,.24,[82,112,62]],[-.20,.36,-.055,.40,.11,.12,[101,148,79]],[-.055,.36,-.20,.11,.40,.12,[101,148,79]]],`,
"plant model patch"
  );

  const runner=new Function(patched);
  runner();
}catch(err){
  fail("Backrooms runtime başlatılamadı.",err);
}
