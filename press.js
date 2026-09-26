// Renders DJ facts from press.json into any page that has matching slots.
// Empty values hide their block ([data-press-block="gigs"] etc.), so new facts
// appear on the site just by editing press.json.
(() => {
  const script = document.currentScript;
  const src = new URL("press.json", script.src).href; // next to this script, from any page depth
  const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ext = 'target="_blank" rel="noopener"';

  fetch(src)
    .then((r) => r.json())
    .then((p) => {
      const empty = (v) => v == null || v === "" || (Array.isArray(v) && !v.length);
      const plays = p.mixes.reduce((s, m) => s + (m.plays || 0), 0);
      const values = {
        tagline: p.tagline, sound: p.sound, city: p.city, bioShort: p.bioShort, bioLong: p.bioLong,
        followers: p.followers ? fmtK(p.followers) : "", plays: plays ? Math.floor(plays / 1000) + "K+" : "", // round down: "+" must stay true
        mixCount: String(p.mixes.length), bpm: p.bpm, genres: (p.genres || []).join(" · "),
      };
      for (const el of document.querySelectorAll("[data-press]")) {
        const v = values[el.dataset.press];
        if (el.tagName === "TEXTAREA") el.value = v || ""; else el.textContent = v || "";
      }
      for (const el of document.querySelectorAll("[data-press-block]")) {
        const key = el.dataset.pressBlock;
        el.hidden = empty(key in values ? values[key] : p[key] || (p.links || {})[key]);
      }

      const fill = (id, items, render) => { const el = document.getElementById(id); if (el) el.innerHTML = items.map(render).join(""); };
      fill("press-quotes", p.quotes, (q) =>
        `<li><blockquote>“${esc(q.text.replace(/^[“"]|[”"]$/g, ""))}”</blockquote><a class="mono" href="${esc(q.url)}" ${ext}>— ${esc(q.source)} ↗</a></li>`);
      fill("press-mixes", p.mixes, (m) =>
        `<li><a href="${esc(m.url)}" ${ext}><span>${esc(m.label)}</span><em>${esc(m.title)}</em><small class="mono">${fmtK(m.plays)} plays</small></a></li>`);
      fill("press-coverage", p.press, (a) =>
        `<li><a href="${esc(a.url)}" ${ext}><span>${esc(a.title)}</span><em>${esc(a.outlet)} · ${esc(a.date.slice(0, 4))}</em></a></li>`);
      fill("press-gigs", p.gigs, (g) => `<li>${esc(typeof g === "string" ? g : [g.date, g.venue, g.city].filter(Boolean).join(" · "))}</li>`);
      fill("press-rider", p.rider, (r) => `<li>${esc(r)}</li>`);
      const yt = document.getElementById("press-youtube");
      if (yt && p.links && p.links.youtube) yt.href = p.links.youtube;
      document.documentElement.classList.add("press-ready");
    })
    .catch((err) => console.warn("press.json could not be loaded; keeping the static content", err));
})();
