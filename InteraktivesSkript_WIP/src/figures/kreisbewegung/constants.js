// constants.js — Physik-/Layout-/Diagramm-Konstanten fuer die Kreisbewegung-
// Simulation (Portierung aus Input/Simulationen/Project_kreisbewegung_simulation/
// js/constants.js, unveraendert -- reine Zahlenkonstanten, keine DOM-/Pfad-
// Abhaengigkeiten).
'use strict';

// -- Physik ------------------------------------------------------------------
export const TIME_STEP = 1 / 60; // Physik-Zeitschritt (60 Hz)

// -- Pixel-Skalierung (Animation) --------------------------------------------
export const DEFAULT_PIXELS_PER_METER = 98.4;
export const PIXELS_PER_VELOCITY_UNIT = 24;
export const PIXELS_PER_ACCELERATION_UNIT = 6;
export const POINT_RADIUS = 8;

// -- Animationsflaeche (SVG-Koordinaten) -- nur gestapeltes Layout (kein
// Nebeneinander-Probe-Layout in dieser Einbettung, s. ui.js) --------------
export const ANIM_W = 450;
export const ANIM_CX = ANIM_W / 2;
export const ANIM_H_STACK = 480, ANIM_CY_STACK = 260;

// -- Slider-Grenzen ------------------------------------------------------------
export const R_MIN = 0.5, R_MAX = 2.0;
export const PHI0_MIN = 0, PHI0_MAX = 360;
export const OMEGA_MIN = -180, OMEGA_MAX = 180;

// -- Diagramm-Geometrie (gestapelt/landscape) --------------------------------
export const GRAPH_W_STACK = 700, GRAPH_H_STACK = 410;
export const GRAPH_STACKED_GAP = 10;

// -- Stoppuhr -------------------------------------------------------------------
export const WATCH_CX = 280, WATCH_CY = 120, WATCH_R = 72;
export const SDIAL_CX = 280, SDIAL_CY = 150, SDIAL_R = 16;

// -- LCD-Digitaluhr (Easteregg) -------------------------------------------------
export const DIGITAL_DISPLAY_SCALE = 0.85;
export const SEG_THICK = 6 * DIGITAL_DISPLAY_SCALE;
export const SEG_LEN = 40 * DIGITAL_DISPLAY_SCALE;
export const DIGIT_SPACING = 5 * DIGITAL_DISPLAY_SCALE;
export const COLON_WIDTH = 10 * DIGITAL_DISPLAY_SCALE;
export const LCD_FRAME_PADDING = 10 * DIGITAL_DISPLAY_SCALE;
export const DIGIT_WIDTH = SEG_LEN + 2 * SEG_THICK;
export const DIGIT_HEIGHT = 2 * SEG_LEN + 3 * SEG_THICK;
export const COLON_DOT_SIZE = SEG_THICK;
export const DIGITAL_FRAME_W = 4 * DIGIT_WIDTH + COLON_WIDTH + 3 * DIGIT_SPACING + 2 * LCD_FRAME_PADDING;
export const DIGITAL_FRAME_H = DIGIT_HEIGHT + 2 * LCD_FRAME_PADDING;
export const DIGITAL_FRAME_X = WATCH_CX - DIGITAL_FRAME_W / 2;
export const DIGITAL_FRAME_Y = WATCH_CY - DIGITAL_FRAME_H / 2;

export const DIGIT_SEGMENTS_MAP = {
    0: [0, 1, 2, 3, 4, 5], 1: [1, 2], 2: [0, 1, 6, 4, 3], 3: [0, 1, 6, 2, 3],
    4: [5, 6, 1, 2], 5: [0, 5, 6, 2, 3], 6: [0, 5, 4, 3, 2, 6], 7: [0, 1, 2],
    8: [0, 1, 2, 3, 4, 5, 6], 9: [0, 1, 2, 3, 5, 6],
};

// -- Diagramm-Optionen ----------------------------------------------------------
export const graphOptions = {
    'Bahnkurve': {
        yx: 'Bahn <i>y</i>(<i>x</i>)',
        xy: 'Bahn <i>x</i>(<i>y</i>)',
    },
    'Orts-Komponenten': {
        xt: 'x-Koordinate <i>x</i>(<i>t</i>) / m',
        yt: 'y-Koordinate <i>y</i>(<i>t</i>) / m',
    },
    'Geschwindigkeits-Komponenten': {
        vxt: 'Geschw. <i>v</i><sub>x</sub>(<i>t</i>) / (m/s)',
        vyt: 'Geschw. <i>v</i><sub>y</sub>(<i>t</i>) / (m/s)',
    },
    'Beschleunigungs-Komponenten': {
        axt: 'Beschl. <i>a</i><sub>x</sub>(<i>t</i>) / (m/s²)',
        ayt: 'Beschl. <i>a</i><sub>y</sub>(<i>t</i>) / (m/s²)',
    },
    'Beträge & Winkel': {
        vabs: 'Betrag |<i>v</i>(<i>t</i>)| / (m/s)',
        aabs: 'Betrag |<i>a</i>(<i>t</i>)| / (m/s²)',
        phit: 'Winkel <i>φ</i>(<i>t</i>) / °',
        omega: 'Winkelgeschw. <i>ω</i>(<i>t</i>) / (rad/s)',
    },
};

// Titel und Achsen der Diagramme als TeX (setTexLabel, P28), Schreibweise wie
// im Fliesstext (\varphi, \vec a_\text{t}, Betraege mit Pfeil und (t) innen).
// Vorher Unicode-Indizes: vᵧ/aᵧ waren tiefgestellte GAMMAS (ein tiefgestelltes
// y gibt es in Unicode nicht). Die Achsen-Strings in physics.js (xLabel/yLabel)
// bleiben Klartext — sie speisen den CSV-Export (ui.js::stripLabel).
export const graphTitles = {
    yx: '\\text{Bahnkurve }y(x)', xy: '\\text{Bahnkurve }x(y)',
    xt: 'x\\text{-Koordinate }x(t)', yt: 'y\\text{-Koordinate }y(t)',
    vxt: '\\text{Geschwindigkeit }v_x(t)', vyt: '\\text{Geschwindigkeit }v_y(t)',
    axt: '\\text{Beschleunigung }a_x(t)', ayt: '\\text{Beschleunigung }a_y(t)',
    vabs: '\\text{Betrag }|\\vec v(t)|', aabs: '\\text{Betrag }|\\vec a(t)|', phit: '\\text{Winkel }\\varphi(t)',
    omega: '\\text{Winkelgeschwindigkeit }\\omega(t)',
    // Betrags-Vergleich bei veraenderlichem ω (Aspekt-Figur 1.51): |a⃗_t(t)| oben
    // (Tangentialbeschleunigung, konstant fuer konst. α), a⃗_r unten (Zentripetal-
    // beschleunigung, waechst mit ω(t)²).
    att: '\\text{Tangentialbeschl. }|\\vec a_\\text{t}(t)|', art: '\\text{Zentripetalbeschl. }|\\vec a_\\text{r}(t)|',
};

export const graphAxisLabels = {
    yx: 'y\\,/\\,\\mathrm{m}', xy: 'x\\,/\\,\\mathrm{m}', xt: 'x\\,/\\,\\mathrm{m}', yt: 'y\\,/\\,\\mathrm{m}',
    vxt: 'v_x\\,/\\,(\\mathrm{m/s})', vyt: 'v_y\\,/\\,(\\mathrm{m/s})',
    axt: 'a_x\\,/\\,(\\mathrm{m/s^2})', ayt: 'a_y\\,/\\,(\\mathrm{m/s^2})',
    vabs: '|\\vec v|\\,/\\,(\\mathrm{m/s})', aabs: '|\\vec a|\\,/\\,(\\mathrm{m/s^2})', phit: '\\varphi\\,/\\,{}^\\circ',
    omega: '\\omega\\,/\\,(\\mathrm{rad/s})',
    att: '|\\vec a_\\text{t}|\\,/\\,(\\mathrm{m/s^2})', art: '|\\vec a_\\text{r}|\\,/\\,(\\mathrm{m/s^2})',
};

export const graphXAxisLabels = { yx: 'x\\,/\\,\\mathrm{m}', xy: 'y\\,/\\,\\mathrm{m}' };

export const timeSeriesTypes = ['xt', 'yt', 'vxt', 'vyt', 'axt', 'ayt', 'vabs', 'aabs', 'phit', 'omega', 'att', 'art'];
export const trajectoryTypes = ['yx', 'xy'];
