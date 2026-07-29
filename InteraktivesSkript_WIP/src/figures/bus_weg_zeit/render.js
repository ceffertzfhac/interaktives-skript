'use strict'

// render.js — Zeichnen des Bus-Weg-Zeit-Motors: t-x-Diagramm (rechts) +
// Straßenszene (links). Ein Zeitcursor bewegt Bus + Kurvenpunkt synchron.
//
// NEUER Motor (keine Quell-Sim), strukturmodelliert auf grundbegriffe/render.js
// (PORT-Muster: IDs/Marker mit store.idPrefix; lib-Wiederverwendung). Die
// Geometrie ist neu (t-x-Diagramm statt x-y-Bahn; zusaetzlich eine Straßenszene
// mit wanderndem Bus). Unabhaengige Skalen in t und x (Schema, keine Geometrie).
//
// Aufbau:
//   drawGrid()         — statisch: Achsen, Ticks, Labels, Titel, Legende (einmal).
//   drawStreetStatic() — statisch: Straße, Haltestellen, Beschriftung (einmal);
//                        baut auch die Bus-Gruppe (leer, wird pro Frame verschoben).
//   updateVisualization(t) — dynamisch: Haltestellen-/Ereignislinien, Kurve
//                        (optional Halt/Fahrt-eingefaerbt), Kurvenpunkt, Ableselinien
//                        + Bus-Position auf der Straße.

import {
  PAD_L, PAD_T, PAD_B, PLOT_W, PLOT_H, GRAPH_W,
  T_MAX_BOUND, X_MAX_BOUND, T_TICK_STEP,
  STOP_POSITIONS, STOP_LABELS,
  STREET_ROAD_Y, STREET_X0, STREET_LEN, BUS_W, BUS_H,
} from './constants.js'
import { store, DOM } from './state.js'
import { xAt, stateAt } from './physics.js'
import { fmt } from '../kreisbewegung/lib/format.js'
import { setAxisLabel } from '../kreisbewegung/lib/svg-text.js'

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

const pid = id => store.idPrefix + id
const url = id => `url(#${store.idPrefix}${id})`

// t (s) -> Diagramm-Pixel-x, x (m) -> Diagramm-Pixel-y.
export function physToScreen(t, x) {
  const sx = PAD_L + (t / T_MAX_BOUND) * PLOT_W
  const sy = (PAD_T + PLOT_H) - (x / X_MAX_BOUND) * PLOT_H
  return { x: sx, y: sy }
}

// x (m) -> Straßen-Pixel-x (Straßenszene).
function streetX(x) {
  return STREET_X0 + (x / X_MAX_BOUND) * STREET_LEN
}

// ── Statisches Gitter/Achsen/Titel/Legende (einmalig) ────────────────────────
export function drawGrid() {
  DOM.gridGroup.innerHTML = ''
  const y0 = physToScreen(0, 0).y              // t-Achse (unten)
  const x0 = physToScreen(0, 0).x              // x-Achse (links)
  const yTop = physToScreen(0, X_MAX_BOUND).y  // obere Plot-Grenze

  // t-Gitternetz + Ticks alle 50 s.
  for (let tv = 0; tv <= T_MAX_BOUND + 1e-9; tv += T_TICK_STEP) {
    const p = physToScreen(tv, 0)
    DOM.gridGroup.appendChild(el('line', {
      x1: p.x, y1: y0, x2: p.x, y2: yTop, class: 'grid-line',
    }))
    DOM.gridGroup.appendChild(el('line', { x1: p.x, y1: y0, x2: p.x, y2: y0 + 5, class: 'axis-tick' }))
    const t = el('text', { x: p.x, y: y0 + 18, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = tv
    DOM.gridGroup.appendChild(t)
  }

  // x-Ticks an den Haltestellen (nur Strich + Label; die gestrichelte Fuehrung
  // kommt aus dem Haltestellen-Toggle in updateVisualization, sonst doppelt).
  for (const xv of STOP_POSITIONS) {
    const p = physToScreen(0, xv)
    DOM.gridGroup.appendChild(el('line', { x1: x0 - 5, y1: p.y, x2: x0, y2: p.y, class: 'axis-tick' }))
    const t = el('text', { x: x0 - 9, y: p.y, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'tick-label' })
    t.textContent = xv
    DOM.gridGroup.appendChild(t)
  }

  // Achsen mit Pfeilspitzen (t nach rechts, x nach oben).
  DOM.gridGroup.appendChild(el('line', {
    x1: x0, y1: y0, x2: physToScreen(T_MAX_BOUND, 0).x, y2: y0,
    class: 'axis-line', 'marker-end': url('graph-arrowhead'),
  }))
  DOM.gridGroup.appendChild(el('line', {
    x1: x0, y1: y0, x2: x0, y2: yTop,
    class: 'axis-line', 'marker-end': url('graph-arrowhead'),
  }))

  // Achsenbeschriftung „Größe / Einheit".
  const xLabel = el('text', { x: physToScreen(T_MAX_BOUND, 0).x + 6, y: y0 + 6, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(xLabel, 't / s')
  DOM.gridGroup.appendChild(xLabel)
  const yLabel = el('text', { x: x0 - 8, y: yTop - 6, 'text-anchor': 'end', class: 'axis-label' })
  setAxisLabel(yLabel, 'x(t) / m')
  DOM.gridGroup.appendChild(yLabel)

  // Titel (plain — kein Symbol, daher nicht setGraphTitle).
  const title = el('text', { id: pid('graph_title'), x: PAD_L + PLOT_W / 2, y: PAD_T - 16, 'text-anchor': 'middle', class: 'graph-title-text' })
  title.textContent = 'Weg-Zeit-Diagramm einer Busfahrt'
  DOM.gridGroup.appendChild(title)

  // Legende „Linie 42" (kleiner Farbfleck + Text, oben links im Plot).
  const lg = el('g', { class: 'bw-legend', transform: `translate(${PAD_L + 8}, ${PAD_T + 8})` })
  lg.appendChild(el('rect', { x: 0, y: 0, width: 18, height: 10, rx: 2, class: 'bw-curve' }))
  const lt = el('text', { x: 24, y: 9, class: 'legend-text' })
  lt.textContent = 'Linie 42'
  lg.appendChild(lt)
  DOM.gridGroup.appendChild(lg)
}

// ── Statische Straßenszene (einmalig) ────────────────────────────────────────
// Straße + Haltestellen + Beschriftung; die Bus-Gruppe wird leer angelegt und
// pro Frame per transform verschoben (updateVisualization).
export function drawStreetStatic() {
  const g = DOM.streetSvg
  if (!g) return
  // Nur das statische Drumherium; die Bus-Gruppe (id street_bus) bleibt
  // unangetastet (wird beim Bau gefuellt, hier nicht neu erzeugt).
  const roadY = STREET_ROAD_Y
  // Straßenband + Mittellinie.
  g.appendChild(el('rect', { x: STREET_X0 - 10, y: roadY - 18, width: STREET_LEN + 20, height: 36, rx: 4, class: 'bw-road' }))
  g.appendChild(el('line', { x1: STREET_X0, y1: roadY, x2: STREET_X0 + STREET_LEN, y2: roadY, class: 'bw-road-mid' }))
  // Fahrtrichtungspfeil rechts.
  g.appendChild(el('path', {
    d: `M ${STREET_X0 + STREET_LEN + 4} ${roadY} l -10 -5 l 0 10 z`, class: 'bw-road-arrow',
  }))

  // Haltestellen: Pfosten + Schild + Label.
  for (let i = 0; i < STOP_POSITIONS.length; i++) {
    const sx = streetX(STOP_POSITIONS[i])
    const hg = el('g', { class: 'bw-haltestelle' })
    hg.appendChild(el('line', { x1: sx, y1: roadY - 18, x2: sx, y2: roadY - 40, class: 'bw-stop-post' }))
    hg.appendChild(el('rect', { x: sx - 9, y: roadY - 52, width: 18, height: 13, rx: 2, class: 'bw-stop-sign' }))
    const sl = el('text', { x: sx, y: roadY - 42, 'text-anchor': 'middle', class: 'bw-stop-sign-label' })
    sl.textContent = 'H'
    hg.appendChild(sl)
    const lbl = el('text', { x: sx, y: roadY + 34, 'text-anchor': 'middle', class: 'bw-stop-label' })
    lbl.textContent = STOP_LABELS[i]
    hg.appendChild(lbl)
    g.appendChild(hg)
  }

  // Szenentitel.
  const cap = el('text', { x: STREET_X0, y: 24, class: 'graph-title-text' })
  cap.textContent = 'Straßenszene'
  g.appendChild(cap)
}

// Bus-Gruppe einmalig fuellen (Kasten + Fenster + „42" + Raeder). Bleibt als
// Kind von street_svg stehen; updateVisualization verschiebt sie per transform.
export function buildBus() {
  const bus = DOM.streetBus
  if (!bus) return
  bus.innerHTML = ''
  const cx = 0, cy = 0   // lokal; Gruppe wird per transform auf die Straße gesetzt
  bus.appendChild(el('rect', { x: cx - BUS_W / 2, y: cy - BUS_H / 2, width: BUS_W, height: BUS_H, rx: 5, class: 'bw-bus' }))
  // Fenster (drei kleine Rechtecke).
  for (let i = -1; i <= 1; i++) {
    bus.appendChild(el('rect', { x: cx + i * 12 - 5, y: cy - BUS_H / 2 + 5, width: 10, height: 9, class: 'bw-bus-window' }))
  }
  // Raeder.
  bus.appendChild(el('circle', { cx: cx - BUS_W / 4, cy: cy + BUS_H / 2, r: 5, class: 'bw-bus-wheel' }))
  bus.appendChild(el('circle', { cx: cx + BUS_W / 4, cy: cy + BUS_H / 2, r: 5, class: 'bw-bus-wheel' }))
  // Linien-Label „42".
  const ln = el('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'bw-bus-label' })
  ln.textContent = '42'
  bus.appendChild(ln)
}

// ── Dynamischer Overlay (pro Frame / pro Reglerbewegung) ─────────────────────
export function updateVisualization(t) {
  DOM.plotArea.innerHTML = ''
  const tog = store.toggles
  const y0 = physToScreen(0, 0).y
  const x0 = physToScreen(0, 0).x

  // 1. Haltestellen-Linien (gestrichelt, horizontal) + H-Label rechts.
  if (tog.haltestellen) {
    for (let i = 0; i < STOP_POSITIONS.length; i++) {
      const p = physToScreen(0, STOP_POSITIONS[i])
      DOM.plotArea.appendChild(el('line', {
        x1: x0, y1: p.y, x2: physToScreen(T_MAX_BOUND, 0).x, y2: p.y, class: 'bw-stop-line',
      }))
      const lbl = el('text', { x: physToScreen(T_MAX_BOUND, 0).x + 4, y: p.y, 'dominant-baseline': 'middle', class: 'bw-stop-line-label' })
      lbl.textContent = STOP_LABELS[i]
      DOM.plotArea.appendChild(lbl)
    }
  }

  // 2. Ereignislinien (gepunktet, vertikal) an Ankunft/Abfahrt.
  if (tog.ereignisse && store.path) {
    for (const e of store.path.events) {
      const p = physToScreen(e.t, 0)
      DOM.plotArea.appendChild(el('line', {
        x1: p.x, y1: y0, x2: p.x, y2: physToScreen(0, X_MAX_BOUND).y, class: 'bw-event-line',
      }))
    }
  }

  // 3. Kurve x(t): pro Segment eine Polyline (Halt/Fahrt-Einfaerbung optional).
  if (store.path) {
    for (const seg of store.path.segments) {
      let pts = ''
      for (let i = 0; i < seg.t.length; i++) {
        const p = physToScreen(seg.t[i], seg.x[i])
        pts += `${p.x.toFixed(1)},${p.y.toFixed(1)} `
      }
      const cls = tog.haltFahrt
        ? (seg.state === 'halt' ? 'bw-curve bw-curve-halt' : 'bw-curve bw-curve-fahrt')
        : 'bw-curve'
      DOM.plotArea.appendChild(el('polyline', { points: pts, class: cls }))
    }
  }

  // 4. Kurvenpunkt + Ableselinien.
  const tt = Math.min(Math.max(t, 0), T_MAX_BOUND)
  const xx = xAt(tt)
  const pp = physToScreen(tt, xx)
  if (tog.ableselinien) {
    // Lot nach unten (zur t-Achse) + nach links (zur x-Achse).
    DOM.plotArea.appendChild(el('line', { x1: pp.x, y1: pp.y, x2: pp.x, y2: y0, class: 'bw-drop' }))
    DOM.plotArea.appendChild(el('line', { x1: pp.x, y1: pp.y, x2: x0, y2: pp.y, class: 'bw-drop' }))
    // Marker auf den Achsen.
    DOM.plotArea.appendChild(el('circle', { cx: pp.x, cy: y0, r: 3, class: 'bw-drop-mark' }))
    DOM.plotArea.appendChild(el('circle', { cx: x0, cy: pp.y, r: 3, class: 'bw-drop-mark' }))
  }
  DOM.plotArea.appendChild(el('circle', { cx: pp.x, cy: pp.y, r: 5, class: 'bw-point' }))

  // 5. Bus auf der Straße verschieben.
  if (DOM.streetBus) {
    DOM.streetBus.setAttribute('transform', `translate(${streetX(xx).toFixed(1)}, ${STREET_ROAD_Y})`)
  }
}

// ── Wertanzeigen (Live-Analyse-Grid, von der Factory aufgerufen) ─────────────
// Liefert die vier Live-Werte; die Factory schreibt sie in die Zellen (wie
// winkel_zeit::updateLabels). Deutsches Dezimalkomma via fmt.
export function liveValues(t) {
  const tt = Math.min(Math.max(t, 0), T_MAX_BOUND)
  const xx = xAt(tt)
  const { state, stop } = stateAt(tt)
  return {
    t: fmt(tt, 0) + ' s',
    x: fmt(xx, 0) + ' m',
    state: state === 'halt' ? 'Halt' : 'Fahrt',
    stop: stop ? stop : (state === 'halt' ? '—' : 'unterwegs'),
  }
}