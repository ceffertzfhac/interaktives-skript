# Backlog — InteraktivesSkript_WIP

Entstanden aus dem initialen Code-Review (Stand: Legacy/WIP-Split). Ziel: Modernisierung nach State-of-the-art Web-Dev in den Dimensionen **Performanz, Aktualität, Wartbarkeit** und – besondere Priorität – **Token-Effizienz beim Arbeiten im WIP** (Kosten für Agenten-Edits).

> **Skalierbarkeits-Vorgabe (hard constraint):** Das finale Skript wird **deutlich größer** — ein *komplettes* Skript mit **15+ Kapiteln** und **vielen weiteren Abbildungen**; das klassische PDF-Skript hat **fast 400 Seiten**, d. h. auch der Prosa-Umfang ist in dieser Größenordnung. Stand **bei Entstehung dieses Backlogs** (Legacy/WIP-Split): ~9 Abschnitte, 11 interaktive Figuren, eine 2787-Zeilen-`script.js` und eine 1558-Zeilen-`index.html`. Stand **2026-07-30**: 17 Kapitel-Fragmente, 16 interaktive Aspekt-Figuren auf vier Motoren, keine `script.js` mehr (modularisiertes ESM), `index.html` 352 Zeilen (reine Shell) — die Monolith-Punkte sind also erledigt, die Skalierungs-Vorgabe bleibt. Die heutige Monolith- + Copy-Paste-pro-Figur-Architektur skaliert *nicht* dorthin (`script.js` → Zehntausende Zeilen, Figuren-Familien vervielfachen sich, `index.html` → Zehntausende Zeilen Prosa, nicht mehr in einem Edit-Context handhabbar). **Jedes Architektur-Item ist gegen das ~400-Seiten-/15+-Kapitel-Ziel zu bewerten; Hinzufügen eines Kapitels/ einer Figur muss O(1) Dateien und kleine Token-Kosten sein, nicht O(Größe-der-Gesamtdatei). Modularisieren muss sowohl Figuren-Logik *als auch* Prosa-Inhalt.**

Alle Änderungen **nur in `InteraktivesSkript_WIP/`**. `InteraktivesSkript_legacy/` bleibt eingefrorene Referenz.

Legende: Aufwand S/M/L · Risiko niedrig/mittel/hoch · Gewinn bezieht sich auf Laufzeit (L) bzw. Token/Edit (T)

---

## Diese Datei ist der Index

**Ein Item = eine Datei in `backlog/`.** Hier stehen nur Titel, Status und ein
Satz dazu — die Details, Begründungen und Sub-Tasks liegen in der jeweiligen
Datei (P18-6: das ganze Backlog auf einmal zu laden kostete ~33k Token, davon
rund 60 % abgeschlossene Historie).

Die Zahlen in „Sub-Tasks" sind **erledigt/offen**. Dateien **nicht umbenennen** —
die Links hier zeigen auf den Pfad.

### Offen

| Item | Sub-Tasks | Worum es geht |
|---|---|---|
| [P12 — Komplett-Integration aller noch fehlenden v0.13-Inhalte](backlog/P12-restliche-v013-inhalte.md) | 21/17 | Prosa vollständig (114/114 Unterabschnitte); offen: interaktive Figuren je Abschnitt, Quasi-Content, Asset-Pipeline, Verifikation |
| [P21 — Druckskript und interaktives Skript synchron halten](backlog/P21-statisches-skript-nachziehen.md) | 0/6 offen | **Pflichtregister:** jede inhaltliche Abweichung des WIP von v0.13 bekommt hier einen abhakbaren Eintrag (Regel in der Wurzel-`CLAUDE.md`) |
| [P22 — Ladezeit: Bilder und MathJax beim Seitenstart](backlog/P22-ladezeit-und-assets.md) | 3/1 | Bilder erledigt und live nachgemessen (38,9 MB → 1,6 MB); offen: MathJax setzt beim Start alle Formeln des Skripts (~12 s) |
| [P13 — Text- & Formel-Marker für Studierende](backlog/P13-marker-und-notizbuch.md) | 0/16 | 4 Farben, persistent; plus begleitendes Notizbuch (P13-N) |
| [P16 — Wurf-/Fall-Figuren interaktiv (Kap. 1.1)](backlog/P16-wurf-fall-figuren.md) | 4/7 | Motor A + Abb. 1.3–1.7 stehen; offen: Motor B + 5 Aspekt-Figuren, als Nächstes Abb. 1.9 |
| [P17 — Weitere interaktive Figuren aus Kap. 1.1](backlog/P17-weitere-figuren-kap-1.1.md) | 1/3 | Abb. 1.8 steht; offen: 1.15 Sekante/Tangente, 1.10 Kreisbewegungs-Komponenten |
| [P15 — Weiße Hintergründe aus Nicht-Foto-Abbildungen entfernen](backlog/P15-weisse-hintergruende.md) | 0/7 | Darkmode-Verträglichkeit der statischen Bilder |
| [P-Aspekt-Bus — Abb. 1.2 Strichmännchen als Mitfahrer](backlog/PA-aspekt-bus-strichmaennchen.md) | 0/3 | Ausbau der Busfahrt-Figur (Kap. 1.1) |
| [P6 — Cross-Referenzing & Verweissystem („Karte der Physik")](backlog/P6-cross-referenzing.md) | — | großes Paket, noch Vision: einheitliches datengetriebenes Verweismodell statt heutiger Ad-hoc-Mechanismen |
| [P3 — Offene Punkte aus der Verifikation Kapitel 1.4](backlog/P3-verifikation-kapitel-1.4.md) | 16/1 | offen nur noch die Browser-Phasen (Wort-für-Wort gegen PDF, Druck, Sicht) |
| [P5 — Bekannte Fehler (Interaktivität / Shell)](backlog/P5-bekannte-fehler.md) | 1/1 | offen: Formeln im Fliesstext fehlen sporadisch (Boxen bleiben da) — MathJax-Ladewettlauf, Messbefehl hinterlegt |
| [P19 — Doku-Hygiene: Restbefunde aus dem Review nach P18](backlog/P19-doku-hygiene.md) | 5/7 | P19-1..4 erledigt (`gcN` als abgelöst markiert, eine Quelle je Tatsache, Verifikations-O(n)-Muster aufgelöst, Drift-Wächter `doku_drift_check.py`); offen nur noch P19-5 Beobachtungsposten (`src/CLAUDE.md`-Größe, `CHANGES`-Rolle — triggert bei >20 KB) |

### Erledigt

| Item | Sub-Tasks | Worum es ging |
|---|---|---|
| [P0 — Quick Wins & Risikoreduktion](backlog/P0-quick-wins.md) | 7/0 | kleine, risikoarme Aufräumarbeiten |
| [P1 — Struktur & Token-Effizienz](backlog/P1-struktur-token-effizienz.md) | 9/0 | Modularisierung, Figuren-Fabrik, Globals einfrieden |
| [P2 — Aktualität, Responsivität, A11y](backlog/P2-aktualitaet-responsiv-a11y.md) | 8/0 | Tablet-Breakpoint, echte Buttons, `lang`, Safari-Workaround |
| [P4 — Abschnitt 1.5 fertig migrieren](backlog/P4-abschnitt-1.5-migrieren.md) | 13/0 | v0.13 „Dynamik der Drehbewegung und Rotation starrer Körper" |
| [P7 — Kapitel 0 („Grundlagen") migrieren](backlog/P7-kapitel-0-grundlagen.md) | 10/0 | Migration + QR-Druck + Druck-Auswahl-Dropdown + Sim-Link zur Stand-alone-Sim je Aspekt-Figur |
| [P8 — Inhaltsverzeichnis: 3-stufige Hierarchie](backlog/P8-inhaltsverzeichnis-hierarchie.md) | 6/0 | Themenkomplex → Kapitel → Abschnitt |
| [P9 — Schiene gefenstert](backlog/P9-schiene-gefenstert.md) | 3/0 | Vorgänger + aktives Kapitel + Nachfolger |
| [P10 — Fortschrittsleiste in der Top-Bar](backlog/P10-fortschrittsleiste.md) | 2/0 | je nach Platz kürzen/strecken |
| [P11 — Schmaler Header (≤ 1024 px)](backlog/P11-schmaler-header.md) | 2/0 | Brand verdichten + Width-Buttons S/M/L |
| [P20 — Hover-Erklärungen für Icon-Bedienelemente](backlog/P20-hover-tooltips.md) | 5/0 | `src/tooltip.js` löst `title` ab; 116 Elemente, Hover **und** Tastaturfokus |
| [P14 — Formel-Überstand je Width-Modus](backlog/P14-formel-ueberstand.md) | 5/0 | Mess-Werkzeug (Stufe 4b) + Behebung; 0 Übersteher in allen Modi, gegen Spalte und Boxrand |
| [P18 — Dokumentations-Architektur context-freundlich umbauen](backlog/P18-doku-architektur.md) | 8/0 | Wurzel-`CLAUDE.md` −82 %, Subsystem-Doku in verschachtelte `CLAUDE.md`, Doku-Index, Backlog-Split |
| [P-Aspekt-Figuren — Optik & Interaktion (Kap. 1.4)](backlog/PA-aspekt-figuren-optik.md) | 12/0 | ω-Regler, kapitelkonsistente CVD-Palette, Stoppuhr, Vektorstrichstärken-Regel, neue Figuren 1.46–1.51, Pause-Design in der Runbar |

### Grundlage

| Datei | Inhalt |
|---|---|
| [Zielarchitektur (skalierbar auf 15+ Kapitel)](backlog/zielarchitektur.md) | die Struktur, gegen die alle Architektur-Items zu bewerten sind — leitet die P1-Items |

---

## Reihenfolge

1. Erst **P0** abarbeiten (rasch, niedriges Risiko, senkt schon das Token-Volumen spürbar).
2. Dann **Per-Figure-Fabrik + Modularisierung + Globals einfrieden** (P1) als zusammenhängender Struktur-Refactor — das ist der zentrale Hebel für Token-Effizienz und Wartbarkeit; danach sind Animation (rAF) und DOM-Optimierung günstig in der Fabrik mitzuerledigen.
3. **P2** anschließend/parallel je nach Bedarf (Mobile/A11y).

Vor jedem Struktur-Refactor: Legacy-Ordner als Referenz sicher, Änderungen im Browser pro Figur verifizieren (`python3 -m http.server` aus `InteraktivesSkript_WIP/`).

---

## Ein Item hinzufügen

Neue Datei `backlog/PNN-<slug>.md` mit `## PNN — Titel` als erster Überschrift
(plus dem Kommentar-Header der bestehenden Dateien), dann **eine Zeile** in der
passenden Tabelle oben. Der Index darf nicht mit den Items mitwachsen — je Item
höchstens eine Zeile, Details gehören in die Item-Datei.
