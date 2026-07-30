<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P-Aspekt-Figuren — Optik & Interaktion (Kapitel 1.4)

Eingetragen 2026-07-23 nach Nutzervorgabe (s. Memory: backlog-first-workflow).
Betroffen: `src/figures/aspekt_{kreisbahn,weg_zeit,winkel_zeit,vxvy_zeit}.js|.css`
+ `src/figures/kreisbewegung/` (Motor). Farben sollen kapitelweise konsistent
sein (s. P-AF-2).

**Status 2026-07-23: alle 5 erledigt** (P-AF-1/3/4/5 + P-AF-2). Offene Folge für
P-AF-2 (geschmacksabhängig, nicht selbst verifizierbar — Screenshot-Freigabe):
(a) v #0072b2 und rx #1f77b4 beide blau — in keiner 1.4-Figur gleichzeitig,
küftig ggf. deduplizieren; (b) 1.42 HV-Strichstärke 3,75 px vs 1.38/1.39/1.41
6 px kapitelweit angleichen? (c) CVD-Sichtprüfung der neuen vx-Violett-
Zuweisung per Freigabe-Tipp.

- [x] **P-AF-1: ω-Regler, an T gekoppelt.** Zusätzlicher Regler für die
  Winkelgeschwindigkeit ω, bidirektional an die Periode T gekoppelt (ω = 2π/T):
  bewegt man einen, folgt der andere. In jeder Aspekt-Figur, die T/ω exposes
  (Kreisbahn 1.38, Winkel-Zeit 1.41, ggf. Weg-Zeit 1.39 / vx-vy 1.42). Beachten:
  T-Slider ist logarithmisch/gequantelt — ω-Regler entsprechend abbilden.
  *(S–M)*
- [x] **P-AF-2: Kapitel-konsistente, farbfehlsichere Farbpalette.** Farben
  konsistent UND farbfehlsicher (colorblind-safe); wenn neue Objekte hinzukommen,
  braucht es mehr/andere, weiterhin unterscheidbare Farben. Konsistenz erstreckt
  sich über ein ganzes Kapitel (1.4: alle Figuren 1.4.1–1.4.x konsistent — r/v/a
  haben kapitelweit dieselbe Farbe); in 1.5 dürfen andere Farben stehen.
  Heutiger Stand: `--kb-r`/`--kb-rx`/`--kb-ry`/`--kb-v`/`--kb-a`/`--kb-traj`/…
  in `aspekt_kreisbahn.css` — prüfen, ob das schon kapitelweit einheitlich und
  cb-safe ist; ggf. zentrale Kapitel-Palette (Token-Datei pro Kapitel) anlegen,
  aus der alle Aspekt-Figuren + der gc10-Motor schöpfen. *(M–L, konzeptionell)*
- [x] **P-AF-3: Zeitanzeige unten links im Kernsim-Bereich.** Kleine
  Zeit-/Stopp-Uhr-Anzeige unten links im Kernsim (.aspekt-scene), inspiriert von
  den Stand-alone-Simulationen (`Input/Simulationen/Project_kreisbewegung_*`).
  Pro-Instanz (per `createRuntime`), an den Animations-/Play-Zustand gekoppelt.
  *(S)*
- [x] **P-AF-4: Uhr minimal kleiner + minimal nach links.** Stoppuhr in den
  Szenen leicht verkleinern und minimal nach links verschieben — derzeit minimale
  optische Kollision mit den Diagrammen. Berührt `scale` (aktuell 0,71× nach
  fca90a3) + Position in `aspekt_*_zeit.css`. *(S)*
- [x] **P-AF-5: Vektorstrichstärken-Regel konsistent halten.** Hauptvektoren
  (r, v, a, …) gleich dick; Komponenten stets 0,8 der HV-Strichstärke. Verifikation
  (2026-07-23): letzter Schritt (`3401265`) machte Vektoren ×1,5 **dicker**
  (gewünscht/gefordert, kein Fehler); HV-/Komponenten-Verhältnis 0,8 ist in
  `aspekt_kreisbahn.css` (r 4px / rx,ry 3,2px) und `aspekt_vxvy_zeit.css`
  (v 2,5px / vy 2px) eingehalten. Konsistenz kapitelweit (1.4) sichern, Regel als
  Token/Konstante festhalten statt pro Figur hart. *(S)*
- [x] **P-AF-6: Interaktive Aspekt-Figur 1.46 — aₓ(t)/a_y(t)-Zeit-Diagramm.**
  statische `fig-skript-kreisbewegungen-axaydiagramm` interaktiv nachbauen, analog
  zu P-AF/1.42 (`aspekt_vxvy_zeit.js|.css`): gestapeltes Dual-Graph (oben aₓ(t),
  unten a_y(t)), Zeit-Regler t tastet ab, R + T einstellbar, Kernsim zeigt
  Beschleunigungsvektor a⃗ mit optionaler Zerlegung in aₓ/a_y. Copy & feature-gate
  der 1.42 (nicht von null, s. INTERAKTIVE_ASPEKT_FIGUREN.md §0a). Motor per
  `createRuntime()`; Registrierung `main.js::ASPEKT_FACTORIES` + `data-aspekt`
  + `data-figref`. a⃗-Farbe kapitelweit `--kb-a`. *(M)*
  Umgesetzt (2026-07-23, `ded8ee3`): `aspekt_axay_zeit.js|.css`, `data-aspekt="axay-zeit"`,
  graphType1=axt/graphType2=ayt, a⃗-Farbe `--kb-acc` (bestehender Token, nicht `--kb-a`),
  strokeWidth-Pfeilspitzen, arrowLenScale 1.5. Visuell noch nicht freigegeben.
- [x] **P-AF-7: Interaktive Aspekt-Figur 1.47 — Betrag der Bahnbeschleunigung.**
  statische `fig-skript-kreisbewegungen-betragatdiagramm` interaktiv nachbauen,
  analog zu P-AF/1.43 (`aspekt_betragv_zeit.js|.css`): einzelner Graph |a⃗(t)|
  (konstant), Zeit-Regler t tastet ab, R + T einstellbar, Kernsim zeigt
  Beschleunigungsvektor a⃗, dessen Betrag trotz wechselnder Richtung konstant
  bleibt. Copy & feature-gate der 1.43. *(S–M)*
  Umgesetzt (2026-07-23, `ded8ee3`): `aspekt_betraga_zeit.js|.css`, `data-aspekt="betrag-a-zeit"`,
  graphType1=aabs einzeln, a⃗-Farbe `--kb-acc` (explizit gescopt, da a nicht zentral
  gefärbt wird — s. Hinweis zur 1.43/betragv). Visuell noch nicht freigegeben.

- [x] **P-AF-8: Interaktive Aspekt-Figur 1.49 — Periodendauer ablesen.**
  statische `fig-skript-kreisbewegung-periodendauer` (1.4.4) interaktiv nachbauen.
  Copy & feature-gate von `aspekt_weg_zeit.js` (1.39) — dieselben gestapelten
  x(t)/y(t)-Diagramme + Kreisbahn-Szene. Neu: **T-Ablese-Markierung** im oberen
  x(t)-Diagramm (zwei aufeinanderfolgende Maxima t=0/t=T als Punkte + senkrechte
  Hilfslinien + bemaßte T-Strecke), Analyse zeigt zusätzlich f=1/T und ω=2π/T.
  R-Regler ändert nur die Amplitude, nicht den Maxima-Abstand (T unabh. von R).
  Umgesetzt (2026-07-24, `50f338b`+`a85a94c`): `aspekt_periodendauer.js|.css`,
  `data-aspekt="periodendauer"`, T-Marker aus store.graphScale.top projiziert
  (drawTMarkers), Marker orient=auto-start-reverse. Syntax/Smoke/Nummerierung
  grün. **Visuell noch nicht freigegeben** (Screenshot-Check offen). *(S–M)*

- [x] **P-AF-9: Interaktive Aspekt-Figur 1.50 — a_x/a_y bei veränderlichem ω.**
  statische `fig-skript-kreisbewegungen-axaydiagramm-winkelbeschl` (1.4.5)
  interaktiv nachbauen. Copy & feature-gate von `aspekt_axay_zeit.js` (1.46).
  **Kernabweichung:** der geteilte Motor (physics.js) rechnet nur konstantes ω;
  1.50 braucht variables ω (konstante Winkelbeschleunigung α). Deshalb rechnet die
  Figur die α-Physik LOKAL (φ=φ₀+ω₀t+½αt², a=αR·(−sinφ,cosφ)+ω²R·(−cosφ,−sinφ)) und
  füllt die store-Arrays selbst (fillLocal) — Motor bleibt unverändert (isoliert).
  Regler R/ω₀/α/t (Nutzerwahl); a_x/a_y-Kurven wachsen mit ω(t)². Zwei optionale
  Szenen-Zerlegungen: kartesisch a_x/a_y (Motor) + tangential/radial a_t/a_r
  (selbst gezeichnet, a_t rot / a_r blau wie \textcolor im Skript). store.T=∞.
  Umgesetzt (2026-07-24, `50f338b`… vgl. Log): `aspekt_axay_winkelbeschl.js|.css`,
  `data-aspekt="axay-winkelbeschl"`. Syntax/Smoke/Nummerierung grün.
  **Darkmode-Tauglichkeit erledigt** (`80cb31c`): --kb-at/--kb-ar waren die
  einzigen Vektor-Tokens ohne Darkmode-Override → jetzt aufgehellt (--kb-at
  #ff8866, --kb-ar #66aaff), parallel zur Palette, CVD-distinkt zu a_x/a_y.
  a_t/a_r-Farben-Prüfung (Code-Ebene): Tokens sind CVD-distinkt (rot/blau neben
  cyan/orange); Rot-auf-Rot (Gesamt-a vs a_t) entspricht bewusst der \textcolor
  im Skript (α·R rot) — keine Änderung. Panel-Verfeinerung (`e2f780a`):
  Tempo/Darstellung per Default eingeklappt (Leiste zu lang), Label-CSS auf
  Basis-.panel-label normalisiert. **Visuell freigegeben 2026-07-24** (Nutzer
  hat die visuelle Prüfung vorgenommen — „alles ok"; Code-Ebene zuvor per Text-
  Dump-Probe verifiziert, kein Image-Input auf Nutzervorgabe). *(M)*
  **Skalierungs-Redesign (`7d57892`):** statt |a| auf feste Länge zu normieren
  (ließ die konstante Tangential-Komponente a_t=αR scheinbar schrumpfen —
  rückwärts zur Physik — und deckelte a_r am Lauf-Ende) jetzt JE Komponente
  EIGEN logarithmisch skaliert (Nutzervorgabe „log für beide"):
  compress(x,xMax)=log(1+x/(k·xMax))/log(1+1/k), k=0,3. Eigene Maßstäbe nötig
  (a_t≈0,2, a_r bis ≈170 m/s² — Faktor ~300), sonst würde a_t unter die
  Pfeilspitze schrumpfen. a_t: px-Deckel 0,45·Bahnradius, Bezug 0,45 m/s²
  (pro Lauf konstant, da α const). a_r: px-Kappe = Durchmesser R=2m-Kreis,
  Bezug 50 m/s² (stärker gedämpft, Default-Lauf stößt nicht an die Kappe →
  kein sichtbares Deckel-Plateau). a = Vektorsumme; Winkel in der Szene bewusst
  verstärkt (echtes atan(α/ω²)~2° unsichtbar), echte Beträge in den Diagrammen.
  arrowLenScale 1,5→1,1 (kürzere Pfeil-Verkürzung → kleine Vektoren rendern).
  ω₀-Bereich [-2,2] (war [0,3,2]): ω₀ darf 0/negativ sein; a_r/a_t
  vorzeichenunabhängig, Winkelbogen verbirgt sich für φ≤0. Zerlegung jetzt
  ENTWEDER/ODER (oder keine): kartesisch ODER tangential/radial, gegenseitig
  deaktivierbar; Komponenten-Linien beider Zerlegungen identisch (Dicke +
  gestrichelt via CSS-Komponenten-Token), nur Farben unterschiedlich. Verifiziert
  per Text-Dump-Probe (kein Bild): a_t konstant 33,4 px, a_r monoton 5,7→278 px,
  Either/Oder-Schaltung korrekt, ω₀<0 ohne NaN/a_r≥0. **Info-Fußnote
  (`a32a466`):** ausklappbare <details> in der data-caption erklären die Skalierung
  ausführlich für Interessierte/Experten (Formel, Kappen, Bezugspunkte,
  Winkel-Übertribung); innere `"` als &quot; maskiert (sonst schließt class="..."
  das data-caption-Attribat vorzeitig — einmal so gewesen, per Probe gefunden).
  **Geschwindigkeitsvektor v einblenden (`d45511a`):** optionale, UNABHÄNGIGE
  Einblendung von v=ωR (Nutzervorgabe; nicht zerlegbar — nur ein/aus, kombinierbar
  mit jeder Zerlegung). Tangential wie a_t, getrieben von ω; eigene log-Skala
  (V_MAX_FRAC·R·ppm = Bahnradius-Kappe, V_CAP_PHYS=8 m/s; Default-Lauf stößt
  nicht an). HV (solid+dick wie Gesamt-a), eigenes Token --kb-v (grün #2e8b57 /
  Darkmode #5fd49d — bewusst nicht Motor-/--kb-vel blau, kollidiert mit a_r);
  negatives ω₀ kehrt v um. Live-Analyse |v|-Zelle + Legendenreihe + Caption-
  Erwähnung. Zugleich (Nutzervorgabe) a_t/a_r-Tip-Labels aus der Kernsim
  entfernt (Legende klärt) inkl. Tot-Code-Beseitigung (trLabels/<g>/CSS).
  Verifiziert per Text-Dump: v ⊥ Radius (Δ=0°), monoton 27→119 px, HV 3,75 px
  solid, Labels weg, |v|=6,60 m/s @ t=24, v+Zerlegung gleichzeitig, ω₀<0 o. NaN.

- [x] **P-AF-10: Interaktive Aspekt-Figur 1.51 — Betragsvergleich |a⃗ₜ|/|a⃗ᵣ|.**
  statische `fig-skript-kreisbewegungen-aratdiagramm-winkelbeschl` (1.4.6)
  interaktiv nachbauen. Copy & feature-gate von `aspekt_axay_winkelbeschl.js`
  (1.50): dieselbe lokale α-Physik (variables ω bei konst. α, `fillLocal`), aber
  statt der kartesischen Komponenten aₓ/aᵧ die **Beträge** |a⃗ₜ|=|α|R (oben,
  pro Lauf konstant) und |a⃗ᵣ|=ω(t)²R (unten, wachsend) gestapelt (neue Motor-
  Diagrammtypen `att`/`art`, Commit 32aa189). `aspekt_arat_winkelbeschl.js|.css`,
  `data-aspekt="arat-winkelbeschl"`, registriert in `main.js`. Static-Figur auf
  `nur-druck` gesetzt, interaktive auf `nur-bildschirm`; Caption/Nummer (Abb. 1.51)
  per `data-figref` übertragen. Umgesetzt 2026-07-24. **Visuell freigegeben**
  2026-07-24 („passt"). Verifiziert per Text-Dump (kein Bild-Input): baut
  fehlerfrei (`built:1`), keine Konsolenfehler, Werte konsistent (ω=2,40, at=0,15,
  ar=8,64 @ t=24), Caption „Abb. 1.51".
  **Default-Angleichung an 1.51:** 1.50 (`aspekt_axay_winkelbeschl.js`) startet
  jetzt mit ω₀=0/α=0,1 (wie 1.51), damit beide Figuren mit demselben Startbild
  öffnen (a_r wächst aus 0, |a_t| konstant).
  **Betrags-Notation (Nutzervorgabe, s. Memory):** globale Präferenz
  `|\vec a_r(t)|` (Pfeil + (t) innerhalb der Betragsstriche) statt `|a_r|(t)`.
  Umgesetzt in MathJax (Caption, Panel-Formel, Skalierungs-Notiz — auch die
  geteilte Fußnote in 1.50) und in den Plain-Text-Diagramm-/Achsenbeschriftungen.
  **Fallstrick:** die Ordinaten-`yLabel` kommt NICHT aus
  `constants.js::graphAxisLabels`, sondern hartkodiert aus
  `physics.js` (Serien-Def. `att`/`art`, Z. 105/106) — beide Stellen mussten
  geändert werden. Echte Unicode-Subskripte ₜ (U+209C) / ᵣ (U+1D63) statt
  Unterstrich (wie vₓ/vᵧ); der Vektorpfeil ist das kombinierende Zeichen U+20D7
  (auf Nutzerwunsch belassen). *(M)*

- [x] **P-AF-6: Homogenität von Titel- & Achsenbeschriftungen über die Width-
  Modi schmal/normal/breit.** (Nutzervorgabe 2026-07-29: „ähnliche Diagramme
  sollen ähnlich aussehen — Einzeldiagramm vs. gestapelt muss nicht identisch
  sein.") **Analyse-Ergebnis: homogen, kein eigenes Work-Item nötig.** Die
  Schriftgrade sind modusunabhängig definiert — `.axis-label` 13 px,
  `.tick-label` 11 px, `.graph-title-text` 15 px, je
  `calc(Npx * var(--kb-text-scale) * var(--kb-fs))` (aspekt_kreisbahn.css:258–
  260), `--kb-text-scale = --paper-graphics-scale` hängt an der Textstufe,
  nicht am Width-Modus. Die Width-Modi (:446+) setzen nur Layout/Spaltenbreite,
  KEINE Schriftgröße (einzige Modus-Schrift ist die schmale Legenden-Labelschrift
  :468 — keine Überschrift/Achse). Einziges Diffusionsmoment war die SVG-Box-
  breite: Einzelfiguren auf 460 px gedeckelt (gleiche Box → gleicher Schriftgrad),
  gestaparte/vollbreite Figuren wachsen mit der Spalte. **Ausreißer war
  grundbegriffe (1.1)** — als einzige Figur OHNE Cap wuchs sie mit der Spalte
  und wirkte (insbes. breit) „mächtig" + inkonsistent; in v1.31.17 auf 460 px
  gedeckelt → homogen. Folge-Regel v1.31.19: Einzeldiagramm darf Breite
  bevorzugen (s. P-AF-7). *(S, nur Analyse)*

- [ ] **P-AF-7: Pause-Button echtes Pause-Design.** Die Aspekt-Runbar
  (`data-act="stop"`, mittlerer der Start/Stop/Reset-Knöpfe) ist semantisch
  eine **Pause**, kein Stop: `stop()` hält an Ort (nur `playing=false;
  cancelAnimationFrame`, kein `curT=0`), `start()` setzt an `curT` fort,
  `reset()` setzt zurück (z. B. aspekt_betragv_zeit.js:686/699/700). Das Icon
  ist aber ein **Stop-Glyph** (gefülltes Quadrat ■, `<rect x=7 y=7 width=10
  height=10>`, ebd. :256) und Label/aria-label/title heißen „Stop". Fix: Icon
  auf zwei Pause-Balken (‖, z. B. zwei `<rect>` bei x≈7/14, y=6, w=3, h=12) +
  Label „Pause". Betroffen: die 14 Aspekt-Figuren mit `data-act="stop"` (je
  eigene RUNBAR-Konstante → pro Datei): betragv_zeit, weg_zeit, winkel_zeit,
  vxvy_zeit, axay_zeit, betraga_zeit, omega_zeit, periodendauer,
  axay_winkelbeschl, arat_winkelbeschl, omega_vektor, zentripetalkreuz,
  alpha_omega, bus_weg_zeit. Vorher pro Figur prüfen, ob `stop()` wirklich
  halten (→ Pause) oder zurücksetzen (→ Stop bleibt korrekt) bedeutet — nur
  erstere umbauen. Außerdem prüfen, ob die gc10-Kreisbewegung-Sim
  (playBtn/pauseBtn) dasselbe Quadrat trägt. *(S–M)*

