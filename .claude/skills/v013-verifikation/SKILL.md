---
name: v013-verifikation
description: Ein migriertes Kapitel des interaktiven Skripts gegen das v0.13-PDF prüfen — Gleichungs-, Abbildungs- und Boxnummern, LaTeX-Fehler, Pagination, Querverweise, Fußnoten, Bildbestand. Nutzen nach jeder Kapitelmigration und immer, wenn Nummerierung, Verweise oder Formelsatz zweifelhaft sind ("stimmt die Nummerierung", "Formel 1.4.1 ist im HTML Formel 1", "Abbildung kaputt").
---

# Verifikation eines migrierten Kapitels

Hintergrund und Fallstricke: `InteraktivesSkript_WIP/MIGRATION_v0.13_nach_HTML.md`,
Abschnitte 10 und 11. Die Regeln, gegen die geprüft wird (Zähler-Scopes, Offsets,
MathJax-Gleichungsnummern, Querverweis-Deskriptoren): `InteraktivesSkript_WIP/chapters/CLAUDE.md`.

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
npm install --prefix /tmp mathjax-full jsdom playwright-core   # einmalig, ~30 s
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

## Stufe 4b — Überstände über den Schreibbereich (echter Browser)

```bash
node .claude/skills/v013-verifikation/scripts/formel_ueberstand.mjs \
     --url=http://localhost:8000/index.html
```

Misst in headless Chromium **je Breiten-Modus** (schmal/normal/breit), welche
Elemente über die sichtbare Textspalte (`#content` abzüglich `padding-right`)
hinausragen — Formeln (Display und inline), Tabellen, Bilder, Boxen. Bei
Display-Gleichungen wird zusätzlich die am weitesten rechts liegende **Zeile**
benannt (`[Zeile 1/8]`), damit man im Quelltext nicht suchen muss.

**Gemessen wird die Tinte, nicht die Container-Box.** Die `mjx-container`-Box
ist die Zeilenbox und ragt regelmäßig weit über die Glyphen hinaus: bei
(1.1.57) meldet sie +87,3 px, gezeichnet sind +11,6 px — zwei weitere
„Treffer" der ersten Fassung lagen sogar 2,6 bzw. 48,1 px *innerhalb* der
Spalte. Gegen den Container gemessen jagt man Gespenster.

Gemeldet wird je Kette nur das äußerste Element. `--ohne-figuren` blendet die
absichtlich breiten `.aspekt-figur`-Container aus, `--max=0` zeigt alle Treffer,
`--json=<pfad>` schreibt das vollständige Ergebnis. **Exit-Code 1**, sobald ein
Modus Übersteher hat — damit taugt der Aufruf als Gate (BACKLOG P14-4).

Das Skript führt vor der Messung einen **Selbsttest** aus (absichtlich zu
breites Element einhängen und wiederfinden) und bricht mit Exit-Code 2 ab, wenn
der fehlschlägt: „0 Übersteher" soll nicht von einer kaputten Messung kommen
können.

**Grenze:** misst Geometrie, nicht Optik. Ob eine umgebrochene Formel *gut
aussieht*, entscheidet weiterhin Stufe 5.

## Stufe 5 — Nur im Browser

Diese Punkte kann **kein** Harness abdecken; sie müssen von einem Menschen
angesehen werden (oder per Chrome-Integration, falls verbunden). Prüfphasen in
dieser Reihenfolge (kapitelagnostisch; die kapitelspezifischen **Soll**werte
kommen aus Stufe 1):

1. **Rauchtest & Laden** — Seite öffnen, Konsole beobachten: keine 404 (insbes.
   `chapters/ch_NN.html`, `src/numbering.js`, `bilder/*`), keine JS-Fehler.
2. **Inhaltsparität vs. v0.13** — das PDF (Abschnitt X) neben der WIP-Seite
   öffnen. Pro Unterabschnitt Stichproben: Prosa wortgleich, alle h3-Titel
   vorhanden & nummeriert, Boxen-Texte und -Reihenfolge gleich.
   Konvertierungs-Sonderfälle prüfen: `\SI` als `n\,\mathrm{unit}`, deutsche
   Dezimalkommata `{,}`, `\point`/`\textcolor` korrekt umgesetzt.
3. **Formel-Tags** — erscheinen sie als `(X.Y.n)` oder als `(n)`? Bei `(n)` ist
   `tagformat` per `loader.load` geladen, aber nicht in `tex.packages`
   aktiviert. **Dieser Fehler ist offline unsichtbar.** `\ref`-Querverweise
   lösen zu klickbaren Links mit korrekter Nummer auf (nicht „??").
4. **Abbildungen & SVGs** — fortlaufend, in DOM/Lesereihenfolge, keine Lücke/
   Doppelung; hardcodierte Abbildungsnummern in der Prosa stimmen mit der
   tatsächlichen Zählung. Inline-SVGs (falls vorhanden) skalieren korrekt
   (`max-width:100%`/`height:auto`), Pfeilspitzen/Labels und Unicode-Math lesbar.
5. **Pagination & Navigation** — durch alle Seiten blättern (Weiter/Zurück,
   Kapitel-Mini-Nav, Schiene): jede Seite zeigt nur ihren `<section>`-Inhalt,
   keine verlorenen Sibling-Elemente (`foldStraySiblings` greift, z. B. eine
   Zusammenfassungs-Box nach `</section>`). Hash/Deep-Link auf eine Seite
   setzen, reload — gleiche Seite aktiv, Breadcrumb + „Seite x/y" korrekt.
6. **Druckfluss** — Toolbar „Drucken" → neuer Tab `?print=true`: enthält **alle**
   Unterabschnitte (nicht nur die aktive Seite), Formel-Tag-Nummerierung erhalten,
   keine abgeschnittenen SVGs, Marginalia restauriert. *(QR-Codes erzeugt
   `print.js` pro interaktivem Pendant — rein statische Kapitel ohne Aspekt-Figur
   haben erwartungsgemäß keine.)*
7. **TOC & Querverweise** — Inhaltsverzeichnis: Accordion mit Kapitel-Gruppe +
   verschachtelten h3-Links, aktive Seite hervorgehoben, Suche filtert. Prose-
   `#`-Links / `data-action="goto_page"` springen zur Zielseite.
8. **Responsive / Darkmode** — Fenster < 1024px (Tablet): Schiene/Marginalia
   versteckt, Drawer über ☰, keine Phone-CSS. Darkmode umschalten: kein
   Kontrast-Bruch, inline-SVGs + Boxen bleiben lesbar. Safari-foreignObject-Check
   nur falls Safari verfügbar (`.fo_inner`-Verschiebung nur in Safari über
   `.fixed`).

Konzentriert zusätzlich sichten: `\textcolor` sichtbar farbig? Bildgrößen
plausibel (nichts unscharf hochskaliert)? Layout ohne Kollisionen mit Schiene/
Toolbar und ohne leere Spalte?

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
