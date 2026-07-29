'use strict'

// state.js — Zustand + DOM-Cache des Grundbegriffe-Motors.
//
// PORTIERT aus Input/Simulationen/Project_grundbegriffe_kinematik_simulation/
// js/state.js. Aenderungen gegenueber der Quelle (bewusst minimal, jeweils
// "PORT-AENDERUNG" markiert):
//   1. store.idPrefix (Default 'gk_') und q(id) = getElementById(idPrefix + id)
//      -> mehrere Figuren pro Seite kollidieren nicht (s. runtime.js), gleiches
//      Muster wie kreisbewegung/state.js und kreis_spiral/state.js.
//   2. initDOM() cacht nur noch, was render.js dereferenziert (Gitter, Plot,
//      Wertanzeigen, Erklaer-Varianten) plus die Bedienelemente, die die Figur
//      selbst verdrahtet. Topbar/Theme/Reset/Layout der Sim entfallen — die
//      Aspekt-Figur bringt ihre eigene Bedienung mit.
// Sonst 1:1 die Quelle, damit die Optik der Vorlage entspricht.

import { TA_DEFAULT, TB_DEFAULT, ANALYSIS_VARIANTS, TOGGLE_KEYS, PLOT_H } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle fuer alle veraenderlichen Werte) ────
export const store = {
  // PORT-AENDERUNG 1: ID-Prefix dieser Instanz (runtime.js setzt 'gk<n>_')
  idPrefix: 'gk_',

  tA: TA_DEFAULT,
  tB: TB_DEFAULT,

  // Toggles. Default der STAND-ALONE-SIM war "nur die ganze Strecke sichtbar";
  // die Aspekt-Figur setzt beim Bau ihren eigenen Default (Wiedererkennung der
  // statischen Abb. 1.1, s. aspekt_grundbegriffe.js) und laesst diesen hier
  // unveraendert, damit der Motor die Vorlage weiterhin 1:1 abbildet.
  toggles: {
    pathBg: true,
    sA: false,
    sB: false,
    verschiebung_BA: false,
    verschiebung_AB: false,
    abstand: false,
    weg: false,
  },

  // Welche Erklaer-Variante ist gerade sichtbar (einzige Quelle der Wahrheit,
  // von Hover/Click/Leave synchron gehalten).
  currentVariant: 'default',

  // Feste Bahnkurve (einmalig berechnet, aendert sich nie) + Achsen-Grenzen.
  path: null,        // { t, x, y, cumulative_s, yMax }
  xMaxBound: 1,
  yMaxBound: 1,

  // Von tA/tB abgeleitet (bei jeder Reglerbewegung neu berechnet)
  ab: null,         // { indexA, indexB, x_A, y_A, x_B, y_B, deltaS_mag, s_AB_length }

  // PORT-AENDERUNG 3: Hoehe der Zeichenflaeche. In der Vorlage eine Konstante
  // (PLOT_H, festes 4:3) — hier im store, damit eine Figur die Flaeche an den
  // DATENbereich anpassen kann (computeBoundsFit) statt umgekehrt. Default =
  // Vorlagenwert, die Sim-Optik bleibt damit unveraendert reproduzierbar.
  plotH: PLOT_H,

  // PORT-AENDERUNG 4: Faktor auf die Strichstaerke der Vektorpfeile. Die
  // Verkuerzung in vecLine() ist an dieselbe Strichstaerke gekoppelt
  // (shortenEnd(…, 5·sw)), deshalb MUSS der Faktor hier und nicht per CSS
  // wirken — sonst wandert die Pfeilspitze vom Zielpunkt weg.
  vectorScale: 1,
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

// PORT-AENDERUNG 1: Prefix vor jede ID.
const q = id => document.getElementById(store.idPrefix + id)

export function initDOM() {
  // SVG-Grundelemente
  DOM.graphSvg = q('graph_svg')
  DOM.gridGroup = q('grid_group')
  DOM.plotArea = q('plot_area')

  // Zeit-Regler
  DOM.tASlider = q('tA_slider'); DOM.tAValue = q('tA_value')
  DOM.tBSlider = q('tB_slider'); DOM.tBValue = q('tB_value')

  // Steuerzeilen (Zeile = Hover-/Klickflaeche, Checkbox = Zustand,
  // Wertanzeige = von render.js::updateValueDisplays befuellt)
  DOM.controls = {}; DOM.toggles = {}; DOM.values = {}
  for (const key of TOGGLE_KEYS) {
    DOM.controls[key] = q('control_' + key)
    DOM.toggles[key] = q('toggle_' + key)
    DOM.values[key] = q('val_' + key)
  }

  // Analyse-Seitenleiste: die 8 statischen Erklaer-Varianten
  DOM.analysisVariants = {}
  for (const key of ANALYSIS_VARIANTS) DOM.analysisVariants[key] = q('analysis_' + key)
}
