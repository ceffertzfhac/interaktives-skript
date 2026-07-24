# Backlog — InteraktivesSkript_WIP

Entstanden aus dem initialen Code-Review (Stand: Legacy/WIP-Split). Ziel: Modernisierung nach State-of-the-art Web-Dev in den Dimensionen **Performanz, Aktualität, Wartbarkeit** und – besondere Priorität – **Token-Effizienz beim Arbeiten im WIP** (Kosten für Agenten-Edits).

> **Skalierbarkeits-Vorgabe (hard constraint):** Das finale Skript wird **deutlich größer** — ein *komplettes* Skript mit **15+ Kapiteln** und **vielen weiteren Abbildungen**; das klassische PDF-Skript hat **fast 400 Seiten**, d. h. auch der Prosa-Umfang ist in dieser Größenordnung. Aktueller Stand: ~9 Abschnitte, 11 interaktive Figuren, eine 2787-Zeilen-`script.js` und eine 1558-Zeilen-`index.html`. Die heutige Monolith- + Copy-Paste-pro-Figur-Architektur skaliert *nicht* dorthin (`script.js` → Zehntausende Zeilen, Figuren-Familien vervielfachen sich, `index.html` → Zehntausende Zeilen Prosa, nicht mehr in einem Edit-Context handhabbar). **Jedes Architektur-Item ist gegen das ~400-Seiten-/15+-Kapitel-Ziel zu bewerten; Hinzufügen eines Kapitels/ einer Figur muss O(1) Dateien und kleine Token-Kosten sein, nicht O(Größe-der-Gesamtdatei). Modularisieren muss sowohl Figuren-Logik *als auch* Prosa-Inhalt.**

Alle Änderungen **nur in `InteraktivesSkript_WIP/`**. `InteraktivesSkript_legacy/` bleibt eingefrorene Referenz.

Legende: Aufwand S/M/L · Risiko niedrig/mittel/hoch · Gewinn bezieht sich auf Laufzeit (L) bzw. Token/Edit (T)

---

## Zielarchitektur (skalierbar auf 15+ Kapitel)

Statt einer Datei pro Anliegen und Kopie pro Figur:

```
InteraktivesSkript_WIP/
  index.html                # nur Shell: Header, TOC-Container, <div data-chapter="...">-Platzhalter
  chapters/
    ch_01_einleitung.html   # Prosa pro Kapitel als Fragment (~1 Datei/Kapitel, editierbar in einem Context)
    ch_02_kinematik.html
    ...
    (jeweils mit <figure data-fig="...">-Platzhaltern für interaktive Abbildungen)
  src/
    core.js                 # init, Kapitel-Loader, UI (TOC/zoom/print/darkmode), rAF-Loop
    transform.js            # to2d/perspektive, polyline/line-helpers (einzigartig, nicht pro Figur)
    figures/
      factory.js            # createFigure({id, compute, animate}) — rAF, point-cache, element-ref-cache
      fig_01_radius.js      # pro Figur: kleine compute/animate-Lambdas
      fig_03_kreisbahn.js
      ...
    styles.css / darkmode.css
  build/ (optional)         # ggf. einfacher Build, der chapters/* → index.html zusammenfügt (für Print/Offline)
```

Eigenschaften, die das Ziel erfüllen:
- **Neue Figur = eine kleine Datei** (`figures/fig_NN_*.js`) mit nur der Figur-spezifischen Mathematik — alles GemeinSame (rAF-Loop, Punkte-Cache, Element-Ref-Caching, Perspektive, Show/Hide-Logik) steckt einmalig in `factory.js`.
- **Neues Kapitel = eine `chapters/ch_NN.html`-Datei**, ohne bestehenden Code anzufassen; `core.js` lädt Fragmente nach (oder ein Build fügt sie zusammen).
- **Prosa nicht in einer Riesendatei** — ~400 Seiten in einer `index.html` wären nicht editierbar; pro Kapitel ≈ ein Context-Fenster.
- **Event-Binding zentral** (`data-fig`-Attribute → eine `addEventListener`-Stelle in `core.js`), keine 65 Inline-Handler.
- **Pro Figur eigener Scope** — keine geteilten Globals (`svg`, `pl`, `phi`, …), die sich gegenseitig überschreiben.
- Agenten-Edits laden nur `factory.js` + die eine betroffene `fig_NN.js` bzw. `ch_NN.html`, nicht die ganze Welt.

Diese Zielarchitektur leitet die P1-Items; P0 ist unabhängig davon vorher machbar.

---

## P0 — Quick Wins & Risikoreduktion (S, niedriges Risiko)

- [x] **T: Kommentar-Leichen entfernen.** ~25 Block-Kommentare + Dutzende `//console.log` und auskommentierte Duplikate (z. B. `generate_highlight_boxes` hat 50 Zeile auskommentiertes Duplikat, `update8` phi_span-Block, jQuery-CDN im HTML). Trägt keinen Wert, wird bei jedem Lesen mitgeladen. → `script.js` schätzungsweise −300–400 Zeilen.
- [x] **L/A: `qrjs2@latest` pinnen** (`index.html:18`) auf eine feste Version + ggf. SRI-Hash. `@latest` ist nicht reproduzierbar.
- [x] **A: MathJax-v2-Aufruf korrigieren.** `reload_mathjax()` nutzt `MathJax.Hub.Queue(...)` (v2-API), geladen ist v3 → No-op. Entweder v3-API (`MathJax.typesetPromise()`) oder Aufruf entfernen, falls nicht gebraucht. (`script.js:789`, `wait_reload_mathjax:792`)
- [x] **W: Doppelte Funktionsdefinitionen auflösen.** `animate6` (zweimal: 2404 & 2433 — zweite gewinnt still), `test` (295 in Kommentar vs. 785). Eindeutige Version behalten.
- [x] **W: `space()`-Lorem-ipsum-Platzhalter** (`script.js:488`) — Produktivinhalt ist Platzhalter. Entfernen oder durch echten Inhalt ersetzen.
- [x] **W: `//BUG!` in `update8`** (`script.js:2579`, `r8<0`-Clamp) als Issue dokumentieren oder fixen.
- [x] **W: Osterei `test()`** (Interaktiv-Umschalter über versteckte Buchstaben im Kontakt-Block, `index.html:56`/`script.js:785`) — entweder dokumentieren oder entfernen (überraschendes Verhalten).

## P1 — Struktur & Token-Effizienz (M–L, mittleres Risiko, hoher T-Gewinn)

- [x] **T/W: Per-Figure-Fabrik einführen.** Die 11 Figuren-Familien (`updateN/animateN/conditionN/do_animationN`) sind ~80 % identisch kopiert. Generische Factory `createFigure({id, compute, animate})` + pro-Figur nur noch kleine `compute`-Lambda. Erwartet −1000+ Zeilen und winzige pro-Figur-Edits. *Größter Hebel für Token-Effizienz.* — *Done (Stage 3): `createFigure` in `src/figures/factory.js`; 7 animierte 3D-Figuren migriert, `script.js` 1884→1260 Zeilen.*
- [x] **T/W: `script.js` modularisieren.** 2787 Zeilen, 85 globale Funktionen in einer Datei → Aufteilen nach Zuständigkeit (z. B. `core.js`, `transform.js`, `ui.js`, `print.js`, `figures/*.js`). Ermöglicht partielles Laden nur der betroffenen Datei. Dabei ESM-Module (`<script type="module">`) nutzen. — *Done (Stage 4): ESM-Split in `core/transform/ui/print/main` + `figures/{factory,fig_NN}`; `<script type="module">`, kein `<body onload>`.*
- [x] **T/W: Prosa/Inhalt pro Kapitel spliten.** Bei ~400 Seiten darf die `index.html` nicht Monolith bleiben (sonst Zehntausende Zeilen, nicht in einem Context editierbar). Pro Kapitel ein HTML-Fragment (`chapters/ch_NN.html`), per `core.js` nachgeladen oder per einfachem Build zusammengefügt. *Zwingend für Editierbarkeit bei Skalierung.* — *Done (P1b): `src/chapters.js::loadChapters()` fetcht `chapters/ch_NN_*.html` zur Laufzeit, injiziert + flacht sie in `#paper`-Platzhalter (`<div data-chapter="...">`) auf, sodass `pages.js::paginate()` unveraendert arbeitet. `index.html` schrumpfte 1827→150 Zeilen; Kapitel 1.5 als `ch_01_kreisbewegungen.html` migriert + Gerüst `ch_02_kinematik_starrer_koerper.html` angelegt. Neues Kapitel = eine `ch_NN.html` + eine Platzhalter-Zeile (O(1) Dateien). Auslieferung ueber HTTPS (GitHub Pages); `file://`-Doppelklick unterstuetzt fetch nicht.*
- [x] **T/W: Build-/Bundler-Entscheidung treffen.** Sobald Module + Kapitel-Fragmente anliegen, braucht es eine Entscheidung: reines ESM ohne Build (simpel, CDN-Only) vs. leichter Build (Vite/esbuild) für Dev-Server, Minifizierung und Print-Bundle. Konsequenz für Token-Effizienz: Build soll kapitelweise Bundles/Code-Splitting erlauben, damit im Browser nicht alles auf einmal geladen wird. — *Entschieden (v1.6): **No-build** -- reines ESM, Kapitel-Fragmente per fetch (GitHub Pages/HTTPS), Tooling-Baseline ist `.editorconfig` (zero-dep). Ausloeser fuer Revisit = Vollskalierung (~400 Seiten) ODER mehrere Mitautoren ODER spuerbare Ladezeiten -> dann leichter Vite/esbuild-Build (Dev-Server, per-Kapitel-Code-Splitting, Minifizierung) mit Prettier + ESLint als devDeps einfuehren.*
- [x] **W: Globale Zustände einfrieden.** Implizite Globals (`svg`, `pl`, `phi`, `v`, `x`, `y`, `perspective`, `a`, `a_content` … ohne `let`/`const`/`var`) leaken ans `window` und werden von *jeder* `updateN` wiederverwendet — eine Figur kann den Zustand einer anderen überschreiben. Pro-Figur-Scope (Closures/Module) + konsequente `const`/`let`. — *Done: Stage 1 (Nicht-Figuren), Stage 3 (Figuren-State in Factory-Closures: `gcN_n`/`r8`/`runs`), Stage 4 (ESM-strict-mode erzwingt `const`/`let` in fig_1/fig_9).*
- [x] **T/W: Event-Bindung aus HTML auslagern.** 65 Inline-`onclick`/`oninput` koppeln HTML und JS über String-Namen; ein Edit braucht meist beide Dateien im Kontext. Statt `oninput="update1();"` → `data-figure="1"` + zentrale `addEventListener`-Registrierung in JS. — *Done (Stage 2): `data-action`-Attribute + delegierter Binder in `main.js`.*
- [x] **L: Animation auf `requestAnimationFrame` umstellen.** 11× rekursives `setTimeout(...,10)`, 0× rAF. Liefert vsync, pausiert bei Hidden-Tab, weniger Jank/Akku. `do_animationN`-Loops entsprechend migrieren (am besten in der generischen Factory gleich miterledigen). — *Done (Stage 3): rAF-Loop mit ~10-ms-Akkumulator in `createFigure`.*
- [x] **L: Per-Frame-DOM-Arbeit reduzieren.** `updateN` baut jeden Frame das komplette `polyline.points` (100 Punkte) neu + serialisiert `p3d`-String + `transform_polyline` re-parsed. Statischen Kreis einmalig berechnen, nur bewegte Elemente pro Frame updaten. Element-Refs cachen statt 40× `ge()` pro Frame (z. B. `update5`). — *Teilweise (Stage 3): statischer Kreis-p3d gecacht (nur bei Radius-/z-/Perspektivenwechsel neu gebaut); Element-Ref-Caching noch offen.*
- [x] **L: `update8` Tail-Liste nicht als String.** `split(" ")/join(" ")` über bis zu 1000 Punkte pro Frame (`script.js:2558`). Array halten, `points` direkt setzen. — *Done (Stage 3b): Tail als Array (`ctx.tail`); `points` aktuell noch über `transform_polyline` (p3d-String), direktes Setzen noch offen.*

## P2 — Aktualität, Responsivität, A11y (M, mittleres Risiko)

- [x] **A: Responsives Viewport.** `<meta name="viewport" content="width=1190">` (`index.html:5`) ist fixiert → keine Mobile-Layouts. Viewport + CSS auf Breakpoints umstellen (oder bewusst als »druckoptimiert, Desktop-only« deklarieren). — *Entschieden (v1.6): **Desktop/Tablet-only** -- Telefon bewusst nicht unterstuetzt. Viewport-Meta ist heute korrekt (`width=device-width, initial-scale=1`, die in Backlog vermerkte `width=1190` war stale). Tablet-Breakpoint `@media (max-width: 1024px)` mit Drawer statt Rail/Marginalie steht (v2.0); kein zusaetzliches Phone-CSS geplant.*
- [x] **A: Safari-UA-Sniff ersetzen** (`safari_bug`, `script.js:397`) durch Feature-Detection / saubere CSS-Weiche. — *Entschieden (v1.6): **UA-Sniff behalten + dokumentiert.** Safari mis-positoniert HTML in `<foreignObject>` -- das ist ein Render-Verhalten, keine fehlende API, folglich kann `@supports` es nicht detektieren. UA-Sniff in `core.js::safari_bug()` mit Begründung kommentiert; `.fixed`-Klasse (150px-Margin-Shift) nur auf Safari. Revidieren, sobald ein CSS-only-Fix fuer foreignObject bekannt ist.*
- [x] **A: `URLSearchParams` statt `findGetParameter`** (`script.js:660`). — *Done (v1.6): `print.js` nutzt privaten Helper `getParam(name) = new URLSearchParams(location.search).get(name)`; toter `findGetParameter`-Export + toter `auto_print`/`window.print()`-Pfad entfernt.*
- [x] **A: `<html lang="de">` setzen** (`index.html:2`) und semantische Buttons statt `<div class="navbar_button" onclick>` (Toolbar, Zoom) für Tastatur/A11y. — *Done (v1.6): `<html lang="de">`; Toolbar-/Darkmode-/Zoom-Buttons sind echte `<button type="button">` mit `aria-label` (inkl. der in `make_static()` erzeugten statischen Zoom-Buttons); CSS-Button-Reset ergaenzt, sodass Browser-Defaults die Visuals nicht stoeren.*
- [x] **W: CSS aufräumen.** Viele auskommentierte Deklarationen, doppelte Properties (`.qr_container` width 376 & 381). `@page`-CSS-Nesting (`h1{}` in `@page`) ggf. prüfen/kompatibel lösen. — *Done (v1.6): ~25 tote Inline-Kommentar-Deklarationen + tote Bloecke (SVG-Stroke, totes `@media print` body-Width, Slider-Thumb-Leichen) entfernt; doppeltes `.qr_container` width aufgeklaert (war stale -- tatsaechlich `width:100%` + `width:150px`, letzteres gewinnt; `width:100%` entfernt); `@page`-Nesting korrigiert (h1-`page-break`-Regeln aus `@page` in `@media print` mit `break-*` + `page-break-*`-Fallback). `styles.css` 1361→1315 Zeilen.*
- [x] **W: Tooling-Baseline.** Editor-Config + Prettier + ESLint einführen, damit Edits automatisch konsistent formatiert sind (reduziert Review- und Merge-Rauschen). Optional TypeScript/JSDoc-Typen für die Figuren-Factory. — *Teilweise (v1.6): `.editorconfig` am Repo-Root (zero-dep, von Editoren mit EditorConfig-Untstuetzung automatisch gelesen) als Tooling-Baseline. Prettier/ESLint/TypeScript bewusst vertagt -- ein `package.json`/Build waere heute vorzeitig und braeche die „no package manager"-Vorgabe ohne Gewinn; Ausloser fuer Revisit = Vollskalierung/Mitautoren/Ladezeiten (s. Backlog:64 Build-Entscheidung).*
- [x] **W: `script.js` mit `defer` laden** (`index.html:19` im `<head>` ohne `defer`) — Best-Practice, parse-blocking vermeiden. *(Obsolet durch ESM-Split Stage 4: `<script type="module">` ist implizit defer; der klassische Monolith `script.js` existiert im WIP nicht mehr — nur noch in `Input/InteraktivesSkript_legacy/`.)*
- [x] **W/Bug: TOC-Einklappen lässt linken Balken stehen.** — *Fix (v2.0): beim ohnehin fälligen TOC-Akkordeon-Umbau (s. CLAUDE.md) mitbehoben — `toc_hide` referenziert jetzt die tatsächlichen Hide-Keyframes (vorher fälschlich toc-show, nie gesetzt), `hide("toc_container")` läuft erst nach der Animation statt sofort, `toc()` ruft symmetrisch zu `zoom()`/`close_zoom()` jetzt auch `toggle_body_scroll()`. Diagnose unten als Referenz belassen.* Klapp man das Inhaltsverzeichnis aus und wieder ein, verbleibt ein vertikaler Balken am linken (Scroll-)Rand im Bild. Diagnose (Stand v1.3.0):
  - `#toc_content.toc_hide { animation-name: toc-show }` (`styles.css:712`) — Copy-Paste-Bug: die Hide-Animation referenziert die *Show*-Keyframes (`translateX(-500→0)`), sollte `animation-name: toc-hide` sein. Mit `animation-fill-mode: forwards` endet das Element am *sichtbaren* Ort (`translateX(0)`), nicht am verdeckten.
  - `.hidden { visibility: hidden; position: absolute }` (`styles.css:254`) versteckt per `visibility`, nicht `display:none`. Zusammen mit `#toc_content { position:fixed; overflow-y:scroll }` (immer sichtbare Scrollbar, da `scroll` nicht `auto`) und dem fehlenden `left`-Wert kann der fixed-Kind-Container beim Einklappen sichtbar/blitisch bleiben statt zu verschwinden.
  - `toc()` (`ui.js:61`) klapp nur `toc_container` um, ruft aber *nicht* `toggle_body_scroll()` (kein `no_scroll` auf `<body>`) → kein Layout-Shift-Schutz während des TOC offen ist (im Gegensatz zu `zoom`/`close_zoom`, die es nutzen).
  - Fix-Richtung: `toc_hide`-Animation auf `toc-hide` korrigieren; `.hidden` für Overlay-Container auf `display:none` umstellen (oder `#toc_content` explizit `left:0` + `visibility`-Override geben und beim Schließen `display:none`); `toc()` symmetrisch zu `zoom` `toggle_body_scroll()` aufrufen. Danach im Browser (aus-/einklappen, Body-Scroll-Verhalten) verifizieren.

---

## P3 — Offene Punkte aus der Verifikation Kapitel 1.4 (v0.13-Migration, v1.7)

Quelle: Abarbeitung von `InteraktivesSkript_WIP/VERIFIKATION_kapitel_1.4.md` (2026-07-21).
**Bestanden** (nur zur Einordnung): Assets ohne 404, `node --check` sauber, 0 TeX-Fehler,
0 unaufgelöste `\ref` (offline mit `mathjax-full` gegengeprüft), Nummerierungen in sich
lückenlos, Boxen-Anzahlen = v0.13 (Beispiel 6 / Aufgabe 3 / Bemerkung 14 / Wichtig 3 /
Zusammenfassung 4), Pagination 13 Seiten (h2-Intro + 12× h3), keine `gcN`-Reste.

> **Achtung — „lückenlos" ≠ „richtig".** Der erste Prüfdurchlauf verglich die Nummerierung
> nur *mit sich selbst*. Der Gegencheck gegen das PDF (`pdftotext` auf
> `Input/v0.13/Physik_pskript_v0.13.pdf`, Abschnitt 1.4 = Zeilen 7365–9930) zeigt: **die
> Abbildungs- und Zusammenfassungs-Nummern stimmen im Schema nicht, die Gleichungsnummern
> ab (1.4.43) nicht im Wert.** Ursachen unten, alle im Code belegt. Referenzwerte aus dem
> PDF: Gleichungen `(1.4.1)…(1.4.88)`, Abbildungen `1.38…1.60`, `Zusammenfassung 1.4…1.7`,
> `Bemerkung 1.4.1…1.4.14`, `Beispiel 1.4.1…1.4.6`, `Wichtig 1.4.1…1.4.3`, `Aufgabe 1.4.1…1.4.3`.

- [x] **BUG (hoch): Abbildungsnummern folgen dem falschen Zähler.** `Physik_skript_header_gmni_v3.tex` setzt `\numberwithin` für equation und alle Box-Counter, **nicht** für `figure` → der Abbildungszähler läuft kapitelweit. Das PDF nummeriert Abschnitt 1.4 daher **`Abbildung 1.38 … 1.60`** (23 Stück — exakt so viele wie im WIP, der Bildbestand stimmt also). `numbering.js::numberImages()` vergibt stattdessen `Abb. 1.4.1 … 1.4.23`. Abbildung *n* im WIP = Abbildung *n+37* im PDF. Fix: Abbildungen kapitelweit zählen (Präfix „1.", Zähler über alle Seiten des Kapitels statt Reset pro Section) + Startwert, solange nur ein Abschnitt migriert ist; die 10 hartcodierten Prosa-Verweise („Abbildung 1.4.n") mitziehen. *(M)* — *Fix (v1.7): `numbering.js` zaehlt Abbildungen kapitelweit (`chapterPrefix`), Startwert `data-figure-offset="37"` am h2 -> Abb. 1.38-1.60 wie im PDF; die 10 Prosa-Verweise mitgezogen.*
- [x] **BUG (hoch): Zusammenfassungs-Boxen folgen dem falschen Zähler.** Sonderfall im Header: `\numberwithin{zusammenfassungcounter}{chapter}` — alle anderen Box-Counter laufen per `{section}`. PDF: **`Zusammenfassung 1.4, 1.5, 1.6, 1.7`**; WIP: `Zusammenfassung 1.4.1…1.4.4`. Fix: `numbering.js` braucht pro Box-Typ einen Scope (`section` vs. `chapter`) statt eines globalen Schemas. Beispiel/Bemerkung/Wichtig/Aufgabe/Lernziel sind korrekt und dürfen sich nicht mitverschieben. *(M)* — *Fix (v1.7): `CHAPTER_SCOPED`-Set in `numbering.js` + `data-zusammenfassung-offset="3"` -> Zusammenfassung 1.4-1.7; die section-weiten Box-Typen bleiben unberuehrt.*
- [x] **BUG (hoch): Gleichungsnummern ab (1.4.43) um 4 verschoben.** v0.13 nutzt `\be`/`\ee` (= `\begin{equation}`, Header Z. 213 f.) **mitten im Fließtext** — das sind nummerierte Display-Gleichungen, obwohl sie wie Satzbestandteile gesetzt sind. In 1.4.3 wurden 4 davon bei der Migration zu Inline-Mathe `\(…\)` degradiert (Passage „*Die Vektoren selbst, also … und … sind Einheitsvektoren*" und „*Wir erinnern uns: Der Ortsvektor … der Bahngeschwindigkeitsvektor …*", tex L421–431 = PDF (1.4.43)–(1.4.46)). Folge: WIP hat **84 statt 88** Tags; bis (1.4.42) identisch, ab dort ist **jede** Nummer um −4 versetzt. Belegt per Unterabschnitt: 1.4.1 10/10 ✓, 1.4.2 17/17 ✓, **1.4.3 23 statt 27**, danach 1.4.4 2/2, 1.4.5 3/3, 1.4.7 8/8, 1.4.8 6/6, 1.4.9 9/9, 1.4.11 5/5, 1.4.12 1/1 — Anzahlen stimmen, nur der Offset läuft mit. Fix: die 4 Stellen als `\begin{equation}` setzen. **Hängt mit dem Farb-Item zusammen** (dieselbe Passage). *(M)* — *Fix (v1.7): die 4 `\be...\ee`-Stellen in 1.4.3 wieder als `\begin{equation}` gesetzt -> 88 Tags, jede Teilsumme pro Unterabschnitt deckungsgleich mit dem PDF. **Zusaetzlich gefunden:** `tagformat` war zwar per `loader.load` geladen, aber nicht in `tex.packages` aktiviert -- im Browser erschien deshalb "(1)" statt "(1.4.1)". Das faellt in einer Offline-Pruefung mit `AllPackages` nicht auf.*
- [x] **BUG (hoch): Abbildungen werden immer auf volle Spaltenbreite gezogen.** Die Legacy-Regel `.grafik { width: 100% }` (`styles.css:516`, stammt von den alten SVG-Figuren) greift auf jedes `img.grafik`/`svg.grafik`; die neue Regel `#paper figure.abbildung > img.grafik` setzt nur `max-width:100%` und überschreibt `width` **nicht**. v0.13 vergibt dagegen individuelle Breiten — 10× `0.8\textwidth`, 4× `0.9\linewidth`, 3× `0.5`, 2× `0.99`, 2× `0.75`, je 1× `0.6`/`0.4`/`0.4`/`0.25`. Diese Information ist im HTML **überhaupt nicht abgebildet**, jede Abbildung erscheint gleich breit und kleine Schemata werden über ihre native Auflösung hinaus hochskaliert (unscharf). Fix: Breite pro `figure` aus dem tex übernehmen (z. B. `style="width:80%"` bzw. `--fig-width`) und `width:100%` für `figure.abbildung`-Bilder neutralisieren. Subfigure-Paare zusätzlich prüfen: `.subfig { max-width:48% }` erzwingt Halbierung unabhängig von den tex-Breiten. *(M)* — *Fix (v1.7): alle 27 Bilder tragen die v0.13-Breite als Inline-Style (0.25-0.99), subfig-Container die Aussenbreite (0.48/0.495); `#paper figure.abbildung > img.grafik { width:auto }` neutralisiert die Legacy-Regel.*
- [x] **BUG (hoch): TikZ-Grafiken sind Handnachbauten, keine gerenderten Abbildungen.** Plan A sah `pdflatex` (standalone) + `pdftocairo -png -r 300` vor; tatsächlich stehen im Kapitel zwei **händisch geschriebene Inline-SVGs**: „radial/tangential" (2,5 KB, 3 `path`/4 `line`/6 `text`/3 `circle`) und „Kinematik-Flowchart" (3,5 KB, 16 `text`). Beide sind Näherungen, nicht die Originalgrafik. Zusätzlich technisch schief: SVG 1 hat `viewBox="-2.0 -1.9 4.0 3.8"` (Einheiten-Koordinaten) ohne `width`/`height` — zusammen mit `.grafik{width:100%}` wird es um Faktor ~160 aufgeblasen, Strichstärken (`stroke-width="0.03"`) und Pfeilspitzen skalieren grob mit; Farben sind hart kodiert (`#888`, `#000`) statt Token-basiert, also im Darkmode falsch. Fix: die beiden TikZ-Blöcke (tex L131–160 und L695–731) wie geplant rendern und als PNG/SVG einbinden. *(M–L)* — *Fix (v1.7): beide TikZ-Bloecke mit standalone-`pdflatex` + `pdftocairo -png -r 300` gerendert (`radial_tangential.png`, `kreis_kinematik_flowchart.png`); die Inline-SVG-Nachbauten sind raus.*
- [x] **BUG (hoch): Layout — Piktogramme ragen in die linke Schiene, rechte Spalte bleibt leer.** Zwei unabhängige Ursachen: **(a)** `.highlight_box_img { position:absolute; margin-left:-80px; margin-top:-40px }` (`styles.css:751`) schiebt das Box-Icon 80px **aus der Lesespalte heraus** — eine Legacy-Regel aus der Zeit vor dem 3-Spalten-Grid, die jetzt mit der Schiene/dem Inhaltsverzeichnis kollidiert. **(b)** Die Marginalienspalte ist im neuen Kapitel **immer leer**: `shell.js:35` sammelt ausschließlich `.anmerkung`, das migrierte Kapitel nutzt aber durchgehend die v0.13-Namen (`bemerkung` 14×, `anmerkung` 0×). `hide('chapter_marginalia')` blendet nur den Inhalt aus — die Grid-Spalte bleibt reserviert (`.chapter-body { grid-template-columns: 220px minmax(0,1fr) 210px }`, `styles.css:95`), also 210px + 24px Gap verschenkt und die Textspalte nach links gedrückt. Dadurch greift auch `#paper { max-width:900px }` nie: bei `#content`-Breite 1150px bleiben der Mittelspalte nur ~650px. Fix: Icon-Positionierung ins Box-Padding holen; Marginalien-Selektor auf die v0.13-Namen erweitern; Grid so bauen, dass die rechte Spalte kollabiert, wenn sie leer ist. *(M)* — *Fix (v1.7): `.bemerkung`/`.wichtig` in die Box-Regeln aufgenommen (sie hatten gar keine Karten-Optik und keinen Icon-Freiraum), Icon per `position:relative` an der Box verankert statt an der statischen Position, dritte Grid-Spalte auf `auto` -> kollabiert, wenn keine Marginalien da sind.*
- [x] **BUG (A11y): Bildunterschriften und Fußnoten haben zu wenig Kontrast.** Beide nutzen `var(--ink-3)` (`#878ea1`) auf `--paper` (`#f6f4ef`) = **2,98:1** — unter WCAG AA für Fließtext (4,5:1) und sogar unter der Schwelle für Großtext (3:1). Verschärfend: Captions sind auf `0.9em` (~16px), Fußnoten auf `0.82em` (~14px) verkleinert, es gilt also klar 4,5:1. Darkmode ist unkritisch (`#999` auf `#2c2c2c` = 4,90:1) — **das Problem ist der Light-Mode**. Fix-Optionen: (a) Captions/Fußnoten auf `--ink-2` (`#4c5266`, 7,06:1) umstellen — kleinster Eingriff; (b) `--ink-3` global abdunkeln, z. B. `#666d80` (4,70:1) oder `#5f6678` (5,22:1) unter Beibehaltung des Blaugrau-Tons — betrifft dann auch `.subcap`, `.bildquelle`, Marginalien und Zeilen 194/212 der `styles.css`. Empfehlung: (b), sonst bleiben dieselben 2,98:1 an allen anderen Sekundärtext-Stellen stehen. *(S)* — *Fix (v1.7): `--ink-3` von `#878ea1` auf `#666d80` (2,98:1 -> 4,70:1). Fussnoten zusaetzlich auf Fliesstextgroesse (Nutzer-Feedback: kleinerer Grad wirkt unruhig).*
- [x] **Nebenbefund: linke Schiene listet die neuen Boxentypen nicht.** `shell.js:55` sammelt Landmarks über `.lernziel, .motivation, .wiederholung, .beispiel, .zusammenfassung, .aufgabe, .anmerkung` — `bemerkung` und `wichtig` fehlen, also erscheinen 17 der 30 Boxen des Kapitels nicht in der Seitennavigation. *(S)* — *Fix (v1.7): `shell.js::landmarksFor` um `.bemerkung`/`.wichtig` erweitert.*
- [x] **Inhalt/Bug: Farbkodierung aus v0.13 fehlt.** v0.13 nutzt 11× `\textcolor`, das Kapitel-HTML **kein einziges**. Betroffen: (a) Zerlegung der Beschleunigung (tex L410–424: `\alpha(t)\cdot R`-Term rot, `\omega(t)^2\cdot R`-Term blau) — die Prosa sagt weiterhin „*hervorgehoben durch die unterschiedlichen Farben*", ohne dass etwas hervorgehoben ist; (b) 5× Farbverweise „(in blau/orange/grau)" in den Bildunterschriften zu Abb. 1.4.19/1.4.20 (tex L869, L944–946). Fix: `\textcolor{red|blue}{…}` in Mathe übernehmen, Farbphrasen in Captions als `<span style="color:#1555A2|#F47A2D|#474747">`. **Kein Config-Change nötig** — MathJax-Autoload zieht das `color`-Paket selbst; die im Plan vorgesehene `packages:{'[+]':['color']}`-Zeile fehlt, wird aber nicht gebraucht. *(S, niedriges Risiko)* — *Fix (v1.7): `\textcolor{red|blue}` in der Zerlegung der Beschleunigung, 6 farbcodierte Phrasen in den Bildunterschriften als `<span style="color:…">`; `[tex]/color` in `loader.load` **und** `tex.packages`.*
- [x] **Doku: Plan-Schritt G nicht ausgeführt.** `CLAUDE.md` beschreibt weiterhin ch_01 als interaktives Kapitel „1.5" mit 11 `gcN`-Figuren. Nachzutragen: v0.13-Migration (Abschnitt **1.4**, 12 Unterabschnitte, rein statisch), dormante `figures/fig_NN.js` + `figures/kreisbewegung/` (Imports in `main.js` auskommentiert, Guards in `update_all`/`make_static`), neue Box-Typen `wichtig`/`bemerkung`, MathJax-`tags:'ams'`-Config, `figure.abbildung`/`.fussnote`/Tabellen-CSS. *(S)* — *Fix (v1.7): `CLAUDE.md` beschreibt jetzt die Zaehler-Scopes, die MathJax-Paketfalle, die Bildbreiten-Regel und die fuenf Stellen, die Box-Klassen aufzaehlen.*
- [x] **Skalierung: MathJax-Gleichungspräfix ist hartcodiert.** `index.html` setzt `tagformat.number = (n) => '1.4.' + n`. Sobald eine zweite Section ins WIP kommt (ch_02 wartet schon), ist jede Formel dort falsch nummeriert. Lösung analog `numbering.js::sectionPrefix()`: Präfix pro Seite/Section ermitteln statt global. **Blocker für das nächste Kapitel.** *(M, mittel)* — *Fix (v1.7): `renumber_equations()` in `numbering.js`. MathJax gibt `tagformat.number(n)` keinen Kontext; `\setcounter{equation}{0}` ignoriert MathJax stillschweigend und `tags.reset(0)` loescht `allLabels` -- beides nachgemessen. Loesung: nach dem ersten Typeset traegt jede nummerierte Zeile `[data-mml-node=mlabeledtr]`, daraus wird die Zuordnung laufende-Nummer→1.4.3 gebaut und genau ein zweiter Typeset ausgeloest. Verifiziert: 1.4 ergibt 1.4.1-1.4.88, ein zweiter Abschnitt startet bei 1.5.1.*
- [x] **Konsistenz: ch_02-Scaffold nummeriert „2.x".** Nach v0.13 müsste das Kapitel „Kinematik des starren Körpers" unter Mechanik = Kap. 1 laufen (vgl. 1.4). Beim Ausbau von ch_02 mitziehen. *(S)* — *Erledigt: Scaffold geloescht; an seine Stelle tritt `ch_02_dynamik_drehbewegung.html` mit der korrekten v0.13-Nummerierung 1.5.x.*
- [x] **Aufräumen: verwaister Stylesheet-Link.** `index.html:9` lädt `src/figures/kreisbewegung/styles.css`, obwohl gc10 nicht mehr im Dokument ist. Entfernen — oder bewusst stehen lassen und beim Re-Aktivieren der Figur wieder brauchen (dann als solches kommentieren). *(S)* — *Fix (v1.7): auskommentiert, mit Hinweis auf die Re-Aktivierung samt gc10.*
- [x] **UI: Header neu aufgeteilt.** — *Fix (v1.7, Nutzer-Feedback): die Krume ist jetzt selbst der Zugang zum Inhaltsverzeichnis (`<button data-action="toc">`, zweireihig: Kapitel klein oben, Unterabschnitt darunter, beide mit Ellipse) -- der separate Button "Inhaltsverzeichnis" entfaellt; Drucken/Kontakt/Darkmode als Symbol-Buttons (`.icon_button`, Beschriftung via title/aria-label) in einem rechten Cluster `#header_controls`; `#header_spacer` raus, die Krume ist das einzige schrumpfende Element. Nebenbei: `shell.js::renderAppbar` nahm fuer die Kapitel-Krume pauschal `pages[0]` -- ab dem zweiten Kapitel falsch, jetzt die naechste h2-Seite oberhalb der aktiven.*
- [x] **Aufräumen: verwaister Stylesheet-Link.** — *Fix (v1.7): `index.html:9` auskommentiert mit Hinweis auf die Re-Aktivierung samt gc10.*
- [x] **Kosmetik/Prosa-Abweichungen.** (a) Box-Titel `Zusammenfassung 1.4.4: Zusammenfassung: Kinematik der Kreis-…` doppelt das Wort. (b) Fußnote 2 wurde still zu „**Im** Kapitel zur Kinematik" korrigiert (v0.13: „In Kapitel") — sinnvolle Korrektur, aber Abweichung vom Anspruch „wortgleich"; entweder bewusst als Korrekturliste führen oder zurückdrehen. (a) und die Fussnoten-Schriftgroesse sind in v1.7 erledigt (doppeltes "Zusammenfassung:" aus `data-title` entfernt; Fussnoten auf Fliesstextgroesse). (c) Querverweise klickbar — **bereits erledigt** (Verifizierung 2026-07-23 per Code-Lektüre + Git-Historie, Branch `quick-wins`): commit `ecce56c` „Alle Querverweise als Links" (v1.7, 2026-07-21) hat `numbering.js::resolveFigRefs`/`resolveSecRefs` (setzen `href="#fig-…"` bzw. `href="#p-1-4-5"`) **und** den delegierten `a[href^="#"]`-Klick-Handler in `main.js` (showPage + scrollIntoView) gemeinsam eingeführt. Figuren tragen `id` passend zu `data-ref-fig`, `slugFor` liefert `p-1-4-5` passend zu `data-ref-sec` — beide Verweistypen navigieren. Das im Eintrag vorgeschlagene `data-action="goto_page"` wurde bewusst NICHT nachgerüstet: es wäre eine duplikate, konkurrierende Mechanik zum etablierten `#`-Link-Handler (main.js-Kommentar: „bleibt gültig für alles, was künftig #-Links erzeugt"). *(S–M)*
- [ ] **Verifikation: Browser-Phasen offen.** Phasen 2 (Wort-für-Wort gegen das v0.13-PDF), 8 (Druckfluss `?print=true`), 9 (TOC-Akkordeon) und 10 (Darkmode, Tablet-Drawer <1024px) sind nur manuell/optisch prüfbar und stehen noch aus. Hinweis Phase 8: `print.js` erzeugt QR-Codes ausschließlich pro `.grafik-container` — da es davon in 1.4 keine mehr gibt, enthält der Druck **keine** QR-Codes (erwartet, kein Bug; das Akzeptanzkriterium im Verifikationsplan formuliert das zu weit). *(M)*

---

## P4 — Abschnitt 1.5 fertig migrieren (v0.13 „Dynamik der Drehbewegung und Rotation starrer Körper") — ✅ ERLEDIGT

**Status 2026-07-24: vollständig migriert.** `chapters/ch_02_dynamik_drehbewegung.html`
hält alle 14 Unterabschnitte 1.5.1–1.5.14 mit echtem Inhalt (verifiziert: 0 Platzhalter-Boxen,
insg. 187 Gleichungen, 24 Abbildungen, 15 Bilder; 1.5.13 Rollbewegung allein 73 Gl./31 KB).
Die unten ehemals offenen Einträge sind erledigt; P4 wird nicht weiter verfolgt.

Die Vorarbeiten sind erledigt und blockieren nicht mehr: alle 13 Abbildungen
liegen in `bilder/` (inklusive der nachgelieferten Kippbedingungs-Bilder), das
Formelpräfix zählt pro Abschnitt, MathJax lädt das `physics`-Paket für
`\dd`/`\eval`. Vorgehen und Werkzeuge: Skill **v013-kapitel-migration**,
Hintergrund in `MIGRATION_v0.13_nach_HTML.md`.

**Sollwerte aus dem PDF** (via `referenznummern.py`): 127 Gleichungen
(1.5.1–1.5.127), Abbildungen 1.61–1.72, `Beispiel 1.5.1`, `Zusammenfassung 1.8`
(kapitelweit). Die Offsets am `<h2>` stehen bereits.

- [x] **1.5.3 Drehimpuls und (Massen-)Trägheitsmoment zu Ende** — 8 Gl. (11–18), Abb. 1.62 steht schon. *(S)*
- [x] **1.5.4 (Massen-)Trägheitsmoment** — 9 Gl. (19–27), 3 Abbildungen (Zylinder, Kugel, Steiner). *(M)*
- [x] **1.5.5 Drehmoment** — 3 Gl. (28–30), 1 Abbildung. *(S)*
- [x] **1.5.6 Anwendung des Drehmoments – Wippe und Hebelgesetz** — 1 Gl. (31). *(S)*
- [x] **1.5.7 Die Kippbedingung bei starren Körpern** — keine Gleichungen, aber das Bildpaar (Abb. 1.67) hat **keine Hauptunterschrift**: nur die beiden Teilunterschriften übernehmen, keine `<figcaption>` erfinden. *(S)*
- [x] **1.5.8 Zusammenhang zwischen Drehmoment und Drehimpuls** — 8 Gl. (32–39). *(S)*
- [x] **1.5.9 Drehimpulserhaltung** — 12 Gl. (40–51), 1 Abbildung. *(M)*
- [x] **1.5.10 Experimente zu Drehmoment, Drehimpuls und Drehimpulserhaltung** — 3 Gl. (52–54), Maxwell-Rad-Abbildung. *(S)*
- [x] **1.5.11 Rotationsenergie** — 9 Gl. (55–63). *(S)*
- [x] **1.5.12 Rotation und Translation** — 1 Gl. (64). *(S)*
- [x] **1.5.13 Rollbewegung** — **63 Gleichungen (65–127)**, 2 Abbildungen; mit Abstand der größte Brocken, eigene Sitzung einplanen. *(L)*
- [x] **1.5.14 Zusammenfassung** — keine Gleichungen, enthält `Zusammenfassung 1.8` und die einzige Tabelle des Abschnitts. *(S)*
- [x] **Abschluss** — die 11 `\ref` der Quelle als `data-ref-*`-Anker auflösen (darunter Verweise auf Abschnitt 1.4), `\point`/`\SI`/Fußnoten wie gehabt; danach Verifikation nach Skill **v013-verifikation**: Soll und Ist müssen **pro Unterabschnitt** deckungsgleich sein, nicht nur in der Summe.

---

## P7 — Kapitel 0 („Grundlagen") migrieren (v0.13)

v0.13 `\setcounter{chapter}{-1}` → Kapitel 0 = „Grundlagen", Quelle
`Input/v0.13/pskript_grundlagen_gmni_v2.tex` (724 Zeilen). 7 Abschnitte
(0.0 Einleitung … 0.6 Zusammenfassung), 4 Raster-Abbildungen (PNG/JPG/JPEG,
Breiten 1.0/0.9/0.7/0.6 — kein PDF/TikZ-Rendering nötig), **37 nummerierte
Gleichungen** (0.1: 12, 0.2: 13, 0.3: 6, 0.4: 6), 7 `align*`, 7 Tabellen,
10 Fußnoten, 12 Box-Makros (3 `\bbspe` in 0.1, 7 `\bbsp`+1 `\bbspe` in 0.2,
1 `\bzusafa` in 0.6), 7 getippte Tabellenverweise. `numbering.js` braucht
für Kapitel 0 **eine** Code-Änderung: `\thefigure = \ifnum\value{chapter}>0
\thechapter.\fi\arabic{figure}` lässt den Kapitelpräfix entfallen → Abbildungen
heissen „Abb. 1"…„Abb. 4" (nicht „Abb. 0.1"); Gleichungen/Boxen/Zusammenfassung
behalten ihr „0." (`sectionPrefix`/`chapterPrefix` sind generisch). Die
kapitelweiten Offsets am ersten h2 sind `data-figure-offset="0"`,
`data-zusammenfassung-offset="0"` (kein vorangehender Inhalt in Kapitel 0).
Vorgehen: Skill **v013-kapitel-migration**, Hintergrund `MIGRATION_v0.13_nach_HTML.md`.

**Entschieden — Datei-Granularität (Variante B).** Eine Datei
`ch_00_grundlagen.html`, aber h2 = die 7 `\section`s (0.0–0.6) und h3 = die 5
`\subsection`s (0.2.1–0.2.3, 0.3.1, 0.3.2) — konsistent mit ch_01 (h2 = Section,
h3 = Subsection). `\subsubsection*`/`\subsection*` → `<h4>` nicht-seitengebend.
`numbering.js::sectionPrefix` kollabiert „0.2.1"→„0.2", sodass Gleichungen/Boxen
pro Section fortlaufend zählen wie v0.13s `\numberwithin{…}{section}`. Die 0.2-h2
-Seite ist ein leerer Section-Trenner (0.2 hat keinen Einleitungstext vor 0.2.1);
0.3s h2 hat Einleitungstext. 12 Seiten insgesamt.

- [x] **P7-0 Granularität geklärt** — Variante B (eine Datei, h2=Sections, h3=Subsections). *(S)*
- [x] **P7-1 Zähler-Sollwerte aus dem PDF** (`referenznummern.py` pro Section 0.1–0.4). *(S)*
- [x] **P7-2 4 Abbildungen nach `bilder/`** — kopiert + Magic-Byte-geprüft + Breiten 100/90/70/60 %. *(S)*
- [x] **P7-3 `ch_00_grundlagen.html` transkribieren** — 7 Sections, Makro-Tabelle, siunitx manuell, `\be`/`\ee`→`\begin{equation}`, Fußnoten, Boxen, Tabellen getippt, Quell-Typos 1:1. *(L)*
- [x] **P7-4 Verifikation** — Stufe 1 (PDF) vs. Stufe 2 (MathJax offline) deckungsgleich: 37 Gl., Spannen 0.1.1–0.1.12 / 0.2.1–0.2.13 / 0.3.1–0.3.6 / 0.4.1–0.4.6, Boxen 0.2.1–0.2.8; 0 TeX-Fehler, 0 unaufgelöste Refs. Stufe 3 (DOM): 12 Seiten, Abb. 1–4, Box-Reset, 10 Fußnoten. Stufe 4: 4 Bilder 200. Stufe 6: JS/CSS ok. **Stufe 5 (Browser-Sicht) offen — Nutzer freigeben.** *(M)*
- [x] **P7-5 `index.html`**: `<div data-chapter="ch_00_grundlagen">` VOR ch_01 eingefügt; `#header_version` v1.7→v1.8. *(S)*

---

- [x] **Druck: durchgehend eingefaerbter Hintergrund vermeiden (Toner!).** Im Druck darf es keinen flaechigen, durchgehend eingefaerbten Hintergrund geben (verbraucht unnoetig Toner/Farbe). `#content` (und `#paper`) tragen `background-color: var(--paper)` (#f6f4ef, cremefarben), das im Druck nicht zurueckgesetzt wurde. Box-Hintergruende sind ok (kleine Flaechen). *Fix (v1.7): `#print_container #content`/`#paper` auf `background:#fff`; zusaetzlich `@media print { body, #content, #paper { background:#fff !important } }`.* *(S)*

- [ ] **QR-Codes im Druck verweisen auf die interaktiven Aspekt-Figuren (Variante A).** Im Legacy trug jede gedruckte Grafik einen QR-Code, der zurueck auf die interaktive Version zeigte. Im WIP fehlt das: `print.js` hat `create_qr()`/`from_qr()` noch (aus Legacy), qrjs2 ist geladen, die CSS (`.qr_container`/`.qr_title`) existiert -- aber `print_page()` ruft `create_qr` nur fuer `.grafik-container` auf, die es im migrierten (statischen) Kapitel nicht mehr gibt. Der interaktive Teil sind jetzt die **Aspekt-Figuren** (`.aspekt-figur`, z. B. Abb. 1.38), im Druck erscheint ihr statisches `.nur-druck`-Gegenstueck.

  **Umsetzung (drei Bausteine):**
  1. Stabiler Anker an der Aspekt-Figur: in `init_aspekt_figuren()` eine feste id vergeben (z. B. `id="ak-kreisbahn"` aus `data-aspekt`).
  2. QR im Druck aufs statische Bild, Link zur Figur: in `print_page()` ueber die Aspekt-Figuren iterieren, im Klon das `data-figref`-Ziel (das gedruckte Bild) finden und dort `create_qr(zielElement, "…?g=ak-…")` anhaengen. Nur Abbildungen MIT interaktivem Pendant bekommen einen QR (Nutzervorgabe: „verweisen auf den interaktiven Part").
  3. **Variante A** fuer `from_qr()`: paginierungs-bewusst -- beim Ankommen mit `?g=ak-…` die Seite der Figur via `showPage` einblenden UND die Lupe-Overlay-Ansicht oeffnen (`openOverlay`), also die Figur prominent gross zeigen (Analogon zum Legacy-`zoom()`). Alt-Links `?g=gcN` behalten den `zoom`-Fallback. (Aktuell ist `from_qr` nicht paginierungs-bewusst und laedt auf einer versteckten Seite ins Leere -- muss ohnehin gefixt werden.)

  **`create_qr` verallgemeinern:** aktuell fuegt es den QR *in* das Element mit `id` ein und baut den Link aus der id; auf `create_qr(zielElement, linkZiel)` umstellen (minimal-invasiv).

  **Beschriftung allgemeiner:** der Legacy-Hinweis „Sie muessen im Ilias angemeldet sein" ist ILIAS-spezifisch und muss weg. Neutraler formulieren (z. B. „Interaktive Version im Browser oeffnen") -- unabhaengig von der konkreten Hosting-Plattform.
  *(M)*

## P5 — Bekannte Fehler (Interaktivitaet / Shell)

- [x] **Schiene „Auf dieser Seite" zeigt beim ERSTEN Laden nur den Box-Typ.** Nach dem Neuladen steht in der linken Schiene oft nur „Wichtig", „Beispiel" … ohne Titel; nach Hin-und-Herspringen dann korrekt „Beispiel: …". **Ursache:** `main.js::init()` ruft `init_shell()` (baut die Schiene, liest `.highlight_box_title`) **vor** `init_numbering()`, das die Box-Titel erst auf „Beispiel 1.4.1: Titel" setzt. **Fix-Richtung:** `init_shell()` nach `init_numbering()` aufrufen oder nach der Nummerierung einen Schienen-Refresh ausloesen. *(S)* — *Fix (quick-wins, 2026-07-23, Commit `d0c53d1`): `init_shell()` in `init()` hinter `init_numbering()`+`label_aspekt_figuren()` verschoben; `paginate()` bleibt vorher (Seitenregister). Zwischenschritte (figure panels/footnotes/aspekt) brauchen die Schiene nicht.*

---

## P6 — Cross-Referenzing & Verweissystem („Karte der Physik") — großes Paket

**Vision:** Das Skript wächst auf 15+ Kapitel / ~400 Seiten. Heute sind Querverweise
einzelne, einzeln verdrahtete Mechanismen: `data-ref-fig`/`data-ref-sec`/
`data-ref-eq` (numbering.js), die Abschnitts-/Abbildungs-Spruenge in der Rail und
dem TOC (shell.js/ui.js) und der QR-Druckrueckverweis (print.js) — jeweils ad hoc,
ohne gemeinsames Modell. Ziel ist ein **einheitliches, datengetriebenes Verweis-
system**, das das gesamte Skript als miteinander verknuepfte „Karte der Physik"
auffasst: jeder Begriff, jede Formel, jede Abbildung, jeder Abschnitt ist ein
**Knoten** mit Typ, Kontext (Kapitel/Section, an welcher Stelle er steht) und
gerichteten Kanten („benoetigt", „vertieft", „folgt aus", „wird gezeigt in").
Daraus speisen sich Rueckverweise („siehe auch"), kontextsensitive „Physik"-Sektion
der Aspekt-Figuren (s. P-Aspekt-Figuren), TOC/Rail-Navigation und kuenftig
Begriffs-Netz/Suche — alle aus **einer** Quelldatei pro Kapitel, O(1) pro
Kapitel/Figur.

**Warum als Paket:** Die heutigen Verweismechanismen sind dupliziert (fuenf Stellen
zaehlen Box-Klassen, drei loesen Verweise auf) und skalierten nicht ins 15+-Kapitel-
Ziel; ein gemeinsamer Knoten/Graph-Kern ersetzt sie langfristig und macht neue
Verweis-Arten (Begriffs-Suche, „Voraussetzungen", „wird verwendet in") billig.

**Bausteine (Skizze, je S–M, Gesamt L):**

1. **Knoten-Modell + Deklaration:** ein einheitliches Attribut-Schema an den
   Kapitel-Fragmenten — z. B. `data-node="…" data-type="begriff|formel|abb|abschnitt|beispiel"`
   mit optionalen `data-needs`/`data-shows`/`data-context` (Leerzeichen-getrennte
   Knoten-IDs). Pro Kapitel deklarativ im HTML, kein JS pro Verweis.
   *(M, mittleres Risiko — Beruehrung aller Kapitel-Fragmente, aber rein deklarativ.)*
2. **Graph-Kern (Modul `src/xrefs.js`):** laedt die Knoten beim Kapitel-Laden, baut
   den Verweis-Graph (Adjazenz + Kontext/Position), stellt Lookup-Api fuer Rail/
   TOC/Physik-Sektion/Suche. Ersetzt langfristig `resolve_eq_refs`/`resolveFigRefs`/
   `resolveSecRefs` (numbering.js) durch einen gemeinsamen Aufloeser.
   *(M, mittleres Risiko — Azyklizitaet zum Rest wahren wie bei numbering.js, ggf.
   window-Bruecken.)*
3. **Kontextsensitive Physik-Sektion (weiterentwickelt):** die Aspekt-Figur holt
   statt der festen `data-eqs`-Liste die Formeln, die im Graph als „fuer diesen
   Aspekt relevant" markiert sind — automatisch je nach Skriptstelle (s. aktueller
   Stand `main.js::fill_physik_panels` + `data-eqs`).
   *(S, niedrig — auf dem Knoten-Modell aufbauend.)*
4. **Rueckverweise & „Auf dieser Seite":** Rail/TOC zeigen nicht nur die aktuelle
   Seite, sondern auch „Voraussetzungen"/„wird verwendet in" — aus dem Graph, ohne
   neue Handarbeit pro Kapitel. *(M)*
5. **Begriffs-Suche / Karte:** TOC-Suche erweitert zur Knoten-Suche (Begriff →
   Definition + alle Stellen, an denen er verwendet wird); optional eine visuelle
   „Karte der Physik" (Kapitel/Knoten als geknoteter Graph). *(M–L, kuenftig.)*

**Voraussetzungen/Reihenfolge:** Knoten-Modell (1) vor Graph-Kern (2) vor
Verbraucher (3/4/5). Vorab: entscheiden, ob die Knoten-IDs stabil (per
`\label`/`data-fig`/Abschnitts-ID schon vorhanden) sind oder ein eigenes
Namensschema eingefuehrt wird — Lets: vorhandene IDs (`eq_…`, `fig-…`,
Seiten-`data-page-id`) als Knoten-IDs weiter nutzen. *(Gesamt L, hohes T-Gewinn
langfristig — Verweise werden O(1) pro Knoten statt pro Mechanismus.)*

---

## P-Aspekt-Figuren — Optik & Interaktion (Kapitel 1.4)

Eingetragen 2026-07-23 nach Nutzervorgabe (s. Memory: backlog-first-workflow).
Betroffen: `src/figures/aspekt_{kreisbahn,weg_zeit,winkel_zeit,vxvy_zeit}.js|.css`
+ `src/figures/kreisbewegung/` (Motor). Farben sollen kapitelweise konsistent
sein (s. P-AF-2).

**Status 2026-07-23: alle 5 erledigt** (P-AF-1/3/4/5 + P-AF-2). Offene Folge für
P-AF-2 (geschmacksabhängig, nicht selbst verifizierbar — Screenshot-Freigabe):
(a) v #0072b2 und rx #1f77b4 beide blau — in keiner 1.4-Figur gleichzeitig,
küftig ggf. deduplizieren; (b) 1.42 HV-Strichstärke 3,75 px vs 1.38/1.39/1.41
6 px kapitelweit angleichen? (c) CVD-Sichtprüfung der neuen vx-Violett-
Zuweisung per Freigabe-Tipp.

- [x] **P-AF-1: ω-Regler, an T gekoppelt.** Zusätzlicher Regler für die
  Winkelgeschwindigkeit ω, bidirektional an die Periode T gekoppelt (ω = 2π/T):
  bewegt man einen, folgt der andere. In jeder Aspekt-Figur, die T/ω exposes
  (Kreisbahn 1.38, Winkel-Zeit 1.41, ggf. Weg-Zeit 1.39 / vx-vy 1.42). Beachten:
  T-Slider ist logarithmisch/gequantelt — ω-Regler entsprechend abbilden.
  *(S–M)*
- [x] **P-AF-2: Kapitel-konsistente, farbfehlsichere Farbpalette.** Farben
  konsistent UND farbfehlsicher (colorblind-safe); wenn neue Objekte hinzukommen,
  braucht es mehr/andere, weiterhin unterscheidbare Farben. Konsistenz erstreckt
  sich über ein ganzes Kapitel (1.4: alle Figuren 1.4.1–1.4.x konsistent — r/v/a
  haben kapitelweit dieselbe Farbe); in 1.5 dürfen andere Farben stehen.
  Heutiger Stand: `--kb-r`/`--kb-rx`/`--kb-ry`/`--kb-v`/`--kb-a`/`--kb-traj`/…
  in `aspekt_kreisbahn.css` — prüfen, ob das schon kapitelweit einheitlich und
  cb-safe ist; ggf. zentrale Kapitel-Palette (Token-Datei pro Kapitel) anlegen,
  aus der alle Aspekt-Figuren + der gc10-Motor schöpfen. *(M–L, konzeptionell)*
- [x] **P-AF-3: Zeitanzeige unten links im Kernsim-Bereich.** Kleine
  Zeit-/Stopp-Uhr-Anzeige unten links im Kernsim (.aspekt-scene), inspiriert von
  den Stand-alone-Simulationen (`Input/Simulationen/Project_kreisbewegung_*`).
  Pro-Instanz (per `createRuntime`), an den Animations-/Play-Zustand gekoppelt.
  *(S)*
- [x] **P-AF-4: Uhr minimal kleiner + minimal nach links.** Stoppuhr in den
  Szenen leicht verkleinern und minimal nach links verschieben — derzeit minimale
  optische Kollision mit den Diagrammen. Berührt `scale` (aktuell 0,71× nach
  fca90a3) + Position in `aspekt_*_zeit.css`. *(S)*
- [x] **P-AF-5: Vektorstrichstärken-Regel konsistent halten.** Hauptvektoren
  (r, v, a, …) gleich dick; Komponenten stets 0,8 der HV-Strichstärke. Verifikation
  (2026-07-23): letzter Schritt (`3401265`) machte Vektoren ×1,5 **dicker**
  (gewünscht/gefordert, kein Fehler); HV-/Komponenten-Verhältnis 0,8 ist in
  `aspekt_kreisbahn.css` (r 4px / rx,ry 3,2px) und `aspekt_vxvy_zeit.css`
  (v 2,5px / vy 2px) eingehalten. Konsistenz kapitelweit (1.4) sichern, Regel als
  Token/Konstante festhalten statt pro Figur hart. *(S)*
- [x] **P-AF-6: Interaktive Aspekt-Figur 1.46 — aₓ(t)/a_y(t)-Zeit-Diagramm.**
  statische `fig-skript-kreisbewegungen-axaydiagramm` interaktiv nachbauen, analog
  zu P-AF/1.42 (`aspekt_vxvy_zeit.js|.css`): gestapeltes Dual-Graph (oben aₓ(t),
  unten a_y(t)), Zeit-Regler t tastet ab, R + T einstellbar, Kernsim zeigt
  Beschleunigungsvektor a⃗ mit optionaler Zerlegung in aₓ/a_y. Copy & feature-gate
  der 1.42 (nicht von null, s. INTERAKTIVE_ASPEKT_FIGUREN.md §0a). Motor per
  `createRuntime()`; Registrierung `main.js::ASPEKT_FACTORIES` + `data-aspekt`
  + `data-figref`. a⃗-Farbe kapitelweit `--kb-a`. *(M)*
  Umgesetzt (2026-07-23, `ded8ee3`): `aspekt_axay_zeit.js|.css`, `data-aspekt="axay-zeit"`,
  graphType1=axt/graphType2=ayt, a⃗-Farbe `--kb-acc` (bestehender Token, nicht `--kb-a`),
  strokeWidth-Pfeilspitzen, arrowLenScale 1.5. Visuell noch nicht freigegeben.
- [x] **P-AF-7: Interaktive Aspekt-Figur 1.47 — Betrag der Bahnbeschleunigung.**
  statische `fig-skript-kreisbewegungen-betragatdiagramm` interaktiv nachbauen,
  analog zu P-AF/1.43 (`aspekt_betragv_zeit.js|.css`): einzelner Graph |a⃗(t)|
  (konstant), Zeit-Regler t tastet ab, R + T einstellbar, Kernsim zeigt
  Beschleunigungsvektor a⃗, dessen Betrag trotz wechselnder Richtung konstant
  bleibt. Copy & feature-gate der 1.43. *(S–M)*
  Umgesetzt (2026-07-23, `ded8ee3`): `aspekt_betraga_zeit.js|.css`, `data-aspekt="betrag-a-zeit"`,
  graphType1=aabs einzeln, a⃗-Farbe `--kb-acc` (explizit gescopt, da a nicht zentral
  gefärbt wird — s. Hinweis zur 1.43/betragv). Visuell noch nicht freigegeben.

## P8 — Inhaltsverzeichnis: 3-stufige Hierarchie (Themenkomplex → Kapitel → Abschnitt)

Eingetragen 2026-07-24 nach Nutzervorgabe. Das TOC (und die Navigation) ist
heute **2-stufig**: `pages.js` paginiert h2 + h3, `ui.js::generate_toc` gruppiert
**pro h2** (eine Gruppe je h2 = eine je Section). Das macht Kapitel 0 (7 h2-
Sections 0.0–0.6) zu **7 scheinbar eigenständigen „Kap. 0.0"…„Kap. 0.6"**-Gruppen
im TOC — die Hierarchie wirkt gebrochen, weil die v0.13-`\chapter`-Ebene
(„Grundlagen"/„Mechanik"/…) im WIP **gar nicht existiert** (die `data-chapter`
-Platzhalter in `index.html` sind reine Lade-Marker, keine TOC-/Seiten-Entität).

**Ziel (Nutzervorgabe):** 3-stufige Hierarchie mit dieser Benennung:

| Ebene | Name | v0.13-Entsprechung | Seiten? | Beispiele |
|-------|------|--------------------|---------|-----------|
| 1 | **Themenkomplex** | `\chapter` | **nein** (nur TOC-Gruppe) | Grundlagen(0), Mechanik(1), Elektromagnetismus(2), Schwingungen und Wellen(3) |
| 2 | **Kapitel** | `\section` | **ja** (h2, Intro-Seite) | 0.1, 0.2 …, 1.4 |
| 3 | **Abschnitt** | `\subsection` | **ja** (h3) | 0.2.1, 1.4.1 … 1.4.12 |

v0.13-Hauptdatei (`Input/v0.13/Physik_pskript_v0.13.tex`): 4 `\chapter`
(Grundlagen / Mechanik / Elektromagnetismus / Schwingungen und Wellen). Jede
WIP-`ch_NN`-Datei entspricht **einer** `\input`-Section-Datei, also einer oder
mehreren `\section`s innerhalb **eines** Themenkomplexes — die Themenkomplex-
Zugehörigkeit ist also **pro `ch_NN`-Datei** konstant (ch_01 UND ch_02 gehören
beide zu „1 Mechanik").

**Wichtig — Kapitel-0-Struktur:** Diese Hierarchie **rettet die ursprüngliche
ch_00-Struktur** (h2 = Sections 0.0–0.6, h3 = Subsections 0.2.1/0.2.2/0.2.3/
0.3.1/0.3.2). Die früher erwogene „Option A"-Herabstufung (h2 = „0 Grundlagen",
Sections zu h3, Subsections zu nicht-seitendem h4) ist **vom Tisch** — 0.0–0.6
bleiben h2-Kapitel-Seiten, gruppiert unter dem Themenkomplex „0 Grundlagen"; die
Subsections bleiben h3-Abschnitt-Seiten. `numbering.js` braucht **keine**
Änderung (`sectionPrefix` kollabiert „0.2.1"→„0.2" wie gehabt).

**Entwurf (Skizze):**
1. **Themenkomplex-Metadaten** deklarativ am `data-chapter`-Platzhalter in
   `index.html`, z. B. `<div data-chapter="ch_00_grundlagen" data-tk-num="0"
   data-tk-title="Grundlagen">` (analog `ch_01` → num 1 / „Mechanik", `ch_02` →
   num 1 / „Mechanik"). *(S, deklarativ)*
2. **`pages.js`**: Themenkomplex an jede Seite anhängen (gelesen vom
   `data-chapter`-Elter), ohne neues Paging-Level — Paging bleibt h2/h3. *(S)*
3. **`ui.js::generate_toc`**: 3-stufig statt 2-stufig — gruppiere nach
   Themenkomplex → darin nach h2 (Kapitel) → darin h3 (Abschnitt). *(S–M)*
4. **`shell.js`** (Schiene/Krume/Fortschritt): Themenkomplex im Breadcrumb
   („0 Grundlagen › 0.2 › 0.2.1 …"); Schienen-Mini-Nav ggf. kapitel- statt
   abschnittszentriert. Prüfen, nicht zwingend ändern. *(S–M)*
5. **Verifikation**: DOM-Harness + Sicht (Stufe 5, Freigabe) — ein
   Themenkomplex-Knoten pro `\chapter`, ch_00 = eine Gruppe. *(M)*

**Risiko:** mittel — berührt `index.html` (Metadaten), `pages.js`, `ui.js`,
`shell.js`; aber rein deklarativ + Anzeige, kein Paging-/Nummerierungs-Eingriff.
**Abhängigkeit:** nach der Umstellung ist P4 (Abschnitt 1.5) konsistent
weiterzu migrieren (ch_02 gehört zu Themenkomplex 1, nicht 2).

**Entscheidungen (2026-07-24 mit Nutzer geklärt):**
- (a) Klick auf „Themenkomplex" im TOC → **nur auf-/zuklappen** (kein Sprung);
  aktueller TK ausgeklappt, andere eingeklappt (automatisch).
- (b) Schiene (Rail): **unverändert** — alle Kapitel (h2) flach dokumentenweit,
  aktuelles Kapitel ausgeklappt. TK nur in TOC + Breadcrumb sichtbar.
- (c) Breadcrumb: **3-stufig** — TK › Kapitel(h2) › Abschnitt(aktuelle Seite).
- Zurück/Weiter: **unverändert** (dokumentenweit flach).

**Umgesetzt 2026-07-24** (Commits ce1bae2 → ca81faa → 5787305 → 07d44c9):
`index.html` (TK-Attribute + Breadcrumb-Slot), `chapters.js` (TK vor Flatten
stempeln — der Platzhalter wird beim Flatten gelöscht), `pages.js` (`tk`-Feld
am Page-Objekt), `ui.js` (`generate_toc` 3-stufig + `toc_filter` TK-Ebene),
`shell.js` (`renderAppbar` TK-Krume; Schiene/Pager unberührt), `styles.css`
(`.toc_tk_*` + `#chapter_crumb_themenkomplex`).

**Verifikation 2026-07-24 (Stufe 3 + 6, ohne Browser):**
- `node --check` auf chapters/pages/ui/shell → OK; styles.css-Klammern 310/310.
- DOM-Harness: 40 Seiten unverändert, keine losen Kinder, Abb. 1–1.72
  (Lücken [38,68] präexistent), Boxen/Zusammenfassung/Fussnoten/Refs unverändert.
- TK-TOC-Stichprobe (JSDOM, `generate_toc`): **2 TK-Gruppen** — „0 Grundlagen"
  (7 Kapitel 0.0–0.6) und „1 Mechanik" (Kap. 1.4 mit 12 + Kap. 1.5 mit 14
  Abschnitten); TK-Header **ohne** `goto_page` (nur Toggle ✓); Kapitel ohne
  Abschnitte mit `goto_page`, mit Abschnitten reiner Toggle; Auto-Collapse
  korrekt (aktueller TK offen, anderer eingeklappt).
- Breadcrumb 3-stufig: auf 0.2.1 „Grundlagen › 0.2 Größen … › 0.2.1 …", auf 1.4.3
  „Mechanik › 1.4 … › 1.4.3 …" (TK wechselt korrekt). Auf h2-Seiten erscheint der
  Abschnitt-Slot = Kapiteltitel (bewusst, keine Lücke — entschieden als Option B).
- **Sicht (Stufe 5) offen** — nur nach ausdrücklicher Freigabe per Tipp.

- [x] **P8-0** Entwurf finalisieren + Entscheidungen (a/b/c) mit Nutzer. *(S)*
- [x] **P8-1** Themenkomplex-Metadaten an `index.html`-Platzhalter. *(S)*
- [x] **P8-2** `pages.js`: TK an Seiten-Register anhängen. *(S)*
- [x] **P8-3** `ui.js::generate_toc`: 3-stufig (TK → Kapitel → Abschnitt). *(S–M)*
- [x] **P8-4** `shell.js`: Krume/Schiene anpassen (nach P8-0 b/c). *(S–M)*
- [x] **P8-5** Verifikation (DOM-Harness + Sicht). *(M)* — Stufe 3+6 grün; Stufe 5 offen.

---

## P9 — Schiene (linke Seitenleiste) gefenstert: Vorgänger + aktives Kapitel + Nachfolger

Eingetragen 2026-07-24 nach Nutzervorgabe. P8-Entscheidung (b) „Schiene
unverändert — alle Kapitel flach" wird **revidiert**: die flache Auflistung aller
h2-Kapitel ist bei 15+ Kapiteln unlesbar und behandelt die Abschnitte (h3) im
Kapitel 0 nicht wie gewünscht.

**Heutiges Verhalten** (`shell.js::renderRailInto`, ~Z. 155–160): *alle* h2-
Kapitel werden als Zeile gelistet; nur das aktive Kapitel klappt seine h3-
Abschnitte aus. In 1.4.3 sieht man also 0.0 … 1.5 (alle Kapitel) mit 1.4
ausgeklappt — viel zu lang.

**Gewünschtes Verhalten (Nutzervorgabe)** — Schiene als **Fenster** um das
aktive Kapitel, genau drei Blöcke:
1. **Vorgänger-Kapitel** (das numerisch nächstkleinere vorhandene h2), nur die
   Zeile, **nicht** ausgeklappt.
2. **Aktives Kapitel** als Zeile + **alle** seine h3-Abschnitte ausgeklappt
   (1.4.1 … 1.4.n, aktiver Abschnitt markiert).
3. **Nachfolger-Kapitel** (numerisch nächstgrößere vorhandene h2), nur die
   Zeile, nicht ausgeklappt.

Beispiele (Nutzervorgabe):
- In **1.4.3**: Vorgänger 1.3 (fehlt → nächstkleineres), 1.4 mit 1.4.1…1.4.n
  offen, Nachfolger 1.5.
- In **0.1** (keine Abschnitte): nur 0.0 und 0.2 (Vorgänger/Nachfolger; aktives
  0.1 als Zeile dazwischen, ohne Abschnitte).
- In **0.3** (hat 0.3.1/0.3.2): 0.2 (zu), 0.3 mit 0.3.1/0.3.2 offen, 0.4 (zu).

**Offene Fragen (vor Umsetzung klären):**
- (a) **TK-Grenze**: In 1.4 fehlt der Vorgänger 1.3. „Nächstkleineres vorhandenes
  Kapitel" wäre **0.6** (übergreift Themenkomplex Grundlagen→Mechanik). Gewünscht:
  0.6 zeigen (wörtlich „nächstkleineres") oder Schiene innerhalb des aktuellen
  TK bleiben (dann kein Vorgänger, nur Nachfolger 1.5)?
- (b) **Aktive Kapitel-Zeile** bei kapitelseigenen Intro-Seiten ohne Abschnitte
  (0.0, 0.1, 0.4, 0.5, 0.6): stets anzeigen (zwischen Vorgänger/Nachfolger), oder
  unterdrücken, sodass nur die zwei Nachbarn stehen?
- (c) Erster/letzter Kapitel-Kompakt: 0.0 hat keinen Vorgänger, 1.5 keinen
  Nachfolger — nur den einen Nachbarn zeigen (naheliegend).

**Entschieden 2026-07-24:**
- (a) **TK bleibt** — Vorgänger/Nachfolger nur innerhalb desselben Themenkomplexes.
  In 1.4.3 zeigt die Schiene nur [1.4 (+Abschnitte), 1.5]; der 1.3-Vorgänger
  fehlt und 0.6 liegt im anderen TK → kein Vorgänger.
- (b) **Aktive Zeile anzeigen** — auch Intro-Seiten ohne Abschnitte (0.1) erscheinen
  als markierte Zeile zwischen den Nachbarn: [0.0, 0.1 (aktiv, ohne Abschnitte), 0.2].
- (c) Erster/letzter Kapitel-Kompakt: nur den einen Nachbarn zeigen.

**Risiko:** gering — nur `shell.js::renderRailInto`, rein Anzeige, kein
Paging-/Nummerierungs-/TOC-Eingriff. Drawer-Variante läuft über dieselbe
Funktion, wird mitgeändert. **Verifikation:** DOM-Harness deckt Schiene nicht
ab → Sicht (Stufe 5, Freigabe) oder JSDOM-Stichprobe der `renderRailInto`-Ausgabe.

**Verfeinerung 2026-07-24 (TK-Grenze weich, symmetrisch):** Ist das aktive
Kapitel das letzte seines TK, folgt nach einer dünnen Trennlinie (`.rail-tk-sep`,
Farbe `--border`) das erste Kapitel des nächsten TK als blasse Vorschau
(`.rail-tk-cross`, `--ink-3`, nicht fett); ist es das **erste** seines TK und es
gibt einen vorigen TK, steht das letzte Kapitel jenes TK blass **über** einer
Trennlinie — jeweils statt eines harten Bruchs. (Damit entfällt die
P9-Entscheidung a „am TK-Anfang kein Vorgänger" zugunsten der Symmetrie.) JSDOM:
1.4 → `[0.6 blass, Linie, 1.4 offen, 1.5]`; 0.6 → `[0.5, 0.6, Linie, 1.4 blass]`;
0.0 (ganz erster) / 1.5 (kein Folget-TK) → ohne Linie.

- [x] **P9-0** Grenzfälle (a/b/c) mit Nutzer klären. *(S)* — s.o. entschieden 2026-07-24.
- [x] **P9-1** `shell.js::renderRailInto` gefenstert (Vorgänger + aktiv + Nachfolger). *(S–M)* — Commit 48c1f91.
- [x] **P9-2** Verifikation (JSDOM-Stichprobe + Sicht). *(S)* — JSDOM grün;
  **Sicht (Stufe 5) offen** — nur nach ausdrücklicher Freigabe per Tipp.

---

## P10 — Fortschrittsleiste in der Top-Bar je nach Platz kürzen/strecken

Eingetragen 2026-07-24 nach Nutzervorgabe. Die Fortschrittsleiste
(`.chapter-progress-track`) ist heute **starr 130 px** (styles.css ~1612);
`.chapter-progress` hat `flex-shrink:0` (~683) und holt sich keinen Platz — der
Füllbalken (span) skaliert zwar prozentual, aber die Bahn bleibt immer 130 px
egal, wie viel Platz im `#header` (Flex-Zeile: Brand · Divider · Breadcrumb ·
Fortschritt · Pager · Toolbar) frei ist.

**Ziel:** Bahn je nach verfügbarem Platz strecken/kürzen (breit bei viel Platz,
schmal bei wenig, ggf. ausblenden im schmalen Tablet-Header).

**Ansatz (rein CSS, kein JS):** `.chapter-progress-track` von festem `width`
auf `flex: 1 1 auto` + `min-width`/`max-width`; `.chapter-progress` wachsen
lassen (`flex: 1 1 auto`, `flex-shrink` aufheben). Mindestbreite (~80 px)
schützt vor Kollaps; Media-Query blendet sie unterhalb einer Schwelle aus.
Konkurrenz mit Breadcrumb um den Rest-Platz beachten (evtl. Breadcrumb
mitschrumpfen lassen).

- [x] **P10-1** `styles.css`: Fortschrittsbahn flexibel (flex + min/max). *(S)*
- [x] **P10-2** Verifikation (Sicht, Stufe 5). *(S)* — vom Nutzer selbst vorgenommen, OK.

---

## P11 — Schmaler Header (≤ 1024 px): Brand verdichten + Width-Buttons S/M/L

Eingetragen 2026-07-24 nach Nutzervorgabe (P10 brachte optische Kollisionen im
schmalen Header ans Licht). Ab dem Tablet-Breakpoint (**≤ 1024 px**, zuvor
760 — Nutzervorgabe „früher greifen") wird der Header verdichtet:

- **Width-Mode-Buttons** „Schmal/Normal/Breit" → „S/M/L" (CSS-only: Text
  `font-size:0`, Buchstabe per `::after` + `[data-mode]`; Volltext bleibt im
  DOM für Screenreader, `title`-Tooltip erhalten).
- **Eyebrow** „FH Aachen · FB 8 · Physik" ausblenden.
- **Titel** zweizeilig „Interaktives / Skript v1.8" — bedingter `<br>` zwischen
  „Interaktives" und „Skript" (default `display:none`, bei ≤ 1024 px sichtbar).
- **Prototyp-Badge** ausblenden; **Version v1.8 bleibt** (Nutzerwahl).
- **„Text"-Wort** vor der Stufe („2/5") fällt ab ≤ 1024 px weg: `core.js`
  schreibt nur die Zahl, „Text" steckt in CSS `::before` (default sichtbar, am
  Breakpoint `content:""`). Kein Resize-Listener nötig.
  Author ist bei ≤ 1024 px bereits ausgeblendet.

- [x] **P11-1** `styles.css` 1024er Query: S/M/L + Brand-Verdichtung; `core.js`
  Stufen-Label reduziert; `::before` „Text"-Präfix. *(S)*
- [x] **P11-2** Verifikation (Sicht, Stufe 5). *(S)* — vom Nutzer selbst vorgenommen, OK.

---

## P12 — Komplett-Integration aller noch fehlenden v0.13-Inhalte (Rest-Skript)

Eingetragen 2026-07-24 nach Nutzervorgabe: *„plane im backlog kleinschrittig die
komplette integration aller noch fehlender inhalte aus dem pdf."* Ziel ist das
volle ~400-Seiten-Skript (v0.13, `Input/v0.13/Physik_pskript_v0.13.pdf`), nicht
nur die heutigen ~3 migrierten Abschnitte. Struktur des PDFs (aus
`Physik_pskript_v0.13.toc`): **4 Themenkomplexe** (`\chapter` 0–3) ·
**23 Sections** (`\section`) · **114 Subsections** (`\subsection`).

**Ist-Stand WIP (verifiziert 2026-07-24):**
- **TK 0 Grundlagen** — ✅ komplett migriert (`ch_00_grundlagen.html`, 0.0–0.6, s. P7).
- **TK 1 Mechanik** — 1.4 ✅ (`ch_01`), **1.5 ✅** (`ch_02`, 1.5.1–1.5.14 **vollständig**
  incl. 1.5.13 Rollbewegung mit 73 Gl. — *P4 ist veraltet, s. P12-0e*).
  **Fehlt:** 1.0, 1.1, 1.2, 1.3, 1.6, 1.7, 1.8.
- **TK 2 Elektromagnetismus** — ❌ komplett fehlt (2.0–2.3).
- **TK 3 Schwingungen und Wellen** — ❌ komplett fehlt (3.1 Schwingungen; 3.2 Wellen
  ist in v0.13 *selbst* nur ein **207-Byte-Stub** — `pskript_sw_wellen.tex` ist
  praktisch leer, s. P12-Wellen).
- **Quasi-Content** — ❌ Vorwort (`pskript_preface_v1_gmni`), Stichwort-Index
  (S.399, generiert), „Abbildungen und interaktive Animationen"-Übersicht (S.ii).

**Runbooks:** Prosa-Migration pro Abschnitt nach `MIGRATION_v0.13_nach_HTML.md`
bzw. Skill **v013-kapitel-migration**; interaktive Aspekt-Figuren nach
`INTERAKTIVE_ASPEKT_FIGUREN.md` (S. 0a: bestehende Figur kopieren + feature-gate,
nicht neu schreiben). **Jeder Abschnitt = eigene kleine Commit-Schritte**, Verifikation
pro Abschnitt nach Skill **v013-verifikation** (Soll/Ist deckungsgleich *pro
Subsection*, nicht nur in der Summe). **Nicht pushen** ohne Freigabe.

### P12-0 — Vorbedingungen / Blocker (vor erstem neuen Abschnitt)

- [x] **P12-0a Gleichungs-Präfix dynamisch** — ✅ bereits umgesetzt (war nie eine
  Konstante, CLAUDE.md-Notiz war veraltet). `numbering.js::renumber_equations`
  ermittelt den Präfix pro Seite aus dem Titel via `sectionPrefix` (`1.4.3 …` →
  `1.4`, `1.5.1 …` → `1.5`, `0.2.1 …` → `0.2`); zweiter MathJax-Lauf setzt die Tags.
  Verifiziert 2026-07-24: 1.4-Seiten → `1.4.n`, 1.5-Seiten → `1.5.n`, 0.x → `0.x.n`.
  CLAUDE.md-Stelle korrigiert. *(keine Arbeit angefallen)*
- [x] **P12-0b Abbildungs-Zähler pro Kapitel** — ✅ schon implementiert.
  `numbering.js::numberImages` zählt kapitelweit via `chapterPrefix` (v0.13:
  figure ohne `\numberwithin` → `{chapter}` → „Abb. 1.n"); chapter 0 ohne Präfix
  („Abb. 1"…), chapter 1 mit `data-figure-offset` (1.4=37→1.38, 1.5=60→1.61).
  Verifiziert via DOM-Harness: gerendert „Abb. 1 bis Abb. 1.72". Für TK 2 startet
  automatisch „Abb. 2.1" (neuer chapter, kein Offset nötig). *(keine Arbeit)*
- [x] **P12-0c Box-/Zusammenfassungs-Offsets** — ✅ schon implementiert.
  `offsetsFor` liest `data-zusammenfassung-offset` am h2; kapitelweiter
  Zusammenfassungs-Zähler. Verifiziert: „Zusammenfassung 0.1 bis 1.8"
  (ch_01 offset 3→1.4, ch_02 offset 7→1.8). Section-Box-Counter (Beispiel/Bemerkung/
  Wichtig/Aufgabe) section-scoped via `sectionPrefix`: „Beispiel 0.1.1 bis 1.5.1".
  *(keine Arbeit)*
- [x] **P12-0d TK-Metadaten neuer Kapitel** — ⏳ **kein Vorab-Blocker**, sondern
  Migrations-Schritt: pro neuem Kapitel `data-tk-num`/`data-tk-title` am
  `data-chapter`-Platzhalter in `index.html` setzen (P8-Mechanismus, schon bei
  ch_00/01/02 gezeigt). Fällt mit P12-A/B/C an, nicht vorher. *(keine separate Arbeit)*
- [x] **P12-0e P4 aufräumen** — ✅ erledigt (Commit 150c79d, s. P4 oben).
- [x] **P12-0f Querverweis-System kapitelfest** — ✅ schon implementiert.
  `resolveSecRefs`/`resolveFigRefs` laufen über `getPages()` dokumentenweit,
  `resolve_eq_refs` über MathJax `allLabels`. Verifiziert: ch_02 hat 13
  kapitelübergreifende Verweise (1.5→1.4); DOM-Harness 14/14 fig + 6/6 sec
  aufgelöst (eq-refs erst im Browser mit MathJax). *(keine Arbeit)*

> **Ergebnis 2026-07-24:** Die gesamte P12-0-Vorbedingungsliste ist **kein
> Blocker** — 0a/b/c/f waren bereits umgesetzt (teils auf veralteten
> CLAUDE.md-Notizen basierend), 0d ist Migrations-Schritt, 0e erledigt. Die
> Migration des nächsten Abschnitts kann direkt starten. Beim ersten neuen
> Themenkomplex (TK 2) einmal den DOM-Harness laufen lassen, um „Abb. 2.1"/
> „Beispiel 2.1.1"/„2.1.n"-Gleichungen live zu bestätigen.

### P12-A — TK 1 Mechanik: restliche Sections (in `ch_01` ergänzen oder eigene Dateien)

*Granularität wie ch_00/ch_01: ein `ch_NN`-File pro Themenkomplex; Sections als h2,
Subsections als h3. Da ch_01 heute nur 1.4 hält, 1.0–1.3/1.6–1.8 entweder ch_01
ergänzen oder neue `ch_01b_*`/nach Topic splitten — vor P12-A1 entscheiden.*

- [x] **P12-A0 1.0 Einleitung und Motivation** — 0 Subsections, 0 Abb.
  (`pskript_mech_einleitung_und_motivation_gmni.tex`, 676 B). *(S)* — migriert
  2026-07-24 (Commit 908555c): `chapters/ch_01_00_einleitung.html`, Platzhalter
  in `index.html`, Offset-Startwerte vom 1.4-h2 an den 1.0-h2 verschoben.
  DOM-Harness: Seiten 40→41, keine Regression (Abb 1.72, Zusammenfassung 1.8,
  Boxen 1.4–1.5 unverändert). Stufe 5 (Sicht) offen — Freigabe „JA".
- [ ] **P12-A1 1.1 Kinematik** — 14 Subsections, **21 Abbildungen**
  (`pskript_mech_kinematik_gmni_v4.tex`, 104 KB). *Größter Brocken nach 1.5.13 —
  eigene Sitzung(en).* Interaktiv-Kandidaten: `geschwindigkeit_simulation`,
  `grundbegriffe_kinematik_simulation`, `freier_fall_simulation`,
  `schraeger_wurf_simulation`. *(XL)*
- [ ] **P12-A2 1.2 Dynamik – Impuls und Kraft** — 12 Subsections, 10 Abb.
  (`pskript_mech_dyn_kraft_impuls_gmni_v3.tex`, 74 KB). Kandidaten: `atwood_simulation`,
  `3massen_umlenkrollen_simulation`. *(L)*
- [ ] **P12-A3 1.3 Dynamik – Arbeit, Leistung und Energie** — 7 Subsections, 7 Abb.
  (`pskript_mech_dyn_energie_arbeit_gmni_v3.tex`, 53 KB). Kandidat: `atwood_energy_simulation`.
  *(L)*
- [ ] **P12-A4 1.6 Bezugsysteme und Scheinkräfte** — 3 Subsections, 1 Abb.
  (`pskript_mech_bezugsysteme_und_scheinkraefte.tex`, 41 KB). **Maßgeblich ist das
  Original** (`pskript_mech_bezugsysteme_und_scheinkraefte.tex`, 1 Abb.) — es ist
  die im PDF integrierte Version (`Physik_pskript_v0.13.tex` Z. 83). Die
  `_v2gmni`-Variante (38 KB, 0 Abb.) wird vom Hauptdokument **nicht** geladen und
  ist nicht maßgeblich (verifiziert 2026-07-24). *(M)*
- [ ] **P12-A5 1.7 Elastische und inelastische Stöße** — 2 Subsections, 0 Abb.
  (`pskript_mech_dyn_stoesse.tex`, 17 KB). Kandidat: `stoss_simulation`. *(M)*
- [ ] **P12-A6 1.8 Gravitation** — 5 Subsections, 0 Abb.
  (`pskript_mech_gravitation_v1.tex`, 22 KB). *(M)*

### P12-B — TK 2 Elektromagnetismus (neu, `ch_03_*.html`, `data-tk-num="2"`)

- [ ] **P12-B0 2.0 Einleitung und Motivation** — 0 Subsections, 0 Abb.
  (`pskript_em_einleitung_und_motivation.tex`, 2.3 KB). *(S)*
- [ ] **P12-B1 2.1 Grundlagen der Elektrizitätslehre** — 14 Subsections, 0 Abb.
  (`pskript_em_grundlagen_der_elektrizitaetslehre.tex`, 39 KB). Viele
  Schaltpläne/Symbole — prüfen ob als SVG-Icons oder PNG. *(L)*
- [ ] **P12-B2 2.2 Elektrostatik** — 10 Subsections, 0 Abb.
  (`pskript_em_elektrostatik.tex`, 52 KB). Felder/Dipole — Vektorfeld-Plot-Kandidat?
  *(L)*
- [ ] **P12-B3 2.3 Elektrodynamik und Magnetismus** — 7 Subsections, 3 Abb.
  (`pskript_em_elektrodynamik_und_magnetismus.tex`, 71 KB). Kandidat:
  `lorentz_force_simulation`. *(L)*

### P12-C — TK 3 Schwingungen und Wellen (neu, `ch_04_*.html`, `data-tk-num="3"`)

- [ ] **P12-C0 3.0/3.1 Einleitung und Motivation** — (`pskript_sw_einleitung_und_motivation.tex`,
  3.2 KB). **TOC-Bug in v0.13:** „Einleitung" und „Schwingungen" sind *beide* als
  „3.1" nummeriert — Nummerierung beim Migrieren korrigieren (3.0 vs 3.1). *(S)*
- [ ] **P12-C1 3.1 Schwingungen** — 9 Subsections, 0 Abb.
  (`pskript_sw_schwingungen.tex`, 42 KB). Kandidat: `federpendel_simulation`. *(L)*
- [ ] **P12-C2 3.2 Wellen** — `pskript_sw_wellen.tex` = **207 Byte Stub** — in v0.13
  *selbst* kein Inhalt. **Nutzervorgabe (2026-07-24): Platzhalter erstellen.** Bei
  der TK-3-Migration wird 3.2 als sichtbarer Platzhalter-Standort angelegt (Section-
  Heading + Hinweis „Inhalt folgt / in v0.13 nicht enthalten"), nicht leer gelassen.
  `wellen_simulation` liegt bereit — später als interaktive Figur (P12-E7)
  einbinden, sobald der Inhalt steht. *(M)*

### P12-D — Quasi-Content

- [ ] **P12-D1 Vorwort/Preface** — (`pskript_preface_v1_gmni.tex`, 4.6 KB). Vor
  TK 0 einbinden? *(S)*
- [ ] **P12-D2 „Abbildungen und interaktive Animationen"-Übersicht** (S.ii) —
  Index der Abb./Animationen. Generieren aus Figuren-Registry. *(S)*
- [ ] **P12-D3 Stichwortverzeichnis/Index** (S.399) — `makeindex`-Output aus v0.13;
  im WIP statisch nachtippen oder generieren. *(M)*

### P12-E — Interaktive Figuren aus `Input/Simulationen/` (gekoppelt, pro Abschnitt)

*Pro Figur: Stand-alone-Sim portieren (wie `kreisbewegung/` → gc10) ODER als
Aspekt-Figur feature-geated (s. `INTERAKTIVE_ASPEKT_FIGUREN.md`). Entscheidung
pro Figur anhand Runbook-Vorlagenhierarchie [[feedback-vorlagen-hierarchie]].*

- [ ] **P12-E1** 1.1: `geschwindigkeit` / `grundbegriffe_kinematik` / `freier_fall` /
  `schraeger_wurf`. *(L)*
- [ ] **P12-E2** 1.2/1.3: `atwood` / `atwood_energy` / `3massen_umlenkrollen`. *(L)*
- [ ] **P12-E3** 1.5.13 Rollbewegung: `rolling_bodies` (in ch_02 nachrüsten). *(M)*
- [ ] **P12-E4** 1.7: `stoss`. *(M)*
- [ ] **P12-E5** 2.3: `lorentz_force`. *(M)*
- [ ] **P12-E6** 3.1: `federpendel`. *(M)*
- [ ] **P12-E7** 3.2: `wellen` (nach P12-C2-Klärung). *(M)*
- [ ] **P12-E8** Hilfs-Sims: `ableitung`, `lineal`, `kreis_spiralbewegung` —
  Zuordnung prüfen. *(S)*

### P12-F — Asset-Pipeline (Bilder)

`PSkriptBilder/` hat 126 Dateien (28 PDF · 31 SVG · 53 PNG). Für die fehlenden
Mechanik-/EM-Abschnitte ca. **42 `\includegraphics`** (1.1=21, 1.2=10, 1.3=7,
1.6=1, 2.3=3).

- [ ] **P12-F1** PDF-Figuren → PNG (`pdftocairo -png -r 300`, s. MIGRATION-Runbook)
  pro Abschnitt vor der Transkription.
- [ ] **P12-F2** SVG-Figuren direkt übernehmen oder nach PNG? (Vektor vs. Bitmap —
  einmalig entscheiden, konsistent halten).
- [ ] **P12-F3** Magic-Byte-Prüfung jeder kopierten Bilddatei („PDF in .png" ist
  ein echter Fallstrick, s. MIGRATION-Katalog).

### P12-G — Pro-Abschnitt-Verifikation & Abschluss

- [ ] **P12-G1** Pro Abschnitt: Stufe 1 (PDF) vs. Stufe 2 (MathJax offline)
  deckungsgleich — Gl./Box/Abb-Zahlen via `referenznummern.py` pro Section.
- [ ] **P12-G2** Stufe 3 (DOM-Harness): Seitenzahl, Abbildungsnummerierung,
  Box-Reset, Fußnoten.
- [ ] **P12-G3** Stufe 5 (Browser-Sicht) — **nur nach Freigabe mit dem Wort „JA"**
  ([[feedback-screenshot-freigabe]]); oft vom Nutzer selbst vorgenommen.
- [ ] **P12-G4** Gesamtabschluss: TOC 3-stufig vollständig (TK 0–3), Breadcrumb,
  Schiene, Querverweise kapitelfest; Druckpfad (alle Seiten); Index.

---

## P13 — Text- & Formel-Marker für Studierende (4 Farben, persistent)

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt**). Studierende sollen im Skript markieren wie mit einem
Textmarker — jedoch mit **Lock auf ganze Wörter** (Text) bzw. **eine
Formelzeile** (Formel) und **persistent** (über Seitenlade-Reload hinaus).

**Anforderungen (Nutzervorgabe):**
- **Vier Farben wählbar:** Neon-Gelb, Neon-Grün, Neon-Rosa, Hellblau.
  („Neon" = leuchtende, helle Akzentfarben — sollen auf hell wie dunkel
  lesbar bleiben, s. Darkmode-Note.)
- **Text markieren:** Auswahl einer Farbe, dann Markierung auf ein **ganzes
  Wort** als „Lock" (nicht beliebiges Zeichen-Substring). „Lock" meint
  vermutlich: einmal gesetzt → fest verankert; idealerweise **alle Vorkommen
  desselben Wortes** im Skript werden in dieser Farbe markiert (globales
  Wort-Lock) — *Klärung nötig, s.u.*
- **Formel markieren:** Auswahl einer Farbe, dann Markierung auf **eine
  Formelzeile** als Lock (eine nummerierte Gleichung bzw. align-Zeile als
  Ganzes, nicht Teil-Ausdruck); analog vermutlich **alle Instanzen derselben
  Gleichung** (gleiche Nummer/`\label`).
- **Persistent:** Markierungen überleben einen Reload (Browser-Gerät, kein
  Server/Login) — `localStorage`. Scope: pro Skript/Dokument (nicht pro URL-
  Parameter). Beim Druck (print.js) Verhalten klären: Markierungen drucken?

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Wort-Lock-Bedeutung:** alle Vorkommen desselben Wortes skriptweit (global)
   oder nur das eine angeklickte Wort? „Lock" + „ganze Wort" legt global nahe,
   aber das kann bei häufigen Wörtern („die", „der", „Masse") sehr laut
   werden — ggf. Mindestlänge / Nur-Substantive-Filter nötig.
2. **Formel-Lock-Bedeutung:** alle Instanzen derselben Gleichung (gleiche
   Nummer/`\label`) oder nur die eine angeklickte Formelzeile?
3. **Auswahl-UI:** Palette als Toolbar-Button „Markieren" + Farbauswahl
   (neben Textgröße/Breite), oder Kontext-Aktion bei Selektion/Klick auf
   Wort/Formel? Aktivierungsmodus (erst Farbe wählen, dann klicken vs.
   Klick → Menü → Farbe)?
4. **Entfernen / Überschreiben:** Wie wird eine Markierung wieder entfernt?
   Nochmal-Klick? Eigene „Löschen"-Aktion? Farbe neu wählen = überschreiben?
5. **Persistenz-Scope & Menge:** localStorage-Schlüsselstruktur; bei sehr
   vielen Markierungen Performance/Grenze (~5 MB) — ggf. warnen.
6. **Darkmode:** Neon-Farben müssen auf `--bg` (hell) UND `--bg-dark` (dunkel)
   lesbar sein; ggf. pro Modus leicht andere Deckkraft/Mischung.
7. **Interaktive Figuren / Slider:** Marker nur im Prosa-/Formel-Text oder
   auch in Aspekt-Figuren? (Empfehlung: nur Prosa + statische Formeln, nicht
   in live-SVG — zu instabil.)

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Modul:** neues ESM `src/marker.js`, side-effect-importiert von `main.js`
  (wie Figuren), registriert sich nach `loadChapters`+`paginate`+Typeset.
  Zentrale `data-action`-Binder-Erweiterung (keine Inline-Handler, s.
  CLAUDE.md): z. B. `data-action="marker_select_color"` + `data-color="…"`,
  `data-action="marker_toggle"` fürs Wort/Formel.
- **Wort-Lock:** Klick auf ein Wort im Prosa-`<p>` → `textContent`-Wort
  grenzflächen-bewusst einhüllen (`<mark class="marker" data-color="…">…</mark>`),
  NICHT innerHTML-Split (zerstört MathJax-/HTML-Struktur). Identifikation
  „gleiches Wort": normalisierter Token-Vergleich; nur Prosa-`<p>`/`<li>`,
  nicht Box-Titel/Überschriften/MathJax. Wortgrenzen per `Intl.Segmenter`
  oder Whitespace/Interpunktions-Split.
- **Formel-Lock:** nummerierte Gleichung = `<mjx-container>` mit
  `[data-mml-node="mlabeledtr"]` (s. numbering.js — dieselbe Markierung wie
  beim Gleichungszählen). Lock-Key = Gleichungsnummer (z. B. „1.4.12") aus
  `window.eq_tag_map` oder MathJax-Tag. Markierung = umgebender
  `<mjx-container>`-Klasse oder Hintergrund-Wrapper, NICHT in die MathML-
  Struktur eingreifen.
- **Persistenz:** `localStorage["skript_markers"]` = `{woerter:{gelb:[…],
  gruen:[…],…}, formeln:{gelb:["1.4.12",…],…}}`. Re-Apply nach Reload +
  nach jedem `reload_mathjax()` (re-typeset zerstört die Wrapper — Hook in
  core.js/numbering.js-Brücke, wie `window.renumber_equations`).
- **Skalierbarkeit (hard constraint, s. CLAUDE.md):** kein per-Wort-
  Event-Listener (O(Anzahl Wörter)) — ein delegierter Klick-Listener auf
  `#paper` prüft `e.target` Nähe zu Wort/Formel. Farben als CSS-Variablen
  auf `.marker[data-color="…"]` (4 Regeln, nicht 4×N). Darkmode-Schalter
  reicht via `:root[data-darkmode] .marker[data-color=…]`.
- **Druck:** in `print.js::print_page`-Klon Markierungen erhalten oder
  entfernen? Nutzer fragen; Default: erhalten (Studierende drucken ihre
  Markierungen mit).

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P13-0 Klärung** — die 7 offenen Fragen mit Nutzer klären, Ergebnis
  hier festhalten. *(S)*
- [ ] **P13-1** `src/marker.js` Grundgerüst: 4 Farben als CSS-Variablen +
  `.marker`-Styling (styles.css/darkmode.css), side-effect-Import in
  `main.js`, Aktivierungsmodus. *(S–M)*
- [ ] **P13-2** Wort-Lock: delegierter Klick-Listener, Wortgrenzen,
  `<mark>`-Einhüllung ohne Strukturzerstörung, globale-vs-lokale Semantik
  (nach P13-0). *(M)*
- [ ] **P13-3** Formel-Lock: Gleichungszeilen-Identifikation via
  `[data-mml-node="mlabeledtr"]`/eq_tag_map, Wrapper ohne MathML-Eingriff. *(M)*
- [ ] **P13-4** Persistenz: localStorage-Schema, Re-Apply nach Reload +
  nach `reload_mathjax()` (Hook). *(M)*
- [ ] **P13-5** Auswahl-UI: Palette (Toolbar oder Kontext) +
  `data-action`-Einbindung, Entfernen/Überschreiben. *(S–M)*
- [ ] **P13-6** Darkmode + A11y (Tastatur, Kontrast Neon vs. bg, kein
  Slider-Konflikt). *(S)*
- [ ] **P13-7** Druckpfad (erhalten/entfernen nach P13-0). *(S)*
- [ ] **P13-8** Verifikation: DOM-Harness (Markierungen verändern
  Seitenzahl/Gl.-Nummern NICHT — kein Regression in numbering.js!) +
  Sicht (Stufe 5, Freigabe „JA"). *(M)*

### P13-N — Notizbuch (begleitend zur Markierfunktion)

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt — muss noch gut ausgearbeitet werden**, s.u.). Ein
**Notizbuch** als Begleiter zur Markierfunktion (P13): Markierungen sollen
**initial in ein Notizbuch übertragen** werden können. Die Idee ist
bewusst noch roh — Ausarbeitung folgt später (Klärung mit Nutzer).

**Erste Stichpunkte (roh, wie vorgegeben):**
- **Notizbuch-Ansicht** im Skript: eine zusätzliche UI (ähnlich TOC/Kontakt
  — Vollbild oder Seitenleiste?), in der gesammelte Markierungen als
  Einträge erscheinen.
- **Übertrag aus Markierungen:** eine Markierung (Wort-Lock oder Formel-
  Lock in einer der vier Farben) kann „ins Notizbuch" übernommen werden —
  als Eintrag mit Kontext (Seiten-Verweis/Zitat, Farbe, ggf. eigener
  Freitext-Notiz dazu).
- **Persistent:** wie P13 über `localStorage`; Notizbuch = eigene Daten-
  Sektion (Markierungen bleiben Markierungen, Notizbuch bleibt Notizbuch —
  oder werden Markierungen nach Übertrag „verbraucht"? *Klärung nötig.*)
- **Eigene Notizen:** neben reinen Markierungs-Überträgen vermutlich auch
  freie Notizen (Studierende schreiben eigene Einträge ohne Markierung)?
  *Klärung nötig.*

**Offene Klärungsfragen (vor Ausarbeitung mit Nutzer klären — nicht jetzt):**
1. **Verhältnis Markierung ↔ Notizbuch:** ist das Notizbuch eine *Kopie*
   der Markierungen (Markierungen bleiben bestehen) oder ein *Ablage*-
   Ziel (Markierung wird „verschoben" / beim Übertrag entfernt)?
2. **Freitext-Notizen:** nur Überträge aus Markierungen, oder auch eigene
   Einträge ohne Markierung (reines Notizbuch)?
3. **Eintrags-Form:** was steht pro Eintrag? Wort/Formel-Text + Seiten-
   verweis + Farbe + Freitext? Springt ein Klick zurück zur Quell-Stelle?
4. **Ansicht-Ort:** eigene Toolbar-Taste „Notizbuch" (Vollbild wie TOC) oder
   Seitenleiste/Drawer? Beziehung zum bestehenden Drawer (P8)?
5. **Bearbeiten/Löschen:** Einträge nachträglich änderbar/löschbar? Sortier-
   bar (nach Farbe, Section, Datum)?
6. **Export:** Export als PDF/Text/Markdown (z. B. für Lernzettel)? Drucken
   über den bestehenden Druckpfad (print.js) — nur Notizbuch oder ganzes
   Skript + Notizbuch-Anhang?
7. **Persistenz-Menge:** Notizbuch + Markierungen zusammen in localStorage
   (~5 MB-Grenze, s. P13 Frage 5) — bei viel Text schnell voll; ggf.
   Kürzung/Export-Warnung.
8. **Skalierbarkeit:** delegierter Aufbau wie P13 (keine per-Eintrag-
   Listener); Notizbuch erst beim Öffnen aus localStorage rendern.

**Ansatz-Ideen (zur späteren Planung, NICHT umgesetzt):**
- **Modul:** neues ESM `src/notizbuch.js`, side-effect-importiert von
  `main.js`; nutzt dieselben `data-action`-Binder wie P13 (z. B.
  `data-action="notizbuch_open"`, `data-action="marker_to_notizbuch"`).
- **Daten:** `localStorage["skript_notizbuch"]` = `[einträge…]`, Eintrag =
  `{typ:'wort'|'formel'|'frei', text, section, farbe?, notiz?, angelegt}`.
- **Ansicht:** analog TOC (`ui.js::toc`) — Vollbild-Screen mit eigener Bar,
  Eintrags-Liste, pro Eintrag Aktionen (springen/bearbeiten/löschen).
- **Druck:** `print.js::print_page` erweitern: Option „Notizbuch drucken"
   (Klon des Notizbuch-Screens statt/zusätzlich zum Skript) — analog
   bestehendem `showAllPagesForPrint`.
- **A11y:** Notizbuch-Taste als `<button type="button" aria-label="…">`
  (wie alle Toolbar-Controls, s. CLAUDE.md); Tastatur bedienbar.

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P13-N0 Ausarbeitung & Klärung** — die 8 offenen Fragen mit Nutzer
  klären, Konzept verfestigen, Ergebnis hier festhalten. *(M)*
- [ ] **P13-N1** `src/notizbuch.js` Grundgerüst + Ansicht (Vollbild wie
  TOC) + `data-action`-Einbindung + Toolbar-Taste. *(M)*
- [ ] **P13-N2** Übertrag Markierung → Notizbuch (Eintrag mit Kontext/
  Quell-Verweis; Semantik nach P13-N0). *(M)*
- [ ] **P13-N3** Freie Notizen (falls nach P13-N0 gewünscht): Eingabe-
  Form, Speicherung. *(S–M)*
- [ ] **P13-N4** Eintrags-Aktionen: zur Quelle springen, bearbeiten,
  löschen, sortieren/filtern (nach Farbe/Section). *(M)*
- [ ] **P13-N5** Persistenz + Export (Markdown/Text/PDF); Druckpfad-
  Erweiterung. *(M)*
- [ ] **P13-N6** Verifikation: DOM-Harness + Sicht (Stufe 5, Freigabe
  „JA"). *(M)*

---

## P14 — Formel-Überstand je Width-Modus prüfen & beheben (schmal/normal/breit)

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt**). Das Dokument soll in **allen Width-Modi**
(schmal/normal/breit, s. `core.js::set_width_mode`) nach **Kandidaten-
Formeln** durchsucht werden, die über den Rand des **Schreibbereichs**
(`#paper` / `#content`) **herausragen** — **insbesondere, wenn die
Gleichungsnummerierung (Tag) übersteht, aber nicht ausschließlich** (also
auch Formelkörper selbst, lange `\frac`/Brüche, `\underbrace`-Texte etc.).
Die Darstellung dieser Formeln muss **modussensitiv überarbeitet** werden,
damit **kein Herausragen** mehr auftritt.

**Anforderungen (Nutzervorgabe):**
- **Automatische Suche** nach Kandidaten-Formeln im ganzen Dokument
  (alle Kapitel, nicht nur 1.4/1.5).
- **Alle drei Width-Modi** prüfen: schmal (schmalste Spalte → höchste
  Überstands-Wahrscheinlichkeit), normal, breit.
- **Kriterien:** (a) Tag/Nummerierung ragt über den Schreibbereich-Rand,
  (b) Formelkörper selbst ragt über (auch ohne Tag-Problem), (c) ggf.
  weitere (z. B. inline-Formel in zu schmaler Zeile).
- **Modussensitive Behebung:** pro problematischer Formel eine Lösung,
  die im jeweiligen Modus greift — keine globale Verbredung, die im breit-
  Modus dann zu viel Luft lässt.

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Schreibbereich-Rand = was genau?** `#content` inline-width (set per
   `set_width_mode`) oder `#paper` (`--paper-max-width`)? Tag-Ragt-über
   bezieht sich vermutlich auf die sichtbare Textspalte (`#content` width
   abzüglich Padding). Klären, welchen Kasten messen.
2. **Behebungs-Strategien (welche bevorzugt der Nutzer?):**
   - Tag umbrechen/zweizeilig? (MathJax macht Tags normalerweise rechts;
     bei Überstand ggf. Tag nach unten oder `tagstyle` ändern).
   - Formel verkleinern (`\small`/`\scriptstyle` per MathJax-CSS im Modus)?
   - Formel umbrechen (`\\` in align, oder automatischer Zeilenumbruch)?
   - horizontal scrollbar im Container (unschön, eher nicht)?
   - Schreibbereich im Modus minimal verbreitern (verändert aber die
     Mode-Semantik — eher nicht)?
   Pro Formel wahrscheinlich Einzelfall-Entscheidung; ist eine globale
   Heuristik gewünscht (z. B. „über 95 % Spaltenbreite → automatisch
   `\small`") oder manuelle Einzelfall-Korrektur pro Formel?
3. **Kandidaten-Suche — automatisiert?** Ein Skript (z. B. im Screenshot/
   DOM-Harness, headless Chromium pro Width-Modus) misst jede
   `mjx-container[display="true"]`-`getBoundingClientRect().right` gegen
   `#content.getBoundingClientRect().right` und listet Übersteher. Soll
   dieses Werkzeug dauerhaft ins Repo (Verifikations-Skill) oder nur
   einmalig zur Inventur?
4. **Gilt auch für inline-Formeln** `\(...\)` (nicht nur Display)?
   Vermutlich ja, aber Fokus lag auf nummerierten Display-Gleichungen.
5. **Darkmode:** Überstand ist modus-, nicht farbabhängig — aber Behebung
   darf nicht die Neon-/Tag-Lesbarkeit (P13-Konflikt?) stören.
6. **Druck:** Druckspalte ist fix 700 px (print.js) — separat prüfen oder
   wird Druck aus dem breit-Modus-Klon ohnehin eng genug?

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Inventur-Werkzeug:** Erweiterung des bestehenden Screenshot-Skills
  (`.claude/skills/.../figur_screenshot.mjs`, playwright-core) oder des
  DOM-Harness (`.claude/skills/v013-verifikation/scripts/dom_harness.mjs`):
  pro Width-Modus Seite laden, alle `mjx-container[display=true]` +
  deren `.mjx-mtr`/Tag-Elemente vermessen, Übersteher (`right > rand +
  Toleranz`) auflisten mit Formel-Text/Tag/Seite. Output = Tabelle.
- **Modussensitive CSS-Regeln** (s. CLAUDE.md Width-Mode-Decoupling):
  `:root[data-width-mode="schmal"] …` gezielt problematische Formeln via
  data-Attribut/`\label`-Marker ansprechen (z. B. `data-formel-
  overflow`), dort `\small`-Äquivalent (MathJax-CSS-Skalierung) oder
  Zeilenumbruch. **Nie** globale `.mjx-container{font-size:…}` (skaliert
  alle, auch harmlose).
- **Pro-Formel-Markierung:** problematischen Formeln im Quell-HTML ein
  `data-…`-Merkmal geben, damit die modussensitive Regel sie greift —
  O(1) pro Formel, skalierbar (CLAUDE.md hard constraint).
- **Tag-Überstand separat:** MathJax-Tag liegt in `.mjx-mtext`/`.mjx-tlist`;
   wenn nur der Tag übersteht, ist die sauberste Lösung oft die Formel
   selbst (Box) so zu verengen, dass der Tag in die Spalte passt — oder
   das Tag-Layout anzupassen. Vorab klären, ob Tags überhaupt umbrechen
   dürfen.

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P14-0 Klärung** — die 6 offenen Fragen mit Nutzer klären
  (insb. Behebungs-Strategie & Inventur-Werkzeug-Dauerhaftigkeit),
  Ergebnis hier festhalten. *(M)*
- [ ] **P14-1 Inventur-Werkzeug** — headless-Chromium-Messung pro
  Width-Modus, listet Übersteher (Formel + Tag). *(M)*
- [ ] **P14-2 Inventur** — alle Kapitel/Modi durchmessen, Kandidaten-
  Liste erstellen (Markdown-Tabelle), mit Nutzer abstimmen. *(M)*
- [ ] **P14-3 Behebung** — pro Kandidat modussensitive Regel
  (data-Merkmal + `:root[data-width-mode=…]`-CSS); Einzelfall n. P14-0. *(L)*
- [ ] **P14-4 Verifikation** — Inventur-Werkzeug wiederholt: 0
  Übersteher in allen Modi; DOM-Harness (keine Seiten-/Nummern-
  Regression); Sicht (Stufe 5, Freigabe „JA"). *(M)*

---

## P15 — Weiße Hintergründe aus Nicht-Foto-Abbildungen entfernen

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt**). Alle **Abbildungen, die keine Fotos sind** (also
Diagramme, TikZ-Plots, Schemazeichnungen, gerenderte Grafiken), sollen ihren
**weißen Hintergrund entfernt bekommen**, wenn sie einen solchen haben.
Ziel: auf nicht-weißen Untergründen (Darkmode, farbige Boxen) keine weißen
Kacheln; Linien/Punkte bleiben sichtbar, der Hintergrund wird transparent.

**Anforderungen (Nutzervorgabe):**
- **Nur Nicht-Foto-Abbildungen** — Fotos behalten ihren Hintergrund (sie
  sind reale Bilder, kein zeichenbares Diagramm). Unterscheidung
  Foto vs. Diagramm nötig (s. Klärung).
- **Bedingung:** „wenn sie einen weißen Hintergrund haben" — nur dann
  entfernen; Grafiken mit schon transparentem Hintergrund unangetastet.
- **Ergebnis:** weißer Hintergrund → transparent; Vordergrund (Linien,
  Achsen, Schrift, Flächenfarben) bleibt.

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Foto vs. Nicht-Foto — Kriterium?** Manuelle Liste/Markierung (z. B.
   `data-photograph="true"` auf den `<img class="grafik">`/`<figure>`),
   Dateinamenskonvention, automatische Erkennung (Histogramm: viele
   Farbtöne + kein weißer Rand = Foto)? Vermutlich manuelle Markierung
   am robustesten (CLAUDE.md: Figuren kommen aus `bilder/`, Anzahl
   überschaubar). Klären, welche Abbildungen Fotos sind.
2. **„Weiße" Definition:** exakt `#FFFFFF`? Oder near-white (Helligkeit
   > Schwellwert, geringe Sättigung)? Schwellwert robust gegen Anti-
   Aliasing-Kanten wählen.
3. **Verfahren — pro Bild:**
   - **PNG-Transparenz:** Weiß → alpha=0 (Bildverarbeitung, einmalig:
     `convert input.png -fuzz X% -transparent white output.png` o. Ä.).
     Neue Dateien ins `bilder/`-Verzeichnis (CLAUDE.md: TikZ-Figuren
     ohnehin PNG aus `pdftocairo`).
   - **Oder CSS-Mischung:** `mix-blend-mode:multiply` (weiß → transparent
     gegen Hintergrund, aber *alle* Farben werden multipliziert —
     riskant in farbigen Boxen/Darkmode). Vermutlich echte PNG-Transparenz
     sauberer.
   - **Oder SVG:** wenn Quelle SVG (nicht TikZ→PNG), `background`-Rect
     entfernen.
4. **Darkmode-Verträglichkeit:** mit transparentem Hintergrund zeigt die
   Grafik im Darkmode auf dunklem Untergrund — sind die Linien dann noch
   sichtbar (schwarz auf dunkel)? Ggf. muss für Darkmode eine invertierte
   Variante oder CSS-Filter (`filter: invert(1)`) auf Diagramme —
   Klären, ob das im Wunsch enthalten ist oder nur die Hintergrund-
   Entfernung gewollt ist (Linienproblematik als eigener Punkt).
5. **Bestehende Figuren vs. künftige:** gilt für alle heutigen `bilder/`-
   PNGs und auch für künftige (P12-Migration bringt viele neue)?
   Pipeline-Regel (ähnlich MIGRATION_v0.13) festhalten.
6. **`make_static`-Pfad:** die statischen Abbildungen kommen via
   `core.js::make_static` als `<img class="grafik">`. Stelle sicher, dass
   die transparenten Varianten auch dort geladen werden.

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Inventur:** alle `bilder/*.{png,svg}` + alle `<img class="grafik">`
  (und `figure.abbildung > img`) auflisten; Foto/Diagramm klassifizieren
  (P15-0); für Diagramme prüfen, ob weißer Hintergrund vorhanden.
- **Bildverarbeitung** (einmalig, lokal): PNG-Transparenz via ImageMagick
  (`-transparent white` mit `-fuzz`) oder Python/Pillow (near-white →
  alpha); Original behalten (Suffix `_orig` oder Unterordner) bis
  Verifikation. Keine Datei ohne Backup überschreiben.
- **Markierung:** Fotos bekommen `data-photograph="true"` im Quell-HTML
  (oder eine CSS-Klasse), damit klar ist, welche unangetastet bleiben.
- **Pipeline-Regel:** in `MIGRATION_v0.13_nach_HTML.md`/Asset-Pipeline
  (P12-F) festhalten: Nicht-Foto-PNGs mit transparentem Hintergrund
  abliefern.
- **Darkmode-Follow-up** (eigener Punkt nach P15-0): wenn Linien im
  Darkmode unsichtbar werden, `:root[data-darkmode] img.grafik` (nur
  Diagramme) per CSS-Filter invertieren oder separate Dark-Variante.

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P15-0 Klärung** — die 6 offenen Fragen mit Nutzer klären
  (insb. Foto-Liste & Verfahren PNG-Transparenz vs. CSS), Ergebnis hier
  festhalten. *(M)*
- [ ] **P15-1 Inventur** — alle `bilder/`-Abbildungen + Klassifikation
  (Foto/Diagramm) + hat-weiß-Bg? *(S–M)*
- [ ] **P15-2 Foto-Markierung** — `data-photograph`/Klasse auf Fotos
  im Quell-HTML (alle Kapitel). *(S)*
- [ ] **P15-3 Transparenz** — pro Diagramm mit weißem Bg PNG-Transparenz
  erzeugen (Backup, ImageMagick/Pillow), `bilder/` ersetzen. *(M)*
- [ ] **P15-4 Darkmode-Follow-up** — ggf. CSS-Filter/Invert-Variante für
  Diagramme im Darkmode (nur falls P15-0 als nötig erachtet). *(S–M)*
- [ ] **P15-5 Pipeline-Regel** — in MIGRATION_v0.13 / P12-F aufnehmen:
   Nicht-Foto-PNGs transparent abliefern. *(S)*
- [ ] **P15-6 Verifikation** — Sicht in hell + dunkel auf mehreren
  betroffenen Abbildungen (Stufe 5, Freigabe „JA"); keine weißen Kacheln
  mehr auf farbigen Boxen/Darkmode. *(M)*

---

1. Erst **P0** abarbeiten (rasch, niedriges Risiko, senkt schon das Token-Volumen spürbar).
2. Dann **Per-Figure-Fabrik + Modularisierung + Globals einfrieden** (P1) als zusammenhängender Struktur-Refactor — das ist der zentrale Hebel für Token-Effizienz und Wartbarkeit; danach sind Animation (rAF) und DOM-Optimierung günstig in der Fabrik mitzuerledigen.
3. **P2** anschließend/parallel je nach Bedarf (Mobile/A11y).

Vor jedem Struktur-Refactor: Legacy-Ordner als Referenz sicher, Änderungen im Browser pro Figur verifizieren (`python3 -m http.server` aus `InteraktivesSkript_WIP/`).