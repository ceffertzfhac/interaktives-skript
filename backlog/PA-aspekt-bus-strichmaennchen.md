<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P-Aspekt-Bus — Abb. 1.2 Busfahrt: Strichmännchen als Mitfahrer (Kapitel 1.1)

Eingetragen 2026-07-29 nach Nutzervorgabe (**nur Backlog, noch nicht umgesetzt**).
Betroffen: `src/figures/bus_weg_zeit/` (Motor) + `src/figures/aspekt_bus_weg_zeit.js|.css`.

Erweiterung der interaktiven Abb. 1.2 (Busfahrt Linie 42, Weg-Zeit-Diagramm)
um ein **fußläufiges Strichmännchen**, das an H2 steht und zur H3 laufen
kann, um dort in den Bus zu steigen — oder ihn zu verpassen. Didaktisch geht
es um die Gegenüberstellung zweier Weg-Zeit-Kurven (Bus vs. Fußgänger) und
die Frage, wer zuerst an H3 ist. Zwei Toggles steuern das Szenario, ein
drittes blendet das Männchen ein/aus; das Männchen bekommt sein **eigenes
Weg-Zeit-Diagramm** (zweite Kurve, eigene Farbe) ins bestehende t-x-Diagramm.

- [ ] **P-Bus-1: Strichmännchen in der Straßenszene (H2→H3).** Ein
  Strichmännchen (SVG, Ausrichtung bezüglich der Straße beachten — steht auf
  der Straße, nicht im Straßenband) zwischen H2 und H3. Ein Toggle blendet
  es ein/aus. Startpunkt so wählen, dass ein **schnell laufender Erwachsener
  H3 gerade noch so erreicht** (Startzeit/-ort so, dass die Männchen-Kurve
  bei „nicht verpasst" knapp vor dem Bus an H3 endet). *(M)*
- [ ] **P-Bus-2: Toggle „Männchen verpasst den Bus".** Zwei Ausprägungen:
  *(M)*
  - **verpasst den Bus NICHT:** das Männchen läuft los, sobald der Bus (in
    der Animation) steht — setzt sich also in Bewegung Richtung H3 und
    kommt **5 Sekunden vor der Abfahrt** des Busses bei H3 an. Es „steigt
    ein": das Männchen ist fortan **auf dem Bus zu sehen**, und sein
    Weg-Zeit-Diagramm entwickelt sich **mit dem Bus** weiter (Männchen-Kurve
    geht in die Bus-Kurve über / liegt auf ihr).
  - **verpasst den Bus:** das Männchen ist zu langsam und kommt erst
    **nach der Abfahrt** des Busses bei H3 an. Es verbleibt dann bis zum
    Ende der Animation bei H3 (Männchen-Kurve geht ab H3 in eine Halt-
    Gerade über, Männchen steht auf der Straße an H3).
- [ ] **P-Bus-3: Eigenes Weg-Zeit-Diagramm des Männchens.** Zweite Kurve
  (eigene Farbe, unterscheidbar von firebrick/Linie 42) im bestehenden
  t-x-Diagramm, passend zum Bus-Verlauf je nach Toggle (P-Bus-2). Legende
  erweitern. *(S–M)*

**Vorabklärungen (vor Umsetzung):**
- Männchen-Gehgeschwindigkeit („schnell laufender Erwachsener", so dass H3
  gerade erreicht wird) festlegen — daraus Startort/Startzeit ableiten;
  H2↔H3 sind 500 m. Realistische Orientierung ~1,4 m/s (flotter Spaziergang)
  bis ~2,5 m/s (schnelles Gehen/Jogging); 500 m in 200 s = 2,5 m/s.
- Bus-Halt an H2 ist 120…155 s, Fahrt H2→H3 ist 155…240 s, Halt an H3 ist
  240…275 s (Abfahrt H3 = 275 s). „5 s vor Abfahrt an H3" = 270 s.
- Startbedingung: Männchen läuft los, „sobald der Bus steht" — meint das
  den Halt an H3 (240 s) oder schon H2? Mit Nutzer klären.
- Strichmännchen-SVG-Stil + Ausrichtung auf der Straße (Beine auf
  Mittellinie / Straßenband, nicht im Nichts) — Vorbild ggf. aus
  `Input/Simulationen/` falls vorhanden.

---

