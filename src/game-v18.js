"use strict";
const bootError=document.createElement("pre");
bootError.style.cssText="position:fixed;left:12px;bottom:12px;z-index:99999;max-width:78vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(bootError);
try{
  let source=await fetch(new URL("./game-v17.js",import.meta.url)).then(r=>{if(!r.ok)throw new Error("game-v17.js failed: "+r.status);return r.text()});
  source=source.replace('new URL("./game-v13.js",import.meta.url)','new URL("./src/game-v13.js",location.href)');

  // Main exits are guaranteed, but now their room centers are snapped to an already-open
  // part of the native level generation with an open cell just outside the transition apron.
  source=source.replace(/function transitions\(l\)\{const a=\[\];if\(l<10\)\{const s=hash\(701,911,500,l\).*?return a\}/,
`function transitions(l){
 const a=[];
 const baseWall=(x,y)=>{const t=LEVELS[l].type;let w=false;if(t==="yellow"||t==="hotel"||t==="darkness")w=roomCell(x,y);else if(t==="office")w=officeCell(x,y);else if(t==="pipes"||t==="electrical")w=pipeCell(x,y);else if(t==="concrete"||t==="ocean")w=concreteCell(x,y);else if(t==="caves")w=caveCell(x,y);else if(t==="suburb")w=suburbCell(x,y);else if(t==="fields")w=fieldCell(x,y);return !!w};
 const attach=(seedX,seedY,seedS,target,back)=>{const s=hash(seedX,seedY,seedS,l),ang=(s%24)*Math.PI/12+(back?Math.PI/24:0),dist=(back?66:62)+((s>>>(back?6:5))%(back?31:29)),bx=Math.round(Math.cos(ang)*dist),by=Math.round(Math.sin(ang)*dist);let best=null;for(let r=0;r<=18&&!best;r++)for(let oy=-r;oy<=r&&!best;oy++)for(let ox=-r;ox<=r;ox++){if(r&&Math.abs(ox)!==r&&Math.abs(oy)!==r)continue;const x=bx+ox,y=by+oy;if(baseWall(x,y))continue;const linked=(!baseWall(x+5,y))||(!baseWall(x-5,y))||(!baseWall(x,y+5))||(!baseWall(x,y-5));if(linked){best={cx:x,cy:y,target,main:true};break}}return best||{cx:bx,cy:by,target,main:true}};
 if(l<10)a.push(attach(701,911,500,l+1,false));
 if(l>0)a.push(attach(-877,613,501,l-1,true));
 for(let gy=-7;gy<=7;gy++)for(let gx=-7;gx<=7;gx++){if(Math.abs(gx)+Math.abs(gy)<3)continue;const h=hash(gx,gy,540,l);if(h%1000>=10)continue;const cx=gx*29+((h>>>8)%13)-6,cy=gy*29+((h>>>12)%13)-6;if(Math.hypot(cx-2.5,cy-2.5)<52)continue;const dir=((h>>>18)%4===0)?-1:1,target=l+dir;if(target<0||target>10)continue;let close=false;for(const q of a)if(Math.hypot(q.cx-cx,q.cy-cy)<22){close=true;break}if(!close)a.push({cx,cy,target,main:false});if(a.length>=8)return a}
 return a}`);

  source=source.split('for(let y=0;y<H;y++){const delta=Math.abs(y-horizon);').join('for(let y=0;y<H;y+=2){const delta=Math.abs(y-horizon);');
  source=source.split('for(let x=0;x<W;x+=2){const ix=Math.floor(wx)').join('for(let x=0;x<W;x+=4){const ix=Math.floor(wx)');
  source=source.split('vctx.fillRect(x,y,2,1);wx+=sx*2;wy+=sy*2').join('vctx.fillRect(x,y,4,2);wx+=sx*4;wy+=sy*4');

  const carpetRuntimeInject='patched=patched.replace(\\"function drawPlanePattern(\\",\\"const CARPET_TEX=new Float32Array(64*64);for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++){let h=((xx*374761393)^(yy*668265263)^0x5f3759df)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;const n=(h&1023)/1023,fiber=((xx+yy*3)%7===0?-.035:0)+((xx*5+yy)%11===0?.025:0),weave=((xx&1)?-.012:.012)+((yy&1)?.008:-.008),stain=((h>>>12)%97===0?-.11:0);CARPET_TEX[yy*64+xx]=.965+(n-.5)*.06+fiber+weave+stain;}function drawPlanePattern(\\");\\n  ';
  source=source.split('replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern').join(carpetRuntimeInject+'replaceFn(\\"drawPlanePattern\\",`function drawPlanePattern');

  source=source.replace(
    'if(t===\\"yellow\\")f=macro*(.975+.022*Math.sin(wx*2.1+Math.sin(wy*.55))+.015*Math.sin(wy*4.6)+.012*Math.sin((wx+wy)*7.8))*(rnd(Math.floor(wx/5),Math.floor(wy/5),881)<.06?.93:1);',
    'if(t===\\"yellow\\"){const tx=((Math.floor(wx*13)%64)+64)%64,ty=((Math.floor(wy*13)%64)+64)%64,cloth=CARPET_TEX[ty*64+tx],wear=.975+.025*Math.sin(wx*.12+wy*.08),track=(Math.abs((((wx+wy*.22)%9)+9)%9-4.5)<.65?.965:1);f=cloth*wear*track*(rnd(Math.floor(wx/6),Math.floor(wy/6),881)<.045?.94:1)}'
  );

  source=source.replace(
    'if(wt===\\"yellow\\")tex=broad*(.965+.035*Math.sin(wu*2.15+Math.sin(wu*.47)))*(rnd(hit.mx,hit.my,886)<.08?.91:1);',
    'if(wt===\\"yellow\\"){const band=.975+.022*Math.sin(wu*.72)+.015*Math.sin(wu*1.44+.8),paper=.985+.018*Math.sin(wu*4.6),damp=rnd(hit.mx,hit.my,886)<.055?.90:1,fade=.97+.03*rnd(Math.floor(hit.mx/3),Math.floor(hit.my/3),896);tex=broad*band*paper*damp*fade}'
  );

  source=source.replace(
    'if(t===\\"yellow\\"||t===\\"office\\"){const seam=fx<.035||fy<.035;f=seam?.62:(.985+.02*Math.sin(ix*.8+iy*.55))}else if(t===\\"hotel\\"){const frame=fx<.035||fy<.035||fx>.965||fy>.965;f=frame?.66:.98+.02*Math.sin((ix+iy)*1.5)}else if(t===\\"concrete\\")f=.84+rnd(ix,iy,805)*.1;else if(t===\\"pipes\\"||t===\\"electrical\\")f=.78+.08*Math.sin(wx*3.1);else if(t===\\"darkness\\")f=.48+rnd(ix,iy,806)*.08;else if(t===\\"ocean\\")f=.84+.07*Math.sin((wx+wy)*1.9);else if(t===\\"caves\\")f=.56+rnd(ix,iy,807)*.22;else if(t===\\"suburb\\")f=.8+rnd(ix,iy,808)*.08;else if(t===\\"fields\\")f=.96',
    'if(t===\\"yellow\\"){const seam=fx<.032||fy<.032||fx>.968||fy>.968,panel=.982+.018*Math.sin(ix*.71+iy*.47)+.012*Math.sin((ix+iy)*1.83),lamp=Math.abs(fx-.5)<.17&&Math.abs(fy-.5)<.055?1.045:1,dust=rnd(ix,iy,1805)<.055?.925:1;f=seam?.63:macro*panel*lamp*dust}else if(t===\\"office\\"){const seam=fx<.03||fy<.03||fx>.97||fy>.97,speck=.978+rnd(ix,iy,1806)*.034,panel=.99+.014*Math.sin(ix*.89+iy*.63);f=seam?.67:macro*speck*panel}else if(t===\\"hotel\\"){const frame=fx<.042||fy<.042||fx>.958||fy>.958,center=Math.max(0,1-Math.hypot(fx-.5,fy-.5)*2.5),plaster=.97+.024*Math.sin(wx*.41)+.017*Math.sin(wy*.36);f=frame?.68:macro*plaster*(.975+center*.05)}else if(t===\\"concrete\\"){const stain=rnd(Math.floor(wx/3),Math.floor(wy/3),1808)<.075?.90:1;f=macro*(.83+rnd(ix,iy,1807)*.11)*stain}else if(t===\\"pipes\\"||t===\\"electrical\\"){const beam=Math.abs((((wx*.34)%1)+1)%1-.5)<.075?.88:1;f=macro*(.80+.055*Math.sin(wx*2.65)+.035*Math.sin(wy*1.85))*beam}else if(t===\\"darkness\\")f=.48+rnd(ix,iy,1809)*.08;else if(t===\\"ocean\\")f=macro*(.84+.05*Math.sin((wx+wy)*1.7));else if(t===\\"caves\\")f=.56+rnd(ix,iy,1810)*.22;else if(t===\\"suburb\\")f=macro*(.82+rnd(ix,iy,1811)*.07);else if(t===\\"fields\\")f=.95+.02*Math.sin(wx*.15+wy*.09)'
  );

  const blob=new Blob([source],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(err){
  bootError.style.display="block";
  bootError.textContent="Backrooms v18 bootstrap failed.\n"+(err?.stack||err?.message||String(err));
  console.error(err);
}
