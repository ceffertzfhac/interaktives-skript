// aspekt_federpendel.js — interaktive Aspekt-Figuren des federpendel-Motors.
// EINE Fabrik fuer zwei sehr verschiedene Skriptstellen (Regel „eine Fabrik darf
// mehrere Abbildungen tragen", s. figures/CLAUDE.md); was sie unterscheidet,
// steht als data-Attribut am Platzhalter im Kapitel:
//
//   Abschnitt 3.1.5 „Horizontales Feder-Masse-System" (ohne Attribute)
//     horizontaler Aufbau, Regler m / k / x₀ — die DYNAMIK-Sicht: die
//     Schwingungsdauer ENTSTEHT aus Masse und Federkonstante (ω = √(k/m)).
//   Abb. 1.8 in 1.1.7 „Die Strecke"  (data-aufbau="vertikal" data-regler="T")
//     vertikaler Aufbau, Regler y₀ / T — die KINEMATIK-Sicht: das Skript gibt
//     dort y(t) = y₀·cos(2π t/T) und kennt weder Masse noch Federkonstante
//     (die kommen erst in Kapitel 3). Genau deshalb duerfen dort keine m/k-
//     Regler stehen: T ist der Parameter, nicht sein Ergebnis.
//
//   data-aufbau="vertikal"   -> store.oscillationMode='vertical'
//   data-regler="T"          -> T-Regler statt m/k; intern m = 1 kg fest und
//                               k = m·(2π/T)², damit der Motor rechnen kann
//   data-y0="<m>" / data-periode="<s>"  -> Startwerte
//
// Links das Feder-Masse-System (Anker, Feder, Masse, Ruhelage, Umkehrpunkte,
// Auslenkungsvektor), daneben bzw. darunter das Auslenkungs-Zeit-Diagramm — die
// harmonische Schwingung.
//
// KEINE ABBILDUNGSNUMMER (bewusst): Abschnitt 3.1.5 hat in v0.13 keine
// Abbildung, und es wird auch keine erfunden. Der Platzhalter im Kapitel traegt
// deshalb KEIN data-figref -> label_aspekt_figuren() ueberspringt ihn
// (querySelectorAll('.aspekt-figur[data-figref]')) und die Abbildungszaehlung
// des Kapitels bleibt exakt wie v0.13 (4 Abbildungen). Erste Aspekt-Figur ohne
// statisches Pendant; im Druck erscheint an dieser Stelle nichts (nur-bildschirm).
//
// ACHTUNG (Fallstrick beim Sondieren aufgefallen): fig-feder_masse_schwingung
// liegt in 3.1.1, NICHT in 3.1.5, und zeigt ein VERTIKALES Pendel. Ein
// data-figref darauf haette dieser Figur eine fremde Nummer vererbt — die
// Nummerierung laeuft in Seitenreihenfolge (numbering.js::numberImages).
//
// TECHNIK: kein eigener Zeichencode. Der portierte Federpendel-Motor
// (src/figures/federpendel/, BACKLOG P12-E6 Stufe 1) zeichnet Szene
// (setupScene/updateScene) UND Diagramm (updateGraph), feature-gated auf den
// Auslenkungs-Aspekt: store.oscillationMode='horizontal', store.graphType='pos_t'.
// Anders als die Kreisbewegungs-Motoren kennt dieser Motor KEINE show*-Flags —
// updateScene() liest die Vektor-Sichtbarkeit direkt von den Checkboxen
// (DOM.togPosition/.togVelocity/.togAcceleration). Gegatet wird daher ueber
// versteckte Checkboxen mit fixem checked-Zustand: Ortsvektor an (er IST die
// Auslenkung x), v und a aus (die gehoeren zu 3.1.2/3.1.9).
//
// VORLAGE (Runbook Schritt 0): aspekt_winkel_zeit.js (Abb. 1.41) — Play/Pause
// mit Auto-Stopp + EIN Graph + Vergleichskurve („letzte Kurve behalten") ist
// exakt dasselbe Interaktionsmuster. Uebernommen: Runtime-/Prefix-Muster,
// Runbar + Tempo-Pills, Ghost-Kurve als DATEN (nicht als Pixel, Fallstrick #19),
// ein Schnappschuss pro Zieh-Geste (#18), t-Ruecksprung bei Parameterwechsel
// (#20), Lupe-Anker in der klebenden Runbar, Hover nur im Overlay.
// Abweichungen von 1.41, bewusst:
//   * Szene UEBER dem Diagramm (Spalte) statt daneben — das horizontale
//     Feder-Masse-System ist ein breites Band (viewBox 600x225, Aspect 2,67),
//     das die Stand-alone-Sim selbst gestapelt setzt (render.js::setupScene
//     entfernt dort layout-side).
//   * FESTES Zeitfenster (T_AUTO) statt einer an T mitskalierenden Achse: nur
//     mit fester t-Achse macht ein m-/k-Zug sichtbar, dass die Schwingung
//     schneller bzw. langsamer wird. Bei mitskalierender Achse saehe jede
//     Parameterwahl gleich aus — der didaktische Zweck der Regler waere weg.
//   * Analyse-Panel wird direkt vom Motor gefuellt (kb_live_*-IDs sitzen in den
//     .analysis-cell), statt von eigenem Label-Code — eine Quelle weniger.
//
// OPTIK: Farben/Klassen der Stand-alone-Sim (Input/Simulationen/
// Project_federpendel_simulation/css/styles.css), auf .aspekt-figur gescopt in
// aspekt_federpendel.css. Die Kapitel-1.4-Vektorpalette in aspekt_kreisbahn.css
// gilt NICHT fuer diese Figur (Kapitel 3 darf eine eigene definieren, s. dort) —
// aspekt_federpendel.css ueberschreibt Ortsvektor-Farbe und --kb-vec-hw.
//
// PER-INSTANZ-ISOLATION: wie alle Aspekt-Figuren ueber createRuntime()
// (federpendel/runtime.js) — eigener Prefix (fp<n>_), eigener storeInstance,
// alle Motor-Aufrufe inside rt.withStore(...).

import { store } from './federpendel/state.js';
import { recomputeDerived, displacement, velocity, acceleration,
         extendMotionData, recalculateAxisLimits } from './federpendel/physics.js';
import { setupScene, updateScene, updateGraph, updateGraphHover,
         updateKennwerte, fmt } from './federpendel/render.js';
import { MASS_MIN, MASS_MAX, K_MIN, K_MAX, POS0_MIN, POS0_MAX,
         INITIAL_MASS_SIZE, MIN_MASS_SIZE } from './federpendel/constants.js';
import { createRuntime } from './federpendel/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

// Festes Zeitfenster des Diagramms (s. Kopfkommentar): bei den Vorgabewerten
// m = 2,0 kg und k = 40 N/m ist T = 2π√(m/k) ≈ 1,40 s, das Fenster zeigt also
// gut fuenf Perioden. Ueber die Reglergrenzen bleibt es zwischen gut einer
// (m = 5,0 kg / k = 5 N/m, T ≈ 6,3 s) und rund sechzehn Perioden.
const T_AUTO = 8;
const M_DEFAULT = 2.0, K_DEFAULT = 40, POS0_DEFAULT = 0.8;
const M_STEP = 0.1, K_STEP = 1, POS0_STEP = 0.05;

// ── Kinematik-Variante (Abb. 1.8): Regler sind Amplitude und Periodendauer ───
// Der Motor rechnet ueber m und k; T ist bei ihm ein Ergebnis. Fuer die
// Kinematik-Sicht wird das umgedreht: die Masse steht fest, die
// Federkonstante folgt aus der eingestellten Periodendauer.
//   T = 2π√(m/k)  ->  k = m·(2π/T)²
// Der so gerechnete k-Wert verlaesst die Reglergrenzen der Stand-alone-Sim
// (K_MIN/K_MAX) — das ist unschaedlich, weil er hier nicht aus einem Regler
// kommt und die m/k-abhaengige Optik in dieser Variante bewusst nicht mitlaeuft
// (s. applyMassAndSpringLook).
// T-Bereich: 0,8…2,5 s. Nach oben begrenzt, weil ein vertikales Federpendel mit
// der Periodendauer zwangslaeufig auch weiter durchhaengt (δL = m·g/k = g(T/2π)²
// — das ist Physik, kein Darstellungsfehler): bei T = 2,5 s sind das schon
// 1,55 m, und der Motor skaliert die Szene dann sichtbar kleiner, damit alles
// ins Bild passt. Bis 2,5 s bleibt dieser Effekt unauffaellig.
const T_MIN = 0.8, T_MAX = 2.5, T_STEP_SLIDER = 0.05, T_DEFAULT_KIN = 1.7;
const M_FIX_KIN = 1.0;                       // kg — fest, s. o.
const Y0_DEFAULT_KIN = 1.0;                  // m — Vorgabe der statischen Abb. 1.8

// Konfiguration einer Figur aus ihrem Platzhalter lesen (s. Kopfkommentar).
function leseKonfig(fig) {
    const reglerT = fig.dataset.regler === 'T';
    return {
        modus: fig.dataset.aufbau === 'vertikal' ? 'vertical' : 'horizontal',
        reglerT,
        kinematik: reglerT,                  // Lesbarkeit an den Verwendungsstellen
        y0: parseFloat(fig.dataset.y0 || (reglerT ? Y0_DEFAULT_KIN : POS0_DEFAULT)),
        T: parseFloat(fig.dataset.periode || T_DEFAULT_KIN),
    };
}

// Strichstaerken-Skalierung der Szene: dieselbe wie --kb-lw in
// aspekt_kreisbahn.css. Die Federstaerke haengt (wie in der Stand-alone-Sim)
// von k ab und wird deshalb per Attribut gesetzt — CSS kann diesen dynamischen
// Wert nicht liefern, also muss der Faktor hier stehen.
const KB_LW = 1.5;

// -- Szene: Aufbau und Reihenfolge (Z-Ordnung!) 1:1 aus der Stand-alone-Sim.
//    Weggelassen sind nur deren hart kodierte Farbattribute (fill="#ccc" usw.) —
//    die ueberschreibt CSS ohnehin, und ohne sie stimmt der Darkmode auch dann,
//    wenn eine Regel einmal fehlt.
//
//    PFEILSPITZEN: die Vektor-Marker MUESSEN markerUnits="userSpaceOnUse" mit
//    fester Groesse tragen. Der Motor kuerzt den Schaft um die KONSTANTE
//    VEC_MARKER_LEN = 12,5 px (constants.js), damit die Spitze exakt auf dem
//    Ziel landet. Mit dem Default (markerUnits="strokeWidth") waere die
//    Markerlaenge 5·Strichstaerke und wuerde mit --kb-lw mitwachsen — die Spitze
//    schoesse dann um den Zuwachs ueber das Ziel hinaus (bekannter Fallstrick).
//    Sichtbar ×1,5 vergroessert wie die Strichstaerken, spitzen-erhaltend via
//    refX = markerWidth' − 12,5  (18,75 − 12,5 = 6,25).
//    Der ACHSEN-Marker bleibt dagegen bei markerUnits="strokeWidth": setupScene()
//    kuerzt die Achsenpfeile nicht, dort skaliert die Spitze korrekt mit der
//    (ebenfalls ×1,5) Strichstaerke mit.
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 125 600 225" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="kb_arrowhead"     markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-pos" markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="kb_arrowhead-vel" markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="kb_arrowhead-acc" markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
  </defs>
  <g id="kb_animation_group">
    <rect id="kb_anchor_object"/>
    <line id="kb_unstretched_length_line" stroke-dasharray="2,2" visibility="hidden"/>
    <text id="kb_unstretched_length_label" text-anchor="middle" class="ref-label"></text>
    <line id="kb_min_pos_line" stroke-dasharray="2,2" visibility="hidden"/>
    <line id="kb_max_pos_line" stroke-dasharray="2,2" visibility="hidden"/>
    <text id="kb_min_pos_label" text-anchor="middle" class="ref-label"></text>
    <text id="kb_max_pos_label" text-anchor="middle" class="ref-label"></text>
    <line id="kb_equilibrium_line" stroke-dasharray="4,4"/>
    <polyline id="kb_spring" fill="none"/>
    <rect id="kb_mass" width="60" height="60"/>
    <line id="kb_position_vector"     marker-end="url(#kb_arrowhead-pos)" visibility="hidden"/>
    <line id="kb_velocity_vector"     marker-end="url(#kb_arrowhead-vel)" visibility="hidden"/>
    <line id="kb_acceleration_vector" marker-end="url(#kb_arrowhead-acc)" visibility="hidden"/>
    <text id="kb_equilibrium_label" text-anchor="middle" class="ref-label eq-label"></text>
    <line id="kb_surface" visibility="hidden"/>

    <line id="kb_x_axis_arrow" marker-end="url(#kb_arrowhead)" visibility="hidden"/>
    <text id="kb_x_axis_label_text" text-anchor="middle" class="aspekt-axis-label" visibility="hidden"></text>
    <line id="kb_y_axis_arrow" marker-end="url(#kb_arrowhead)" visibility="hidden"/>
    <text id="kb_y_axis_label_text" text-anchor="middle" class="aspekt-axis-label" visibility="hidden"></text>

    <!-- Stoppuhr: der Aspekt ist die Auslenkung, nicht die Zeitmessung. Die
         Gruppe bleibt versteckt, muss aber existieren — setupScene() setzt ihr
         transform, updateScene() die Zeigerpositionen (DOM-Vertrag). -->
    <g id="kb_stopwatch" style="display:none">
      <circle id="kb_stopwatch_circle"/><g id="kb_stopwatch_marks"></g>
      <g id="kb_subdial"><circle id="kb_subdial_face"/><g id="kb_subdial_marks"></g><line id="kb_stopwatch_sub_hand"/></g>
      <line id="kb_stopwatch_main_hand"/><g id="kb_digital_display_group"></g>
    </g>
  </g>
</svg>`;

// -- Diagramm-Skelett: 1:1 aus der Stand-alone-Sim (kb_-prefixt). Diese Figur
//    nutzt nur die erste Linie (graphType 'pos_t'); graph_line_b/_c und die
//    zugehoerigen Punkte bleiben leer, muessen aber existieren — updateGraph()
//    dereferenziert sie beim Zuruecksetzen (DOM-Vertrag). kb_graph_prev_line
//    ist figur-eigen (Vergleichskurve), der Motor kennt sie nicht.
const SVG_GRAPH = `
<svg id="kb_graph_svg" viewBox="0 0 700 410" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <defs>
    <marker id="kb_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="kb_grid_group"></g>
  <polyline id="kb_graph_prev_line" fill="none" points="" visibility="hidden"/>
  <polyline id="kb_graph_line" fill="none" stroke-width="2" points=""/>
  <polyline id="kb_graph_line_b" fill="none" stroke-width="2" points="" style="display:none"/>
  <polyline id="kb_graph_line_c" fill="none" stroke-width="2" points="" style="display:none"/>
  <circle id="kb_graph_point" r="4" visibility="hidden"/>
  <circle id="kb_graph_point_b" r="4" visibility="hidden"/>
  <circle id="kb_graph_point_c" r="4" visibility="hidden"/>
  <text id="kb_graph_title" x="350" y="20" text-anchor="middle" class="graph-title-text"></text>
  <line id="kb_graph_hover_line" class="graph-hover-line" visibility="hidden"/>
  <circle id="kb_graph_hover_point" class="graph-hover-point" r="6" visibility="hidden"/>
  <circle id="kb_graph_hover_point_b" class="graph-hover-point" r="6" visibility="hidden"/>
  <circle id="kb_graph_hover_point_c" class="graph-hover-point" r="6" visibility="hidden"/>
  <g id="kb_graph_hover_tooltip" visibility="hidden">
    <rect id="kb_graph_hover_tooltip_bg" class="graph-hover-tooltip-bg"/>
    <text id="kb_graph_hover_tooltip_text" class="graph-hover-tooltip-text"></text>
  </g>
  <rect id="kb_graph_hit_rect" class="graph-hit-rect"/>
</svg>`;

// -- Linkes Bedien-Panel. Die Beschriftung des Auslenkungs-Reglers traegt die
//    Motor-ID kb_pos0_label: setupScene() schreibt sie selbst
//    („Anfangsauslenkung x₀:" bzw. „…y₀:" je Aufbau) — eine Quelle, kein
//    doppelt gepflegter Text.
const panelLeft = (cfg) => `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label" id="kb_pos0_label"></div>
    <div class="slider-row">
      <input id="kb_pos0_slider" type="range" min="${cfg.kinematik ? 0.1 : POS0_MIN}" max="${POS0_MAX}" step="${POS0_STEP}" value="${cfg.y0}">
      <span class="slider-val" id="kb_pos0_value"></span>
    </div>
${cfg.reglerT ? `    <div class="slider-label">Periodendauer \\(T\\)</div>
    <div class="slider-row">
      <input id="kb_T_slider" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP_SLIDER}" value="${cfg.T}">
      <span class="slider-val" id="kb_T_value"></span>
    </div>
    <div class="fp-hinweis">\\(T\\) ist die Zeit für eine vollständige Hin- und Herbewegung. Warum die Masse überhaupt schwingt und wovon \\(T\\) abhängt, kommt später — hier ist \\(T\\) einfach eine Eigenschaft der Bewegung.</div>`
: `    <div class="slider-label">Masse \\(m\\)</div>
    <div class="slider-row">
      <input id="kb_mass_slider" type="range" min="${MASS_MIN}" max="${MASS_MAX}" step="${M_STEP}" value="${M_DEFAULT}">
      <span class="slider-val" id="kb_mass_value"></span>
    </div>
    <div class="slider-label">Federkonstante \\(k\\)</div>
    <div class="slider-row">
      <input id="kb_k_slider" type="range" min="${K_MIN}" max="${K_MAX}" step="${K_STEP}" value="${K_DEFAULT}">
      <span class="slider-val" id="kb_k_value"></span>
    </div>`}
  </div>
  <div class="panel-section">
    <div class="panel-label">Tempo</div>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="kb_speed" value="1.0" checked><span>1×</span></label>
      <label class="speed-pill"><input type="radio" name="kb_speed" value="0.5"><span>½×</span></label>
      <label class="speed-pill"><input type="radio" name="kb_speed" value="0.25"><span>¼×</span></label>
      <label class="speed-pill"><input type="radio" name="kb_speed" value="0.125"><span>⅛×</span></label>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="fp-mass"></div>  <div class="legend-label">Masse</div>
      <div class="legend-swatch" data-c="fp-spring"></div><div class="legend-label">Feder</div>
      <div class="legend-swatch" data-c="fp-x"></div>     <div class="legend-label">Auslenkung \\(${cfg.modus === 'vertical' ? 'y' : 'x'}\\)</div>
      <div class="legend-swatch" data-c="fp-ref"></div>   <div class="legend-label">Ruhelage, Umkehrpunkte</div>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Vergleich</div>
    <label class="aspekt-check"><input type="checkbox" id="kb_keep"><span>Letzte Kurve behalten</span></label>
  </div>
</div>`;

// -- Klebende Ablaufleiste ueber Szene + Diagramm (wie 1.41). kb_time_label ist
//    die Zeitanzeige der Stand-alone-Sim: updateScene() schreibt sie, hier steht
//    sie sichtbar neben den Knoepfen statt als versteckter Stub.
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: automatischen Ablauf abspielen" data-tip="Abspielen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Pause: Ablauf anhalten" data-tip="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/><rect x="13.1" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" data-tip="Auf Anfang zurücksetzen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
  <div class="aspekt-fp-time" id="kb_time_label"></div>
</div>`;

// -- Rechtes Analyse-Panel. Die Wertzellen tragen die Motor-IDs (kb_live_*) —
//    updateScene()/updateKennwerte() fuellen sie direkt, kein eigener
//    Label-Code. Gezeigt werden nur Aspekt-Groessen: t, x sowie die Kennwerte
//    T, ω, f (Abschnitt 3.1.4); v und a bleiben versteckte Stubs.
//    KEINE .formula-box: die Physik-Sektion kommt dynamisch aus dem Kapiteltext
//    (data-eqs -> main.js::fill_physik_panels). Beides zugleich ginge nicht —
//    ein statischer Block gewinnt und data-eqs bliebe wirkungslos.
const panelRight = (cfg) => `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" data-tip="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>              <div class="analysis-cell val" id="kb_live_t"></div>
        <div class="analysis-cell key">Auslenkung \\(${cfg.modus === 'vertical' ? 'y' : 'x'}\\)</div>        <div class="analysis-cell val" id="kb_live_x"></div>
        <div class="analysis-cell key">Periodendauer \\(T\\)</div>     <div class="analysis-cell val" id="kb_live_T"></div>
${cfg.kinematik ? '' : `        <div class="analysis-cell key">Kreisfrequenz \\(\\omega\\)</div><div class="analysis-cell val" id="kb_live_omega"></div>
        <div class="analysis-cell key">Frequenz \\(f\\)</div>          <div class="analysis-cell val" id="kb_live_f"></div>`}
      </div>
    </div>
${cfg.kinematik ? `    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Weg-Zeit-Gesetz der Schwingung</div>
        <div>\\[ y(t) = y_0 \\cdot \\cos\\!\\left(\\frac{2\\pi}{T}\\,t\\right) \\]</div>
        <div class="fp-formel-note">Das ist Formel <a class="xref" data-ref-eq="formel_feder_masse_pendel"></a> des Fließtextes. \\(y_0\\) ist die Auslenkung, mit der die Masse losgelassen wird, \\(T\\) die Dauer einer vollständigen Hin- und Herbewegung — beides die Regler links. Anders als beim Fall und beim Wurf ist diese Kurve <em>keine</em> Parabel: die Bewegung wiederholt sich.</div>
      </div>
    </div>` : ''}
  </div>
</div>`;

// -- Versteckte Stubs: Groessen ausserhalb des Aspekts (v, a, Energien) und die
//    Vektor-Checkboxen, ueber die dieser Motor die Sichtbarkeit gatet (er kennt
//    keine show*-Flags). Ortsvektor an, v/a aus — s. Kopfkommentar.
const hiddenStub = (cfg) => `
<div style="display:none">
  <span id="kb_live_v"></span><span id="kb_live_a"></span>
  <span id="kb_live_ekin"></span><span id="kb_live_epot"></span><span id="kb_live_etot"></span>
  ${cfg.kinematik ? '<span id="kb_live_omega"></span><span id="kb_live_f"></span>' : ''}
  <input type="checkbox" id="kb_toggle_position_vector" checked>
  <input type="checkbox" id="kb_toggle_velocity_vector">
  <input type="checkbox" id="kb_toggle_acceleration_vector">
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js definiert und in main.js
// verdrahtet — diese Figur nutzt sie unveraendert mit (DRY).

// ── Factory: baut EINE Federpendel-Aspekt-Figur mit eigener Motor-Instanz ─────
export function buildFederpendelFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const cfg = leseKonfig(fig);
    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Alle IDs dieser Figur tragen einheitlich den kb_-Platzhalter (auch die
    // figur-eigenen wie kb_keep) -> EIN globaler Replace prefixt das gesamte
    // Skelett. Die Tempo-Radios muessen mitprefixt werden: name="kb_speed"
    // wird zu name="fp<n>_speed", sonst greifen zwei Figuren auf derselben
    // Seite in dieselbe Radio-Gruppe (bekannter Fallstrick).
    scene.innerHTML = (
      `<div class="aspekt-body">${panelLeft(cfg)}` +
      `<div class="aspekt-main">${RUNBAR}` +
      `<div class="aspekt-main-content" id="kb_center_area">` +
      `<div class="aspekt-scene">${SVG_SCENE}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH}</div></div></div>` +
      `${panelRight(cfg)}</div>${hiddenStub(cfg)}`
    ).replace(/kb_/g, p);
    rt.bindDom();

    // Lupe: in der klebenden Ablaufleiste verankert, damit sie beim Scrollen
    // sichtbar bleibt (Begruendung ausfuehrlich in aspekt_winkel_zeit.js).
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.dataset.tip = 'Figur vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption. OHNE „Abb. n:"-Praefix — diese Figur
    // hat bewusst keine Nummer (s. Kopfkommentar); label_aspekt_figuren()
    // ueberspringt sie mangels data-figref.
    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    // -- Mitlaufende Werte in der Bildunterschrift (Kapitel-1.1-Konvention, s.
    //    aspekt_freier_fall.js): Zahl und Einheit als Text im Span, das Symbol
    //    bleibt statisches LaTeX — MathJax setzt die Unterschrift nur einmal.
    const wertSpans = [...(scene.querySelectorAll('.aspekt-caption [data-wert]'))];
    function updateCaptionWerte() {          // inside withStore aufrufen
        if (!wertSpans.length) return;
        const werte = { y0: `${fmt(store.amplitude, 2)}\u00a0m`, T: `${fmt(store.T, 2)}\u00a0s` };
        wertSpans.forEach(el => {
            const v = werte[el.dataset.wert];
            if (v !== undefined) el.textContent = v;
        });
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const sl_pos0 = ge(p + 'pos0_slider'), sl_m = ge(p + 'mass_slider'), sl_k = ge(p + 'k_slider');
    const sl_T = ge(p + 'T_slider');          // nur in der Kinematik-Variante
    const kb_keep = ge(p + 'keep');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let sceneCenters = null;
    let curT = 0;
    let speedFactor = 1.0;
    let keepPrev = false;

    // -- Vergleichskurve (Ghost): die x(t)-Kurve des letzten Parametersatzes
    //    einfrieren und ueber dem neuen Durchlauf stehen lassen. Gespeichert
    //    werden DATEN (t/x), nicht Pixel: die y-Achse skaliert mit der Amplitude
    //    (±|x₀|·1,1), eine in Pixeln eingefrorene Polyline wuerde beim naechsten
    //    Amplitudenwechsel stehenbleiben, waehrend die Achse unter ihr
    //    wegskaliert (Fallstrick #19).
    const prevLine = ge(p + 'graph_prev_line');
    let prevSeries = null;                // {t:[…], x:[…]} — komplette Kurve
    function snapshotPrev() {             // inside withStore aufrufen
        prevSeries = store.tData.length
            ? { t: store.tData.slice(), x: store.xData.slice() }
            : null;
    }
    function clearPrev() {
        prevSeries = null;
        if (!prevLine) return;
        prevLine.setAttribute('points', '');
        prevLine.setAttribute('visibility', 'hidden');
    }
    // Geisterkurve auf die AKTUELLE Achsenskalierung projizieren. store.graphScale
    // liefert das Plot-Rechteck (von updateGraph gesetzt), die Wertgrenzen kommen
    // aus store.axisLimits — zusammen genau die Abbildung, mit der updateGraph()
    // die laufende Kurve zeichnet.
    function renderPrev() {
        if (!prevLine) return;
        const gs = store.graphScale;
        const lim = store.axisLimits[store.graphType];
        if (!prevSeries || !gs || !lim) { prevLine.setAttribute('visibility', 'hidden'); return; }
        const { padL, padT, plotW, plotH, tMax, offset } = gs;
        const valRng = (lim.max - lim.min) || 1;
        let pts = '';
        for (let i = 0; i < prevSeries.t.length; i++) {
            const t = prevSeries.t[i] - offset;
            if (t < 0 || t > tMax) continue;
            const px = padL + (t / (tMax || 1)) * plotW;
            const py = padT + plotH - ((prevSeries.x[i] - lim.min) / valRng) * plotH;
            pts += `${px.toFixed(1)},${py.toFixed(1)} `;
        }
        prevLine.setAttribute('points', pts);
        prevLine.setAttribute('visibility', pts ? 'visible' : 'hidden');
    }

    // -- Zeitreihe auf das feste Fenster T_AUTO begrenzen. precompute() des
    //    Motors nimmt max(4T, 10 s) — hier braucht es eine feste t-Achse (s.
    //    Kopfkommentar), daher eine eigene, schmale Variante aus
    //    extendMotionData + recalculateAxisLimits. Laeuft inside withStore.
    function precomputeRange(duration) {
        store.tData = []; store.xData = []; store.vData = []; store.aData = [];
        store.ekData = []; store.epData = []; store.egesData = [];
        extendMotionData(duration);
        recalculateAxisLimits();
        const lim = store.axisLimits[store.graphType];
        if (!lim) return;
        // Amplitude 0 (Regler in der Mitte): maxAbs = 0 -> entartete Achse.
        // Auf einen kleinen festen Bereich aufspannen, damit die Nulllinie
        // mittig statt am unteren Plotrand liegt.
        if (!(lim.max > lim.min)) { lim.min = -0.1; lim.max = 0.1; }
        // Geisterkurve mit in die y-Achse einrechnen: sonst laeuft die alte
        // Kurve (groessere Amplitude) oben aus dem Diagramm und der Vergleich
        // bricht ab.
        if (prevSeries && prevSeries.x.length) {
            const need = Math.max(...prevSeries.x.map(Math.abs)) * 1.1;
            if (need > lim.max) { lim.max = need; lim.min = -need; }
        }
    }

    // -- Masse-Groesse (∝ m) und Federstaerke (∝ k) wie in der Stand-alone-Sim
    //    (deren ui.js ist nicht Teil des Motor-Ports, s. federpendel/render.js).
    //    Beides ist unmittelbar aspekt-relevant: die Regler m und k werden so
    //    auch in der Szene sichtbar, nicht nur ueber die Schwingungsdauer.
    function applyMassAndSpringLook() {
        // Kinematik-Variante: Masse und Federkonstante kommen dort nicht vor
        // (s. Kopfkommentar). Die Optik bleibt konstant — eine Feder, die beim
        // Ziehen am Periodendauer-Regler sichtbar steifer wird, wuerde einen
        // Mechanismus behaupten, den der Abschnitt gar nicht behandelt.
        if (cfg.kinematik) return;
        const tm = (store.m - MASS_MIN) / (MASS_MAX - MASS_MIN);
        store.currentMassRenderSize = MIN_MASS_SIZE + tm * (INITIAL_MASS_SIZE - MIN_MASS_SIZE);
        const massEl = ge(p + 'mass');
        if (massEl) {
            massEl.setAttribute('width', store.currentMassRenderSize);
            massEl.setAttribute('height', store.currentMassRenderSize);
        }
        const tk = (store.k - K_MIN) / (K_MAX - K_MIN);
        const springEl = ge(p + 'spring');
        if (springEl) springEl.setAttribute('stroke-width', ((2 + tk * 2) * KB_LW).toFixed(2));
    }

    // -- Zeichnen an der aktuellen Zeit (kein Rebuild der Daten). --------------
    function draw(t) {
        curT = t;
        updateScene(t, displacement(t), velocity(t), acceleration(t), sceneCenters);
        updateGraph(t);
        renderPrev();   // nach updateGraph: store.graphScale ist dann aktuell
    }

    // -- Reglerwerte (deutsches Dezimalkomma via fmt aus dem Motor). -----------
    function updateSliderLabels() {
        ge(p + 'pos0_value').textContent = fmt(store.amplitude, 2) + ' m';
        if (sl_m) ge(p + 'mass_value').textContent = fmt(store.m, 1) + ' kg';
        if (sl_k) ge(p + 'k_value').textContent = fmt(store.k, 0) + ' N/m';
        if (sl_T) ge(p + 'T_value').textContent = fmt(store.T, 2) + ' s';
    }

    // -- Rebuild: Parameter aus den Reglern -> Datenreihe neu, Szene neu
    //    skalieren. Alle Motor-Aufrufe inside withStore (Singleton = diese
    //    Instanz). `paramChange` = der Aufruf kommt von einem Regler, der die
    //    KURVENFORM aendert (hier: alle drei): dann springt die Laufzeit auf 0
    //    zurueck und der Ablauf stoppt, damit der neue Verlauf von vorn ueber
    //    dem alten entsteht und wirklich vergleichbar ist (Fallstrick #20).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                oscillationMode: cfg.modus,      // 'vertical' traegt Abb. 1.8 und spaeter 3.1.6
                graphType: 'pos_t',
                isDigitalDisplay: false,
                isManualTiming: false,
                isTimingStarted: false,
                timingOffset: 0,
            });
            store.amplitude = parseFloat(sl_pos0.value);
            if (cfg.reglerT) {
                // Kinematik-Sicht: T ist der Regler, m/k sind nur Rechengroessen
                // des Motors (s. Kopfkommentar).
                store.m = M_FIX_KIN;
                store.k = M_FIX_KIN * Math.pow((2 * Math.PI) / parseFloat(sl_T.value), 2);
            } else {
                store.m = parseFloat(sl_m.value);
                store.k = parseFloat(sl_k.value);
            }
            recomputeDerived();
            precomputeRange(T_AUTO);
            if (curT > T_AUTO) curT = T_AUTO;
            applyMassAndSpringLook();
            sceneCenters = setupScene();
            updateKennwerte();
            draw(curT);
            updateSliderLabels();
            updateCaptionWerte();
        });
    }

    // Genau EIN Schnappschuss pro Zieh-Geste: ein <input type=range> feuert
    // beim Ziehen ein input-Event PRO Zwischenwert. Wuerde bei jedem davon
    // eingefroren, waere die „letzte Kurve" am Ende die des vorletzten
    // Zwischenwerts — praktisch dieselbe wie die neue. Eingefroren wird die
    // Kurve, die VOR dem Ziehen zu sehen war; change (Loslassen) beendet die
    // Geste (Fallstrick #18).
    let paramGesture = false;
    function onInput() {
        if (!paramGesture) {
            paramGesture = true;
            if (keepPrev) rt.withStore(snapshotPrev);
        }
        rebuild(true);
    }
    [sl_pos0, sl_m, sl_k, sl_T].forEach(inp => {
        if (!inp) return;                     // je Variante existiert nur ein Teil
        inp.addEventListener('input', onInput);
        inp.addEventListener('change', () => { paramGesture = false; });
    });

    // -- Automatischer Ablauf (Sim-Zeit 0 … T_AUTO, Slow-Mo via Tempo-Pills,
    //    Auto-Stopp am Ende — kein Umbrechen). Pro Instanz im Closure.
    let playing = false;
    let rafId = null;
    let lastTs = 0;

    function frame(ts) {
        if (!playing) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;     // Echtzeit-Sekunden
        lastTs = ts;
        rt.withStore(() => {
            curT += dt * speedFactor;        // Slow-Mo: Tempo-Pills (1× … ⅛×)
            if (curT >= T_AUTO) curT = T_AUTO;
            draw(curT);
            if (curT >= T_AUTO) stop();
        });
        if (playing) rafId = requestAnimationFrame(frame);
    }
    function start() {
        if (playing) return;
        // Am Ende angelangt -> die gerade fertige Kurve vor dem Reset als Ghost
        // einfrieren (nur bei echtem Neudurchlauf, nicht beim Weiterlaufen aus
        // der Mitte heraus). snapshotPrev() liest store -> auf DIESER Instanz.
        if (keepPrev && isAtAutoStopEnd(curT, T_AUTO)) rt.withStore(snapshotPrev);
        resetOnPlayAfterAutoStop(curT, T_AUTO, reset);
        playing = true;
        lastTs = 0;
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        playing = false;
        if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
        rafId = null;
    }
    function reset() {
        stop();
        rt.withStore(() => { curT = 0; draw(0); });
    }

    fig.querySelectorAll('.aspekt-btn[data-act]').forEach(btn => {
        const act = btn.dataset.act;
        btn.addEventListener('click', () => {
            if (act === 'start') start();
            else if (act === 'stop') stop();
            else if (act === 'reset') reset();
        });
    });
    speedRadios.forEach(r => r.addEventListener('change', () => {
        speedFactor = parseFloat(r.value);
        speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));
    }));
    speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));

    if (kb_keep) kb_keep.addEventListener('change', () => {
        keepPrev = kb_keep.checked;
        // Ghost weg -> die Achsen muessen neu gerechnet werden (precomputeRange
        // hatte die alte Kurve mit eingerechnet), daher rebuild statt nur draw.
        if (!keepPrev) { clearPrev(); rebuild(); }
    });

    rebuild();

    // Beim Oeffnen/Schliessen der Lupe sofort neu zeichnen: so greift der
    // overlay-spezifische Layout-Switch ohne weitere Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => {
        rt.withStore(() => draw(curT));
    });

    // -- Diagramm-Hover (nur in der Lupe) — wie die Stand-alone-Sim: vertikale
    //    Linie + Punkt + Tooltip mit dem Wert an der Mausposition. Bewusst NUR
    //    im Overlay aktiv (der Lese-Modus bleibt ungestoert; das CSS setzt die
    //    Hit-Rects ausserhalb des Overlays auf pointer-events:none). Dieser
    //    Motor hat nur EIN Diagramm -> updateGraphHover(localX) ohne Slot.
    const hit = ge(p + 'graph_hit_rect');
    if (hit) {
        attachGraphHover(hit, {
            onMove: (x) => {
                const inOverlay = fig.classList.contains('aspekt-im-overlay');
                rt.withStore(() => updateGraphHover(inOverlay ? x : null));
            },
            onLeave: () => rt.withStore(() => updateGraphHover(null)),
        });
    }
}
