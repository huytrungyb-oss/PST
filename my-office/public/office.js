// Engine vẽ văn phòng isometric bằng Canvas 2D (không dùng thư viện).
// Toạ độ thế giới tính theo ô: x chạy xuống-phải, y chạy xuống-trái, z là chiều cao (px).
(function () {
  const T = 32, H = 16;            // nửa chiều rộng / nửa chiều cao một ô
  const W = 26, D = 20;            // kích thước toà nhà (ô)
  const WALL = 78;                 // chiều cao tường sau
  const P = (x, y, z = 0) => [(x - y) * T, (x + y) * H - z];

  const SHIRTS = ['#e46f4f', '#3f8fd8', '#46b07e', '#d9a62c', '#9a6fd6', '#e0607f', '#2fb3b0', '#7f8b99'];
  const SKINS = ['#f2c9a5', '#e8b48c', '#c98d64', '#f5d4b8', '#a8714d'];
  const HAIRS = ['#2b2320', '#4a3426', '#151515', '#7a4b2a', '#3a3a44'];

  const C = {
    ground: '#c3c7c0', road: '#4b5056', roadLine: '#e9e4d2', grass: '#93b56d',
    floor: '#ece3d3', floorLine: 'rgba(120,90,50,.07)', server: '#59616c', director: '#b88a5d', meeting: '#c7d4dc',
    lounge: '#e2cfb2', rug: '#b54d43', cafe: '#efe9de', corridor: '#e4e1db',
    wall: '#f3f1ec', wallTop: '#cfcac0', wallDark: '#dcd7cc', slab: '#9aa0a4',
    glass: 'rgba(170,210,232,.22)', frame: '#3a4450', window: '#9ccbe4', windowNight: '#f4d58a',
    desk: '#f7f7f5', wood: '#a8774c', woodDark: '#7c5536', metal: '#7d8791', dark: '#2b323b',
    sofa: '#4f7fb8', plant: '#5aa05a', pot: '#d7d2c8', screen: '#89c4ff',
  };

  // ---------------------------------------------------------------- helpers
  function hex2rgb(h) {
    if (h.startsWith('rgba') || h.startsWith('rgb')) return null;
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(h, f) {
    const c = hex2rgb(h);
    if (!c) return h;
    const m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return `rgb(${m(c[0])},${m(c[1])},${m(c[2])})`;
  }
  function poly(ctx, pts, fill, stroke, lw = 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function box(ctx, x, y, w, d, h, z, color, o = {}) {
    const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    poly(ctx, right, o.right || shade(color, -0.14), o.stroke);
    poly(ctx, left, o.left || shade(color, -0.26), o.stroke);
    poly(ctx, top, o.top || color, o.stroke);
    if (o.alpha != null) ctx.globalAlpha = 1;
  }
  function floorRect(ctx, x, y, w, d, color, z = 0) {
    poly(ctx, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], color);
  }
  // hình chữ nhật dán lên tường sau (tường y=0 hoặc x=0)
  function wallRectY0(ctx, x0, x1, z0, z1, fill, stroke) { poly(ctx, [P(x0, 0.02, z0), P(x1, 0.02, z0), P(x1, 0.02, z1), P(x0, 0.02, z1)], fill, stroke); }
  function wallRectX0(ctx, y0, y1, z0, z1, fill, stroke) { poly(ctx, [P(0.02, y0, z0), P(0.02, y1, z0), P(0.02, y1, z1), P(0.02, y0, z1)], fill, stroke); }
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ---------------------------------------------------------------- layout
  const ROOMS = {
    server: { x: 0, y: 0, w: 6, d: 6, door: 3 },
    director: { x: 6, y: 0, w: 6, d: 6, door: 9 },
    meeting: { x: 12, y: 0, w: 7, d: 6, door: 15.5 },
  };
  const CLUSTERS = [];
  for (const cy of [9.6, 14.8]) for (const cx of [1.6, 7.4, 13.2]) CLUSTERS.push({ x: cx, y: cy });
  function seatsOf(c) {
    return [
      { x: c.x + 1, y: c.y - 0.55, face: 1 },
      { x: c.x + 3, y: c.y + 2.15, face: -1 },
      { x: c.x + 3, y: c.y - 0.55, face: 1 },
      { x: c.x + 1, y: c.y + 2.15, face: -1 },
    ];
  }
  const IDLE_SPOTS = [
    { x: 21.3, y: 1.5, what: 'coffee' }, { x: 22.4, y: 1.5, what: 'coffee' },
    { x: 21.2, y: 4.6 }, { x: 22.3, y: 4.6 }, { x: 24.4, y: 3.6 },
    { x: 20.6, y: 11.7 }, { x: 22.4, y: 11.6 }, { x: 24.6, y: 13.8 }, { x: 21.0, y: 15.9 }, { x: 23.4, y: 17.6 },
  ];
  const MEETING_SPOTS = [
    { x: 13.9, y: 2.0 }, { x: 15.1, y: 2.0 }, { x: 16.3, y: 2.0 }, { x: 17.5, y: 2.0 },
    { x: 13.9, y: 4.5 }, { x: 15.1, y: 4.5 }, { x: 16.3, y: 4.5 }, { x: 17.5, y: 4.5 },
  ];
  const ELEVATOR = { x: 0.7, y: 7 };
  const BOSS_SEAT = { x: 8.6, y: 2.2 };
  const AISLES = [0.7, 6.5, 12.3, 18.5];

  function roomOf(p) {
    if (p.y < 6) for (const k in ROOMS) { const r = ROOMS[k]; if (p.x >= r.x && p.x < r.x + r.w) return r; }
    return null;
  }
  // các điểm đi từ p ra hành lang (y = 7)
  function exitPts(p) {
    const r = roomOf(p);
    if (r) return [{ x: r.door, y: Math.min(p.y, 5.2) }, { x: r.door, y: 7 }];
    if (p.y > 8 && p.x < 19) {
      const ax = AISLES.reduce((a, b) => (Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a));
      return [{ x: ax, y: p.y }, { x: ax, y: 7 }];
    }
    return [{ x: p.x, y: 7 }];
  }
  function route(a, b) {
    if (Math.hypot(a.x - b.x, a.y - b.y) < 0.05) return [];
    const ra = roomOf(a), rb = roomOf(b);
    if (ra && ra === rb) return [b];
    const out = [...exitPts(a), ...exitPts(b).reverse(), { x: b.x, y: b.y }];
    return out.filter((p, i) => i === 0 || Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y) > 0.01);
  }

  // ---------------------------------------------------------------- state
  let canvas, ctx, dpr = 1, cw = 0, ch = 0;
  const cam = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1, fit: 1 };
  let night = false, showLabels = true, avatarMode = false;
  let selectedId = null, onSelect = () => {}, onZoom = () => {};
  const chars = new Map();     // id -> character
  let sessionList = [];
  let hitboxes = [];
  const keys = new Set();
  const cars = [{ t: 0, lane: 0, color: '#e2763a', speed: 0.045 }, { t: 0.55, lane: 1, color: '#f0f0ee', speed: 0.035 }, { t: 0.3, lane: 0, color: '#3f6fb5', speed: 0.04 }];
  const vacuum = { x: 5, y: 12.5, tx: 10, ty: 13 };

  function makeChar(id, opts) {
    const h = hash(id);
    return {
      id, x: opts.x, y: opts.y, path: [], speed: opts.speed || 2.3,
      shirt: opts.shirt || SHIRTS[h % SHIRTS.length], skin: SKINS[(h >> 3) % SKINS.length], hair: HAIRS[(h >> 6) % HAIRS.length],
      hairStyle: (h >> 9) % 3, scale: opts.scale || 1.25, kind: opts.kind || 'agent',
      name: opts.name || '', sessionId: opts.sessionId || id, status: 'idle', seated: false, face: 1,
      phase: Math.random() * 10, leaving: false, dest: null, spot: null,
    };
  }

  function goTo(c, dest) {
    if (c.dest && Math.abs(c.dest.x - dest.x) < 0.01 && Math.abs(c.dest.y - dest.y) < 0.01) return;
    c.dest = { x: dest.x, y: dest.y };
    c.path = route(c, dest);
    c.face = dest.face || c.face;
  }

  // ---------------------------------------------------------------- data in
  function setSessions(list, sel) {
    sessionList = list;
    selectedId = sel;
    const alive = new Set();
    const usedIdle = new Set();
    list.forEach((s, i) => {
      const cl = CLUSTERS[i % CLUSTERS.length];
      const seats = seatsOf(cl);
      const seat = i < CLUSTERS.length ? seats[0] : seats[2];
      let c = chars.get(s.id);
      if (!c) {
        c = makeChar(s.id, { ...ELEVATOR, name: s.name, shirt: SHIRTS[hash(s.name) % SHIRTS.length] });
        chars.set(s.id, c);
      }
      c.name = s.name; c.status = s.status; c.activity = s.activity; c.cluster = i < CLUSTERS.length ? cl : null; c.helperCount = s.helpers.length;
      alive.add(s.id);
      if (s.status === 'idle') {
        if (c.spot == null || usedIdle.has(c.spot)) {
          let k = hash(s.id) % IDLE_SPOTS.length;
          while (usedIdle.has(k)) k = (k + 1) % IDLE_SPOTS.length;
          c.spot = k;
        }
        usedIdle.add(c.spot);
        goTo(c, IDLE_SPOTS[c.spot]);
      } else {
        c.spot = null;
        goTo(c, seat);
      }
      // trợ lý: ngồi cùng cụm bàn, hết chỗ thì vào phòng họp
      s.helpers.forEach((hp, j) => {
        const hid = s.id + ':' + hp.id;
        let hc = chars.get(hid);
        if (!hc) {
          hc = makeChar(hid, { ...ELEVATOR, kind: 'helper', scale: 1.05, shirt: shade(SHIRTS[hash(s.name) % SHIRTS.length], 0.35), sessionId: s.id, speed: 2.8 });
          chars.set(hid, hc);
        }
        hc.name = hp.type; hc.status = 'working'; hc.leaving = false;
        alive.add(hid);
        const dest = i < CLUSTERS.length && j < 3 ? seats[j + 1] : MEETING_SPOTS[(hash(hid) + j) % MEETING_SPOTS.length];
        goTo(hc, dest);
      });
    });
    for (const [id, c] of chars) {
      if (c.kind === 'boss' || alive.has(id)) continue;
      if (!c.leaving) { c.leaving = true; c.status = 'idle'; goTo(c, ELEVATOR); }
    }
  }

  // ---------------------------------------------------------------- update
  function update(dt) {
    for (const [id, c] of chars) {
      if (c.kind === 'boss' && avatarMode && (keys.size)) {
        let dx = 0, dy = 0;
        if (keys.has('w') || keys.has('arrowup')) { dx -= 1; dy -= 1; }
        if (keys.has('s') || keys.has('arrowdown')) { dx += 1; dy += 1; }
        if (keys.has('a') || keys.has('arrowleft')) { dx -= 1; dy += 1; }
        if (keys.has('d') || keys.has('arrowright')) { dx += 1; dy -= 1; }
        const l = Math.hypot(dx, dy) || 1;
        c.path = []; c.dest = null;
        c.x = Math.max(0.4, Math.min(W - 0.4, c.x + (dx / l) * c.speed * dt));
        c.y = Math.max(0.4, Math.min(D - 0.4, c.y + (dy / l) * c.speed * dt));
        c.walking = dx || dy; c.seated = false;
        if (dx || dy) c.dir = dx - dy >= 0 ? 1 : -1;
        continue;
      }
      if (c.path.length) {
        const p = c.path[0];
        const dx = p.x - c.x, dy = p.y - c.y;
        const dist = Math.hypot(dx, dy);
        const step = c.speed * dt;
        c.walking = true; c.seated = false;
        c.dir = dx - dy >= 0 ? 1 : -1;
        if (dist <= step) { c.x = p.x; c.y = p.y; c.path.shift(); } else { c.x += (dx / dist) * step; c.y += (dy / dist) * step; }
      } else {
        c.walking = false;
        const atSeat = c.dest && c.status !== 'idle' && c.kind !== 'boss' && !c.leaving;
        c.seated = atSeat || (c.kind === 'boss' && !avatarMode);
        if (c.leaving) chars.delete(id);
      }
    }
    // xe chạy quanh toà nhà
    for (const car of cars) car.t = (car.t + car.speed * dt) % 1;
    // robot hút bụi
    const vd = Math.hypot(vacuum.tx - vacuum.x, vacuum.ty - vacuum.y);
    if (vd < 0.1) { vacuum.tx = 1 + Math.random() * 17; vacuum.ty = 8.3 + Math.random() * 0.5 + (Math.random() < 0.5 ? 0 : 4.6); }
    else { vacuum.x += ((vacuum.tx - vacuum.x) / vd) * 0.7 * dt; vacuum.y += ((vacuum.ty - vacuum.y) / vd) * 0.7 * dt; }
    // camera mượt
    const k = Math.min(1, dt * 6);
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.z += (cam.tz - cam.z) * k;
  }

  // ---------------------------------------------------------------- static scene
  function drawGround(t) {
    // vỉa hè + đường + cỏ quanh toà nhà
    floorRect(ctx, -9, -9, W + 18, D + 18, C.grass);
    floorRect(ctx, -6, -6, W + 12, D + 12, C.ground);
    // đường phía trước (y lớn) và bên phải (x lớn)
    floorRect(ctx, -9, D + 3, W + 18, 4, C.road);
    floorRect(ctx, W + 3, -9, 4, D + 18, C.road);
    floorRect(ctx, -9, -8, W + 18, 1.2, C.road);
    for (let x = -8; x < W + 9; x += 2) floorRect(ctx, x, D + 4.92, 1, 0.16, C.roadLine);
    for (let y = -8; y < D + 9; y += 2) floorRect(ctx, W + 4.92, y, 0.16, 1, C.roadLine);
    // vạch qua đường
    for (let i = 0; i < 6; i++) floorRect(ctx, W + 3.2 + i * 0.62, D + 3.3, 0.36, 3.4, 'rgba(240,240,236,.85)');
    for (let i = 0; i < 6; i++) floorRect(ctx, 3.2, D + 3.2 + i * 0.62, 3.6, 0.36, 'rgba(240,240,236,.85)');
    // chân toà nhà
    box(ctx, 0, 0, W, D, 10, -10, C.slab);
  }

  function drawFloors() {
    floorRect(ctx, 0, 0, W, D, C.floor);
    ctx.strokeStyle = C.floorLine; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) { const a = P(x, 6), b = P(x, D); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (let y = 6; y <= D; y++) { const a = P(0, y), b = P(W, y); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
    floorRect(ctx, 0, 6, 19, 2, C.corridor);
    floorRect(ctx, 0, 0, 6, 6, C.server);
    for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if ((x + y) % 2) floorRect(ctx, x, y, 1, 1, 'rgba(255,255,255,.04)');
    floorRect(ctx, 6, 0, 6, 6, C.director);
    for (let x = 6; x < 12; x += 0.5) poly(ctx, [P(x, 0), P(x, 6)], null, 'rgba(60,30,10,.12)');
    floorRect(ctx, 12, 0, 7, 6, C.meeting);
    floorRect(ctx, 19, 0, 7, 8, C.lounge);
    floorRect(ctx, 20.3, 3.2, 4.6, 3.6, C.rug);
    floorRect(ctx, 20.6, 3.5, 4.0, 3.0, shade(C.rug, 0.12));
    floorRect(ctx, 19, 9, 7, 11, C.cafe);
    for (let x = 19; x < 26; x++) for (let y = 9; y < 20; y++) if ((x + y) % 2) floorRect(ctx, x, y, 1, 1, 'rgba(0,0,0,.035)');
    // thảm dưới cụm bàn
    for (const c of CLUSTERS) floorRect(ctx, c.x - 0.6, c.y - 1.3, 5.2, 4.2, 'rgba(90,110,140,.10)');
  }

  function drawBackWalls(t) {
    const wallC = C.wall;
    // tường y = 0
    poly(ctx, [P(0, 0, 0), P(W, 0, 0), P(W, 0, WALL), P(0, 0, WALL)], shade(wallC, -0.05));
    poly(ctx, [P(0, -0.3, WALL), P(W, -0.3, WALL), P(W, 0, WALL), P(0, 0, WALL)], C.wallTop);
    // tường x = 0
    poly(ctx, [P(0, 0, 0), P(0, D, 0), P(0, D, WALL), P(0, 0, WALL)], shade(wallC, -0.13));
    poly(ctx, [P(-0.3, 0, WALL), P(0, 0, WALL), P(0, D, WALL), P(-0.3, D, WALL)], C.wallTop);
    // chân tường
    poly(ctx, [P(0, 0.02, 0), P(W, 0.02, 0), P(W, 0.02, 5), P(0, 0.02, 5)], C.wallDark);
    poly(ctx, [P(0.02, 0, 0), P(0.02, D, 0), P(0.02, D, 5), P(0.02, 0, 5)], shade(C.wallDark, -0.08));
    // tường phòng máy chủ tối màu
    wallRectY0(ctx, 0, 6, 5, WALL, '#3c4652');
    wallRectX0(ctx, 0, 6, 5, WALL, '#323b46');
    // cửa sổ
    const win = night ? C.windowNight : C.window;
    for (const [a, b] of [[7, 9], [9.4, 11.4], [19.6, 21.6], [24, 25.6]]) {
      wallRectY0(ctx, a, b, 26, 64, win, C.frame);
      poly(ctx, [P((a + b) / 2, 0.02, 26), P((a + b) / 2, 0.02, 64)], null, C.frame, 1.5);
    }
    for (const [a, b] of [[9, 11.5], [12.5, 15], [16, 18.5]]) {
      wallRectX0(ctx, a, b, 26, 64, win, C.frame);
      poly(ctx, [P(0.02, (a + b) / 2, 26), P(0.02, (a + b) / 2, 64)], null, C.frame, 1.5);
    }
    // thang máy
    wallRectX0(ctx, 6.3, 7.8, 0, 56, '#8f99a3', C.frame);
    poly(ctx, [P(0.03, 7.05, 0), P(0.03, 7.05, 56)], null, '#5a636c', 1.5);
    wallRectX0(ctx, 6.0, 6.2, 26, 32, '#e9a640');
    // biển "MY OFFICE" trên tường phòng giám đốc
    ctx.save();
    const o = P(6.4, 0.03, 70);
    ctx.setTransform(...wallMat(0.5, o));
    ctx.fillStyle = '#2f5d46'; rr(ctx, 0, 0, 74, 18, 3); ctx.fill();
    ctx.fillStyle = '#f3e7c8'; ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText('MY OFFICE', 10, 9.5);
    ctx.restore();
    // bảng trắng phòng họp
    wallRectY0(ctx, 13, 17.5, 22, 62, '#ffffff', '#9aa3ab');
    ctx.save();
    ctx.setTransform(...wallMat(0.5, P(13.3, 0.03, 58)));
    ctx.fillStyle = '#e46f4f'; ctx.font = '800 8px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textBaseline = 'top';
    ctx.fillText('SHIP IT ✓', 4, 2);
    const bars = [12, 18, 15, 24, 20, 28, 31];
    bars.forEach((b, i) => { ctx.fillStyle = '#3f8fd8'; ctx.fillRect(8 + i * 11, 34 - b, 7, b); });
    ctx.restore();
    // TV phòng máy chủ
    ctx.save();
    ctx.setTransform(...wallMat(-0.5, P(0.03, 4.8, 66)));
    ctx.fillStyle = '#10161d'; rr(ctx, 0, 0, 58, 32, 2); ctx.fill();
    ctx.fillStyle = '#6fe0a0'; ctx.font = '700 11px "JetBrains Mono", monospace'; ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(ramPct)}%`, 6, 5);
    ctx.fillStyle = '#2c3a48'; ctx.fillRect(6, 21, 46, 4);
    ctx.fillStyle = '#e9a640'; ctx.fillRect(6, 21, 46 * ramPct / 100, 4);
    ctx.restore();
    // đồng hồ treo tường
    const cc = P(17.2, 0.03, 70);
    ctx.save(); ctx.setTransform(...wallMat(0.5, cc));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
    const d = new Date(); const a1 = (d.getHours() % 12 + d.getMinutes() / 60) / 12 * 6.283, a2 = d.getMinutes() / 60 * 6.283;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a1) * 3.4, -Math.cos(a1) * 3.4); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a2) * 5, -Math.cos(a2) * 5); ctx.stroke();
    ctx.restore();
  }
  // ma trận vẽ phẳng lên tường: uy = 0.5 cho tường y=0, -0.5 cho tường x=0 (chữ chạy về phía y giảm)
  let viewMat = [1, 0, 0, 1, 0, 0];
  function wallMat(uy, o) {
    const [z, , , , e, f] = viewMat;
    return [z, z * uy, 0, z, z * o[0] + e, z * o[1] + f];
  }

  // ---------------------------------------------------------------- furniture items (sắp theo chiều sâu)
  let ramPct = 70;
  function staticItems() {
    const items = [];
    const add = (k, fn) => items.push({ k, fn });
    // vách kính chia phòng, cắt thành đoạn 1 ô để sắp chiều sâu đúng
    const glassSeg = (x, y, w, d) => add(x + y + (w + d) / 2 + 0.05, () => {
      box(ctx, x, y, w, d, 62, 0, '#c9e2ef', { alpha: 0.28, top: 'rgba(58,68,80,.9)' });
      box(ctx, x, y, w, d, 3, 62, C.frame);
    });
    for (const gx of [6, 12, 19]) for (let y = 0; y < 6; y++) glassSeg(gx - 0.05, y, 0.1, 1);
    for (let x = 0; x < 19; x++) {
      const isDoor = Object.values(ROOMS).some((r) => x + 0.5 > r.door - 0.8 && x + 0.5 < r.door + 0.8);
      if (!isDoor) glassSeg(x, 5.95, 1, 0.1);
    }
    // phòng máy chủ: tủ rack
    for (const ry of [0.4, 3.0]) for (let i = 0; i < 4; i++) {
      const x = 0.5 + i * 1.25, y = ry;
      add(x + y + 1.2, (t) => {
        box(ctx, x, y, 1.0, 1.1, 64, 0, '#252c35');
        for (let r = 0; r < 7; r++) {
          const z = 8 + r * 7.5;
          poly(ctx, [P(x + 0.08, y + 1.1, z), P(x + 0.92, y + 1.1, z), P(x + 0.92, y + 1.1, z + 5), P(x + 0.08, y + 1.1, z + 5)], '#323b46');
          const on = Math.sin(t * 3 + i * 1.7 + r * 2.3 + ry) > 0;
          const [lx, ly] = P(x + 0.2, y + 1.1, z + 2.5);
          ctx.fillStyle = on ? '#4fe08a' : '#1f6b3f'; ctx.fillRect(lx - 1, ly - 1, 2.4, 2.4);
          const [lx2, ly2] = P(x + 0.34, y + 1.1, z + 2.5);
          ctx.fillStyle = Math.sin(t * 5 + r + i) > 0.6 ? '#ffb547' : '#5a4320'; ctx.fillRect(lx2 - 1, ly2 - 1, 2.4, 2.4);
        }
      });
    }
    // phòng giám đốc
    add(7.6 + 1.8 + 1.2, () => { box(ctx, 7.6, 1.2, 2.6, 1.2, 26, 0, C.wood); box(ctx, 7.6, 1.2, 2.6, 0.12, 4, 26, C.woodDark); box(ctx, 8.2, 1.4, 0.9, 0.12, 14, 26, C.dark, { left: '#7fb8f0' }); box(ctx, 9.5, 1.6, 0.3, 0.3, 3, 26, '#e7e2d6'); });
    add(6.4 + 0.5 + 0.6, () => { box(ctx, 6.3, 0.3, 0.7, 2.4, 68, 0, C.woodDark); for (let s = 0; s < 4; s++) for (let b = 0; b < 6; b++) box(ctx, 6.95, 0.45 + b * 0.36, 0.05, 0.28, 10 + (b % 3) * 2, 8 + s * 15, ['#c4553f', '#3f7fc4', '#e2b23f', '#4c9a6a'][(s + b) % 4]); });
    add(11.0 + 4.8, () => plant(11.0, 4.8, 1.1));
    add(10.8 + 0.5, () => { box(ctx, 10.6, 0.4, 0.1, 0.1, 50, 0, C.dark); poly(ctx, [P(10.35, 0.15, 48), P(10.95, 0.15, 48), P(10.95, 0.75, 48), P(10.35, 0.75, 48)], night ? '#ffd27a' : '#f2ead8'); });
    // phòng họp
    add(13.4 + 2.6 + 2.1, () => { box(ctx, 13.4, 2.6, 4.6, 1.3, 22, 0, '#f4f4f2'); box(ctx, 14.2, 2.9, 0.5, 0.4, 2, 22, '#c9d1d8'); box(ctx, 16.6, 3.1, 0.6, 0.3, 2, 22, '#e46f4f'); });
    for (const s of MEETING_SPOTS) add(s.x + s.y - 0.2, () => chair(s.x, s.y, s.y < 3 ? 1 : -1, '#2f3640'));
    add(18.3 + 5.3, () => plant(18.3, 5.3, 1));
    // phòng nghỉ
    add(20.4 + 0.4 + 1, () => { box(ctx, 20.2, 0.3, 4.0, 0.8, 30, 0, '#8b6a4c'); box(ctx, 20.2, 0.3, 4.0, 0.8, 3, 30, '#e9e5dc'); box(ctx, 20.6, 0.4, 0.7, 0.55, 22, 33, '#2b323b', { left: '#4c5560' }); box(ctx, 22.0, 0.45, 0.5, 0.45, 12, 33, '#d84b3f'); box(ctx, 23.2, 0.4, 0.6, 0.5, 6, 33, '#f2efe8'); });
    add(21 + 6.1, () => { box(ctx, 20.6, 5.6, 3.2, 1.0, 12, 0, C.sofa); box(ctx, 20.6, 6.3, 3.2, 0.35, 26, 0, shade(C.sofa, -0.1)); });
    add(22.3 + 4.4, () => { box(ctx, 21.6, 4.0, 1.5, 0.8, 11, 0, C.wood); });
    add(24.8 + 3.0, () => { box(ctx, 24.2, 2.6, 1.0, 1.1, 14, 0, '#d97e3f'); box(ctx, 25.0, 2.6, 0.25, 1.1, 26, 0, shade('#d97e3f', -0.1)); });
    add(25.2 + 6.8, () => plant(25.3, 7.0, 1.3));
    add(19.6 + 7.4, () => { box(ctx, 19.3, 7.2, 0.5, 0.5, 46, 0, '#6e7781'); poly(ctx, [P(19.0, 6.9, 44), P(20.1, 6.9, 44), P(20.1, 8.0, 44), P(19.0, 8.0, 44)], night ? '#ffd27a' : '#fbf3df'); });
    // quán cà phê: bàn tròn
    const tables = [[21.5, 11.0], [24.0, 12.0], [21.8, 15.0], [24.3, 16.2], [21.0, 18.3]];
    for (const [x, y] of tables) {
      add(x + y + 0.3, () => { box(ctx, x - 0.08, y - 0.08, 0.16, 0.16, 18, 0, C.metal); box(ctx, x - 0.55, y - 0.55, 1.1, 1.1, 2.5, 18, '#ffffff'); box(ctx, x - 0.1, y - 0.2, 0.18, 0.18, 4, 20.5, ['#e9a640', '#e46f4f', '#46b07e'][Math.floor(x) % 3]); });
    }
    add(25.3 + 19.2, () => plant(25.3, 19.3, 1.2));
    add(19.4 + 9.4, () => plant(19.4, 9.4, 0.9));
    // khu làm việc: cụm bàn + ghế
    CLUSTERS.forEach((cl, ci) => {
      const seats = seatsOf(cl);
      seats.forEach((s, si) => add(s.x + s.y - 0.3, () => chair(s.x, s.y + (s.face > 0 ? -0.15 : 0.15), s.face, '#3a434e')));
      add(cl.x + 2 + cl.y + 0.8, (t) => {
        box(ctx, cl.x, cl.y, 4, 1.6, 22, 0, C.desk);
        box(ctx, cl.x + 1.98, cl.y + 0.1, 0.04, 1.4, 6, 22, '#cfd4d8');
        box(ctx, cl.x, cl.y + 0.78, 4, 0.04, 9, 22, '#cfd4d8');
        seats.forEach((s, si) => {
          const north = s.face > 0;
          const my = north ? cl.y + 0.5 : cl.y + 1.0;
          const on = seatBusy(ci, si);
          box(ctx, s.x - 0.42, my, 0.84, 0.08, 15, 26, C.dark, { left: north ? '#20262d' : (on ? (night ? '#9fd2ff' : '#7fb8f0') : '#3a4552') });
          box(ctx, s.x - 0.06, my + 0.02, 0.12, 0.06, 4, 22, C.metal);
          box(ctx, s.x - 0.3, north ? cl.y + 0.15 : cl.y + 1.2, 0.6, 0.22, 1.2, 22, '#d9dde1');
          if (si === 1) box(ctx, s.x + 0.7, cl.y + 1.25, 0.18, 0.18, 5, 22, ['#e46f4f', '#3f8fd8', '#d9a62c'][ci % 3]);
        });
      });
    });
    add(0.6 + 19.4, () => plant(0.6, 19.3, 1.2));
    add(18.4 + 19.2, () => plant(18.4, 19.3, 1.1));
    add(18.4 + 8.6, () => plant(18.3, 8.6, 1));
    // cây ngoài đường
    for (const [x, y] of [[-2, 4], [-2, 10], [-2, 16], [4, D + 1.6], [11, D + 1.6], [18, D + 1.6], [W + 1.6, 3], [W + 1.6, 12]]) add(x + y + 0.5, () => tree(x, y));
    // đèn giao thông
    for (const [x, y] of [[W + 2.4, D + 2.4], [-1.6, D + 2.4]]) add(x + y, (t) => { box(ctx, x, y, 0.12, 0.12, 70, 0, '#30363d'); box(ctx, x - 0.12, y - 0.12, 0.36, 0.3, 22, 62, '#1f2429'); const g = Math.floor(t / 4) % 2; const [lx, ly] = P(x + 0.06, y + 0.18, 76); ctx.fillStyle = g ? '#4fe08a' : '#ff5a4a'; ctx.beginPath(); ctx.arc(lx, ly, 2.4, 0, 7); ctx.fill(); });
    return items;
  }
  let seatBusy = () => false;

  function chair(x, y, face, color) {
    box(ctx, x - 0.25, y - 0.25, 0.5, 0.5, 3, 11, color);
    box(ctx, x - 0.04, y - 0.04, 0.08, 0.08, 11, 0, C.metal);
    const by = face > 0 ? y - 0.3 : y + 0.22;
    box(ctx, x - 0.25, by, 0.5, 0.08, 14, 14, shade(color, 0.08));
  }
  function plant(x, y, s) {
    box(ctx, x - 0.25 * s, y - 0.25 * s, 0.5 * s, 0.5 * s, 12 * s, 0, C.pot);
    const [px, py] = P(x, y, 12 * s);
    ctx.fillStyle = shade(C.plant, -0.15);
    for (const [ox, oy, r] of [[-6, -10, 8], [6, -12, 8], [0, -20, 9], [0, -8, 8]]) { ctx.beginPath(); ctx.arc(px + ox * s, py + oy * s, r * s, 0, 7); ctx.fill(); }
    ctx.fillStyle = C.plant;
    for (const [ox, oy, r] of [[-4, -13, 6], [5, -15, 6], [0, -22, 6]]) { ctx.beginPath(); ctx.arc(px + ox * s, py + oy * s, r * s, 0, 7); ctx.fill(); }
  }
  function tree(x, y) {
    box(ctx, x - 0.1, y - 0.1, 0.2, 0.2, 26, 0, '#6b4b33');
    const [px, py] = P(x, y, 26);
    ctx.fillStyle = '#4f8f45';
    for (const [ox, oy, r] of [[-10, -6, 13], [10, -6, 13], [0, -18, 15], [0, -2, 12]]) { ctx.beginPath(); ctx.arc(px + ox, py + oy, r, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#67a85a';
    for (const [ox, oy, r] of [[-5, -14, 8], [6, -16, 7]]) { ctx.beginPath(); ctx.arc(px + ox, py + oy, r, 0, 7); ctx.fill(); }
  }

  function carItems(t) {
    return cars.map((car) => {
      // làn 0: đường phía trước (chạy theo x), làn 1: đường bên phải (chạy theo y)
      const pos = -10 + car.t * (W + 22);
      const x = car.lane === 0 ? pos : W + 3.6 + 0.2;
      const y = car.lane === 0 ? D + 3.6 : D + 12 - car.t * (D + 22);
      const w = car.lane === 0 ? 1.8 : 0.9, d = car.lane === 0 ? 0.9 : 1.8;
      return { k: x + y + 1.3, fn: () => {
        box(ctx, x, y, w, d, 10, 3, car.color);
        box(ctx, x + (car.lane === 0 ? 0.35 : 0.08), y + (car.lane === 0 ? 0.08 : 0.35), car.lane === 0 ? 1.0 : 0.74, car.lane === 0 ? 0.74 : 1.0, 8, 13, '#2c3a4a', { top: shade(car.color, 0.1) });
        if (night) { const [hx, hy] = P(x + w, y + d / 2, 8); ctx.fillStyle = 'rgba(255,230,160,.9)'; ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, 7); ctx.fill(); }
      } };
    });
  }

  // ---------------------------------------------------------------- character
  const labels = [];
  function drawChar(c, t) {
    const [sx, sy] = P(c.x, c.y);
    const s = c.scale;
    const bob = c.walking ? Math.abs(Math.sin(t * 10 + c.phase)) * 2 : 0;
    const seatDrop = c.seated ? 7 : 0;
    // bóng
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(sx, sy, 9 * s, 4.5 * s, 0, 0, 7); ctx.fill();
    if (c.sessionId === selectedId && c.kind !== 'helper') {
      ctx.strokeStyle = '#e9a640'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, 14, 7, 0, 0, 7); ctx.stroke();
    }
    const base = sy - seatDrop - bob;
    // chân
    if (!c.seated) {
      const sw = c.walking ? Math.sin(t * 10 + c.phase) * 3 : 0;
      ctx.fillStyle = '#2d3440';
      ctx.fillRect(sx - 4 * s + sw * 0.4, base - 11 * s, 3.2 * s, 11 * s);
      ctx.fillRect(sx + 1 * s - sw * 0.4, base - 11 * s, 3.2 * s, 11 * s);
    } else {
      ctx.fillStyle = '#2d3440';
      ctx.fillRect(sx - 4.5 * s, base - 5 * s, 9 * s, 4 * s);
    }
    // thân
    const bodyTop = base - (c.seated ? 20 : 25) * s;
    ctx.fillStyle = c.shirt;
    rr(ctx, sx - 6.5 * s, bodyTop, 13 * s, 15 * s, 4 * s); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(sx + 1 * s, bodyTop + 2, 5 * s, 12 * s);
    // tay
    ctx.fillStyle = shade(c.shirt, -0.12);
    const typing = c.seated && c.status === 'working' ? Math.sin(t * 18 + c.phase) * 1.2 : 0;
    ctx.fillRect(sx - 8.5 * s, bodyTop + 2 + typing, 3 * s, 10 * s);
    ctx.fillRect(sx + 5.5 * s, bodyTop + 2 - typing, 3 * s, 10 * s);
    // đầu
    const hy = bodyTop - 7 * s;
    ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(sx, hy, 7.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    if (c.hairStyle === 0) { ctx.arc(sx, hy - 1.5 * s, 7.8 * s, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); }
    else if (c.hairStyle === 1) { ctx.arc(sx, hy - 1 * s, 8 * s, Math.PI * 0.9, Math.PI * 2.1); ctx.fill(); ctx.fillRect(sx - 8 * s, hy - 1, 3 * s, 8 * s); ctx.fillRect(sx + 5 * s, hy - 1, 3 * s, 8 * s); }
    else { ctx.arc(sx, hy - 2 * s, 7.6 * s, Math.PI, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(sx + 3 * s, hy - 9 * s, 3.5 * s, 0, 7); ctx.fill(); }
    // mắt (nhìn theo hướng đi)
    if (!(c.seated && c.face > 0) || c.kind === 'boss') {
      ctx.fillStyle = '#222';
      const ex = (c.dir || 1) * 1.5;
      ctx.fillRect(sx - 3 * s + ex, hy + 0.5, 1.6, 2); ctx.fillRect(sx + 1.6 * s + ex, hy + 0.5, 1.6, 2);
    }
    if (c.kind === 'boss') { ctx.fillStyle = '#e9a640'; ctx.fillRect(sx - 1.2, bodyTop + 1, 2.4, 9); }
    hitboxes.push({ id: c.sessionId, x: sx, y: hy, r: 16, kind: c.kind });
    // bong bóng trạng thái
    if (c.status === 'waiting') {
      const by = hy - 20 - Math.abs(Math.sin(t * 4)) * 4;
      ctx.fillStyle = '#e9a640'; ctx.beginPath(); ctx.arc(sx, by, 8, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 3, by + 6); ctx.lineTo(sx, by + 11); ctx.lineTo(sx + 3, by + 6); ctx.fill();
      ctx.fillStyle = '#1b1305'; ctx.font = '800 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', sx, by + 0.5);
    } else if (c.status === 'working' && c.seated && c.kind !== 'helper') {
      const by = hy - 17;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; rr(ctx, sx + 6, by - 6, 20, 11, 5); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = Math.floor(t * 3) % 3 === i ? '#3f8fd8' : '#a9b4c0'; ctx.beginPath(); ctx.arc(sx + 11 + i * 5, by - 0.5, 1.6, 0, 7); ctx.fill(); }
    } else if (c.status === 'idle' && !c.walking && c.kind === 'agent') {
      // cốc cà phê + hơi nóng
      ctx.fillStyle = '#fff'; ctx.fillRect(sx + 7, bodyTop + 4, 5, 6); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx + 13, bodyTop + 7, 2, -1.5, 1.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); const st = Math.sin(t * 3) * 1.5; ctx.moveTo(sx + 9 + st, bodyTop + 2); ctx.quadraticCurveTo(sx + 11, bodyTop - 2, sx + 9 - st, bodyTop - 6); ctx.stroke();
    }
    if (showLabels && c.kind !== 'helper') labels.push({ wx: sx, wy: hy - (c.status === 'waiting' ? 34 : 15), text: c.kind === 'boss' ? 'Giám đốc (bạn)' : c.name, color: c.kind === 'boss' ? '#e9a640' : statusColor(c.status), strong: c.sessionId === selectedId });
  }
  function statusColor(s) { return s === 'working' ? '#3fbf7f' : s === 'waiting' ? '#e9a640' : '#8b95a7'; }

  // ---------------------------------------------------------------- frame
  let items = null, last = 0, running = true;
  function frame(ts) {
    if (!running) return;
    const t = ts / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    update(dt);
    render(t);
    requestAnimationFrame(frame);
  }

  function render(t) {
    const w = cw, h = ch;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = night ? '#2a3140' : '#6f7a84';
    ctx.fillRect(0, 0, w * dpr, h * dpr);
    const z = cam.z * dpr;
    viewMat = [z, 0, 0, z, (w / 2) * dpr - cam.x * z, (h / 2) * dpr - cam.y * z];
    ctx.setTransform(...viewMat);
    hitboxes = []; labels.length = 0;

    drawGround(t);
    drawFloors();
    drawBackWalls(t);

    // robot hút bụi
    const list = items.concat(carItems(t));
    list.push({ k: vacuum.x + vacuum.y, fn: () => { box(ctx, vacuum.x - 0.22, vacuum.y - 0.22, 0.44, 0.44, 4, 0, '#2b2f36'); const [vx, vy] = P(vacuum.x, vacuum.y, 4.5); ctx.fillStyle = Math.sin(t * 6) > 0 ? '#4fe08a' : '#2a6b47'; ctx.fillRect(vx - 1, vy - 1, 2, 2); } });
    for (const c of chars.values()) list.push({ k: c.x + c.y + (c.seated ? 0.05 : 0), fn: () => drawChar(c, t) });
    list.sort((a, b) => a.k - b.k);
    for (const it of list) it.fn(t);

    // nhãn cụm bàn
    if (showLabels && cam.z > 0.85) {
      for (const c of chars.values()) {
        if (c.kind !== 'agent' || !c.cluster || c.status === 'idle' || c.leaving) continue;
        const [lx, ly] = P(c.cluster.x + 2, c.cluster.y + 0.8, 34);
        labels.push({ wx: lx, wy: ly + 26, text: `Nhóm ${c.name} · ${1 + (c.helperCount || 0)}`, color: '#3f8fd8', small: true });
      }
    }

    // ban đêm: phủ tối + quầng sáng
    if (night) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(12,20,48,.48)';
      ctx.fillRect(0, 0, w * dpr, h * dpr);
      ctx.globalCompositeOperation = 'lighter';
      ctx.setTransform(...viewMat);
      const glow = (x, y, z, r, a) => { const [gx, gy] = P(x, y, z); const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(255,200,120,${a})`); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(gx - r, gy - r, r * 2, r * 2); };
      for (const c of chars.values()) if (c.seated && c.status !== 'idle' && c.kind !== 'boss') glow(c.x, c.y, 20, 46, 0.22);
      glow(10.6, 0.5, 46, 70, 0.25); glow(19.5, 7.4, 44, 70, 0.25); glow(22, 0.8, 30, 60, 0.15);
      for (const x of [3, 9, 15]) for (const y of [11, 16]) glow(x, y, 70, 120, 0.08);
      ctx.restore();
    }

    // nhãn vẽ theo toạ độ màn hình cho nét
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // ưu tiên: đang chọn > chờ duyệt > tên người > nhãn nhóm; nhãn sau đè lên nhãn trước thì bỏ
    const prio = (L) => (L.strong ? 0 : L.color === '#e9a640' ? 1 : L.small ? 3 : 2);
    labels.sort((a, b) => prio(a) - prio(b));
    const placed = [];
    for (const L of labels) {
      const sx = (L.wx - cam.x) * cam.z + w / 2, sy = (L.wy - cam.y) * cam.z + h / 2;
      if (sx < -100 || sx > w + 100 || sy < -40 || sy > h + 40) continue;
      ctx.font = `${L.strong ? 700 : 600} ${L.small ? 10 : 11}px "Be Vietnam Pro", system-ui, sans-serif`;
      const tw = ctx.measureText(L.text).width;
      const pw = tw + (L.small ? 14 : 22), ph = L.small ? 17 : 20;
      const x = sx - pw / 2;
      let y = sy - ph;
      const hit = (yy) => placed.find((r) => x < r.x + r.w + 2 && x + pw + 2 > r.x && yy < r.y + r.h + 2 && yy + ph + 2 > r.y);
      let tries = 0;
      while (hit(y) && tries < 3) { y = hit(y).y - ph - 3; tries++; }
      if (hit(y)) continue;
      placed.push({ x, y, w: pw, h: ph });
      ctx.fillStyle = L.strong ? 'rgba(233,166,64,.96)' : 'rgba(22,28,38,.88)';
      rr(ctx, x, y, pw, ph, ph / 2); ctx.fill();
      if (!L.small) { ctx.fillStyle = L.strong ? '#1b1305' : L.color; ctx.beginPath(); ctx.arc(x + 9, y + ph / 2, 3, 0, 7); ctx.fill(); }
      ctx.fillStyle = L.strong ? '#1b1305' : '#f1f3f6'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(L.text, x + (L.small ? 7 : 16), y + ph / 2 + 0.5);
    }
    ctx.textAlign = 'left';
  }

  // ---------------------------------------------------------------- camera & input
  const VIEWS = { all: { x: W / 2 - 1, y: D / 2, z: 1.15 }, desks: { x: 9, y: 13.5, z: 1.7 }, meeting: { x: 15.5, y: 3, z: 2.1 }, servers: { x: 3, y: 3, z: 2.1 } };
  function computeFit() {
    const bw = (W + D + 10) * T, bh = (W + D + 8) * H + WALL;
    cam.fit = Math.min(cw / bw, ch / bh) * 1.12;
  }
  function setView(name) {
    const v = VIEWS[name] || VIEWS.all;
    const [sx, sy] = P(v.x, v.y);
    cam.tx = sx; cam.ty = sy - (name === 'all' ? 20 : 0); cam.tz = cam.fit * v.z * (name === 'all' && cw < 600 ? 1.35 : 1);
    onZoom(cam.tz / cam.fit);
  }
  function focusOn(id) {
    const c = chars.get(id);
    if (!c) return;
    const [sx, sy] = P(c.dest?.x ?? c.x, c.dest?.y ?? c.y);
    cam.tx = sx; cam.ty = sy - 20; cam.tz = Math.max(cam.tz, cam.fit * 1.9);
    onZoom(cam.tz / cam.fit);
  }
  function zoomBy(f) {
    cam.tz = Math.max(cam.fit * 0.6, Math.min(cam.fit * 4, cam.tz * f));
    onZoom(cam.tz / cam.fit);
  }
  function screenToWorld(px, py) {
    const sx = (px - cw / 2) / cam.z + cam.x, sy = (py - ch / 2) / cam.z + cam.y;
    return { x: (sx / T + sy / H) / 2, y: (sy / H - sx / T) / 2 };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const first = !cw;
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const oldFit = cam.fit;
    computeFit();
    if (first) { setView('all'); cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; }
    else { const k = cam.fit / oldFit; cam.z *= k; cam.tz *= k; }
  }

  function bindInput() {
    const pointers = new Map();
    let drag = null, pinch = null, moved = 0;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, cx: cam.tx, cy: cam.ty };
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.tz }; drag = null; }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        cam.tz = Math.max(cam.fit * 0.6, Math.min(cam.fit * 4, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
        onZoom(cam.tz / cam.fit);
      } else if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
        if (moved > 4) canvas.classList.add('dragging');
        cam.tx = drag.cx - dx / cam.z; cam.ty = drag.cy - dy / cam.z;
        cam.x = cam.tx; cam.y = cam.ty;
      }
    });
    const end = (e) => {
      const wasTap = pointers.size === 1 && moved < 6 && !pinch;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { drag = null; canvas.classList.remove('dragging'); }
      if (wasTap && e.type === 'pointerup') tap(e);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!avatarMode || /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.add(k); e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
  }

  function tap(e) {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const hb of hitboxes) {
      const sx = (hb.x - cam.x) * cam.z + cw / 2, sy = (hb.y - cam.y) * cam.z + ch / 2;
      const d = Math.hypot(px - sx, py - (sy + 8 * cam.z));
      if (d < Math.max(18, hb.r * cam.z) && d < bd && hb.kind !== 'boss') { bd = d; best = hb; }
    }
    if (best) { onSelect(best.id); return; }
    if (avatarMode) {
      const w = screenToWorld(px, py);
      if (w.x > 0.3 && w.x < W - 0.3 && w.y > 0.3 && w.y < D - 0.3) {
        const boss = chars.get('__boss');
        boss.dest = null; goTo(boss, w);
      }
    }
  }

  // ---------------------------------------------------------------- public api
  window.Office = {
    init(el, opts = {}) {
      canvas = el; ctx = canvas.getContext('2d');
      onSelect = opts.onSelect || onSelect; onZoom = opts.onZoom || onZoom;
      items = staticItems();
      const boss = makeChar('__boss', { ...BOSS_SEAT, kind: 'boss', shirt: '#2f3a48', speed: 3 });
      boss.status = 'boss'; boss.dest = { ...BOSS_SEAT }; boss.face = 1; boss.dir = 1;
      chars.set('__boss', boss);
      resize();
      new ResizeObserver(resize).observe(canvas);
      bindInput();
      document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = 0; requestAnimationFrame(frame); } });
      requestAnimationFrame(frame);
    },
    setSessions(list, sel) {
      setSessions(list, sel);
      // ghế nào đang có người làm việc thì bật màn hình
      const busy = new Set();
      for (const c of chars.values()) {
        if (!c.dest || c.status === 'idle' || c.leaving || c.kind === 'boss') continue;
        CLUSTERS.forEach((cl, ci) => seatsOf(cl).forEach((s, si) => { if (Math.abs(s.x - c.dest.x) < 0.01 && Math.abs(s.y - c.dest.y) < 0.01) busy.add(ci + ':' + si); }));
      }
      seatBusy = (ci, si) => busy.has(ci + ':' + si);
    },
    setSelected(id) { selectedId = id; },
    setView, zoomBy, focusOn,
    setRam(p) { ramPct = p; },
    setNight(v) { night = v; },
    isNight: () => night,
    toggleLabels() { showLabels = !showLabels; return showLabels; },
    setAvatar(on) {
      avatarMode = on;
      const boss = chars.get('__boss');
      if (!on) { boss.dest = null; goTo(boss, BOSS_SEAT); }
      else { boss.seated = false; focusOn('__boss'); cam.tz = cam.fit * 2.2; onZoom(2.2); }
    },
    screenshot() { return canvas.toDataURL('image/png'); },
  };
})();
