// numbering.js — automatische Nummerierung nach v0.13-Vorbild
// (Physik_skript_header_gmni_v3.tex):
//   \numberwithin{equation}{section}            -> Formeln  (1.4.1) …  pro Section fortlaufend
//   \numberwithin{beispielcounter}{section}     -> Beispiel 1.4.1 …
//   \numberwithin{bemerkungcounter}{section}    -> Bemerkung 1.4.1 …
//   \numberwithin{wichtigcounter}{section}      -> Wichtig 1.4.1 …
//   \numberwithin{lernzielcounter}{section}      -> Lernziel 1.4.1 …
//   \numberwithin{aufgabecounter}{section}       -> Aufgabe 1.4.1 …
//   \numberwithin{zusammenfassungcounter}{chapter} -> Zusammenfassung 1.x
//
// FORMELN werden seit v1.7 von MathJax selbst nummeriert (tex.tags='ams' +
// tagformat in index.html): \begin{equation}/\begin{align} pro Zeile wie in
// v0.13, mit \label/\ref/\nonumber, equation*/align* und \[\] unnummeriert.
// Das JS zaehlt daher nur noch Boxen, Abbildungen (figure.abbildung) und
// sonstige standalone-Bilder.
//
// "Section" entspricht der .chapter-page-Ebene: der Praefix ist die erste
// Nummer der Seite (h2 "1.4 …" -> "1.4", h3 "1.4.3 …" -> "1.4"), und die
// Zaehler laufen pro Section fortlaufend weiter, bis sich der Praefix
// aendert (Reset am Sectionswechsel). Damit ist die Numerierung 1:1 wie in
// v0.13, solange das WIP nur Abschnitt 1.4 enthaelt (Kap. 1 Mechanik,
// Abschnitt 1.4 = "Kinematik der Drehbewegung und Kreisbahnen"; v0.13 setzt
// die erste Section per \addtocounter{section}{-1} auf 1.0).
//
// ACHTUNG -- die Zaehler-Scopes in v0.13 sind NICHT einheitlich:
//   * equation/beispiel/bemerkung/wichtig/lernziel/aufgabe -> {section} -> "1.4.n"
//   * zusammenfassung                                      -> {chapter} -> "1.n"
//   * figure hat GAR KEIN \numberwithin                    -> {chapter} -> "1.n"
// Im PDF (Abschnitt 1.4) sind das konkret: Abbildung 1.38-1.60 und
// Zusammenfassung 1.4-1.7. Weil das WIP erst eine Section eines laufenden
// Kapitels enthaelt, brauchen die kapitelweiten Zaehler einen Startwert
// (was die Abschnitte 1.0-1.3 bereits verbraucht haetten). Der steht
// deklarativ am h2 des Kapitel-Fragments (data-figure-offset /
// data-zusammenfassung-offset) und faellt weg, sobald die vorherigen
// Abschnitte migriert sind.
import { getPages } from './pages.js';

const BOX_LABELS = {
    lernziel: 'Lernziel',
    beispiel: 'Beispiel',
    bemerkung: 'Bemerkung',
    wichtig: 'Wichtig',
    aufgabe: 'Aufgabe',
    zusammenfassung: 'Zusammenfassung',
};
// Welcher Zaehler laeuft kapitelweit statt pro Section (s. Kopfkommentar)?
const CHAPTER_SCOPED = new Set(['zusammenfassung']);
const BOX_SELECTOR = Object.keys(BOX_LABELS).map(c => '.' + c).join(', ');

// Section-Praefix aus dem Seiten-Titel: erste ein bis zwei Nummern
// ("1.4 Kinematik …" -> "1.4", "1.4.3 Die Beschleunigung" -> "1.4",
//  "2 Kinematik des starren Körpers" -> "2", "2.1 …" -> "2").
function sectionPrefix(page, index) {
    const m = page.title.match(/^(\d+(?:\.\d+)?)/);
    return m ? m[1] : String(index + 1);
}

// Kapitel-Praefix: nur die erste Nummer ("1.4.3 …" -> "1", "2.1 …" -> "2").
function chapterPrefix(page, index) {
    const m = page.title.match(/^(\d+)/);
    return m ? m[1] : String(index + 1);
}

// Startwerte fuer die kapitelweiten Zaehler, deklariert am h2 des Kapitels.
function offsetsFor(page) {
    const el = page.el.querySelector('[data-figure-offset], [data-zusammenfassung-offset]');
    return {
        figure: el ? parseInt(el.dataset.figureOffset, 10) || 0 : 0,
        zusammenfassung: el ? parseInt(el.dataset.zusammenfassungOffset, 10) || 0 : 0,
    };
}

function numberBoxes(page, prefix, chapter, counters) {
    page.el.querySelectorAll(BOX_SELECTOR).forEach(box => {
        const type = Object.keys(BOX_LABELS).find(k => box.classList.contains(k));
        if (!type) return;
        counters[type] = (counters[type] || 0) + 1;
        const titleEl = box.querySelector('.highlight_box_title');
        if (titleEl) {
            const sub = box.dataset.title || '';
            const scope = CHAPTER_SCOPED.has(type) ? chapter : prefix;
            // Typ + Nummer in .hb-type (Versalien per CSS), der boxeigene
            // Titel in .hb-name (Gross/klein) -- s. core.js/styles.css.
            let typeEl = titleEl.querySelector('.hb-type');
            if (!typeEl) {
                typeEl = document.createElement('span');
                typeEl.className = 'hb-type';
                titleEl.textContent = '';
                titleEl.appendChild(typeEl);
            }
            typeEl.textContent = BOX_LABELS[type] + ' ' + scope + '.' + counters[type];
            let nameEl = titleEl.querySelector('.hb-name');
            if (sub) {
                if (!nameEl) {
                    nameEl = document.createElement('span');
                    nameEl.className = 'hb-name';
                    titleEl.appendChild(nameEl);
                }
                nameEl.textContent = ': ' + sub;
            } else if (nameEl) {
                nameEl.remove();
            }
        }
    });
}

// Interaktive .grafik-container (Simulationen) — bleiben fuer kuenftige
// interaktive Figuren; im aktuellen Kapitel 1.4 (rein statisch) keine
// vorhanden. Nummeriert pro Section fortlaufend ("Simulation 1.4.n: Titel").
function numberFigures(page, prefix, state) {
    page.el.querySelectorAll('.grafik-container').forEach(gc => {
        state.fig = (state.fig || 0) + 1;
        const titleEl = gc.querySelector('.gc_header_title');
        if (!titleEl) return; // statischer Modus: kein .gc_header
        const baseTitle = gc.dataset.title || titleEl.dataset.baseTitle || titleEl.textContent;
        titleEl.dataset.baseTitle = baseTitle;
        titleEl.textContent = 'Simulation ' + prefix + '.' + state.fig + ': ' + baseTitle;
    });
}

// Eigenstaendige Abbildungen: <figure class="abbildung"> mit <figcaption>.
// Zaehlt KAPITELWEIT (v0.13 setzt fuer figure kein \numberwithin), Praefix ist
// daher die Kapitelnummer: "Abb. 1.38" … -- nicht "1.4.n".
// Der figcaption wird ein fuehrendes "Abb. 1.n"-Label (<span class="fig-
// label">) VORANGestellt, ohne den Rest der Beschriftung anzufassen -- so
// robust gegen das Timing, ob MathJax die Beschriftung schon typsetzte oder
// nicht (kein innerHTML-Capture/Ersetzen). Idempotent via :scope > .fig-label.
// Legacy standalone-<img> (ohne figure/Container/Box-Icon) bekommen wie
// bisher ein kleines "Abb. x.y"-Label als .fig-number hinter dem Bild.
//
// KAPITEL 0 ohne Praefix: v0.13 definiert
//   \thefigure = \ifnum\value{chapter}>0 \thechapter.\fi\arabic{figure}
// d. h. fuer Kapitel 0 („Grundlagen") entfaellt der Kapitel-Praefix -- die
// Abbildungen heissen „Abb. 1" … „Abb. 4", nicht „Abb. 0.1" … „Abb. 0.4".
// Analog \thetable (Tabellen sind im WIP aber getippt, s. Migration-Runbook).
// Zusammenfassung/Beispiele/Gleichungen behalten ihr „0." (deren \the…
// nutzen \thechapter bzw. \thesection unverdaendert). `prefix` ist hier die
// Kapitelnummer (aus init_numbering als `chapter` uebergeben).
function numberImages(page, prefix, state, figNumbers) {
    const figPrefix = (prefix === '0') ? '' : (prefix + '.');
    page.el.querySelectorAll('figure.abbildung').forEach(fig => {
        state.img = (state.img || 0) + 1;
        const num = figPrefix + state.img;
        if (figNumbers && fig.id) figNumbers[fig.id] = num;
        const cap = fig.querySelector('figcaption');
        if (!cap) return;
        let label = cap.querySelector(':scope > .fig-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'fig-label';
            cap.insertBefore(label, cap.firstChild);
            cap.insertBefore(document.createTextNode(' '), label.nextSibling);
        }
        label.textContent = 'Abb. ' + num;
    });
    // Legacy: standalone-<img> ohne figure/Container/Box-Icon
    page.el.querySelectorAll('img').forEach(img => {
        if (img.closest('figure.abbildung')) return;
        if (img.closest('.grafik-container')) return;
        if (img.classList.contains('highlight_box_img')) return;
        if (img.nextElementSibling && img.nextElementSibling.classList.contains('fig-number')) return;
        state.legacyImg = (state.legacyImg || 0) + 1;
        const label = document.createElement('div');
        label.className = 'fig-number';
        label.textContent = 'Abb. ' + figPrefix + state.legacyImg;
        img.insertAdjacentElement('afterend', label);
    });
}

// ── Querverweise ────────────────────────────────────────────────────────────
// Alle Verweise im Kapitel sind Anker mit einem Schluessel statt fest
// getippter Nummern (v0.13: \ref{...}); die Nummer schreibt erst die Laufzeit
// hinein, damit Text und Ziel nicht auseinanderlaufen koennen:
//   <a class="xref" data-ref-fig="fig-...">  -> "Abbildung 1.38"
//   <a class="xref" data-ref-sec="p-1-4-5">  -> "Abschnitt 1.4.5"
//   <a class="xref" data-ref-eq="eq_...">    -> "(1.4.12)"
// Formelnummern kommen aus MathJax' Label-Register (allLabels: label ->
// {tag, id}); MathJax rendert \ref selbst nur als Text, nicht als Link.
function resolveFigRefs(figNumbers) {
    document.querySelectorAll('a[data-ref-fig]').forEach(a => {
        const key = a.dataset.refFig;
        const num = figNumbers[key];
        if (num === undefined) return;
        a.textContent = 'Abbildung ' + num;
        a.setAttribute('href', '#' + key);
    });
}

function resolveSecRefs() {
    const byId = {};
    getPages().forEach(p => { byId[p.id] = p; });
    document.querySelectorAll('a[data-ref-sec]').forEach(a => {
        const page = byId[a.dataset.refSec];
        if (!page) return;
        const m = page.title.match(/^([0-9.]+)/);
        a.textContent = 'Abschnitt ' + (m ? m[1] : page.title);
        a.setAttribute('href', '#' + page.id);
    });
}

// ── Formelnummern pro Abschnitt ─────────────────────────────────────────────
// v0.13 nummeriert Gleichungen mit \numberwithin{equation}{section}, zaehlt
// also pro Abschnitt neu. MathJax zaehlt dagegen dokumentweit durch und kennt
// beim Formatieren einer Nummer keinen Kontext: tagformat.number(n) bekommt
// nur die laufende Nummer. Ein festes Praefix funktioniert daher nur, solange
// genau ein Abschnitt im Dokument steht.
//
// Zwei Wege wurden verworfen, beide nachgemessen:
//   * \setcounter{equation}{0} im Text -- MathJax ignoriert es stillschweigend.
//   * tags.reset(0) zwischen Teil-Typesets -- setzt zwar den Zaehler zurueck,
//     loescht aber allLabels/allIds, womit alle \ref-Verweise verlieren.
//
// Stattdessen zwei Durchgaenge: Nach dem ersten Typeset steht im DOM je
// nummerierter Zeile ein [data-mml-node="mlabeledtr"] -- MathJax' eigene
// Markierung, die auch mehrzeilige align-Umgebungen korrekt einzeln zaehlt.
// Daraus wird die Zuordnung "laufende Nummer -> 1.4.3" gebaut; ein zweiter
// Lauf setzt sie ein. Der zweite Lauf aendert die Zeilenzahl nicht, die
// Zuordnung bleibt gleich -> kein weiterer Durchgang (keine Endlosschleife).
export function renumber_equations() {
    const pages = getPages();
    const map = [];            // Index = laufende MathJax-Nummer (ab 1)
    let laufend = 0, section = null, lokal = 0;
    pages.forEach((page, i) => {
        const prefix = sectionPrefix(page, i);
        if (prefix !== section) { section = prefix; lokal = 0; }
        page.el.querySelectorAll('[data-mml-node="mlabeledtr"]').forEach(() => {
            laufend++; lokal++;
            map[laufend] = prefix + '.' + lokal;
        });
    });
    const vorher = JSON.stringify(window.eq_tag_map || null);
    window.eq_tag_map = map;
    return JSON.stringify(map) !== vorher;   // true -> zweiter Typeset noetig
}

export function resolve_eq_refs() {
    const links = document.querySelectorAll('a[data-ref-eq]');
    if (!links.length) return;
    let labels = null;
    try {
        labels = window.MathJax.startup.document.inputJax[0].parseOptions.tags.allLabels;
    } catch (e) { /* MathJax noch nicht bereit -- spaeterer Aufruf holt das nach */ }
    if (!labels) return;
    links.forEach(a => {
        const info = labels[a.dataset.refEq];
        if (!info) return;
        a.textContent = '(' + info.tag + ')';
        a.setAttribute('href', '#' + info.id);
    });
}

export function init_numbering() {
    const pages = getPages();
    let section = null;
    let chapter = null;
    const boxCounters = {};   // pro Section (ausser CHAPTER_SCOPED, s. o.)
    const state = {};         // Abbildungen/Simulationen -- kapitelweit
    const figNumbers = {};    // Figur-id -> vergebene Nummer (fuer Querverweise)
    pages.forEach((page, i) => {
        const prefix = sectionPrefix(page, i);
        const chap = chapterPrefix(page, i);
        if (chap !== chapter) {
            // Kapitelwechsel: kapitelweite Zaehler zuruecksetzen (Abbildungen,
            // Zusammenfassung) und die deklarierten Startwerte uebernehmen.
            chapter = chap;
            const off = offsetsFor(page);
            for (const k in state) delete state[k];
            state.img = off.figure;
            boxCounters.zusammenfassung = off.zusammenfassung;
        }
        if (prefix !== section) {
            // Sectionswechsel: nur die Section-Zaehler zuruecksetzen.
            section = prefix;
            for (const k in boxCounters) {
                if (!CHAPTER_SCOPED.has(k)) delete boxCounters[k];
            }
        }
        numberBoxes(page, prefix, chapter, boxCounters);
        numberFigures(page, prefix, state);
        numberImages(page, chapter, state, figNumbers);
    });
    resolveFigRefs(figNumbers);
    resolveSecRefs();
    resolve_eq_refs();   // greift erst, wenn MathJax fertig ist (s. main.js)
}

// window-Bruecke statt Import: core.js::reload_mathjax() und chapters.js
// bauen die MathJax-Ausgabe neu auf und muessen die Formelverweise danach
// erneut aufloesen -- ein Import wuerde den Zyklus core->numbering->pages->core
// erzeugen (gleiches Muster wie update_all/window.updateN).
window.resolve_eq_refs = resolve_eq_refs;
window.renumber_equations = renumber_equations;
