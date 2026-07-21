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
- [ ] **T/W: Build-/Bundler-Entscheidung treffen.** Sobald Module + Kapitel-Fragmente anliegen, braucht es eine Entscheidung: reines ESM ohne Build (simpel, CDN-Only) vs. leichter Build (Vite/esbuild) für Dev-Server, Minifizierung und Print-Bundle. Konsequenz für Token-Effizienz: Build soll kapitelweise Bundles/Code-Splitting erlauben, damit im Browser nicht alles auf einmal geladen wird. — *P1b; vorerst reines ESM ohne Build (Stage 4).*
- [x] **W: Globale Zustände einfrieden.** Implizite Globals (`svg`, `pl`, `phi`, `v`, `x`, `y`, `perspective`, `a`, `a_content` … ohne `let`/`const`/`var`) leaken ans `window` und werden von *jeder* `updateN` wiederverwendet — eine Figur kann den Zustand einer anderen überschreiben. Pro-Figur-Scope (Closures/Module) + konsequente `const`/`let`. — *Done: Stage 1 (Nicht-Figuren), Stage 3 (Figuren-State in Factory-Closures: `gcN_n`/`r8`/`runs`), Stage 4 (ESM-strict-mode erzwingt `const`/`let` in fig_1/fig_9).*
- [x] **T/W: Event-Bindung aus HTML auslagern.** 65 Inline-`onclick`/`oninput` koppeln HTML und JS über String-Namen; ein Edit braucht meist beide Dateien im Kontext. Statt `oninput="update1();"` → `data-figure="1"` + zentrale `addEventListener`-Registrierung in JS. — *Done (Stage 2): `data-action`-Attribute + delegierter Binder in `main.js`.*
- [x] **L: Animation auf `requestAnimationFrame` umstellen.** 11× rekursives `setTimeout(...,10)`, 0× rAF. Liefert vsync, pausiert bei Hidden-Tab, weniger Jank/Akku. `do_animationN`-Loops entsprechend migrieren (am besten in der generischen Factory gleich miterledigen). — *Done (Stage 3): rAF-Loop mit ~10-ms-Akkumulator in `createFigure`.*
- [x] **L: Per-Frame-DOM-Arbeit reduzieren.** `updateN` baut jeden Frame das komplette `polyline.points` (100 Punkte) neu + serialisiert `p3d`-String + `transform_polyline` re-parsed. Statischen Kreis einmalig berechnen, nur bewegte Elemente pro Frame updaten. Element-Refs cachen statt 40× `ge()` pro Frame (z. B. `update5`). — *Teilweise (Stage 3): statischer Kreis-p3d gecacht (nur bei Radius-/z-/Perspektivenwechsel neu gebaut); Element-Ref-Caching noch offen.*
- [x] **L: `update8` Tail-Liste nicht als String.** `split(" ")/join(" ")` über bis zu 1000 Punkte pro Frame (`script.js:2558`). Array halten, `points` direkt setzen. — *Done (Stage 3b): Tail als Array (`ctx.tail`); `points` aktuell noch über `transform_polyline` (p3d-String), direktes Setzen noch offen.*

## P2 — Aktualität, Responsivität, A11y (M, mittleres Risiko)

- [~] **A: Responsives Viewport.** `<meta name="viewport" content="width=1190">` (`index.html:5`) ist fixiert → keine Mobile-Layouts. Viewport + CSS auf Breakpoints umstellen (oder bewusst als »druckoptimiert, Desktop-only« deklarieren). — *Teilweise (v2.0): erster echter `@media (max-width: 1024px)`-Breakpoint (Tablet-Drawer statt Rail/Marginalie, s. CLAUDE.md „Chapter app shell"). Telefon-Breite (<600px) noch nicht gezielt getestet.*
- [ ] **A: Safari-UA-Sniff ersetzen** (`safari_bug`, `script.js:397`) durch Feature-Detection / saubere CSS-Weiche.
- [ ] **A: `URLSearchParams` statt `findGetParameter`** (`script.js:660`).
- [ ] **A: `<html lang="de">` setzen** (`index.html:2`) und semantische Buttons statt `<div class="navbar_button" onclick>` (Toolbar, Zoom) für Tastatur/A11y.
- [ ] **W: CSS aufräumen.** Viele auskommentierte Deklarationen, doppelte Properties (`.qr_container` width 376 & 381). `@page`-CSS-Nesting (`h1{}` in `@page`) ggf. prüfen/kompatibel lösen.
- [ ] **W: Tooling-Baseline.** Editor-Config + Prettier + ESLint einführen, damit Edits automatisch konsistent formatiert sind (reduziert Review- und Merge-Rauschen). Optional TypeScript/JSDoc-Typen für die Figuren-Factory.
- [x] **W: `script.js` mit `defer` laden** (`index.html:19` im `<head>` ohne `defer`) — Best-Practice, parse-blocking vermeiden. *(Obsolet durch ESM-Split Stage 4: `<script type="module">` ist implizit defer; der klassische Monolith `script.js` existiert im WIP nicht mehr — nur noch in `Input/InteraktivesSkript_legacy/`.)*
- [x] **W/Bug: TOC-Einklappen lässt linken Balken stehen.** — *Fix (v2.0): beim ohnehin fälligen TOC-Akkordeon-Umbau (s. CLAUDE.md) mitbehoben — `toc_hide` referenziert jetzt die tatsächlichen Hide-Keyframes (vorher fälschlich toc-show, nie gesetzt), `hide("toc_container")` läuft erst nach der Animation statt sofort, `toc()` ruft symmetrisch zu `zoom()`/`close_zoom()` jetzt auch `toggle_body_scroll()`. Diagnose unten als Referenz belassen.* Klapp man das Inhaltsverzeichnis aus und wieder ein, verbleibt ein vertikaler Balken am linken (Scroll-)Rand im Bild. Diagnose (Stand v1.3.0):
  - `#toc_content.toc_hide { animation-name: toc-show }` (`styles.css:712`) — Copy-Paste-Bug: die Hide-Animation referenziert die *Show*-Keyframes (`translateX(-500→0)`), sollte `animation-name: toc-hide` sein. Mit `animation-fill-mode: forwards` endet das Element am *sichtbaren* Ort (`translateX(0)`), nicht am verdeckten.
  - `.hidden { visibility: hidden; position: absolute }` (`styles.css:254`) versteckt per `visibility`, nicht `display:none`. Zusammen mit `#toc_content { position:fixed; overflow-y:scroll }` (immer sichtbare Scrollbar, da `scroll` nicht `auto`) und dem fehlenden `left`-Wert kann der fixed-Kind-Container beim Einklappen sichtbar/blitisch bleiben statt zu verschwinden.
  - `toc()` (`ui.js:61`) klapp nur `toc_container` um, ruft aber *nicht* `toggle_body_scroll()` (kein `no_scroll` auf `<body>`) → kein Layout-Shift-Schutz während des TOC offen ist (im Gegensatz zu `zoom`/`close_zoom`, die es nutzen).
  - Fix-Richtung: `toc_hide`-Animation auf `toc-hide` korrigieren; `.hidden` für Overlay-Container auf `display:none` umstellen (oder `#toc_content` explizit `left:0` + `visibility`-Override geben und beim Schließen `display:none`); `toc()` symmetrisch zu `zoom` `toggle_body_scroll()` aufrufen. Danach im Browser (aus-/einklappen, Body-Scroll-Verhalten) verifizieren.

---

## Reihenfolge-Empfehlung

1. Erst **P0** abarbeiten (rasch, niedriges Risiko, senkt schon das Token-Volumen spürbar).
2. Dann **Per-Figure-Fabrik + Modularisierung + Globals einfrieden** (P1) als zusammenhängender Struktur-Refactor — das ist der zentrale Hebel für Token-Effizienz und Wartbarkeit; danach sind Animation (rAF) und DOM-Optimierung günstig in der Fabrik mitzuerledigen.
3. **P2** anschließend/parallel je nach Bedarf (Mobile/A11y).

Vor jedem Struktur-Refactor: Legacy-Ordner als Referenz sicher, Änderungen im Browser pro Figur verifizieren (`python3 -m http.server` aus `InteraktivesSkript_WIP/`).