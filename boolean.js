// Boolean builder: turns titles / must-haves / excludes / location into a
// LinkedIn boolean string and a Google X-ray string. Pure functions first,
// DOM wiring at the bottom (skipped when loaded in Node for tests).
(function (global) {
  // "go, kubernetes;  Senior Backend Engineer" -> ["go", "kubernetes", "Senior Backend Engineer"]
  function splitTerms(value) {
    return String(value || "")
      .split(/[,;\n]/)
      .map((t) => t.replace(/["“”«»]/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((t, i, all) => all.findIndex((u) => u.toLowerCase() === t.toLowerCase()) === i);
  }

  // multi-word terms need quotes, single words don't
  const q = (t) => (/\s/.test(t) ? `"${t}"` : t);
  const qAlways = (t) => `"${t}"`;
  const orGroup = (terms, quote = q) => (terms.length === 1 ? quote(terms[0]) : `(${terms.map(quote).join(" OR ")})`);

  function linkedinString({ titles = [], skills = [], exclude = [] }) {
    const parts = [];
    if (titles.length) parts.push(orGroup(titles));
    for (const s of skills) parts.push(q(s));
    let out = parts.join(" AND ");
    if (exclude.length) out += (out ? " " : "") + "NOT " + orGroup(exclude);
    return out;
  }

  function xrayString({ titles = [], skills = [], exclude = [], location = "" }) {
    const parts = ["site:linkedin.com/in"];
    if (titles.length) parts.push(orGroup(titles, qAlways));
    for (const s of skills) parts.push(qAlways(s));
    if (location) parts.push(qAlways(location));
    for (const x of exclude) parts.push("-" + q(x));
    return parts.join(" ");
  }

  function build(fields) {
    const input = {
      titles: splitTerms(fields.titles),
      skills: splitTerms(fields.skills),
      exclude: splitTerms(fields.exclude),
      location: splitTerms(fields.location)[0] || "",
    };
    const empty = !input.titles.length && !input.skills.length;
    return {
      linkedin: empty ? "" : linkedinString(input),
      xray: empty ? "" : xrayString(input),
    };
  }

  const api = { splitTerms, linkedinString, xrayString, build };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  global.booleanBuilder = api;

  // ---------------- DOM ----------------
  const form = document.getElementById("bool-form");
  if (!form) return;
  const outLi = document.getElementById("bool-linkedin");
  const outX = document.getElementById("bool-xray");
  const google = document.getElementById("bool-google");

  function update() {
    const r = build(Object.fromEntries(new FormData(form)));
    outLi.textContent = r.linkedin || "Add a job title or a skill to get a string.";
    outX.textContent = r.xray || "—";
    outLi.classList.toggle("is-empty", !r.linkedin);
    outX.classList.toggle("is-empty", !r.xray);
    google.href = r.xray ? "https://www.google.com/search?q=" + encodeURIComponent(r.xray) : "#";
    google.toggleAttribute("aria-disabled", !r.xray);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }

  for (const btn of document.querySelectorAll("[data-copy]")) {
    btn.addEventListener("click", async () => {
      const src = document.getElementById(btn.dataset.copy);
      if (src.classList.contains("is-empty")) return;
      const ok = await copyText(src.textContent);
      const label = btn.textContent;
      btn.textContent = ok ? "Copied ✓" : "Select & copy";
      btn.classList.toggle("copied", ok);
      setTimeout(() => { btn.textContent = label; btn.classList.remove("copied"); }, 1600);
    });
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
})(typeof window !== "undefined" ? window : globalThis);
