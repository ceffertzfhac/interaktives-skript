// aspekt_axay_winkelbeschl.js — interaktive Aspekt-Figur zu Abbildung 1.50
// (1.4.5 „Kreisbewegungen mit veränderlicher Winkelgeschwindigkeit").
// Zeigt die beiden Bahnbeschleunigungs-Komponenten a_x(t) (oben) und a_y(t)
// (unten) bei VERÄNDERLICHER Winkelgeschwindigkeit ω(t) — d. h. konstanter
// Winkelbeschleunigung α ≠ 0 — sowie die Kreisbahn-Szene mit dem
// Beschleunigungsvektor \vec{a}, der bei α ≠ 0 NICHT mehr rein radial ist,
// sondern eine tangentiale Komponente besitzt.
// Regler: Zeit t (0 … 12 s), Radius R, Anfangs-Winkelgeschw. ω₀, Winkel-
// beschleunigung α (± inkl. 0 → gleichförmig, dann wie 1.46).
//
// TECHNIK / ABWEICHUNG von der Vorlage: Vorlage ist aspekt_axay_zeit.js
// (Abb. 1.46, konstantes ω). Der portierte Motor (physics.js) rechnet fest mit
// konstantem ω (φ=φ₀+ω·t, \vec a rein zentripetal) und kann α NICHT abbilden.
// Deshalb rechnet DIESE Figur die α-Physik LOKAL (localPhi/localOmega/myPos/
// myVel/myAcc, extendLocal) und füllt die store-Arrays selbst — der geteilte
// Motor bleibt UNVERÄNDERT (kein Risiko für die anderen Figuren). Gezeichnet
// wird weiterhin mit updateScene()/updateGraph() (die die übergebenen Vektoren
// bzw. die store-Arrays nutzen), Stacked-Modus graphType1='axt'/graphType2='ayt'.
//   φ(t) = φ₀ + ω₀·t + ½·α·t²,   ω(t) = ω₀ + α·t
//   \vec a(t) = α·R·(−sinφ, cosφ)  +  ω(t)²·R·(−cosφ, −sinφ)
//               └── tangential a_t ──┘   └──── radial/zentripetal a_r ────┘
// store.T = ∞ (voller Bahnspur-Pfad, kein Perioden-Clip); die a_x/a_y-Kurven
// wachsen mit der Zeit (|a| ∝ ω(t)²) — genau der Effekt der statischen Abb. 1.50.
//
// SZENE: der Beschleunigungsvektor \vec{a} (die gezeigte Größe) + Ortsvektor
// \vec{r}. Zwei optionale Zerlegungen (Nutzervorgabe): (1) kartesisch a_x/a_y
// (Projektionen auf die Achsen, passend zu den Diagrammen, über updateScene);
// (2) tangential/radial a_t/a_r (SELBST gezeichnet, da der Motor das nicht
// kennt) — a_t rot, a_r blau, passend zur Farbcodierung der Formel im Skript
// (α·R-Term rot, ω²·R-Term blau). Bei α ≠ 0 neigt sich \vec{a} sichtbar aus der
// Radialrichtung — der Kernpunkt der Figur.
//
// OPTIK: Farb-Tokens und Panel-/Slider-/Legenden-Klassen VERBATIM aus der
// portierten styles.css (ueber aspekt_kreisbahn.css fuer .aspekt-figur); die
// Graph-Struktur (graph-bg/axis-line/…) liegt zentral in aspekt_kreisbahn.css
// (inkl. ×1,5-Skalierung via --kb-lw/--kb-fs), hier nur die Datenlinien-FARBEN
// (a_x/a_y) + die Vergleichslinie + die Beschleunigungs-Vektorfarben. Die
// Pfeil-Geometrie ist die der Vorlage (Marker markerUnits=userSpaceOnUse mit
// fester Laenge = ARROW_LEN), damit render.js' Verkuerzung die Spitze exakt auf
// den Zielpunkt setzt.
//
// LAYOUT: wie 1.42 — stackedDualGeom() des Motors stellt die beiden Diagramme
// UEBEREINANDER dar; im Normal-/Schmal-Modus steht die Kreisbahn-Szene UEBER
// dem gestapelten Diagramm (Saeule), im Breit- und Zoom-Modus NEBEN dem Diagramm
// (Zeile, s. aspekt_axay_zeit.css).
//
// ABLAUF: neben dem Zeit-Regler Start-/Stop-/Reset-Knoepfe (Pictogramme) sowie
// Tempo-Pills (1× … ⅛×, Slow-Mo analog zur Vorlage) fuer den automatischen
// Ablauf. Der laeuft in Sim-Zeit, stoppt nach festen 12 s (3 Perioden bei T=4 s)
// und wiederholt nicht. Pro Instanz im Closure; Knoepfe/Pills haengen direkt am
// Container (kein data-action — sie brauchen Instanz-Zustand, wie die Slider).
// Zusaetzlich Toggle „Letzte Kurve behalten" (Vergleichslinie, s. snapshotPrev)
// und „Komponenten zerlegen" (Szene).
//
// PER-INSTANZ-ISOLATION: der Motor-Store ist ein Modul-Singleton. Diese Figur
// holt sich ueber createRuntime() einen EIGENEN Prefix (kb<n>_) + einen
// EIGENEN storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside
// rt.withStore(...), das den Singleton nur fuer die Dauer des Zeichnens auf
// diese Instanz schaltet und danach restauriert. So sind beliebig viele
// Aspekt-Figuren (auch auf derselben Seite) vollstaendig unabhaengig.

import { store } from './kreisbewegung/state.js';
// Aus dem Motor NUR die Achsen-Neuberechnung (liest die store-Arrays, die wir
// selbst füllen). position/velocity/acceleration/extendMotionData NICHT — die
// setzen konstantes ω voraus; die α-Physik rechnen wir lokal (s. Kopf).
import { recalculateAxisLimits } from './kreisbewegung/physics.js';
import { setupScene, updateScene, updateGraph, updateGraphHover,
         drawStopwatchMarks, drawSubdialMarks } from './kreisbewegung/render.js';
import { R_MIN, R_MAX, TIME_STEP } from './kreisbewegung/constants.js';
import { createRuntime } from './kreisbewegung/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

const T_AUTO = 24;            // fester Auto-Stopp nach 24 s — längerer Lauf, damit das
                              // Anwachsen von |a| ∝ ω(t)² und die Nicht-Periodizität der
                              // a_x/a_y-Kurven deutlicher werden (Nutzervorgabe).
// Anfangs-Winkelgeschwindigkeit ω₀ [rad/s] und Winkelbeschleunigung α [rad/s²].
// α darf ± sein (beschleunigen/bremsen); α=0 → gleichförmig (Grenzfall 1.46).
const OMEGA0_MIN = 0.3, OMEGA0_MAX = 2.0, OMEGA0_DEFAULT = 0.8, OMEGA0_STEP = 0.05;
const ALPHA_MIN = -0.3, ALPHA_MAX = 0.3, ALPHA_DEFAULT = 0.15, ALPHA_STEP = 0.01;
const R_DEFAULT = 1.5;
const ANIM_CX = 225, ANIM_CY = 260;   // = ANIM_CX / ANIM_CY_STACK (render.js)
// Vektor-Verkürzung (= render.js: ARROW_LEN_MAIN=5·2,5, COMP=5·2) für die
// SELBST gezeichneten Beschleunigungs-Vektoren (a, a_x/a_y, a_t/a_r; shortenLine unten).
const ARROW_LEN_MAIN = 12.5, ARROW_LEN_COMP = 10;
// Ziel-Länge des Beschleunigungsvektors in der Szene (Anteil des Bahnradius in
// Pixeln). |a| wird pro Frame darauf NORMIERT, damit die Richtung/Neigung des
// Vektors — der α-Effekt — IMMER sichtbar ist, unabhängig von ω₀/α (didaktisches
// Kernproblem: |a|=ω²R variiert um Faktor ~30 über den Lauf und ist bei kleinem
// ω sonst unsichtbar). Das echte Anwachsen von |a| zeigen die Diagramme.
const A_TARGET_FRAC = 0.5;

// -- Szene: Vorlagen-Geometrie (wie aspekt_vxvy_zeit), aber der Beschleunigungs-
//    vektor ist die gezeigte Groesse — daher bekommt er (und seine Komponenten)
//    eigene Pfeilspitzen (a/ax/ay, Geometry = r/rx/ry: strokeWidth-Marker wie
//    v/vx/vy in 1.42) UND marker-end auf den Linien. Der Ortsvektor bleibt
//    sichtbar (a⃗ antiparallel zu r⃗ — der Punkt dieser Figur); der
//    Geschwindigkeitsvektor wird zum versteckten Stub (updateScene() dereferen-
//    ziert ihn), per showVelocityVector=false verdeckt. Versteckte Stubs (v),
//    die updateScene() anfasst; die analoge Stoppuhr wird nach Vorlage
//    EINGEBLENDET (Skalenstriche in rebuild(), Zeiger pro Frame via updateScene).
//    Die kb_-IDs werden pro Instanz durch den Prefix ersetzt.
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 0 450 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <!-- Koordinatenachsen-Pfeilspitze bleibt userSpaceOnUse (feste Groeße; die
         Achse ist kein Physik-Vektor und wird nicht mit --kb-lw/dick-skaliert). -->
    <marker id="kb_ax_arrow"     markerUnits="userSpaceOnUse" markerWidth="13.5" markerHeight="10.5"  refX="7.5" refY="5.25"  orient="auto"><polygon points="0 0, 13.5 5.25, 0 10.5"/></marker>
    <!-- Physik-Vektor-Pfeilspitzen in STRICHSTÄRKEN-Einheiten (markerUnits=
         strokeWidth): die Spitze wächst mit der Strichstärke mit (Nutzervorgabe
         „Spitze mit skalieren"). markerWidth=5 -> Spitze = 5×Strichstärke
         (Vorlagen-Proportion 5:1), refX=0 -> Basis am Linienende. Der Motor kürzt
         die Linie um ARROW_LEN×arrowLenScale (= 5×Strichstärke), sodaß die
         Spitze exakt aufs Ziel trifft (Pfeillängen-Kopplung ARROW_LEN=5·sw).
         r und a führen hierfür auf GLEICHE Strichstärke (s. CSS), weil der Motor
         pro Haupt-/Neben-Vektor nur EINEN Verkürzungs­wert kennt. -->
    <marker id="kb_arrowhead-r"  markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-rx" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-ry" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-a"  markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-ax" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-ay" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <!-- Tangential-/Radial-Zerlegung von a (selbst gezeichnet): a_t rot, a_r blau
         (Farbcodierung des Skripts). Polygon-Klasse steuert die Füllung (CSS). -->
    <marker id="kb_arrowhead-at" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon class="ah-at" points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-ar" markerUnits="strokeWidth" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon class="ah-ar" points="0 0, 5 1.75, 0 3.5"/></marker>
    <!-- Pfeilspitze am Winkelbogen (zeigt die positive Drehrichtung, P-Wunsch;
         Bogen selbst fuer Konsistenz innerhalb Abschnitt 1.4.2 ergaenzt -- alle
         Aspekt-Figuren dort zeigen jetzt denselben durchlaufenen Winkelbogen
         wie 1.41/1.44). markerUnits=strokeWidth (Default): Groesse skaliert
         automatisch mit der Bogen-Strichstaerke (--kb-lw). Nur der AKTUELLE
         Bogen bekommt sie (per JS gesetzt), nicht die verblassten Geisterbögen. -->
    <marker id="kb_angle_arrow" markerWidth="4" markerHeight="3" refX="0" refY="1.5" orient="auto"><polygon points="0 0, 4 1.5, 0 3"/></marker>
  </defs>
  <g id="kb_animation_group">
    <g id="kb_aspekt_axes"></g>
    <g id="kb_animation_coord_system"></g>
    <circle id="kb_disk" cx="225" cy="260" r="100" fill="none" stroke-width="0" opacity="0.06"/>
    <g id="kb_aspekt_angle"></g>
    <!-- phi-Label als foreignObject mit MathJax (garantiert das geschwungene
         \varphi, unabhaengig vom Font). Separat von kb_aspekt_angle, das
         drawAngle() bei jedem Neuzeichnen leert; hier wird nur x/y gesetzt. -->
    <foreignObject id="kb_angle_label" width="30" height="30" style="overflow:visible; visibility:hidden">
      <div xmlns="http://www.w3.org/1999/xhtml" class="aspekt-angle-fo">\\(\\varphi\\)</div>
    </foreignObject>
    <path id="kb_trajectory_path" fill="none" stroke-width="2" stroke-dasharray="4,4" d=""/>
    <circle id="kb_point" cx="325" cy="260" r="8" stroke-width="1"/>
    <text id="kb_zoom_text_display" x="12" y="20" class="zoom-text"></text>
    <text id="kb_time_display" x="12" y="470" class="aspekt-time-text"></text>

    <line id="kb_position_vector"   stroke-width="3.75" marker-end="url(#kb_arrowhead-r)"  visibility="hidden"/>
    <line id="kb_position_vector_x" stroke-width="3" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-rx)" visibility="hidden"/>
    <line id="kb_position_vector_y" stroke-width="3" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ry)" visibility="hidden"/>

    <!-- Geschwindigkeitsvektor: versteckter Stub (updateScene() dereferenziert
         ihn), per showVelocityVector=false verdeckt — Aspekt hier ist a, nicht v. -->
    <line id="kb_velocity_vector"/><line id="kb_velocity_vector_x"/><line id="kb_velocity_vector_y"/>

    <!-- Beschleunigungsvektor (radial, antiparallel zu r) = die gezeigte Groesse
         + optionale Komponenten. -->
    <line id="kb_acceleration_vector"   stroke-width="3.75" marker-end="url(#kb_arrowhead-a)"  visibility="hidden"/>
    <line id="kb_acceleration_vector_x" stroke-width="3" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ax)" visibility="hidden"/>
    <line id="kb_acceleration_vector_y" stroke-width="3" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ay)" visibility="hidden"/>

    <!-- Tangential-/Radial-Zerlegung von a (optional, selbst berechnet+gezeichnet,
         da der Motor sie nicht kennt): a_t = α·R (tangential, rot), a_r = ω²·R
         (radial/zentripetal, blau). Länge + Verkürzung wie der a-Vektor. -->
    <line id="kb_accel_t" class="accel-t" stroke-width="3.75" marker-end="url(#kb_arrowhead-at)" visibility="hidden"/>
    <line id="kb_accel_r" class="accel-r" stroke-width="3.75" marker-end="url(#kb_arrowhead-ar)" visibility="hidden"/>
    <g id="kb_accel_tr_labels"></g>

    <g id="kb_stopwatch">
      <circle id="kb_stopwatch_circle" cx="280" cy="120" r="72" stroke-width="2"/>
      <g id="kb_stopwatch_marks"></g>
      <g id="kb_subdial">
        <circle id="kb_subdial_face" cx="280" cy="150" r="16" stroke-width="1"/>
        <g id="kb_subdial_marks"></g>
        <line id="kb_stopwatch_sub_hand" x1="280" y1="150" x2="280" y2="135" stroke-width="1.5"/>
      </g>
      <line id="kb_stopwatch_main_hand" x1="280" y1="120" x2="280" y2="60" stroke-width="3"/>
      <g id="kb_digital_display_group" style="visibility:hidden"></g>
    </g>
  </g>
</svg>`;

// -- Graph-Skelett: 1:1 aus der Stand-alone-Sim (kb_-prefixt), inkl. der
//    Hover-/HitRect-Elemente, die drawGraphSlot im Zeit-Ast als
//    Sammel-Objekt (DOM.graphHitRect[slot]) dereferenziert — fehlen sie,
//    gibt es beim ersten Zeichnen einen Null-Zugriff. ----------------------
const SVG_GRAPH = `
<svg id="kb_graph_svg" viewBox="0 0 700 410" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <defs>
    <marker id="kb_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="kb_graph_group_single" transform="translate(0,0)">
    <g id="kb_grid_group"></g>
    <polyline id="kb_graph_prev_line" fill="none" stroke-width="2" points="" visibility="hidden"/>
    <polyline id="kb_graph_line" fill="none" stroke-width="2" points=""/>
    <circle id="kb_graph_point" r="4" visibility="hidden"/>
    <text id="kb_graph_title" x="350" y="18" text-anchor="middle" class="graph-title-text"></text>
    <line id="kb_graph_hover_line" class="graph-hover-line" visibility="hidden"/>
    <circle id="kb_graph_hover_point" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="kb_graph_hover_tooltip" visibility="hidden">
      <rect id="kb_graph_hover_tooltip_bg" class="graph-hover-tooltip-bg"/>
      <text id="kb_graph_hover_tooltip_text" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="kb_graph_hit_rect" class="graph-hit-rect"/>
  </g>
  <g id="kb_graph_group_stacked_top" transform="translate(0,0)" style="visibility:hidden">
    <g id="kb_grid_group_top"></g>
    <polyline id="kb_graph_prev_line_top" fill="none" stroke-width="2" points="" visibility="hidden"/>
    <polyline id="kb_graph_line_top" fill="none" stroke-width="2" points=""/>
    <circle id="kb_graph_point_top" r="3" visibility="hidden"/>
    <text id="kb_graph_title_top" x="350" y="14" text-anchor="middle" class="graph-title-text small"></text>
    <line id="kb_graph_hover_line_top" class="graph-hover-line" visibility="hidden"/>
    <circle id="kb_graph_hover_point_top" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="kb_graph_hover_tooltip_top" visibility="hidden">
      <rect id="kb_graph_hover_tooltip_bg_top" class="graph-hover-tooltip-bg"/>
      <text id="kb_graph_hover_tooltip_text_top" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="kb_graph_hit_rect_top" class="graph-hit-rect"/>
  </g>
  <g id="kb_graph_group_stacked_bottom" transform="translate(0,210)" style="visibility:hidden">
    <g id="kb_grid_group_bottom"></g>
    <polyline id="kb_graph_prev_line_bottom" fill="none" stroke-width="2" points="" visibility="hidden"/>
    <polyline id="kb_graph_line_bottom" fill="none" stroke-width="2" points=""/>
    <circle id="kb_graph_point_bottom" r="3" visibility="hidden"/>
    <text id="kb_graph_title_bottom" x="350" y="14" text-anchor="middle" class="graph-title-text small"></text>
    <line id="kb_graph_hover_line_bottom" class="graph-hover-line" visibility="hidden"/>
    <circle id="kb_graph_hover_point_bottom" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="kb_graph_hover_tooltip_bottom" visibility="hidden">
      <rect id="kb_graph_hover_tooltip_bg_bottom" class="graph-hover-tooltip-bg"/>
      <text id="kb_graph_hover_tooltip_text_bottom" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="kb_graph_hit_rect_bottom" class="graph-hit-rect"/>
  </g>
</svg>`;

// -- Linkes Bedien-Panel — Abschnitte EINKLAPPBAR (Nutzervorgabe: die Leiste wird
//    zu lang). Muster wie die Vorlagen-Sim (kreisbewegung/ui.js): jede
//    `.panel-section.collapsible` hat als Kopf einen <button class="panel-label">
//    mit .acc-chevron; ein Klick schaltet `.collapsed` (CSS blendet die
//    Geschwister nach dem Button aus). Legende + Vergleich starten eingeklappt.
const CHEVRON = '<span class="acc-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg></span>';
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section collapsible">
    <button type="button" class="panel-label" aria-expanded="true">Parameter${CHEVRON}</button>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="0" max="24" step="0.05" value="24">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
    <div class="slider-label">Radius \\(R\\)</div>
    <div class="slider-row">
      <input id="ak_r" type="range" min="${R_MIN}" max="${R_MAX}" step="0.05" value="${R_DEFAULT}">
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
    <label class="aspekt-check"><input type="checkbox" id="ak_components"><span>kartesisch \\(a_x\\)/\\(a_y\\) zerlegen</span></label>
    <label class="aspekt-check"><input type="checkbox" id="ak_tr"><span>tangential/radial \\(\\vec{a}_\\text{t}\\)/\\(\\vec{a}_\\text{r}\\) zerlegen</span></label>
    <div class="accel-scale-note">Der Beschleunigungsvektor ist in der Szene auf feste Länge normiert (damit die Neigung immer sichtbar ist). Den tatsächlichen Betrag \\(|\\vec a|=\\omega(t)^2R\\) zeigen die Diagramme.</div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Legende${CHEVRON}</button>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="r"></div>   <div class="legend-label">Ortsvektor \\(\\vec{r}\\)</div>
      <div class="legend-swatch" data-c="a"></div>   <div class="legend-label">Beschleunigungsvektor \\(\\vec{a}\\)</div>
      <div class="legend-swatch" data-c="ax"></div> <div class="legend-label">Komponente \\(a_x\\)</div>
      <div class="legend-swatch" data-c="ay"></div> <div class="legend-label">Komponente \\(a_y\\)</div>
      <div class="legend-swatch" data-c="at"></div> <div class="legend-label">tangential \\(\\vec{a}_\\text{t}=\\alpha R\\)</div>
      <div class="legend-swatch" data-c="ar"></div> <div class="legend-label">radial \\(\\vec{a}_\\text{r}=\\omega^2 R\\)</div>
      <div class="legend-swatch" data-c="phi"></div> <div class="legend-label">Winkel \\(\\varphi\\)</div>
      <div class="legend-swatch" data-c="traj"></div><div class="legend-label">durchlaufener Bogen</div>
    </div>
  </div>
  <div class="panel-section collapsible collapsed">
    <button type="button" class="panel-label" aria-expanded="false">Vergleich${CHEVRON}</button>
    <label class="aspekt-check"><input type="checkbox" id="ak_keep"><span>Letzte Kurve behalten</span></label>
  </div>
</div>`;

// -- Klebende Ablaufleiste oberhalb der eigentlichen Simulationsflaeche
//    (Szene + Diagramm): nur Start/Stop/Reset bleiben beim Scrollen jederzeit
//    erreichbar. Tempo bleibt bewusst im linken Panel (nicht permanent sichtbar).
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: automatischen Ablauf abspielen" title="Start"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Stop: Ablauf anhalten" title="Stop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" title="Reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
</div>`;

// -- Rechtes Analyse-Panel (breit + Lupe). Kopf-Leiste + Body wie die
//    Stand-alone (panel-header mit ph-label + Doppel-Chevron, panel-body). ----
//    Physik-Sektion wie in 1.42: statischer .formula-box-Block (kein data-eqs),
//    UNNUMMERIERT, inline als \\[...\\] (MathJax setzt es direkt).
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
        <div class="analysis-cell key">Zeit \\(t\\)</div>            <div class="analysis-cell val" id="ak_val_t"></div>
        <div class="analysis-cell key">Winkel \\(\\varphi\\)</div>    <div class="analysis-cell val" id="ak_val_phi"></div>
        <div class="analysis-cell key">Radius \\(R\\)</div>          <div class="analysis-cell val" id="ak_val_r"></div>
        <div class="analysis-cell key">Winkelgeschw. \\(\\omega(t)\\)</div> <div class="analysis-cell val" id="ak_val_omega"></div>
        <div class="analysis-cell key">Winkelbeschl. \\(\\alpha\\)</div> <div class="analysis-cell val" id="ak_val_alpha"></div>
        <div class="analysis-cell key">Beschleun. \\(a_x\\)</div>    <div class="analysis-cell val" id="ak_val_ax"></div>
        <div class="analysis-cell key">Beschleun. \\(a_y\\)</div>    <div class="analysis-cell val" id="ak_val_ay"></div>
        <div class="analysis-cell key">Betrag \\(|\\vec{a}|\\)</div>  <div class="analysis-cell val" id="ak_val_aabs"></div>
        <div class="analysis-cell key">tangential \\(a_\\text{t}\\)</div> <div class="analysis-cell val" id="ak_val_at"></div>
        <div class="analysis-cell key">radial \\(a_\\text{r}\\)</div>   <div class="analysis-cell val" id="ak_val_ar"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Bahnbeschleunigung bei veränderlichem \\(\\omega\\):</div>
        <div>\\[\\vec{a}(t) = \\textcolor{red}{\\alpha R \\begin{pmatrix}-\\sin\\varphi \\\\ \\cos\\varphi\\end{pmatrix}} + \\textcolor{blue}{\\omega(t)^{2} R \\begin{pmatrix}-\\cos\\varphi \\\\ -\\sin\\varphi\\end{pmatrix}}\\]</div>
        <div>\\[\\textcolor{red}{a_\\text{t}=\\alpha R},\\quad \\textcolor{blue}{a_\\text{r}=\\omega(t)^{2} R},\\quad \\omega(t)=\\omega_0+\\alpha t\\]</div>
      </div>
    </div>
  </div>
</div>`;

const LIVE_STUB = `
<div style="display:none">
  <span id="kb_time_label"></span>
  <span id="kb_live_t"></span><span id="kb_live_phi"></span>
  <span id="kb_live_x"></span><span id="kb_live_y"></span>
  <span id="kb_live_vx"></span><span id="kb_live_vy"></span><span id="kb_live_vabs"></span>
  <span id="kb_live_ax"></span><span id="kb_live_ay"></span><span id="kb_live_aabs"></span>
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js definiert (arbeiten auf
// jedem .aspekt-figur, kein Motor-Zustand) und dort in main.js verdrahtet —
// diese Figur nutzt sie unverändert mit. Daher hier keine Duplikate (DRY).

// ── Factory: baut EINE a_x/a_y-Zeit-Aspekt-Figur mit eigener Motor-Instanz ─────
export function buildAxAyWinkelbeschlFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhaengen (kb_ -> p, ak_ -> p+ak_), dann
    // DOM an diese Instanz binden. Reihenfolge: erst IDs im Dokument, dann bindDom.
    // Tempo-Pills liegen im PANEL_LEFT (nicht im RUNBAR) → deren name="ak_speed"
    // HIER prefixen, sonst passt querySelectorAll('input[name="${p}speed"]') auf
    // nichts und Slow-Mo bleibt wirkungslos (speedFactor stets 1,0).
    scene.innerHTML =
      `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`).replace(/name="ak_speed"/g, `name="${p}speed"`)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_SCENE.replace(/kb_/g, p)}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH.replace(/kb_/g, p)}</div></div></div>` +
        `${PANEL_RIGHT.replace(/id="ak_/g, `id="${p}ak_`)}</div>${LIVE_STUB.replace(/kb_/g, p)}`;
    rt.bindDom();

    // Lupe-Button: oben rechts in der Ablaufleiste (.aspekt-runbar, sticky —
    // s. Begründung in aspekt_weg_zeit.js). Rückfall .aspekt-scene.
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption aufbauen (die statische Abbildung
    // uebernimmt am Bildschirm diese Rolle). Inside .aspekt-body, damit die
    // Panel-Trennstreifen im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const ak_t = ge(p + 'ak_t'), ak_r = ge(p + 'ak_r');
    const ak_omega0 = ge(p + 'ak_omega0'), ak_alpha = ge(p + 'ak_alpha');
    const ak_keep = ge(p + 'ak_keep');
    const ak_components = ge(p + 'ak_components');
    const ak_tr = ge(p + 'ak_tr');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let sceneCenters = null;
    let curT = T_AUTO;                    // Initial: volle 12 s
    let speedFactor = 1.0;
    let keepPrev = false;                 // Vergleichslinie: letzte Kurve bei Neudurchlauf behalten
    let showComponents = false;           // Szene: kartesische a_x/a_y-Zerlegung (optional)
    let showTR = false;                   // Szene: tangential/radial a_t/a_r-Zerlegung (optional)

    // -- Lokale α-Physik (der geteilte Motor kann nur konstantes ω, s. Kopf). ω0/α
    //    kommen aus den Reglern; φ0 = 0. Winkel in rad. Diese Funktionen liefern die
    //    an updateScene übergebenen Vektoren; fillLocal() füllt daraus die store-
    //    Arrays für updateGraph(). ------------------------------------------------
    let omega0 = OMEGA0_DEFAULT, alpha = ALPHA_DEFAULT;
    const localPhi = t => omega0 * t + 0.5 * alpha * t * t;        // φ(t) = ω0 t + ½ α t²
    const localOmega = t => omega0 + alpha * t;                    // ω(t) = ω0 + α t
    const myPos = t => { const ph = localPhi(t), R = store.R;
        return { x: R * Math.cos(ph), y: R * Math.sin(ph), phi: ph * 180 / Math.PI }; };
    const myVel = t => { const ph = localPhi(t), w = localOmega(t), R = store.R;
        return { x: -R * w * Math.sin(ph), y: R * w * Math.cos(ph) }; };
    const myAcc = t => { const ph = localPhi(t), w = localOmega(t), R = store.R;
        // a = α·R·(−sinφ, cosφ) [tangential] + ω²·R·(−cosφ, −sinφ) [radial/zentripetal]
        return { x: -R * (alpha * Math.sin(ph) + w * w * Math.cos(ph)),
                 y:  R * (alpha * Math.cos(ph) - w * w * Math.sin(ph)) }; };

    // -- Vergleichslinie (Ghost): die gerade fertigen a_x(t)/a_y(t)-Kurven beim
    //    Start eines Neudurchlaufs einfrieren (gestrichelt + dünner, s. CSS)
    //    und ueber dem neuen Durchlauf stehen lassen. Nur die jeweils letzte
    //    Kurve (keine Ansammlung). Gestapelt -> top + bottom; der Einzel-Slot
    //    wird mitgeführt, falls isStacked mal aus ist.
    //
    //    Gespeichert werden DATEN (t/ax/ay), nicht Pixel: die y-Achsen skalieren
    //    mit R (±1,1·ω²·R) und die x-Achse mit der Laufzeit. Eine in Pixeln
    //    eingefrorene Polyline bliebe beim nächsten Parameterwechsel stehen,
    //    während die Achse unter ihr wegskaliert — die Geisterlinie schien sich
    //    dann "mitzuändern". Deshalb wird sie bei jedem Zeichnen aus den
    //    Rohdaten neu auf die AKTUELLE Achse projiziert. (Gleiche Lösung wie in
    //    aspekt_vxvy_zeit.js, nur Datenreihe ax/ay statt vx/vy.)
    const prevLines = {
        single: ge(p + 'graph_prev_line'),
        top: ge(p + 'graph_prev_line_top'),
        bottom: ge(p + 'graph_prev_line_bottom'),
    };
    let prevSeries = null;                // {t:[…], ax:[…], ay:[…]} — komplette Kurven
    function snapshotPrev() {             // inside withStore aufrufen
        prevSeries = store.tData.length
            ? { t: store.tData.slice(), ax: store.axData.slice(), ay: store.ayData.slice() }
            : null;
    }
    function clearPrev() {
        prevSeries = null;
        Object.values(prevLines).forEach(pl => {
            if (pl) { pl.setAttribute('points', ''); pl.setAttribute('visibility', 'hidden'); }
        });
    }
    // Geisterkurven auf die aktuelle Achsenskalierung projizieren. store.graphScale
    // [slot] liefert Plot-Rechteck + Wertebereich genau so, wie drawGraphSlot() die
    // laufenden Kurven zeichnet. Slot -> Datenreihe folgt dem Diagrammtyp.
    function renderPrev() {
        const series = { axt: prevSeries && prevSeries.ax, ayt: prevSeries && prevSeries.ay };
        for (const slot of ['single', 'top', 'bottom']) {
            const pl = prevLines[slot];
            if (!pl) continue;
            const gs = store.graphScale[slot];
            const vals = gs && series[gs.type];
            if (!prevSeries || !gs || !vals) { pl.setAttribute('visibility', 'hidden'); continue; }
            const { plotL, plotT, plotW, plotH, xMin, xMax, yMin, yMax } = gs;
            const xR = (xMax - xMin) || 1, yR = (yMax - yMin) || 1;
            let pts = '';
            for (let i = 0; i < prevSeries.t.length; i++) {
                const t = prevSeries.t[i];
                if (t < xMin || t > xMax) continue;
                const px = plotL + ((t - xMin) / xR) * plotW;
                const py = plotT + plotH - ((vals[i] - yMin) / yR) * plotH;
                pts += `${px.toFixed(1)},${py.toFixed(1)} `;
            }
            pl.setAttribute('points', pts);
            pl.setAttribute('visibility', pts ? 'visible' : 'hidden');
        }
    }

    // -- Eigene Achsen (Pfeil in positive, Fortsetzung in negative Richtung) -----
    function drawAxes() {
        const g = ge(p + 'aspekt_axes');
        if (!g) return;
        const ppm = store.currentPixelsPerMeter;
        const len = Math.min(Math.max(2.0, store.R) * ppm * 1.08, 194);
        const NS = 'http://www.w3.org/2000/svg';
        g.textContent = '';
        const line = (x1, y1, x2, y2, arrow) => {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
            l.setAttribute('class', 'aspekt-axis');
            if (arrow) l.setAttribute('marker-end', `url(#${p}ax_arrow)`);
            g.appendChild(l);
        };
        const label = (x, y, t) => {
            const el = document.createElementNS(NS, 'text');
            el.setAttribute('x', x); el.setAttribute('y', y);
            el.setAttribute('class', 'aspekt-axis-label');
            el.textContent = t;
            g.appendChild(el);
        };
        line(ANIM_CX - len, ANIM_CY, ANIM_CX, ANIM_CY, false);
        line(ANIM_CX, ANIM_CY, ANIM_CX + len, ANIM_CY, true);
        label(ANIM_CX + len + 10, ANIM_CY + 4, 'x');
        line(ANIM_CX, ANIM_CY + len, ANIM_CX, ANIM_CY, false);
        line(ANIM_CX, ANIM_CY, ANIM_CX, ANIM_CY - len, true);
        label(ANIM_CX - 14, ANIM_CY - len - 8, 'y');
    }

    // -- Winkel-Visualisierung (aus 1.41/1.44 übernommen, für Konsistenz
    //    innerhalb Abschnitt 1.4.2 — alle Aspekt-Figuren dort zeigen denselben
    //    durchlaufenen Winkelbogen, auch wenn der Aspekt hier ax/ay statt φ/ω
    //    ist): der AKTUELLE Umlauf wird als Teilbogen (0…φ, volle Opazität,
    //    φ-Label auf der Winkelhalbierenden, Pfeilspitze in Drehrichtung)
    //    gezeichnet; jede bereits vollendete Umdrehung bleibt als verblasster
    //    Vollkreis im Hintergrund stehen (Geisterspur, .aspekt-angle-arc-prev).
    //    Läuft inside withStore.
    function drawAngle(phiDeg) {
        const g = ge(p + 'aspekt_angle');
        if (!g) return;
        g.textContent = '';
        const lbl0 = ge(p + 'angle_label');
        if (phiDeg <= 0.5) { if (lbl0) lbl0.style.visibility = 'hidden'; return; }
        const NS = 'http://www.w3.org/2000/svg';
        const cx = ANIM_CX, cy = ANIM_CY;
        const rArc = Math.min(46, store.R * store.currentPixelsPerMeter * 0.42) * 1.3;
        const revCount = Math.floor(phiDeg / 360);      // vollendete Umdrehungen
        const partial = phiDeg - revCount * 360;        // aktueller Umdrehungswinkel (0…360)

        let curAngle = partial;
        let ghostCount = revCount;
        if (partial <= 0.5 && revCount > 0) { curAngle = 360; ghostCount = revCount - 1; }

        for (let i = 0; i < ghostCount; i++) {
            const ghost = document.createElementNS(NS, 'path');
            ghost.setAttribute('d',
                `M ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx - rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)}`);
            ghost.setAttribute('class', 'aspekt-angle-arc aspekt-angle-arc-prev');
            g.appendChild(ghost);
        }

        const rad = curAngle * Math.PI / 180;
        const arc = document.createElementNS(NS, 'path');
        if (curAngle >= 360 - 0.01) {
            arc.setAttribute('d',
                `M ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx - rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)}`);
        } else {
            // Pfeillaengen-Kopplung (bekannter Fallstrick, s. ARROW_LEN in
            // render.js): die Pfeilspitze (markerUnits=strokeWidth, markerWidth=4,
            // refX=0) ragt ca. 4x Strichstaerke ueber das Pfadende hinaus. Ohne
            // Kuerzung zeigt der Bogen dadurch einen zu GROSSEN Winkel an. Der
            // Pfad wird daher um den Ueberschuss (in Grad, radiusabhaengig)
            // gekuerzt, sodass die SPITZE (nicht das Pfadende) exakt auf curAngle
            // landet -- analog zur Vektor-Verkuerzung.
            const ARC_ARROW_OVERSHOOT_PX = 12;   // ~ 4 (markerWidth) * 3px (Bogen-Strichstaerke bei --kb-lw=1,5)
            const overshootRad = Math.min(rad, ARC_ARROW_OVERSHOOT_PX / rArc);
            const radEnd = rad - overshootRad;
            const x0 = cx + rArc, y0 = cy;
            const x1 = cx + rArc * Math.cos(radEnd), y1 = cy - rArc * Math.sin(radEnd);
            const large = (radEnd * 180 / Math.PI) > 180 ? 1 : 0;
            arc.setAttribute('d', `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 ${large} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
        }
        arc.setAttribute('class', 'aspekt-angle-arc');
        arc.setAttribute('marker-end', `url(#${p}angle_arrow)`);
        g.appendChild(arc);

        const LABEL_TRAIL_DEG = 20;
        const labelRad = rad - (LABEL_TRAIL_DEG * Math.PI / 180);
        const tipX = cx + rArc * Math.cos(labelRad);
        const tipY = cy - rArc * Math.sin(labelRad);
        const rTip = Math.hypot(tipX - cx, tipY - cy) || 1;
        const ux = (tipX - cx) / rTip;
        const uy = (tipY - cy) / rTip;
        const LABEL_RADIAL_GAP = 18;
        const lx = tipX - ux * LABEL_RADIAL_GAP;
        const ly = tipY - uy * LABEL_RADIAL_GAP;
        if (lbl0) lbl0.style.visibility = 'hidden';
        const phiLabel = document.createElementNS(NS, 'text');
        phiLabel.setAttribute('x', lx.toFixed(2));
        phiLabel.setAttribute('y', ly.toFixed(2));
        phiLabel.setAttribute('class', 'aspekt-angle-label');
        phiLabel.textContent = 'φ';
        g.appendChild(phiLabel);
    }

    // -- Zeitreihe auf feste 12 s begrenzen. Der Motor-precompute() nimmt max(4T,10s)
    //    UND rechnet konstantes ω; daher hier eine eigene, α-fähige Variante, die die
    //    store-Arrays selbst füllt (fillLocal) + recalculateAxisLimits nutzt.
    //    Laeuft inside withStore (operiert nur auf dem (Instanz-)store).
    // store-Arrays mit der lokalen α-Physik füllen (Ersatz für extendMotionData).
    function fillLocal(duration) {
        for (let t = TIME_STEP; t <= duration + TIME_STEP; t += TIME_STEP) {
            const ph = localPhi(t), w = localOmega(t), R = store.R;
            const s = Math.sin(ph), c = Math.cos(ph);
            const ax = -R * (alpha * s + w * w * c), ay = R * (alpha * c - w * w * s);
            store.tData.push(t);
            store.xData.push(R * c); store.yData.push(R * s);
            store.vxData.push(-R * w * s); store.vyData.push(R * w * c);
            store.axData.push(ax); store.ayData.push(ay);
            store.vabsData.push(Math.abs(R * w)); store.aabsData.push(Math.hypot(ax, ay));
            store.phitData.push(ph * 180 / Math.PI);
            store.omegaData.push(w);
        }
    }
    function precomputeRange(duration) {
        store.tData = []; store.xData = []; store.yData = [];
        store.vxData = []; store.vyData = []; store.axData = []; store.ayData = [];
        store.vabsData = []; store.aabsData = []; store.phitData = []; store.omegaData = [];
        if (store.R <= 0) { recalculateAxisLimits(); return; }
        fillLocal(duration);
        recalculateAxisLimits();
        // Geisterkurven mit in die y-Achsen einrechnen: sonst läuft die alte Kurve
        // (anderes R/T) oben/unten aus dem Diagramm heraus und der Vergleich bricht ab.
        if (prevSeries && prevSeries.t.length) {
            const amp = arr => Math.max(...arr.map(Math.abs)) * 1.1;
            for (const [key, arr] of [['axt', prevSeries.ax], ['ayt', prevSeries.ay]]) {
                const lim = store.axisLimits[key];
                const need = amp(arr);
                if (lim && need > lim.yMax) { lim.yMax = need; lim.yMin = -need; }
            }
        }
    }

    // -- Beschleunigungs-Vektoren SELBST zeichnen (Motor-Beschleunigung ist AUS).
    //    Grund (didaktisches Kernproblem): der Motor skaliert a mit der FESTEN
    //    aScale (PIXELS_PER_ACCELERATION_UNIT·zoomFactor); |a|=ω²R variiert aber um
    //    Faktor ~30 über den Lauf und ist bei kleinem ω unsichtbar — man müsste
    //    eine bestimmte ω₀/α-Kombination suchen. Hier wird der Vektor pro Frame auf
    //    feste Länge (A_TARGET_FRAC·R·ppm) NORMIERT: |a| -> Ziellänge. Damit ist die
    //    Richtung/Neigung (der α-Effekt) IMMER sichtbar. a_x/a_y UND a_t/a_r nutzen
    //    dieselbe Frame-Skala sc, sodass Projektionen und Zerlegung exakt stimmen
    //    und sich vektoriell zu a addieren. Das echte Anwachsen von |a| zeigen die
    //    Diagramme (updateGraph, unberührt). zoomFactor bleibt der Szenen-Zoom
    //    (skaliert currentPixelsPerMeter) und wird NICHT angefasst. Reuse der
    //    vorhandenen Linien-Elemente (Farben/Marker/Dash aus CSS). Läuft inside
    //    withStore. --------------------------------------------------------------
    const lineA = ge(p + 'acceleration_vector');
    const lineAx = ge(p + 'acceleration_vector_x'), lineAy = ge(p + 'acceleration_vector_y');
    const lineT = ge(p + 'accel_t'), lineR = ge(p + 'accel_r');
    const trLabels = ge(p + 'accel_tr_labels');
    function shortenLine(x1, y1, x2, y2, markerLen) {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
        if (L <= markerLen || L === 0) return null;
        const s = (L - markerLen) / L;
        return { x2: x1 + dx * s, y2: y1 + dy * s };
    }
    const hide = el => { if (el) el.style.visibility = 'hidden'; };
    function setLocalVec(el, x1, y1, x2, y2, markerLen) {
        if (!el) return false;
        const end = shortenLine(x1, y1, x2, y2, markerLen);
        if (!end) { el.style.visibility = 'hidden'; return false; }
        el.setAttribute('x1', x1); el.setAttribute('y1', y1);
        el.setAttribute('x2', end.x2); el.setAttribute('y2', end.y2);
        el.style.visibility = 'visible';
        return true;
    }
    function drawAccel(t) {
        if (trLabels) trLabels.textContent = '';
        if (!sceneCenters) { [lineA, lineAx, lineAy, lineT, lineR].forEach(hide); return; }
        const { cx, cy } = sceneCenters;
        const ppm = store.currentPixelsPerMeter;
        const ph = localPhi(t), w = localOmega(t), R = store.R;
        const px = cx + R * Math.cos(ph) * ppm, py = cy - R * Math.sin(ph) * ppm;
        const a = myAcc(t);
        const aMag = Math.hypot(a.x, a.y) || 1;
        const sc = (A_TARGET_FRAC * R * ppm) / aMag;    // Normierung: |a| -> feste Ziellänge
        const arrScale = store.arrowLenScale || 1;
        const mMain = ARROW_LEN_MAIN * arrScale, mComp = ARROW_LEN_COMP * arrScale;
        // Gesamt-Beschleunigung a (immer sichtbar)
        setLocalVec(lineA, px, py, px + a.x * sc, py - a.y * sc, mMain);
        // Kartesische Komponenten a_x/a_y (optional) — Projektionen der (normierten) a
        if (showComponents) {
            const axe = px + a.x * sc, aye = py - a.y * sc;
            setLocalVec(lineAx, px, py, axe, py, mComp);
            setLocalVec(lineAy, axe, py, axe, aye, mComp);
        } else { hide(lineAx); hide(lineAy); }
        // Tangential/Radial a_t/a_r (optional) — gleiche Frame-Skala sc
        if (showTR) {
            const atx = -alpha * R * Math.sin(ph), aty = alpha * R * Math.cos(ph);
            const arx = -w * w * R * Math.cos(ph), ary = -w * w * R * Math.sin(ph);
            const txe = px + atx * sc, tye = py - aty * sc;
            const rxe = px + arx * sc, rye = py - ary * sc;
            const tVis = setLocalVec(lineT, px, py, txe, tye, mMain);
            const rVis = setLocalVec(lineR, px, py, rxe, rye, mMain);
            const NS = 'http://www.w3.org/2000/svg';
            const addLabel = (visible, ex, ey, txt, cls) => {
                if (!visible || !trLabels) return;
                const el = document.createElementNS(NS, 'text');
                el.setAttribute('x', (ex + 6).toFixed(1)); el.setAttribute('y', ey.toFixed(1));
                el.setAttribute('class', 'accel-tr-label ' + cls);
                el.textContent = txt;
                trLabels.appendChild(el);
            };
            addLabel(tVis, txe, tye, 'aₜ', 'lbl-at');
            addLabel(rVis, rxe, rye, 'aᵣ', 'lbl-ar');
        } else { hide(lineT); hide(lineR); }
    }

    // -- Zeichnen an der aktuellen Zeit (kein Rebuild der Daten). ---------------
    function draw(t) {
        curT = t;
        updateScene(t, myPos(t), myVel(t), myAcc(t), sceneCenters);
        updateGraph(t);
        renderPrev();     // nach updateGraph: store.graphScale ist dann aktuell
        drawAccel(t);     // eigene, normierte Beschleunigungs-Vektoren (Motor-a ist aus)
        drawAngle(localPhi(t) * 180 / Math.PI);   // wächst mit φ(t) (inkl. α)
    }

    // -- Analyse-/Slider-Werte (deutsches Dezimalkomma wie die Vorlage). --------
    //    Laeuft inside withStore (liest store + lokale α-Physik).
    function updateLabels(t) {
        const n = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';
        ge(p + 'ak_t_out').textContent = n(t, 2) + ' s';
        const td = ge(p + 'time_display'); if (td) td.textContent = `t = ${n(t, 2)} s`;
        ge(p + 'ak_r_out').textContent = n(store.R, 2) + ' m';
        ge(p + 'ak_omega0_out').textContent = n(omega0, 2) + ' rad/s';
        ge(p + 'ak_alpha_out').textContent = n(alpha, 2) + ' rad/s²';
        const vt = ge(p + 'ak_val_t');
        if (vt) {
            const phiDeg = ((localPhi(t) * 180 / Math.PI) % 360 + 360) % 360;
            const w = localOmega(t), a = myAcc(t), R = store.R;
            vt.textContent = n(t, 2) + ' s';
            ge(p + 'ak_val_phi').textContent = n(phiDeg, 0) + ' °';
            ge(p + 'ak_val_r').textContent = n(R, 2) + ' m';
            ge(p + 'ak_val_omega').textContent = n(w, 2) + ' rad/s';
            ge(p + 'ak_val_alpha').textContent = n(alpha, 2) + ' rad/s²';
            ge(p + 'ak_val_ax').textContent = n(a.x, 2) + ' m/s²';
            ge(p + 'ak_val_ay').textContent = n(a.y, 2) + ' m/s²';
            ge(p + 'ak_val_aabs').textContent = n(Math.hypot(a.x, a.y), 2) + ' m/s²';
            ge(p + 'ak_val_at').textContent = n(alpha * R, 2) + ' m/s²';        // a_t = α·R
            ge(p + 'ak_val_ar').textContent = n(w * w * R, 2) + ' m/s²';        // a_r = ω²·R
        }
    }

    // -- Rebuild: R/T geaendert -> Flags + Parameter, Datenreihe neu, Szene neu
    //    skalieren. Alle Motor-Aufrufe inside withStore (Singleton = diese Instanz).
    //    `paramChange` = der Aufruf kommt von einem Regler, der die KURVENFORM
    //    ändert (R oder T): dann wird die eben gezeigte Kurve — falls "Letzte Kurve
    //    behalten" aktiv ist — als Geisterkurve eingefroren und die Laufzeit t
    //    springt auf 0 zurück, damit der neue Verlauf von vorn über dem alten
    //    entsteht und wirklich vergleichbar ist (wie in den Stand-alone-Sims).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                isStacked: true, graphType1: 'axt', graphType2: 'ayt',
                showPositionVector: true, showPositionComponents: false, showTrajectory: true,
                showVelocityVector: false, showVelocityComponents: false,
                // Motor-Beschleunigung AUS — a/a_x/a_y/a_t/a_r zeichnet drawAccel()
                // selbst mit adaptiver Skala (s. dort). Sonst wäre a bei kleinem ω
                // unsichtbar (didaktisches Kernproblem).
                showAccelerationVector: false, showAccelerationComponents: false,
                isDigitalDisplay: false,
                // Vektoren ×1,5 dicker (Strich + Spitze mit­skalierend, s. CSS +
                // strokeWidth-Marker): Pfeil-Länge mit­skalieren, sonst landet die
                // Spitze bei dickerem Schaft auf altem, zu kurz gekürztem Platz.
                arrowLenScale: 1.5,
                graphFontScale: 1.5,  // Graph-Schrift ×1,5 (--kb-fs) -> render.js skaliert Padding/Label-Abstand
            });
            store.R = parseFloat(ak_r.value);
            omega0 = parseFloat(ak_omega0.value);
            alpha = parseFloat(ak_alpha.value);
            store.phi0Deg = 0;
            // Nominal-ω für evtl. Motor-Lesezugriffe (Achsen anderer, hier ungenutzter
            // Diagrammtypen). Die axt/ayt-Achsen kommen datengetrieben aus fillLocal.
            store.omega = omega0;
            store.omegaDeg = omega0 * 180 / Math.PI;
            store.T = Infinity;                // kein recomputeDerived (setzt T aus ω) —
                                               // T=∞ => updateScene zeichnet den VOLLEN Bahnspur-Pfad
            precomputeRange(T_AUTO);           // fest 0 … 12 s (Auto-Stopp)
            if (curT > T_AUTO) curT = T_AUTO;
            ak_t.max = T_AUTO.toFixed(3);
            ak_t.value = curT.toFixed(3);
            sceneCenters = setupScene();       // Neuskalierung bei R-Aenderung (Zoom, Scheibe)
            store.T = Infinity;                // setupScene könnte T anfassen — nach ihm sichern
            // setupScene() ruft drawCoordSystem() der Sim -> eigene Achsen + x/y-Labels
            // in animation_coord_system. Leeren, sonst doppelt beschriftet.
            const cs = ge(p + 'animation_coord_system'); if (cs) cs.textContent = '';
            drawAxes();
            // Stoppuhr (analog, nach Vorlage): Skalenstriche zeichnen und oben rechts
            // in der Szene platzieren (setupScene setzt scale 0.8 — hier kleiner,
            // damit die Uhr in die verkleinerte Szene passt). Einen Hauch kleiner
            // (0,71 -> 0,66) UND einen Hauch nach links (205 -> 190), damit sie nicht
            // minimal mit dem rechts daneben liegenden Diagramm kollidiert.
            drawStopwatchMarks();
            drawSubdialMarks();
            const sw = ge(p + 'stopwatch');
            if (sw) sw.setAttribute('transform', 'translate(190, -10) scale(0.66)');
            draw(curT);
            updateLabels(curT);
        });
    }

    function onInput(e) {
        if (e.target === ak_t) {
            const t = parseFloat(ak_t.value);
            rt.withStore(() => { draw(t); updateLabels(t); });
            return;
        }
        // Kurvenformender Regler (R/ω₀/α): genau EIN Schnappschuss pro Zieh-Geste
        // (ein <input type=range> feuert ein input-Event PRO Zwischenwert; das
        // change-Event beim Loslassen beendet die Geste — Fallstrick #18). Dann
        // rebuild mit paramChange (setzt t auf 0 zurück, s. rebuild).
        if (!paramGesture) {
            paramGesture = true;
            if (keepPrev) rt.withStore(snapshotPrev);
        }
        rebuild(true);
    }
    let paramGesture = false;
    [ak_r, ak_omega0, ak_alpha].forEach(inp => inp.addEventListener('change', () => { paramGesture = false; }));

    // -- Automatischer Ablauf (Sim-Zeit 0 … 12 s, Slow-Mo via Tempo-Pills, Auto-
    //    Stopp am Ende — kein Umbrechen). Pro Instanz im Closure; Knoepfe/Pills
    //    haengen direkt am Container (kein data-action — sie brauchen Instanz-
    //    Zustand, wie die Slider).
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
            if (curT >= T_AUTO) curT = T_AUTO;  // Auto-Stopp nach 12 s (kein Umbrechen)
            ak_t.value = curT.toFixed(3);
            draw(curT);
            updateLabels(curT);
            if (curT >= T_AUTO) stop();
        });
        if (playing) rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (playing) return;
      // Vergleichslinie: am Ende angelangt -> die gerade fertigen Kurven vor
      // dem Reset als Ghost einfrieren (nur bei echtem Neudurchlauf).
      // snapshotPrev() liest store -> muss auf DIESER Instanz laufen.
      if (keepPrev && isAtAutoStopEnd(curT, T_AUTO)) rt.withStore(snapshotPrev);
      // Einheitliches Auto-Stopp-Verhalten: Play nach Ende startet neu.
      resetOnPlayAfterAutoStop(curT, T_AUTO, reset);
      playing = true;
      lastTs = 0;
      rafId = requestAnimationFrame(frame);
    }
    function stop()  { playing = false; if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId); rafId = null; }
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

    if (ak_keep) ak_keep.addEventListener('change', () => {
        keepPrev = ak_keep.checked;
        if (!keepPrev) clearPrev();
    });

    // Komponentenzerlegung in der Szene (optional, Nutzervorgabe): schaltet
    // store.showAccelerationComponents — der Motor zeichnet dann a_x/a_y als
    // Projektionen auf die Achsen. draw() wertet das Flag beim Zeichnen aus.
    if (ak_components) ak_components.addEventListener('change', () => {
        showComponents = ak_components.checked;   // a_x/a_y zeichnet drawAccel() selbst
        rt.withStore(() => draw(curT));
    });

    // Tangential/Radial-Zerlegung (a_t/a_r) — selbst gezeichnet, kein Motor-Flag.
    if (ak_tr) ak_tr.addEventListener('change', () => {
        showTR = ak_tr.checked;
        rt.withStore(() => draw(curT));
    });

    // Einklappbare Panel-Abschnitte (Nutzervorgabe: die Leiste wird zu lang). Wie
    // die Vorlagen-Sim (kreisbewegung/ui.js): Klick auf den Abschnitts-Kopf
    // schaltet .collapsed; das CSS blendet die Geschwister nach dem Button aus.
    scene.querySelectorAll('.aspekt-panel-left .panel-section.collapsible > .panel-label').forEach(btn => {
        btn.addEventListener('click', () => {
            const collapsed = btn.parentElement.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });
    });

    [ak_t, ak_r, ak_omega0, ak_alpha].forEach(inp => inp.addEventListener('input', onInput));
    rebuild();

    // Beim Oeffnen/Schliessen der Lupe sofort neu zeichnen: so greift der
    // schmal+Zoom-spezifische Diagramm-Layout-Switch ohne weitere Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => {
      rt.withStore(() => {
        draw(curT);
        updateLabels(curT);
      });
    });

    // -- Graph-Hover (nur im Zoom/Overlay) — wie die Stand-alone-Sim: ueber dem
    //    Diagramm eine vertikale Linie + Punkt + Tooltip mit dem Wert an der
    //    Mausposition. Die Figur nutzt den stacked Modus (a_x(t) oben, a_y(t)
    //    unten), also die top-/bottom-Hit-Rects. Bewusst NUR in der Lupe aktiv
    //    (onMove-Gate auf .aspekt-im-overlay) — der Lese-Modus bleibt ungestoert.
    //    Die Motor-Funktion updateGraphHover liest store.graphScale/hover* der
    //    Instanz -> inside withStore aufrufen.
    ['top', 'bottom'].forEach(slot => {
        const hit = ge(p + 'graph_hit_rect_' + slot);
        if (!hit) return;
        attachGraphHover(hit, {
            onMove: (x) => {
                if (!fig.classList.contains('aspekt-im-overlay')) {
                    rt.withStore(() => updateGraphHover(slot, null));
                    return;
                }
                rt.withStore(() => updateGraphHover(slot, x));
            },
            onLeave: () => rt.withStore(() => updateGraphHover(slot, null)),
        });
    });
}