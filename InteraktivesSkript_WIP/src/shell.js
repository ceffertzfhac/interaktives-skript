// shell.js — Kapitel-App-Shell: zweite App-Leiste (Breadcrumb + Fortschritt +
// Hamburger), linke Rail (Seiten-Landmarken + Kapitel-Mininav), rechte
// Marginalie (verschiebt .anmerkung-Boxen der aktiven Seite dorthin) und die
// Tablet-Drawer-Variante derselben Rail-Inhalte. Reagiert auf das
// "pagechange"-Event aus pages.js (keine Abhaengigkeit auf pages.js -> ui.js/
// core.js bleiben die einzigen Importe, Zyklenfreiheit wie im Rest der App).
import { ge, show, hide, BOX_ICONS } from './core.js';
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
// Piktogramme fuer die beiden Eintragsarten, die KEINE Highlight-Box sind.
// Inline statt als Datei (Nutzerentscheidung 2026-08-31): sie faerben sich
// ueber currentColor automatisch mit Darkmode und Palette mit, und es kommt
// keine zweite Zuordnungsstelle dazu. Die Box-Typen kommen aus core.js::
// BOX_ICONS — eine Quelle, s. dort.
const FIG_ICONS = {
    // Rahmen mit Berg + Sonne: die statische Abbildung.
    abbildung: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">'
             + '<rect x="1.6" y="2.6" width="12.8" height="10.8" rx="1.6"/>'
             + '<circle cx="5.6" cy="6.2" r="1.1"/><path d="M2.4 12 L6.4 8.2 L9 10.6 L11 9 L13.6 11.6"/></svg>',
    // Regler-Schieber: die interaktive Figur (dasselbe Sinnbild wie die Regler
    // im Bedienfeld).
    figur:     '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">'
             + '<path d="M2 4.6h12M2 11.4h12"/><circle cx="6" cy="4.6" r="1.9" fill="currentColor" stroke="none"/>'
             + '<circle cx="10.6" cy="11.4" r="1.9" fill="currentColor" stroke="none"/></svg>',
};

// Kurztitel: bis zum ersten Doppelpunkt, Komma oder oeffnenden Klammer.
// Die data-title der Figuren sind bewusst ganze Saetze (sie dienen zugleich als
// Tooltip); in der Schiene stuenden sie sonst ueber vier Zeilen — der laengste
// hatte 131 Zeichen (BACKLOG P24). Der volle Text bleibt im title-Attribut.
function kurzTitel(text) {
    if (!text) return '';
    // Inline-Mathematik entpacken, BEVOR getrennt wird: \(x\)-Komponente ist
    // im Quelltext eine Klammer, und die Trennung an "(" schnitt mitten hinein
    // — aus "Die \(x\)-Komponente …" wurde der Eintrag "Die". Der Inhalt
    // bleibt als Klartext stehen (die Schiene setzt keine Formeln, s. P24).
    text = text.replace(/\\\(([^]*?)\\\)/g, '$1').replace(/\\[a-zA-Z]+/g, '').trim();
    // Auch am SATZENDE trennen, nicht nur an Doppelpunkt/Komma/Klammer: die
    // Beschriftungen der statischen Abbildungen sind ganze Absaetze ohne
    // Doppelpunkt (laengster gemessener Eintrag 267 Zeichen). Der Punkt zaehlt
    // nur, wenn ihm mindestens zwei Kleinbuchstaben vorangehen — sonst wuerde
    // "z. B." mitten im Satz trennen.
    // Getrennt wird an Doppelpunkt, Komma, Semikolon oder Satzende — NICHT an
    // der oeffnenden Klammer: in deutscher Prosa steht die mitten im Satz
    // ("Die (physikalische) Bahn eines Objektes …"), und die Trennung dort
    // ergab den Eintrag "Die". Der Punkt zaehlt nur, wenn ihm mindestens zwei
    // Kleinbuchstaben vorangehen, sonst traefe es "z. B.".
    const m = text.match(/^[\s\S]*?(?=[:;,]|(?<=[a-zäöüß]{2})\.\s)/);
    let t = (m ? m[0] : text).trim() || text.trim();
    // Ein sehr kurzes Bruchstueck sagt nichts — dann lieber den vollen Text
    // nehmen und ihn unten auf die Laenge kuerzen.
    if (t.length < 12) t = text.trim();
    // Harte Grenze an der Wortgrenze. Die Zwei-Zeilen-Klemme im CSS faengt die
    // Anzeige ohnehin ab, aber sie ist eine ANZEIGE-Regel: ohne sie (aelterer
    // Browser, Druck, Vorlese-Werkzeug) stuende der ganze Absatz da. Manche
    // Beschriftungen sind EIN langer Satz ohne fruehe Interpunktion — der
    // laengste gemessene hatte 218 Zeichen.
    // 60 statt 90 Zeichen: zwei Zeilen der 220-px-Schiene fassen bei 0,82 em
    // rund 2 x 30 Zeichen. Mit 90 stand im DOM mehr, als die Klemme je zeigt —
    // der Rest war unsichtbarer Ballast (und im Druck bzw. Vorlese-Werkzeug
    // sichtbarer Ballast).
    const MAX = 60;
    if (t.length > MAX) {
        const schnitt = t.lastIndexOf(' ', MAX);
        t = t.slice(0, schnitt > 40 ? schnitt : MAX).trim() + '…';
    }
    return t;
}

// Ein Schienen-Eintrag: { id, typ, nummer, titel, voll }.
//   typ    -> Piktogramm (Box-Typ aus BOX_ICONS, sonst 'figur'/'abbildung')
//   nummer -> "1.4.1" bzw. "Abb. 1.9"; steht vor dem Titel, damit der Bezug
//             zum Fliesstext und zu Querverweisen erhalten bleibt
//   titel  -> Kurztitel, per CSS auf zwei Zeilen geklemmt
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
    // Statische Abbildungen kommen mit hinein (Nutzervorgabe 2026-08-31), aber
    // NUR eigenstaendige: steckt die Abbildung in einer Box (Beispiel,
    // Aufgabe …), ist die Box bereits als Eintrag gelistet — die Abbildung
    // darin waere ein zweiter Eintrag fuer dieselbe Stelle.
    const BOX_SEL = '.lernziel, .motivation, .wiederholung, .beispiel, .zusammenfassung, .aufgabe, .wichtig, .bemerkung, .anmerkung';
    page.el.querySelectorAll('.lernziel, .motivation, .wiederholung, .beispiel, .zusammenfassung, .aufgabe, .wichtig, .grafik-container, .aspekt-figur, figure.abbildung').forEach(el => {
        if (el.tagName === 'FIGURE') {
            // .nur-druck ist am Bildschirm unsichtbar (Druck-Fallback einer
            // interaktiven Figur) — ein Schienen-Eintrag dorthin fuehrte ins
            // Leere; die interaktive Figur daneben ist ohnehin gelistet.
            if (el.classList.contains('nur-druck')) return;
            if (el.closest(BOX_SEL)) return;
            if (!el.id) el.id = page.id + '-abb-' + (n++);
            const cap = el.querySelector('figcaption');
            const lab = cap && cap.querySelector(':scope > .fig-label');
            // Beschriftung ohne das vorangestellte "Abb. 1.n"-Label.
            const voll = cap
                ? cap.textContent.replace(lab ? lab.textContent : '', '').trim()
                : 'Abbildung';
            items.push({
                id: el.id, typ: 'abbildung',
                nummer: lab ? lab.textContent.trim() : '',
                titel: kurzTitel(voll), voll,
            });
            return;
        }
        if ([...el.classList].some(c => FIG.has(c))) {
            if (!el.id) return;
            const voll = el.dataset.title || 'Interaktive Abbildung';
            // Nummer aus der Bildunterschrift: label_aspekt_figuren() traegt
            // dort "Abb. 1.n" der statischen Abbildung ein (main.js). Laeuft
            // vor init_shell(), steht hier also schon.
            const lab = el.querySelector('.aspekt-caption > .fig-label');
            items.push({
                id: el.id,
                typ: el.classList.contains('aspekt-figur') ? 'figur' : 'abbildung',
                nummer: lab ? lab.textContent.trim() : '',
                titel: kurzTitel(voll),
                voll,
            });
        } else {
            if (!el.id) el.id = page.id + '-landmark-' + (n++);
            const t = el.querySelector('.highlight_box_title');
            const typEl = t && t.querySelector('.hb-type');   // "Beispiel 1.4.1"
            const nameEl = t && t.querySelector('.hb-name');  // ": Titel"
            const typ = [...el.classList].find(c => c in BOX_ICONS) || '';
            // Aus "Beispiel 1.4.1" nur die Nummer: der Typ steckt im Piktogramm.
            const nummer = typEl ? (typEl.textContent.trim().match(/[\d.]+$/) || [''])[0] : '';
            const titel = nameEl ? nameEl.textContent.replace(/^[:\s]+/, '').trim() : '';
            items.push({
                id: el.id, typ, nummer, titel,
                voll: t ? t.textContent.trim() : 'Abschnitt',
            });
        }
    });
    unterscheideGleiche(items);
    return items;
}

// Mehrere Eintraege einer Seite koennen denselben Kurztitel tragen — die
// Abbildungen 1.4-1.7 heissen alle "Senkrechter Wurf" und unterscheiden sich
// erst hinter dem Doppelpunkt, den der Kurztitel abschneidet. Dann bekommen
// sie (a), (b), … in Dokumentreihenfolge (Nutzervorgabe 2026-08-31: "im falle
// identischer bezeichnungen wuerde ich mit (a), (b)... arbeiten").
// Bewusst je SEITE, nicht dokumentweit: die Schiene zeigt immer nur eine Seite,
// und ein (c) ohne sichtbares (a) daneben waere ratlos machend.
// Ab dem 27. Gleichnamigen wird durchgezaehlt statt Buchstaben zu erfinden.
function unterscheideGleiche(items) {
    // Gruppiert wird nach TYP UND Titel, nicht nur nach Titel: eine
    // Beispiel-Box und die zugehoerige Figur tragen oft denselben Kurztitel
    // ("Feder-Masse-Pendel"), sind aber keine Reihe — Piktogramm und Nummer
    // unterscheiden sie bereits, ein (a)/(b) wuerde eine Abfolge behaupten,
    // die es nicht gibt.
    const gruppen = new Map();
    items.forEach(it => {
        if (!it.titel) return;
        const schl = it.typ + '|' + it.titel;
        if (!gruppen.has(schl)) gruppen.set(schl, []);
        gruppen.get(schl).push(it);
    });
    gruppen.forEach(gruppe => {
        if (gruppe.length < 2) return;
        gruppe.forEach((it, i) => {
            const marke = i < 26 ? String.fromCharCode(97 + i) : String(i + 1);
            it.titel += ` (${marke})`;
        });
    });
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
            a.className = 'rail-item';
            // Der volle Text bleibt als Tooltip erreichbar — die Klemme auf zwei
            // Zeilen (styles.css) darf nichts unwiederbringlich verstecken.
            a.title = m.voll;

            const ico = document.createElement('span');
            ico.className = 'rail-ico';
            ico.setAttribute('aria-hidden', 'true');
            if (FIG_ICONS[m.typ]) {
                ico.innerHTML = FIG_ICONS[m.typ];
            } else if (BOX_ICONS[m.typ]) {
                const img = document.createElement('img');
                img.src = 'src/assets/' + BOX_ICONS[m.typ];
                img.alt = '';
                ico.appendChild(img);
            }
            a.appendChild(ico);

            const txt = document.createElement('span');
            txt.className = 'rail-text';
            if (m.nummer) {
                const num = document.createElement('span');
                num.className = 'rail-num';
                num.textContent = m.nummer;
                txt.appendChild(num);
                if (m.titel) txt.appendChild(document.createTextNode(' '));
            }
            if (m.titel) txt.appendChild(document.createTextNode(m.titel));
            // Ohne Nummer UND ohne Titel bliebe der Eintrag leer — dann den
            // vollen Text nehmen (kommt bei Figuren ohne data-figref vor).
            if (!m.nummer && !m.titel) txt.textContent = m.voll;
            a.appendChild(txt);
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
    // Kapitel des naechsten TK als blasse Vorschau; ist es das ERSTE seines TK
    // (kein gleich-TK-Vorgaenger) und es gibt einen vorigen TK, steht das letzte
    // Kapitel jenes TK blass ueber einer Trennlinie — statt eines harten Bruchs.
    const crossNext = (!next && nextSec && tkOf(nextSec) !== activeTk) ? nextSec : null;
    const crossPrev = (!pred && prevSec && tkOf(prevSec) !== activeTk) ? prevSec : null;

    // Vorgänger (zu) · aktives Kapitel (offen, mit allen Abschnitten) ·
    // Nachfolger (zu). Aktive Zeile erscheint stets, auch als reine Intro-Seite
    // ohne Abschnitte (P9-Entscheidung b). Cross-TK-Vorschau (blass) sitzt
    // jeweils ausserhalb einer Trennlinie, die sie vom gleich-TK-Fenster trennt.
    const renderSection = (s, istAktiv) => {
        chNav.appendChild(link(s.page, 'rail-sectionlink' + (istAktiv ? ' open' : ''), false));
        if (istAktiv) s.children.forEach(p => chNav.appendChild(link(p, 'rail-chapterlink', true)));
    };
    const renderCross = s => chNav.appendChild(link(s.page, 'rail-sectionlink rail-tk-cross', false));
    const renderSep = () => {
        const sep = document.createElement('hr');
        sep.className = 'rail-tk-sep';
        chNav.appendChild(sep);
    };
    if (crossPrev) { renderCross(crossPrev); renderSep(); }
    if (pred) renderSection(pred, false);
    renderSection(active, true);
    if (next) renderSection(next, false);
    if (crossNext) { renderSep(); renderCross(crossNext); }

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
