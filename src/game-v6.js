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
`function proj(wx,wy,wz){const dx=wx-player.x,dz=wz-player.y,s=Math.sin(player.angle),c=Math.cos(player.angle),rx=dx*s-dz*c,rz=dx*c+dz*s;if(rz<=.05)return null;const k=H/rz;return{sx:W/2+rx*k,sy:H/2-wy*k,rz}}`,
`function proj(wx,wy,wz){const dx=wx-player.x,dz=wz-player.y,c=Math.cos(player.angle),s=Math.sin(player.angle),forward=dx*c+dz*s;if(forward<=.05)return null;const right=-dx*s+dz*c,k=H/forward;return{sx:W/2+right*k,sy:H/2+(0.5-wy)*k,rz:forward}}`,
"projection patch"
  );

  mustReplace(
`const tr=(x,z)=>({x:o.x+x*cy-z*sy,z:o.z+x*sy+z*cy})`,
`const tr=(x,z)=>({x:o.x+z*cy-x*sy,z:o.z+z*sy+x*cy})`,
"model yaw patch"
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
