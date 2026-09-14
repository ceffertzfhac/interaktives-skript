'use strict'

// PORTIERT aus Input/Simulationen/Project_ableitung_simulation (BACKLOG P17-1,
// Abb. 1.15). Werte unveraendert uebernommen; die Aspekt-Figur gatet ueber
// store-Flags, nicht durch Aendern dieser Konstanten.

// ── Konfiguration: „Die Ableitung als Grenzwert" ─────────────────────────────
// Diagrammatisches Werkzeug ohne Zeit-Animation (kein requestAnimationFrame-Loop,
// kein Play/Pause/Stoppuhr/CSV — Sim-Schale analog Project_3massen_umlenkrollen).
// Physikalische Idee: die Sekante (Differenzenquotient) nähert sich mit δ → 0 der
// Tangente (Differentialquotient = Ableitung).

// Definitionsbereich der dargestellten Funktionen
export const X_MIN = 0
export const X_MAX = 25
export const NUM_POINTS = 500          // Abtastpunkte der Funktionskurve

// Stützstelle x₀ (Slider) — Ränder ausgespart, damit die Sekante Platz hat
export const X0_MIN = 1
export const X0_MAX = 24
export const X0_STEP = 0.1
export const X0_DEFAULT = 12.5

// Abstand δ (Slider). Betragsgrenze zusätzlich dynamisch an den Rand gekoppelt,
// damit x₀ ± δ (bzw. x₀ + δ) im Definitionsbereich bleibt.
export const DELTA_LIMIT = 5
export const DELTA_STEP = 0.05
export const DELTA_DEFAULT = 2.5

// Auswählbare Funktionen: analytische Funktion f + analytische Ableitung f'
// (sauberer als der numerische Differenzenquotient des Prototyps). `label` ist
// aus Nutzerperspektive benannt (Dropdown), `titleId` verweist auf die statische
// MathJax-Gleichung im SVG-Titel (JS schaltet nur display).
export const FUNCS = {
  gerade: {
    label: 'Gerade (linear)',
    f:  x => 2 * x - 2,
    fp: _x => 2,
  },
  parabel: {
    label: 'Parabel (quadratisch)',
    f:  x => 0.1 * (x - 12) ** 2 - 2,
    fp: x => 0.2 * (x - 12),
  },
  kubisch: {
    label: 'Kubisch (3. Grades)',
    f:  x => 0.02 * (x - 12.5) ** 3 - 2 * (x - 12.5),
    fp: x => 0.06 * (x - 12.5) ** 2 - 2,
  },
  komplex: {
    label: 'Komplex (Sinus + Parabel)',
    f:  x => -5 * Math.sin(x / 2) + 0.03 * x ** 2,
    fp: x => -2.5 * Math.cos(x / 2) + 0.06 * x,
  },
  // PORT-ERGAENZUNG (2026-09-14, BACKLOG P17-1): die Kurve der gedruckten
  // Abb. 1.15. Die Abbildung nennt ihre Funktionsgleichung im Titel:
  //   x(t) = 1/1000 * (-4 m/s^2 (t+2s)^2 - 4 m/s (t+2s) - 20 m) * sin(t / 1s)
  // Sie ist der Grund, warum die Abbildung existiert: auf [8 s; 16 s] ist die
  // SEKANTE positiv (+0,11 m/s), die TANGENTE bei t = 12 s aber negativ
  // (-0,66 m/s) -- Durchschnitts- und Momentangeschwindigkeit haben dort nicht
  // einmal dasselbe Vorzeichen. Keine der vier Funktionen oben leistet das.
  // Nachgerechnet gegen die Abbildung: x(12) = 0,4615 m (dort 0,46),
  // x'(12) = -0,6635 m/s (dort -0,66), Sekante 0,1068 m/s (dort 0,11).
  // Ableitung analytisch (Produktregel), nicht numerisch -- wie bei den anderen.
  skript: {
    label: 'Ort x(t) aus Abb. 1.15',
    f:  t => 0.001 * (-4 * (t + 2) ** 2 - 4 * (t + 2) - 20) * Math.sin(t),
    fp: t => 0.001 * ((-8 * (t + 2) - 4) * Math.sin(t)
                      + (-4 * (t + 2) ** 2 - 4 * (t + 2) - 20) * Math.cos(t)),
  },
}
export const DEFAULT_FUNC = 'gerade'

// ── Diagramm-Geometrie (Landscape, füllt die mittlere Spalte, meet-zentriert) ──
export const GRAPH_W = 780
export const GRAPH_H = 580
export const PAD_L = 58   // Platz für y-Ticks + y-Achsenlabel
export const PAD_R = 26
export const PAD_T = 56   // Platz für den Funktions-Titel (MathJax)
export const PAD_B = 48   // Platz für x-Ticks + x-Achsenlabel
