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

- [x] **P27-1 `--kopf-h` als CSS-Variable** *(S)* — **erledigt 2026-09-14**:
  `core.js::kopf_hoehe()` misst die Leiste und schreibt `--kopf-h` **und**
  `--anker-luft` an die Wurzel; `ANKER_LUFT` ist von `ui.js` nach `core.js`
  gewandert, weil dasselbe Maß jetzt zwei Verwendungen hat.
  Aufgerufen wird sie beim Init (nach `init_shell()`, vorher steht die Höhe
  nicht), bei `resize`, in `apply_text_size()` (die Leiste wächst mit der
  Schrift) und in `set_width_mode()` (der schmale Header ist anders hoch).
  `scrollToAnchor` misst nicht mehr selbst, sondern ruft dieselbe Funktion —
  damit **kann** der Sprung nicht mehr einen anderen Abstand meinen als das
  Einrasten.
- [x] **P27-2 Snap einschalten** *(S)* — **erledigt 2026-09-14** in
  `styles.css`: `scroll-snap-type: y proximity` auf `html`,
  `.aspekt-figur:not(.aspekt-im-overlay)` mit `scroll-snap-align: start` und
  `scroll-margin-top: calc(var(--kopf-h, 64px) + var(--anker-luft, 12px))`.
  Die Fallbacks greifen nur, falls JS (noch) nicht lief.
- [ ] **P27-3 Gegenmessung** *(S)* — **teilweise**: gemessen im Browser
  (1400×900, Abb. 1.10), Abstand der Figur-Oberkante zur Leistenunterkante nach
  dem Scrollen:

  | Start daneben | Ergebnis |
  |---|---|
  | ±35 px | **12 px — eingerastet** |
  | +90 px | 12 px — eingerastet |
  | +150 px | 12 px — eingerastet |
  | +250 px | 12 px — eingerastet |
  | +400 px | frei stehen geblieben |
  | +600 px | frei stehen geblieben |

  **Chromiums Fangbereich ist also ~250–400 px breit** und in CSS nicht
  einstellbar. Weiterscrollen bleibt leicht (+600 px landet frei), aber wer
  zufällig 150 px neben der Figur zum Stehen kommt, wird ausgerichtet. Ob das
  beim Lesen als hilfreich oder als Ziehen empfunden wird, entscheidet die
  Praxis — die Alternative wäre eine eigene JS-Lösung mit engerer Schwelle,
  deutlich mehr Aufwand.

  Seitenwechsel landet weiterhin bei `scrollY = 0` (der Snap zieht die erste
  Figur nicht nach oben).

  **Mehrere Figuren auf einer Seite:** geprüft an `p-1-1-7` mit **neun**
  Figuren. Jede rastet für sich ein, die Punkte arbeiten nicht gegeneinander;
  zwölf Schritte `scrollBy(+500)` durch die Seite ergaben 500 500 370 500 500
  500 410 500 500 500 366 500 — die drei verkürzten Schritte sind genau das
  gewollte Einfangen, kein Schritt blieb stecken.

  **Figur höher als das Fenster:** bei 1400×600 rastet sie **gar nicht** ein
  (angefordert 1579, gelandet 1579 — keine Bewegung). Das ist
  Spezifikationsverhalten und kein Fehler: ist der Snap-Bereich größer als der
  Sichtbereich, gilt jede Position, in der er den Sichtbereich füllt, bereits
  als ausgerichtet — es gibt also nichts zu korrigieren. **Wichtig ist, was
  nicht passiert:** die Figur hält niemanden fest. Beim üblichen Lesefenster
  (1400×900) tritt der Fall nicht auf, die höchste Figur misst dort 812 px.

  **Offen:** `sprung_ziele.mjs` (läuft).

  **Fallstrick beim Messen** (hat mich zuerst erwischt): die Kapitelbilder laden
  `lazy` und schieben das Layout. Wer die Zielposition VOR dem Scrollen misst
  und danach nicht neu misst, sieht „nicht eingerastet", wo in Wahrheit die
  Seite unter der Figur gewachsen ist. Erst Ruhe abwarten (~2,5 s), dann messen
  — dieselbe Lehre steht schon im Kopf von `sprung_ziele.mjs`.
