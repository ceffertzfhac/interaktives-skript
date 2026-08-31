<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P23 — Startzustand: kein Roh-Flash, letzte Seite wiederherstellen

Eingetragen 2026-08-31 nach Nutzermeldung an der veröffentlichten Fassung
v1.39.1 (*„nach dem Neuladen wird immer erst ungerendert die 0.1 angezeigt und
dann nach ein paar Sekunden der Sprung auf 0.0 … wünschenswert wäre, wenn die
letzte Seite, auf der man war, wieder geöffnet ist"*).

- [ ] **P23-1 Ladeblende: kein unpaginiertes, ungesetztes Skript zeigen** *(S–M)*
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

- [ ] **P23-2 Zuletzt gelesene Seite wiederherstellen** *(S)*
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

### Zusammenhang mit anderen Items

- **P22** (Ladezeit) hat die Gesamtdauer von 13,1 s auf 8,3 s gesenkt; P23-1
  ist der davon unabhängige *optische* Anteil — die Zeit bleibt, aber der
  Leser sieht keinen falschen Zwischenzustand mehr.
- P23-1 ist kein Ersatz für **P22-3c** (seitenweises Setzen): das würde die
  Zeit selbst verkürzen, die Blende verdeckt sie nur.

---
