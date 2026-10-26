/* Voorbeelddata voor de beheer- en deelnemerspagina.
   In het echte platform komt dit uit de API. Eén plek, zodat het makkelijk te vervangen is. */
window.DEMO = (() => {
  const party = {
    name: "Familie Peeters, Kerst 2026",
    date: "2026-12-20",
    location: "Bij oma in Lier",
    budget: 25,
    message: "Thema dit jaar: iets zelfgemaakts mag ook!",
    gameOn: true,
    adventDay: 12,
    demoToday: "2026-12-12"           // het prototype doet alsof het vandaag 12 december is
  };
  // me = de bezoeker van de deelnemerspagina (hier ook de organisator)
  const people = [
    { id: "arne", name: "Arne", email: "arne@voorbeeld.be", host: true, me: true, opened: true, today: null, totalBefore: 9950,
      wishlist: [
        { t: "Bordspel Cascadia", p: 40 },
        { t: "Warme wollen sokken", p: 15 },
        { t: "Koffiebonen van een lokale brander", p: 18 },
        { t: "Boek: iets over design of typografie", p: 30 }
      ] },
    { id: "sofie", name: "Sofie", email: "sofie@voorbeeld.be", opened: true, today: 1650, total: 14220,
      wishlist: [{ t: "Yogamat", p: 30 }, { t: "Theeset met zeefje", p: 22 }, { t: "Plantenspuit van glas", p: 12 }] },
    { id: "jonas", name: "Jonas", email: "jonas@voorbeeld.be", opened: true, today: 1420, total: 13180,
      wishlist: [{ t: "Fietslampjes (oplaadbaar)", p: 25 }, { t: "Muts in donkergroen", p: 20 }, { t: "Hot sauce proefpakket", p: 19 }, { t: "Puzzel van 1000 stukjes", p: 16 }] },
    { id: "lotte", name: "Lotte", email: "lotte@voorbeeld.be", opened: true, today: 980, total: 11050,
      wishlist: [{ t: "Kookboek met veggie recepten", p: 25 }, { t: "Leeslampje", p: 18 }] },
    { id: "wout", name: "Wout", email: "wout@voorbeeld.be", opened: true, today: 1210, total: 9860,
      wishlist: [{ t: "Klimkalk en kalkzakje", p: 20 }, { t: "Draadloze oordopjes (budget)", p: 25 }] },
    { id: "elif", name: "Elif", email: "elif@voorbeeld.be", opened: true, today: 640, total: 8120, wishlist: [] },
    { id: "bram", name: "Bram", email: "bram@voorbeeld.be", opened: true, today: 0, total: 6400,
      wishlist: [{ t: "Vinylplaat van een Belgische band", p: 25 }] },
    { id: "noor", name: "Noor", email: "noor@voorbeeld.be", opened: true, today: 820, total: 5240,
      wishlist: [{ t: "Schetsboek A5", p: 12 }, { t: "Set fineliners", p: 15 }, { t: "Mok met naam", p: 14 }] },
    { id: "rita", name: "Tante Rita", email: "rita@voorbeeld.be", opened: false, today: null, total: 0, wishlist: [] }
  ];
  // trekking (alleen zichtbaar voor de organisator via "Toon alle trekkingen")
  const draws = { arne: "jonas", sofie: "lotte", jonas: "wout", lotte: "rita", wout: "noor", elif: "arne", bram: "sofie", noor: "elif", rita: "bram" };
  const giftIdeas = [
    { t: "Gezelschapsspel voor twee", p: 22 }, { t: "Kaarsen met winterse geur", p: 15 },
    { t: "Chocolade van een lokale chocolatier", p: 18 }, { t: "Plaid in zachte fleece", p: 25 }
  ];
  // hints die jouw Secret Santa (Elif) over zichzelf schreef; mogen een vals spoor zijn
  // dagstreak: hints worden vrijgespeeld op dag 3, 6, 10, 15 en 20 van je reeks (max 5 per feestje)
  const streak = { before: 9, milestones: [3, 6, 10, 15, 20] };
  // de 5 hints die jouw Secret Santa (Elif) over zichzelf schreef; mogen een vals spoor zijn
  const hints = ["Is de oudste van drie kinderen.", "Speelt al jaren in een fanfare.", "Drinkt elke ochtend twee koffie, zwart en zonder suiker.", "Heeft twee katten.", "Draagt bijna altijd een sjaal, ook binnen."];
  return { party, people, draws, giftIdeas, hints, streak };
})();
