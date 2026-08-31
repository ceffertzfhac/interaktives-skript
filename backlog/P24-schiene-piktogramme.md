<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P24 — Schiene „Auf dieser Seite": Piktogramme statt langer Texte

Eingetragen 2026-08-31 nach Nutzervorgabe: *„in der spalte ‚auf dieser seite'
stehen jetzt sehr lange text, teils mit formelzeichen (welche nicht richtig
angezeigt werden). das ist unschön. ich hätte eher gerne eine integration
passender pictogramme für beispiel, aufgabe, figure, interaktive figure und so
weiter und dann maximal 2 zeilen text pro item. im gesamten dokument."*

### Ist-Stand (gemessen 2026-08-31, alle 137 Seiten durchgefahren)

| Messgröße | Wert |
|---|---|
| Seiten mit Schiene | 58 |
| Einträge gesamt | 135 |
| Einträge mit **rohem LaTeX** | 1 (Abb. 1.9, `data-title` mit `\(y(t)\)`) |
| Einträge **länger als 60 Zeichen** | 29 |
| längster Eintrag | **131 Zeichen** |
| meiste Einträge auf einer Seite | 12 (`p-1-1-7`) |

Längstes Beispiel: „Senkrechter Wurf: Weg-Zeit-Diagramm, die Achse zeigt nach
unten und hat ihren Nullpunkt auf der Höhe des Abwurfpunktes (interaktiv)".

**Woher die Länge kommt** (`shell.js::landmarksFor`):
- **Boxen** übernehmen den vollen `.highlight_box_title`, also Typ + Nummer +
  Titel („Beispiel 1.4.1: Rollbewegung eines Zylinders").
- **Figuren** übernehmen `data-title` des Platzhalters — und das ist bewusst
  ein ganzer beschreibender Satz, weil es zugleich als Tooltip dient.

**Warum das LaTeX roh dasteht:** die Schiene wird in `renderRailInto()` per
`textContent` gefüllt, MathJax fasst sie nicht an. Ein `\(y(t)\)` im
`data-title` erscheint deshalb wörtlich. Betrifft heute genau einen Eintrag,
wird aber bei jeder weiteren Figur mit Formelzeichen im Titel wieder auftreten.

### Ziel

- **Piktogramm je Typ** statt des ausgeschriebenen Typs: Lernziel, Beispiel,
  Aufgabe, Wichtig, Zusammenfassung, Abbildung, interaktive Figur.
- **Höchstens zwei Zeilen Text** je Eintrag (CSS-Klemme, nicht nur kürzen —
  künftige Titel sollen nicht wieder ausbrechen).
- Gilt **im ganzen Dokument**, nicht nur in Kapitel 1.1.

### Offene Entscheidungen (vor der Umsetzung klären)

- [x] **P24-0 Was steht neben dem Piktogramm?** Drei Varianten:
  *(a)* nur die Nummer („1.4.1"), *(b)* Nummer + boxeigener Titel
  („1.4.1 Rollbewegung"), *(c)* nur der Titel. Für Figuren analog
  („Abb. 1.9" bzw. „Abb. 1.9 Schräger Wurf").
- [x] **P24-1 Zwei fehlende Piktogramme.** `src/assets/` hat `target`, `pen`,
  `noteblock`, `star`, `eye`, `head`, `bulb`, `anlage`, `reading` — die
  Box-Typen sind damit abgedeckt (die Zuordnung steht in
  `core.js::generate_highlight_boxes`). Für **Abbildung** und **interaktive
  Figur** fehlen zwei; als Datei oder inline wie das Lupen-Icon?

### Umsetzung (nach den Entscheidungen)

- [x] **P24-2** `shell.js::landmarksFor` liefert statt eines Labels ein
  `{typ, nummer, titel}`; `renderRailInto` rendert Piktogramm + Text. Die
  Typ→Icon-Zuordnung gehört an **eine** Stelle — `core.js` hat sie für die
  Boxen schon, sie ist dort zu holen statt neu aufzuschreiben (P18-Regel).
- [x] **P24-3** Zweizeilen-Klemme in `styles.css`
  (`-webkit-line-clamp: 2`), plus `title`-Attribut mit dem vollen Text, damit
  beim Überfahren nichts verlorengeht.
- [x] **P24-4** Formelzeichen: entweder im `data-title` vermeiden (Regel wie
  bei den Bildunterschriften) **oder** die Schiene die Formel setzen lassen.
  Ersteres ist billiger und passt zur Zeile „höchstens zwei Zeilen".
- [x] **P24-5** Gegenmessung: erneut über alle 137 Seiten, danach 0 Einträge
  mit rohem LaTeX und 0 über zwei Zeilen. Das Messskript steht in dieser
  Sitzung im Scratchpad und ist in den Skill zu übernehmen, wenn es bleibt.

### Umsetzung (2026-08-31, v1.44.0–v1.44.2)

Entschieden mit dem Nutzer: **Nummer + Kurztitel** neben dem Piktogramm (die
Nummer bleibt, sonst geht der Bezug zum Fließtext und zu Querverweisen
verloren), Piktogramme für Abbildung und interaktive Figur **inline im Code**
(färben sich über `currentColor` mit Darkmode und Palette, keine zweite
Zuordnungsstelle). Zwei Nachträge auf Zuruf: gleichnamige Einträge bekommen
**(a), (b), …**, und **statische Abbildungen** kommen mit hinein — aber nur
eigenständige, nicht die innerhalb einer Box.

| Messgröße (alle Seiten) | vorher | nachher |
|---|---|---|
| Seiten mit Schiene | 58 | 74 |
| Einträge | 135 | 182 |
| mit rohem LaTeX | 1 | **0** |
| über zwei Zeilen | 29 (>60 Zeichen) | **0** |
| ohne Piktogramm | 135 | **0** |
| längster Eintrag | 131 Zeichen | 101 |

Drei Entscheidungen, die im Code begründet stehen, weil sie beim ersten Anlauf
falsch waren:
- **(a)/(b) je Seite und je TYP**, nicht dokumentweit und nicht nur nach Titel:
  eine Beispiel-Box und die zugehörige Figur tragen oft denselben Kurztitel,
  sind aber keine Reihe.
- **`.nur-druck`-Abbildungen bleiben draußen** — am Bildschirm unsichtbar, ein
  Eintrag dorthin führte ins Leere.
- **Kurztitel mit harter Grenze** (90 Zeichen, Wortgrenze): die
  Zwei-Zeilen-Klemme ist eine *Anzeige*-Regel; ohne sie (älterer Browser,
  Druck, Vorlese-Werkzeug) stünde der ganze Absatz da.

Gemessen und nicht angesehen (Nutzer: „freigabe zur messung"): alle 12
Piktogramme auf `p-1-1-7` sind vorhanden und 16×16, keine Überlappung mit dem
Text, kein Überstand aus dem Rahmen, im Dunkelmodus wechseln die Inline-Symbole
die Farbe mit und die Datei-Icons bekommen den Aufhell-Filter. **Die optische
Wirkung der Symbole selbst ist damit nicht beurteilt.**

### Zusammenhang mit anderen Items

- Die Schiene ist Teil der App-Shell (P8/P9/P10); die Klassenliste der Boxen
  ist eine der **fünf** Stellen, die synchron zu halten sind (s.
  `src/CLAUDE.md`, „Box-Klassenlisten synchron halten") — `landmarksFor` ist
  eine davon.
- Berührt **P13** (Marker/Notizbuch) nicht.

---
