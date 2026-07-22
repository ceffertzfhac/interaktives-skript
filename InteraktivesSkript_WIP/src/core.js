// core.js — zentrale Helfer, globaler State, Skript-Steuerung (statisch vs.
// interaktiv), Highlight-Boxen, Safari-Workaround, Bruchdarstellung, Darkmode,
// Breiten-Modus, Reset sowie update_all (dispatcht via window.updateN -- siehe
// figures/*).

// #content-Breite je Modus (wie zuvor in splitter.js erprobt); #container
// laeuft mit CONTAINER_SLACK mit, damit #content (margin:auto) nicht ueber
// einen schmaleren Elternrahmen hinaus zentriert werden muss.
const CONTENT_WIDTHS = { schmal: 900, normal: 1150, breit: 1500 };
const CONTAINER_SLACK = 50;
// Lesespalten-Deckel: bei schmal/normal begrenzt ohnehin das Grid (Rail 220px +
// Marginalie 210px + Gaps/Padding) die Breite staerker als dieser Wert: er
// greift wirksam erst bei breit.
const PAPER_MAX_WIDTHS = { schmal: "640px", normal: "760px", breit: "980px" };
const WIDTH_STORAGE_KEY = "skript_width_mode";

export let interaktiv = true; //statisches oder interaktives Skript
export let darkmode_on = false;
export const linspace = 100;
export const speed_factor = 1;

const TEXT_LEVEL_MIN = 1;
const TEXT_LEVEL_MAX = 5;
const DEFAULT_TEXT_LEVEL = 2;

let text_level = DEFAULT_TEXT_LEVEL;
let paper_base_font_size = null;
let paper_base_line_height = null;

export function ge(element_id) {
    return document.getElementById(element_id);
}

export function show(element_id) {
    ge(element_id).classList.remove("hidden");
}
export function hide(element_id) {
    ge(element_id).classList.add("hidden");
}
export function toggle_visibility(element_id) {
    if(ge(element_id).classList.contains("hidden")) {
        show(element_id);
    }
    else {
        hide(element_id);
    }
}

//foo -> Foo (aus generate_highlight_boxes herausgeloest, Modul-Scope)
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function generate_highlight_boxes() {
    // Box-Typen + Icons, an v0.13 (Physik_skript_header_gmni_v3.tex) angelehnt:
    // beispiel=pen, bemerkung=eye, wichtig=star, lernziel=target,
    // aufgabe/zusammenfassung=noteblock (v0.13 nutzt fuer Zusammenfassung ein
    // bulb-Icon, das hier nicht vorliegt -> noteblock). motivation/wiederholung/
    // anmerkung bleiben fuer aeltere Fragmente; neuere Kapitel nutzen die
    // v0.13-Namen (beispiel/bemerkung/wichtig/lernziel/aufgabe/zusammenfassung).
    const boxes = [
        ["lernziel","target.svg"],
        ["motivation","star.svg"],
        ["wiederholung","head.svg"],
        ["beispiel","pen.svg"],
        ["zusammenfassung","noteblock.svg"],
        ["aufgabe","noteblock.svg"],
        ["anmerkung","eye.svg"],
        ["wichtig","star.svg"],
        ["bemerkung","eye.svg"]
    ];

    for (let l=0; l < boxes.length; l++) {
        const a = document.getElementsByClassName(boxes[l][0]);
        for (let i=0; i < a.length; i++) {
            const a_content = a[i].innerHTML;
            a[i].innerHTML="";
            // Zwei Spans: .hb-type traegt den Typ ("Bemerkung 1.4.3") und wird
            // per CSS in Versalien gesetzt, .hb-name den boxeigenen Titel aus
            // data-title -- der bleibt Gross/klein (s. styles.css). Die
            // Nummerierung fuellt beide Spans spaeter neu (numbering.js).
            const a_title = document.createElement("div");
            a_title.setAttribute("class","highlight_box_title");
            const a_type = document.createElement("span");
            a_type.setAttribute("class","hb-type");
            a_type.textContent = capitalizeFirstLetter(boxes[l][0]);
            a_title.appendChild(a_type);
            a[i].appendChild(a_title);

            const a_img = document.createElement("img");
            a_img.setAttribute("src","src/assets/" + boxes[l][1]);
            a_img.setAttribute("class","highlight_box_img");
            a[i].appendChild(a_img);

            a[i].innerHTML+=a_content;
        }
    }
}

// Safari mis-positoniert HTML-Text innerhalb von <foreignObject> in SVG
// (Render-Verhalten, keine fehlende API) -> @supports kann das nicht
// detektieren, deshalb hier UA-Sniff als pragmatischer Workaround: auf
// Safari wird .fo_inner die Klasse .fixed gegeben (150px-Margin-Shift, s.
// styles.css). Revidieren, sobald ein CSS-only-Fix fuer foreignObject
// bekannt ist. Auf Nicht-Safari bleibt alles unveraendert (kein .fixed).
export function safari_bug() {
    const IS_SAFARI = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const fo = document.getElementsByClassName("fo_inner");
    if(IS_SAFARI){
        for(let i = 0;i<fo.length;i++) {
            fo[i].classList.add("fixed");
        }
    }
}

export function degree_to_fraction(value){ //180 -> 1/2 , 181 -> 181/360
    const gcd = gcd_rec(value,180);
    const z = parseInt(value/gcd);
    const n = parseInt(180/gcd);
    let r;
    if(z==0) {
        r = 0;
    }
    else if(n == 1) {
        r = z;
    }
    else {
        r = z + "/" + n;
    }
    return r;
}
function gcd_rec(a, b) { //größter gemeinsamer Teiler
    if (b) {
        return gcd_rec(b, a % b);
    } else {
        return Math.abs(a);
    }
}

export function make_static(){ //interaktives Skript statisch machen für Evaluation
    if(!interaktiv){
        // Seit v1.7 enthaelt Kapitel 1.4 keine interaktiven gcN-Container mehr
        // (reine v0.13-Abbildungen); ge("gcN") liefert dann null. set() hebt
        // sich sicher darueber, damit test()/Statischer-Modus nicht crasht.
        const set = (id, html) => { const el = ge(id); if (el) el.innerHTML = html; };
        set("gc4", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/image002.png" class="grafik" id="" draggable="false"><br><img src="bilder/image003.png" class="grafik" id="" draggable="false"></div>');

        set("gc1", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/phi_0.png" class="grafik" id="" draggable="false"><br></div>');

        set("gc9", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/kreis-xy_koord.png" class="grafik" id="" draggable="false"><br></div>');

        set("gc31", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/geschwindigkeit.png" class="grafik" id="" draggable="false"></div>');

        set("gc32", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/winkelgeschwindigkeit_v.png" class="grafik" id="" draggable="false"></div>');

        set("gc51", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/beschleunigung.png" class="grafik" id="" draggable="false"></div>');

        set("gc3", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/omega_vektor.png" class="grafik" id="" draggable="false"></div>');

        set("gc5", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/winkelbeschleunigung.png" class="grafik" id="" draggable="false"></div>');

        set("gc6", "");

        set("gc8", '<div class="grafik-container-inner"><button type="button" class="zoom_button zoom_maximize" data-action="zoom" aria-label="Abbildung vergrößern"></button><img src="bilder/radialgeschwindigkeit.png" class="grafik" id="" draggable="false"></div>');

        // gc10 (Kreisbewegung, src/figures/kreisbewegung/) hat kein statisches
        // Bild-Pendant und bleibt bewusst interaktiv, auch im statischen Modus
        // (keine 1:1-Parität zu den anderen Figuren, s. CLAUDE.md).

        reload_mathjax();
    }
}

// Osterei (Evaluation): Im Kontakt-Block sind einzelne Buchstaben klickbar.
//  - "ll" in "Falls"  -> test()           schaltet interaktiv/statisch um (make_static)
//  - "tt" in "bitte"  -> reload_mathjax()  re-rendert alle Formeln
// Bewusst gehalten, da test() der einzige Runtime-Weg ist, den statischen Modus
// (interaktiv=false) ohne Code-Änderung einzuschalten.
export function test(){
    interaktiv = !interaktiv;
    make_static();
}
// MathJax v3 hat kein MathJax.Hub mehr (v2-API). typesetPromise() rendert
// (bzw. re-rendert) alle Formeln im Dokument; ohne geladenes MathJax no-op.
// Re-Typeset baut jede <mjx-container> neu auf und wirft damit die von
// numbering.js injizierten .eq-number-Badges weg -- window.renumber_equations
// (Bruecke statt Import, s. numbering.js) stellt sie danach wieder her.
// Vollstaendiges Neu-Setzen. Wichtig: ein blosses typesetPromise() rendert
// nur NEU hinzugekommene Mathematik -- bereits gesetzte Formeln laesst es
// unberuehrt. Fuer ein echtes Re-Rendering muss der Dokumentzustand
// zurueckgesetzt werden (document.state(0)); texReset() setzt zusaetzlich den
// Gleichungszaehler auf 0, damit die laufenden Nummern wieder bei 1 beginnen
// und zur Zuordnung aus renumber_equations() passen. Ohne texReset zaehlte
// der zweite Lauf bei 89 weiter, die Zuordnung griff ins Leere und der zweite
// Abschnitt lief mit fortlaufenden Nummern statt bei 1.5.1 weiter.
function typeset_alles() {
    // Laufindex fuer tagformat.number (s. index.html) vor jedem Lauf auf null.
    window.eq_run_index = 0;
    if (MathJax.startup && MathJax.startup.document && MathJax.startup.document.state) {
        MathJax.startup.document.state(0);
    }
    if (MathJax.texReset) MathJax.texReset();
    return MathJax.typesetPromise();
}

export function reload_mathjax(){
    if (!(window.MathJax && MathJax.typesetPromise)) return Promise.resolve();
    return typeset_alles().then(() => {
        // Nach dem ersten Lauf steht fest, wie viele nummerierte Zeilen auf
        // welcher Seite liegen -> Zuordnung "laufende Nummer -> 1.4.3" bauen
        // (window-Bruecke statt Import, s. numbering.js). Aendert sie sich,
        // ist ein zweiter Lauf noetig, der die Nummern einsetzt; danach ist
        // sie stabil, also genau ein Nachlauf.
        if (window.renumber_equations && window.renumber_equations()) {
            return typeset_alles();
        }
    }).then(() => {
        // Formelverweise (<a data-ref-eq>) zeigen erst nach dem Typeset die
        // richtige Nummer -- MathJax vergibt sie beim Rendern.
        if (window.resolve_eq_refs) window.resolve_eq_refs();
    });
}
export function toggle_darkmode(){
    darkmode_on = !darkmode_on;
    if(darkmode_on) {
        ge("darkmode_stylesheet").disabled=false
    }
    else {
        ge("darkmode_stylesheet").disabled=true
    }
}

function read_paper_metrics() {
    const paper = ge("paper");
    if (!paper) return null;
    if (paper_base_font_size === null || paper_base_line_height === null) {
        const computed = window.getComputedStyle(paper);
        paper_base_font_size = parseFloat(computed.fontSize) || 16;
        paper_base_line_height = parseFloat(computed.lineHeight);
        if (Number.isNaN(paper_base_line_height)) {
            paper_base_line_height = paper_base_font_size * 1.2;
        }
    }
    return paper;
}

function metrics_for_level(level) {
    const font_scale = [0, 0, 1, 1.2, 1.4, 5 / 3][level] || 1;
    const line_scale = [0, 0, 1, 1.2, 1.4, 5 / 3][level] || 1;
    const font_size = level === 1
        ? Math.max(1, paper_base_font_size - 1)
        : paper_base_font_size * font_scale;
    const line_height = level <= 2
        ? paper_base_line_height
        : paper_base_line_height * line_scale;
    return { font_size, line_height };
}

function sync_text_size_ui() {
    const status = ge("text_size_status");
    const minus = ge("text_size_minus");
    const plus = ge("text_size_plus");
    if (status) status.textContent = "Text " + text_level + "/5";
    if (minus) minus.disabled = text_level <= TEXT_LEVEL_MIN;
    if (plus) plus.disabled = text_level >= TEXT_LEVEL_MAX;
}

function apply_text_size() {
    const paper = read_paper_metrics();
    if (!paper) return;
    const { font_size, line_height } = metrics_for_level(text_level);
    paper.style.setProperty("--paper-base-font-size", paper_base_font_size.toFixed(2) + "px");
    paper.style.setProperty("--paper-base-line-height", paper_base_line_height.toFixed(2) + "px");
    paper.style.setProperty("--paper-font-size", font_size.toFixed(2) + "px");
    paper.style.setProperty("--paper-line-height", line_height.toFixed(2) + "px");
    sync_text_size_ui();
    if (window.relayout_eq_numbers) window.relayout_eq_numbers();
}

export function init_text_size_controls() {
    read_paper_metrics();
    apply_text_size();
}

export function adjust_text_size(step) {
    if (!step) return;
    text_level = Math.min(TEXT_LEVEL_MAX, Math.max(TEXT_LEVEL_MIN, text_level + step));
    apply_text_size();
}

// Breiten-Modus (v2.0): seit der Ablösung der Sticky-Grafikspalte (splitter.js)
// steuert Schmal/Normal/Extrabreit nur noch die max-width der Lesespalte
// #paper -- kein Splitter, kein --scale, kein Stapel-Cap mehr noetig.
function mark_active_width_segment(mode) {
    document.querySelectorAll('[data-action="set_width_mode"]').forEach(el => {
        el.classList.toggle("active", el.dataset.mode === mode);
    });
}

export function set_width_mode(mode, persist = true) {
    if (!CONTENT_WIDTHS[mode]) return;
    const contentW = CONTENT_WIDTHS[mode];
    const content = ge("content");
    const container = ge("container");
    const paper = ge("paper");
    if (content) content.style.width = contentW + "px";
    if (container) container.style.width = (contentW + CONTAINER_SLACK) + "px";
    if (paper) paper.style.setProperty("--paper-max-width", PAPER_MAX_WIDTHS[mode]);
    mark_active_width_segment(mode);
    if (persist) {
        try { localStorage.setItem(WIDTH_STORAGE_KEY, mode); } catch (_) {}
    }
    // Formelnummern koennen bei der neuen Spaltenbreite mit der Formel
    // kollidieren (oder jetzt wieder Platz haben) -- Bruecke zu numbering.js
    // (s. dortiger Kommentar zum core->numbering-Zyklus).
    if (window.relayout_eq_numbers) window.relayout_eq_numbers();
}

export function init_width_mode() {
    let mode = "normal";
    try {
        const s = localStorage.getItem(WIDTH_STORAGE_KEY);
        if (s && CONTENT_WIDTHS[s]) mode = s;
    } catch (_) {}
    set_width_mode(mode, false);
}

export function reset(){
    window.history.pushState("", "", window.location.href.split("#")[0]);
    document.location.reload();
}

// Ruft jede interaktive Figur einmal auf. Die Figuren (figures/*) registrieren
// ihre updateN zur Ladezeit auf window; main.js importiert sie vor dem Aufruf
// von init(), sodass die Referenzen hier existieren. update_all selbst bleibt
// damit frei von Importen auf einzelne Figuren (keine Zyklen).
export function update_all() {
    // Seit v1.7 enthaelt Kapitel 1.4 keine interaktiven Figuren mehr (rein
    // statische v0.13-Abbildungen); die fig_NN-Module sind daher nicht mehr
    // in main.js importiert und window.updateN existiert nicht. Aufruf nur,
    // wenn die Figur registriert ist -> keine Crashes, sobald Figuren
    // schrittweise wieder eingebunden werden, greift das automatisch wieder.
    [1, 9, 3, 31, 32, 5, 51, 6, 8].forEach(n => {
        const fn = window['update' + n];
        if (typeof fn === 'function') fn();
    });
}