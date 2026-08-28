<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P17 — Weitere interaktive Figuren aus Kap. 1.1 (Kinematik, nicht Wurf/Fall)

Eingetragen 2026-07-30 nach Nutzervorgabe + Kandidatur-Untersuchung von Kap. 1.1
(alle 20 Abbildungen inventarisiert). Ergänzt **P16** (Wurf/Fall) um drei weitere
interaktive Aspekt-Figuren, die aus derselben Untersuchung hervorgingen.
Betroffen: `src/figures/aspekt_*.js|.css` + `chapters/ch_01_01_kinematik.html`
(Static jeweils `.nur-druck`, interaktiv `.nur-bildschirm`).

**Kandidatur-Entscheidung 2026-07-30 (Nutzervorgabe):**
- **Aufgenommen:** 1.15, 1.10, 1.8 (s.u.).
- **Nicht aufgenommen (bleiben statisch):** 1.11 Rutsche-Foto, 1.13 Spur-im-Schnee
  (Konzept, durch 1.14/P16 interaktiv abgedeckt), 1.16 Tachometer-Foto — alles
  Fotos/Konzept-Bilder ohne parameterabhängiges Verhalten.
- **Nicht aufgenommen (bedingt geeignet, bewusst weggelassen):** 1.12 Schraubenbewegung
  (3D, didaktisch wertvoll, Motor `kreis_spiral` existiert — falls später gewünscht,
  nachrüsten); 1.17 Vorzeichen der Geschwindigkeit (schwacher Kandidat, nur kleine
  Toggle-Figur — bewusst statisch gelassen).

**Vorlagen-Hierarchie** [[feedback-vorlagen-hierarchie]] pro Figur (alle drei
Vorbilder prüfen): (1) nächste Aspekt-Figur *nach Interaktionsmuster*; (2) die
Stand-alone-Sim; (3) die statische v0.13-Abbildung; (4) Legacy. **„wie Abb. X" =
pixel-identisch.**

### Sub-Tasks

- [ ] **P17-1 Aspekt-Figur Abb. 1.15 — Sekante vs. Tangente** (Durchschnitts- vs.
  Momentangeschwindigkeit, Unterabschnitt 1.1.10 „Geschwindigkeit"). Statisches
  `fig-kinematik_geschwindigkeit_unterschied_durchschnitt_momentan` interaktiv
  nachbauen. Slider: Intervallgrenzen t₁/t₂ für die Sekante + Zeitpunkt t für die
  Tangente an einer x(t)-Kurve; Δt→0-Übergang zeigt die Konvergenz Sekante→Tangente.
  **Motor: `ableitung_simulation` neu portieren** (`src/figures/ableitung/`,
  reuse `../kreisbewegung/lib/*`; deckt auch P12-E8-Hilfssim). Caption verweist
  selbst auf eine ILIAS-Animation, die ersetzt wird. *(L — Motor + Figur)*
- [ ] **P17-2 Aspekt-Figur Abb. 1.10 — Kreisbewegung x(t)/y(t)-Komponenten +
  Bahn** (Unterabschnitt 1.1.7 „Die Strecke"). Statisches `fig-kreisbewegung_1`
  interaktiv nachbauen: gestapelte x(t)/y(t)-Komponenten (Slider R, T) + Toggle
  zum Bahn-View (x-y-Plot) — schließt exactly die Lücke, die der Text selbst
  nennt („nicht leicht zu sehen, dass es eine Kreisbahn ist") und ist die Brücke
  zu Abschnitt 1.1.8 „Die Bahn". **Motor: `kreisbewegung` bereits portiert** — nur
  Aspekt-Figur per `createRuntime()`, kein neuer Motor. Vorlagen-Hierarchie:
  `aspekt_weg_zeit` (gestapelte x/y) + `aspekt_kreisbahn` (Bahn) kombinieren.
  *(M — nur Figur)*
- [ ] **P17-3 Aspekt-Figur Abb. 1.8 — Feder-Masse-Pendel** (Unterabschnitt 1.1.7
  „Die Strecke", Beispiel Feder-Masse-Pendel). Statisches
  `fig-feder_masse_pendel_kinematik` interaktiv nachbauen: harmonische s(t) =
  y₀·cos(2πt/T), Slider Amplitude y₀ + Periodendauer T; nicht-parabolische
  Bewegung als Kontrast zu den Wurf-/Fall-Parabeln (P16). **Motor:
  `federpendel` ist seit P12-E6 (2026-08-27) bereits portiert** unter
  `src/figures/federpendel/` — kein neuer Motor mehr noetig, nur die Aspekt-Figur
  per `createRuntime()`. Erste Verwenderin ist die Figur in Abschnitt 3.1.5;
  hier kaeme die zweite Instanz dazu. *(M — nur Figur; war (L — Motor + Figur))*
- [ ] **P17-4 Verifikation** — pro Figur: Static `.nur-druck` + `data-figref`-
  Übertrag, `node --check`, Smoke, Nummerierung (keine Regression), CVD-Palette
  (P-AF-2), Stufe 5 (Sicht) nur nach Freigabe „JA" [[feedback-screenshot-freigabe]]. *(M)*

**Bearbeitungsreihenfolge (2026-08-28):** P17-1..3 werden **nicht am Stueck**
abgearbeitet, sondern an ihrer Position in der Abbildungsreihenfolge von Kap. 1.1,
verzahnt mit P16 — die gemeinsame Queue steht in
[P16](P16-wurf-fall-figuren.md) („Bearbeitungsreihenfolge"). Reihenfolge dort:
1.8 = P17-3, 1.10 = P17-2, 1.15 = P17-1.

**Querverweis:** P17-2 (1.10) und P16 (Wurf/Fall) nutzen beide `kreisbewegung`- bzw.
die Wurf-Motoren per `createRuntime()` — die Motoren bleiben Singleton, jede
Aspekt-Figur bekommt ihre eigene Instanz (idPrefix), wie bei 1.38–1.51 etabliert.

---

