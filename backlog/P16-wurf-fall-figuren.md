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

### Sub-Tasks

- [x] **P16-0 Klärung** — Granularität: **1:1 pro Abbildung** (keine Konsolidierung);
  Motor-Wahl: **beide Motoren** (A + B). Vorlagen-Hierarchie pro Figur bei
  Umsetzung festgelegt. *(S)* — entschieden 2026-07-30.
- [ ] **P16-1 Motor A portieren** — `src/figures/freier_fall/{constants,physics,render,state,runtime}.js`,
  reuse `../kreisbewegung/lib/*`, `initFreierFall()` aus `main.js::init()`,
  PORT-AENDERUNG-Marker. *(L)*
- [ ] **P16-2 Motor B portieren** — `src/figures/schraeger_wurf/{constants,physics,render,state,runtime}.js`,
  Precompute-then-interpolate, reuse `../kreisbewegung/lib/*` inkl. vectors,
  `initSchraegerWurf()` aus `main.js::init()`. *(L)*
- [ ] **P16-3 Aspekt-Figur Abb. 1.3** — Freier Fall s-t (Motor A). Copy &
  feature-gate nächstes Weg-Zeit-Template; `data-aspekt` + `data-figref`,
  Registrierung `main.js::ASPEKT_FACTORIES`. *(M)*
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

