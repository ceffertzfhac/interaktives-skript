// lib/svg-text.js — gemischt kursive SVG-Achsentexte (portiert aus
// Projects_InteraktiveSimulation/shared/js/svg-text.js).
const SVGNS = 'http://www.w3.org/2000/svg';

// Achsenbeschriftung "Größe / Einheit": Symbol kursiv, Einheit aufrecht. Fehlt
// der " / "-Trenner (reines Symbol ohne Einheit, z.B. "φ"), wird alles kursiv.
export function setAxisLabel(textEl, text) {
    while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
    const sep = text.indexOf(' / ');
    if (sep === -1) {
        const sym = document.createElementNS(SVGNS, 'tspan');
        sym.setAttribute('font-style', 'italic');
        sym.textContent = text;
        textEl.appendChild(sym);
        return;
    }
    const qty = document.createElementNS(SVGNS, 'tspan');
    qty.setAttribute('font-style', 'italic');
    qty.textContent = text.slice(0, sep);
    textEl.appendChild(qty);
    const unit = document.createElementNS(SVGNS, 'tspan');
    unit.textContent = text.slice(sep);
    textEl.appendChild(unit);
}

// Diagrammtitel "Wort Symbol(t)": führender Text aufrecht, letztes Wort kursiv.
export function setGraphTitle(textEl, text) {
    while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
    const sep = text.lastIndexOf(' ');
    if (sep === -1) { textEl.textContent = text; return; }
    const word = document.createElementNS(SVGNS, 'tspan');
    word.textContent = text.slice(0, sep + 1);
    textEl.appendChild(word);
    const sym = document.createElementNS(SVGNS, 'tspan');
    sym.setAttribute('font-style', 'italic');
    sym.textContent = text.slice(sep + 1);
    textEl.appendChild(sym);
}
