<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P16 — Wurf-/Fall-Figuren interaktiv (Kapitel 1.1 Kinematik)

Eingetragen 2026-07-30 nach Nutzervorgabe (*„Plane die Umsetzung aller Graphiken
zum freien Fall, senkrechten Wurf und schrägen Wurf auf interaktiv, lege dazu
backlogitems an"*). Detailliert **P12-E1** (1.1: `freier_fall` / `schraeger_wurf`).
Betroffen: zwei neue Motoren `src/figures/freier_fall/` + `src/figures/schraeger_wurf/`
+ pro Abbildung ein `src/figures/aspekt_*.js|.css` + `chapters/ch_01_01_kinematik.html`
(statische Abbildung jeweils auf `.nur-druck`, interaktive Variante `.nur-bildschirm`).
Runbook: **INTERAKTIVE_ASPEKT_FIGUREN.md** (Regel 1 Motor zuerst, Regel 2 kopieren +
feature-gate, Regel 3 „wie Abb. X" = pixel-identisch).

**Quellen-Inventar** (v0.13 `pskript_mech_kinematik_gmni_v4.tex`; alle Abb. bereits
statisch migriert in `ch_01_01_kinematik.html`):

| Thema | Abb. | WIP-`fig-…`-ID | Zeigt |
|---|---|---|---|
| Freier Fall | **1.3** | `freierfall_1` | s-t, h₀=10 m, y↑, Null Boden |
| Senkr. Wurf | **1.4** | `senkrechter_wurf_1` | s-t, v₀=10, h₀=20, y↑, Null Boden |
| Senkr. Wurf | **1.5** | `senkrechter_wurf_2` | s-t, y↑, Null Abwurfpunkt |
| Senkr. Wurf | **1.6** | `senkrechter_wurf_3` | s-t, y↓, Null Boden |
| Senkr. Wurf | **1.7** | `senkrechter_wurf_4` | s-t, y↓, Null Abwurfpunkt |
| Senkr. Wurf | **1.19** | `…geschwindigkeit_zeit_diagramm_senkr_wurf` | v-t, v₀=10, h₀=10 |
| Schräger Wurf | **1.9** | `schraeger_wurf` | Flugbahn + 2× s-t (x, y) |
| Schräger Wurf | **1.14** | `bahnkurve_schraeger_wurf` | Bahn y(x) + Schema |
| Schräger Wurf | **1.18a/b** | `…tangentiale_geschwindigkeit_schraeger_wurf` (+`_2`) | Tangential-v⃗ + Ortsvektor, 2 Koordinatensysteme |
| Schräger Wurf | **1.20** | `…geschwindigkeit_zeit_diagramm_schraeger_wurf` | 2× v-t (vx, vy) |

Nicht interaktiv (Nachbarschaft, kein Wurf/Fall-Plot): 1.8 Feder-Masse-Pendel,
1.10 Kreisbewegung, 1.11 Rutsche-Foto, 1.12 Schraubenbahn, 1.13 Spur-im-Schnee-Schema.

**Motor-Wahl (Runbook-Regel 1 — Motor zuerst):**
- **Motor A — `freier_fall` (1D)** aus `Input/Simulationen/Project_freier_fall_simulation/`
  (v2.5.0). Rein vertikal; Slider `h₀` (1,8…25 m) + `v₀` (−10…10 m/s; v₀<0 Abwärtswurf,
  v₀=0 freier Fall, v₀>0 Aufwärtswurf = senkrechter Wurf); s(t)/v(t)/a(t)-Diagramme;
  v⃗-/a⃗-Pfeile; Stoppuhr; **vier Y-Achsen-Konfigs** (↑/↓ × Boden/Abwurfpunkt —
  exakt die 1.4–1.7-Varianten); progressiver RAF-Datenlauf. Reuses
  `../kreisbewegung/lib/{hover,format,ticks,svg-text}.js`.
- **Motor B — `schraeger_wurf` (2D)** aus `Input/Simulationen/Project_schraeger_wurf_simulation/`
  (v1.6.0). 2D-Projektil; Slider `h₀`/`|v₀|`/`α` (α=0 horizontal, α=90 senkrecht =
  Obermenge); Wurfparabel y(x)/x(y); x(t)/y(t)/vx(t)/vy(t)/ax(t)/ay(t)/|v|(t);
  v⃗ + vx/vy-Zerlegung + a⃗; Vergleichsbahn (frozen); Reichweite/Scheitelhöhe/
  Auftreffwinkel; Precompute-then-interpolate. Reuses
  `../kreisbewegung/lib/{hover,format,ticks,svg-text,vectors}.js` (`export-image.js`
  nicht portiert — wie bei kreis_spiral weggelassen).
- **Beide Projekte** importieren `../../shared/js/*` (physisch nicht in `Input/`,
  aber als `src/figures/kreisbewegung/lib/*` bereits im WIP portiert) und
  `../shared/css/design-system.css` (nicht übernehmen — WIP hat eigene
  `aspekt_*.css`-Optik). Modultrennung constants/physics/render/state/ui wie die
  Vorbild-Motoren; `runtime.js` mit `createRuntime()`/`withStore`/`bindDom` +
  `store.idPrefix` in `q()` (Motor A `'ff<n>_'`, Motor B `'sw<n>_'`), analog
  `kreis_spiral`/`grundbegriffe`. Port-Änderungen minimal/additiv, als
  `PORT-AENDERUNG` markiert (idPrefix/q, trimmed initDOM, simDuration, Plot-Rect
  im graphScale, eigene Vektorlängen-Skalen).

**Vorlagen-Hierarchie** [[feedback-vorlagen-hierarchie]] pro Figur (alle drei
Vorbilder prüfen): (1) nächste Aspekt-Figur *nach Interaktionsmuster, nicht Thema*
  — zeit-scrub + gestapeltes Diagramm → `aspekt_weg_zeit`/`aspekt_periodendauer`;
  einzelner Graph + Vektor → `aspekt_betragv_zeit`/`aspekt_omega_zeit`; Bahnkurve
  ohne Zeitachse → neu (nächstes: `aspekt_kreisbahn` mit φ-scrub); (2) die
  Stand-alone-Sim (Motor A/B); (3) die statische v0.13-Abbildung; (4) Legacy.

**Entschieden 2026-07-30 (Nutzervorgabe):**
- **Granularität: 1:1 pro Abbildung** — jede statische Abbildung bekommt ihre
  eigene interaktive Aspekt-Figur als granulare Reduktion (wie bisher bei
  1.38/1.39/…). Die **volle Stand-alone-Simulation** wird *separat* später
  verfügbar (eigene öffentliche Instanz, s. Backlog „Link zur vollständigen
  Stand-alone-Simulation"), im Skript wird *schrittweise granular* erweitert.
  **Keine Konsolidierung** (kein Achs-Konfig-Toggle für 1.4–1.7, kein Koordinaten-
  system-Toggle für 1.18a/b) — jede der 11 Abbildungen = eine Figur.
  *(Für 1.18 am 2026-09-26 präzisiert: 1.18 ist **eine** Abbildung, (a)/(b)
  sind zwei Zustände derselben Animation → eine Figur, die beide Zustände
  zeigen kann, s. P16-8.)*
- **Motor-Wahl: beide Motoren** portieren (Empfehlung gefolgt) — Motor A
  `freier_fall` für 1.3/1.4–1.7/1.19, Motor B `schraeger_wurf` für 1.9/1.14/
  1.18a/b/1.20.

**Bearbeitungsreihenfolge entschieden 2026-08-28 (Nutzervorgabe:** *„ich wuerde
mich gerne an der Reihenfolge im Skript orientieren, und im Anschluss an die
,Busfahrt' weiter machen"*)**:** Abgearbeitet wird **entlang der Abbildungs-
reihenfolge in `ch_01_01_kinematik.html`**, nicht nach Motor oder Aufwand. Die
Busfahrt ist **Abb. 1.2**; der Faden laeuft also ab **Abb. 1.3** weiter. Die
Reihenfolge spannt P16 **und** P17 — die Items bleiben getrennt, die Queue ist
gemeinsam:

| Abb. | `fig-…`-ID | Item | Motor | Motor da? |
|---|---|---|---|---|
| 1.3 | `freierfall_1` | P16-3 | A `freier_fall` | nein → P16-1 |
| 1.4–1.7 | `senkrechter_wurf_1…4` | P16-4 | A | nein → P16-1 |
| 1.8 | `feder_masse_pendel_kinematik` | **P17-3** | `federpendel` | **ja** (P12-E6) |
| 1.9 | `schraeger_wurf` | P16-6 | B `schraeger_wurf` | nein → P16-2 |
| 1.10 | `kreisbewegung_1` | **P17-2** | `kreisbewegung` | **ja** — erledigt 14.09.2026 |
| 1.11–1.13 | `rutsche`, `schraubenbahn`, `spur_im_schnee` | — | — | bleiben statisch (P17-Entscheidung) |
| 1.14 | `bahnkurve_schraeger_wurf` | P16-7 | B | nein |
| 1.15 | `…unterschied_durchschnitt_momentan` | **P17-1** | `ableitung` | nein |
| 1.16–1.17 | `…tachometer`, `…vorwaerts_rueckwaerts` | — | — | bleiben statisch |
| 1.18 | `…tangentiale_geschwindigkeit_schraeger_wurf` | P16-8 (eine Figur, a/b umschaltbar) | B | ja |
| 1.19 | `…zeit_diagramm_senkr_wurf` | P16-5 | A | ja |
| 1.20 | `…zeit_diagramm_schraeger_wurf` | P16-9 | B | ja |

**Stand 2026-09-26:** erledigt sind Abb. 1.3–1.7 (P16-1/-3/-4), 1.8 (P17-3),
1.9 (P16-2/-6), 1.10 (P17-2), 1.14 (P16-7 + P16-7a) und 1.15 (P17-1, v1.53.0).
**1.18 und 1.19 stehen seit dem 26.09.2026 (P16-8, P16-5). Als Naechstes 1.20** (P16-9),
dann die Verifikation P16-10. *(Stand 2026-09-14 war: als Naechstes 1.15,
dann 1.18, 1.19 und 1.20.)* 1.19 und 1.20 sind billig: derselbe Motor.
*(Frueherer Stand 2026-08-28: nach 1.3–1.7 war 1.8 der naechste Schritt.)*
P16-5 (Abb. 1.19, v-t) ist dagegen billig geworden: derselbe Motor, dieselbe
Fabrik — dort waere nur der Diagrammtyp 'geschw' statt 'weg' zu setzen und der
v-Pfeil einzuschalten.

**Beim Bau von P16-3 aufgefallen, am 2026-08-28 entschieden und umgesetzt
(v1.37.5):** die Kurvenfarbe firebrick (#b22222) erreichte auf dem dunklen
Diagrammgrund des Darkmodes nur rund **1,6:1** Kontrast (fuer grafische Elemente
waeren 3:1 noetig). Nutzervorgabe: *„gerne ueber die drei farbmodi variieren und
gut sichtbar machen, aber nicht zu aufdringlich, optische konsistenz
weitestgehend sicherstellen"*. Umgesetzt als **ein gemeinsames Kapitel-1.1-Token
`--k11-kurve`** auf `.aspekt-figur` (aspekt_kreisbahn.css): Abb. 1.2
(`--bw-kurve`) und Abb. 1.3-1.7 (`--ff-fall`) verweisen per `var()` darauf und
koennen dadurch nicht mehr auseinanderlaufen — vorher standen zwei gleiche
Hex-Werte in zwei Dateien. Werte je Modus (nachgemessen im Browser, Kontrast
gegen den jeweiligen Diagrammgrund):

| Modus | Wert | Kontrast |
|---|---|---|
| normal hell | `#b22222` firebrick (Quelle Abb. 1.2) | 6,7:1 |
| normal dunkel | `#ff7777` (das Rot, das dieser Darkmode ohnehin fuehrt) | 6,8:1 |
| deuter hell/dunkel | `#D55E00` (wie `--gk-dba` derselben Palette) | 3,9 / 4,5:1 |
| tritan hell | `#c0392b` | 5,4:1 |
| tritan dunkel | `#e05a4a` | 4,8:1 |

Geprueft: in allen sechs Modi zeigen Buskurve, Bus-Icon, Fallkugel und
Fall-Kurve denselben Wert; `cvd_check.mjs` laeuft durch (Spiegel um das Token
ergaenzt, Ein-Farb-Sets abgefangen — die Figuren haben nur EINE Farbe, dort ist
allein der Kontrast die Pruefung).

**Beim Aufstellen der Reihenfolge aufgefallen (2026-08-28):**
- **Abb. 1.18 ist EINE `<figure>` mit ZWEI `<img>`** (`…_schraeger_wurf.png` +
  `…_2.png` nebeneinander), also *eine* Abbildungsnummer. P16-8 plant dort „2
  separate Figuren (1:1)" — beide haetten per `data-figref` dieselbe Nummer
  „Abb. 1.18". **Geklärt 2026-09-26: eine Figur, s. P16-8.** Die Optionen waren: zwei Figuren mit geteilter Nummer, eine
  Figur mit Koordinatensystem-Umschalter (widerspricht dem 1:1-Beschluss), oder
  a/b-Suffix in der Beschriftung.
- **P17-3 ist billiger geworden:** der `federpendel`-Motor ist seit P12-E6
  portiert, P17-3 ist damit *(M — nur Figur)* statt *(L — Motor + Figur)*.

### Offen zu Abb. 1.14 (nach dem Bau)

- [x] **P16-7a Fenster, Nulllinien und Ausnutzung in Abb. 1.14** *(M)* — **erledigt
  2026-09-26 (`f0ac366` v1.53.1 + `69939ca` v1.53.2)**, Ergebnis s. unten. —
  **Nutzerbefund 2026-09-14**, drei Punkte, die zusammengehören:
  1. die **Nulllinien** beider Bilder sollten ungefähr auf gleicher Höhe liegen;
  2. das Diagramm braucht im Modus „x-Achse auf dem Boden, y-Achse nach oben"
     **keinen Bereich unter Null** (aktuell bis −10 m) — das kostet Platz;
  3. **nach oben ist die Szene zu klein**, während im Diagramm oben Platz frei
     bleibt.

  **Stand:** Maßstabsgleichheit ist erreicht (v1.52.2, Parabeln in Szene und
  Diagramm pixelgleich, 0 % Abweichung in allen drei Breiten-Modi). Die drei
  Punkte oben sind damit **nicht** erledigt.

  **Ein erster Umbau am 14.09.2026 wurde wieder verworfen** — der Befund
  daraus ist die eigentliche Erkenntnis und gehört festgehalten:

  > Alle drei Punkte laufen auf **ein gemeinsames Fenster in Metern** hinaus,
  > das beide Bilder zeigen. Der Versuch, das umzusetzen, indem die Szene ihre
  > Breite aus dem Maßstab des Diagramms ableitet, ist **zirkulär**: die Szene
  > steht mit dem Diagramm in derselben Flex-Zeile, ihre Breite nimmt dem
  > Diagramm also Platz weg, worauf dessen Maßstab kleiner wird, worauf die
  > Szene neu rechnet. Im Versuch hat die Szene das Diagramm vollständig
  > verdrängt, und die Beschriftungen der Szene wuchsen mit (sie skalieren mit
  > dem SVG). Gemessen: Parabel 130 px → 228 px breit, aber das Diagramm war
  > weg.

  **Umgesetzt (2026-09-16/-26), anders als unten vorgeschlagen:** keine feste
  Breitenaufteilung, sondern EINE Einheit (viewBox-Einheiten je Meter) für
  beide SVGs und Aufteilung der Zeilenbreite im Verhältnis der viewBox-Breiten
  (`massstabAbgleichen()`) — damit ist der Faktor beider Seiten gleich, ohne
  Zirkularität. Punkt 2: y-Achse beginnt bei 0 (unter null nur 8 % Luft).
  Punkt 3: Diagrammfeld = Bounding-Box des Wurfs. Punkt 1 (v1.53.2): Szene so
  hoch wie das Diagramm, Erdboden im Abstand der Nulllinie von der Oberkante —
  gemessen deckungsgleich (Boden = Nulllinie auf den Pixel) in normal/breit,
  flach/steil/hoch; gestapelt (schmal) entfällt die Forderung.
  *Messfalle:* die Nulllinie liegt in `graph_group_single` mit
  `translate(56, 48)` — wer ihre `y1` über die CTM des SVG umrechnet statt über
  `getBoundingClientRect()` der Linie, misst 48 Einheiten zu hoch.
  **Beobachtet, nicht behoben:** bei h₀ = 0 steht das Strichmännchen unter dem
  Erdboden, und bei Zoom 2,00x (sehr flacher Wurf) wirkt die Kugel übergroß —
  beides schon vor v1.53.2 so.

  *(Ursprünglicher Vorschlag, nicht umgesetzt:)*
  **Was stattdessen zu tun ist** (Vorschlag, vor der Umsetzung zu entscheiden):
  die Breiten **fest** aufteilen (z. B. 45 % Szene / 55 % Diagramm) und *beide*
  Bilder über die **Höhe** bemessen, wie es `aspekt_federpendel.css` im
  vertikalen Aufbau vormacht. Dann ist der Maßstab beider Bilder allein durch
  die Zeilenhöhe bestimmt, die Zirkularität entfällt, und das gemeinsame
  Fenster lässt sich sauber setzen. Die Schriftgrößen der Szene brauchen dabei
  eine eigene Regel, sonst wachsen sie mit dem Maßstab.

### Sub-Tasks

- [x] **P16-0 Klärung** — Granularität: **1:1 pro Abbildung** (keine Konsolidierung);
  Motor-Wahl: **beide Motoren** (A + B). Vorlagen-Hierarchie pro Figur bei
  Umsetzung festgelegt. *(S)* — entschieden 2026-07-30.
- [x] **P16-1 Motor A portieren** *(L)* — **erledigt 2026-08-28 (`b09b851`)**:
  `src/figures/freier_fall/{constants,physics,state,render,runtime}.js`, 772 Z.,
  lib aus `../kreisbewegung/lib/`. PORT-AENDERUNGEN im Code markiert: `idPrefix`
  + `q()` (`ff<n>_`), lib-Pfade, `updatePhysicsFormulas()` prefix-gebunden, die
  Radio-Gruppen (`speed`/`diagram_mode`) ueber den Prefix im `name` statt
  dokumentweit (sonst fasst der Browser sie zu EINER Auswahlgruppe zusammen),
  ungenutzter letzter Parameter von `renderHoverTooltip` entfaellt. `ui.js` der
  Sim **nicht** portiert (Theme/CSV-Export/Akkordeon) — wie bei `federpendel`
  bringt die Aspekt-Figur ihre Bedienung selbst mit. Kein
  `initFreierFall()` in `main.js`: seit v1.7 gibt es keinen Stand-alone-
  Init-Pfad mehr, Motoren laufen ausschliesslich ueber `createRuntime()`.
  Geprueft: `node --check` auf allen fuenf Modulen, Importe aufloesbar (11
  render- + 6 physics-Exporte), zwei Instanzen mit getrennten Prefixen und
  getrennter `yAxisConfig`. Noch nicht verdrahtet — Seite unveraendert.
- [x] **P16-2 Motor B portieren** *(L)* — **erledigt 2026-08-31 (`43acff8`)**:
  `src/figures/schraeger_wurf/{constants,physics,state,render,runtime}.js`,
  1268 Z., lib aus `../kreisbewegung/lib/`. PORT-AENDERUNGEN im Code markiert:
  `idPrefix` + `q()` (`sw<n>_`), Radio-Gruppen (`speed`/`diagram_mode`) ueber
  den Prefix im `name`, lib-Pfade. **Neu gegenueber Motor A:**
  `physics.js::recomputeDerived()` — die Zerlegung von `v0` in `v0x`/`v0y` und
  die Zoom-Berechnung stehen in der Sim mitten in `ui.js::updateAll()`, und
  `ui.js` wird nicht portiert; ohne sie liest die Physik `v0x/v0y = 0` und aus
  jedem schraegen Wurf wuerde ein freier Fall. Kein `initSchraegerWurf()` in
  `main.js` (seit v1.7 gibt es keinen Stand-alone-Init-Pfad, Motoren laufen nur
  ueber `createRuntime()`). Geprueft: `node --check` auf allen fuenf Modulen,
  Importe aufloesbar (19 render- + 12 physics-Exporte), zwei Instanzen mit
  getrennten Prefixen und eigenen Zeitreihen, Physik gegen Handrechnung
  deckungsgleich.
- [x] **P16-3 Aspekt-Figur Abb. 1.3** *(M)* — **erledigt 2026-08-28**:
  `src/figures/aspekt_freier_fall.{js,css}`, `data-aspekt="freier-fall"`,
  `data-figref="fig-freierfall_1"`, `data-eqs="formel_freierfall4"`; statische
  Abbildung auf `.nur-druck`; Registrierung in `main.js::ASPEKT_FACTORIES` +
  `ASPEKT_SIM_URLS` (`sim_freier_fall`), CSS-`<link>` in `index.html`, v1.36.0.
  Vorlage: `aspekt_bus_weg_zeit.js` (Abb. 1.2 — dieselbe Zeitcursor-Bedienung,
  unmittelbarer Nachbar im Abschnitt) plus Gate-Muster aus `aspekt_federpendel.js`.
  Gating: `v0=0` fest (freier Fall), `yAxisConfig` up/ground fest, EIN Diagramm
  ('weg'), v-/a-Pfeil aus, einziger Parameter-Regler `h0`.
  Port-Aenderung am Motor noetig (mitgeliefert): `render.js` referenziert die
  Pfeilspitzen-Marker jetzt ueber `url(#<idPrefix>…)` statt ueber die festen
  Dokument-IDs `#arrowhead`/`#arrow-y` der Stand-alone-Sim — sonst zeigen die
  Achsenpfeile jeder zweiten Figur ins Leere.
  Geprueft: `figur_smoke.mjs` (alle Schritte fehlerfrei), `node --check` auf
  allen geaenderten Modulen, `dom_harness.mjs` (Abbildungsnummern unveraendert:
  88 Abbildungen, gleiche Luecken), Headless-Chromium ohne Konsolenfehler —
  Fallzeit 1,43 s bei 10 m bzw. 2,26 s bei 25 m, Kugel landet exakt auf dem
  Boden, Kurve waechst auf 173 Stuetzstellen und springt bei `h0`-Wechsel auf
  0 zurueck, Layout in schmal/normal/breit + Lupe ohne Ueberlauf, Dunkelmodus
  dreht Haus/Lineal/Gitter korrekt.
  **Stufe 5 (Sicht) erledigt** (Nutzerfreigabe 2026-08-28, Screenshots in
  schmal/normal/breit + Lupe + Dunkelmodus): dabei EIN Fehler gefunden und
  behoben (v1.36.1) — der Diagrammtitel war in jedem Modus oben angeschnitten,
  weil der obere Rand des Diagramm-SVG an den Rohwerten der Sim bemessen war,
  die Beschriftungen aber ueber `--kb-fs` 1,5-fach skalieren. Lehre fuer die
  Folgefiguren desselben Motors: bei eigenem Diagramm-SVG die Raender an der
  SKALIERTEN Schrift bemessen. Rest unauffaellig: Bildunterschrift traegt
  „Abb. 1.3", Physik-Formel aus `data-eqs` gesetzt, Live-Analyse plausibel
  (t = 1,00 s -> y = 5,09 m), Farbwort „rote" in Kurvenfarbe.
- [x] **P16-4 Aspekt-Figuren Abb. 1.4–1.7** *(M–L)* — **erledigt 2026-08-28**:
  vier Platzhalter `aspekt-senkrechter-wurf-1…4` in `ch_01_01_kinematik.html`,
  je eigene Motor-Instanz (ff1_…ff4_) und eigene Abbildungsnummer; statische
  Abbildungen auf `.nur-druck`. Startwerte aus v0.13: h₀ = 20 m, v₀ = 10 m/s
  nach oben, beide als Regler (v₀ von −10 bis 10 m/s: nach oben, nach unten,
  freier Fall). v1.37.0.
  **Architektur-Entscheidung:** die vier Figuren teilen sich mit Abb. 1.3 EINE
  Fabrik (`aspekt_freier_fall.js`); was sie unterscheidet (Achsenwahl, v₀, h₀),
  steht als `data-achse`/`data-v0`/`data-h0` am Platzhalter. Fünf Module wären
  fünfmal derselbe Code gewesen — die 1:1-Granularität bleibt trotzdem gewahrt
  (eigene Figur, eigene Instanz, eigene Nummer, KEIN Umschalter innerhalb einer
  Figur). `ASPEKT_FACTORIES` bildet `freier-fall` und `senkrechter-wurf` auf
  dieselbe Fabrik ab; das Stylesheet ist auf `data-motor="freier_fall"` gescopt
  statt auf den Aspekt-Namen. Als Regel in `src/figures/CLAUDE.md` festgehalten.
  Port-Aenderung am Motor (mitgeliefert): `store.posChar` — v0.13 nennt die
  Achse in ALLEN vier Varianten `y`, die Stand-alone-Sim schriebe bei Nullpunkt
  im Abwurfpunkt `s`. Betrifft Achsen-Miniatur, Diagramm-Achse, Diagrammtitel.
  Geprueft: `figur_smoke.mjs`, `node --check`, `dom_harness.mjs`
  (Abbildungsnummern unveraendert), Headless-Chromium ohne Konsolenfehler —
  fuenf unabhaengige Instanzen auf einer Seite, Flugzeit 3,28 s und Scheitelhoehe
  25,10 m in allen vier Varianten gleich, Ortswert bei t = 1 s korrekt je
  Koordinatensystem (+25,09 / +5,09 / −25,09 / −5,09 m), Bildunterschriften
  tragen Abb. 1.4–1.7. Stufe 5 (Sicht) steht aus.
  **Nachtrag (Nutzerfeedback 2026-08-28,** *„in der caption von 1.4 bis 1.7 steht
  hard gecodet die anfangsgeschwidigkeit sowie die starthöhe … noch schöner: die
  caption muss sich mit der reglung anpassen"*)**, v1.37.1:** die Bildunterschrift
  laeuft jetzt mit den Reglern mit (`<span data-wert="h0|v0|richtung">`, gefuellt
  von `updateCaptionWerte()`); das Symbol bleibt LaTeX und statisch, nur Zahl,
  Einheit und Richtungswort sind Text — MathJax setzt die Unterschrift nur
  einmal, ein spaeter geaenderter Formelausdruck wuerde nicht neu gesetzt.
  Dabei fiel ein **inhaltlicher Fehler** auf: der v0-Regler zeigte den
  PHYSIKALISCHEN Wert (y nach oben), auch in 1.6/1.7, deren Achse nach unten
  zeigt — dort stand „v0 = 10 m/s" an einer Achse, auf der ein Wurf nach oben
  negativ ist, waehrend Ort und Kurve derselben Figur sehr wohl in dieser Achse
  beschriftet sind. Regler und Unterschrift sprechen jetzt die Achse der
  jeweiligen Figur (Umrechnung beim Setzen); derselbe Wurf nach oben steht in
  1.4/1.5 als +10 m/s und in 1.6/1.7 als −10 m/s — genau der Vorzeichen-Effekt,
  den der Abschnitt zeigen will. Die Hinweiszeile unter dem Regler nennt die
  Bedeutung des Vorzeichens je Achse.
  **Nachtrag 2 (Nutzerfeedback 2026-08-28,** *„die ,physik' sektion muss noch an
  die unterschiedlichen koordinatensysteme angepasst werden bis 1.4 bis 1.7"*)**,
  v1.37.2:** alle vier Figuren zeigten die Gleichung des Fliesstextes, die nur
  fuer 1.4 gilt. Jede Figur bringt jetzt die Gleichung ihres Koordinatensystems
  mit (`BEWEGUNGSGLEICHUNG` je `data-achse`), als statische `.formula-box` mit
  Querverweis auf die Fliesstext-Formel und einer Zeile dazu, wie h0 und v0
  gezaehlt sind. Dank der Vorzeichenkonvention aus v1.37.1 unterscheiden sich
  die vier nur im Vorzeichen des g-Terms und im h0-Term — der v0-Term bleibt
  ueberall `+v0 t`. Nachgerechnet gegen die laufenden Figuren.
  **Nachtrag 4 (Nutzervorgabe 2026-08-28):** Abb. 1.5-1.7 stehen jetzt am ENDE
  der Beispielbox, nach Abb. 1.4 ueberleitet ein neuer Absatz (Aussehen UND
  Formel haengen vom Koordinatensystem ab, eine Parabel bleibt es immer).
  Abbildungsnummern unveraendert. Abweichung von v0.13 -> BACKLOG P21.

  **Nachtrag 3 (Konsistenzpruefung auf Nutzerwunsch + Vorgabe** *„starte alle
  captions mit einer kurzen Erklaerung des Koordinatensystems"*)**, v1.37.3:**
  23 Parameterkombinationen (h0, v0, je fuenf Zeitpunkte bis zur Flugzeit) in
  allen fuenf Figuren gegen die Formel der Physik-Karte nachgerechnet —
  Abweichung 0,00 m, Flugzeit und Scheitelhoehe ebenfalls exakt. Gefunden und
  behoben wurden drei Inkonsistenzen der ERKLAERUNGEN (nicht der Rechnung):
  1. Die Fussnote nannte \(h_0\) auch dort, wo es in der Gleichung gar nicht
     vorkommt (1.5/1.7, Nullpunkt im Abwurfpunkt). Jetzt sagt sie dort
     ausdruecklich, dass \(h_0\) nicht in der Gleichung steht und der Regler
     nur bestimmt, wann der Boden erreicht ist.
  2. Der Gueltigkeitsbereich fehlte: die Gleichung gilt bis zum Aufschlag
     (\(0 \le t \le t_\mathrm{fall}\)) — danach liegt das Objekt am Boden,
     und genau dort klemmt der Motor die Kurve ab.
  3. Abb. 1.3 hatte als einzige keine Formelkarte (Formel dynamisch aus dem
     Fliesstext). Jetzt haben alle fuenf dieselbe Karte; der Querverweis der
     Fussnote haelt die Verbindung zur Quelle (geprueft: 1.3 -> (1.1.9),
     1.4-1.7 -> (1.1.16), beide zeigen auf die richtige Gleichung).
  **Stufe 5 (Sicht) erledigt** (Nutzerfreigabe 2026-08-28, Screenshots von 1.4,
  1.6 und 1.7 in normal + Lupe): EIN Fehler gefunden und behoben (v1.37.4) —
  bei nach unten zeigender Achse mit Nullpunkt am Erdboden (Abb. 1.6) lagen
  Achsenpfeil und Label der Szenen-Miniatur unterhalb des Ausschnitts und
  fehlten; Ausschnitt jetzt 515 statt 480 hoch, nachgemessen fuer alle fuenf.
  Rest unauffaellig: Formelkarte, Querverweis, Live-Analyse, Vorzeichen-Hinweis
  und die nach unten laufenden Kurven sitzen richtig.
  Ausserdem beginnen jetzt ALLE fuenf Bildunterschriften mit dem
  Koordinatensystem und uebersetzen die Ausgangslage hinein: „startet 20,0 m
  ueber dem Erdboden (Regler h0), in diesem Koordinatensystem also bei y = 0;
  der Erdboden liegt bei y = +20,0 m" (Beispiel 1.7, Nutzervorgabe). Auch diese
  Koordinaten laufen mit den Reglern mit.
  Geprueft und in Ordnung befunden: Vorzeichen-Hinweiszeile je Achse,
  Flugzeit/Scheitelhoehe als bewusst physikalische (achsenunabhaengige) Groessen
  mit entsprechender Beschriftung, `getDisplayV` liefert bereits die
  Achsenkomponente (damit ist Abb. 1.19 vorbereitet), Achsenname y ueberall.
- [x] **P16-5 Aspekt-Figur Abb. 1.19** — senkrechter Wurf v-t (Motor A). *(S–M)*
  **erledigt 2026-09-26 (`c15b70a`, v1.54.0)**: sechste Variante der
  freier_fall-Fabrik über `data-diagramm="geschw"`, `data-ort="x"` (die
  Beispielbox nennt die Ortsachse x), `data-v0min="0"`. v-Pfeil an
  (`--kb-vlat`, wie v in Kap. 1.4), Analyse mit v(t) und t_max = v0/g,
  Formelkarte mit v(t) = −g t + v0 und Verweis auf die Textformel. Motor:
  Port-Änderung 4 erweitert (Achsen-Miniatur folgt posChar auch bei v-t), 5 neu
  („t / s“ unter dem Feld statt mitten darin, nur v-t). Doku: P21-A12,
  QUELLEN_FEHLER 1.1 Nr. 7 (t_Wurf-Formel).
  **Beobachtet, nicht behoben:** in den Weg-Diagrammen mit nach unten
  zeigender Achse (Abb. 1.6/1.7) steht „t / s" ebenfalls mitten im Feld (unter
  der oben liegenden Nulllinie), und die t-Marke „0,00" stößt an die „0" der
  y-Achse — Verhalten der Quelle, bei 1.6/1.7 bewusst nicht angefasst.
- [x] **P16-6 Aspekt-Figur Abb. 1.9** *(M)* — **erledigt 2026-08-31 (v1.43.0)**:
  schräger Wurf, Flugbahn + zwei gestapelte Weg-Zeit-Diagramme y(t)/x(t).
  Erste Figur mit **gestapelten** Diagrammen auf dieser Motor-Familie; Vorlage
  war `aspekt_freier_fall.js`, neu sind nur der Stapel-Modus und der
  α-Regler. Aspekt-Gating: Diagrammpaar fest, Achse fest (y↑/Null Erdboden),
  v- und a-Vektor aus, Vergleichsbahn aus; Regler h0/v0/α + Zeit, mitlaufende
  Bildunterschrift.
  **Neuer Fallstrick (im Modulkopf und in `src/figures/CLAUDE.md`):**
  `updateGraphs()` schaltet Einzel- gegen Stapelmodus über `style.visibility`,
  nicht über `display` — die gestapelten Gruppen dürfen im Skelett **kein**
  `display:none` tragen, sonst bleiben sie unsichtbar.
  Geprüft: Smoke-Test, DOM-Harness (Nummerierung unverändert), im Browser
  beide Kurven im Gleichschritt wachsend (t=1,2 s: je 73 Punkte), Rückfall auf
  t=0 bei Parameterwechsel, keine Konsolenfehler, Physik gegen Handrechnung
  deckungsgleich.
- [x] **P16-7 Aspekt-Figur Abb. 1.14** — Bahnkurve y(x) + Schema (Motor B).
  **erledigt 2026-09-14** (`033f2d3`, v1.52.0). **Kein neuer
  Interaktionsmuster-Zweig und kein neues Modul:** der Motor kann die Bahnkurve
  nativ (`graphType 'yx'`), `aspekt_schraeger_wurf.js` ist damit Familien-Modul
  für 1.9 **und** 1.14 (`data-kontext="bahn"` → Einzeldiagramm statt gestapelt).
  **Nutzerentscheidung vorab:** *mit* Zeitlauf, bedienungsgleich mit 1.9 —
  obwohl die gedruckte Unterschrift sagt, in der Bahnkurve sei nicht erkennbar,
  wo das Objekt zu einem Zeitpunkt ist. Die Bildunterschrift der interaktiven
  Figur benennt diesen Unterschied ausdrücklich (→ P21-A10).
  **Eine Abweichung von 1.9 war nötig:** nach einem Regler-Zug springt die Zeit
  ans **Ende** der Flugzeit statt auf 0. Fallstrick #20 verlangt den Rücksprung,
  damit die Kugel nicht mitten in einer Bahn steht, die es nie gab — am Ende der
  *neuen* Bahn ist das gewahrt, und das Diagramm zeigt die vollständige Kurve.
  Bei einer Figur, deren Gegenstand die Kurve **ist**, wäre ein leeres Diagramm
  nach jeder Parameteränderung das falsche Bild. *(Lehre: #20 sagt „Zeit
  zurücksetzen", gemeint ist „nicht in einem ungültigen Zustand stehen bleiben" —
  bei zeitlosen Darstellungen ist das Ende die richtige Stelle.)*
  Geprüft: `figur_smoke` beide Varianten, `dom_harness` unverändert,
  `breiten_check` deckungsgleich mit 1.9 (41/76, 34/63, 34/64).
- [x] **P16-8 Aspekt-Figur Abb. 1.18** — Tangentialgeschwindigkeit + v⃗/
  Ortsvektor, 2 Koordinatensysteme (Motor B). *(M)*
  **Entschieden 2026-09-26 (Nutzer):** *„es braucht nur eine animation dazu.
  die statische abbildung zeigt zwei abbildungen der selben animation."* —
  also **eine** interaktive Figur mit **einer** Nummer (Abb. 1.18); (a) und (b)
  sind zwei Zustände derselben Animation (Ursprung am Boden / im Abwurfpunkt),
  umschaltbar in der Figur. Die statische Doppelabbildung bleibt als
  `.nur-druck` unverändert stehen. Löst den früheren Plan „2 separate Figuren"
  und die offene Nummern-Frage oben ab.
  **Erledigt 2026-09-26 (`54b374a`, v1.55.0):** dritte Variante der
  schraeger_wurf-Fabrik (`data-kontext="vektor"`), nur Szene; Ortsvektor als
  figur-eigene Linie (blau, `--kb-omega`, Kapitelstrichstärke über
  `[id$="position_vector"]`, Spitze im Kugelmittelpunkt), Geschwindigkeit
  orange (`--kb-vlat`); Umschalter (a)/(b) lässt die Zeit laufen; Szene oben
  auf den Wurf zugeschnitten. Doku: P21-A13, QUELLEN_FEHLER 1.1 Nr. 4/8.
  **Offen gelassen / beobachtet:**
  - Das statische Doppelbild der Quelle ist **nicht** gesichtet (Bildanalyse
    nur mit „JA"); Aufbau, Farben und (a)/(b) stammen aus Unter- und
    Teilunterschriften. Startwerte h₀ = v₀ = 10, α = 45° sind gewählt, nicht
    aus dem Bild abgelesen.
  - Ortsvektor **blau** wie die Quelle sagt — in Kap. 1.4 ist der Ortsvektor
    dagegen grau (`--kb-rlat`). Kapitelübergreifend zu entscheiden.
  - `--kb-omega` bleibt im Darkmode der Normalpalette #1555A2 — auf dunklem
    Grund knapp; gilt ebenso für ω in Kap. 1.4 (kapitelweite Einstellung).
- [x] **P16-8a Abb. 1.18 zurücknehmen und ergänzen** *(S–M)* — **erledigt 2026-09-26 (v1.55.1)**. **Nutzerbefund
  2026-09-26** (Wortlaut: *„die vektoren sind mir ein hauch zu prominent.
  default gestrichelt, etwas transparent und etwas dünner als die aktuelle bahn
  die ganze bahn einbauen. per checkbox eine variable tangente an die bahn
  einbauen, default on."*). Drei Punkte:
  1. **Vektoren dezenter** — Orts- und Geschwindigkeitsvektor etwas dünner
     (figur-eigener Wert für `--kb-vec-hw`, wie 1.42 es vormacht; die
     kapitelweite Regel bleibt).
  2. **Ganze Bahn von Anfang an** — die vollständige Flugbahn als Vorschau,
     **gestrichelt, etwas transparent, etwas dünner** als die mitwachsende Spur.
  3. **Tangente an die Bahn** — eine Gerade durch den momentanen Ort, tangential
     zur Bahn (wandert mit der Zeit mit), per **Checkbox, Vorgabe an**.
  Umgesetzt: Lesart per Rückfrage bestätigt (gestrichelt/transparent/dünner
  gilt der Vorschau der ganzen Bahn, nicht den Vektoren). Vektoren über
  `--kb-vec-hw: 2.5px` (wie 1.42/1.8), Vorschau als figur-eigene Polyline aus
  denselben Zeitreihen wie die Spur (1,4 px, Strich 5/4, Deckkraft 0,45),
  Tangente als neutrale dünne Gerade (`--kb-text2`) durch die Kugel in
  v-Richtung, Checkbox „Tangente an die Bahn einblenden" im Bedienfeld.
- [ ] **P16-9 Aspekt-Figur Abb. 1.20** — schräger Wurf 2× v-t (vx/vy) (Motor B). *(S–M)*
- [ ] **P16-10 Verifikation** — pro Figur: Static `.nur-druck` + `data-figref`-
  Übertrag (Abb.-Nummer unverändert), `node --check`, Smoke, Nummerierung (keine
  Regression), CVD-Palette (P-AF-2 — neue Vektor-Tokens für v⃗/vₓ/vᵧ/a⃗ kapitel-
  konsistent in `aspekt_kreisbahn.css`/`darkmode.css`/`aspekt_paletten.css`),
  Stufe 5 (Sicht) nur nach Freigabe „JA" [[feedback-screenshot-freigabe]]. *(M)*

---

