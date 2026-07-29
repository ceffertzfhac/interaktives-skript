'use strict'

// constants.js — Konfiguration des Grundbegriffe-Motors.
//
// PORTIERT aus Input/Simulationen/Project_grundbegriffe_kinematik_simulation/
// js/constants.js. 1:1 uebernommen (keine PORT-AENDERUNG) — die Bahnkurve, die
// Diagramm-Geometrie und die Zeitgrenzen sind exakt die der Vorlage, damit die
// Optik der Stand-alone-Sim entspricht.
//
// Der Motor ist ein DIAGRAMMATISCHES WERKZEUG ohne Zeit-Animation: keine
// requestAnimationFrame-Schleife, kein Play/Pause, kein Auto-Stopp. Feste
// Bahnkurve (x(t), y(t)); zwei Zeit-Regler tA/tB markieren zwei Punkte A/B
// darauf, sieben Toggles blenden Ortsvektoren/Verschiebung/Abstand/Weglaenge
// ein. Deshalb braucht er — anders als kreisbewegung/ und kreis_spiral/ — weder
// playback.js noch eine Ablaufleiste.

export const T_MIN = 0
export const T_MAX = 4.2
export const NUM_POINTS = 2000

export const TA_DEFAULT = 0.8
export const TB_DEFAULT = 3.2
export const T_STEP = 0.01

// ── Diagramm-Geometrie (Landscape) ───────────────────────────────────────────
// Marge/Breite 1:1 aus dem Original uebernommen (ANIMATION_WIDTH=600,
// PLOT_MARGINS={top:40,right:40,bottom:40,left:60}, Seitenverhaeltnis 4:3).
export const PAD_L = 60
export const PAD_R = 40
export const PAD_T = 40
export const PAD_B = 40
export const PLOT_W = 600 - PAD_L - PAD_R
export const PLOT_H = PLOT_W / (4 / 3)
export const GRAPH_W = PLOT_W + PAD_L + PAD_R
export const GRAPH_H = PLOT_H + PAD_T + PAD_B

// ── Pfeilspitzen-Geometrie (userSpaceOnUse) ──────────────────────────────────
// Feste Groesse in Nutzer-Einheiten, UNABHAENGIG von der Strichstaerke: dickere
// Schaefte kuerzen die Vektoren nicht mehr (frueher war die Verkuerzung
// 5·strokeWidth gekoppelt → VECTOR_SCALE 2,0 machte die Pfeile kuerzer und
// drueckte kurze Vektoren ins display:none). HEAD_LEN muss mit der Verkuerzung
// in render.js (vecLine) und den markerWidth-Defs in aspekt_grundbegriffe.js
// (SVG_SCENE) uebereinstimmen, damit die Spitze (refX=0) exakt auf dem
// Zielpunkt landet. HEAD_H ist die Basisbreite der Spitze.
export const HEAD_LEN = 13
export const HEAD_H = 9

// Die 8 Erklaer-Varianten der Analyse-Seitenleiste (statisches MathJax,
// JS schaltet nur display um). 'default' = Standardtext ohne Auswahl.
export const ANALYSIS_VARIANTS = [
  'default', 'sA', 'sB', 'verschiebung_BA', 'verschiebung_AB', 'abstand', 'weg', 'pathBg',
]

// Reihenfolge der Steuerzeilen/Toggles (Bedienpanel + Event-Wiring der Figur).
// 'pathBg' zuerst, dann die von tA/tB abhaengigen Groessen.
export const TOGGLE_KEYS = [
  'pathBg', 'sA', 'sB', 'weg', 'verschiebung_BA', 'verschiebung_AB', 'abstand',
]
