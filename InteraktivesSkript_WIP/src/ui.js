// ui.js — Inhaltsverzeichnis, Kontakt-Anker, Zoom-Overlay, Pause-Button.
// close_zoom() ruft update_all() (core), daher Abhaengigkeit auf core.
// generate_toc()/toc() bauen das Akkordeon aus dem pages.js-Seitenregister
// (Kapitel = h2-Ueberschrift, Unterabschnitte = h3), Klicks navigieren ueber
// showPage() statt per Anker-Sprung -- andere Seiten sind per Paginierung
// display:none, ein reiner Anker-Sprung wuerde ins Leere zeigen.

import { ge, show, hide, toggle_visibility, update_all } from './core.js';
import { getPages, showPage } from './pages.js';

export let zoom_enabled = false;

export function toggle_body_scroll() {
    const cl = document.body.classList;
    if(cl.contains("no_scroll")) {
        cl.remove("no_scroll");
    }
    else {
        cl.add("no_scroll");
    }
}

export function zoom(parent_gc) {
    const scource_div = parent_gc;
    show("zoom_overlay");
    const target_div = ge("zoom_content");
    target_div.innerHTML = scource_div.innerHTML;
    target_div.firstElementChild.setAttribute("style","position:static;");
    //target_div.firstElementChild.classList.add("grafik-inner-zoom");
    show("zoom");
    if(zoom_enabled) {
        close_zoom();
        zoom_enabled = false;
    }
    else {
        zoom_enabled = true;
        toggle_body_scroll();
    }

    let wh = window.innerHeight-80;
    let ww = window.innerWidth-80;
    let th = target_div.clientHeight;
    let tw = target_div.clientWidth;
    let zoom_faktor = 1;
    zoom_faktor = Math.min(wh/th,ww/tw);
    if(zoom_faktor > 3){
        zoom_faktor = 3;
    }

    target_div.setAttribute("style","transform: scale("+zoom_faktor+");");
    ge("zoom").setAttribute("style","width: " + (zoom_faktor*tw+20) + "px;height: " + (zoom_faktor*th+20) + "px;");
    document.querySelector(".zoom_button").classList.add("zoom_minimize");


}

export function close_zoom(){
    toggle_body_scroll();
    hide("zoom_overlay");
    hide("zoom");
    zoom_enabled = false;
    ge("zoom_content").innerHTML="";
    update_all();
}

// toc() oeffnet/schliesst das TOC-Akkordeon. Bug-Fix (BACKLOG.md P2): frueher
// referenzierte "toc_hide" faelschlich die Show-Keyframes (Copy-Paste), und
// hide("toc_container") setzte sofort display:none, ohne die Hide-Animation
// abspielen zu lassen; ausserdem fehlte toggle_body_scroll() (im Gegensatz zu
// zoom()/close_zoom(), die es nutzen) -- daher blieb u.U. ein Scroll-Balken-
// Rest sichtbar. Jetzt: beim Schliessen erst toc_hide abspielen lassen, erst
// danach "hidden" setzen; toggle_body_scroll() symmetrisch bei Auf/Zu.
const TOC_ANIM_MS = 350;
let toc_hide_timer = null;

export function toc(){
    const content = ge("toc_content");
    const container = ge("toc_container");
    if(container.classList.contains("hidden")) {
        clearTimeout(toc_hide_timer);
        show("toc_container");
        content.classList.remove("toc_hide");
        content.classList.add("toc_show");
        toggle_body_scroll();
    }
    else {
        content.classList.remove("toc_show");
        content.classList.add("toc_hide");
        toggle_body_scroll();
        toc_hide_timer = setTimeout(() => hide("toc_container"), TOC_ANIM_MS);
    }
}

// generate_toc() baut ein Akkordeon aus dem pages.js-Seitenregister: eine
// Gruppe pro h2-Seite (Kapitel), darunter ihre h3-Seiten (Unterabschnitte) als
// Links. Generisch aus .inhaltsverzeichnis abgeleitet -- ein neues Kapitel
// (weiteres h2 + h3-Folge in einer kuenftigen chapters/ch_NN-Datei) erscheint
// hier automatisch als weitere Gruppe, ohne Code-Aenderung.
export function generate_toc(){
    const toc_c = ge("toc_content");
    if (!toc_c) return [];
    toc_c.innerHTML = "";
    const pages = getPages();
    const groups = [];
    let cur = null;
    pages.forEach(p => {
        if (p.level === "h2") { cur = { chapter: p, subs: [] }; groups.push(cur); }
        else if (cur) cur.subs.push(p);
        else { cur = { chapter: p, subs: [] }; groups.push(cur); }
    });

    groups.forEach((g, gi) => {
        const groupEl = document.createElement("div");
        groupEl.className = "toc_group";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toc_group_header";
        btn.innerHTML = "<span class='toc_group_title'>" + g.chapter.title + "</span><span class='toc_group_chevron'>▾</span>";
        groupEl.appendChild(btn);

        const body = document.createElement("div");
        body.className = "toc_group_body";
        g.subs.forEach(sub => {
            const a = document.createElement("a");
            a.href = "#" + sub.id;
            a.className = "toc_sub_link";
            a.textContent = sub.title;
            a.dataset.action = "goto_page";
            a.dataset.arg = sub.id;
            a.addEventListener("click", () => toc());
            body.appendChild(a);
        });
        if (g.subs.length === 0) {
            // Kapitel ohne Unterabschnitte (z.B. reine Intro-Seite): Klick auf
            // die Kopfzeile selbst navigiert.
            btn.dataset.action = "goto_page";
            btn.dataset.arg = g.chapter.id;
            btn.addEventListener("click", () => toc());
        }
        groupEl.appendChild(body);
        toc_c.appendChild(groupEl);

        btn.addEventListener("click", () => {
            if (g.subs.length === 0) return; // navigiert bereits, s.o.
            groupEl.classList.toggle("toc_group_collapsed");
        });
    });

    return pages;
}
export function kontakt() {
    if(window.scrollY >= 70) {
        show("kontakt");
    }
    else {
        toggle_visibility("kontakt");
    }
    window.scrollTo(0, 0);

}
export function offsetAnchor() {
    if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 70);
    }
}

export function pause(button) {
    //let gc_id = button.parentElement.parentElement.id.replace("gc","");
    if(button.value == "Pause") {
        button.value = "Play";
    }

    else if(button.value == "Play") {
        button.value = "Pause";
    }

    else {
        alert("ERROR: Pause Button unexpected value");
        }
}