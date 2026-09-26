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

  // GitHub profiles have no job titles: search by skills and location, and keep to user pages
  function githubString({ skills = [], exclude = [], location = "" }) {
    const parts = ["site:github.com"];
    for (const sk of skills) parts.push(qAlways(sk));
    if (location) parts.push(qAlways(location));
    parts.push('"followers"', "-inurl:topics", "-inurl:orgs", "-inurl:blob", "-inurl:issues");
    for (const x of exclude) parts.push("-" + q(x));
    return parts.join(" ");
  }

  // Stack Overflow user pages list top tags and location
  function stackoverflowString({ skills = [], exclude = [], location = "" }) {
    const parts = ["site:stackoverflow.com/users"];
    for (const sk of skills) parts.push(qAlways(sk));
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
    const noSkills = !input.skills.length;
    return {
      linkedin: empty ? "" : linkedinString(input),
      xray: empty ? "" : xrayString(input),
      github: noSkills ? "" : githubString(input),
      stackoverflow: noSkills ? "" : stackoverflowString(input),
    };
  }

  const api = { splitTerms, linkedinString, xrayString, githubString, stackoverflowString, build };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  global.booleanBuilder = api;

  // ---------------- DOM ----------------
  const form = document.getElementById("bool-form");
  if (!form) return;
  const HINT = {
    linkedin: "Add a job title or a skill to get a string.",
    xray: "Add a job title or a skill to get a string.",
    github: "Add at least one skill: GitHub profiles have no job titles.",
    stackoverflow: "Add at least one skill: Stack Overflow profiles are searched by tags.",
  };

  function update() {
    const r = build(Object.fromEntries(new FormData(form)));
    for (const el of document.querySelectorAll("[data-out]")) {
      const v = r[el.dataset.out];
      el.textContent = v || HINT[el.dataset.out];
      el.classList.toggle("is-empty", !v);
    }
    for (const a of document.querySelectorAll("[data-open]")) {
      const v = r[a.dataset.open];
      a.href = v ? "https://www.google.com/search?q=" + encodeURIComponent(v) : "#";
      a.toggleAttribute("aria-disabled", !v);
    }
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
})(typeof window !== "undefined" ? window : globalThis);
