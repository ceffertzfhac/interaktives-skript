// lib/vectors.js — Pfeilspitzen-Geometrie (portiert aus
// Projects_InteraktiveSimulation/shared/js/vectors.js).
//
// Schaft um Marker-Laenge `by` kuerzen, sodass eine refX=0-Pfeilspitze exakt
// auf (x2,y2) landet. Bei `len < by` (Vektor kuerzer als die Pfeilspitze) wird
// null zurueckgegeben -- der Aufrufer muss den Vektor dann verbergen statt
// die Spitze ueber das Ziel hinausschiessen zu lassen.
export function shortenEnd(x1, y1, x2, y2, by) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len <= by) return null;
    const shaft = len - by;
    return { x2: x1 + (dx / len) * shaft, y2: y1 + (dy / len) * shaft };
}
