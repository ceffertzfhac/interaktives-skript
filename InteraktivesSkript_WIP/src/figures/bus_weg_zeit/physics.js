'use strict'

// physics.js — Fahrtverlauf x(t) + abgeleitete Groessen des Bus-Motors.
//
// Stateless (keine store-Zugriffe) — daher kein withStore noetig, wenn nur
// gerechnet wird. Vorbild grundbegriffe/physics.js, aber die Kurve ist hier
// stückweise (Halt + Fahrt) statt eine geschlossene Funktion.
//
// Daten vgl. Kopfkommmentar constants.js (matplotlib-Notebook). Die Fahrt-
// Segmente nutzen das Trapez-Geschwindigkeitsprofil des Notebooks (30/40/30,
// v_max = dist/(0,7·dur)); x(t) ist dessen Integral -> S-Kurve.

import { SEGMENTS, ACCEL_RATIO, SAMPLES_FAHRT, T_MAX, STOP_POSITIONS, STOP_LABELS } from './constants.js'

// Positionsoffset einer Fahrt mit Trapez-Velocity-Profil.
//   tLocal ∈ [0, dur], dist = xEnd − xStart (>= 0), r = accelRatio.
// Phasen: 0 … tAcc beschleunigen (quadratisch), tAcc … dur−tAcc konstant
// (linear), dur−tAcc … dur bremsen (quadratisch). Streng monoton, x(dur)=dist.
export function trapezoidX(tLocal, dist, dur, r = ACCEL_RATIO) {
  if (dur <= 0 || dist <= 0) return 0
  if (tLocal <= 0) return 0
  if (tLocal >= dur) return dist
  const vMax = dist / (dur * (1 - r))
  const tAcc = dur * r            // Dauer der Beschleunigungsphase
  const tDecStart = dur - tAcc    // Beginn der Bremsphase
  const a = vMax / tAcc           // Betrag der Beschleunigung
  if (tLocal <= tAcc) {
    return 0.5 * a * tLocal * tLocal
  }
  const xAtAcc = 0.5 * a * tAcc * tAcc
  if (tLocal < tDecStart) {
    return xAtAcc + vMax * (tLocal - tAcc)
  }
  const xAtDecStart = xAtAcc + vMax * (tDecStart - tAcc)
  const tau = tLocal - tDecStart
  return xAtDecStart + vMax * tau - 0.5 * a * tau * tau
}

// Segment, das den Zeitpunkt t enthaelt (oder das letzte, wenn t am Ende).
function segmentAt(t) {
  const tc = Math.min(Math.max(t, 0), T_MAX)
  for (const s of SEGMENTS) {
    if (tc >= s.tStart && tc <= s.tEnd) return s
  }
  return SEGMENTS[SEGMENTS.length - 1]
}

// Ort x(t) an beliebigem Zeitpunkt (Halt -> konstant, Fahrt -> S-Kurve).
export function xAt(t) {
  const s = segmentAt(t)
  if (s.type === 'halt') return s.xStart
  return s.xStart + trapezoidX(t - s.tStart, s.xEnd - s.xStart, s.tEnd - s.tStart)
}

// Bewegungszustand + aktuelle Haltestelle (falls Halt).
export function stateAt(t) {
  const s = segmentAt(t)
  if (s.type === 'fahrt') return { state: 'fahrt', stop: null }
  const idx = STOP_POSITIONS.indexOf(s.xStart)
  return { state: 'halt', stop: idx >= 0 ? STOP_LABELS[idx] : null }
}

// Vollstaendiger Fahrtverlauf als Punkte + Segment-Gruppen (zum zeichnen mit
// Halt/Fahrt-Einfaerbung) + Ereigniszeiten (Ankunft/Abfahrt, fuer die
// gepunkteten Vertikalen). Einmalig berechnet (aendert sich nie).
export function computePath() {
  const segments = []
  const tAll = [], xAll = []
  const events = []   // { t, x } an jeder Segmentgrenze (Ankunft/Abfahrt)
  for (const s of SEGMENTS) {
    const tSeg = [], xSeg = []
    if (s.type === 'halt') {
      tSeg.push(s.tStart, s.tEnd)
      xSeg.push(s.xStart, s.xStart)
    } else {
      for (let i = 0; i <= SAMPLES_FAHRT; i++) {
        const tl = (i / SAMPLES_FAHRT) * (s.tEnd - s.tStart)
        tSeg.push(s.tStart + tl)
        xSeg.push(s.xStart + trapezoidX(tl, s.xEnd - s.xStart, s.tEnd - s.tStart))
      }
    }
    segments.push({ state: s.type, t: tSeg, x: xSeg })
    for (let i = 0; i < tSeg.length; i++) { tAll.push(tSeg[i]); xAll.push(xSeg[i]) }
    events.push({ t: s.tStart, x: s.xStart })
  }
  events.push({ t: T_MAX, x: SEGMENTS[SEGMENTS.length - 1].xEnd })   // Endpunkt
  return { t: tAll, x: xAll, segments, events }
}