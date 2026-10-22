(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("cp_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("cp_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const COLORS = ["#075753", "#E7000B", "#4EB1AB", "#B52B26", "#2F7D78", "#C0731B", "#7A5AA6", "#3D6FA8"];
  const EXAMPLE = { org: { name: "Arne", mail: "" }, people: [{ n: "Sofie", m: "" }, { n: "Jonas", m: "" }, { n: "Lotte", m: "" }] };

  // state, restored from this browser if a draft exists
  const S = Object.assign({
    step: 0, orgName: EXAMPLE.org.name, orgMail: "", orgPlays: true,
    people: EXAMPLE.people.map(p => ({ ...p })),
    pName: "", budget: 25, pDate: "", pPlace: "", pMsg: "", gameOn: true, excl: []
  }, store.get("draft", {}));
  if (S.step > 2) S.step = 0;
  const save = () => store.set("draft", S);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mailOk = m => !m || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m);
  function players() {
    const list = S.people.filter(p => p.n.trim()).map(p => p.n.trim());
    if (S.orgPlays && S.orgName.trim()) list.unshift(S.orgName.trim());
    return list;
  }

  /* ---------- step 1: people ---------- */
  const peopleEl = $("people");
  function renderPeople(focusLast) {
    peopleEl.innerHTML = S.people.map((p, i) => `
      <div class="row person" data-i="${i}">
        <div class="field"><label class="sr" for="pn${i}">Naam deelnemer ${i + 1}</label><input type="text" id="pn${i}" data-k="n" value="${esc(p.n)}" placeholder="Naam"></div>
        <div class="field"><label class="sr" for="pm${i}">E-mailadres deelnemer ${i + 1}</label><input type="email" id="pm${i}" data-k="m" value="${esc(p.m)}" placeholder="E-mailadres" class="${mailOk(p.m) ? "" : "bad"}"></div>
        <button type="button" class="icon-btn" data-del="${i}" aria-label="Verwijder deelnemer ${i + 1}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>`).join("");
    if (focusLast) { const inp = peopleEl.querySelector(`#pn${S.people.length - 1}`); if (inp) inp.focus(); }
    updateCount(); renderPreview();
  }
  peopleEl.addEventListener("input", e => {
    const row = e.target.closest(".person"); if (!row) return;
    const i = +row.dataset.i; S.people[i][e.target.dataset.k] = e.target.value;
    if (e.target.dataset.k === "m") e.target.classList.toggle("bad", !mailOk(e.target.value));
    updateCount(); renderPreview(); save();
  });
  peopleEl.addEventListener("click", e => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    S.people.splice(+b.dataset.del, 1); if (!S.people.length) S.people.push({ n: "", m: "" });
    S.excl = S.excl.filter(([a, c]) => players().includes(a) && players().includes(c));
    renderPeople(); save();
  });
  $("addBtn").addEventListener("click", () => { S.people.push({ n: "", m: "" }); renderPeople(true); save(); });
  $("csvBtn").addEventListener("click", () => { const b = $("csvBox"); b.hidden = !b.hidden; if (!b.hidden) $("csvText").focus(); });
  $("csvAdd").addEventListener("click", () => {
    const lines = $("csvText").value.split(/\n+/).map(l => l.trim()).filter(Boolean);
    let n = 0;
    lines.forEach(l => { const [name, mail] = l.split(/[,;\t]/).map(x => (x || "").trim()); if (name) { S.people.push({ n: name, m: mail || "" }); n++; } });
    S.people = S.people.filter((p, i, a) => p.n.trim() || i === a.length - 1 && a.length === 1);
    $("csvMsg").textContent = n ? `${n} ${n === 1 ? "persoon" : "personen"} toegevoegd.` : "Geen namen gevonden. Zet één persoon per regel.";
    $("csvMsg").className = n ? "ok" : "err";
    if (n) $("csvText").value = "";
    renderPeople(); save();
  });
  ["orgName", "orgMail"].forEach(id => $(id).addEventListener("input", e => { S[id] = e.target.value; if (id === "orgMail") e.target.classList.toggle("bad", !mailOk(e.target.value)); updateCount(); renderPreview(); save(); }));
  $("orgPlays").addEventListener("change", e => { S.orgPlays = e.target.checked; updateCount(); renderPreview(); save(); });
  $("reuseLink").addEventListener("click", e => {
    e.preventDefault();
    S.people = [{ n: "Sofie", m: "" }, { n: "Jonas", m: "" }, { n: "Lotte", m: "" }, { n: "Wout", m: "" }, { n: "Elif", m: "" }, { n: "Bram", m: "" }, { n: "Noor", m: "" }, { n: "Tante Rita", m: "" }];
    S.pName = S.pName || "Familie Peeters, Kerst 2026"; S.excl = [["Sofie", "Jonas"]];
    renderPeople(); fillStep2(); save();
    $("csvMsg").textContent = ""; toastMsg("Groep van vorig jaar geïmporteerd (voorbeeld)");
  });
  function updateCount() {
    const n = players().length;
    $("count").innerHTML = `<b>${n}</b> ${n === 1 ? "deelnemer" : "deelnemers"} in de trekking`;
  }

  /* ---------- step 2 ---------- */
  function fillStep2() {
    $("pName").value = S.pName; $("pDate").value = S.pDate; $("pPlace").value = S.pPlace; $("pMsg").value = S.pMsg; $("gameOn").checked = S.gameOn;
    document.querySelectorAll("#budget .chip").forEach(c => c.setAttribute("aria-pressed", String(+c.dataset.v === S.budget)));
    $("gameBox").classList.toggle("off", !S.gameOn);
    renderExcl(); renderPreview();
  }
  ["pName", "pDate", "pPlace", "pMsg"].forEach(id => $(id).addEventListener("input", e => { S[id] = e.target.value; renderPreview(); save(); }));
  $("budget").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; S.budget = +c.dataset.v; fillStep2(); save(); });
  $("gameOn").addEventListener("change", e => { S.gameOn = e.target.checked; fillStep2(); save(); });

  // exclusions + a real check that a valid draw still exists
  function drawPossible(names, excl) {
    const n = names.length; if (n < 3) return false;
    const banned = new Set(excl.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
    const ok = (g, r) => g !== r && !banned.has(names[g] + "|" + names[r]);
    const matchR = new Array(n).fill(-1);
    const tryG = (g, seen) => { for (let r = 0; r < n; r++) { if (!ok(g, r) || seen[r]) continue; seen[r] = true; if (matchR[r] < 0 || tryG(matchR[r], seen)) { matchR[r] = g; return true; } } return false; };
    for (let g = 0; g < n; g++) if (!tryG(g, new Array(n).fill(false))) return false;
    return true;
  }
  function renderExcl() {
    const names = players(), opts = sel => names.map(n => `<option ${n === sel ? "selected" : ""}>${esc(n)}</option>`).join("");
    $("excl").innerHTML = S.excl.map(([a, b], i) => `
      <div class="ex-row" data-i="${i}">
        <label class="sr" for="exa${i}">Persoon</label><select id="exa${i}" data-k="0">${opts(a)}</select>
        <span>trekt niet</span>
        <label class="sr" for="exb${i}">Mag niet trekken</label><select id="exb${i}" data-k="1">${opts(b)}</select>
        <button type="button" class="icon-btn" data-exdel="${i}" aria-label="Verwijder uitsluiting"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>`).join("");
    const f = $("feas"), possible = drawPossible(names, S.excl.filter(([a, b]) => a !== b));
    if (!S.excl.length) { f.className = "feas"; f.innerHTML = ""; }
    else if (possible) { f.className = "feas"; f.innerHTML = "<i></i>Trekking blijft mogelijk"; }
    else { f.className = "feas bad"; f.innerHTML = "<i></i>Met deze uitsluitingen kan niemand een naam trekken. Haal er een weg."; }
    renderPreview();
  }
  $("excl").addEventListener("change", e => { const row = e.target.closest(".ex-row"); if (!row) return; S.excl[+row.dataset.i][+e.target.dataset.k] = e.target.value; renderExcl(); save(); });
  $("excl").addEventListener("click", e => { const b = e.target.closest("[data-exdel]"); if (!b) return; S.excl.splice(+b.dataset.exdel, 1); renderExcl(); save(); });
  $("exAdd").addEventListener("click", () => {
    const n = players(); if (n.length < 2) return;
    const used = new Set(S.excl.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
    let pair = null;
    for (let i = 0; i < n.length && !pair; i++) for (let j = i + 1; j < n.length && !pair; j++) if (!used.has(n[i] + "|" + n[j])) pair = [n[i], n[j]];
    if (pair) { S.excl.push(pair); renderExcl(); save(); }
  });

  /* ---------- preview ---------- */
  const fmtDate = d => { if (!d) return "kies"; try { return new Date(d + "T12:00:00").toLocaleDateString("nl-BE", { day: "numeric", month: "short" }); } catch (e) { return d; } };
  function renderPreview() {
    const names = players();
    $("pvName").textContent = S.pName.trim() || "Nog geen naam";
    $("pvCount").textContent = names.length;
    $("pvBudget").textContent = "€" + S.budget;
    $("pvDate").textContent = fmtDate(S.pDate);
    const shown = names.slice(0, 11);
    $("pvAv").innerHTML = shown.map((n, i) => `<span class="av" style="background:${COLORS[i % COLORS.length]}" title="${esc(n)}">${esc(n.charAt(0).toUpperCase())}</span>`).join("") + (names.length > shown.length ? `<span class="av more">+${names.length - shown.length}</span>` : "");
    $("pvGame").hidden = !S.gameOn;
    $("pvGameTxt").textContent = S.pDate ? `Dagelijkse hints en gokken tot ${fmtDate(S.pDate)}` : "Dagelijkse hints en gokken tot het feest";
    $("pvExcl").textContent = S.excl.length ? `${S.excl.length} ${S.excl.length === 1 ? "uitsluiting" : "uitsluitingen"} ingesteld` : "";
  }

  /* ---------- step 3: invite preview ---------- */
  function renderMail() {
    const names = players(), first = names[1] || names[0] || "Sofie", drawn = names[2] || "Jonas";
    $("mail").innerHTML = `
      <div class="mail-top"><span>Aan: <b>${esc(first)}</b></span><span>Onderwerp: <b>Je Secret Santa voor ${esc(S.pName.trim() || "jullie feest")}</b></span></div>
      <div class="mail-body">
        <h4>Hoi ${esc(first)}, de namen zijn getrokken.</h4>
        <div class="mail-name"><small>Jij koopt een cadeau voor</small>${esc(drawn)}</div>
        <p>Budget <b>€${S.budget}</b>${S.pDate ? `, feest op <b>${fmtDate(S.pDate)}</b>` : ""}${S.pPlace.trim() ? ` in <b>${esc(S.pPlace.trim())}</b>` : ""}.</p>
        ${S.pMsg.trim() ? `<p>“${esc(S.pMsg.trim())}”, ${esc(S.orgName.trim() || "de organisator")}</p>` : ""}
        ${S.gameOn ? `<div class="mail-game"><b>Santa's Sleeroute staat aan.</b> Schrijf 3 hints over jezelf en speel elke dag hints vrij over wie jou trok.</div>` : ""}
      </div>`;
  }
  $("copyBtn").addEventListener("click", async () => {
    const b = $("copyBtn");
    try { await navigator.clipboard.writeText("https://" + $("shareLink").textContent); b.textContent = "Gekopieerd"; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("shareLink")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Geselecteerd"; }
    setTimeout(() => b.textContent = "Kopieer", 1800);
  });

  /* ---------- navigation and validation ---------- */
  const steps = [...document.querySelectorAll(".step")];
  function validate(i) {
    if (i === 0) {
      const names = players();
      if (!S.orgName.trim()) return "Vul jouw naam in.";
      if (!mailOk(S.orgMail)) return "Je e-mailadres lijkt niet te kloppen.";
      if (S.people.some(p => !mailOk(p.m))) return "Een van de e-mailadressen lijkt niet te kloppen. Kijk de rode velden na.";
      if (names.length < 3) return `Je hebt minstens 3 deelnemers nodig. Nu zijn het er ${names.length}.`;
      const dup = names.find((n, k) => names.findIndex(x => x.toLowerCase() === n.toLowerCase()) !== k);
      if (dup) return `"${dup}" staat er twee keer in. Geef iedereen een unieke naam, bijvoorbeeld met een initiaal.`;
    }
    if (i === 1) {
      if (!S.pName.trim()) return "Geef je feest een naam.";
      if (!drawPossible(players(), S.excl)) return "Met deze uitsluitingen kan de trekking niet. Haal er een weg.";
    }
    return "";
  }
  let max = S.step;
  function go(i, push = true) {
    if (i > S.step) for (let k = S.step; k < i; k++) { const m = validate(k); if (m) { $("err" + k).textContent = m; return; } }
    document.querySelectorAll(".err").forEach(e => e.textContent = "");
    S.step = i; max = Math.max(max, Math.min(i, 2)); save();
    steps.forEach(s => s.hidden = +s.dataset.step !== i);
    document.querySelectorAll("#stepper li").forEach(li => {
      const s = +li.dataset.s; li.classList.toggle("active", s === Math.min(i, 2)); li.classList.toggle("done", s < i);
      li.querySelector("button").disabled = i === 3 || s > max;
      if (s === Math.min(i, 2)) li.querySelector("button").setAttribute("aria-current", "step"); else li.querySelector("button").removeAttribute("aria-current");
    });
    const items = document.querySelectorAll("#stepper li"), a = items[0].getBoundingClientRect(), b = items[Math.min(i, 2)].getBoundingClientRect();
    $("bar").style.width = (b.left - a.left) + "px";
    if (i === 1) { renderExcl(); fillStep2(); }
    if (i === 2) renderMail();
    if (push) window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-next]")) go(S.step + 1);
    if (e.target.closest("[data-prev]")) go(S.step - 1);
    const g = e.target.closest("[data-go]"); if (g && !g.disabled) go(+g.dataset.go);
  });
  window.addEventListener("resize", () => go(S.step, false));

  $("form").addEventListener("submit", e => {
    e.preventDefault();
    for (let k = 0; k < 2; k++) { const m = validate(k); if (m) { go(k); $("err" + k).textContent = m; return; } }
    const n = players().length;
    $("doneTitle").textContent = `De namen voor ${S.pName.trim()} zijn getrokken.`;
    $("doneText").textContent = `${n} deelnemers krijgen zo hun mail met een getrokken naam${S.gameOn ? ", hun 3 hint-vragen en de link naar Santa's Sleeroute" : " en de link naar hun verlanglijst"}.`;
    go(3); confetti();
    S.step = 0; save();
  });

  let tt = 0;
  function toastMsg(t) { const m = $("csvMsg"); m.className = "ok"; m.textContent = t; clearTimeout(tt); tt = setTimeout(() => m.textContent = "", 2600); }

  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("confetti"), r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const cols = ["#ffffff", "#4EB1AB", "#D8F0EF", "#ffd166", "#E7000B"];
    const P = Array.from({ length: 140 }, () => ({ x: r.width * (.2 + Math.random() * .6), y: r.height * .55, vx: (Math.random() - .5) * 9, vy: -6 - Math.random() * 9, s: 4 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function tick() {
      g.clearRect(0, 0, r.width, r.height);
      P.forEach(p => { p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (++f < 200) requestAnimationFrame(tick); else g.clearRect(0, 0, r.width, r.height);
    })();
  }

  // boot
  $("orgName").value = S.orgName; $("orgMail").value = S.orgMail; $("orgPlays").checked = S.orgPlays;
  renderPeople(); fillStep2(); go(S.step, false);
})();
