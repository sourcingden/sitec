// Email pattern generator: first name + last name + company domain -> the
// common corporate address formats. Cyrillic names are transliterated with the
// official Ukrainian scheme (2010), plus Russian-only letters. Nothing is sent
// or verified; it only builds strings.
(function (global) {
  const MAP = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i",
    ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
    ы: "y", э: "e", ё: "e", ъ: "", "'": "", "’": "", "ʼ": "",
  };
  // at the start of a word these letters are spelled differently in the official scheme
  const INITIAL = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" };

  function translit(word) {
    const w = String(word || "").toLowerCase().trim();
    let out = "";
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      if (i === 0 && INITIAL[ch]) out += INITIAL[ch];
      else if (ch === "г" && w[i - 1] === "з") out += "gh"; // "зг" -> "zgh", so it isn't read as "zh"
      else if (ch in MAP) out += MAP[ch];
      else out += ch;
    }
    return out;
  }

  // letters only, so "Anne-Marie" -> "annemarie" and accents drop ("José" -> "jose")
  function clean(word) {
    return translit(word).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  }

  function cleanDomain(value) {
    let d = String(value || "").trim().toLowerCase();
    d = d.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "");
    d = d.split(/[/?#]/)[0];
    if (d.includes("@")) d = d.split("@").pop();
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : "";
  }

  // ordered roughly by how common each format is in company email
  const PATTERNS = [
    ["first.last", (f, l) => `${f}.${l}`],
    ["first", (f) => f],
    ["flast", (f, l) => `${f[0]}${l}`],
    ["firstlast", (f, l) => `${f}${l}`],
    ["f.last", (f, l) => `${f[0]}.${l}`],
    ["firstl", (f, l) => `${f}${l[0]}`],
    ["last", (f, l) => l],
    ["first_last", (f, l) => `${f}_${l}`],
    ["last.first", (f, l) => `${l}.${f}`],
    ["first-last", (f, l) => `${f}-${l}`],
    ["lastf", (f, l) => `${l}${f[0]}`],
    ["fl", (f, l) => `${f[0]}${l[0]}`],
  ];

  function generate({ first, last, domain }) {
    const f = clean(first), l = clean(last), d = cleanDomain(domain);
    if (!f || !d) return [];
    const list = l ? PATTERNS : PATTERNS.filter(([name]) => name === "first");
    const seen = new Set(), out = [];
    for (const [name, fn] of list) {
      const email = `${fn(f, l)}@${d}`;
      if (!seen.has(email)) { seen.add(email); out.push({ pattern: name, email }); }
    }
    return out;
  }

  const api = { translit, clean, cleanDomain, generate, PATTERNS };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  global.emailPatterns = api;

  // ---------------- DOM ----------------
  const form = document.getElementById("email-form");
  if (!form) return;
  const list = document.getElementById("email-list");
  const all = document.getElementById("email-all");
  const hint = document.getElementById("email-hint");

  function update() {
    const rows = generate(Object.fromEntries(new FormData(form)));
    list.replaceChildren(...rows.map((r, i) => {
      const li = document.createElement("li");
      const code = document.createElement("code");
      code.id = "email-" + i;
      code.textContent = r.email;
      const tag = document.createElement("span");
      tag.className = "mono tag";
      tag.textContent = r.pattern;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-small";
      btn.dataset.copy = code.id;
      btn.textContent = "Copy";
      li.append(tag, code, btn);
      return li;
    }));
    all.value = rows.map((r) => r.email).join(", ");
    all.classList.toggle("is-empty", !rows.length);
    hint.hidden = rows.length > 0;
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
})(typeof window !== "undefined" ? window : globalThis);
