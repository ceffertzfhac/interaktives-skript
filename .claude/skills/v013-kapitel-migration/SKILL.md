---
name: v013-kapitel-migration
description: Ein Kapitel/Abschnitt aus dem v0.13-LaTeX-Skript (Input/v0.13/) in ein HTML-Fragment unter InteraktivesSkript_WIP/chapters/ überführen. Nutzen, wenn ein neuer Abschnitt migriert, transkribiert oder aus dem PDF/tex ins interaktive Skript übernommen werden soll — auch bei Teilaufgaben wie "Formeln übernehmen", "Boxen umsetzen", "siunitx auflösen", "Nummerierung stimmt nicht".
---

# Migration eines v0.13-Abschnitts nach HTML

Ausführliche Begründung jedes Schritts: `InteraktivesSkript_WIP/MIGRATION_v0.13_nach_HTML.md`.
Dieses Skill ist die Arbeitsanweisung, das Runbook die Referenz.

Zwei Schwester-Skills: **v013-abbildungen** (Bilder) und **v013-verifikation** (Prüfen).

## Grundsatz

> Die `.tex`-Datei ist die Wahrheit für den **Inhalt**, das **PDF** ist die
> Wahrheit für die **Nummern**. Wer nur die `.tex` liest, produziert eine in
> sich schlüssige, aber falsche Nummerierung. Das ist der teuerste Fehler in
> dieser Aufgabe und er ist bereits einmal passiert.

Nur `InteraktivesSkript_WIP/` verändern. `Input/` ist lesend.

## Schritt 1 — Zähler-Bereiche klären (vor der ersten Zeile Prosa)

In `Input/v0.13/Physik_skript_header_gmni_v3.tex` nachsehen, welcher Zähler
womit läuft. In v0.13 gilt (unbedingt gegenprüfen, gilt evtl. nicht ewig):

- `equation`, `beispiel`, `bemerkung`, `wichtig`, `lernziel`, `aufgabe` → **pro Section** → `1.4.n`
- `zusammenfassung` → **pro Kapitel** → `1.n`
- `figure` → **gar kein `\numberwithin`** → kapitelweit → `Abbildung 1.n`

Ebenso die Section-Nummer selbst prüfen: der Master setzt
`\addtocounter{section}{-1}`, wodurch die erste Section **1.0** ist. Beim
Abzählen der `\section`-Befehle verzählt man sich sonst um eins.

Danach die Sollwerte ziehen und notieren:

```bash
python3 .claude/skills/v013-verifikation/scripts/referenznummern.py \
        Input/v0.13/Physik_pskript_v0.13.pdf <praefix>
```

## Schritt 2 — Abbildungen

→ Skill **v013-abbildungen**. Ergebnis: alle Bilder liegen in `bilder/`, Format
und Endung stimmen, Breiten sind bekannt.

## Schritt 3 — Struktur anlegen

```html
<h2 class="inhaltsverzeichnis" data-figure-offset="N" data-zusammenfassung-offset="M">
  1.4 Titel des Abschnitts</h2>
<section> … Intro … </section>

<h3 class="inhaltsverzeichnis">1.4.1 Erster Unterabschnitt</h3>
<section> … </section>
```

- Jede `.inhaltsverzeichnis`-Überschrift wird **eine Seite**.
- `\subsubsection*` → `<h4>` **ohne** `inhaltsverzeichnis` (sonst eigene Seite).
- Die beiden Offsets sind die Startwerte der kapitelweiten Zähler: was die noch
  nicht migrierten vorherigen Abschnitte bereits verbraucht hätten (aus dem PDF
  ablesen, z. B. erste Abbildung 1.38 → `data-figure-offset="37"`). Entfallen,
  sobald die vorherigen Abschnitte migriert sind.
- Neue Datei in `chapters/`, eine Zeile `<div data-chapter="…">` in `index.html`.

## Schritt 4 — Text übertragen

| v0.13 | HTML |
|---|---|
| `\bbsp{T}` / `\bbem` / `\bwicht` / `\baufg` / `\bzusafa` | `<div class="beispiel\|bemerkung\|wichtig\|aufgabe\|zusammenfassung" data-title="T">` |
| `\point{…}`, `\textbf{…}` | `<strong>…</strong>` |
| `\enquote{…}` | `„…"` |
| `\footnote{…}` | `<span class="fussnote">…</span>` (Rest macht `footnotes.js`) |
| `\mar{…}` | entfällt |
| `\SI{1,5}{\meter}` | `\(1{,}5\,\mathrm{m}\)` |
| `\si{\second^{-1}}` | `\(\mathrm{s^{-1}}\)`, `\degree` → `^\circ` |
| `\begin{tabular}` / `itemize` | `<table>` / `<ul>` |

**Dezimalkomma in Mathe immer `1{,}5`**, sonst setzt TeX einen Wortabstand.

## Schritt 5 — Formeln

- Umgebungen unverändert übernehmen (`equation`, `align`, `pmatrix`, `\boxed`);
  `&` als `&amp;` maskieren.
- **`\be`/`\ee` sind `\begin{equation}`/`\end{equation}`** und stehen in v0.13
  oft mitten im Satz. Sie sehen wie Inline-Mathe aus, sind aber nummerierte
  Display-Gleichungen. Werden sie zu `\(…\)`, fehlen Nummern und **alles
  Folgende verschiebt sich**. Prüfen: `grep -c '\\be\b' kapitel.tex` — jede
  Fundstelle muss im HTML `\begin{equation}` sein, notfalls den Absatz aufbrechen:

  ```html
  <p>… Die Vektoren selbst, also</p>
  \begin{equation}\textcolor{red}{\begin{pmatrix}…\end{pmatrix}}\end{equation}
  <p>und</p>
  ```
- `\textcolor` in Formeln unverändert; in Bildunterschriften (außerhalb Mathe)
  als `<span style="color:#…">`. Die Farben sind **nicht dekorativ** — die
  Prosa verweist darauf („in blau", „durch die Farben hervorgehoben").
- Zeilenabstand mehrzeiliger Formeln (MathJax ignoriert `\jot`/`\arraystretch`):

  ```bash
  python3 .claude/skills/v013-kapitel-migration/scripts/formel_zeilenabstand.py \
          chapters/ch_NN.html --schreiben
  ```
  Das Skript zählt Schachtelung, damit `pmatrix`-Zeilen unberührt bleiben. Es
  ist idempotent.

### MathJax-Konfiguration (`index.html`)

**Eine per `loader.load` geladene Extension ist nicht aktiv.** Ohne Eintrag in
`tex.packages` bleibt `tagformat` wirkungslos (Tags erscheinen als `(1)`) und
`\textcolor` rendert nicht:

```js
tex: { packages: {'[+]': ['tagformat', 'color']}, tags: 'ams', tagformat: {…} },
loader: { load: ['[tex]/tagformat', '[tex]/color'] }
```

Kommt ein **zweiter Abschnitt** ins WIP, muss `tagformat.number` das Präfix pro
Seite ermitteln statt der heutigen Konstante — sonst ist dort jede Formel falsch
nummeriert. (Offener Punkt in `BACKLOG.md`.)

## Schritt 6 — Querverweise

**Nie getippte Nummern.** Anker mit Schlüssel setzen, die Nummer trägt die
Laufzeit ein:

```html
<a class="xref" data-ref-fig="fig-<bildbasisname>"></a>
<a class="xref" data-ref-sec="p-1-4-5"></a>       <!-- pages.js::slugFor -->
<a class="xref" data-ref-eq="eq_kreisbahn_position"></a>
```

Jede Abbildung braucht dafür eine stabile `id` aus ihrem Bildnamen. Aufgelöst
wird in `numbering.js` (`resolveFigRefs`/`resolveSecRefs`/`resolve_eq_refs`);
Formelnummern kommen aus MathJax' `parseOptions.tags.allLabels`, weil MathJax
`\ref` nur als Text rendert. Seitenübergreifende Sprünge erledigt der zentrale
`a[href^="#"]`-Handler in `main.js`.

## Schritt 7 — Neue Box-Typen? Fünf Stellen anfassen

Fehlt eine, ist der Fehler **still** (Box ohne Rahmen, Icon rutscht in die
Navigationsleiste, Box fehlt in der Schiene):

1. `core.js::generate_highlight_boxes` — Icon + Titel
2. `numbering.js::BOX_LABELS` (+ `CHAPTER_SCOPED`, falls kapitelweit)
3. `styles.css` — Kartenoptik **und** 50-px-Freiraum links
4. `styles.css` — „kein Box-in-Box"-Regel für `mjx-container[display="true"]`
5. `shell.js::landmarksFor` — linke Schiene

## Schritt 8 — Prüfen

→ Skill **v013-verifikation**. Ohne diesen Schritt gilt die Migration als nicht
abgeschlossen.

## Schritt 9 — Abschluss

- Version im Header (`index.html`, `#header_version`) hochziehen.
- `CLAUDE.md` ergänzen, falls sich Architektur oder Konventionen geändert haben.
- Bewusste Abweichungen von v0.13 dokumentieren (Runbook, Abschnitt 13).
- Auf eigenem Branch arbeiten und **hochfrequent committen** — pro logischer
  Einheit einen Commit mit Begründung, nicht am Ende einen großen.
