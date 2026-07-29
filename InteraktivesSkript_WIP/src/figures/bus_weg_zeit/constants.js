'use strict'

// constants.js — Konfiguration des Bus-Weg-Zeit-Motors.
//
// NEUER, FIGUR-ONLY Motor (keine Stand-alone-Sim in Input/Simulationen/ — die
// geschwindigkeit_simulation ist eine reine Steigungsanalyse ohne Strecken/
// Szenen-Animation und wurde als Motor verworfen). Strukturmodelliert auf
// grundbegriffe/ (eigner store/runtime, lib-Wiederverwendung, diagrammatisch),
// ergaenzt um das Play/Pause+RAF+Auto-Stopp-Muster der Zeit-Figuren.
//
// Datenquelle der Kurve x(t): das matplotlib-Notebook
// Input/v0.13/PSkriptBilder/weg_zeit_diagramm_bushaltestellen.ipynb (recoverable
// aus dem gerenderten SVG). Die Halte-/Fahrt-Dauern der Haltestellen 2–4 und
// Fahrten 2–3 sind im Notebook randomisiert (np.random.uniform); fuer eine
// reproduzierbare Figur sind sie hier ANGEPINNT (nur Halt 1 = 30 s und Fahrt 1
// = 90 s sind im Notebook fix). Die Summe ergibt exakt 400 s.
//
// Der Motor ist ein DIAGRAMMATISCHES WERKZEUG: ein Zeitcursor (Regler ODER
// Play/Pause-Animation) bewegt den Bus auf der Straße (Straßenszene) UND den
// zugehoerigen Punkt auf der x(t)-Kurve synchron. Daher Play/Pause+Auto-Stopp
// (playback.js), aber nur EIN Cursor (keine tA/tB wie grundbegriffe).

// ── Zeit ───────────────────────────────────────────────────────────────────
export const T_MIN = 0
export const T_MAX = 400          // s — Fahrtverlauf 0 … 400 s
export const T_STEP = 1           // s — Regler-Schrittweite
export const T_AUTO = 400         // Auto-Stopp am Ende (kein Umbrechen)
export const T_DEFAULT = 75       // Start-Cursor = Prosa-Beispiel (t=75 s -> x≈250 m)

// ── Haltestellen (Linie 42) ────────────────────────────────────────────────
export const STOP_POSITIONS = [0, 500, 1000, 1500]   // m
export const STOP_LABELS = ['H1', 'H2', 'H3', 'H4']

// ── Fahrtverlauf: stückweise x(t) aus Halten (flach) + Fahrten (S-Kurve) ────
//   Halt:   x(t) = xStart (konstant)
//   Fahrt:  x(t) = xStart + trapezoidX(t−tStart; dist, dur, ACCEL_RATIO)
//           Trapez-Geschwindigkeitsprofil: 30 % beschleunigen, 40 % konstant,
//           30 % bremsen; v_max = dist / (dur·(1−ACCEL_RATIO)) -> streng monotone
//           S-Kurve (quadratisch–linear–quadratisch), exakt wie das Notebook.
export const ACCEL_RATIO = 0.3

// Deterministisch angepinnte Segmente (Summe = 400 s):
//   1. Halt   H1:     0 … 30   (fix im Notebook)
//   2. Fahrt  H1→H2: 30 … 120  (fix im Notebook, 0 -> 500)
//   3. Halt   H2:   120 … 155
//   4. Fahrt  H2→H3: 155 … 240 (500 -> 1000)
//   5. Halt   H3:   240 … 275
//   6. Fahrt  H3→H4: 275 … 370 (1000 -> 1500)
//   7. Halt   H4:   370 … 400
export const SEGMENTS = [
  { type: 'halt',   tStart:   0, tEnd:  30, xStart:    0, xEnd:    0 },
  { type: 'fahrt',  tStart:  30, tEnd: 120, xStart:    0, xEnd:  500 },
  { type: 'halt',   tStart: 120, tEnd: 155, xStart:  500, xEnd:  500 },
  { type: 'fahrt',  tStart: 155, tEnd: 240, xStart:  500, xEnd: 1000 },
  { type: 'halt',   tStart: 240, tEnd: 275, xStart: 1000, xEnd: 1000 },
  { type: 'fahrt',  tStart: 275, tEnd: 370, xStart: 1000, xEnd: 1500 },
  { type: 'halt',   tStart: 370, tEnd: 400, xStart: 1500, xEnd: 1500 },
]

// Kurvenfarbe der Linie 42 (Notebook: matplotlib 'firebrick').
export const CURVE_COLOR = '#b22222'

// ── Diagramm-Geometrie (t-x, Landscape) ────────────────────────────────────
// t (0 … 400 s) -> horizontal, x(t) (0 … 1500 m) -> vertikal. UNABHAENGIGE
// Skalen (kein Equal-Scale wie bei grundbegriffe — das t-x-Diagramm ist ein
// Schema, keine Geometrie-Szene; die Ordinate ist bewusst staerker gerafft,
// wie die statische Vorlage figsize(12,7)). PLOT_W/PLOT_H ≈ 1,71 (Landscape).
export const PAD_L = 58
export const PAD_R = 22
export const PAD_T = 40
export const PAD_B = 48
export const GRAPH_W = 620
export const PLOT_W = GRAPH_W - PAD_L - PAD_R            // 540
export const PLOT_H = 316                                // Landscape-Verhaeltnis
export const GRAPH_H = PAD_T + PLOT_H + PAD_B            // 404

export const T_MAX_BOUND = T_MAX                         // t-Achse 0 … 400
export const X_MAX_BOUND = 1500                          // x-Achse 0 … 1500
export const T_TICK_STEP = 50                            // t-Ticks alle 50 s

// Sample-Dichte der Fahrt-Segmente (S-Kurve); Halt-Segmente sind flach -> nur
// Endpunkte. Gesamt ~ 4·SAMPLES_FAHRT + Halt-Punkte, pro Frame neu gezeichnet.
export const SAMPLES_FAHRT = 120

// ── Straßenszene-Geometrie (VERTIKAL gekippt, an die Ordinate angeglichen) ────
// Eigene kleine SVG links neben dem Diagramm (wie winkel_zeit: Szene | Graph).
// Die Straße ist um 90° gekippt — VERTIKAL: x=0 unten, x=1500 oben, analog zur
// Ordinate x(t) des t-x-Diagramms. Position UND Skala der Straße werden hier
// EXAKT an den Diagramm-Plot angeglichen (gleiche SVG-Hoehe GRAPH_H, gleicher
// y-Bereich PAD_T … PAD_T+PLOT_H, gleicher Maßstab PLOT_H px / 1500 m), sodass
// bei gleicher Pixel-Hoehe beider SVGs die Bus-Hoehe pixelgenau der Kurven-Hoehe
// entspricht (Bus-Hoehe ↔ x). Die CSS stretcht die Szenen-Spalte auf die
// Diagramm-Hoehe, damit beide SVGs gleich hoch rendern.
export const STREET_W = 220
export const STREET_H = GRAPH_H                           // gleiche SVG-Hoehe wie Diagramm
export const STREET_ROAD_X = 118                           // Straßen-Mitte (vertikal)
export const STREET_Y_TOP = PAD_T                          // = Diagramm-Plot oben  (x=1500)
export const STREET_Y_BOTTOM = PAD_T + PLOT_H              // = Diagramm-Plot unten (x=0)
export const STREET_LEN = PLOT_H                           // gleiche Skala wie die Ordinate (316 px / 1500 m)
export const BUS_W = 54   // Bus-Laenge entlang der Fahrtrichtung (vertikal)
export const BUS_H = 30   // Bus-Breite quer

// ── Toggles (Bedienpanel) ──────────────────────────────────────────────────
// Einfache Ein-/Aus-Schalter (kein Hover-Highlight wie grundbegriffe — bewusste
// Vereinfachung, s. Kopfkommmentar der Factory). Default-Vergabe in der Factory.
export const TOGGLE_KEYS = [
  'haltestellen',   // gestrichelte Horizontale an den Haltestellen
  'ereignisse',     // gepunktete Vertikalen an Ankunft/Abfahrt
  'ableselinien',   // Lot-Fällungen vom Kurvenpunkt zu beiden Achsen
  'haltFahrt',      // Kurve nach Halt/Fahrt eingefärbt (sonst einheitlich firebrick)
]