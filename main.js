(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- theme ---------------- */
  const toggle = $("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    themeMeta.content = t === "dark" ? "#141414" : "#f4f1e9";
    toggle.setAttribute("aria-label", `Switch to ${t === "dark" ? "light" : "dark"} theme`);
    document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
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
