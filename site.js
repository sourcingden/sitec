// Shared by every page: copy-to-clipboard helper and the Kyiv clock in the footer.
(function () {
  window.copyText = async function (text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  };

  // Buttons with data-copy="<element id>" copy that element's text and confirm briefly
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const src = document.getElementById(btn.dataset.copy);
    if (!src || src.classList.contains("is-empty")) return;
    const ok = await window.copyText(src.value !== undefined ? src.value : src.textContent);
    const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
    btn.textContent = ok ? "Copied ✓" : "Select & copy";
    btn.classList.toggle("copied", ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = label; btn.classList.remove("copied"); }, 1600);
  });

  const clock = document.getElementById("clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => {
      const time = fmt.format(new Date());
      const h = parseInt(time, 10);
      let status = "probably asleep";
      if (h >= 9 && h < 19) status = "probably sourcing";
      else if (h >= 19 || h < 3) status = "probably mixing";
      clock.textContent = `Kyiv, ${time} — ${status}`;
    };
    tick();
    setInterval(tick, 15000);
  }
})();
