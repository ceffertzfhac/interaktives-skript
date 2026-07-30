<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P19 — Doku-Hygiene: Restbefunde aus dem Review nach P18

Eingetragen 2026-07-30 aus der Review-Frage „sind wir jetzt optimal aufgestellt?"
nach Abschluss von P18. **P18 hat die Doku-*Struktur* in Ordnung gebracht**
(Ladeklassen, ein Ort je Information, Mengen verlinkt statt aufgezählt). Was
hier steht, sind die *inhaltlichen* Restbefunde und die Stellen, an denen die
Struktur noch nachgibt.

---

### P19-1 — Das `gcN`-Figurensystem schläft seit v1.7, die Doku sagt es nicht *(M, Entscheidung nötig)*

**Befund (verifiziert 2026-07-30).** Der gesamte klassische Figuren-Apparat ist
im ausgelieferten Stand **nicht erreichbar**:

- **kein einziger** `id="gcN"`-Container in `chapters/*.html` (grep: 0 Treffer);
- `factory.js`, `fig_*.js` und `transform.js` werden von `main.js` **nicht
  importiert** (nur noch untereinander);
- `core.js::update_all()` und `make_static()` tragen Guards und sagen es im
  Kommentar ausdrücklich („Seit v1.7 enthaelt Kapitel 1.4 keine interaktiven
  gcN-Container mehr");
- `main.js` ebenso: „`initKreisbewegung()` entfaellt v1.7 (kein gc10-Container
  mehr …)", Import auskommentiert.

**Die Doku präsentiert es trotzdem als aktuelle Architektur** — ererbt aus der
alten `CLAUDE.md` und bei P18 bewusst 1:1 mitgenommen (Vorgabe: keine
Information verlieren), aber ungekennzeichnet. Konkret falsch bzw. irreführend:

| Stelle | Aussage | Wirklichkeit |
|---|---|---|
| `src/figures/CLAUDE.md`, Motoren-Tabelle | `kreisbewegung` „treibt auch die Sim gc10 (Abschnitt 1.5.5)" | gc10 existiert nicht mehr |
| `src/figures/CLAUDE.md`, „Klassische Figuren" | Fabrik-Muster, 7 animierte 3D-Figuren, gc1/gc9/gc4, `fig_5`-Legacy-Bug | schlafender Code, nicht geladen |
| `src/CLAUDE.md`, „Static vs. interactive mode" | `make_static()` tauscht die `gcN`-Container gegen Bilder | tauscht nichts mehr; Easter-Egg läuft ins Leere |
| `src/CLAUDE.md`, „3D → 2D projection" | `selectN`-Dropdown je Figur | kein solches Dropdown im Dokument |

**Zu entscheiden (Nutzer):** kommt das `gcN`-System zurück (dann als „schlafend,
Wiedereinbindung geplant" kennzeichnen) oder ist es abgelöst (dann in die
Legacy-Referenz verschieben und die Doku darauf reduzieren)? Die Planung in
**P12-E** baut neue interaktive Figuren durchweg als **Aspekt-Figuren**, nicht
über die `gcN`-Fabrik — das spricht für „abgelöst".

- [ ] **P19-1a** Entscheidung einholen: schlafend-mit-Rückkehr vs. abgelöst.
- [ ] **P19-1b** Danach die vier Stellen oben entsprechend kennzeichnen oder
  entschlacken. **Nicht vorher** — solange die Entscheidung offen ist, wäre
  Löschen Informationsverlust.

---

### P19-2 — Dieselbe Tatsache steht an drei Orten *(S)*

Die Paletten-Token-Zahl stand im Kopf von `aspekt_paletten.css`, im Runbook
`INTERAKTIVE_ASPEKT_FIGUREN.md` **und** in `src/figures/CLAUDE.md`. In **zwei**
davon war sie falsch (18 statt 20) — behoben in c504fcd, aber der strukturelle
Grund bleibt: Runbook und verschachtelte `CLAUDE.md` überlappen thematisch
(Paletten/CVD, Vorlagen-Kaskade, Motorwahl), ohne dass abgegrenzt wäre, wer die
Quelle ist.

- [ ] **P19-2** Abgrenzung festschreiben und umsetzen: **`CLAUDE.md` = was gilt**
  (Regel, Vertrag, Zeiger), **Runbook = wie man es macht** (Schritte,
  Fallstricke), **Code-Kommentar = warum es so ist** (Begründung am Objekt).
  Zahlen/Aufzählungen gehören an **genau eine** dieser Stellen, die anderen
  verlinken. Betroffen sind mindestens Paletten/CVD und die Vorlagen-Kaskade.

---

### P19-3 — `VERIFIKATION_kapitel_N.md` ist ein O(n)-Muster *(S–M)*

Heute zwei Dateien (1.1, 1.4), Ziel sind **15+ Kapitel** — das ergibt 15+
Prüfplan-Dateien im WIP-Wurzelverzeichnis, jede zusätzlich mit einer Zeile in
`DOKUMENTATION.md`. Genau das Muster, das P18 abgeschafft hat.

- [ ] **P19-3** Trennen in (a) **einen** generischen Prüfplan (Phasen +
  Abnahmekriterien, kapitelunabhängig — gehört zum Skill `v013-verifikation`)
  und (b) das **Ergebnisprotokoll je Kapitel**, das an den Ort seines Gegenstands
  gehört: Kopfkommentar des Fragments oder das zugehörige Backlog-Item.
  `DOKUMENTATION.md` bekommt dann eine Zeile statt N.

---

### P19-4 — Kein Wächter gegen Doku-Drift *(S, hoher Hebel)*

Alle inhaltlichen Fehler, die P18 und dieses Review gefunden haben, wären
mechanisch auffindbar gewesen: 15/14 statt 16 Aspekt-Figuren, fehlender vierter
Motor, fehlende `center.js`/`footnotes.js`, 18 statt 20 Paletten-Token, gc10.
Gemeinsames Muster: **die Doku behauptet eine Zahl oder eine Existenz, der Code
weiß es besser.**

- [x] **P19-4** Kleines Skript (`doku_drift_check.py` in der Repo-Wurzel), das
  genau das prüft und bei Abweichung mit Exit≠0 endet. *(S, hoher Hebel)* —
  umgesetzt 2026-07-30: `doku_drift_check.py`, nur Python-stdlib, `python3
  doku_drift_check.py`, 7 Prüfungen, Exit≠0 bei Abweichung. Prüft: (1)
  `aspekt_*.js`-Zahl == `ASPEKT_FACTORIES`-Länge == README-Zahl (je 16) ·
  (2) `data-aspekt`-Keys in `chapters/*.html` ⊆ `ASPEKT_FACTORIES` · (3)
  Motor-Ordner in `src/figures/` == Motoren-Tabelle in `figures/CLAUDE.md`
  (je 4, gleiche Namen) · (4) README „17 Kapitel-Fragmente" == `ch_*.html`-Count
  + „Vier Themenkomplexe" plausibilisiert (`data-tk-num` in `index.html`) ·
  (5) `--kb-*`/`--gk-*`-Token je Palettenblock (4 Blöcke) == im
  `aspekt_paletten.css`-Kopf genannter Zahl (20/5) · (6) in Doku genannte
  Datei-/Symbolnamen existieren — Live-Referenzen müssen da sein, Legacy-Namen
  (`factory.js`/`fig_5.js`/`transform.js`) nur in Dateien mit dem Marker
  „Abgelöst seit v1.7" (P19-1) · (7) kein `id="gcN"` in `chapters/*.html`.
  Negativ-Tests (README-Zahl verfälscht, `id="gc10"` eingesetzt) feuern wie
  erwartet; danach clean. Eintrag in `DOKUMENTATION.md` „Ausführbare Helfer".
  **Nach jeder Änderung an Figuren-Anzahl, Motoren, Kapiteln oder Paletten-
  Tokens laufen lassen.**

---

### P19-5 — Beobachtungsposten (noch kein Handlungsbedarf) *(S)*

- [ ] **P19-5a** `src/CLAUDE.md` ist mit ~16,7 KB die größte der lazy geladenen
  Dateien und lädt bei fast jeder Codearbeit mit. **Auslöser für weiteres
  Aufteilen: > 20 KB** — dann trennen nach „Kern/Druck" (`core`, `print`,
  `center`) und „Leseoberfläche" (`pages`, `shell`, `ui`, `footnotes`).
- [ ] **P19-5b** `CHANGES_aspekt_1.38_1.40_und_grundgeruest.md` (27 KB) heißt
  nach zwei Figuren, dokumentiert aber alles seit der ersten Anlage und wächst
  weiter. Rolle klären: Änderungshistorie (dann umbenennen, z. B.
  `CHANGES_aspekt_figuren.md`) oder abgeschlossene Begründungssammlung (dann
  einfrieren und Neues nur noch in die Modulköpfe).
