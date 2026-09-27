'use strict'

// constants.js — Konstanten des Kreis-/Spiralbewegungs-Motors.
// PORTIERT 1:1 aus Input/Simulationen/Project_kreis_spiralbewegung_simulation/js/constants.js
// (keine inhaltlichen Aenderungen — die Werte definieren die Optik der Vorlage).

// ── Physik ──────────────────────────────────────────────────────────────────
export const TIME_STEP = 1 / 60          // Physik-Zeitschritt (60 Hz)
export const SIM_DURATION = 120          // festes Precompute-Horizont (s) — statt
                                          // extend-on-the-fly; Spiral-R→0 bricht früher ab
export const ISO_ANGLE = 30 * Math.PI / 180

// ── Animations-Layout (SVG-Koordinaten, 2D-Koordinatenursprung) ──────────────
export const ANIM_W = 400
export const ANIM_H = 480
export const ANIM_CX = 175               // Bewegungszentrum x (physikal. Ursprung)
export const ANIM_CY = 240               // Bewegungszentrum y
export const DEFAULT_PIXELS_PER_METER = 75
export const COORD_AXIS_LEN = 150        // 2D-Achsenlänge (px, beide Richtungen)

// Vektor-Skalen (px pro Einheit, × zoomFactor zur Laufzeit)
export const VEL_SCALE = 0.40
export const ACC_SCALE = 0.20
export const OMEGA_LEN_FACTOR = 0.02     // ISO: |ω_deg| · Faktor → Länge (m, entlang z)
export const ALPHA_LEN_FACTOR = 0.04     // ISO: |α_deg| · Faktor → Länge (m, entlang z)

// ── Stoppuhr (kanonisches Design, Ref: Atwood v2.2.x / CLAUDE.md) ────────────
// Hauptzifferblatt r=72, 60 Marken, Hauptzeiger 1 U/60 s.
export const WATCH_TX = 84               // Gruppen-Transform (translate)
export const WATCH_TY = -24
export const WATCH_SCALE = 0.595
export const WATCH_CX = 280              // Zifferblatt-Mittelpunkt (vor Transform)
export const WATCH_CY = 120
export const WATCH_R = 72
export const WATCH_HAND_LEN = 60
export const ZOOM_TEXT_X = 250.6
export const ZOOM_TEXT_Y = 108.24

// FX2: Subdial (10 Marken, Sub-Zeiger 1 U/s) — proportional zu WATCH_R statt
// der absoluten Atwood-Zahlen (dort WATCH_R=60), da dieses Zifferblatt mit
// WATCH_R=72 größer ist; Verhältnis 13/60 bzw. 25/60 aus dem Atwood-Vorbild
// (r=13, Versatz cy=25 bei r=60) übernommen, damit die Proportionen stimmen.
export const WATCH_SUBDIAL_R = WATCH_R * 13 / 60
export const WATCH_SUBDIAL_OFFSET = WATCH_R * 25 / 60

// ── Diagramm-Geometrie ───────────────────────────────────────────────────────
// Graph-Maße liegen in render.js (LAND_*/PORT_*): das Format schaltet je Zell-Form
// (Landscape gestapelt / Portrait nebeneinander) um, daher nicht mehr fest hier.
// Plot-Padding (bg-Rect 10 px past arrowheads via refX=0-Ausnahme)
// PAD_B 40 -> 49 (P28-6): die t-Achsenbeschriftung steht unter der letzten
// Tick-Zahl am Pfeilende und braucht dort eine Zeile Abstand.
export const PAD_L = 55, PAD_R = 15, PAD_T = 30, PAD_B = 49

// ── Subjekte & Größen ────────────────────────────────────────────────────────
export const subjects = ['p']            // einzelner Partikel
export const quantities = [
  'x', 'y', 'vx', 'vy', 'ax', 'ay',      // kartesische Komponenten
  'phi', 'omega', 'alpha',               // Winkelgrößen (in Grad gespeichert)
  'ar', 'at', 'vabs', 'aabs',            // Beträge (|a_r|, |a_t|, |v|, |a|)
]

// Einheiten je Größe (Basis; Winkelgrößen in Grad — rad nur für UI/Graph-Anzeige)
export const quantityUnits = {
  x: 'm', y: 'm',
  vx: 'm/s', vy: 'm/s',
  ax: 'm/s²', ay: 'm/s²',
  phi: '°', omega: '°/s', alpha: '°/s²',
  ar: 'm/s²', at: 'm/s²', vabs: 'm/s', aabs: 'm/s²',
}

// Graph-Titel und Achsensymbole als TeX (setTexLabel, P28), Schreibweise wie
// im Fliesstext: \varphi, \vec a_\text{r}, Betraege mit Pfeil und (t) innen.
// Vorher Unicode-Indizes — vᵧ war ein tiefgestelltes GAMMA (ein
// tiefgestelltes y gibt es in Unicode nicht), |a_r(t)| stand woertlich da.
export const graphTitles = {
  phi: '\\text{Winkel }\\varphi(t)', omega: '\\text{Winkelgeschw. }\\omega(t)', alpha: '\\text{Winkelbeschl. }\\alpha(t)',
  x: '\\text{Ort }x(t)', y: '\\text{Ort }y(t)',
  vx: '\\text{Geschw. }v_x(t)', vy: '\\text{Geschw. }v_y(t)',
  ax: '\\text{Beschl. }a_x(t)', ay: '\\text{Beschl. }a_y(t)',
  vabs: '\\text{Geschwindigkeitsbetrag }|\\vec v(t)|', aabs: '\\text{Beschleunigungsbetrag }|\\vec a(t)|',
  ar: '|\\vec a_\\text{r}(t)|', at: '|\\vec a_\\text{t}(t)|',
}
export const quantityTex = {
  phi: '\\varphi', omega: '\\omega', alpha: '\\alpha',
  x: 'x', y: 'y', vx: 'v_x', vy: 'v_y', ax: 'a_x', ay: 'a_y',
  ar: '|\\vec a_\\text{r}|', at: '|\\vec a_\\text{t}|', vabs: '|\\vec v|', aabs: '|\\vec a|',
}

// CSV-Header je Größe (Winkelgrößen immer in Grad — Vergleichbarkeit)
export const csvHeader = {
  t: 't / s',
  x: 'x / m', y: 'y / m', vx: 'vx / m/s', vy: 'vy / m/s',
  ax: 'ax / m/s^2', ay: 'ay / m/s^2',
  phi: 'phi / deg', omega: 'omega / deg/s', alpha: 'alpha / deg/s^2',
  ar: '|ar| / m/s^2', at: '|at| / m/s^2', vabs: '|v| / m/s', aabs: '|a| / m/s^2',
}

// Reihenfolge der Voll-CSV (Alle Daten) — wie Quelldatei
export const allCsvQuantities = ['x', 'y', 'vx', 'vy', 'ax', 'ay', 'phi', 'omega', 'alpha', 'ar', 'at', 'vabs', 'aabs']

// ── Szenarien-Presets ────────────────────────────────────────────────────────
export const PRESETS = {
  gleich:         { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 90,  alpha: 0 },
  start:          { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 0,   alpha: 20 },
  brems:          { mode: 'kreis',   R0: 1.5, vr: 0,   omega0: 120, alpha: -15 },
  spirale_aussen: { mode: 'spirale', R0: 0.2, vr: 0.3, omega0: 150, alpha: 0 },
}