/* Gedeelde helpers voor beheer.html en deelnemer.html */
window.SS = (() => {
  const D = window.DEMO;
  const COLORS = ["#075753", "#E7000B", "#4EB1AB", "#B52B26", "#2F7D78", "#C0731B", "#7A5AA6", "#3D6FA8", "#A33A6B"];
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  // edits made on these pages (wishlist, removed people, ...) stay in this browser only
  const saved = store.get("ss_people", null);
  const people = saved || D.people.map(p => ({ ...p, wishlist: p.wishlist.map(w => ({ ...w })) }));
  const savePeople = () => store.set("ss_people", people);
  const me = () => people.find(p => p.me);
  const byId = id => people.find(p => p.id === id);
  const colorOf = p => COLORS[D.people.findIndex(x => x.id === p.id) % COLORS.length];
  const avatar = (p, cls = "") => `<span class="av ${cls}" style="background:${colorOf(p)}" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>`;
  const euro = n => "€" + n;
  const fmtDate = (d, opts = { weekday: "long", day: "numeric", month: "long" }) => { try { return new Date(d + "T12:00:00").toLocaleDateString("nl-BE", opts); } catch (e) { return d; } };
  const nf = n => n.toLocaleString("nl-BE");

  // my score of today comes from the game (sleeroute.html stores it in this browser)
  const myToday = () => store.get("sl_best_d" + D.party.adventDay, 0);
  function scoreOf(p, kind) {
    if (p.me) return kind === "today" ? myToday() : p.totalBefore + myToday();
    return kind === "today" ? (p.today ?? null) : p.total;
  }
  function board(kind) {
    return people.filter(p => kind === "total" || scoreOf(p, "today") !== null || p.me)
      .map(p => ({ p, s: scoreOf(p, kind) ?? 0, played: scoreOf(p, "today") !== null && (kind === "total" ? p.total > 0 || p.me : true) }))
      .sort((a, b) => b.s - a.s);
  }
  function renderBoard(el, kind) {
    const rows = board(kind);
    el.innerHTML = rows.map((r, i) => `<li class="${r.p.me ? "me" : ""} ${i === 0 && r.s > 0 ? "top" : ""}">
      <span class="rk">${i === 0 && r.s > 0 ? "★" : i + 1}</span>${avatar(r.p, "sm")}<span class="nm">${r.p.me ? "Jij" : esc(r.p.name)}</span>
      <span class="sc ${r.s ? "" : "zero"}">${r.s ? nf(r.s) : (kind === "today" ? "nog niet gespeeld" : "0")}</span></li>`).join("");
  }
  function bindTabs(root, onChange) {
    root.querySelectorAll("[role=tab]").forEach(b => b.addEventListener("click", () => {
      root.querySelectorAll("[role=tab]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
      onChange(b.dataset.kind);
    }));
  }
  let tt = 0;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200);
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); toast("Gekopieerd"); }
    catch (e) { toast("Kopiëren lukt hier niet: " + text); }
  }
  const daysTo = d => Math.max(0, Math.round((new Date(d + "T12:00:00") - new Date(D.party.demoToday + "T12:00:00")) / 864e5));
  return { D, $, esc, store, people, savePeople, me, byId, avatar, euro, fmtDate, nf, scoreOf, board, renderBoard, bindTabs, toast, copy, daysTo, myToday };
})();
