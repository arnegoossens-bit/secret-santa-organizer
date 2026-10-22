(() => {
  "use strict";
  const { D, $, esc, store, people, savePeople, me, byId, avatar, euro, fmtDate, nf, scoreOf, board, renderBoard, bindTabs, toast, copy, daysTo, myToday } = window.SS;
  const I = me(), buddy = byId(D.draws[I.id]);
  const days = daysTo(D.party.date);

  // header + intro
  $("partyLabel").textContent = D.party.name;
  $("hello").textContent = `Hoi ${I.name}, nog ${days} ${days === 1 ? "dag" : "dagen"} tot het feest.`;
  $("manageLink").hidden = !I.host;

  // view tabs, deep-linkable with #feestje
  const views = [...document.querySelectorAll(".view")];
  function show(v) {
    views.forEach(x => x.hidden = x.dataset.view !== v);
    document.querySelectorAll(".tabs.big [role=tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === v)));
  }
  document.querySelectorAll(".tabs.big [role=tab]").forEach(b => b.addEventListener("click", () => { show(b.dataset.view); try { history.replaceState(null, "", b.dataset.view === "feestje" ? "#feestje" : "#"); } catch (e) {} }));
  if (location.hash === "#feestje") show("feestje");

  /* ---------- my Secret Santa ---------- */
  $("buddyName").textContent = buddy.name;
  $("msgOpen").textContent = `Stuur ${buddy.name} een anoniem bericht`;
  const reveal = $("reveal");
  function setReveal(open) {
    reveal.classList.toggle("open", open); $("revealBtn").setAttribute("aria-expanded", String(open)); $("hideBtn").hidden = !open;
  }
  $("revealBtn").addEventListener("click", () => setReveal(true));
  $("hideBtn").addEventListener("click", () => setReveal(false));
  $("partyFacts").innerHTML = `<div><b>${euro(D.party.budget)}</b><span>budget</span></div><div><b>${fmtDate(D.party.date, { day: "numeric", month: "short" })}</b><span>feest</span></div><div><b>${esc(D.party.location)}</b><span>locatie</span></div>`;
  $("msgOpen").addEventListener("click", () => { $("msgBox").hidden = false; $("msgText").focus(); });
  $("msgCancel").addEventListener("click", () => { $("msgBox").hidden = true; });
  $("msgSend").addEventListener("click", () => {
    if (!$("msgText").value.trim()) { $("msgText").focus(); return; }
    $("msgText").value = ""; $("msgBox").hidden = true; toast(`Anoniem bericht verstuurd naar ${buddy.name} (demo)`);
  });

  // game card
  const hintOpen = store.get("sl_hint_d" + D.party.adventDay, false);
  const today = myToday(), rankToday = board("today").findIndex(r => r.p.me) + 1, total = scoreOf(I, "total");
  $("gameStatus").innerHTML = `<div><b>${today ? nf(today) : "0"}</b><span>vandaag</span></div><div><b>${today ? rankToday + "e" : "–"}</b><span>dagstand</span></div><div><b>${nf(total)}</b><span>totaal</span></div>`;
  const hb = $("hintBox");
  hb.classList.toggle("locked", !hintOpen);
  hb.innerHTML = `<span class="k">Hint van vandaag</span><p>${hintOpen ? esc(D.hints.today) : "Nog op slot. Bezorg 5 pakjes op rij in Santa's Sleeroute."}</p>
    <details><summary>Eerdere hints (${D.hints.past.length})</summary><ul>${D.hints.past.map(([d, h]) => `<li><b>Dag ${d}</b><span>${esc(h)}</span></li>`).join("")}</ul></details>`;
  const guess = store.get("sl_guess", null);
  $("guessTxt").textContent = guess ? `Je gok van vandaag: ${guess}` : "Nog geen gok vandaag";

  // buddy wishlist with "ik koop dit"
  function renderBuddyWl() {
    const wl = buddy.wishlist;
    $("buddyWlTitle").textContent = `Verlanglijst van ${buddy.name}`;
    $("buddyWlCount").textContent = wl.length + (wl.length === 1 ? " cadeau" : " cadeaus");
    $("buddyWl").innerHTML = wl.length ? wl.map((w, i) => `<li class="${w.boughtBy ? "bought" : ""}"><span class="n">${i + 1}</span><span class="t"><b>${esc(w.t)}</b><span>ongeveer ${euro(w.p)}</span></span>
      <span class="acts"><label class="check"><input type="checkbox" data-i="${i}" ${w.boughtBy ? "checked" : ""}>Ik koop dit</label></span></li>`).join("")
      : `<li class="empty">${esc(buddy.name)} heeft nog geen verlanglijst gemaakt.</li>`;
  }
  $("buddyWl").addEventListener("change", e => {
    const i = +e.target.dataset.i; buddy.wishlist[i].boughtBy = e.target.checked ? I.id : undefined;
    savePeople(); renderBuddyWl(); toast(e.target.checked ? "Afgevinkt, de anderen zien dat je dit koopt" : "Weer vrijgegeven");
  });
  renderBuddyWl();
  const giftIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9c-2-5-7-5-5-1M12 9c2-5 7-5 5-1"/></svg>';
  $("ideas").innerHTML = D.giftIdeas.filter(g => g.p <= D.party.budget).map(g => `<div class="idea"><div class="ph">${giftIcon}</div><b>${esc(g.t)}</b><span>ongeveer ${euro(g.p)}</span></div>`).join("");

  // my wishlist: add, reorder, remove
  function renderMyWl() {
    const wl = I.wishlist;
    $("myWl").innerHTML = wl.length ? wl.map((w, i) => `<li><span class="n">${i + 1}</span><span class="t"><b>${esc(w.t)}</b><span>${w.p ? "ongeveer " + euro(w.p) : "geen prijs"}</span></span>
      <span class="acts">
        <button class="icon-btn" type="button" data-up="${i}" aria-label="Hoger zetten: ${esc(w.t)}" ${i === 0 ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
        <button class="icon-btn red" type="button" data-del="${i}" aria-label="Verwijder: ${esc(w.t)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </span></li>`).join("") : `<li class="empty">Je lijst is nog leeg. Voeg hieronder je eerste cadeau toe.</li>`;
  }
  $("myWl").addEventListener("click", e => {
    const up = e.target.closest("[data-up]"), del = e.target.closest("[data-del]");
    if (up) { const i = +up.dataset.up; [I.wishlist[i - 1], I.wishlist[i]] = [I.wishlist[i], I.wishlist[i - 1]]; }
    else if (del) { I.wishlist.splice(+del.dataset.del, 1); toast("Verwijderd van je lijst"); }
    else return;
    savePeople(); renderMyWl(); renderPeople();
  });
  $("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const t = $("addText").value.trim(); if (!t) { $("addText").focus(); return; }
    I.wishlist.push({ t, p: Math.max(0, Math.round(+$("addPrice").value || 0)) });
    $("addText").value = ""; $("addPrice").value = ""; savePeople(); renderMyWl(); renderPeople(); toast("Toegevoegd aan je verlanglijst");
  });
  $("shareWl").addEventListener("click", () => copy("https://secretsantaorganizer.com/nl/verlanglijst/demo-arne"));
  renderMyWl();

  /* ---------- the party ---------- */
  let kind = "today";
  const hsNote = { today: "Beste score van adventsdag 12. Alleen je beste vlucht telt.", total: "Som van alle dagrecords tot nu toe." };
  function renderHS() { renderBoard($("hs"), kind); $("hsNote").textContent = hsNote[kind]; }
  bindTabs($("hsTabs"), k => { kind = k; renderHS(); });
  renderHS();

  function renderPeople() {
    $("pCount").textContent = people.length + " deelnemers";
    const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    $("people").innerHTML = people.map(p => {
      const wl = p.wishlist, t = scoreOf(p, "today");
      const status = !p.opened ? '<span class="chip warn"><i></i>Uitnodiging nog niet geopend</span>'
        : `<span class="chip ${wl.length ? "ok" : ""}"><i></i>${wl.length ? wl.length + (wl.length === 1 ? " wens" : " wensen") : "Nog geen lijst"}</span>`;
      const play = t ? `<span class="chip blue">${nf(t)} vandaag</span>` : "";
      const items = wl.length ? `<ul class="wl">${wl.map((w, i) => `<li class="${w.boughtBy && !p.me ? "bought" : ""}"><span class="n">${i + 1}</span><span class="t"><b>${esc(w.t)}</b><span>ongeveer ${euro(w.p)}${w.boughtBy && !p.me ? " · al gekocht door iemand" : ""}</span></span><span></span></li>`).join("")}</ul>`
        : `<div class="empty">${p.me ? "Je hebt nog niets op je lijst gezet." : esc(p.name) + " heeft nog geen verlanglijst gemaakt."}</div>`;
      return `<details class="person"><summary>${avatar(p)}<span class="nm"><b>${p.me ? esc(p.name) + " (jij)" : esc(p.name)}${p.host ? " · organisator" : ""}</b><span>${p.opened ? "Doet mee" : "Uitgenodigd"}</span></span><span class="chips row">${play}${status}</span>${chev}</summary><div class="body">${items}</div></details>`;
    }).join("");
  }
  renderPeople();
})();
