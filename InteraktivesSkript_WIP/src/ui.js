// ui.js — Inhaltsverzeichnis, Kontakt-Anker, Zoom-Overlay, Pause-Button.
// close_zoom() ruft update_all() (core), daher Abhaengigkeit auf core.

import { ge, show, hide, toggle_visibility, update_all } from './core.js';

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

export function toc(){
    const content = ge("toc_content");
    const container = ge("toc_container");
    content.classList.remove("toc_hide");
    content.classList.remove("toc_show");
    if(container.classList.contains("hidden")) {
        show("toc_container");
        content.classList.add("toc_show");
    }
    else {
        hide("toc_container");
    }
}
export function generate_toc(){
    const h = document.getElementsByClassName("inhaltsverzeichnis");
    const toc_c = ge("toc_content");
    for (let i = 0;i<h.length;i++) {
        h[i].setAttribute("id","toc_"+i);
        const t = h[i].innerHTML;
        toc_c.innerHTML += "<a href='#" + h[i].id + "' class='toc_" + h[i].tagName + "'>" + t + "</a><br>";
    }

    return h;
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