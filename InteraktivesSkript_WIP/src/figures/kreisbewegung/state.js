// state.js — Zustand + DOM-Cache der Kreisbewegung-Simulation (Portierung aus
// Input/Simulationen/Project_kreisbewegung_simulation/js/state.js).
//
// Aenderungen gegenueber der Quelle: alle Element-IDs sind mit "kb_" prefixt
// (Kollisionsschutz im gemeinsamen index.html-Dokument neben den gcN-Figuren);
// das experimentelle "Nebeneinander"-Probe-Layout (layoutSplit) ist entfernt --
// die Simulation lebt hier immer im gestapelten Layout innerhalb der
// Sim-Panel-Karte.
'use strict';

import { DEFAULT_PIXELS_PER_METER } from './constants.js';

export const store = {
    // Parameter
    R: 1.5,
    phi0Deg: 0,
    omegaDeg: 60,
    speedFactor: 1.0,
    graphType1: 'yx',
    graphType2: 'yt',
    isStacked: false,
    rememberedTrajType: null,

    // ID-Prefix fuer die Skelett-Elemente (kb_<id>). Default 'kb_' = die
    // schlafende gc10-Sim. Aspekt-Figuren setzen einen eindeutigen Prefix pro
    // Instanz, damit mehrere wiederverwendete Motoren nicht ueber gleiche IDs
    // kollidieren (s. aspekt_*/runtime.js). q() liest dies zur Bindung.
    idPrefix: 'kb_',

    graphScale: { single: null, top: null, bottom: null },
    hoverSourceSlot: null,
    hoverT: null,
    isDigitalDisplay: false,

    omega: 0,
    T: Infinity,

    currentPixelsPerMeter: DEFAULT_PIXELS_PER_METER,
    zoomFactor: 1,

    visualTime: 0,
    simulatedTime: 0,

    aniFrameId: null,
    lastFrameTime: 0,

    showPositionVector: true,
    showPositionComponents: false,
    showVelocityVector: true,
    showVelocityComponents: false,
    showAccelerationVector: true,
    showAccelerationComponents: false,
    showTrajectory: true,

    // Pfeil-Längen-Skalierung (mit der Strichstärke mitwachsen lassen, s.
    // render.js::updateScene). Default 1 = Vorlage; eine Figur, die Vektoren
    // ×n dicker zeichnet (Strich + Marker), setzt n — sonst bliebe die Spitze
    // bei dickerem Schaft auf altem, zu kurz gekürztem Platz (Kopplung
    // ARROW_LEN = 5·strokeWidth). Opt-in, nur фигурsetzen die das wollen.
    arrowLenScale: 1,

    tData: [], xData: [], yData: [],
    vxData: [], vyData: [], axData: [], ayData: [],
    vabsData: [], aabsData: [], phitData: [], omegaData: [],
    axisLimits: {},
};

export const DOM = {};

const q = id => document.getElementById(store.idPrefix + id);

export function initDOM() {
    DOM.mainSvg = q('main_svg');
    DOM.centerArea = q('center_area');
    DOM.animationCoordSystem = q('animation_coord_system');
    DOM.disk = q('disk');
    DOM.trajectoryPath = q('trajectory_path');
    DOM.point = q('point');
    DOM.zoomTextDisplay = q('zoom_text_display');

    DOM.positionVector = q('position_vector');
    DOM.positionVectorX = q('position_vector_x');
    DOM.positionVectorY = q('position_vector_y');
    DOM.velocityVector = q('velocity_vector');
    DOM.velocityVectorX = q('velocity_vector_x');
    DOM.velocityVectorY = q('velocity_vector_y');
    DOM.accelerationVector = q('acceleration_vector');
    DOM.accelerationVectorX = q('acceleration_vector_x');
    DOM.accelerationVectorY = q('acceleration_vector_y');

    DOM.stopwatch = q('stopwatch');
    DOM.stopwatchCircle = q('stopwatch_circle');
    DOM.stopwatchMarks = q('stopwatch_marks');
    DOM.subdial = q('subdial');
    DOM.subdialMarks = q('subdial_marks');
    DOM.mainHand = q('stopwatch_main_hand');
    DOM.subHand = q('stopwatch_sub_hand');
    DOM.digitalDisplayGroup = q('digital_display_group');

    DOM.graphSvg = q('graph_svg');
    DOM.graphGroupSingle = q('graph_group_single');
    DOM.graphTitle = q('graph_title');
    DOM.gridGroup = q('grid_group');
    DOM.graphLine = q('graph_line');
    DOM.graphPoint = q('graph_point');

    DOM.graphGroupStackedTop = q('graph_group_stacked_top');
    DOM.graphTitleTop = q('graph_title_top');
    DOM.gridGroupTop = q('grid_group_top');
    DOM.graphLineTop = q('graph_line_top');
    DOM.graphPointTop = q('graph_point_top');

    DOM.graphGroupStackedBottom = q('graph_group_stacked_bottom');
    DOM.graphTitleBottom = q('graph_title_bottom');
    DOM.gridGroupBottom = q('grid_group_bottom');
    DOM.graphLineBottom = q('graph_line_bottom');
    DOM.graphPointBottom = q('graph_point_bottom');

    DOM.graphSelect1 = q('graph_select_1');
    DOM.graphSelect2 = q('graph_select_2');

    DOM.graphHitRect = { single: q('graph_hit_rect'), top: q('graph_hit_rect_top'), bottom: q('graph_hit_rect_bottom') };
    DOM.hoverLine = { single: q('graph_hover_line'), top: q('graph_hover_line_top'), bottom: q('graph_hover_line_bottom') };
    DOM.hoverPoint = { single: q('graph_hover_point'), top: q('graph_hover_point_top'), bottom: q('graph_hover_point_bottom') };
    DOM.hoverTooltip = { single: q('graph_hover_tooltip'), top: q('graph_hover_tooltip_top'), bottom: q('graph_hover_tooltip_bottom') };
    DOM.hoverTooltipBg = { single: q('graph_hover_tooltip_bg'), top: q('graph_hover_tooltip_bg_top'), bottom: q('graph_hover_tooltip_bg_bottom') };
    DOM.hoverTooltipText = { single: q('graph_hover_tooltip_text'), top: q('graph_hover_tooltip_text_top'), bottom: q('graph_hover_tooltip_text_bottom') };
    DOM.dualGraphControl = q('dual_graph_control');

    DOM.radiusSlider = q('radius_slider');
    DOM.phi0Slider = q('phi0_slider');
    DOM.omegaSlider = q('omega_slider');
    DOM.radiusValue = q('radius_value');
    DOM.phi0Value = q('phi0_value');
    DOM.omegaValue = q('omega_value');
    DOM.speedRadios = document.querySelectorAll('input[name="kb_speed"]');
    DOM.togPositionVector = q('toggle_position_vector');
    DOM.togPositionComponents = q('toggle_position_components');
    DOM.togVelocityVector = q('toggle_velocity_vector');
    DOM.togVelocityComponents = q('toggle_velocity_components');
    DOM.togAccelerationVector = q('toggle_acceleration_vector');
    DOM.togAccelerationComponents = q('toggle_acceleration_components');
    DOM.togTrajectory = q('toggle_trajectory');
    DOM.diagramModeRadios = document.querySelectorAll('input[name="kb_diagram_mode"]');

    DOM.playBtn = q('play_btn');
    DOM.pauseBtn = q('pause_btn');
    DOM.resetBtn = q('reset_btn');
    DOM.exportDiagram = q('export_diagram_btn');
    DOM.exportAll = q('export_all_btn');

    DOM.appLayout = q('app_layout');
    DOM.analysisToggle = q('analysis_toggle');
    DOM.timeLabel = q('time_label');

    DOM.liveT = q('live_t');
    DOM.livePhi = q('live_phi');
    DOM.liveX = q('live_x');
    DOM.liveY = q('live_y');
    DOM.liveVx = q('live_vx');
    DOM.liveVy = q('live_vy');
    DOM.liveVabs = q('live_vabs');
    DOM.liveAx = q('live_ax');
    DOM.liveAy = q('live_ay');
    DOM.liveAabs = q('live_aabs');
    DOM.liveTper = q('live_T');
    DOM.liveOmega = q('live_omega');
    DOM.liveF = q('live_f');
}
