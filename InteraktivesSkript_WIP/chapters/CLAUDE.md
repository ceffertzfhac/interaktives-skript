# Kapitel-Fragmente (`chapters/`)

Gilt zusätzlich zu `InteraktivesSkript_WIP/CLAUDE.md` und der Wurzel-`CLAUDE.md`.
Der zugehörige Code liegt in `../src/` (s. `../src/CLAUDE.md`), speziell
`chapters.js` (Laden), `pages.js` (Paginierung) und `numbering.js` (Nummerierung).

**Runbook für die Migration des nächsten Abschnitts aus `Input/v0.13/`:
`../MIGRATION_v0.13_nach_HTML.md` — vor Beginn lesen.** Die meisten der dort
katalogisierten 13 realen Fallstricke sind still (falsche-aber-konsistente
Nummerierung, ein Bild, das ein PDF mit `.png`-Endung ist, ein geladenes, aber
nicht aktiviertes MathJax-Paket). Prüfplan nach der Migration: Skill
`v013-verifikation` (kapitelagnostisch, Stufe 1–6; das pro-Kapitel-Ergebnis
steht im jeweiligen Backlog-Item + Fragmentkopf, nicht in einer eigenen Datei).
Fehler der Quelle selbst: `../QUELLEN_FEHLER.md`.

## Konvention

**Eine HTML-Datei je v0.13-Abschnitt**, benannt `ch_NN[_MM]_<slug>.html`, jeweils
1:1 aus der zugehörigen `Input/v0.13/*.tex` transkribiert. Jedes Fragment enthält
den h2-Abschnittseinstieg + die h3-Unterabschnitte + deren `<section>`s,
Abbildungen und Highlight-Boxen — alles, was früher inline in `index.html` stand.

`src/chapters.js` holt und injiziert die Fragmente vor `paginate()`. **Lesereihen-
folge und TK-Gruppierung kommen aus der Reihenfolge der
`<div data-chapter="…" data-tk-num data-tk-title>` in `index.html`** — nicht aus
den Dateinamen (so sitzt z. B. `ch_02` zwischen `ch_01_03` und `ch_01_06`).

**Einen Abschnitt hinzufügen = eine neue Datei hier + eine
`<div data-chapter="…">`-Zeile in `index.html` (O(1)).**

Welches Fragment zu welchem Themenkomplex gehört, wird hier nicht gepflegt
(wächst mit jeder Migration). Aktuelle Zuordnung reproduzieren:

```
grep -o 'data-chapter="[^"]*"\|data-tk-num="[^"]*"\|data-tk-title="[^"]*"' index.html
```

Die Prosa ist **statisch**; Interaktivität kommt figurweise dazu
(s. `../src/figures/CLAUDE.md`).

## Abweichungen von v0.13 — Pflichtdokumentation

Die Wurzel-`CLAUDE.md` verlangt: **jede inhaltliche Abweichung des WIP von
`Input/v0.13/` zieht einen abhakbaren Eintrag in
`backlog/P21-statisches-skript-nachziehen.md` nach sich**, weil Druckskript und
interaktives Skript synchron bleiben müssen. Hier steht, was das praktisch heißt.

**Was zählt als inhaltliche Abweichung** (P21-pflichtig): Reihenfolge von
Abbildungen/Absätzen geändert · Text ergänzt, gekürzt oder umformuliert ·
Bildunterschrift inhaltlich erweitert · Formel ergänzt, die die Quelle nicht hat ·
Abschnitts-/Abbildungsnummerierung weicht ab · eine Aussage steht nur in einer
der beiden Fassungen.

**Was nicht zählt** (nur Fragmentkopf, kein P21-Eintrag): rein
darstellungsbedingte Übersetzungen, bei denen der Sachtext unverändert bleibt —
ein LaTeX-Konstrukt ohne HTML-Entsprechung (`\bbspe`-Plural → einzelne Boxen,
`siunitx` aufgelöst), ein Verweis-Deskriptor, den der Resolver liefert, ein
disambiguiertes Doppel-Label. Im Zweifel eintragen: ein überflüssiger Eintrag
kostet eine Zeile, ein fehlender kostet die Synchronität.

**Drei Stellen, jedes Mal:**
1. **Kopfkommentar des Fragments** — *was* geändert wurde und warum (steht beim
   Inhalt, wird beim Lesen der Datei gefunden).
2. **Eintrag in P21** — Datum, Stelle, Abweichung, was im Druckskript zu tun ist
   (die Sammlung fürs Nachziehen; einzeln abhakbar).
3. **Commit-Message** — nennt die Abweichung und verweist auf P21.

**Maßstab für den P21-Eintrag:** *jemand, der nicht dabei war, muss ihn im
`.tex` umsetzen können, ohne jemanden zu fragen.* Also **Zieldatei** unter
`Input/v0.13/` nennen, die **Stelle** über ein LaTeX-Label oder einen Anker
festmachen (nicht über Zeilennummern — die verschieben sich) und den
einzusetzenden **Text wörtlich** hinschreiben, nicht bloß beschreiben. Eine
Beschreibung wie „Absatz ergänzt" ist als Eintrag wertlos.

**Sonderregel Bildunterschriften** (Nutzervorgabe): dokumentiert wird die
Abweichung vollständig, **nachgezogen aber nur, was im statischen Skript
sinnvoll ist**. Regler-Hinweise, mitlaufende Zahlenwerte und Farbnennungen der
interaktiven Figuren gehören nicht ins Druckskript; ein erklärender Satz (z. B.
zum Koordinatensystem) sehr wohl. Der Eintrag sagt beides: was übernommen wird
und was bewusst nicht.

**Grundsatzregel „didaktischer Zusatz"** (Nutzerentscheidung 2026-08-28, gilt
für ALLE künftigen interaktiven Figuren — deshalb ist die Frage nicht mehr pro
Figur zu stellen): Was eine interaktive Figur an Erklärung mitbringt, **wird ins
Druckskript nachgezogen**, und zwar
- der **erklärende Teil der Bildunterschrift** (z. B. „in welchem
  Koordinatensystem sind wir, wo liegen Bezugspunkte darin") — die interaktiven
  Teile nicht (s. Sonderregel oben);
- **zusätzliche Gleichungen unnummeriert** (`\[…\]`, nicht `equation`). Eine
  nummerierte Gleichung würde jede folgende Nummer des Abschnitts verschieben —
  und damit auch die des interaktiven Skripts, das seine Zählung aus derselben
  Reihenfolge ableitet.
Der P21-Eintrag wird entsprechend gleich mit Status „entschieden: nachziehen"
angelegt; nur eine bewusste Ausnahme braucht noch eine Rückfrage.

**Fehler der Vorlage selbst** (Tippfehler, Sachfehler, falsche Nummern in v0.13)
gehören **nicht** hierher, sondern in `../QUELLEN_FEHLER.md`; dort ist auch
geregelt, dass eine Korrektur nur gemeinsam in Quelle *und* WIP erfolgt. Beide
Register verfolgen dasselbe Ziel — die beiden Fassungen dürfen nicht
auseinanderlaufen.

Jedes Fragment trägt einen Kopfkommentar mit seiner Quelldatei und jeder
bewussten Abweichung von v0.13. **Dort — nicht hier — stehen die
abschnittsspezifischen Fakten**, damit diese Datei nicht mit jedem migrierten
Abschnitt wächst. Gefundene **v0.13-Quellenfehler** werden ebenfalls im
betroffenen Fragment dokumentiert (z. B. die doppelte Abschnittsnummer 3.1 in
`ch_04_00_einleitung.html`), nicht hier.

## Nummerierung

`../src/numbering.js::init_numbering()` nummeriert Boxen, Abbildungen und Bilder
aus der Seitenregistratur von `pages.js`. **Die v0.13-Zähler-Scopes sind nicht
einheitlich** (s. `Physik_skript_header_gmni_v3.tex`), und der Code bildet das
exakt nach:

| Typ | `\numberwithin` | Ergebnis |
|---|---|---|
| beispiel / bemerkung / wichtig / lernziel / aufgabe | `{section}` | `1.4.n` |
| zusammenfassung | `{chapter}` | `1.n` |
| figure | **gar keines** | `1.n` (kapitelweit), „Abb. 1.n" |

`CHAPTER_SCOPED` markiert die kapitelweiten Boxtypen. Kapitelweite Zähler werden
bei jedem Kapitelwechsel auf 0 gesetzt und danach von JEDER Seite (üblicherweise
einem Abschnitts-h2), die `data-figure-offset` / `data-zusammenfassung-offset`
trägt, auf einen **ABSOLUTEN** Startwert gesetzt.

Das gilt **pro Abschnitt**, nicht nur beim ersten h2 eines Kapitels: eine Lücke
durch noch nicht migrierte Abschnitte **mitten** in einem Kapitel lässt sich so
überspringen, ohne die Nummern der migrierten Abschnitte zu verschieben (erste
Abbildung des Abschnitts = `figure-offset + 1`). Der Wert darf entfallen, sobald
alle vorangehenden Abschnitte lückenlos migriert sind — als gültiger absoluter
Startwert schadet er aber auch dann nicht.

**Der Migrationsstand wird hier absichtlich NICHT geführt** (er ändert sich mit
jeder Migration). Maßgeblich sind: die Offsets an den h2 in diesem Verzeichnis,
der Kopfkommentar jedes Fragments und `backlog/P12-restliche-v013-inhalte.md`.
Den aktuellen Offset-Stand reproduziert:

```
grep -o 'data-[a-z]*-offset="[0-9]*"' chapters/*.html | sort -u
```

**Gleichungen** nummeriert MathJax selbst (`tags:'ams'`), nicht `numbering.js`.

**Box-Titel** sind zweigeteilt: `<span class="hb-type">` (Typ + Nummer, per CSS
großgeschrieben) und `<span class="hb-name">` (der eigene Titel der Box, normale
Schreibung — damit Formelteile nicht verstümmelt werden). `core.js` erzeugt den
Typ-Span, `numbering.js` füllt beide neu.

Einen neuen **Boxtyp** einführen heißt fünf Stellen in `../src/` anfassen —
s. „Box-Klassenlisten synchron halten" in `../src/CLAUDE.md`.

## MathJax-Gleichungsnummern (v1.7)

Gleichungen nummeriert MathJax, nicht `numbering.js` — `tex.tags:'ams'` in der
Inline-Konfiguration in `index.html` plus `tagformat.number`.

**Ein geladenes Paket ist kein aktiviertes:** `[tex]/tagformat` und `[tex]/color`
müssen *sowohl* in `loader.load` *als auch* in `tex.packages: {'[+]': […]}`
stehen, sonst fallen Tags still auf `(1)` zurück und `\textcolor` rendert nicht.

Das Abschnitts-Präfix ist **dynamisch**, keine fest verdrahtete Konstante:
`numbering.js::renumber_equations()` läuft **vor** dem Typeset über `getPages()`
und baut `eq_tag_map[laufendeNr] = sectionPrefix(page) + '.' + lokal`, wobei
`sectionPrefix` die Abschnittsnummer aus dem Seitentitel liest (`1.4.3 …` →
`1.4`, `0.2.1 …` → `0.2`). Gezählt wird dabei aus der **LaTeX-Quelle**, die
solange im DOM-Text steht, bis MathJax sie ersetzt — deshalb der einzige
Durchgang, in dem die Nummern von Anfang an stimmen. Ein neuer Abschnitt braucht
daher **keine** Nummerierungsänderung — das Präfix kommt aus seinen Seitentiteln.

Was der Zähler aus der Quelle liest (v1.39.0): jede Zeile von `\begin{equation}`
und `\begin{align}` bekommt eine Nummer, die Sternvarianten und `\[…\]` nicht,
und `\nonumber`/`\notag` unterdrückt die Nummer *ihrer* Zeile. `\\` innerhalb
einer geschachtelten Umgebung (`split`, `pmatrix`, `cases`, `array`) trennt
keine Zeile. **Wer eine weitere nummerierte Umgebung einführt** (etwa `gather`),
muss sie dort ergänzen — sonst verschiebt sich ab dieser Stelle jede Nummer des
Abschnitts.

## Querverweise: der Resolver ist die einzige Quelle des Deskriptors (v1.19)

`numbering.js` löst vier Anker-Typen auf, und **jeder liefert das vollständige
Label**:

| Attribut | rendert |
|---|---|
| `data-ref-fig` | `Abbildung N` |
| `data-ref-sec` | `Abschnitt N` |
| `data-ref-eq` | `(N)` |
| `data-ref-box` | `Beispiel N` (bzw. der Typ der Box, adressiert über deren stabile `id`) |

**Die Prosa darf den Deskriptor NICHT wiederholen:** `im <a data-ref-sec>`
schreiben, nicht `im Abschnitt <a data-ref-sec>` (letzteres rendert „im Abschnitt
Abschnitt N"); `Formel <a data-ref-eq>`, nicht `Formel (<a data-ref-eq>)`.

Ein korpusweiter Durchgang in v1.19 hat 80 solcher doppelten Deskriptoren
entfernt (17 sec / 25 fig / 38 eq über 7 Kapitel). Die Verdopplung war für die
Prüf-Harnesse unsichtbar, weil die Zahlen prüfen, nicht die umgebenden Wörter.
**Gerenderte Querverweise deshalb im echten Browser prüfen** — den Seitentext
nach `"Abschnitt Abschnitt"`, `"Abbildung Abbildung"`, `((` durchsuchen, nicht
nur die Nummern.

## Bildgrößen folgen v0.13

Jedes `<img class="grafik">` in einer `figure.abbildung` trägt ein inline
`style="width:xx%"`, übernommen aus dem `\includegraphics[width=0.8\textwidth]`
der Quelle (sie reichen von 0,25 bis 0,99); Sub-Figure-Container tragen die
äußere Breite aus `\begin{subfigure}{0.48\textwidth}`.

Das ist nötig, weil die Legacy-Regel `.grafik { width:100% }` sonst jedes Bild
auf die Spaltenbreite streckte und kleine Diagramme über ihre native Auflösung
hinaus hochskalierte — `#paper figure.abbildung > img.grafik { width:auto }`
neutralisiert sie.

Die beiden TikZ-Abbildungen werden über standalone-`pdflatex` +
`pdftocairo -png -r 300` gerendert (die Quellen liegen nicht im Repo, nur die
PNGs in `bilder/`).
