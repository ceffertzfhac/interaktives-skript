<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P28 — Formelsatz in SVG-Diagrammen: Recherche, Plan, dann Umsetzung

Eingetragen 2026-09-26 nach Nutzervorgabe. Anlass: der echte Index in
\(v_x\)/\(v_y\) (P16-9a) brauchte zwei Anläufe mit `<tspan>`-Tiefstellung. Die
Frage des Nutzers: *„warum sind diese ‚workrounds' überhaupt notwendig? kann man
nicht einfach text setzen - mathjax oder so was?"* — und dann: *„backlog item
anlegen: und zwar: echte recherche, was state-of-the-art und best practise ist
diesbezüglich. echter plan mode research wie es am besten geht für UNSEREN use
case, und dann erst an die umsetzung gehen"*.

**Das Ziel in einem Satz:** Formelzeichen in Diagrammtiteln, Achsen- und
Szenenbeschriftungen aller Figuren-Motoren sehen aus wie der Formelsatz im
Fließtext — auf dem Weg, der für *unseren* Fall (statische Seite, viele
Instanzen, Echtzeit-Neuzeichnen, Darkmode, Paletten, Druck) nachweislich der
beste ist, nicht auf dem erstbesten.

**Reihenfolge ist verbindlich:** Phase 1 → Freigabe → Phase 2 → Freigabe →
Phase 3. Keine Umsetzung vor dem freigegebenen Plan.

### Ausgangslage (Stand 2026-09-26)

- Alle acht Motoren setzen Beschriftungen als SVG-`<text>` mit `<tspan>`
  (kursiv per `font-style`, Index seit v1.56.2 per `baseline-shift: -0.3em`,
  70 %). Synchron, exportierbar, aber Typografie nur „ungefähr LaTeX".
- Der Fließtext nutzt MathJax v3 `tex-svg` (CDN), seitenweise gesetzt (P22-3).
- Bekannter Fehlschlag: MathJax in `<foreignObject>` — Glyphe sitzt konstant zu
  tief (Runbook-Fallstrick #17, Abb. 1.41).
- Dieselben Motoren stammen aus der Stand-alone-Sim (Repo
  `Projects_InteraktiveSimulation`, dort BACKLOG I18) — die Lösung soll für
  beide Repos taugen.

### Sub-Tasks

- [ ] **P28-1 Recherche (state of the art / best practice)** *(M)* — echte
  Quellenrecherche, nicht aus dem Gedächtnis. Mindestens zu prüfen und zu
  belegen:
  - MathJax 3/4: `tex2svg` bzw. `tex2svgPromise` → SVG-Knoten direkt ins
    Diagramm; Messen (`getBBox`), Ausrichten (Grundlinie!), Drehen; `fontCache`
    (`local`/`global`/`none`) und was das für mehrere Instanzen und Export
    bedeutet; Ladezeit, Async-Verhalten, Caching gleicher Labels.
  - KaTeX: nur HTML/MathML-Ausgabe → in SVG nur über `foreignObject`; warum
    das bei uns scheiterte, ob es heute robust geht.
  - Native MathML (Core, in allen Evergreen-Browsern) — in SVG über
    `foreignObject`; Font-Frage (STIX Two / Latin Modern Math).
  - Vorgerenderte Labels (Build-Schritt fällt weg: kein Build-System!) vs.
    Laufzeit-Satz.
  - Wie es verbreitete Werkzeuge lösen: Plotly (MathJax in SVG), Observable
    Plot/d3, Desmos, GeoGebra, JSXGraph, matplotlib-SVG (mathtext),
    PhET-Simulationen (Scenery) — was davon ist übertragbar.
  - Barrierefreiheit (Screenreader, `aria-label`), Druck, Dark Mode/`currentColor`,
    CVD-Paletten, SVG/PNG-Export der Sims.
  Ergebnis: kurzer Bericht mit Quellen und einer Bewertungsmatrix.
- [ ] **P28-2 Plan für unseren Fall** *(M)* — im Plan-Modus: Entscheidung mit
  Begründung, Architektur (z. B. gemeinsame Hilfsfunktion `texLabel(el, tex)`
  mit tspan-Rückfallebene), Leistungsbudget (Neuzeichnen pro Reglerzug!),
  Schriftwahl (UI-Schrift vs. Mathe-Schrift — Mischung bewusst entscheiden),
  Migrationsreihenfolge über die acht Motoren, Teststrategie (3-fach-Screenshot
  je Motor, Export, Darkmode, Druck). **Nutzerfreigabe vor Phase 3.**
- [ ] **P28-3 Umsetzung** — erst nach Freigabe; Motor für Motor, klein
  committen, in beiden Repos synchron.

### Nicht-Ziele (vorerst)

- Tickmarken-Zahlen (reine Ziffern, Monospace) — bleiben Text.
- Fließtext-Formeln — die setzt MathJax schon.
