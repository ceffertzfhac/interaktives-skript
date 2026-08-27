<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P14 — Formel-Überstand je Width-Modus prüfen & beheben (schmal/normal/breit)

Eingetragen 2026-07-24 nach Nutzervorgabe. **ABGESCHLOSSEN 2026-08-27 (v1.33.5):**
alle fuenf Sub-Tasks erledigt. `formel_ueberstand.mjs` meldet 0 Uebersteher in
allen drei Breiten-Modi, gegen die Textspalte **und** gegen die Boxinnenraender
(Exit-Code 0). Verlauf und Messwerte s. „Ergebnisse“ am Ende. Das Dokument soll in **allen Width-Modi**
(schmal/normal/breit, s. `core.js::set_width_mode`) nach **Kandidaten-
Formeln** durchsucht werden, die über den Rand des **Schreibbereichs**
(`#paper` / `#content`) **herausragen** — **insbesondere, wenn die
Gleichungsnummerierung (Tag) übersteht, aber nicht ausschließlich** (also
auch Formelkörper selbst, lange `\frac`/Brüche, `\underbrace`-Texte etc.).
Die Darstellung dieser Formeln muss **modussensitiv überarbeitet** werden,
damit **kein Herausragen** mehr auftritt.

**Anforderungen (Nutzervorgabe):**
- **Automatische Suche** nach Kandidaten-Formeln im ganzen Dokument
  (alle Kapitel, nicht nur 1.4/1.5).
- **Alle drei Width-Modi** prüfen: schmal (schmalste Spalte → höchste
  Überstands-Wahrscheinlichkeit), normal, breit.
- **Kriterien:** (a) Tag/Nummerierung ragt über den Schreibbereich-Rand,
  (b) Formelkörper selbst ragt über (auch ohne Tag-Problem), (c) ggf.
  weitere (z. B. inline-Formel in zu schmaler Zeile).
- **Modussensitive Behebung:** pro problematischer Formel eine Lösung,
  die im jeweiligen Modus greift — keine globale Verbredung, die im breit-
  Modus dann zu viel Luft lässt.

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Schreibbereich-Rand = was genau?** `#content` inline-width (set per
   `set_width_mode`) oder `#paper` (`--paper-max-width`)? Tag-Ragt-über
   bezieht sich vermutlich auf die sichtbare Textspalte (`#content` width
   abzüglich Padding). Klären, welchen Kasten messen.
2. **Behebungs-Strategien (welche bevorzugt der Nutzer?):**
   - Tag umbrechen/zweizeilig? (MathJax macht Tags normalerweise rechts;
     bei Überstand ggf. Tag nach unten oder `tagstyle` ändern).
   - Formel verkleinern (`\small`/`\scriptstyle` per MathJax-CSS im Modus)?
   - Formel umbrechen (`\\` in align, oder automatischer Zeilenumbruch)?
   - horizontal scrollbar im Container (unschön, eher nicht)?
   - Schreibbereich im Modus minimal verbreitern (verändert aber die
     Mode-Semantik — eher nicht)?
   Pro Formel wahrscheinlich Einzelfall-Entscheidung; ist eine globale
   Heuristik gewünscht (z. B. „über 95 % Spaltenbreite → automatisch
   `\small`") oder manuelle Einzelfall-Korrektur pro Formel?
3. **Kandidaten-Suche — automatisiert?** Ein Skript (z. B. im Screenshot/
   DOM-Harness, headless Chromium pro Width-Modus) misst jede
   `mjx-container[display="true"]`-`getBoundingClientRect().right` gegen
   `#content.getBoundingClientRect().right` und listet Übersteher. Soll
   dieses Werkzeug dauerhaft ins Repo (Verifikations-Skill) oder nur
   einmalig zur Inventur?
4. **Gilt auch für inline-Formeln** `\(...\)` (nicht nur Display)?
   Vermutlich ja, aber Fokus lag auf nummerierten Display-Gleichungen.
5. **Darkmode:** Überstand ist modus-, nicht farbabhängig — aber Behebung
   darf nicht die Neon-/Tag-Lesbarkeit (P13-Konflikt?) stören.
6. **Druck:** Druckspalte ist fix 700 px (print.js) — separat prüfen oder
   wird Druck aus dem breit-Modus-Klon ohnehin eng genug?

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Inventur-Werkzeug:** Erweiterung des bestehenden Screenshot-Skills
  (`.claude/skills/.../figur_screenshot.mjs`, playwright-core) oder des
  DOM-Harness (`.claude/skills/v013-verifikation/scripts/dom_harness.mjs`):
  pro Width-Modus Seite laden, alle `mjx-container[display=true]` +
  deren `.mjx-mtr`/Tag-Elemente vermessen, Übersteher (`right > rand +
  Toleranz`) auflisten mit Formel-Text/Tag/Seite. Output = Tabelle.
- **Modussensitive CSS-Regeln** (s. CLAUDE.md Width-Mode-Decoupling):
  `:root[data-width-mode="schmal"] …` gezielt problematische Formeln via
  data-Attribut/`\label`-Marker ansprechen (z. B. `data-formel-
  overflow`), dort `\small`-Äquivalent (MathJax-CSS-Skalierung) oder
  Zeilenumbruch. **Nie** globale `.mjx-container{font-size:…}` (skaliert
  alle, auch harmlose).
- **Pro-Formel-Markierung:** problematischen Formeln im Quell-HTML ein
  `data-…`-Merkmal geben, damit die modussensitive Regel sie greift —
  O(1) pro Formel, skalierbar (CLAUDE.md hard constraint).
- **Tag-Überstand separat:** MathJax-Tag liegt in `.mjx-mtext`/`.mjx-tlist`;
   wenn nur der Tag übersteht, ist die sauberste Lösung oft die Formel
   selbst (Box) so zu verengen, dass der Tag in die Spalte passt — oder
   das Tag-Layout anzupassen. Vorab klären, ob Tags überhaupt umbrechen
   dürfen.

**Sub-Tasks (Aufwand Schaetzung — erst nach Klaerung verlaesslich):**
- [x] **P14-0 Klaerung** — mit dem Nutzer entschieden (2026-08-27):
  1. **Rand = `#content` abzueglich `padding-right`** (die sichtbare
     Textspalte, wandert mit dem Width-Modus). `#paper` wird je Treffer
     mitgemessen, entscheidet aber nicht ueber den Verstoss.
  3. **Werkzeug bleibt dauerhaft** im Verifikations-Skill (P14-4 verlangt
     eine Wiederholungsmessung, jedes neue Kapitel bringt neue Formeln).
  4. **Vollinventur**: alle Formeln (display **und** inline), Gleichungs-
     nummern, Tabellen, Bilder, Boxen, sonstige Blockelemente.
  Offen geblieben, weil erst bei der Behebung relevant: Frage 2 (Strategie
  je Kandidat), 5 (Darkmode) und 6 (Druckspalte 700 px). *(M)*
- [x] **P14-1 Inventur-Werkzeug** —
  `.claude/skills/v013-verifikation/scripts/formel_ueberstand.mjs`
  (headless Chromium, je Breiten-Modus, Stufe 4b im Skill). Meldet je Kette
  nur das aeusserste Element; bei Display-Gleichungen getrennt, ob nur die
  **Nummer** oder der **Formelkoerper** uebersteht. Exit-Code 1 bei
  Uebersteigern (Gate), Exit-Code 2 bei fehlgeschlagenem Selbsttest. *(M)*
- [x] **P14-2 Inventur** — gelaufen auf v1.33.3, Ergebnis unten. *(M)*
- [x] **P14-3 Behebung** — in zwei Phasen:
  *Koerper* (7d38da8, 9a30a6c, 4a0d3ac, 1960fbc): 48 `split`-Bloecke in 10
  Kapiteln. *Nummern* (865433b, 102b130): die drei verbliebenen Faelle waren
  keine Koerper-, sondern Nummern-Ueberstaende und wurden per Umbruch bzw.
  Ausrichtung geloest — **P14-0 Frage 2 damit beantwortet: Einzelfall-Umbruch
  im LaTeX, keine modussensitive CSS-Regel.** *(L)*
- [x] **P14-4 Verifikation** — `formel_ueberstand.mjs` in beiden Spielarten:
  0 Uebersteher, Exit-Code 0. `mathjax_pruefen.cjs` HEAD vs. Arbeitsstand fuer
  alle drei geaenderten Kapitel: Ausgabe identisch (0 TeX-Fehler, Gleichungs-
  zahlen, -spannen, Labels und Verweise unveraendert). **Sicht (Stufe 5) durch
  den Nutzer: er hat den (1.1.57)-Ueberstand im Browser gemeldet und damit die
  Messung ueberhaupt erst korrigiert.** *(M)*

---

## Ergebnisse

### Inventur 2026-08-27 (v1.33.3, Vollinventur, Toleranz 1 px)

| Modus | Spalte | Uebersteher |
|---|---|---|
| schmal | 1000 px | **1** |
| normal | 1280 px | 0 |
| breit | 1800 px | 0 |

Von 955 Display-Formeln uebersteht **genau eine**, nur im schmal-Modus:

| Ueberstand | was genau | Fundstelle | Quelle |
|---|---|---|---|
| +11,6 px | **nur die NUMMER**, nicht der Koerper | (1.1.57), Abschnitt 1.1.10, Seite 24/137 | `chapters/ch_01_01_kinematik.html:730-735` |

**Es ist kein Formel-Problem, sondern ein Nummern-Problem.** Der Formelkoerper
endet 59,2 px *innerhalb* der Spalte; allein die Gleichungsnummer ragt 11,6 px
hinaus. Vom Nutzer im Browser so gesehen und bestaetigt (2026-08-27).

**Ursache:** die Formel steht in einer `<div class="beispiel">`-Box (Z. 715).
MathJax reserviert dem `svg` `min-width: 87.143ex` und richtet die Nummer am
rechten Rand dieser Reservierung aus — die liegt weiter rechts als der
Innenrand der Box und als die Textspalte. `split`-Umbrueche im Formelkoerper
aendern daran nichts; die drei Behebungs-Batches greifen fuer diesen Fall
also gar nicht.

**Offen (P14-0 Frage 2):** Nummer-Platzierung korrigieren (z. B. `min-width`
der Gleichungs-svg innerhalb von Highlight-Boxen deckeln) oder tolerieren.

### Nachmessung gegen die Boxinnenraender (2026-08-27)

`--gegen=box` nachgeruestet. Ergebnis: **es ist ein Muster, kein Einzelfall.**

| Gleichung | Nummer ragt aus der Box | Koerper | Box | Abschnitt |
|---|---|---|---|---|
| (1.1.57) | **+64,6 px** | −6,2 | `beispiel` | 1.1.10 Geschwindigkeit |
| (1.4.24) | **+50,4 px** | −20,7 | `bemerkung` | 1.4.2 Geschwindigkeit auf der Kreisbahn |
| (1.2.71) | **+4,9 px** | −66,6 | `beispiel` | 1.2.8 Aufgaben loesen mit Kraeften |

Alle drei: **nur die Nummer**, alle im schmal-Modus, alle in einer
Highlight-Box. **Kein einziger Formelkoerper** ragt irgendwo heraus — weder
gegen die Textspalte noch gegen eine Box, in keinem Modus. Von 955
Display-Formeln liegen 360 in einer Box; betroffen sind die drei breitesten.

Gegen `#content` gemessen faellt nur (1.1.57) auf (+11,6 px) — die anderen
beiden ragen aus ihrer Box, erreichen die Textspalte aber nicht. Der
Boxrand ist also der Rand, der optisch zaehlt.

**Konsequenz fuer P14-3:** die Loesung ist eine CSS-Regel fuer Gleichungen in
Highlight-Boxen (die `min-width` der Gleichungs-`svg` im schmal-Modus
deckeln), keine Handkorrektur an drei Formeln. `split`-Umbrueche im Koerper
helfen hier grundsaetzlich nicht — der Koerper passt ja.

### KORREKTUR zur ersten Messung (gleicher Tag)

Die erste Fassung des Werkzeugs meldete **4** Uebersteher und daraus abgeleitet
ein „Muster: Skalarprodukte mit ausgeschriebenen Spaltenvektoren". **Das war
falsch.** Gemessen wurde die `mjx-container`-Box (= Zeilenbox), nicht die
gezeichnete Tinte:

| Formel | Container | Tinte | tatsaechlich |
|---|---|---|---|
| (1.1.57) | +87,3 px | 1611,6 | **+11,6 px — echt** |
| (1.4.24) | +73,0 px | 1597,4 | −2,6 px — innerhalb |
| (1.2.71/72) | +27,5 px | 1551,9 | −48,1 px — innerhalb |
| inline (θ), 1.4.7 | +2,2 px | — | Teil-Element, faellt mit der Ink-Regel weg |

Behoben in `5ef3444`. Merksatz (steht schon im Kopf von
`figur_screenshot.mjs`, wurde hier trotzdem uebersehen): **wenn messen, dann
die INK-Box, nicht den Container.**

### Bekannte Grenzen des Werkzeugs

- Misst **Geometrie, nicht Optik**: ob ein Umbruch gut aussieht, bleibt
  Stufe 5.
- Der Viewport ist 2200 px breit, damit der breit-Modus (1800 px) ohne
  Horizontal-Scroll messbar ist. Bei einem echten Fenster < 1800 px greift
  `center.js` mit Horizontal-Scroll — dieser Fall ist **nicht** abgedeckt.

### Nebenbefund (nicht Teil von P14)

`window.relayout_eq_numbers` wird in `core.js` zweimal aufgerufen
(Z. 318 und 369, beide guarded), ist aber **nirgends in `src/` definiert** —
der Hook laeuft nie. Entweder nachruesten oder die toten Aufrufe entfernen.

---

### Behebung der drei Nummern-Faelle (2026-08-27, v1.33.4 / v1.33.5)

Keiner war ein Formelkoerper-Problem — in allen drei Faellen sprengte die
`min-width` der Gleichungs-`svg` die Box-Innenbreite (596–599 px), sodass
MathJax die Nummer nach rechts hinausschob. Schmalere Zeilen ⇒ kleinere
Reservierung ⇒ Nummer rueckt zurueck.

| Gleichung | `min-width` | vorher | Eingriff | nachher |
|---|---|---|---|---|
| (1.1.57) | 87,143ex = 662,3 px | +64,6 px | `= 0 ✓` in eigene Zeile; Klammer am `+` getrennt | drin |
| (1.4.24) | 85,397ex = 649,0 px | +50,4 px | zweite `pmatrix` in eigene Zeile; Klammer am `+` getrennt | drin |
| (1.2.71) | 79,284ex = 602,5 px | +4,9 px | `&` vor `= 0` — verschiebt es in die rechte Spalte, Block richtet sich auf `=` aus | drin |

**Merksatz fuer kuenftige Faelle:** ragt eine Gleichungs*nummer* heraus, ist
die Zeile darunter zu breit — nicht die Nummer falsch platziert. Und: in
`align` erzeugt **jede** Zeile einen Tag, neue Umbruchzeilen brauchen
`\notag`, sonst verschiebt sich die Nummerierung des ganzen Kapitels.
