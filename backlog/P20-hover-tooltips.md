<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P20 — Hover-Erklärungen für Icon-Bedienelemente (Tooltips)

Eingetragen 2026-08-27 nach Nutzervorgabe: „ich hätte gerne an den relevanten
Stellen Hover-Overlays nach Webdesign-Best-Practice, sowas wie *zur Stand-alone-
Grafik*". Anlass war der Sim-Link (↗) an den Aspekt-Figuren, dessen Zweck ohne
Beschriftung nicht erkennbar ist.

### Befund: der Ist-Zustand ist das native `title`-Attribut

Alle Icon-Knöpfe tragen heute ein `title`. Inventar (Stand v1.33.13):

| Ort | Elemente | heute |
|---|---|---|
| Aspekt-Figuren | Lupe (16×), Sim-Link (16×) | `title` + `aria-label` |
| Shell-Toolbar (`index.html`) | Zurück/Weiter, Kontakt, Drucken, Einstellungen, Darkmode, 3× Ansichtsbreite | `title` |
| gesamt `index.html` | 28 `title=`, 15 `aria-label` | |

Reproduzieren:

```
grep -o 'data-action="[^"]*"[^>]*title="[^"]*"' InteraktivesSkript_WIP/index.html
grep -rn "\.title = '" InteraktivesSkript_WIP/src/figures/*.js InteraktivesSkript_WIP/src/main.js
```

**Warum `title` nicht genügt** — das ist der eigentliche Grund für dieses Item,
nicht die Optik:

1. **Tastatur sieht es nie.** `title` erscheint nur bei Maus-Hover, nicht bei
   Fokus. Wer per Tab navigiert, bekommt keine Erklärung.
2. **Touch sieht es nie.** Kein Hover, kein `title`.
3. **~1 s Verzögerung**, dann nach ~5 s weg — liest sich wie „kaputt".
4. **Nicht gestaltbar**: OS-Tooltip in Systemfarben, ignoriert Darkmode und die
   CVD-Paletten. Ein weißer Kasten auf dunkler Seite.
5. **Doppelte Ansage**: Screenreader lesen je nach Einstellung `aria-label`
   *und* `title`.
6. **Position unkontrollierbar** — kann am Viewport-Rand abgeschnitten werden.

### Vorschlag: ein gemeinsamer Tooltip-Baustein, deklarativ angebunden

Ein Modul `src/tooltip.js` + ein CSS-Block, **kein** Tooltip-Code je Figur oder
je Knopf. Anbindung über ein Attribut, passend zur bestehenden
`data-action`-Konvention (s. `src/CLAUDE.md`, „Central event binding"):

```html
<button data-action="toggle_settings" aria-label="Einstellungen"
        data-tip="Einstellungen"
        data-tip-desc="Textgröße, Ansichtsbreite und Farbpalette">
```

Damit kostet ein neuer Knopf **ein Attribut**, nicht eine Codeänderung — das ist
die O(1)-Vorgabe aus der Wurzel-`CLAUDE.md`.

**Verhalten (Best Practice, jeweils mit Grund):**

- **Hover UND `:focus-visible`** auslösen. Das schließt Lücke 1 — der eigentliche
  Gewinn gegenüber `title`.
- **Verzögerung** ~400 ms beim Einblenden, ~100 ms beim Ausblenden, dazu ein
  „warmer" Zustand: wandert der Zeiger direkt auf einen benachbarten Knopf,
  erscheint der nächste Tooltip sofort. Ohne das fühlt sich eine Icon-Leiste
  zäh an.
- **Kein Timeout.** Der Tooltip bleibt, solange Hover/Fokus bestehen.
- **Escape** schließt; `pointerdown` und Scrollen blenden aus.
- **Positionierung**: bevorzugt oberhalb, kippt nach unten, wenn oben kein Platz
  ist; horizontal am Viewport geklemmt; kleiner Zeiger-Pfeil.
- **Nur bei feinem Zeiger**: `@media (hover: hover) and (pointer: fine)`. Auf
  Touch erscheint nichts — dort braucht ein Knopf eine sichtbare Beschriftung,
  das ist ein eigenes Thema (s. „Nicht in diesem Item").
- **`prefers-reduced-motion: reduce`** → keine Ein-/Ausblendanimation.

**A11y:**
- Der Knopf behält seinen `aria-label` als zugänglichen Namen.
- Der Tooltip bekommt `role="tooltip"` + `id`; der Auslöser erhält
  `aria-describedby` **nur solange er sichtbar ist**.
- **Das native `title` wird beim Anbinden entfernt** — sonst erscheint der
  OS-Tooltip zusätzlich und Screenreader lesen doppelt.

**Optik:** ausschließlich vorhandene Tokens (`--kb-surface`, `--kb-border`,
`--ink-2`/`--ink-3`). Dann folgen Darkmode (`darkmode.css`) und die
CVD-Paletten (`aspekt_paletten.css`) automatisch, ohne eigenen Zweig.

### Der Fallstrick, an dem eine naive Umsetzung scheitert

**`.aspekt-figur` trägt `position: relative; overflow: hidden`**
(`aspekt_kreisbahn.css:141`). Ein Tooltip als Kind der Figur wird an deren Rand
**abgeschnitten** — genau so ist der QR-Code im Druck zur Hälfte verschwunden
(behoben in `c8b8928`). Lupe und Sim-Link sitzen oben rechts *in* der Figur, also
trifft es ausgerechnet die beiden wichtigsten Fälle.

**Konsequenz:** das Tooltip-Element wird **an `document.body` gehängt** und per
`getBoundingClientRect()` des Auslösers positioniert (Portal-Muster), nicht in
den Auslöser hinein. Beim Scrollen ausblenden statt nachführen — das spart die
Reposition-Schleife und ist das übliche Verhalten.

Zweiter Punkt: **im Druck darf kein Tooltip erscheinen** — `#print_container`
blendet Lupe und Sim-Link ohnehin aus (`aspekt_kreisbahn.css:609`), das
Body-Element braucht zusätzlich `@media print { display: none }`.

### Wo (Reihenfolge nach Nutzen)

1. **Sim-Link (16×)** — der Auslöser des Wunsches. Vorschlag:
   Titel „Stand-alone-Simulation", Beschreibung „Öffnet die vollständige
   Simulation in einem neuen Tab".
2. **Lupe (16×)** — zwei Zustände, der Tooltip muss mit `setLupeZustand()`
   mitwandern (s. `0e7aecd`): „Figur vergrößern" ↔ „Vergrößerung schließen".
3. **Shell-Toolbar** — 9 Knöpfe, reine `title`→`data-tip`-Migration.
4. **Ablaufleiste und Panel-Klapper** der Figuren, soweit sie nur Symbole tragen.

### Sub-Tasks

- [x] **P20-0 Abstimmung** — erledigt 2026-08-27. Nutzervorgabe: **einzeilig,
  wo es geht; zweizeilig nur, wo nötig.** Texte s. Abschnitt „Die Texte" unten.
  *(S)*
- [x] **P20-1 Baustein** — `src/tooltip.js` (Portal an `document.body`, Delay
  400/100 ms mit warmem Fenster, Flip-Positionierung mit Viewport-Klemmung und
  Pfeil, Escape/Scroll/Resize/Pointerdown schließen, `aria-describedby` nur
  solange sichtbar, `title`-Entfernung beim ersten Anzeigen) + CSS-Block in
  `styles.css` aus den vorhandenen Tokens. Verdrahtet in `main.js::init()`,
  delegiert an `document` — deckt damit auch die zur Laufzeit gebauten Figuren
  ohne Nachverdrahtung ab. *(M)*
- [x] **P20-2 Migration** — 116 Elemente tragen `data-tip`, **0** ein
  verbliebenes `title`. Shell: 11 Knöpfe; Figuren: Lupe (16), Sim-Link (15),
  Ablaufsteuerung (14×3), Panel-Köpfe (16+16). Bei der Ansichtsbreite wurde das
  `title` wie entschieden ersatzlos entfernt. `aria-label` unverändert. *(M)*
- [x] **P20-3 Zustandswechsel** — `setLupeZustand()` setzt `data-tip` mit:
  „Figur vergrößern" ↔ „Vergrößerung schließen". *(S)*
- [~] **P20-4 Prüfung** — automatisiert bestanden (s. „Prüfergebnis"). **Sicht
  (Stufe 5) durch den Nutzer steht aus.** *(M)*

### Prüfergebnis (automatisiert, 2026-08-27, v1.34.0)

| Prüfung | Ergebnis |
|---|---|
| Elemente mit `data-tip` | 116 |
| davon mit verbliebenem `title` | **0** |
| davon ohne zugänglichen Namen | 0 |
| zweizeilig (`data-tip-desc`) | 17 = 2 Toolbar + 15 Sim-Links |
| Hover: Text korrekt, im Viewport, nicht abgeschnitten | 9/9 |
| Tastaturfokus zeigt Tooltip + setzt `aria-describedby` | ja |
| Lupe: Text folgt dem Zustand | ja (auf/zu/wieder auf) |
| Druck (`?print=true`, `media: print`) | kein Tooltip, 0 im Klon |
| Konsolenfehler | keine |
| Tooltip über dem Lupe-Overlay | ja (z-index 1100 > 1000, `elementFromPoint` liefert den Tooltip) |

**Nachtrag v1.34.1:** in der ersten Fassung lag der Tooltip im Overlay
*hinter* der Figur — `.tooltip` hatte `z-index: 100`, `.aspekt-overlay-back`
hat 1000 (`aspekt_kreisbahn.css:563`). Beide hängen an `document.body`, liegen
also im selben Stapelkontext, der Wert entschied direkt. Auf 1100 angehoben.
Zeiten nach Sichtprüfung gestrafft: 400/100 ms → **250/60 ms**, Überblendung
120 → 90 ms.

15 Sim-Links bei 16 Figuren ist korrekt — `bus_weg_zeit` hat keine Quell-Sim
(s. `src/figures/CLAUDE.md`).

### Die Texte (P20-0, entschieden 2026-08-27)

Regel: **einzeilig**. Eine zweite Zeile bekommt nur, wo die Kurzform eine echte
Frage offen lässt — bei einem Ziel außerhalb der Seite oder wenn hinter dem
Knopf ein Menü statt einer direkten Aktion steckt. Das trifft auf **drei** von
siebzehn zu.

**Aspekt-Figuren**

| Element | Zeile 1 | Zeile 2 |
|---|---|---|
| Sim-Link ↗ | Stand-alone-Simulation | Öffnet die vollständige Simulation in einem neuen Tab |
| Lupe (zu) | Figur vergrößern | — |
| Lupe (offen) | Vergrößerung schließen | — |
| Start ▶ | Abspielen | — |
| Pause ⏸ | Pause | — |
| Reset ↺ | Auf Anfang zurücksetzen | — |
| Kopf „Bedienung" | Bedienung ein-/ausklappen | — |
| Kopf „Analyse" | Analyse ein-/ausklappen | — |

Der Sim-Link ist der einzige Knopf, der die Seite verlässt — genau der Fall,
für den die zweite Zeile gedacht ist (und der Auslöser dieses Items).

**Shell-Toolbar**

| Element | Zeile 1 | Zeile 2 |
|---|---|---|
| Inhaltsverzeichnis | Inhaltsverzeichnis | — |
| Drucken | Drucken | Wählt den Umfang: Alles, Themenkomplex, Kapitel oder Abschnitt |
| Kontakt | Kontakt | — |
| Einstellungen | Einstellungen | Textgröße, Ansichtsbreite und Farbpalette |
| Dunkelmodus | Dunkelmodus umschalten | — |
| Pager ‹ (Kopf) | Vorherige Seite | — |
| Pager › (Kopf) | Nächste Seite | — |
| ☰ Kapitelnavigation | Kapitelnavigation | — |
| ✕ (TOC schließen) | Schließen | — |
| A− / A+ | Text kleiner / Text größer | — |

Zweizeilig sind **Drucken** (dahinter liegt ein Menü mit vier Umfängen, nicht
der direkte Druck) und **Einstellungen** (ein Zahnrad für drei unabhängige
Einstellungen).

**Bewusst OHNE Tooltip** — sie tragen eine sichtbare Beschriftung, ein Tooltip
würde sie nur wiederholen:

- Farbpalette (`Normal` / `Rot-Grün-Sichtig` / `Blau-Gelb-Sichtig`)
- Ansichtsbreite (`Schmal` / `Normal` / `Breit`) — **hier zusätzlich das
  vorhandene `title` ersatzlos entfernen**, es sagt nichts, was das Label nicht
  schon sagt.
- Druck-Umfang im Menü (`Alles` / `Themenkomplex` / `Kapitel` / `Abschnitt`)
- Untere Seitennavigation (`‹ Zurück` / `Weiter ›`)

**Schreibweise:** Infinitiv für Aktionen („Abspielen", „Schließen"), Substantiv
für Ansichten („Inhaltsverzeichnis", „Kontakt") — wie die bestehenden
`aria-label`. Die `aria-label` bleiben unverändert; sie dürfen länger sein als
der Tooltip (z. B. „Start: automatischen Ablauf abspielen").

---

### Nicht in diesem Item

- **Touch-Bedienbarkeit** der Icon-Knöpfe (sichtbare Beschriftungen oder ein
  Long-Press-Blatt). Eigenes Thema; das Projekt ist ausdrücklich
  Desktop/Tablet-only (s. `src/CLAUDE.md`, „Responsive scope").
- **Graph-Hover** in den Figuren (`kreisbewegung/lib/hover.js`, Kurvenwerte am
  Zeiger). Anderer Mechanismus, anderer Zweck — nicht zusammenlegen.

---
