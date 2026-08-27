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

- [ ] **P20-0 Abstimmung** — Texte je Knopf festlegen (kurzer Titel, optionale
  Beschreibung), und ob Beschreibungen überhaupt gewünscht sind oder ein
  einzeiliger Tooltip genügt. *(S)*
- [ ] **P20-1 Baustein** — `src/tooltip.js` (Portal, Delay, Flip-Positionierung,
  Escape/Scroll/Pointerdown, `aria-describedby`, `title`-Entfernung) + CSS-Block
  mit den vorhandenen Tokens. Verdrahtung in `main.js::init()`. *(M)*
- [ ] **P20-2 Migration** — `title=` → `data-tip=` an den vier Orten oben;
  `aria-label` unangetastet lassen. *(M)*
- [ ] **P20-3 Zustandswechsel** — Lupe: Tooltip-Text folgt dem Zustand. *(S)*
- [ ] **P20-4 Prüfung** — automatisiert: erscheint der Tooltip bei Hover **und**
  bei Fokus, wird er nirgends abgeschnitten (Rechteck vollständig im Viewport,
  kein clippender Vorfahr), gibt es kein verbliebenes `title` an einem
  `data-tip`-Element, ist im Druck-Klon keiner sichtbar. Sicht (Stufe 5) durch
  den Nutzer. *(M)*

### Nicht in diesem Item

- **Touch-Bedienbarkeit** der Icon-Knöpfe (sichtbare Beschriftungen oder ein
  Long-Press-Blatt). Eigenes Thema; das Projekt ist ausdrücklich
  Desktop/Tablet-only (s. `src/CLAUDE.md`, „Responsive scope").
- **Graph-Hover** in den Figuren (`kreisbewegung/lib/hover.js`, Kurvenwerte am
  Zeiger). Anderer Mechanismus, anderer Zweck — nicht zusammenlegen.

---
