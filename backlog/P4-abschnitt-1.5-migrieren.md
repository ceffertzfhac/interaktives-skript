<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P4 — Abschnitt 1.5 fertig migrieren (v0.13 „Dynamik der Drehbewegung und Rotation starrer Körper") — ✅ ERLEDIGT

**Status 2026-07-24: vollständig migriert.** `chapters/ch_02_dynamik_drehbewegung.html`
hält alle 14 Unterabschnitte 1.5.1–1.5.14 mit echtem Inhalt (verifiziert: 0 Platzhalter-Boxen,
insg. 187 Gleichungen, 24 Abbildungen, 15 Bilder; 1.5.13 Rollbewegung allein 73 Gl./31 KB).
Die unten ehemals offenen Einträge sind erledigt; P4 wird nicht weiter verfolgt.

Die Vorarbeiten sind erledigt und blockieren nicht mehr: alle 13 Abbildungen
liegen in `bilder/` (inklusive der nachgelieferten Kippbedingungs-Bilder), das
Formelpräfix zählt pro Abschnitt, MathJax lädt das `physics`-Paket für
`\dd`/`\eval`. Vorgehen und Werkzeuge: Skill **v013-kapitel-migration**,
Hintergrund in `MIGRATION_v0.13_nach_HTML.md`.

**Sollwerte aus dem PDF** (via `referenznummern.py`): 127 Gleichungen
(1.5.1–1.5.127), Abbildungen 1.61–1.72, `Beispiel 1.5.1`, `Zusammenfassung 1.8`
(kapitelweit). Die Offsets am `<h2>` stehen bereits.

- [x] **1.5.3 Drehimpuls und (Massen-)Trägheitsmoment zu Ende** — 8 Gl. (11–18), Abb. 1.62 steht schon. *(S)*
- [x] **1.5.4 (Massen-)Trägheitsmoment** — 9 Gl. (19–27), 3 Abbildungen (Zylinder, Kugel, Steiner). *(M)*
- [x] **1.5.5 Drehmoment** — 3 Gl. (28–30), 1 Abbildung. *(S)*
- [x] **1.5.6 Anwendung des Drehmoments – Wippe und Hebelgesetz** — 1 Gl. (31). *(S)*
- [x] **1.5.7 Die Kippbedingung bei starren Körpern** — keine Gleichungen, aber das Bildpaar (Abb. 1.67) hat **keine Hauptunterschrift**: nur die beiden Teilunterschriften übernehmen, keine `<figcaption>` erfinden. *(S)*
- [x] **1.5.8 Zusammenhang zwischen Drehmoment und Drehimpuls** — 8 Gl. (32–39). *(S)*
- [x] **1.5.9 Drehimpulserhaltung** — 12 Gl. (40–51), 1 Abbildung. *(M)*
- [x] **1.5.10 Experimente zu Drehmoment, Drehimpuls und Drehimpulserhaltung** — 3 Gl. (52–54), Maxwell-Rad-Abbildung. *(S)*
- [x] **1.5.11 Rotationsenergie** — 9 Gl. (55–63). *(S)*
- [x] **1.5.12 Rotation und Translation** — 1 Gl. (64). *(S)*
- [x] **1.5.13 Rollbewegung** — **63 Gleichungen (65–127)**, 2 Abbildungen; mit Abstand der größte Brocken, eigene Sitzung einplanen. *(L)*
- [x] **1.5.14 Zusammenfassung** — keine Gleichungen, enthält `Zusammenfassung 1.8` und die einzige Tabelle des Abschnitts. *(S)*
- [x] **Abschluss** — die 11 `\ref` der Quelle als `data-ref-*`-Anker auflösen (darunter Verweise auf Abschnitt 1.4), `\point`/`\SI`/Fußnoten wie gehabt; danach Verifikation nach Skill **v013-verifikation**: Soll und Ist müssen **pro Unterabschnitt** deckungsgleich sein, nicht nur in der Summe.

---

