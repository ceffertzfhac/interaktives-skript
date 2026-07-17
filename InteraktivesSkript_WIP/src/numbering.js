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
// mitgezaehlt) -- AUSSER den winzigen Achsen-/Vektor-Labels in den
// foreignObject-Beschriftungen der interaktiven Figuren (z.B. "$$x$$",
// "$$\vec\omega$$" in fig_NN.js): das sind UI-Labels, keine Lehrbuch-
// Gleichungen, und wurden vor diesem Fix faelschlich mitgezaehlt.
function numberEquations(page, prefix) {
    let n = 0;
    page.el.querySelectorAll('mjx-container[display="true"]').forEach(eq => {
        if (eq.closest('.grafik-container')) return;
        n++;
        let badge = eq.querySelector(':scope > .eq-number');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'eq-number';
            eq.appendChild(badge);
        }
        badge.textContent = '(' + prefix + '.' + n + ')';
        layoutEqNumber(eq, badge);
    });
}

// Die reservierte Padding-Breite (s. styles.css) reicht fuer normal lange
// Nummern ("(1.5.8.4)"), kann aber bei breiten Formeln (grosse Matrizen,
// lange Vektorsummen) *und* langen Nummern ("(1.5.10.12)" bei zweistelligen
// Zaehlern) trotzdem eng werden -- besonders bei "Schmal" (schmale
// Lesespalte). Statt zu riskieren, dass Formel und Nummer sich ueberlappen,
// wird nach dem Setzen gemessen: passt die Nummer nicht mehr rechts neben
// die Formel, rutscht sie per .eq-number-below unter die Formel (kein
// Ueberlapp bei jeder Breite). getBoundingClientRect() erzwingt einen
// Reflow -- bei der ueberschaubaren Formelzahl pro Seite unkritisch.
function layoutEqNumber(eq, badge) {
    badge.classList.remove('eq-number-below');
    const svg = eq.querySelector(':scope > svg');
    if (!svg) return;
    const GAP = 10;
    const svgRect = svg.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect(); // badge.left = wo sie mit right:14px tatsaechlich sitzt
    if (svgRect.right + GAP > badgeRect.left) {
        badge.classList.add('eq-number-below');
    }
}

function forEachPage(fn) {
    const pages = getPages();
    pages.forEach((page, i) => fn(page, subsectionPrefix(page, i)));
}

function numberEquationsAll() {
    forEachPage(numberEquations);
}

// Nur die Kollisions-Pruefung neu ausfuehren (keine Neuvergabe der
// Nummern) -- fuer Breiten-Modus-Wechsel/Resize, bei denen sich nur die
// verfuegbare Breite aendert, s. Bruecken unten.
function relayoutEqNumbers() {
    document.querySelectorAll('mjx-container[display="true"] > .eq-number').forEach(badge => {
        layoutEqNumber(badge.parentElement, badge);
    });
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
    // Bruecke fuer core.js::set_width_mode() (Schmal/Normal/Extrabreit
    // aendert die Lesespaltenbreite, also den verfuegbaren Platz neben der
    // Nummer) -- gleiches Muster.
    window.relayout_eq_numbers = relayoutEqNumbers;

    // Fenstergroesse kann sich unabhaengig vom Breiten-Modus aendern
    // (Browserfenster resizen) -- debounced, da resize sehr oft feuert.
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(relayoutEqNumbers, 150);
    });
}
