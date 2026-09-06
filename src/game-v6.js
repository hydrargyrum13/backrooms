"use strict";

const errorBox = document.createElement("pre");
errorBox.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9999;max-width:70vw;white-space:pre-wrap;color:#ffb3b3;background:#1b0000;padding:10px;display:none;font:12px monospace";
document.body.appendChild(errorBox);

function fail(message, err) {
  errorBox.style.display = "block";
  errorBox.textContent = message + (err ? "\n" + (err.stack || err.message || err) : "");
  console.error(message, err);
}

try {
  const sourceUrl = new URL("./game-v3.js", import.meta.url);
  const source = await fetch(sourceUrl).then(r => {
    if (!r.ok) throw new Error(`game-v3.js yüklenemedi: ${r.status}`);
    return r.text();
  });

  const replacements = [
    [
`function getTransitionRooms(level) {
  const rooms = [];
  if (level < LEVELS.length - 1) {
    rooms.push({ cx: 16, cy: 3, target: level + 1 });
  }
  if (level > 0) {
    rooms.push({ cx: -16, cy: 3, target: level - 1 });
  }
  const offsets = [
    [32, -24], [-28, 32], [44, 20], [-40, -28], [12, 46], [-52, 12]
  ];
  for (const [ox, oy] of offsets) {
    const seed = hashInt(ox, oy, 500, level);
    if ((seed % 100) < 48) {
      const next = (seed % 100) < 24;
      let target = level + (next ? 1 : -1);
      if (target >= 0 && target < LEVELS.length) {
        rooms.push({ cx: ox + (seed % 7) - 3, cy: oy + ((seed >>> 4) % 7) - 3, target });
      }
    }
  }
  return rooms;
}`,
`function getTransitionRooms(level) {
  const rooms = [];
  if (level < LEVELS.length - 1) {
    const s = hashInt(701, 911, 500, level);
    const ang = (s % 16) * Math.PI / 8;
    const dist = 58 + ((s >>> 5) % 24);
    rooms.push({ cx: Math.round(Math.cos(ang) * dist), cy: Math.round(Math.sin(ang) * dist), target: level + 1 });
  }
  if (level > 0) {
    const s = hashInt(-877, 613, 501, level);
    const ang = (s % 16) * Math.PI / 8 + Math.PI / 16;
    const dist = 62 + ((s >>> 6) % 26);
    rooms.push({ cx: Math.round(Math.cos(ang) * dist), cy: Math.round(Math.sin(ang) * dist), target: level - 1 });
  }
  const offsets = [[86,-66],[-82,78],[104,52],[-98,-72],[46,106],[-112,38],[124,-88],[-126,92],[72,132],[-138,-58]];
  for (const [ox, oy] of offsets) {
    const seed = hashInt(ox, oy, 500, level);
    if ((seed % 100) < 44) {
      const target = level + ((seed % 100) < 22 ? 1 : -1);
      if (target >= 0 && target < LEVELS.length) rooms.push({ cx: ox + (seed % 11) - 5, cy: oy + ((seed >>> 4) % 11) - 5, target });
    }
  }
  return rooms;
}`
    ],
    [
`function transitionRoomFor(level, x, y) {
  for (const r of getTransitionRooms(level)) {
    if (x >= r.cx - 5 && x <= r.cx + 5 && y >= r.cy - 5 && y <= r.cy + 5) {
      const inner = x >= r.cx - 4 && x <= r.cx + 4 && y >= r.cy - 4 && y <= r.cy + 4;
      if (!inner) return { solid: false, target: r.target, isRoom: false };
      const edge = x === r.cx - 4 || x === r.cx + 4 || y === r.cy - 4 || y === r.cy + 4;
      const doorwayA = x === r.cx - 4 && y >= r.cy - 1 && y <= r.cy + 1;
      const doorwayB = x === r.cx + 4 && y >= r.cy - 1 && y <= r.cy + 1;
      const doorwayC = y === r.cy - 4 && x >= r.cx - 1 && x <= r.cx + 1;
      const doorwayD = y === r.cy + 4 && x >= r.cx - 1 && x <= r.cx + 1;
      if (edge && !(doorwayA || doorwayB || doorwayC || doorwayD)) return { solid: true, target: r.target, isRoom: true };
      return { solid: false, target: r.target, isRoom: true, centerX: r.cx, centerY: r.cy };
    }
  }
  return null;
}`,
`function transitionRoomFor(level, x, y) {
  const half = 2, approach = 1;
  for (const r of getTransitionRooms(level)) {
    if (x >= r.cx - half - approach && x <= r.cx + half + approach && y >= r.cy - half - approach && y <= r.cy + half + approach) {
      const inner = x >= r.cx - half && x <= r.cx + half && y >= r.cy - half && y <= r.cy + half;
      if (!inner) return { solid: false, target: r.target, isRoom: false };
      const edge = x === r.cx - half || x === r.cx + half || y === r.cy - half || y === r.cy + half;
      const doorway = ((x === r.cx - half || x === r.cx + half) && y === r.cy) || ((y === r.cy - half || y === r.cy + half) && x === r.cx);
      if (edge && !doorway) return { solid: true, target: r.target, isRoom: true };
      return { solid: false, target: r.target, isRoom: true, centerX: r.cx, centerY: r.cy };
    }
  }
  return null;
}`
    ],
    [
`function projectPoint(wx, wy, wz) {
  const dx = wx - player.x;
  const dz = wz - player.y;
  const sin = Math.sin(player.angle), cos = Math.cos(player.angle);
  const rx = dx * sin - dz * cos;
  const rz = dx * cos + dz * sin;
  if (rz <= 0.05) return null;
  const scale = INTERNAL_H / rz;
  const sx = INTERNAL_W / 2 + rx * scale;
  const sy = INTERNAL_H / 2 - wy * scale;
  return { sx, sy, rz };
}`,
`function projectPoint(wx, wy, wz) {
  const dx = wx - player.x;
  const dz = wz - player.y;
  const c = Math.cos(player.angle), s = Math.sin(player.angle);
  const forward = dx * c + dz * s;
  if (forward <= 0.05) return null;
  const right = -dx * s + dz * c;
  const scale = INTERNAL_H / forward;
  return { sx: INTERNAL_W / 2 + right * scale, sy: INTERNAL_H / 2 - wy * scale, rz: forward };
}`
    ],
    [
`  function transform(localX, localZ) {
    return {
      x: instance.x + localX * cy - localZ * sy,
      z: instance.z + localX * sy + localZ * cy
    };
  }`,
`  function transform(localX, localZ) {
    return {
      x: instance.x + localZ * cy - localX * sy,
      z: instance.z + localZ * sy + localX * cy
    };
  }`
    ]
  ];

  let patched = source;
  replacements.forEach(([from, to], i) => {
    if (!patched.includes(from)) throw new Error(`Patch block ${i + 1} eşleşmedi`);
    patched = patched.replace(from, to);
  });

  const runner = new Function(patched);
  runner();
} catch (err) {
  fail("Backrooms runtime başlatılamadı.", err);
}
