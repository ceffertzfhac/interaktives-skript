// lib/format.js — Zahlen-Formatierung (portiert aus
// Projects_InteraktiveSimulation/shared/js/format.js). Deutsche Konvention:
// Komma als Dezimalzeichen, kein Tausendertrennzeichen. Nicht-endliche Werte
// (NaN/±Infinity) -> '—' statt 'NaN' in der UI.
export function fmt(value, decimals = 2) {
    if (!Number.isFinite(value)) return '—';
    return value.toFixed(decimals).replace('.', ',');
}
