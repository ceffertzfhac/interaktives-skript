<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## Zielarchitektur (skalierbar auf 15+ Kapitel)

Statt einer Datei pro Anliegen und Kopie pro Figur:

```
InteraktivesSkript_WIP/
  index.html                # nur Shell: Header, TOC-Container, <div data-chapter="...">-Platzhalter
  chapters/
    ch_01_einleitung.html   # Prosa pro Kapitel als Fragment (~1 Datei/Kapitel, editierbar in einem Context)
    ch_02_kinematik.html
    ...
    (jeweils mit <figure data-fig="...">-Platzhaltern für interaktive Abbildungen)
  src/
    core.js                 # init, Kapitel-Loader, UI (TOC/zoom/print/darkmode), rAF-Loop
    transform.js            # to2d/perspektive, polyline/line-helpers (einzigartig, nicht pro Figur)
    figures/
      factory.js            # createFigure({id, compute, animate}) — rAF, point-cache, element-ref-cache
      fig_01_radius.js      # pro Figur: kleine compute/animate-Lambdas
      fig_03_kreisbahn.js
      ...
    styles.css / darkmode.css
  build/ (optional)         # ggf. einfacher Build, der chapters/* → index.html zusammenfügt (für Print/Offline)
```

Eigenschaften, die das Ziel erfüllen:
- **Neue Figur = eine kleine Datei** (`figures/fig_NN_*.js`) mit nur der Figur-spezifischen Mathematik — alles GemeinSame (rAF-Loop, Punkte-Cache, Element-Ref-Caching, Perspektive, Show/Hide-Logik) steckt einmalig in `factory.js`.
- **Neues Kapitel = eine `chapters/ch_NN.html`-Datei**, ohne bestehenden Code anzufassen; `core.js` lädt Fragmente nach (oder ein Build fügt sie zusammen).
- **Prosa nicht in einer Riesendatei** — ~400 Seiten in einer `index.html` wären nicht editierbar; pro Kapitel ≈ ein Context-Fenster.
- **Event-Binding zentral** (`data-fig`-Attribute → eine `addEventListener`-Stelle in `core.js`), keine 65 Inline-Handler.
- **Pro Figur eigener Scope** — keine geteilten Globals (`svg`, `pl`, `phi`, …), die sich gegenseitig überschreiben.
- Agenten-Edits laden nur `factory.js` + die eine betroffene `fig_NN.js` bzw. `ch_NN.html`, nicht die ganze Welt.

Diese Zielarchitektur leitet die P1-Items; P0 ist unabhängig davon vorher machbar.

---

