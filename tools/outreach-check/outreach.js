// Outreach checker: scores a first message to a passive candidate on the
// things that move reply rates. Pure rules first, DOM wiring at the bottom.
(function (global) {
  const CLICHES = [
    "exciting opportunity", "unique opportunity", "amazing opportunity", "rockstar", "rock star", "ninja", "guru",
    "i came across your profile", "i stumbled upon your profile", "perfect fit", "hope this finds you well",
    "hope this message finds you well", "hope you're doing well", "hope you are doing well", "i'm reaching out",
    "i am reaching out", "fast-paced", "dynamic environment", "competitive salary", "touch base", "synergy",
    "wear many hats", "work hard, play hard", "dream job", "immediate start", "urgent",
  ];
  const TOKEN = /\{[^}]*\}|\[[^\]]*\]|<[^>]*>|%[a-z_]+%/gi;
  const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;

  const words = (t) => (t.match(/[\p{L}\p{N}'’-]+/gu) || []);
  const count = (t, re) => (t.match(re) || []).length;

  function analyze(text) {
    const t = String(text || "").trim();
    const w = words(t);
    const n = w.length;
    const lower = t.toLowerCase();
    const checks = [];
    let score = 100;
    const add = (id, ok, label, detail, penalty) => { checks.push({ id, ok, label, detail }); if (!ok) score -= penalty; };

    if (!n) return { score: 0, words: 0, seconds: 0, checks: [] };

    // 1. length: long enough to be personal, short enough to read on a phone
    const lenOk = n >= 50 && n <= 120;
    add("length", lenOk, "Length",
      lenOk ? `${n} words — in the 50–120 sweet spot.`
        : n < 50 ? `${n} words — a bit thin. Add why them, why this role.` : `${n} words — too long for a first touch. Aim for under 120.`,
      n < 30 || n > 180 ? 25 : 15);

    // 2. ends with a question: gives the reader something easy to answer
    const sentences = t.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    // ignore trailing emoji, spaces and closing quotes/brackets after the "?"
    const q = /\?["'”’)\]]*$/.test(t.replace(/[\s\p{Extended_Pictographic}\u200d\ufe0f]+$/u, ""));
    add("question", q, "Ends with a question",
      q ? "Ends with a question — easy to reply to." : "End with one short, low-effort question (e.g. “Worth a 15-minute chat?”).", 15);

    // 3. leftover template tokens are the fastest way to look automated
    const tokens = t.match(TOKEN) || [];
    add("tokens", !tokens.length, "No template leftovers",
      tokens.length ? `Unfilled placeholders: ${[...new Set(tokens)].join(", ")}` : "No unfilled placeholders.",
      Math.min(30, tokens.length * 20));

    // 4. clichés every candidate has seen a hundred times
    const found = CLICHES.filter((c) => lower.includes(c));
    add("cliches", !found.length, "No recruiter clichés",
      found.length ? `Swap these for something specific: “${found.join("”, “")}”.` : "No stock recruiter phrases.",
      Math.min(32, found.length * 8));

    // 5. links: one is fine, more looks like a newsletter
    const links = count(t, LINK);
    add("links", links <= 1, "At most one link",
      links <= 1 ? (links ? "One link — good." : "No links — fine for a first touch.") : `${links} links — keep one at most.`, 10);

    // 6. about them, not about us
    const you = count(lower, /\b(you|your|yours|you're|you've)\b/g);
    const me = count(lower, /\b(i|i'm|i've|me|my|we|we're|our|us)\b/g);
    const about = you >= me;
    add("you", about, "About them, not you",
      `“you/your” ×${you} vs “I/we/our” ×${me}.` + (about ? " Reader-focused." : " Flip a few sentences toward the reader."), 10);

    // 7. sentence length: long sentences read like a job description
    const avg = n / Math.max(1, sentences.length);
    const short = avg <= 22;
    add("sentences", short, "Short sentences",
      `Average ${avg.toFixed(0)} words per sentence.` + (short ? "" : " Break a few up."), 5);

    return { score: Math.max(0, Math.min(100, score)), words: n, seconds: Math.max(1, Math.round((n / 230) * 60)), checks };
  }

  const api = { analyze, CLICHES };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  global.outreachCheck = api;

  // ---------------- DOM ----------------
  const input = document.getElementById("msg");
  if (!input) return;
  const scoreEl = document.getElementById("score");
  const meta = document.getElementById("score-meta");
  const list = document.getElementById("checks");
  const meter = document.getElementById("meter");

  function update() {
    const r = analyze(input.value);
    scoreEl.textContent = r.words ? r.score : "—";
    meter.style.setProperty("--p", r.words ? r.score : 0);
    meter.dataset.band = !r.words ? "" : r.score >= 80 ? "good" : r.score >= 55 ? "ok" : "low";
    meta.textContent = r.words ? `${r.words} words · ~${r.seconds}s to read` : "Paste a message to get a score.";
    list.replaceChildren(...r.checks.map((c) => {
      const li = document.createElement("li");
      li.className = c.ok ? "ok" : "fix";
      li.innerHTML = `<span class="mark" aria-hidden="true">${c.ok ? "✓" : "!"}</span><div><b></b><p></p></div>`;
      li.querySelector("b").textContent = c.label;
      li.querySelector("p").textContent = c.detail;
      li.setAttribute("aria-label", `${c.ok ? "Passed" : "To fix"}: ${c.label}. ${c.detail}`);
      return li;
    }));
  }
  input.addEventListener("input", update);
  document.getElementById("msg-example").addEventListener("click", () => {
    input.value = input.dataset.example;
    update();
    input.focus();
  });
  update();
})(typeof window !== "undefined" ? window : globalThis);
