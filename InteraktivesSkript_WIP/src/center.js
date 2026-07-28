// center.js — Auto-Zentrierung des Papierbereichs (#content) im Browserfenster.
//
// Zwei Faelle:
//  (A) Fenster breiter als der Papierbereich: #content/#paper sind per CSS
//      (margin:auto + symmetrisches .chapter-body-Grid) bereits
//      browserzentriert -- hier ist nichts zu tun.
//  (B) Fenster schmaler als der Papierbereich -> horizontaler Überlauf: die
//      initiale Scroll-Lage wird so gesetzt, dass #content mittig liegt
//      (window.scrollX = Überlauf/2). Sobald der NUTZER selbst horizontal
//      scrollt, wird die Auto-Zentrierung fuer diese Sitzung ausgesetzt, damit
//      nicht gegen den Nutzer gearbeitet wird.
//
// Ein Breiten-Modus-Wechsel (core.js::set_width_mode) ist ein expliziter
// Layout-Wechsel durch den Nutzer (nicht "aktives Scrollen") und setzt daher die
// Aussetzung zurueck und zentriert einmalig neu.
//
// Kein Import -- center.js geht per document.getElementById aufs DOM und wird
// von main.js::init() aufgerufen. Die Rueckfuehrung aus set_width_mode laeuft
// (wie core.js::window.relayout_eq_numbers) ohne Import-Zyklus ueber
// window.center_recenter.

let userScrolled = false;   // Nutzer hat horizontal gescrollt -> Auto-Zentrierung aus
let centering = false;      // programmatischer Scroll laeuft -> scroll-Listener ignoriert
let lastAutoX = 0;          // letzte Auto-Scroll-Position (zum Erkennen von Nutzer-Abweichung)
let resizeTimer = 0;

function overflow() {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
}

function isPrintContext() {
    // Druck-Tab (?print=true): #container wird ausgeblendet, Auto-Zentrierung
    // waere deplatziert (s. print.js::print_page).
    return location.search.indexOf("print=true") !== -1;
}

function autoCenter() {
    if (userScrolled || isPrintContext()) return;
    const o = overflow();
    if (o <= 1) return;              // kein Überlauf -> Fall A via CSS erledigt
    const target = Math.round(o / 2);
    centering = true;
    lastAutoX = target;
    window.scrollTo({ left: target, top: window.scrollY, behavior: "auto" });
    // Der eigene Scroll-Event feuert asynchron -- erst naechsten Frame wieder
    // auf Nutzer-Scroll hoeren, sonst wuerde die Auto-Zentrierung sich selbst
    // als Nutzer-Eingriff fehlinterpretieren.
    requestAnimationFrame(() => { centering = false; });
}

// Nutzer hat horizontal gescrollt, wenn die Lage (auserhalb eines
// programmatischen centering) um mehr als die Toleranz von der Auto-Mitte
// abweicht. Rein vertikales Scrollen (scrollX bleibt == lastAutoX) zaehlt NICHT
// als "aktives Verschieben".
function onScroll() {
    if (centering) return;
    if (Math.abs(window.scrollX - lastAutoX) > 4) {
        userScrolled = true;
        window.removeEventListener("scroll", onScroll);
    }
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(autoCenter, 120);
}

// Breiten-Modus-Wechsel: Layout-Kontext neu -> einmalig neu zentrieren.
export function center_recenter() {
    userScrolled = false;
    autoCenter();
}

export function init_center() {
    if (isPrintContext()) return;
    window.center_recenter = center_recenter;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // Layout der Kapitel/Figuren steht erst nach init_shell(); der Browser braucht
    // zudem einen Frame, um scrollWidth verlaesslich zu messen -- daher gestaffelt.
    requestAnimationFrame(() => requestAnimationFrame(autoCenter));
}