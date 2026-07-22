---
name: v013-verifikation
description: Ein migriertes Kapitel des interaktiven Skripts gegen das v0.13-PDF prüfen — Gleichungs-, Abbildungs- und Boxnummern, LaTeX-Fehler, Pagination, Querverweise, Fußnoten, Bildbestand. Nutzen nach jeder Kapitelmigration und immer, wenn Nummerierung, Verweise oder Formelsatz zweifelhaft sind ("stimmt die Nummerierung", "Formel 1.4.1 ist im HTML Formel 1", "Abbildung kaputt").
---

# Verifikation eines migrierten Kapitels

Hintergrund und Fallstricke: `InteraktivesSkript_WIP/MIGRATION_v0.13_nach_HTML.md`,
Abschnitte 10 und 11.

## Der zentrale Denkfehler, den dieses Skill verhindern soll

> **„Lückenlos" ist nicht „richtig".**
> Eine Nummerierung kann in sich vollkommen schlüssig sein und trotzdem
> systematisch von der Quelle abweichen. Genau das ist passiert: alle
> Abbildungs- und Zusammenfassungsnummern folgten dem falschen Zähler, die
> Gleichungen waren ab (1.4.43) um vier versetzt — und eine Prüfung, die das
> HTML nur mit sich selbst verglich, meldete „bestanden".
>
> **Immer gegen das PDF prüfen, nie nur gegen sich selbst.**

## Vorbereitung

```bash
npm install --prefix /tmp mathjax-full jsdom     # einmalig, ~30 s
cd InteraktivesSkript_WIP && python3 -m http.server 8000 &
```

## Stufe 1 — Sollwerte aus dem PDF

```bash
python3 .claude/skills/v013-verifikation/scripts/referenznummern.py \
        Input/v0.13/Physik_pskript_v0.13.pdf 1.4
```

Liefert Gleichungen **pro Unterabschnitt**, Abbildungsbereich und Boxnummern.
Das ist das Prüfziel. Markiert automatisch Zähler, die kapitelweit laufen.

## Stufe 2 — IST-Werte aus dem HTML (MathJax offline)

```bash
node .claude/skills/v013-verifikation/scripts/mathjax_pruefen.cjs \
     InteraktivesSkript_WIP/chapters/ch_NN.html 1.4
```

Liefert TeX-Fehler, unaufgelöste Referenzen und Gleichungs-Tags pro
Unterabschnitt.

**Vergleich Stufe 1 gegen Stufe 2: Anzahl UND Spanne müssen je Unterabschnitt
übereinstimmen.** Nur so fällt ein Offset auf. Weicht ein Unterabschnitt ab und
alle folgenden sind um denselben Betrag verschoben, fehlen dort Gleichungen —
meist `\be…\ee`-Stellen, die zu Inline-Mathe degradiert wurden.

**Grenze:** läuft mit `AllPackages` und sieht Konfigurationsfehler der echten
Seite nicht (siehe Stufe 4).

## Stufe 3 — Laufzeit ohne Browser

```bash
node .claude/skills/v013-verifikation/scripts/dom_harness.mjs InteraktivesSkript_WIP
```

Baut das DOM wie `main.js::init()` auf und prüft: Seitenanzahl und -titel, lose
Elemente in `#paper`, Abbildungsnummern (Lücken/Sprünge), Boxnummern pro Typ
inklusive Reset am Kapitelwechsel, Fußnoten-Umwandlung samt Auf-/Zuklappen,
Querverweise mit und ohne Ziel.

Formelverweise (`data-ref-eq`) bleiben hier unaufgelöst — sie brauchen MathJax.

## Stufe 4 — Bilder

```bash
python3 .claude/skills/v013-abbildungen/scripts/bilder_pruefen.py \
        InteraktivesSkript_WIP/bilder InteraktivesSkript_WIP/chapters/ch_NN.html
# und: liefern alle referenzierten Pfade 200?
grep -o 'src="bilder/[^"]*"' InteraktivesSkript_WIP/chapters/ch_NN.html |
  sed 's/src="//;s/"//' | sort -u |
  while read r; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8000/$r")" "$r"; done |
  grep -v '^200'
```

## Stufe 5 — Nur im Browser

Diese Punkte kann **kein** Harness abdecken; sie müssen von einem Menschen
angesehen werden (oder per Chrome-Integration, falls verbunden):

- **Formel-Tags**: erscheinen sie als `(1.4.1)` oder als `(1)`? Bei `(1)` ist
  `tagformat` per `loader.load` geladen, aber nicht in `tex.packages`
  aktiviert. **Dieser Fehler ist offline unsichtbar.**
- `\textcolor` sichtbar farbig?
- Bildgrößen plausibel, nichts unscharf hochskaliert?
- Layout: keine Kollisionen mit Schiene/Toolbar, keine leere Spalte?
- Darkmode lesbar, Druckfluss (`?print=true`) vollständig?

## Stufe 6 — CSS und JS auf Selbstverletzung prüfen

```bash
for f in InteraktivesSkript_WIP/src/*.js; do node --check "$f" || echo "FEHLER $f"; done
python3 - <<'EOF'
import re
for f in ('InteraktivesSkript_WIP/src/styles.css','InteraktivesSkript_WIP/src/darkmode.css'):
    s=open(f).read(); ohne=re.sub(r'/\*.*?\*/','',s,flags=re.S)
    print(f,'Klammern balanciert:', ohne.count('{')==ohne.count('}'))
EOF
```

Hintergrund: ein `*/` **innerhalb** eines CSS-Kommentars (z. B. beim Schreiben
über `equation*/align*`) beendet ihn vorzeitig und macht die folgenden Regeln
wirkungslos. Der Test fällt darauf herein, wenn man nur `{`/`}` im Rohtext
zählt — deshalb erst Kommentare entfernen.

## Kontrastwerte rechnen statt schätzen

Bei neuen Farben (WCAG AA = 4,5:1 für Text unter 18,66 px), **hell und dunkel**:

```python
def lum(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    l=sorted([lum(a),lum(b)],reverse=True); return (l[0]+.05)/(l[1]+.05)
```

Im Darkmode kehren sich Mischungsverhältnisse um: was hell mit `--ink`
abgedunkelt wird, muss dunkel überwiegend `--ink` enthalten.

## Abschluss

Erst wenn Stufe 1 und 2 deckungsgleich sind, Stufe 3 und 4 fehlerfrei laufen
und Stufe 5 gesichtet wurde, gilt das Kapitel als migriert. Ergebnis im
Commit festhalten — mit Zahlen, nicht mit „geprüft".
