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

- [x] **P28-1 Recherche (state of the art / best practice)** *(M)* — erledigt
  2026-09-27, Bericht unten („P28-1 — Ergebnis") — echte
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
- [x] **P28-2 Plan für unseren Fall** *(M)* — erledigt 2026-09-27, freigegeben;
  Ergebnis unten („P28-2 — Plan") — im Plan-Modus: Entscheidung mit
  Begründung, Architektur (z. B. gemeinsame Hilfsfunktion `texLabel(el, tex)`
  mit tspan-Rückfallebene), Leistungsbudget (Neuzeichnen pro Reglerzug!),
  Schriftwahl (UI-Schrift vs. Mathe-Schrift — Mischung bewusst entscheiden),
  Migrationsreihenfolge über die acht Motoren, Teststrategie (3-fach-Screenshot
  je Motor, Export, Darkmode, Druck). **Nutzerfreigabe vor Phase 3.**
- [x] **P28-3 Umsetzung** — im WIP erledigt 2026-09-27 (v1.57.0–v1.57.14,
  Branch `p28-formelsatz-diagramme`), Ergebnis unten („P28-3 — Ergebnis“).
  Offen nur noch, was außerhalb dieses Repos liegt: Sim-Repo (I18) und
  Design-System `## 4`, s. dort.

### P28-1 — Ergebnis (2026-09-27)

**Kurzfassung:** Der Stand der Technik für *Formeln in SVG-Diagrammen* ist
**MathJax-Pfade direkt ins Diagramm-SVG** (so macht es Plotly.js). Alle Wege über
`foreignObject` (KaTeX, MathJax-HTML, natives MathML) scheitern in Safari an
einem seit 2009 offenen WebKit-Fehler; bei uns war das Fallstrick #17.
Vorgerendert (PhET, matplotlib) passt nicht, weil es kein Build-System gibt und
die Beschriftungen dynamisch sind. Unser eigener Messversuch bestätigt:
**machbar, schnell genug, Grundlinie exakt, ohne `foreignObject`.**

#### Befunde aus den Quellen

- **Plotly.js** (`src/lib/svg_text_utils.js`) erkennt `$…$` in Titeln und
  Achsen, wandelt über ein eigenes MathJax-`MathDocument` mit
  `fontCache: 'local'` in SVG, setzt das Ergebnis als verschachteltes `<svg>` an
  die Stelle des `<text>`, misst es mit `getBoundingClientRect`, schätzt die
  Grundlinie („dy = −textHeight/4") und übernimmt die Farbe per
  `fill`/`stroke` auf die Wurzel-`<g>`. Seit v3 braucht es **MathJax 3 oder 4 +
  `tex-svg`**, MathJax 2 wird nicht mehr unterstützt. → Das Muster ist
  etabliert, die Grundlinien-Schätzung können wir besser machen (s. u.).
- **MathJax** (`docs.mathjax.org`, Output/SVG-Optionen und „convert"):
  `tex2svg(math, {display, em, ex, containerWidth, scale})` liefert synchron
  einen `mjx-container` mit `<svg>`. **`fontCache`**: `local` (Standard, Glyphen
  je Formel in eigenen `<defs>`, das SVG ist in sich geschlossen), `global`
  (ein seitenweiter Cache, das SVG hängt an fremden `<defs>` → **bricht Export
  und Klon**), `none` (explizite Pfade je Zeichen, keine IDs). Für
  eigenständige SVGs empfiehlt die Doku `local` oder `none`. In **v4** soll
  `tex2svgPromise` verwendet werden, weil Glyphendaten nachgeladen werden können.
  Glyphen sind Pfade, also kein Kopieren/Einfügen des Textes.
- **MathJax-Versionen:** aktuell 4.1.3 (Jul. 2026); v4.0.0 erschien am
  4. Aug. 2025. v4 wechselt die Standardschrift auf `mathjax-newcm`
  (New Computer Modern, etwas kräftiger) und nennt `internalSpeechTitles` als
  entfallen. Wir laden **3.2.1**.
- **KaTeX** gibt nur HTML/MathML aus; ein Maintainer sagt ausdrücklich, dass
  KaTeX nicht *in* SVG rendert. Khan Academy legt stattdessen HTML **über** das
  SVG (`position:absolute`). In `foreignObject` zeichnet Safari
  KaTeX-Beschriftungen an der falschen Stelle, weil `position:relative` außerhalb
  der SVG-Transformation gemalt wird (WebKit 23113, 291732).
- **WebKit-Bug 23113** („HTML in foreignObject mit eigenem RenderLayer wird an
  falscher Stelle gezeichnet": Opacity, Transform, `position`, Zoom) ist **seit
  2009 offen** und hat 13 Duplikate. Chrome und Firefox sind korrekt. → Jede
  `foreignObject`-Lösung trägt ein bekanntes Safari-Risiko, gerade bei unserer
  Lupe (Skalierung) und bei animierten Beschriftungen.
- **Natives MathML (Core)** ist seit **Chrome 109** (Jan. 2023, Igalia) in allen
  Evergreen-Browsern vorhanden. Im Diagramm geht es aber **nur über
  `foreignObject`** (MathML Core: `<switch>`/`foreignObject` mit
  Text-Rückfall) → dasselbe WebKit-Risiko. Dazu kommt eine offene Schriftfrage
  (Mathe-Schrift nötig), und die A11y-Kombination SVG+MathML ist laut W3C
  (`w3c/mathml#469`) noch nicht standardisiert.
- **JSXGraph:** Beschriftungen als SVG-`<text>` gelten als schnell, können aber
  kein MathJax/KaTeX. Formeln gehen nur mit `display:'html'`, also als HTML
  **über** der Geometrie, oder als `ForeignObject`. Es gibt also denselben
  Zielkonflikt, gelöst über eine HTML-Ebene.
- **PhET (Scenery):** hat MathJax geprüft und für **statische** Beschriftungen
  **Bilder** (auch aus LaTeX) als beste Lösung gewählt, dynamische Texte
  laufen über `RichText` mit Sub-/Sup-Tags, also dem Äquivalent unseres
  tspan-Wegs. Bilder setzen einen Build-Schritt voraus und bringen keine
  `currentColor`-Farbe mit, **für uns ungeeignet**.
- **matplotlib:** mathtext wird im SVG standardmäßig als **Pfade** geschrieben
  (`svg.fonttype='path'`, sieht überall gleich aus, ist nicht editierbar).
  `'none'` schreibt echten Text und hängt von installierten Schriften ab.
  Derselbe Grundsatz wie bei MathJax-SVG: **Pfade sind die robuste
  Exportform.**
- **Desmos / GeoGebra:** eigene Satz-Engines (GeoGebra: JLaTeXMath auf Canvas),
  nicht übertragbar.

#### Eigene Messung (headless Chromium 1228, 2026-09-27)

Beschriftungen wie `v_x(t)`, `|\vec a_r(t)|`, `\varphi`, `a_y\,/\,\mathrm{m\,s^{-2}}`,
je 200 Umwandlungen:

| | MathJax 3.2.1 `local` | 3.2.1 `none` | 4.1.3 `local` | 4.1.3 `none` |
|---|---|---|---|---|
| erste Umwandlung | 23 ms | 15 ms | 363 ms | 600 ms |
| je Beschriftung, `tex2svg` synchron | **0,9 ms** | 1,1 ms | 2,6 ms | 4,5 ms |
| je Beschriftung, Promise-Variante | 1,5 ms | 0,6 ms | 24 ms | 29 ms |
| `cloneNode` einer fertigen Beschriftung | **0,02 ms** | 0,02 ms | 0,16 ms | 0,04 ms |
| Größe `v_x(t)` | 3,6 KB | 3,2 KB | 5,9 KB | 5,5 KB |

Folgerungen:

1. **Cache nach TeX-String + `cloneNode`** macht das Neuzeichnen pro Reglerzug
   praktisch kostenlos (0,02 ms). Umgewandelt wird nur einmal je
   unterschiedlicher Beschriftung, bei 3.2.1 in ~1 ms.
2. **MathJax 3.2.1 ist hier klar schneller als v4.** Ein Umstieg auf v4 ist
   kein Voraussetzungsschritt für P28 (in P28-2 als eigene Frage führen).
3. **Grundlinie exakt, ohne Messen:** Im MathJax-SVG liegt die **Grundlinie bei
   y = 0** des `viewBox` (`0 −750 w 1000`, 1000 Einheiten = 1 em;
   `vertical-align:−0,566ex` ist genau die Unterlänge). Deshalb reicht es, die
   Kinder des MathJax-`<svg>` in ein
   `<g transform="translate(x, y_Grundlinie) scale(px/1000)">` zu hängen. Die
   Beschriftung sitzt dann auf derselben Grundlinie wie ein `<text y=…>`
   (Screenshot-Beleg im Test, rote Hilfslinie). Die Breite für
   `text-anchor` = `viewBox[2]·px/1000`, **kein `getBBox` und kein
   Layout-Reflow**. Das ist besser als Plotlys Schätzung.
4. **Farbe:** Die Wurzel-`<g>` trägt `fill="currentColor"
   stroke="currentColor"` → Darkmode, CVD-Paletten und Hervorhebungen greifen
   über CSS-`color` am Elternelement. `fill` am `<text>` wirkt dagegen nicht,
   das muss die Migration beachten.
5. **Kein `foreignObject`** → kein WebKit-23113-Risiko, keine Zeilenbox wie in
   Fallstrick #17, Transform/Lupe/Druck verhalten sich wie jede andere
   SVG-Geometrie.
6. **Export** (`shared/js/export-image.js` klont und serialisiert das SVG):
   mit `fontCache:'none'` oder `'local'` in sich geschlossen, mit `'global'`
   kaputt. Die Seite läuft heute auf `local` (Standard), `local` erzeugt aber
   **IDs** (`MJX-n-TEX-…`), die beim Klonen doppelt vorkämen. → Für
   Diagramm-Beschriftungen ein **eigenes MathDocument mit `fontCache:'none'`**
   (Plotly-Muster) oder die `<defs>` beim Einhängen auflösen.
7. **A11y:** Das MathJax-SVG trägt `aria-hidden`, v3 hängt ein
   `mjx-assistive-mml` an, das beim Einhängen der Pfade verloren geht. →
   Ein `aria-label` (Klartext, z. B. „v x von t") bzw. `<title>` an der `<g>`
   ist nötig. Heute liest der Screenreader die tspan-Texte.
8. **Schriftmischung (offene Designfrage für P28-2):** Die Diagrammtexte laufen
   heute in **IBM Plex Sans** (`--kb-font`), MathJax setzt **Computer Modern**
   (Serifen). Die Mischung „Plex-Wort + CM-Formel" sieht im Test deutlich
   anders aus als die reine tspan-Zeile. Optionen: nur das Formelzeichen per
   MathJax (Wort bleibt Plex), ganze Titel per MathJax (`\text{…}` in CM), oder
   Diagrammtexte generell auf die Fließtext-Serifenschrift umstellen
   (Design-System `## 4` betroffen).

#### Bewertungsmatrix

| Weg | Typografie | Safari/Lupe | Tempo bei Neuzeichnen | Export | Darkmode/Paletten | Aufwand | Urteil |
|---|---|---|---|---|---|---|---|
| tspan-Nachbau (heute) | ≈ LaTeX, Index geschätzt | ✔ | ✔ | ✔ | ✔ `fill` | je Sonderfall neu | Rückfallebene |
| **MathJax-Pfade direkt ins SVG** | **= Fließtext** | **✔** | ✔ mit Cache | ✔ (`none`) | ✔ `currentColor` | eine Hilfsfunktion | **empfohlen** |
| MathJax/KaTeX in `foreignObject` | = LaTeX | ✘ WebKit 23113, #17 | ✔ | ✘ HTML im SVG-Export | ✔ | mittel | verworfen |
| natives MathML in `foreignObject` | Schrift-abhängig | ✘ wie oben | ✔ | ✘ | ✔ | mittel | verworfen |
| HTML-Ebene über dem SVG (Khan, JSXGraph) | = LaTeX | ✔ | ✔ | ✘ nicht im SVG | ✔ | hoch (Koordinaten doppelt) | verworfen |
| vorgerenderte Bilder (PhET) | = LaTeX | ✔ | ✔ | ✔ | ✘ | Build-Schritt | verworfen |

**Empfehlung für P28-2:** eine gemeinsame Hilfsfunktion (Arbeitstitel
`texLabel(parent, tex, {x, y, px, anchor, ariaLabel})`), die
MathJax-3-Pfade mit Grundlinie y = 0 ins Diagramm hängt, mit einem Cache je
TeX-String, eigenem `fontCache:'none'`-Dokument und **tspan-Rückfall**, solange
MathJax noch lädt oder fehlt (CDN offline). Offen für P28-2 sind
Schriftmischung, Ladereihenfolge (Figuren zeichnen ggf. vor MathJax → später
neu setzen), das Sim-Repo (lädt dort MathJax überhaupt?) und die
Migrationsreihenfolge.

Quellen:
[Plotly.js `svg_text_utils.js`](https://github.com/plotly/plotly.js/blob/master/src/lib/svg_text_utils.js) ·
[Plotly: LaTeX in JavaScript](https://plotly.com/javascript/LaTeX/) ·
[MathJax: SVG-Optionen (fontCache)](https://docs.mathjax.org/en/latest/options/output/svg.html) ·
[MathJax: Umwandlungsfunktionen](https://docs.mathjax.org/en/latest/web/convert.html) ·
[MathJax: Neu in v4 / Schriften](https://docs.mathjax.org/en/v4.0/upgrading/whats-new-4.0/fonts.html) ·
[MathJax Releases](https://github.com/mathjax/MathJax/releases) ·
[KaTeX-Diskussion #3288](https://github.com/KaTeX/KaTeX/discussions/3288) ·
[WebKit-Bug 23113](https://bugs.webkit.org/show_bug.cgi?id=23113) ·
[MathML Core](https://w3c.github.io/mathml-core/) ·
[Igalia: MathML in Chrome 109](https://www.igalia.com/2023/01/10/Igalia-Brings-MathML-Back-to-Chromium.html) ·
[w3c/mathml#469 (SVG+MathML A11y)](https://github.com/w3c/mathml/issues/469) ·
[JSXGraph Text](https://jsxgraph.org/docs/symbols/Text.html) ·
[PhET Scenery #457](https://github.com/phetsims/scenery/issues/457) ·
[matplotlib Fonts / svg.fonttype](https://matplotlib.org/stable/users/explain/text/fonts.html)

### P28-2 — Plan (freigegeben 2026-09-27)

**Nutzerentscheidung Schrift: Variante C, alles Serif.** Titel, Achsen und
Szenen-Labels setzt MathJax vollständig (`\text{…}` + Formel), wie Formeln im
Fließtext. Verglichen wurden A (heute, Heros + tspan), B (Wort Heros, Formel
MathJax) und C, jeweils hell und dunkel. Tick-Zahlen bleiben Text.
Branch: `p28-formelsatz-diagramme`.

- **Helfer** `src/figures/kreisbewegung/lib/tex-label.js`, API
  `setTexLabel(textEl, tex, {aria})`. Das `<text>` der Motoren bleibt als Anker
  (Position, Anker, Rotation, Klasse, `aria-label`). Dahinter hängt eine
  `<g class="tex-label …">` mit den MathJax-Pfaden, Grundlinie y = 0, Maßstab
  `font-size/1000`. Kein `getBBox`, kein `foreignObject`.
- **Eigenes MathDocument** mit `fontCache:'none'` (gemessen: 0 IDs, 1,2 ms je
  Label, `physics` verfügbar). Cache je TeX-String + `cloneNode`. Das
  Seitendokument und die Gleichungsnummerierung bleiben unberührt.
- **Farbe** über die bestehenden Klassenregeln: eine Regel
  `g.tex-label g { fill: inherit }`, keine CSS-Änderung je Motor.
- **Ladereihenfolge:** Solange MathJax nicht bereit ist, steht ein
  Klartext-Rückfall im `<text>`, dann folgt die Hochstufung bei
  `MathJax.startup.promise`. Ohne CDN bleibt der Klartext stehen.
- **Titel** normal statt semibold (`\text` kennt kein 600) → Design-System `## 4`.
- **MathJax bleibt 3.2.1** (v4 in der Messung 3–20× langsamer).
- **Reihenfolge P28-3:** Helfer + Pilot `bus_weg_zeit` (v1.57.0, Nutzerblick) →
  grundbegriffe → ableitung → freier_fall → schraeger_wurf → federpendel →
  kreis_spiral → kreisbewegung → φ-`foreignObject` der Aspekt-Figuren →
  `svg-text.js` entfernen → Doku (Runbook #8/#17, `src/figures/CLAUDE.md`,
  Design-System). Kein P21-Eintrag (keine inhaltliche Abweichung von v0.13).
- **Sim-Repo (I18):** Der Helfer ist abhängigkeitsfrei und geht 1:1 als
  `shared/js/tex-label.js` hinüber, in einer eigenen Sitzung dort. Achtung:
  Die Sims laden `mathjax@3` unversioniert und teils mit `fontCache:'global'`.
- **Verifikation je Schritt:** 3×-Screenshot hell/dunkel, keine
  `foreignObject`/`[id^=MJX]` im Motor-SVG, Konsole sauber, Label-Zeit je
  Neuzeichnen < 0,5 ms, CDN blockiert → Klartext, Lupe und Druck.

### P28-3 — Ergebnis (2026-09-27)

Alle acht Motoren und die Szenen-Labels der Kap.-1.4-Figuren setzen ihre
Beschriftungen über `setTexLabel` (`src/figures/kreisbewegung/lib/tex-label.js`);
`svg-text.js` ist entfernt, im Figuren-Code steht **kein `foreignObject`** mehr.
Pilot `bus_weg_zeit` vom Nutzer abgenommen („Bus proto looks good“).
Abschlussprüfung (headless Chromium): 30 Figuren, jedes Label typographisch
gesetzt, 0 Rückfalltexte, 0 MathJax-IDs in Labels, Konsole fehlerfrei.

**Was der Helfer bei der Migration dazugelernt hat** (je ein realer Fund; die
Gründe stehen im Kopf von `tex-label.js`): Sichtbarkeit, Klassen, Lage
(x/y/transform/Anker/Grundlinie) und `font-size`/`fill`-Attribute des Ankers
werden per MutationObserver auf die Formel-`<g>` gespiegelt; die `<g>` heißt
`tex_<Anker-ID>`, damit `[id$="…"]`-Stilregeln greifen; `display:none` aus einer
ID-Regel wird ebenfalls übernommen; `setTexLabel(el, '')` blendet aus.
Grenze: Regeln über den Elementtyp (`text { … }`) treffen die `<g>` nicht
(Runbook-Fallstrick #28).

**Leistung:** statische Labels 0,013 ms je erneutem Setzen (nur Neuausrichten);
Wert-Labels (Abb. 1.15, Zahlen ändern sich je Reglerschritt) werden aus
gecachten Einzelglyphen gesetzt (`texZahl()`): 1,4–1,7 ms je Ziehschritt für
die ganze Figur, vorher 0,6 ms; ohne Glyphen-Cache waren es 6,5 ms.

**Nebenbei behoben:** `vᵧ`/`aᵧ` (tiefgestelltes Gamma) in kreisbewegung und
kreis_spiral; wörtliche Unterstriche in `E_kin`-Titeln (federpendel) und
`|a_r(t)|` (kreis_spiral); Tooltip-Einheit „s)“ statt „m/s“ (federpendel);
Bindestrich statt Minus in negativen Steigungen (ableitung); Abstands-Label
in Abb. 1.1 im Darkmode unsichtbar (v1.57.2).

**Bewusst Text geblieben:** Tick-Zahlen, Zeit-/Ablese-Anzeigen, Hover-Tooltips.

- [ ] **P28-4 Restbefunde (nicht Teil von P28, beim Migrieren gesehen)**
  - Tooltip-Texte tragen noch Unicode-Indizes: `kreis_spiral/constants.js::
    quantitySymbols` (`vᵧ`/`aᵧ` = Gamma) und `federpendel/render.js::
    LINE_LABELS` (`E_kin` wörtlich).
  - Abb. 1.8 (federpendel, horizontal): „x = 0 (Ruhelage)“ überlappt die
    Labels ±x₀ — schon vor P28 so.
- [ ] **P28-5 Design-System `## 4` nachziehen** (iCloud,
  `…/Physik Home/physik-design-system/DESIGN_SYSTEM.md`, aus der VM nicht
  erreichbar). Einzusetzen im Abschnitt dieses Repos unter Schrift/Diagramme:
  > Diagramm-Beschriftungen (Titel, Achsen, Szenen-Labels) werden seit v1.57
  > per MathJax gesetzt — Computer Modern wie die Formeln im Fließtext, auch
  > für die Wörter (`\text{…}`); Titel normal statt halbfett. Tick-Zahlen,
  > Zeitanzeigen und Tooltips bleiben TeX Gyre Heros bzw. IBM Plex Mono.
- [x] **P28-6 Abszissen-Beschriftung ans Pfeilende** *(S)* — erledigt
  2026-09-27 (v1.57.15): alle fünf Motoren rechtsbündig unter der
  Pfeilspitze; wo die Beschriftung damit unter die letzte Tick-Zahl rückt,
  6–9 px tiefer und `padB` entsprechend größer (gemessen: +3 bis +9 px Luft
  zu den Zahlen, vorher bis −3 px). — Nutzerbefund
  2026-09-27: *„insbesondere bei zwei diagrammen übereinander [ist] die
  beschriftung der abszisse mittig unter der unteren absizee plaziert […]. da
  wirkt sie etwas verloren.“* Fünf Motoren zentrieren das Label unter der Achse
  (`freier_fall`, `federpendel`, `kreis_spiral`, `schraeger_wurf`,
  `kreisbewegung`, je `render.js`, Label `tlX`/`xLab`/`xLabel`); drei nutzen
  schon den Haus-Stil **rechtsbündig unter dem Pfeilende** (`bus_weg_zeit`,
  `grundbegriffe`, `ableitung`). Älter als P28, fällt mit dem Formelsatz
  aber stärker auf. Ziel: alle Motoren wie der Haus-Stil; Prüfung per
  3×-Screenshot, v. a. gestapelte Diagramme (Abb. 1.20, 1.51) und Kollision
  mit den Tick-Zahlen.
- [ ] **Sim-Repo (I18):** `tex-label.js` ist abhängigkeitsfrei und geht 1:1
  als `shared/js/tex-label.js` hinüber; dort in eigener Sitzung. Achtung:
  die Sims laden `mathjax@3` unversioniert und teils mit `fontCache:'global'`
  (der Helfer nutzt ein eigenes Dokument, das ist davon unabhängig);
  `ui.js::stripLabel` (CSV) erwartet Klartext-Labels.

### Nicht-Ziele (vorerst)

- Tickmarken-Zahlen (reine Ziffern, Monospace) — bleiben Text.
- Fließtext-Formeln — die setzt MathJax schon.
