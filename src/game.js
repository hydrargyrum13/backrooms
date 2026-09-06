"use strict";

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d", { alpha: false });
const lockText = document.getElementById("lock");
const stats = document.getElementById("stats");
const message = document.getElementById("message");
const levelTitle = document.getElementById("levelTitle");

const INTERNAL_W = 240;
const INTERNAL_H = 135;

const view = document.createElement("canvas");
view.width = INTERNAL_W;
view.height = INTERNAL_H;
const vctx = view.getContext("2d", { alpha: false });
vctx.imageSmoothingEnabled = false;

const LEVELS = [
  { name:"Level 0 — Yellow Halls", type:"rooms", ceiling:["#9d9568","#c7bc75"], floor:["#706645","#403a2a"], wall:[211,204,129], side:[183,176,105] },
  { name:"Level 1 — Concrete Lots", type:"rooms", ceiling:["#666a68","#878b88"], floor:["#505452","#282b2a"], wall:[141,145,141], side:[102,106,103] },
  { name:"Level 2 — Pipe-lined Halls", type:"rooms", ceiling:["#716b60","#918677"], floor:["#514a43","#26221f"], wall:[155,145,128], side:[112,103,91] },
  { name:"Level 3 — Electricals", type:"rooms", ceiling:["#4f4b45","#6b655c"], floor:["#35322f","#171615"], wall:[116,108,95], side:[77,72,64] },
  { name:"Level 4 — Blue Office", type:"rooms", ceiling:["#aab5ba","#cbd5d9"], floor:["#78868b","#4d595e"], wall:[185,203,211], side:[139,159,167] },
  { name:"Level 5 — The Hotel", type:"rooms", ceiling:["#5d493c","#8a6b55"], floor:["#5b2527","#2f1113"], wall:[137,105,78], side:[93,67,49] },
  { name:"Level 6 — Darkness", type:"rooms", ceiling:["#070707","#111111"], floor:["#080808","#020202"], wall:[44,44,42], side:[28,28,27] },
  { name:"Level 7 — The Ocean", type:"rooms", ceiling:["#657782","#9caab0"], floor:["#315d70","#193746"], wall:[151,162,160], side:[105,116,115] },
  { name:"Level 8 — Caves", type:"cave", ceiling:["#24211f","#3a3531"], floor:["#282521","#121110"], wall:[87,80,72], side:[57,52,47] },
  { name:"Level 9 — Dark Suburbs", type:"suburb", ceiling:["#101723","#202d3e"], floor:["#23282b","#101315"], wall:[76,82,85], side:[48,53,56] },
  { name:"Level 10 — The Fields", type:"fields", ceiling:["#89a5bb","#c6d3d8"], floor:["#657c42","#334322"], wall:[135,145,99], side:[90,101,67] }
];

const ITEM_SPRITES = {
  flashlight: [
    "00022000",
    "00222200",
    "02211220",
    "00222200",
    "00022000",
    "00022000",
    "00033000",
    "00033000"
  ],
  almond: [
    "00044000",
    "00444400",
    "04455440",
    "04555540",
    "04555540",
    "04455440",
    "00444400",
    "00044000"
  ],
  battery: [
    "00066000",
    "00666600",
    "06677660",
    "06677660",
    "06677660",
    "06677660",
    "00666600",
    "00066000"
  ]
};

const ITEM_COLORS = {
  "1":"#d8e0c8",
  "2":"#6e766d",
  "3":"#30352f",
  "4":"#d5edf6",
  "5":"#6ea6bf",
  "6":"#c9b86e",
  "7":"#6e6236"
};

let currentLevel = 0;
let mapOpen = false;
let titleTimer = 0;
let transitionCooldown = 0;

const player = { x:2.5, y:2.5, angle:0, fov:Math.PI/3, speed:2.65, radius:.18 };
const keys = Object.create(null);
const zBuffer = new Float32Array(INTERNAL_W);

const inventory = {
  flashlight:false,
  flashlightOn:false,
  charge:0,
  batteries:0,
  almondWater:0
};

const collected = new Set();

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
addEventListener("resize", resize);
resize();

function hashInt(x, y, s = 0, level = currentLevel) {
  let h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul((s + level*131)|0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function rand(x, y, s = 0, level = currentLevel) {
  return hashInt(x, y, s, level) / 4294967295;
}

function mod(n,d){ return ((n % d) + d) % d; }
function floorDiv(n,d){ return Math.floor(n/d); }

function roomCellAt(x, y) {
  const MACRO = 12;
  const mx = floorDiv(x, MACRO);
  const my = floorDiv(y, MACRO);
  const lx = mod(x, MACRO);
  const ly = mod(y, MACRO);

  const seedA = hashInt(mx, my, 10);
  const left = 1 + (seedA % 3);
  const right = 9 + ((seedA >>> 5) % 2);
  const top = 1 + ((seedA >>> 9) % 3);
  const bottom = 9 + ((seedA >>> 13) % 2);

  let open = lx >= left && lx <= right && ly >= top && ly <= bottom;

  const eastOpen = (hashInt(mx, my, 20) % 100) < 72;
  const westOpen = (hashInt(mx-1, my, 20) % 100) < 72;
  const southOpen = (hashInt(mx, my, 21) % 100) < 72;
  const northOpen = (hashInt(mx, my-1, 21) % 100) < 72;

  const eastDoorY = 2 + (hashInt(mx, my, 30) % 8);
  const westDoorY = 2 + (hashInt(mx-1, my, 30) % 8);
  const southDoorX = 2 + (hashInt(mx, my, 31) % 8);
  const northDoorX = 2 + (hashInt(mx, my-1, 31) % 8);

  if (eastOpen && ly >= eastDoorY && ly <= eastDoorY+1 && lx >= right) open = true;
  if (westOpen && ly >= westDoorY && ly <= westDoorY+1 && lx <= left) open = true;
  if (southOpen && lx >= southDoorX && lx <= southDoorX+1 && ly >= bottom) open = true;
  if (northOpen && lx >= northDoorX && lx <= northDoorX+1 && ly <= top) open = true;

  if (open) {
    const feature = hashInt(mx, my, 40) % 5;
    if (feature === 0 && lx === 6 && ly >= top+2 && ly <= bottom-2 && ly !== 6) open = false;
    if (feature === 1 && ly === 6 && lx >= left+2 && lx <= right-2 && lx !== 6) open = false;
    if (feature === 2 && (lx===5||lx===8) && (ly===5||ly===8)) open = false;
  }

  if (Math.abs(x-2)<=4 && Math.abs(y-2)<=4) open = true;

  return open ? 0 : 1;
}

function caveCellAt(x,y) {
  if (Math.abs(x-2)<=4 && Math.abs(y-2)<=4) return 0;
  const n1 = rand(floorDiv(x,2), floorDiv(y,2), 50);
  const n2 = rand(floorDiv(x,5), floorDiv(y,5), 51);
  let wall = (n1*.7 + n2*.3) < .35;
  if (mod(x,17)===8 || mod(y,19)===9) wall = false;
  return wall ? 1 : 0;
}

function suburbCellAt(x,y) {
  if (Math.abs(x-2)<=4 && Math.abs(y-2)<=4) return 0;
  const bx = mod(x,18), by = mod(y,17);
  if (bx<=2 || by<=2) return 0;
  const houseSeed = hashInt(floorDiv(x,18),floorDiv(y,17),60);
  const inset = 4 + (houseSeed%2);
  const maxX = 14 - ((houseSeed>>>4)%2);
  const maxY = 13 - ((houseSeed>>>7)%2);
  const wall = bx===inset || bx===maxX || by===inset || by===maxY;
  if (!wall) return 0;
  const doorX = 8 + ((houseSeed>>>10)%3);
  if (by===maxY && bx===doorX) return 0;
  return 1;
}

function fieldsCellAt(x,y) {
  if (Math.abs(x-2)<=4 && Math.abs(y-2)<=4) return 0;
  const patch = rand(floorDiv(x,4), floorDiv(y,4), 70);
  if (patch < .035) return 1;
  const fence = hashInt(floorDiv(x,20),floorDiv(y,20),71)%4;
  if (fence===0 && mod(x,20)===10 && mod(y,7)!==3) return 1;
  return 0;
}

function transitionRoomFor(level, x, y) {
  const rooms = [];
  if (level < LEVELS.length-1) rooms.push({dir:1, cx:16, cy:3, target:level+1});
  if (level > 0) rooms.push({dir:-1, cx:-16, cy:3, target:level-1});

  for (const r of rooms) {
    if (x >= r.cx-4 && x <= r.cx+4 && y >= r.cy-4 && y <= r.cy+4) {
      const edge = x===r.cx-4 || x===r.cx+4 || y===r.cy-4 || y===r.cy+4;
      const doorway =
        (x===r.cx-4 && y>=r.cy-1 && y<=r.cy+1) ||
        (x===r.cx+4 && y>=r.cy-1 && y<=r.cy+1);
      if (edge && !doorway) return { wall:1, target:r.target };
      return { wall:0, target:r.target };
    }
  }
  return null;
}

function cellAt(x,y) {
  x=Math.floor(x); y=Math.floor(y);
  const tr = transitionRoomFor(currentLevel,x,y);
  if (tr) return tr.wall;

  const type = LEVELS[currentLevel].type;
  if (type==="cave") return caveCellAt(x,y);
  if (type==="suburb") return suburbCellAt(x,y);
  if (type==="fields") return fieldsCellAt(x,y);
  return roomCellAt(x,y);
}

function wallPaletteAt(x,y) {
  const tr = transitionRoomFor(currentLevel,x,y);
  if (tr) {
    const target = LEVELS[tr.target];
    return { main:target.wall, side:target.side };
  }
  const lv = LEVELS[currentLevel];
  return { main:lv.wall, side:lv.side };
}

function isWall(x,y){ return cellAt(Math.floor(x),Math.floor(y))===1; }

function canMoveTo(x,y){
  const r=player.radius;
  return !isWall(x-r,y-r)&&!isWall(x+r,y-r)&&!isWall(x-r,y+r)&&!isWall(x+r,y+r);
}

function maybeTransition() {
  if (transitionCooldown > 0) return;
  const x = Math.floor(player.x), y = Math.floor(player.y);
  const tr = transitionRoomFor(currentLevel,x,y);
  if (!tr || tr.wall) return;

  const centerX = tr.target > currentLevel ? 16 : -16;
  if (Math.abs(player.x-centerX) < 1.25 && Math.abs(player.y-3) < 1.6) {
    currentLevel = tr.target;
    player.x = 2.5; player.y = 2.5; player.angle = 0;
    transitionCooldown = 1.25;
    mapOpen = false;
    showTitle();
  }
}

function itemAt(x,y){
  x=Math.floor(x); y=Math.floor(y);
  const id=`${currentLevel}:${x}:${y}`;
  if (collected.has(id) || cellAt(x,y)) return null;

  if (currentLevel===0 && x===6 && y===3) return {id,type:"flashlight",name:"Flashlight"};

  const r = rand(x,y,90);
  if (r < 0.00055) return {id,type:"flashlight",name:"Flashlight"};
  if (r < 0.0018) return {id,type:"battery",name:"Battery"};
  if (r < 0.00265) return {id,type:"almond",name:"Almond Water"};
  return null;
}

function showTitle(){
  levelTitle.textContent = LEVELS[currentLevel].name;
  levelTitle.style.opacity = "1";
  titleTimer = 2.2;
}
showTitle();

document.addEventListener("keydown", e => {
  if (e.code==="KeyM" && !e.repeat) mapOpen=!mapOpen;
  if (e.code==="KeyF" && !e.repeat && inventory.flashlight && inventory.charge>0) inventory.flashlightOn=!inventory.flashlightOn;
  if (e.code==="KeyE" && !e.repeat) collectNearby();
  keys[e.code]=true;
});
document.addEventListener("keyup", e => keys[e.code]=false);

canvas.addEventListener("click",()=>canvas.requestPointerLock());
document.addEventListener("pointerlockchange",()=>{
  lockText.style.display = document.pointerLockElement===canvas ? "none":"block";
});
document.addEventListener("mousemove", e=>{
  if (document.pointerLockElement===canvas) player.angle += e.movementX*.0025;
});

function nearbyItem(){
  const px=Math.floor(player.x), py=Math.floor(player.y);
  let best=null, bestD=999;
  for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
    const it=itemAt(px+ox,py+oy);
    if(!it) continue;
    const d=Math.hypot(px+ox+.5-player.x,py+oy+.5-player.y);
    if(d<.95 && d<bestD){ best={...it,x:px+ox,y:py+oy}; bestD=d; }
  }
  return best;
}

function collectNearby(){
  const it=nearbyItem();
  if(!it) return;
  collected.add(it.id);
  if(it.type==="flashlight"){
    inventory.flashlight=true;
    inventory.flashlightOn=true;
    inventory.charge=Math.max(inventory.charge,100);
  }else if(it.type==="battery"){
    inventory.batteries++;
  }else if(it.type==="almond"){
    inventory.almondWater++;
  }
}

function update(dt){
  const fx=Math.cos(player.angle), fy=Math.sin(player.angle);
  const rx=Math.cos(player.angle+Math.PI/2), ry=Math.sin(player.angle+Math.PI/2);
  let dx=0,dy=0;
  if(keys.KeyW){dx+=fx;dy+=fy}
  if(keys.KeyS){dx-=fx;dy-=fy}
  if(keys.KeyA){dx-=rx;dy-=ry}
  if(keys.KeyD){dx+=rx;dy+=ry}
  const len=Math.hypot(dx,dy);
  if(len){dx/=len;dy/=len}
  const speed=player.speed*((keys.ShiftLeft||keys.ShiftRight)?1.65:1);
  const step=speed*dt;
  const nx=player.x+dx*step, ny=player.y+dy*step;
  if(canMoveTo(nx,player.y)) player.x=nx;
  if(canMoveTo(player.x,ny)) player.y=ny;

  if(inventory.flashlightOn){
    inventory.charge-=dt*.75;
    if(inventory.charge<=0){
      if(inventory.batteries>0){inventory.batteries--;inventory.charge=100}
      else {inventory.charge=0;inventory.flashlightOn=false}
    }
  }

  if(titleTimer>0){
    titleTimer-=dt;
    if(titleTimer<=0) levelTitle.style.opacity="0";
  }
  if(transitionCooldown>0) transitionCooldown-=dt;
  maybeTransition();
}

function castRay(angle){
  const dx=Math.cos(angle), dy=Math.sin(angle);
  let mx=Math.floor(player.x), my=Math.floor(player.y);
  const ddx=Math.abs(1/(dx||1e-8)), ddy=Math.abs(1/(dy||1e-8));
  let sx,sy,sdx,sdy;
  if(dx<0){sx=-1;sdx=(player.x-mx)*ddx}else{sx=1;sdx=(mx+1-player.x)*ddx}
  if(dy<0){sy=-1;sdy=(player.y-my)*ddy}else{sy=1;sdy=(my+1-player.y)*ddy}

  let side=0, hit=false;
  for(let i=0;i<320;i++){
    if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
    if(cellAt(mx,my)){hit=true;break}
  }
  if(!hit) return {dist:60,side:0,wallX:0,mx,my};

  const dist = side===0
    ? (mx-player.x+(1-sx)/2)/(dx||1e-8)
    : (my-player.y+(1-sy)/2)/(dy||1e-8);

  let wallX = side===0 ? player.y+dist*dy : player.x+dist*dx;
  wallX -= Math.floor(wallX);
  return {dist:Math.abs(dist),side,wallX,mx,my};
}

function shade(base,f){
  return `rgb(${Math.max(0,Math.min(255,base[0]*f|0))},${Math.max(0,Math.min(255,base[1]*f|0))},${Math.max(0,Math.min(255,base[2]*f|0))})`;
}

function drawPixelSprite(worldX,worldY,type){
  const sprite=ITEM_SPRITES[type];
  if(!sprite) return;

  const dx=worldX-player.x, dy=worldY-player.y;
  const dist=Math.hypot(dx,dy);
  let a=Math.atan2(dy,dx)-player.angle;
  while(a>Math.PI)a-=Math.PI*2;
  while(a<-Math.PI)a+=Math.PI*2;
  if(Math.abs(a)>player.fov*.65 || dist<.1) return;

  const corrected=dist*Math.cos(a);
  const total=Math.max(8,Math.floor((INTERNAL_H/corrected)*.35));
  const pixel=Math.max(1,Math.floor(total/8));
  const sx=Math.floor(INTERNAL_W/2+(a/(player.fov/2))*(INTERNAL_W/2));
  const left=sx-pixel*4;
  const top=Math.floor(INTERNAL_H/2+total*.14-pixel*8);

  for(let sy=0;sy<8;sy++){
    for(let sxp=0;sxp<8;sxp++){
      const code=sprite[sy][sxp];
      if(code==="0") continue;
      const px=left+sxp*pixel;
      if(px<0||px>=INTERNAL_W||corrected>zBuffer[Math.max(0,Math.min(INTERNAL_W-1,px))]) continue;
      vctx.fillStyle=ITEM_COLORS[code];
      vctx.fillRect(px,top+sy*pixel,pixel,pixel);
    }
  }
}

function renderItems(){
  const px=Math.floor(player.x),py=Math.floor(player.y);
  for(let y=py-9;y<=py+9;y++) for(let x=px-9;x<=px+9;x++){
    const it=itemAt(x,y);
    if(it) drawPixelSprite(x+.5,y+.5,it.type);
  }
}

function renderWorld(time){
  const lv=LEVELS[currentLevel];
  const ceil=vctx.createLinearGradient(0,0,0,INTERNAL_H/2);
  ceil.addColorStop(0,lv.ceiling[0]); ceil.addColorStop(1,lv.ceiling[1]);
  vctx.fillStyle=ceil; vctx.fillRect(0,0,INTERNAL_W,INTERNAL_H/2);

  const floor=vctx.createLinearGradient(0,INTERNAL_H/2,0,INTERNAL_H);
  floor.addColorStop(0,lv.floor[0]); floor.addColorStop(1,lv.floor[1]);
  vctx.fillStyle=floor; vctx.fillRect(0,INTERNAL_H/2,INTERNAL_W,INTERNAL_H/2);

  if(currentLevel===0||currentLevel===4){
    const flick=.08+Math.sin(time*.013)*.012;
    for(let x=10;x<INTERNAL_W;x+=30){
      vctx.fillStyle=`rgba(255,255,220,${flick})`;
      vctx.fillRect(x,7,11,2);
    }
  }

  for(let x=0;x<INTERNAL_W;x++){
    const cam=x/INTERNAL_W-.5;
    const rayAngle=player.angle+cam*player.fov;
    const hit=castRay(rayAngle);
    const d=Math.max(.001,hit.dist*Math.cos(rayAngle-player.angle));
    zBuffer[x]=d;

    const wallH=Math.min(INTERNAL_H*3,Math.floor(INTERNAL_H/d));
    const top=Math.floor((INTERNAL_H-wallH)/2);
    const pal=wallPaletteAt(hit.mx,hit.my);
    const base=hit.side===0?pal.main:pal.side;

    let texture=.92+Math.sin(hit.wallX*27)*.035;
    if(currentLevel===8) texture=.7+rand(hit.mx,hit.my,170)*.28;
    if(currentLevel===5) texture=.85+((Math.floor(hit.wallX*12)%3)===0?.11:0);

    let fog=Math.max(.13,Math.min(1,1.5/(d*.20+1)));
    if(currentLevel===6){
      const center=Math.abs(x/INTERNAL_W-.5);
      fog*=inventory.flashlightOn?Math.max(.07,1-center*2.35):.045;
    }else if(inventory.flashlightOn){
      const center=Math.abs(x/INTERNAL_W-.5);
      fog*=Math.min(1.25,1.02+Math.max(0,.22-center*.65));
    }

    vctx.fillStyle=shade(base,texture*fog);
    vctx.fillRect(x,top,1,wallH);
  }

  renderItems();

  if(currentLevel===6&&!inventory.flashlightOn){
    vctx.fillStyle="rgba(0,0,0,.93)";vctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);
  }else if(currentLevel===6&&inventory.flashlightOn){
    const g=vctx.createRadialGradient(INTERNAL_W/2,INTERNAL_H/2,4,INTERNAL_W/2,INTERNAL_H/2,90);
    g.addColorStop(0,"rgba(0,0,0,0)");
    g.addColorStop(.42,"rgba(0,0,0,.24)");
    g.addColorStop(1,"rgba(0,0,0,.93)");
    vctx.fillStyle=g;vctx.fillRect(0,0,INTERNAL_W,INTERNAL_H);
  }
}

function renderMapOverlay(){
  if(!mapOpen) return;
  const radius=5;
  const cellSize=Math.max(10,Math.floor(Math.min(canvas.width,canvas.height)/(radius*2+8)));
  const cells=radius*2+1;
  const mw=cells*cellSize, mh=mw;
  const ox=Math.floor((canvas.width-mw)/2), oy=Math.floor((canvas.height-mh)/2);

  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.86)";
  ctx.fillRect(ox-12,oy-34,mw+24,mh+46);
  ctx.fillStyle="#eee7bd";
  ctx.font="13px monospace";
  ctx.textAlign="center";
  ctx.fillText("LOCAL MAP",canvas.width/2,oy-14);

  const px=Math.floor(player.x),py=Math.floor(player.y);
  for(let my=-radius;my<=radius;my++){
    for(let mx=-radius;mx<=radius;mx++){
      const wx=px+mx,wy=py+my;
      const tr=transitionRoomFor(currentLevel,wx,wy);
      ctx.fillStyle=cellAt(wx,wy)?"#a49e77":"#39372d";
      if(tr){
        const target=LEVELS[tr.target];
        const c=target.wall;
        ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;
      }
      ctx.fillRect(ox+(mx+radius)*cellSize,oy+(my+radius)*cellSize,cellSize-1,cellSize-1);
    }
  }

  const cx=ox+radius*cellSize+cellSize/2;
  const cy=oy+radius*cellSize+cellSize/2;
  ctx.fillStyle="#fff";
  ctx.beginPath();ctx.arc(cx,cy,Math.max(3,cellSize*.22),0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);
  ctx.lineTo(cx+Math.cos(player.angle)*cellSize,cy+Math.sin(player.angle)*cellSize);ctx.stroke();
  ctx.restore();
}

function updateHUD(){
  stats.innerHTML =
    `${LEVELS[currentLevel].name}<br>`+
    `Flashlight: ${inventory.flashlight?(inventory.flashlightOn?"ON":"OFF"):"yok"}<br>`+
    `Charge: ${inventory.flashlight?Math.ceil(inventory.charge)+"%":"—"} · Battery: ${inventory.batteries}<br>`+
    `Almond Water: ${inventory.almondWater}`;

  const it=nearbyItem();
  if(it){
    message.style.display="block";
    message.textContent=`[E] Al: ${it.name}`;
  }else{
    message.style.display="none";
  }
}

function render(time){
  renderWorld(time);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(view,0,0,canvas.width,canvas.height);
  renderMapOverlay();
  updateHUD();
}

let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);
  last=now;
  update(dt);
  render(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
