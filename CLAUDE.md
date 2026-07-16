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

Inside either site folder the structure is the same (legacy still matches this; **WIP has been modularized** — see Architecture):
  - `index.html` — the whole document: prose sections, inline SVG figures, slider controls, MathJax `$$…$$` / `\[…\]` / `\(…\)` formulas
  - `src/script.js` *(legacy only)* — the entire app logic in one file. **In WIP this is split into ESM modules** (`src/main.js` entry + `core/transform/ui/print.js` + `src/figures/*.js`); `script.js` no longer exists in WIP.
  - `src/styles.css`, `src/darkmode.css` — styles; `darkmode.css` is loaded but `disabled` and toggled at runtime
  - `bilder/` — static figure PNGs/SVGs used in static mode and prose
  - `src/assets/` — SVG/PNG icons injected into highlight boxes
  - `Archiv/` — an older snapshot of the same site nested inside (reference only, not linked/active)

`__MACOSX/`, `*.DS_Store`, `Archiv.zip` — macOS zip metadata/junk; ignored, do not edit.

## Architecture (WIP — ESM modules + figure factory)

### Module layout
WIP ships as native ESM (no build step, no bundler). `index.html` loads `<script type="module" src="src/main.js">`; modules are deferred, so `main.js` calls `init()` at the end of the module (no `<body onload>`). qrjs2 and MathJax stay classic CDN `<script>` tags → global `window.QRCode` / `window.MathJax`.

```
src/main.js        entry: init(), central data-action binder, afterprint/hashchange listeners
src/core.js        state (interaktiv, darkmode_on, linspace, speed_factor), ge/show/hide,
                   generate_highlight_boxes, safari_bug, degree_to_fraction, make_static,
                   test, reload_mathjax, toggle_darkmode, reset, update_all (no figure imports)
src/transform.js   to2d, transform_line, transform_polyline, ga  (imports ge from core)
src/ui.js          toc, generate_toc, kontakt, offsetAnchor, toggle_body_scroll, zoom, close_zoom, pause
src/print.js       init_print, check_print, print_page, create_qr, from_qr, findGetParameter
src/figures/factory.js   createFigure() + shared omega-circle hooks (circleStep/Wrap/Render, omega*)
src/figures/fig_NN.js     one file per figure; self-registers updateN/animateN/clearN on window
```

Dependency graph is acyclic: `core` ← `transform` ← `factory`; `core` ← `ui`; `core`,`ui` ← `print`; everything ← `main`. `update_all` (core) dispatches via `window.updateN` instead of importing figure modules, which is what keeps the graph cycle-free — figure modules are side-effect-imported by `main.js` so their `window` registration runs before `init()`.

### Central event binding (data-action)
There are **no inline `oninput`/`onclick` handlers**. `index.html` marks elements with `data-action` (+ `data-fig`, optional `data-arg`, `data-event="change"` for `<select>`/radio). `main.js` attaches one delegated listener each for `click`/`input`/`change` and dispatches to the function or to `fig_call(prefix, fig, arg)` → `window[prefix+fig]`. `make_static()` injects `data-action="zoom"` so the delegated binder covers static-mode zoom buttons too.

### Interactive figures (the factory pattern)
Each interactive figure is a numbered container `<div id="gcN" class="grafik-container">` (N ∈ {1,3,31,32,4,5,51,6,8,9}) holding an inline `<svg id="svgN">` plus range sliders `id="rangeN_*"`. The 7 animated 3D-circle figures (3/31/32/5/51/6/8) are built via `createFigure({id, render, step, wrap, condition, snap, clear?})` in `figures/factory.js`, which owns all shared boilerplate: a `requestAnimationFrame` loop with a ~10 ms accumulator (replacing recursive `setTimeout(...,10)`), a reentry guard, slider snap, φ-wrap + revolution counter (`state.n`), a **cached** static circle `p3d` (rebuilt only when radius/z change, not per frame), the koord transform + foreignObject copies, and the φ-span block. Each `fig_NN.js` supplies only the figure-specific hooks. The 2D arcs (gc1/gc9) and the radio image-swap (gc4) are small standalone modules. The factory exposes `updateN`/`animateN`/`clearN` on `window` (the binder + `update_all` consume those names — the `N` suffix remains the HTML↔JS contract).

A deliberately-preserved legacy bug: `fig_5.js`'s gc51 `>6.27` wrap increments **gc5's** revolution counter (`fig5.state.n++`) instead of gc51's — kept for behavior parity, flagged in the code.

### Static vs. interactive mode
`interaktiv` (exported `let` in `core.js`) switches the whole document between interactive SVG figures and static images. When false, `make_static()` overwrites each `gcN` container's `innerHTML` with a `<img class="grafik">` from `bilder/` (plus a zoom button) and re-typesets MathJax. Two easter-egg toggles are hidden in the *Kontakt* box: clicking the disguised letters "Fa**ll**" calls `test()` (flips `interaktiv` and re-runs `make_static()` — the only runtime way to enter static mode without a code change), and "**tt**" in "bitte" calls `reload_mathjax()` to re-render all formulas.

### 3D → 2D projection
`to2d(d3, perspective)` projects a 3D point `[x,y,z]` to 2D screen coords; `perspective` ∈ {1,2,3,4} selects the view, driven by the per-figure `selectN` dropdown (read in each render). `transform_line` / `transform_polyline` apply it to SVG elements. Not all figures use 3D; gc1/gc9 are pure 2D polar plots.

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