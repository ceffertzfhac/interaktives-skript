# Änderungen an den Aspekt-Figuren 1.38 / 1.40 und am Grundgerüst

Dokumentation aller Änderungen, die **nach** der ersten Anlage der
`interaktive-aspekt-figur`-Skill (Commit `3fa5ea0`) bis zum aktuellen HEAD
(`ad29b38`, Branch `interaktive-graphik-1.40`) an den interaktiven Aspekt-Figuren
**1.38** (`aspekt_kreisbahn`) und **1.40** (`aspekt_weg_zeit`) sowie am
**Grundgerüst** des Skriptes gemacht wurden. Diese Änderungen sind ohne Begleitung
entstanden; diese Datei hält das Runbook, die Skill und die Helfer-Skripte mit
dem Ist-Stand synchron.

> Bezugspunkt: Die Skill `interaktive-aspekt-figur` und das Runbook
> `INTERAKTIVE_ASPEKT_FIGUREN.md` beschrieben beim Commit `3fa5ea0` noch eine
> **Singleton-`store`**-Architektur mit *einer* Figur (1.38) und einem offenen
> Punkt „für mehrere Figuren muss der Store instanziierbar werden". Genau das
> ist seit `c760eee`/`d870dee` umgesetzt. Diese Datei dokumentiert den Weg dorthin.

---

## A. Architektur der Aspekt-Figuren (neu)

### A.1 Per-Instanz-Motor: `createRuntime` / `withStore` / `bindDom`

**Datei:** `src/figures/kreisbewegung/runtime.js` (neu in `c760eee`).

**Problem (vormals Fallstrick #11, „offener Punkt"):** Der Motor
(`state.js`/`render.js`/`physics.js`) kapselt `store` und `DOM` als
Modul-Singletons; `state.js:63` liest IDs via
`q(id) = document.getElementById(store.idPrefix + id)`. Zwei Aspekt-Figuren am
Motor würden sich `store`, `DOM` und die `kb_`-IDs teilen und sich gegenseitig
überschreiben — auch die schlafende `gc10`-Sim, die den Singleton direkt nutzt.

**Lösung:** `createRuntime()` erzeugt pro Figur einen isolierten Kontext:

```js
// runtime.js:40
export function createRuntime() {
    const prefix = 'kb' + (_uid++) + '_';        // eindeutiger ID-Prefix pro Instanz
    const storeInstance = { ...DEFAULT_STORE,    // Skalare geteilt, Container neu
        tData: [], xData: [], /* … */, graphScale: {…}, axisLimits: {}, idPrefix: prefix };
    // … withStore / bindDom …
    return { prefix, withStore, bindDom, storeInstance };
}
```

Drei Mechanismen:

- **`prefix`** (`kb0_`, `kb1_`, …): eindeutig pro Instanz. Das Skelett der Figur
  nutzt diese IDs — die Factory ersetzt `kb_` → `prefix` per `.replace`.
- **`withStore(fn)`** (Reentrant-Scratch-Buffer): Die äußerste `withStore`
  rettet den Singleton-Stand in `SAVED_STORE`/`SAVED_DOM`, kopiert die Instanz
  in den Singleton (`swapIn`), führt `fn` aus, schreibt den Scratch zurück
  (`swapOut`) und restauriert den Singleton. Da JS single-threaded und das
  Zeichnen synchron ist, ist nie mehr als eine Figur „aktiv" — volle Isolation
  auch bei mehreren Figuren auf derselben Seite. `depth` erlaubt Verschachtelung.
- **`bindDom()`**: wird **nach** dem Einhängen des Skeletts ins Dokument
  gerufen; setzt `store.idPrefix` temporär auf `prefix`, ruft `initDOM()` aus
  `state.js`, snapshottet `DOM` nach `domInstance` und restauriert den Prefix.

Motor-Änderungen minimal & abwärtskompatibel (`c760eee`):

- `state.js:28` fügt `idPrefix: 'kb_'` hinzu; `state.js:63`
  `q = id => document.getElementById(store.idPrefix + id)` (vorher fest `'kb_'`).
  → Die `q('main_svg')`-Literale in `state.js` enthalten jetzt **kein** `kb_`
  mehr (der Prefix wird addiert).
- `render.js:85,93,331` bauen Marker-URLs aus `store.idPrefix` statt fest
  `'kb_'`.
- Default `'kb_'` lässt die schlafende `gc10`-Sim unberührt.

**Wie eine Figur ihre Runtime holt** (`aspekt_kreisbahn.js:169-180`):

```js
const rt = createRuntime();
const p = rt.prefix;
scene.innerHTML = `<div class="aspekt-body">…${SVG_SCENE.replace(/kb_/g, p)}…</div>`;
rt.bindDom();           // DOM-Cache an die prefixten Elemente binden
// alle Motor-Aufrufe danach: rt.withStore(() => { precompute(); updateScene(…); })
```

### A.2 Factory-Dispatch (kein generelles `createAspektFigur`)

**Wichtig:** Es gibt **keine** allgemeine Fabrik-Funktion für Aspekt-Figuren.
Das bestehende `figures/factory.js` (`createFigure`) ist die *ältere* Fabrik für
die 3D-Kreisbahn-Figuren `gcN` (Hook-Vertrag `step`/`render`/`wrap`/`condition`/
`snap`/`clear`) und wird von den Aspekt-Figuren **nicht** verwendet.

Stattdessen ist jede Aspekt-Figur eine **eigene `buildXFig(fig)`-Funktion**
(`fig` = das `.aspekt-figur`-Element):

- `buildKreisbahnFig(fig)` — `aspekt_kreisbahn.js:165`
- `buildWegZeitFig(fig)` — `aspekt_weg_zeit.js:256`

Registrierung zentral in `main.js:26` per Dispatch-Map:

```js
// main.js:19-26
import { toggle_aspekt, close_aspekt_overlay, toggle_analyse,
         toggle_panel_left, buildKreisbahnFig } from './figures/aspekt_kreisbahn.js';
import { buildWegZeitFig } from './figures/aspekt_weg_zeit.js';
const ASPEKT_FACTORIES = { 'kreisbahn': buildKreisbahnFig, 'weg-zeit': buildWegZeitFig };

function init_aspekt_figuren() {                       // main.js:28
    document.querySelectorAll('.aspekt-figur[data-aspekt]').forEach(fig => {
        const build = ASPEKT_FACTORIES[fig.dataset.aspekt];
        if (build) build(fig);
        // … panel-header-left fürs einklappbare linke Bedienfeld einsetzen …
    });
}
```

Jede Factory übernimmt selbst die volle Boilerplate (Skelett einhängen +
`bindDom()`, Lupe, Caption, Regler-Closure, eigene Achsen, ggf. Anim-Schleife).
Was **gemein** ist, läuft über Copy/DRY-Vertrag, nicht über eine geteilte
Funktion. **Generische** Bedienfunktionen (rein auf `.aspekt-figur`-Klassen,
ohne Motor-Zustand) leben in `aspekt_kreisbahn.js` und werden für *alle*
Aspekt-Figuren aus `main.js` an `data-action` gebunden:

- `toggle_aspekt(btn)` — `aspekt_kreisbahn.js:440` (Lupe/Overlay auf/zu)
- `close_aspekt_overlay()` — `:447`
- `toggle_analyse(btn)` — `:451` (rechtes Analyse-Panel ein-/ausklappen, `.collapsed`)
- `toggle_panel_left(btn)` — `:462` (linkes Bedienfeld seitlich einklappen)

**Vertrag vs. vorher:** Vorher „Motor importieren + `store.show*` gaten + eigene
`updateScene`" mit Singleton. Jetzt: eigene Runtime pro Figur, alle Motor-Aufrufe
**stets** inside `rt.withStore(…)`, Regler-Listener im Closure der Factory. Die
Aspekt-Figuren haben **kein** `step`/`wrap`/`condition` (das ist der `factory.js`-
Vertrag der `gcN`); sie sind zeit-/ω-getrieben (`angleRad(t)=φ0+ω·t`) und rufen
Motor-Funktionen direkt auf. Die Anim-Schleife (nur 1.40) ist pro Instanz im
Closure (eigenes `requestAnimationFrame`), nicht Teil einer zentralen Loop.

### A.3 DOM-Vertrag (jetzt mit Per-Instanz-Prefix)

`render.js` liest aus dem `DOM`-Cache, den `initDOM()` per ID füllt. Das Skelett
muss **alle** von `setupScene()`/`updateScene()` berührten Elemente enthalten —
inkl. versteckter Stubs (sonst Null-Zugriff). Die IDs stehen im Template als
`kb_*` und werden pro Instanz zu `${prefix}*` ersetzt.

**1.38 (kreisbahn)** benötigt (`aspekt_kreisbahn.js`):

- Szene: `kb_main_svg`, `kb_animation_group`, `kb_aspekt_axes` (eigene),
  `kb_animation_coord_system`, `kb_disk`, `kb_aspekt_angle` + `kb_angle_label`
  (eigener Winkelbogen/foreignObject), `kb_trajectory_path`, `kb_point`,
  `kb_zoom_text_display`; Ortsvektor `kb_position_vector`(+`_x`/`_y`); v/a-Vektoren
  als **versteckte Stubs** (leere `<line>`, weil `showVelocityVector=false`);
  Marker `kb_ax_arrow`, `kb_arrowhead-r/-rx/-ry`.
- **Stoppuhr-Stub** (`display:none`): `kb_stopwatch`, `kb_stopwatch_circle`,
  `kb_stopwatch_marks`, `kb_subdial`, `kb_subdial_marks`, `kb_stopwatch_main_hand`,
  `kb_stopwatch_sub_hand`, `kb_digital_display_group` — `initDOM` dereferenziert
  sie, obwohl die Figur keine Stoppuhr zeigt.
- Panel links: `ak_phi`/`ak_phi_out`, `ak_r`/`ak_r_out`.
- Panel rechts: `ak_val_phi`/`_r`/`_x`/`_y` + `.formula-box` + `.panel-header`.
- Live-Stub (`display:none`): `kb_time_label`, `kb_live_t`/`_phi`/`_x`/`_y`/
  `_vx`/`_vy`/`_vabs`/`_ax`/`_ay`/`_aabs` — `updateScene` schreibt sie immer.

**1.40 (weg_zeit)** zusätzlich/abweichend (`aspekt_weg_zeit.js`):

- Szene **ohne** Winkelbogen, dafür **aktive Stoppuhr** (echte Koordinaten, nicht
  versteckt).
- **Graph-Skelett** (Single + Stacked Top/Bottom, 1:1 aus der Sim, inkl. aller
  Hover-/HitRect-Elemente — fehlen sie, Null-Zugriff in `drawGraphSlot`):
  `kb_graph_svg`, `kb_graph_group_single/_top/_bottom`, `kb_grid_group`,
  `kb_graph_line`, `kb_graph_point`, `kb_graph_title`, `kb_graph_hover_line/_point/
  _tooltip(+_bg/_text)`, `kb_graph_hit_rect` (+ `_top`/`_bottom`), Marker
  `kb_graph-arrowhead`.
- Panel links: `ak_t`/`ak_t_out`, `ak_r`/`ak_r_out`, `ak_T`/`ak_T_out`,
  Speed-Radios `name="ak_speed"` (→ `${p}speed` pro Instanz), `.speed-pills`.
- Runbar: `.aspekt-runbar`, `.aspekt-btn[data-act="start|stop|reset"]`
  (Instanz-Listener direkt am Container, deshalb `data-act` nicht `data-action`).
- Panel rechts: `ak_val_t`/`_phi`/`_r`/`_T`/`_x`/`_y`.
- Live-Stub: analog 1.38.

> **Akzeptierter Bruch:** `initDOM` (`state.js`) sucht fest `input[name="kb_speed"]`/
> `input[name="kb_diagram_mode"]`. Die Aspekt-Figuren prefixen ihre Radios zu
> `${p}speed`, greifen sie aber selbst per `scene.querySelectorAll` ab — nicht über
> `DOM.speedRadios`. `DOM.speedRadios` bleibt für die `gc10`-Sim; für die Instanz
> bleibt es `null` (harmlos, weil die Figur die Radios selbst verwaltet).

### A.4 Optik / CSS (zwei Dateien, von der Sim abgeleitet)

- `aspekt_kreisbahn.css` — **gemeinsame** Aspekt-Optik, gescopt auf
  `.aspekt-figur`. Geladen für beide Figuren.
- `aspekt_weg_zeit.css` — nur Ergänzungen für Weg-Zeit, gescopt auf
  `[data-aspekt="weg-zeit"]`.
- `kreisbewegung/styles.css` — die portierte Sim-Optik (Vorlage). Die Aspekt-CSS
  ist *davon abgeleitet*, nicht verbatim eingebunden.

**Tokens** (`aspekt_kreisbahn.css:8-24`): `--kb-surface/-surface2/-border/-border2/
-text/-text2/-text3/-accent (var(--fh,#00b2a9))/-r (#b08010)/-rx (#1f77b4)/
-ry (#1a8a50)/-traj (#7f7f7f)/-r-sm/-font/-font-mono/-text-scale
(var(--paper-graphics-scale,1))`. Neu gegenüber „verbatim aus Sim" sind die
figuren-eigenen Farb-Tokens, `--kb-text-scale` (Grafik-UI-Skalierung) und die
`--kb-surface*`/`--kb-border*`-Palette. Graph-Tokens (`--kb-graph-bg`/`-grid-line`)
erst in `aspekt_weg_zeit.css`.

**Klassen:** `panel-section/-label/-header/-body`, `ph-label/-chevron`,
`analysis-grid/-cell(.key/.val)`, `legend-grid/-swatch/-label`, `slider-label/
-row/-val`, sowie die Struktur-Klassen `aspekt-figur/-body/-panel(-left/-right)/
-scene/-svg/-main/-content/-runbar/-graph/-graph-svg/-lupe/-caption/-axis/
-axis-label/-angle-arc/-angle-fo/-btn/-btn-icon/-overlay-back/-wrap/-im-overlay/
-overlay-open`, `speed-pill/-s`.

**Overlay vs. Inline:** Inline: `.aspekt-svg` width 100 %, max-width 460 px.
Breiten-Modus steuert das Grid (s. §C.1). Overlay (`.aspekt-im-overlay`):
`.aspekt-overlay-back` fixed inset 0, z-index 1000, dimmt; erzwingt **immer**
3-Spalten-Grid; `.aspekt-svg` an der Viewport-Höhe gedeckelt
(`max-width: min(100%, 62vh)`); Body `overflow:hidden`.

**Analyse-/Panel-Klapp:** `.aspekt-panel-right.collapsed` (width 36 px, Body
`display:none`, `panel-header` wird vertikaler Streifen `writing-mode:vertical-rl`,
`transform:rotate(180deg)`). Spiegelbildlich `.aspekt-panel-left.collapsed` (im
Schmalmodus vertikal statt seitlich).

**Physik-Sektion** = ein `panel-section` im rechten Analyse-Panel mit Formeln zur
Figur. **Zwei Umsetzungen** (s. §B.2): statisch (`.formula-box` im Template) oder
dynamisch (`data-eqs` → `window.eq_latex` → `.physik-list`). Aktuell gewinnen beide
Figuren die statische `.formula-box`; `data-eqs` ist angelegt, aber für sie
*dormant*.

**Hover (nur Overlay):** Weg-Zeit: `.graph-hit-rect` default
`pointer-events:none`, nur `.aspekt-im-overlay .graph-hit-rect` bekommt
`pointer-events:all`. JS gated zusätzlich auf `.aspekt-im-overlay`.

### A.5 Auto-Stopp-Reset (`playback.js`, `470f08e`)

`src/figures/playback.js` (15 Z., neu) — gemeinsamer Helfer für Auto-Stopp-Sims:

```js
export function isAtAutoStopEnd(currentTime, autoStopTime, eps = 1e-6) {
    return currentTime >= autoStopTime - eps;
}
export function resetOnPlayAfterAutoStop(currentTime, autoStopTime, resetFn, eps = 1e-6) {
    if (isAtAutoStopEnd(currentTime, autoStopTime, eps)) resetFn();
}
```

Aufgerufen in `aspekt_weg_zeit.js::start()` (`:449`):
`resetOnPlayAfterAutoStop(curT, T_AUTO, reset)`. Steht die Sim am Ende (curT ≥ 6 s),
startet ein Play-Klick mit Reset. Künftige Auto-Stopp-Figuren rufen denselben
Helfer statt eigenem Schwellen.

### A.6 Massenpunkt greifen (1.38, `56a1133`)

Der Massenpunkt in der Kreisbahn-Figur ist per Pointer-Events greif-/ziehbar
(`aspekt_kreisbahn.js:327-395`): `getScreenCTM().inverse()` → SVG-Koordinaten,
`(R, φ)` aus `atan2`/`hypot/ppm`, auf Slider-Schritte gesnappt und an
`[R_MIN,R_MAX]` geclampt, dann dieselbe `refresh()`-Pipeline wie die Slider
(`setPointerCapture` für Draggen außerhalb des SVG). CSS
(`aspekt_kreisbahn.css:49-53`): `cursor:grab`/`grabbing` (Klasse
`is-dragging-point`), `touch-action:none`. Caption-Hinweis ergänzt. — Die Drag-
Logik ist **nicht** generisch (braucht SVG-`getScreenCTM` + Figur-Geometrie wie
`ANIM_CX/CY`), sondern pro Figur im `buildXFig`-Body nach diesem Vorbild.

---

## B. Grundgerüst: zentrale logische Einheiten

### B.1 `f710ed4` + `a54af1c` — gelabelte Gleichungen erfassen + `data-eqs`

**`chapters.js::captureEqLatex`** (in `loadChapters` direkt nach `fetch`, **vor**
`mount.innerHTML = html`, `chapters.js:57-82`): extrahiert aus dem rohen
Kapitel-HTML jede `\begin{equation|align}*?}…\end{…}` mit `\label{…}`, entfernt
das `\label`, dekodiert HTML-Entities und legt die Quelle **unnummeriert** ab
(`equation` → `\[…\]`, `align` → `\begin{align*}…\end{align*}`) unter
`window.eq_latex[label]`. Reihenfolge ist verbindlich: `captureEqLatex(html)`
**vor** `mount.innerHTML = html` (nach dem Typeset ersetzt MathJax die Quelle
durch `<mjx-container>`).

**`a54af1c`** — beide Aspekt-Figuren-Divs bekommen `id`, `data-title`,
`data-figref` (Caption-Label-Transfer), `data-eqs` (dynamische Physik-Sektion);
Captions am PDF orientiert; die statische Druck-Abbildung (`nur-druck`) wird
direkt neben die `nur-bildschirm`-Aspekt-Figur platziert.

```html
<div class="aspekt-figur nur-bildschirm" id="aspekt-kreisbahn"
     data-aspekt="kreisbahn" data-title="Position auf der Kreisbahn (interaktiv)"
     data-figref="fig-skript-kreisbewegung-winkel"
     data-eqs="eq_kreisbahn_position" data-caption="…"></div>
```

### B.2 Physik-Sektion — zwei Pfade (Pivot in `4edc77d`)

Die Physik-Sektion wurde im Diff-Zeitraum **zweimal** umgebaut:

1. `f710ed4` + `01e9fa7` bauten den **dynamischen** Pfad
   (`captureEqLatex` → `window.eq_latex` → `main.js::fill_physik_panels` →
   `.physik-list`, getrieben durch `data-eqs`).
2. `4edc77d` drehte die beiden realen Figuren wieder auf **statische**
   `.formula-box` im Figuren-Template zurück und fügte in `main.js` einen Guard
   gegen Doppelbefüllung ein.

Am HEAD gelten **beide** Pfade; für die beiden aktuellen Figuren gewinnt die
statische `.formula-box`:

- **Statisch** (Default für feste Formeln): `.formula-box` direkt ins
  `PANEL_RIGHT`-Template. MathJax setzt beim Laden. `main.js:55`
  (`hasStaticPhysik = !!body.querySelector('.formula-box')`) → keine
  `.physik-list` angelegt → `fill_physik_panels` (sucht `.physik-list`) läuft leer.
- **Dynamisch**: kein `.formula-box` im Template, dafür `data-eqs="l1 l2"` im HTML
  → `init_aspekt_figuren` legt `.physik-list` an, `fill_physik_panels` (aufgerufen
  nach MathJax-Typeset aus `chapters.js::typesetAfterLoad`, idempotent via
  `dataset.filled`) füllt `.physik-eq` aus `window.eq_latex[key]` und triggert
  `MathJax.typesetPromise`. Label muss im Kapitel als gelabelte Gleichung
  existieren.

`data-eqs` ist an beiden Figuren deklariert, aber dormant (statischer Block
gewinnt) — dokumentarisch/future-proof.

### B.3 `9df03b5` — Darkmode `--kb-*-Set`

`darkmode.css`: der Dunkel-Block wird von `#gc10` auf `.aspekt-figur, #gc10`
erweitert, Variablenwerte an die Stand-alone-Vorlage (`body.dark`) angepasst
(Bernstein/Blau/Grün, Graph-Hintergrund `#161925`, Gitter `#262c42`). Das
`--kb-*`-Set ist die **einzige** Stelle für Aspekt-Farben im Darkmode; die
figuren-eigenen CSS referenzieren nur Variablen. Neue Figur muss `.aspekt-figur`
sein, sonst kein Darkmode-Set.

### B.4 `8b6a632` — Rail „Auf dieser Seite" in Skript-Reihenfolge

`shell.js::landmarksFor` (`:69-90`): zwei getrennte `querySelectorAll`-Durchläufe
(Boxen, dann Figuren) werden zu **einem** kombinierten Selektor verschmolzen —
`querySelectorAll` liefert Dokumentreihenfolge, aber zwei Durchläufe hätten erst
alle Boxen, dann alle Figuren gelistet. `.bemerkung`/`.anmerkung` bewusst
weggelassen; `.aspekt-figur` (neu) erscheint als Landmarke (braucht zwingend `id`
+ `data-title`; Label aus `data-title`, nicht aus der Caption).

### B.5 `cd7b1dd` — Backlog P6 Cross-Referenzing (nur Planung)

Reiner BACKLOG-Eintrag (kein Code): Skizze eines künftigen einheitlichen,
datengetriebenen Verweissystems („Karte der Physik") mit Kern-Modul `src/xrefs.js`.
**Ist-Stand** des heutigen Systems (in `numbering.js`, im Diff-Zeitraum
unverändert): `resolveFigRefs` (`:168`, `data-ref-fig` → „Abbildung 1.n" aus
`figNumbers`), `resolveSecRefs` (`:178`, `data-ref-sec` → „Abschnitt x.y.z" via
`getPages`), `resolve_eq_refs` (`:225`, `data-ref-eq` → „(1.4.n)" aus MathJax'
`allLabels`). Aufgerufen über `window.resolve_eq_refs` (in
`chapters.js::typesetAfterLoad`) und `init_numbering`. P6 will `xrefs.js` diese
Aufrufer ersetzen — Knoten-ID-Stabilität vorher klären.

### B.6 `71aa644` + `4edc77d` — Lupenposition + Align der Analyse-Leiste (1.38, breit)

`4edc77d` (architektonisch relevant, neben Align-Fix): **Pivot der Physik-Sektion
von dynamisch zurück auf statisch** (s. §B.2), `.aspekt-panel-right { max-width:
260px }` (Analyse-Spalte im breit-Grid `auto` schrumpft → Align-Problem weg),
`.aspekt-scene`/`.aspekt-main` werden `position:relative` (Voraussetzung Lupe),
Panel-Header-Reihenfolge Chevron-vor-Label. `71aa644`: Lupe wandert von
Figuren-Header ans Bild (`scene.querySelector('.aspekt-scene')` bzw.
`.aspekt-main`), innen rechts neben dem Trennstreifen zur Analyse. `.formula-box`
bekommt zarte Akzentfläche/Rahmen nach Vorlage.

### B.7 `470f08e` + `56a1133` — Auto-Stopp-Reset + Greif-Hinweis

Siehe §A.5 und §A.6.

### B.8 `6da3e70` — Breitenmodi schmal/normal/breit (Breiten angehoben)

`core.js:9`/`:14`:

```js
const CONTENT_WIDTHS   = { schmal: 1000, normal: 1280, breit: 1800 }; // vorher 900/1150/1500
const PAPER_MAX_WIDTHS = { schmal: "710px", normal: "845px", breit: "1175px" }; // vorher 640/760/980
```

`set_width_mode(mode)` (`core.js:312`): setzt `#content`-Inline-`width`,
`#paper`-Inline-`--paper-max-width`, `document.documentElement.dataset.widthMode`
(→ `<html data-width-mode="…">`), `localStorage`-Persistenz (Key
`skript_width_mode`), `mark_active_width_segment`, und
`window.relayout_eq_numbers()`. `init_width_mode` liest aus `localStorage`.
Dispatch in `main.js:180`: `data-action="set_width_mode"` →
`set_width_mode(el.dataset.mode)`.

**Das CSS-Signal** ist `<html data-width-mode="…">`. Modus-abhängige Regeln
**immer** via `:root[data-width-mode="…"]` + `:not(.aspekt-im-overlay)` (sonst
schlagen sie per Spezifität die Overlay-Regeln). Aspekt-Layout: breit =
3-Spalten-Grid (Bedienfeld | Szene | Analyse), schmal/normal = gestapelt.
`.aspekt-im-overlay` ist von den Modus-Regeln ausgenommen.

### B.9 `776c585` — Textskalierung Stufen 1–5, Grafik-UI sanfter

`core.js::metrics_for_level`/`apply_text_size` (`:248-292`): Stufenkurve neu —
`font_scale = [0,0,1,1.13,1.26,1.4]` (Stufe 5 = früherer Stufe-4-Wert 1.4×). Neu
eine **sanftere Skala für Grafik-/Panel-/Regler-Texte**, damit die UI bei hohen
Stufen kompakt bleibt: `graphics_scale = [0,1,1,1.04,1.08,1.12]`,
`graphics_line_scale = [0,1,1,1.02,1.04,1.06]`, bereitgestellt als
`--paper-graphics-scale`/`--paper-graphics-line-scale` an `#paper`. Verwendet in
`styles.css:153` für UI-Texte des papers (Box-Titel, Pagenav, …). Aspekt-Figur-CSS
nutzt sie über `--kb-text-scale = var(--paper-graphics-scale,1)`.

**Zwei Skalen** also: Fließtext via `--paper-font-size`/`--paper-line-height`,
Grafik-UI via `--paper-graphics-scale`/`-line-scale`. Stufenkurve nur zentral in
`metrics_for_level` ändern (beide Arrays konsistent halten).

### B.10 `ad29b38` — Schmalmodus: Legende 3-Spalten

Nur im Schmal-Modus wird die Kreisbahn-Legende (`.legend-grid` im linken
Bedienfeld) auf ein 3-spaltiges Raster (Swatch + Label je Spalte) umgestellt
(`aspekt_kreisbahn.css:221-230`), mit kleinerem Font via `--kb-text-scale`.
`:not(.aspekt-im-overlay)` schließt den Zoom aus. Trifft **nur die Kreisbahn-
Figur** (Weg-Zeit hat keine `.legend-grid`); es gibt keinen generischen Schmal-
Legenden-Mechanismus — analoge Regel pro Figur pflegen.

### B.11 `7267810` + `027bb64` — Druckmodus vom Breiten-Modus entkoppeln

`7267810`: `print.js:51-63` — nach `restorePagination()` entfernt `print_page()`
im Klon die Inline-`width` von `#content` und die Inline-`--paper-max-width` von
`#paper` (sonst schläge Inline-Spezifität das A4-Druck-CSS, Ausdruck hinge am
Breiten-Modus). Schriftgröße bleibt erhalten (einzige für den Druck sinnvolle
Einstellung). `styles.css:150`: feste Druck-Textbreite 700 px, unabhängig vom
Bildschirm-Modus.

`027bb64`: kein durchgehend eingefärbter Hintergrund (Toner) —
`#print_container #content`/`#paper` auf `#fff`, Sicherheitsnetz
`@media print { body,#content,#paper { background:#fff !important } }`.

---

## C. Querverweise für die Skill-Überarbeitung

- **Physik-Sektion — zwei Pfade** (§B.2): Skill-Checkliste für neue Figur —
  „Braucht die Figur Formeln aus dem Lesefluss? → dynamisch via `data-eqs` +
  gelabelte Gleichung, sonst statisch `.formula-box`."
- **Factory-Dispatch** (§A.2): `ASPEKT_FACTORIES` in `main.js:26` ist die
  Erweiterungsstelle; jede Factory baut ihre eigene Runtime via
  `createRuntime()`.
- **Breiten-Modus als CSS-Signal** (§B.8): `:root[data-width-mode="…"]` +
  `:not(.aspekt-im-overlay)`.
- **Textskalierung — zwei Skalen** (§B.9): Fließtext vs. Grafik-UI.
- **Cross-Ref heute** (`numbering.js`, §B.5): `data-ref-*`-Auflösung; P6 geplant.
- **Druck** (§B.11): Inline-Breiten im Klon entfernen; feste 700 px; Toner-Schutz.
- **Darkmode** (§B.3): `--kb-*` an `.aspekt-figur, #gc10`; figuren-eigenes CSS nur
  Variablen.

## D. Commit-Abfolge (3fa5ea0 → HEAD)

`c760eee` (Per-Instanz-Isolation) → `d870dee` (Factory-Pattern + Weg-Zeit) →
`01e9fa7` (Verdrahtung Factory-Dispatch + Physik-Sektion) → `d8fdc7e`
(Aspekt-CSS Optik/Klapp/Physik/Hover) → `8b6a632` (Rail-Reihenfolge) →
`f710ed4` (captureEqLatex) → `a54af1c` (data-eqs + Captions) → `9df03b5`
(Darkmode --kb-*) → `cd7b1dd` (BACKLOG P6) → `71aa644`/`4edc77d` (Lupenposition/
Align + Physik-Pivot) → `470f08e` (Autostop-Reset) → `56a1133` (Greif-Hinweis) →
`6da3e70` (Breiten) → `776c585` (Textskalierung) → `ad29b38` (Schmal-Legende) →
`7267810`/`027bb64` (Druck entkoppelt/Toner).