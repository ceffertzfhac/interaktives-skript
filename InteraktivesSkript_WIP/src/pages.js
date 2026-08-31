// pages.js — Client-seitige Paginierung: gruppiert #paper in Ein-Abschnitt-
// pro-Seite-Einheiten (Kapitel-App-Shell), ohne index.html in mehrere Dateien
// zu spalten (s. CLAUDE.md/BACKLOG.md P1b -- das bleibt fuer spaeter, sobald
// ein zweites Kapitel ansteht). Jede .inhaltsverzeichnis-Ueberschrift (h2 =
// Kapitel-Intro, h3 = Unterabschnitt) plus ihr zugehoeriges <section> wird zu
// einer "Seite" (.chapter-page), von denen genau eine sichtbar ist.
//
// Keine Abhaengigkeit auf shell.js (Aufloesung der Zyklenfreiheit wie im Rest
// der App): Seitenwechsel werden per CustomEvent "pagechange" auf document
// gemeldet: shell.js abonniert das.
import { ge } from './core.js';

let pages = []; // [{id, level, title, el, tk}]  tk=null|{num,title}
let currentIndex = 0;
let printSavedIndex = null;

// Zuletzt gelesene Seite (BACKLOG P23-2). Gleiches Muster wie die uebrigen
// Lese-Einstellungen (skript_width_mode/-palette/-text_level in core.js):
// localStorage, Schluessel mit skript_-Praefix.
const LAST_PAGE_KEY = "skript_last_page";
// Im Druck-Tab NICHT mitschreiben: der oeffnet dieselbe Seite mit ?print=true,
// blendet alles ein und springt fuer den QR-Rueckweg ggf. auf eine andere
// Seite -- das ist kein Lesevorgang und darf den Merker nicht ueberschreiben.
const istDruckTab = new URLSearchParams(location.search).get("print") === "true";

// localStorage kann werfen (privates Fenster, Speicher aus, Quota) -- ein
// Merker darf die Paginierung nie lahmlegen, deshalb beide Zugriffe gekapselt.
function ladeLetzteSeite() {
    try { return localStorage.getItem(LAST_PAGE_KEY); } catch (e) { return null; }
}
function merkeLetzteSeite(id) {
    if (istDruckTab) return;
    try { localStorage.setItem(LAST_PAGE_KEY, id); } catch (e) { /* egal */ }
}

function slugFor(headingEl, index) {
    const text = headingEl.textContent.trim();
    const m = text.match(/^([0-9]+(?:\.[0-9]+)*)/);
    return m ? 'p-' + m[1].replace(/\./g, '-') : 'p-' + index;
}

function titleFor(headingEl) {
    return headingEl.textContent.trim();
}

// Gruppiert eine .inhaltsverzeichnis-Ueberschrift + ihr <section> in einen
// .chapter-page-Wrapper. h2 sitzt in der aktuellen Markup-Konvention SELBST
// im <section> (Kapitel-Intro); h3 sitzt als Geschwister VOR seinem <section>
// -- beide Faelle werden hier vereinheitlicht behandelt.
function wrapHeading(headingEl) {
    if (headingEl.parentElement && headingEl.parentElement.tagName === 'SECTION') {
        return headingEl.parentElement;
    }
    const next = headingEl.nextElementSibling;
    const wrapper = document.createElement('div');
    headingEl.parentElement.insertBefore(wrapper, headingEl);
    wrapper.appendChild(headingEl);
    if (next && next.tagName === 'SECTION') {
        wrapper.appendChild(next);
    }
    return wrapper;
}

// Manche Sektionen im gewachsenen Markup haben lose Geschwister-Elemente
// zwischen dem schliessenden </section> und der naechsten Ueberschrift (z.B.
// eine .zusammenfassung ausserhalb ihres <section>) -- ohne diesen Schritt
// blieben sie ausserhalb jeder .chapter-page und wuerden auf JEDER Seite
// sichtbar bleiben. Alles, was kein eigener .chapter-page-Wrapper ist (und
// nicht explizit ausgenommen ist, z.B. die Seiten-Navigation am Ende), wird
// der zuletzt gesehenen Seite angehaengt.
function foldStraySiblings(paper, pageEls) {
    const pageSet = new Set(pageEls);
    let lastPage = null;
    Array.from(paper.children).forEach(child => {
        if (pageSet.has(child)) { lastPage = child; return; }
        if (child.classList.contains('chapter-pagenav')) return;
        if (lastPage) lastPage.appendChild(child);
    });
}

export function paginate() {
    const paper = ge('paper');
    if (!paper) return [];
    const headings = Array.from(paper.querySelectorAll('.inhaltsverzeichnis'));
    pages = headings.map((h, i) => {
        const el = wrapHeading(h);
        el.classList.add('chapter-page');
        const id = slugFor(h, i);
        el.dataset.pageId = id;
        el.dataset.pageLevel = h.tagName.toLowerCase();
        // tk = Themenkomplex (v0.13-\chapter, 3-stufiges TOC, s. BACKLOG P8),
        // von chapters.js vor dem Flatten auf die Überschrift gestempelt
        // (data-tk-num/-title). null, wenn das Kapitel kein TK-Attribut traegt.
        const tk = (h.dataset.tkNum || h.dataset.tkTitle)
            ? { num: h.dataset.tkNum, title: h.dataset.tkTitle }
            : null;
        return { id, level: h.tagName.toLowerCase(), title: titleFor(h), el, tk };
    });
    foldStraySiblings(paper, pages.map(p => p.el));

    // Startseite, in dieser Rangfolge (BACKLOG P23-2):
    //   1. #-Anker in der URL -- ein ausdruecklich geteilter Link gewinnt immer
    //   2. zuletzt gelesene Seite aus localStorage
    //   3. erste Seite
    // Der gespeicherte Wert wird gegen das Seitenregister geprueft: nach einer
    // Migration (Abschnitt umbenannt/entfallen) zeigt er sonst ins Leere.
    const ausAnker = pages.find(p => p.id === location.hash.replace('#', ''));
    const gemerkt = ausAnker ? null : pages.find(p => p.id === ladeLetzteSeite());
    const wanted = ausAnker || gemerkt;
    currentIndex = wanted ? pages.indexOf(wanted) : 0;
    // Ohne Anker, aber mit wiederhergestellter Seite: die URL nachziehen, damit
    // Neuladen/Teilen/Zurueck denselben Zustand treffen wie die Anzeige.
    if (!ausAnker && gemerkt) history.replaceState(null, '', '#' + gemerkt.id);
    applyVisibility();

    window.addEventListener('hashchange', () => {
        const p = pages.find(pg => pg.id === location.hash.replace('#', ''));
        if (p) showPage(p.id, { pushState: false });
    });

    return pages;
}

function applyVisibility() {
    pages.forEach((p, i) => {
        p.el.style.display = i === currentIndex ? '' : 'none';
    });
}

export function getPages() {
    return pages;
}

export function getCurrentIndex() {
    return currentIndex;
}

export function getCurrentPage() {
    return pages[currentIndex] || null;
}

export function showPage(id, opts = {}) {
    const i = pages.findIndex(p => p.id === id);
    if (i === -1 || i === currentIndex) return;
    currentIndex = i;
    applyVisibility();
    merkeLetzteSeite(id);
    if (opts.pushState !== false) {
        history.pushState(null, '', '#' + id);
    }
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('pagechange', { detail: { id, index: i, page: pages[i] } }));
}

export function nextPage() {
    if (currentIndex < pages.length - 1) showPage(pages[currentIndex + 1].id);
}

export function prevPage() {
    if (currentIndex > 0) showPage(pages[currentIndex - 1].id);
}

// Fuer den Druckfluss (print.js): vor dem Klonen von #container alle Seiten
// sichtbar machen (sonst enthaelt der Ausdruck nur die gerade aktive Seite),
// danach die normale Paginierung wiederherstellen.
export function showAllPagesForPrint() {
    printSavedIndex = currentIndex;
    pages.forEach(p => { p.el.style.display = ''; });
}

export function restorePagination() {
    if (printSavedIndex === null) return;
    currentIndex = printSavedIndex;
    printSavedIndex = null;
    applyVisibility();
}
