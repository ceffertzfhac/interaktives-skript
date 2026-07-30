<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
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

