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

**Stand 2026-08-28: P16-1 (Motor A) und P16-3 (Abb. 1.3) sind erledigt.
Naechster Schritt ist P16-4 (Abb. 1.4–1.7, senkrechter Wurf, vier Achsen-
Konfigurationen)** — derselbe Motor, vier separate Figuren; als Vorlage dient
`aspekt_freier_fall.js` (dort `v0` freischalten und je Figur eine andere
`yAxisConfig` setzen).

**Beim Bau von P16-3 aufgefallen (2026-08-28) — betrifft Kapitel 1.1 als
Ganzes:** die Kurvenfarbe firebrick (#b22222), die Abb. 1.2 aus ihrer
matplotlib-Quelle mitbringt und die Abb. 1.3 fuer Kugel + Kurve uebernimmt,
erreicht auf dem dunklen Diagramm-Grund des Darkmodes (--kb-graph-bg #161925)
nur rund **1,6:1** Kontrast (fuer grafische Elemente waeren 3:1 noetig). Beide
Figuren haben bewusst KEINEN Dunkel-Zweig fuer diesen Token. Zu entscheiden:
Kapitel 1.1 bekommt fuer den Darkmode eine aufgehellte Kurvenfarbe (dann fuer
**beide** Figuren zugleich, sonst reisst die Kapitel-Konsistenz), oder es bleibt
wie es ist. Nicht im Alleingang geaendert, weil es die bestehende Abb. 1.2
mitbetrifft.

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
- [ ] **P16-2 Motor B portieren** — `src/figures/schraeger_wurf/{constants,physics,render,state,runtime}.js`,
  Precompute-then-interpolate, reuse `../kreisbewegung/lib/*` inkl. vectors,
  `initSchraegerWurf()` aus `main.js::init()`. *(L)*
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
  dreht Haus/Lineal/Gitter korrekt. Stufe 5 (Sicht) steht aus.
- [ ] **P16-4 Aspekt-Figuren Abb. 1.4–1.7** — senkrechter Wurf s-t, 4 Y-Achsen-
  Konfigs (Motor A); **4 separate Figuren** (1:1, je eigene Achs-Konfig). *(M–L)*
- [ ] **P16-5 Aspekt-Figur Abb. 1.19** — senkrechter Wurf v-t (Motor A). *(S–M)*
- [ ] **P16-6 Aspekt-Figur Abb. 1.9** — schräger Wurf: Flugbahn + 2× s-t x/y
  (Motor B). *(M)*
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

