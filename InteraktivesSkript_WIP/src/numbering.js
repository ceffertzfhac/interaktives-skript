// numbering.js — automatische Nummerierung nach v0.13-Vorbild
// (Physik_skript_header_gmni_v3.tex: \numberwithin{equation}{section} +
// eigene Zaehler fuer Beispiel/Lernziel/Bemerkung/Aufgabe/Zusammenfassung,
// ebenfalls pro Section zurueckgesetzt). Bei uns entspricht "section" der
// .chapter-page-Ebene (h2-Intro oder h3-Unterabschnitt, s. pages.js) -- ein
// Zaehler pro Typ, zurueckgesetzt an jedem Seitenanfang, Praefix aus der
// Kapitelnummer der Seite (z.B. "1.5.1").
//
// Formeln/Boxen/Figuren/Bilder werden generisch durchnummeriert -- neue
// Boxen oder Figuren brauchen keinen Code, nur die uebliche Klasse/das
// uebliche Markup (data-title bei Figuren).
import { getPages } from './pages.js';

const BOX_LABELS = {
    lernziel: 'Lernziel',
    beispiel: 'Beispiel',
    anmerkung: 'Anmerkung',
    aufgabe: 'Aufgabe',
    zusammenfassung: 'Zusammenfassung',
};
const BOX_SELECTOR = Object.keys(BOX_LABELS).map(c => '.' + c).join(', ');

function subsectionPrefix(page, index) {
    const m = page.title.match(/^([0-9]+(?:\.[0-9]+)*)/);
    return m ? m[1] : String(index + 1);
}

function numberBoxes(page, prefix) {
    const counters = {};
    page.el.querySelectorAll(BOX_SELECTOR).forEach(box => {
        const type = Object.keys(BOX_LABELS).find(k => box.classList.contains(k));
        if (!type) return;
        counters[type] = (counters[type] || 0) + 1;
        const titleEl = box.querySelector('.highlight_box_title');
        if (titleEl) titleEl.textContent = BOX_LABELS[type] + ' ' + prefix + '.' + counters[type];
    });
}

function numberFigures(page, prefix) {
    let n = 0;
    page.el.querySelectorAll('.grafik-container').forEach(gc => {
        n++;
        const titleEl = gc.querySelector('.gc_header_title');
        if (!titleEl) return; // statischer Modus: kein .gc_header (make_static() ersetzt das Markup)
        const baseTitle = gc.dataset.title || titleEl.dataset.baseTitle || titleEl.textContent;
        titleEl.dataset.baseTitle = baseTitle; // Basis merken, damit erneutes Nummerieren nicht verdoppelt
        titleEl.textContent = 'Simulation ' + prefix + '.' + n + ': ' + baseTitle;
    });
}

// Eigenstaendige Inhaltsbilder (nicht Teil einer interaktiven Figur oder
// einer Highlight-Box-Ikone) bekommen ein kleines "Abb. x.y.z"-Label.
function numberImages(page, prefix) {
    let n = 0;
    page.el.querySelectorAll('img').forEach(img => {
        if (img.closest('.grafik-container')) return;
        if (img.classList.contains('highlight_box_img')) return;
        if (img.nextElementSibling && img.nextElementSibling.classList.contains('fig-number')) return; // idempotent
        n++;
        const label = document.createElement('div');
        label.className = 'fig-number';
        label.textContent = 'Abb. ' + prefix + '.' + n;
        img.insertAdjacentElement('afterend', label);
    });
}

// Formel-Nummerierung laeuft separat (erst nach MathJax-Startup moeglich,
// s. init_numbering) und zaehlt ALLE Display-Formeln der Seite in
// Dokumentreihenfolge, unabhaengig davon, ob sie in einer Box stecken (wie
// in LaTeX: eine \begin{equation} in einer Box-Umgebung wird trotzdem
// mitgezaehlt).
function numberEquations(page, prefix) {
    let n = 0;
    page.el.querySelectorAll('mjx-container[display="true"]').forEach(eq => {
        n++;
        let badge = eq.querySelector(':scope > .eq-number');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'eq-number';
            eq.appendChild(badge);
        }
        badge.textContent = '(' + prefix + '.' + n + ')';
    });
}

function forEachPage(fn) {
    const pages = getPages();
    pages.forEach((page, i) => fn(page, subsectionPrefix(page, i)));
}

function numberEquationsAll() {
    forEachPage(numberEquations);
}

export function init_numbering() {
    forEachPage((page, prefix) => {
        numberBoxes(page, prefix);
        numberFigures(page, prefix);
        numberImages(page, prefix);
    });

    // Formeln existieren erst als <mjx-container>, nachdem MathJax seinen
    // Start-Typeset abgeschlossen hat (asynchrones CDN-Script, nicht mit
    // main.js::init() synchronisiert).
    const rerun = () => numberEquationsAll();
    (function waitForMathJax() {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise.then(rerun);
        } else {
            setTimeout(waitForMathJax, 200);
        }
    })();

    // Bruecke fuer core.js::reload_mathjax() (der "tt"-Ostereier-Pfad baut
    // alle <mjx-container> neu auf, was injizierte .eq-number-Badges
    // verwirft) -- window-Bruecke statt Import, um den Modul-Zyklus
    // core->numbering->pages->core zu vermeiden (gleiches Muster wie
    // update_all()/window.updateN).
    window.renumber_equations = numberEquationsAll;
}
