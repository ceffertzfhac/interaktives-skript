<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P11 — Schmaler Header (≤ 1024 px): Brand verdichten + Width-Buttons S/M/L

Eingetragen 2026-07-24 nach Nutzervorgabe (P10 brachte optische Kollisionen im
schmalen Header ans Licht). Ab dem Tablet-Breakpoint (**≤ 1024 px**, zuvor
760 — Nutzervorgabe „früher greifen") wird der Header verdichtet:

- **Width-Mode-Buttons** „Schmal/Normal/Breit" → „S/M/L" (CSS-only: Text
  `font-size:0`, Buchstabe per `::after` + `[data-mode]`; Volltext bleibt im
  DOM für Screenreader, `title`-Tooltip erhalten).
- **Eyebrow** „FH Aachen · FB 8 · Physik" ausblenden.
- **Titel** zweizeilig „Interaktives / Skript v1.8" — bedingter `<br>` zwischen
  „Interaktives" und „Skript" (default `display:none`, bei ≤ 1024 px sichtbar).
- **Prototyp-Badge** ausblenden; **Version v1.8 bleibt** (Nutzerwahl).
- **„Text"-Wort** vor der Stufe („2/5") fällt ab ≤ 1024 px weg: `core.js`
  schreibt nur die Zahl, „Text" steckt in CSS `::before` (default sichtbar, am
  Breakpoint `content:""`). Kein Resize-Listener nötig.
  Author ist bei ≤ 1024 px bereits ausgeblendet.

- [x] **P11-1** `styles.css` 1024er Query: S/M/L + Brand-Verdichtung; `core.js`
  Stufen-Label reduziert; `::before` „Text"-Präfix. *(S)*
- [x] **P11-2** Verifikation (Sicht, Stufe 5). *(S)* — vom Nutzer selbst vorgenommen, OK.

---

