'use strict'

// render.js — Zeichnen des Grundbegriffe-Motors (Gitter/Achsen + dynamischer
// Overlay aus Bahnkurve, Ortsvektoren, Verschiebung, Abstand, Weglaenge).
//
// PORTIERT aus Input/Simulationen/Project_grundbegriffe_kinematik_simulation/
// js/render.js. Aenderungen gegenueber der Quelle (bewusst minimal, jeweils
// "PORT-AENDERUNG" markiert):
//   1. Marker-URLs und die IDs der gezeichneten Elemente werden mit
//      store.idPrefix gebildet -> mehrere Instanzen auf einer Seite kollidieren
//      nicht (gleiches Muster wie render.js der beiden anderen Motoren).
//   2. updateValueDisplays() prueft die Wertanzeigen auf Existenz, damit eine
//      Figur einzelne Zeilen weglassen kann (Feature-Gating).
//   3. Die Plot-Hoehe kommt aus store.plotH statt aus der Konstanten PLOT_H,
//      und computeBoundsFit() ist als Alternative zu computeBounds() dazu-
//      gekommen (s. dort). Default = Vorlagenwert -> Optik unveraendert.
//   4. Die Strichstaerke der Vektorpfeile wird mit store.vectorScale
//      multipliziert (NUR der Schaft). Spitzen sind fest (userSpaceOnUse,
//      HEAD_LEN/HEAD_H) mit refX=HEAD_LEN, der Schaft laeuft ungekuerzt bis
//      ans Ziel — Strichstaerke, Spitzen und Vektorlaenge sind entkoppelt.
//   5. Vektor-Labels werden per createElementNS als SVG-Knoten gebaut (nicht
//      ueber innerHTML), damit der tiefgestellte Index (tspan dy/font-size)
//      zuverlaessig greift.
// Sonst 1:1 die Quelle — insbesondere die Geometrie (Label-Platzierung,
// Bemassungslinie) bleibt unangetastet, weil sie die Optik der Vorlage ausmacht.

import { T_MAX, PAD_L, PAD_T, PAD_B, PLOT_W, HEAD_LEN } from './constants.js'
import { store, DOM } from './state.js'
import { fmt } from '../kreisbewegung/lib/format.js'
import { setAxisLabel, setGraphTitle } from '../kreisbewegung/lib/svg-text.js'

const NS = 'http://www.w3.org/2000/svg'

function el(tag, attrs) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

// PORT-AENDERUNG 1: ID/Marker-Referenz mit Instanz-Prefix.
const pid = id => store.idPrefix + id
const url = id => `url(#${store.idPrefix}${id})`

// ── Bahnkurve ist FEST → Bounds/Skalierung einmalig aus dem Maximum von y(t)
// ableitbar (s. computeBounds/computeBoundsFit, in der Figur einmalig gerufen).
const X_MIN = 0, Y_MIN = 0

// Physik (x,y) → Bildschirm (Pixel im viewBox).
export function physToScreen(x, y) {
  const sx = PAD_L + ((x - X_MIN) / (store.xMaxBound - X_MIN)) * PLOT_W
  const sy = (PAD_T + store.plotH) - ((y - Y_MIN) / (store.yMaxBound - Y_MIN)) * store.plotH
  return { x: sx, y: sy }
}

// Bounds so waehlen, dass das feste Seitenverhaeltnis PLOT_W/store.plotH
// erhalten bleibt (1:1 aus dem Original uebernommenes Verfahren): die
// Zeichenflaeche gibt vor, der Datenbereich wird passend AUFGEBLAEHT.
export function computeBounds(pathYMax) {
  const targetAspect = PLOT_W / store.plotH
  const dataXMax = T_MAX + 0.5
  const dataYMax = pathYMax + 0.5
  let xMaxBound, yMaxBound
  if ((dataXMax / dataYMax) > targetAspect) {
    xMaxBound = dataXMax
    yMaxBound = dataXMax / targetAspect
  } else {
    yMaxBound = dataYMax
    xMaxBound = dataYMax * targetAspect
  }
  return { xMaxBound, yMaxBound }
}

// PORT-AENDERUNG 3: umgekehrte Richtung — die DATEN geben vor, die Hoehe der
// Zeichenflaeche folgt. Ergebnis ist derselbe Massstab in x und y (die
// Geometrie bleibt also unverzerrt: Vektorrichtungen, Winkel und Laengen sind
// echt), aber OHNE den toten Rand, den computeBounds() erzeugt: dort blaeht
// das feste 4:3 den y-Bereich auf 3,53 m auf, obwohl die Kurve nur bis 2,53 m
// reicht — knapp ein Viertel der Bildhoehe blieb leer. Der Zuschlag von 0,5 m
// je Achse ist der Platz fuer Achsenpfeil und Achsenbeschriftung (wie im
// Original). Rueckgabe enthaelt zusaetzlich plotH + graphH fuer die viewBox.
export function computeBoundsFit(pathYMax) {
  const xMaxBound = T_MAX + 0.5
  const yMaxBound = pathYMax + 0.5
  const plotH = PLOT_W * (yMaxBound / xMaxBound)
  return { xMaxBound, yMaxBound, plotH, graphH: PAD_T + plotH + PAD_B }
}

// ── Statisches Gitter/Achsen/Titel (einmalig — Bounds aendern sich nie) ─────
export function drawGrid() {
  DOM.gridGroup.innerHTML = ''
  const x0 = physToScreen(0, 0).x, y0 = physToScreen(0, 0).y

  for (let xv = Math.ceil(X_MIN); xv <= Math.floor(store.xMaxBound); xv++) {
    const p = physToScreen(xv, 0)
    DOM.gridGroup.appendChild(el('line', { x1: p.x, y1: physToScreen(0, store.yMaxBound).y, x2: p.x, y2: physToScreen(0, Y_MIN).y, class: 'grid-line' }))
    const t = el('text', { x: p.x, y: y0 + 15, 'text-anchor': 'middle', class: 'tick-label' })
    t.textContent = xv
    DOM.gridGroup.appendChild(t)
  }
  for (let yv = Math.ceil(Y_MIN); yv <= Math.floor(store.yMaxBound); yv++) {
    const p = physToScreen(0, yv)
    DOM.gridGroup.appendChild(el('line', { x1: physToScreen(X_MIN, 0).x, y1: p.y, x2: physToScreen(store.xMaxBound, 0).x, y2: p.y, class: 'grid-line' }))
    const t = el('text', { x: x0 - 10, y: p.y, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'tick-label' })
    t.textContent = yv
    DOM.gridGroup.appendChild(t)
  }

  DOM.gridGroup.appendChild(el('line', { x1: physToScreen(X_MIN, 0).x, y1: y0, x2: physToScreen(store.xMaxBound, 0).x, y2: y0, class: 'axis-line', 'marker-end': url('graph-arrowhead') }))
  DOM.gridGroup.appendChild(el('line', { x1: x0, y1: physToScreen(0, Y_MIN).y, x2: x0, y2: physToScreen(0, store.yMaxBound).y, class: 'axis-line', 'marker-end': url('graph-arrowhead') }))

  // Achsformat „Symbol / Einheit" wie in allen Sims/Figuren des Skripts.
  const xLabel = el('text', { x: physToScreen(store.xMaxBound, 0).x, y: y0 + 35, 'text-anchor': 'end', class: 'axis-label' })
  setAxisLabel(xLabel, 'x / m')
  DOM.gridGroup.appendChild(xLabel)
  const yLabel = el('text', { x: x0 + 10, y: physToScreen(0, store.yMaxBound).y - 20, 'text-anchor': 'start', class: 'axis-label' })
  setAxisLabel(yLabel, 'y / m')
  DOM.gridGroup.appendChild(yLabel)

  const title = el('text', { id: pid('graph_title'), x: PAD_L + PLOT_W / 2, y: PAD_T - 15, 'text-anchor': 'middle', class: 'graph-title-text' })
  setGraphTitle(title, 'Bahndiagramm x-y-Diagramm')
  DOM.gridGroup.appendChild(title)
}

// Kombiniertes Symbol-Label „s⃗" mit tiefgestelltem Index (Original-Unicode-
// Trick: Combining-Arrow U+20D7 auf 's', Index als <tspan>). Die Labels werden
// als SVG-Knoten gebaut (createElementNS), NICHT ueber label.innerHTML: das
// innerHTML-Parsen auf SVG-<text> erzeugt <tspan> nicht zuverlaessig im
// SVG-Namespace, worauf weder baseline-shift noch dy/font-size greifen wuerden
// — der Index erschiene ungestellt (hoch). Der Index wird per dy in Nutzer-
// Einheiten gesenkt; auf Following-Inhalt (das schliessende „|" des Abstands-
// Labels) hebt ein resetTspan die Verschiebung wieder auf.
function subTspan(text) {
  const t = document.createElementNS(NS, 'tspan')
  t.setAttribute('dy', '4')
  t.setAttribute('font-size', '0.7em')
  t.textContent = text
  return t
}
function resetTspan(text) {
  const t = document.createElementNS(NS, 'tspan')
  t.setAttribute('dy', '-4')
  t.textContent = text
  return t
}
function vectorLabel(sub) {
  const f = document.createDocumentFragment()
  f.appendChild(document.createTextNode('s⃗'))
  f.appendChild(subTspan(sub))
  return f
}
function deltaLabel(sub) {
  const f = document.createDocumentFragment()
  f.appendChild(document.createTextNode('Δs⃗'))
  f.appendChild(subTspan(sub))
  return f
}
// |Δs⃗_BA| — oeffnendes „|", Δs⃗, tiefgestelltes BA, zurueckgesetztes „|".
// Die beiden Betragstriche je im EIGENEN Knoten (nicht im selben Textknoten wie
// Δs⃗), damit der Combining-Arrow U+20D7 ueber dem s die Striche nicht
// mitverschiebt — sonst stünden die Striche auf unterschiedlicher Höhe.
function abstandLabel() {
  const f = document.createDocumentFragment()
  f.appendChild(document.createTextNode('|'))
  f.appendChild(document.createTextNode('Δs⃗'))
  f.appendChild(subTspan('BA'))
  f.appendChild(resetTspan('|'))
  return f
}

// ── Dynamischer Overlay: Punkte A/B, Vektoren, Verschiebung, Abstand, Weg ───
// highlightId: beim Hover ueber eine Steuerzeile hervorgehobenes Element
// (dickerer Strich) — reiner Render-Parameter, fliesst nicht in den store ein.
export function updateVisualization(highlightId = null) {
  DOM.plotArea.innerHTML = ''
  const ab = store.ab
  if (!ab) return
  const t = store.toggles

  const xA = physToScreen(ab.x_A, ab.y_A).x, yA = physToScreen(ab.x_A, ab.y_A).y
  const xB = physToScreen(ab.x_B, ab.y_B).x, yB = physToScreen(ab.x_B, ab.y_B).y
  const x0 = physToScreen(0, 0).x, y0 = physToScreen(0, 0).y

  // Z-Order (unten → oben): Kurve → Bahnsegment → Punkte → Pfeile → Schrift.
  // Die <text>-Labels werden gesammelt und ZULETZT angehaengt (Schrift immer im
  // Vordergrund), damit sie kein Pfeil/Schaft/Punkt ueberdeckt.
  const labels = []

  // 1. Ganze Strecke (Bahnkurve) — ganz unten.
  if (t.pathBg) {
    const { x, y } = store.path
    let d = ''
    for (let i = 0; i < x.length; i++) {
      const p = physToScreen(x[i], y[i])
      d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `
    }
    DOM.plotArea.appendChild(el('path', { id: pid('full_path_visual'), d, fill: 'none', class: 'path-bg-line', 'stroke-width': highlightId === 'pathBg' ? 4.5 : 2.5 }))
  }

  // 2. Bahnsegment (Weglänge) — über der Kurve.
  if (t.weg) {
    const { x, y } = store.path
    let d = ''
    for (let i = ab.indexA; i <= ab.indexB; i++) {
      const p = physToScreen(x[i], y[i])
      d += `${i === ab.indexA ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `
    }
    DOM.plotArea.appendChild(el('path', { id: pid('segment_path_visual'), d, fill: 'none', class: 'weg-line', 'stroke-width': highlightId === 'weg' ? 5 : 3.5 }))
  }

  // 3. Punkte A/B — über Kurve und Bahnsegment.
  DOM.plotArea.appendChild(el('circle', { id: pid('point_A'), cx: xA, cy: yA, r: 5, class: 'ab-point' }))
  DOM.plotArea.appendChild(el('circle', { id: pid('point_B'), cx: xB, cy: yB, r: 5, class: 'ab-point' }))

  // Kanonische Pfeilspitzen-Geometrie (refX=HEAD_LEN, s. Marker-Defs im Skelett
  // der Figur): der Referenzpunkt liegt auf der Spitze, die damit exakt auf dem
  // Zielpunkt (x2,y2) sitzt; die Basis ragt HEAD_LEN entlang des Schafts zurueck.
  // Der Schaft laeuft also UNGEKUERZT bis ans Ziel — keine shortenEnd-Verkuerzung
  // mehr.
  // PORT-AENDERUNG 4 (revidiert): frueher war die Verkuerzung 5·strokeWidth und
  // der Marker markerUnits=strokeWidth — Schaft, Spitze und Verkuerzung skalierten
  // gemeinsam, ein dickerer Schaft (VECTOR_SCALE) kuerzte den Vektor und drueckte
  // kurze Vektoren ins display:none. Jetzt sind die Spitzen fest (userSpaceOnUse,
  // HEAD_LEN/HEAD_H) und vom Schaft (sw = sw0·vectorScale) ENTKOPPELT: dickere
  // Schaefte und groessere Spitzen fressen keine Vektorlaenge. Nur ein Vektor
  // kuerzer als die Spitze (len < HEAD_LEN) wird verborgen (Label bleibt sichtbar),
  // sonst ragte die Basis hinter den Startpunkt.
  const vecLine = (id, cls, x1, y1, x2, y2, sw0, markerId) => {
    const sw = sw0 * store.vectorScale
    const len = Math.hypot(x2 - x1, y2 - y1)
    // Vektor kuerzer als Pfeilspitze → verborgene Linie (Label bleibt sichtbar).
    if (len < HEAD_LEN) return el('line', { id: pid(id), x1, y1, x2, y2, class: cls, 'stroke-width': sw, 'marker-end': url(markerId), display: 'none' })
    return el('line', { id: pid(id), x1, y1, x2, y2, class: cls, 'stroke-width': sw, 'marker-end': url(markerId) })
  }

  // 4. Vektoren (Pfeile) — über den Punkten („Pfeile immer vor dem Punkt").
  if (t.sA) {
    DOM.plotArea.appendChild(vecLine('vector_sA', 'pos-vector', x0, y0, xA, yA, highlightId === 'sA' ? 4 : 2, 'arrowhead-pos'))
    const label = el('text', { class: 'pos-vector-label vector-label', 'text-anchor': 'middle' })
    label.appendChild(vectorLabel('A'))
    placeSideLabel(label, x0, y0, xA, yA, xB, yB)
    labels.push(label)
  }
  if (t.sB) {
    DOM.plotArea.appendChild(vecLine('vector_sB', 'pos-vector', x0, y0, xB, yB, highlightId === 'sB' ? 4 : 2, 'arrowhead-pos'))
    const label = el('text', { class: 'pos-vector-label vector-label', 'text-anchor': 'middle' })
    label.appendChild(vectorLabel('B'))
    placeSideLabel(label, x0, y0, xB, yB, xA, yA)
    labels.push(label)
  }
  if (t.verschiebung_BA) {
    const line = vecLine('vector_verschiebung_BA', 'dba-vector', xA, yA, xB, yB, highlightId === 'verschiebung_BA' ? 4.5 : 2.5, 'arrowhead-dba')
    line.setAttribute('stroke-dasharray', '5,5')
    DOM.plotArea.appendChild(line)
    const label = el('text', { class: 'dba-vector-label vector-label', 'text-anchor': 'middle' })
    label.appendChild(deltaLabel('BA'))
    placeAlongLabel(label, xA, yA, xB, yB)
    labels.push(label)
  }
  if (t.verschiebung_AB) {
    const line = vecLine('vector_verschiebung_AB', 'dab-vector', xB, yB, xA, yA, highlightId === 'verschiebung_AB' ? 4.5 : 2.5, 'arrowhead-dab')
    line.setAttribute('stroke-dasharray', '5,5')
    DOM.plotArea.appendChild(line)
    const label = el('text', { class: 'dab-vector-label vector-label', 'text-anchor': 'middle' })
    label.appendChild(deltaLabel('AB'))
    placeAlongLabel(label, xB, yB, xA, yA)
    labels.push(label)
  }
  if (t.abstand) {
    const lbl = drawAbstandDimension(xA, yA, xB, yB, x0, y0)  // Linien direkt; Label zurück
    if (lbl) labels.push(lbl)
  }

  // 5. Schrift im Vordergrund — alle Labels zuletzt.
  for (const l of labels) DOM.plotArea.appendChild(l)

  updateValueDisplays()
}

// Label-Platzierung senkrecht zum Vektor, auf der vom jeweils anderen Punkt
// abgewandten Seite (Kreuzprodukt-Vorzeichen-Check — 1:1 aus dem Original).
function placeSideLabel(label, x0, y0, xP, yP, xOther, yOther) {
  const vx = xP - x0, vy = yP - y0
  const checkX = xOther - x0, checkY = yOther - y0
  const side = vx * checkY - vy * checkX
  const sign = -Math.sign(side) || -1
  const nx = -vy, ny = vx
  const len = Math.hypot(nx, ny) || 1
  label.setAttribute('x', (x0 + xP) / 2 + sign * 20 * nx / len)
  label.setAttribute('y', (y0 + yP) / 2 + sign * 20 * ny / len)
}

// Label entlang der Verschiebungslinie, lesbar ausgerichtet (nie kopfueber).
function placeAlongLabel(label, xFrom, yFrom, xTo, yTo) {
  const dx = xTo - xFrom, dy = yTo - yFrom
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  const flipped = angle > 90 || angle < -90
  const readableAngle = flipped ? angle + 180 : angle
  const offset = flipped ? 15 : -15
  const mx = (xFrom + xTo) / 2, my = (yFrom + yTo) / 2
  label.setAttribute('x', mx)
  label.setAttribute('y', my)
  label.setAttribute('transform', `rotate(${readableAngle} ${mx} ${my}) translate(0, ${offset})`)
}

// Bemassungslinie „Abstand" mit Endstrichen, senkrecht versetzt auf die vom
// Ursprung abgewandte Seite (1:1 aus dem Original uebernommene Geometrie).
// Gibt das <text>-Label ZURUECK (null, wenn nichts gezeichnet) — updateVisualization
// haengt es im Foreground-Pass an, damit die Schrift ueber allen Linien liegt
// (gleiche Strategie wie die Vektor-Labels). Die Linien selbst landen sofort im
// Plot (unterhalb der Punkte/Vektoren).
function drawAbstandDimension(xA, yA, xB, yB, x0, y0) {
  const dx = xB - xA, dy = yB - yA, len = Math.hypot(dx, dy)
  const group = el('g', { id: pid('dimension_line_abstand'), class: 'abstand-dim' })
  let label = null
  if (len > 5) {
    const offset = 25, tickLength = 8
    const originSide = dx * (y0 - yA) - dy * (x0 - xA)
    const sign = Math.sign(originSide) || 1
    const nx = -dy / len, ny = dx / len
    const xAo = xA + offset * nx * sign, yAo = yA + offset * ny * sign
    const xBo = xB + offset * nx * sign, yBo = yB + offset * ny * sign
    group.appendChild(el('line', { x1: xAo, y1: yAo, x2: xBo, y2: yBo }))
    const udx = dx / len, udy = dy / len
    group.appendChild(el('line', { x1: xAo - udy * tickLength / 2, y1: yAo + udx * tickLength / 2, x2: xAo + udy * tickLength / 2, y2: yAo - udx * tickLength / 2 }))
    group.appendChild(el('line', { x1: xBo - udy * tickLength / 2, y1: yBo + udx * tickLength / 2, x2: xBo + udy * tickLength / 2, y2: yBo - udx * tickLength / 2 }))
    group.appendChild(el('line', { x1: xA, y1: yA, x2: xAo, y2: yAo, class: 'abstand-projline' }))
    group.appendChild(el('line', { x1: xB, y1: yB, x2: xBo, y2: yBo, class: 'abstand-projline' }))
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const readableAngle = (angle > 90 || angle < -90) ? angle + 180 : angle
    const tx = (xAo + xBo) / 2, ty = (yAo + yBo) / 2
    // KEIN dominant-baseline:hanging (das ankert y am OBEREN Rand, sodass der
    // per dy gesenkte Index BA nur 4 Einheiten unterhalb der Oberkante — also
    // auf Hoehe des Pfeils ⃗ — erschiene, statt tiefgestellt). Default-Baseline
    // (alphabetisch) + translate(0,15) wie placeAlongLabel: die Schriftbasis
    // liegt 15 Einheiten jenseits der Bemassungslinie, der Index sinkt per dy
    // sauber ab. text-anchor:middle zentriert das ganze |Δs⃗_BA|.
    label = el('text', { 'text-anchor': 'middle', transform: `rotate(${readableAngle} ${tx} ${ty}) translate(0, 15)`, class: 'vector-label' })
    label.setAttribute('x', tx); label.setAttribute('y', ty)
    label.appendChild(abstandLabel())
  }
  DOM.plotArea.appendChild(group)
  return label
}

// ── Wertanzeigen neben den Steuerzeilen ─────────────────────────────────────
function vectorValueHTML(x, y) {
  return `<div class="vector-display"><div class="vector-components"><span>${fmt(x)}</span><span>${fmt(y)}</span></div></div> m`
}
function updateValueDisplays() {
  const ab = store.ab, t = store.toggles, v = DOM.values
  // PORT-AENDERUNG 2: jede Anzeige einzeln auf Existenz pruefen (Feature-Gating).
  const setHTML = (key, on, html) => { if (v[key]) v[key].innerHTML = on ? html : '' }
  const setText = (key, on, text) => { if (v[key]) v[key].textContent = on ? text : '' }
  setHTML('sA', t.sA, vectorValueHTML(ab.x_A, ab.y_A))
  setHTML('sB', t.sB, vectorValueHTML(ab.x_B, ab.y_B))
  setHTML('verschiebung_BA', t.verschiebung_BA, vectorValueHTML(ab.x_B - ab.x_A, ab.y_B - ab.y_A))
  setHTML('verschiebung_AB', t.verschiebung_AB, vectorValueHTML(ab.x_A - ab.x_B, ab.y_A - ab.y_B))
  setText('abstand', t.abstand, `${fmt(ab.deltaS_mag)} m`)
  setText('weg', t.weg, `${fmt(ab.s_AB_length)} m`)
}

// ── Analyse-Seitenleiste: nur display umschalten (kein typesetPromise) ──────
export function updateAnalysisBox(key) {
  const id = DOM.analysisVariants[key] ? key : 'default'
  store.currentVariant = id
  for (const [k, elDiv] of Object.entries(DOM.analysisVariants)) {
    if (elDiv) elDiv.style.display = k === id ? '' : 'none'
  }
}
