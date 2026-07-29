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
// Margen/Breite aus dem Original (ANIMATION_WIDTH=600,
// PLOT_MARGINS={top:40,right:40,bottom:40,left:60}, Seitenverhaeltnis 4:3),
// mit einer Abweichung: WIDE streckt die Plot-Breite (und mit ihr den x-
// Datenbereich, s. computeBoundsFit in render.js) um 10 % — die Hoehe bleibt.
// Grund: Abb. 1.1 ist eine EINZEL-Diagramm-Figur; bei nur einem Diagramm darf
// das Seitenverhaeltnis Breite bevorzugen (Nutzervorgabe v1.31.19: „hoehe
// beibehalten, etwas breiter in allen Modi"). PLOT_W und xMaxBound wachsen
// gemeinsam um WIDE, damit plotH und der x/y-Massstab konstant bleiben → die
// Geometrie ist weiterhin unverzerrt (Vektorrichtungen/Winkel/Laengen echt),
// nur der rechte Rand wächst etwas (Bahnkurve endet bei T_MAX, der Bereich
// reicht bis (T_MAX+0,5)·WIDE). Der Cap in aspekt_grundbegriffe.css wächst
// proportional (460→500), sodass bei cap-gebundener Breite die Bildhoehe
// gleich bleibt (~309 px) — da alle drei Paper-Maxima (710/845/1175) ueber
// dem Cap liegen, bindet der Cap in jedem Modus → hoehe in allen Modi gleich.
export const PAD_L = 60
export const PAD_R = 40
export const PAD_T = 40
export const PAD_B = 40
export const WIDE = 1.1
export const PLOT_W = (600 - PAD_L - PAD_R) * WIDE
export const PLOT_H = PLOT_W / (4 / 3)
export const GRAPH_W = PLOT_W + PAD_L + PAD_R
export const GRAPH_H = PLOT_H + PAD_T + PAD_B

// ── Pfeilspitzen-Geometrie (userSpaceOnUse) ──────────────────────────────────
// Feste Groesse in Nutzer-Einheiten, UNABHAENGIG von der Strichstaerke. Die
// Spitze hat refX=HEAD_LEN (Referenzpunkt = TIP), sitzt also exakt auf dem
// Zielpunkt; die Basis ragt HEAD_LEN entlang des Schafts zurueck. Damit ist
// der Schaft NICHT zu kuerzen — er laeuft ungekuerzt bis ans Ziel, und die
// Spitze darf frei wachsen, ohne die Vektorlaenge zu fressen (frueher war die
// Verkuerzung 5·strokeWidth gekoppelt, VECTOR_SCALE 2,0 machte die Pfeile
// kuerzer). HEAD_LEN/HEAD_H muessen mit den markerWidth/markerHeight-Defs in
// aspekt_grundbegriffe.js (SVG_SCENE) uebereinstimmen; HEAD_LEN ist zudem die
// Schwelle in render.js (vecLine), ab der ein Vektor als zu kurz fuer die
// Spitze verborgen wird (sonst ragte die Basis hinter den Startpunkt).
export const HEAD_LEN = 17
export const HEAD_H = 12

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
