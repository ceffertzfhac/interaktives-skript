---
name: interaktive-aspekt-figur
description: Eine interaktive „Aspekt-Figur" ins interaktive Skript einbauen — eine der umfangreichen Stand-alone-Simulationen (Input/Simulationen/Project_*) feature-gated auf EINEN Kapitel-Aspekt reduziert, zweistufig (inline + Lupe-Overlay), optisch/technisch an der Vorlage orientiert. Nutzen, wenn zu einer Abbildung eine interaktive Grafik gebaut, eine Simulation eingebettet, oder eine bestehende Aspekt-Figur erweitert werden soll (Regler, Vektoren, Winkel, Graphen, Analyse-Panel, Zoom, Play/Pause).
---

# Interaktive Aspekt-Figur bauen

Vollständige Begründung und Schritt-für-Schritt: **`InteraktivesSkript_WIP/INTERAKTIVE_ASPEKT_FIGUREN.md`** (Runbook mit Konzept, Fallstricken, Checkliste). Diese Skill ist die Arbeitsanweisung + die ausführbaren Helfer. Begleit-Doku zu allen Änderungen seit der ersten Anlage (Singleton → Per-Instanz, 2. Figur 1.39, 3. Figur 1.41, Grundgerüst): `InteraktivesSkript_WIP/CHANGES_aspekt_1.38_1.40_und_grundgeruest.md`.

Referenz-Implementierungen: `src/figures/aspekt_kreisbahn.js` (Abb. 1.38, Positions-Aspekt), `src/figures/aspekt_weg_zeit.js` (Abb. 1.39, Weg-Zeit-Aspekt + gestapelte Graphen + Auto-Stopp + Vergleichslinie) und `src/figures/aspekt_winkel_zeit.js` (Abb. 1.41, Winkel-Zeit-Aspekt + einzelner Graph + Geisterbögen pro Umdrehung + Vergleichslinie). Nummern sind die echte `Abb. 1.n`-Zählung (1.40 = statische radial-tangential-Figur, keine Aspekt-Figur — deshalb ist „weg-zeit" 1.39, nicht 1.40).

## Grundsatz

> **Per-Instanz-Motor wiederverwenden, nicht nachbauen.** Jede Figur holt sich
> über `createRuntime()` (`src/figures/kreisbewegung/runtime.js`) ihren eigenen
> `store`/`DOM`-Kontext mit eindeutigem ID-Prefix (`kb0_`, `kb1_`, …). Sie
> importiert `physics`/`render`/`state`/`constants` der portierten Sim und
> schaltet über `store.show*`-Flags alles Nicht-Relevante ab. Alle Motor-Aufrufe
> laufen **inside `rt.withStore(…)`**. Kein eigener Zeichencode → Optik = Sim.
> Mehrere Figuren pro Seite sind dadurch unabhängig (vormals offener Punkt).

Nur `InteraktivesSkript_WIP/` verändern; `Input/` ist lesend.

## Vorab mit dem Nutzer klären
- Welcher **Aspekt** (welche `show*`-Flags), welche **Regler**?
- Interaktive Figur **ersetzt** die statische Abbildung im Lesefluss oder
  **ergänzt** sie? (Referenz: ersetzt am Bildschirm, statische bleibt Druck-Fallback.)
- Braucht die Figur **Play/Pause** (Auto-Stopp) oder ist sie rein Slider-getrieben?
- Formeln zur Figur **statisch** (fester Block) oder **dynamisch** aus dem Lesefluss?

## Schritt 1 — DOM-Vertrag ermitteln (verhindert den häufigsten Bug)

`updateScene()`/`setupScene()`/`initDOM()` dereferenzieren manche `DOM.x` — fehlt
das Element, gibt es beim ersten Zeichnen einen Null-Zugriff. Welche das sind,
sagt der Analysator (statt Trial-and-Error):

```bash
node .claude/skills/interaktive-aspekt-figur/scripts/dom_vertrag.mjs \
     InteraktivesSkript_WIP/src/figures/kreisbewegung   # default entry: setupScene,updateScene
```

Ausgabe: die `kb_`-IDs, die das Skelett enthalten muss — getrennt in
**Kern-Szene** (sichtbar, als `<line>/<circle>/<g>/<path>/<text>`) und **Stubs**
(Stoppuhr/Live-Panel/v/a-Vektoren, versteckt, aber vorhanden) inkl. fertiger
HTML-Stubzeile. (Hinweis: `q(id)=getElementById(store.idPrefix+id)`; der Prefix
wird pro Instanz addiert — die Template-Literale tragen `kb_`.)

## Schritt 2 — Modul bauen (Factory pro Figur)

Am Referenzmodul `aspekt_weg_zeit.js` (gestapelte Graphen + Auto-Stopp +
Vergleichslinie) bzw. `aspekt_winkel_zeit.js` (jüngstes Exemplar, einzelner
Graph + Geisterbögen pro Umdrehung) orientieren:
- **Runtime pro Figur:** `const rt = createRuntime(); const p = rt.prefix;`
  Skelett-Templates mit `kb_*`-IDs per `.replace(/kb_/g, p)` prefixen,
  `PANEL_*` per `.replace(/id="ak_/g, \`id="${p}ak_\`)`, dann `rt.bindDom()`.
- **Imports** aus dem Motor: `store`/`DOM`/`initDOM`, `recomputeDerived`/
  `precompute`/`position`/`velocity`/`acceleration` (ggf. `extendMotionData`,
  `recalculateAxisLimits`), `setupScene`/`updateScene` (ggf. `updateGraph`/
  `updateGraphHover`), Konstanten, `createRuntime` aus `runtime.js`,
  `resetOnPlayAfterAutoStop` aus `playback.js` (nur bei Auto-Stopp), `ge` aus
  `../core.js`.
- **Export:** `export function buildXFig(fig)` (`fig` = `.aspekt-figur`-Element);
  `if (fig.dataset.built) return;` als Reentry-Guard. Regler + Zustand im Closure.
- **Regler → Motor:** zeit-/ω-getrieben per Pseudo-Zeit (`t = φ/ω`), Zeichnen
  **inside `rt.withStore(() => { precompute(); updateScene(…); })`**. Bei R/T-
  Änderung `rebuild()` (full recompute + `setupScene()` + eigene Achsen).
- **Flags gaten:** `Object.assign(rt.storeInstance, { show*: … })`.
- **Skelett:** alle IDs aus Schritt 1; Marker `markerUnits="userSpaceOnUse"`
  mit **fester Länge = ARROW_LEN** (12.5/10), damit die Strichstärke frei ist.
- **Eigene Zusatz-Zeichnung** (Winkelbogen o. ä.) in **eigener** Gruppe; bei
  eigenen Achsen `kb_animation_coord_system` nach `setupScene()` leeren.
- **Zeichen/Formeln als MathJax**: im SVG per `<foreignObject>` mit `\(\varphi\)`
  (fontunabhängig); Panel-Formeln nur `\[…\]` (unnummeriert).
- **Speed-Radios** pro Instanz `name="${p}speed"`, selbst abgreifen (nicht
  `DOM.speedRadios`); **Runbar**-Buttons mit `data-act="start|stop|reset"` +
  Container-Listener in der Factory.
- **Greifbarer Punkt** (optional): Pointer-Drag-Handler im `buildXFig`-Body nach
  Vorbild 1.38 (`getScreenCTM`, Snap auf Slider-Schritt, Clamp, gleiche
  `refresh()`-Pipeline; CSS `cursor:grab`/`is-dragging-point`).

## Schritt 3 — Optik von der Vorlage abgeleitet

Farb-Tokens (`--kb-*`) und die Klassen `panel-section`/`panel-label`/
`panel-header`/`panel-body`/`slider-label`/`slider-row`/`slider-val`/
`legend-grid`/`analysis-grid`/`analysis-cell` aus `kreisbewegung/styles.css`
**ableiten**, auf `.aspekt-figur` statt `#gc10` gescopt — in `aspekt_kreisbahn.css`
(gemeinsam, für alle Figuren) + ggf. `aspekt_<name>.css` (nur Ergänzungen).
UI-Schrift über `--kb-text-scale = var(--paper-graphics-scale,1)` skalieren. Werte
mit deutschem Dezimalkomma.

**Layout je Modus** über `<html data-width-mode="…">` (`core.js::set_width_mode`):
schmal = gestapelt, normal = Panel | Szene, breit = Panel | Szene | Analyse.
Modus-Regeln mit `:not(.aspekt-im-overlay)` scopen (sonst schlagen sie per
Spezifität die Overlay-Regeln). **Overlay-SVG** an der Viewport-Höhe deckeln
(`max-width: min(100%, 62vh)`), nicht über flex/grid `height:100%`.

## Schritt 4 — Verdrahtung (O(1))
- Kapitel: leerer Platzhalter `<div class="aspekt-figur nur-bildschirm"
  id="aspekt-…" data-aspekt="…" data-title="…" data-figref="<statische-id>"
  data-eqs="…" data-caption="…">`; statische Abbildung `class="abbildung
  nur-druck"` **direkt daneben** (sonst zeigt `data-figref` aufs falsche Label).
- `main.js`: Import der `buildXFig` + Eintrag in `ASPEKT_FACTORIES` (`:26`);
  `init_aspekt_figuren()` (vor `init_numbering()`) + `label_aspekt_figuren()`
  (danach) laufen generisch. Die `data-action`-Fälle `toggle_aspekt`,
  `close_aspekt_overlay`, `toggle_analyse`, `toggle_panel_left` sind generisch
  (in `aspekt_kreisbahn.js` definiert) — kein eigener Dispatch nötig.
- `index.html`: `<link>` auf `aspekt_kreisbahn.css` (immer) + ggf.
  `aspekt_<name>.css`.

**Physik-Sektion (Formeln zur Figur):** statisch `.formula-box` im
`PANEL_RIGHT`-Template **oder** dynamisch via `data-eqs` + gelabelte Gleichung
(`chapters.js::captureEqLatex` → `window.eq_latex` → `fill_physik_panels`).
Nicht mischen — der statische Block gewinnt; `data-eqs` wird dann dormant.

## Schritt 5 — Verifikation

```bash
# Baut die Figur headless, uebt alle Regler + Overlay/Analyse/Runbar -> findet Null-Zugriffe
node .claude/skills/interaktive-aspekt-figur/scripts/figur_smoke.mjs \
     InteraktivesSkript_WIP/src/figures/aspekt_kreisbahn.js            # default: buildKreisbahnFig
node .claude/skills/interaktive-aspekt-figur/scripts/figur_smoke.mjs \
     InteraktivesSkript_WIP/src/figures/aspekt_weg_zeit.js --init=buildWegZeitFig

node --check <figur>.js                      # Syntax
# CSS-Klammern balanciert (Kommentare vorher entfernen -- ein */ im Kommentar beendet ihn)
# Panel-Formel unnummeriert? offline mit mathjax-full: 0 mlabeledtr / 0 width="full"
# Kapitel-Nummerierung unveraendert:
node .claude/skills/v013-verifikation/scripts/dom_harness.mjs InteraktivesSkript_WIP
```

**Nur im Browser / mit dem Auge des Nutzers**: Optik/Farben wie die Sim,
Größenverhältnisse (inline vs. Zoom), Kollisionen, Label-Platzierung, MathJax-
Glyphen (varphi geschwungen), foreignObject unter Safari, Schmal-/Breit-Modus,
Darkmode. Diese Feinarbeit ist **iterativ** — mehrere Feedback-Runden einplanen;
bei „eine Version zurück" klären, welche.

## Fallstricke
Der vollständige Katalog (16 Stück, alle real aufgetreten) steht im Runbook,
Abschnitt 7. Die teuersten: Pfeillängen-Kopplung (`ARROW_LEN=5·strokeWidth`),
fehlende DOM-Stubs (Schritt 1 löst das), varphi-Glyph nur per MathJax zuverlässig,
Graph-HitRect-Null-Zugriff (Weg-Zeit), Speed-Radio-/Runbar-Kollision zwischen
Instanzen. Der vormalige „Store-Konflikt" (Singleton) ist per `createRuntime`
gelöst.

## Abschluss
Klein committen (pro logischer Einheit), Doku bei Architektur-Änderung anpassen,
nicht mergen/pushen ohne Nutzerfreigabe.