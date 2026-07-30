<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P18 — Dokumentations-Architektur context-freundlich umbauen (CLAUDE.md + BACKLOG.md)

Eingetragen 2026-07-30 nach Nutzervorgabe („CLAUDE.md ist wieder sehr groß
geworden") und einer Vermessung des Doku-Stands. **Harte Vorgabe: KEINE
Information darf verloren gehen** — sie darf nur umsortiert/umorganisiert werden.

### Befund (gemessen 2026-07-30)

| Datei | Umfang | Ladeprofil |
|---|---|---|
| `CLAUDE.md` | 256 Z. / 41,9 KB ≈ **11–12k Token** | **in JEDEM Turn** im Kontext |
| `BACKLOG.md` | 1513 Z. / 123 KB ≈ **33k Token** | bei jeder Anfrage (Backlog-First-Workflow) |
| `INTERAKTIVE_ASPEKT_FIGUREN.md` | 593 Z. / 44,7 KB | auf Abruf (Runbook) |
| `MIGRATION_v0.13_nach_HTML.md` | 599 Z. / 25,8 KB | auf Abruf (Runbook) |
| `CHANGES_aspekt_1.38_1.40_…` | 502 Z. / 27,1 KB | auf Abruf |
| `QUELLEN_FEHLER.md` | 279 Z. / 17,1 KB | auf Abruf, **in CLAUDE.md nicht erwähnt** |

1. **Wachstum ist strukturell, nicht kosmetisch.** `CLAUDE.md`: 6,3 KB (16.07.) →
   47,2 KB (27.07.) → Verdichtung auf 39,5 KB (28.07., Commit „CLAUDE.md
   verdichtet — Details in die Runbooks") → **41,9 KB (30.07.)**. Die Verdichtung
   hielt **zwei Tage**. 46 Pflege-Commits in 14 Tagen. Verdichten allein löst es
   also nachweislich nicht — die Struktur muss sich ändern.
2. **74 % stecken in drei Blöcken, die mit dem Projekt mitwachsen:** „Module
   layout" 14,7 KB (35 %), „Conventions and gotchas" 10,5 KB (25 %), „Repository
   layout" 6,0 KB (14 %). Jede neue Figur, jeder Motor, jedes Kapitel, jede
   Nutzervorgabe verlängert sie. **Das ist genau der O(n)-Fehler, den CLAUDE.md
   dem Code selbst verbietet** („adding a chapter/figure is O(1) files").
3. **Trotz 46 Pflege-Commits bereits veraltet** — Beleg, dass eine zentrale
   Prosa-Liste über wachsende Mengen nicht wartbar ist:
   - `src/center.js` und `src/footnotes.js` fehlen im Modul-Layout (0 Treffer).
   - Der **vierte Motor** `src/figures/bus_weg_zeit/` fehlt komplett (Layout nennt drei).
   - „the 15 interactive aspect figures" — im Code sind es **16**
     (`ASPEKT_FACTORIES`, inkl. `bus_weg_zeit`); Abschnitt „What this is" sagt
     im selben Dokument **14**.
   - `QUELLEN_FEHLER.md` und `VERIFIKATION_kapitel_1.1.md` sind nirgends erwähnt.
4. **Duplikate**: Der numbering-Block (2,2 KB) steht fast wörtlich als
   Kopfkommentar in `src/numbering.js`; die Motor-Absätze stehen in den jeweiligen
   `*/runtime.js`; Aspekt-Details stehen im Kopf jeder `aspekt_*.js` **und** im
   Runbook. CLAUDE.md formuliert die richtige Regel („per-figure detail lives
   THERE, not here") — befolgt sie aber nur teilweise.
5. **BACKLOG.md ist zu ~60 % abgeschlossene Historie** (104 von 174 Checkboxen
   `[x]`), die jeder mitliest, der das Backlog öffnet.

### Prinzip

Drei Ladeklassen, jede Information **genau einmal**, am Ort ihres nächstliegenden
Konsumenten:

- **A — immer** (jeder Turn): aufgabenunabhängige Regeln. Muss O(1) sein und darf
  nicht mit Kapiteln/Figuren wachsen.
- **B — bei Berührung** (lazy): Subsystem-Wissen. Claude Code lädt verschachtelte
  `CLAUDE.md` automatisch nach, sobald Dateien im Unterbaum gelesen/geändert werden.
- **C — auf Abruf**: Runbooks/Skills, bewusst geöffnet.

> Wichtig: `@datei`-Importe in CLAUDE.md sparen **nichts** — sie werden eingeblendet.
> Nur echte Unterordner-`CLAUDE.md` sind lazy.

### Zielbild

```
CLAUDE.md                              ~100 Z. — Klasse A + Wegweiser-Tabelle
InteraktivesSkript_WIP/CLAUDE.md       Site-Ebene: Ordner, Fragment-Konvention,
                                       Nummerierungs-Offsets, xref-Deskriptor-Regel,
                                       Bildbreiten, statisch/interaktiv
InteraktivesSkript_WIP/src/CLAUDE.md   Modul-Layout kompakt, Dependency-Graph,
                                       data-action-Binder, Pagination/Shell/Print/
                                       Width-Modus/MathJax/Boxen-5-Stellen-Regel
InteraktivesSkript_WIP/src/figures/CLAUDE.md   Motoren-Tabelle (4), Factory-Vertrag,
                                       Aspekt-Dispatch, Paletten-/Token-System
DOKUMENTATION.md                       Index aller Dokus: Datei | Zweck | „lies das, wenn …"
BACKLOG.md                             Index: eine Zeile je Item + Status
backlog/PNN-*.md                       Details je Item
BACKLOG_ARCHIV.md                      erledigte Items (Historie bleibt vollständig)
```

**Neue Doku-Regel (der eigentliche Hebel):** *Mengen werden nicht in Prosa
aufgezählt, sondern verlinkt.* Konkret:
- Aspekt-Figuren-Liste raus → Quelle ist `main.js::ASPEKT_FACTORIES`; jede
  `aspekt_*.js` hat bereits einen Kopf mit Vorlage + Abweichungen.
- Migrationsstand raus → Quelle ist BACKLOG P12 + die `data-*-offset` an den h2 +
  die Fragment-Kopfkommentare.
- Motoren: Tabelle mit **einer Zeile je Motor** (Motor | Sicht | wofür da),
  Begründung/Port-Änderungen in `*/runtime.js`.

Damit kostet eine neue Figur **0 Zeilen Pflichtkontext** (nur Modulkopf), ein
neues Kapitel ebenfalls 0.

### Verlustfreiheit (Vorgehen, nicht verhandelbar)

1. Absätze der heutigen `CLAUDE.md` durchnummerieren, **Umzugstabelle** Absatz →
   Ziel; jeder Absatz bekommt genau ein Ziel: *verschoben nach X* / *gestrichen,
   weil wörtlich in Y vorhanden (Fundstelle)* / *bleibt*.
2. Bei „gestrichen, weil Duplikat" **zuerst** die Zieldatei prüfen; fehlt dort
   etwas, wird es DORT ergänzt, bevor es hier entfernt wird.
3. Kontrolle: `git show HEAD:CLAUDE.md` gegen die Summe der neuen Dateien
   Satz-für-Satz abgleichen (Skript + Ausnahmenliste mit Fundstelle je Streichung).
4. Ein Commit je Umzugsschritt, damit jeder Schritt einzeln revidierbar bleibt.

### Erwarteter Effekt

Pflichtkontext pro Turn ≈ **11–12k → ~3k Token**; Backlog-Zugriff **33k → ~2k**
(Index) + gezielt 1–4k je geöffnetem Item.

### Risiken (ehrlich benannt)

- Verschachtelte `CLAUDE.md` laden erst bei Dateizugriff im Unterbaum — bei einer
  reinen Planungsfrage ohne Dateizugriff fehlt das Wissen. **Gegenmittel:** die
  Wegweiser-Tabelle in der Wurzel nennt Datei + Ein-Satz-Inhalt, sodass klar ist,
  *dass* es sie gibt.
- Mehr Dateien = mehr Orte, die veralten können. **Gegenmittel:** Regel „Doku steht
  beim Code" + die O(1)-Regel; Befund 3 zeigt, dass die zentrale Datei *stärker*
  veraltet als die Modulköpfe.
- Backlog-Split kostet einmalig Aufwand; `grep` über ein Verzeichnis statt eine
  Datei ist minimal umständlicher.

### Sub-Tasks

- [x] **P18-0 Faktenkorrekturen zuerst** (unabhängig vom Umbau nötig): vierter
  Motor `bus_weg_zeit`, `src/center.js`, `src/footnotes.js`, 16 statt 15/14
  Aspekt-Figuren, `QUELLEN_FEHLER.md` + `VERIFIKATION_kapitel_1.1.md` erwähnen. *(S)*
  — erledigt 2026-07-30 in ba0fee8/ce73e16. Die Zahl „16" wurde nicht korrigiert,
  sondern durch einen Zeiger auf `ASPEKT_FACTORIES` **ersetzt** (Mengen-Regel).
  `README.md` war bereits korrekt (16 Figuren, vier Motoren) — nur `CLAUDE.md`
  war veraltet.
- [x] **P18-1 Umzugstabelle** Absatz → Ziel erstellen. *(S)* — 43 Einheiten,
  jede mit genau einem Ziel; dazu die Liste der bewussten Streichungen mit
  Fundstelle der verbleibenden Quelle.
- [x] **P18-2 Nested CLAUDE.md** anlegen, Inhalte verschieben, Duplikate erst nach
  Zielprüfung streichen. *(M)* — ba0fee8; **vier** statt drei Dateien: `chapters/`
  bekam eine eigene, weil `WIP/CLAUDE.md` bei *jeder* WIP-Arbeit mitlädt und der
  Nummerierungs-/Querverweis-Block dort den Effekt zunichte gemacht hätte.
- [x] **P18-3 Wurzel-`CLAUDE.md`** auf Klasse A + Wegweiser-Tabelle eindampfen. *(S)*
  — 7b299ff, 41,9 KB → 7,6 KB (−82 %).
- [x] **P18-4 `DOKUMENTATION.md`** als Doku-Index mit „lies das, wenn …"-Spalte. *(S)*
  — ce73e16.
- [x] **P18-5 Verlustkontrolle** gegen `git show 41df9ff:CLAUDE.md`. *(S)* —
  mechanisch statt satzweise: 363 harte Bezeichner (Code-Spans, Pfade,
  `--css`-Tokens, Funktionsnamen, Versionen) extrahiert und in der Vereinigung
  der neuen Dateien gesucht. 17 Fehltreffer, davon 16 Zitier-/Präfix-/Umbruch-
  Artefakte (verifiziert), **eine echte Lücke** (Fragment→Themenkomplex-
  Zuordnung) → durch einen Reproduktions-Grep in `chapters/CLAUDE.md` geschlossen.
- [x] **P18-6 BACKLOG-Split**: Index + ein Item je Datei. *(M)* — 186d9fa,
  131 KB → 6,6 KB Index + `backlog/<item>.md`. Zerlegung mechanisch und
  **byte-exakt** (das Skript bricht ab, wenn Kopf + Item-Blöcke + Schwanz das
  Original nicht zeichengenau reproduzieren); 22 Items, alle verlinkt, keine
  verwaiste Datei. **Abweichung:** kein separates `BACKLOG_ARCHIV.md` — mit
  einer Datei je Item lädt erledigte Historie ohnehin nur mit ihrem Item, und
  ein zweiter Ablageort wäre eine weitere Stelle, die synchron bleiben müsste.
  Der Index trennt stattdessen „Offen"/„Erledigt" mit Zählern erledigt/offen.
- [x] **P18-7 Skills/Runbooks** auf die neuen Pfade verweisen lassen. *(S)* —
  bf2549b. „CLAUDE.md ergänzen" zeigt jetzt auf die **zuständige**
  verschachtelte Datei; die drei übrigen Skills bekamen je einen Zeiger dorthin;
  „Item 64"/„Backlog:64" (schon vor dem Split tote Verweise) und die
  „BACKLOG.md P12/P18"-Stellen zeigen auf die jeweilige Item-Datei.
  **Dabei zwei inhaltlich veraltete Stellen gefunden:** Skill *und*
  MIGRATION-Runbook beschrieben das MathJax-Abschnittspräfix noch als Konstante
  und als offenen Backlog-Punkt — es wird seit v1.7 pro Seite ermittelt
  (P12-0a, verifiziert 2026-07-24). Beide korrigiert.

### Nebenbefund beim Umbau

`aspekt_paletten.css` sagt im Kopfkommentar „Jeder Block setzt WERT- UND
ALIAS-Token (**18** gesamt)"; gezählt sind es **20** `--kb-*` je Block (plus 5
`--gk-*`). `CLAUDE.md` sagte korrekt 20. Kommentar-Korrektur offen.

---
