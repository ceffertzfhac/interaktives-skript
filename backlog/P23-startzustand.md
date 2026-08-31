<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P23 — Startzustand: kein Roh-Flash, letzte Seite wiederherstellen

Eingetragen 2026-08-31 nach Nutzermeldung an der veröffentlichten Fassung
v1.39.1 (*„nach dem Neuladen wird immer erst ungerendert die 0.1 angezeigt und
dann nach ein paar Sekunden der Sprung auf 0.0 … wünschenswert wäre, wenn die
letzte Seite, auf der man war, wieder geöffnet ist"*).

- [x] **P23-1 Ladeblende: kein unpaginiertes, ungesetztes Skript zeigen** *(S–M)*
  — **erledigt 2026-08-31 (v1.41.0)**, s. „Umsetzung" unten.
  Gemessen live, ohne Cache, jede Zeile ein Zustandswechsel:

  | t | Seiten | sichtbar | `mjx-container` | rohes `\begin{equation}` | oberste Überschrift |
  |---|---|---|---|---|---|
  | 1,03 s | 0 | 0 | 0 | 28 | 1.8 Gravitation |
  | 1,16 s | 0 | 0 | 0 | 513 | 0.0 Einleitung |
  | 6,41 s | 137 | 1 | 4925 | 0 | 0.0 Einleitung |

  **Rund 5,4 s lang steht das gesamte Skript unpaginiert und ungesetzt da**,
  mit rohem LaTeX im Fließtext. Welcher Abschnitt oben steht, ist Zufall: es ist
  das Kapitel-Fragment, dessen `fetch` zuerst zurückkam.

  **Ursache:** `chapters.js::loadChapters()` holt die 17 Fragmente parallel
  (`Promise.all`) und setzt jedes per `innerHTML` ein, sobald es da ist —
  zwischen diesen Netzwerk-Callbacks zeichnet der Browser. `paginate()` (das
  alle Seiten bis auf eine auf `display:none` setzt) und der Typeset-Lauf
  laufen erst, wenn *alle* Fragmente angekommen sind.

  **Richtung:** `#paper` bis zum fertigen Startzustand verdeckt halten und
  stattdessen eine schlichte Ladeanzeige zeigen; erst freigeben, wenn
  `paginate()` gelaufen ist (und, zu entscheiden, auch der erste Typeset-Lauf
  durch ist — dazwischen liegt praktisch keine Zeit, weil der Hauptthread
  ohnehin belegt ist). Kein Vorziehen einzelner Fragmente: die Reihenfolge ist
  Netzwerk-Zufall, und eine „halbe" Startseite ist genauso falsch.
  **Beim Umsetzen prüfen:** der Druck-Tab (`?print=true`) und der QR-Rückweg
  (`?g=…`) dürfen nicht unter der Blende hängenbleiben.

- [x] **P23-2 Zuletzt gelesene Seite wiederherstellen** *(S)*
  — **erledigt 2026-08-31 (v1.40.0)**, s. „Umsetzung" unten.
  Beim Laden ohne `#`-Anker soll die Seite erscheinen, auf der man zuletzt war.
  Heute: `pages.js::paginate()` liest `location.hash`, sonst Index 0.
  **Richtung:** die aktuelle Seiten-Id bei jedem `pagechange` nach
  `localStorage` schreiben und in `paginate()` als Vorgabe nutzen —
  Reihenfolge `location.hash` (expliziter Link gewinnt) → gespeicherte Seite →
  Index 0. Passt zu den vorhandenen Lese-Einstellungen, die schon so
  persistieren (`skript_width_mode`, `skript_palette`, `skript_text_level`,
  s. `core.js`); Schlüssel entsprechend `skript_last_page`.
  **Beim Umsetzen prüfen:** Druck-Tab und QR-Rückweg setzen die gespeicherte
  Seite nicht ungewollt um; ein leerer/unbekannter gespeicherter Wert (Seite
  existiert nach einer Migration nicht mehr) fällt sauber auf Index 0 zurück.

### Umsetzung (2026-08-31)

**P23-2** (`pages.js`, v1.40.0): `showPage()` schreibt die Seiten-Id nach
`localStorage` (`skript_last_page`), `paginate()` wählt in der Rangfolge
`location.hash` → gemerkte Seite → erste Seite; bei Wiederherstellung zieht
`replaceState` den Anker nach. Geprüft: Erstaufruf `p-0-0`; Neuladen ohne Anker
stellt wieder her; Anker gewinnt; unbekannte Id fällt zurück; Druck-Tab lässt
den Merker unberührt.

**P23-1** (`index.html`/`styles.css`/`main.js`/`chapters.js`, v1.41.0):
`#app_loading` verdeckt `#paper`, bis der erste MathJax-Lauf durch ist
(`typesetAfterLoad()` liefert dafür jetzt ein Promise). Gemessen: **0 Frames
mit sichtbarem rohem LaTeX** (vorher ~5 s). Die Regeln, die dabei nicht
wegoptimiert werden dürfen, stehen in `src/CLAUDE.md`.

**Zwei Fehler, die erst der Test fand — beide wären live fatal gewesen:**
- `ge()` war in `main.js` gar nicht importiert; `ladeblende_an()` warf sofort
  und brach damit die **ganze** `init()` ab (0 Seiten, 0 Formeln).
- `#app_loading{display:grid}` schlug per Spezifität (1-0-0 gegen 0-1-0) das
  Browser-Default `[hidden]{display:none}` — die Blende wäre sichtbar
  geblieben, obwohl das JS sie per `el.hidden = true` abgeräumt hatte.
  Merksatz: **wer eine id-Regel mit `display` schreibt, muss `[hidden]`
  ausnehmen.**

Beides zeigt, warum eine Blende ohne belastbaren Test nicht ausgeliefert werden
darf: der sichtbare Effekt beider Fehler ist „Seite bleibt leer".

### Zusammenhang mit anderen Items

- **P22** (Ladezeit) hat die Gesamtdauer von 13,1 s auf 8,3 s gesenkt; P23-1
  ist der davon unabhängige *optische* Anteil — die Zeit bleibt, aber der
  Leser sieht keinen falschen Zwischenzustand mehr.
- P23-1 ist kein Ersatz für **P22-3c** (seitenweises Setzen): das würde die
  Zeit selbst verkürzen, die Blende verdeckt sie nur.

---
