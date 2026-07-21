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
function numberImages(page, prefix, state) {
    page.el.querySelectorAll('figure.abbildung').forEach(fig => {
        state.img = (state.img || 0) + 1;
        const cap = fig.querySelector('figcaption');
        if (!cap) return;
        let label = cap.querySelector(':scope > .fig-label');
        if (!label) {
            label = document.createElement('span');
            label.className = 'fig-label';
            cap.insertBefore(label, cap.firstChild);
            cap.insertBefore(document.createTextNode(' '), label.nextSibling);
        }
        label.textContent = 'Abb. ' + prefix + '.' + state.img;
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
        label.textContent = 'Abb. ' + prefix + '.' + state.legacyImg;
        img.insertAdjacentElement('afterend', label);
    });
}

export function init_numbering() {
    const pages = getPages();
    let section = null;
    let chapter = null;
    const boxCounters = {};   // pro Section (ausser CHAPTER_SCOPED, s. o.)
    const state = {};         // Abbildungen/Simulationen -- kapitelweit
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
        numberImages(page, chapter, state);
    });
}