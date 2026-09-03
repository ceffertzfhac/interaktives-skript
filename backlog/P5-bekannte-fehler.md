<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P5 — Bekannte Fehler (Interaktivitaet / Shell)

- [x] **Schiene „Auf dieser Seite" zeigt beim ERSTEN Laden nur den Box-Typ.** Nach dem Neuladen steht in der linken Schiene oft nur „Wichtig", „Beispiel" … ohne Titel; nach Hin-und-Herspringen dann korrekt „Beispiel: …". **Ursache:** `main.js::init()` ruft `init_shell()` (baut die Schiene, liest `.highlight_box_title`) **vor** `init_numbering()`, das die Box-Titel erst auf „Beispiel 1.4.1: Titel" setzt. **Fix-Richtung:** `init_shell()` nach `init_numbering()` aufrufen oder nach der Nummerierung einen Schienen-Refresh ausloesen. *(S)* — *Fix (quick-wins, 2026-07-23, Commit `d0c53d1`): `init_shell()` in `init()` hinter `init_numbering()`+`label_aspekt_figuren()` verschoben; `paginate()` bleibt vorher (Seitenregister). Zwischenschritte (figure panels/footnotes/aspekt) brauchen die Schiene nicht.*
- [ ] **Formeln im Fliesstext fehlen sporadisch, Formeln in Boxen sind da.**
  **Ursache mit hoher Wahrscheinlichkeit beseitigt (2026-08-31, v1.38.3/1.39.0)
  — Beobachtung läuft weiter, s. „Was jetzt anders ist" am Ende.**
  Beobachtet 2026-08-28 vom Nutzer (VS-Code-Live-Server, Port 5500,
  `#p-1-1-7`): im Fliesstext keine Formeln, in den Boxen schon. Beim naechsten
  Laden **von selbst wieder korrekt** — also sporadisch, nicht reproduziert.

  **Statisch ausgeschlossen** (geprueft 2026-08-28): LaTeX-Umgebungen in allen
  Fragmenten balanciert (Kap. 1.1: 180× `\begin` / 180× `\end`, pro Typ
  gleich), Inline-Delimiter `\(`/`\)` in allen Kapiteln balanciert, kein CSS
  blendet `mjx-container` aus, Init-Reihenfolge korrekt
  (`typesetAfterLoad()` laeuft zuletzt und setzt per `typesetPromise()` das
  ganze Dokument, nicht einzelne Bereiche).

  **Verdacht:** Wettlauf zwischen dem `async` vom CDN geladenen MathJax und den
  zur Laufzeit per `fetch` injizierten Kapiteln. Kandidat ist
  `core.js::typeset_alles()`: es setzt erst `document.state(0)` (macht **alle**
  gerenderte Mathematik wieder zu Quelltext) und rendert dann per
  `typesetPromise()` neu. Wird dieser Lauf unterbrochen oder ueberholt
  (zweiter, ueberlappender Aufruf), bleibt Mathematik als Quelltext stehen —
  waehrend `main.js::fill_physik_panels()` seine Boxen *separat* mit
  `typesetPromise(jobs)` setzt und darum trotzdem gerendert aussieht. Das
  erklaert genau die beobachtete Aufteilung Boxen-ja/Prosa-nein.

  **Nicht als „nur beim Arbeiten" abhaken:** solche Rennen entscheidet die
  Netzwerklatenz, und die schwankt in der Produktivversion (GitHub Pages +
  jsdelivr) staerker als auf localhost. Live Server ist hier nicht der
  ausschlaggebende Unterschied.

  **Neuer Beleg (2026-08-28, headless Chromium):** beim Bauen von P16-3/P16-4
  trat in etwa jedem fuenften Seitenaufruf genau EIN Konsolenfehler auf —
  `TypeError: Cannot read properties of null (reading 'replaceChild')`, ohne
  Bezug zu einer Aspekt-Figur (er tritt auch ohne Interaktion auf, und die
  Figuren bauen sich vollstaendig). `replaceChild` steht in keinem Projekt-
  Modul (`grep` ueber `src/`), kommt also aus MathJax selbst: es ersetzt beim
  Typesetten den Quelltext-Knoten durch den gerenderten — laeuft dabei ein
  zweiter, ueberlappender Durchgang, ist der Elternknoten schon weg. Das ist
  genau der oben vermutete Wettlauf, jetzt mit Fehlermeldung. Reproduktion:
  Seite mehrfach mit `waitUntil:'networkidle'` laden und `page.on('pageerror')`
  mitschreiben.

  **Beim naechsten Auftreten in der Konsole ausfuehren** (trennt die
  Hypothesen in einem Schritt — gerendert vs. Quelltext vs. MathJax-Zustand):
  ```js
  console.log('mjx:', document.querySelectorAll('mjx-container').length,
              'roh:', (document.body.innerHTML.match(/\\begin\{equation\}/g)||[]).length,
              'state:', window.MathJax?.startup?.document?.state?.(),
              'MathJax:', !!window.MathJax);
  ```
  `mjx: 0` + `roh: >0` = nicht getypesetzt (Rennen bestaetigt); `mjx: >0` =
  gerendert, aber unsichtbar (dann CSS/Layout). *(M — erst mit Messwert)*

  **Was jetzt anders ist (2026-08-31, aus BACKLOG P22-3):** beim Messen der
  Ladezeit fiel auf, dass MathJax beim Start **von sich aus** das gesamte
  Dokument setzte — die Konfiguration in `index.html` hatte kein
  `startup: { typeset: false }`. Dieser Auto-Lauf ist genau der zweite,
  überlappende Durchgang, den die Analyse oben vermutet hatte: er startet,
  während `chapters.js::typesetAfterLoad()` seinen eigenen Lauf mit
  `document.state(0)` führt, und beide greifen auf dieselben Knoten zu — daher
  der MathJax-interne `replaceChild`-Fehler. Der Auto-Lauf ist mit v1.38.3
  abgeschaltet (P22-3a), und mit v1.39.0 entfällt zusätzlich der zweite
  Durchgang der Nummerierung (P22-3b); beim Start läuft jetzt **genau ein**
  Typeset. In den Messläufen danach: kein Konsolenfehler, 4925 von 4925
  Formeln gesetzt, keine rohe LaTeX-Quelle mehr im gerenderten DOM (die drei
  verbliebenen `\begin{equation}` stehen in HTML-Kommentaren).

  **Warum trotzdem nicht abgehakt:** der Fehler war sporadisch (rund jeder
  fünfte Aufruf), ein fehlerfreier Messlauf beweist also wenig. Abhaken erst,
  wenn er über längere Zeit an der veröffentlichten Fassung nicht mehr
  auftritt — der Messbefehl oben bleibt dafuer stehen. Sollte er wieder
  auftreten, ist die nächste Verdächtige `main.js::fill_physik_panels()`:
  sie setzt ihre Boxen weiterhin mit einem **eigenen** `typesetPromise(jobs)`,
  allerdings erst in der `.then()`-Kette hinter `reload_mathjax` — also
  nachgelagert, nicht überlappend.

- [x] **Sprungmarken landen nicht am Ziel.** Gemeldet vom Nutzer 2026-08-31:
  *„1.2.5 Kraeftezerlegung 2 springt zu tief"* und *„auch spruenge ueber
  marken im text funktionieren nicht zuverlaessig … siehe Abbildung 1.5 bis
  Abbildung 1.7"*. **Drei getrennte Ursachen**, alle gemessen:
  1. `main.js` zentrierte das Ziel (`scrollIntoView({block:'center'})`) und zog
     danach blind 70 px ab. Ein Ziel, das hoeher ist als das Fenster, verliert
     beim Zentrieren seinen ANFANG nach oben — Oberkante von „Kraeftezerlegung
     2" 262 px **oberhalb** der Kopfleiste, waehrend 1.2.4 auf derselben Seite
     134 px darunter lag.
  2. Verweise auf `.nur-druck`-Abbildungen (der Druck-Fallback einer
     interaktiven Figur) zielten auf ein `display:none`-Element; dessen
     `getBoundingClientRect()` ist ein Null-Rechteck, der Sprung landete am
     Seitenanfang. Betraf die Abbildungen 1.5–1.7.
  3. Die Kapitelbilder tragen `loading="lazy"` (P22-1) und sind im Moment des
     Sprungs 0 px hoch. Wachsen sie OBERHALB des Ziels nach, rutscht das Ziel
     weg — bei Abb. 1.12 um 1547 px, der Sprung landete 375 px zu tief.
  *Fix (2026-09-01, v1.44.3, Commit `8fb5c01`):* `ui.js::scrollToAnchor` setzt
  die Oberkante mit der **tatsaechlichen** Kopfhoehe dicht unter die Leiste
  (`ANKER_LUFT = 12`) und **fasst nach**, solange die Bilder das Layout noch
  verschieben — getrieben von deren `load`-Ereignis (Erfassungsphase, Fenster
  2,5 s), nicht von einem festen Zeitpunkt. Abgebrochen wird an den
  **Eingabe**-Ereignissen (`wheel`/`touchstart`/`keydown`/`mousedown`), nicht
  an einer veraenderten Scroll-Position: das Nachwachsen verschiebt die
  Position selbst (Chrome verankert den Scroll), was der erste Anlauf als
  „Nutzer scrollt" missdeutete und deshalb zu frueh aufgab. `main.js` lenkt
  Verweise auf unsichtbare Abbildungen ueber `data-figref` auf die interaktive
  Figur um, die sie ersetzt. *Gegenmessung (`sprung_ziele.mjs`, Stufe 4c im
  Verifikations-Skill, alle 137 Seiten): 364 Schienen-Spruenge + 50
  Querverweise, **0** danebengegangen (Ziel 0–40 px unter der Kopfleiste),
  18 Verweise auf versteckte Abbildungen korrekt umgelenkt, 0
  Konsolenfehler. Dieselbe Messung auf dem Stand davor (33a9083): −232 px
  bei „1.2.5 Kraeftezerlegung 2", +911 px bei Abb. 1.12.*
  *Nachgemessen 2026-09-03 auf v1.48.0 (Design-Angleichung): **425** Spruenge
  statt 414, **0** danebengegangen. Die Zahl ist gestiegen, weil
  `.rechenbeispiel` als eigener Kastentyp 28 zusaetzliche Schienen-Eintraege
  erzeugt (im DOM doppelt, s. u.). Die Zahlen oben bleiben als Protokoll der
  Messung vom 2026-09-01 stehen — wer heute nachmisst, bekommt 425.*
- [x] **Schienen-Eintrag ist nur ein Wortfragment.** Der Kurztitel (P24)
  trennte an der oeffnenden Klammer — in deutscher Prosa steht die mitten im
  Satz, und Inline-Mathematik ist im Quelltext selbst eine Klammer. Aus
  „Die \(x\)-Komponente …" wurde der Eintrag „Die". *Fix (2026-09-01,
  v1.44.4, Commit `e58e358`):* Inline-Mathematik wird vor dem Trennen entpackt,
  getrennt wird an Doppelpunkt/Semikolon/Komma/Satzende, ein Bruchstueck unter
  12 Zeichen wird verworfen, harte Grenze 60 statt 90 Zeichen. *Gegenmessung:
  182 Eintraege auf 74 Seiten (im DOM 364 — die Schiene wird zweimal
  gerendert, Desktop-Spalte und Tablet-Schublade), 0 mit rohem LaTeX, 0 ueber zwei Zeilen, 0 ohne
  Piktogramm; laengster Eintrag 84 statt 101 Zeichen.*
- [x] **Formeln wirken groesser als der Fliesstext.** Gemeldet vom Nutzer
  2026-09-01 (*„formeln und zahlen, die in der formelumgebung stehen[,] sind
  scheinbar groesser als fliesstextbuchstaben und zahlen"*, Modus normal,
  Stufe 2/5). **Nachgemessen und bestaetigt** (16 px Fliesstext, Median ueber
  alle Glyphen von p-1-4-2): Ziffer „1" 11,46 px in der Formel gegen 10,50 px
  im Text (+9 %), Versalhoehe +12 %, x-Hoehe +4 %. **Ursache:** MathJax
  bemisst sein SVG in `ex` und trifft damit die x-Hoehe der Fliesstextschrift
  *genau* — aber die TeX-Schrift baut ueber der x-Hoehe hoeher als Source
  Serif 4. *Fix (2026-09-01, v1.44.5, Commit `a4f4b29`):* `svg: { scale: 0.92 }`
  in der MathJax-Konfiguration, gewaehlt so, dass die **Ziffern** zur Deckung
  kommen (aufrecht in beiden Welten, darum der auffaelligste Vergleich).
  Danach: Ziffer +0,4 %, Versal +3 %, x-Hoehe −0,5 %. `formel_ueberstand.mjs`
  ueber alle 137 Seiten in allen drei Breiten-Modi: 0 Uebersteher.


---
