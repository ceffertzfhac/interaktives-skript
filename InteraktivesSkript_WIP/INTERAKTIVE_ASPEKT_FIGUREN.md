# Interaktive Aspekt-Figuren — How-to für Erstellung & Übertragung

Anleitung, um aus einer der umfangreichen Stand-alone-Simulationen
(`Input/Simulationen/Project_*`) eine **interaktive Aspekt-Figur** an einer
konkreten Stelle im Skript zu bauen — nach dem Muster der ersten Umsetzung
(`src/figures/aspekt_kreisbahn.js`, Abbildung 1.38 in 1.4.1).

Geschrieben als **Runbook**: erst das Konzept und die Architektur, dann Schritt
für Schritt, dann ein Katalog der real aufgetretenen Fallstricke (das ist der
wertvollste Teil), zuletzt eine Checkliste.

> Referenz-Implementierung, an der sich alles Folgende belegt:
> `src/figures/aspekt_kreisbahn.js` (374 Z.) + `src/figures/aspekt_kreisbahn.css`
> (217 Z.) + Verdrahtung in `src/main.js` + Einbettung in
> `chapters/ch_01_kreisbewegungen.html`.

---

## 0. Das Konzept (warum es so gebaut ist)

Die Stand-alone-Sims im `Input/`-Ordner sind **sehr umfangreich** (Auto-Play,
viele Regler, Dutzende Graph-Typen, alle Vektoren, Export …). Im interaktiven
Skript soll aber — wie schon im Legacy-Skript — **pro Kapitel-Aspekt nur ein
Teil** interaktiv sein. Gleichzeitig sollen die interaktiven Elemente **optisch
und technisch an den Stand-alone-Sims** hängen (hoher Wiedererkennungswert,
konsistente UI/UX).

Daraus folgen die drei Leitentscheidungen:

1. **Motor wiederverwenden, nicht nachbauen.** Die Figur importiert
   `physics`/`render`/`state`/`constants` der bereits portierten Sim
   (`src/figures/kreisbewegung/`) und *feature-gated* sie auf den relevanten
   Aspekt. Kein eigener Zeichencode → die Optik ist 1:1 die der Sim.
2. **Zweistufig mit Lupe.** Inline in der Lesespalte (relativ kompakt, aber
   voll interaktiv), und per Lupe ein Overlay, das über dem Skript schwebt
   (~0.95 Breite/Höhe).
3. **Nur relevante Features.** Store-Flags schalten alles Nicht-Relevante ab
   (bei der Kreisbahn: nur Position — Ortsvektor + Komponenten + durchlaufener
   Bogen; keine v/a, keine Graphen, kein Play/Pause).

**Vorher entscheiden (mit dem Nutzer):** Welcher Aspekt? Welche Regler? Ersetzt
die interaktive Figur die statische Abbildung im Lesefluss oder ergänzt sie sie?
(Bei 1.4.1: interaktiv am Bildschirm, statische Abbildung bleibt Druck-Fallback
— das Legacy-Muster.)

---

## 1. Vorarbeit: die Quelle verstehen

1. **Ist die Sim schon portiert?** Kreisbewegung lag bereits als
   `src/figures/kreisbewegung/` vor (aus `Project_kreisbewegung_simulation`,
   inkl. `lib/` = die `shared/js/*` der Vorlage). Eine noch nicht portierte Sim
   muss zuerst wie diese portiert werden (IDs mit `kb_`-Präfix o. ä., damit sie
   neben den übrigen Figuren im gemeinsamen Dokument kollisionsfrei ist).
2. **Den Motor lesen** (`kreisbewegung/`):
   - `physics.js`: `angleRad(t)=φ0+ω·t`, `position(t)`, `velocity(t)`,
     `acceleration(t)`, `precompute()`, `recomputeDerived()`.
   - `render.js`: `setupScene()` (Zoom + Achsen + Scheibe, gibt `centers`
     zurück), `updateScene(t, p, v, a, centers)` (zeichnet Punkt, Vektoren,
     Bogen — **gated über `store.show*`-Flags**), `drawCoordSystem()`,
     `drawTrajectoryCircle()`.
   - `state.js`: der **Singleton-`store`** (Parameter + `show*`-Flags +
     Zeitreihen) und `DOM`/`initDOM()` (der DOM-Cache mit `kb_`-IDs).
   - `constants.js`: `ANIM_W/ANIM_CX`, `R_MIN/R_MAX`, `DEFAULT_PIXELS_PER_METER`.
3. **Den Aspekt festlegen.** Welche `show*`-Flags sind an? Welche Regler? Ein
   Blick in die Legacy-Figur an derselben Stelle hilft (gc1 „Kreisbahn" hatte
   genau φ/φ0/R — der Positions-Aspekt).

---

## 2. Den Motor feature-gated ansteuern

Der Kern-Trick: **den zeit-/ω-getriebenen Motor mit einem Regler statt einer
Animationsschleife füttern.** Für die Kreisbahn wird der φ-Regler auf eine
Pseudo-Zeit abgebildet:

```js
const OMEGA_DEG = 60;                 // beliebig, nur ≠ 0; nie als Wert gezeigt
function draw(phiDeg) {
    const t = (phiDeg * Math.PI / 180) / store.omega;   // φ → Pseudo-Zeit
    precompute();                     // erzeugt die Zeitreihe (Bogen) bis t
    updateScene(t, position(t), velocity(t), acceleration(t), sceneCenters);
    drawAngle(phiDeg);                // aspekt-spezifische Zusatz-Zeichnung
}
```

Flags setzen (alles Nicht-Relevante aus):

```js
Object.assign(store, {
    showPositionVector: true, showPositionComponents: true, showTrajectory: true,
    showVelocityVector: false, showVelocityComponents: false,
    showAccelerationVector: false, showAccelerationComponents: false,
    isDigitalDisplay: false,
});
```

**Bei R-Änderung neu skalieren:** `setupScene()` erneut aufrufen (aktualisiert
Zoom + Scheibe), dann die eigenen Achsen, dann `draw(φ)`. Nur bei φ-Änderung
reicht `draw(φ)` — im Referenzcode wird der Einfachheit halber bei jedem Input
`setupScene()` aufgerufen (billig).

---

## 3. Das DOM-Skelett (der heikle Teil)

`render.js` liest aus dem Singleton-`DOM`, den `initDOM()` per `kb_`-ID füllt.
Das Skelett muss **exakt die Elemente enthalten, die `setupScene()` und
`updateScene()` anfassen** — inklusive versteckter Stubs:

- **Szene sichtbar:** `kb_main_svg`, `kb_animation_coord_system`, `kb_disk`,
  `kb_trajectory_path`, `kb_point`, `kb_zoom_text_display`, `kb_position_vector`
  (+ `_x`/`_y`).
- **Stubs versteckt, aber vorhanden** (sonst Null-Zugriffe!):
  - v/a-Vektoren `kb_velocity_vector`/`kb_acceleration_vector` (+ Komponenten) —
    `updateScene` setzt ihre `visibility`.
  - Stoppuhr `kb_stopwatch`/`_circle`/`_marks`/`kb_subdial`/`_main_hand`/
    `_sub_hand`/`kb_digital_display_group` — `updateScene` schreibt die Zeiger.
  - Live-Panel `kb_time_label` + `kb_live_t/phi/x/y/vx/vy/vabs/ax/ay/aabs` —
    `updateScene` beschreibt sie **immer** am Ende.

> **Merke:** `initDOM()` ist null-sicher (`DOM.x = q(id)` → `null` schadet
> nicht). `updateScene()` ist es **nicht** — es dereferenziert `timeLabel`,
> die Live-Spans und die Stoppuhr-Zeiger. Genau diese Null-Zugriffe hat der
> Headless-Test gefunden; die Stubs decken sie ab.

`initDOM()` unverändert aufrufen; fehlende Graph-/Control-IDs werden harmlos
`null`, solange die zugehörigen Funktionen (Graph-Zeichnung etc.) nicht laufen.

---

## 4. Optik: verbatim aus der Vorlage

Für den Wiedererkennungswert werden **Farb-Tokens und Panel-/Slider-/Legenden-/
Analyse-Regeln VERBATIM** aus der portierten `kreisbewegung/styles.css`
übernommen, aber **auf eine Klasse (`.aspekt-figur`) statt `#gc10` gescopt**:

- Tokens: `--kb-surface/border/text/text2/text3/accent/r/rx/ry/traj/font/…`.
- Struktur & Klassen der Vorlage 1:1 verwenden: `panel-section` + `panel-label`
  (Versal-Header), `slider-label` über dem Regler, `slider-row` + `slider-val`
  (Akzentfarbe), `legend-grid` mit `legend-swatch`/`legend-label`, die
  Range-Slider mit eigenem Track/Thumb, und für die Analyse `analysis-grid` mit
  `analysis-cell key`/`val` + `panel-header`/`panel-body` (Kopf-Leiste zum
  Ein-/Ausklappen).
- Formelzeichen als **MathJax** (`\(\varphi\)`, `\(R\)`, `\(r_x\)`) — nicht als
  rohes Unicode (s. Fallstrick unten). Werte mit **deutschem Dezimalkomma**.

**Layout je Breiten-Modus** über `data-width-mode` an der Wurzel (setzt
`core.js::set_width_mode`): schmal = gestapelt; normal = Panel links | Szene;
breit = Panel links | Szene | Analyse rechts. Overlay (Lupe) = immer
dreispaltig. **Wichtig:** die Modus-Regeln mit `:not(.aspekt-im-overlay)`
scopen, sonst schlagen sie per Spezifität die Overlay-Regeln (s. Fallstrick).

---

## 5. Zweistufig: inline + Lupe-Overlay

- **Inline:** Die Figur ist volle Lesespaltenbreite (`display:block`,
  `margin:0 0 20px`, wie die Formelkarten), die SVG per `max-width` gedeckelt.
- **Lupe → Overlay:** Die *lebende* Figur wird per DOM **verschoben** (nicht
  geklont) in ein `position:fixed`-Overlay; auf Schließen zurück an die
  Ursprungsstelle (`overlayReturn = {parent, next}`). Der Motor-DOM-Cache bleibt
  gültig, weil dieselben Knoten wandern.
- **Overlay-Höhe:** die SVG an der **Viewport-Höhe** deckeln
  (`max-width: min(100%, 62vh)`), **nicht** über verschachteltes flex/grid
  `height:100%` — das ist fragil (s. Fallstrick). Wrap: `maxHeight` + `overflow:auto`.

---

## 6. Verdrahtung (O(1) pro Figur)

- **Markup im Kapitel** — nur ein leerer Platzhalter:
  ```html
  <div class="aspekt-figur nur-bildschirm" data-aspekt="kreisbahn"
       data-figref="fig-<statische-abbildung-id>"
       data-caption="… Bildunterschrift 1:1 aus der statischen Abbildung …"></div>
  ```
  Die statische Abbildung daneben bekommt `class="abbildung nur-druck"`.
- **`main.js`:** `import { init_aspekt_figuren, toggle_aspekt,
  close_aspekt_overlay, toggle_analyse, label_aspekt_figuren }`, in `init()`
  aufrufen (`init_aspekt_figuren()` **vor** `init_numbering()`,
  `label_aspekt_figuren()` **danach**), und die `data-action`-Fälle
  (`toggle_aspekt`, `close_aspekt_overlay`, `toggle_analyse`) im `dispatch_click`
  ergänzen.
- **Stylesheet:** `<link href="src/figures/aspekt_kreisbahn.css">` in `index.html`.

`init_aspekt_figuren()` findet jede `.aspekt-figur[data-aspekt="…"]`, baut Szene
+ Panels + Lupe + Bildunterschrift hinein. `label_aspekt_figuren()` übernimmt
**nach** der Nummerierung die „Abb. 1.n" der statischen Abbildung (`data-figref`)
in die interaktive Bildunterschrift, damit die Nummer am Bildschirm sichtbar ist.

**Nummerierung bleibt intakt:** `numbering.js` zählt `figure.abbildung`
unabhängig von `display:none` — die statische (versteckte) Abbildung behält ihre
Nummer, die interaktive Figur erzeugt keine zweite.

---

## 7. Fallstricke-Katalog (alle real aufgetreten)

| # | Symptom | Ursache | Lösung |
|---|---|---|---|
| 1 | Null-Zugriff beim Init | `updateScene` schreibt `timeLabel`/Live-Spans/Stoppuhr-Zeiger | alle als **versteckte Stubs** ins Skelett (Abschnitt 3) |
| 2 | Pfeilspitze landet nicht am Punkt | `render.js` kürzt den Schaft um `ARROW_LEN = 5·strokeWidth` (fix); größere Marker **oder** dickere Striche zerstören die Abstimmung | Marker `markerUnits="userSpaceOnUse"` mit **fester Länge = ARROW_LEN** (12.5 / 10) → Strichstärke frei |
| 3 | Achsen doppelt beschriftet | `setupScene()` ruft intern `drawCoordSystem()` (eigene Achsen), zusätzlich eigene gezeichnet | nach `setupScene()` `kb_animation_coord_system` leeren, nur eigene Achsen behalten |
| 4 | Analyse-Spalte im Zoom verschwindet (schmal/normal) | `:root[data-width-mode]`-Regeln schlagen per Spezifität die Overlay-Regeln | Modus-Regeln mit `:not(.aspekt-im-overlay)` scopen |
| 5 | Sim sprengt im Zoom die Vertikale | verschachteltes flex/grid `height:100%` ist fragil | SVG an **Viewport-Höhe** deckeln: `max-width: min(100%, 62vh)` |
| 6 | Mittelbereich zu groß / über den Rand | greedy `1fr`-Szene + breite Formel bläht `auto`-Analyse-Spalte auf | SVG-`max-width` maßvoll; keine breite Formel in `auto`-Spalte |
| 7 | Achse/Label stößt an den Rand | eigene Achsenlänge zu groß (viewBox 450×480, Mitte 225/260) | Länge deckeln (z. B. `min(…, 194)`), Szene bekommt Innen-Padding |
| 8 | φ als **gerades** statt geschwungenes Zeichen | rohes Unicode (U+03C6/U+03D5) rendert fontabhängig | Zeichen als **MathJax** rendern — im SVG per `foreignObject` mit `\(\varphi\)` (wie die Legacy-Figuren), fontunabhängig |
| 9 | Formel im Panel verschiebt Kapitel-Nummerierung | nummerierte Umgebung erhöht den Gleichungszähler | nur **`\[…\]`** (unnummeriert) verwenden; offline mit `mathjax-full` prüfen (0 `mlabeledtr` / 0 `width="full"`) |
| 10 | Abschnitts-Links navigieren nicht | Seiten tragen `data-page-id`, **nicht** `id`; der `#`-Handler suchte per `getElementById` | Handler auf `.chapter-page[data-page-id="…"]` zurückfallen lassen (in `main.js` behoben) |
| 11 | Store-Konflikt | `state.js`-`store` ist **Singleton** | eine Aspekt-Figur pro Seite; für mehrere muss der Store instanziierbar werden (offener Punkt) |

---

## 8. Verifikation (was geht headless, was nicht)

**Headless prüfbar** (jsdom, `/tmp/node_modules`):
- Figur baut, Regler-Werte korrekt (z. B. `x = R·cos φ`), Achsen innerhalb der
  viewBox, Overlay auf/zu mit Rückverschiebung, Collapse-Toggle, Nummer im
  Caption, φ-Bogen (Pfad + Label, `large-arc` ab 180°, kein Bogen bei φ=0),
  Abschnitts-Link-Navigation.
- `node --check` auf alle `.js`; CSS-Klammern balanciert (Kommentare vorher
  entfernen — ein `*/` in einem Kommentar beendet ihn vorzeitig).
- Formeln im Panel unnummeriert (offline `mathjax-full`).
- `dom_harness.mjs` (Skill v013-verifikation): Kapitel-Nummerierung unverändert.

**Nur im Browser / nur mit den Augen des Nutzers:**
- Ob Vektoren/Farben tatsächlich wie die Stand-alone wirken.
- Größenverhältnisse (inline vs. Zoom), Kollisionen, Label-Platzierung.
- Die MathJax-Glyphen (varphi geschwungen), foreignObject unter Safari.

> **Prozess-Wahrheit:** Die visuelle Feinarbeit ist **inhärent iterativ** und
> braucht den Nutzer als Auge. Plane mehrere Feedback-Runden ein; formuliere
> Rückfragen mit konkreten Vorschau-Optionen; und wenn der Nutzer „eine Version
> zurück" sagt, **kläre welche** — hier wurde einmal zwei statt einer Version
> zurückgegangen.

---

## 9. Reflexion — was diese Umsetzung geprägt hat

- **Wiederverwenden schlägt Nachbauen.** Der größte Hebel war, den Sim-Motor
  anzuzapfen statt Vektoren neu zu zeichnen. Das kostet Verständnis-Aufwand
  vorab (Abschnitt 3), zahlt sich aber in Optik-Treue und Wartbarkeit aus.
- **Die Vorlage ist die Design-Quelle.** „Orientiere dich an der Vorlage" hieß
  konkret: Tokens und Panel-/Slider-/Legenden-/Analyse-CSS **verbatim**
  übernehmen, nicht eigen erfinden. Jede Eigen-Erfindung (eigenes `<dl>`-Layout,
  eigene Marker-Größen) wurde zurückgebaut.
- **Feste Kopplungen respektieren.** `ARROW_LEN = 5·strokeWidth` und die
  `kb_`-DOM-IDs sind harte Verträge des Motors; sie zu verletzen kostet Zeit.
  Im Code stehen jetzt Warnkommentare an diesen Stellen.
- **Headless verifizieren, wo es geht.** Der jsdom-Test hat zwei Null-Zugriffe,
  den Achsen-Cap und die Nummerierungs-Neutralität abgesichert — Dinge, die im
  Browser mühsam zu finden gewesen wären.
- **Klein committen.** Pro logischer Einheit ein Commit mit Begründung; das hat
  die vielen Feedback-Runden nachvollziehbar gehalten.

---

## 10. Checkliste für die nächste Aspekt-Figur

**Vorbereitung**
- [ ] Sim portiert? (sonst zuerst portieren, IDs kollisionsfrei)
- [ ] Aspekt + Regler + „ersetzt/ergänzt statisch" mit dem Nutzer geklärt
- [ ] `physics`/`render`/`state`-Verträge gelesen (welche `show*`-Flags, welche DOM-IDs)

**Bauen**
- [ ] Regler → Motor abbilden (Pseudo-Zeit o. ä.), `show*`-Flags gaten
- [ ] Skelett mit **allen** von `setupScene`/`updateScene` berührten IDs (inkl. versteckter Stubs)
- [ ] Marker `userSpaceOnUse` mit Länge = `ARROW_LEN`, Strichstärke frei
- [ ] Eigene Zusatz-Zeichnung (Winkelbogen o. ä.) in **eigener** Gruppe; `kb_animation_coord_system` bei eigenen Achsen leeren
- [ ] Optik: Tokens + Panel-/Slider-/Legenden-/Analyse-CSS **verbatim**, auf `.aspekt-figur` gescopt
- [ ] Zeichen/Formeln als **MathJax** (im SVG per `foreignObject`); Panel-Formeln nur `\[…\]`
- [ ] Layout-Regeln mit `:not(.aspekt-im-overlay)`; Overlay-SVG per `vh` gedeckelt
- [ ] Verdrahtung: Platzhalter im Kapitel, Imports + `init`/`label` + `data-action`-Fälle in `main.js`, Stylesheet in `index.html`
- [ ] Legacy-Muster: `.nur-bildschirm`/`.nur-druck`, `data-figref` für die Nummer

**Prüfen**
- [ ] `node --check` alle Module; CSS-Klammern balanciert
- [ ] jsdom-Test: Aufbau, Werte, Overlay, Collapse, Winkel, Navigation
- [ ] Panel-Formel unnummeriert (offline `mathjax-full`: 0 `mlabeledtr`)
- [ ] `dom_harness.mjs`: Kapitel-Nummerierung unverändert
- [ ] **Im Browser mit dem Nutzer:** Optik, Größen, Kollisionen, Glyphen — iterativ
