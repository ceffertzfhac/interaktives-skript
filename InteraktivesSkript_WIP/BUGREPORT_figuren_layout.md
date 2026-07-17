# Bug-Report: Sticky-Grafikspalte überlappt / skaliert inkonsistent / Splitter teils wirkungslos

**Projekt:** Interaktives Physik-Skript „Drehbewegungen auf Kreisbahnen" (FH Aachen)
**Betroffene Datei:** `InteraktivesSkript_WIP/src/splitter.js` (Funktion `applyScale`, Layout-Engine der rechten Grafikspalte)
**Beteiligt:** `src/styles.css` (`.grafik-container` / `.grafik-container-inner`), `src/core.js` (`make_static`), `index.html` (Figuren-Container)
**Version:** v1.4.6 — Problem nach drei Iterationen **ungelöst**.

---

## 1. Ziel-Anforderung (Soll)

Die rechte Spalte ist eine **sticky-Grafikspalte**: Während man eine Textsektion scrollt, bleibt die zugehörige interaktive Grafik rechts sichtbar (Pin bei Viewport-y = 50). Die Spalte soll **gleichzeitig** erfüllen:

1. **Überlappungsfrei** bei jedem Breiten-Modus (Schmal 900 / Normal 1150 / Extrabreit 1500 px `#content`) und jeder Prosa-Länge — sowohl zwischen aufeinanderfolgenden Figuren (Quer-Sektions-Handoff) als auch innerhalb einer Sektion mit mehreren Figuren.
2. **Einheitlich skaliert** — keine Figur deutlich anders (breiter/höher) als eine andere.
3. **Splitter-responsiv** — das Ziehen des Mittelstreifens (`--g` = Grafik-Anteil 0.25–0.50) ändert die Grafikgröße sichtbar.
4. **Nie winzig** — keine Figur degeneriert auf wenige Pixel.
5. **Size-Lock** — bei zu breit gewählter Grafikspalte wächst die Grafik nicht beliebig weiter (Weißraum statt Riesen-Grafik).

Diese fünf Anforderungen stehen teils im Widerspruch; der Bericht dokumentiert, warum drei Versuche jeweils einen Teil reparierten und einen anderen brachen.

---

## 2. Figuren- und Sektions-Map (`index.html`)

Aktive Figuren in Dokumentreihenfolge:

| Sektion | Figur | `index.html`-Zeile |
|---|---|---|
| 1.5 (außen) | gc4 (Radio-Bild-Swap) | 130 |
| 1.5.1 Kreisbahn | gc1 (2D-Polar) | 203 |
| 1.5.2 Winkel | gc9 (2D-Polar) | 309 |
| 1.5.3 Winkelgeschwindigkeit | gc32 | 462 |
| 1.5.4 Winkelbeschleunigung | gc51 | 603 |
| 1.5.5 Spezialfall gleichförmig | gc31 | 770 |
| **1.5.6 Winkelgeschw. als Vektor** | **gc3 (1018) + gc6 (1128)** — *einzige Sektion mit zwei Figuren* | 1011– |
| 1.5.7 Winkelbeschl. als Vektor | gc5 | 1287 |
| 1.5.8 Radialgeschwindigkeit | gc8 | 1433 |

gc7 (Zeile 1206) ist auskommentiert. **1.5.6 (gc3+gc6) ist der Sonderfall**, an dem die meisten Symptome hängen.

---

## 3. Layout-Geometrie (wie es funktionieren soll)

CSS (`styles.css:319–376`):

```css
.grafik-container      { position: sticky; top: 250px; width: 300px; height: 100%; }
.grafik-container-inner{ position: absolute; width: 300px; left: var(--gfx-left);
                         top: -200px; transform: scale(var(--scale,1));
                         transform-origin: top left; }
```

- `height:100%` des Platzhalters ist ein **No-Op** (~0px In-Flow-Höhe, da `inner` absolut ist) → der Platzhalter **reserviert keinen Vertikalraum**.
- Pin: `top:250` + Inner `top:-200` → Grafik-Top bei Pin = **50** (Viewport-y).
- `transform-origin: top left` → Grafik wächst nach unten, belegt `[50, 50 + natH·s]`, `s = --scale`, `natH` = naturale Höhe des Inners (gemessen via `offsetHeight`, Fallback `H_FLOOR=380`).

**Quer-Sektions-Handoff** (Figur i = letzte ihrer Sektion bei Sektionsboden `B`, nächste Figur j in Folgesektion bei `T_j`):
- i pinnt für `scrollY ∈ [T_i−250, B−250]`, danach Ride-up am Sektionsboden: Grafik-Top = `(B − scrollY) − 200`.
- j pinnt bei `scrollY = T_j−250` auf Viewport 50.
- Bei `scrollY = T_j−250`: i-Boden = `(B − T_j + 50) + H_i`. **Überlappung ⟺ `H_i > T_j − B`.**
- Die DOM-spatere Figur (j) malt über i → **bei gleicher Breite** überdeckt j die i vollständig = „sauberer Sticky-Swap", kein sichtbarer Überlapp. **Das ist der Schlüssel: einheitliche Breite = sauberer Handoff.**

**Mehrfachfiguren-Sektion (1.5.6: gc3+gc6):** beide pinnen gleichzeitig auf 250 → beide auf Viewport 50 → **Überlappung**, wenn nicht gestaffelt. Staffelung via `margin-top` am Inner (Versatz bleibt beim Ride-up erhalten, im Gegensatz zu Sticky-Top-Staffelung, die am gemeinsamen Boden kollabiert). `M_1=0`, `M_2 = H_1 + INTER_GAP(20)`.

---

## 4. Beobachtete Symptome (nacheinander gemeldet)

1. **„Winzige Grafik bei 1.5.7"** — gc5 degeneriert auf ~20 px.
2. **„Extrabreit + Trennlinie stark nach links → stellenweise Überlapp; einige Animationen deutlich anders skaliert als andere."**
3. **„Die Animationen skalieren gar nicht mehr mit dem Mittelstreifen — macht keinen Sinn."**
4. **„Problem ist nicht gelöst."** (aktuell, nach drittem Versuch; welches Symptom genau persistiert, wurde nicht spezifiziert.)

---

## 5. Die drei Versuche und warum jeder scheiterte

### Versuch 1 — Per-Figur-Quer-Sektions-Cap
**Idee:** Jede Figur i zusätzlich deckeln durch `H_i ≤ (T_j − B) − CROSS_MARGIN` (Gap = Sektionsboden → nächste Figur). `scale_i = min(want, SIZE_LOCK, crossGap_i / natH_i)`.

**Ergebnis:** Symptom 1 (winzige gc5). Für gc5 (1.5.7) ist `crossGap = T(gc8) − B(Sektion 1.5.7)` klein (zwischen Sektionsende 1.5.7 und gc8 steht nur die 1.5.8-Überschrift, ~30–50 px) → `scale_5` kollabiert auf ~0,05. **Schuld:** Die Inter-Sektions-Lücken sind im Dokument klein, obwohl die Grafik beim Scrollen viel länger sichtbar bleibt (sie pinnt ja). Der Cap misst die Lücke zwischen *Platzhaltern*, nicht die tatsächlich sichtbare Pin-Dauer. → **verworfen.**

### Versuch 2 — Ein globaler Scale + Stapel-Cap
**Idee:** EIN `--scale` für alle Figuren (→ einheitliche Breite → sauberer Handoff, einheitliche Größen; löst Symptom 2 »inkonsistente Skalierung«). Zusätzlich ein **Stapel-Cap**: der höchste Stapel (gc3+gc6) muss ins Viewport passen, `scale ≤ (vh − BOTTOM_MARGIN − (N−1)·INTER_GAP) / Σ natH`.

**Ergebnis:** Symptom 3 (Splitter wirkungslos). Der Stapel-Cap ist eine **Konstante** (hängt nicht von `--g` ab). Auf einem ~1080-px-Viewport bindet er bei `scale ≈ 1.17`. Sobald `want = (g·CONTENT_W − 70)/300` diesen Wert übersteigt — bei Extrabreit fast im gesamten Drag-Bereich (g ≈ 0.28–0.50) — wird `scale` flach geklemmt → der Splitter ändert sichtbar nichts. **Schuld:** Ein Cap, das nicht vom Splitter abhängt, übersteuert `want` und entkoppelt die Grafikgröße vom Drag. → **verworfen.**

### Versuch 3 — Ein globaler Scale, ohne Stapel-Cap (aktueller Stand)
**Idee:** `scale = min(want, SIZE_LOCK, viewportCap)` mit `viewportCap = (vh − VP_MARGIN) / maxNatH` (bindet nur auf kurzen Viewports). Kein Stapel-Cap → Splitter wieder responsiv. Begründung: das dynamische `margin-top` verhindert gc3/gc6-Überlappung bei jedem Scale ohnehin; dass der gc3+gc6-Stapel bei hohem Scale unten übersteht/abgeschnitten wird, sei das Originalverhalten und nicht das gemeldete Problem.

**Ergebnis:** Symptom 4 (»nicht gelöst«). Der Nutzer bestätigt das Problem als weiterhin bestehend, **ohne zu spezifizieren, welches der vier Symptome persistiert**. Vermutbare Kandidaten:
- Der akzeptierte Trade-off (gc3+gc6-Stapel ragt bei hohem Scale über den Viewport hinaus / wird abgeschnitten) ist für den Nutzer **kein** akzeptabler Trade-off — d. h. Anforderung 1 (Überlappungsfrei / nichts abgeschnitten) ist verletzt.
- Oder: ein anderer, noch nicht benannter Symptom-Pfad (z. B. ein spezifischer Modus × Splitter-Kombination, in dem `want` gegen `SIZE_LOCK` oder `viewportCap` stößt und erneut flach klemmt).

---

## 6. Aktueller Code-Stand (`splitter.js`, `applyScale`)

Konstanten:
```js
const G_MIN = 0.25, G_MAX = 0.50;
const WIDTHS = { schmal: 900, normal: 1150, breit: 1500 };
const NATURAL_W = 300, GRAPHIC_MARGIN = 70, H_FLOOR = 380;
const SIZE_LOCK = 1.5;   // hartes Scale-Cap
const INTER_GAP = 20;   // Spalt zwischen gestaffelten Figuren
const VP_MARGIN = 120;  // Viewport-Cap (nur kurze Viewports)
const DEFAULT_G = 0.30;
```

```js
function applyScale() {
    const vh = window.innerHeight;
    const want = (currentG * CONTENT_W - GRAPHIC_MARGIN) / NATURAL_W;
    const placeholders = content.querySelectorAll(".grafik-container");
    const figs = Array.from(placeholders).map(ph => {
        const inner = ph.querySelector(".grafik-container-inner");
        const sec = ph.closest("section");
        return { inner, natH: inner ? (inner.offsetHeight || H_FLOOR) : H_FLOOR, sec };
    });
    // Gruppen: aufeinanderfolgende Figuren mit gleichem <section>
    const groups = []; let cur = null;
    for (const f of figs) {
        if (!cur || cur.sec !== f.sec) { cur = { sec: f.sec, figs: [] }; groups.push(cur); }
        cur.figs.push(f);
    }
    let maxNatH = H_FLOOR;
    for (const f of figs) if (f.inner && f.natH > maxNatH) maxNatH = f.natH;
    const viewportCap = (vh - VP_MARGIN) / maxNatH;
    const scale = Math.max(Math.min(want, SIZE_LOCK, viewportCap), 0);
    content.style.setProperty("--scale", scale.toFixed(4)); // einheitlich; Inners erben
    for (const g of groups) {
        const vis = g.figs.filter(f => f.inner);
        let margin = 0;
        for (let i = 0; i < vis.length; i++) {
            const f = vis[i];
            f.inner.style.marginTop = (i === 0 ? 0 : margin) + "px";
            f.inner.style.removeProperty("--scale"); // Vererbung erzwingen
            margin += f.natH * scale + INTER_GAP;
        }
    }
}
```

Async-Re-Trigger (hinzugekommen, bleibt): `ResizeObserver` (rAF-debounced via `scheduleApply`) auf `#paper` (MathJax-/Font-/Modus-Reflow) und jedes `.grafik-container-inner` (Bild-Load); `window.resize` → `scheduleApply`; `refresh_figure_layout()` (exportiert) für `make_static()`-Re-Observe im Runtime-`test()`-Pfad. Kein Loop (transform/margin nicht im border-box).

Der alte Hardcode-Hack `#gc6 .grafik-container-inner { margin-top: 400px }` ist aus `styles.css` entfernt; die Staffelung übernimmt `applyScale` dynamisch.

---

## 7. Offener Zielkonflikt (für die dritte Stelle)

Die Anforderungen sind **nicht alle gleichzeitig mit einem einzigen globalen `--scale` erfüllbar**, und das ist die eigentliche unresolved-Tension:

- **Einheitliche Skalierung (2)** verlangt EIN `--scale` für alle Figuren → gleiche Breite → sauberer Handoff (1 quer).
- **Überlappungsfrei „nichts abgeschnitten" (1)** verlangt, dass der gc3+gc6-Stapel *und* jede Einzelfigur ins Viewport passen → Stapel-Cap.
- **Splitter-responsiv (3)** verlangt, dass `scale` mit `want` wächst → **kein** konstanter Cap, der `want` übersteuert.
- **Stapel-Cap ist konstant** (hängt nur von `vh` und `natH` ab, nicht von `--g`) → kollidiert mit (3).

Ein globaler Scale kann (1)+(2) oder (2)+(3) erfüllen, aber nicht (1)+(2)+(3) gleichzeitig, sobald `want` den Stapel-Cap übersteigt. **Versuch 2 opferte (3), Versuch 3 opfert (1) für den Stapel.** Beides wurde vom Nutzer abgelehnt.

Die unausgesprochene Frage, die vor jedem weiteren Versuch zu klären ist: **Darf der gc3+gc6-Stapel bei hohem Scale unten abgeschnitten werden?** Wenn nein (was Symptom 4 nahelegt), ist ein globaler Scale ungeeignet und die Lösung muss entweder
- (a) den gc3+gc6-Stapel selbst staffel-begrenzen (z. B. gc6 separat kleiner skalieren, so dass `H_3 + H_6 + INTER_GAP ≤ vh − VP_MARGIN` — das bricht (2) für gc6), oder
- (b) das Pin-Modell für Mehrfachfiguren-Sektionen aufgeben (z. B. nur gc3 pinnen, gc6 im Fluss darunter), oder
- (c) den Size-Lock dynamisch so koppeln, dass der Stapel bei Erreichen des Viewport-Bodens nicht weiter wächst, `want` aber im *nicht-Stapel*-Bereich weiter wirkt (Splitterresponsivität erhalten, außer wenn der Stapel es blockiert).

---

## 8. Reproduktion

```
cd InteraktivesSkript_WIP
python3 -m http.server 8000
# http://127.0.0.1:8000/index.html
```

Testmatrix:
1. Breiten-Modus durchschalten (Toolbar: Schmal / Normal / Extrabreit).
2. Pro Modus den Splitter (Mittelstreif) von ganz rechts (g=0.25) nach links bis Anschlag (g=0.50) ziehen.
3. Pro Kombination durch die Sektionen scrollen und beobachten:
   - **1.5.6 (gc3+gc6):** Staffelung, Überlappung der beiden, Abschneiden am Viewport-Boden bei hohem Scale.
   - **1.5.7 (gc5) → 1.5.8 (gc8):** Quer-Handoff, Überlappung, winzige gc5.
   - Einheitlichkeit der Größen über alle Figuren hinweg.
   - Reagiert die Grafikgröße sichtbar auf den Splitterdrag?
4. Seite mit leerem Cache (DevTools → Network → Disable cache + Slow 3G) laden: justieren sich die Grafiken nach MathJax-/Bild-Load nach?

Symptom-4-Pinning wäre der wichtigste nächste Schritt: **welches Symptom genau persistiert nach Versuch 3?** (Überlappung? Inkonsistente Größe? Splitter wirkungslos? Abgeschnittener Stapel?) Ohne diese Eingrenzung ist jeder vierte Versuch wieder raten.

---

## 9. Vorschläge / offene Fragen an die dritte Stelle

1. Zuerst **Symptom 4 eingrenzen** (s. §8 Ende) — sonst Gefahr einer vierten Iteration ins Blaue.
2. Entscheiden, ob der gc3+gc6-Stapel abgeschnitten werden darf (§7). Das ist die Weichenstellung für alle folgenden Lösungen.
3. Prüfen, ob ein **per-Gruppen-Scale** (statt global) vertretbar ist: gc3+gc6 dürfen einen eigenen, kleineren Scale bekommen, damit der Stapel ins Viewport passt, während alle Einzelfiguren `min(want, SIZE_LOCK)` behalten. Trade-off: gc6/gc3 ggf. etwas kleiner als die anderen (Teil-Verletzung von (2), aber nur in der einen Sektion).
4. Alternativ: **Pin-Modell für 1.5.6 aufgeben** — gc3 pinnen, gc6 im normalen Fluss unter dem Text platzieren. Entfernt den Stapel-Konflikt ganz, ändert aber das UX dieser Sektion.
5. Die Geometrie in §3 ist durchgerechnet und sollte als verbindliche Basis gelten; die Formel `H_i > T_j − B` für den Quer-Handoff ist korrekt, der Versuch-1-Fehler war, die Gap *anwendungsbezogen* (sichtbare Pin-Dauer) statt *platzhalterbezogen* zu interpretieren.