# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page interactive physics script (German, topic: rotational motion / *Drehbewegungen auf Kreisbahnen*) for an FH Aachen course. There is **no build system, package manager, bundler, or test suite** — it is plain HTML/CSS/vanilla JS served as static files. All interactivity is hand-written DOM/SVG manipulation; the only external libraries are loaded from CDNs in `index.html` (MathJax v3 `tex-svg` for LaTeX rendering, `qrjs2` for print QR codes).

> **Scalability is a hard constraint.** The final script will be a *complete* script with **15+ chapters and many more figures** (current WIP: ~9 sections across 2 chapter skeletons (ch_01 fully migrated, ch_02 scaffold) + 11 figures, modularized ESM — the content target lives in `Input/v0.13/`). The original monolithic, copy-paste-per-figure architecture (preserved in `Input/InteraktivesSkript_legacy/`) does not scale there. When proposing changes, optimize for "adding a chapter/figure is O(1) files and small token cost," not O(size-of-whole-file). The modernization plan toward that target lives in `BACKLOG.md` (with a target architecture sketch). When working in the WIP, also weigh **token efficiency of edits** — prefer edits that touch one small module over ones that require loading a whole large file.

## Running it

Serve the `InteraktivesSkript_WIP/` directory with any static server and open `index.html`. MathJax and qrjs2 load from CDN, so a network connection is needed; and chapter prose is fetched at runtime (`src/chapters.js`), which **requires an http(s) origin — `file://` will load no chapter content** (the page shell still renders). A local server covers both:

```
cd InteraktivesSkript_WIP
python3 -m http.server 8000
# open http://localhost:8000/
```

There is nothing to build, lint, or test. To verify a change, reload the page and exercise the affected slider/figure.

## Repository layout

The repo root holds:

- `InteraktivesSkript_WIP/` — **the working copy. All edits go here.** This is the only folder you should modify.
- `Input/` — drop folder for source material the user provides; **read-only reference, do not edit**:
  - `Input/InteraktivesSkript_legacy/` — the **frozen baseline** snapshot of the site as of the split (relocated here from the repo root). Do not edit; it exists for reference/diffing against WIP. Started byte-identical to WIP. *(The legacy `src/script.js` — the whole app in one 2787-line file — lives only here now; WIP is modularized, see Architecture.)*
  - `Input/v0.13/` — LaTeX source of the **complete target script** (`Physik_pskript_v0.13.tex` + compiled `.pdf` + per-chapter `.tex` files) spanning all 15+ chapters (Mechanics, EM, Schwingungen, Wellen, Gravitation, Stöße, …). This is the content target the WIP is being scaled toward.
  - `Input/Simulationen/` — 16 standalone simulation projects (Atwood, Federpendel, freier Fall, Kreisbewegung, Wellen, Lorentz-force, schiefer Wurf, …) — candidate source material for future interactive figures. `Project_kreisbewegung_simulation/` has been adapted into the WIP as `src/figures/kreisbewegung/` (gc10, section 1.5.5); its own `shared/js/*` dependency (a sibling-project library not included in this repo's `Input/`) was ported alongside it into `src/figures/kreisbewegung/lib/`.

Inside the WIP site folder the structure is:
  - `index.html` — **the shell only**: header/overlays, `#paper` mount holding one `<div data-chapter="…">` placeholder per chapter + the global `.chapter-pagenav`. Chapter prose lives in `chapters/` and is injected at runtime (see `src/chapters.js`). MathJax `$$…$$` / `\[…\]` / `\(…\)` formulas sit inside the chapter fragments, not here.
  - `chapters/` — **one HTML fragment per chapter** (`ch_NN_<slug>.html`): `ch_01_kreisbewegungen.html` (the migrated chapter 1.5) and `ch_02_kinematik_starrer_koerper.html` (a scaffold). Each fragment holds the h2 chapter intro + h3 subsections + their `<section>`s, figures, sliders, highlight boxes — everything that used to be inline in `index.html`. Fetched + injected by `src/chapters.js` before `paginate()`. **Adding a chapter = one new file here + one `<div data-chapter="…">` line in `index.html` (O(1)).**
  - `src/` — the ESM modules (`main.js` entry + `core/transform/ui/print/pages/shell/chapters.js` + `figures/*.js`); no monolithic `script.js` (that survives only in `Input/InteraktivesSkript_legacy/`)
  - `src/styles.css`, `src/darkmode.css` — styles; `darkmode.css` is loaded but `disabled` and toggled at runtime
  - `bilder/` — static figure PNGs/SVGs used in static mode and prose
  - `src/assets/` — SVG/PNG icons injected into highlight boxes
  - `Archiv/` — an older snapshot of the same site nested inside (reference only, not linked/active)

`__MACOSX/`, `*.DS_Store`, `Archiv.zip` — macOS zip metadata/junk; ignored, do not edit.

## Architecture (WIP — ESM modules + chapter app shell + figure factory)

### Module layout
WIP ships as native ESM (no build step, no bundler). `index.html` loads `<script type="module" src="src/main.js">`; modules are deferred, so `main.js` calls `init()` at the end of the module (no `<body onload>`). qrjs2 and MathJax stay classic CDN `<script>` tags → global `window.QRCode` / `window.MathJax`.

```
src/main.js        entry: init() (async), central data-action binder, afterprint/hashchange listeners
src/chapters.js   loadChapters() — fetches chapters/ch_NN_*.html at runtime, injects +
                   flattens each into its <div data-chapter> placeholder in #paper so the
                   fragment nodes become direct #paper children (paginate() unmodified);
                   typesetAfterLoad() re-typesets injected formulas via MathJax.startup.promise
                   gate (mirrors numbering.js) -> reload_mathjax (imports core only)
src/core.js        state (interaktiv, darkmode_on, linspace, speed_factor), ge/show/hide,
                   generate_highlight_boxes, safari_bug, degree_to_fraction, make_static,
                   test, reload_mathjax, toggle_darkmode, reset, set_width_mode, update_all
src/transform.js   to2d, transform_line, transform_polyline, ga  (imports ge from core)
src/pages.js       paginate() — groups #paper into one-subsection-per-page .chapter-page
                   units (h2 = chapter intro, h3 = subsection); showPage/getPages/next/prev;
                   showAllPagesForPrint/restorePagination for the print flow
src/shell.js       chapter app bar (breadcrumb/progress/hamburger), left rail (on-page
                   landmarks + chapter mini-nav), right marginalia (reparents .anmerkung
                   boxes of the active page), tablet drawer; reacts to pages.js's
                   "pagechange" CustomEvent (no import of pages.js internals beyond its API)
src/ui.js          toc (full-screen accordion + search filter, built from pages.js's page
                   registry), generate_toc, toc_filter, kontakt, offsetAnchor,
                   toggle_body_scroll, zoom, close_zoom, pause
src/numbering.js   init_numbering() — v0.13-style per-subsection numbering (\numberwithin
                   {equation}{section} equivalent): equations "(1.5.1.3)", Beispiel/Aufgabe/
                   Lernziel/Anmerkung/Zusammenfassung box titles, Simulation (grafik-container)
                   titles, and standalone Abbildung images all number generically off
                   pages.js's registry, reset per .chapter-page. Equation numbering waits on
                   MathJax's startup promise (mjx-container only exists after that resolves);
                   exposes window.renumber_equations as a re-run bridge for core.js's
                   reload_mathjax() (which rebuilds mjx-container and would otherwise drop the
                   injected .eq-number badges) — window bridge instead of an import to avoid
                   the core→numbering→pages→core cycle, same pattern as update_all/window.updateN.
src/print.js       init_print, check_print, print_page, create_qr, from_qr, findGetParameter
src/figures/factory.js   createFigure() + shared omega-circle hooks (circleStep/Wrap/Render, omega*)
src/figures/fig_NN.js     one file per figure; self-registers updateN/animateN/clearN on window
src/figures/panels.js     init_figure_panels()/toggle_panel() — wraps every .grafik-container
                          in a collapsible preview-card ↔ full-figure toggle (JS-only, no
                          per-figure markup beyond an optional data-title/data-desc attribute)
src/figures/kreisbewegung/  self-contained multi-file figure (gc10): constants/state/physics/
                          render/ui.js + lib/{format,hover,svg-text,ticks,vectors}.js, ported
                          from Input/Simulationen/Project_kreisbewegung_simulation/. Does not
                          use figures/factory.js (its interaction model — continuous auto-play
                          over precomputed time-series + dual live graphs — doesn't fit the
                          factory's slider-drag/φ-wrap contract); self-initializes once via
                          initKreisbewegung(), called from main.js's init(), not update_all().
```

Dependency graph is acyclic: `core` ← `transform` ← `factory`; `core` ← `pages` ← `ui`,`shell`,`numbering`; `chapters` ← `core` (only `reload_mathjax`); `core`,`ui`,`pages`,`shell` ← `print`; everything ← `main`. `update_all` (core) dispatches via `window.updateN` instead of importing figure modules, which is what keeps the graph cycle-free — figure modules are side-effect-imported by `main.js` so their `window` registration runs before `init()`. `shell.js` never imports `ui.js`/`print.js`; it communicates page changes via a `pagechange` `CustomEvent` on `document` rather than a direct import, so `print.js` can depend on both `pages.js` and `shell.js` without a cycle. `numbering.js` similarly never imports `core.js`'s `reload_mathjax()`; it exposes `window.renumber_equations` instead (`core.js` → `window.renumber_equations` at runtime, not an import), avoiding a `core`→`numbering`→`pages`→`core` cycle.

### Central event binding (data-action)
There are **no inline `oninput`/`onclick` handlers**. `index.html` marks elements with `data-action` (+ `data-fig`, optional `data-arg`, `data-event="change"` for `<select>`/radio). `main.js` attaches one delegated listener each for `click`/`input`/`change` and dispatches to the function or to `fig_call(prefix, fig, arg)` → `window[prefix+fig]`. `make_static()` injects `data-action="zoom"` so the delegated binder covers static-mode zoom buttons too. `data-action="goto_page"` + `data-arg="<page-id>"` (used by the rail, the TOC accordion, and ad-hoc in-prose cross-reference links) navigates via `shell.js::goto_page` → `pages.js::showPage`.

### Chapter pagination (one subsection per page)
Chapter prose now lives one file per chapter in `chapters/ch_NN_*.html` (loaded + flattened into `#paper` by `src/chapters.js::loadChapters()` before `paginate()` runs — BACKLOG.md P1b, done). `pages.js::paginate()` then groups `#paper`'s DOM at runtime into `.chapter-page` units, one per `.inhaltsverzeichnis` heading (h2 = chapter intro, h3 = subsection) plus its associated `<section>`, and shows exactly one at a time (`display:none` on the rest). Grouping walks from each heading to its `<section>` rather than assuming a fixed nesting, and a second pass (`foldStraySiblings`) folds any loose top-level content between sections into the preceding page — the hand-authored markup has a few such stray siblings (e.g. a `.zusammenfassung` box sitting after a `</section>` and before the next heading) that would otherwise stay visible on every page. Print (`print.js::print_page`) calls `showAllPagesForPrint()` before cloning `#container` so the printed output contains every subsection, not just the active one.

### Chapter app shell (header, rail, marginalia, TOC)
`#header` is one merged 64px bar (branding eyebrow/title, a divider, the breadcrumb + "Seite x/y" progress from `shell.js::init_shell()`, the existing toolbar/text-size/width-mode/darkmode controls, and a hamburger that only shows below the tablet breakpoint) — deliberately one bar, not two stacked ones, matching the imported Claude Design mockup's single-app-bar structure. The left rail (on-page landmarks for the active page, generated from highlight-box titles and figure `data-title`s; a chapter mini-nav listing sibling h3 pages) is `position: sticky` so it stays docked while a long subsection scrolls — note `#content` must never get `overflow` other than `visible`, or sticky breaks on this descendant (hit once already, see the comment on `#content` in `styles.css`). The right marginalia column moves — not clones — the active page's `.anmerkung` boxes into a side card list; `shell.js::restoreMarginalia()` puts them back before printing. Below the tablet breakpoint (`@media (max-width: 1024px)`, the project's first responsive CSS, BACKLOG.md P2) the rail/marginalia columns hide and the same rail content renders into a slide-in drawer instead, toggled via `data-action="toggle_drawer"`. The TOC (`ui.js::generate_toc()`/`toc()`, opened via the existing `data-action="toc"` toolbar button) is a full-screen view (not an overlay panel) sized to match `#content`'s bounds, with its own search input (`ui.js::toc_filter()`) and a real accordion built generically from the page registry — one group per h2 chapter, nested h3 links, current chapter/page highlighted — so a future chapter needs zero TOC code changes, just another `.inhaltsverzeichnis` h2 in its own future `chapters/ch_NN.html`. `#header` hides while the TOC is open (`body.toc-open`) since the TOC screen has its own bar — one bar per view, never two.

### Interactive figures (the factory pattern + collapsible cards)
Each interactive figure is a numbered container `<div id="gcN" class="grafik-container">` (N ∈ {1,3,31,32,4,5,51,6,8,9,10}) holding an inline `<svg id="svgN">` plus range sliders `id="rangeN_*"` (gc10/Kreisbewegung uses `kb_`-prefixed ids instead, see below). The 7 animated 3D-circle figures (3/31/32/5/51/6/8) are built via `createFigure({id, render, step, wrap, condition, snap, clear?})` in `figures/factory.js`, which owns all shared boilerplate: a `requestAnimationFrame` loop with a ~10 ms accumulator (replacing recursive `setTimeout(...,10)`), a reentry guard, slider snap, φ-wrap + revolution counter (`state.n`), a **cached** static circle `p3d` (rebuilt only when radius/z change, not per frame), the koord transform + foreignObject copies, and the φ-span block. Each `fig_NN.js` supplies only the figure-specific hooks. The 2D arcs (gc1/gc9) and the radio image-swap (gc4) are small standalone modules. The factory exposes `updateN`/`animateN`/`clearN` on `window` (the binder + `update_all` consume those names — the `N` suffix remains the HTML↔JS contract).

Every `.grafik-container` — factory-built or not — is wrapped by `figures/panels.js::init_figure_panels()` into a collapsible card: collapsed by default (title + short description + "Simulation öffnen" button, sourced from `data-title`/`data-desc` attributes on the container), expanding in place to the full interactive figure on click (`data-action="toggle_panel"`). This replaced the former sticky/scaled two-column layout (`splitter.js`, removed) once figures moved into the one-subsection-per-page reading flow, where a scroll-pinned companion column no longer makes sense.

A deliberately-preserved legacy bug: `fig_5.js`'s gc51 `>6.27` wrap increments **gc5's** revolution counter (`fig5.state.n++`) instead of gc51's — kept for behavior parity, flagged in the code.

### Static vs. interactive mode
`interaktiv` (exported `let` in `core.js`) switches the whole document between interactive SVG figures and static images. When false, `make_static()` overwrites each `gcN` container's `innerHTML` with a `<img class="grafik">` from `bilder/` (plus a zoom button) and re-typesets MathJax. gc10 (Kreisbewegung) has no static-image equivalent and is deliberately left interactive even in static mode — not full parity with the other figures, documented inline in `core.js`. Two easter-egg toggles are hidden in the *Kontakt* box: clicking the disguised letters "Fa**ll**" calls `test()` (flips `interaktiv` and re-runs `make_static()` — the only runtime way to enter static mode without a code change), and "**tt**" in "bitte" calls `reload_mathjax()` to re-render all formulas.

### 3D → 2D projection
`to2d(d3, perspective)` projects a 3D point `[x,y,z]` to 2D screen coords; `perspective` ∈ {1,2,3,4} selects the view, driven by the per-figure `selectN` dropdown (read in each render). `transform_line` / `transform_polyline` apply it to SVG elements. Not all figures use 3D; gc1/gc9 are pure 2D polar plots.

### Highlight boxes, TOC, print, QR, zoom, darkmode
- `generate_highlight_boxes()` finds every element with one of the classes `lernziel`, `motivation`, `wiederholung`, `beispiel`, `zusammenfassung`, `aufgabe`, `anmerkung` and injects an icon (`src/assets/*.svg`) plus a capitalized title before its original content. To add a new box type, add a `[class, icon]` entry to the `boxes` array.
- TOC is generated at runtime by `generate_toc()` as an accordion from `pages.js`'s page registry, itself built from every element carrying class `inhaltsverzeichnis` (the `<h2>`/`<h3>` section headings) — see "Chapter app shell" above.
- Print flow: `init_print()` (toolbar "Drucken") opens the current URL with `?print=true` in a new tab; `check_print()` detects the param and calls `print_page()`, which clones `#container` into `#print_container`, strips zoom buttons, and generates a QR code (via qrjs2) per `gcN` linking back to `?g=gcN`. `from_qr()` handles the reverse: arriving via a QR link deep-zooms the target figure.
- `zoom(parent_gc)` clones a figure into the `#zoom` overlay and scales it to fit the viewport; `close_zoom()` tears down and re-runs `update_all()`.
- Darkmode is toggled by `toggle_darkmode()` enabling/disabling the `darkmode.css` `<link>` (id `darkmode_stylesheet`).

## Conventions and gotchas

- **MathJax note**: `reload_mathjax()` uses the MathJax **v3** API (`MathJax.typesetPromise()`, guarded for when MathJax isn't loaded yet). It re-renders all formulas and is wired to the "tt" easter egg in the Kontakt box and to `make_static()`. (Earlier this called the v2 `MathJax.Hub.Queue(...)` API, which was a no-op under v3 — fixed.)
- Content and code comments are in German; match the surrounding language when editing prose or comments.
- Only edit `InteraktivesSkript_WIP/`. `Input/` is read-only reference material — never modify it (the frozen baseline now lives at `Input/InteraktivesSkript_legacy/`). Within WIP, `Archiv/` is a historical copy and should likewise be left alone.