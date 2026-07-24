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

// Seitenregister in Abschnitte gruppieren: jede h2-Seite eroeffnet einen
// Abschnitt, die folgenden h3-Seiten gehoeren dazu. Schiene und Kopfleiste
// nutzen dieselbe Gruppierung.
function sectionsOf() {
    const sections = [];
    getPages().forEach(p => {
        if (p.level === 'h2') sections.push({ page: p, children: [] });
        else if (sections.length) sections[sections.length - 1].children.push(p);
    });
    return sections;
}

// Abschnitt, in dem die uebergebene Seite liegt (Kapitel-Intro eingeschlossen).
function activeSection(sections, page) {
    return sections.find(s => s.page === page || s.children.indexOf(page) >= 0) || null;
}

// "Auf dieser Seite": Sprungmarken zu Highlight-Boxen + Grafiken der aktiven
// Seite. Highlight-Boxen tragen nach generate_highlight_boxes() bereits einen
// Titel (.highlight_box_title); Grafiken bekommen ihren Sektionstitel als Label.
function landmarksFor(page) {
    if (!page) return [];
    const items = [];
    let n = 0;
    // Bemerkungen/Anmerkungen bleiben bewusst weg (Anmerkungen wandern in die
    // Marginalie, Bemerkungen wuerden die Liste nur zupflastern) — dafuer
    // erscheinen die interaktiven Abbildungen (s.u.). Ein EINZIGER combined
    // Selektor statt zweier Durchlaeufe: querySelectorAll liefert sowieso
    // Dokumentreihenfolge, zwei getrennte Durchlaefe haetten erst alle Boxen,
    // dann alle Figuren gelistet — nicht die Reihenfolge im Skript.
    const FIG = new Set(['grafik-container', 'aspekt-figur']);
    page.el.querySelectorAll('.lernziel, .motivation, .wiederholung, .beispiel, .zusammenfassung, .aufgabe, .wichtig, .grafik-container, .aspekt-figur').forEach(el => {
        if ([...el.classList].some(c => FIG.has(c))) {
            if (!el.id) return;
            items.push({ id: el.id, label: el.dataset.title || 'Interaktive Abbildung' });
        } else {
            if (!el.id) el.id = page.id + '-landmark-' + (n++);
            const t = el.querySelector('.highlight_box_title');
            items.push({ id: el.id, label: t ? t.textContent : 'Abschnitt' });
        }
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

    // Abschnittsnavigation gefenstert (P9): nur drei Blöcke um das aktive
    // Kapitel — Vorgänger-Kapitel (zu, nur die Zeile), aktives Kapitel (mit
    // allen h3-Abschnitten offen) und Nachfolger-Kapitel (zu). Vorgänger/
    // Nachfolger nur innerhalb desselben Themenkomplexes (P9-Entscheidung a):
    // TK-Gruppen liegen im Seitenregister zusammenhängend, also ist der
    // unmittelbar vorangehende/nachfolgende Abschnitt der Kandidat — gehört
    // er einem anderen TK (oder hat kein tk), entfällt er (das aktive Kapitel
    // ist das erste bzw. letzte seines TK). So bleibt die Schiene bei 15+
    // Kapiteln kurz, und die Nachbarn ("1.3 …", "1.5 …") sind einen Klick
    // entfernt, ohne die Liste zu fluten.
    const sections = sectionsOf();
    if (sections.length === 0) return;
    const current = getCurrentPage();
    const active = activeSection(sections, current) || sections[0];

    const chBlock = document.createElement('div');
    chBlock.className = 'rail-block rail-chapter';
    const chHeading = document.createElement('div');
    chHeading.className = 'rail-heading';
    chHeading.textContent = 'Abschnitte';
    chBlock.appendChild(chHeading);
    const chNav = document.createElement('div');
    chNav.className = 'rail-chapternav';

    const link = (p, cls, dot) => {
        const a = document.createElement('a');
        a.href = '#' + p.id;
        a.className = cls + (p === current ? ' current' : '');
        if (dot) {
            a.innerHTML = '<span class="rail-dot">' + (p === current ? '●' : '○') + '</span>';
            a.appendChild(document.createTextNode(p.title));
        } else {
            a.textContent = p.title;
        }
        // data-action statt eigenem Listener (zentraler Binder, s. main.js).
        a.dataset.action = 'goto_page';
        a.dataset.arg = p.id;
        return a;
    };

    const tkOf = s => s.page.tk ? s.page.tk.num + '|' + s.page.tk.title : null;
    const activeTk = tkOf(active);
    const activeIdx = sections.indexOf(active);
    const prevSec = activeIdx > 0 ? sections[activeIdx - 1] : null;
    const nextSec = activeIdx < sections.length - 1 ? sections[activeIdx + 1] : null;
    const pred = prevSec && tkOf(prevSec) === activeTk ? prevSec : null;
    const next = nextSec && tkOf(nextSec) === activeTk ? nextSec : null;
    // TK-Grenze weich andeuten (P9): ist das aktive Kapitel das letzte seines TK
    // (kein gleich-TK-Nachfolger), folgt nach einer duennen Trennlinie das erste
    // Kapitel des naechsten TK als blasse Vorschau — statt eines harten Bruchs.
    // Nur vorwaerts: am Anfang eines TK wird kein voriger TK gezeigt (P9-
    // Entscheidung a, s. Backlog).
    const crossNext = (!next && nextSec && tkOf(nextSec) !== activeTk) ? nextSec : null;

    // Vorgänger (zu) · aktives Kapitel (offen, mit allen Abschnitten) ·
    // Nachfolger (zu). Aktive Zeile erscheint stets, auch als reine Intro-Seite
    // ohne Abschnitte (P9-Entscheidung b).
    const renderSection = (s, istAktiv) => {
        chNav.appendChild(link(s.page, 'rail-sectionlink' + (istAktiv ? ' open' : ''), false));
        if (istAktiv) s.children.forEach(p => chNav.appendChild(link(p, 'rail-chapterlink', true)));
    };
    if (pred) renderSection(pred, false);
    renderSection(active, true);
    if (next) renderSection(next, false);
    if (crossNext) {
        const sep = document.createElement('hr');
        sep.className = 'rail-tk-sep';
        chNav.appendChild(sep);
        chNav.appendChild(link(crossNext.page, 'rail-sectionlink rail-tk-cross', false));
    }

    chBlock.appendChild(chNav);
    container.appendChild(chBlock);
}

function renderAppbar(page) {
    const crumbThemenkomplex = ge('chapter_crumb_themenkomplex');
    const crumbChapter = ge('chapter_crumb_chapter');
    const crumbCurrent = ge('chapter_crumb_current');
    const progress = ge('chapter_progress_label');
    const progressBar = ge('chapter_progress_bar');
    const pages = getPages();
    if (!pages.length) return;
    // Themenkomplex-Krume (oberste Ebene, P8): page.tk der aktiven Seite
    // (v0.13-\chapter, z. B. „0 Grundlagen"). Bleibt leer, wenn das Kapitel
    // kein TK-Attribut traegt (tk === null).
    if (crumbThemenkomplex) crumbThemenkomplex.textContent = (page && page.tk) ? page.tk.title : '';
    // Kapitel-Krume = die naechste h2-Seite oberhalb der aktiven, nicht
    // pauschal pages[0] -- sonst zeigt sie ab dem zweiten Kapitel weiterhin
    // den Titel des ersten an.
    if (crumbChapter) {
        const from = Math.max(0, getCurrentIndex());
        let chapterPage = pages[0];
        for (let i = from; i >= 0; i--) {
            if (pages[i].level === 'h2') { chapterPage = pages[i]; break; }
        }
        crumbChapter.textContent = chapterPage.title;
    }
    if (crumbCurrent) crumbCurrent.textContent = page ? page.title : '';
    // Fortschritt kapitelrelativ, nicht dokumentweit: eine "Seite" ist hier ein
    // Unterabschnitt, davon hat ein Kapitel gut ein Dutzend -- eine Groesse, die
    // man als Fortschritt erlebt. Dokumentweit waere die Zahl bei 15+ Kapiteln
    // nicht nur entmutigend, sondern auch instabil: jeder nachtraeglich
    // migrierte Abschnitt verschoebe alle folgenden Seitenzahlen. Der Ort im
    // Buch steht ohnehin in der Krume und in der Schiene. Der Gesamtstand
    // bleibt als title/aria-label abrufbar, ohne eine zweite Zahl zu zeigen.
    const sections = sectionsOf();
    const active = activeSection(sections, page);
    const seiten = active ? [active.page].concat(active.children) : pages;
    const pos = Math.max(0, seiten.indexOf(page)) + 1;
    if (progress) progress.textContent = pos + ' / ' + seiten.length;
    if (progressBar) {
        progressBar.style.width = Math.round((pos / seiten.length) * 100) + '%';
        const box = progressBar.closest('.chapter-progress');
        if (box) {
            const nr = active ? sections.indexOf(active) + 1 : 1;
            box.title = 'Seite ' + pos + ' von ' + seiten.length + ' in diesem Abschnitt'
                + '  ·  Abschnitt ' + nr + ' von ' + sections.length
                + '  ·  insgesamt Seite ' + (getCurrentIndex() + 1) + ' von ' + pages.length;
            box.setAttribute('aria-label', box.title);
        }
    }
}

function renderPrevNext(page) {
    const pages = getPages();
    const i = getCurrentIndex();
    const atFirst = i <= 0;
    const atLast = i >= pages.length - 1;
    // Untere Tasten im Papier …
    const prevBtn = ge('chapter_prev_btn');
    const nextBtn = ge('chapter_next_btn');
    if (prevBtn) prevBtn.disabled = atFirst;
    if (nextBtn) nextBtn.disabled = atLast;
    // … und die dezenteren Tasten oben rechts im Header (gleiche Aktionen).
    const hPrev = ge('header_prev_btn');
    const hNext = ge('header_next_btn');
    if (hPrev) hPrev.disabled = atFirst;
    if (hNext) hNext.disabled = atLast;
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
