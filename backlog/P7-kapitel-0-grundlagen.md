<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
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

- [x] **QR-Codes im Druck verweisen auf die interaktiven Aspekt-Figuren (Variante A).** Im Legacy trug jede gedruckte Grafik einen QR-Code, der zurueck auf die interaktive Version zeigte. Im WIP fehlt das: `print.js` hat `create_qr()`/`from_qr()` noch (aus Legacy), qrjs2 ist geladen, die CSS (`.qr_container`/`.qr_title`) existiert -- aber `print_page()` ruft `create_qr` nur fuer `.grafik-container` auf, die es im migrierten (statischen) Kapitel nicht mehr gibt. Der interaktive Teil sind jetzt die **Aspekt-Figuren** (`.aspekt-figur`, z. B. Abb. 1.38), im Druck erscheint ihr statisches `.nur-druck`-Gegenstueck.

  **Umsetzung (drei Bausteine):**
  1. Stabiler Anker an der Aspekt-Figur: in `init_aspekt_figuren()` eine feste id vergeben (z. B. `id="ak-kreisbahn"` aus `data-aspekt`).
  2. QR im Druck aufs statische Bild, Link zur Figur: in `print_page()` ueber die Aspekt-Figuren iterieren, im Klon das `data-figref`-Ziel (das gedruckte Bild) finden und dort `create_qr(zielElement, "…?g=ak-…")` anhaengen. Nur Abbildungen MIT interaktivem Pendant bekommen einen QR (Nutzervorgabe: „verweisen auf den interaktiven Part").
  3. **Variante A** fuer `from_qr()`: paginierungs-bewusst -- beim Ankommen mit `?g=ak-…` die Seite der Figur via `showPage` einblenden UND die Lupe-Overlay-Ansicht oeffnen (`openOverlay`), also die Figur prominent gross zeigen (Analogon zum Legacy-`zoom()`). Alt-Links `?g=gcN` behalten den `zoom`-Fallback. (Aktuell ist `from_qr` nicht paginierungs-bewusst und laedt auf einer versteckten Seite ins Leere -- muss ohnehin gefixt werden.)

  **`create_qr` verallgemeinern:** aktuell fuegt es den QR *in* das Element mit `id` ein und baut den Link aus der id; auf `create_qr(zielElement, linkZiel)` umstellen (minimal-invasiv).

  **Beschriftung allgemeiner:** der Legacy-Hinweis „Sie muessen im Ilias angemeldet sein" ist ILIAS-spezifisch und muss weg. Neutraler formulieren (z. B. „Interaktive Version im Browser oeffnen") -- unabhaengig von der konkreten Hosting-Plattform.
  *(M)* — *Umgesetzt (gefunden 2026-07-30 bei P-AF-7-Abschluss; Code bereits komplett, Backlog-Box war stale): alle drei Bausteine in `print.js` live — (1) jede `.aspekt-figur` traegt `id="aspekt-…"` (chapters), (2) `print_page()` iteriert `.aspekt-figur`, loest das `data-figref`-Ziel (`.nur-druck`-`<figure id="fig-…">`) und haengt `create_qr(staticFig, linkId)` an; `create_qr(targetEl, linkId)` ist verallgemeinert (Ziel != Link-ID), (3) `from_qr()` paginierungs-bewusst: `showPage` der Seite der Figur + `requestAnimationFrame`→`toggle_aspekt(lupe)` oeffnet das Lupe-Overlay; `?g=gcN` behaelt den Legacy-`zoom()`-Fallback. Titel neutral („Interaktive Version im Browser oeffnen"). `.qr_container`/`.qr_title`-CSS vorhanden. Browser-Freigabe (Stufe 5) wie bei P7-4 noch offen.*

- [x] **Druck-Auswahl: Dropdown „Was drucken?" (Themenkomplex / Kapitel / Abschnitt).** Eingetragen 2026-07-24 (Nutzerwunsch). Klick auf das Drucker-Symbol öffnet ein Dropdown-Menü, in dem der Nutzer wählt, ob der **Themenkomplex**, das **Kapitel** oder der **Abschnitt** gedruckt werden soll (statt wie bisher pauschal alles). Setzt die 3-stufige Hierarchie aus P8 voraus (Themenkomplex → Kapitel → Abschnitt), um die Druckmenge zu bestimmen. Umsetzung: `print.js::init_print`/`print_page` bekommt einen Scope-Parameter (`?print=true&scope=komplex|kapitel|abschnitt`); der Klon in `print_page()` filtert `.chapter-page`-Einheiten nach dem gewählten Scope (aktuelle Seite = Abschnitt; deren h2-Kapitel = Kapitel; deren Themenkomplex = alle Kapitel des Komplexes). UI: kleines Dropdown am Drucker-Icon (`#header_controls`), Tastatur-/ARIA-fähig wie die übrigen Toolbar-Controls. *(M)* — *Umgesetzt (gefunden 2026-07-30; Code bereits komplett, Backlog-Box war stale): `print.js::print_scope(scope)` haengt `?print=true&scope=…&page=…` an den Druck-Tab; `scopeKeepSet` (abschnitt=aktuelle Seite, kapitel=naechste h2 + folgende h3s, komplex=alle Seiten desselben Themenkomplexes) + `applyPrintScope` entfernen im Klon alle nicht im Keep-Set liegenden `.chapter-page`. UI: `#print_menu`-Popover (index.html) mit Buttons Alles/Themenkomplex/Kapitel/Abschnitt (`data-action="print_scope" data-arg="…"`), Drucker-Icon `data-action="toggle_print_menu"`, Escape schliesst (`main.js`), `role="dialog"`. `#print_menu_*`/`.print_menu_*`-CSS in styles.css. Browser-Freigabe (Stufe 5) wie bei P7-4 noch offen.*

- [x] **Link zur vollständigen Stand-alone-Simulation je Aspekt-Figur.** Eingetragen 2026-07-24 (Nutzerwunsch). Die Aspekt-Figuren im Skript sind feature-gated Reduktionen der großen Stand-alone-Simulationen; deren Vollversionen liegen unter <https://github.com/ceffertzfhac/Projects_InteraktiveSimulation> und sind über eine öffentliche Instanz (GitHub Pages o. ä.) erreichbar. Jede Aspekt-Figur soll einen **kleinen Button** bekommen, der die zugehörige **volle Simulation in einem neuen Tab** öffnet. Details:
  - **Pictogramm:** „In neuem Tab öffnen / externer Link" — konventionell ein Pfeil, der aus einem Rechteck herauszeigt (↗ im Kasten). Passt zur bestehenden Lupe-/Icon-Sprache der Figuren.
  - **Hover-Erklärung:** `title` + `aria-label` (Tastatur/Screenreader), z. B. „Vollständige interaktive Simulation in neuem Tab öffnen". Konsistent zu den übrigen Figuren-Buttons (Lupe: „Vergrößern").
  - **Verdrahtung:** Ziel-URL pro Figur konfigurierbar, z. B. neues Attribut `data-simurl="…"` an der `.aspekt-figur`; Button nur rendern, wenn gesetzt. Öffnen via `target="_blank" rel="noopener noreferrer"`. Platzierung analog zur Lupe (in der `.aspekt-runbar`).
  - **Offen:** Mapping Figur → Vollsimulations-URL (Basis-URL der öffentlichen Instanz + Projektpfad) festlegen; klären, welche Aspekt-Figuren ein Vollpendant haben. *(M)* — *Umgesetzt 2026-07-30 (v1.32.0, `7cc4881`): Nutzervorgabe — die Sims sitzen unter `https://ceffertzfhac.github.io/Projects_InteraktiveSimulation/` (die Index-Datei dort listet alle 16). Statt eines `data-simurl`-Attributs je Figur (16 Markup-Edits) wird das Mapping zentral in `main.js::ASPEKT_SIM_URLS` (data-aspekt → Sim-URL) gepflegt und der Button generisch in `init_aspekt_figuren()` eingehängt — O(1), keine Per-Figure-Edits. Mapping über den Motor: kreisbewegung→`sim_kreisbewegung`, kreis_spiral→`sim_kreis_spiralbewegung`, grundbegriffe→`sim_grundbegriffe_kinematik`; bus_weg_zeit ist figur-only (keine passende Sim) und erhält keinen Button. Pictogramm „↗ im Kasten" als externer Link (`<a>`, target=_blank + rel=noopener noreferrer), `aria-label`+`title`, Optik 1:1 wie die Lupe (`.aspekt-simlink` in `aspekt_kreisbahn.css`), platziert am Lupe-Anker (Runbar falls vorhanden, sonst `.aspekt-scene` — die Lupe selbst hängt in 1.38 in `.aspekt-scene`, darum generisch am Lupe-Eltern). Browser-Freigabe (Stufe 5) wie bei P7-4 noch offen.*

