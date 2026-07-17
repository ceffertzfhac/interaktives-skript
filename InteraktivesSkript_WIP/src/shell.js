// shell.js — Kapitel-App-Shell: zweite App-Leiste (Breadcrumb + Fortschritt +
// Hamburger), linke Rail (Seiten-Landmarken + Kapitel-Mininav), rechte
// Marginalie (verschiebt .anmerkung-Boxen der aktiven Seite dorthin) und die
// Tablet-Drawer-Variante derselben Rail-Inhalte. Reagiert auf das
// "pagechange"-Event aus pages.js (keine Abhaengigkeit auf pages.js -> ui.js/
// core.js bleiben die einzigen Importe, Zyklenfreiheit wie im Rest der App).
import { ge, show, hide } from './core.js';
import { getPages, getCurrentIndex, getCurrentPage, showPage } from './pages.js';

// original[el] = {parent, next} -- fuer restoreMarginalia() vor dem Druck.
const movedAnmerkungen = new Map();

function clearMarginalia() {
    const col = ge('chapter_marginalia_body');
    if (!col) return;
    // Vorher verschobene Boxen an ihren urspruenglichen Platz zurueckstellen,
    // bevor die naechste Seite ihre eigenen Anmerkungen hereinholt.
    restoreMarginalia();
    col.innerHTML = '';
}

export function restoreMarginalia() {
    movedAnmerkungen.forEach(({ parent, next }, el) => {
        if (next && next.parentElement === parent) parent.insertBefore(el, next);
        else parent.appendChild(el);
    });
    movedAnmerkungen.clear();
}

function renderMarginalia(page) {
    const col = ge('chapter_marginalia_body');
    const box = ge('chapter_marginalia');
    if (!col || !box) return;
    clearMarginalia();
    const notes = page ? Array.from(page.el.querySelectorAll('.anmerkung')) : [];
    if (notes.length === 0) { hide('chapter_marginalia'); return; }
    show('chapter_marginalia');
    const heading = document.createElement('div');
    heading.className = 'rail-heading';
    heading.textContent = 'Anmerkungen';
    col.appendChild(heading);
    notes.forEach(el => {
        movedAnmerkungen.set(el, { parent: el.parentElement, next: el.nextElementSibling });
        col.appendChild(el);
    });
}

// "Auf dieser Seite": Sprungmarken zu Highlight-Boxen + Grafiken der aktiven
// Seite. Highlight-Boxen tragen nach generate_highlight_boxes() bereits einen
// Titel (.highlight_box_title); Grafiken bekommen ihren Sektionstitel als Label.
function landmarksFor(page) {
    if (!page) return [];
    const items = [];
    let n = 0;
    page.el.querySelectorAll('.lernziel, .motivation, .wiederholung, .beispiel, .zusammenfassung, .aufgabe, .anmerkung').forEach(el => {
        if (!el.id) el.id = page.id + '-landmark-' + (n++);
        const t = el.querySelector('.highlight_box_title');
        items.push({ id: el.id, label: t ? t.textContent : 'Abschnitt' });
    });
    page.el.querySelectorAll('.grafik-container').forEach(el => {
        if (!el.id) return;
        items.push({ id: el.id, label: el.dataset.title || 'Interaktive Simulation' });
    });
    return items;
}

function renderRailInto(container, page) {
    if (!container) return;
    container.innerHTML = '';

    const onPage = document.createElement('div');
    onPage.className = 'rail-block';
    const onPageHeading = document.createElement('div');
    onPageHeading.className = 'rail-heading';
    onPageHeading.textContent = 'Auf dieser Seite';
    onPage.appendChild(onPageHeading);
    const nav = document.createElement('nav');
    nav.className = 'rail-onpage';
    const marks = landmarksFor(page);
    if (marks.length === 0) {
        const span = document.createElement('span');
        span.className = 'rail-empty';
        span.textContent = '—';
        nav.appendChild(span);
    } else {
        marks.forEach(m => {
            const a = document.createElement('a');
            a.href = '#' + m.id;
            a.textContent = m.label;
            nav.appendChild(a);
        });
    }
    onPage.appendChild(nav);
    container.appendChild(onPage);

    const chapterPages = getPages().filter(p => p.level === 'h3');
    if (chapterPages.length === 0) return;
    const chBlock = document.createElement('div');
    chBlock.className = 'rail-block rail-chapter';
    const chTitle = getPages()[0] ? getPages()[0].title.replace(/^[0-9.]+\s*/, '') : 'Kapitel';
    const chHeading = document.createElement('div');
    chHeading.className = 'rail-heading';
    chHeading.textContent = chTitle;
    chBlock.appendChild(chHeading);
    const chNav = document.createElement('div');
    chNav.className = 'rail-chapternav';
    chapterPages.forEach(p => {
        const a = document.createElement('a');
        a.href = '#' + p.id;
        a.className = 'rail-chapterlink' + (p === getCurrentPage() ? ' current' : '');
        a.innerHTML = '<span class="rail-dot">' + (p === getCurrentPage() ? '●' : '○') + '</span>' + p.title;
        // data-action statt eigenem Listener (zentraler Binder, s. main.js).
        a.dataset.action = 'goto_page';
        a.dataset.arg = p.id;
        chNav.appendChild(a);
    });
    chBlock.appendChild(chNav);
    container.appendChild(chBlock);
}

function renderAppbar(page) {
    const crumbChapter = ge('chapter_crumb_chapter');
    const crumbCurrent = ge('chapter_crumb_current');
    const progress = ge('chapter_progress_label');
    const progressBar = ge('chapter_progress_bar');
    const pages = getPages();
    if (!pages.length) return;
    if (crumbChapter) crumbChapter.textContent = pages[0].title;
    if (crumbCurrent) crumbCurrent.textContent = page ? page.title : '';
    const idx = getCurrentIndex() + 1;
    if (progress) progress.textContent = 'Seite ' + idx + '/' + pages.length;
    if (progressBar) progressBar.style.width = Math.round((idx / pages.length) * 100) + '%';
}

function renderPrevNext(page) {
    const pages = getPages();
    const i = getCurrentIndex();
    const prevBtn = ge('chapter_prev_btn');
    const nextBtn = ge('chapter_next_btn');
    if (prevBtn) prevBtn.disabled = i <= 0;
    if (nextBtn) nextBtn.disabled = i >= pages.length - 1;
}

function renderAll() {
    const page = getCurrentPage();
    renderAppbar(page);
    renderRailInto(ge('chapter_rail_desktop'), page);
    renderRailInto(ge('chapter_rail_drawer'), page);
    renderMarginalia(page);
    renderPrevNext(page);
}

export function init_shell() {
    if (getPages().length === 0) return;
    renderAll();
    document.addEventListener('pagechange', renderAll);
}

// -- data-action-Ziele (aufgerufen aus main.js's dispatch_click) -------------
export function toggle_drawer() {
    const drawer = ge('chapter_drawer');
    if (!drawer) return;
    drawer.classList.contains('hidden') ? show('chapter_drawer') : hide('chapter_drawer');
}
export function close_drawer() { hide('chapter_drawer'); }
export function chapter_prev() { prevChapterPage(); }
export function chapter_next() { nextChapterPage(); }
export function goto_page(id) { showPage(id); close_drawer(); }

function prevChapterPage() {
    const pages = getPages();
    const i = getCurrentIndex();
    if (i > 0) showPage(pages[i - 1].id);
}
function nextChapterPage() {
    const pages = getPages();
    const i = getCurrentIndex();
    if (i < pages.length - 1) showPage(pages[i + 1].id);
}
