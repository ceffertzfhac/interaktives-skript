# Code (`src/`)

Gilt zusätzlich zu `InteraktivesSkript_WIP/CLAUDE.md` und der Wurzel-`CLAUDE.md`.
Figuren haben eigene Regeln: `src/figures/CLAUDE.md`. Nummerierung, Querverweise
und Formelsatz gehören zur Kapitel-Autorenschaft: `../chapters/CLAUDE.md`.

Architektur: ESM-Module + Kapitel-App-Shell + Figuren-Fabrik.

## Module layout

WIP ships as native ESM (no build step, no bundler). `index.html` loads
`<script type="module" src="src/main.js">`; modules are deferred, so `main.js`
calls `init()` at the end of the module (no `<body onload>`). MathJax stays a
classic CDN `<script>` tag and qrjs2 a classic local one
(`src/vendor/qrjs2.min.js`) → globals `window.MathJax` / `window.QRCode`.

```
main.js        entry: init() (async), central data-action binder, afterprint/hashchange listeners
chapters.js    loadChapters() — fetches chapters/ch_NN_*.html at runtime, injects +
               flattens each into its <div data-chapter> placeholder in #paper so the
               fragment nodes become direct #paper children (paginate() unmodified);
               typesetAfterLoad() re-typesets injected formulas via MathJax.startup.promise
               gate (mirrors numbering.js) -> reload_mathjax (imports core only);
               captureEqLatex() sammelt vor dem Typeset window.eq_latex aus jeder
               \label-tragenden Gleichung (Quelle der dynamischen .physik-list)
core.js        state (interaktiv, darkmode_on, linspace, speed_factor), ge/show/hide,
               generate_highlight_boxes, safari_bug, degree_to_fraction, make_static,
               test, reload_mathjax, toggle_darkmode, reset, set_width_mode, update_all,
               metrics_for_level/apply_text_size, toggle_settings/close_settings,
               set_palette/init_palette
transform.js   to2d, transform_line, transform_polyline, ga  (imports ge from core)
pages.js       paginate() — groups #paper into one-subsection-per-page .chapter-page
               units (h2 = chapter intro, h3 = subsection); showPage/getPages/next/prev;
               showAllPagesForPrint/restorePagination for the print flow
shell.js       chapter app bar (breadcrumb/progress/hamburger), left rail (on-page
               landmarks + chapter mini-nav), right marginalia (reparents .anmerkung
               boxes of the active page), tablet drawer; reacts to pages.js's
               "pagechange" CustomEvent (no import of pages.js internals beyond its API)
ui.js          toc (full-screen accordion + search filter, built from pages.js's page
               registry), generate_toc, toc_filter, kontakt, offsetAnchor,
               toggle_body_scroll, zoom, close_zoom, pause
numbering.js   init_numbering() — Box-, Abbildungs- und Bildnummerierung auf Basis der
               Seitenregistratur von pages.js; renumber_equations(). Die v0.13-Zähler-
               Scopes sind NICHT einheitlich — die Regeln stehen in ../chapters/CLAUDE.md,
               die ausführliche Herleitung im Kopfkommentar von numbering.js selbst
print.js       init_print, check_print, print_page, create_qr, from_qr, findGetParameter
center.js      Auto-Zentrierung des Papierbereichs (#content) im Fenster. (A) Fenster
               breiter als das Papier: nichts zu tun (CSS margin:auto; der Rail-Offset
               von #paper wurde bewusst NICHT ausgeglichen — das hätte eine dauerhafte
               leere rechte Rinne erzeugt). (B) Fenster schmaler → horizontaler Überlauf:
               initiale Scroll-Lage mittig (window.scrollX = Überlauf/2); sobald der
               NUTZER horizontal scrollt, ist die Auto-Zentrierung für die Sitzung aus.
               Ein Breiten-Modus-Wechsel ist ein expliziter Layout-Wechsel (kein "aktives
               Scrollen") und setzt die Aussetzung zurück. Kein Import — Rückführung aus
               set_width_mode läuft zyklusfrei über window.center_recenter.
footnotes.js   Fußnoten als aufklappbare Info-Marker: aus <span class="fussnote"> im
               Fließtext (v0.13-\footnote-Stellen) wird ein kleines (i), das den Text
               unter dem Absatz aufklappt. Umwandlung im JS statt im Kapitel-Markup,
               damit sie für jedes künftige Kapitel automatisch gilt (O(1)). Reihenfolge
               in main.js: nach loadChapters()/paginate(), damit die Absätze stehen.
figures/       s. figures/CLAUDE.md
styles.css     Stile; darkmode.css wird geladen, aber `disabled`, und zur Laufzeit
darkmode.css   umgeschaltet (toggle_darkmode über den <link id="darkmode_stylesheet">)
vendor/        qrjs2.min.js — lokal vendort, s. vendor/README.md
assets/        SVG/PNG-Icons, die in die Highlight-Boxen injiziert werden
```

## Dependency graph

Acyclic: `core` ← `transform` ← `factory`; `core` ← `pages` ← `ui`,`shell`,`numbering`;
`chapters` ← `core` (only `reload_mathjax`); `core`,`ui`,`pages`,`shell` ← `print`;
everything ← `main`.

Was ihn zyklenfrei hält:

- `update_all` (core) dispatcht über `window.updateN` statt Figurenmodule zu
  importieren — die Figurenmodule werden von `main.js` per Side-Effect-Import
  geladen, damit ihre `window`-Registrierung vor `init()` läuft.
- `shell.js` importiert nie `ui.js`/`print.js`; Seitenwechsel laufen über ein
  `pagechange`-`CustomEvent` auf `document` statt über einen direkten Import,
  damit `print.js` von `pages.js` **und** `shell.js` abhängen darf.
- `numbering.js` importiert nie `core.js::reload_mathjax()`, sondern legt
  `window.renumber_equations` ab (`core.js` greift zur Laufzeit darauf zu) —
  das vermeidet den Zyklus `core`→`numbering`→`pages`→`core`.
- `center.js` importiert gar nichts und wird über `window.center_recenter`
  zurückgerufen.

## Central event binding (data-action)

Es gibt **keine** inline-`oninput`/`onclick`-Handler. `index.html` markiert
Elemente mit `data-action` (+ `data-fig`, optional `data-arg`,
`data-event="change"` für `<select>`/Radio). `main.js` hängt je einen
delegierten Listener für `click`/`input`/`change` an und dispatcht auf die
Funktion oder auf `fig_call(prefix, fig, arg)` → `window[prefix+fig]`.
`make_static()` injiziert `data-action="zoom"`, damit der delegierte Binder auch
die Zoom-Buttons im statischen Modus abdeckt. `data-action="goto_page"` +
`data-arg="<page-id>"` (Schiene, TOC-Akkordeon und Ad-hoc-Querverweise im
Fließtext) navigiert über `shell.js::goto_page` → `pages.js::showPage`.

## Chapter pagination (one subsection per page)

Kapitel-Prosa liegt je Kapitel in `chapters/ch_NN_*.html` und wird von
`chapters.js::loadChapters()` vor `paginate()` nach `#paper` geladen und
eingeebnet. `pages.js::paginate()` gruppiert das DOM von `#paper` zur Laufzeit in
`.chapter-page`-Einheiten, eine je `.inhaltsverzeichnis`-Überschrift (h2 =
Kapiteleinstieg, h3 = Unterabschnitt) samt zugehörigem `<section>`, und zeigt
genau eine davon (`display:none` auf dem Rest).

Die Gruppierung läuft von jeder Überschrift zu ihrem `<section>`, statt eine
feste Verschachtelung anzunehmen; ein zweiter Durchgang (`foldStraySiblings`)
faltet losen Top-Level-Inhalt zwischen Sections in die vorangehende Seite — das
handgeschriebene Markup hat einige solcher Streugeschwister (z. B. eine
`.zusammenfassung`-Box nach einem `</section>` und vor der nächsten
Überschrift), die sonst auf jeder Seite sichtbar blieben.

Der Druck (`print.js::print_page`) ruft `showAllPagesForPrint()` auf, bevor er
`#container` klont, damit die Ausgabe jeden Unterabschnitt enthält, nicht nur den
aktiven.

## Chapter app shell (header, rail, marginalia, TOC)

`#header` ist **eine** zusammengeführte 64-px-Leiste (Branding-Eyebrow/Titel,
ein Trenner, Breadcrumb + „Seite x/y" aus `shell.js::init_shell()`, ein dezenter
`#header_pagenav`-Zurück/Weiter-Pager oben rechts, dessen
`data-action="chapter_prev/next"` die untere `.chapter-pagenav` spiegelt und
dessen Disabled-Zustand `shell.js::renderPrevNext()` damit synchron hält, die
Toolbar-/Textgrößen-/Breiten-/Darkmode-Bedienelemente und ein Hamburger, der nur
unterhalb des Tablet-Breakpoints erscheint) — bewusst **eine** Leiste, nicht zwei
gestapelte, passend zur Ein-App-Bar-Struktur des importierten Claude-Design-Mockups.

Die linke Schiene (Landmarken der aktiven Seite, erzeugt aus Highlight-Box-Titeln
und `data-title`s der Figuren; eine Kapitel-Mini-Navigation mit den
Geschwister-h3-Seiten) ist `position: sticky`, damit sie beim Scrollen eines
langen Unterabschnitts angedockt bleibt — **`#content` darf dafür niemals ein
`overflow` außer `visible` bekommen**, sonst bricht Sticky auf diesem
Nachfahren (einmal passiert, s. Kommentar an `#content` in `styles.css`).

Die rechte Marginalienspalte **verschiebt** die `.anmerkung`-Boxen der aktiven
Seite in eine seitliche Kartenliste (kein Klon); `shell.js::restoreMarginalia()`
setzt sie vor dem Drucken zurück.

Unterhalb des Tablet-Breakpoints (`@media (max-width: 1024px)`) verstecken sich
Schiene und Marginalien, und derselbe Schienen-Inhalt wird stattdessen in eine
einfahrende Schublade gerendert (`data-action="toggle_drawer"`).

Das Inhaltsverzeichnis (`ui.js::generate_toc()`/`toc()`, geöffnet über den
bestehenden Toolbar-Knopf `data-action="toc"`) ist eine Vollbild-Ansicht (kein
Overlay-Panel), auf die Maße von `#content` bemessen, mit eigenem Suchfeld
(`ui.js::toc_filter()`) und einem echten Akkordeon, generisch aus der
Seitenregistratur gebaut — eine Gruppe je h2-Kapitel, verschachtelte h3-Links,
aktuelles Kapitel/Seite hervorgehoben. Ein künftiges Kapitel braucht damit
**null** TOC-Codeänderungen, nur ein weiteres `.inhaltsverzeichnis`-h2 in seinem
eigenen `chapters/ch_NN.html`. `#header` versteckt sich, solange das TOC offen
ist (`body.toc-open`), weil die TOC-Ansicht ihre eigene Leiste hat — eine Leiste
pro Ansicht, nie zwei.

## Static vs. interactive mode

> **Abgelöst seit v1.7:** der `gcN`-Container-Swap ist historisch — es gibt
> keine `id="gcN"`-Container mehr in `chapters/*.html`, sodass `make_static()`s
> `set()`-Aufrufe alle null-guarded no-oppen (`core.js:149-154`); die Funktion
> macht live nur noch `reload_mathjax()`. Der `interaktiv`/`test()`-Toggle
> (s. u.) funktioniert noch, hat aber keine `gcN`-Figuren mehr zum Umschalten.
> Interaktive Figuren sind heute **Aspekt-Figuren** (s. `figures/CLAUDE.md` +
> Runbook). Die folgenden Absätze beschreiben die Legacy-Mechanik als Referenz.

`interaktiv` (exportiertes `let` in `core.js`) schaltet das ganze Dokument
zwischen interaktiven SVG-Figuren und statischen Bildern um. Ist es `false`,
überschreibt `make_static()` das `innerHTML` jedes `gcN`-Containers mit einem
`<img class="grafik">` aus `bilder/` (plus Zoom-Knopf) und typesetzt MathJax neu.
gc10 (Kreisbewegung) hat kein statisches Bildäquivalent und bleibt auch im
statischen Modus bewusst interaktiv — keine volle Parität mit den anderen
Figuren, inline in `core.js` dokumentiert.

Zwei Easter-Egg-Umschalter stecken in der *Kontakt*-Box: ein Klick auf die
getarnten Buchstaben „Fa**ll**" ruft `test()` (kippt `interaktiv` und führt
`make_static()` erneut aus — der einzige Laufzeitweg in den statischen Modus
ohne Codeänderung), „**tt**" in „bitte" ruft `reload_mathjax()`, um alle Formeln
neu zu rendern.

## 3D → 2D projection

> **Abgelöst seit v1.7:** `transform.js` (`to2d`/`transform_line`/
> `transform_polyline`) und die `fig_NN.js`-Konsumenten werden von `main.js`
> nicht importiert; ein `selectN`-Dropdown gibt es im Dokument nicht mehr.
> Die ISO-3D-Projektion der heutigen Aspekt-Figuren läuft im Motor
> `kreis_spiral/` (`projectISO`, s. `figures/CLAUDE.md`). Folgender Absatz
> beschreibt die Legacy-Projektion als Referenz.

`to2d(d3, perspective)` projiziert einen 3D-Punkt `[x,y,z]` auf 2D-Bildschirm-
koordinaten; `perspective` ∈ {1,2,3,4} wählt die Ansicht, gesteuert vom
`selectN`-Dropdown je Figur (in jedem Render gelesen). `transform_line` /
`transform_polyline` wenden das auf SVG-Elemente an. Nicht alle Figuren nutzen
3D; gc1/gc9 sind reine 2D-Polarplots.

## Highlight-Boxen, TOC, Druck, QR, Zoom, Darkmode

- `generate_highlight_boxes()` findet jedes Element mit einer der Klassen
  `lernziel`, `motivation`, `wiederholung`, `beispiel`, `zusammenfassung`,
  `aufgabe`, `anmerkung` und injiziert ein Icon (`src/assets/*.svg`) plus einen
  großgeschriebenen Titel vor dessen ursprünglichem Inhalt. Für einen neuen
  Boxtyp einen `[class, icon]`-Eintrag ins `boxes`-Array aufnehmen — **und die
  vier weiteren Stellen**, s. u.
- Das TOC wird zur Laufzeit von `generate_toc()` als Akkordeon aus der
  Seitenregistratur von `pages.js` gebaut, die ihrerseits aus jedem Element mit
  der Klasse `inhaltsverzeichnis` entsteht (die `<h2>`/`<h3>`-Überschriften).
- Druckablauf: `init_print()` (Toolbar „Drucken") öffnet die aktuelle URL mit
  `?print=true` in einem neuen Tab; `check_print()` erkennt den Parameter und
  ruft `print_page()`, das `#container` nach `#print_container` klont,
  Zoom-Knöpfe entfernt und je `gcN` einen QR-Code (über das vendorte qrjs2)
  erzeugt, der auf `?g=gcN` zurückverweist. `from_qr()` behandelt den Rückweg:
  wer über einen QR-Link ankommt, bekommt die Zielfigur tief gezoomt.
- `zoom(parent_gc)` klont eine Figur ins `#zoom`-Overlay und skaliert sie
  passend zum Viewport; `close_zoom()` baut ab und führt `update_all()` erneut aus.
- Darkmode schaltet `toggle_darkmode()` durch Aktivieren/Deaktivieren des
  `darkmode.css`-`<link>` (id `darkmode_stylesheet`).

> **Box-Klassenlisten synchron halten:** *fünf* unabhängige Stellen zählen
> Boxklassen auf — `core.js::generate_highlight_boxes` (Icons),
> `numbering.js::BOX_LABELS` (Titel), `styles.css` (Kartenoptik + die
> 50-px-Icon-Rinne), die `mjx-container[display="true"]`-Regel „keine Box in der
> Box" und `shell.js::landmarksFor` (linke Schiene). Eine zu vergessen ist
> **still**: eine Box ohne CSS-Regel verliert Rahmen *und* Icon, und ihr Icon
> entkommt in die Schiene. Beim Hinzufügen eines Typs alle fünf greppen. (Die
> v0.13-Typen `bemerkung`/`wichtig` kamen so in v1.7 dazu.)

## Weitere Code-Konventionen

- **Accessibility (v1.6)**: `<html lang="de">` ist gesetzt. Alle
  Toolbar-Bedienelemente (Inhaltsverzeichnis/Drucken/Kontakt), der
  Darkmode-Umschalter und jeder Zoom-Knopf (auch die, die `make_static()` für
  statische Figuren erzeugt) sind echte `<button type="button">` mit
  `aria-label` — fokussierbar per Tastatur, mit Enter auslösbar. Inline-`on*`-
  Handler gibt es nicht (s. „Central event binding"). CSS-Button-Resets
  (`.navbar_button`, `.darkmode_icon`, `.zoom_button`) entfernen die
  Browser-Defaults, sodass die vorhandenen Hintergrund-/Icon-Stile erhalten bleiben.
- **Safari-foreignObject-Workaround (beibehalten v1.6)**: `core.js::safari_bug()`
  erkennt Safari per UA-Sniff und gibt `.fo_inner`-Elementen die Klasse `.fixed`
  (150 px Randverschiebung), um Safaris Fehlpositionierung von HTML-Text in
  SVG-`<foreignObject>` auszugleichen. Das ist eine *Rendering*-Eigenart, keine
  fehlende API — `@supports` kann sie nicht erkennen, der UA-Sniff ist der
  pragmatische Ausweg und inline dokumentiert. Neu bewerten, falls eine reine
  CSS-Lösung für foreignObject bekannt wird. Nicht-Safari-Browser bleiben
  unverändert (kein `.fixed`).
- **Responsive scope (v1.6)**: **Desktop/Tablet-only per Entscheidung** — keine
  Telefonunterstützung. Das Viewport-Meta (`width=device-width, initial-scale=1`)
  ist korrekt; der einzige responsive Breakpoint ist `@media (max-width: 1024px)`
  (Tablet), der Schiene + Marginalien gegen eine einfahrende Schublade tauscht.
  Kein telefonspezifisches CSS hinzufügen, ohne diese Entscheidung neu zu
  bewerten.
- **Breiten-Modus + Druck entkoppeln**: `core.js::set_width_mode`
  (schmal/normal/breit) setzt inline `width` auf `#content`, inline
  `--paper-max-width` auf `#paper`, persistiert nach `localStorage` und setzt
  `<html data-width-mode="…">` — das **CSS-Signal** für modusabhängige Regeln
  (immer über `:root[data-width-mode="…"]` selektieren, nie über JS-Klassen).
  Die Textskalierung (`core.js::metrics_for_level`/`apply_text_size`, 5 Stufen)
  legt zwei Skalen auf `#paper`: `--paper-font-size`/`-line-height` für die Prosa
  und `--paper-graphics-scale`/`-line-scale` (sanfter) für UI-/SVG-Text.
  **Der Druck muss vom Breiten-Modus entkoppelt sein**: `print.js::print_page`
  entfernt die inline `#content`-Breite und `--paper-max-width` aus dem Klon (sie
  gewönnen durch Inline-Spezifität, und der Ausdruck folgte dem Bildschirmmodus);
  die Druckspalte ist feste 700 px in `styles.css`, mit `#fff`-Hintergründen zur
  Tonerersparnis.
- **Einstellungen-Popover (v1.24/v1.25)**: Textgröße, Ansichtsbreite und
  Farbpalette sitzen im Einstellungen-Popover (`#settings`, Zahnrad in
  `#toolbar`; `core.js::toggle_settings`/`close_settings`, Escape schließt), alle
  drei persistiert (`skript_text_level` / `skript_width_mode` / `skript_palette`).
  `core.js::set_palette`/`init_palette` setzt `<html data-palette="normal|deuter|tritan">`;
  `toggle_darkmode` hält zusätzlich `<html data-darkmode="0|1">` synchron — ein
  rein additives Wurzel-Signal, ohne das die Paletten-Overrides keinen
  Hell/Dunkel-Selektor hätten. Was die Paletten dann tun: `figures/CLAUDE.md`.
- **MathJax-Hinweis**: `reload_mathjax()` nutzt die MathJax-**v3**-API
  (`MathJax.typesetPromise()`, abgesichert für den Fall, dass MathJax noch nicht
  geladen ist). Es rendert alle Formeln neu und hängt am „tt"-Easter-Egg in der
  Kontakt-Box sowie an `make_static()`. (Früher rief das die v2-API
  `MathJax.Hub.Queue(...)`, die unter v3 wirkungslos war — behoben.)
