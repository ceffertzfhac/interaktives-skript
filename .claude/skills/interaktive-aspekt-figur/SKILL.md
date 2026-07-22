---
name: interaktive-aspekt-figur
description: Eine interaktive „Aspekt-Figur" ins interaktive Skript einbauen — eine der umfangreichen Stand-alone-Simulationen (Input/Simulationen/Project_*) feature-gated auf EINEN Kapitel-Aspekt reduziert, zweistufig (inline + Lupe-Overlay), optisch/technisch an der Vorlage orientiert. Nutzen, wenn zu einer Abbildung eine interaktive Grafik gebaut, eine Simulation eingebettet, oder eine bestehende Aspekt-Figur erweitert werden soll (Regler, Vektoren, Winkel, Analyse-Panel, Zoom).
---

# Interaktive Aspekt-Figur bauen

Vollständige Begründung und Schritt-für-Schritt: **`InteraktivesSkript_WIP/INTERAKTIVE_ASPEKT_FIGUREN.md`** (Runbook mit Konzept, 11 Fallstricken, Checkliste). Dieses Skill ist die Arbeitsanweisung + die ausführbaren Helfer.

Referenz-Implementierung: `src/figures/aspekt_kreisbahn.js` (+ `.css`), Abb. 1.38 in 1.4.1.

## Grundsatz

> **Motor wiederverwenden, nicht nachbauen.** Die Figur importiert
> `physics`/`render`/`state`/`constants` der portierten Sim
> (`src/figures/kreisbewegung/`) und schaltet über `store.show*`-Flags alles
> Nicht-Relevante ab. Kein eigener Zeichencode → Optik = Sim.

Nur `InteraktivesSkript_WIP/` verändern; `Input/` ist lesend.

## Vorab mit dem Nutzer klären
- Welcher **Aspekt** (welche `show*`-Flags), welche **Regler**?
- Interaktive Figur **ersetzt** die statische Abbildung im Lesefluss oder
  **ergänzt** sie? (Referenz: ersetzt am Bildschirm, statische bleibt Druck-Fallback.)

## Schritt 1 — DOM-Vertrag ermitteln (verhindert den häufigsten Bug)

`updateScene()`/`setupScene()` dereferenzieren manche `DOM.x` — fehlt das
Element, gibt es beim ersten Zeichnen einen Null-Zugriff. Welche das sind,
sagt der Analysator (statt Trial-and-Error):

```bash
node .claude/skills/interaktive-aspekt-figur/scripts/dom_vertrag.mjs \
     InteraktivesSkript_WIP/src/figures/<sim>            # default entry: setupScene,updateScene
```

Ausgabe: die `kb_`-IDs, die das Skelett enthalten muss — getrennt in
**Kern-Szene** (sichtbar, als `<line>/<circle>/<g>/<path>/<text>`) und **Stubs**
(Stoppuhr/Live-Panel, versteckt, aber vorhanden) inkl. fertiger HTML-Stubzeile.

## Schritt 2 — Modul bauen

Am Referenzmodul `aspekt_kreisbahn.js` orientieren:
- **Imports** aus dem Motor: `store, DOM, initDOM` / `recomputeDerived,
  precompute, position, velocity, acceleration` / `setupScene, updateScene` / Konstanten.
- **Regler → Motor**: den zeit-/ω-getriebenen Motor per Pseudo-Zeit ansteuern
  (`t = φ/ω`), `precompute()` + `updateScene(t, position(t), …, centers)`.
- **Flags gaten**: `store.show*` auf den Aspekt setzen (Rest aus).
- **Skelett**: alle IDs aus Schritt 1; Marker `markerUnits="userSpaceOnUse"`
  mit **fester Länge = ARROW_LEN** (12.5/10), damit die Strichstärke frei ist
  und die Pfeilspitze am Punkt bleibt.
- **Eigene Zusatz-Zeichnung** (Winkelbogen o. ä.) in **eigener** Gruppe; bei
  eigenen Achsen `kb_animation_coord_system` nach `setupScene()` leeren.
- **Zeichen/Formeln als MathJax**: im SVG per `<foreignObject>` mit `\(\varphi\)`
  (fontunabhängig); Panel-Formeln nur `\[…\]` (unnummeriert).

## Schritt 3 — Optik verbatim aus der Vorlage

Farb-Tokens (`--kb-*`) und die Klassen `panel-section`/`panel-label`/
`slider-label`/`slider-row`/`slider-val`/`legend-grid`/`analysis-grid`/
`analysis-cell`/`panel-header`/`panel-body` **verbatim** aus
`kreisbewegung/styles.css` übernehmen, auf `.aspekt-figur` statt `#gc10` gescopt.
Werte mit deutschem Dezimalkomma.

**Layout je Modus** über `data-width-mode`; Modus-Regeln mit
`:not(.aspekt-im-overlay)` scopen (sonst schlagen sie per Spezifität die
Overlay-Regeln). **Overlay-SVG** an der Viewport-Höhe deckeln
(`max-width: min(100%, 62vh)`), nicht über flex/grid `height:100%`.

## Schritt 4 — Verdrahtung (O(1))
- Kapitel: leerer Platzhalter `<div class="aspekt-figur nur-bildschirm"
  data-aspekt="…" data-figref="<statische-id>" data-caption="…">`; statische
  Abbildung `class="abbildung nur-druck"`.
- `main.js`: Imports + `init_aspekt_figuren()` (vor `init_numbering()`) +
  `label_aspekt_figuren()` (danach) + `data-action`-Fälle (`toggle_aspekt`,
  `close_aspekt_overlay`, `toggle_analyse`).
- `index.html`: `<link>` auf die Figur-CSS.

## Schritt 5 — Verifikation

```bash
# Baut die Figur headless, uebt alle Regler + Overlay/Analyse -> findet Null-Zugriffe
node .claude/skills/interaktive-aspekt-figur/scripts/figur_smoke.mjs \
     InteraktivesSkript_WIP/src/figures/<figur>.js

node --check <figur>.js                      # Syntax
# CSS-Klammern balanciert (Kommentare vorher entfernen -- ein */ im Kommentar beendet ihn)
# Panel-Formel unnummeriert? offline mit mathjax-full: 0 mlabeledtr / 0 width="full"
# Kapitel-Nummerierung unveraendert:
node .claude/skills/v013-verifikation/scripts/dom_harness.mjs InteraktivesSkript_WIP
```

**Nur im Browser / mit dem Auge des Nutzers**: Optik/Farben wie die Sim,
Größenverhältnisse (inline vs. Zoom), Kollisionen, Label-Platzierung, MathJax-
Glyphen (varphi geschwungen), foreignObject unter Safari. Diese Feinarbeit ist
**iterativ** — mehrere Feedback-Runden einplanen; bei „eine Version zurück"
klären, welche.

## Fallstricke
Der vollständige Katalog (11 Stück, alle real aufgetreten) steht im Runbook,
Abschnitt 7. Die drei teuersten: Pfeillängen-Kopplung (`ARROW_LEN=5·strokeWidth`),
fehlende DOM-Stubs (Schritt 1 löst das), varphi-Glyph nur per MathJax zuverlässig.

## Abschluss
Klein committen (pro logischer Einheit), Doku bei Architektur-Änderung anpassen,
nicht mergen/pushen ohne Nutzerfreigabe.
