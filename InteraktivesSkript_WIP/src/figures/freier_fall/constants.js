'use strict'

// constants.js — Konstanten des Freier-Fall-Motors (BACKLOG P16-1).
//
// Portiert aus Input/Simulationen/Project_freier_fall_simulation/js/constants.js
// (v2.5.0), inhaltlich unveraendert: Physik, Pixel-Skalen, Szenen-Geometrie,
// Stoppuhr-Geometrie und Diagramm-Geometrie 1:1 uebernommen.
//
// Der Motor ist REIN VERTIKAL (1D) und deckt mit einem einzigen Parametersatz
// sowohl den freien Fall (v0 = 0) als auch den senkrechten Wurf ab
// (v0 > 0 aufwaerts, v0 < 0 abwaerts) — darum traegt er beide Abbildungs-
// familien aus Kap. 1.1 (Abb. 1.3 sowie 1.4-1.7 und 1.19).

// ── Physik ──────────────────────────────────────────────────────────────────
export const G = 9.81                  // Erdbeschleunigung (m/s²)
export const PIXELS_PER_METER = 13     // px pro m in der Szene
export const PIXELS_PER_VEL = 4        // px pro (m/s)
export const PIXELS_PER_ACC = 5        // px pro (m/s²)
export const VEL_THRESHOLD = 0.1       // darunter wird der v-Pfeil ausgeblendet

// ── Szenen-Geometrie (SVG-Koordinaten) ──────────────────────────────────────
export const GROUND_PX = 440           // y-Pixel des Erdbodens
export const BALL_X = 136              // x-Pixel der fallenden Kugel

// ── Stoppuhr ────────────────────────────────────────────────────────────────
export const WATCH_CX = 280, WATCH_CY = 120, WATCH_R = 72
export const SDIAL_CX = 280, SDIAL_CY = 150, SDIAL_R = 16

// ── Diagramm-Geometrie ──────────────────────────────────────────────────────
export const GRAPH_W = 480
export const GRAPH_H = 410             // Hoehe im Ein-Diagramm-Modus
export const GRAPH_H_STACKED = 210     // Hoehe je Slot im Zwei-Diagramm-Modus
export const GRAPH_SINGLE_TRANSLATE = { x: 400, y: 40 }
export const GRAPH_STACKED_TOP_TRANSLATE = { x: 400, y: 20 }
export const GRAPH_STACKED_BOTTOM_TRANSLATE = { x: 400, y: 255 }

// Diagramm-Typ-Optionen. Schluessel stimmen mit render.js::drawGraphSlot(type)
// ueberein. Alle drei sind reine Zeitreihen — anders als bei den Bahnkurven-
// Motoren muss hier nie gefiltert werden.
export const GRAPH_OPTIONS = {
  weg:    { label: 'Weg-Zeit' },
  geschw: { label: 'Geschwindigkeit-Zeit' },
  beschl: { label: 'Beschleunigung-Zeit' },
}
