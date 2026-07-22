// print.js — Druckfluss: in neuem Tab oeffnen (?print=true), Druckseite
// klonen, Zoom-Buttons entfernen, QR-Code pro Figur (via qrjs2-CDN-Global),
// Rueckkehr aus QR-Deep-Link (?g=gcN). interaktiv (core) und zoom (ui) werden
// hier gelesen bzw. aufgerufen.

import { ge, show, hide, interaktiv } from './core.js';
import { zoom } from './ui.js';
import { showAllPagesForPrint, restorePagination } from './pages.js';
import { restoreMarginalia } from './shell.js';

// Query-Parameter via URLSearchParams (statt vormals manuellem
// findGetParameter-Parser). print (?print=true) und g (?g=gcN) sind die
// einzigen gelesenen Params. auto_print/window.print()-Autostart wurde
// entfernt: der toter Safari-Workaround (auto_print stets false) startete
// nie automatisch; Nutzer druckt manuell (s. #print_instruction).
export function init_print() { //reopen in new tab
    let link = "";
    if(location.href.split("#").length==2) {
        link = location.href.split("#")[0]+"?print=true";
    }
    else {
        link = location.href+"?print=true";
    }
    window.open(link, '_blank').focus();
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
    show("print_container");
    show("print_instruction");
    hide("container");
    hide("header");
    hide("toc_container");

    restorePagination();

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
        create_qr(gc[i].id);
    }

    document.body.setAttribute("style","background-color:#fff;margin-top:0px;margin-left:100px;");
}

export function create_qr(element_id) {
    var div_container = document.createElement("div");
    var link = location.href.split("?")[0].split("#")[0]+"?g="+element_id;
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
    //ge(element_id).appendChild(div);
    div_container.appendChild(div);
    div_container.setAttribute("class","qr_container");

    var title2 = document.createElement("div");
    title2.setAttribute("class","qr_title");
    title2.innerHTML = "<a href='"+link+"'>"+link+"</a><br><br><i>Hinweis: Sie müssen im Ilias angemeldet sein</i>";
    div_container.appendChild(title2);


    ge(element_id).insertBefore(div_container,ge(element_id).firstChild);

}
export function from_qr(){ //if user comes to this site via the qr code link
    const g = getParam("g");
    if(!interaktiv) { //statisch
        setTimeout(function(){
            if(g) {
                window.location = location.href.split("#")[0]+"#"+g;
                zoom(ge(g));

            }
        }, 100);
    }
    else { //interaktiv
        if(g) {
            window.location = location.href.split("#")[0]+"#"+g;
            zoom(ge(g));

        }
    }
}
function getParam(name) {
    return new URLSearchParams(location.search).get(name);
}