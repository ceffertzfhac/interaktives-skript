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
| 1.10 | `kreisbewegung_1` | **P17-2** | `kreisbewegung` | **ja** |
| 1.11–1.13 | `rutsche`, `schraubenbahn`, `spur_im_schnee` | — | — | bleiben statisch (P17-Entscheidung) |
| 1.14 | `bahnkurve_schraeger_wurf` | P16-7 | B | nein |
| 1.15 | `…unterschied_durchschnitt_momentan` | **P17-1** | `ableitung` | nein |
| 1.16–1.17 | `…tachometer`, `…vorwaerts_rueckwaerts` | — | — | bleiben statisch |
| 1.18 | `…tangentiale_geschwindigkeit_schraeger_wurf` | P16-8 | B | nein |
| 1.19 | `…zeit_diagramm_senkr_wurf` | P16-5 | A | nein |
| 1.20 | `…zeit_diagramm_schraeger_wurf` | P16-9 | B | nein |

**Stand 2026-08-28: P16-1 (Motor A), P16-3 (Abb. 1.3) und P16-4 (Abb. 1.4–1.7)
sind erledigt — die ersten fuenf Abbildungen des Kapitels laufen.** Naechster
Schritt in der Abbildungsreihenfolge ist **Abb. 1.8** (P17-3, Federpendel-Motor
steht bereits), danach **Abb. 1.9** und damit P16-2 (Motor B portieren).
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
  „Abb. 1.18". Vor P16-8 zu klaeren: zwei Figuren mit geteilter Nummer, eine
  Figur mit Koordinatensystem-Umschalter (widerspricht dem 1:1-Beschluss), oder
  a/b-Suffix in der Beschriftung.
- **P17-3 ist billiger geworden:** der `federpendel`-Motor ist seit P12-E6
  portiert, P17-3 ist damit *(M — nur Figur)* statt *(L — Motor + Figur)*.

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
- [ ] **P16-5 Aspekt-Figur Abb. 1.19** — senkrechter Wurf v-t (Motor A). *(S–M)*
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
- [ ] **P16-7 Aspekt-Figur Abb. 1.14** — Bahnkurve y(x) + Schema (Motor B, keine
  Zeitachse → neuer Interaktionsmuster-Zweig). *(M)*
- [ ] **P16-8 Aspekt-Figuren Abb. 1.18a/b** — Tangentialgeschwindigkeit + v⃗/
  Ortsvektor, 2 Koordinatensysteme (Motor B); **2 separate Figuren** (1:1). *(M)*
- [ ] **P16-9 Aspekt-Figur Abb. 1.20** — schräger Wurf 2× v-t (vx/vy) (Motor B). *(S–M)*
- [ ] **P16-10 Verifikation** — pro Figur: Static `.nur-druck` + `data-figref`-
  Übertrag (Abb.-Nummer unverändert), `node --check`, Smoke, Nummerierung (keine
  Regression), CVD-Palette (P-AF-2 — neue Vektor-Tokens für v⃗/vₓ/vᵧ/a⃗ kapitel-
  konsistent in `aspekt_kreisbahn.css`/`darkmode.css`/`aspekt_paletten.css`),
  Stufe 5 (Sicht) nur nach Freigabe „JA" [[feedback-screenshot-freigabe]]. *(M)*

---

