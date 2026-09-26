(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- sides: Sourcing (day) | DJ (night) ---------------- */
  const SIDES = {
    day: { theme: "light", color: "#f4f1e9", title: "Denys Dinkevych — Talent Sourcing Lead" },
    night: { theme: "dark", color: "#141414", title: "diskevich — DJ · Denys Dinkevych" },
  };
  const tabs = [...document.querySelectorAll('.switch [role="tab"]')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applySide(side) {
    const s = SIDES[side];
    root.dataset.side = side;
    root.dataset.theme = s.theme;
    themeMeta.content = s.color;
    document.title = s.title;
    for (const t of tabs) {
      const on = t.dataset.side === side;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    // keep the side in the URL so any view can be shared as a link
    try {
      const url = new URL(location.href);
      url.searchParams.set("side", side);
      history.replaceState(null, "", url);
    } catch (e) {}
    try { localStorage.setItem("side", side); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange", { detail: s.theme }));
    if (window.dots) window.dots.setSide(side);
  }

  function switchSide(side, x, y) {
    if (side === root.dataset.side) return;
    const swap = () => {
      applySide(side);
      if (scrollY > 0) scrollTo({ top: 0, behavior: "instant" });
    };
    if (!document.startViewTransition || reduced) { swap(); return; }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(swap).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }

  applySide(root.dataset.side in SIDES ? root.dataset.side : "day");

  for (const t of tabs) {
    t.addEventListener("click", (e) => {
      const b = t.getBoundingClientRect();
      switchSide(t.dataset.side, e.clientX || b.left + b.width / 2, e.clientY || b.top + b.height / 2);
    });
    // arrow keys move between tabs (WAI-ARIA tabs pattern)
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next = tabs[(tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      const b = next.getBoundingClientRect();
      switchSide(next.dataset.side, b.left + b.width / 2, b.top + b.height / 2);
    });
  }

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

  /* ---------------- SoundCloud: nothing third-party loads until a click ---------------- */
  function loadPlayer() {
    const box = $("sc-facade");
    if (box.classList.contains("loaded")) return;
    const iframe = document.createElement("iframe");
    iframe.title = "mixes spotlight by diskevich on SoundCloud";
    iframe.allow = "autoplay";
    iframe.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent("https://soundcloud.com/diskevich/sets/mixes-highlight") +
      "&color=%23ff6a2b&auto_play=true&hide_related=true&show_comments=false&show_user=true&visual=false";
    box.replaceChildren(iframe);
    box.classList.add("loaded");
  }
  $("sc-load").addEventListener("click", loadPlayer);
  for (const a of document.querySelectorAll("[data-play]")) a.addEventListener("click", loadPlayer);

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
