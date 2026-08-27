<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
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

