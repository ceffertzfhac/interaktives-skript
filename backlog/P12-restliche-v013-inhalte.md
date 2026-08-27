<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P12 — Komplett-Integration aller noch fehlenden v0.13-Inhalte (Rest-Skript)

Eingetragen 2026-07-24 nach Nutzervorgabe: *„plane im backlog kleinschrittig die
komplette integration aller noch fehlender inhalte aus dem pdf."* Ziel ist das
volle ~400-Seiten-Skript (v0.13, `Input/v0.13/Physik_pskript_v0.13.pdf`), nicht
nur die heutigen ~3 migrierten Abschnitte. Struktur des PDFs (aus
`Physik_pskript_v0.13.toc`): **4 Themenkomplexe** (`\chapter` 0–3) ·
**23 Sections** (`\section`) · **114 Subsections** (`\subsection`).

**Ist-Stand WIP — AKTUALISIERT 2026-08-27 (v1.34.1).** *Die vorherige Angabe
war vom 24.07. und listete TK 2, TK 3 und sieben TK-1-Sections als fehlend; das
ist seit den Migrationen dazwischen ueberholt.* Reproduzieren:
`grep -o 'data-chapter="[^"]*"' InteraktivesSkript_WIP/index.html`

**Die Prosa-Migration ist vollstaendig.** 17 Fragmente, **114 Unterabschnitte —
exakt die 114 Subsections des v0.13-TOC**.

| TK | Sections | Unterabschnitte | Aspekt-Figuren |
|---|---|---|---|
| 0 Grundlagen | 0.0 | 5 | 0 |
| 1 Mechanik | 1.0–1.8 (alle 9) | 69 | 16 |
| 2 Elektromagnetismus | 2.0–2.3 (alle 4) | 31 | 0 |
| 3 Schwingungen und Wellen | 3.0–3.2 (alle 3) | 9 | 0 |

3.2 Wellen ist migriert, enthaelt aber keine Unterabschnitte — die v0.13-Quelle
ist selbst nur ein 207-Byte-Hinweis („im WS 2025/26 nicht behandelt"). Mehr gibt
es nicht zu holen, s. P12-C2.

**Was daraus folgt:** der Schwerpunkt von P12 hat sich verschoben. Offen sind
nicht mehr Kapitel, sondern **interaktive Figuren** (P12-E), **Quasi-Content**
(P12-D) und die **Verifikation** (P12-G). Die Figuren sind dabei sehr ungleich
verteilt: von 16 liegen **14 allein in Abschnitt 1.4** und 2 in 1.1 — **13 der
17 Abschnitte haben gar keine.**

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
- [x] **P12-A1 1.1 Kinematik** — 14 Subsections, **20 Abbildungen** (vorab als
  „21" geschätzt; tatsächlich Abb. 1.1–1.20)
  (`pskript_mech_kinematik_gmni_v4.tex`, 104 KB). Interaktiv-Kandidaten: `geschwindigkeit_simulation`,
  `grundbegriffe_kinematik_simulation`, `freier_fall_simulation`,
  `schraeger_wurf_simulation` (→ P12-E1, offen). *(XL)* — migriert (Commits
  74e712/18059fa/3a4961b/c722eb3): `chapters/ch_01_01_kinematik.html`, 14
  Unterabschnitte, Gl. 1.1.1–1.1.99, Abb. 1.1–1.20, Beispiele 1.1.x,
  Zusammenfassung 1.1. Kein Offset am h2 (erster Abschnitt mit Abb/Zus — startet
  lueckenlos bei 1.1; die 1.2/1.3-Luecke ueberspringt das 1.4-h2 mit 37/3). Alle
  21 referenzierten Bilder vorhanden. Verifikation Stufe 1–6 deckungsgleich mit
  PDF; **Stufe 5 (Browser-Sicht) freigegeben 2026-07-24 ("ist ok")** —
  Verifikation-Ergebnis (Gl-Spannen pro Unterabschnitt, bewusste Abweichungen)
  im Fragmentkopf `ch_01_01_kinematik.html`. Interaktiv (P12-E1) bleibt offen.
- [x] **P12-A2 1.2 Dynamik – Impuls und Kraft** — 12 Subsections, 10 Abb.
  (`pskript_mech_dyn_kraft_impuls_gmni_v3.tex`, 74 KB). Kandidaten: `atwood_simulation`,
  `3massen_umlenkrollen_simulation`. *(L)* — migriert 2026-07-25 (Branch
  `migration/kapitel-1.2`, Commits eef9ba9/517d729/e148a77):
  `chapters/ch_01_02_dynamik_impuls_kraft.html`, 107 Gl. (1.2.1–1.2.107),
  Abb. 1.21–1.30, Beispiele 1.2.1–1.2.11, Zusammenfassung 1.2. **Kein Offset am
  h2** (contiguous zu 1.1: 1.1 endet bei Abb. 1.20 → 1.2 startet 1.21;
  Zusammenfassung 1.1 → 1.2). 1.4-h2 behält 37/3 (1.3 fehlt weiterhin).
  Bilder: 6 PDF→PNG, 3 PNG kopiert, `attwood.eps` ohne Ghostscript via
  `dvisvgm --eps` → `mutool draw` (Glyphen als Pfade). Quelldateien fehlten
  zunächst, per `git pull` im v0.13-Checkout nachgeladen. Neu: `#paper
  blockquote`-Stil für v0.13-`\begin{quotation}`. Verifikation Stufe 1–4/6
  deckungsgleich mit PDF; **Stufe 5 (Browser-Sicht) offen — Freigabe ausstehend**.
- [x] **P12-A3 1.3 Dynamik – Arbeit, Leistung und Energie** — 7 Subsections, 7 Abb.
  (`pskript_mech_dyn_energie_arbeit_gmni_v3.tex`, 53 KB). Kandidat: `atwood_energy_simulation`.
  *(L)* — migriert 2026-07-25 (Branch `migration/kapitel-1.3`, Commits
  e43e3f0/aeb8bb7): `chapters/ch_01_03_dynamik_arbeit_energie.html`, 78 Gl.
  (1.3.1–1.3.78), Abb. 1.31–1.37, Beispiele 1.3.1–1.3.12, Zusammenfassung 1.3.
  **Kein Offset am h2** (contiguous zu 1.2). Damit sind 1.1–1.3 lueckenlos — die
  DOM-Harness-Gap-Liste fiel von `[1,38,68]` auf `[1,68]` (1.3 fuellt die letzte
  Mechanik-Luecke). Bewusste Abweichung: Bildunterschriften mit v0.13-Box-Verweis
  ("Abbildung zum Beispiel N") ohne Nummer, da inline in der Beispiel-Box (wie 1.2).
  Bilder schrittweise per git-pull nachgeliefert (ccdb246/3de8dd1). Verifikation
  Stufe 1–4/6 deckungsgleich mit PDF; **Stufe 5 (Browser-Sicht) offen — Freigabe
  ausstehend**. (Interaktiv-Kandidat `atwood_energy` bleibt P12-E2.)
- [x] **P12-A4 1.6 Bezugsysteme und Scheinkräfte** — 3 Subsections, 1 Abb.
  (`pskript_mech_bezugsysteme_und_scheinkraefte.tex`, 41 KB). **Maßgeblich ist das
  Original** (`pskript_mech_bezugsysteme_und_scheinkraefte.tex`, 1 Abb.) — es ist
  die im PDF integrierte Version (`Physik_pskript_v0.13.tex` Z. 83). Die
  `_v2gmni`-Variante (38 KB, 0 Abb.) wird vom Hauptdokument **nicht** geladen und
  ist nicht maßgeblich (verifiziert 2026-07-24). *(M)* — migriert 2026-07-25
  (Branch `migration/kapitel-1.6`, Commits 1b10547/f19ad7d):
  `chapters/ch_01_06_bezugsysteme_scheinkraefte.html`, 41 Gl. (1.6.1–1.6.41),
  Abb. 1.73, Beispiele 1.6.1–1.6.12, Zusammenfassung 1.9. Kein Offset (contiguous
  zu 1.5, sitzt nach ch_02 in der Lesereihenfolge). Bild = JPEG-Foto (Hurrikan
  Irma). Viele Inline-`\be` -> display equations; `\nicefrac`->`/`, `\url`-><a>,
  `\SI`-Zehnerpotenzen aufgeloest. Verifikation Stufe 1–4/6 deckungsgleich mit PDF;
  **Stufe 5 (Browser-Sicht) offen — Freigabe ausstehend**.
- [x] **P12-A5 1.7 Elastische und inelastische Stöße** — 2 Subsections, 0 Abb.
  (`pskript_mech_dyn_stoesse.tex`, 17 KB). Kandidat: `stoss_simulation`. *(M)* —
  migriert 2026-07-25 (Branch `migration/kapitel-1.7`, Commit 52e92cd):
  `chapters/ch_01_07_stoesse.html`, 47 Gl. (alle in 1.7.1; 1.7.2 ohne), 3 Beispiele
  (1.7.1–1.7.3), keine Abbildung, keine Zusammenfassung -> Zaehler unveraendert
  (Abb. 1.73, Zusammenfassung 1.9). Gleichungen fast alle aus align-Bloecken
  (jede `\\`-Zeile nummeriert). Verifikation Stufe 2/3/6 deckungsgleich mit PDF;
  **Stufe 5 (Browser-Sicht) offen — Freigabe ausstehend**.
- [x] **P12-A6 1.8 Gravitation** — 5 Subsections, 0 Abb.
  (`pskript_mech_gravitation_v1.tex`, 22 KB). *(M)* — migriert 2026-07-25
  (Branch `migration/kapitel-1.8`, Commit 37c4628): `chapters/ch_01_08_gravitation.html`,
  31 Gl. (1.8.2=12, 1.8.3=6, 1.8.4=13; 1.8.1/1.8.5 ohne), 4 Beispiele (1.8.1–1.8.4),
  keine Abbildung, keine Zusammenfassung -> Zaehler unveraendert (Abb. 1.73,
  Zusammenfassung 1.9). 2 kapiteluebergreifende Verweise auf 1.2.7 (p-1-2-7).
  Verifikation Stufe 2/3/6 deckungsgleich mit PDF; **Stufe 5 (Browser-Sicht) offen —
  Freigabe ausstehend**. **Damit ist TK 1 (Mechanik, 1.0–1.8) vollstaendig migriert.**

### P12-B — TK 2 Elektromagnetismus (neu, `ch_03_*.html`, `data-tk-num="2"`)

- [x] **P12-B0 2.0 Einleitung und Motivation** — 0 Subsections, 0 Abb.
  (`pskript_em_einleitung_und_motivation.tex`, 2.3 KB). *(S)* — migriert 2026-07-25
  (Branch `migration/kapitel-2.0`, Commit 384ec39): `chapters/ch_03_00_einleitung.html`,
  4 Prosa-Absaetze, nichts Nummeriertes. **Erster Abschnitt von TK 2** (`ch_03_*`,
  `data-tk-num="2"`, `data-tk-title="Elektromagnetismus"`). DOM-Harness: neue Seite
  "2.0 …" korrekt angehaengt, Zaehler unveraendert. Live-Test der 2.x-Nummerierung
  (Abb. 2.1 / Beispiel 2.1.1 / 2.1.n-Gleichungen) folgt mit 2.1 (P12-B1).
- [x] **P12-B1 2.1 Grundlagen der Elektrizitätslehre** — 14 Subsections, ~~0~~ 1 Abb.
  (`pskript_em_grundlagen_der_elektrizitaetslehre.tex`, 39 KB). Viele
  Schaltpläne/Symbole — prüfen ob als SVG-Icons oder PNG. *(L)* — migriert
  2026-07-25 (Branch `migration/kapitel-2.1`, Commits 767039a/e83af2c):
  `chapters/ch_03_01_grundlagen_elektrizitaetslehre.html`, 43 Gl. (2.1.1–2.1.43),
  1 Beispiel (2.1.1), 1 Zusammenfassung (2.1), **1 Abbildung (Abb. 2.1)**. Die
  eine Abb. ist ein **circuitikz-Schaltplan** (kein `\includegraphics`) — via
  standalone `pdflatex` gerendert; **siunitx fehlt** in der texlive-Installation,
  daher \SI/\si/\volt/\ohm durch minimale Ersatzmakros ersetzt (nur fuers Rendern).
  **Erster TK-2-Abschnitt mit Nummern — 2.x-Nummerierung live bestaetigt**
  (DOM-Harness: Abb. 2.1, Beispiel 2.1.1, Zusammenfassung 2.1; Kapitel-2-Zaehler
  per data-figure-/zusammenfassung-offset="0" am h2 zurueckgesetzt). Verifikation
  Stufe 2/3/4/6 deckungsgleich mit PDF; **Stufe 5 (Browser: Gleichungs-Tags 2.1.n)
  offen — Freigabe ausstehend**.
- [x] **P12-B2 2.2 Elektrostatik** — 10 Subsections, ~~0~~ 2 Abb.
  (`pskript_em_elektrostatik.tex`, 52 KB). Felder/Dipole — Vektorfeld-Plot-Kandidat?
  *(L)* — migriert 2026-07-25 (Branch `migration/kapitel-2.2`, Commits
  727074b/8793572): `chapters/ch_03_02_elektrostatik.html`, 86 Gl. (2.2.1–2.2.86),
  6 Beispiele (2.2.1–2.2.6), 1 Zusammenfassung (2.2), **2 Abbildungen (Abb. 2.2,
  2.3)** — beides tikzpicture-Bloecke (Feldueberlagerung + Dipol), via standalone
  pdflatex gerendert ([[reference-circuitikz-ohne-siunitx]], hier plain tikz).
  Kein Offset (contiguous zu 2.1). 5 kapiteluebergreifende Verweise (2.1 + 1.8)
  alle aufgeloest. Verifikation Stufe 2/3/4/6 deckungsgleich mit PDF; **Stufe 5
  (Browser: Gleichungs-Tags 2.2.n) offen — Freigabe ausstehend**.
- [x] **P12-B3 2.3 Elektrodynamik und Magnetismus** — 7 Subsections, 5 Abb.
  (`pskript_em_elektrodynamik_und_magnetismus.tex`, 71 KB). Kandidat:
  `lorentz_force_simulation` (→ P12-E5, offen). *(L)* — migriert (Commit
  27ff1d4 -> v1.18.0 + xref-Fix c722eb3): `chapters/ch_03_03_elektrodynamik_magnetismus.html`,
  7 Unterabschnitte 2.3.1–2.3.7, Gl. 2.3.1–2.3.96, 5 Beispiele (2.3.1–2.3.5),
  Zusammenfassung 2.3, 5 Abbildungen (Abb. 2.4–2.8; 2.4/2.5 tikzpicture, 2.6 PNG,
  2.7/2.8 pdftocairo). Kein Offset (contiguous zu 2.2). Bewusste Korrektur eines
  Quell-Tippfehlers in `eq_lorentzkraft_allgemein`. Alle 5 Bilder vorhanden.
  Verifikation Stufe 2/3/4/6 deckungsgleich; **Stufe 5 (Browser: Gleichungs-Tags
  2.3.n) offen — Freigabe ausstehend**. Interaktiv (P12-E5) bleibt offen.

### P12-C — TK 3 Schwingungen und Wellen (neu, `ch_04_*.html`, `data-tk-num="3"`)

- [x] **P12-C0 3.0/3.1 Einleitung und Motivation** — (`pskript_sw_einleitung_und_motivation.tex`,
  3.2 KB). **TOC-Bug in v0.13:** „Einleitung" und „Schwingungen" sind *beide* als
  „3.1" nummeriert — Nummerierung beim Migrieren korrigieren (3.0 vs 3.1). *(S)* —
  migriert (Commit 31bae8d -> v1.19.0): `chapters/ch_04_00_einleitung.html`,
  reine Prosa (keine Abb/Gl/Boxen). TOC-Dublette bewusst zu 3.0 korrigiert (s.
  Fragment-Header + MIGRATION-Runbook Abschnitt 13). Kein Offset (3.0 verbraucht
  0 Abb/Zus; Kapitel-3-Zaehler starten bei 0). **Stufe 5 (Browser-Sicht) offen —
  Freigabe ausstehend**. Kein Interaktiv-Kandidat.
- [x] **P12-C1 3.1 Schwingungen** — 9 Subsections, 0 Abb.
  (`pskript_sw_schwingungen.tex`, 42 KB). Kandidat: `federpendel_simulation`. *(L)*
  *Erledigt (Stand 2026-08-27 verifiziert): `ch_04_01_schwingungen.html`,
  9 Unterabschnitte, 39 KB, 67 nummerierte Gleichungen.*
- [x] **P12-C2 3.2 Wellen** — `pskript_sw_wellen.tex` = **207 Byte Stub** — in v0.13
  *selbst* kein Inhalt. **Nutzervorgabe (2026-07-24): Platzhalter erstellen.** Bei
  der TK-3-Migration wird 3.2 als sichtbarer Platzhalter-Standort angelegt (Section-
  Heading + Hinweis „Inhalt folgt / in v0.13 nicht enthalten"), nicht leer gelassen.
  `wellen_simulation` liegt bereit — später als interaktive Figur (P12-E7)
  einbinden, sobald der Inhalt steht. *(M)*
  *Erledigt: `ch_04_02_wellen.html` gibt den Hinweis der Quelle wieder.
  Die 207 Byte SIND der gesamte Inhalt von `pskript_sw_wellen.tex` — hier
  ist nichts nachzutragen, solange v0.13 nichts nachliefert.*

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
- [~] **P12-E6** 3.1: `federpendel`. *(M)*

  **Stufe 1 erledigt 2026-08-27 (`e31dcbd`): Motor portiert** nach
  `src/figures/federpendel/` (constants/state/physics/render/runtime, 1225 Z.).
  Libs aus `../kreisbewegung/lib/`, alle sechs Exporte passen 1:1. Die Seite ist
  unveraendert — **kein Modul importiert den Motor**, ein Wiedereinstieg ist also
  verlustfrei.

  **Mit dem Nutzer entschieden (2026-08-27), vor dem Weiterbauen NICHT neu fragen:**
  - **Aspekt:** Auslenkung *x(t)* — Szene + EIN Graph. Vorlage ist damit
    `aspekt_winkel_zeit.js` (Play/Pause + ein Graph), nicht `aspekt_weg_zeit.js`.
  - **Bedienung:** Play/Pause mit Auto-Stopp (Runbar + Tempo-Radios),
    plus Regler Amplitude *A*, Masse *m*, Federkonstante *k*.
  - **Formeln:** dynamisch via `data-eqs` aus dem Kapiteltext, kein statischer
    `.formula-box`-Block (nicht mischen — der statische gewinnt sonst).
  - **Platzierung: Abschnitt 3.1.5, OHNE Abbildungsnummer.** 3.1.5 hat in v0.13
    keine Abbildung; es wird auch keine erfunden. Der Platzhalter bekommt daher
    **kein `data-figref`** — `label_aspekt_figuren()` ueberspringt ihn dann
    sauber (`querySelectorAll('.aspekt-figur[data-figref]')`), und die
    Abbildungszaehlung des Kapitels bleibt exakt wie v0.13 (4 Abbildungen).
    Das ist die erste Aspekt-Figur ohne statisches Pendant.
  - **Modus:** `store.oscillationMode = 'horizontal'` (die Sim kann auch
    `'vertical'` — das ist der Hebel fuer eine spaetere 3.1.6-Figur).

  **Fallstrick, der beim Sondieren aufgefallen ist:** `fig-feder_masse_schwingung`
  liegt in **3.1.1**, nicht in 3.1.5, und zeigt ein **vertikales** Pendel. Ein
  `data-figref` darauf haette der Figur eine fremde Nummer vererbt — die
  Nummerierung laeuft in Seitenreihenfolge (`numbering.js::numberImages`).

  **DOM-Vertrag** (ermittelt mit `dom_vertrag.mjs`, im Skelett als `kb_`-IDs
  schreiben und per `.replace(/kb_/g, prefix)` prefixen):
  *Kern-Szene:* `anchor_object`, `center_area`, `equilibrium_line/_label`,
  `main_svg`, `mass`, `max_pos_line/_label`, `min_pos_line/_label`,
  `pos0_label`, `position_vector`, `velocity_vector`, `acceleration_vector`,
  `spring`, `surface`, `toggle_position_vector`, `toggle_velocity_vector`,
  `toggle_acceleration_vector`, `unstretched_length_line/_label`,
  `x_axis_arrow`, `x_axis_label_text`, `y_axis_arrow`, `y_axis_label_text`.
  *Stubs (versteckt, muessen aber existieren):* `graph_svg`, `live_t`, `live_v`,
  `live_a`, `live_ekin`, `live_epot`, `live_etot`.

  **Stufe 2 (offen):** `aspekt_federpendel.js` aus der Vorlage + `.css`,
  Skelett mit den IDs oben, Platzhalter in `ch_04_01_schwingungen.html`
  (Abschnitt 3.1.5), Import + `ASPEKT_FACTORIES`-Eintrag in `main.js`,
  `<link>` in `index.html`. Danach `figur_smoke.mjs --init=buildFederpendelFig`,
  `dom_harness.mjs` (Nummerierung unveraendert?) und Browser-Sicht.
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

