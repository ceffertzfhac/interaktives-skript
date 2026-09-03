# Schriften (selbst gehostet)

**TeX Gyre Pagella** (Serife, Fließtext) und **TeX Gyre Heros** (Grotesk, UI,
Überschriften, Labels) — dieselben Schnitte, mit denen das Druckskript gesetzt
wird.

## Warum diese beiden und nicht die vorherigen

Bis v1.44.5 setzte das interaktive Skript Source Serif 4 und IBM Plex Sans über
Google Fonts. Beide sind gute Schriften, aber sie haben mit dem Druckskript
nichts zu tun — das war der größte konkrete Typografie-Bruch zwischen den fünf
Artefakten des Design-Systems (`KONVERGENZ_ENTSCHEIDUNGEN.md` C2).

Die LaTeX-Seite setzt mit `\usepackage[osf,sc]{mathpazo}` intern **URW
Palladio** (den freien Palatino-Nachbau) und mit `\usepackage{helvet}` **Nimbus
Sans** (den Helvetica-Nachbau). TeX Gyre Pagella und TeX Gyre Heros sind genau
diese beiden Familien, von GUST aus den URW-Spendedaten weiterentwickelt und
als OpenType herausgegeben. Die Angleichung ist damit keine Annäherung, sondern
**Identität**: derselbe Buchstabenkörper auf Papier und am Bildschirm.

`--font-mono` bleibt **IBM Plex Mono** — im Druck gibt es dafür keine
Entsprechung, also auch nichts anzugleichen. Es wandert aber mit ins Repo,
damit der Google-Fonts-`<link>` in `index.html` ganz entfallen kann. Benutzt
wird es ausschließlich für **Ziffern**, die untereinander stehen sollen:
Gleichungsnummern, Kapitelnummern im Inhaltsverzeichnis, Seitenzahl-Chips,
Fortschrittslabel, Textgrößen-Anzeige.

## Herkunft der Dateien

**Nicht aus dem Netz geladen, sondern lokal aus TeX Live 2025 konvertiert** —
aus genau dem Baum, aus dem `pdflatex` das Druckskript setzt:

```
/usr/local/texlive/2025/texmf-dist/fonts/opentype/public/tex-gyre/*.otf
```

Version laut Font-Tabelle: **2.501**. Konvertiert nach WOFF2 mit `fontTools`
4.55.3 (`TTFont(otf); f.flavor = "woff2"; f.save(woff2)`) — eine reine
Umverpackung, die Glyphen bleiben unangetastet.

SHA-256 der **Quell-OTFs**, damit die Konvertierung nachvollziehbar bleibt:

| Datei | SHA-256 |
|---|---|
| `texgyrepagella-regular.otf` | `44e64260716d8f2bbe412baa1ee99b7c995190ac4573177c24def0b9200438c7` |
| `texgyrepagella-bold.otf` | `dd4f9b69f0b24f1fb9be8634abf1fce2009e5c68a30842a3e9f5d6e535900abd` |
| `texgyrepagella-italic.otf` | `069bb27f48eb98a741715227fc6e4b7baf3639c29fc13925f70d1ed8884ac29a` |
| `texgyrepagella-bolditalic.otf` | `556fd64655a92bd9f5485ae2c03f7b9cdaf745a27a91d7edb3c3abde997206d2` |
| `texgyreheros-regular.otf` | `6ae1a09d5a940367b7aaaa91ee8bd8a2c333bfe193e7096e23f931357d62081f` |
| `texgyreheros-bold.otf` | `b170162835f4efc288886dd4231406dc47e19b614cf4416836635599d44a7d60` |
| `texgyreheros-italic.otf` | `6473df7fa107b3fb4be38973710afe22b0640c2ac076d5337cf126bed9aa108c` |

IBM Plex Mono kommt aus demselben TeX-Live-Baum (Paket `plex`),
`.../fonts/opentype/ibm/plex/`:

| Datei | SHA-256 |
|---|---|
| `IBMPlexMono-Regular.otf` | `9dd5e9822e2bf2ed40c6ae68bd36534b9e4db4a9bdc24c00294f34b86513b5d3` |
| `IBMPlexMono-Medium.otf` | `b2d02979638263052d82de295fc983a4eb7fe3ec8756db99a8d194c7f9da5429` |

Heros wird ohne `bolditalic` mitgeführt: die Grotesk trägt hier ausschließlich
Labels, Überschriften und Bedienelemente, fett-kursiv kommt darin nicht vor.
Pagella führt alle vier Schnitte, weil der Fließtext sie braucht.

## Warum lokal und nicht vom CDN

Dieselbe Begründung wie bei `src/vendor/qrjs2.min.js`: eine Schrift, die von
einem fremden Server kommt, kann ausfallen, sich ändern oder blockiert werden —
und dann sieht das Skript anders aus, ohne dass sich im Repo etwas geändert
hat. Bei den Schriften kommt hinzu, dass Google Fonts das Aufrufen einer
Drittsite bei jedem Seitenaufruf bedeutet; für ein Lehrmaterial einer
Hochschule ist das unnötig. Alle sieben Dateien zusammen sind rund 540 KB.

## Lizenzen

**TeX Gyre Pagella und Heros: GUST Font License (GFL)** — eine LPPL-artige
freie Lizenz; Weitergabe und Einbettung sind ausdrücklich erlaubt, auch
verändert, solange der Name geändert wird (was hier nicht geschieht). Volltext
in `GUST-FONT-LICENSE.txt`, unverändert aus TeX Live übernommen.

Copyright liegt bei GUST (Polska Grupa Użytkowników Systemu TeX) und beruht auf
den von URW++ Design & Development gespendeten URW-Palladio-L- und
URW-Nimbus-Sans-L-Daten.

**IBM Plex Mono: SIL Open Font License 1.1**, Copyright IBM Corp. Volltext in
`PLEX-LICENSE.txt`, ebenfalls unverändert aus TeX Live.
