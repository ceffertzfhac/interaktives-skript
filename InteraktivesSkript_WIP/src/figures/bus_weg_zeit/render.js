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
  T_MAX_BOUND, X_MAX_BOUND, T_TICK_STEP, X_TICK_STEP,
  STOP_POSITIONS, STOP_LABELS,
  STREET_ROAD_X, STREET_Y_TOP, STREET_Y_BOTTOM, STREET_LEN, STREET_ROAD_BOTTOM, BUS_W, BUS_H,
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

// x (m) -> Straßen-Pixel-y (Straßenszene, VERTIKAL gekippt: x=0 unten,
// x=1500 oben — analog zur Ordinate x(t) des t-x-Diagramms, damit die Bus-Hoehe
// direkt der Kurven-Hoehe entspricht).
function streetY(x) {
  return STREET_Y_BOTTOM - (x / X_MAX_BOUND) * STREET_LEN
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

  // x-Gitternetz + Ticks alle 250 m (HORIZONTAL, wie die vertikalen t-Linien
  // alle 50 s). Die gestrichelte Hervorhebung an den Haltestellen (0/500/1000/
  // 1500) liefert der Haltestellen-Toggle in updateVisualization; das feste
  // 250er-Netz ist das allgemeine Hilfsraster (parallele Struktur zu den
  // vertikalen 50er-Linien, Nutzervorgabe).
  for (let xv = 0; xv <= X_MAX_BOUND + 1e-9; xv += X_TICK_STEP) {
    const p = physToScreen(0, xv)
    DOM.gridGroup.appendChild(el('line', {
      x1: x0, y1: p.y, x2: physToScreen(T_MAX_BOUND, 0).x, y2: p.y, class: 'grid-line',
    }))
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

  // Achsenbeschriftung „Größe / Einheit" — Platzierung wie grundbegriffe (Haus-
  // stil): x-Label UNTERHALB der t-Achse rechtsbündig am Pfeilende (y0+35), y-
  // Label OBEN rechts der x-Achse (x0+10, yTop-20). Beide damit sicher innerhalb
  // des viewBox (die fruehere Start-Position +6 ragte ueber den rechten Rand
  // hinaus und wurde beschnitten -> Achsenbeschriftung unsichtbar).
  const xLabel = el('text', { x: physToScreen(T_MAX_BOUND, 0).x, y: y0 + 35, 'text-anchor': 'end', class: 'axis-label' })
  setAxisLabel(xLabel, 't / s')
  DOM.gridGroup.appendChild(xLabel)
  const yLabel = el('text', { x: x0 + 10, y: yTop - 20, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(yLabel, 'x(t) / m')
  DOM.gridGroup.appendChild(yLabel)

  // Titel (plain — kein Symbol, daher nicht setGraphTitle).
  const title = el('text', { id: pid('graph_title'), x: PAD_L + PLOT_W / 2, y: PAD_T - 16, 'text-anchor': 'middle', class: 'graph-title-text' })
  title.textContent = 'Weg-Zeit-Diagramm einer Busfahrt'
  DOM.gridGroup.appendChild(title)

  // Legende „Linie 42" (kleiner Farbfleck + Text, oben links im Plot).
  const lg = el('g', { class: 'bw-legend', transform: `translate(${PAD_L + 8}, ${PAD_T + 8})` })
  lg.appendChild(el('rect', { x: 0, y: 0, width: 18, height: 10, rx: 2, class: 'bw-curve' }))
  const lt = el('text', { x: 24, y: 9, class: 'bw-legend-text' })
  lt.textContent = 'Linie 42'
  lg.appendChild(lt)
  DOM.gridGroup.appendChild(lg)
}

// ── Statische Straßenszene (einmalig, VERTIKAL gekippt) ──────────────────────
// Straße + Haltestellen + Beschriftung; die Bus-Gruppe wird leer angelegt und
// pro Frame per transform verschoben (updateVisualization). Die Straße laeuft
// vertikal (x=0 unten, x=1500 oben), damit die Bus-Hoehe der Ordinate x(t) des
// Diagramms entspricht — die Gegenüberstellung wird so sofort lesbar.
export function drawStreetStatic() {
  const g = DOM.streetBg
  if (!g) return
  // Nur das statische Drumherium; die Bus-Gruppe (id street_bus) liegt als
  // eigenes <g> HINTER street_bg im SVG und wird beim Bau gefuellt, hier nicht
  // neu erzeugt (z-Order: Straße/Haltestellen unter dem Bus).
  const rx = STREET_ROAD_X
  // Straßenband + Mittellinie (vertikal). Das Band reicht bis STREET_ROAD_BOTTOM
  // (etwas unter H1), damit der mit der FRONT an Hx haltende Bus (Kasten ragt
  // unter die Front) an H1 nicht abwrackt (s. constants.js).
  g.appendChild(el('rect', { x: rx - 18, y: STREET_Y_TOP, width: 36, height: STREET_ROAD_BOTTOM - STREET_Y_TOP, rx: 4, class: 'bw-road' }))
  g.appendChild(el('line', { x1: rx, y1: STREET_Y_TOP, x2: rx, y2: STREET_ROAD_BOTTOM, class: 'bw-road-mid' }))
  // Fahrtrichtungspfeil oben (zeigt nach oben = wachsendes x).
  g.appendChild(el('path', {
    d: `M ${rx} ${STREET_Y_TOP - 12} l -5 10 l 10 0 z`, class: 'bw-road-arrow',
  }))

  // Haltestellen: Pfosten nach links + Label (H1 … H4).
  for (let i = 0; i < STOP_POSITIONS.length; i++) {
    const sy = streetY(STOP_POSITIONS[i])
    const hg = el('g', { class: 'bw-haltestelle' })
    hg.appendChild(el('line', { x1: rx - 18, y1: sy, x2: rx - 38, y2: sy, class: 'bw-stop-post' }))
    const lbl = el('text', { x: rx - 44, y: sy, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'bw-stop-label' })
    lbl.textContent = STOP_LABELS[i]
    hg.appendChild(lbl)
    g.appendChild(hg)
  }
}

// Bus-Gruppe einmalig fuellen (Kasten + Fenster + „42" + Raeder). Bleibt als
// Kind von street_svg stehen; updateVisualization verschiebt sie per transform.
// Bus ist VERTIKAL ausgerichtet: Laenge BUS_W entlang der Fahrtrichtung (nach
// oben), Breite BUS_H quer — lokal um (0,0), die Gruppe wird per transform auf
// die Straße gesetzt (translate(roadX, streetY(x))).
export function buildBus() {
  const bus = DOM.streetBus
  if (!bus) return
  bus.innerHTML = ''
  bus.appendChild(el('rect', { x: -BUS_H / 2, y: -BUS_W / 2, width: BUS_H, height: BUS_W, rx: 5, class: 'bw-bus' }))
  // Fenster (drei uebereinander).
  for (let i = -1; i <= 1; i++) {
    bus.appendChild(el('rect', { x: -5, y: i * 14 - 4.5, width: 10, height: 9, class: 'bw-bus-window' }))
  }
  // Raeder (vorne oben + hinten unten) — Mittelpunkte auf dem RECHTEN Rand des
  // Bus-Kastens (x = +BUS_H/2), nicht auf der Mittellinie.
  bus.appendChild(el('circle', { cx: BUS_H / 2, cy: -BUS_W / 2 + 8, r: 5, class: 'bw-bus-wheel' }))
  bus.appendChild(el('circle', { cx: BUS_H / 2, cy: BUS_W / 2 - 8, r: 5, class: 'bw-bus-wheel' }))
}

// ── Dynamischer Overlay (pro Frame / pro Reglerbewegung) ─────────────────────
export function updateVisualization(t) {
  DOM.plotArea.innerHTML = ''
  const tog = store.toggles
  const y0 = physToScreen(0, 0).y
  const x0 = physToScreen(0, 0).x

  // 1. Haltestellen-Linien (gestrichelt, horizontal) + H-Label am RECHTEN
  //    Ende (innen, knapp links des Plot-Endes; Nutzervorgabe — die Labels
  //    sitzen rechts, daher konnte das Diagramm nach links ruecken, s.
  //    constants.js PAD_L). Das Label schwebt knapp UEBER der Linie
  //    (y = p.y - 4, default dominant-baseline 'auto' => Text oberhalb der
  //    Basislinie), damit H1 (x=0 liegt auf der t-Achse y0) nicht mit der
  //    t-Pfeilspitze am rechten Rand kollidiert (der alte rechts-Satz
  //    schnitt genau dort ab / kollidierte mit dem Pfeil).
  if (tog.haltestellen) {
    const rightEdge = physToScreen(T_MAX_BOUND, 0).x
    for (let i = 0; i < STOP_POSITIONS.length; i++) {
      const p = physToScreen(0, STOP_POSITIONS[i])
      DOM.plotArea.appendChild(el('line', {
        x1: x0, y1: p.y, x2: rightEdge, y2: p.y, class: 'bw-stop-line',
      }))
      const lbl = el('text', { x: rightEdge - 4, y: p.y - 4, 'text-anchor': 'end', class: 'bw-stop-line-label' })
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

  // 5. Bus auf der Straße verschieben — FRONT auf streetY(x) (Bus-Kasten ragt
  //    UNTER die Front, also +BUS_W/2 nach unten). So liegt die Bus-Front
  //    pixelgenau auf der Kurvenhoehe (Analogie Front ↔ Kurvenpunkt) und der
  //    Bus haelt mit der Front an den Hx-Linien.
  if (DOM.streetBus) {
    DOM.streetBus.setAttribute('transform', `translate(${STREET_ROAD_X}, ${(streetY(xx) + BUS_W / 2).toFixed(1)})`)
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