// print.js — Druckfluss: in neuem Tab oeffnen (?print=true), Druckseite
// klonen, Zoom-Buttons entfernen, QR-Code pro Figur (via qrjs2-CDN-Global),
// Rueckkehr aus QR-Deep-Link (?g=gcN). interaktiv (core) und zoom (ui) werden
// hier gelesen bzw. aufgerufen.

import { ge, show, hide, interaktiv } from './core.js';
import { zoom } from './ui.js';
import { showAllPagesForPrint, restorePagination, getPages, showPage, getCurrentPage } from './pages.js';
import { restoreMarginalia } from './shell.js';
import { toggle_aspekt } from './figures/aspekt_kreisbahn.js';

// Query-Parameter via URLSearchParams (statt vormals manuellem
// findGetParameter-Parser). print (?print=true) und g (?g=gcN) sind die
// einzigen gelesenen Params. auto_print/window.print()-Autostart wurde
// entfernt: der toter Safari-Workaround (auto_print stets false) startete
// nie automatisch; Nutzer druckt manuell (s. #print_instruction).
// Druckmenue („Was drucken?") oeffnen/schliessen — Popover wie #settings.
export function toggle_print_menu() { show("print_menu"); }
export function close_print_menu() { hide("print_menu"); }

// Baut den Druck-Link auf Basis der aktuellen Basis-URL (ohne Hash/Query) +
// Query und oeffnet ihn im neuen Tab. Gemeinsamer Helper fuer init_print
// (alles) und print_scope (komplex/kapitel/abschnitt).
function openPrintTab(query) {
    const base = location.href.split("#")[0].split("?")[0];
    window.open(base + query, '_blank').focus();
}

export function init_print() { //reopen in new tab — alles (Default)
    openPrintTab("?print=true");
}

// Druck-Scope relativ zur aktuellen Seite (Nutzervorgabe 2026-07-24):
// komplex = gesamter Themenkomplex, kapitel = aktueller Abschnitt (h2 + h3s),
// abschnitt = nur die aktuelle Seite. Alles geht ueber init_print() ohne
// Scope-Parameter. Die eigentliche Filterung laeuft im Druck-Tab in
// print_page() anhand der hier uebergebenen page-Id.
export function print_scope(scope) {
    if (scope === "alles") { init_print(); return; }
    const page = getCurrentPage();
    // Ohne aktuelle Seite (sollte nicht vorkommen) Fallback auf alles.
    if (!page) { init_print(); return; }
    openPrintTab("?print=true&scope=" + encodeURIComponent(scope) +
                 "&page=" + encodeURIComponent(page.id));
}

// Keep-Set der zu druckenden Seiten-Ids aus dem Seitenregister (pages.js)
// relativ zur per ?page= uegebenen Seite. null = alles behalten.
function scopeKeepSet(scope, pageId) {
    const pages = getPages();
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx === -1) return null;          // Seite nicht gefunden -> alles
    if (scope === "abschnitt") return new Set([pageId]);
    if (scope === "kapitel") {
        //Aktueller Abschnitt = naechstgelegene h2-Seite + folgende h3s bis
        // zur naechsten h2 (exklusiv).
        let start = idx;
        while (start > 0 && pages[start].level !== "h2") start--;
        let end = pages.length;
        for (let j = start + 1; j < pages.length; j++) {
            if (pages[j].level === "h2") { end = j; break; }
        }
        return new Set(pages.slice(start, end).map(p => p.id));
    }
    if (scope === "komplex") {
        const tk = pages[idx].tk ? pages[idx].tk.num : null;
        if (tk === null) return null;
        return new Set(pages.filter(p => p.tk && p.tk.num === tk).map(p => p.id));
    }
    return null;
}

function applyPrintScope(pc) {
    const scope = getParam("scope");
    const pageId = getParam("page");
    if (!scope || !pageId) return;        // Default: alles drucken
    const keep = scopeKeepSet(scope, pageId);
    if (!keep) return;                    // Fallback alles
    pc.querySelectorAll(".chapter-page").forEach(pgEl => {
        if (!keep.has(pgEl.dataset.pageId)) pgEl.remove();
    });
}
export function check_print() { //check if this page was just opened in a new tab for printing
    if (getParam("print") === "true") {
        print_page();
    }
}

export function print_page() {
    // Alle Kapitelseiten sichtbar machen, bevor #container geklont wird --
    // sonst enthaelt der Ausdruck nur die gerade aktive Seite (Paginierung,
    // s. pages.js). restoreMarginalia() stellt zuvor in die Marginalie
    // verschobene .anmerkung-Boxen an ihren Platz in der jeweiligen Seite
    // zurueck, damit jede Seite im Ausdruck vollstaendig ist.
    restoreMarginalia();
    showAllPagesForPrint();

    var pc = ge("print_container");
    pc.innerHTML = ge("container").innerHTML;
    // Kapitelbilder tragen loading="lazy" (BACKLOG P22-1, s. chapters.js): im
    // Ausdruck muessen aber auch die Bilder der Seiten erscheinen, die am
    // Bildschirm nie sichtbar waren. Im Klon daher zurueck auf eager — der
    // Browser holt sie dann sofort, noch bevor der Druckdialog rendert.
    pc.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
    show("print_container");
    show("print_instruction");
    hide("container");
    hide("header");
    hide("toc_container");

    restorePagination();

    // Druck-Scope (Nutzervorgabe „Was drucken?"): relativ zur per ?page=
    // uebergebenen Seite nur die gewaehlte Menge behalten, den Rest aus dem
    // Klon entfernen. Fehlt scope/page -> alles (Default, bisheriges Verhalten).
    applyPrintScope(pc);

    // Der Klon aendert die Dokumentreihenfolge, aus der MathJax seine laufenden
    // Gleichungsnummern vergibt: #print_container steht VOR #container, und der
    // Teildruck hat daraus gerade Seiten entfernt. Die Zuordnung
    // "laufende Nummer -> 1.4.3" muss deshalb hier neu gebaut werden, nachdem
    // der Klon seinen endgueltigen Seitenbestand hat und BEVOR MathJax laeuft
    // (typesetAfterLoad haengt an MathJax.startup.promise, also an einem
    // Microtask nach dieser synchronen init()-Kette). Ohne das trug der
    // Abschnittsdruck der Lorentzkraft die Nummern 0.1.1 ff. statt 2.3.14 ff.
    // window-Bruecke statt Import, s. numbering.js.
    if (window.renumber_equations) window.renumber_equations();

    // Breiten-Modus vom Druck ENTkoppeln (Nutzer-Feedback): set_width_mode
    // setzt Inline-Breiten auf #content (width) und #paper (--paper-max-width);
    // die wandern beim Klonen mit und wuerden per Inline-Spezifitaet die
    // A4-Druck-CSS schlagen -> der Ausdruck haenge sonst an Schmal/Normal/Breit.
    // Papier ist immer A4, also die Inline-Breiten im Klon entfernen. Die
    // Schriftgroesse (--paper-font-size / --paper-line-height etc.) bleibt
    // bewusst erhalten -- sie ist die einzige Einstellung, die fuer den Druck
    // sinnvoll ist.
    const pcContent = pc.querySelector("#content");
    if (pcContent) pcContent.style.removeProperty("width");
    const pcPaper = pc.querySelector("#paper");
    if (pcPaper) pcPaper.style.removeProperty("--paper-max-width");

    const gci = pc.querySelectorAll(".grafik-container-inner");
    for(let i=0;i<gci.length;i++){
        gci[i].setAttribute("style","position:static;")
    }
    const zm = pc.querySelectorAll(".zoom_maximize");
    for(let i=0;i<zm.length;i++){
        zm[i].remove();
    }
    // Kapitel-App-Shell (Breadcrumb-Leiste, linke Rail, Tablet-Drawer) ist
    // fuer den Ausdruck ohne Wert -- entfernen, uebrig bleibt der reine
    // Lesefluss aller Seiten.
    ["#chapter_appbar", "#chapter_rail_desktop_wrap", "#chapter_drawer", "#chapter_marginalia"].forEach(sel => {
        pc.querySelectorAll(sel).forEach(n => n.remove());
    });
    const gc = pc.querySelectorAll(".grafik-container");
    for(let i=0;i<gc.length;i++){
        create_qr(gc[i], gc[i].id);
    }
    // QR pro Aspekt-Figur (Option B): der Druck zeigt die interaktive Figur als
    // Vektor-SVG, nicht mehr das statische .nur-druck-PNG (das unsichtbar
    // bleibt, s. aspekt_kreisbahn.css). Der QR linkt zurueck auf
    // ?g=<aspekt-figur-id>. data-figref wird hier nicht mehr gebraucht
    // (label_aspekt_figuren/Nummerierung nutzen es weiter).
    //
    // Der QR wird NEBEN die Figur gehaengt, nicht hinein: `.aspekt-figur` traegt
    // `position:relative; overflow:hidden` (aspekt_kreisbahn.css) und hat den
    // absolut positionierten QR angeschnitten — gemessen lagen 121 px ueber der
    // Grafik und 85 px wurden weggeschnitten, ein angeschnittener Code ist nicht
    // mehr scanbar. Deshalb Figur + QR als Zeile (.qr_row), Anordnung wie im
    // Legacy (QR rechts neben der Grafik), aber ohne dessen festes left:528px,
    // das aus der 700-px-Druckspalte stammte.
    pc.querySelectorAll(".aspekt-figur").forEach(af => {
        const linkId = af.id;
        if (!linkId) return;
        const row = document.createElement("div");
        row.setAttribute("class", "qr_row");
        af.parentNode.insertBefore(row, af);
        row.appendChild(af);
        // Die Bildunterschrift wandert aus der Figur eine Ebene hoch, damit die
        // Figur die volle Spaltenbreite bekommt und Caption + QR zweispaltig
        // DARUNTER stehen (statt Figur+Caption links, QR rechts — dabei blieb
        // fuer die Grafik zu wenig Breite). Nur im Druck-Klon; am Bildschirm
        // bleibt die Caption, wo sie ist.
        const cap = af.querySelector(".aspekt-caption");
        if (cap) row.appendChild(cap);
        create_qr(row, linkId);
    });

    document.body.setAttribute("style","background-color:#fff;margin-top:0px;margin-left:100px;");
}

// QR-Code erzeugen und an targetEl anhaengen; der QR verweist auf
// ?g=<linkId> (z. B. die id einer .aspekt-figur oder eines Legacy-gcN).
// Verallgemeinert aus dem ehemaligen create_qr(element_id), das Ziel und
// Link-ID gleichsetzte und per insertBefore oben einsetzte — fuer <figure>
// ist append (unten) sauberer, und Ziel (gedrucktes Bild) != Link (interaktive
// Figur) sind jetzt bewusst trennbar.
export function create_qr(targetEl, linkId) {
    if (!targetEl) return;
    var div_container = document.createElement("div");
    var link = location.href.split("?")[0].split("#")[0]+"?g="+linkId;
    var div = document.createElement("div"),
    text = link,
    qr = QRCode.generateSVG(text, {
        ecclevel: "M",
        fillcolor: "#fff",
        textcolor: "#000",
        margin: 3,
        modulesize: 3
      });
    div.appendChild(qr);
    div_container.appendChild(div);
    div_container.setAttribute("class","qr_container");

    var title2 = document.createElement("div");
    title2.setAttribute("class","qr_title");
    // Neutraler Hinweis (frueher ILIAS-spezifisch „Sie muessen im Ilias
    // angemeldet sein"), unabhaengig von der konkreten Hosting-Plattform.
    title2.innerHTML = "<a href='"+link+"'>"+link+"</a><br><br><i>Interaktive Version im Browser öffnen</i>";
    div_container.appendChild(title2);

    targetEl.appendChild(div_container);
}
export function from_qr(){ //if user comes to this site via the qr code link
    const g = getParam("g");
    if (!g) return;
    const el = ge(g);
    if (el && el.classList.contains("aspekt-figur")) {
        // Paginierungs-bewusst (Variante A): die Seite der Figur einblenden,
        // dann das Lupe-Overlay oeffnen — Analogon zum Legacy-zoom(), das auf
        // einer Aspekt-Figur kein Ziel hat. showPage vor dem Overlay, damit die
        // Figur sichtbar ist, bevor toggle_aspekt den Klon anlegt; ein rAF
        // reicht fuer das Layout nach dem Seitenwechsel.
        const page = getPages().find(p => p.el.contains(el));
        if (page) showPage(page.id, { pushState: false });
        requestAnimationFrame(() => {
            const lupe = el.querySelector(".aspekt-lupe");
            if (lupe) toggle_aspekt(lupe);
        });
        return;
    }
    // Legacy: ?g=gcN ueber den zoom()-Overlay der alten interaktiven Container.
    if(!interaktiv) { //statisch
        setTimeout(function(){
            window.location = location.href.split("#")[0]+"#"+g;
            zoom(ge(g));
        }, 100);
    }
    else { //interaktiv
        window.location = location.href.split("#")[0]+"#"+g;
        zoom(ge(g));
    }
}
function getParam(name) {
    return new URLSearchParams(location.search).get(name);
}