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
import { paginate, showPage } from './pages.js';
import { init_shell, toggle_drawer, close_drawer, chapter_prev, chapter_next, goto_page } from './shell.js';
import { init_figure_panels, toggle_panel } from './figures/panels.js';
import { init_numbering, resolve_eq_refs } from './numbering.js';
import { loadChapters, typesetAfterLoad } from './chapters.js';
import { init_footnotes, toggle_footnote } from './footnotes.js';
import { init_aspekt_figuren, toggle_aspekt, close_aspekt_overlay, label_aspekt_figuren } from './figures/aspekt_kreisbahn.js';

// Figuren laden (Seiteneffekt: Registrierung von updateN/animateN/clearN).
// Seit v1.7 ist Kapitel 1.4 rein statisch (v0.13-Abbildungen, keine
// interaktiven gcN-Container). Die fig_NN-Module + Kreisbewegung-Figur
// bleiben auf der Platte und werden schrittweise wieder eingebunden, sobald
// die entsprechenden interaktiven Grafiken zurueckkehren — dann hier die
// Imports wieder aktivieren:
//   import './figures/fig_1.js';
//   import './figures/fig_3.js';
//   import './figures/fig_4.js';
//   import './figures/fig_5.js';
//   import './figures/fig_6.js';
//   import './figures/fig_8.js';
//   import './figures/fig_9.js';
//   import { initKreisbewegung } from './figures/kreisbewegung/ui.js';

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
        case "toggle_footnote": toggle_footnote(el); break;
        case "toggle_aspekt": toggle_aspekt(el); break;
        case "close_aspekt_overlay": if (e.target === el) close_aspekt_overlay(); break;
        case "toggle_drawer": toggle_drawer(); break;
        case "close_drawer": close_drawer(); break;
        case "chapter_prev": chapter_prev(); break;
        case "chapter_next": chapter_next(); break;
        case "goto_page": goto_page(el.dataset.arg); break;
        default: break;
    }
}

async function init() {
    bind_events();
    init_text_size_controls();
    init_width_mode();
    // Kapitel-Fragmente holen + injizieren + flachen, BEVOR irgendetwas auf
    // den Kapitel-DOM loslaeuft (highlight boxes, paginate, toc, shell,
    // figure panels, numbering). await, damit die Injektion steht.
    await loadChapters();
    generate_highlight_boxes();
    safari_bug();
    // paginate() muss vor generate_toc()/init_shell() laufen: beide lesen das
    // Seitenregister (h2/h3 -> .chapter-page) auf, das paginate() aufbaut.
    paginate();
    generate_toc();
    init_shell();
    init_figure_panels();
    init_footnotes();
    init_aspekt_figuren();
    init_numbering();
    label_aspekt_figuren();   // Nummer der statischen Abb. in die interaktive Bildunterschrift
    // Injizierte Formeln re-typesetzen, sobald MathJax bereit ist (Gate wie
    // numbering.js). renumber laeuft ueber reload_mathjax mit.
    typesetAfterLoad();
    offsetAnchor();
    make_static();
    if(interaktiv) {
        update_all();
        // initKreisbewegung() entfaellt v1.7 (kein gc10-Container mehr in
        // Kapitel 1.4); s. auskommentierte Imports oben.
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

// Seitenbewusste Sprungmarken: das Skript zeigt immer nur eine .chapter-page,
// ein reiner #anker-Link wuerde bei einem Ziel auf einer anderen Seite ins
// Leere laufen. Daher zentral abfangen -- erst die Zielseite einblenden, dann
// zum Element scrollen. Deckt alle Querverweise ab (Abbildung/Abschnitt/Formel)
// und bleibt gueltig fuer alles, was kuenftig #-Links erzeugt.
document.addEventListener('click', (event) => {
    const a = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!a) return;
    const raw = a.getAttribute('href').slice(1);
    if (!raw) return;
    const id = decodeURIComponent(raw);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const pageEl = target.closest('.chapter-page');
    if (pageEl && pageEl.dataset.pageId) showPage(pageEl.dataset.pageId);
    // Ist das Ziel selbst die Seite, reicht der Seitenwechsel.
    if (target !== pageEl) target.scrollIntoView({ block: 'center' });
    offsetAnchor();
});

init();