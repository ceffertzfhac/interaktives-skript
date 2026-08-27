<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P0 — Quick Wins & Risikoreduktion (S, niedriges Risiko)

- [x] **T: Kommentar-Leichen entfernen.** ~25 Block-Kommentare + Dutzende `//console.log` und auskommentierte Duplikate (z. B. `generate_highlight_boxes` hat 50 Zeile auskommentiertes Duplikat, `update8` phi_span-Block, jQuery-CDN im HTML). Trägt keinen Wert, wird bei jedem Lesen mitgeladen. → `script.js` schätzungsweise −300–400 Zeilen.
- [x] **L/A: `qrjs2@latest` pinnen** (`index.html:18`) auf eine feste Version + ggf. SRI-Hash. `@latest` ist nicht reproduzierbar.
- [x] **A: MathJax-v2-Aufruf korrigieren.** `reload_mathjax()` nutzt `MathJax.Hub.Queue(...)` (v2-API), geladen ist v3 → No-op. Entweder v3-API (`MathJax.typesetPromise()`) oder Aufruf entfernen, falls nicht gebraucht. (`script.js:789`, `wait_reload_mathjax:792`)
- [x] **W: Doppelte Funktionsdefinitionen auflösen.** `animate6` (zweimal: 2404 & 2433 — zweite gewinnt still), `test` (295 in Kommentar vs. 785). Eindeutige Version behalten.
- [x] **W: `space()`-Lorem-ipsum-Platzhalter** (`script.js:488`) — Produktivinhalt ist Platzhalter. Entfernen oder durch echten Inhalt ersetzen.
- [x] **W: `//BUG!` in `update8`** (`script.js:2579`, `r8<0`-Clamp) als Issue dokumentieren oder fixen.
- [x] **W: Osterei `test()`** (Interaktiv-Umschalter über versteckte Buchstaben im Kontakt-Block, `index.html:56`/`script.js:785`) — entweder dokumentieren oder entfernen (überraschendes Verhalten).

