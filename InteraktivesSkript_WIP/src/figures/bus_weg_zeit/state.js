'use strict'

// state.js — Zustand + DOM-Cache des Bus-Weg-Zeit-Motors.
//
// Vorbild grundbegriffe/state.js. Der Motor kapselt `store` und `DOM` als
// Modul-Singletons; runtime.js gibt jeder Figur einen isolierten Zustand +
// eindeutigen ID-Prefix ('bw<n>_'). Aenderungen gegenueber grundbegriffe:
//   1. store.idPrefix (Default 'bw_') und q(id) = getElementById(idPrefix+id).
//   2. initDOM() cacht nur, was render.js dereferenziert (Diagramm-Gitter,
//      Plot, Straßenszene) plus die Bedienelemente, die die Figur verdrahtet
//      (Zeit-Regler, Toggle-Zeilen/-Checkboxen). Die Analyse-Werte holt sich
//      die Factory direkt per ge(p+…) (wie winkel_zeit).
//   3. store.t ist ein SKALARer Zeitcursor (kein tA/tB-Paar) — EIN Cursor
//      steuert Bus + Kurvenpunkt synchron; store.path kommt aus computePath()
//      (punkte + segmente + events).

import { TOGGLE_KEYS, T_DEFAULT } from './constants.js'

// ── Mutierbarer Zustand (einzige Quelle fuer alle veraenderlichen Werte) ────
export const store = {
  idPrefix: 'bw_',          // runtime.js setzt 'bw<n>_'

  t: T_DEFAULT,             // Zeitcursor (0 … 400 s)

  toggles: {
    haltestellen: true,
    ereignisse: true,
    ableselinien: true,
    haltFahrt: false,
  },

  // Fester Fahrtverlauf (einmalig berechnet, aendert sich nie).
  path: null,               // { t, x, segments, events }

  // Welche Erklaer-Variante sichtbar ist (hier ungenutzt — keine Hover-Varianten
  // wie grundbegriffe; bleibt aus Kompatibilitaet mit updateAnalysisBox).
  currentVariant: 'default',
}

// ── DOM-Cache ────────────────────────────────────────────────────────────────
export const DOM = {}

const q = id => document.getElementById(store.idPrefix + id)

export function initDOM() {
  // Diagramm-SVG
  DOM.graphSvg = q('graph_svg')
  DOM.gridGroup = q('grid_group')
  DOM.plotArea = q('plot_area')

  // Straßenszene-SVG
  DOM.streetSvg = q('street_svg')
  DOM.streetBus = q('street_bus')

  // Zeit-Regler
  DOM.tSlider = q('t_slider')
  DOM.tValue = q('t_value')

  // Toggle-Zeilen + Checkboxen (Wertanzeigen holt die Factory direkt).
  DOM.controls = {}
  DOM.toggles = {}
  for (const key of TOGGLE_KEYS) {
    DOM.controls[key] = q('control_' + key)
    DOM.toggles[key] = q('toggle_' + key)
  }
}