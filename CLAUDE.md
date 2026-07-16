# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page interactive physics script (German, topic: rotational motion / *Drehbewegungen auf Kreisbahnen*) for an FH Aachen course. There is **no build system, package manager, bundler, or test suite** — it is plain HTML/CSS/vanilla JS served as static files. All interactivity is hand-written DOM/SVG manipulation; the only external libraries are loaded from CDNs in `index.html` (MathJax v3 `tex-svg` for LaTeX rendering, `qrjs2` for print QR codes).

## Running it

Serve the `InteraktivesSkript/` directory with any static server and open `index.html`. MathJax and qrjs2 load from CDN, so a network connection is needed; a local server avoids `file://` quirks with relative paths:

```
cd InteraktivesSkript
python3 -m http.server 8000
# open http://localhost:8000/
```

There is nothing to build, lint, or test. To verify a change, reload the page and exercise the affected slider/figure.

## Repository layout

- `InteraktivesSkript/` — the actual site (everything below lives here)
  - `index.html` — the whole document: prose sections, inline SVG figures, slider controls, MathJax `$$…$$` / `\[…\]` / `\(…\)` formulas
  - `src/script.js` — ~2800 lines of vanilla JS, the entire app logic
  - `src/styles.css`, `src/darkmode.css` — styles; `darkmode.css` is loaded but `disabled` and toggled at runtime
  - `bilder/` — static figure PNGs/SVGs used in static mode and prose
  - `src/assets/` — SVG/PNG icons injected into highlight boxes
- `Archiv/` — an older snapshot of the same site (reference only, not linked/active)
- `__MACOSX/`, `*.DS_Store`, `Archiv.zip` — macOS zip metadata/junk; ignore, do not edit

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
`var interaktiv = true` (top of `script.js`) switches the whole document between interactive SVG figures and static images. When `interaktiv` is false, `make_static()` overwrites each `gcN` container's `innerHTML` with a `<img class="grafik">` from `bilder/` (plus a zoom button) and re-typesets MathJax. There is an easter-egg toggle: clicking the disguised letters in the *Kontakt* box ("Fa**ll**…**tt**") calls `test()`, which flips `interaktiv` and re-runs `make_static()`.

### 3D → 2D projection
`to2d(d3, perspective)` projects a 3D point `[x,y,z]` to 2D screen coords; `perspective` ∈ {1,2,3,4} selects the view, driven by `changeView()` / a `select1` dropdown. `transform_line` / `transform_polyline` apply it to SVG elements. Not all figures use 3D; many are pure 2D polar plots.

### Highlight boxes, TOC, print, QR, zoom, darkmode
- `generate_highlight_boxes()` finds every element with one of the classes `lernziel`, `motivation`, `wiederholung`, `beispiel`, `zusammenfassung`, `aufgabe`, `anmerkung` and injects an icon (`src/assets/*.svg`) plus a capitalized title before its original content. To add a new box type, add a `[class, icon]` entry to the `boxes` array.
- TOC is generated at runtime by `generate_toc()` from every element carrying class `inhaltsverzeichnis` (the `<h2>`/`<h3>` section headings).
- Print flow: `init_print()` (toolbar "Drucken") opens the current URL with `?print=true` in a new tab; `check_print()` detects the param and calls `print_page()`, which clones `#container` into `#print_container`, strips zoom buttons, and generates a QR code (via qrjs2) per `gcN` linking back to `?g=gcN`. `from_qr()` handles the reverse: arriving via a QR link deep-zooms the target figure.
- `zoom(parent_gc)` clones a figure into the `#zoom` overlay and scales it to fit the viewport; `close_zoom()` tears down and re-runs `update_all()`.
- Darkmode is toggled by `toggle_darkmode()` enabling/disabling the `darkmode.css` `<link>` (id `darkmode_stylesheet`).

## Conventions and gotchas

- **MathJax note**: `reload_mathjax()` calls `MathJax.Hub.Queue(...)`, which is the *v2* API — the page actually loads MathJax **v3**, so this call is effectively a no-op/stale. If typeset-refresh behavior matters for your change, verify it actually re-renders rather than assuming the call works.
- The file has many commented-out blocks and a couple of duplicate definitions (e.g. `animate6` is defined twice; the second wins). Be careful editing around these.
- Content and code comments are in German; match the surrounding language when editing prose or comments.
- `Archiv/` is a historical copy — do not propagate changes into it; treat `InteraktivesSkript/` as the sole source of truth.