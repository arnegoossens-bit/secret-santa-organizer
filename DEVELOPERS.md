# Developer notes: Secret Santa Organizer, Kerst 2026

Dit is een **klikbaar prototype**, geen productiecode. Het dient als functionele en visuele referentie voor de bouw in het echte platform. Alle data is voorbeelddata en er is geen backend.

Live: https://arnegoossens-bit.github.io/secret-santa-organizer/

## Structuur

```
index.html                  Homepage
feestje-aanmaken.html       Aanmaakflow in 3 stappen
sleeroute.html              Santa's Sleeroute (adventsspel)
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
3. **Eindscherm** (`showEnd()`): score, hintkaarten, gok van de dag, klassement, extra vlucht via sponsorvideo (`playAd()`, demo van 5 s).

### Spelregels (constanten bovenaan en in de code)
| Wat | Waar | Waarde |
|---|---|---|
| Duur van een vlucht | `DURATION` | 45 s |
| Sterren voor hints | `HINT_STARS` | 2, 4 en 6 sterren openen hint 1, 2, 3 |
| Pakje in schoorsteen | `deliver()` | +100 × combo (combo tot ×5, +1 per 2 treffers op rij) |
| Ster | update-loop | +100 |
| Sponsorballon (door de ring) | update-loop | +150 |
| Toren raken | `hurt()` | kost 1 van 3 mutsen, combo vervalt |
| Valfysica pakje | `G`, `DROP_V` | 15 en 1.5 (de gouden ring rond een schoorsteen gebruikt dezelfde formule) |

### Data die nu hardcoded is en uit de API moet komen
| In de code | Moet worden |
|---|---|
| `HINTS` | De 3 hints die de Secret Santa van deze speler schreef (mogen een vals spoor zijn) |
| `PEOPLE` | Deelnemers van het feestje (voor de gok) |
| `BOARD`, `ME_BASE` | Klassement van het feestje: scores van vandaag en totaal |
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

## Nog niet in het prototype
- Hints uitzetten ("verrassing bewaren") per deelnemer
- Onthulling van echte en valse hints op het feest
- Highscores per dag en totaal, deelnemerspagina met verlanglijsten (in ontwerp)
