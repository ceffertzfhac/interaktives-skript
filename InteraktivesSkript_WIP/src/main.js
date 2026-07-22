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
import { toggle_aspekt, close_aspekt_overlay, toggle_analyse, toggle_panel_left, buildKreisbahnFig } from './figures/aspekt_kreisbahn.js';
import { buildWegZeitFig } from './figures/aspekt_weg_zeit.js';

// Aspekt-Figuren: jede .aspekt-figur wird ueber data-aspekt einer Factory
// zugeordnet, die ihre EIGENE Motor-Instanz (Prefix + storeInstance) baut
// (s. kreisbewegung/runtime.js) -> beliebig viele Figuren, auch auf derselben
// Seite, sind vollstaendig unabhaengig. Eager-Bau aller Figuren beim Init.
const ASPEKT_FACTORIES = { 'kreisbahn': buildKreisbahnFig, 'weg-zeit': buildWegZeitFig };

function init_aspekt_figuren() {
    document.querySelectorAll('.aspekt-figur[data-aspekt]').forEach(fig => {
        const build = ASPEKT_FACTORIES[fig.dataset.aspekt];
        if (build) build(fig);
        // Linkes Bedienfeld einklappbar (seitlich): Kopf-Taste ins linke Panel
        // setzen — spart Platz fuer Simulation/Diagramm. Generisch fuer jede
        // .aspekt-figur (s. toggle_panel_left in aspekt_kreisbahn.js).
        const pl = fig.querySelector('.aspekt-panel-left');
        if (pl && !pl.querySelector('.panel-header')) {
            const hdr = document.createElement('button');
            hdr.type = 'button';
            hdr.className = 'panel-header panel-header-left';
            hdr.dataset.action = 'toggle_panel_left';
            hdr.setAttribute('aria-expanded', 'true');
            hdr.title = 'Bedienfeld ein-/ausklappen';
            hdr.innerHTML = '<span class="ph-label">Bedienung</span>' +
                '<svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 4 L8 8 L13 12"/><path d="M8 4 L3 8 L8 12"/></svg>';
            pl.prepend(hdr);
        }
        // Physik-Sektion im rechten Panel (nur wenn die Figur relevante
        // Gleichungen deklariert). Der Inhalt — die gerenderten Formeln — wird
        // erst nach dem MathJax-Typeset von fill_physik_panels() eingefuellt
        // (s. unten), weil die Gleichungen im DOM erst dann existieren.
        if (fig.dataset.eqs) {
            const body = fig.querySelector('.aspekt-panel-right .panel-body');
            if (body && !body.querySelector('.physik-list')) {
                const sec = document.createElement('div');
                sec.className = 'panel-section';
                const lbl = document.createElement('div');
                lbl.className = 'panel-label';
                lbl.textContent = 'Physik';
                const list = document.createElement('div');
                list.className = 'physik-list';
                list.id = fig.id + '-physik';
                sec.appendChild(lbl);
                sec.appendChild(list);
                body.insertBefore(sec, body.firstChild);
            }
        }
    });
}

// Fuellt die Physik-Sektionen der rechten Seitenleisten: pro .aspekt-figur
// werden die in data-eqs genannten Gleichungen UNNUMMERIERT gerendert —
// LaTeX-Quelle aus window.eq_latex (s. chapters.js::captureEqLatex, vor dem
// MathJax-Typeset vom rohen Kapitel-HTML erfasst) als \[...\] neu gesetzt,
// ohne Formelnummer, optisch an die Stand-alone-Vorlagen angelehnt. So
// steht wirklich nur die Formel, die zur aktuellen Figur an der aktuellen
// Skriptstelle gehoert. Laeuft erst, nachdem MathJax fertig ist (aufgerufen
// aus chapters.js::typesetAfterLoad, analog window.resolve_eq_refs).
// Idempotent via dataset.filled; gibt das Typeset-Promise zurueck.
function fill_physik_panels() {
    const src = window.eq_latex || {};
    const jobs = [];
    document.querySelectorAll('.aspekt-figur[data-eqs]').forEach(fig => {
        const box = fig.querySelector('.physik-list');
        if (!box || box.dataset.filled) return;
        const want = fig.dataset.eqs.trim().split(/\s+/);
        let any = false;
        want.forEach(key => {
            const displayMath = src[key];
            if (!displayMath) return;
            const el = document.createElement('div');
            el.className = 'physik-eq';
            el.textContent = displayMath;   // schon \[...\] bzw. \begin{align*}…\end{align*}
            box.appendChild(el);
            any = true;
        });
        if (any) { box.dataset.filled = '1'; jobs.push(box); }
    });
    if (jobs.length && window.MathJax && window.MathJax.typesetPromise) {
        return window.MathJax.typesetPromise(jobs);
    }
}
window.fill_physik_panels = fill_physik_panels;

// Nach init_numbering: Nummer der zugehoerigen statischen Abbildung (data-figref)
// in die interaktive Bildunterschrift uebernehmen (am Bildschirm sichtbar).
function label_aspekt_figuren() {
    document.querySelectorAll('.aspekt-figur[data-figref]').forEach(fig => {
        const ref = document.getElementById(fig.dataset.figref);
        const label = ref && ref.querySelector('.fig-label');
        const cap = fig.querySelector('.aspekt-caption');
        if (!label || !cap) return;
        let badge = cap.querySelector(':scope > .fig-label');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'fig-label';
            cap.insertBefore(document.createTextNode(' '), cap.firstChild);
            cap.insertBefore(badge, cap.firstChild);
        }
        badge.textContent = label.textContent;
    });
}

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
        case "toggle_analyse": toggle_analyse(el); break;
        case "toggle_panel_left": toggle_panel_left(el); break;
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
    // Ziel ist entweder ein Element mit dieser id (Abbildung #fig-…, Formel
    // #eq-…) ODER eine Seite, die ihre id nur als data-page-id traegt
    // (Abschnitts-Links #p-1-4-5 -- pages.js setzt kein id-Attribut). Beide
    // Faelle abdecken, sonst navigieren Abschnitts-Links nicht.
    const target = document.getElementById(id);
    const pageEl = (target && target.closest('.chapter-page'))
        || document.querySelector('.chapter-page[data-page-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (!target && !pageEl) return;
    event.preventDefault();
    if (pageEl && pageEl.dataset.pageId) showPage(pageEl.dataset.pageId);
    // Ist das Ziel ein Element innerhalb der Seite (nicht die Seite selbst),
    // dorthin scrollen.
    if (target && target !== pageEl) target.scrollIntoView({ block: 'center' });
    offsetAnchor();
});

init();