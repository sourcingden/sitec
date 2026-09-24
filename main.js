(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function haptic() {
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
  }

  /* ---------------- vinyl record ---------------- */
  const record = $("record");
  const disc = $("disc");
  const label = $("label");
  const caption = $("record-caption");

  // grooves: fine concentric rings with slightly varying brightness
  const grooves = $("grooves");
  for (let r = 50; r <= 120; r += 3.2) {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("r", r.toFixed(1));
    c.setAttribute("stroke-opacity", (0.04 + Math.random() * 0.07).toFixed(3));
    grooves.appendChild(c);
  }

  const T = 'font-family="Space Grotesk, sans-serif" text-anchor="middle"';
  const LABELS = [
    // day / night half-disc
    `<circle r="44" fill="#f4f1e9"/><path d="M0 -44A44 44 0 0 1 0 44Z" fill="#141414"/>
     <text y="-16" ${T} font-size="9" font-weight="700" fill="#141414" x="-20">day</text>
     <text y="-16" ${T} font-size="9" font-weight="700" fill="#f4f1e9" x="20">night</text>`,
    // side B: diskevich
    `<circle r="44" fill="#ff6a2b"/><circle r="36" fill="none" stroke="#141414" stroke-opacity=".25"/>
     <text y="-14" ${T} font-size="11" font-weight="700" fill="#141414">diskevich</text>
     <text y="24" ${T} font-size="7" fill="#141414">SIDE B · NIGHT SHIFT</text>`,
    // side A: sourcingdenis
    `<circle r="44" fill="#1f5eff"/><circle r="36" fill="none" stroke="#fff" stroke-opacity=".3"/>
     <text y="-14" ${T} font-size="9.5" font-weight="700" fill="#fff">sourcingdenis</text>
     <text y="24" ${T} font-size="7" fill="#fff">SIDE A · DAY SHIFT</text>`,
    // rings
    `<circle r="44" fill="#f4f1e9"/><circle r="34" fill="#ff6a2b"/><circle r="24" fill="#f4f1e9"/>
     <circle r="14" fill="#1f5eff"/><circle r="40" fill="none" stroke="#141414" stroke-width="1"/>`,
    // stripes
    `<clipPath id="lc"><circle r="44"/></clipPath>
     <g clip-path="url(#lc)"><rect x="-44" y="-44" width="88" height="88" fill="#141414"/>
     ${Array.from({ length: 6 }, (_, i) => `<rect x="${-44 + i * 16}" y="-44" width="8" height="88" fill="#f4f1e9"/>`).join("")}</g>
     <circle r="12" fill="#ff6a2b"/>`,
    // 33⅓
    `<circle r="44" fill="#ece5d3"/>
     <text y="6" ${T} font-size="22" font-weight="700" fill="#141414">33⅓</text>
     <text y="22" ${T} font-size="6.5" fill="#141414">RPM · STEREO</text>
     <text y="-22" ${T} font-size="6.5" fill="#141414">KYIV</text>`,
  ];
  let labelIndex = 0;
  function setLabel(i) {
    labelIndex = (i + LABELS.length) % LABELS.length;
    label.innerHTML = LABELS[labelIndex];
  }
  setLabel(0);

  const rpm = () => (reduced ? 0 : root.dataset.theme === "dark" ? 45 : 100 / 3);
  const rpmText = () => (root.dataset.theme === "dark" ? "45 rpm" : "33⅓ rpm");
  function idleCaption() {
    // each phrase stays on one line, so narrow screens wrap between phrases
    caption.innerHTML = [rpmText(), "drag to scratch", "tap to flip"].map((t) => `<span>${t}</span>`).join(" · ");
  }
  idleCaption();

  let angle = 0;            // degrees
  let vel = rpm() * 6;      // degrees per second
  let dragging = false;
  let last = performance.now();
  let running = false;
  let visible = true;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      const target = rpm() * 6;
      vel += (target - vel) * Math.min(1, dt * 1.6); // ease back to turntable speed
      angle += vel * dt;
    }
    disc.setAttribute("transform", `rotate(${(angle % 360).toFixed(2)})`);
    if (visible && !document.hidden) requestAnimationFrame(frame);
    else running = false;
  }
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(record);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
  start();

  // drag to scratch
  let center = null, lastA = 0, lastT = 0, downX = 0, downY = 0, downT = 0, maxDist = 0;
  const pointerAngle = (e) => Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180 / Math.PI;

  record.addEventListener("pointerdown", (e) => {
    const r = record.getBoundingClientRect();
    center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    lastA = pointerAngle(e);
    lastT = downT = performance.now();
    downX = e.clientX; downY = e.clientY; maxDist = 0;
    dragging = true;
    record.classList.add("dragging");
    record.setPointerCapture(e.pointerId);
    start();
  });
  record.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const a = pointerAngle(e);
    let d = a - lastA;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastT) / 1000);
    angle += d;
    vel = vel * 0.6 + (d / dt) * 0.4;
    lastA = a; lastT = now;
    maxDist = Math.max(maxDist, Math.hypot(e.clientX - downX, e.clientY - downY));
    if (maxDist > 6) caption.textContent = vel < 0 ? "wikka-wikka ⟲" : "scratching ⟳";
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    record.classList.remove("dragging");
    vel = Math.max(-2400, Math.min(2400, vel));
    if (maxDist < 6 && performance.now() - downT < 400) { setLabel(labelIndex + 1); haptic(); }
    setTimeout(idleCaption, 900);
  }
  record.addEventListener("pointerup", release);
  record.addEventListener("pointercancel", release);

  record.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLabel(labelIndex + 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); vel += 600; start(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); vel -= 600; start(); }
  });

  /* ---------------- theme ---------------- */
  const toggle = $("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    themeMeta.content = t === "dark" ? "#141414" : "#f4f1e9";
    toggle.setAttribute("aria-label", `Switch to ${t === "dark" ? "light" : "dark"} theme`);
    idleCaption();
  }
  applyTheme(root.dataset.theme);

  toggle.addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (err) {}
    if (!document.startViewTransition || reduced) { applyTheme(next); return; }
    const b = toggle.getBoundingClientRect();
    const x = e.clientX || b.left + b.width / 2;
    const y = e.clientY || b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(next)).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  });

  /* ---------------- star parallax ---------------- */
  if (!reduced) {
    const layers = [...document.querySelectorAll(".stars-layer")];
    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        for (const l of layers) l.style.transform = `translate3d(0, ${-scrollY * l.dataset.speed}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------- fold-out entries ---------------- */
  for (const btn of document.querySelectorAll("[data-fold]")) {
    const panel = $(btn.getAttribute("aria-controls"));
    const ask = document.createElement("p");
    ask.className = "fold-ask";
    ask.innerHTML = 'Ask me about it → <a href="https://t.me/sourcingdenis" target="_blank" rel="noopener">Telegram</a>';
    panel.appendChild(ask);
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  }

  /* ---------------- SoundCloud facade ---------------- */
  $("sc-load").addEventListener("click", () => {
    const box = $("sc-facade");
    const iframe = document.createElement("iframe");
    iframe.title = "mixes spotlight by diskevich on SoundCloud";
    iframe.allow = "autoplay";
    iframe.loading = "lazy";
    iframe.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent("https://soundcloud.com/diskevich/sets/mixes-highlight") +
      "&color=%23ff6a2b&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=false";
    box.replaceChildren(iframe);
    box.classList.add("loaded");
  });

  /* ---------------- Kyiv clock ---------------- */
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hour12: false });
  function tick() {
    const time = fmt.format(new Date());
    const h = parseInt(time, 10);
    let status = "probably asleep";
    if (h >= 9 && h < 19) status = "probably sourcing";
    else if (h >= 19 || h < 3) status = "probably mixing";
    $("clock").textContent = `Kyiv, ${time} — ${status}`;
  }
  tick();
  setInterval(tick, 15000);
})();
