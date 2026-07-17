// main.js — Entry-Point (ESM). Importiert die Module und alle Figuren (die
// ihre updateN/animateN/clearN beim Laden auf window registrieren), definiert
// den zentralen Event-Binder (data-action) und init(), und registriert die
// afterprint-/hashchange-Listener. Module sind defer -> DOM bereit; init()
// am Modul-Ende ersetzt das ehemalige <body onload="init()">.

import { interaktiv, generate_highlight_boxes, safari_bug, make_static,
         update_all, toggle_darkmode, test, reload_mathjax, reset, hide,
         init_text_size_controls, adjust_text_size, set_width_mode,
         init_width_mode } from './core.js';
import { generate_toc, offsetAnchor, toc, toc_filter, kontakt, close_zoom, zoom, pause } from './ui.js';
import { init_print, check_print, from_qr } from './print.js';
import { paginate } from './pages.js';
import { init_shell, toggle_drawer, close_drawer, chapter_prev, chapter_next, goto_page } from './shell.js';
import { init_figure_panels, toggle_panel } from './figures/panels.js';
import { init_numbering } from './numbering.js';

// Figuren laden (Seiteneffekt: Registrierung von updateN/animateN/clearN).
import './figures/fig_1.js';
import './figures/fig_3.js';
import './figures/fig_4.js';
import './figures/fig_5.js';
import './figures/fig_6.js';
import './figures/fig_8.js';
import './figures/fig_9.js';
import { initKreisbewegung } from './figures/kreisbewegung/ui.js';

// Zentrales Event-Binding (Stage 2): Inline-Handler sind durch data-action-
// Attribute ersetzt; ein delegierter Listener je Event-Typ dispatcht an die
// globalen Funktionen. data-event="change" markiert <select>/Radio, die wie
// bisher nur auf change (nicht input) reagieren sollen.
function fig_call(prefix, fig, arg) {
    const fn = window[prefix + fig];
    if (!fn) return;
    if (arg !== undefined && arg !== null && arg !== "") fn(arg);
    else fn();
}

function bind_events() {
    document.addEventListener("click", dispatch_click);
    document.addEventListener("input", dispatch_input);
    document.addEventListener("change", dispatch_change);
}

function dispatch_input(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.dataset.event === "change") return;
    if (el.dataset.action === "update") fig_call("update", el.dataset.fig, el.dataset.arg);
    else if (el.dataset.action === "animate") fig_call("animate", el.dataset.fig);
    else if (el.dataset.action === "toc_search") toc_filter(el.value);
}

function dispatch_change(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.dataset.event !== "change") return;
    if (el.dataset.action === "update") fig_call("update", el.dataset.fig, el.dataset.arg);
}

function dispatch_click(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    switch (el.dataset.action) {
        case "toc": toc(); break;
        case "init_print": init_print(); break;
        case "kontakt": kontakt(); break;
        case "adjust_text_size": adjust_text_size(parseInt(el.dataset.step, 10) || 0); break;
        case "set_width_mode": set_width_mode(el.dataset.mode); break;
        case "toggle_darkmode": toggle_darkmode(); break;
        case "close_zoom": close_zoom(); break;
        case "test": test(); break;
        case "reload-mathjax": reload_mathjax(); break;
        case "reset": reset(); break;
        case "clear": fig_call("clear", el.dataset.fig); break;
        case "zoom": zoom(el.parentElement.parentElement); break;
        case "pause-animate": pause(el); fig_call("animate", el.dataset.fig); break;
        case "hide": hide(el.dataset.target); break;
        case "toggle_panel": toggle_panel(el); break;
        case "toggle_drawer": toggle_drawer(); break;
        case "close_drawer": close_drawer(); break;
        case "chapter_prev": chapter_prev(); break;
        case "chapter_next": chapter_next(); break;
        case "goto_page": goto_page(el.dataset.arg); break;
        default: break;
    }
}

function init() {
    bind_events();
    init_text_size_controls();
    init_width_mode();
    generate_highlight_boxes();
    safari_bug();
    // paginate() muss vor generate_toc()/init_shell() laufen: beide lesen das
    // Seitenregister (h2/h3 -> .chapter-page) auf, das paginate() aufbaut.
    paginate();
    generate_toc();
    init_shell();
    init_figure_panels();
    init_numbering();
    offsetAnchor();
    make_static();
    if(interaktiv) {
        update_all();
        initKreisbewegung();
    }
    from_qr();
    check_print();
}

// afterprint: Druck-Parameter aus der URL entfernen (wie im Original auf
// Top-Level registriert, vor init -- Reihenfolge fuer diese Listener unkritisch).
window.addEventListener('afterprint', (event) => {
    window.history.replaceState(null, null, window.location.pathname);
});
window.addEventListener("hashchange", offsetAnchor);

init();