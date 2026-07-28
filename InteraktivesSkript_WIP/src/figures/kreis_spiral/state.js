'use strict'

// state.js — Zustand + DOM-Cache des Kreis-/Spiralbewegungs-Motors.
//
// PORTIERT aus Input/Simulationen/Project_kreis_spiralbewegung_simulation/js/state.js.
// Aenderungen gegenueber der Quelle (bewusst minimal + abwaertskompatibel):
//   1. store.idPrefix (Default 'ks_') und q(id) = getElementById(idPrefix + id)
//      -> mehrere Figuren pro Seite kollidieren nicht (s. runtime.js).
//   2. initDOM() cacht nur noch die Elemente, die render.js dereferenziert
//      (Szene + Diagramm + Live-Panel + Zeitanzeige). Die komplette Sim-UI
//      (Topbar, Regler, Umschalter, Export) entfaellt — jede Aspekt-Figur baut
//      ihre eigene Bedienung, genau wie beim Kreisbewegungs-Motor.
// Sonst 1:1 die Quelle, damit die Optik der Vorlage entspricht.

import { quantities } from './constants.js'

export const store = {
  // ID-Prefix dieser Instanz (runtime.js setzt 'ks<n>_')
  idPrefix: 'ks_',

  // Bewegungsparameter
  R0: 1.5, vr: 0, h: 0,
  omega0_rad: 60 * Math.PI / 180, phi0_rad: 0, alpha_rad: 0,
  speedFactor: 1.0,

  // Modus / Ansicht / Einheit / Diagramm / Anordnung
  motionMode: 'kreis', currentView: '2D', angleUnit: 'deg',
  diagramMode: '1', graphType1: 'phi', graphType2: 'omega',
  layoutSplit: false,   // Sim & Diagramm übereinander (false) / nebeneinander (true) — FX6, einheitlich mit Kreisbewegung

  // Vektorzerlegung
  rDecomp: 'none', vDecomp: 'none', aDecomp: 'none', scaleAt: false,

  // Visualisierungs-Toggles
  togPosition: false, togVelocity: false, togAcceleration: false,
  togOmega: false, togAlpha: false, togPhi: false, togTrajectory: false,
  stopwatchVisible: true,

  // Auto-Stopp
  isAutoStopping: false,
  autoStopTargetAngle: 0,
  autoStopDirection: 1,
  lastPhiForStop: 0,
  nStop: 1,

  // Zoom
  currentPixelsPerMeter: 75, zoomFactor: 1.0,

  // Precompute (flat: p_<quantity> + t) und Achsenlimits
  fullData: {}, axisLimits: {}, effectiveDuration: 120,
  // PORT-AENDERUNG: Horizont des Precompute (s). undefined -> SIM_DURATION (120 s,
  // Verhalten der Quell-Sim); eine Aspekt-Figur setzt hier ihre Auto-Stopp-Zeit.
  simDuration: undefined,
  // PORT-AENDERUNG: eigene Laengen-Maßstaebe der Drehachsen-Vektoren (m je Grad
  // bzw. Grad/s) und Laengen-Kappe (m). undefined -> OMEGA_LEN_FACTOR /
  // ALPHA_LEN_FACTOR / keine Kappe, also Verhalten der Quell-Sim. Begruendung
  // in render.js::drawVectors.
  omegaLenFactor: undefined, alphaLenFactor: undefined, axisVecLenCap: undefined,
  // PORT-AENDERUNG: Blickhoehe der ISO-Ansicht in Grad ueber der Bahnebene.
  // undefined -> ISO_ELEVATION_DEFAULT (35,264°, die echte Isometrie der
  // Quell-Sim). Groessere Werte = staerker von oben. Begruendung + Formel in
  // render.js::projectISO.
  isoElevation: undefined,

  // RAF-Bookkeeping
  aniFrameId: null, lastFrameTime: 0, simulatedTime: 0,

  // Hover-Werte (I5): pro Diagramm-Slot (1/2, da Dual-Graph-Modus möglich).
  graphScale: { 1: null, 2: null },
  hoverActive: { 1: false, 2: false },
  hoverLocalX: { 1: null, 2: null },

  // I14: Dual-Sync — hoverSourceSlot = der Slot, über dem die Maus tatsächlich
  // steht (null = kein Hover); hoverT = daraus abgeleitete Zeit, geteilt mit
  // dem jeweils anderen Slot im Zwei-Diagramm-Modus (beide sind hier stets
  // Zeitreihen, keine Bahnkurve wie bei anderen Sims).
  hoverSourceSlot: null,
  hoverT: null,
}

export const DOM = {}

export function initDOM() {
  const q = id => document.getElementById(store.idPrefix + id)

  // Animations-SVG (Szene)
  DOM.mainSvg = q('main_svg')
  DOM.centerArea = q('center_area')
  DOM.animationGroup = q('animation_group')
  DOM.isoViewElements = q('iso_view_elements')
  DOM.view2dElements = q('view_2d_elements')
  DOM.coordSystem2d = q('animation_coord_system_2d')
  DOM.disk = q('disk')
  DOM.point = q('point')
  DOM.trajectoryPath = q('trajectory_path')
  DOM.phiArcGroup = q('phi_arc_group')
  DOM.phiArc = q('phi_arc')
  DOM.phiLabel = q('phi_label')
  DOM.positionVector = q('position_vector')
  DOM.velocityVector = q('velocity_vector')
  DOM.accelerationVector = q('acceleration_vector')
  DOM.omegaVector = q('omega_vector')
  DOM.alphaVector = q('alpha_vector')
  DOM.positionVectorX = q('position_vector_x'); DOM.positionVectorY = q('position_vector_y')
  DOM.velocityVectorX = q('velocity_vector_x'); DOM.velocityVectorY = q('velocity_vector_y')
  DOM.velocityVectorR = q('velocity_vector_r'); DOM.velocityVectorT = q('velocity_vector_t')
  DOM.accelerationVectorX = q('acceleration_vector_x'); DOM.accelerationVectorY = q('acceleration_vector_y')
  DOM.accelerationVectorR = q('acceleration_vector_r'); DOM.accelerationVectorT = q('acceleration_vector_t')
  DOM.isoAxisX = q('iso_axis_x'); DOM.isoAxisY = q('iso_axis_y'); DOM.isoAxisZ = q('iso_axis_z')
  DOM.isoLabelX = q('iso_label_x'); DOM.isoLabelY = q('iso_label_y'); DOM.isoLabelZ = q('iso_label_z')
  DOM.isoCirclePath = q('iso_circle_path')
  DOM.stopwatch = q('stopwatch')
  DOM.stopwatchMarks = q('stopwatch_marks')
  DOM.mainHand = q('stopwatch_main_hand')
  DOM.subdialMarks = q('stopwatch_subdial_marks') // FX2
  DOM.subHand = q('stopwatch_sub_hand')
  DOM.zoomTextDisplay = q('zoom_text_display')
  DOM.timeLabel = q('time_label')

  // Diagramm
  DOM.graphSvg = q('graph_svg')
  DOM.graphGroup1 = q('graph_group_1'); DOM.graphGroup2 = q('graph_group_2')

  // Hover-Werte (I5), pro Diagramm-Slot (1/2)
  DOM.graphHoverGroup = { 1: q('graph_hover_group_1'), 2: q('graph_hover_group_2') }
  DOM.graphHitRect = { 1: q('graph_hit_rect_1'), 2: q('graph_hit_rect_2') }
  DOM.hoverLine = { 1: q('graph_hover_line_1'), 2: q('graph_hover_line_2') }
  DOM.hoverPoint = { 1: q('graph_hover_point_1'), 2: q('graph_hover_point_2') }
  DOM.hoverTooltip = { 1: q('graph_hover_tooltip_1'), 2: q('graph_hover_tooltip_2') }
  DOM.hoverTooltipBg = { 1: q('graph_hover_tooltip_bg_1'), 2: q('graph_hover_tooltip_bg_2') }
  DOM.hoverTooltipText = { 1: q('graph_hover_tooltip_text_1'), 2: q('graph_hover_tooltip_text_2') }

  // Live-Analyse (einzelner Partikel)
  DOM.live = {}
  quantities.forEach(qq => { DOM.live[qq] = q(`live_${qq}`) })
}
