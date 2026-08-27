// tooltip.js — Hover-/Fokus-Erklärungen für Bedienelemente ohne sichtbare
// Beschriftung (BACKLOG P20).
//
// WARUM ES DAS GIBT: vorher trugen alle Icon-Knöpfe ein natives `title`. Das
// erscheint NUR bei Maus-Hover — nicht bei Tastaturfokus und nicht auf Touch —,
// wartet ~1 s, verschwindet nach ~5 s, ist nicht gestaltbar (OS-Farben,
// ignoriert Darkmode und die CVD-Paletten) und wird von manchen Screenreadern
// zusätzlich zum `aria-label` vorgelesen. Der Hauptgewinn hier ist deshalb
// nicht die Optik, sondern `:focus-visible`.
//
// ANBINDUNG (deklarativ, wie `data-action` in main.js):
//   <button data-tip="Einstellungen"
//           data-tip-desc="Textgröße, Ansichtsbreite und Farbpalette">
// Ein neuer Knopf kostet damit ein Attribut, keine Codeänderung. `data-tip-desc`
// ist optional — Regel aus P20-0: einzeilig, zweizeilig nur wo nötig.
//
// FALLSTRICK, an dem eine naive Umsetzung scheitert: `.aspekt-figur` trägt
// `overflow: hidden` (aspekt_kreisbahn.css). Ein Tooltip als KIND des Auslösers
// würde dort abgeschnitten — genau so ist der QR-Code im Druck halbiert worden
// (c8b8928). Deshalb liegt das Sprechblasen-Element EINMAL an `document.body`
// und wird über die Bildschirmkoordinaten des Auslösers positioniert.
//
// Der Auslöser behält seinen `aria-label` als zugänglichen Namen; der Tooltip
// hängt nur solange er sichtbar ist per `aria-describedby` daran. Ein
// vorhandenes `title` wird beim ersten Anzeigen entfernt, sonst erscheint der
// OS-Tooltip zusätzlich.

const ZEIGEN_MS = 250;   // Verzögerung vor dem Einblenden
const BLENDEN_MS = 60;   // Nachlauf beim Verlassen
const WARM_MS = 500;     // "warmes" Fenster: der nächste Tooltip kommt sofort
const ABSTAND = 8;       // Luft zwischen Auslöser und Sprechblase
const RAND = 8;          // Mindestabstand zum Viewport-Rand

let blase = null;        // das eine Sprechblasen-Element
let aktiv = null;        // aktueller Auslöser
let zeigenTimer = 0, blendenTimer = 0, warmBis = 0;
let id = 0;

function feinerZeiger() {
    return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function baueBlase() {
    if (blase) return blase;
    blase = document.createElement('div');
    blase.className = 'tooltip';
    blase.setAttribute('role', 'tooltip');
    blase.id = 'tooltip-blase';
    blase.hidden = true;
    document.body.appendChild(blase);
    return blase;
}

// Bevorzugt oberhalb; kippt nach unten, wenn oben kein Platz ist. Horizontal
// mittig zum Auslöser, aber am Viewport geklemmt — sonst ragt ein Tooltip am
// rechten Rand (Toolbar!) hinaus.
function positioniere(el) {
    const a = el.getBoundingClientRect();
    const b = blase.getBoundingClientRect();
    let oben = a.top - b.height - ABSTAND;
    let unten = false;
    if (oben < RAND) { oben = a.bottom + ABSTAND; unten = true; }
    let links = a.left + a.width / 2 - b.width / 2;
    links = Math.max(RAND, Math.min(links, window.innerWidth - b.width - RAND));
    blase.style.top = Math.round(oben) + 'px';
    blase.style.left = Math.round(links) + 'px';
    blase.dataset.seite = unten ? 'unten' : 'oben';
    // Pfeil auf die Mitte des Auslösers, relativ zur (geklemmten) Blase.
    const pfeil = Math.round(a.left + a.width / 2 - links);
    blase.style.setProperty('--tooltip-pfeil', Math.max(12, Math.min(pfeil, b.width - 12)) + 'px');
}

function zeige(el) {
    const titel = el.dataset.tip;
    if (!titel) return;
    baueBlase();
    // Das native title entfernen, sonst kommt der OS-Tooltip obendrauf. Der
    // Text bleibt über data-tip erhalten, der Name über aria-label.
    if (el.hasAttribute('title')) el.removeAttribute('title');

    const desc = el.dataset.tipDesc;
    blase.textContent = '';
    const t = document.createElement('span');
    t.className = 'tooltip-titel';
    t.textContent = titel;
    blase.appendChild(t);
    if (desc) {
        const d = document.createElement('span');
        d.className = 'tooltip-desc';
        d.textContent = desc;
        blase.appendChild(d);
    }
    blase.hidden = false;
    blase.classList.toggle('tooltip-zweizeilig', !!desc);
    // Erst einblenden, wenn die Position steht — sonst blitzt sie oben links auf.
    positioniere(el);
    blase.classList.add('tooltip-sichtbar');
    if (!blase.id) blase.id = 'tooltip-blase-' + (++id);
    el.setAttribute('aria-describedby', blase.id);
    aktiv = el;
}

function verstecke() {
    if (!blase) return;
    blase.classList.remove('tooltip-sichtbar');
    blase.hidden = true;
    if (aktiv) aktiv.removeAttribute('aria-describedby');
    warmBis = Date.now() + WARM_MS;
    aktiv = null;
}

function planeZeigen(el) {
    clearTimeout(blendenTimer);
    clearTimeout(zeigenTimer);
    if (aktiv === el) return;
    // Wandert der Zeiger direkt auf einen Nachbarknopf, erscheint der nächste
    // Tooltip ohne Verzögerung — sonst fühlt sich eine Icon-Leiste zäh an.
    const sofort = Date.now() < warmBis;
    zeigenTimer = setTimeout(() => zeige(el), sofort ? 0 : ZEIGEN_MS);
}

function planeVerstecken() {
    clearTimeout(zeigenTimer);
    clearTimeout(blendenTimer);
    blendenTimer = setTimeout(verstecke, BLENDEN_MS);
}

const ziel = (ev) => ev.target.closest && ev.target.closest('[data-tip]');

export function init_tooltips() {
    // Delegiert an document — deckt damit auch die Figuren ab, die erst zur
    // Laufzeit gebaut werden (init_aspekt_figuren), ohne Nachverdrahtung.
    document.addEventListener('pointerover', ev => {
        if (!feinerZeiger()) return;
        const el = ziel(ev);
        if (el) planeZeigen(el); else if (aktiv) planeVerstecken();
    });
    document.addEventListener('pointerout', ev => {
        const el = ziel(ev);
        if (el && el === aktiv) planeVerstecken();
    });
    // Tastatur: der eigentliche Gewinn gegenüber title. focusin/out, weil focus
    // nicht blubbert. :focus-visible haelt Maus-Klicks heraus.
    document.addEventListener('focusin', ev => {
        const el = ziel(ev);
        if (el && el.matches(':focus-visible')) planeZeigen(el);
    });
    document.addEventListener('focusout', ev => {
        if (ziel(ev) === aktiv) planeVerstecken();
    });
    // Beim Klick verschwinden: der Tooltip hat seinen Zweck erfuellt, und bei
    // Zustandsknoepfen (Lupe) waere der Text sonst sofort veraltet.
    document.addEventListener('pointerdown', verstecke, true);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') verstecke(); });
    // Nicht nachfuehren, sondern ausblenden — spart die Reposition-Schleife und
    // ist das uebliche Verhalten.
    window.addEventListener('scroll', verstecke, true);
    window.addEventListener('resize', verstecke);
}
