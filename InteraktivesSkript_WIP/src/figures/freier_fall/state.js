'use strict'

// state.js — Zustand + DOM-Cache des Freier-Fall-Motors (BACKLOG P16-1).
//
// Portiert aus der Stand-alone-Sim. EINZIGE strukturelle Port-Aenderung:
// store.idPrefix + q(id) = getElementById(idPrefix + id), damit mehrere
// Figuren auf einer Seite unabhaengig sind (Muster wie kreisbewegung/,
// grundbegriffe/, bus_weg_zeit/, federpendel/ — Begruendung in runtime.js).
//
// initDOM() bleibt VOLLSTAENDIG (auch Topbar-, Export- und Theme-Elemente der
// Stand-alone-Sim). Das ist Absicht und folgt federpendel/state.js: der Motor
// dereferenziert diese Elemente an einigen Stellen unbedingt, die Aspekt-Figur
// liefert sie darum als versteckte Stubs im Skelett. Fehlt eins, gibt es einen
// Null-Zugriff — der haeufigste Bau-Fehler (Runbook-Fallstrick #1).

// ── Mutierbarer Zustand ─────────────────────────────────────────────────────
export const store = {
  idPrefix: 'ff_',       // runtime.js setzt 'ff<n>_' — s. dortiger Kopfkommentar

  // Parameter
  h0: 10,                // Anfangshoehe (m)
  v0: 0,                 // Anfangsgeschwindigkeit (m/s); >0 aufwaerts, <0 abwaerts

  // Zwei unabhaengige Diagramm-Picker; graphType2 nur im Zwei-Diagramm-Modus
  // (isStacked) relevant.
  graphType1: 'weg',
  graphType2: 'geschw',
  isStacked: false,
  speedFactor: 1.0,

  // Achsenkonfiguration — die vier v0.13-Varianten (Abb. 1.4-1.7):
  // direction 'up'|'down' x origin 'ground'|'start'.
  yAxisConfig: { direction: 'up', origin: 'ground' },

  // Progressiv wachsende Zeitreihen (kein Vorab-Precompute, s. physics.js)
  t_data: [], y_data: [], v_data: [], a_data: [],

  // Animation
  aniFrameId: null,
  lastFrameTime: 0,
  simulatedTime: 0,

  // Hover-Werte: graphScale pro Slot ('single'/'top'/'bottom');
  // hoverSourceSlot = der Slot, ueber dem die Maus steht (null = kein Hover);
  // hoverT = daraus abgeleitete Zeit, im Zwei-Diagramm-Modus mit dem anderen
  // Slot geteilt (beide teilen sich dort stets die Zeitachse).
  graphScale: { single: null, top: null, bottom: null },
  hoverSourceSlot: null,
  hoverT: null,
}

// ── DOM-Cache ───────────────────────────────────────────────────────────────
export const DOM = {}

// Port-Aenderung gegenueber der Stand-alone-Sim: die IDs sind pro Figur
// prefixt (ff0_, ff1_, …). Identisch zu kreisbewegung/state.js.
const q = id => document.getElementById(store.idPrefix + id)

export function initDOM() {
  // Szene
  DOM.mainSvg       = q('main_svg')
  DOM.building      = q('building')
  DOM.stickFigure   = q('stick_figure')
  DOM.ball          = q('ball')
  DOM.rulerGroup    = q('ruler_group')
  DOM.velVector     = q('vel_vector')
  DOM.accVector     = q('acc_vector')
  DOM.togVel        = q('tog_vel')
  DOM.togAcc        = q('tog_acc')
  DOM.yAxisDisplay  = q('y_axis_display')

  // Stoppuhr
  DOM.mainHand      = q('sw_main_hand')
  DOM.subHand       = q('sw_sub_hand')
  DOM.swMarks       = q('sw_marks')
  DOM.sdMarks       = q('sd_marks')

  // Diagramm-Gruppen (Single + Stacked Top/Bottom)
  DOM.graphGroupSingle        = q('graph_group_single')
  DOM.gridGroup               = q('grid_group')
  DOM.graphLine               = q('graph_line')
  DOM.graphPoint              = q('graph_point')
  DOM.graphTitle              = q('graph_title')
  DOM.graphGroupStackedTop    = q('graph_group_stacked_top')
  DOM.gridGroupTop            = q('grid_group_top')
  DOM.graphLineTop            = q('graph_line_top')
  DOM.graphPointTop           = q('graph_point_top')
  DOM.graphTitleTop           = q('graph_title_top')
  DOM.graphGroupStackedBottom = q('graph_group_stacked_bottom')
  DOM.gridGroupBottom         = q('grid_group_bottom')
  DOM.graphLineBottom         = q('graph_line_bottom')
  DOM.graphPointBottom        = q('graph_point_bottom')
  DOM.graphTitleBottom        = q('graph_title_bottom')

  // Hover-Werte, pro Diagramm-Slot
  DOM.graphHitRect     = { single: q('graph_hit_rect'),              top: q('graph_hit_rect_top'),              bottom: q('graph_hit_rect_bottom') }
  DOM.hoverLine        = { single: q('graph_hover_line'),            top: q('graph_hover_line_top'),            bottom: q('graph_hover_line_bottom') }
  DOM.hoverPoint       = { single: q('graph_hover_point'),           top: q('graph_hover_point_top'),           bottom: q('graph_hover_point_bottom') }
  DOM.hoverTooltip     = { single: q('graph_hover_tooltip'),         top: q('graph_hover_tooltip_top'),         bottom: q('graph_hover_tooltip_bottom') }
  DOM.hoverTooltipBg   = { single: q('graph_hover_tooltip_bg'),      top: q('graph_hover_tooltip_bg_top'),      bottom: q('graph_hover_tooltip_bg_bottom') }
  DOM.hoverTooltipText = { single: q('graph_hover_tooltip_text'),    top: q('graph_hover_tooltip_text_top'),    bottom: q('graph_hover_tooltip_text_bottom') }

  // Bedienung
  DOM.h0Slider      = q('h0_slider')
  DOM.v0Slider      = q('v0_slider')
  DOM.h0Value       = q('h0_value')
  DOM.v0Value       = q('v0_value')
  DOM.graphSelect1  = q('graph_select_1')
  DOM.graphSelect2  = q('graph_select_2')
  DOM.dualGraphControl  = q('dual_graph_control')
  DOM.yAxisSelect   = q('y_axis_config')
  DOM.playBtn       = q('play_btn')
  DOM.pauseBtn      = q('pause_btn')

  // Port-Aenderung: die Radio-Gruppen werden ueber den Prefix im name-Attribut
  // gesucht, nicht dokumentweit. Die Stand-alone-Sim nutzt name="speed" bzw.
  // name="diagram_mode" global — auf einer Seite mit mehreren Figuren griffen
  // sonst alle Instanzen auf dieselben Radios zu (und der Browser wuerde sie
  // ausserdem zu EINER Auswahlgruppe zusammenfassen).
  DOM.speedRadios       = document.querySelectorAll(`input[name="${store.idPrefix}speed"]`)
  DOM.diagramModeRadios = document.querySelectorAll(`input[name="${store.idPrefix}diagram_mode"]`)

  // Layout / Analyse
  DOM.appLayout      = q('app_layout')
  DOM.analysisToggle = q('analysis_toggle')
  DOM.themeToggle    = q('theme_toggle')
  DOM.timeLabel      = q('time_label')

  // Live-Panel
  DOM.liveT         = q('live_t')
  DOM.liveY         = q('live_y')
  DOM.liveV         = q('live_v')
  DOM.liveA         = q('live_a')
  DOM.liveTfall     = q('live_tfall')
  DOM.liveYmax      = q('live_ymax')
  DOM.liveVimpact   = q('live_vimpact')

  // Export (Stand-alone-Topbar; in den Aspekt-Figuren nur Stubs)
  DOM.exportDiagram = q('export_diagram_btn')
  DOM.exportAll     = q('export_all_btn')
}
