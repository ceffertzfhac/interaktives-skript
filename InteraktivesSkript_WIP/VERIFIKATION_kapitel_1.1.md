# Verifikation Kapitel 1.1 „Kinematik" (v0.13-Migration)

Quelle: `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex` (1149 Zeilen, 14
Unterabschnitte). Geprüft nach Skill `v013-verifikation` am 2026-07-24.

## Ergebnis: alle offline prüfbaren Stufen grün

| Stufe | Prüfung | Ergebnis |
|---|---|---|
| 1 vs 2 | Gleichungen SOLL (PDF) vs IST (MathJax offline) | **deckungsgleich**, s. u. |
| 2 | TeX-Fehler / unaufgelöste `??`-Refs | **0 / 0** |
| 3 | DOM-Harness (Seiten, lose Kinder, Boxen, Fußnoten, Refs) | **sauber** |
| 4 | Bilder (Format, Existenz, HTTP 200) | **0 Fehler**, alle 200 |
| 6 | JS-Syntax (`node --check`) | **alle ok** |
| 5 (Teil) | Formel-Tag-Format | **(1.1.n)**, nicht (n) |

### Stufe 1 = Stufe 2 — Gleichungen pro Unterabschnitt

Anzahl **und** Spanne stimmen je Unterabschnitt exakt überein:

| Unterabschnitt | Gl. | Spanne |
|---|---|---|
| 1.1.4 Der Ort | 3 | 1–3 |
| 1.1.5 Die Zeit | 1 | 4 |
| 1.1.7 Die Strecke | 16 | 5–20 |
| 1.1.8 Die Bahn | 10 | 21–30 |
| 1.1.9 Definitionsbereich | 4 | 31–34 |
| 1.1.10 Geschwindigkeit | 33 | 35–67 |
| 1.1.11 Relativgeschwindigkeit | 9 | 68–76 |
| 1.1.12 Beschleunigung | 23 | 77–99 |
| **Σ** | **99** | 1.1.1–1.1.99 |

### Weitere Zählwerte (IST = SOLL)

- **Abbildungen:** Abb. 1.1–1.20 (20), lückenlos; danach Sprung auf Abb. 1.38
  (die noch nicht migrierten 1.2/1.3 belegen 1.21–1.37 — bewusste Lücke, vom
  1.4-h2-Offset 37 übersprungen).
- **Beispiele:** Beispiel 1.1.1–1.1.17 (17). *(referenznummern.py meldet
  „1.1.2–1.1.17 (15)", weil sein PDF-Textscan die zwei `\bbspe`-Boxen mit dem
  Plural-Titel „Beispiele" (1.1.1 und 1.1.3) nicht als Beispiel erkennt —
  Makro-Zählung 17 ist maßgeblich und rendert korrekt 1.1.1–1.1.17.)*
- **Zusammenfassung:** 1.1 (kapitelweit).
- **Querverweise:** 30 fig-Refs, 8 sec-Refs, 37 eq-Refs — **alle aufgelöst**.
- **Fußnoten:** 41 Marker, 0 nicht umgewandelt.

## Bewusste Abweichungen von v0.13 (dokumentiert)

1. **Abb. 1.2:** `bus-strasse-weg-zeit.png` fehlte anfangs in PSkriptBilder
   (`weg_zeit_diagramm_perfekt.pdf`/`_final.svg` sind nur die Diagrammhälfte ohne
   die Bus-Szene). Nutzer hat das Original-Kompositbild (Bus links + Diagramm
   rechts) am 2026-07-24 in den Quellen-Repo nachgetragen; von dort übernommen —
   **erledigt**.
2. **`\bbspe` (Plural „Beispiele") → `beispiel`-Box** („Beispiel 1.1.n"): der WIP
   kennt nur einen `beispiel`-Typ. Betrifft die Titel von 1.1.1 und 1.1.3.
3. **Doppel-Label `formel_freierfall4`** (Quell-Bug, Z. 180 + 201): die zweite
   Instanz (t=√(2h₀/g)) zu `formel_freierfall_fallzeit` disambiguiert, Refs nach
   Intention gesetzt.
4. **Quell-Artefakt „code/Code"** (Z. 1106f in der Zusammenfassung) übersprungen.

## Offen: Stufe 5 (nur visuell, Nutzer/Freigabe erforderlich)

Nicht per Harness abdeckbar, benötigt Sichtprüfung im Browser (Screenshot-
Freigabe-Pflicht): `\textcolor` farbig?, Bildschärfe (Subfigure 1.18 ist
688×668 px, wird aber klein dargestellt), Layout-Kollisionen, Darkmode-
Lesbarkeit, Druckfluss `?print=true`.
