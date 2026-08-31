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

function numberBoxes(page, prefix, chapter, counters, boxNumbers) {
    page.el.querySelectorAll(BOX_SELECTOR).forEach(box => {
        const type = Object.keys(BOX_LABELS).find(k => box.classList.contains(k));
        if (!type) return;
        counters[type] = (counters[type] || 0) + 1;
        const scope = CHAPTER_SCOPED.has(type) ? chapter : prefix;
        // Boxen mit stabiler id fuer Querverweise (data-ref-box) merken.
        if (boxNumbers && box.id)
            boxNumbers[box.id] = { label: BOX_LABELS[type], num: scope + '.' + counters[type] };
        const titleEl = box.querySelector('.highlight_box_title');
        if (titleEl) {
            const sub = box.dataset.title || '';
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
//   <a class="xref" data-ref-box="bsp-...">  -> "Beispiel 1.1.2" (Box-id)
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

// Verweis auf eine nummerierte Box (Beispiel/Bemerkung/…) ueber ihre id.
// Nummer + Typlabel liefert numberBoxes in boxNumbers[id].
function resolveBoxRefs(boxNumbers) {
    document.querySelectorAll('a[data-ref-box]').forEach(a => {
        const info = boxNumbers[a.dataset.refBox];
        if (!info) return;
        a.textContent = info.label + ' ' + info.num;
        a.setAttribute('href', '#' + a.dataset.refBox);
    });
}

// ── Formelnummern pro Abschnitt ─────────────────────────────────────────────
// v0.13 nummeriert Gleichungen mit \numberwithin{equation}{section}, zaehlt
// also pro Abschnitt neu. MathJax zaehlt dagegen dokumentweit durch und kennt
// beim Formatieren einer Nummer keinen Kontext: tagformat.number(n) bekommt
// nur die laufende Nummer. Ein festes Praefix funktioniert daher nur, solange
// genau ein Abschnitt im Dokument steht.
//
// Drei Wege wurden verworfen, alle nachgemessen:
//   * \setcounter{equation}{0} im Text -- MathJax ignoriert es stillschweigend.
//   * tags.reset(0) zwischen Teil-Typesets -- setzt zwar den Zaehler zurueck,
//     loescht aber allLabels/allIds, womit alle \ref-Verweise verlieren.
//   * ZWEI Durchgaenge (bis v1.38.2): erst alles setzen, dann je nummerierter
//     Zeile das von MathJax gesetzte [data-mml-node="mlabeledtr"] zaehlen,
//     dann alles ein zweites Mal setzen. Korrekt, aber der teuerste denkbare
//     Weg -- der Zaehl-Durchgang kostete ueber dem ganzen Skript 5,4 s
//     Hauptthread, nur um 947 Zeilen zu zaehlen (BACKLOG P22-3b).
//
// Stattdessen wird die Zuordnung VOR dem Typeset aus der LaTeX-QUELLE
// gebaut: solange MathJax nicht gelaufen ist, steht sie noch im DOM-Text
// jeder Seite. Ein Durchgang genuegt damit, die Nummern stehen vom ersten
// Rendern an richtig da. Gegen die DOM-Wahrheit geprueft (2026-08-31, alle
// 17 Fragmente): 947 von 947 nummerierten Zeilen auf allen 137 Seiten
// identisch, alle 91 \label-Verweise identisch.
// Schritt 1 wird GECACHT. Grund: seit dem seitenweisen Setzen (P22-3c) ist die
// LaTeX-Quelle einer bereits gesetzten Seite weg -- ein zweiter Zaehllauf wuerde
// sie mit null Nummern verbuchen und die Zuordnung aller folgenden Seiten
// verschieben. Einmal aus der Quelle gelesen, gilt sie fuer die Sitzung.
let tagsProSeite = null;        // page-id -> ["2.3.14", …]

export function renumber_equations() {
    // Schritt 1 -- die AUTORITATIVEN Nummern je Seite, aus dem Seitenregister:
    // das ist die Reihenfolge des Skripts, unabhaengig davon, was gerade im
    // Dokument steht. "2.3.14" gehoert zu dieser Gleichung, egal ob gerade das
    // ganze Skript, nur ihr Abschnitt oder nur ihre Seite gesetzt wird.
    if (!tagsProSeite || !tagsProSeite.size) {
        const proSeite = new Map();
        const etiketten = {};       // \label -> {tag, id}  (fuer resolve_eq_refs)
        let section = null, lokal = 0;
        getPages().forEach((page, i) => {
            const prefix = sectionPrefix(page, i);
            if (prefix !== section) { section = prefix; lokal = 0; }
            proSeite.set(page.id, eq_rows_of_source(page.el.textContent).map(zeile => {
                const tag = prefix + '.' + (++lokal);
                // \label{…} gleich mitnehmen: beim seitenweisen Setzen kennt
                // MathJax' eigenes Label-Register nur die schon gesetzten
                // Seiten -- ein Verweis auf eine noch nicht besuchte Seite
                // fiele damit aus. Aus der Quelle stehen ALLE Labels sofort
                // fest. Die id ist die, die tagformat.id in index.html bildet:
                // 'eq-' + Label (an den gerenderten Element-ids nachgemessen).
                const m = zeile.match(/\\label\{([^}]+)\}/);
                if (m) etiketten[m[1]] = { tag: tag, id: 'eq-' + m[1] };
                return tag;
            }));
        });
        // Nur uebernehmen, wenn ueberhaupt etwas gefunden wurde: ein Aufruf,
        // der zu spaet kommt (Quelle schon ersetzt), darf eine gueltige
        // Zuordnung nicht durch eine leere ersetzen.
        let summe = 0;
        proSeite.forEach(t => { summe += t.length; });
        if (summe) { tagsProSeite = proSeite; window.eq_labels = etiketten; }
    }
    if (!tagsProSeite) return;

    // Schritt 2 -- daraus die Zuordnung "laufende MathJax-Nummer -> Tag", in
    // DOKUMENT-Reihenfolge ueber alle .chapter-page, die tatsaechlich im
    // Dokument stehen. Der Umweg ist noetig, weil tagformat.number() nur einen
    // laufenden Zaehler bekommt (s. index.html) und MathJax alles durchzaehlt,
    // was es findet -- im Druck-Tab also den Klon in #print_container UND das
    // versteckte Original, und beim Teildruck ("Was drucken?") einen Klon, aus
    // dem print.js Seiten entfernt hat. Ein Index, der stur bei 1 beginnt,
    // traefe dann die falsche Seite: der Abschnittsdruck der Lorentzkraft
    // zeigte 0.1.1 statt 2.3.14. Schritt 2 laeuft daher bei JEDEM Aufruf neu.
    const map = [];                 // Index = laufende MathJax-Nummer (ab 1)
    const versatz = {};             // page-id -> Zahl der Nummern DAVOR
    let laufend = 0;
    document.querySelectorAll('.chapter-page').forEach(el => {
        const tags = tagsProSeite.get(el.dataset.pageId);
        if (!tags) return;
        // Versatz je Seite: nur so kann ein Teil-Typeset einer EINZELNEN Seite
        // den Laufindex richtig vorbelegen, statt bei 1 zu beginnen
        // (core.js::typeset_seite). Erster Eintrag gewinnt -- im Druck-Tab
        // steht jede Seiten-Id zweimal im Dokument (Klon + verstecktes
        // Original), und dort zaehlt der Klon.
        if (versatz[el.dataset.pageId] === undefined) versatz[el.dataset.pageId] = laufend;
        tags.forEach(t => { map[++laufend] = t; });
    });
    window.eq_tag_map = map;
    window.eq_page_offset = versatz;
}

// Nummerierte Gleichungszeilen eines Quelltextes in Dokumentreihenfolge.
// Nummeriert wird -- wie in amsmath/v0.13 -- jede Zeile von \begin{equation}
// und \begin{align}; die Sternvarianten und \[…\] bleiben unnummeriert, und
// \nonumber/\notag unterdrueckt die Nummer der jeweiligen Zeile.
// Bewusst ein Zaehler und kein Parser: er muss nur so viel LaTeX verstehen,
// wie ueber die Zahl der Nummern entscheidet.
function eq_rows_of_source(text) {
    const rows = [];
    const env = /\\begin\{(equation|align)\}([\s\S]*?)\\end\{\1\}/g;
    let m;
    while ((m = env.exec(text)) !== null) {
        const zeilen = m[1] === 'equation' ? [m[2]] : split_top_rows(m[2]);
        for (const z of zeilen) {
            if (!z.trim()) continue;                       // leere Schlusszeile
            if (/\\(nonumber|notag)\b/.test(z)) continue;  // unterdrueckte Nummer
            rows.push(z);
        }
    }
    return rows;
}

// Zerlegt einen align-Koerper an den Zeilenumbruechen \\ der OBERSTEN Ebene.
// Ein \\ innerhalb einer geschachtelten Umgebung (split, pmatrix, cases,
// array …) gehoert zu deren eigener Zeilenstruktur und trennt hier nicht --
// daher die Tiefenzaehlung statt eines blossen split('\\\\').
function split_top_rows(body) {
    const rows = [];
    let depth = 0, cur = '', i = 0;
    while (i < body.length) {
        if (body.startsWith('\\begin{', i)) {
            const j = body.indexOf('}', i);
            if (j > -1) { depth++; cur += body.slice(i, j + 1); i = j + 1; continue; }
        }
        if (body.startsWith('\\end{', i)) {
            const j = body.indexOf('}', i);
            if (j > -1) { depth--; cur += body.slice(i, j + 1); i = j + 1; continue; }
        }
        if (depth === 0 && body.startsWith('\\\\', i)) {
            let j = i + 2;
            // optionaler Zeilenabstand \\[6pt]
            if (body[j] === '[') { const k = body.indexOf(']', j); if (k > -1) j = k + 1; }
            rows.push(cur); cur = ''; i = j; continue;
        }
        cur += body[i]; i++;
    }
    rows.push(cur);
    return rows;
}

export function resolve_eq_refs() {
    const links = document.querySelectorAll('a[data-ref-eq]');
    if (!links.length) return;
    // Quelle der Wahrheit sind die beim Zaehlen aus der LaTeX-Quelle
    // gewonnenen Labels: seit dem seitenweisen Setzen (P22-3c) kennt MathJax'
    // eigenes Register nur die Gleichungen der bereits gesetzten Seiten -- ein
    // Verweis auf eine noch nicht besuchte Seite fiele sonst aus. MathJax'
    // Register bleibt als Rueckfall, falls renumber_equations() nicht lief.
    let labels = window.eq_labels;
    if (!labels || !Object.keys(labels).length) {
        try {
            labels = window.MathJax.startup.document.inputJax[0].parseOptions.tags.allLabels;
        } catch (e) { /* MathJax noch nicht bereit -- spaeterer Aufruf holt das nach */ }
    }
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
    const boxNumbers = {};    // Box-id -> {label, num} (fuer data-ref-box)
    pages.forEach((page, i) => {
        const prefix = sectionPrefix(page, i);
        const chap = chapterPrefix(page, i);
        if (chap !== chapter) {
            // Kapitelwechsel: kapitelweite Zaehler (Abbildungen, Zusammenfassung)
            // auf 0 zuruecksetzen. Die konkreten Startwerte setzt die erste
            // offset-tragende Seite des Kapitels (s. u.) -- nicht mehr hier, damit
            // auch Abschnitte MITTEN im Kapitel einen Startwert deklarieren koennen.
            chapter = chap;
            for (const k in state) delete state[k];
            state.img = 0;
            boxCounters.zusammenfassung = 0;
        }
        if (prefix !== section) {
            // Sectionswechsel: nur die Section-Zaehler zuruecksetzen.
            section = prefix;
            for (const k in boxCounters) {
                if (!CHAPTER_SCOPED.has(k)) delete boxCounters[k];
            }
        }
        // Deklarierte Offsets (i. d. R. am Abschnitts-h2): eine Seite darf die
        // kapitelweiten Zaehler auf einen ABSOLUTEN Startwert setzen -- so laesst
        // sich die Luecke noch nicht migrierter Abschnitte ueberspringen, OHNE die
        // Nummern bereits migrierter Abschnitte zu verschieben (erste Abbildung des
        // Abschnitts = figure-offset + 1). Der Wert ist entfernbar, sobald alle
        // vorherigen Abschnitte lueckenlos migriert sind. Pro Attribut getrennt
        // gepueft, damit eine Seite mit NUR zusammenfassung-offset nicht den
        // Abbildungszaehler auf 0 klobbert.
        const offEl = page.el.querySelector('[data-figure-offset], [data-zusammenfassung-offset]');
        if (offEl) {
            if (offEl.dataset.figureOffset != null)
                state.img = parseInt(offEl.dataset.figureOffset, 10) || 0;
            if (offEl.dataset.zusammenfassungOffset != null)
                boxCounters.zusammenfassung = parseInt(offEl.dataset.zusammenfassungOffset, 10) || 0;
        }
        numberBoxes(page, prefix, chapter, boxCounters, boxNumbers);
        numberFigures(page, prefix, state);
        numberImages(page, chapter, state, figNumbers);
    });
    resolveFigRefs(figNumbers);
    resolveSecRefs();
    resolveBoxRefs(boxNumbers);
    resolve_eq_refs();   // greift erst, wenn MathJax fertig ist (s. main.js)
    // Formelnummern VOR dem Typeset festlegen: renumber_equations() liest die
    // LaTeX-Quelle, die nur so lange im DOM steht, bis MathJax sie durch die
    // <mjx-container> ersetzt. main.js::init() ruft init_numbering() vor
    // typesetAfterLoad() auf — genau dieses Fenster (BACKLOG P22-3b).
    renumber_equations();
}

// window-Bruecke statt Import: core.js::reload_mathjax() und chapters.js
// bauen die MathJax-Ausgabe neu auf und muessen die Formelverweise danach
// erneut aufloesen -- ein Import wuerde den Zyklus core->numbering->pages->core
// erzeugen (gleiches Muster wie update_all/window.updateN).
window.resolve_eq_refs = resolve_eq_refs;
window.renumber_equations = renumber_equations;
