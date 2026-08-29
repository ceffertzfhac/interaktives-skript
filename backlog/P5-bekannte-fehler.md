<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P5 — Bekannte Fehler (Interaktivitaet / Shell)

- [x] **Schiene „Auf dieser Seite" zeigt beim ERSTEN Laden nur den Box-Typ.** Nach dem Neuladen steht in der linken Schiene oft nur „Wichtig", „Beispiel" … ohne Titel; nach Hin-und-Herspringen dann korrekt „Beispiel: …". **Ursache:** `main.js::init()` ruft `init_shell()` (baut die Schiene, liest `.highlight_box_title`) **vor** `init_numbering()`, das die Box-Titel erst auf „Beispiel 1.4.1: Titel" setzt. **Fix-Richtung:** `init_shell()` nach `init_numbering()` aufrufen oder nach der Nummerierung einen Schienen-Refresh ausloesen. *(S)* — *Fix (quick-wins, 2026-07-23, Commit `d0c53d1`): `init_shell()` in `init()` hinter `init_numbering()`+`label_aspekt_figuren()` verschoben; `paginate()` bleibt vorher (Seitenregister). Zwischenschritte (figure panels/footnotes/aspekt) brauchen die Schiene nicht.*
- [ ] **Formeln im Fliesstext fehlen sporadisch, Formeln in Boxen sind da.**
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

---

