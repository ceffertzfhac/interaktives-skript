<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P9 — Schiene (linke Seitenleiste) gefenstert: Vorgänger + aktives Kapitel + Nachfolger

Eingetragen 2026-07-24 nach Nutzervorgabe. P8-Entscheidung (b) „Schiene
unverändert — alle Kapitel flach" wird **revidiert**: die flache Auflistung aller
h2-Kapitel ist bei 15+ Kapiteln unlesbar und behandelt die Abschnitte (h3) im
Kapitel 0 nicht wie gewünscht.

**Heutiges Verhalten** (`shell.js::renderRailInto`, ~Z. 155–160): *alle* h2-
Kapitel werden als Zeile gelistet; nur das aktive Kapitel klappt seine h3-
Abschnitte aus. In 1.4.3 sieht man also 0.0 … 1.5 (alle Kapitel) mit 1.4
ausgeklappt — viel zu lang.

**Gewünschtes Verhalten (Nutzervorgabe)** — Schiene als **Fenster** um das
aktive Kapitel, genau drei Blöcke:
1. **Vorgänger-Kapitel** (das numerisch nächstkleinere vorhandene h2), nur die
   Zeile, **nicht** ausgeklappt.
2. **Aktives Kapitel** als Zeile + **alle** seine h3-Abschnitte ausgeklappt
   (1.4.1 … 1.4.n, aktiver Abschnitt markiert).
3. **Nachfolger-Kapitel** (numerisch nächstgrößere vorhandene h2), nur die
   Zeile, nicht ausgeklappt.

Beispiele (Nutzervorgabe):
- In **1.4.3**: Vorgänger 1.3 (fehlt → nächstkleineres), 1.4 mit 1.4.1…1.4.n
  offen, Nachfolger 1.5.
- In **0.1** (keine Abschnitte): nur 0.0 und 0.2 (Vorgänger/Nachfolger; aktives
  0.1 als Zeile dazwischen, ohne Abschnitte).
- In **0.3** (hat 0.3.1/0.3.2): 0.2 (zu), 0.3 mit 0.3.1/0.3.2 offen, 0.4 (zu).

**Offene Fragen (vor Umsetzung klären):**
- (a) **TK-Grenze**: In 1.4 fehlt der Vorgänger 1.3. „Nächstkleineres vorhandenes
  Kapitel" wäre **0.6** (übergreift Themenkomplex Grundlagen→Mechanik). Gewünscht:
  0.6 zeigen (wörtlich „nächstkleineres") oder Schiene innerhalb des aktuellen
  TK bleiben (dann kein Vorgänger, nur Nachfolger 1.5)?
- (b) **Aktive Kapitel-Zeile** bei kapitelseigenen Intro-Seiten ohne Abschnitte
  (0.0, 0.1, 0.4, 0.5, 0.6): stets anzeigen (zwischen Vorgänger/Nachfolger), oder
  unterdrücken, sodass nur die zwei Nachbarn stehen?
- (c) Erster/letzter Kapitel-Kompakt: 0.0 hat keinen Vorgänger, 1.5 keinen
  Nachfolger — nur den einen Nachbarn zeigen (naheliegend).

**Entschieden 2026-07-24:**
- (a) **TK bleibt** — Vorgänger/Nachfolger nur innerhalb desselben Themenkomplexes.
  In 1.4.3 zeigt die Schiene nur [1.4 (+Abschnitte), 1.5]; der 1.3-Vorgänger
  fehlt und 0.6 liegt im anderen TK → kein Vorgänger.
- (b) **Aktive Zeile anzeigen** — auch Intro-Seiten ohne Abschnitte (0.1) erscheinen
  als markierte Zeile zwischen den Nachbarn: [0.0, 0.1 (aktiv, ohne Abschnitte), 0.2].
- (c) Erster/letzter Kapitel-Kompakt: nur den einen Nachbarn zeigen.

**Risiko:** gering — nur `shell.js::renderRailInto`, rein Anzeige, kein
Paging-/Nummerierungs-/TOC-Eingriff. Drawer-Variante läuft über dieselbe
Funktion, wird mitgeändert. **Verifikation:** DOM-Harness deckt Schiene nicht
ab → Sicht (Stufe 5, Freigabe) oder JSDOM-Stichprobe der `renderRailInto`-Ausgabe.

**Verfeinerung 2026-07-24 (TK-Grenze weich, symmetrisch):** Ist das aktive
Kapitel das letzte seines TK, folgt nach einer dünnen Trennlinie (`.rail-tk-sep`,
Farbe `--border`) das erste Kapitel des nächsten TK als blasse Vorschau
(`.rail-tk-cross`, `--ink-3`, nicht fett); ist es das **erste** seines TK und es
gibt einen vorigen TK, steht das letzte Kapitel jenes TK blass **über** einer
Trennlinie — jeweils statt eines harten Bruchs. (Damit entfällt die
P9-Entscheidung a „am TK-Anfang kein Vorgänger" zugunsten der Symmetrie.) JSDOM:
1.4 → `[0.6 blass, Linie, 1.4 offen, 1.5]`; 0.6 → `[0.5, 0.6, Linie, 1.4 blass]`;
0.0 (ganz erster) / 1.5 (kein Folget-TK) → ohne Linie.

- [x] **P9-0** Grenzfälle (a/b/c) mit Nutzer klären. *(S)* — s.o. entschieden 2026-07-24.
- [x] **P9-1** `shell.js::renderRailInto` gefenstert (Vorgänger + aktiv + Nachfolger). *(S–M)* — Commit 48c1f91.
- [x] **P9-2** Verifikation (JSDOM-Stichprobe + Sicht). *(S)* — JSDOM grün;
  **Sicht (Stufe 5) offen** — nur nach ausdrücklicher Freigabe per Tipp.

---

