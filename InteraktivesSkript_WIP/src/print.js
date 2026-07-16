// print.js — Druckfluss: in neuem Tab oeffnen (?print=true), Druckseite
// klonen, Zoom-Buttons entfernen, QR-Code pro Figur (via qrjs2-CDN-Global),
// Rueckkehr aus QR-Deep-Link (?g=gcN). interaktiv (core) und zoom (ui) werden
// hier gelesen bzw. aufgerufen.

import { ge, show, hide, interaktiv } from './core.js';
import { zoom } from './ui.js';

export let auto_print = false; //Safari blocks autoprint...

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
    if (findGetParameter("print") == "true") {
        print_page();
    }
}

export function print_page() {
    var pc = ge("print_container");
    pc.innerHTML = ge("container").innerHTML;
    show("print_container");
    show("print_instruction");
    hide("container");
    hide("header");
    hide("toc_container");

    const gci = pc.querySelectorAll(".grafik-container-inner");
    for(let i=0;i<gci.length;i++){
        gci[i].setAttribute("style","position:static;")
    }
    const zm = pc.querySelectorAll(".zoom_maximize");
    for(let i=0;i<zm.length;i++){
        zm[i].remove();
    }
    const gc = pc.querySelectorAll(".grafik-container");
    for(let i=0;i<gc.length;i++){
        create_qr(gc[i].id);
    }

    document.body.setAttribute("style","background-color:#fff;margin-top:0px;margin-left:100px;");

    if (auto_print) {
        window.print();
    }
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
    const g = findGetParameter("g");
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
export function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search.substr(1).split("&").forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}