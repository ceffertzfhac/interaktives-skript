# Dokumentations-Index

Was es an Dokumentation gibt, was drinsteht und **wann man sie öffnet**. Zweck
dieser Datei: entscheiden können, welche Doku man braucht, **ohne sie zu laden**.

Aufbauprinzip (s. `backlog/P18-doku-architektur.md`): drei Ladeklassen — **A** liegt in jedem Turn
im Kontext, **B** lädt sich beim Anfassen des jeweiligen Ordners automatisch nach,
**C** wird bewusst geöffnet. Jede Information steht **genau einmal**, beim
nächstliegenden Konsumenten.

## A — immer im Kontext

| Datei | Inhalt | Lies das, wenn … |
|---|---|---|
| `CLAUDE.md` | Was das Projekt ist, Skalierbarkeits-Constraint, Start, Repo-Layout auf oberster Ebene, **Arbeitsregeln/Nutzervorgaben**, Wegweiser | liegt ohnehin vor; **hier nichts Subsystem-Spezifisches ergänzen** |

## B — lädt sich beim Anfassen des Ordners nach

| Datei | Inhalt | Lies das, wenn … |
|---|---|---|
| `InteraktivesSkript_WIP/CLAUDE.md` | Ordneraufbau der Site, Runbook-Übersicht, „kein Build"-Entscheidung | irgendetwas in der Arbeitskopie ansteht |
| `InteraktivesSkript_WIP/chapters/CLAUDE.md` | Fragment-Konvention (O(1)), Nummerierung + Offsets, MathJax-Gleichungsnummern, Querverweis-Deskriptoren, Bildgrößen | Kapitel-Prosa geschrieben/migriert wird, Nummern oder Verweise zweifelhaft sind |
| `InteraktivesSkript_WIP/src/CLAUDE.md` | Modul-Layout, Dependency-Graph, `data-action`-Binder, Paginierung, App-Shell, statisch/interaktiv, 3D→2D, Druck/QR/Zoom/Darkmode, Breiten-Modus, A11y, Safari-Workaround | irgendein JS/CSS geändert wird |
| `InteraktivesSkript_WIP/src/figures/CLAUDE.md` | Fabrik-Muster, die vier Motoren, Aspekt-Figuren + Dispatch, Optik-Tokens, Farbpaletten/CVD | an einer Figur gearbeitet wird |

## C — auf Abruf (Runbooks)

| Datei | Inhalt | Lies das, wenn … |
|---|---|---|
| `InteraktivesSkript_WIP/MIGRATION_v0.13_nach_HTML.md` | Runbook Kapitelmigration: Counter-Scopes, Asset-Pipeline (PDF/TikZ→PNG), LaTeX→HTML-Makro-Mapping, MathJax-Konfiguration, Querverweise, drei Prüf-Harnesse, **Katalog von 13 realen Fallstricken**, Checkliste | ein weiteres Kapitel aus `Input/v0.13/` migriert wird — **vorher lesen**, die meisten Fallen sind still |
| `InteraktivesSkript_WIP/INTERAKTIVE_ASPEKT_FIGUREN.md` | Runbook Aspekt-Figur: die drei Eröffnungsregeln, Konzept, Schritt für Schritt, **Katalog von 26 realen Fallstricken**, Checkliste | eine interaktive Figur gebaut oder erweitert wird — **vorher lesen** |
| `InteraktivesSkript_WIP/CHANGES_aspekt_1.38_1.40_und_grundgeruest.md` | Änderungshistorie seit der ersten (Singleton-)Aspekt-Figur | verstanden werden muss, *warum* eine Aspekt-Struktur so aussieht |
| (Skill `v013-verifikation`) | phasenweiser Prüfplan mit Abnahmekriterien, kapitelagnostisch (inkl. Browser-Phasen Stufe 5) | ein migriertes Kapitel geprüft wird — pro-Kapitel-**Ergebnis** steht im jeweiligen Backlog-Item (P3/P12) + Fragmentkopf, nicht in einer eigenen Datei |
| `InteraktivesSkript_WIP/QUELLEN_FEHLER.md` | Verzeichnis der Tipp-/Sprach-/Sachfehler in `Input/v0.13/` + die Konvention „1:1 übernehmen, nicht still korrigieren" und je Fund der Ist-Zustand im WIP (**erhalten** / **korrigiert**) | etwas in der Quelle falsch aussieht, oder entschieden wird, ob ein Fehler übernommen oder behoben wird |
| `InteraktivesSkript_WIP/src/vendor/README.md` | Herkunft, Lizenz und Prüfsumme von qrjs2 + warum es nicht per CDN kommt | die Vendor-Bibliothek angefasst oder aktualisiert wird |

## Planung, Außendarstellung, Recht

| Datei | Inhalt | Lies das, wenn … |
|---|---|---|
| `BACKLOG.md` | **Index** aller Backlog-Items: Titel, Status, ein Satz je Item | eine neue Anfrage eingeordnet oder der nächste Arbeitsschritt gewählt wird |
| `backlog/<item>.md` | ein Item je Datei: Begründung, Sub-Tasks, Entscheidungen, erledigte Historie | an einem konkreten Item gearbeitet wird — **nur die eine Datei öffnen** |
| `README.md` | öffentliche Projektbeschreibung + Abschnitt „Was drin ist (Arbeitsstand)" | der Arbeitsstand sich inhaltlich ändert (**Pflicht**, s. `CLAUDE.md`) |
| `DISCLAIMER.md` | Haftungsausschluss, Prototyp-Status (auch inhaltlich) | Fragen zu Gewährleistung/Veröffentlichung aufkommen |

## Ausführbare Helfer (Skills)

Anweisung + Skripte; die Begründung steht jeweils im verlinkten Runbook.

| Skill | Wofür | Skripte |
|---|---|---|
| `interaktive-aspekt-figur` | Aspekt-Figur bauen/erweitern | `figur_screenshot.mjs` (Sicht-Prüfung, Ink-Box), `figur_smoke.mjs`, `dom_vertrag.mjs`, `cvd_check.mjs` (Brettel + ΔE76), `caption_farbwort_check.mjs` |
| `v013-kapitel-migration` | Abschnitt aus v0.13 nach HTML | `formel_zeilenabstand.py` |
| `v013-abbildungen` | Abbildungen übernehmen, PDF/TikZ→PNG, Breiten | `bilder_pruefen.py`, `breiten_uebernehmen.py` |
| `v013-verifikation` | migriertes Kapitel prüfen | `dom_harness.mjs`, `mathjax_pruefen.cjs`, `referenznummern.py` |

## Wo Doku NICHT steht (bewusst)

Damit der Pflichtkontext nicht mit dem Projekt wächst, sind diese Dinge
**absichtlich** nirgends zentral aufgezählt — die genannte Quelle ist maßgeblich:

| Frage | Quelle |
|---|---|
| Welche Aspekt-Figuren gibt es, welche nutzt welchen Motor? | `src/main.js::ASPEKT_FACTORIES` + Kopfkommentar jeder `src/figures/aspekt_*.js` (nennt Vorlage **und** jede Abweichung) |
| Welcher Abschnitt ist migriert, welche Offsets gelten? | `data-*-offset` an den h2 in `chapters/`, Kopfkommentar jedes Fragments, `backlog/P12-restliche-v013-inhalte.md` |
| Welche Port-Änderungen hat ein Figuren-Motor? | Kopfkommentar von `src/figures/<motor>/runtime.js` bzw. `state.js` (im Code als `PORT-AENDERUNG` markiert) |
| Welche v0.13-Quellenfehler betreffen Abschnitt X? | Kopfkommentar des betroffenen Fragments + `QUELLEN_FEHLER.md` |
