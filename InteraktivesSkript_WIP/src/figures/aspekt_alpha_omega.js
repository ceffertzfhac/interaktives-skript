// aspekt_alpha_omega.js — interaktive Aspekt-Figur zu Abbildung 1.59 (Abschnitt
// 1.4.9 „Die Winkelbeschleunigung als Vektor"). Die statische Abbildung besteht
// aus zwei Teilbildern: (a) Winkelbeschleunigung \vec\alpha in POSITIVER
// z-Richtung (parallel zu \vec\omega -> |\omega| nimmt zu) und (b) in NEGATIVER
// z-Richtung (antiparallel -> |\omega| nimmt ab). Genau dieser Gegensatz ist der
// Aspekt: EIN Regler (\alpha mit Vorzeichen) fasst beide Teilbilder zusammen,
// das \omega(t)-Diagramm daneben zeigt die Folge (steigende bzw. fallende
// Gerade, bei antiparallelem \alpha inklusive Nulldurchgang und anschliessender
// Drehrichtungsumkehr).
//
// NEUER MOTOR (erste Figur, die ihn nutzt): 1.59 braucht eine 3D-Ansicht, denn
// \omega und \alpha liegen auf der DREHACHSE (z) — in der reinen Draufsicht des
// Kreisbewegungs-Motors (src/figures/kreisbewegung/, alle bisherigen Aspekt-
// Figuren) waeren sie Punkte. Deshalb wurde die Schwester-Sim
// Input/Simulationen/Project_kreis_spiralbewegung_simulation als ZWEITER Motor
// portiert (src/figures/kreis_spiral/): sie bringt die ISO-Projektion
// (projectISO), die \omega-/\alpha-Vektoren auf der z-Achse, die Hoehe h der
// Drehebene und die Winkelbeschleunigung nativ in der Physik mit. Kein eigener
// Zeichencode fuer die Szene -> Optik = Vorlagen-Sim (Regel 0a der Skill:
// kopieren + feature-gaten, nie neu schreiben).
//
// VORLAGE fuer Aufbau, Bedienung und Layout ist aspekt_omega_zeit.js (Abb. 1.44)
// — dasselbe Interaktionsmuster (Szene NEBEN einem einzelnen Diagramm, Zeit-
// Regler + Start/Stop/Reset + Tempo-Pills + „Letzte Kurve behalten", Lupe,
// Analyse-Panel). Uebernommen wurde die Struktur 1:1; ersetzt sind nur die
// Motor-Aufrufe (kreis_spiral statt kreisbewegung), die Regler (\omega_0 und
// \alpha statt T) und die Szenen-Gates (ISO-Ansicht, \omega-/\alpha-Vektor).
// Der Winkelbogen wird hier NICHT selbst gezeichnet (anders als 1.41/1.44):
// dieser Motor zeichnet den \varphi-Bogen in der ISO-Ebene selbst (drawPhiArc),
// und ein eigener 2D-Bogen wuerde perspektivisch falsch liegen.
//
// PARAMETER: \omega_0 (Anfangs-Winkelgeschwindigkeit, auch 0/negativ) und \alpha
// (auch 0/negativ) mit denselben Bereichen wie 1.50/1.51 (rad/s bzw. rad/s^2),
// damit die Regler kapitelweit gleich „schmecken". \alpha > 0 = Teilbild (a),
// \alpha < 0 = Teilbild (b), \alpha = 0 = Grenzfall gleichfoermige Kreisbewegung
// (\omega konstant, waagerechte Linie wie in Abb. 1.44).
//
// ABWEICHUNGEN von der statischen Abbildung, bewusst und begruendet:
//   * Die Drehebene liegt fest in der x-y-Ebene (h = 0). Die Hoehe h ist das
//     Thema der NAECHSTEN Abbildung (1.60, „hoeheiso"); ein h-Regler hier wuerde
//     zwei Aspekte in eine Figur mischen. Der Motor kann h, das Gate steht auf 0.
//   * Zusaetzlich zu \omega/\alpha zeigt die Szene den Ortsvektor \vec r, den
//     durchlaufenen Bogen und den Winkel \varphi (abschaltbar). Die statische
//     Abbildung zeigt nur \omega und \alpha; ohne bewegten Punkt waere aber nicht
//     zu sehen, DASS die Drehung schneller bzw. langsamer wird — der bewegte
//     Punkt ist hier der eigentliche Gewinn der Interaktion.
//   * \vec v und \vec a werden NICHT gezeigt: sie gehoeren zu 1.42–1.51 und
//     wuerden die Farbpalette dieser Figur kollidieren lassen (s. --kb-omega/
//     --kb-alpha in aspekt_kreisbahn.css).
//
// FARBEN: \omega blau, \alpha rot — NICHT frei gewaehlt, sondern von der
// Bildunterschrift der statischen Abbildung vorgegeben („Winkelbeschleunigung
// (in Rot) … Winkelgeschwindigkeit (in Blau)"), die diese Figur uebernimmt.
// Tokens --kb-omega/--kb-alpha (aspekt_kreisbahn.css) tragen die Werte der
// LaTeX-Quelle.
//
// PER-INSTANZ-ISOLATION: wie bei allen Aspekt-Figuren holt sich diese Figur
// ueber createRuntime() (kreis_spiral/runtime.js) einen EIGENEN Prefix (ks<n>_)
// samt storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside
// rt.withStore(...). Der zweite Motor hat seinen eigenen, unabhaengigen
// Singleton — die Figuren des Kreisbewegungs-Motors bleiben unberuehrt.

import { store } from './kreis_spiral/state.js';
import { precompute, interpolateAt } from './kreis_spiral/physics.js';
import { drawBackground, updateScene, updateGraphHover } from './kreis_spiral/render.js';
import { ANIM_CX, ANIM_CY, DEFAULT_PIXELS_PER_METER } from './kreis_spiral/constants.js';
import { createRuntime } from './kreis_spiral/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

const T_AUTO = 12;            // fester Auto-Stopp nach 12 s (Bereich 0…12 s wie
                              // 1.39/1.41/1.44). Mit den Defaults unten waechst
                              // omega dabei von 1,0 auf 2,8 rad/s (fast das
                              // Dreifache) — deutlich sichtbar, ohne dass der
                              // omega-Pfeil aus der Zeichenflaeche laeuft.
// Bereiche wie in 1.50/1.51 (kapitelweit gleiche Regler-Anmutung).
// omega_0 darf 0 und negativ sein (Drehsinn kehrt sich um, \vec\omega zeigt dann
// in −z); alpha darf ± sein: alpha>0 = Teilbild (a) parallel, alpha<0 =
// Teilbild (b) antiparallel, alpha=0 = gleichfoermig (Grenzfall Abb. 1.44).
const OMEGA0_MIN = -2.0, OMEGA0_MAX = 2.0, OMEGA0_DEFAULT = 1.0, OMEGA0_STEP = 0.05;
const ALPHA_MIN = -0.3, ALPHA_MAX = 0.3, ALPHA_DEFAULT = 0.15, ALPHA_STEP = 0.01;
// Radius-Bereich der Vorlagen-Sim (radius_slider: 0,1 … 2,0 m), Schrittweite wie
// in den anderen Aspekt-Figuren (0,05 statt 0,1 — feineres Ziehen).
const R_MIN = 0.1, R_MAX = 2.0, R_DEFAULT = 1.5, R_STEP = 0.05;

// -- Laenge der Drehachsen-Vektoren (eigener Maßstab je Groesse) ---------------
// \vec\omega [rad/s] und \vec\alpha [rad/s^2] haben VERSCHIEDENE Einheiten — ein
// gemeinsamer Maßstab existiert physikalisch nicht, ihr Laengen-VERHAELTNIS ist
// also ohnehin Konvention (wie in der statischen Abbildung, die beide Pfeile
// aehnlich lang zeichnet). Mit den Faktoren der Vorlagen-Sim (0,02 bzw. 0,04 m
// je Grad-Einheit) waere \vec\alpha in den Regler-Bereichen dieser Figur ~11x
// kuerzer als \vec\omega (bei alpha = 0,1 rad/s^2 nur ~17 px) — die Aussage
// „parallel/antiparallel" waere nicht mehr lesbar. Daher eigene, LINEARE
// Maßstaebe (kein log, keine Saettigung): jede Groesse proportional zu ihrem
// Wert, doppeltes alpha = doppelter Pfeil.
//   omega: 0,8 m je rad/s   -> Default 1,0 rad/s = 60 px, Lauf-Ende 2,8 rad/s = 168 px
//   alpha: 4,0 m je rad/s^2 -> Default 0,15 rad/s^2 = 45 px, Maximum 0,3 = 90 px
// Der Motor rechnet die Faktoren auf Grad-Einheiten (L[m] = Wert[°]·Faktor),
// daher die Umrechnung ·pi/180. Die Kappe (in m) verhindert, dass ein grosser
// omega-Pfeil bei extremen Reglerwerten (|omega| bis 5,6 rad/s) aus der
// Zeichenflaeche laeuft; sie greift erst jenseits von 3,25 rad/s.
const DEG = Math.PI / 180;
const OMEGA_LEN_FACTOR_FIG = 0.8 * DEG;    // m je (°/s)
const ALPHA_LEN_FACTOR_FIG = 4.0 * DEG;    // m je (°/s²)
const AXIS_VEC_LEN_CAP = 2.6;              // m (= 195 px bei 75 px/m)

// -- Szene: Skelett der ISO-Ansicht, 1:1 aus der Vorlagen-Sim (index.html),
//    ks_-IDs (pro Instanz geprefixt). Enthaelt AUCH die 2D-Elemente und die
//    Stoppuhr-Stubs: drawBackground()/updateScene() fassen sie an (Sichtbarkeit,
//    innerHTML, Zeiger-Endpunkte) und wuerden sonst null-dereferenzieren
//    (Schritt 1 der Skill, dom_vertrag.mjs).
//
//    PFEILSPITZEN: Die Vorlage verkuerzt jeden Vektorschaft um die Marker-Laenge
//    (ARROW_LEN = 5·strokeWidth der Vorlage: 12,5 px fuer Hauptvektoren, 15 fuer
//    die Beschleunigung, 10 fuer Polar-Komponenten), damit eine refX=0-Spitze
//    exakt auf dem Zielpunkt sitzt. Da die Aspekt-Figuren die Strichstaerken per
//    --kb-lw ×1,5 skalieren, wuerde eine in strokeWidth-Einheiten definierte
//    Spitze mitwachsen (5·3,75 = 18,75) und ueber das Ziel hinausschiessen.
//    Daher — wie in allen Aspekt-Figuren — markerUnits="userSpaceOnUse" mit
//    FESTER Groesse: Spitze ×1,5 vergroessert (schoener sichtbar), aber
//    spitzen-erhaltend via refX = markerWidth' − ARROW_LEN
//    (18,75 − 12,5 = 6,25 fuer die Hauptvektoren; 22,5 − 15 = 7,5 fuer a;
//    15 − 10 = 5 fuer die Polar-Komponenten).
//    Die Achsen-Spitze (ks_arrowhead) und die \varphi-Bogen-Spitze (arrow-phi)
//    werden NICHT verkuerzt (refX=0 bzw. refX=markerWidth) und bleiben deshalb
//    bei den Groessen der Vorlage, ×1,5 skaliert.
const SVG_SCENE = `
<svg id="ks_main_svg" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <!-- ks_arrowhead wird AUCH vom Diagramm-SVG referenziert (render.js nutzt
         fuer Szenen- und Diagramm-Achsen dieselbe Marker-ID). Deshalb steht sie
         genau EINMAL hier — eine zweite Definition im Graph-SVG waere eine
         doppelte ID im Dokument. url(#…) loest dokumentweit auf, auch ueber
         SVG-Grenzen hinweg. -->
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

    <!-- 2D-Ansicht: in dieser Figur dauerhaft verborgen (currentView='ISO'),
         aber vorhanden, weil drawBackground() beide Gruppen anfasst. -->
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
    <!-- omega zuerst, alpha danach: beide liegen auf der z-Achse, alpha ist
         (bei den Default-Werten) kuerzer und muss oben liegen, sonst verdeckt
         der omega-Schaft es vollstaendig. Reihenfolge wie in der Vorlage. -->
    <line id="ks_omega_vector" marker-end="url(#ks_arrow-omega)"/>
    <line id="ks_alpha_vector" marker-end="url(#ks_arrow-alpha)"/>
    <circle id="ks_point" r="8"/>

    <text id="ks_zoom_text_display" x="12" y="20" visibility="hidden"></text>
    <text id="ks_time_display" x="12" y="470" class="aspekt-time-text"></text>

    <!-- Stoppuhr: in dieser Figur ausgeblendet (der Aspekt ist die Drehachse,
         nicht die Zeit als Uhr), aber als Stub vorhanden — updateScene() setzt
         die Zeigerendpunkte, drawBackground() fuellt die Markenschienen. -->
    <g id="ks_stopwatch" style="display:none">
      <circle id="ks_stopwatch_circle"/><g id="ks_stopwatch_marks"></g>
      <circle id="ks_stopwatch_subdial_face"/><g id="ks_stopwatch_subdial_marks"></g>
      <line id="ks_stopwatch_sub_hand"/><line id="ks_stopwatch_main_hand"/>
    </g>
  </g>
</svg>`;

// -- Graph-Skelett: 1:1 aus der Vorlagen-Sim (ks_-prefixt). Diese Figur nutzt den
//    EINZEL-Modus (diagramMode='1', graphType1='omega'); Slot 2 bleibt verborgen,
//    ist aber als Stub vorhanden, weil drawGraphs()/hideGraphHover(2) darauf
//    zugreifen. Die Hover-Gruppen sind GESCHWISTER von graph_group_1/2, weil
//    drawGraph() diese Gruppen bei jedem Zeichnen per innerHTML='' leert.
//
//    ks_graph_prev_group (Vergleichskurve) steht bewusst NACH graph_group_1:
//    drawGraph() legt als erstes ein deckendes Hintergrund-Rechteck an, ein
//    davor liegender Geisterzug waere davon verdeckt.
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

// -- Linkes Bedien-Panel — Abschnitte einklappbar (Muster wie 1.50/1.51). -------
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
    <div class="slider-label">Anfangs-Winkelgeschw. \\(\\omega_0\\)</div>
    <div class="slider-row">
      <input id="ak_omega0" type="range" min="${OMEGA0_MIN}" max="${OMEGA0_MAX}" step="${OMEGA0_STEP}" value="${OMEGA0_DEFAULT}">
      <span class="slider-val" id="ak_omega0_out"></span>
    </div>
    <div class="slider-label">Winkelbeschleunigung \\(\\alpha\\)</div>
    <div class="slider-row">
      <input id="ak_alpha" type="range" min="${ALPHA_MIN}" max="${ALPHA_MAX}" step="${ALPHA_STEP}" value="${ALPHA_DEFAULT}">
      <span class="slider-val" id="ak_alpha_out"></span>
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
    <label class="aspekt-check"><input type="checkbox" id="ak_pos" checked><span>Ortsvektor \\(\\vec r\\) einblenden</span></label>
    <label class="aspekt-check"><input type="checkbox" id="ak_phi" checked><span>Winkel \\(\\varphi\\) einblenden</span></label>
    <label class="aspekt-check"><input type="checkbox" id="ak_traj" checked><span>durchlaufene Bahn einblenden</span></label>
    <div class="aspekt-hint">\(\vec\omega\) und \(\vec\alpha\) haben verschiedene Einheiten (\(\mathrm{rad/s}\) bzw. \(\mathrm{rad/s^2}\)) — ihre Pfeillängen sind daher jeweils proportional zum eigenen Wert, aber untereinander nicht vergleichbar. Aussagekräftig ist die RICHTUNG (gleich- oder gegensinnig zur Drehachse), nicht das Längenverhältnis.</div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Legende${CHEVRON}</button>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="omega"></div><div class="legend-label">Winkelgeschw. \\(\\vec\\omega\\) (Drehachse)</div>
      <div class="legend-swatch" data-c="alpha"></div><div class="legend-label">Winkelbeschl. \\(\\vec\\alpha\\) (Drehachse)</div>
      <div class="legend-swatch" data-c="r"></div>    <div class="legend-label">Ortsvektor \\(\\vec{r}\\)</div>
      <div class="legend-swatch" data-c="phi"></div>  <div class="legend-label">Winkel \\(\\varphi\\)</div>
      <div class="legend-swatch" data-c="traj"></div> <div class="legend-label">durchlaufene Bahn</div>
    </div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Vergleich${CHEVRON}</button>
    <label class="aspekt-check"><input type="checkbox" id="ak_keep"><span>Letzte Kurve behalten</span></label>
  </div>
</div>`;

// -- Klebende Ablaufleiste oberhalb von Szene + Diagramm (wie 1.44/1.51). ------
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
        <div class="analysis-cell key">Winkel \\(\\varphi\\)</div>              <div class="analysis-cell val" id="ak_val_phi"></div>
        <div class="analysis-cell key">Radius \\(R\\)</div>                     <div class="analysis-cell val" id="ak_val_r"></div>
        <div class="analysis-cell key">Winkelgeschw. \\(\\omega(t)\\)</div>     <div class="analysis-cell val" id="ak_val_omega"></div>
        <div class="analysis-cell key">Winkelbeschl. \\(\\alpha\\)</div>        <div class="analysis-cell val" id="ak_val_alpha"></div>
        <div class="analysis-cell key">Richtung von \\(\\vec\\alpha\\)</div>    <div class="analysis-cell val" id="ak_val_dir"></div>
        <div class="analysis-cell key">Bahngeschw. \\(|\\vec v|=|\\omega|R\\)</div> <div class="analysis-cell val" id="ak_val_v"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Winkelbeschleunigung als Vektor:</div>
        <div>\\[\\vec\\alpha(t) = \\frac{\\mathrm{d}\\vec\\omega(t)}{\\mathrm{d}t}\\]</div>
        <div>\\[\\vec\\omega(t) = \\begin{pmatrix}0\\\\0\\\\\\omega_0 + \\alpha t\\end{pmatrix},\\quad \\vec\\alpha = \\begin{pmatrix}0\\\\0\\\\\\alpha\\end{pmatrix}\\]</div>
        <div class="formula-box-cap">\\(\\vec\\alpha\\) parallel zu \\(\\vec\\omega\\): \\(|\\vec\\omega|\\) nimmt zu — antiparallel: \\(|\\vec\\omega|\\) nimmt ab.</div>
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

// ── Factory: baut EINE alpha/omega-Aspekt-Figur mit eigener Motor-Instanz ──────
export function buildAlphaOmegaFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhaengen (ks_ -> p, ak_ -> p+ak_), dann
    // DOM binden. Reihenfolge: erst IDs im Dokument, dann bindDom().
    // Die Tempo-Pills liegen im PANEL_LEFT -> deren name="ak_speed" HIER
    // prefixen, sonst findet querySelectorAll(`input[name="${p}speed"]`) nichts
    // und die Pills einer Figur wuerden mit denen einer anderen kollidieren.
    scene.innerHTML =
      `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`).replace(/name="ak_speed"/g, `name="${p}speed"`)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_SCENE.replace(/ks_/g, p)}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH.replace(/ks_/g, p)}</div></div></div>` +
      `${PANEL_RIGHT.replace(/id="ak_/g, `id="${p}ak_`)}</div>${LIVE_STUB.replace(/ks_/g, p)}`;
    rt.bindDom();

    // Lupe-Button in der klebenden Ablaufleiste (bleibt beim Scrollen sichtbar).
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption (am Bildschirm ersetzt diese Figur die
    // statische Abbildung). Inside .aspekt-body, damit die Panel-Trennstreifen
    // im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    // Einklappbare Panel-Abschnitte (Muster der Vorlagen-Sim: Klick auf den
    // .panel-label-Button schaltet .collapsed am .panel-section).
    scene.querySelectorAll('.panel-section.collapsible > .panel-label').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = btn.parentElement;
            const open = !sec.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', String(open));
        });
    });

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const ak_t = ge(p + 'ak_t'), ak_r = ge(p + 'ak_r');
    const ak_omega0 = ge(p + 'ak_omega0'), ak_alpha = ge(p + 'ak_alpha');
    const ak_pos = ge(p + 'ak_pos'), ak_phi = ge(p + 'ak_phi'), ak_traj = ge(p + 'ak_traj');
    const ak_keep = ge(p + 'ak_keep');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let curT = T_AUTO;                    // Initial: der volle Lauf ist gezeichnet
    let speedFactor = 1.0;
    let keepPrev = false;

    const n = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';

    // -- Vergleichskurve (Geisterzug): omega(t) des letzten Parametersatzes
    //    einfrieren und ueber dem neuen Durchlauf stehen lassen (nur die jeweils
    //    letzte, keine Ansammlung).
    //
    //    Gespeichert werden DATEN (t, omega in Grad — die Rohreihe des Motors),
    //    NICHT Pixel: die y-Achse skaliert automatisch mit dem Wertebereich
    //    (omega_0/alpha aendern ihn stark). Ein in Pixeln eingefrorener Zug
    //    bliebe stehen, waehrend die Achse unter ihm wegskaliert — die
    //    Geisterlinie schiene sich mitzuaendern. Deshalb wird sie bei jedem
    //    Zeichnen aus den Rohdaten neu auf die AKTUELLE Skala projiziert
    //    (store.graphScale[1], vom Motor beim Zeichnen gesetzt).
    const prevLine = ge(p + 'graph_prev_line');
    let prevSeries = null;                // {t:[…], omegaDeg:[…]}
    function snapshotPrev() {             // inside withStore aufrufen
        const fd = store.fullData;
        prevSeries = (fd && fd.t && fd.t.length)
            ? { t: fd.t.slice(), omegaDeg: fd.p_omega.slice() }
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
            const py = plotT + plotH - ((prevSeries.omegaDeg[i] * cf - valMin) / yR) * plotH;
            pts += `${px.toFixed(1)},${py.toFixed(1)} `;
        }
        prevLine.setAttribute('points', pts);
        prevLine.setAttribute('visibility', pts ? 'visible' : 'hidden');
    }

    // -- Zeichnen an der aktuellen Zeit (kein Neuberechnen der Datenreihe). ----
    function draw(t) {
        curT = t;
        // store.simulatedTime ist im Motor die „bis hierhin gelaufene" Zeit und
        // deckelt den Hover-Cursor (updateGraphHover clampt hoverT darauf).
        // Diese Figur fuehrt die Zeit selbst -> hier mitziehen, sonst haengt der
        // Hover-Cursor dauerhaft bei t = 0.
        store.simulatedTime = t;
        updateScene(t);      // Szene + Diagramm + Live-Stubs in einem Aufruf
        renderPrev();        // nach updateScene: store.graphScale[1] ist aktuell
    }

    // -- Regler-/Analyse-Beschriftungen (deutsches Dezimalkomma). Laeuft inside
    //    withStore (liest store/fullData).
    function updateLabels(t) {
        const alpha = store.alpha_rad, omega0 = store.omega0_rad;
        const omega = omega0 + alpha * t;
        ge(p + 'ak_t_out').textContent = n(t, 2) + ' s';
        ge(p + 'ak_r_out').textContent = n(store.R0, 2) + ' m';
        ge(p + 'ak_omega0_out').textContent = n(omega0, 2) + ' rad/s';
        ge(p + 'ak_alpha_out').textContent = n(alpha, 2) + ' rad/s²';
        const td = ge(p + 'time_display');
        if (td) td.textContent = `t = ${n(t, 2)} s`;

        // Richtung von alpha relativ zu omega — der Kern der Abbildung. Bezug ist
        // die AKTUELLE Winkelgeschwindigkeit: kehrt omega bei antiparallelem
        // alpha das Vorzeichen um (Nulldurchgang), stehen beide danach wieder
        // parallel und |omega| waechst erneut.
        const dir = (alpha === 0 || Math.abs(omega) < 1e-9)
            ? '—'
            : (Math.sign(alpha) === Math.sign(omega) ? 'parallel (|ω| ↑)' : 'antiparallel (|ω| ↓)');
        const hint = ge(p + 'ak_dir_hint');
        if (hint) {
            hint.textContent = alpha === 0
                ? 'α = 0: gleichförmige Kreisbewegung, ω bleibt konstant.'
                : (alpha > 0
                    ? 'α > 0: α zeigt in positive z-Richtung (Teilbild a).'
                    : 'α < 0: α zeigt in negative z-Richtung (Teilbild b).');
        }

        const vt = ge(p + 'ak_val_t');
        if (vt) {
            const interp = interpolateAt(t);
            const phiDeg = interp ? interp.p.phi : 0;
            vt.textContent = n(t, 2) + ' s';
            ge(p + 'ak_val_phi').textContent = n(phiDeg, 0) + ' °';
            ge(p + 'ak_val_r').textContent = n(store.R0, 2) + ' m';
            ge(p + 'ak_val_omega').textContent = n(omega, 3) + ' rad/s';
            ge(p + 'ak_val_alpha').textContent = n(alpha, 2) + ' rad/s²';
            ge(p + 'ak_val_dir').textContent = dir;
            ge(p + 'ak_val_v').textContent = n(Math.abs(omega) * store.R0, 2) + ' m/s';
        }
    }

    // -- Rebuild: Parameter geaendert -> Gates + Parameter setzen, Datenreihe neu
    //    rechnen, Hintergrund (ISO-Achsen, Bahnebene) neu zeichnen.
    //    `paramChange` = der Aufruf kommt von einem KURVENFORMENDEN Regler
    //    (omega_0, alpha, R): dann wird — wenn „Letzte Kurve behalten" aktiv ist —
    //    die eben gezeigte Kurve als Geisterzug eingefroren und die Laufzeit auf 0
    //    zurueckgesetzt, damit der neue Verlauf von vorn ueber dem alten entsteht
    //    (Konvention der Stand-alone-Sims, s. Runbook).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                // Ansicht + Bewegungsmodus: ISO (Drehachse sichtbar), reiner Kreis
                currentView: 'ISO', motionMode: 'kreis', angleUnit: 'rad',
                // Ebene fest in der x-y-Ebene; die Hoehe h ist Thema von Abb. 1.60
                h: 0, vr: 0, phi0_rad: 0,
                // Diagramm: EIN Slot, omega(t)
                diagramMode: '1', graphType1: 'omega',
                // Sichtbarkeiten: omega + alpha immer, r/phi/Bahn per Kasten
                togOmega: true, togAlpha: true,
                togPosition: !ak_pos || ak_pos.checked,
                togPhi: !ak_phi || ak_phi.checked,
                togTrajectory: !ak_traj || ak_traj.checked,
                // v und a gehoeren zu 1.42–1.51, hier bewusst aus
                togVelocity: false, togAcceleration: false,
                rDecomp: 'none', vDecomp: 'none', aDecomp: 'none', scaleAt: false,
                stopwatchVisible: false,
                // Auto-Stopp des Motors bleibt aus — diese Figur stoppt selbst bei T_AUTO
                isAutoStopping: false,
                simDuration: T_AUTO,
                // Eigene Laengen-Maßstaebe der Drehachsen-Vektoren (s. oben)
                omegaLenFactor: OMEGA_LEN_FACTOR_FIG,
                alphaLenFactor: ALPHA_LEN_FACTOR_FIG,
                axisVecLenCap: AXIS_VEC_LEN_CAP,
            });
            store.R0 = parseFloat(ak_r.value);
            store.omega0_rad = parseFloat(ak_omega0.value);
            store.alpha_rad = parseFloat(ak_alpha.value);
            // Zoom-Regel der Vorlagen-Sim (ui.js): Bahn fuellt hoechstens 90 %
            // der kleineren Halbachse, nie groesser als der Default-Maßstab.
            store.currentPixelsPerMeter = Math.min(
                DEFAULT_PIXELS_PER_METER,
                (Math.min(ANIM_CX, ANIM_CY) * 0.9) / (store.R0 || 1));
            store.zoomFactor = store.currentPixelsPerMeter / DEFAULT_PIXELS_PER_METER;

            precompute();                     // Datenreihe 0 … T_AUTO + Achsenlimits
            if (curT > T_AUTO) curT = T_AUTO;
            ak_t.max = String(T_AUTO);
            ak_t.value = curT.toFixed(3);
            drawBackground();                 // ISO-Achsen, Bahnebene, Stoppuhr-Marken
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
        // Genau EIN Schnappschuss pro Zieh-Geste: ein <input type=range> feuert
        // beim Ziehen ein input-Event PRO Zwischenwert. Eingefroren wird die
        // Kurve, die VOR dem Ziehen zu sehen war; das change-Event (Loslassen)
        // beendet die Geste.
        if (!paramGesture) {
            paramGesture = true;
            if (keepPrev) rt.withStore(snapshotPrev);
        }
        rebuild(true);
    }
    [ak_t, ak_r, ak_omega0, ak_alpha].forEach(inp => inp.addEventListener('input', onInput));
    [ak_r, ak_omega0, ak_alpha].forEach(inp => inp.addEventListener('change', () => { paramGesture = false; }));

    // Darstellungs-Kaesten: nur Sichtbarkeiten -> kein paramChange (Laufzeit und
    // Kurve bleiben, es wird nur neu gezeichnet).
    [ak_pos, ak_phi, ak_traj].forEach(cb => {
        if (cb) cb.addEventListener('change', () => rebuild(false));
    });

    if (ak_keep) ak_keep.addEventListener('change', () => {
        keepPrev = ak_keep.checked;
        if (!keepPrev) clearPrev();
    });

    // -- Automatischer Ablauf (Sim-Zeit 0 … T_AUTO, Slow-Mo via Tempo-Pills,
    //    Auto-Stopp am Ende — kein Umbrechen). ---------------------------------
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
        // Am Ende angelangt -> die gerade fertige Kurve vor dem Reset einfrieren
        // (nur bei echtem Neudurchlauf, nicht beim Weiterlaufen aus der Mitte).
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

    // Beim Oeffnen/Schliessen der Lupe sofort neu zeichnen: so greift der
    // modus-spezifische Layout-Wechsel (Diagramm-Format) ohne Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => {
        rt.withStore(() => { draw(curT); updateLabels(curT); });
    });

    // -- Graph-Hover (nur in der Lupe): vertikale Linie + Punkt + Tooltip mit
    //    dem Wert an der Mausposition. Slot 1 (Einzel-Diagramm). Bewusst nur im
    //    Overlay aktiv (Gate auf .aspekt-im-overlay) — der Lesemodus bleibt
    //    ungestoert; das CSS setzt die Hit-Rects ausserhalb des Overlays auf
    //    pointer-events:none.
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
