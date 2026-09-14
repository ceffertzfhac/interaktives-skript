<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P27 — Interaktive Figuren rasten beim Scrollen an der Oberkante ein

Eingetragen 2026-09-14 nach Nutzervorgabe: *„Wenn man beim Scrollen eine
interaktive Grafik erreicht, hätte ich gerne, dass es ein kleines ,Haken' gibt,
wenn die interaktive Grafik die Oberkante des Sichtbereichs (unter der oberen
Leiste) erreicht, damit es einfach ist, die Grafik an den Bildschirm
auszurichten, aber auch einfach ist, wieder weiterzuscrollen."*

**Das Ziel in einem Satz:** die Figur soll sich *anbieten*, nicht festhalten —
wer in ihre Nähe scrollt, bekommt sie sauber unter der Kopfleiste ausgerichtet;
wer weiterliest, merkt nichts davon.

### Der Weg, der genau das beschreibt

CSS Scroll Snap mit **`proximity`** (nicht `mandatory`) — das ist wörtlich die
Anforderung: `mandatory` würde jeden Scrollvorgang zwingen, auf einem Snap-Punkt
zu enden (man käme an der Figur kaum vorbei), `proximity` rastet nur ein, wenn
die Bewegung ohnehin in der Nähe endet.

- Scroll-Container ist das **Dokument** (`window.scrollTo` in `ui.js`,
  `pages.js`, `center.js`) → `scroll-snap-type: y proximity` auf `html`.
- `.aspekt-figur:not(.aspekt-im-overlay)` bekommt `scroll-snap-align: start`.
- Der Snap-Punkt muss **unter** der klebenden Kopfleiste liegen, sonst rastet
  die Figur dahinter ein: `scroll-margin-top` in Höhe der Kopfleiste + Luft.

### Der Haken dabei (vor der Umsetzung zu klären)

1. **Die Kopfhöhe steht heute nur in JS.** `ui.js::scrollToAnchor` misst sie zur
   Laufzeit (`header.getBoundingClientRect().height`, plus `ANKER_LUFT = 12`),
   weil sie mit der Textgröße wächst — es gibt keine CSS-Variable dafür. Für
   `scroll-margin-top` braucht es eine: `--kopf-h` beim Init und bei jeder
   Textgrößen-/Breitenänderung setzen. **Das ist der eigentliche Arbeitsanteil**,
   und es räumt nebenbei eine Doppelung aus (JS-Messung *und* CSS-Wert).
2. **Kollision mit den Sprungzielen.** Schiene und Querverweise springen über
   `scrollToAnchor`; ein Snap-Punkt kann die erreichte Position nachträglich
   verschieben. Gegenmessung existiert: `sprung_ziele.mjs` (Stufe 4c, heute
   451/451 in Toleranz) muss nach der Umsetzung unverändert durchlaufen.
3. **Figuren, die höher sind als der Sichtbereich** dürfen nicht einsperren.
   `scroll-snap-stop` bleibt auf `normal` (Default) — nur so bleibt
   „weiterscrollen" leicht. Mit einer hohen Figur in der Lupe gegenprüfen.
4. **Nur im Fließtext, nicht im Overlay** — das Lupe-Overlay scrollt selbst.
5. **Reduzierte Bewegung:** bei `prefers-reduced-motion: reduce` unverändert
   lassen? Snap ist kein Effekt, aber der Sprung fühlt sich für manche wie einer
   an. Entscheidung des Autors.

### Sub-Tasks

- [ ] **P27-1 `--kopf-h` als CSS-Variable** *(S)* — beim Init und bei
  Textgrößen-/Breitenwechsel setzen; `scrollToAnchor` liest denselben Wert,
  damit es nur noch EINE Quelle für die Kopfhöhe gibt.
- [ ] **P27-2 Snap einschalten** *(S)* — `proximity` auf `html`,
  `scroll-snap-align: start` + `scroll-margin-top: calc(var(--kopf-h) + 12px)`
  auf den Figuren im Fließtext.
- [ ] **P27-3 Gegenmessung** *(S)* — `sprung_ziele.mjs` unverändert grün;
  von Hand über eine Seite mit zwei Figuren scrollen (dass nicht zwei Snap-
  Punkte gegeneinander arbeiten) und eine Figur prüfen, die höher ist als das
  Fenster.
