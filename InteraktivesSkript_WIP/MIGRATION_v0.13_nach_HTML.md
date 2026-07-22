# Migration eines Kapitels aus dem v0.13-LaTeX-Skript nach HTML

Vollständige Beschreibung aller Maßnahmen, die nötig waren, um Abschnitt **1.4
„Kinematik der Drehbewegung und Kreisbahnen"** aus `Input/v0.13/` in das
interaktive HTML-Skript zu überführen — geschrieben als **Runbook für das
nächste Kapitel**, nicht als Rückblick.

Stand: 2026-07-21, Branch `kapitel-1.4-verifikation-fixes`.
Ergebnis: `chapters/ch_01_kreisbewegungen.html`, 1255 Zeilen, 12 Unterabschnitte,
88 nummerierte Gleichungen, 23 Abbildungen, 30 Hervorhebungskästen,
9 Fußnoten, 31 Querverweise.

> **Die wichtigste Lehre vorweg:** Der Aufwand steckt *nicht* im Übersetzen der
> Prosa. Er steckt in (a) der Nummerierung, weil v0.13 uneinheitliche
> Zähler-Bereiche benutzt, (b) den Abbildungen, weil Format, Größe und
> Dateiendung nicht verlässlich sind, und (c) der Verifikation, weil eine in
> sich schlüssige Ausgabe trotzdem systematisch falsch sein kann.

---

## 0. Quellen und Wahrheitsbegriff

| Rolle | Datei |
|---|---|
| **Wahrheit für Inhalt** | `Input/v0.13/pskript_mech_kin_dreh_und_kreis_v1.tex` (1263 Zeilen) |
| **Wahrheit für Nummern und Layout** | `Input/v0.13/Physik_pskript_v0.13.pdf` (das *gesetzte* Dokument) |
| **Definition der Zähler und Boxen** | `Input/v0.13/Physik_skript_header_gmni_v3.tex` |
| **Master, Kapitelreihenfolge** | `Input/v0.13/Physik_pskript_v0.13.tex` |
| Bildquellen | `Input/v0.13/PSkriptBilder/` |

**Regel:** Die `.tex`-Datei allein genügt nicht. Sämtliche Nummern (Gleichungen,
Abbildungen, Boxen) entstehen erst aus Header-Deklarationen plus dem Zustand
vorheriger Kapitel. Wer nur die `.tex` liest, bekommt eine in sich schlüssige,
aber falsche Nummerierung. **Die Nummern kommen aus dem PDF.**

`Input/` ist grundsätzlich lesend — nichts darin wird verändert.

---

## 1. Vorbereitung: Zähler-Bereiche aus dem Header ermitteln

Vor der ersten Zeile Prosa. In `Physik_skript_header_gmni_v3.tex` (Z. 131–137):

```latex
\numberwithin{equation}{section}            % -> (1.4.n)
\numberwithin{beispielcounter}{section}     % -> Beispiel 1.4.n
\numberwithin{bemerkungcounter}{section}    % -> Bemerkung 1.4.n
\numberwithin{wichtigcounter}{section}      % -> Wichtig 1.4.n
\numberwithin{lernzielcounter}{section}     % -> Lernziel 1.4.n
\numberwithin{aufgabecounter}{section}      % -> Aufgabe 1.4.n
\numberwithin{zusammenfassungcounter}{chapter}  % -> Zusammenfassung 1.n  (!)
%  figure: KEIN \numberwithin                   -> Abbildung 1.n         (!)
```

Zwei Ausreißer, die man leicht übersieht und die beide zu **komplett falscher
Nummerierung im gesamten Kapitel** führen:

1. **`zusammenfassungcounter` läuft kapitelweit**, alle anderen Boxen pro Section.
2. **`figure` hat gar kein `\numberwithin`** — der Abbildungszähler läuft
   kapitelweit durch. Abschnitt 1.4 beginnt deshalb im PDF bei **Abbildung 1.38**,
   nicht bei 1.4.1.

Zusätzlich die Section-Nummer selbst prüfen: der Master setzt
`\setcounter{chapter}{-1}` **und** `\addtocounter{section}{-1}` vor der ersten
Section der Mechanik. Dadurch ist die erste Section **1.0**, das
Kreisbewegungs-Kapitel folglich **1.4** — beim bloßen Abzählen der
`\section`-Befehle kommt man auf 1.5 (dieser Fehler ist real passiert).

### Referenzwerte aus dem PDF ziehen

```bash
pdftotext -layout Input/v0.13/Physik_pskript_v0.13.pdf /tmp/v013.txt
# Abschnittsgrenzen suchen, dann:
grep -oE "\(1\.4\.[0-9]+\)" /tmp/sec14.txt | sort -u -V      # Gleichungen
grep -oE "Abbildung 1\.[0-9]+:" /tmp/sec14.txt | sort -u -V   # Abbildungen
grep -oE "(Beispiel|Bemerkung|Wichtig|Aufgabe|Zusammenfassung) 1\.[0-9.]+" /tmp/sec14.txt | sort -u -V
```

Ergebnis für 1.4 — **das ist das Prüfziel**:

| Objekt | Nummernbereich im PDF | Anzahl |
|---|---|---|
| Gleichungen | (1.4.1) … (1.4.88) | 88 |
| Abbildungen | 1.38 … 1.60 | 23 |
| Beispiel | 1.4.1 … 1.4.6 | 6 |
| Bemerkung | 1.4.1 … 1.4.14 | 14 |
| Wichtig | 1.4.1 … 1.4.3 | 3 |
| Aufgabe | 1.4.1 … 1.4.3 | 3 |
| Zusammenfassung | **1.4 … 1.7** | 4 |

---

## 2. Abbildungs-Assets

### 2.1 Formate normalisieren

Die Quellbilder liegen gemischt als PNG, PDF und SVG vor. Verbindlich ist, was
die `.tex` per `\includegraphics` einbindet.

* **PDF → PNG** mit `pdftocairo -png -r 300 -singlefile <quelle>.pdf <ziel>`.
  300 dpi ist ausreichend für Bildschirm und Druck.
* **SVG aus der Quelle nicht ungeprüft übernehmen.** Drei Dateien
  (`beschl`, `beschl_minus`, `geschw`) lagen als SVG vor, waren aber
  *Handexporte mit Systemschriften* (`font-family: Palatino, Times New Roman`,
  keine eingebetteten Fonts) statt LaTeX-Konvertierungen. Im selben Bildpaar
  stand dadurch (a) in anderer Typografie als (b). Prüfen:

  ```bash
  grep -o 'font-family[^;"]*' bild.svg | sort -u   # verweist auf Systemfonts?
  grep -c '@font-face\|<font' bild.svg             # 0 = nichts eingebettet
  ```
  Im Zweifel aus der zugehörigen PDF rendern.

* **Dateiendung gegen Inhalt prüfen.** `skript_kreisbewegung_beschl_plus.png`
  war ein **PDF mit `.png`-Endung** — schon in der Quelle so abgelegt. Der
  Browser zeigt dann ein kaputtes Bild. Prüfschleife über *alle* Bilder:

  ```python
  # PNG: \x89PNG   JPEG: \xff\xd8\xff   SVG: enthält "<svg"
  # -> Endung gegen Magic Bytes vergleichen, Abweichungen melden
  ```
  Bei 54 Bildern gab es genau einen solchen Fall — er war visuell sofort
  sichtbar, per Skript in einer Sekunde zu finden.

### 2.2 TikZ-Grafiken rendern

Zwei Abbildungen liegen nur als TikZ-Quelltext in der `.tex` (radial/tangential;
Kinematik-Flowchart). **Nicht nachbauen** — der erste Anlauf hatte sie als
handgeschriebene Inline-SVGs approximiert, was weder der Vorlage entsprach
noch im Darkmode funktionierte (harte Farben `#888`/`#000`) noch skalierte
(Einheiten-`viewBox` ohne `width`/`height`, dadurch Faktor ~160 aufgeblasen).

Stattdessen als `standalone`-Dokument kompilieren:

```latex
\documentclass[border=4pt]{standalone}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb}\usepackage{tikz}
\usetikzlibrary{positioning,calc}
\begin{document}
  % <tikzpicture> unverändert aus der Kapitelquelle
\end{document}
```
```bash
pdflatex -interaction=nonstopmode fig.tex && pdftocairo -png -r 300 -singlefile fig.pdf fig
```

Die `.tex`-Hilfsdateien bleiben außerhalb des Repos; nur die PNGs landen in
`bilder/`.

### 2.3 Bildbreiten übernehmen

v0.13 vergibt **individuelle** Breiten — im Kapitel 1.4 zwischen
`0.25\textwidth` und `0.99\textwidth` (10× 0.8, 4× 0.9, 3× 0.5, 2× 0.99,
2× 0.75, je 1× 0.6/0.4/0.4/0.25). Diese Information geht sonst verloren und
alle Abbildungen erscheinen gleich breit; kleine Schemata werden über ihre
native Auflösung hinaus hochskaliert und wirken unscharf.

Vorgehen: Breiten aus der `.tex` extrahieren und als Inline-Style ans Bild
schreiben, Teilabbildungen zusätzlich mit der `subfigure`-Außenbreite:

```html
<figure class="abbildung" id="fig-<basename>">
  <img class="grafik" style="width:80%" src="bilder/<datei>.png" alt="">
  <figcaption>…</figcaption>
</figure>

<div class="abbildung-sub-imgs">
  <div class="subfig" style="width:48%">          <!-- \begin{subfigure}{0.48\textwidth} -->
    <img class="grafik" style="width:75%" …>      <!-- \includegraphics[width=0.75\linewidth] -->
    <div class="subcap">(a) …</div>
  </div>
  …
</div>
```

**Fallstrick:** Die Altregel `.grafik { width: 100% }` (aus der Zeit der
interaktiven SVG-Figuren) überschreibt das. Deshalb in `styles.css`:
`#paper figure.abbildung > img.grafik { width: auto; max-width: 100%; }` —
`max-width` allein genügt **nicht**, `width` muss aktiv zurückgenommen werden.

---

## 3. Dokumentstruktur

Der Pagination-Vertrag von `pages.js` verlangt genau diese Form:

```html
<h2 class="inhaltsverzeichnis" data-figure-offset="37" data-zusammenfassung-offset="3">
  1.4 Kinematik der Drehbewegung und Kreisbahnen</h2>
<section> … Kapitel-Intro … </section>

<h3 class="inhaltsverzeichnis">1.4.1 Die Kreisbahn</h3>
<section> … </section>
…
```

* Jede `.inhaltsverzeichnis`-Überschrift wird zu **einer Seite** (h2 = Intro,
  h3 = Unterabschnitt). Für 1.4 ergibt das 13 Seiten.
* `\subsubsection*` wird zu `<h4>` **ohne** die Klasse `inhaltsverzeichnis` —
  sonst bekäme es eine eigene Seite (5× im Kapitel, z. B. „Spezialfall:
  Gleichförmige Kreisbewegung").
* Loses Markup zwischen `</section>` und der nächsten Überschrift wird von
  `foldStraySiblings()` der vorigen Seite zugeschlagen; man muss also nicht
  peinlich genau schachteln, sollte es aber.
* Die beiden `data-*-offset`-Attribute am h2 sind die Startwerte der
  kapitelweiten Zähler (s. Abschnitt 5).

---

## 4. Makro-Abbildung LaTeX → HTML

| v0.13 | HTML | Anzahl in 1.4 | Anmerkung |
|---|---|---|---|
| `\bbsp{Titel}` | `<div class="beispiel" data-title="Titel">` | 6 | Titel als Attribut, nicht als Text |
| `\bbem{…}` | `<div class="bemerkung" …>` | 14 | |
| `\bwicht{…}` | `<div class="wichtig" …>` | 3 | |
| `\baufg{…}` | `<div class="aufgabe" …>` | 3 | |
| `\bzusafa{…}` | `<div class="zusammenfassung" …>` | 4 | **kapitelweit nummeriert** |
| `\point{…}` | `<strong>…</strong>` | 19 | hervorgehobener Fachbegriff |
| `\textbf{…}` | `<strong>…</strong>` | 83 | |
| `\enquote{…}` | `„…"` | 6 | echte deutsche Anführungszeichen |
| `\footnote{…}` | `<span class="fussnote">…</span>` | 9 | Rest macht `footnotes.js`, s. Abschnitt 8 |
| `\mar{…}` | *entfällt* | 5 | Autoren-Randmarker ohne Entsprechung |
| `\SI{1,5}{\meter}` | `\(1{,}5\,\mathrm{m}\)` | 51 | siunitx wird **manuell** aufgelöst |
| `\si{\second^{-1}}` | `\(\mathrm{s^{-1}}\)` | 2 | |
| `\degree` | `^\circ` | 2 | |
| `\begin{tabular}` | `<table>` | 2 | |
| `\begin{itemize}` | `<ul>` | 12 | |
| `\begin{subfigure}` | `.subfig` (s. 2.3) | 8 | |
| `\label`/`\ref` | Anker + `data-ref-*` | 56/40 | s. Abschnitt 7 |

**Dezimalkomma:** in Mathe immer `1{,}5`, nie `1,5` — sonst setzt TeX hinter
dem Komma einen Wortabstand.

---

## 5. Mathematik

### 5.1 Umgebungen unverändert übernehmen

MathJax v3 versteht die LaTeX-Umgebungen direkt (`processEnvironments: true`).
`equation`, `align`, `pmatrix`, `\boxed`, `\underbrace` werden 1:1 übernommen;
lediglich `&` muss als `&amp;` maskiert werden, weil der Inhalt in HTML steht.

Bestand in 1.4: 71 `equation`, 9 `align`, 7 `align*`, 51 `\[ \]`,
678 Inline-`\( \)`, 76 `pmatrix`.

### 5.2 Die `\be`/`\ee`-Falle

Der Header definiert:

```latex
\newcommand{\be}{\begin{equation}}
\newcommand{\ee}{\end{equation}}
```

v0.13 benutzt das **mitten im Satz**:

> … Die Vektoren selbst, also `\textcolor{red}{\be\begin{pmatrix}…\end{pmatrix}\ee}`
> und `\textcolor{blue}{\be…\ee}` sind Einheitsvektoren.

Das liest sich wie Inline-Mathematik, ist aber eine **nummerierte
Display-Gleichung**. Werden solche Stellen zu `\(…\)` gemacht, fehlen Nummern
und **alles Folgende verschiebt sich**. Genau das ist passiert: 4 Stellen in
1.4.3 → 84 statt 88 Gleichungen, ab (1.4.43) war jede Nummer um 4 versetzt.

**Prüfung:** `grep -c '\\be\b' kapitel.tex` — jedes Vorkommen muss im HTML als
`\begin{equation}` landen, auch wenn der Satz dadurch aufgebrochen wird:

```html
<p>… Die Vektoren selbst, also</p>
\begin{equation}\textcolor{red}{\begin{pmatrix}…\end{pmatrix}}\end{equation}
<p>und</p>
\begin{equation}\textcolor{blue}{…}\end{equation}
<p>sind Einheitsvektoren.</p>
```

### 5.3 MathJax-Konfiguration (`index.html`)

```js
window.MathJax = {
  tex: {
    packages: {'[+]': ['tagformat', 'color']},   // <- unverzichtbar
    tags: 'ams',
    inlineMath: [['\\(', '\\)']],
    displayMath: [['$$','$$'], ['\\[','\\]']],
    processEscapes: true,
    processEnvironments: true,
    processRefs: true,
    tagformat: {
      number: (n) => '1.4.' + n,
      tag:    (t) => '(' + t + ')',
      id:     (id) => 'eq-' + id
    }
  },
  loader: { load: ['[tex]/tagformat', '[tex]/color'] }
};
```

**Fallstrick (kostet garantiert eine Stunde):** Eine Extension per
`loader.load` zu laden **aktiviert sie nicht**. Ohne den Eintrag in
`tex.packages` bleibt `tagformat` wirkungslos und die Tags erscheinen als
`(1)` statt `(1.4.1)`; `\textcolor` bleibt ebenfalls unwirksam. Der Fehler ist
in einer Offline-Prüfung mit `AllPackages` **nicht** sichtbar.

Das Präfix `'1.4.'` ist derzeit eine Konstante. **Sobald ein zweiter Abschnitt
ins WIP kommt, muss es pro Seite ermittelt werden** (analog
`numbering.js::sectionPrefix()`), sonst sind dort alle Formeln falsch
nummeriert. → offener Punkt in `BACKLOG.md`.

### 5.4 Zeilenabstand mehrzeiliger Formeln

MathJax ignoriert `\setlength{\jot}` und `\renewcommand{\arraystretch}`
(nachgemessen: identische SVG-Höhe). Wirksam sind **nur explizite Abstände**:

```latex
a &= 1 \\[6pt]
b &= 2
```

Die Abstände dürfen nur an Zeilenumbrüchen **auf oberster Ebene** der
`align`/`gather`-Umgebung stehen — nicht an den `\\` innerhalb von `pmatrix`,
`cases`, `array`, `split`. Das erfordert einen klammer-zählenden Durchlauf
(im Kapitel: 27 betroffene Umbrüche).

### 5.5 Farben

18 `\textcolor`-Vorkommen, in zwei Kategorien:

* **In Formeln** (`\textcolor{red}{…}`, `\textcolor{blue}{…}`) — unverändert
  übernehmen, MathJax rendert das mit dem `color`-Paket.
* **In Bildunterschriften** (`\textcolor[HTML]{1555A2}{…}`) — außerhalb der
  Mathematik, daher als `<span style="color:#1555a2">…</span>`.

Die Farben sind **nicht dekorativ**: die Prosa verweist ausdrücklich darauf
(„hervorgehoben durch die unterschiedlichen Farben", „(in blau)"). Fehlen sie,
laufen diese Sätze ins Leere. Farbcodes in 1.4: `#1555a2` blau, `#f47a2d`
orange, `#474747` grau.

---

## 6. Nummerierung zur Laufzeit (`numbering.js`)

Gleichungen nummeriert MathJax selbst. Alles andere macht `numbering.js` beim
Start, generisch über das Seitenregister:

* **Boxen**: pro Typ ein Zähler; `CHAPTER_SCOPED = {zusammenfassung}` bestimmt,
  welcher Typ kapitelweit statt pro Section läuft.
* **Abbildungen**: kapitelweit, Präfix ist die Kapitelnummer → `Abb. 1.38`.
* **Startwerte**: Weil erst *ein* Abschnitt eines laufenden Kapitels migriert
  ist, brauchen die kapitelweiten Zähler einen Offset — das, was die
  Abschnitte 1.0–1.3 bereits verbraucht hätten. Deklarativ am h2:
  `data-figure-offset="37"`, `data-zusammenfassung-offset="3"`.
  **Beide Offsets entfallen, sobald die vorherigen Abschnitte im WIP stehen.**

Box-Titel bestehen aus zwei Spans, damit Versalien nur den Typ treffen:

```html
<div class="highlight_box_title">
  <span class="hb-type">BEMERKUNG 1.4.3</span><span class="hb-name">: Radial und Tangential</span>
</div>
```

`text-transform: uppercase` liegt ausschließlich auf `.hb-type` — sonst würden
Fachbegriffe und Formelbestandteile im Titel verfälscht.

---

## 7. Querverweise

**Keine getippten Nummern im Text.** Jeder Verweis ist ein Anker mit einem
Schlüssel; die Nummer trägt die Laufzeit ein, damit Text und Ziel nicht
auseinanderlaufen können:

| Verweis | Markup | Auflösung | Anzahl |
|---|---|---|---|
| Abbildung | `<a class="xref" data-ref-fig="fig-<basename>">` | `numbering.js`, aus dem Figuren-Zähler | 10 |
| Abschnitt | `<a class="xref" data-ref-sec="p-1-4-5">` | aus dem Seitenregister (`pages.js::slugFor`) | 5 |
| Gleichung | `<a class="xref" data-ref-eq="eq_…">` | aus MathJax' Label-Register | 16 |

Jede Abbildung bekommt dafür eine **stabile id aus ihrem Bildnamen**
(`id="fig-skript-kreisbewegung-winkel"`), unabhängig von ihrer Nummer.

**MathJax rendert `\ref` nur als Text, nicht als Link.** Die Nummern stehen
aber im Label-Register und sind nach dem Typeset abgreifbar:

```js
MathJax.startup.document.inputJax[0].parseOptions.tags.allLabels
// { eq_kreisbahn_position: { tag: "1.4.3", id: "eq-eq_kreisbahn_position" }, … }
```

Aufgerufen wird das über `window.resolve_eq_refs` — bewusst als
window-Brücke statt Import, sonst entstünde der Zyklus
`core → numbering → pages → core`.

**Seitenbewusste Sprungmarken:** Da immer nur eine `.chapter-page` sichtbar
ist, liefe ein reiner `#anker`-Link auf eine andere Seite ins Leere. `main.js`
fängt deshalb Klicks auf `a[href^="#"]` zentral ab, blendet erst die Zielseite
ein und scrollt dann. Das gilt automatisch für alles, was künftig `#`-Links
erzeugt.

---

## 8. Fußnoten

Ausgeschrieben unterbrechen die 9 Fußnoten den Satz. Umsetzung: an der Stelle
steht ein rundes **(i)** in Fließtextgröße, ein Klick klappt den Text unter
dem Absatz auf.

Die Umwandlung macht `footnotes.js` **zur Laufzeit** aus
`<span class="fussnote">…</span>` — nicht das Kapitel-Markup. Damit gilt sie
automatisch für jedes künftige Kapitel (O(1) statt Handarbeit pro Fußnote).
Mehrere Fußnoten desselben Absatzes teilen sich ein Panel. Im Druck sind alle
ausgeklappt und die Marker ausgeblendet. Die laufende Nummer bleibt als
`.sr-only` für Screenreader erhalten.

---

## 9. Darstellung

Ergänzungen in `styles.css` (alle additiv, nichts Bestehendes entfernt):

* `figure.abbildung` mit `figcaption`, `.fig-label`, `.abbildung-sub-imgs`,
  `.subfig`, `.subcap`, `.bildquelle`
* Tabellen (`#paper table`, `table.twocol`)
* Fußnoten: `.fn-marker`, `.fussnote-panel`, `.fussnote-item`, `.fussnote-icon`
* Querverweise: `a.xref` (dezent unterstrichen, Textfarbe geerbt)
* Kastentypen: je eine Akzentfarbe `--box-accent` + sehr schwacher Flächenton
  (4 %, Zusammenfassung 7 %, Bemerkung ohne Ton). Ein neuer Typ = eine Zeile.
* Formelkarten: **nur nummerierte** Formeln bekommen eine Karte. MathJax
  markiert getaggte Display-Formeln mit `width="full"` — das ist die
  Unterscheidung, rein per CSS:
  `mjx-container[display="true"][width="full"]` vs. `:not([width="full"])`.

### Kontrast

Alle Farbkombinationen wurden gerechnet, nicht geschätzt (WCAG AA = 4,5:1 für
Text unter 18,66 px):

| Element | vorher | nachher |
|---|---|---|
| Bildunterschriften, Fußnoten (`--ink-3`) | 2,98:1 ✗ | 4,70:1 ✓ |
| Box-Titel hell (schlechtester Fall) | — | 5,83:1 ✓ |
| Box-Titel dunkel bei gleicher Mischung | 3,69:1 ✗ | 5,71:1 ✓ |
| Fußnoten-(i) hell / dunkel | — | 5,28:1 / 6,54:1 ✓ |

**Im Darkmode kehrt sich die Mischung um**: hell wird der Akzent mit `--ink`
abgedunkelt (55 % Akzent), dunkel muss der helle `--ink`-Anteil überwiegen
(35 %). Analog beim (i): hell weißes Zeichen auf farbigem Kreis, dunkel heller
Kreis mit dunklem Zeichen.

### Kästen, die die Klassenliste vergessen haben

Die v0.13-Namen `bemerkung`/`wichtig` waren neu. **Fünf voneinander unabhängige
Stellen** zählen Box-Klassen auf; fehlt eine, ist der Fehler still:

1. `core.js::generate_highlight_boxes` — Icon und Titel
2. `numbering.js::BOX_LABELS` — Nummerierung
3. `styles.css` — Kartenoptik **und** der 50-px-Freiraum links fürs Icon
4. `styles.css` — die „kein Box-in-Box"-Regel für Formeln in Kästen
5. `shell.js::landmarksFor` — linke Schiene

Konkret aufgetreten: ohne (3) fehlte der Freiraum, und das absolut
positionierte Icon landete **außerhalb der Lesespalte in der Navigationsleiste**.

---

## 10. Verifikation

Drei Werkzeuge, keins ersetzt das andere.

### 10.1 PDF-Vergleich — prüft, ob die Nummern *richtig* sind

```bash
pdftotext -layout Input/v0.13/Physik_pskript_v0.13.pdf /tmp/v013.txt
```
Dann Gleichungsnummern **pro Unterabschnitt** zählen und gegen das HTML
stellen. Nur so fällt ein Offset auf: Anzahl und Bereich müssen je
Unterabschnitt übereinstimmen, nicht nur die Gesamtzahl.

### 10.2 MathJax offline (`mathjax-full` unter Node) — prüft LaTeX-Fehler und Tags

Rendert das Kapitel ohne Browser, liefert TeX-Fehler, Tag-Nummern und
unaufgelöste Referenzen. Tag-Nummern aus dem MathML lesen:

```js
const {SerializedMmlVisitor} = require('mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js');
for (const item of doc.math) {
  const mml = new SerializedMmlVisitor().visitTree(item.root);
  // <mtd><mtext>(1.4.12)</mtext> => Tag
}
```

**Grenze:** Der Harness läuft mit `AllPackages` und sieht daher
Konfigurationsfehler wie das fehlende `tex.packages` **nicht**. Genau dieser
Fehler ist durchgerutscht und erst dem Nutzer im Browser aufgefallen.

### 10.3 jsdom-Harness — prüft Pagination, Nummerierung, Fußnoten

Baut das DOM ohne Browser auf: `index.html` laden, Skript-Tags entfernen,
Kapitel-Fragmente wie `chapters.js` einhängen und flachziehen, dann
`generate_highlight_boxes()`, `paginate()`, `init_footnotes()`,
`init_numbering()` aufrufen und die vergebenen Labels ausgeben. Damit sind
prüfbar: Seitenanzahl, Abbildungs- und Boxnummern, Zähler-Resets am
Kapitelwechsel, Fußnoten-Umwandlung samt Auf-/Zuklappen.

**Grenze:** Kein Layout, keine Schriftmetrik, keine Farben — Kollisionen,
Bildgrößen und Kontrastwirkung sieht nur ein Mensch im Browser.

### 10.4 Was nur im Browser geht

Rendering der Formeln, tatsächliche Bildgrößen, Layout-Kollisionen, Darkmode,
Druckfluss (`?print=true`), Inhaltsverzeichnis, Tablet-Ansicht.

---

## 11. Fallstricke-Katalog

Alle real aufgetreten, mit Symptom und Erkennungsweg.

| # | Symptom | Ursache | Erkennung |
|---|---|---|---|
| 1 | Alle Abbildungsnummern falsch | `figure` hat kein `\numberwithin` → kapitelweiter Zähler | PDF-Vergleich |
| 2 | Zusammenfassungen falsch nummeriert | einziger Boxtyp mit `{chapter}` statt `{section}` | Header lesen |
| 3 | Formelnummern ab (1.4.43) um 4 versetzt | 4× `\be…\ee` zu Inline-Mathe degradiert | Zählung pro Unterabschnitt |
| 4 | Tags erscheinen als `(1)` | `tagformat` geladen, aber nicht in `tex.packages` | **nur im Browser** |
| 5 | Alle Abbildungen gleich breit, unscharf | `.grafik{width:100%}` überschreibt; Breiten nie übernommen | Vergleich mit PDF |
| 6 | Teilabbildung (b) kaputt | PDF mit `.png`-Endung | Magic-Byte-Scan |
| 7 | (a) und (b) in verschiedener Typografie | SVG-Handexport statt PDF-Rendering | `font-family` im SVG |
| 8 | Piktogramme ragen in die Navigationsleiste | `bemerkung`/`wichtig` fehlten in der CSS-Klassenliste | Browser |
| 9 | Rechte Spalte leer, Text nach links gequetscht | Marginalie sammelt nur `.anmerkung`, Kapitel nutzt `.bemerkung`; Grid-Spalte fix 210 px | Browser |
| 10 | Überschriften kollidieren mit der Toolbar | Krume ohne Ellipse, Bedienelemente ohne `flex-shrink:0` | Browser |
| 11 | Bildunterschriften kaum lesbar | `--ink-3` bei 2,98:1 | Kontrast rechnen |
| 12 | Formel in Bemerkung bekommt doppelten Rahmen | „kein Box-in-Box"-Regel kannte die neuen Klassen nicht | Browser |
| 13 | Folgeregeln im CSS wirkungslos | `*/` in einem Kommentar (`equation*/align*`) beendet ihn vorzeitig | Kommentare paaren |

---

## 12. Checkliste für das nächste Kapitel

**Vorbereitung**
- [ ] Zähler-Scopes im Header prüfen (`\numberwithin`), Ausreißer notieren
- [ ] Section-Nummer verifizieren (`\addtocounter{section}{-1}` im Master!)
- [ ] Referenznummern per `pdftotext` aus dem PDF ziehen und notieren
- [ ] Prüfen, ob die Offsets am h2 noch nötig sind oder entfallen können
- [ ] **MathJax-Präfix**: bei mehr als einem Abschnitt muss `tagformat.number`
      pro Seite ermittelt werden (heute Konstante `'1.4.'`)

**Assets**
- [ ] Alle `\includegraphics`-Ziele mit Breite extrahieren
- [ ] PDF-Quellen mit `pdftocairo -png -r 300` rendern
- [ ] TikZ als `standalone` kompilieren, nicht nachbauen
- [ ] Endung gegen Magic Bytes prüfen (alle Bilder)
- [ ] SVGs auf eingebettete Schriften prüfen

**Text**
- [ ] Makro-Tabelle aus Abschnitt 4 abarbeiten
- [ ] `grep -c '\\be\b'` — jede Stelle als `\begin{equation}`
- [ ] siunitx auflösen, Dezimalkomma als `{,}`
- [ ] `\textcolor` übernehmen (Formeln) bzw. als `<span style>` (Captions)
- [ ] `\\[6pt]` an Umbrüchen oberster Ebene in `align`
- [ ] Verweise als `data-ref-*`-Anker, **nie** getippte Nummern
- [ ] Abbildungen bekommen stabile ids

**Prüfen**
- [ ] Gleichungszahl **pro Unterabschnitt** gegen das PDF
- [ ] Abbildungs-, Box-, Zusammenfassungsnummern gegen das PDF
- [ ] Alle Bildpfade liefern 200
- [ ] jsdom-Harness: Seitenanzahl, Labels, Fußnoten
- [ ] Neue Box-Typen? → alle **fünf** Klassenlisten (Abschnitt 9)
- [ ] Kontrast neuer Farben rechnen, hell **und** dunkel
- [ ] Im Browser: Tags, Farben, Bildgrößen, Layout, Darkmode, Druck

---

## 13. Bewusste Abweichungen von v0.13

* **Fußnoten** stehen nicht im Fließtext, sondern hinter einem (i) — bewusste
  Verbesserung fürs Lesen am Bildschirm.
* **Autoren-Randmarker** (`\mar`) entfallen ersatzlos.
* **Kastenoptik** ist dezenter als im PDF (schwache Flächentöne statt kräftiger
  tcolorbox-Rahmen) — ausdrücklicher Wunsch.
* **Eine stillschweigende Textkorrektur**: Fußnote 2 lautet „**Im** Kapitel zur
  Kinematik" statt „In Kapitel". Weitere Korrekturen gehören in eine
  Korrekturliste, damit „wortgleich" prüfbar bleibt.
* `\ref{sec_kinematik}` zeigt auf einen noch nicht migrierten Abschnitt und
  steht als Klartext „Abschnitt zur Kinematik".
