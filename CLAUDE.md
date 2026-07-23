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
  - `chapters/` — **one HTML fragment per chapter** (`ch_NN_<slug>.html`): `ch_01_kreisbewegungen.html` (v0.13 **section 1.4** "Kinematik der Drehbewegung und Kreisbahnen", 12 subsections 1.4.1–1.4.12, transcribed 1:1 from `Input/v0.13/pskript_mech_kin_dreh_und_kreis_v1.tex` — **purely static**: no `.grafik-container`/`svgN`/sliders, interactivity comes back later) and `ch_02_kinematik_starrer_koerper.html` (a scaffold). Each fragment holds the h2 chapter intro + h3 subsections + their `<section>`s, figures, sliders, highlight boxes — everything that used to be inline in `index.html`. Fetched + injected by `src/chapters.js` before `paginate()`. **Adding a chapter = one new file here + one `<div data-chapter="…">` line in `index.html` (O(1)).**
  - `MIGRATION_v0.13_nach_HTML.md` — **runbook for migrating the next chapter out of `Input/v0.13/`** (German): counter scopes, asset pipeline (PDF/TikZ → PNG), LaTeX→HTML macro mapping, MathJax config, cross-references, the three verification harnesses, a catalogue of 13 real pitfalls with how each was detected, and a checklist. **Read it before starting another chapter** — most of the listed traps are silent (wrong-but-consistent numbering, an image that is a PDF wearing a `.png` extension, a loaded-but-not-enabled MathJax package).
  - `VERIFIKATION_kapitel_1.4.md` — phase-by-phase test plan for the migrated chapter, with acceptance criteria
  - `INTERAKTIVE_ASPEKT_FIGUREN.md` — **runbook for building an interactive "aspect figure"** (German) that reuses a stand-alone sim's engine (`figures/kreisbewegung/`) feature-gated onto one chapter aspect, two-stage (inline + magnifier overlay), optics derived from the sim. Each figure builds its own `createRuntime()` motor instance (per-instance store/DOM isolation, so multiple figures coexist), registered via `main.js::ASPEKT_FACTORIES`. **Section 0a is the efficiency rule: copy an existing figure and feature-gate it — never write one from scratch.** The template cascade is: nearest aspekt figure (by interaction pattern, not topic) → the stand-alone sim (for optics *and* interaction conventions) → the static v0.13 figure → the legacy figure. "Like fig. 1.38" means pixel-identical, not "similar" — a deviation that is arguably *more* correct still counts as a bug. Concept, step-by-step, a catalogue of 22 real pitfalls (arrow-length coupling `ARROW_LEN=5·strokeWidth`, hidden DOM stubs `updateScene` dereferences, unnumbered `\[…\]` panel formulas, CSS-specificity vs. the overlay, section-link nav bug, graph-hit-rect null deref, speed-radio/runbar per-instance collisions, the now-solved singleton-store conflict; and from fig. 1.41: a MathJax-`foreignObject` glyph sits constantly too low because the `mjx-container` is the *line box* — use a native `<svg:text>` for single glyphs instead, `<input type=range>` fires one `input` per intermediate value so comparison-curve snapshots must be per drag-gesture, ghost curves must be stored as data and re-projected because axes rescale, a curve-shaping parameter change must reset the run parameter to 0, a syntax error in **one** figure module kills **all** figures via `main.js`'s side-effect imports, and `overflow:hidden` on `.aspekt-figur` makes it the sticky scroll container so `position:sticky` children never stick), and a checklist. Verify visually yourself before asking the user: `.claude/skills/interaktive-aspekt-figur/scripts/figur_screenshot.mjs` drives headless Chromium (playwright-core) for per-width-mode/overlay screenshots and ink-box geometry — *looking beats measuring*, and when measuring, measure the innermost drawn element. Reference impls: `src/figures/aspekt_kreisbahn.js` (fig. 1.38), `src/figures/aspekt_weg_zeit.js` (fig. 1.39) and `src/figures/aspekt_winkel_zeit.js` (fig. 1.41). `CHANGES_aspekt_1.38_1.40_und_grundgeruest.md` documents every change since the first (singleton) version. (Figure numbers are the document's actual `Abb. 1.n` from `numbering.js` — note the gap: 1.40 is the static radial-tangential figure, not an aspekt figure, which is why the file historically called „weg-zeit 1.40" is really 1.39.)
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
src/numbering.js   init_numbering() — box, figure and image numbering off pages.js's
                   registry. **The v0.13 counter scopes are not uniform** (see
                   Physik_skript_header_gmni_v3.tex) and the code mirrors that exactly:
                     * beispiel/bemerkung/wichtig/lernziel/aufgabe -> {section} -> "1.4.n"
                     * zusammenfassung                            -> {chapter} -> "1.n"
                     * figure (no \numberwithin at all)           -> {chapter} -> "Abb. 1.n"
                   CHAPTER_SCOPED marks the chapter-wide box types; chapter-wide counters
                   get their start value from data-figure-offset/data-zusammenfassung-offset
                   on the chapter's h2 (sections 1.0–1.3 aren't migrated yet, so ch_01 starts
                   at Abb. 1.38 / Zusammenfassung 1.4 — remove the offsets once they are).
                   Box titles are split into <span class="hb-type"> (type + number, uppercased
                   via CSS) and <span class="hb-name"> (the box's own title, normal case, so
                   formula parts aren't mangled) — core.js creates the type span, numbering.js
                   refills both. Equations are numbered by MathJax itself (tags:'ams'), not here.
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
                          runtime.js adds createRuntime()/withStore/bindDom — a per-instance
                          facade around the module-singleton store/DOM so several aspekt figures
                          (and the sleeping gc10 sim) can reuse the motor without clobbering each
                          other. state.js::q(id) = getElementById(store.idPrefix + id); the
                          default idPrefix 'kb_' keeps gc10 untouched.
src/figures/aspekt_kreisbahn.js   interactive "aspect figure" 1.38 (positions aspect, 1.4.1):
                          its own buildKreisbahnFig(fig) factory, a createRuntime() motor
                          instance, feature-gated store.show* flags, slider + pointer-drag of the
                          mass point, two-stage (inline + magnifier overlay). Also exports the
                          generic toggles (toggle_aspekt/close_aspekt_overlay/toggle_analyse/
                          toggle_panel_left) reused by ALL aspekt figures via main.js binding.
src/figures/aspekt_weg_zeit.js     aspect figure 1.39 (x(t)/y(t) way-time aspect): same per-
                          instance pattern, adds stacked dual graphs + auto-stop animation
                          (0…12 s) via playback.js::resetOnPlayAfterAutoStop. Graph hover is gated
                          to .aspekt-im-overlay only. „Letzte Kurve behalten" toggle freezes the
                          previous run as a dashed thinner ghost line (graph_prev_line_top/bottom).
src/figures/aspekt_winkel_zeit.js   aspect figure 1.41 (φ(t) angle-time aspect): same per-instance
                          pattern, single graph (graphType1='phit', not stacked) + auto-stop (0…12 s).
                          Sliders only t + T (R fixed at 1.5 m — radius doesn't move the angle curve).
                          Angle arc per revolution like 1.38; each completed revolution stays as a
                          faded full-circle ghost (.aspekt-angle-arc-prev) — current arc most prominent.
                          Same „Letzte Kurve behalten" ghost-line toggle in the diagram.
src/figures/aspekt_*.css   optics derived from kreisbewegung/styles.css, scoped to .aspekt-figur
                          (shared aspekt_kreisbahn.css for all + per-figure aspekt_<name>.css);
                          --kb-lw/--kb-fs tokens on .aspekt-figur scale line widths / fonts ×1.5
                          (kernsim + diagram only — varphi label and Bedienung/Analyse excluded;
                          arrow tips stay fixed via ARROW_LEN + userSpaceOnUse markers).
src/figures/playback.js   shared auto-stop playback helpers (isAtAutoStopEnd,
                          resetOnPlayAfterAutoStop) for animated aspekt figures.
```

**Aspekt figures are dispatched, not factory-built:** `main.js::ASPEKT_FACTORIES`
maps `data-aspekt` → `buildXFig`; `init_aspekt_figuren()` runs each before
`init_numbering()`, `label_aspekt_figuren()` transfers the static figure's
"Abb. 1.n" (via `data-figref`) into the interactive caption after numbering. The
"physics section" (formulas beside a figure) has two paths — a static
`.formula-box` in the template (default; both current figures) or a dynamic
`.physik-list` filled from `window.eq_latex` (captured pre-Typeset by
`chapters.js::captureEqLatex` from every `\label`ed equation) when a figure
carries `data-eqs="…"` and no static box. Runbook: `INTERAKTIVE_ASPEKT_FIGUREN.md`.

Dependency graph is acyclic: `core` ← `transform` ← `factory`; `core` ← `pages` ← `ui`,`shell`,`numbering`; `chapters` ← `core` (only `reload_mathjax`); `core`,`ui`,`pages`,`shell` ← `print`; everything ← `main`. `update_all` (core) dispatches via `window.updateN` instead of importing figure modules, which is what keeps the graph cycle-free — figure modules are side-effect-imported by `main.js` so their `window` registration runs before `init()`. `shell.js` never imports `ui.js`/`print.js`; it communicates page changes via a `pagechange` `CustomEvent` on `document` rather than a direct import, so `print.js` can depend on both `pages.js` and `shell.js` without a cycle. `numbering.js` similarly never imports `core.js`'s `reload_mathjax()`; it exposes `window.renumber_equations` instead (`core.js` → `window.renumber_equations` at runtime, not an import), avoiding a `core`→`numbering`→`pages`→`core` cycle.

### Central event binding (data-action)
There are **no inline `oninput`/`onclick` handlers**. `index.html` marks elements with `data-action` (+ `data-fig`, optional `data-arg`, `data-event="change"` for `<select>`/radio). `main.js` attaches one delegated listener each for `click`/`input`/`change` and dispatches to the function or to `fig_call(prefix, fig, arg)` → `window[prefix+fig]`. `make_static()` injects `data-action="zoom"` so the delegated binder covers static-mode zoom buttons too. `data-action="goto_page"` + `data-arg="<page-id>"` (used by the rail, the TOC accordion, and ad-hoc in-prose cross-reference links) navigates via `shell.js::goto_page` → `pages.js::showPage`.

### Chapter pagination (one subsection per page)
Chapter prose now lives one file per chapter in `chapters/ch_NN_*.html` (loaded + flattened into `#paper` by `src/chapters.js::loadChapters()` before `paginate()` runs — BACKLOG.md P1b, done). `pages.js::paginate()` then groups `#paper`'s DOM at runtime into `.chapter-page` units, one per `.inhaltsverzeichnis` heading (h2 = chapter intro, h3 = subsection) plus its associated `<section>`, and shows exactly one at a time (`display:none` on the rest). Grouping walks from each heading to its `<section>` rather than assuming a fixed nesting, and a second pass (`foldStraySiblings`) folds any loose top-level content between sections into the preceding page — the hand-authored markup has a few such stray siblings (e.g. a `.zusammenfassung` box sitting after a `</section>` and before the next heading) that would otherwise stay visible on every page. Print (`print.js::print_page`) calls `showAllPagesForPrint()` before cloning `#container` so the printed output contains every subsection, not just the active one.

### Chapter app shell (header, rail, marginalia, TOC)
`#header` is one merged 64px bar (branding eyebrow/title, a divider, the breadcrumb + "Seite x/y" progress from `shell.js::init_shell()`, a subtle `#header_pagenav` Zurück/Weiter pager top-right whose `data-action="chapter_prev/next"` mirror the bottom `.chapter-pagenav` and whose disabled state `shell.js::renderPrevNext()` keeps in sync with it, the existing toolbar/text-size/width-mode/darkmode controls, and a hamburger that only shows below the tablet breakpoint) — deliberately one bar, not two stacked ones, matching the imported Claude Design mockup's single-app-bar structure. The left rail (on-page landmarks for the active page, generated from highlight-box titles and figure `data-title`s; a chapter mini-nav listing sibling h3 pages) is `position: sticky` so it stays docked while a long subsection scrolls — note `#content` must never get `overflow` other than `visible`, or sticky breaks on this descendant (hit once already, see the comment on `#content` in `styles.css`). The right marginalia column moves — not clones — the active page's `.anmerkung` boxes into a side card list; `shell.js::restoreMarginalia()` puts them back before printing. Below the tablet breakpoint (`@media (max-width: 1024px)`, the project's first responsive CSS, BACKLOG.md P2) the rail/marginalia columns hide and the same rail content renders into a slide-in drawer instead, toggled via `data-action="toggle_drawer"`. The TOC (`ui.js::generate_toc()`/`toc()`, opened via the existing `data-action="toc"` toolbar button) is a full-screen view (not an overlay panel) sized to match `#content`'s bounds, with its own search input (`ui.js::toc_filter()`) and a real accordion built generically from the page registry — one group per h2 chapter, nested h3 links, current chapter/page highlighted — so a future chapter needs zero TOC code changes, just another `.inhaltsverzeichnis` h2 in its own future `chapters/ch_NN.html`. `#header` hides while the TOC is open (`body.toc-open`) since the TOC screen has its own bar — one bar per view, never two.

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

- **No build / tooling baseline (decided v1.6)**: the project stays **no-build, no package manager** by deliberate decision (revisit trigger = full ~400-page scale, multiple co-authors, or noticeable load times). Chapter fragments are fetched at runtime over HTTPS (GitHub Pages); `file://` double-click is not supported (no fetch). The zero-dependency tooling baseline is **`.editorconfig`** at the repo root — editors with EditorConfig support read it automatically, no install needed. Prettier/ESLint/TypeScript are intentionally deferred to a future light Vite/esbuild build (see BACKLOG.md item 64); do not add a `package.json` or linter config in the meantime.
- **Accessibility (v1.6)**: `<html lang="de">` is set. All toolbar controls (Inhaltsverzeichnis/Drucken/Kontakt), the darkmode toggle, and every zoom button (including the ones `make_static()` generates for static-mode figures) are real `<button type="button">` with `aria-label`s — keyboard-focusable, Enter-activatable. There are no inline `on*` handlers (see "Central event binding"). CSS button resets (`.navbar_button`, `.darkmode_icon`, `.zoom_button`) strip browser defaults so existing background/icon styles survive.
- **Safari foreignObject workaround (kept v1.6)**: `core.js::safari_bug()` UA-sniffs Safari and adds a `.fixed` class (150px margin shift) to `.fo_inner` elements to compensate for Safari mis-positioning HTML text inside SVG `<foreignObject>`. This is a *rendering* quirk, not a missing API, so `@supports` cannot detect it — UA sniff is the pragmatic fallback, documented inline. Revisit if a CSS-only fix for foreignObject becomes known. Non-Safari browsers are unchanged (no `.fixed`).
- **Responsive scope (v1.6)**: **Desktop/Tablet-only by decision** — no phone support. The viewport meta (`width=device-width, initial-scale=1`) is correct; the only responsive breakpoint is `@media (max-width: 1024px)` (tablet), which swaps the left rail + right marginalia for a slide-in drawer. Do not add phone-targeted CSS without revisiting that decision.
- **Width mode + print decoupling**: `core.js::set_width_mode` (schmal/normal/breit) sets inline `width` on `#content`, inline `--paper-max-width` on `#paper`, persists to `localStorage`, and sets `<html data-width-mode="…">` — the **CSS signal** for mode-dependent rules (always select via `:root[data-width-mode="…"]`, never JS classes; aspekt figures scope theirs with `:not(.aspekt-im-overlay)` so the overlay layout wins). Text scaling (`core.js::metrics_for_level`/`apply_text_size`, 5 steps) exposes two scales on `#paper`: `--paper-font-size`/`-line-height` for prose and `--paper-graphics-scale`/`-line-scale` (gentler) for UI/SVG text. **Print must decouple from the width mode**: `print.js::print_page` strips the inline `#content` width and `#paper` `--paper-max-width` from the clone (they'd win by inline specificity and the printout would track the screen mode); the print column is a fixed 700 px in `styles.css`, with `#fff` backgrounds to save toner.
- **MathJax equation numbering (v1.7)**: equations are numbered by MathJax, not by `numbering.js` — `tex.tags:'ams'` in the inline config in `index.html`, with `tagformat.number` producing `1.4.n`. **A loaded extension is not an enabled one**: `[tex]/tagformat` and `[tex]/color` must appear *both* in `loader.load` *and* in `tex.packages: {'[+]': […]}`, otherwise tags silently fall back to `(1)` and `\textcolor` doesn't render. The `'1.4.'` prefix is currently a constant — revisit when a second section enters the WIP.
- **Keep the box class lists in sync**: the v0.13 box types `bemerkung`/`wichtig` were added in v1.7, and *five* independent places enumerate box classes — `core.js::generate_highlight_boxes` (icons), `numbering.js::BOX_LABELS` (titles), `styles.css` (the card look + the 50px icon gutter), the `mjx-container[display="true"]` "no box-in-box" rule, and `shell.js::landmarksFor` (left rail). Missing one is silent: a box without the CSS rule loses its frame *and* its icon escapes into the rail. When adding a type, grep all five.
- **Figure sizing follows v0.13**: each `<img class="grafik">` inside `figure.abbildung` carries an inline `style="width:xx%"` taken from the source's `\includegraphics[width=0.8\textwidth]` (they range 0.25–0.99), and sub-figure containers carry the `\begin{subfigure}{0.48\textwidth}` outer width. This is necessary because the legacy `.grafik { width:100% }` rule would otherwise stretch every image to the column and upscale small diagrams past their native resolution — `#paper figure.abbildung > img.grafik { width:auto }` neutralizes it. The two TikZ figures are rendered via standalone `pdflatex` + `pdftocairo -png -r 300` (sources not kept in the repo, only the PNGs in `bilder/`).
- **MathJax note**: `reload_mathjax()` uses the MathJax **v3** API (`MathJax.typesetPromise()`, guarded for when MathJax isn't loaded yet). It re-renders all formulas and is wired to the "tt" easter egg in the Kontakt box and to `make_static()`. (Earlier this called the v2 `MathJax.Hub.Queue(...)` API, which was a no-op under v3 — fixed.)
- Content and code comments are in German; match the surrounding language when editing prose or comments.
- **Commit in kleinen Schritten (kleinschrittig commiten — Nutzervorgabe)**: Änderungen werden **pro logischer Einheit** als eigener kleiner Commit abgegeben, nicht als ein großer Sammel-Commit. Eine logische Einheit = ein Feature/Aspekt/Fix samt seinen Dateien. Vor jedem Commit die betroffenen Dateien gezielt `git add`-en, eine knappe deutsche Commit-Message schreiben (Co-Authored-By-Footer nicht vergessen), dann den nächsten. **Nicht pushen/mergen ohne ausdrückliche Nutzungs­freigabe** — Committen ja (in kleinen Schritten), Pushen nur auf Aufforderung. Diese Regel gilt für JEDEN Aufruf in diesem Repo.
- Only edit `InteraktivesSkript_WIP/`. `Input/` is read-only reference material — never modify it (the frozen baseline now lives at `Input/InteraktivesSkript_legacy/`). Within WIP, `Archiv/` is a historical copy and should likewise be left alone.