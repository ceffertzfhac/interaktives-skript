// splitter.js — Draggable Trennung zwischen Text- (links) und Grafik-Spalte
// (rechts), v1.4.7. Eine CSS-Variable --g (Grafik-Anteil 0.25..0.50) auf
// #content steuert alle abhaengigen Layout-Regeln. Beim Ziehen des #splitter-
// Handles werden --g UND die abgeleiteten, Layout-wirksamen Werte als KONKRETE
// Pixel neu gesetzt (v1.4.4): --split-left, --paper-w, --gfx-left, --scale.
// Frueher standen diese in styles.css als calc(... var(--g) ...) -- das wurde
// in einem Browser nicht zuverlaessig aufgeloest, #paper fiel auf shrink-to-
// fit (~1150px) und der Fließtext ragte deutlich über den Balken. Konkrete px
// via var-direct (wie --scale schon immer) sind robust. Drag-Semantik passt
// nicht zum zentralen data-action-Click-Binder, daher eigene Pointer-Events.
//
// Skalierung (v1.4.7): Per-Gruppen-Scale. Einzelfiguren-Sektionen bekommen
// singleScale = min(want, SIZE_LOCK, viewportCap) -> vollstaendig Splitter-
// responsiv. Mehrfachfiguren-Sektionen (z.Z. nur 1.5.6: gc3+gc6) bekommen
// zusaetzlich einen Stapel-Cap: groupScale = min(want, SIZE_LOCK, viewportCap,
// stackCap) mit stackCap = (vh - VP_MARGIN - (n-1)*INTER_GAP) / Sigma_natH,
// so dass der gestapelte Stapel stets ins Viewport passt. gc3/gc6 koennen
// dadurch kleiner sein als Einzelfiguren (akzeptierter Kompromiss).
// GRAPHIC_MARGIN (70) = 20px Spalt zum Splitter links + 50px Platz fuer rechts
// ueberstehende Labels -> Grafik klebt nicht am Trennstrich und skalierte
// Labels ragen nicht ueber den Seitenrand.

import { ge } from './core.js';

const G_MIN = 0.25;
const G_MAX = 0.50; // v1.4.3: Anschlag in der Mitte (0.5/0.5 Text/Grafik) statt 0.75.
// Breiten-Modi (v1.4.5): #content-Breite ist vom Nutzer ueber die 3-Segment-
// Leiste in der Toolbar umschaltbar (Schmal/Normal/Extrabreit). CONTENT_W bleibt
// ein Integer (kein Messwert) -> die v1.4.4-concrete-px-Robustheit und die
// Resize-Invariante (Layout-Werte haengen nur von --g ab, nicht vom Viewport)
// bleiben erhalten. #container laeuft mit +50 mit (wie heute 1200/1150).
const WIDTHS = { schmal: 900, normal: 1150, breit: 1500 };
const CONTAINER_SLACK = 50;  // #container = #content + 50 (wie heute 1200 = 1150 + 50).
const STORAGE_KEY = "skript_width_mode";
let CONTENT_W = WIDTHS.normal;  // #content Breite (px); via set_width_mode schaltbar.
let currentMode = "normal";
const NATURAL_W = 300;   // naturale Grafikbreite (px) -> --scale-Formel s.o.
const GRAPHIC_MARGIN = 70; // horizontaler Innenrand der Grafik-Spalte (20 links + 50 rechts fuer Labels).
const CB_OFFSET = 70;    // Containing-Block des .grafik-container-inner ist der sticky Platzhalter bei x=70 (Paper-padding-left), nicht #content -> Versatz.
const GFX_GAP_LEFT = 40; // Spalt zwischen Splitter (B) und Grafik (Grafik liegt bei B+20, nicht bündig).
const SPLITTER_HW = 4;   // halbe Handle-Breite: Splitter left = B - 4 (8px-Handle mittig zur Linie).
const PAPER_GAP = 40;    // Spalt Text<->Grafik: #paper width = B - 40.
const H_FLOOR = 380;     // Mindest-naturalehoehe (SVG 300 + Slider + Titel); verhindert ein zu laxes Cap, falls offsetHeight nicht messbar ist.
// Figuren-Layout (v1.4.7): Per-Gruppen-Scale. Einzelfiguren -> singleScale,
// Mehrfachfiguren (gc3+gc6 in 1.5.6) -> groupScale mit Stapel-Cap.
// Vorherige Probleme: (a) applyScale einmal vor MathJax/Bild/Font-Load ->
// veraltete natH; (b) gc3+gc6 pinnen gleichzeitig auf Viewport 50 -> Ueber-
// lappung (vorher hardcoded margin-top 400px fuer Normal, falsch bei anderen
// Breiten); (c) kein Stapel-Cap -> gc6 ueberschritt bei hohem Scale den Viewport
// und war nie vollstaendig sichtbar. ResizeObserver (rAF-debounced) als Re-
// Trigger; kein Loop (transform/margin aendern border-box nicht).
const SIZE_LOCK = 1.5;   // hardes Scale-Cap: zu breite Grafikspalte vergroessert die Grafik nicht weiter (Weißraum rechts statt riesige Grafik).
const INTER_GAP = 20;    // vertikaler Spalt zwischen gestaffelten Figuren derselben Sektion.
const VP_MARGIN = 120;   // Viewport-Cap (uniform): groesste Figur muss allein von Pin-Top 50 bis vh-VP_MARGIN passen -> scale <= (vh-VP_MARGIN)/maxNatH. Bindet nur auf kurzen Viewports (Tablet); auf Normal/4K nicht (SIZE_LOCK zuerst).
const DEFAULT_G = 0.30;

function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
}

// In-Flow-Dokumentposition (offsetTop-Kette bis body). Stabil und
// scroll-unabhaengig -- getBoundingClientRect wuerde bei position:sticky die
// *verschobene* (gepinnte) Position liefern, nicht die Fluss-Position. Fuer
// den Per-Figur-Vertikalcap ist nur die Differenz zweier Platzhalter relevant,
// konstanter Versatz kuerzt sich weg.
function docTop(el) {
    let t = 0;
    let cur = el;
    while (cur && cur !== document.body) {
        t += cur.offsetTop;
        cur = cur.offsetParent;
    }
    return t;
}

// Oeffentliche Setzer-Bruecke: init_splitter installiert die eigentliche
// (auf Content/Container/Layout-Closure zugreifende) Funktion. Vor init
// (oder wenn #content/#splitter fehlen) ist _setMode null -> No-op.
let _setMode = null;
export function set_width_mode(mode) {
    if (_setMode) _setMode(mode);
}

export function init_splitter() {
    const content = ge("content");
    const splitter = ge("splitter");
    const container = ge("container");
    const paper = ge("paper");
    if (!content || !splitter || !container) return;

    let currentG = DEFAULT_G;

    // Figuren-Layout (v1.4.7): Per-Gruppen-Scale.
    //
    // Problem (Versuch 3): EIN globaler Scale ohne Stapel-Cap -> gc3+gc6-Stapel
    // ueberstieg den Viewport. margin-top von gc6 = natH_gc3 * scale + INTER_GAP.
    // Bei scale ~1.2 war das ~560 px -> gc6-Top bei ~610 px Viewport-y -> gc6
    // ueberschritt den Viewport und war nie vollstaendig sichtbar.
    //
    // Loesung: Per-Gruppen-Scale (akzeptierter Kompromiss):
    //   - Einzelfiguren-Sektionen: singleScale = min(want, SIZE_LOCK, viewportCap)
    //     -> vollstaendig Splitter-responsiv, keine Einschraenkung.
    //   - Mehrfachfiguren-Sektionen (z.Z. nur 1.5.6: gc3+gc6): groupScale =
    //     min(want, SIZE_LOCK, viewportCap, stackCap) wobei
    //     stackCap = (vh - VP_MARGIN - (n-1)*INTER_GAP) / Sigma_natH sicherstellt,
    //     dass der gestapelte Stapel ins Viewport passt.
    //   Trade-off: gc3/gc6 koennen bei grosser Grafikspalte kleiner sein als
    //   Einzelfiguren. Quer-Sektions-Handoffs zwischen Einzel- und Gruppen-
    //   Sektionen sind nicht mehr pixelgenau deckend (die breitere Einzelfigur
    //   ragt beim Handoff leicht hinter der Gruppe hervor). Akzeptiert.
    //
    // Lese-Phase (offsetHeight) strikt vor Schreib-Phase (--scale, marginTop);
    // Grafik ist position:absolute -> Skalierung aendert Textflow nicht ->
    // kein ResizeObserver-Loop.
    function applyScale() {
        const vh = window.innerHeight;
        const want = (currentG * CONTENT_W - GRAPHIC_MARGIN) / NATURAL_W;

        const placeholders = content.querySelectorAll(".grafik-container");
        // Lese-Phase: naturale Hoehe des Inners + Sektion (zur Gruppenbildung).
        const figs = Array.from(placeholders).map(ph => {
            const inner = ph.querySelector(".grafik-container-inner");
            const sec = ph.closest("section");
            return {
                inner,
                natH: inner ? (inner.offsetHeight || H_FLOOR) : H_FLOOR,
                sec,
            };
        });

        // Gruppen: aufeinanderfolgende Figuren mit gleichem <section>.
        const groups = [];
        let cur = null;
        for (const f of figs) {
            if (!cur || cur.sec !== f.sec) { cur = { sec: f.sec, figs: [] }; groups.push(cur); }
            cur.figs.push(f);
        }

        // Einheitliche viewportCap: groesste Einzelfigur muss allein ins Viewport
        // passen -> alle Einzelfiguren haben den gleichen singleScale -> gleiche
        // Breite -> sauberer Quer-Sektions-Handoff bei Einzelfiguren.
        let maxNatH = H_FLOOR;
        for (const f of figs) if (f.inner && f.natH > maxNatH) maxNatH = f.natH;
        const viewportCap = (vh - VP_MARGIN) / maxNatH;
        const singleScale = Math.max(Math.min(want, SIZE_LOCK, viewportCap), 0);
        // Auch auf #content setzen: robuster CSS-Fallback fuer Inners, die in
        // applyScale nicht erreicht werden (sollte nie passieren, aber defensiv).
        content.style.setProperty("--scale", singleScale.toFixed(4));

        // Schreib-Phase: pro Gruppe eigenen Scale + margin-top berechnen und
        // direkt auf das Inner setzen (CSS-Variable-Vererbung wird damit
        // ueberschrieben; expliziter Inline-Wert hat Vorrang vor #content-Var).
        for (const g of groups) {
            const vis = g.figs.filter(f => f.inner);
            const n = vis.length;

            let groupScale = singleScale;
            if (n > 1) {
                // Stapel-Cap: Summe der skalierten Figuren + Luecken <= vh - VP_MARGIN.
                const totalNatH = vis.reduce((sum, f) => sum + f.natH, 0);
                const stackCap = Math.max(
                    (vh - VP_MARGIN - (n - 1) * INTER_GAP) / totalNatH,
                    0
                );
                groupScale = Math.max(Math.min(want, SIZE_LOCK, viewportCap, stackCap), 0);
            }

            let margin = 0;
            for (let i = 0; i < vis.length; i++) {
                const f = vis[i];
                f.inner.style.setProperty("--scale", groupScale.toFixed(4));
                f.inner.style.marginTop = (i === 0 ? 0 : margin) + "px";
                margin += f.natH * groupScale + INTER_GAP;
            }
        }
    }

    // Alle Layout-wirksamen Werte als KONKRETE Pixel auf #content setzen
    // (v1.4.4): var-direct statt calc+var -> robust gegen Calc-Aufloesungs-
    // Probleme. B = linker Rand der Grafik-Spalte = (1-g)*1150.
    function setLayout() {
        const B = (1 - currentG) * CONTENT_W;
        content.style.setProperty("--g", currentG.toFixed(4));
        content.style.setProperty("--split-left", (B - SPLITTER_HW).toFixed(2) + "px");
        content.style.setProperty("--paper-w", (B - PAPER_GAP).toFixed(2) + "px");
        content.style.setProperty("--gfx-left", (B - CB_OFFSET + GFX_GAP_LEFT).toFixed(2) + "px");
        applyScale();
    }

    function setG(clientX) {
        const rect = content.getBoundingClientRect();
        if (!rect.width) return;
        // Grafik-Anteil = was rechts der Mausposition bleibt.
        currentG = clamp(1 - (clientX - rect.left) / rect.width, G_MIN, G_MAX);
        setLayout();
    }

    function onMove(e) {
        setG(e.clientX);
    }

    function onUp() {
        splitter.classList.remove("active");
        document.body.classList.remove("splitting");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
    }

    function onDown(e) {
        e.preventDefault();
        splitter.classList.add("active");
        document.body.classList.add("splitting");
        setG(e.clientX);
        // Listener auf window, nicht auf dem 8px-Handle: so bleibt der Drag
        // auch dann aktiv, wenn die Maus das Handle verlässt (kein
        // setPointerCapture nötig, das nicht überall verfügbar ist).
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    }

    // Breiten-Modus anwenden: setzt CONTENT_W + #content/#container-Breite als
    // konkrete px, markiert das aktive Toolbar-Segment und rechnet setLayout()
    // neu. persist=false beim Laden (ein geclampter Fallback soll die gespeicherte
    // Præferenz nicht ueberschreiben); persist=true bei Nutzer-Klick.
    function applyMode(mode, persist) {
        if (!WIDTHS[mode]) return;
        currentMode = mode;
        CONTENT_W = WIDTHS[mode];
        content.style.width = CONTENT_W + "px";
        container.style.width = (CONTENT_W + CONTAINER_SLACK) + "px";
        markActiveSegment(mode);
        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
        }
        setLayout();
    }

    function markActiveSegment(mode) {
        document.querySelectorAll('[data-action="set_width_mode"]').forEach(el => {
            el.classList.toggle("active", el.dataset.mode === mode);
        });
    }

    // Start-Modus: gespeicherte Præferenz, sonst Default "normal". Lade-Clamp:
    // falls die Container-Breite des Modus nicht ins Viewport passt, auf den
    // groessten noch passenden Modus fallen (breit->normal->schmal). Wird NICHT
    // persistiert, damit die Original-Præferenz fuer grossere Viewports erhalten
    // bleibt. Explizite Nutzer-Klicks (applyMode via _setMode) werden nicht
    // geclampt -- Overflow ist dann bewusste Wahl.
    function resolveStartMode() {
        let mode = "normal";
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (s && WIDTHS[s]) mode = s;
        } catch (_) {}
        const fits = m => WIDTHS[m] + CONTAINER_SLACK <= window.innerWidth;
        if (!fits(mode)) mode = fits("normal") ? "normal" : "schmal";
        return mode;
    }

    _setMode = (mode) => applyMode(mode, true);

    // Async-Re-Trigger (v1.4.6): applyScale lief urspruenglich nur einmal in
    // init() -- vor MathJax-, Bild- und Font-Load -> veraltete Gaps/natH ->
    // Ueberlappung. Jetzt justiert ein ResizeObserver (rAF-debounced) nach:
    //   - #paper: MathJax-Render (SVGs ersetzen $$-Texte -> Hoehe aendert
    //     sich), Font-Swap, Modus-Wechsel-Reflow -> Gap-Aenderungen;
    //   - .grafik-container-inner: Bild-Load -> natH-Aenderung.
    // Kein Loop: applyScale schreibt --scale (transform, aendert border-box
    // nicht) und marginTop (margin nicht im border-box) -> RO feuert nicht auf
    // eigene Schreibvorgaenge. rAF enthaelt mehrere Feuers in einem Frame.
    let rafId = 0;
    function scheduleApply() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => { rafId = 0; applyScale(); });
    }
    const ro = new ResizeObserver(scheduleApply);
    function observeInners() {
        content.querySelectorAll(".grafik-container-inner").forEach(el => ro.observe(el));
    }
    if (paper) ro.observe(paper);
    observeInners();

    splitter.addEventListener("pointerdown", onDown);
    // Cap hängt von der Viewport-Höhe ab -> bei Resize nur --scale neu berechnen
    // (die übrigen Layout-Werte hängen nur von --g ab, nicht vom Viewport; erst
    // recht seit v1.4.5, wo CONTENT_W nur per Moduswechsel, nicht per Resize
    // steigt). rAF-debounced (v1.4.6).
    window.addEventListener("resize", scheduleApply);
    // Start-Modus anwenden (setzt Breiten + ruft setLayout); ersetzt das fruehere
    // nackte setLayout() am Ende.
    applyMode(resolveStartMode(), false);

    _refresh = () => { observeInners(); scheduleApply(); };
}

// Bruecke fuer make_static() (core.js): test() baut die Inners neu (und leert
// gc6) -> die beobachteten Inners sind weg. Re-Observe + erneuter Layout-Pass.
// Vor init_splitter (oder ohne #content/#splitter) ist _refresh null -> No-op.
let _refresh = null;
export function refresh_figure_layout() {
    if (_refresh) _refresh();
}