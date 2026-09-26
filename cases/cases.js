// Demo dashboards for the case studies. All numbers are invented for the demo.
(() => {
  const $ = (id) => document.getElementById(id);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const fmt = (n) => n.toLocaleString("en-US");

  /* ---------- shared tooltip ---------- */
  const tip = $("viz-tip");
  function showTip(html, el) {
    tip.innerHTML = html;
    tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - t.width / 2;
    x = Math.max(8, Math.min(innerWidth - t.width - 8, x));
    let y = r.top - t.height - 8;
    if (y < 8) y = r.bottom + 8;
    tip.style.left = x + scrollX + "px";
    tip.style.top = y + scrollY + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  // hover on pointer devices, tap on touch; focus for keyboard
  function hoverable(el, html) {
    el.tabIndex = 0;
    el.addEventListener("pointerenter", () => showTip(html(), el));
    el.addEventListener("pointerleave", hideTip);
    el.addEventListener("focus", () => showTip(html(), el));
    el.addEventListener("blur", hideTip);
    el.addEventListener("click", () => showTip(html(), el));
  }
  addEventListener("scroll", hideTip, { passive: true });

  /* ---------- Case 1: funnel ---------- */
  const STAGES = ["Outreach", "Replies", "Screens", "Submissions", "Hires"];
  const SOURCERS = {
    "Sourcer A": [420, 160, 48, 22, 6],
    "Sourcer B": [380, 110, 41, 20, 5],
    "Sourcer C": [510, 145, 30, 11, 2],
    "Sourcer D": [300, 128, 44, 24, 7],
  };
  const team = STAGES.map((_, i) => Object.values(SOURCERS).reduce((s, v) => s + v[i], 0));
  const scopes = { Team: team, ...SOURCERS };
  let scope = "Team";
  let step = 2; // index of the target stage for the comparison chart (Replies -> Screens)

  const filter = $("funnel-filter");
  for (const name of Object.keys(scopes)) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.setAttribute("aria-pressed", String(name === scope));
    b.addEventListener("click", () => {
      scope = name;
      for (const x of filter.children) x.setAttribute("aria-pressed", String(x === b));
      renderFunnel();
      renderCompare();
    });
    filter.appendChild(b);
  }

  function renderFunnel() {
    const v = scopes[scope];
    const box = $("funnel");
    box.replaceChildren(...STAGES.map((stage, i) => {
      const row = document.createElement("div");
      row.className = "hbar";
      const conv = i ? `${pct(v[i], v[i - 1])}% of ${STAGES[i - 1].toLowerCase()}` : "start";
      row.innerHTML = `<span class="hbar-label">${stage}</span>
        <span class="hbar-track"><span class="hbar-fill" style="width:${Math.max(1.5, (v[i] / v[0]) * 100)}%"></span></span>
        <span class="hbar-value"><b>${fmt(v[i])}</b><small>${conv}</small></span>`;
      hoverable(row, () => `<b>${scope} · ${stage}</b><br>${fmt(v[i])} people` +
        (i ? `<br>${pct(v[i], v[i - 1])}% of ${STAGES[i - 1].toLowerCase()}<br>${(v[i] / v[0] * 100).toFixed(1)}% of outreach` : ""));
      return row;
    }));
    $("funnel-headline").textContent = `${(v[4] / v[0] * 100).toFixed(1)}%`;
    $("funnel-headline-note").textContent = `${scope === "Team" ? "Team" : scope}: outreach → hire`;
  }

  const stepSel = $("compare-step");
  STAGES.slice(1).forEach((s, i) => {
    const o = document.createElement("option");
    o.value = i + 1;
    o.textContent = `${STAGES[i]} → ${s}`;
    if (i + 1 === step) o.selected = true;
    stepSel.appendChild(o);
  });
  stepSel.addEventListener("change", () => { step = +stepSel.value; renderCompare(); });

  function renderCompare() {
    const rates = Object.entries(SOURCERS).map(([n, v]) => [n, pct(v[step], v[step - 1])]);
    const avg = pct(team[step], team[step - 1]);
    const max = Math.max(...rates.map((r) => r[1]), avg) * 1.15;
    const box = $("compare");
    box.style.setProperty("--avg", (avg / max) * 100 + "%");
    box.replaceChildren(...rates.map(([n, r]) => {
      const row = document.createElement("div");
      row.className = "hbar" + (scope !== "Team" && scope !== n ? " dim" : "");
      row.innerHTML = `<span class="hbar-label">${n}</span>
        <span class="hbar-track"><span class="hbar-fill" style="width:${(r / max) * 100}%"></span><span class="hbar-avg" aria-hidden="true"></span></span>
        <span class="hbar-value"><b>${r}%</b><small>${r >= avg ? "+" : ""}${r - avg} pts vs team</small></span>`;
      hoverable(row, () => `<b>${n}</b><br>${STAGES[step - 1]} → ${STAGES[step]}: ${r}%<br>Team average: ${avg}%`);
      return row;
    }));
    $("compare-avg").textContent = `Dashed line: team average ${avg}%`;
  }

  // table view of every number, for screen readers and anyone who prefers rows
  const table = $("funnel-table");
  table.innerHTML = `<thead><tr><th scope="col">Stage</th>${Object.keys(scopes).map((n) => `<th scope="col">${n}</th>`).join("")}</tr></thead>
    <tbody>${STAGES.map((s, i) => `<tr><th scope="row">${s}</th>${Object.values(scopes).map((v) => `<td>${fmt(v[i])}</td>`).join("")}</tr>`).join("")}</tbody>`;

  renderFunnel();
  renderCompare();

  /* ---------- Case 2: bonus calculator ---------- */
  const W = { screens: 20, submissions: 60, hires: 250 };  // demo weights, $ per unit
  const PARTS = [
    ["screens", "Screens", "var(--series-1)"],
    ["submissions", "Submissions", "var(--series-2)"],
    ["hires", "Hires", "var(--series-3)"],
  ];
  const form = $("bonus-form");

  function tier(screens, subs) {
    const c = screens ? subs / screens : 0;
    if (c >= 0.5) return { name: "Tier 3", mult: 1.2, why: `${pct(subs, screens)}% screen → submission (≥ 50%)` };
    if (c >= 0.3) return { name: "Tier 2", mult: 1.0, why: `${pct(subs, screens)}% screen → submission (30–49%)` };
    return { name: "Tier 1", mult: 0.8, why: `${pct(subs, screens)}% screen → submission (under 30%)` };
  }

  function renderBonus() {
    const v = Object.fromEntries([...new FormData(form)].map(([k, x]) => [k, +x]));
    for (const [k] of PARTS) $(`out-${k}`).textContent = v[k];
    const t = tier(v.screens, v.submissions);
    const parts = PARTS.map(([k, label, color]) => ({ k, label, color, units: v[k], amount: Math.round(v[k] * W[k] * t.mult) }));
    const total = parts.reduce((s, p) => s + p.amount, 0);
    $("bonus-total").textContent = "$" + fmt(total);
    $("bonus-tier").textContent = `${t.name} · ×${t.mult.toFixed(1)}`;
    $("bonus-why").textContent = t.why;

    const bar = $("bonus-bar");
    bar.replaceChildren(...parts.filter((p) => p.amount > 0).map((p) => {
      const seg = document.createElement("span");
      seg.className = "seg";
      seg.style.flexGrow = p.amount;
      seg.style.background = p.color;
      seg.setAttribute("aria-label", `${p.label}: $${fmt(p.amount)}`);
      hoverable(seg, () => `<b>${p.label}</b><br>${p.units} × $${W[p.k]} × ${t.mult.toFixed(1)} = $${fmt(p.amount)}<br>${pct(p.amount, total)}% of the bonus`);
      return seg;
    }));
    if (!total) bar.innerHTML = '<span class="seg empty">No output yet</span>';

    // direct labels + legend in text ink, the colour chip carries identity
    $("bonus-legend").replaceChildren(...parts.map((p) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="chip" style="background:${p.color}"></span>${p.label} <b>$${fmt(p.amount)}</b> <small>${total ? pct(p.amount, total) : 0}%</small>`;
      return li;
    }));
    $("bonus-table").innerHTML = `<thead><tr><th scope="col">Part</th><th scope="col">Units</th><th scope="col">Rate</th><th scope="col">Multiplier</th><th scope="col">Amount</th></tr></thead>
      <tbody>${parts.map((p) => `<tr><th scope="row">${p.label}</th><td>${p.units}</td><td>$${W[p.k]}</td><td>×${t.mult.toFixed(1)}</td><td>$${fmt(p.amount)}</td></tr>`).join("")}
      <tr><th scope="row">Total</th><td></td><td></td><td></td><td>$${fmt(total)}</td></tr></tbody>`;
  }
  form.addEventListener("input", renderBonus);
  renderBonus();
})();
