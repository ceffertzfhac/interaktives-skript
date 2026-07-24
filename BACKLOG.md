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

## P4 — Abschnitt 1.5 fertig migrieren (v0.13 „Dynamik der Drehbewegung und Rotation starrer Körper")

Angefangen in `chapters/ch_02_dynamik_drehbewegung.html`. **Fertig:** Intro,
1.5.1 Motivation, 1.5.2 Starre Körper. **Angefangen:** 1.5.3 (4 von 8 Gleichungen).
Die elf restlichen Unterabschnitte tragen im Kapitel eine sichtbare
„noch nicht migriert"-Box, damit kein Teilstand als fertig durchgeht.

Die Vorarbeiten sind erledigt und blockieren nicht mehr: alle 13 Abbildungen
liegen in `bilder/` (inklusive der nachgelieferten Kippbedingungs-Bilder), das
Formelpräfix zählt pro Abschnitt, MathJax lädt das `physics`-Paket für
`\dd`/`\eval`. Vorgehen und Werkzeuge: Skill **v013-kapitel-migration**,
Hintergrund in `MIGRATION_v0.13_nach_HTML.md`.

**Sollwerte aus dem PDF** (via `referenznummern.py`): 127 Gleichungen
(1.5.1–1.5.127), Abbildungen 1.61–1.72, `Beispiel 1.5.1`, `Zusammenfassung 1.8`
(kapitelweit). Die Offsets am `<h2>` stehen bereits.

- [ ] **1.5.3 Drehimpuls und (Massen-)Trägheitsmoment zu Ende** — 8 Gl. (11–18), Abb. 1.62 steht schon. *(S)*
- [ ] **1.5.4 (Massen-)Trägheitsmoment** — 9 Gl. (19–27), 3 Abbildungen (Zylinder, Kugel, Steiner). *(M)*
- [ ] **1.5.5 Drehmoment** — 3 Gl. (28–30), 1 Abbildung. *(S)*
- [ ] **1.5.6 Anwendung des Drehmoments – Wippe und Hebelgesetz** — 1 Gl. (31). *(S)*
- [ ] **1.5.7 Die Kippbedingung bei starren Körpern** — keine Gleichungen, aber das Bildpaar (Abb. 1.67) hat **keine Hauptunterschrift**: nur die beiden Teilunterschriften übernehmen, keine `<figcaption>` erfinden. *(S)*
- [ ] **1.5.8 Zusammenhang zwischen Drehmoment und Drehimpuls** — 8 Gl. (32–39). *(S)*
- [ ] **1.5.9 Drehimpulserhaltung** — 12 Gl. (40–51), 1 Abbildung. *(M)*
- [ ] **1.5.10 Experimente zu Drehmoment, Drehimpuls und Drehimpulserhaltung** — 3 Gl. (52–54), Maxwell-Rad-Abbildung. *(S)*
- [ ] **1.5.11 Rotationsenergie** — 9 Gl. (55–63). *(S)*
- [ ] **1.5.12 Rotation und Translation** — 1 Gl. (64). *(S)*
- [ ] **1.5.13 Rollbewegung** — **63 Gleichungen (65–127)**, 2 Abbildungen; mit Abstand der größte Brocken, eigene Sitzung einplanen. *(L)*
- [ ] **1.5.14 Zusammenfassung** — keine Gleichungen, enthält `Zusammenfassung 1.8` und die einzige Tabelle des Abschnitts. *(S)*
- [ ] **Abschluss** — die 11 `\ref` der Quelle als `data-ref-*`-Anker auflösen (darunter Verweise auf Abschnitt 1.4), `\point`/`\SI`/Fußnoten wie gehabt; danach Verifikation nach Skill **v013-verifikation**: Soll und Ist müssen **pro Unterabschnitt** deckungsgleich sein, nicht nur in der Summe.

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

- [ ] **P10-1** `styles.css`: Fortschrittsbahn flexibel (flex + min/max). *(S)*
- [ ] **P10-2** Verifikation (Sicht, Stufe 5 — Freigabe). *(S)*

---

1. Erst **P0** abarbeiten (rasch, niedriges Risiko, senkt schon das Token-Volumen spürbar).
2. Dann **Per-Figure-Fabrik + Modularisierung + Globals einfrieden** (P1) als zusammenhängender Struktur-Refactor — das ist der zentrale Hebel für Token-Effizienz und Wartbarkeit; danach sind Animation (rAF) und DOM-Optimierung günstig in der Fabrik mitzuerledigen.
3. **P2** anschließend/parallel je nach Bedarf (Mobile/A11y).

Vor jedem Struktur-Refactor: Legacy-Ordner als Referenz sicher, Änderungen im Browser pro Figur verifizieren (`python3 -m http.server` aus `InteraktivesSkript_WIP/`).