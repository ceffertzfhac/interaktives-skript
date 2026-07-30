<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P15 — Weiße Hintergründe aus Nicht-Foto-Abbildungen entfernen

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt**). Alle **Abbildungen, die keine Fotos sind** (also
Diagramme, TikZ-Plots, Schemazeichnungen, gerenderte Grafiken), sollen ihren
**weißen Hintergrund entfernt bekommen**, wenn sie einen solchen haben.
Ziel: auf nicht-weißen Untergründen (Darkmode, farbige Boxen) keine weißen
Kacheln; Linien/Punkte bleiben sichtbar, der Hintergrund wird transparent.

**Anforderungen (Nutzervorgabe):**
- **Nur Nicht-Foto-Abbildungen** — Fotos behalten ihren Hintergrund (sie
  sind reale Bilder, kein zeichenbares Diagramm). Unterscheidung
  Foto vs. Diagramm nötig (s. Klärung).
- **Bedingung:** „wenn sie einen weißen Hintergrund haben" — nur dann
  entfernen; Grafiken mit schon transparentem Hintergrund unangetastet.
- **Ergebnis:** weißer Hintergrund → transparent; Vordergrund (Linien,
  Achsen, Schrift, Flächenfarben) bleibt.

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Foto vs. Nicht-Foto — Kriterium?** Manuelle Liste/Markierung (z. B.
   `data-photograph="true"` auf den `<img class="grafik">`/`<figure>`),
   Dateinamenskonvention, automatische Erkennung (Histogramm: viele
   Farbtöne + kein weißer Rand = Foto)? Vermutlich manuelle Markierung
   am robustesten (CLAUDE.md: Figuren kommen aus `bilder/`, Anzahl
   überschaubar). Klären, welche Abbildungen Fotos sind.
2. **„Weiße" Definition:** exakt `#FFFFFF`? Oder near-white (Helligkeit
   > Schwellwert, geringe Sättigung)? Schwellwert robust gegen Anti-
   Aliasing-Kanten wählen.
3. **Verfahren — pro Bild:**
   - **PNG-Transparenz:** Weiß → alpha=0 (Bildverarbeitung, einmalig:
     `convert input.png -fuzz X% -transparent white output.png` o. Ä.).
     Neue Dateien ins `bilder/`-Verzeichnis (CLAUDE.md: TikZ-Figuren
     ohnehin PNG aus `pdftocairo`).
   - **Oder CSS-Mischung:** `mix-blend-mode:multiply` (weiß → transparent
     gegen Hintergrund, aber *alle* Farben werden multipliziert —
     riskant in farbigen Boxen/Darkmode). Vermutlich echte PNG-Transparenz
     sauberer.
   - **Oder SVG:** wenn Quelle SVG (nicht TikZ→PNG), `background`-Rect
     entfernen.
4. **Darkmode-Verträglichkeit:** mit transparentem Hintergrund zeigt die
   Grafik im Darkmode auf dunklem Untergrund — sind die Linien dann noch
   sichtbar (schwarz auf dunkel)? Ggf. muss für Darkmode eine invertierte
   Variante oder CSS-Filter (`filter: invert(1)`) auf Diagramme —
   Klären, ob das im Wunsch enthalten ist oder nur die Hintergrund-
   Entfernung gewollt ist (Linienproblematik als eigener Punkt).
5. **Bestehende Figuren vs. künftige:** gilt für alle heutigen `bilder/`-
   PNGs und auch für künftige (P12-Migration bringt viele neue)?
   Pipeline-Regel (ähnlich MIGRATION_v0.13) festhalten.
6. **`make_static`-Pfad:** die statischen Abbildungen kommen via
   `core.js::make_static` als `<img class="grafik">`. Stelle sicher, dass
   die transparenten Varianten auch dort geladen werden.

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Inventur:** alle `bilder/*.{png,svg}` + alle `<img class="grafik">`
  (und `figure.abbildung > img`) auflisten; Foto/Diagramm klassifizieren
  (P15-0); für Diagramme prüfen, ob weißer Hintergrund vorhanden.
- **Bildverarbeitung** (einmalig, lokal): PNG-Transparenz via ImageMagick
  (`-transparent white` mit `-fuzz`) oder Python/Pillow (near-white →
  alpha); Original behalten (Suffix `_orig` oder Unterordner) bis
  Verifikation. Keine Datei ohne Backup überschreiben.
- **Markierung:** Fotos bekommen `data-photograph="true"` im Quell-HTML
  (oder eine CSS-Klasse), damit klar ist, welche unangetastet bleiben.
- **Pipeline-Regel:** in `MIGRATION_v0.13_nach_HTML.md`/Asset-Pipeline
  (P12-F) festhalten: Nicht-Foto-PNGs mit transparentem Hintergrund
  abliefern.
- **Darkmode-Follow-up** (eigener Punkt nach P15-0): wenn Linien im
  Darkmode unsichtbar werden, `:root[data-darkmode] img.grafik` (nur
  Diagramme) per CSS-Filter invertieren oder separate Dark-Variante.

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P15-0 Klärung** — die 6 offenen Fragen mit Nutzer klären
  (insb. Foto-Liste & Verfahren PNG-Transparenz vs. CSS), Ergebnis hier
  festhalten. *(M)*
- [ ] **P15-1 Inventur** — alle `bilder/`-Abbildungen + Klassifikation
  (Foto/Diagramm) + hat-weiß-Bg? *(S–M)*
- [ ] **P15-2 Foto-Markierung** — `data-photograph`/Klasse auf Fotos
  im Quell-HTML (alle Kapitel). *(S)*
- [ ] **P15-3 Transparenz** — pro Diagramm mit weißem Bg PNG-Transparenz
  erzeugen (Backup, ImageMagick/Pillow), `bilder/` ersetzen. *(M)*
- [ ] **P15-4 Darkmode-Follow-up** — ggf. CSS-Filter/Invert-Variante für
  Diagramme im Darkmode (nur falls P15-0 als nötig erachtet). *(S–M)*
- [ ] **P15-5 Pipeline-Regel** — in MIGRATION_v0.13 / P12-F aufnehmen:
   Nicht-Foto-PNGs transparent abliefern. *(S)*
- [ ] **P15-6 Verifikation** — Sicht in hell + dunkel auf mehreren
  betroffenen Abbildungen (Stufe 5, Freigabe „JA"); keine weißen Kacheln
  mehr auf farbigen Boxen/Darkmode. *(M)*

---

