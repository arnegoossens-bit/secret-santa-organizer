# Developer notes: Secret Santa Organizer, Kerst 2026

Dit is een **klikbaar prototype**, geen productiecode. Het dient als functionele en visuele referentie voor de bouw in het echte platform. Alle data is voorbeelddata en er is geen backend.

Live: https://arnegoossens-bit.github.io/secret-santa-organizer/

## Structuur

```
index.html                  Homepage
feestje-aanmaken.html       Aanmaakflow in 3 stappen
sleeroute.html              Santa's Sleeroute (adventsspel)
deelnemer.html              Deelnemerspagina (mijn Secret Santa + het feestje)
beheer.html                 Beheerpagina voor de organisator
assets/css/app.css          Gedeelde stijl voor deelnemer en beheer
assets/js/demo-data.js      Datamodel met voorbeelddata (window.DEMO)
assets/js/common.js         Gedeelde helpers (window.SS): opslag, highscores, avatars
assets/css/<pagina>.css     Stijl per pagina
assets/js/<pagina>.js       Logica per pagina (vanilla JS, geen build-stap)
assets/img/                 Screenshots die op de pagina's gebruikt worden
```

Geen bundler of framework. Lokaal draaien:

```
python3 -m http.server 8000
# open http://localhost:8000
```

Externe afhankelijkheden (via CDN):
- three.js `0.149.0` (jsDelivr) voor de 3D-hero op de homepage en de game
- Manrope (Google Fonts)

## Huisstijl (iO)

| Token | Waarde |
|---|---|
| Font | Manrope 500 (body), 600 (titels in kaarten) |
| Tekst | `#232323` |
| Accent | `#0000D2` (iO-blauw) |
| Zachte achtergrond | `#F2E9E4` (blush) |
| Kaarten | wit, radius 24px |
| Knoppen | pill (radius 100px), zwart of iO-blauw |

De tokens staan als CSS custom properties bovenaan elk CSS-bestand.

## Santa's Sleeroute (`assets/js/sleeroute.js`)

### Flow
1. **Intro** (`#intro`): uitleg, wat je vandaag kan verdienen, sponsor van de dag.
2. **Vlucht** van `DURATION` = 45 s. `start()` → `reset()` → game loop `update(dt)`.
3. **Dagrecord** (`startCelebrate()`): alleen bij een nieuwe persoonlijke dagscore. 4 s vlucht rond de slee met vuurwerk, dit is de basis voor de highscore-video. Nu wordt er alleen een stilstaand beeld bewaard (`S.snap`); een echte clip opnemen kan met `canvas.captureStream()` + `MediaRecorder`.
4. **Eindscherm** (`showEnd()`): score, hintkaarten, gok van de dag, klassement, extra vlucht via sponsorvideo (`playAd()`, demo van 5 s).

### Spelregels (constanten bovenaan en in de code)
| Wat | Waar | Waarde |
|---|---|---|
| Duur van een vlucht | `DURATION` | 45 s |
| Hint van vandaag | `STREAK_FOR_HINT` | 1 hint per dag, vrijgespeeld met een reeks van 5 pakjes op rij raak (mis of toren = reeks terug naar 0) |
| Pakje in schoorsteen | `deliver()` | +100 × combo (combo tot ×5, +1 per 2 treffers op rij) |
| Ster | update-loop | +100 (alleen punten) |
| Sponsorballon (door de ring) | update-loop | +150 |
| Toren raken | `hurt()` | kost 1 van 3 mutsen, combo vervalt |
| Valfysica pakje | `G`, `DROP_V` | 15 en 1.5 (de gouden ring rond een schoorsteen gebruikt dezelfde formule) |

### Data die nu hardcoded is en uit de API moet komen
| In de code | Moet worden |
|---|---|
| `TODAY_HINT` | De hint van vandaag die de Secret Santa van deze speler schreef (mag een vals spoor zijn) |
| `PEOPLE` | Deelnemers van het feestje (voor de gok) |
| `BOARD_TODAY`, `BOARD_TOTAL`, `ME_TOTAL_BEFORE` | Highscores van het feestje: beste score van vandaag en som van de dagrecords |
| `PAST`, `PAST_GUESSES` | Hints en gokken van eerdere adventsdagen |
| `store` (localStorage) | Gok van vandaag en beste score: server-side per deelnemer opslaan |
| Sponsor "Jouw Merk Hier" | Sponsor per adventsdag en per taal (naam, logo, video, cadeautip) |

### Te loggen events (voorstel)
`round_start`, `round_end` (score, bezorgd, sterren, raak-percentage), `hint_unlocked`, `guess_set`, `sponsor_balloon_hit`, `sponsor_video_complete`, `share_click`.

### Debug
In de browserconsole is de spelstatus beschikbaar als `window.__sl` (bijvoorbeeld `__sl.lives = 99`).

## Feestje aanmaken (`assets/js/feestje-aanmaken.js`)
- Stap 1 deelnemers, stap 2 instellingen (budget, datum, uitsluitingen, Sleeroute aan/uit), stap 3 uitnodiging.
- `drawPossible()` controleert met een bipartite matching of de trekking met de gekozen uitsluitingen nog mogelijk is. Dezelfde check moet server-side gebeuren.
- Concept wordt per browser bewaard in localStorage (`cp_draft`). Verzenden doet niets (`preventDefault`).

## Deelnemerspagina (`deelnemer.html`, `assets/js/deelnemer.js`)
Twee tabs, `#feestje` opent direct de tweede (het eindscherm van de game linkt daarheen).
- **Mijn Secret Santa**: getrokken naam (eerst vervaagd, tik om te tonen), feestgegevens, anoniem bericht, status van de Sleeroute (dagscore, totaal, hint van vandaag of nog vergrendeld, eerdere hints, gok), verlanglijst van je getrokken persoon met "Ik koop dit" (zichtbaar voor iedereen behalve die persoon), cadeau-ideeën binnen budget, en je eigen verlanglijst (toevoegen, volgorde, verwijderen, delen).
- **Het feestje**: highscores Vandaag en Totaal, en wie er meedoet met status en de verlanglijst van iedereen. Wie wie trok blijft geheim.
- De dagscore van "jij" leest `sl_best_d12` uit de game, zodat een gespeelde vlucht meteen in de highscores staat.

## Beheerpagina (`beheer.html`, `assets/js/beheer.js`)
- Status: hoeveel deelnemers hun uitnodiging openden, een verlanglijst maakten en vandaag speelden; herinnering sturen naar wie achterloopt; update naar iedereen.
- Feestgegevens aanpassen (naam, datum, locatie, budget).
- Deelnemers: persoonlijke link kopiëren, uitnodiging opnieuw mailen, verwijderen (bevestiging, daarna nieuwe trekking), toevoegen met validatie.
- Highscores Vandaag/Totaal en de Sleeroute aan/uit voor de groep.
- Alle trekkingen tonen (met waarschuwing) en feestje verwijderen (typ VERWIJDER).

## Datamodel (`assets/js/demo-data.js`)
`window.DEMO` toont welke data de API moet leveren:
- `party`: naam, datum, locatie, budget, `gameOn`, `adventDay`
- `people[]`: id, naam, e-mail, `host`, `me`, `opened`, `today` (dagscore of null), `total`, `wishlist[]` ({text, price, boughtBy})
- `draws`: gever-id naar ontvanger-id (in productie nooit volledig naar de client sturen, alleen de eigen trekking)
- `giftIdeas`, `hints` (vandaag + eerdere dagen)

Wijzigingen worden in het prototype bewaard in localStorage (`ss_people`, `ss_party`). Wis die om opnieuw te beginnen.

## Nog niet in het prototype
- Hints uitzetten ("verrassing bewaren") per deelnemer
- Onthulling van echte en valse hints op het feest
- Echte opname en delen van de highscore-video
