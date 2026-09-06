"use strict";

const seedWords=new Uint32Array(1);
if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(seedWords);
else seedWords[0]=((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);
window.__BACKROOMS_SESSION_SEED=seedWords[0]>>>0;

function makeMenu(){
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;inset:0;z-index:10000;background:#080808;color:#e8e5da;display:grid;place-items:center;font-family:monospace";
  const panel=document.createElement("div");
  panel.style.cssText="text-align:center;min-width:260px";
  const title=document.createElement("div");
  title.textContent="BACKROOMS";
  title.style.cssText="font-size:26px;letter-spacing:.28em;margin-bottom:10px";
  const sub=document.createElement("div");
  sub.textContent="ZORLUK";
  sub.style.cssText="font-size:10px;opacity:.5;letter-spacing:.2em;margin-bottom:18px";
  const row=document.createElement("div");
  row.style.cssText="display:flex;gap:8px;justify-content:center";
  panel.append(title,sub,row);overlay.append(panel);document.body.append(overlay);
  return new Promise(resolve=>{
    for(const [id,label] of [["easy","KOLAY"],["normal","ORTA"],["hard","ZOR"]]){
      const b=document.createElement("button");
      b.textContent=label;
      b.style.cssText="background:transparent;color:#ddd;border:1px solid #555;padding:9px 14px;font:11px monospace;cursor:pointer";
      b.onmouseenter=()=>b.style.borderColor="#ddd";
      b.onmouseleave=()=>b.style.borderColor="#555";
      b.onclick=()=>{overlay.remove();resolve(id)};
      row.append(b);
    }
  });
}

window.__BACKROOMS_DIFFICULTY=await makeMenu();

function patchRuntime(){
  function replaceFn(name,code){
    const needle="function "+name+"(";
    const start=patched.indexOf(needle);
    if(start<0)throw new Error("v13: "+name+" bulunamadı");
    const brace=patched.indexOf("{",start);
    let depth=0,quote=null,esc=false,end=-1;
    for(let i=brace;i<patched.length;i++){
      const c=patched[i];
      if(quote){
        if(esc){esc=false;continue}
        if(c==="\\"){esc=true;continue}
        if(c===quote){quote=null}
        continue
      }
      if(c==='"'||c==="'"||c==='`'){quote=c;continue}
      if(c==="{")depth++;
      else if(c==="}"&&--depth===0){end=i;break}
    }
    if(end<0)throw new Error("v13: "+name+" sonu bulunamadı");
    patched=patched.slice(0,start)+code+patched.slice(end+1);
  }

  patched=patched.replace(
    "let selectedSlot=0,boostTimer=0;",
    `let selectedSlot=0,boostTimer=0,coffee=0,sanity=100,gameDead=false,maxStamina=0,stamina=0;
const difficulty=window.__BACKROOMS_DIFFICULTY||"normal";
const DIFF={easy:{item:1.35,hazard:.55,sanity:.65,staminaDrain:.78,staminaMax:190},normal:{item:1,hazard:1,sanity:1,staminaDrain:1,staminaMax:170},hard:{item:.82,hazard:1.45,sanity:1.5,staminaDrain:1.25,staminaMax:150}}[difficulty];
maxStamina=DIFF.staminaMax;stamina=maxStamina;
const PROP_CFG=[
{rate:22,near:true,pool:["chair","table","plant","shelf","chair"]},
{rate:12,near:true,pool:["crate","bench","locker","barrel"]},
{rate:17,near:true,pool:["pipeRack","barrel","crate","bench","pipeRack"]},
{rate:15,near:true,pool:["generator","panel","locker","barrel","panel"]},
{rate:27,near:true,pool:["desk","chair","plant","locker","terminal","chair"]},
{rate:24,near:true,pool:["bed","sofa","table","lamp","plant"]},
{rate:7,near:true,pool:["chair","shelf","locker","table"]},
{rate:15,near:false,pool:["dock","buoy","crate","bench"]},
{rate:11,near:false,pool:["rock","rockTall","barrel","crate","rock"]},
{rate:20,near:false,pool:["car","mailbox","bench","plant","car"]},
{rate:16,near:false,pool:["fence","haybale","crate","bench","tree"]}
];
const ITEM_CFG=[
{safe:.010,hazard:0,pool:["almond","battery","battery","coffee","energy","lidar","flashlight"]},
{safe:.008,hazard:0,pool:["battery","battery","coffee","energy","almond"]},
{safe:.008,hazard:.0010,pool:["battery","coffee","almond","energy"],hazards:["livewire"]},
{safe:.008,hazard:.0014,pool:["battery","battery","coffee","energy"],hazards:["livewire"]},
{safe:.011,hazard:0,pool:["coffee","battery","lidar","almond","energy"]},
{safe:.010,hazard:.0003,pool:["almond","coffee","energy","battery"],hazards:["mold"]},
{safe:.007,hazard:.0010,pool:["battery","almond","lidar","coffee"],hazards:["mold"]},
{safe:.009,hazard:.0002,pool:["almond","almond","coffee","battery","energy"],hazards:["mold"]},
{safe:.007,hazard:.0013,pool:["almond","energy","battery","coffee"],hazards:["mold"]},
{safe:.009,hazard:.0004,pool:["battery","coffee","energy","almond"],hazards:["livewire"]},
{safe:.010,hazard:0,pool:["coffee","energy","almond","battery"]}
];`
  );

  patched=patched.replace(
    "const SC={",
    `SPRITES.energy=["00066000","00666600","06677660","06788760","06788760","06677660","00666600","00066000"];
SPRITES.coffee=["00077000","00777700","07744770","07444470","07444470","07777770","00777700","00077000"];
SPRITES.mold=["00333000","03333300","03373330","33777330","03377330","03333300","00333000","00000000"];
SPRITES.livewire=["00044000","00444400","04411440","04144140","04411440","00444400","00044000","00000000"];
const SC={`
  );
  patched=patched.replace("const SC=({","const SC={");

  patched=patched.replace(
    "let level=0,titleTimer=0,transitionCooldown=0;",
    `Object.assign(MODELS,{
locker:[[-.34,0,-.20,.68,.40,1.20,[104,111,112]],[-.28,.58,-.22,.56,.03,.03,[60,66,67]]],
pipeRack:[[-.58,.18,-.14,1.16,.12,.12,[111,91,70]],[-.58,.44,-.14,1.16,.12,.12,[90,105,109]],[-.58,.70,-.14,1.16,.12,.12,[116,78,65]],[-.50,0,-.05,.10,.10,.90,[70,72,70]],[.40,0,-.05,.10,.10,.90,[70,72,70]]],
panel:[[-.42,0,-.16,.84,.32,1.05,[69,75,70]],[-.30,.66,-.18,.22,.05,.18,[173,143,62]],[.08,.66,-.18,.22,.05,.18,[91,129,111]]],
terminal:[[-.45,.38,-.18,.90,.36,.62,[89,98,103]],[-.32,.58,-.21,.64,.04,.30,[43,62,69]],[-.12,0,-.08,.24,.16,.38,[74,78,79]]],
bed:[[-.72,.18,-.36,1.44,.72,.20,[145,133,116]],[-.72,0,-.36,.12,.72,.46,[103,82,65]],[-.60,.36,-.28,1.18,.56,.10,[181,171,150]]],
lamp:[[-.08,0,-.08,.16,.16,.70,[83,73,61]],[-.25,.68,-.25,.50,.50,.28,[170,148,102]]],
buoy:[[-.18,0,-.18,.36,.36,.62,[173,86,55]],[-.25,.22,-.25,.50,.50,.10,[225,209,158]]],
rockTall:[[-.34,0,-.28,.68,.56,.74,[82,76,70]],[-.20,.58,-.16,.40,.32,.38,[98,90,82]]],
mailbox:[[-.30,.48,-.22,.60,.44,.36,[88,99,107]],[-.05,0,-.05,.10,.10,.55,[73,66,57]]],
haybale:[[-.52,0,-.34,1.04,.68,.66,[154,129,66]],[-.54,.20,-.36,1.08,.04,.04,[102,83,46]],[-.54,.48,-.36,1.08,.04,.04,[102,83,46]]],
tree:[[-.12,0,-.12,.24,.24,.90,[88,67,44]],[-.48,.72,-.48,.96,.96,.52,[75,103,55]]],
doorframe:[[-.52,0,-.08,.12,.16,.96,[88,82,73]],[.40,0,-.08,.12,.16,.96,[88,82,73]],[-.52,.82,-.08,1.04,.16,.14,[88,82,73]]]
});
let level=0,titleTimer=0,transitionCooldown=0;`
  );

  replaceFn("hash",`function hash(x,y,s=0,l=level){const seed=window.__BACKROOMS_SESSION_SEED|0;let h=Math.imul((x|0)^seed,374761393)^Math.imul((y|0)^(seed>>>7),668265263)^Math.imul(((s+l*131)|0)^(seed>>>13),1442695041);h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0}`);

  replaceFn("trAt",`function trAt(l,x,y){const h=3,a=1;for(const r of transitions(l)){if(x>=r.cx-h-a&&x<=r.cx+h+a&&y>=r.cy-h-a&&y<=r.cy+h+a){const inner=x>=r.cx-h&&x<=r.cx+h&&y>=r.cy-h&&y<=r.cy+h;if(!inner)return{solid:false,target:r.target,isRoom:false,cx:r.cx,cy:r.cy};const edge=x===r.cx-h||x===r.cx+h||y===r.cy-h||y===r.cy+h;const outerDoor=((x===r.cx-h||x===r.cx+h)&&y===r.cy)||((y===r.cy-h||y===r.cy+h)&&x===r.cx);const divider=x===r.cx&&Math.abs(y-r.cy)<h&&y!==r.cy;if((edge&&!outerDoor)||divider)return{solid:true,target:r.target,isRoom:true,cx:r.cx,cy:r.cy};return{solid:false,target:r.target,isRoom:true,door:x===r.cx&&y===r.cy,cx:r.cx,cy:r.cy}}}return null}`);

  replaceFn("objAt",`function objAt(l,x,y){if(cellAt(x,y)||trAt(l,x,y))return null;const cfg=PROP_CFG[l],s=hash(x,y,620,l);if(s%1000>=cfg.rate)return null;if(cfg.near){let near=false;for(const[dX,dY]of[[1,0],[-1,0],[0,1],[0,-1]])if(cellAt(x+dX,y+dY)){near=true;break}if(!near)return null}const type=cfg.pool[(s>>>8)%cfg.pool.length];return{x:x+.5,z:y+.5,y:0,yaw:(s>>>16)%4*Math.PI*.5,type}}`);

  replaceFn("itemAt",`function itemAt(l,x,y){x=Math.floor(x);y=Math.floor(y);const q=st(l),id=l+":"+x+":"+y;if(q.col.has(id)||cellAt(x,y)||trAt(l,x,y))return null;if(q.cache.has(id))return q.cache.get(id);let it=null;if(l===0&&x===5&&y===3)it={id,type:"flashlight",name:"Flashlight"};else if(l===0&&x===5&&y===5)it={id,type:"lidar",name:"LIDAR Scanner"};else{const cfg=ITEM_CFG[l],hr=rnd(x,y,92,l),r=rnd(x,y,90,l);let type=null;if(cfg.hazards&&hr<cfg.hazard*DIFF.hazard)type=cfg.hazards[hash(x,y,93,l)%cfg.hazards.length];else if(r<cfg.safe*DIFF.item)type=cfg.pool[hash(x,y,94,l)%cfg.pool.length];if(type){const names={lidar:"LIDAR Module",flashlight:"Flashlight",battery:"Battery",almond:"Almond Water",energy:"Energy Bar",coffee:"Coffee",mold:"Black Mold",livewire:"Live Wire"};it={id,type,name:names[type],hazard:type==="mold"||type==="livewire"}}}q.cache.set(id,it);return it}`);

  replaceFn("nearItem",`function nearItem(){const px=Math.floor(player.x),py=Math.floor(player.y);let b=null,bd=99;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const it=itemAt(level,px+ox,py+oy);if(!it||it.hazard)continue;const d=Math.hypot(px+ox+.5-player.x,py+oy+.5-player.y);if(d<.95&&d<bd){b={...it,x:px+ox,y:py+oy};bd=d}}return b}`);

  replaceFn("collect",`function collect(){const it=nearItem();if(!it)return;st(level).col.add(it.id);if(it.type==="flashlight"){inv.flashlight=true;inv.flashlightOn=true;inv.charge=Math.max(inv.charge,100)}else if(it.type==="battery")inv.batteries++;else if(it.type==="almond")inv.almondWater++;else if(it.type==="lidar")inv.lidarLevel++;else if(it.type==="energy"){maxStamina+=20;stamina=maxStamina}else if(it.type==="coffee")coffee++}`);

  replaceFn("maybeTransition",`function maybeTransition(){if(transitionCooldown>0)return;const tr=trAt(level,Math.floor(player.x),Math.floor(player.y));if(tr&&tr.door&&Math.abs(player.x-(tr.cx+.5))<.42&&Math.abs(player.y-(tr.cy+.5))<.42){level=tr.target;player.x=2.5;player.y=2.5;player.angle=0;transitionCooldown=1.25;showTitle()}}`);

  replaceFn("renderStuff",`function renderStuff(){const px=Math.floor(player.x),py=Math.floor(player.y),r=[];for(let y=py-12;y<=py+12;y++)for(let x=px-12;x<=px+12;x++){const o=objAt(level,x,y);if(o)r.push({k:0,d:Math.hypot(o.x-player.x,o.z-player.y),o});const it=itemAt(level,x,y);if(it)r.push({k:1,d:Math.hypot(x+.5-player.x,y+.5-player.y),it,x,y})}for(const tr of transitions(level)){const d=Math.hypot(tr.cx+.5-player.x,tr.cy+.5-player.y);if(d<14)r.push({k:0,d,o:{x:tr.cx+.5,z:tr.cy+.5,y:0,yaw:0,type:"doorframe"}})}r.sort((a,b)=>b.d-a.d);for(const q of r)q.k===0?drawModel(q.o):drawSprite(q.x+.5,q.y+.5,q.it.type)}`);

  replaceFn("drawPlanePattern",`function drawPlanePattern(lv,horizon){const dirX=Math.cos(player.angle),dirY=Math.sin(player.angle),planeScale=Math.tan(player.fov*.5),planeX=-dirY*planeScale,planeY=dirX*planeScale,leftX=dirX-planeX,leftY=dirY-planeY,rightX=dirX+planeX,rightY=dirY+planeY,cache=drawPlanePattern._c||(drawPlanePattern._c=new Map());const rgb=h=>{if(cache.has(h))return cache.get(h);const s=h.slice(1),c=[parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];cache.set(h,c);return c};for(let y=0;y<H;y++){const delta=Math.abs(y-horizon);if(delta<1)continue;const row=.5*H/delta,stepX=row*(rightX-leftX)/W,stepY=row*(rightY-leftY)/W;let wx=player.x+row*leftX,wy=player.y+row*leftY;const floor=y>horizon;for(let x=0;x<W;x+=2){const ix=Math.floor(wx),iy=Math.floor(wy),fx=wx-ix,fy=wy-iy,tr=trAt(level,ix,iy),sl=tr&&tr.isRoom?LEVELS[tr.target]:lv,t=sl.type;let f=1;if(floor){if(t==="yellow")f=((ix+iy)&1?0.94:1.02)*(Math.abs(fx-.5)+Math.abs(fy-.5)<.23?1.07:1);else if(t==="concrete")f=(fx<.045||fy<.045)?.73:.94+rnd(ix,iy,801)*.10;else if(t==="pipes")f=(fx<.05||fy<.05)?.68:((Math.floor(fx*8)+Math.floor(fy*8))%5===0?1.06:.88);else if(t==="electrical")f=(fx<.04||fy<.04)?.60:((ix+iy)&1?.82:.94);else if(t==="office")f=((ix+iy)&1?.92:1.03)*(Math.floor(fx*6)%3===0?.96:1);else if(t==="hotel")f=((Math.floor(fx*8)+Math.floor(fy*8))%6===0?1.08:.86)*(Math.abs(fx-.5)<.08?1.06:1);else if(t==="darkness")f=.55+rnd(ix,iy,802)*.12;else if(t==="ocean")f=.78+(Math.floor((fx+fy)*12)%4===0?.12:0);else if(t==="caves")f=.62+rnd(ix,iy,803)*.28;else if(t==="suburb")f=.70+rnd(ix,iy,804)*.18-(fx<.025?.14:0);else if(t==="fields")f=.78+(Math.floor((fx+iy)*10)%3===0?.12:0)}else{if(t==="yellow"||t==="office")f=(fx<.055||fy<.055)?.68:1;else if(t==="concrete")f=.82+rnd(ix,iy,805)*.12;else if(t==="pipes"||t==="electrical")f=(Math.floor(fx*6)%3===0)?.65:.88;else if(t==="hotel")f=(fx<.04||fy<.04)?.70:.94;else if(t==="darkness")f=.48+rnd(ix,iy,806)*.08;else if(t==="ocean")f=(fx<.05||fy<.05)?.72:.93;else if(t==="caves")f=.58+rnd(ix,iy,807)*.25;else if(t==="suburb")f=.82+rnd(ix,iy,808)*.08;else if(t==="fields")f=.96}const c=rgb(floor?sl.floor[0]:sl.ceil[0]);vctx.fillStyle=sh(c,f);vctx.fillRect(x,y,2,1);wx+=stepX*2;wy+=stepY*2}}}`);

  replaceFn("renderWorld",`function renderWorld(time){const lv=LEVELS[level],horizon=H/2+player.pitch*H;vctx.fillStyle=lv.ceil[0];vctx.fillRect(0,0,W,Math.max(0,Math.min(H,horizon)));vctx.fillStyle=lv.floor[0];vctx.fillRect(0,Math.max(0,Math.min(H,horizon)),W,H-Math.max(0,Math.min(H,horizon)));drawPlanePattern(lv,horizon);if(level===0||level===4){const f=.08+Math.sin(time*.013)*.012;for(let x=10;x<W;x+=30){vctx.fillStyle="rgba(255,255,220,"+f+")";vctx.fillRect(x,7+player.pitch*H,11,2)}}for(let x=0;x<W;x++){const cam=x/W-.5,a=player.angle+cam*player.fov,hit=cast(a),d=Math.max(.001,hit.dist*Math.cos(a-player.angle));zBuffer[x]=d;const wh=Math.min(H*3,Math.floor(H/d)),top=Math.floor(horizon-wh/2),tr=trAt(level,hit.mx,hit.my),wl=tr&&tr.isRoom?LEVELS[tr.target]:lv,wt=wl.type,base=wallColor(hit.mx,hit.my);let tex=.92;if(wt==="yellow")tex=.88+(Math.floor(hit.wallX*10)%4===0?.10:0);else if(wt==="concrete")tex=.76+rnd(hit.mx,hit.my,171)*.22;else if(wt==="pipes")tex=.78+(Math.floor(hit.wallX*14)%5===0?.16:0);else if(wt==="electrical")tex=.70+(Math.floor(hit.wallX*8)%2?.16:.03);else if(wt==="office")tex=.91+(Math.floor(hit.wallX*16)%8===0?.05:0);else if(wt==="hotel")tex=.80+(Math.floor(hit.wallX*12)%3===0?.15:0);else if(wt==="darkness")tex=.45;else if(wt==="ocean")tex=.76+(Math.sin(hit.wallX*35)*.08);else if(wt==="caves")tex=.62+rnd(hit.mx,hit.my,170)*.30;else if(wt==="suburb")tex=.72+(Math.floor(hit.wallX*9)%3===0?.10:0);else if(wt==="fields")tex=.82+(Math.floor(hit.wallX*7)%2?.07:0);let fog=Math.max(.12,Math.min(1,1.5/(d*.20+1)));if(lv.type==="darkness"){const c=Math.abs(x/W-.5);fog*=inv.flashlightOn?Math.max(.07,1-c*2.35):.045}else if(inv.flashlightOn){const c=Math.abs(x/W-.5);fog*=Math.min(1.25,1.02+Math.max(0,.22-c*.65))}vctx.fillStyle=sh(base,tex*fog*(hit.side===0?1:.82));vctx.fillRect(x,top,1,wh)}renderStuff();if(lv.type==="darkness"&&!inv.flashlightOn){vctx.fillStyle="rgba(0,0,0,.94)";vctx.fillRect(0,0,W,H)}else if(lv.type==="darkness"&&inv.flashlightOn){const g=vctx.createRadialGradient(W/2,horizon,4,W/2,horizon,90);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.42,"rgba(0,0,0,.24)");g.addColorStop(1,"rgba(0,0,0,.94)");vctx.fillStyle=g;vctx.fillRect(0,0,W,H)}}`);

  replaceFn("hud",`function hud(){stats.innerHTML=LEVELS[level].name+"<br>Flashlight: "+(inv.flashlight?(inv.flashlightOn?"ON":"OFF"):"yok")+" · Charge: "+(inv.flashlight?Math.ceil(inv.charge)+"%":"—")+"<br>Battery: "+inv.batteries+" · Almond: "+inv.almondWater+" · Coffee: "+coffee+" · LIDAR: "+(inv.lidarLevel?"Lv."+inv.lidarLevel:"yok")+(boostTimer>0?"<br>Speed boost: "+boostTimer.toFixed(1)+"s":"");const it=nearItem();if(it){message.style.display="block";message.textContent="[E] Al: "+it.name}else message.style.display="none"}`);

  patched=patched.replace("function renderHotbar(){",`function renderSanity(){const w=198,h=7,x=(canvas.width-w)/2,y=canvas.height-94;ctx.save();ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#77746d";ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=sanity>30?"#cbc7b8":"#a98282";ctx.fillRect(x+2,y+2,(w-4)*(sanity/100),h-4);ctx.fillStyle="#d9d4bd";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("SANITY",canvas.width/2,y-3);ctx.restore()}function renderStamina(){const w=198,h=7,x=(canvas.width-w)/2,y=canvas.height-78;ctx.save();ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#8a8678";ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=stamina/maxStamina>.25?"#d9d4bd":"#bfa48d";ctx.fillRect(x+2,y+2,(w-4)*(stamina/maxStamina),h-4);ctx.fillStyle="#d9d4bd";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("STAMINA",canvas.width/2,y-3);ctx.restore()}function renderSanityFX(){if(sanity>=45)return;const a=(45-sanity)/45;ctx.save();ctx.globalAlpha=a*.22;ctx.fillStyle="#2b0b12";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=a*.18*(.5+.5*Math.sin(performance.now()*.02));ctx.strokeStyle="#eee";for(let i=0;i<6;i++){const y=(hash(i,Math.floor(performance.now()/120),999)%Math.max(1,canvas.height))|0;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}ctx.restore()}function renderHotbar(){`);

  replaceFn("renderHotbar",`function renderHotbar(){const slots=[{label:"FLASH",have:inv.flashlight,count:inv.flashlight?1:0},{label:"ALMOND",have:inv.almondWater>0,count:inv.almondWater},{label:"LIDAR",have:inv.lidarLevel>0,count:inv.lidarLevel},{label:"COFFEE",have:coffee>0,count:coffee}],w=58,h=44,g=5,total=slots.length*w+(slots.length-1)*g,x0=(canvas.width-total)/2,y=canvas.height-h-18;ctx.save();ctx.font="10px monospace";ctx.textAlign="center";for(let i=0;i<slots.length;i++){const x=x0+i*(w+g),s=slots[i];ctx.fillStyle=i===selectedSlot?"rgba(235,235,220,.26)":"rgba(0,0,0,.55)";ctx.fillRect(x,y,w,h);ctx.strokeStyle=i===selectedSlot?"#f0ead2":"#777";ctx.lineWidth=i===selectedSlot?2:1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=s.have?"#eee9d8":"#777";ctx.fillText(String(i+1),x+w/2,y+12);ctx.fillText(s.label,x+w/2,y+27);ctx.fillText("x"+s.count,x+w/2,y+39)}ctx.restore()}`);

  replaceFn("renderExitHint",`function renderExitHint(){if(level>=10)return;let best=null,bd=1e9;for(const r of transitions(level)){if(r.target!==level+1)continue;const d=Math.hypot(r.cx+.5-player.x,r.cy+.5-player.y);if(d<bd){bd=d;best=r}}if(!best||bd>60)return;let rel=Math.atan2(best.cy+.5-player.y,best.cx+.5-player.x)-player.angle;while(rel>Math.PI)rel-=Math.PI*2;while(rel<-Math.PI)rel+=Math.PI*2;const closeness=1-bd/60,pulse=.6+.4*Math.sin(performance.now()*.007),x=canvas.width/2+Math.max(-.86,Math.min(.86,rel/(player.fov/2)))*canvas.width*.40,y=canvas.height*.76;ctx.save();ctx.globalAlpha=.22+closeness*.72;ctx.translate(x,y);ctx.rotate(rel);ctx.fillStyle="#e8dfb8";ctx.font=Math.max(20,Math.floor(canvas.height*.034))+"px monospace";ctx.textAlign="center";ctx.fillText("➤",0,0);ctx.restore();if(bd<35){ctx.save();ctx.globalAlpha=.35+closeness*.6;ctx.fillStyle="#e8dfb8";ctx.font=Math.max(10,Math.floor(canvas.height*.016))+"px monospace";ctx.textAlign="center";ctx.fillText("ÇIKIŞ YAKIN",canvas.width/2,canvas.height*.13);ctx.restore()}if(bd<20){ctx.save();ctx.globalAlpha=.12+.28*pulse;ctx.strokeStyle="#e8dfb8";ctx.lineWidth=Math.max(2,canvas.height*.005);ctx.strokeRect(5,5,canvas.width-10,canvas.height-10);ctx.restore()}}`);

  replaceFn("useSelected",`function useSelected(){if(selectedSlot===0){if(inv.flashlight&&inv.charge>0)inv.flashlightOn=!inv.flashlightOn}else if(selectedSlot===1){if(inv.almondWater>0){inv.almondWater--;boostTimer=Math.max(boostTimer,10);sanity=Math.min(100,sanity+35)}}else if(selectedSlot===3){if(coffee>0){coffee--;stamina=maxStamina;sanity=Math.min(100,sanity+8)}}}`);

  patched=patched.replace("function update(dt){",`function die(reason){if(gameDead)return;gameDead=true;document.exitPointerLock&&document.exitPointerLock();const o=document.createElement("div");o.style.cssText="position:fixed;inset:0;z-index:10001;background:rgba(5,5,5,.94);color:#e8e5da;display:grid;place-items:center;font-family:monospace";const p=document.createElement("div");p.style.cssText="text-align:center";const t=document.createElement("div");t.textContent="ÖLDÜN";t.style.cssText="font-size:25px;letter-spacing:.25em;margin-bottom:8px";const r=document.createElement("div");r.textContent=reason;r.style.cssText="font-size:10px;opacity:.55;margin-bottom:18px";const b=document.createElement("button");b.textContent="TEKRAR";b.style.cssText="background:transparent;color:#ddd;border:1px solid #666;padding:9px 18px;font:11px monospace;cursor:pointer";b.onclick=()=>location.reload();p.append(t,r,b);o.append(p);document.body.append(o)}function checkHazards(){const px=Math.floor(player.x),py=Math.floor(player.y);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const it=itemAt(level,px+ox,py+oy);if(!it||!it.hazard)continue;const d=Math.hypot(px+ox+.5-player.x,py+oy+.5-player.y);if(d>.34)continue;st(level).col.add(it.id);if(it.type==="livewire"){die("ELEKTRİK ÇARPMASI");return}if(it.type==="mold"){sanity=Math.max(0,sanity-45);stamina=Math.max(0,stamina-25)}}}function update(dt){`);

  replaceFn("update",`function update(dt){if(gameDead)return;const fx=Math.cos(player.angle),fy=Math.sin(player.angle),rx=Math.cos(player.angle+Math.PI/2),ry=Math.sin(player.angle+Math.PI/2);let dx=0,dy=0;if(keys.KeyW){dx+=fx;dy+=fy}if(keys.KeyS){dx-=fx;dy-=fy}if(keys.KeyA){dx-=rx;dy-=ry}if(keys.KeyD){dx+=rx;dy+=ry}const L=Math.hypot(dx,dy);if(L){dx/=L;dy/=L}const wantsSprint=(keys.ShiftLeft||keys.ShiftRight)&&L>0;let sprinting=wantsSprint&&stamina>0;if(sprinting){stamina=Math.max(0,stamina-dt*18*DIFF.staminaDrain);if(stamina<=0)sprinting=false}else if(!wantsSprint)stamina=Math.min(maxStamina,stamina+dt*15);const sp=3.45*(sprinting?2.2:1)*(boostTimer>0?1.4:1),stp=sp*dt,nx=player.x+dx*stp,ny=player.y+dy*stp;if(canMove(nx,player.y))player.x=nx;if(canMove(player.x,ny))player.y=ny;if(inv.flashlightOn){inv.charge-=dt*.75;if(inv.charge<=0){if(inv.batteries>0){inv.batteries--;inv.charge=100}else{inv.charge=0;inv.flashlightOn=false}}}sanity=Math.max(0,sanity-dt*.08*DIFF.sanity);if(sanity<=0){die("SANITY TÜKENDİ");return}if(boostTimer>0)boostTimer=Math.max(0,boostTimer-dt);const autoItem=nearItem();if(autoItem&&Math.hypot(autoItem.x+.5-player.x,autoItem.y+.5-player.y)<.40)collect();checkHazards();if(gameDead)return;if(titleTimer>0){titleTimer-=dt;if(titleTimer<=0)levelTitle.style.opacity="0"}if(transitionCooldown>0)transitionCooldown-=dt;maybeTransition()}`);

  replaceFn("render",`function render(t){renderWorld(t);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(view,0,0,canvas.width,canvas.height);renderExitHint();renderLidar();renderSanity();renderStamina();renderHotbar();renderSanityFX();hud()}`);

  patched=patched.replace('if(e.code==="Digit3")selectedSlot=2;','if(e.code==="Digit3")selectedSlot=2;if(e.code==="Digit4")selectedSlot=3;');
  patched=patched.replace('(selectedSlot+(e.deltaY>0?1:2))%3','(selectedSlot+(e.deltaY>0?1:3))%4');
}

const sourceUrl=new URL("./game-v9.js",import.meta.url);
let source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw new Error(`game-v9.js yüklenemedi: ${r.status}`);return r.text()});
source=source.replace('new URL("./game-v3.js",import.meta.url)',`new URL("./game-v3.js",${JSON.stringify(import.meta.url)})`);
const marker="  const runner=new Function(patched);";
if(!source.includes(marker))throw new Error("v13 runtime marker bulunamadı");
source=source.replace(marker,"  ("+patchRuntime.toString()+")();\n"+marker);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction(source)();
