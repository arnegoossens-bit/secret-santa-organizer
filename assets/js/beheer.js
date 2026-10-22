(() => {
  "use strict";
  const { D, $, esc, store, people, savePeople, avatar, euro, fmtDate, nf, scoreOf, renderBoard, bindTabs, toast, copy, daysTo } = window.SS;
  const party = Object.assign({}, D.party, store.get("ss_party", {}));
  const saveParty = () => store.set("ss_party", { name: party.name, date: party.date, location: party.location, budget: party.budget, gameOn: party.gameOn });

  function renderHead() {
    $("title").textContent = party.name;
    const d = daysTo(party.date);
    $("countdown").textContent = d === 0 ? "Vandaag is het feest" : `Nog ${d} ${d === 1 ? "dag" : "dagen"} tot het feest`;
    $("details").innerHTML = `<dt>Datum</dt><dd>${esc(fmtDate(party.date))}</dd><dt>Locatie</dt><dd>${esc(party.location)}</dd><dt>Budget</dt><dd>${euro(party.budget)} per cadeau</dd><dt>Spel</dt><dd>${party.gameOn ? "Santa's Sleeroute staat aan" : "Uit"}</dd>`;
  }
  function renderMeters() {
    const n = people.length, opened = people.filter(p => p.opened).length,
      lists = people.filter(p => p.wishlist.length).length, played = people.filter(p => scoreOf(p, "today")).length;
    const m = (v, l) => `<div class="meter"><b>${v}<small> / ${n}</small></b><div class="bar"><i style="width:${Math.round(v / n * 100)}%"></i></div><span>${l}</span></div>`;
    $("meters").innerHTML = m(opened, "openden hun uitnodiging") + m(lists, "maakten een verlanglijst") + m(played, "speelden vandaag de Sleeroute");
    $("remindBtn").hidden = opened === n && lists === n;
  }
  const ic = {
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
  };
  let confirmFor = null;
  function renderPeople() {
    $("pCount").textContent = people.length + " deelnemers";
    $("ptable").innerHTML = people.map(p => {
      const t = scoreOf(p, "today");
      const st = [
        p.opened ? '<span class="chip ok"><i></i>Geopend</span>' : '<span class="chip warn"><i></i>Niet geopend</span>',
        p.wishlist.length ? `<span class="chip">${p.wishlist.length} ${p.wishlist.length === 1 ? "wens" : "wensen"}</span>` : '<span class="chip">Geen lijst</span>',
        t ? `<span class="chip teal">${nf(t)} vandaag</span>` : ""
      ].join("");
      return `<div class="prow" role="listitem" data-id="${p.id}">${avatar(p)}
        <span class="nm"><b>${esc(p.name)}${p.host ? " · organisator" : ""}</b><span>${esc(p.email)}</span></span>
        <span class="st">${st}</span>
        <span class="acts">
          <button class="icon-btn" type="button" data-act="link" aria-label="Kopieer persoonlijke link van ${esc(p.name)}" title="Kopieer persoonlijke link">${ic.link}</button>
          <button class="icon-btn" type="button" data-act="mail" aria-label="Mail ${esc(p.name)} opnieuw" title="Mail opnieuw">${ic.mail}</button>
          ${p.host ? "" : `<button class="icon-btn red" type="button" data-act="del" aria-label="Verwijder ${esc(p.name)}" title="Verwijder">${ic.del}</button>`}
        </span>
        ${confirmFor === p.id ? `<div class="confirm"><p><b>${esc(p.name)} verwijderen?</b> De namen worden opnieuw getrokken en iedereen krijgt een nieuwe mail.</p><div class="row"><button class="btn danger solid sm" type="button" data-act="delyes">Verwijder en trek opnieuw</button><button class="linkbtn" type="button" data-act="delno">Annuleer</button></div></div>` : ""}
      </div>`;
    }).join("");
  }
  $("ptable").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.closest(".prow").dataset.id, p = people.find(x => x.id === id);
    const act = b.dataset.act;
    if (act === "link") copy(`https://secretsantaorganizer.com/nl/deelnemer/demo-${id}`);
    if (act === "mail") toast(`Uitnodiging opnieuw verstuurd naar ${p.name} (demo)`);
    if (act === "del") { confirmFor = id; renderPeople(); }
    if (act === "delno") { confirmFor = null; renderPeople(); }
    if (act === "delyes") { people.splice(people.indexOf(p), 1); confirmFor = null; savePeople(); renderAll(); toast(`${p.name} verwijderd, namen opnieuw getrokken (demo)`); }
  });
  $("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("addName").value.trim(), mail = $("addMail").value.trim();
    if (!name) { $("addName").focus(); toast("Vul een naam in"); return; }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { $("addMail").focus(); toast("Dat e-mailadres lijkt niet te kloppen"); return; }
    if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) { toast(`"${name}" staat er al in`); return; }
    people.push({ id: "p" + Date.now(), name, email: mail || "nog geen e-mail", opened: false, today: null, total: 0, wishlist: [] });
    $("addName").value = ""; $("addMail").value = ""; savePeople(); renderAll(); toast(`${name} toegevoegd en uitgenodigd (demo)`);
  });

  // status actions
  $("remindBtn").addEventListener("click", () => {
    const who = people.filter(p => !p.opened || !p.wishlist.length).map(p => p.name);
    toast(`Herinnering verstuurd naar ${who.length}: ${who.join(", ")} (demo)`);
  });
  $("updateOpen").addEventListener("click", () => { $("compose").hidden = false; $("updText").focus(); });
  $("updCancel").addEventListener("click", () => { $("compose").hidden = true; });
  $("updSend").addEventListener("click", () => {
    if (!$("updText").value.trim()) { $("updText").focus(); return; }
    $("updText").value = ""; $("compose").hidden = true; toast(`Update verstuurd naar ${people.length} deelnemers (demo)`);
  });

  // details edit
  $("editBtn").addEventListener("click", () => {
    $("eName").value = party.name; $("eDate").value = party.date; $("eLoc").value = party.location; $("eBudget").value = party.budget;
    $("editForm").hidden = false; $("details").hidden = true; $("editBtn").hidden = true; $("eName").focus();
  });
  const closeEdit = () => { $("editForm").hidden = true; $("details").hidden = false; $("editBtn").hidden = false; };
  $("editCancel").addEventListener("click", closeEdit);
  $("editForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!$("eName").value.trim()) { $("eName").focus(); return; }
    party.name = $("eName").value.trim(); party.date = $("eDate").value || party.date; party.location = $("eLoc").value.trim(); party.budget = Math.max(1, +$("eBudget").value || party.budget);
    saveParty(); closeEdit(); renderHead(); toast("Opgeslagen");
  });

  // highscores + game toggle
  let kind = "today";
  bindTabs($("hsTabs"), k => { kind = k; renderBoard($("hs"), kind); });
  $("gameOn").checked = party.gameOn;
  $("gameOn").addEventListener("change", e => { party.gameOn = e.target.checked; saveParty(); renderHead(); toast(party.gameOn ? "Santa's Sleeroute staat aan" : "Santa's Sleeroute staat uit voor deze groep"); });

  // reveal all draws
  $("revealBtn").addEventListener("click", () => { $("revealConfirm").hidden = false; $("revealBtn").hidden = true; });
  $("revealNo").addEventListener("click", () => { $("revealConfirm").hidden = true; $("revealBtn").hidden = false; });
  $("revealYes").addEventListener("click", () => {
    $("revealConfirm").hidden = true;
    const ids = people.map(p => p.id);
    $("draws").innerHTML = people.filter(p => D.draws[p.id] && ids.includes(D.draws[p.id])).map(p => {
      const q = people.find(x => x.id === D.draws[p.id]);
      return `<li>${avatar(p, "sm")}${esc(p.name)} <span class="arrow">→</span> ${avatar(q, "sm")}${esc(q.name)}</li>`;
    }).join("");
    $("draws").hidden = false;
  });

  // delete party
  $("delBtn").addEventListener("click", () => { $("delConfirm").hidden = false; $("delBtn").hidden = true; $("delText").focus(); });
  $("delNo").addEventListener("click", () => { $("delConfirm").hidden = true; $("delBtn").hidden = false; $("delText").value = ""; $("delYes").disabled = true; });
  $("delText").addEventListener("input", e => { $("delYes").disabled = e.target.value.trim().toUpperCase() !== "VERWIJDER"; });
  $("delYes").addEventListener("click", () => { toast("Demo: in het echte platform wordt het feestje nu verwijderd"); $("delNo").click(); });

  function renderAll() { renderHead(); renderMeters(); renderPeople(); renderBoard($("hs"), kind); }
  renderAll();
})();
