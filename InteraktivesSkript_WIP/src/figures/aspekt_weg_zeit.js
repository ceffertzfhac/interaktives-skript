// aspekt_weg_zeit.js — interaktive Aspekt-Figur zu Abbildung 1.39 (1.4.2
// „Die Geschwindigkeit …", Weg-Zeit-Diagramm / x,y-Diagramm). Zeigt die beiden
// Komponenten-Zeit-Diagramme x(t) (oben/links) und y(t) (unten/rechts) ueber
// drei Perioden (0 … 12 s) sowie die Kreisbahn-Szene mit Ortsvektor r und
// dessen Komponenten rx/ry — genau die Projektionen, deren Zeitverlauf die
// Diagramme zeigen.
// Regler: Zeit t (0 … 12 s), Radius R, Periodendauer T (→ ω = 2π/T).
//
// TECHNIK: kein eigener Zeichencode. Der Motor der grossen Kreisbewegungs-
// Simulation (src/figures/kreisbewegung/) zeichnet Szene (updateScene) UND
// Diagramme (updateGraph), feature-gated auf den Orts-Aspekt. Stacked-Modus
// mit graphType1='xt' / graphType2='yt'. Der Motor ist zeit-/ω-getrieben
// (angleRad(t)=φ0+ω·t); der t-Regler steuert direkt die Pseudo-Zeit, die
// precompute()-Datenreihe wird auf feste 12 s begrenzt (Auto-Stopp; bei Vorgabe
// T=4 s = 3 Perioden), updateScene()+updateGraph() zeichnen daraus Punkt,
// Vektoren, Bahnspur, die wachsenden Kurven UND die analoge Stoppuhr — die
// optionale Anim-Schleife faehrt die Zeit von 0 bis 12 s (Slow-Mo via Tempo-
// Pills).
//
// OPTIK: Farb-Tokens und Panel-/Slider-/Legenden-Klassen VERBATIM aus der
// portierten styles.css (ueber aspekt_kreisbahn.css fuer .aspekt-figur); die
// Graph-Struktur (graph-bg/axis-line/…) liegt zentral in aspekt_kreisbahn.css
// (inkl. ×1,5-Skalierung via --kb-lw/--kb-fs), hier nur die Datenlinien-FARBEN
// (x=rx, y=ry) + die Vergleichslinie. Die Pfeil-Geometrie ist die der Vorlage
// (Marker markerUnits=userSpaceOnUse mit fester Laenge = ARROW_LEN), damit
// render.js' Verkuerzung die Spitze exakt auf den Zielpunkt setzt.
//
// LAYOUT: stackedDualGeom() des Motors stellt die beiden Diagramme UEBEREINANDER
// dar (Portrait, 700×830) — x(t) oben, y(t) unten, passend zur statischen Druck-
// Vorlage. Im Normal-/Schmal-Modus steht die Kreisbahn-Szene UEBER dem
// gestapelten Diagramm (Saeule); im Breit- und Zoom-Modus rueckt sie NEBEN das
// Diagramm (Zeile, s. CSS), damit beides nebeneinander auf den Bildschirm passt.
//
// ABLAUF: neben dem Zeit-Regler Start-/Stop-/Reset-Knoepfe (Pictogramme) sowie
// Tempo-Pills (1× … ⅛×, Slow-Mo analog zur Vorlage) fuer den automatischen
// Ablauf. Der laeuft in Sim-Zeit, stoppt nach festen 12 s (3 Perioden bei T=4 s)
// und wiederholt nicht. Pro Instanz im Closure; Knoepfe/Pills haengen direkt am
// Container (kein data-action — sie brauchen Instanz-Zustand, wie die Slider).
// Zusaetzlich Toggle „Letzte Kurve behalten" (Vergleichslinie, s. snapshotPrev).
//
// PER-INSTANZ-ISOLATION: der Motor-Store ist ein Modul-Singleton. Diese Figur
// holt sich ueber createRuntime() einen EIGENEN Prefix (kb<n>_) + einen
// EIGENEN storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside
// rt.withStore(...), das den Singleton nur fuer die Dauer des Zeichnens auf
// diese Instanz schaltet und danach restauriert. So sind beliebig viele
// Aspekt-Figuren (auch auf derselben Seite) vollstaendig unabhaengig.

import { store } from './kreisbewegung/state.js';
import { recomputeDerived, position, velocity, acceleration,
         extendMotionData, recalculateAxisLimits } from './kreisbewegung/physics.js';
import { setupScene, updateScene, updateGraph, updateGraphHover,
         drawStopwatchMarks, drawSubdialMarks } from './kreisbewegung/render.js';
import { R_MIN, R_MAX } from './kreisbewegung/constants.js';
import { createRuntime } from './kreisbewegung/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

const T_AUTO = 12;            // fester Auto-Stopp nach 12 s — bei Vorgabe T=4 s
                              // sind das drei Perioden (Bereich 0…12 s, wie 1.41)
const T_MIN = 2, T_MAX = 8, T_DEFAULT = 4;
const T_STEP = 0.1;
// ω = 2π/T, bidirektional an den T-Regler gekoppelt (P-AF-1). Der ω-Bereich ist der
// reziproke des T-Bereichs: T_MAX -> kleinstes ω, T_MIN -> größtes ω.
const OMEGA_MIN = 2 * Math.PI / T_MAX, OMEGA_MAX = 2 * Math.PI / T_MIN,
      OMEGA_DEFAULT = 2 * Math.PI / T_DEFAULT, OMEGA_STEP = 0.01;
const R_DEFAULT = 1.5;
const ANIM_CX = 225, ANIM_CY = 260;   // = ANIM_CX / ANIM_CY_STACK (render.js)

// -- Szene: exakt die Vorlagen-Geometrie (wie aspekt_kreisbahn, ohne Winkel-
//    bogen — der Aspekt hier ist die Zeit, nicht der Winkel). Marker mit
//    fester Laenge (s. aspekt_kreisbahn.js fuer die Herleitung). Versteckte
//    Stubs (v/a), die updateScene() anfasst; die analoge Stoppuhr wird nach
//    Vorlage EINGEBLENDET (Skalenstriche in rebuild(), Zeiger pro Frame via
//    updateScene). Die kb_-IDs werden pro Instanz durch den Prefix ersetzt.
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 0 450 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <!-- Pfeilspitzen ×1,5 vergroessert (Szenen-Strichstärken skalieren via
         --kb-lw ×1,5), spitzen-erhaltend via refX = markerWidth' − ARROW_LEN
         (r: 18.75−12.5=6.25; rx/ry: 15−10=5; ax: 13.5−6=7.5). Begründung im
         Kommentarblock in aspekt_kreisbahn.js. -->
    <marker id="kb_ax_arrow"     markerUnits="userSpaceOnUse" markerWidth="13.5" markerHeight="10.5"  refX="7.5" refY="5.25"  orient="auto"><polygon points="0 0, 13.5 5.25, 0 10.5"/></marker>
    <marker id="kb_arrowhead-r"  markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="kb_arrowhead-rx" markerUnits="userSpaceOnUse" markerWidth="15"   markerHeight="10.5"  refX="5"    refY="5.25"  orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
    <marker id="kb_arrowhead-ry" markerUnits="userSpaceOnUse" markerWidth="15"   markerHeight="10.5"  refX="5"    refY="5.25"  orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
  </defs>
  <g id="kb_animation_group">
    <g id="kb_aspekt_axes"></g>
    <g id="kb_animation_coord_system"></g>
    <circle id="kb_disk" cx="225" cy="260" r="100" fill="none" stroke-width="0" opacity="0.06"/>
    <path id="kb_trajectory_path" fill="none" stroke-width="2" stroke-dasharray="4,4" d=""/>
    <circle id="kb_point" cx="325" cy="260" r="8" stroke-width="1"/>
    <text id="kb_zoom_text_display" x="12" y="20" class="zoom-text"></text>
    <text id="kb_time_display" x="12" y="470" class="aspekt-time-text"></text>

    <line id="kb_position_vector"   stroke-width="2.5" marker-end="url(#kb_arrowhead-r)"  visibility="hidden"/>
    <line id="kb_position_vector_x" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-rx)" visibility="hidden"/>
    <line id="kb_position_vector_y" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ry)" visibility="hidden"/>

    <line id="kb_velocity_vector"/><line id="kb_velocity_vector_x"/><line id="kb_velocity_vector_y"/>
    <line id="kb_acceleration_vector"/><line id="kb_acceleration_vector_x"/><line id="kb_acceleration_vector_y"/>

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

// -- Linkes Bedien-Panel (Parameter + Legende) -- Klassen wie die Stand-alone.
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="0" max="12" step="0.05" value="12">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
    <div class="slider-label">Radius \\(R\\)</div>
    <div class="slider-row">
      <input id="ak_r" type="range" min="${R_MIN}" max="${R_MAX}" step="0.05" value="${R_DEFAULT}">
      <span class="slider-val" id="ak_r_out"></span>
    </div>
    <div class="slider-label">Periodendauer \\(T\\)</div>
    <div class="slider-row">
      <input id="ak_T" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP}" value="${T_DEFAULT}">
      <span class="slider-val" id="ak_T_out"></span>
    </div>
    <div class="slider-label">Winkelgeschw. \\(\\omega = \\tfrac{2\\pi}{T}\\)</div>
    <div class="slider-row">
      <input id="ak_omega" type="range" min="${OMEGA_MIN}" max="${OMEGA_MAX}" step="${OMEGA_STEP}" value="${OMEGA_DEFAULT}">
      <span class="slider-val" id="ak_omega_out"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Tempo</div>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="ak_speed" value="1.0" checked><span>1×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.5"><span>½×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.25"><span>¼×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="0.125"><span>⅛×</span></label>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="r"></div>   <div class="legend-label">Ortsvektor \\(\\vec{r}\\)</div>
      <div class="legend-swatch" data-c="rx"></div>  <div class="legend-label">Komponente \\(r_x = x(t)\\)</div>
      <div class="legend-swatch" data-c="ry"></div>  <div class="legend-label">Komponente \\(r_y = y(t)\\)</div>
      <div class="legend-swatch" data-c="traj"></div><div class="legend-label">durchlaufener Bogen</div>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Vergleich</div>
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
        <div class="analysis-cell key">Periodendauer \\(T\\)</div>    <div class="analysis-cell val" id="ak_val_T"></div>
        <div class="analysis-cell key">Position \\(x\\)</div>         <div class="analysis-cell val" id="ak_val_x"></div>
        <div class="analysis-cell key">Position \\(y\\)</div>         <div class="analysis-cell val" id="ak_val_y"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Ort und Winkel auf der Kreisbahn:</div>
        <div>\\[\\vec{r}(t) = \\begin{pmatrix} R\\cos(\\varphi(t)) \\\\ R\\sin(\\varphi(t)) \\end{pmatrix}\\]</div>
        <div>\\[\\varphi(t) = \\tfrac{2\\pi}{T}\\,t\\]</div>
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

// ── Factory: baut EINE Weg-Zeit-Aspekt-Figur mit eigener Motor-Instanz ────────
export function buildWegZeitFig(fig) {
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

    // Lupe-Button: oben rechts in der HAUPTSPALTE (Grid-Spalte 2 des .aspekt-body),
    // deren rechte Kante die Trennlinie zur Analyse-Leiste ist — Analyse sichtbar
    // = Lupe links daneben, Analyse aus = Lupe in der Figuren-Ecke.
    //
    // Verankert wird sie in der Ablaufleiste (.aspekt-runbar), NICHT am oberen
    // Rand von .aspekt-main: die Leiste ist position:sticky und bleibt beim
    // Scrollen oben stehen, der Rand von .aspekt-main dagegen wandert nach oben
    // weg und verschwindet unter der klebenden Seiten-Kopfleiste — die Lupe war
    // dort beim Lesen schlicht nicht zu sehen. In der Leiste klebt sie mit.
    // 1.38 hat keine Ablaufleiste -> Rückfall auf .aspekt-scene (dort war die
    // Position schon richtig).
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
    const ak_t = ge(p + 'ak_t'), ak_r = ge(p + 'ak_r'), ak_T = ge(p + 'ak_T'), ak_omega = ge(p + 'ak_omega');
    const ak_keep = ge(p + 'ak_keep');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let sceneCenters = null;
    let curT = T_AUTO;                    // Initial: volle 12 s (Vorgabe T=4 s -> 3 Perioden)
    let speedFactor = 1.0;
    let keepPrev = false;                 // Vergleichslinie: letzte Kurve bei Neudurchlauf behalten

    // ω↔T-Kopplung (P-AF-1): ω = 2π/T, beide Regler bidirektional gekoppelt. T ist
    // die Wahrheit (gequantelt auf T_STEP); ω gezogen -> T abgeleitet+gesetzt,
    // T/R gezogen -> ω-Schieber nachgeführt.
    const omegaOf = T => 2 * Math.PI / T;
    const snapT = v => Math.round(v / T_STEP) * T_STEP;

    // -- Vergleichslinie (Ghost): die gerade fertigen x(t)/y(t)-Kurven beim Start
    //    eines Neudurchlaufs einfrieren (gestrichelt + dünner, s. aspekt_weg_zeit.
    //    css) und über dem neuen Durchlauf stehen lassen. Nur die jeweils letzte
    //    Kurve (keine Ansammlung). Weg-Zeit läuft gestapelt -> top + bottom; der
    //    Einzel-Slot wird mitgeführt, falls isStacked mal aus ist.
    //
    //    Gespeichert werden DATEN (t/x/y), nicht Pixel: die y-Achsen skalieren mit
    //    R (±1,1·R) und die x-Achse mit der Laufzeit. Eine in Pixeln eingefrorene
    //    Polyline bliebe beim nächsten Parameterwechsel stehen, während die Achse
    //    unter ihr wegskaliert — die Geisterlinie schien sich dann "mitzuändern".
    //    Deshalb wird sie bei jedem Zeichnen aus den Rohdaten neu auf die AKTUELLE
    //    Achse projiziert. (Gleiche Lösung wie in aspekt_winkel_zeit.js.)
    const prevLines = {
        single: ge(p + 'graph_prev_line'),
        top: ge(p + 'graph_prev_line_top'),
        bottom: ge(p + 'graph_prev_line_bottom'),
    };
    let prevSeries = null;                // {t:[…], x:[…], y:[…]} — komplette Kurven
    function snapshotPrev() {             // inside withStore aufrufen
        prevSeries = store.tData.length
            ? { t: store.tData.slice(), x: store.xData.slice(), y: store.yData.slice() }
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
        const series = { xt: prevSeries && prevSeries.x, yt: prevSeries && prevSeries.y };
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

    // -- Zeitreihe auf feste 12 s begrenzen (3 Perioden bei T=4 s, wie 1.41).
    //    precompute() des Motors nimmt max(4T, 10s); daher hier eine eigene,
    //    schmale Variante, die nur extendMotionData + recalculateAxisLimits nutzt.
    //    Laeuft inside withStore (operiert nur auf dem (Instanz-)store).
    function precomputeRange(duration) {
        store.tData = []; store.xData = []; store.yData = [];
        store.vxData = []; store.vyData = []; store.axData = []; store.ayData = [];
        store.vabsData = []; store.aabsData = []; store.phitData = [];
        if (store.R <= 0) { recalculateAxisLimits(); return; }
        extendMotionData(duration);
        recalculateAxisLimits();
        // Geisterkurven mit in die y-Achsen einrechnen: sonst läuft die alte Kurve
        // (größeres R) oben/unten aus dem Diagramm heraus und der Vergleich bricht ab.
        if (prevSeries && prevSeries.t.length) {
            const amp = arr => Math.max(...arr.map(Math.abs)) * 1.1;
            for (const [key, arr] of [['xt', prevSeries.x], ['yt', prevSeries.y]]) {
                const lim = store.axisLimits[key];
                const need = amp(arr);
                if (lim && need > lim.yMax) { lim.yMax = need; lim.yMin = -need; }
            }
        }
    }

    // -- Zeichnen an der aktuellen Zeit (kein Rebuild der Daten). ---------------
    function draw(t) {
        curT = t;
        updateScene(t, position(t), velocity(t), acceleration(t), sceneCenters);
        updateGraph(t);
        renderPrev();   // nach updateGraph: store.graphScale ist dann aktuell
    }

    // -- Analyse-/Slider-Werte (deutsches Dezimalkomma wie die Vorlage). --------
    //    Laeuft inside withStore (liest store + position(t)).
    function updateLabels(t, T) {
        const n = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';
        ge(p + 'ak_t_out').textContent = n(t, 2) + ' s';
        const td = ge(p + 'time_display'); if (td) td.textContent = `t = ${n(t, 2)} s`;
        ge(p + 'ak_r_out').textContent = n(store.R, 2) + ' m';
        ge(p + 'ak_T_out').textContent = n(T, 1) + ' s';
        ge(p + 'ak_omega_out').textContent = n(omegaOf(T), 3) + ' rad/s';
        const vt = ge(p + 'ak_val_t');
        if (vt) {
            const phiDeg = ((store.omega * t) * 180 / Math.PI) % 360;
            vt.textContent = n(t, 2) + ' s';
            ge(p + 'ak_val_phi').textContent = n(phiDeg, 0) + ' °';
            ge(p + 'ak_val_r').textContent = n(store.R, 2) + ' m';
            ge(p + 'ak_val_T').textContent = n(T, 2) + ' s';
            const pos = position(t);
            ge(p + 'ak_val_x').textContent = n(pos.x, 2) + ' m';
            ge(p + 'ak_val_y').textContent = n(pos.y, 2) + ' m';
        }
    }

    // -- Rebuild: R/T geaendert -> Flags + Parameter, Datenreihe neu, Szene neu
    //    skalieren. Alle Motor-Aufrufe inside withStore (Singleton = diese Instanz).
    //    `paramChange` = der Aufruf kommt von einem Regler, der die KURVENFORM
    //    ändert (R oder T): dann wird die eben gezeigte Kurve — falls "Letzte Kurve
    //    behalten" aktiv ist — als Geisterkurve eingefroren und die Laufzeit t
    //    springt auf 0 zurück, damit der neue Verlauf von vorn über dem alten
    //    entsteht und wirklich vergleichbar ist (wie in den Stand-alone-Sims,
    //    z. B. schiefer Wurf).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                isStacked: true, graphType1: 'xt', graphType2: 'yt',
                showPositionVector: true, showPositionComponents: true, showTrajectory: true,
                showVelocityVector: false, showVelocityComponents: false,
                showAccelerationVector: false, showAccelerationComponents: false,
                isDigitalDisplay: false,
                graphFontScale: 1.5,  // Graph-Schrift ×1,5 (--kb-fs) -> render.js skaliert Padding/Label-Abstand
            });
            store.R = parseFloat(ak_r.value);
            const T = parseFloat(ak_T.value);
            store.phi0Deg = 0;
            store.omegaDeg = 360 / T;          // ω [deg/s] = 360 / T  (T = 2π/ω)
            recomputeDerived();
            precomputeRange(T_AUTO);          // fest 0 … 12 s (Auto-Stopp), nicht 1,5 T
            if (curT > T_AUTO) curT = T_AUTO;
            ak_t.max = T_AUTO.toFixed(3);
            ak_t.value = curT.toFixed(3);
            sceneCenters = setupScene();       // Neuskalierung bei R-Aenderung (Zoom, Scheibe)
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
            updateLabels(curT, T);
        });
    }

    function onInput(e) {
        // ω-Schieber gezogen: T = 2π/ω ableiten, auf T_STEP quantisieren und auf
        // [T_MIN, T_MAX] beschränken, dann den T-Schieber mitführen. Kein Snap-Back
        // auf den ω-Schieber während des Ziehens — sonst springt er unter dem Zeiger.
        if (e.target === ak_omega) {
            const T = Math.min(T_MAX, Math.max(T_MIN, snapT(2 * Math.PI / parseFloat(ak_omega.value))));
            ak_T.value = String(T);
        }
        if (e.target === ak_t) {
            const t = parseFloat(ak_t.value);
            const T = parseFloat(ak_T.value);
            rt.withStore(() => { draw(t); updateLabels(t, T); });
            return;
        }
        // Genau EIN Schnappschuss pro Zieh-Geste: ein <input type=range>
        // feuert beim Ziehen ein input-Event PRO Zwischenwert. Wurde bei
        // jedem davon eingefroren, war die "letzte Kurve" am Ende die des
        // vorletzten Zwischenwerts — praktisch dieselbe Kurve wie die neue,
        // nur die Achsenskalierung sah anders aus. Jetzt wird die Kurve
        // eingefroren, die VOR dem Ziehen zu sehen war; das change-Event
        // (Loslassen) beendet die Geste.
        if (!paramGesture) {
            paramGesture = true;
            if (keepPrev) rt.withStore(snapshotPrev);
        }
        rebuild(true);
        // War nicht der ω-Schieber die Quelle (R- oder T-Zug) -> ω-Schieber
        // nachführen, damit beide gekoppelt sichtbar bleiben.
        if (e.target !== ak_omega) {
            ak_omega.value = String(omegaOf(parseFloat(ak_T.value)));
        }
    }
    let paramGesture = false;
    [ak_r, ak_T, ak_omega].forEach(inp => inp.addEventListener('change', () => { paramGesture = false; }));

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
            updateLabels(curT, parseFloat(ak_T.value));
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
            updateLabels(0, parseFloat(ak_T.value));
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

    [ak_t, ak_r, ak_T, ak_omega].forEach(inp => inp.addEventListener('input', onInput));
    rebuild();

    // Beim Oeffnen/Schliessen der Lupe sofort neu zeichnen: so greift der
    // schmal+Zoom-spezifische Diagramm-Layout-Switch ohne weitere Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => {
      rt.withStore(() => {
        draw(curT);
        updateLabels(curT, parseFloat(ak_T.value));
      });
    });

    // -- Graph-Hover (nur im Zoom/Overlay) — wie die Stand-alone-Sim: ueber dem
    //    Diagramm eine vertikale Linie + Punkt + Tooltip mit dem Wert an der
    //    Mausposition. Die Figur nutzt den stacked Modus (x(t) oben, y(t)
    //    unten), also die top-/bottom-Hit-Rects. Bewusst NUR in der Lupe aktiv
    //    (onMove-Gate auf .aspekt-im-overlay) — der Lese-Modus bleibt ungestoert;
    //    das CSS setzt die Hit-Rects ausserhalb des Overlays auf pointer-events:
    //    none. Die Motor-Funktion updateGraphHover liest store.graphScale/
    //    hoverT/DOM.hover* der Instanz -> inside withStore aufrufen.
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