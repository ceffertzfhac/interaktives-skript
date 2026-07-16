# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page interactive physics script (German, topic: rotational motion / *Drehbewegungen auf Kreisbahnen*) for an FH Aachen course. There is **no build system, package manager, bundler, or test suite** — it is plain HTML/CSS/vanilla JS served as static files. All interactivity is hand-written DOM/SVG manipulation; the only external libraries are loaded from CDNs in `index.html` (MathJax v3 `tex-svg` for LaTeX rendering, `qrjs2` for print QR codes).

> **Scalability is a hard constraint.** The final script will be a *complete* script with **15+ chapters and many more figures** (current WIP: ~9 sections, 11 figures, one 2787-line `script.js`). The current monolithic, copy-paste-per-figure architecture does not scale there. When proposing changes, optimize for "adding a chapter/figure is O(1) files and small token cost," not O(size-of-whole-file). The modernization plan toward that target lives in `BACKLOG.md` (with a target architecture sketch). When working in the WIP, also weigh **token efficiency of edits** — prefer edits that touch one small module over ones that require loading the whole `script.js`.

## Running it

Serve the `InteraktivesSkript_WIP/` directory with any static server and open `index.html`. MathJax and qrjs2 load from CDN, so a network connection is needed; a local server avoids `file://` quirks with relative paths:

```
cd InteraktivesSkript_WIP
python3 -m http.server 8000
# open http://localhost:8000/
```

There is nothing to build, lint, or test. To verify a change, reload the page and exercise the affected slider/figure.

## Repository layout

The repo holds **two parallel copies of the site**:

- `InteraktivesSkript_WIP/` — **the working copy. All edits go here.** This is the only folder you should modify.
- `InteraktivesSkript_legacy/` — a **frozen baseline** snapshot of the site as of the split. Do not edit; it exists for reference/diffing against WIP. Both folders started byte-identical.

Inside either site folder the structure is the same:
  - `index.html` — the whole document: prose sections, inline SVG figures, slider controls, MathJax `$$…$$` / `\[…\]` / `\(…\)` formulas
  - `src/script.js` — ~2800 lines of vanilla JS, the entire app logic
  - `src/styles.css`, `src/darkmode.css` — styles; `darkmode.css` is loaded but `disabled` and toggled at runtime
  - `bilder/` — static figure PNGs/SVGs used in static mode and prose
  - `src/assets/` — SVG/PNG icons injected into highlight boxes
  - `Archiv/` — an older snapshot of the same site nested inside (reference only, not linked/active)

`__MACOSX/`, `*.DS_Store`, `Archiv.zip` — macOS zip metadata/junk; ignored, do not edit.

## Architecture

### Global-function, inline-handler model
`script.js` uses no modules and no build step. Functions are global and wired to the DOM via inline `oninput="updateN();"` / `onclick="..."` attributes in `index.html`. `ge(id)` is a `getElementById` shortcut used everywhere; `ga(id, attr)` reads an SVG attribute. `init()` runs on `<body onload>` and orchestrates startup: `generate_highlight_boxes()` → `safari_bug()` → `space()` → `generate_toc()` → `offsetAnchor()` → `make_static()` → `update_all()` → `from_qr()` → `check_print()`.

### Interactive figures (the core pattern)
Each interactive figure is a numbered container `<div id="gcN" class="grafik-container">` in `index.html` (N ∈ {1,3,31,32,4,5,51,6,7,8,9}). Inside is an inline `<svg id="svgN">` plus range sliders `id="rangeN_*"`. A figure is driven by a *family* of functions in `script.js` that share the `N` suffix:

- `updateN()` — recomputes SVG geometry from the slider values, manipulates `polyline.points` via `svg.createSVGPoint()`, and writes values back into `rangeN_*_span` elements. Called on every slider `oninput` and once at startup by `update_all()`.
- `conditionN()` — boolean: should the animation loop keep running? (typically checks the angular-velocity slider is non-zero and the Pause button says "Pause").
- `animateN()` / `do_animationN()` — the animation: `do_animationN` advances the phi slider, calls `updateN()`, and re-schedules itself with `setTimeout(..., 10)` while `conditionN()` holds. A per-figure flag (e.g. `animate3_runs`) guards re-entry.

When adding/modifying a figure, keep the `gcN` / `svgN` / `rangeN_*` / `updateN` / `animateN` / `conditionN` naming consistent — the numbering is the contract between HTML and JS.

### Static vs. interactive mode
`var interaktiv = true` (top of `script.js`) switches the whole document between interactive SVG figures and static images. When `interaktiv` is false, `make_static()` overwrites each `gcN` container's `innerHTML` with a `<img class="grafik">` from `bilder/` (plus a zoom button) and re-typesets MathJax. There are two easter-egg toggles hidden in the *Kontakt* box: clicking the disguised letters "Fa**ll**" calls `test()` (flips `interaktiv` and re-runs `make_static()` — the only runtime way to enter static mode without a code change), and "**tt**" in "bitte" calls `reload_mathjax()` to re-render all formulas.

### 3D → 2D projection
`to2d(d3, perspective)` projects a 3D point `[x,y,z]` to 2D screen coords; `perspective` ∈ {1,2,3,4} selects the view, driven by `changeView()` / a `select1` dropdown. `transform_line` / `transform_polyline` apply it to SVG elements. Not all figures use 3D; many are pure 2D polar plots.

### Highlight boxes, TOC, print, QR, zoom, darkmode
- `generate_highlight_boxes()` finds every element with one of the classes `lernziel`, `motivation`, `wiederholung`, `beispiel`, `zusammenfassung`, `aufgabe`, `anmerkung` and injects an icon (`src/assets/*.svg`) plus a capitalized title before its original content. To add a new box type, add a `[class, icon]` entry to the `boxes` array.
- TOC is generated at runtime by `generate_toc()` from every element carrying class `inhaltsverzeichnis` (the `<h2>`/`<h3>` section headings).
- Print flow: `init_print()` (toolbar "Drucken") opens the current URL with `?print=true` in a new tab; `check_print()` detects the param and calls `print_page()`, which clones `#container` into `#print_container`, strips zoom buttons, and generates a QR code (via qrjs2) per `gcN` linking back to `?g=gcN`. `from_qr()` handles the reverse: arriving via a QR link deep-zooms the target figure.
- `zoom(parent_gc)` clones a figure into the `#zoom` overlay and scales it to fit the viewport; `close_zoom()` tears down and re-runs `update_all()`.
- Darkmode is toggled by `toggle_darkmode()` enabling/disabling the `darkmode.css` `<link>` (id `darkmode_stylesheet`).

## Conventions and gotchas

- **MathJax note**: `reload_mathjax()` uses the MathJax **v3** API (`MathJax.typesetPromise()`, guarded for when MathJax isn't loaded yet). It re-renders all formulas and is wired to the "tt" easter egg in the Kontakt box and to `make_static()`. (Earlier this called the v2 `MathJax.Hub.Queue(...)` API, which was a no-op under v3 — fixed.)
- Content and code comments are in German; match the surrounding language when editing prose or comments.
- Only edit `InteraktivesSkript_WIP/`. `InteraktivesSkript_legacy/` is a frozen baseline — never modify it. Within WIP, `Archiv/` is a historical copy and should likewise be left alone.