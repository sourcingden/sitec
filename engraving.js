// Dithered, interactive dot art. Two images (one per side of the site) are
// broken into dots with Atkinson dithering; one pool of particles holds a home
// in each image, so switching sides makes the dots fly from one picture into
// the other. Dots run from the pointer, scatter on tap and spring back home.
// At night they pulse at 124 bpm.
(() => {
  const canvas = document.getElementById("engraving");
  if (!canvas || !canvas.getContext) return;
  const hero = canvas.closest(".art");
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TARGET_COLS = 300; // dither columns at any width, so phones keep the detail
  let CELL = 2;            // CSS px per dither cell, set in build()
  let RADIUS = 64;         // pointer repulsion radius, CSS px
  let dot = 1;             // dot size in device px
  const FORCE = 5.5;
  const SPRING = 0.055;
  const DAMP = 0.86;
  const BEAT_MS = 60000 / 124;

  // { day: { src, mid, spread }, night: {...} } — mid/spread shape the contrast S-curve
  const SOURCES = JSON.parse(canvas.dataset.images);
  const SIDES = Object.keys(SOURCES);
  const images = {};
  for (const s of SIDES) { images[s] = new Image(); images[s].src = SOURCES[s].src; }

  const ctx = canvas.getContext("2d");
  let cssW = 0, cssH = 0, dpr = 1, imageData = null, buf = null;
  let n = 0, hx, hy, x, y, vx, vy;
  const homes = {};         // side -> { x: Float32Array(n), y: Float32Array(n) }
  let side = SIDES.includes(root.dataset.side) ? root.dataset.side : SIDES[0];
  let ink = 0, inkHot = 0;  // packed ABGR colours
  let pointer = { x: 0, y: 0, vx: 0, vy: 0, on: false };
  let running = false, visible = true, nextBeat = 0;
  const debug = (window.__engraving = { frames: 0, particles: 0, running: false });

  function packColor(css, alpha) {
    const c = document.createElement("canvas").getContext("2d");
    c.fillStyle = css;
    const hex = c.fillStyle; // normalised to #rrggbb
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return ((Math.round(alpha * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  function readColors() {
    const cs = getComputedStyle(root);
    const dark = root.dataset.theme === "dark";
    ink = packColor(cs.getPropertyValue("--fg").trim(), dark ? 0.8 : 0.86);
    inkHot = packColor(cs.getPropertyValue("--accent").trim(), 0.95);
  }

  // Dither one image at grid resolution; returns dot centres in CSS px (raster order)
  function dither(img, { mid, spread }, cols, rows) {
    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const o = off.getContext("2d", { willReadFrequently: true });
    o.imageSmoothingQuality = "high";
    o.drawImage(img, 0, 0, cols, rows);
    const px = o.getImageData(0, 0, cols, rows).data;
    const lum = new Float32Array(cols * rows);
    // an S-curve pulls blurred detail apart into ink and paper before dithering,
    // so lines stay crisp instead of turning into a flat grey checkerboard
    for (let i = 0; i < lum.length; i++) {
      const l = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
      lum[i] = 255 / (1 + Math.exp(-(l - mid) / spread));
    }
    // Atkinson dithering: spreads 6/8 of the error, which keeps highlights airy
    const xs = [], ys = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const old = lum[i];
        const val = old < 128 ? 0 : 255;
        if (val === 0) {
          // pixel centres: sub-pixel wobble while settling doesn't flip dots between pixels
          xs.push((Math.floor((c + 0.5) * CELL * dpr) + 0.5) / dpr);
          ys.push((Math.floor((r + 0.5) * CELL * dpr) + 0.5) / dpr);
        }
        const e = (old - val) / 8;
        if (c + 1 < cols) lum[i + 1] += e;
        if (c + 2 < cols) lum[i + 2] += e;
        if (r + 1 < rows) {
          if (c > 0) lum[i + cols - 1] += e;
          lum[i + cols] += e;
          if (c + 1 < cols) lum[i + cols + 1] += e;
        }
        if (r + 2 < rows) lum[i + 2 * cols] += e;
      }
    }
    return { xs, ys };
  }

  function build() {
    const w = canvas.clientWidth;
    const ref = images[SIDES[0]];
    if (!w || SIDES.some((s) => !images[s].naturalWidth)) return;
    cssW = w;
    cssH = Math.round(w * ref.naturalHeight / ref.naturalWidth);
    dpr = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1)));
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    imageData = ctx.createImageData(canvas.width, canvas.height);
    buf = new Uint32Array(imageData.data.buffer);
    CELL = Math.min(2.2, Math.max(1, cssW / TARGET_COLS));
    dot = Math.max(1, Math.round(CELL * dpr * 0.5));
    RADIUS = cssW < 480 ? 52 : 64;

    const cols = Math.floor(cssW / CELL), rows = Math.floor(cssH / CELL);
    const sets = {};
    for (const s of SIDES) sets[s] = dither(images[s], SOURCES[s], cols, rows);
    n = Math.max(...SIDES.map((s) => sets[s].xs.length));

    // Pair dots in raster order, so the morph flows top-to-bottom instead of
    // exploding; the smaller image is padded with duplicates spread evenly
    for (const s of SIDES) {
      const { xs, ys } = sets[s], m = xs.length;
      const hxS = new Float32Array(n), hyS = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const j = Math.min(m - 1, Math.floor(i * m / n));
        hxS[i] = xs[j]; hyS[i] = ys[j];
      }
      homes[s] = { x: hxS, y: hyS };
    }
    hx = new Float32Array(homes[side].x); hy = new Float32Array(homes[side].y);
    x = new Float32Array(hx); y = new Float32Array(hy);
    vx = new Float32Array(n); vy = new Float32Array(n);

    debug.particles = n;
    debug.side = side;
    debug.maxDisp = () => { let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(x[i] - hx[i]) + Math.abs(y[i] - hy[i])); return m; };
    readColors();
    draw();
    hero.classList.add("art-ready");
  }

  function draw() {
    buf.fill(0);
    const W = canvas.width, H = canvas.height, s = dpr, z = dot;
    for (let i = 0; i < n; i++) {
      const px = (x[i] * s) | 0, py = (y[i] * s) | 0;
      if (px < 0 || py < 0 || px > W - z || py > H - z) continue;
      const dx = x[i] - hx[i], dy = y[i] - hy[i];
      const col = dx * dx + dy * dy > 16 ? inkHot : ink;
      let o = py * W + px;
      for (let a = 0; a < z; a++, o += W) for (let b = 0; b < z; b++) buf[o + b] = col;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function step(now) {
    debug.frames++;
    const beating = !reduced && root.dataset.theme === "dark";
    let kick = 0;
    if (beating && now >= nextBeat) { kick = 0.9; nextBeat = now + BEAT_MS; }
    const cx = cssW / 2, cy = cssH / 2;
    const R2 = RADIUS * RADIUS;
    let energy = 0;
    for (let i = 0; i < n; i++) {
      let ax = (hx[i] - x[i]) * SPRING, ay = (hy[i] - y[i]) * SPRING;
      if (pointer.on) {
        const dx = x[i] - pointer.x, dy = y[i] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (1 - d / RADIUS);
          const ff = f * f * FORCE;
          ax += (dx / d) * ff + pointer.vx * f * 0.12;
          ay += (dy / d) * ff + pointer.vy * f * 0.12;
        }
      }
      if (kick) {
        const dx = hx[i] - cx, dy = hy[i] - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
        const k = kick * (0.4 + Math.random() * 0.6);
        ax += (dx / d) * k; ay += (dy / d) * k;
      }
      vx[i] = (vx[i] + ax) * DAMP;
      vy[i] = (vy[i] + ay) * DAMP;
      x[i] += vx[i]; y[i] += vy[i];
      const e = Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(x[i] - hx[i]) + Math.abs(y[i] - hy[i]);
      if (e > energy) energy = e;
    }
    pointer.vx *= 0.5; pointer.vy *= 0.5;
    draw();

    const settled = energy < 0.08 && !pointer.on && !beating;
    if (settled) {
      x.set(hx); y.set(hy); vx.fill(0); vy.fill(0);
      draw();
    }
    if (settled || !visible || document.hidden) { running = false; debug.running = false; return; }
    requestAnimationFrame(step);
  }

  function wake() {
    if (running || reduced || !n || !visible || document.hidden) return;
    running = true; debug.running = true;
    requestAnimationFrame(step);
  }

  function scatter() {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 11;
      vx[i] += Math.cos(a) * sp; vy[i] += Math.sin(a) * sp;
    }
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    wake();
  }

  // Fly the dots into the other side's picture
  function setSide(next) {
    if (!SIDES.includes(next) || next === side) return;
    side = next;
    debug.side = side;
    if (!n) return;
    hx.set(homes[side].x); hy.set(homes[side].y);
    readColors();
    if (reduced) { x.set(hx); y.set(hy); draw(); return; }
    for (let i = 0; i < n; i++) {
      vx[i] += (Math.random() - 0.5) * 4; vy[i] += (Math.random() - 0.5) * 4;
    }
    wake();
  }
  window.dots = { setSide, scatter };

  // ---------- input ----------
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let down = null;
  if (!reduced) {
    canvas.addEventListener("pointermove", (e) => {
      const p = local(e);
      if (pointer.on) { pointer.vx = p.x - pointer.x; pointer.vy = p.y - pointer.y; }
      pointer.x = p.x; pointer.y = p.y; pointer.on = true;
      wake();
    });
    canvas.addEventListener("pointerdown", (e) => {
      const p = local(e);
      down = { x: p.x, y: p.y, t: performance.now() };
      pointer.x = p.x; pointer.y = p.y; pointer.vx = pointer.vy = 0; pointer.on = true;
      wake();
    });
    canvas.addEventListener("pointerup", (e) => {
      const p = local(e);
      if (down && Math.hypot(p.x - down.x, p.y - down.y) < 8 && performance.now() - down.t < 400) scatter();
      down = null;
      if (e.pointerType !== "mouse") pointer.on = false;
    });
    const leave = () => { pointer.on = false; down = null; };
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointercancel", leave);
    canvas.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); scatter(); }
    });
  }

  document.addEventListener("themechange", () => { if (n) { readColors(); draw(); wake(); } });
  document.addEventListener("visibilitychange", wake);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(canvas);

  let lastW = 0, t = 0;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (canvas.clientWidth !== lastW) { lastW = canvas.clientWidth; build(); wake(); }
    }, 120);
  }).observe(hero);

  Promise.all(SIDES.map((s) => images[s].decode()))
    .then(() => { lastW = canvas.clientWidth; build(); wake(); })
    .catch((err) => console.warn("dots: falling back to the static image", err));
})();
