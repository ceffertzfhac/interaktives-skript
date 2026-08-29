# Figuren (`src/figures/`)

Gilt zusätzlich zu `src/CLAUDE.md`, `InteraktivesSkript_WIP/CLAUDE.md` und der
Wurzel-`CLAUDE.md`.

**Runbook für interaktive Aspekt-Figuren: `../../INTERAKTIVE_ASPEKT_FIGUREN.md` —
vor jeder Arbeit an einer Aspekt-Figur lesen.** Es enthält Konzept,
Schritt-für-Schritt, einen Katalog von 26 realen Fallstricken (der wertvolle
Teil — die meisten sind still) und eine Checkliste. Änderungshistorie seit der
ersten (Singleton-)Version: `../../CHANGES_aspekt_1.38_1.40_und_grundgeruest.md`.

## Die drei Eröffnungsregeln

> **Wer schreibt was?** `CLAUDE.md` = *was gilt* (Regel/Zeiger) · Runbook
> (`INTERAKTIVE_ASPEKT_FIGUREN.md`) = *wie* (Schritte/Fallstricke) · Code-Kommentar
> = *warum*. Zahlen und Aufzählungen stehen an **genau einer** Stelle; die anderen
> verweisen dorthin (P18-Regel: Mengen verlinken, nicht aufzählen).

1. **Motor zuerst wählen** — der Entscheidungsbaum (Kreis-/Spiralbahn? liegt
   etwas auf der Drehachse? beliebige Bahnkurve?) steht im Runbook-Block
   „Motor-Wahl". Inventar + Provenienz aller Motoren: s. u. „Die Motoren".
2. **Eine bestehende Figur kopieren und feature-gaten, nie von Grund auf
   schreiben.** Die ganze Vorlagen-Kaskade (worin suchen, in welcher Reihenfolge,
   mit Begründung) steht im Runbook §0a — dort nachlesen, bevor eine Figur
   begonnen wird.
3. **„wie Abb. 1.38" heißt pixel-identisch**, nicht „ähnlich" — die Begründung
   und die Konsequenz (jede Abweichung ist ein Fehler, auch eine „richtigere")
   stehen im Runbook §0a.

Vor dem Vorlegen selbst visuell prüfen:
`.claude/skills/interaktive-aspekt-figur/scripts/figur_screenshot.mjs`
(Headless-Chromium, Screenshots je Breiten-Modus/Overlay + Ink-Box-Geometrie).
Hinsehen schlägt Messen; und wenn gemessen wird, das innerste gezeichnete
Element messen.

## Dateien

```
factory.js    createFigure() + gemeinsame Omega-Kreis-Hooks
              (circleStep/Wrap/Render, omega*)
fig_NN.js     eine Datei je klassischer Figur; registriert updateN/animateN/clearN
              selbst auf window
panels.js     init_figure_panels()/toggle_panel() — verpackt JEDEN .grafik-container
              in eine einklappbare Vorschaukarte ↔ Vollfigur-Umschaltung (reines JS,
              kein Markup je Figur außer optional data-title/data-desc)
playback.js   gemeinsame Auto-Stopp-Helfer (isAtAutoStopEnd,
              resetOnPlayAfterAutoStop) für animierte Aspekt-Figuren
aspekt_<name>.js/.css   die interaktiven Aspekt-Figuren, je ein Modul + ein CSS
<motor>/      die Motoren (s. u.)
```

### Klassische Figuren (Fabrik-Muster + einklappbare Karten)

> **Abgelöst seit v1.7:** das gesamte `gcN`/`factory.js`/`fig_NN`/`selectN`-
> Figurensystem ruht — keine `id="gcN"`-Container mehr in `chapters/*.html`,
> `factory.js`/`fig_*.js`/`transform.js` werden von `main.js` nicht importiert,
> `core.js::make_static`/`update_all` tragen Guards und no-oppen. Code steht nur
> noch in `Input/InteraktivesSkript_legacy/`. Interaktive Figuren sind heute
> **Aspekt-Figuren** (s. u. + Runbook `INTERAKTIVE_ASPEKT_FIGUREN.md`). Die
> folgenden Absätze beschreiben die Legacy-Architektur als Referenz.

Jede interaktive Figur ist ein nummerierter Container
`<div id="gcN" class="grafik-container">` (N ∈ {1,3,31,32,4,5,51,6,8,9,10}) mit
einem inline `<svg id="svgN">` plus Range-Slidern `id="rangeN_*"` (gc10 /
Kreisbewegung nutzt stattdessen `kb_`-prefixte IDs, s. u.).

Die 7 animierten 3D-Kreis-Figuren (3/31/32/5/51/6/8) entstehen über
`createFigure({id, render, step, wrap, condition, snap, clear?})` in
`factory.js`, das allen gemeinsamen Boilerplate besitzt: eine
`requestAnimationFrame`-Schleife mit ~10-ms-Akkumulator (ersetzt rekursives
`setTimeout(...,10)`), einen Reentry-Guard, Slider-Snap, φ-Wrap +
Umdrehungszähler (`state.n`), einen **gecachten** statischen Kreis `p3d`
(wird nur bei Radius-/z-Änderung neu gebaut, nicht pro Frame), die
Koord-Transformation + foreignObject-Kopien und den φ-Span-Block. Jede
`fig_NN.js` liefert nur die figurspezifischen Hooks. Die Fabrik legt
`updateN`/`animateN`/`clearN` auf `window` (der Binder und `update_all`
konsumieren diese Namen — das `N`-Suffix bleibt der HTML↔JS-Vertrag).

Die 2D-Bögen (gc1/gc9) und der Radio-Bildtausch (gc4) sind kleine eigenständige
Module.

Jeder `.grafik-container` — ob von der Fabrik gebaut oder nicht — wird von
`panels.js::init_figure_panels()` in eine einklappbare Karte verpackt:
standardmäßig zugeklappt (Titel + Kurzbeschreibung + „Simulation öffnen",
gespeist aus `data-title`/`data-desc` am Container), klappt beim Klick an Ort
und Stelle zur vollen interaktiven Figur auf (`data-action="toggle_panel"`).
Das ersetzte das frühere sticky/skalierte Zweispalten-Layout (`splitter.js`,
entfernt), nachdem die Figuren in den Ein-Unterabschnitt-pro-Seite-Lesefluss
gewandert sind, wo eine scroll-fixierte Begleitspalte keinen Sinn mehr ergibt.

> **Bewusst erhaltener Legacy-Bug:** der `>6.27`-Wrap von gc51 in `fig_5.js`
> erhöht **gc5s** Umdrehungszähler (`fig5.state.n++`) statt gc51s — aus
> Verhaltenstreue beibehalten, im Code markiert.

## Die Motoren

Ein „Motor" ist eine portierte Stand-alone-Simulation, die mehrere Aspekt-Figuren
gemeinsam antreiben. Alle kapseln `store`/`DOM` als Modul-Singletons und
geben über `runtime.js::createRuntime()` jeder Figur einen isolierten Zustand +
eindeutigen ID-Prefix; `withStore(fn)` nutzt den Singleton nur als
Scratch-Buffer während eines synchronen Zeichnens und stellt den vorherigen
Stand danach wieder her. `state.js::q(id)` = `getElementById(store.idPrefix + id)`.
**Die Begründungen und die Port-Änderungen je Motor stehen im Kopfkommentar von
`<motor>/runtime.js` bzw. `state.js`** — nicht hier, damit diese Liste O(1)
bleibt.

| Motor | Sicht | ID-Prefix | Existiert, weil … |
|---|---|---|---|
| `kreisbewegung/` | 2D-Draufsicht | `kb_` (Default) | erste Portierung; die gc10-Standalone-Sim ruht seit v1.7 (s. „Klassische Figuren"), der Motor lebt über die Aspekt-Figuren weiter |
| `kreis_spiral/` | ISO-3D (`projectISO`) mit sichtbarer **Rotationsachse** | `ks<n>_` | ω und α leben auf der Achse — in der 2D-Draufsicht unmöglich. Bringt α, Ebenenhöhe h und den Spiralmodus nativ mit |
| `grundbegriffe/` | 2D-x-y-Diagramm, **beliebige** feste Bahnkurve x(t)/y(t) | `gk<n>_` | beide anderen können nur Kreis-/Spiralbahnen. Erster **zeitloser** Motor: kein rAF, kein Play/Pause, keine `show*`-Flags sondern `store.toggles`, Schalter-mit-Hover-Erklärung statt Slidern — **daher keine Vorlage für eine Kreisbewegungs-Figur** |
| `federpendel/` | Feder-Masse-Szene + t-Diagramm, harmonische Schwingung | `fp<n>_` | erster Motor außerhalb der Kreis-/Bahnthematik. Bringt die Zeitreihen für x, v, a **und die Energien** (Ek/Ep/Eges) mit, damit 3.1.9 ohne zweiten Port folgen kann; kann `oscillationMode` horizontal **und** vertikal |
| `freier_fall/` | vertikale Szene + t-Diagramm(e), 1D-Fall/Wurf | `ff<n>_` | erster Motor mit **wählbarer Achsenkonvention**: `yAxisConfig` (Richtung hoch/runter × Nullpunkt Boden/Abwurfpunkt) rechnet erst beim Anzeigen um, wodurch eine einzige Bewegungsgleichung die vier v0.13-Varianten Abb. 1.4–1.7 trägt. `v0` als Vorzeichenparameter deckt freien Fall **und** senkrechten Wurf ab; zwei Diagramm-Slots (`single`/`top`/`bottom`) statt einem |
| `bus_weg_zeit/` | Straßenszene + t-x-Diagramm, stückweise x(t) | `bw<n>_` | figur-only, keine passende Stand-alone-Sim; strukturell auf `grundbegriffe/` modelliert. `store.t` ist ein SKALARer Zeitcursor (kein tA/tB-Paar) — ein Cursor steuert Bus und Kurvenpunkt synchron |

Gemeinsame Bausteine: `kreisbewegung/lib/{format,hover,svg-text,ticks,vectors}.js`
werden von **allen** Motoren wiederverwendet (die späteren importieren aus
`../kreisbewegung/lib/`). Der `kreisbewegung`-Motor ist mehrdateilich
(`constants/state/physics/render/ui.js`), die anderen kommen ohne eigenes
`ui.js` aus.

Herkunft: `kreisbewegung` ← `Input/Simulationen/Project_kreisbewegung_simulation/`
(dessen Geschwister-Projekt-Abhängigkeit `shared/js/*` — nicht Teil von `Input/`
dieses Repos — wurde nach `kreisbewegung/lib/` mitportiert);
`kreis_spiral` ← `Project_kreis_spiralbewegung_simulation/` (UI/Topbar und
`export-image.js` der Sim wurden nicht gebraucht);
`grundbegriffe` ← `Project_grundbegriffe_kinematik_simulation`;
`freier_fall` ← `Project_freier_fall_simulation` (dessen `ui.js` — Theme,
CSV-Export, Akkordeon — wurde nicht gebraucht);
`bus_weg_zeit` hat keine Quell-Sim.

`kreisbewegung` nutzt **nicht** `factory.js` — sein Interaktionsmodell
(durchgehendes Auto-Play über vorberechnete Zeitreihen + zwei Live-Graphen)
passt nicht zum Slider-Drag-/φ-Wrap-Vertrag der Fabrik. Der gc10-Standalone-
Init-Pfad (`initKreisbewegung()` aus `main.js::init()`) ist **seit v1.7
auskommentiert** (kein gc10-Container mehr); der Motor wird heute ausschließlich
über die Aspekt-Figuren angesteuert, die ihn per `createRuntime()` je Instanz
isoliert einbinden.

Zur ISO-Verkürzung in `kreis_spiral`: ein in der Ebene liegender Vektor
**konstanten Betrags** projiziert zwischen 0,707× und 1,225× — kein Bug
(identisch zur Quell-Sim und zu Legacys `to2d(…, perspective 3)`, die lediglich
top-down voreingestellt sind). Deshalb der „Blickrichtung"-Umschalter auf
1.57–1.59 (`store.isoElevation`: flach 60° = Default, räumlich = echte
Isometrie). Vollständige Begründung im Runbook.

## Aspekt-Figuren

Alle folgen **einem** Muster: eine `buildXFig(fig)`-Fabrik, eine eigene
`createRuntime()`-Motorinstanz, feature-gegatete Store-Flags, Slider,
zweistufige Anzeige (inline + Lupe-Overlay), ein einzelner oder gestapelter
Graph mit Auto-Stopp und Geisterkurve.

**Welche Figur welchen Motor nutzt, steht nicht hier** (Mengen werden verlinkt,
nicht aufgezählt): maßgeblich sind `main.js::ASPEKT_FACTORIES` (Zuordnung
`data-aspekt` → Fabrik) und der **Kopfkommentar jedes `aspekt_*.js`**, der seine
eigene Vorlage und jede Abweichung davon benennt.

**Eine Fabrik darf mehrere Abbildungen tragen.** Wenn sich Abbildungen NUR in
Parametern unterscheiden (Ausgangswerte, Koordinatenwahl) und sonst identisch
sind, bekommt jede weiterhin ihre eigene Figur mit eigener Motor-Instanz und
eigener Nummer (1:1-Granularität), aber **nicht** ihr eigenes Modul: die
Unterschiede stehen als `data-*` am Platzhalter im Kapitel, `ASPEKT_FACTORIES`
bildet mehrere `data-aspekt`-Namen auf dieselbe Fabrik ab, und eine weitere
Variante kostet eine Zeile HTML statt einer Moduldatei. Ein Umschalter INNERHALB
einer Figur wäre etwas anderes und ist nicht gemeint. Teilen sich solche Figuren
auch das Aussehen, teilen sie sich ihr Stylesheet über
`.aspekt-figur[data-motor="<motor>"]` statt über den Aspekt-Namen — sonst stünde
derselbe Regelsatz mehrfach da.

`aspekt_kreisbahn.js` (Abb. 1.38) exportiert zusätzlich die generischen Toggles
(`toggle_aspekt` / `close_aspekt_overlay` / `toggle_analyse` /
`toggle_panel_left`), die ALLE Figuren über die Bindung in `main.js`
mitbenutzen, und ist die **optische Referenz** — „wie 1.38" heißt pixel-identisch
(Regel 3; Begründung + Konsequenz im Runbook §0a).

### Dispatch (nicht Fabrik-gebaut)

`main.js::ASPEKT_FACTORIES` bildet `data-aspekt` → `buildXFig` ab;
`init_aspekt_figuren()` führt jede vor `init_numbering()` aus,
`label_aspekt_figuren()` überträgt danach die „Abb. 1.n" der statischen Figur
(über `data-figref`) in die interaktive Bildunterschrift.

Der „Physik-Abschnitt" (Formeln neben einer Figur) hat zwei Wege: eine statische
`.formula-box` im Template (Default) oder eine dynamische `.physik-list`, gefüllt
aus `window.eq_latex` (vor dem Typeset von `chapters.js::captureEqLatex` aus jeder
`\label`-tragenden Gleichung eingesammelt), wenn eine Figur `data-eqs="…"` trägt
und keine statische Box hat.

### Optik und Tokens

`aspekt_*.css` ist aus `kreisbewegung/styles.css` abgeleitet und auf
`.aspekt-figur` gescopt (gemeinsames `aspekt_kreisbahn.css` für alle + ein
`aspekt_<name>.css` je Figur). Die Tokens `--kb-lw` / `--kb-fs` auf
`.aspekt-figur` skalieren Strichstärken und Schriften ×1.5 — **nur** Kernsim und
Diagramm, ausgenommen sind das φ-Label sowie Bedienung/Analyse; Pfeilspitzen
bleiben über `ARROW_LEN` + `userSpaceOnUse`-Marker fix.

Breiten-Modus-abhängige Regeln immer über `:root[data-width-mode="…"]`
selektieren; Aspekt-Figuren ergänzen `:not(.aspekt-im-overlay)`, damit im
Overlay das Overlay-Layout gewinnt.

### Farbpaletten (CVD)

**Regel:** Vektor-Farben **nie** hardcodieren oder pro Figur neu definieren —
immer die `--kb-*`-Tokens referenzieren. CVD-Paletten werden über Custom-
Property-Overrides gesetzt, **ohne Re-Render** (Custom Properties kaskadieren,
`var(--kb-…)` in SVG-`stroke`/`fill` löst automatisch neu auf).

**Die Standard-Palette folgt den STATISCHEN Abbildungen** (Wiedererkennungswert,
Nutzervorgabe v1.27): Hauptvektoren aus den `\textcolor[HTML]{…}` der
Bildunterschriften, Szenen-Objekte aus den gezeichneten Farben der Quell-SVGs.
Folge: die Quellen-Palette ist unter Deuteranopie prinzipiell nicht trennscharf
— deshalb misst der Prüfer sie nur als INFO.

**Quellen (Werte + Mechanik am Datei-Kopf, hier nur Zeiger — an genau einer
Stelle):**
- `aspekt_kreisbahn.css`-Kopf — die `--kb-*`-Werte-Tabelle (kanonisch aus der
  LaTeX-Quelle, Provenienz, welche Quellfarben bewusst nicht übernommen und
  warum, Alias-Liste).
- `aspekt_paletten.css`-Kopf — die CVD-Mechanik (wie viele Override-Blöcke, dass
  WERT **und** ALIAS gesetzt werden, warum `darkmode.css` die Aliase direkt
  entkoppelt, Sonderfall Normal = kein Override).
- **Sonderfall Kapitel 1.1** (Abb. 1.1, `aspekt_grundbegriffe`): eigene
  `--gk-*`-Tokenfamilie statt der kapitelgebundenen `--kb-*`-Vektorfarben, daher
  DREI eigene Zweige — Hell in `aspekt_grundbegriffe.css`, Dunkel in
  `darkmode.css`, CVD in `aspekt_paletten.css`. Aliase gibt es hier keine, und
  die CVD-Selektoren sind spezifischer als der Darkmode-Block, also gewinnt
  Dunkel+CVD ohne Zusatzregel.

**Bedienung + Prüfung** (wie wählen, `apply_farbwoerter`-Wortmap pro Palette ×
Hell/Dunkel, `.kb-sw-<tok>`-Klassen, `cvd_check.mjs`/`caption_farbwort_check.mjs`,
statische `nur-druck`-Captions + `bilder/*.png` bleiben fix) stehen im Runbook
§4 — dort nachlesen, bevor an Palette/Caption gearbeitet wird. Die Bedienfläche
(Einstellungen-Popover, Persistenz `skript_palette`/`data-palette`/`data-darkmode`)
ist in `../CLAUDE.md` beschrieben.
