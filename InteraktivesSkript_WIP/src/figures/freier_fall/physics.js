'use strict'

// physics.js — Kinematik des freien Falls / senkrechten Wurfs (BACKLOG P16-1).
// Portiert aus der Stand-alone-Sim, inhaltlich unveraendert.
//
// Bewegungsgleichungen (y nach oben, Nullpunkt Erdboden, physikalisch):
//   y(t) = h0 + v0·t − ½·g·t²,  v(t) = v0 − g·t,  a(t) = −g
//
// Die vier Achsenkonfigurationen aus v0.13 (Abb. 1.4-1.7) entstehen NICHT durch
// eigene Bewegungsgleichungen, sondern allein durch getDisplayY/V/A: intern
// wird immer in der physikalischen Konvention gerechnet, und erst beim
// Anzeigen auf die gewaehlte Achse (Richtung hoch/runter, Nullpunkt Boden/
// Abwurfpunkt) umgerechnet. Genau das ist die Aussage des Abschnitts —
// dieselbe Bewegung, verschiedene Koordinatensysteme.
import { G, PIXELS_PER_METER, GROUND_PX } from './constants.js'
import { store } from './state.js'

// Physikalische Hoehe (m) -> SVG-y (px)
export const scaleY = y_m => GROUND_PX - y_m * PIXELS_PER_METER

export function getDisplayY(y_abs) {
  const { h0, yAxisConfig: { direction, origin } } = store
  const v = origin === 'ground' ? y_abs : y_abs - h0
  return direction === 'up' ? v : -v
}

export function getDisplayV(v_phys) {
  return store.yAxisConfig.direction === 'up' ? v_phys : -v_phys
}

export function getDisplayA(a_phys) {
  return store.yAxisConfig.direction === 'up' ? a_phys : -a_phys
}

// Flugzeit bis zum Erreichen des Bodens (y = 0)
export function flightTime() {
  const { h0, v0 } = store
  return (v0 + Math.sqrt(v0 * v0 + 2 * G * h0)) / G
}

// Hover-Werte: lineare Interpolation ueber das jeweils bereits gewachsene
// Array (store.t_data waechst progressiv im rAF-Lauf — dieser Motor rechnet
// NICHT vorab durch, anders als federpendel/schraeger_wurf). Ein analytisches
// physicsAt(t) waere hier riskant, da die Landung (y<0-Clamp) den Verlauf am
// Ende kappt; die Interpolation ueber die tatsaechlich geplotteten Daten
// trifft diesen Fall automatisch korrekt.
export function interpolateAt(arr, t) {
  const { t_data } = store
  if (!t_data.length) return 0
  let i = t_data.findIndex(tv => tv > t)
  if (i === -1) i = t_data.length
  i = Math.max(0, i - 1)
  const t1 = t_data[i], t2 = t_data[i + 1] ?? t1
  const alpha = t2 > t1 ? (t - t1) / (t2 - t1) : 0
  return arr[i] + alpha * ((arr[i + 1] ?? arr[i]) - arr[i])
}
