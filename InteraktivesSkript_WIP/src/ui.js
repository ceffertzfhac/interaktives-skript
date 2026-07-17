// ui.js — Inhaltsverzeichnis, Kontakt-Anker, Zoom-Overlay, Pause-Button.
// close_zoom() ruft update_all() (core), daher Abhaengigkeit auf core.
// generate_toc()/toc() bauen das Akkordeon aus dem pages.js-Seitenregister
// (Kapitel = h2-Ueberschrift, Unterabschnitte = h3), Klicks navigieren ueber
// showPage() statt per Anker-Sprung -- andere Seiten sind per Paginierung
// display:none, ein reiner Anker-Sprung wuerde ins Leere zeigen.

import { ge, show, hide, toggle_visibility, update_all } from './core.js';
import { getPages, showPage, getCurrentPage } from './pages.js';

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

// toc() oeffnet/schliesst den TOC-Vollbild-"Screen" (v2.1, Mockup-Vorlage:
// eigene Ansicht statt schmalem Slide-over, s. styles.css). Bug-Fix (BACKLOG.md
// P2, aus der urspruenglichen Slide-over-Version uebernommen): die
// Schliessen-Animation muss ablaufen, bevor "hidden" gesetzt wird, und
// toggle_body_scroll() laeuft symmetrisch zu zoom()/close_zoom().
const TOC_ANIM_MS = 300;
let toc_hide_timer = null;

export function toc(){
    const container = ge("toc_container");
    if(container.classList.contains("hidden")) {
        clearTimeout(toc_hide_timer);
        container.classList.remove("toc_hiding");
        generate_toc(); // aktuelle Seite kann sich seit dem letzten Aufbau geaendert haben (Rail/Pagenav-Navigation)
        show("toc_container");
        document.body.classList.add("toc-open"); // blendet #header aus, s. styles.css
        toggle_body_scroll();
        const search = ge("toc_search");
        if (search) { search.value = ""; search.focus({ preventScroll: true }); }
    }
    else {
        container.classList.add("toc_hiding");
        document.body.classList.remove("toc-open");
        toggle_body_scroll();
        toc_hide_timer = setTimeout(() => {
            hide("toc_container");
            container.classList.remove("toc_hiding");
        }, TOC_ANIM_MS);
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
    const inner = document.createElement("div");
    inner.id = "toc_content_inner";
    toc_c.appendChild(inner);

    const pages = getPages();
    const current = getCurrentPage();
    const groups = [];
    let cur = null;
    pages.forEach(p => {
        if (p.level === "h2") { cur = { chapter: p, subs: [] }; groups.push(cur); }
        else if (cur) cur.subs.push(p);
        else { cur = { chapter: p, subs: [] }; groups.push(cur); }
    });

    groups.forEach((g) => {
        const isCurrentGroup = g.chapter === current || g.subs.includes(current);
        const groupEl = document.createElement("div");
        groupEl.className = "toc_group" + (isCurrentGroup ? " toc_group_current" : "");
        groupEl.dataset.tocSearch = (g.chapter.title + " " + g.subs.map(s => s.title).join(" ")).toLowerCase();

        const numMatch = g.chapter.title.match(/^[0-9]+(?:\.[0-9]+)*/);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toc_group_header";
        btn.innerHTML =
            "<span class='toc_group_number'>" + (numMatch ? "Kap. " + numMatch[0] : "") + "</span>" +
            "<span class='toc_group_title'>" + g.chapter.title.replace(/^[0-9.]+\s*/, "") + "</span>" +
            "<span class='toc_group_chevron'>▾</span>";
        groupEl.appendChild(btn);

        const body = document.createElement("div");
        body.className = "toc_group_body";
        g.subs.forEach(sub => {
            const isCurrentSub = sub === current;
            const a = document.createElement("a");
            a.href = "#" + sub.id;
            a.className = "toc_sub_link" + (isCurrentSub ? " toc_sub_current" : "");
            a.innerHTML = "<span class='toc_sub_marker'>" + (isCurrentSub ? "●" : "○") + "</span>" + sub.title;
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
        inner.appendChild(groupEl);

        if (!isCurrentGroup) groupEl.classList.add("toc_group_collapsed");
        btn.addEventListener("click", () => {
            if (g.subs.length === 0) return; // navigiert bereits, s.o.
            groupEl.classList.toggle("toc_group_collapsed");
        });
    });

    syncTocState();
    return pages;
}

// Position-Anzeige in der TOC-Leiste: die aktuelle Seite, keine erfundene
// "% gelesen"-Kennzahl (dafuer gibt es keine echte Fortschritts-Verfolgung,
// s. CLAUDE.md-Entscheidung gegen erfundene Status-Icons).
function syncTocState() {
    const posEl = ge("toc_position");
    if (!posEl) return;
    const pages = getPages();
    const current = getCurrentPage();
    if (!current) { posEl.textContent = ""; return; }
    const idx = pages.indexOf(current) + 1;
    posEl.textContent = "Aktuell: " + current.title + " · " + idx + "/" + pages.length;
}

// Live-Filter (data-action="toc_search", input-Event ueber den zentralen
// Binder in main.js): Gruppen ohne Treffer im Titel/Unterabschnitte werden
// ausgeblendet, Treffer-Gruppen automatisch aufgeklappt.
export function toc_filter(query) {
    const inner = ge("toc_content_inner");
    if (!inner) return;
    const q = query.trim().toLowerCase();
    const groups = Array.from(inner.querySelectorAll(".toc_group"));
    let anyVisible = false;
    groups.forEach(g => {
        const matches = q === "" || (g.dataset.tocSearch || "").includes(q);
        g.style.display = matches ? "" : "none";
        if (matches) anyVisible = true;
        if (q !== "" && matches) g.classList.remove("toc_group_collapsed");
    });
    let empty = inner.querySelector(".toc_empty_state");
    if (!anyVisible) {
        if (!empty) {
            empty = document.createElement("div");
            empty.className = "toc_empty_state";
            empty.textContent = "Keine Treffer für „" + query.trim() + "“.";
            inner.appendChild(empty);
        } else {
            empty.textContent = "Keine Treffer für „" + query.trim() + "“.";
        }
    } else if (empty) {
        empty.remove();
    }
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