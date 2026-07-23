# Interaktive Aspekt-Figuren — How-to für Erstellung & Übertragung

Anleitung, um aus einer der umfangreichen Stand-alone-Simulationen
(`Input/Simulationen/Project_*`) eine **interaktive Aspekt-Figur** an einer
konkreten Stelle im Skript zu bauen. Zwei Referenz-Implementierungen:

- **Abbildung 1.38** — `src/figures/aspekt_kreisbahn.js` + `.css`
  (Positions-Aspekt in 1.4.1; Regler φ, R; Massenpunkt greifbar).
- **Abbildung 1.40** — `src/figures/aspekt_weg_zeit.js` + `.css`
  (Weg-Zeit-Aspekt; Regler t, R, T; Auto-Stopp-Animation 0…6 s + Graph).

Geschrieben als **Runbook**: erst Konzept & Architektur, dann Schritt für
Schritt, dann der Katalog der real aufgetretenen Fallstricke (der wertvollste
Teil), zuletzt eine Checkliste. Die Begleit-Doku zu allen Änderungen seit der
ersten Anlage (Singleton → Per-Instanz, 2. Figur, Grundgerüst) liegt in
`CHANGES_aspekt_1.38_1.40_und_grundgeruest.md`.

> **Architektur-Regel:** Jede Aspekt-Figur holt sich ihren **eigenen** Motor per
> `createRuntime()` (`kreisbewegung/runtime.js`) — `store`/`DOM` werden *pro
> Instanz* isoliert, mehrere Figuren auf derselben Seite stören sich nicht. Der
> Sim-Motor wird **wiederverwendet, nicht nachgebaut**: `physics`/`render`/
> `state`/`constants` werden importiert, alle Aufrufe laufen inside
> `rt.withStore(…)`, und `store.show*`-Flags schalten alles Nicht-Relevante ab.

---

## 0. Das Konzept (warum es so gebaut ist)

Die Stand-alone-Sims im `Input/`-Ordner sind **sehr umfangreich** (Auto-Play,
viele Regler, Dutzende Graph-Typen, alle Vektoren, Export …). Im interaktiven
Skript soll — wie im Legacy — **pro Kapitel-Aspekt nur ein Teil** interaktiv
sein, aber optisch/technisch an den Stand-alone-Sims hängen.

Daraus folgen die Leitentscheidungen:

1. **Motor wiederverwenden, nicht nachbauen.** Die Figur importiert
   `physics`/`render`/`state`/`constants` der portierten Sim
   (`src/figures/kreisbewegung/`) und feature-gated sie auf den Aspekt. Kein
   eigener Zeichencode → die Optik ist 1:1 die der Sim.
2. **Per-Instanz-Isolation.** `createRuntime()` erzeugt pro Figur einen eigenen
   `store`/`DOM`-Kontext mit eindeutigem ID-Prefix (`kb0_`, `kb1_`, …). So können
   mehrere Aspekt-Figuren (und die schlafende `gc10`-Sim) unabhängig nebeneinander
   laufen. (Vormals Fallstrick #11, „offener Punkt" — gelöst.)
3. **Zweistufig mit Lupe.** Inline in der Lesespalte (kompakt, voll
   interaktiv), und per Lupe ein Overlay, das über dem Skript schwebt.
4. **Nur relevante Features.** `store.show*`-Flags schalten alles Nicht-Relevante
   ab (bei der Kreisbahn: nur Position — Ortsvektor + Komponenten + Bogen +
   Winkel; keine v/a, keine Graphen, kein Play/Pause. Bei Weg-Zeit: Position +
   x(t)/y(t)-Graphen + Auto-Stopp-Animation).
5. **Factory-Dispatch, keine zentrale Fabrik.** Jede Figur ist eine eigene
   `buildXFig(fig)`-Funktion, registriert in `ASPEKT_FACTORIES` (`main.js`).
   Generische Bedienfunktionen (Overlay/Analyse/Panel-Klapp) leben in
   `aspekt_kreisbahn.js` und werden für alle Aspekt-Figuren angebunden.

**Vorher mit dem Nutzer klären:** Welcher Aspekt? Welche Regler? Ersetzt die
interaktive Figur die statische Abbildung im Lesefluss oder ergänzt sie? (Bei
1.38/1.40: interaktiv am Bildschirm, statische Abbildung bleibt Druck-Fallback —
das Legacy-Muster.)

---

## 0a. Vorlagen-Prinzip — die wichtigste Effizienzregel

> **Kopieren und feature-gaten schlägt Neuschreiben. Immer.** Vor der ersten
> Zeile Code wird entschieden, *welche bestehende Figur die Vorlage ist* — und
> davon wird abgewichen nur dort, wo der Aspekt es erzwingt.

Das ist keine Stilfrage, sondern der Hebel für Token- und Zeiteffizienz. Die
Erfahrung aus 1.38 → 1.39 → 1.41: alles, was aus einer Vorlage übernommen wurde,
lief auf Anhieb; **jede** eigene Erfindung an einer Stelle, für die es schon eine
Vorlage gab, hat Feedback-Runden gekostet (φ-Platzierung, Lupe-Verankerung,
Vergleichslinie). Runden mit dem Nutzer sind das Teuerste im ganzen Prozess.

**Vorlagen-Kaskade — in dieser Reihenfolge suchen:**

1. **Die nächstähnliche Aspekt-Figur.** Gleiches Interaktionsmuster gewinnt vor
   gleichem Thema: Figur mit Play/Pause + Graph → `aspekt_weg_zeit.js` (gestapelt)
   bzw. `aspekt_winkel_zeit.js` (einzeln); rein Slider-getrieben → `aspekt_kreisbahn.js`.
   Modul kopieren, umbenennen, Aspekt-Flags/Regler/Graphtyp ändern — fertig.
2. **Die Stand-alone-Sim** (`Input/Simulationen/Project_*` bzw. die portierte
   `src/figures/kreisbewegung/`). Sie ist die Quelle für Optik *und* für
   **Bedienkonventionen**: was passiert beim Parameterwechsel, wie sieht ein
   Vergleichslauf aus, wie ist die Ablaufsteuerung beschriftet. Beispiel: die
   Regel „Parameteränderung setzt den Laufparameter auf 0" stammt aus den
   Stand-alones (schiefer Wurf) — sie selbst herzuleiten hat zwei Runden gekostet.
3. **Die statische v0.13-Abbildung** für Bildaufbau, Beschriftung, Achsen.
4. **Die Legacy-Figur** an derselben Stelle für den gemeinten Aspekt.

**Konsequenzen für die Arbeitsweise:**

- **„Wie in 1.38" heißt pixelgleich, nicht sinngemäß.** Sagt der Nutzer, eine
  bestehende Figur sei die Referenz, dann ist jede Abweichung ein Fehler — auch
  eine, die für sich genommen „richtiger" ist. In 1.41 wurde ein konstanter
  Label-Versatz entfernt, weil er mathematisch nicht auf der Winkelhalbierenden
  liegt; das Ergebnis war „immer noch falsch", weil die Figuren nun verschieden
  aussahen. Erst zurückbauen auf 1.38-Parität hat es gelöst.
- **Gemeinsames zentral halten.** Was in zwei Figuren gleich ist, gehört in
  `aspekt_kreisbahn.css` bzw. in ein geteiltes Modul (`playback.js`,
  `runtime.js`) — nicht dupliziert. Eine Regel für alle statt drei Sonderfälle:
  die Lupe hängt in *allen* Figuren an derselben Stelle (Ablaufleiste, sonst
  `.aspekt-scene`), statt pro Figur eigene Positionierung.
- **Erst diffen, dann fragen.** Weicht eine Figur optisch von der Vorlage ab,
  ist der schnellste Weg `git diff`/Vergleich der beiden Module an genau der
  Stelle — nicht Messen und nicht Raten.
- **Token-Ökonomie:** ein kopiertes Modul + gezielte Edits kostet einen Bruchteil
  von „Datei ganz lesen, neu schreiben, iterieren". Beim Abweichen von der
  Vorlage im Kommentar **begründen, warum** — sonst wird die Abweichung später
  für einen Fehler gehalten (oder „reparieren" bringt sie zurück).

---

## 1. Vorarbeit: die Quelle verstehen

1. **Ist die Sim schon portiert?** Kreisbewegung lag als
   `src/figures/kreisbewegung/` vor (aus `Project_kreisbewegung_simulation`,
   inkl. `lib/` = die `shared/js/*` der Vorlage). Eine noch nicht portierte Sim
   muss zuerst portiert werden (IDs mit `kb_`-Präfix o. ä., kollisionsfrei).
2. **Den Motor lesen** (`kreisbewegung/`):
   - `physics.js`: `angleRad(t)=φ0+ω·t`, `position(t)`, `velocity(t)`,
     `acceleration(t)`, `precompute()`, `recomputeDerived()`.
   - `render.js`: `setupScene()` (Zoom + Achsen + Scheibe, gibt `centers`
     zurück), `updateScene(t, p, v, a, centers)` (zeichnet Punkt, Vektoren,
     Bogen — **gated über `store.show*`-Flags**), `drawCoordSystem()`,
     `drawTrajectoryCircle()`, ggf. `updateGraph`/`updateGraphHover`.
   - `state.js`: der `store` (Parameter + `show*`-Flags + Zeitreihen) und
     `DOM`/`initDOM()` (der DOM-Cache). `q(id) = document.getElementById(
     store.idPrefix + id)` — die `q('main_svg')`-Literale enthalten **kein**
     `kb_`, der Prefix wird addiert.
   - `runtime.js`: `createRuntime()` → `{ prefix, withStore, bindDom,
     storeInstance }`. **Das ist die Per-Instanz-Fassade**, die jede Aspekt-Figur
     nutzt. `DEFAULT_STORE` ist ein Snapshot des `store` bei Modulladezeit.
   - `constants.js`: `ANIM_W/ANIM_CX`, `R_MIN/R_MAX`, `DEFAULT_PIXELS_PER_METER`.
3. **Den Aspekt festlegen.** Welche `show*`-Flags sind an? Welche Regler? Ein
   Blick in die Legacy-Figur an derselben Stelle hilft (gc1 „Kreisbahn" hatte
   genau φ/φ0/R — der Positions-Aspekt).

---

## 2. Den Motor per-Instanz ansteuern

**Kern-Trick:** den zeit-/ω-getriebenen Motor mit einem Regler statt einer
Animationsschleife füttern — und zwar **inside `rt.withStore(…)`**, damit der
Singleton-Motor während des Zeichnens den Zustand dieser Instanz sieht. Für die
Kreisbahn wird der φ-Regler auf eine Pseudo-Zeit abgebildet:

```js
const rt = createRuntime();
const p = rt.prefix;
// … Skelett einhängen, rt.bindDom() …
function draw(phiDeg) {
    rt.withStore(() => {
        const t = (phiDeg * Math.PI / 180) / store.omega;   // φ → Pseudo-Zeit
        precompute();                       // Zeitreihe (Bogen) bis t
        updateScene(t, position(t), velocity(t), acceleration(t), sceneCenters);
    });
    drawAngle(phiDeg);                      // aspekt-spezifische Zusatz-Zeichnung
}
```

Flags setzen (alles Nicht-Relevante aus) — ebenfalls inside `withStore`, oder
direkt auf `rt.storeInstance` (die Instanz ist die Wahrheit):

```js
Object.assign(rt.storeInstance, {
    showPositionVector: true, showPositionComponents: true, showTrajectory: true,
    showVelocityVector: false, showVelocityComponents: false,
    showAccelerationVector: false, showAccelerationComponents: false,
    isDigitalDisplay: false,
});
```

**Bei R-Änderung neu skalieren:** inside `withStore` `setupScene()` erneut
aufrufen (Zoom + Scheibe), dann eigene Achsen, dann `draw(φ)`. Nur bei
φ-Änderung reicht `draw(φ)`. Bei Figuren mit Animation (Weg-Zeit) läuft eine
eigene `requestAnimationFrame`-Schleife pro Instanz im Closure; jeder Frame
zeichnet inside `withStore`. Auto-Stopp-Reset via `playback.js` (s. §6).

---

## 3. Das DOM-Skelett (der heikle Teil)

`render.js` liest aus dem `DOM`-Cache, den `initDOM()` per ID füllt. Das Skelett
muss **alle** von `setupScene()`/`updateScene()` berührten Elemente enthalten —
inkl. versteckter Stubs (sonst Null-Zugriff). Die IDs stehen im Template als
`kb_*` und werden pro Instanz zu `${prefix}*` ersetzt:

```js
scene.innerHTML = `…${SVG_SCENE.replace(/kb_/g, p)}…${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`)}…`;
rt.bindDom();   // DOM-Cache an die prefixten Elemente binden
```

Welche IDs das sind, sagt der Analysator (statt Trial-and-Error):

```bash
node .claude/skills/interaktive-aspekt-figur/scripts/dom_vertrag.mjs \
     InteraktivesSkript_WIP/src/figures/kreisbewegung
```

Ausgabe: die `kb_`-IDs, die das Skelett enthalten muss — getrennt in
**Kern-Szene** (sichtbar) und **Stubs** (Stoppuhr/Live-Panel, versteckt, aber
vorhanden) inkl. fertiger HTML-Stubzeile.

**Stubs, die regelmäßig nötig sind** (vormals Fallstrick #1):

- **v/a-Vektoren** `kb_velocity_vector`/`kb_acceleration_vector` (+ Komponenten)
  — `updateScene` setzt ihre `visibility`. Als versteckte leere `<line>`.
- **Stoppuhr** `kb_stopwatch`/`_circle`/`_marks`/`kb_subdial`/`_marks`/
  `_main_hand`/`_sub_hand`/`kb_digital_display_group` — `initDOM` dereferenziert
  sie. Versteckt (`display:none`), außer die Figur zeigt sie (Weg-Zeit: aktiv).
- **Live-Panel** `kb_time_label` + `kb_live_t/phi/x/y/vx/vy/vabs/ax/ay/aabs` —
  `updateScene` schreibt sie **immer** am Ende. Als versteckte `<span>`.

> **Merke:** `initDOM()` ist null-sicher (`DOM.x = q(id)` → `null` schadet
> nicht). `updateScene()` ist es **nicht** — es dereferenziert `timeLabel`, die
> Live-Spans und die Stoppuhr-Zeiger. Genau diese Null-Zugriffe hat der
> Headless-Test gefunden; die Stubs decken sie ab.

**Akzeptierter Bruch:** `initDOM` sucht fest `input[name="kb_speed"]`/
`input[name="kb_diagram_mode"]`. Die Aspekt-Figuren prefixen ihre Radios zu
`name="${p}speed"` und greifen sie selbst per `scene.querySelectorAll` ab — nicht
über `DOM.speedRadios`. Für die Instanz bleibt `DOM.speedRadios` `null` (harmlos).

---

## 4. Optik: von der Vorlage abgeleitet

Für den Wiedererkennungswert werden **Farb-Tokens und Panel-/Slider-/Legenden-/
Analyse-Regeln** aus der portierten `kreisbewegung/styles.css` **abgeleitet** und
auf `.aspekt-figur` statt `#gc10` gescopt — in zwei Dateien:

- `aspekt_kreisbahn.css` — **gemeinsame** Aspekt-Optik, geladen für **alle**
  Aspekt-Figuren. Tokens (`aspekt_kreisbahn.css:8-24`): `--kb-surface*`,
  `--kb-border*`, `--kb-text*`, `--kb-accent (var(--fh,#00b2a9))`,
  `--kb-r/-rx/-ry/-traj` (figuren-eigene Farben), `--kb-text-scale
  (var(--paper-graphics-scale,1))` (Grafik-UI-Skalierung, s. §C).
  Struktur-Klassen: `panel-section` + `panel-label`, `panel-header` +
  `panel-body` (Kopf-Leiste zum Ein-/Ausklappen), `slider-label`/`slider-row`/
  `slider-val`, `legend-grid`/`legend-swatch`/`legend-label`, `analysis-grid`/
  `analysis-cell(.key/.val)`.
- `aspekt_weg_zeit.css` — nur Ergänzungen für Weg-Zeit, gescopt auf
  `[data-aspekt="weg-zeit"]` (`.aspekt-main`/`-runbar`/`-graph`-Layout,
  Graph-Tokens `--kb-graph-bg`/`-grid-line`, Stoppuhr-Farben).

- Formelzeichen als **MathJax** (`\(\varphi\)`, `\(R\)`, `\(r_x\)`) — nicht als
  rohes Unicode (s. Fallstrick). Werte mit **deutschem Dezimalkomma**
  (`.toFixed(d).replace('.', ',')`).

**Layout je Breiten-Modus** über `<html data-width-mode="…">` (gesetzt von
`core.js::set_width_mode`): schmal = gestapelt (Panel oben); normal = Panel
links | Szene; breit = Panel links | Szene | Analyse rechts. Overlay (Lupe) =
immer dreispaltig. **Wichtig:** die Modus-Regeln mit `:not(.aspekt-im-overlay)`
scopen, sonst schlagen sie per Spezifität die Overlay-Regeln (s. Fallstrick #4).

---

## 5. Zweistufig: inline + Lupe-Overlay

- **Inline:** Die Figur ist volle Lesespaltenbreite (`display:block`,
  `margin:0 0 20px`, wie die Formelkarten), die SVG per `max-width` gedeckelt.
- **Lupe → Overlay:** Die *lebende* Figur wird per DOM **verschoben** (nicht
  geklont) in ein `position:fixed`-Overlay; auf Schließen zurück an die
  Ursprungsstelle (`overlayReturn = {parent, next}`). Da dieselben Knoten
  wandern, bleibt der DOM-Cache der Instanz gültig. Die Figur bekommt im Overlay
  die Klasse `.aspekt-im-overlay` (CSS-Signal, dispatcht
  `aspekt-overlay-toggled`).
- **Overlay-Höhe:** die SVG an der **Viewport-Höhe** deckeln
  (`max-width: min(100%, 62vh)`), **nicht** über verschachteltes flex/grid
  `height:100%` — das ist fragil (s. Fallstrick #5). Wrap: `maxHeight` +
  `overflow:auto`.
- **Lupe-Button** anlegen in der Factory (`data-action="toggle_aspekt"`), INS
  Bild der Kernsimulation (`.aspekt-scene` bzw. `.aspekt-main`, die
  `position:relative` sein müssen), nicht an die Figuren-Ecke.

---

## 6. Verdrahtung (O(1) pro Figur)

- **Markup im Kapitel** — nur ein leerer Platzhalter:
  ```html
  <div class="aspekt-figur nur-bildschirm" id="aspekt-<name>"
       data-aspekt="<name>"
       data-title="<Kurztitel>"          <!-- Rail-Landmarke + Panel-Titel -->
       data-figref="fig-<statische-abbildung-id>"   <!-- Caption-Nummer-Transfer -->
       data-eqs="<label1> <label2>"       <!-- dynamische Physik-Sektion (optional) -->
       data-caption="… Bildunterschrift 1:1 aus der statischen Abbildung …"></div>
  ```
  Die statische Abbildung daneben bekommt `class="abbildung nur-druck"` und
  **muss** direkt daneben stehen (sonst zeigt `data-figref` aufs falsche Label).
- **Factory im Modul:** `export function buildXFig(fig) { … }` (Sig. s. Referenz).
- **`main.js`:**
  - `import { buildXFig } from './figures/aspekt_<name>.js'` und ergänze
    `ASPEKT_FACTORIES['<name>'] = buildXFig` (`main.js:26`).
  - `init_aspekt_figuren()` läuft vor `init_numbering()` über alle
    `.aspekt-figur[data-aspekt]` und ruft die Factory; es erzeugt zusätzlich den
    `.panel-header-left` fürs einklappbare linke Bedienfeld.
  - `label_aspekt_figuren()` **nach** der Nummerierung überträgt die „Abb. 1.n"
    der statischen Abbildung (`data-figref`) in die interaktive
    `.aspekt-caption` (damit die Nummer am Bildschirm sichtbar ist).
  - Die `data-action`-Fälle `toggle_aspekt`, `close_aspekt_overlay`,
    `toggle_analyse`, `toggle_panel_left` sind generisch (in
    `aspekt_kreisbahn.js` definiert, in `main.js:192` gebunden) — für jede Figur
    vorhanden, kein eigener Dispatch nötig.
- **Stylesheet:** `<link href="src/figures/aspekt_kreisbahn.css">` (immer) und
  ggf. ein figuren-eigenes `aspekt_<name>.css` in `index.html`.

**Nummerierung bleibt intakt:** `numbering.js` zählt `figure.abbildung`
unabhängig von `display:none` — die statische (versteckte) Abbildung behält ihre
Nummer, die interaktive Figur erzeugt keine zweite.

### Physik-Sektion (Formeln zur Figur im rechten Analyse-Panel)

Zwei Pfade — die Figur wählt:

- **Statisch** (Default für feste Formeln): `.formula-box` mit inline
  `\[…\]`-LaTeX direkt ins `PANEL_RIGHT`-Template. MathJax setzt beim Laden.
  `main.js` erkennt den statischen Block (`hasStaticPhysik`) und erzeugt **keine**
  dynamische Liste.
- **Dynamisch** (Formeln aus dem Lesefluss): kein `.formula-box` im Template,
  dafür `data-eqs="label1 label2"` im HTML. `chapters.js::captureEqLatex`
  erfasst **vor** dem MathJax-Typeset jede gelabelte Gleichung unnummeriert unter
  `window.eq_latex[label]`. Nach dem Typeset füllt `fill_physik_panels` (aus
  `chapters.js::typesetAfterLoad`, idempotent) eine `.physik-list` mit `.physik-eq`
  aus `window.eq_latex`. Voraussetzung: das Label existiert im Kapitel als
  gelabelte Gleichung.

Am HEAD nutzen beide Figuren die statische `.formula-box`; `data-eqs` ist
deklariert, aber dormant (statischer Block gewinnt). Beide Pfade sind
verfügbar — wählen, nicht mischen.

### Auto-Stopp-Animation (nur wenn die Figur Play/Pause hat)

Für Sim-Figuren mit Auto-Stopp (Weg-Zeit): `playback.js` liefert den gemeinsamen
Helfer `resetOnPlayAfterAutoStop(currentTime, autoStopTime, resetFn)` — im
`start()` aufrufen, damit ein Play-Klick am Ende erst resettet. Künftige
Auto-Stopp-Figuren rufen denselben Helfer statt eigenem Schwellen.

---

## 7. Fallstricke-Katalog (alle real aufgetreten)

| # | Symptom | Ursache | Lösung |
|---|---|---|---|
| 1 | Null-Zugriff beim Init | `updateScene`/`initDOM` dereferenziert `timeLabel`/Live-Spans/Stoppuhr-Zeiger/v/a-Vektoren | alle als **versteckte Stubs** ins Skelett (Abschnitt 3); `dom_vertrag.mjs` listet sie |
| 2 | Pfeilspitze landet nicht am Punkt | `render.js` kürzt den Schaft um `ARROW_LEN = 5·strokeWidth` (fix); größere Marker **oder** dickere Striche zerstören die Abstimmung | Marker `markerUnits="userSpaceOnUse"` mit **fester Länge = ARROW_LEN** (12.5 / 10) → Strichstärke frei |
| 3 | Achsen doppelt beschriftet | `setupScene()` ruft intern `drawCoordSystem()` (eigene Achsen), zusätzlich eigene gezeichnet | nach `setupScene()` `kb_animation_coord_system` leeren, nur eigene Achsen behalten |
| 4 | Analyse-Spalte im Zoom verschwindet (schmal/normal) | `:root[data-width-mode]`-Regeln schlagen per Spezifität die Overlay-Regeln | Modus-Regeln mit `:not(.aspekt-im-overlay)` scopen |
| 5 | Sim sprengt im Zoom die Vertikale | verschachteltes flex/grid `height:100%` ist fragil | SVG an **Viewport-Höhe** deckeln: `max-width: min(100%, 62vh)` |
| 6 | Mittelbereich zu groß / über den Rand | greedy `1fr`-Szene + breite Formel bläht `auto`-Analyse-Spalte auf | `.aspekt-panel-right { max-width: 260px }`; keine breite Formel in `auto`-Spalte |
| 7 | Achse/Label stößt an den Rand | eigene Achsenlänge zu groß (viewBox 450×480, Mitte 225/260) | Länge deckeln (z. B. `min(…, 194)`), Szene bekommt Innen-Padding |
| 8 | φ als **gerades** statt geschwungenes Zeichen | rohes Unicode (U+03C6/U+03D5) rendert fontabhängig | **Erst MathJax-`foreignObject`, seit 1.41 revidiert → s. #17.** Kurzfassung: natives `<svg:text>` mit `font-style:italic` (Klasse `.aspekt-angle-label`) und Glyphenform im Browser prüfen; `foreignObject` nur, wenn eine echte Formel gesetzt werden muss |
| 9 | Formel im Panel verschiebt Kapitel-Nummerierung | nummerierte Umgebung erhöht den Gleichungszähler | nur **`\[…\]`** (unnummeriert) verwenden; offline mit `mathjax-full` prüfen (0 `mlabeledtr` / 0 `width="full"`) |
| 10 | Abschnitts-Links navigieren nicht | Seiten tragen `data-page-id`, **nicht** `id`; der `#`-Handler suchte per `getElementById` | Handler auf `.chapter-page[data-page-id="…"]` zurückfallen lassen (in `main.js` behoben) |
| 11 | ~~Store-Konflikt (eine Figur pro Seite)~~ | `state.js`-`store` war **Singleton** | **gelöst:** `createRuntime()`/`withStore` isoliert `store`/`DOM` pro Instanz; mehrere Figuren unabhängig |
| 12 | Graph-Hover-Null-Zugriff (Weg-Zeit) | `drawGraphSlot` dereferenziert `DOM.graphHitRect[slot]` | Graph-Skelett 1:1 aus der Sim inkl. **aller** HitRect-/Hover-Elemente (Single + Top/Bottom) |
| 13 | Hover im Inline stört den Lesefluss | Graph-HitRects fangen Pointer im Inline ab | `.graph-hit-rect` default `pointer-events:none`, nur `.aspekt-im-overlay` gibt sie frei; JS zusätzlich auf `.aspekt-im-overlay` gaten |
| 14 | Speed-Radios kollidieren zwischen Instanzen | `name="ak_speed"` wäre shared | pro Instanz prefixen: `name="${p}speed"`; Radios selbst per `scene.querySelectorAll` abgreifen (nicht `DOM.speedRadios`) |
| 15 | Runbar-Tasten lösen nicht aus | `data-action`-Dispatch greift nicht pro Instanz | Runbar-Buttons mit `data-act="start|stop|reset"`, Listener direkt am Container in der Factory |
| 16 | Analyse-Leiste im breit-Modus verschoben | `auto`-Analyse-Spalte zu breit | `.aspekt-panel-right { max-width: 260px }` (s. #6) |
| 17 | Einzelnes Zeichen im `foreignObject` sitzt **konstant zu tief** — das Label „wandert falsch mit", seine Bahn wirkt verschoben | MathJax (tex-svg) setzt die Glyphe als inline-`<svg>` auf die Grundlinie (`vertical-align:-0.493ex`). Der `mjx-container` ist damit die **Zeilenbox** (~1,12 em), die Glyphe (~0,43 em) hängt darin unten. Wer den Container zentriert, zentriert die Zeilenbox — nicht das Sichtbare | Sofortfix: `display:block` auf dem inneren `<svg>` + `line-height:0` → Containerbox = Glyphenbox. **Besser (1.41): gar kein `foreignObject`** für einzelne Zeichen, sondern natives `<svg:text>` mit `text-anchor:middle`/`dominant-baseline:middle` — kein Boxproblem, kein Safari-Sonderfall |
| 18 | „Letzte Kurve behalten" zeigt praktisch dieselbe Kurve wie der neue Lauf; nur die Achsenbeschriftung ändert sich | `<input type=range>` feuert **ein `input`-Event pro Zwischenwert**. Wurde bei jedem eingefroren, ist die „letzte Kurve" die des vorletzten Zwischenwerts (T = 7,9 s statt 4,0 s) | Genau **ein** Schnappschuss pro Zieh-Geste: Flag beim ersten `input` setzen, im `change`-Event (Loslassen) zurücksetzen. Eingefroren wird der Zustand **vor** der Geste |
| 19 | Eingefrorene Vergleichskurve passt nach Parameterwechsel nicht mehr zur Achse | Kurve war als **Pixel**-Polyline gespeichert; die Achsen skalieren aber mit den Parametern (φ_max = 360°·T_ges/T; y = ±1,1·R). Die Linie blieb stehen, während die Achse unter ihr wegskalierte | Rohdaten (t/φ bzw. t/x/y) speichern und bei **jedem** Zeichnen neu auf `store.graphScale[slot]` projizieren; die y-Grenzen in `recalculateAxisLimits()` um die Geisterkurve erweitern, sonst läuft sie aus dem Bild |
| 20 | Vergleich zweier Parameter ist unphysikalisch/unverständlich | Nach Parameterwechsel lief die Zeit an der alten Stelle weiter | **Konvention der Stand-alones (schiefer Wurf):** ändert ein Regler die *Kurvenform*, springt der Laufparameter `t` auf 0 und die Animation stoppt — der neue Verlauf entsteht von vorn über dem alten |
| 21 | **Gar keine** Figur rendert (auch die unbeteiligten) | `main.js` importiert alle Figurenmodule als Seiteneffekt — ein **Syntaxfehler in einem** Modul reißt den ganzen Modulgraph mit. Real: `-00` ist in ES-Modulen (immer strict) ein Oktal-Literal → `SyntaxError` | Erstdiagnose bei „nichts da": Konsolenfehler lesen, dann `node --input-type=module --check < <modul>.js` über alle geänderten Module |
| 22 | Element am oberen Figurenrand (z. B. Lupe) ist beim Lesen nicht sichtbar | `.aspekt-figur { overflow:hidden }` macht die Figur zum Scroll-Container für `position:sticky` → die `.aspekt-runbar` klebt nie; und der obere Rand von `.aspekt-main` verschwindet beim Scrollen unter der klebenden Seiten-Kopfleiste | Bedienelemente an einen Container hängen, der in Leseposition sichtbar ist (hier: **in** die Ablaufleiste, `position:static` + `margin-left:auto`), nicht absolut an den oberen Rand des Hauptbereichs |

---

## 8. Verifikation (was geht headless, was nicht)

**Headless prüfbar** (jsdom, `/tmp/node_modules`):

```bash
# Baut die Figur headless, uebt alle Regler + Overlay/Analyse -> findet Null-Zugriffe
node .claude/skills/interaktive-aspekt-figur/scripts/figur_smoke.mjs \
     InteraktivesSkript_WIP/src/figures/aspekt_kreisbahn.js           # default: buildKreisbahnFig
node .claude/skills/interaktive-aspekt-figur/scripts/figur_smoke.mjs \
     InteraktivesSkript_WIP/src/figures/aspekt_weg_zeit.js --init=buildWegZeitFig

node --check <figur>.js                      # Syntax
# CSS-Klammern balanciert (Kommentare vorher entfernen -- ein */ im Kommentar beendet ihn)
# Panel-Formel unnummeriert? offline mit mathjax-full: 0 mlabeledtr / 0 width="full"
# Kapitel-Nummerierung unveraendert:
node .claude/skills/v013-verifikation/scripts/dom_harness.mjs InteraktivesSkript_WIP
```

Headless abgesichert: Figur baut (per `buildXFig`), Regler-Werte korrekt
(z. B. `x = R·cos φ`), Achsen innerhalb der viewBox, Overlay auf/zu mit
Rückverschiebung, Collapse-Toggle, Nummer im Caption, φ-Bogen, Abschnitts-Link-
Navigation, Graph-Aufbau (Weg-Zeit).

**Im echten Browser prüfbar — ohne den Nutzer** (headless Chromium, seit 1.41):

```bash
npm install --prefix /tmp playwright-core          # Chromium aus ~/.cache/ms-playwright
cd InteraktivesSkript_WIP && python3 -m http.server 8765 &

# Screenshot der Szene, Regler gesetzt, hohe Aufloesung
node .claude/skills/interaktive-aspekt-figur/scripts/figur_screenshot.mjs \
     --fig=aspekt-winkel-zeit --sel='svg[id$=main_svg]' --set=ak_t=1.5 --scale=3 --out=/tmp/szene.png
# Layout je Breiten-Modus / im Lupe-Overlay
node …/figur_screenshot.mjs --fig=aspekt-weg-zeit --mode=breit --overlay --out=/tmp/breit.png
# Geometrie messen -- und zwar die INK-Box, nicht den Container (s. Fallstrick #17)
node …/figur_screenshot.mjs --fig=aspekt-kreisbahn --set=ak_phi=135 \
     --measure='foreignObject[id$=angle_label]' --ink
```

Damit sind Platzierung, Kollisionen, Größenverhältnisse, Sichtbarkeit und die
Modus-Layouts **selbst** prüfbar, bevor der Nutzer hinschaut. Das verkürzt
Feedback-Runden erheblich — genau die sind der teuerste Teil.

> **Merksatz aus 1.41: anschauen schlägt ausmessen.** Eine falsche
> φ-Platzierung wurde dreimal per DOM-Messung als „korrekt" bestätigt, weil die
> gemessene Box (`mjx-container` = Zeilenbox) nicht das war, was man sieht (die
> Glyphe). Ein einziger Screenshot hätte es in Runde 1 gezeigt. Wenn gemessen
> wird, dann das **innerste gezeichnete Element** (`--ink`).

**Weiterhin nur mit den Augen des Nutzers:**
- Ob Vektoren/Farben tatsächlich wie die Stand-alone *wirken* (Geschmack).
- Ob eine Beschriftung „richtig" sitzt, wenn mehrere Setzungen vertretbar sind —
  dann **mit konkreten Optionen fragen** (Vorschau-Skizzen), nicht raten. In 1.41
  haben drei Rateversuche mehr gekostet als eine Rückfrage.
- Darkmode-Eindruck, Schriftwirkung, Safari-Rendering.

> **Prozess-Wahrheit:** Die visuelle Feinarbeit ist **inhärent iterativ** und
> braucht den Nutzer als Auge. Plane mehrere Feedback-Runden ein; formuliere
> Rückfragen mit konkreten Vorschau-Optionen; und wenn der Nutzer „eine Version
> zurück" sagt, **kläre welche** — hier wurde einmal zwei statt einer Version
> zurückgegangen.

---

## 9. Reflexion — was diese Umsetzung geprägt hat

- **Per-Instanz statt Singleton.** Der größte architektonische Schritt war,
  `createRuntime()`/`withStore` einzuführen — das hat den ehemaligen „offenen
  Punkt" (Fallstrick #11) gelöst und die zweite Figur (1.40) überhaupt erst
  ermöglicht.
- **Wiederverwenden schlägt Nachbauen.** Den Sim-Motor anzuzapfen statt Vektoren
  neu zu zeichnen kostet Verständnis-Aufwand vorab (Abschnitt 1), zahlt sich in
  Optik-Treue und Wartbarkeit aus.
- **Die Vorlage ist die Design-Quelle.** Tokens und Panel-/Slider-/Legenden-/
  Analyse-CSS aus `kreisbewegung/styles.css` ableiten, nicht eigen erfinden.
- **Feste Kopplungen respektieren.** `ARROW_LEN = 5·strokeWidth`, die `kb_`-DOM-
  IDs und `q(id) = getElementById(store.idPrefix + id)` sind harte Verträge des
  Motors; sie zu verletzen kostet Zeit. Warnkommentare stehen an diesen Stellen.
- **Headless verifizieren, wo es geht.** Der jsdom-Test hat Null-Zugriffe, den
  Achsen-Cap und die Nummerierungs-Neutralität abgesichert — Dinge, die im
  Browser mühsam zu finden gewesen wären.
- **Klein committen.** Pro logischer Einheit ein Commit mit Begründung; das hat
  die vielen Feedback-Runden nachvollziehbar gehalten.
- **Vorlage schlägt eigene Herleitung — auch die bessere.** Der teuerste Teil
  von 1.41 war nicht das Bauen, sondern das Nachziehen von Details, für die es
  in 1.38/1.39 oder in den Stand-alones längst eine Setzung gab (s. Abschnitt
  0a). Faustregel: bevor eine Platzierung, eine Bedienkonvention oder ein
  Interaktionsdetail *hergeleitet* wird, erst nachsehen, ob es sie schon gibt.
- **Im Browser nachsehen, bevor der Nutzer es tut.** Seit `figur_screenshot.mjs`
  ist das ohne Nutzerrunde möglich; das ersetzt einen guten Teil der bisherigen
  „iterativen Feinarbeit" durch Selbstprüfung.
- **Bei mehrdeutiger optischer Kritik früh mit Optionen fragen.** „Sitzt falsch"
  hat viele mögliche Bedeutungen (Anker, Radius, Winkel, innen/außen). Eine
  Rückfrage mit 3–4 konkreten, skizzierten Varianten kostet eine Runde; Raten hat
  drei gekostet.
- **Bei „nichts geht" zuerst die Modul-Syntax prüfen.** Ein Syntaxfehler in einem
  einzigen Figurenmodul legt über die Seiteneffekt-Importe in `main.js` alle
  Figuren still (Fallstrick #21).

---

## 10. Checkliste für die nächste Aspekt-Figur

**Vorbereitung**
- [ ] **Vorlage bestimmt** (Abschnitt 0a): nächstähnliche Aspekt-Figur nach
      Interaktionsmuster, Stand-alone für Optik **und Bedienkonventionen**,
      statische v0.13-Abbildung für Bildaufbau — Modul kopieren statt neu schreiben
- [ ] Sim portiert? (sonst zuerst portieren, IDs kollisionsfrei)
- [ ] Aspekt + Regler + „ersetzt/ergänzt statisch" mit dem Nutzer geklärt
- [ ] `physics`/`render`/`state`/`runtime`-Verträge gelesen (welche `show*`-Flags, welche DOM-IDs, `createRuntime`/`withStore`/`bindDom`)

**Bauen**
- [ ] `createRuntime()` pro Figur; alle Motor-Aufrufe inside `rt.withStore(…)`
- [ ] Skelett-Templates mit `kb_*`-IDs; per `.replace(/kb_/g, p)` prefixen; `rt.bindDom()` danach
- [ ] Skelett mit **allen** von `setupScene`/`updateScene`/`initDOM` berührten IDs (inkl. versteckter Stubs — `dom_vertrag.mjs`)
- [ ] Marker `userSpaceOnUse` mit Länge = `ARROW_LEN`, Strichstärke frei
- [ ] Eigene Zusatz-Zeichnung (Winkelbogen o. ä.) in **eigener** Gruppe; `kb_animation_coord_system` bei eigenen Achsen leeren
- [ ] Regler-Closure pro Instanz; Speed-Radios `name="${p}speed"`; Runbar `data-act` + Container-Listener
- [ ] Optik: Tokens + Panel-/Slider-/Legenden-/Analyse-CSS aus `kreisbewegung/styles.css` ableiten, auf `.aspekt-figur` gescopt; `--kb-text-scale` für UI-Schrift
- [ ] Einzelne Zeichen (φ o. ä.) als natives `<svg:text>` (`.aspekt-angle-label`), **nicht** per `foreignObject` (Fallstrick #17); Panel-Formeln nur `\[…\]`
- [ ] Animierte Figur mit Vergleichslauf? → Geisterkurve als **Daten** speichern und pro Zeichnen neu projizieren (#19); Schnappschuss **einmal pro Zieh-Geste** (#18); kurvenformender Regler setzt `t` auf 0 und stoppt (#20)
- [ ] Physik-Sektion: statisch `.formula-box` im Template **oder** dynamisch via `data-eqs` + gelabelte Gleichung — nicht mischen
- [ ] Auto-Stopp? → `resetOnPlayAfterAutoStop` aus `playback.js` im `start()`
- [ ] Greifbarer Punkt? → Pointer-Drag-Handler im `buildXFig`-Body nach Vorbild 1.38 (SVG-`getScreenCTM`, Snap, Clamp, gleiche `refresh()`-Pipeline)
- [ ] Layout-Regeln mit `:not(.aspekt-im-overlay)`; Overlay-SVG per `vh` gedeckelt; Lupe an `.aspekt-scene`/`.aspekt-main` (`position:relative`)
- [ ] Verdrahtung: Platzhalter im Kapitel (`id`/`data-aspekt`/`data-title`/`data-figref`/`data-eqs`/`data-caption`), `ASPEKT_FACTORIES`-Eintrag + Imports in `main.js`, Stylesheet in `index.html`
- [ ] Legacy-Muster: `.nur-bildschirm`/`.nur-druck`, statische Abbildung direkt daneben, `data-figref` für die Nummer

**Prüfen**
- [ ] `node --input-type=module --check` über **alle** geänderten Module (ein Syntaxfehler killt alle Figuren, #21); CSS-Klammern balanciert
- [ ] `figur_smoke.mjs` (mit `--init=buildXFig`): Aufbau, Werte, Overlay, Collapse, Graph, Runbar
- [ ] Panel-Formel unnummeriert (offline `mathjax-full`: 0 `mlabeledtr`)
- [ ] `dom_harness.mjs`: Kapitel-Nummerierung unverändert
- [ ] **Selbst im Browser:** `figur_screenshot.mjs` je Breiten-Modus + Overlay ansehen (nicht nur messen); bei Geometrie `--ink` verwenden
- [ ] **Danach mit dem Nutzer:** Optik-Geschmack, Glyphenwirkung, Darkmode — bei mehrdeutiger Kritik mit konkreten Optionen zurückfragen statt raten