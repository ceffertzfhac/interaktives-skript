// aspekt_zentripetalkreuz.js — interaktive Aspekt-Figur zu Abbildung 1.58
// (Abschnitt 1.4.8 „Winkelgeschwindigkeit als Vektor", das Kreuzprodukt
// \vec a_ZP = \vec\omega\times\vec v). Die statische Abbildung besteht aus zwei
// Teilbildern: (a) \vec\omega in positiver und (b) in negativer z-Richtung. Bei
// einem Vorzeichenwechsel von \vec\omega kehrt sich die Drehrichtung (und damit
// \vec v) um — \vec a_ZP aber zeigt IMMER zum Kreismittelpunkt und aendert seine
// Richtung NICHT. Genau diese Vorzeichenunabhaengigkeit ist der Aspekt: EIN
// Regler (\omega_0 mit Vorzeichen) deckt beide Teilbilder ab, das |a_ZP|(t)-
// Diagramm daneben zeigt |a_ZP| = R\omega^2 (konstant, unabhaengig vom Vorzeichen
// — die Geisterkurve eines +\omega-Laufs legt sich bei -\omega exakt darueber).
//
// GLEICHER MOTOR wie 1.57/1.59 (kreis_spiral, ISO-3D mit Drehachse). Aufbau,
// Bedienung und Layout sind 1:1 von aspekt_omega_vektor.js (Abb. 1.57) ueber-
// nommen — dieselbe Figur-Familie. Uebernommen wurde die Struktur 1:1; ersetzt
// sind die Szenen-Gates (\vec a_ZP dazu, \vec r default aus — die statische
// Abbildung zeigt nur \vec\omega, \vec v, \vec a_ZP) und die Diagrammgroesse
// (|a_ZP|(t) statt \varphi(t)).
//
// UNTERSCHIED zu 1.57: hier ist \alpha ebenfalls 0 (gleichfoermig), aber die
// Aussage ist die ZENTRIPETALBESCHLEUNIGUNG als Kreuzprodukt \vec a_ZP =
// \vec\omega\times\vec v. Bei \alpha=0 ist die kartesische Beschleunigung
// (ax, ay) rein zentripetal (ax=-R\omega^2 cos\varphi, ay=-R\omega^2 sin\varphi),
// zeigt also immer radial nach innen — ungeachtet des Vorzeichens von \omega_0.
// aDecomp='none' laesst drawVectors genau diesen kartesischen Vektor zeichnen.
//
// PARAMETER: \omega_0 (Anfangs-Winkelgeschwindigkeit, auch 0/negativ), Bereich
// \pm 4,0 rad/s (Nutzervorgabe, breiter als 1.57/1.59 mit \pm 2,0), Schritt 0,05.
//   * Default \omega_0 = 2,0 rad/s (Nutzervorgabe, nicht 0,2 wie 1.57/1.59): \vec a_ZP ist hier
//     MASSSTAEBLICH gezeichnet (reale Laenge ACC_SCALE des Motors, nicht
//     uebertrieben wie in der statischen Abbildung). Bei \omega_0=2,0 (Default,
//     Nutzervorgabe) wird |a_ZP| = R\omega^2 = 6 m/s^2 -> ~90 px, gut lesbar und
//     vergleichbar mit \vec v (|v|=|omega|R=3 m/s -> ~90 px). Wer \vec a_ZP
//     kleiner sehen will, regelt \omega_0 herunter.
//
// ABWEICHUNGEN von der statischen Abbildung, bewusst und begruendet:
//   * \vec a_ZP ist massstäblich (reale Laenge), NICHT uebertrieben wie in der
//     statischen Vorlage (dort „stark uebertrieben ... infinitesimal klein").
//   * Die Drehebene liegt fest in der x-y-Ebene (h = 0) — die Hoehe h ist Thema
//     von Abb. 1.60.
//   * Zusaetzlich zu \vec\omega/\vec v/\vec a_ZP zeigt die Szene den bewegten
//     Massenpunkt und (default) die durchlaufene Bahn; der Ortsvektor \vec r
//     und der Winkel \varphi lassen sich unter „Darstellung" zuschalten (default
//     aus, weil die statische Abbildung sie nicht zeigt). Der bewegte Punkt ist
//     der Gewinn der Interaktion: man sieht \vec v und \vec a_ZP MITDREHEN, waehrend
//     \vec a_ZP stets radial nach innen zeigt.
//
// FARBEN: \vec\omega blau, \vec v orange, \vec a_ZP violett — NICHT frei
// gewaehlt, sondern von der Bildunterschrift der statischen Abbildung vorgegeben
// („Winkelgeschwindigkeit (in Blau)", „Bahngeschwindigkeit (in Orange)",
// „Zentripetalbeschleunigung (in Violett)"). Tokens --kb-omega/--kb-vlat/
// --kb-azp (aspekt_kreisbahn.css) tragen die Werte der LaTeX-Quelle
// (\textcolor[HTML]{1555A2} bzw. {F47A2D} bzw. {8361af}).
//
// PER-INSTANZ-ISOLATION: wie bei allen Aspekt-Figuren holt sich diese Figur
// ueber createRuntime() (kreis_spiral/runtime.js) einen EIGENEN Prefix (ks<n>_)
// samt storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside
// rt.withStore(...). Unabhaengig vom Kreisbewegungs-Motor und von den
// Schwester-Figuren 1.57/1.59.

import { store } from './kreis_spiral/state.js';
import { precompute, interpolateAt } from './kreis_spiral/physics.js';
import { drawBackground, updateScene, updateGraphHover } from './kreis_spiral/render.js';
import { ANIM_CX, ANIM_CY, DEFAULT_PIXELS_PER_METER } from './kreis_spiral/constants.js';
import { createRuntime } from './kreis_spiral/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

const T_AUTO = 12;            // fester Auto-Stopp nach 12 s (Bereich 0…12 s wie
                              // 1.39/1.41/1.44/1.57/1.59). |a_ZP| = R\omega_0^2 ist
                              // konstant — die Linie steht waagerecht; der Lauf
                              // zeigt, wie \vec v und \vec a_ZP mitdrehen.
// \omega_0 darf 0 und negativ sein: \omega_0>0 = Teilbild (a), \omega_0<0 =
// Teilbild (b), \omega_0=0 = Stillstand (|a_ZP|=0). Bereich ±4 und Default 2,0
// sind NUTZERVORGABE (breiter als 1.57/1.59 mit ±2/0,2): \vec a_ZP ist hier
// massstäblich gezeichnet, und bei Default \omega_0=2,0 wird |a_ZP| = R\omega^2
// = 6 m/s^2 -> ~90 px — gut lesbar und vergleichbar mit \vec v (~90 px). An den
// Rändern (\omega_0=±4, R=2) werden die massstäblichen In-plane-Vektoren groß
// (gewollt — der Nutzer stellt sie so ein); das |a_ZP|(t)-Diagramm skaliert
// automatisch mit.
const OMEGA0_MIN = -4.0, OMEGA0_MAX = 4.0, OMEGA0_DEFAULT = 2.0, OMEGA0_STEP = 0.05;
const R_MIN = 0.1, R_MAX = 2.0, R_DEFAULT = 1.5, R_STEP = 0.05;

// -- Laenge des Drehachsen-Vektors \vec\omega (eigener Maßstab) -----------------
// Uebernommen aus 1.57/1.59 (dieselbe Figur-Familie, derselbe Reglerbereich ->
// kapitelweit gleiche \omega-Pfeillaenge). \vec v und \vec a_ZP nutzen die
// echten Laengenskalen des Motors (VEL_SCALE bzw. ACC_SCALE) — keine Overrides.
const DEG = Math.PI / 180;
const OMEGA_LEN_FACTOR_FIG = 0.8 * DEG;    // m je (°/s)
const AXIS_VEC_LEN_CAP = 2.6;              // m (= 195 px bei 75 px/m)

// -- Szene: Skelett der ISO-Ansicht, 1:1 aus der Vorlagen-Sim (index.html),
//    ks_-IDs (pro Instanz geprefixt) — identisch zu 1.57/1.59 (derselbe Motor-
//    DOM-Vertrag, drawBackground/updateScene dereferenzieren alle Stubs).
const SVG_SCENE = `
<svg id="ks_main_svg" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="ks_arrowhead"    markerUnits="userSpaceOnUse" markerWidth="11.25" markerHeight="7.875"  refX="0"    refY="3.9375" orient="auto"><polygon points="0 0, 11.25 3.9375, 0 7.875"/></marker>
    <marker id="ks_arrow-r"      markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="ks_arrow-v"      markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="ks_arrow-a"      markerUnits="userSpaceOnUse" markerWidth="22.5"  markerHeight="15.75"  refX="7.5"  refY="7.875"  orient="auto"><polygon points="0 0, 22.5 7.875, 0 15.75"/></marker>
    <marker id="ks_arrow-omega"  markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="ks_arrow-alpha"  markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="ks_arrow-phi"    markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0, 7 2.5, 0 5"/></marker>
  </defs>

  <g id="ks_animation_group">
    <g id="ks_iso_view_elements" style="visibility:hidden">
      <line id="ks_iso_axis_z" marker-end="url(#ks_arrowhead)"/>
      <line id="ks_iso_axis_x" marker-end="url(#ks_arrowhead)"/>
      <line id="ks_iso_axis_y" marker-end="url(#ks_arrowhead)"/>
      <text id="ks_iso_label_z">z</text>
      <text id="ks_iso_label_x">x</text>
      <text id="ks_iso_label_y">y</text>
      <path id="ks_iso_circle_path" fill-opacity="0.4"/>
    </g>

    <g id="ks_view_2d_elements" style="visibility:hidden">
      <g id="ks_animation_coord_system_2d"></g>
      <circle id="ks_disk" fill-opacity="0.4"/>
    </g>

    <path id="ks_trajectory_path" d="" fill="none"/>

    <g id="ks_phi_arc_group" style="visibility:hidden">
      <path id="ks_phi_arc" fill="none" marker-end="url(#ks_arrow-phi)"/>
      <text id="ks_phi_label">φ</text>
    </g>

    <!-- Komponenten-Vektoren: in dieser Figur unbenutzt (keine Zerlegung),
         als Stubs vorhanden — drawVectors() verbirgt/setzt sie. -->
    <g id="ks_vector_components_group">
      <line id="ks_position_vector_x" fill="none"/>
      <line id="ks_position_vector_y" fill="none"/>
      <line id="ks_velocity_vector_x" fill="none"/>
      <line id="ks_velocity_vector_y" fill="none"/>
      <line id="ks_velocity_vector_r" fill="none" marker-end="url(#ks_arrow-v)"/>
      <line id="ks_velocity_vector_t" fill="none" marker-end="url(#ks_arrow-v)"/>
      <line id="ks_acceleration_vector_x" fill="none"/>
      <line id="ks_acceleration_vector_y" fill="none"/>
      <line id="ks_acceleration_vector_r" fill="none" marker-end="url(#ks_arrow-a)"/>
      <line id="ks_acceleration_vector_t" fill="none" marker-end="url(#ks_arrow-a)"/>
    </g>

    <line id="ks_position_vector"     marker-end="url(#ks_arrow-r)"/>
    <line id="ks_velocity_vector"     marker-end="url(#ks_arrow-v)"/>
    <line id="ks_acceleration_vector" marker-end="url(#ks_arrow-a)"/>
    <!-- \vec\omega auf der z-Achse. \vec\alpha entfaellt (\alpha=0 fix). -->
    <line id="ks_omega_vector" marker-end="url(#ks_arrow-omega)"/>
    <line id="ks_alpha_vector" marker-end="url(#ks_arrow-alpha)"/>
    <circle id="ks_point" r="8"/>

    <text id="ks_zoom_text_display" x="12" y="20" visibility="hidden"></text>
    <text id="ks_time_display" x="12" y="470" class="aspekt-time-text"></text>

    <g id="ks_stopwatch" style="display:none">
      <circle id="ks_stopwatch_circle"/><g id="ks_stopwatch_marks"></g>
      <circle id="ks_stopwatch_subdial_face"/><g id="ks_stopwatch_subdial_marks"></g>
      <line id="ks_stopwatch_sub_hand"/><line id="ks_stopwatch_main_hand"/>
    </g>
  </g>
</svg>`;

// -- Graph-Skelett: Einzel-Modus (diagramMode='1', graphType1='ar'); Aufbau wie
//    1.57/1.59. |a_ZP|(t) = R\omega_0^2 ist konstant -> waagerechte Linie.
const SVG_GRAPH = `
<svg id="ks_graph_svg" viewBox="0 0 700 410" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <g id="ks_graph_group_1" transform="translate(0,0)"></g>
  <g id="ks_graph_group_2" transform="translate(0,215)" style="visibility:hidden"></g>
  <g id="ks_graph_prev_group" transform="translate(0,0)">
    <polyline id="ks_graph_prev_line" points="" visibility="hidden"/>
  </g>
  <g id="ks_graph_hover_group_1" transform="translate(0,0)">
    <line id="ks_graph_hover_line_1" class="graph-hover-line" visibility="hidden"/>
    <circle id="ks_graph_hover_point_1" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="ks_graph_hover_tooltip_1" visibility="hidden">
      <rect id="ks_graph_hover_tooltip_bg_1" class="graph-hover-tooltip-bg"/>
      <text id="ks_graph_hover_tooltip_text_1" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="ks_graph_hit_rect_1" class="graph-hit-rect"/>
  </g>
  <g id="ks_graph_hover_group_2" transform="translate(0,215)" style="visibility:hidden">
    <line id="ks_graph_hover_line_2" class="graph-hover-line" visibility="hidden"/>
    <circle id="ks_graph_hover_point_2" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="ks_graph_hover_tooltip_2" visibility="hidden">
      <rect id="ks_graph_hover_tooltip_bg_2" class="graph-hover-tooltip-bg"/>
      <text id="ks_graph_hover_tooltip_text_2" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="ks_graph_hit_rect_2" class="graph-hit-rect"/>
  </g>
</svg>`;

// -- Linkes Bedien-Panel — Abschnitte einklappbar (Muster wie 1.50/1.51/1.57). --
const CHEVRON = '<span class="acc-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></span>';
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section collapsible">
    <button type="button" class="panel-label" aria-expanded="true">Parameter${CHEVRON}</button>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="0" max="${T_AUTO}" step="0.05" value="${T_AUTO}">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
    <div class="slider-label">Radius \\(R\\)</div>
    <div class="slider-row">
      <input id="ak_r" type="range" min="${R_MIN}" max="${R_MAX}" step="${R_STEP}" value="${R_DEFAULT}">
      <span class="slider-val" id="ak_r_out"></span>
    </div>
    <div class="slider-label">Winkelgeschwindigkeit \\(\\omega_0\\)</div>
    <div class="slider-row">
      <input id="ak_omega0" type="range" min="${OMEGA0_MIN}" max="${OMEGA0_MAX}" step="${OMEGA0_STEP}" value="${OMEGA0_DEFAULT}">
      <span class="slider-val" id="ak_omega0_out"></span>
    </div>
    <div class="aspekt-hint" id="ak_dir_hint"></div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Tempo${CHEVRON}</button>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="ak_speed" value="1.0" checked><span>1×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.5"><span>½×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.25"><span>¼×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.125"><span>⅛×</span></label>
    </div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Darstellung${CHEVRON}</button>
    <label class="aspekt-check"><input type="checkbox" id="ak_pos"><span>Ortsvektor \\(\\vec r\\) einblenden</span></label>
    <label class="aspekt-check"><input type="checkbox" id="ak_traj" checked><span>durchlaufene Bahn einblenden</span></label>
    <div class="aspekt-hint">\\(\\vec a_\\text{ZP}=\\vec\\omega\\times\\vec v\\) (Rechte-Hand-Regel): \\(\\vec\\omega\\) auf der Drehachse, \\(\\vec v\\) tangential -> \\(\\vec a_\\text{ZP}\\) radial nach innen (zum Mittelpunkt). Ein Vorzeichenwechsel von \\(\\omega_0\\) kehrt \\(\\vec v\\) um — \\(\\vec a_\\text{ZP}\\) aber zeigt IMMER nach innen: \\(|\\vec a_\\text{ZP}|=\\omega_0^2 R\\) hängt nur von \\(\\omega_0^2\\) ab, nicht vom Vorzeichen. \\(\\vec a_\\text{ZP}\\) ist maßstäblich gezeichnet (reale Länge, nicht übertrieben wie in der statischen Vorlage).</div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Legende${CHEVRON}</button>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="omega"></div><div class="legend-label">Winkelgeschw. \\(\\vec\\omega\\) (Drehachse)</div>
      <div class="legend-swatch" data-c="vlat"></div><div class="legend-label">Bahngeschw. \\(\\vec v\\)</div>
      <div class="legend-swatch" data-c="azp"></div> <div class="legend-label">Zentripetalbeschl. \\(\\vec a_\\text{ZP}=\\vec\\omega\\times\\vec v\\)</div>
      <div class="legend-swatch" data-c="rlat"></div><div class="legend-label">Ortsvektor \\(\\vec{r}\\) (optional)</div>
      <div class="legend-swatch" data-c="traj"></div><div class="legend-label">durchlaufene Bahn</div>
    </div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Vergleich${CHEVRON}</button>
    <label class="aspekt-check"><input type="checkbox" id="ak_keep"><span>Letzte Kurve behalten</span></label>
  </div>
</div>`;

// -- Klebende Ablaufleiste oberhalb von Szene + Diagramm (wie 1.44/1.51/1.57). --
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: automatischen Ablauf abspielen" title="Start"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Stop: Ablauf anhalten" title="Stop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" title="Reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
</div>`;

// -- Rechtes Analyse-Panel (breit + Lupe). Physik-Sektion als statischer
//    .formula-box-Block (kein data-eqs), UNNUMMERIERT als \[...\]. ------------
const PANEL_RIGHT = `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" title="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>                       <div class="analysis-cell val" id="ak_val_t"></div>
        <div class="analysis-cell key">Zentripetalbeschl. \\(|\\vec a_\\text{ZP}|=\\omega^2 R\\)</div> <div class="analysis-cell val" id="ak_val_azp"></div>
        <div class="analysis-cell key">Radius \\(R\\)</div>                     <div class="analysis-cell val" id="ak_val_r"></div>
        <div class="analysis-cell key">Winkelgeschw. \\(\\omega\\)</div>        <div class="analysis-cell val" id="ak_val_omega"></div>
        <div class="analysis-cell key">Drehrichtung</div>                      <div class="analysis-cell val" id="ak_val_dir"></div>
        <div class="analysis-cell key">Bahngeschw. \\(|\\vec v|=|\\omega|R\\)</div> <div class="analysis-cell val" id="ak_val_v"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Zentripetalbeschleunigung als Kreuzprodukt:</div>
        <div>\\[\\vec a_\\text{ZP}(t) = \\vec\\omega(t) \\times \\vec v(t)\\]</div>
        <div>\\[|\\vec a_\\text{ZP}(t)| = |\\vec\\omega|\\,|\\vec v|\\sin 90^\\circ = \\omega_0^2 R = \\frac{|\\vec v|^2}{R}\\]</div>
        <div class="formula-box-cap">Ein Vorzeichenwechsel von \\(\\omega_0\\) kehrt \\(\\vec v\\) um, aber \\(\\vec a_\\text{ZP}\\) zeigt stets radial nach innen — \\(|\\vec a_\\text{ZP}|\\) hängt nur von \\(\\omega_0^2\\) ab, nicht vom Vorzeichen.</div>
      </div>
    </div>
  </div>
</div>`;

// Versteckte Stubs, die der Motor beschreibt (Live-Panel der Vorlagen-Sim +
// deren HTML-Zeitanzeige). Die sichtbare Zeit steht als SVG-Text in der Szene.
const LIVE_STUB = `
<div style="display:none">
  <span id="ks_time_label"></span>
  <span id="ks_live_x"></span><span id="ks_live_y"></span>
  <span id="ks_live_vx"></span><span id="ks_live_vy"></span>
  <span id="ks_live_ax"></span><span id="ks_live_ay"></span>
  <span id="ks_live_phi"></span><span id="ks_live_omega"></span><span id="ks_live_alpha"></span>
  <span id="ks_live_ar"></span><span id="ks_live_at"></span>
  <span id="ks_live_vabs"></span><span id="ks_live_aabs"></span>
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js definiert und in main.js
// verdrahtet — diese Figur nutzt sie unveraendert mit (DRY).

// ── Factory: baut EINE zentripetalkreuz-Aspekt-Figur mit eigener Instanz ──────
export function buildZentripetalkreuzFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    scene.innerHTML =
      `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`).replace(/name="ak_speed"/g, `name="${p}speed"`)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_SCENE.replace(/ks_/g, p)}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH.replace(/ks_/g, p)}</div></div></div>` +
      `${PANEL_RIGHT.replace(/id="ak_/g, `id="${p}ak_`)}</div>${LIVE_STUB.replace(/ks_/g, p)}`;
    rt.bindDom();

    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    scene.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = btn.parentElement;
            const open = !sec.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', String(open));
        });
    });

    // Per-Instanz-Regler + Zustand. Kein \alpha-Regler (\alpha=0 fix).
    const ak_t = ge(p + 'ak_t'), ak_r = ge(p + 'ak_r');
    const ak_omega0 = ge(p + 'ak_omega0');
    const ak_pos = ge(p + 'ak_pos'), ak_traj = ge(p + 'ak_traj');
    const ak_keep = ge(p + 'ak_keep');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let curT = T_AUTO;
    let speedFactor = 1.0;
    let keepPrev = false;

    const n = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';

    // -- Vergleichskurve (Geisterzug): |a_ZP|(t) des letzten Parametersatzes
    //    einfrieren. |a_ZP| = R\omega_0^2 ist konstant und haengt nur von
    //    \omega_0^2 ab — bei einem Vorzeichenwechsel von \omega_0 legt sich die
    //    Geisterkurve EXAKT auf die aktuelle (gleicher |\omega_0| => gleiches
    //    R\omega_0^2): die Kernaussage der Abbildung sichtbar gemacht.
    //    Gespeichert werden DATEN (t, ar in m/s^2 — die Rohreihe p_ar), NICHT
    //    Pixel; re-projiziert auf store.graphScale[1] (Fallstricke #18/#19).
    const prevLine = ge(p + 'graph_prev_line');
    let prevSeries = null;                // {t:[…], ar:[…]}
    function snapshotPrev() {             // inside withStore aufrufen
        const fd = store.fullData;
        prevSeries = (fd && fd.t && fd.t.length)
            ? { t: fd.t.slice(), ar: fd.p_ar.slice() }
            : null;
    }
    function clearPrev() {
        prevSeries = null;
        if (!prevLine) return;
        prevLine.setAttribute('points', '');
        prevLine.setAttribute('visibility', 'hidden');
    }
    function renderPrev() {               // inside withStore aufrufen
        if (!prevLine) return;
        const gs = store.graphScale[1];
        if (!prevSeries || !gs) { prevLine.setAttribute('visibility', 'hidden'); return; }
        const { cf, tMaxAxis, valMin, valMax, plotL, plotT, plotW, plotH } = gs;
        const tR = tMaxAxis || 1, yR = (valMax - valMin) || 1;
        let pts = '';
        for (let i = 0; i < prevSeries.t.length; i++) {
            const t = prevSeries.t[i];
            if (t > tMaxAxis) break;
            const px = plotL + (t / tR) * plotW;
            // ar ist kein Winkel -> cf=1 (der Motor setzt cf fuer 'ar' auf 1).
            const py = plotT + plotH - ((prevSeries.ar[i] * cf - valMin) / yR) * plotH;
            pts += `${px.toFixed(1)},${py.toFixed(1)} `;
        }
        prevLine.setAttribute('points', pts);
        prevLine.setAttribute('visibility', pts ? 'visible' : 'hidden');
    }

    // -- Zeichnen an der aktuellen Zeit. --------------------------------------
    function draw(t) {
        curT = t;
        // simulatedTime-Sync (Fallstrick #23): diese Figur fuehrt die Zeit selbst.
        store.simulatedTime = t;
        updateScene(t);
        renderPrev();        // nach updateScene: store.graphScale[1] ist aktuell
    }

    // -- Regler-/Analyse-Beschriftungen (deutsches Dezimalkomma). Laeuft inside
    //    withStore (liest store/fullData).
    function updateLabels(t) {
        const omega0 = store.omega0_rad;
        const azp = store.R0 * omega0 * omega0;   // |a_ZP| = R·ω₀²
        ge(p + 'ak_t_out').textContent = n(t, 2) + ' s';
        ge(p + 'ak_r_out').textContent = n(store.R0, 2) + ' m';
        ge(p + 'ak_omega0_out').textContent = n(omega0, 2) + ' rad/s';
        const td = ge(p + 'time_display');
        if (td) td.textContent = `t = ${n(t, 2)} s`;

        // Drehrichtung — Vorzeichen von \omega_0. Unabhaengig davon zeigt
        // \vec a_ZP immer nach innen (Kern der Abbildung).
        const dir = Math.abs(omega0) < 1e-9
            ? '— (Stillstand)'
            : (omega0 > 0 ? 'gegen den Uhrzeigersinn' : 'im Uhrzeigersinn');
        const hint = ge(p + 'ak_dir_hint');
        if (hint) {
            hint.textContent = Math.abs(omega0) < 1e-9
                ? 'ω₀ = 0: Stillstand, |a_ZP| = 0.'
                : (omega0 > 0
                    ? 'ω₀ > 0: Bewegung gegen den Uhrzeigersinn (Teilbild a).'
                    : 'ω₀ < 0: Bewegung im Uhrzeigersinn (Teilbild b).');
        }

        const vt = ge(p + 'ak_val_t');
        if (vt) {
            vt.textContent = n(t, 2) + ' s';
            ge(p + 'ak_val_azp').textContent = n(azp, 2) + ' m/s²';
            ge(p + 'ak_val_r').textContent = n(store.R0, 2) + ' m';
            ge(p + 'ak_val_omega').textContent = n(omega0, 3) + ' rad/s';
            ge(p + 'ak_val_dir').textContent = dir;
            ge(p + 'ak_val_v').textContent = n(Math.abs(omega0) * store.R0, 2) + ' m/s';
        }
    }

    // -- Rebuild: Parameter geaendert -> Gates + Parameter, Datenreihe neu,
    //    Hintergrund neu. `paramChange` = kurvenformender Regler (\omega_0, R):
    //    dann Geisterzug einfrieren + Laufzeit auf 0 (Fallstrick #20).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                currentView: 'ISO', motionMode: 'kreis', angleUnit: 'rad',
                h: 0, vr: 0, phi0_rad: 0,
                // \alpha fix 0 — gleichfoermige Kreisbewegung (kein \alpha-Regler)
                alpha_rad: 0,
                // Diagramm: EIN Slot, |a_ZP|(t) = R·ω²
                diagramMode: '1', graphType1: 'ar',
                // Sichtbarkeiten: \omega + \vec v + \vec a_ZP immer; \vec r default
                // aus (statische Abb. zeigt kein r), Bahn default an (Kontext).
                togOmega: true, togAlpha: false,
                togVelocity: true, togAcceleration: true,
                togPosition: !ak_pos || ak_pos.checked,
                togTrajectory: !ak_traj || ak_traj.checked,
                togPhi: false,
                // kartesische Beschleunigung = rein zentripetal bei α=0 (ax, ay)
                rDecomp: 'none', vDecomp: 'none', aDecomp: 'none', scaleAt: false,
                stopwatchVisible: false,
                isAutoStopping: false,
                simDuration: T_AUTO,
                omegaLenFactor: OMEGA_LEN_FACTOR_FIG,
                axisVecLenCap: AXIS_VEC_LEN_CAP,
            });
            store.R0 = parseFloat(ak_r.value);
            store.omega0_rad = parseFloat(ak_omega0.value);
            store.currentPixelsPerMeter = Math.min(
                DEFAULT_PIXELS_PER_METER,
                (Math.min(ANIM_CX, ANIM_CY) * 0.9) / (store.R0 || 1));
            store.zoomFactor = store.currentPixelsPerMeter / DEFAULT_PIXELS_PER_METER;

            precompute();
            if (curT > T_AUTO) curT = T_AUTO;
            ak_t.max = String(T_AUTO);
            ak_t.value = curT.toFixed(3);
            drawBackground();
            draw(curT);
            updateLabels(curT);
        });
    }

    // -- Regler ---------------------------------------------------------------
    let paramGesture = false;
    function onInput(e) {
        if (e.target === ak_t) {
            const t = parseFloat(ak_t.value);
            rt.withStore(() => { draw(t); updateLabels(t); });
            return;
        }
        if (!paramGesture) {
            paramGesture = true;
            if (keepPrev) rt.withStore(snapshotPrev);
        }
        rebuild(true);
    }
    [ak_t, ak_r, ak_omega0].forEach(inp => inp.addEventListener('input', onInput));
    [ak_r, ak_omega0].forEach(inp => inp.addEventListener('change', () => { paramGesture = false; }));

    // Darstellungs-Kaesten: nur Sichtbarkeiten -> kein paramChange.
    [ak_pos, ak_traj].forEach(cb => {
        if (cb) cb.addEventListener('change', () => rebuild(false));
    });

    if (ak_keep) ak_keep.addEventListener('change', () => {
        keepPrev = ak_keep.checked;
        if (!keepPrev) clearPrev();
    });

    // -- Automatischer Ablauf (Sim-Zeit 0 … T_AUTO, Slow-Mo, Auto-Stopp). ------
    let playing = false;
    let rafId = null;
    let lastTs = 0;

    function frame(ts) {
        if (!playing) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        rt.withStore(() => {
            curT += dt * speedFactor;
            if (curT >= T_AUTO) curT = T_AUTO;
            ak_t.value = curT.toFixed(3);
            draw(curT);
            updateLabels(curT);
            if (curT >= T_AUTO) stop();
        });
        if (playing) rafId = requestAnimationFrame(frame);
    }
    function start() {
        if (playing) return;
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
        rt.withStore(() => {
            curT = 0;
            ak_t.value = '0';
            draw(0);
            updateLabels(0);
        });
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

    rebuild();

    fig.addEventListener('aspekt-overlay-toggled', () => {
        rt.withStore(() => { draw(curT); updateLabels(curT); });
    });

    // -- Graph-Hover (nur in der Lupe), Slot 1. --------------------------------
    const hit = ge(p + 'graph_hit_rect_1');
    if (hit) {
        attachGraphHover(hit, {
            onMove: (x) => {
                if (!fig.classList.contains('aspekt-im-overlay')) {
                    rt.withStore(() => updateGraphHover(1, null));
                    return;
                }
                rt.withStore(() => updateGraphHover(1, x));
            },
            onLeave: () => rt.withStore(() => updateGraphHover(1, null)),
        });
    }
}