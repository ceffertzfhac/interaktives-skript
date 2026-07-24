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
        vxt: 'Geschw. <i>v</i>ₓ(<i>t</i>) / (m/s)',
        vyt: 'Geschw. <i>v</i>ᵧ(<i>t</i>) / (m/s)',
    },
    'Beschleunigungs-Komponenten': {
        axt: 'Beschl. <i>a</i>ₓ(<i>t</i>) / (m/s²)',
        ayt: 'Beschl. <i>a</i>ᵧ(<i>t</i>) / (m/s²)',
    },
    'Beträge & Winkel': {
        vabs: 'Betrag |<i>v</i>(<i>t</i>)| / (m/s)',
        aabs: 'Betrag |<i>a</i>(<i>t</i>)| / (m/s²)',
        phit: 'Winkel <i>φ</i>(<i>t</i>) / °',
        omega: 'Winkelgeschw. <i>ω</i>(<i>t</i>) / (rad/s)',
    },
};

export const graphTitles = {
    yx: 'Bahnkurve y(x)', xy: 'Bahnkurve x(y)',
    xt: 'x-Koordinate x(t)', yt: 'y-Koordinate y(t)',
    vxt: 'Geschwindigkeit vₓ(t)', vyt: 'Geschwindigkeit vᵧ(t)',
    axt: 'Beschleunigung aₓ(t)', ayt: 'Beschleunigung aᵧ(t)',
    vabs: 'Betrag |v|(t)', aabs: 'Betrag |a|(t)', phit: 'Winkel φ(t)',
    omega: 'Winkelgeschwindigkeit ω(t)',
    // Betrags-Vergleich bei veränderlichem ω (Aspekt-Figur 1.51): |a_t| oben
    // (Tangentialbeschleunigung, konstant für konst. α), a_r unten (Zentripetal-
    // beschleunigung, wächst mit ω(t)²). Unterstrich-Notation wie im Skript
    // (a_\text{t}/a_\text{r}), da Unicode kein tiefgestelltes r kennt.
    att: 'Tangentialbeschl. |a_t|(t)', art: 'Zentripetalbeschl. a_r(t)',
};

export const graphAxisLabels = {
    yx: 'y / m', xy: 'x / m', xt: 'x / m', yt: 'y / m',
    vxt: 'vₓ / (m/s)', vyt: 'vᵧ / (m/s)',
    axt: 'aₓ / (m/s²)', ayt: 'aᵧ / (m/s²)',
    vabs: '|v| / (m/s)', aabs: '|a| / (m/s²)', phit: 'φ / °',
    omega: 'ω / (rad/s)',
    att: '|a_t| / (m/s²)', art: 'a_r / (m/s²)',
};

export const graphXAxisLabels = { yx: 'x / m', xy: 'y / m' };

export const timeSeriesTypes = ['xt', 'yt', 'vxt', 'vyt', 'axt', 'ayt', 'vabs', 'aabs', 'phit', 'omega', 'att', 'art'];
export const trajectoryTypes = ['yx', 'xy'];
