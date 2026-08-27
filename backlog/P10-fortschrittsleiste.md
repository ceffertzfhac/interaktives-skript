<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P10 — Fortschrittsleiste in der Top-Bar je nach Platz kürzen/strecken

Eingetragen 2026-07-24 nach Nutzervorgabe. Die Fortschrittsleiste
(`.chapter-progress-track`) ist heute **starr 130 px** (styles.css ~1612);
`.chapter-progress` hat `flex-shrink:0` (~683) und holt sich keinen Platz — der
Füllbalken (span) skaliert zwar prozentual, aber die Bahn bleibt immer 130 px
egal, wie viel Platz im `#header` (Flex-Zeile: Brand · Divider · Breadcrumb ·
Fortschritt · Pager · Toolbar) frei ist.

**Ziel:** Bahn je nach verfügbarem Platz strecken/kürzen (breit bei viel Platz,
schmal bei wenig, ggf. ausblenden im schmalen Tablet-Header).

**Ansatz (rein CSS, kein JS):** `.chapter-progress-track` von festem `width`
auf `flex: 1 1 auto` + `min-width`/`max-width`; `.chapter-progress` wachsen
lassen (`flex: 1 1 auto`, `flex-shrink` aufheben). Mindestbreite (~80 px)
schützt vor Kollaps; Media-Query blendet sie unterhalb einer Schwelle aus.
Konkurrenz mit Breadcrumb um den Rest-Platz beachten (evtl. Breadcrumb
mitschrumpfen lassen).

- [x] **P10-1** `styles.css`: Fortschrittsbahn flexibel (flex + min/max). *(S)*
- [x] **P10-2** Verifikation (Sicht, Stufe 5). *(S)* — vom Nutzer selbst vorgenommen, OK.

---

