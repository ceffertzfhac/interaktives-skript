---
name: v013-abbildungen
description: Abbildungen aus Input/v0.13/PSkriptBilder ins interaktive Skript übernehmen — PDF/TikZ nach PNG rendern, Dateiformate und Endungen prüfen, die individuellen Bildbreiten aus der LaTeX-Quelle übernehmen. Nutzen bei kaputten oder fehlenden Abbildungen, falsch skalierten Bildern, TikZ-Grafiken und beim Bildimport für ein neues Kapitel.
---

# Abbildungen aus v0.13 übernehmen

Teil der Kapitelmigration (Skill **v013-kapitel-migration**), auch einzeln
nutzbar. Hintergrund: `InteraktivesSkript_WIP/MIGRATION_v0.13_nach_HTML.md`, Abschnitt 2.

Ziel: `InteraktivesSkript_WIP/bilder/` enthält alle Abbildungen des Kapitels,
in verlässlichem Format, mit den Breiten aus der Quelle.

## 1. Welche Bilder, welche Breiten?

```bash
python3 .claude/skills/v013-abbildungen/scripts/breiten_uebernehmen.py \
        Input/v0.13/<kapitel>.tex
```

Listet jedes `\includegraphics` mit seiner Breite und die
`subfigure`-Außenbreiten. Dateinamen aus v0.13 **unverändert** übernehmen (auch
Tippfehler wie `skript_kreisbwegegung_winkel.png`) — das hält die
Nachvollziehbarkeit zur Quelle.

## 2. Formate normalisieren

**PDF → PNG**, 300 dpi reicht für Bildschirm und Druck:

```bash
pdftocairo -png -r 300 -singlefile Input/v0.13/PSkriptBilder/<name>.pdf \
           InteraktivesSkript_WIP/bilder/<name>
```

**SVG aus der Quelle nicht ungeprüft übernehmen.** Manche sind Handexporte mit
Systemschriften statt LaTeX-Konvertierungen; sie rendern mit Ersatzschrift und
passen dann nicht zu den übrigen Abbildungen — in einem Bildpaar steht (a) dann
in anderer Typografie als (b). Das Prüfskript meldet das.

## 3. TikZ-Grafiken rendern — nicht nachbauen

Manche Abbildungen liegen nur als `tikzpicture` in der `.tex`. Ein
handgeschriebener SVG-Nachbau ist **keine** Lösung: er weicht von der Vorlage
ab, ignoriert Design-Tokens (Darkmode!) und skaliert falsch. Stattdessen:

```latex
\documentclass[border=4pt]{standalone}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb}\usepackage{tikz}
\usetikzlibrary{positioning,calc}
\begin{document}
  % tikzpicture unveraendert aus der Kapitelquelle
\end{document}
```

```bash
pdflatex -interaction=nonstopmode fig.tex && pdftocairo -png -r 300 -singlefile fig.pdf fig
```

Die `.tex`-Hilfsdateien in einem temporären Verzeichnis lassen — nur die PNGs
gehören ins Repo.

## 4. Bestand prüfen

```bash
python3 .claude/skills/v013-abbildungen/scripts/bilder_pruefen.py \
        InteraktivesSkript_WIP/bilder \
        InteraktivesSkript_WIP/chapters/ch_NN.html
```

Prüft drei real aufgetretene Fehlerklassen:

1. **Endung lügt** — z. B. eine PDF-Datei mit `.png`-Endung (kam in der
   v0.13-Quelle vor und ergab eine kaputte Teilabbildung). Fix: aus der
   zugehörigen PDF rendern.
2. **SVG ohne eingebettete Schrift** — siehe oben.
3. **Zu kleine Rasterbilder** — werden hochskaliert und wirken unscharf.

Zusätzlich: referenzierte, aber fehlende Dateien.

## 5. Markup und Breiten

```html
<figure class="abbildung" id="fig-<bildbasisname>">
  <img class="grafik" style="width:80%" src="bilder/<datei>.png" alt="">
  <figcaption>Bildunterschrift 1:1 aus \caption{…}</figcaption>
</figure>
```

Teilabbildungen (`\begin{subfigure}`):

```html
<figure class="abbildung" id="fig-…">
  <div class="abbildung-sub-imgs">
    <div class="subfig" style="width:48%">
      <img class="grafik" style="width:75%" src="…" alt="">
      <div class="subcap">(a) …</div>
    </div>
    <div class="subfig" style="width:48%"> … </div>
  </div>
  <figcaption>gemeinsame Unterschrift</figcaption>
</figure>
```

Breiten automatisch eintragen (Probelauf ohne `--schreiben`):

```bash
python3 .claude/skills/v013-abbildungen/scripts/breiten_uebernehmen.py \
        Input/v0.13/<kapitel>.tex InteraktivesSkript_WIP/chapters/ch_NN.html --schreiben
```

**Die `id` ist Pflicht** — Querverweise zeigen darauf (`data-ref-fig`), und sie
muss vom Bildnamen abgeleitet und damit stabil gegenüber Umnummerierung sein.

**Fallstrick:** Die Altregel `.grafik { width: 100% }` überschreibt die
Inline-Breite. In `styles.css` muss stehen:

```css
#paper figure.abbildung > img.grafik { width: auto; max-width: 100%; }
```

`max-width` allein genügt nicht — `width` muss aktiv zurückgenommen werden.

## 6. Nummerierung

Abbildungen werden **nicht** im Markup nummeriert. `numbering.js` stellt der
`figcaption` zur Laufzeit `Abb. 1.n` voran — kapitelweit gezählt, weil v0.13
für `figure` kein `\numberwithin` setzt. Startwert über `data-figure-offset`
am `<h2>` des Kapitels.
