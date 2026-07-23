// aspekt_winkel_zeit.js — interaktive Aspekt-Figur zu Abbildung 1.41 (1.4.2
// „Die Geschwindigkeit …", Winkel-Zeit-Diagramm). Zeigt die Kreisbahn-Szene
// mit Ortsvektor r, durchlaufenem Bogen und dem Winkel φ (Bogen + φ-Label) sowie
// rechts daneben das Winkel-Zeit-Diagramm φ(t) — der kumulierte Winkel wächst
// gleichmäßig mit der Zeit (Steigung = ω), über drei Perioden (0 … 12 s).
// Regler: Zeit t (0 … 12 s), Periodendauer T (→ ω = 2π/T). R ist fest (1,5 m),
// da der Radius die Winkelkurve nicht beeinflusst — nur ω bestimmt ihre Steigung.
//
// TECHNIK: kein eigener Zeichencode außer dem Winkelbogen (an aspekt_kreisbahn
// angelehnt). Der Motor der großen Kreisbewegungs-Simulation
// (src/figures/kreisbewegung/) zeichnet Szene (updateScene) UND Diagramm
// (updateGraph), feature-gated auf den Winkel-Aspekt. EINZELNES Diagramm mit
// graphType1='phit' (nicht gestapelt wie 1.39): der Motor liefert phit nativ als
// kumulativen Winkel in Grad (φ wächst linear, Steigung = ω). Der Motor ist
// zeit-/ω-getrieben (angleRad(t)=φ0+ω·t); der t-Regler steuert direkt die
// Pseudo-Zeit, die precompute()-Datenreihe wird auf feste 12 s begrenzt
// (Auto-Stopp; bei Vorgabe T=4 s = 3 Perioden), updateScene()+updateGraph()
// zeichnen daraus Punkt, Ortsvektor, Bahnspur, die wachsende φ(t)-Kurve — die
// optionale Anim-Schleife fährt die Zeit von 0 bis 12 s (Slow-Mo via Tempo-Pills).
//
// WINKEL-BOGEN (Szene): an 1.38 orientiert, erweitert für mehrere Umdrehungen.
// φ(t) wächst kumuliert bis 1080° (3 Umläufe); ein SVG-Bogen kann >360° nicht
// zeichnen. Daher: der AKTUELLE Umlauf wird wie in 1.38 als Teilbogen (0…φ,
// volle Opazität, φ-Label auf der Winkelhalbierenden) gezeichnet; jede bereits
// vollendete Umdrehung bleibt als verblasster Vollkreis im Hintergrund stehen
// (Geisterspur, .aspekt-angle-arc-prev). Sobald der nächste Umlauf beginnt,
// verblasst der bisherige Bogen, bleibt aber sichtbar — Summe der alten Bögen
// schwächer als der aktuelle. Der kumulierte Verlauf steht im φ(t)-Diagramm.
//
// OPTIK: Farb-Tokens und Panel-/Slider-/Legenden-Klassen VERBATIM aus der
// portierten styles.css (über aspekt_kreisbahn.css für .aspekt-figur), dazu die
// Graph-Klassen (graph-bg/axis-line/…) zentral in aspekt_kreisbahn.css (inkl.
// ×1,5-Skalierung via --kb-lw/--kb-fs). Die Pfeil-Geometrie ist die der Vorlage
// (Marker markerUnits=userSpaceOnUse mit fester Länge = ARROW_LEN), damit
// render.js' Verkürzung die Spitze exakt auf den Zielpunkt setzt. Strichstärken
// nicht ändern. Winkelbogen UND φ(t)-Kurve in --kb-accent (der φ-Farbe), damit
// Szene und Diagramm zusammengehören.
//
// LAYOUT: anders als 1.39 (dort Szene über dem gestapelten Diagramm) steht hier
// die Kreisbahn-Szene NEBEN dem φ(t)-Diagramm (Zeile) — wie die statische Vorlage
// (Kreis links, Winkel-Zeit-Diagramm rechts). Nur im Schmal-Modus wird gestapelt
// (Szene über Diagramm); breit + Lupe ebenfalls Zeile (s. aspekt_winkel_zeit.css).
//
// ABLAUF: neben dem Zeit-Regler Start-/Stop-/Reset-Knöpfe (Pictogramme) sowie
// Tempo-Pills (1× … ⅛×, Slow-Mo analog zur Vorlage) für den automatischen Ablauf.
// Der läuft in Sim-Zeit, stoppt nach festen 12 s (3 Perioden bei T=4 s) und
// wiederholt nicht. Pro Instanz im Closure; Knöpfe/Pills hängen direkt am
// Container (kein data-action — sie brauchen Instanz-Zustand, wie die Slider).
//
// PER-INSTANZ-ISOLATION: der Motor-Store ist ein Modul-Singleton. Diese Figur
// holt sich über createRuntime() einen EIGENEN Prefix (kb<n>_) + einen EIGENEN
// storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside rt.withStore(...),
// das den Singleton nur für die Dauer des Zeichnens auf diese Instanz schaltet
// und danach restauriert. So sind beliebig viele Aspekt-Figuren (auch auf
// derselben Seite) vollständig unabhängig.

import { store } from './kreisbewegung/state.js';
import { recomputeDerived, position, velocity, acceleration,
         extendMotionData, recalculateAxisLimits } from './kreisbewegung/physics.js';
import { setupScene, updateScene, updateGraph, updateGraphHover } from './kreisbewegung/render.js';
import { createRuntime } from './kreisbewegung/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop, isAtAutoStopEnd } from './playback.js';
import { ge } from '../core.js';

const T_AUTO = 12;            // fester Auto-Stopp nach 12 s — bei Vorgabe T=4 s
                              // sind das drei Perioden (Bereich 0…12 s, wie 1.39)
const T_MIN = 2, T_MAX = 8, T_DEFAULT = 4;
const R_FIXED = 1.5;          // Radius fest (ändert die Winkelkurve nicht)
const ANIM_CX = 225, ANIM_CY = 260;   // = ANIM_CX / ANIM_CY_STACK (render.js)

// -- Szene: exakt die Vorlagen-Geometrie (wie aspekt_kreisbahn, MIT Winkelbogen
//    und foreignObject-φ-Label, OHNE Stoppuhr — der Aspekt ist der Winkel, nicht
//    die Zeit als Uhr). Marker mit fester Länge (s. aspekt_kreisbahn.js für die
//    Herleitung). Versteckte Stubs (v/a, Stoppuhr), die updateScene() anfasst;
//    die kb_-IDs werden pro Instanz durch den Prefix ersetzt.
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 0 450 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <!-- Pfeilspitzen ×1,5 vergroessert (Szenen-Strichstärken skalieren via
         --kb-lw ×1,5), spitzen-erhaltend via refX = markerWidth' − ARROW_LEN
         (r: 18.75−12.5=6.25; rx/ry: 15−10=5; ax: 13.5−6=7.5). Herleitung im
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

    <line id="kb_position_vector"   stroke-width="2.5" marker-end="url(#kb_arrowhead-r)"  visibility="hidden"/>
    <line id="kb_position_vector_x" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-rx)" visibility="hidden"/>
    <line id="kb_position_vector_y" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ry)" visibility="hidden"/>

    <line id="kb_velocity_vector"/><line id="kb_velocity_vector_x"/><line id="kb_velocity_vector_y"/>
    <line id="kb_acceleration_vector"/><line id="kb_acceleration_vector_x"/><line id="kb_acceleration_vector_y"/>

    <g id="kb_stopwatch" style="display:none">
      <circle id="kb_stopwatch_circle"/><g id="kb_stopwatch_marks"></g>
      <g id="kb_subdial"><g id="kb_subdial_marks"></g><line id="kb_stopwatch_sub_hand"/></g>
      <line id="kb_stopwatch_main_hand"/><g id="kb_digital_display_group"></g>
    </g>
  </g>
</svg>`;

// -- Graph-Skelett: 1:1 aus der Stand-alone-Sim (kb_-prefixt). Diese Figur nutzt
//    den EINZELN-Modus (graph_group_single, graphType1='phit'); die gestapelten
//    top/bottom-Gruppen bleiben ausgeblendet, sind aber als Stubs vorhanden, die
//    der Motor (DOM.graphHitRect[slot] etc.) beim ersten Zeichnen nicht null-
//    dereferenziert — fehlten sie, gäbe es einen Null-Zugriff. ----------------
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
//    Kein R-Regler (R ist fest) — nur Zeit t und Periodendauer T (→ ω).
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="0" max="12" step="0.05" value="12">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
    <div class="slider-label">Periodendauer \\(T\\)</div>
    <div class="slider-row">
      <input id="ak_T" type="range" min="${T_MIN}" max="${T_MAX}" step="0.1" value="${T_DEFAULT}">
      <span class="slider-val" id="ak_T_out"></span>
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
      <div class="legend-swatch" data-c="phi"></div> <div class="legend-label">Winkel \\(\\varphi\\)</div>
      <div class="legend-swatch" data-c="traj"></div><div class="legend-label">durchlaufener Bogen</div>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Vergleich</div>
    <label class="aspekt-check"><input type="checkbox" id="ak_keep"><span>Letzte Kurve behalten</span></label>
  </div>
</div>`;

// -- Klebende Ablaufleiste oberhalb der eigentlichen Simulationsfläche
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

// -- Rechtes Analyse-Panel (breit + Lupe). Kopf-Leiste + Body wie die Stand-alone
//    (panel-header mit ph-label + Doppel-Chevron, panel-body). Physik-Sektion
//    kompakt und NUR auf diese Figur gemünzt (φ(t), ω — kein R, kein x/y),
//    UNNUMMERIERT, inline als \[...\] (MathJax setzt es direkt).
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
        <div class="analysis-cell key">Periodendauer \\(T\\)</div>    <div class="analysis-cell val" id="ak_val_T"></div>
        <div class="analysis-cell key">Winkelgeschw. \\(\\omega\\)</div><div class="analysis-cell val" id="ak_val_omega"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Winkel auf der Kreisbahn:</div>
        <div>\\[\\varphi(t) = \\tfrac{2\\pi}{T}\\,t\\]</div>
        <div>\\[\\omega = \\dot{\\varphi} = \\tfrac{2\\pi}{T}\\]</div>
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

// ── Factory: baut EINE Winkel-Zeit-Aspekt-Figur mit eigener Motor-Instanz ──────
export function buildWinkelZeitFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhängen (kb_ -> p, ak_ -> p+ak_), dann
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
    // übernimmt am Bildschirm diese Rolle). Inside .aspekt-body, damit die
    // Panel-Trennstreifen im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const ak_t = ge(p + 'ak_t'), ak_T = ge(p + 'ak_T');
    const ak_keep = ge(p + 'ak_keep');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let sceneCenters = null;
    let curT = T_AUTO;                    // Initial: volle 12 s (Vorgabe T=4 s -> 3 Perioden)
    let speedFactor = 1.0;
    let keepPrev = false;                 // Vergleichslinie: letzte Kurve bei Neudurchlauf behalten

    // -- Vergleichslinie (Ghost): die φ(t)-Kurve des letzten Parametersatzes
    //    einfrieren (gestrichelt + dünner, s. aspekt_winkel_zeit.css) und über
    //    dem neuen Durchlauf stehen lassen. Nur die jeweils letzte Kurve (keine
    //    Ansammlung). Ein-/Ausblenden ausschließlich hier (kein Motor-Bsp.).
    //
    //    Gespeichert werden DATEN (t/φ), nicht Pixel: die y-Achse skaliert mit T
    //    (φ_max = 360°·12 s/T, also 540° bei T=8 s gegen 2160° bei T=2 s). Eine in
    //    Pixeln eingefrorene Polyline würde beim nächsten Parameterwechsel
    //    stehenbleiben, während die Achse unter ihr wegskaliert — die Geisterlinie
    //    schien sich dann "mitzuändern". Deshalb wird sie bei jedem Zeichnen aus
    //    den Rohdaten neu auf die AKTUELLE Achse projiziert.
    const prevLine = ge(p + 'graph_prev_line');
    let prevSeries = null;                // {t:[…], phi:[…]} — komplette Kurve
    function snapshotPrev() {             // inside withStore aufrufen
        prevSeries = store.tData.length
            ? { t: store.tData.slice(), phi: store.phitData.slice() }
            : null;
    }
    function clearPrev() {
        prevSeries = null;
        if (!prevLine) return;
        prevLine.setAttribute('points', '');
        prevLine.setAttribute('visibility', 'hidden');
    }
    // Geisterkurve auf die aktuelle Achsenskalierung projizieren. store.graphScale
    // .single liefert Plot-Rechteck + Wertebereich genau so, wie drawGraphSlot()
    // die laufende Kurve zeichnet (Single-Layout, isStacked = false).
    function renderPrev() {
        if (!prevLine) return;
        const gs = store.graphScale.single;
        if (!prevSeries || !gs) { prevLine.setAttribute('visibility', 'hidden'); return; }
        const { plotL, plotT, plotW, plotH, xMin, xMax, yMin, yMax } = gs;
        const xR = (xMax - xMin) || 1, yR = (yMax - yMin) || 1;
        let pts = '';
        for (let i = 0; i < prevSeries.t.length; i++) {
            const t = prevSeries.t[i];
            if (t < xMin || t > xMax) continue;
            const px = plotL + ((t - xMin) / xR) * plotW;
            const py = plotT + plotH - ((prevSeries.phi[i] - yMin) / yR) * plotH;
            pts += `${px.toFixed(1)},${py.toFixed(1)} `;
        }
        prevLine.setAttribute('points', pts);
        prevLine.setAttribute('visibility', pts ? 'visible' : 'hidden');
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

    // -- Winkel-Visualisierung (an 1.38 orientiert, erweitert für mehrere
    //    Umdrehungen — Nutzervorgabe): der AKTUELLE Umdrehungsbogen wird wie in
    //    1.38 gezeichnet (Teilbogen 0…φ, volle Opazität, φ-Label auf der
    //    Winkelhalbierenden). Jede bereits vollendete Umdrehung bleibt als
    //    verblasster Vollkreis im Hintergrund stehen — eine Geisterspur: sobald
    //    die nächste Umdrehung beginnt, verblasst der bisherige Bogen, bleibt
    //    aber sichtbar. Die Summe der alten Bögen bleibt schwächer als der
    //    aktuelle (s. .aspekt-angle-arc-prev, Opazität ~0,3). Läuft inside
    //    withStore. Der kumulierte φ(t)-Verlauf bleibt dem Diagramm vorbehalten;
    //    die Szene zeigt pro Umdrehung die aktuelle Stellung + die vollendeten
    //    Umdrehungen als verblassende Geisterbögen.
    //
    //    Analog zu 1.38 (das stets einen Bogen zeichnet): an einer Umdrehungs-
    //    grenze (partial ≈ 0) würde der aktuelle Teilbogen entarten/verschwinden
    //    und das φ-Label auf 3 Uhr springen. Stattdessen wird die gerade VOLL-
    //    ENDETE Umdrehung als heller Vollkreis gezeichnet (aktueller Bogen) und
    //    nur die FRÜHEREN Umdrehungen verblasst als Geister — so bleibt immer ein
    //    heller aktueller Bogen sichtbar. Das φ-Label folgt dabei NICHT diesem
    //    Ersatz-Vollkreis, sondern stets dem laufenden Teilwinkel (s. unten).
    function drawAngle(phiDeg) {
        const g = ge(p + 'aspekt_angle');
        if (!g) return;
        g.textContent = '';
        const lbl0 = ge(p + 'angle_label');
        if (phiDeg <= 0.5) { if (lbl0) lbl0.style.visibility = 'hidden'; return; }
        const NS = 'http://www.w3.org/2000/svg';
        const cx = ANIM_CX, cy = ANIM_CY;
        const rArc = Math.min(46, store.R * store.currentPixelsPerMeter * 0.42);
        const revCount = Math.floor(phiDeg / 360);      // vollendete Umdrehungen
        const partial = phiDeg - revCount * 360;        // aktueller Umdrehungswinkel (0…360)

        // Aktueller Bogen: an Umdrehungs-Grenzen (partial ≈ 0, revCount > 0) die
        // gerade vollendete Umdrehung als hellen Vollkreis nehmen, nur die
        // FRÜHEREN als Geister -> immer ein heller aktueller Bogen (wie 1.38).
        let curAngle = partial;
        let ghostCount = revCount;
        if (partial <= 0.5 && revCount > 0) { curAngle = 360; ghostCount = revCount - 1; }

        // Geisterbögen: je ein Vollkreis pro früherer Umdrehung, verblasst.
        // Zweihalbkreis-Pfad (ein A-Bogen kann 360° nicht in einem Stück). Die
        // Vollkreise überlagern sich -> mit jeder Umdrehung minimal dunkler,
        // aber die Summe bleibt < aktueller Bogen.
        for (let i = 0; i < ghostCount; i++) {
            const ghost = document.createElementNS(NS, 'path');
            ghost.setAttribute('d',
                `M ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx - rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)}`);
            ghost.setAttribute('class', 'aspekt-angle-arc aspekt-angle-arc-prev');
            g.appendChild(ghost);
        }

        // Aktueller Bogen (Teilbogen oder Vollkreis) — Geometrie wie 1.38.
        const rad = curAngle * Math.PI / 180;
        const arc = document.createElementNS(NS, 'path');
        if (curAngle >= 360 - 0.01) {
            // Vollkreis als zwei Halbkreise (ein A-Bogen kann 360° nicht abbilden).
            arc.setAttribute('d',
                `M ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx - rArc).toFixed(2)} ${cy.toFixed(2)} ` +
                `A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 1 0 ${(cx + rArc).toFixed(2)} ${cy.toFixed(2)}`);
        } else {
            // Bildschirm-y ist nach unten -> Winkel φ (math, CCW) endet bei y = cy - …
            const x0 = cx + rArc, y0 = cy;
            const x1 = cx + rArc * Math.cos(rad), y1 = cy - rArc * Math.sin(rad);
            const large = curAngle > 180 ? 1 : 0;
            arc.setAttribute('d', `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 ${large} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
        }
        arc.setAttribute('class', 'aspekt-angle-arc');
        g.appendChild(arc);

        // varphi-Label (foreignObject/MathJax) auf der Winkelhalbierenden (wie
        // 1.38). Bei R >= 1.2 ist der Bogen groß genug -> Label innen (0.62*rArc);
        // sonst knapp außerhalb (rArc+15). (30x30-foreignObject -> um 15 zentren.)
        //
        // Label-Winkel: folgt wie der aktuelle Bogen dem aktuell gezeichneten
        // Winkel (curAngle), damit Bogen und φ-Position entlang derselben Bahn
        // laufen.
        // Der konstante Versatz OFF_X/OFF_Y ist derselbe wie in 1.38 (dort die
        // Referenz-Setzung, Nutzervorgabe) — er hält das Label von Ortsvektor
        // und x-Achse frei.
        const lr = (store.R >= 1.2) ? rArc * 0.62 : rArc + 15;
        const mid = (curAngle * Math.PI / 180) / 2;
        const OFF_X = 6, OFF_Y = 3;
        const lx = cx + lr * Math.cos(mid) + OFF_X, ly = cy - lr * Math.sin(mid) + OFF_Y;
        if (lbl0) {
            lbl0.setAttribute('x', (lx - 15).toFixed(2));
            lbl0.setAttribute('y', (ly - 15).toFixed(2));
            lbl0.style.visibility = 'visible';
        }
    }

    // -- Zeitreihe auf feste 12 s begrenzen (3 Perioden bei T=4 s, wie 1.39).
    //    precompute() des Motors nimmt max(4T, 10s); daher hier eine eigene,
    //    schmale Variante, die nur extendMotionData + recalculateAxisLimits nutzt.
    //    Läuft inside withStore (operiert nur auf dem (Instanz-)store).
    function precomputeRange(duration) {
        store.tData = []; store.xData = []; store.yData = [];
        store.vxData = []; store.vyData = []; store.axData = []; store.ayData = [];
        store.vabsData = []; store.aabsData = []; store.phitData = [];
        if (store.R <= 0) { recalculateAxisLimits(); return; }
        extendMotionData(duration);
        recalculateAxisLimits();
        // Geisterkurve mit in die y-Achse einrechnen: sonst läuft die alte Kurve
        // (kleineres T -> größeres φ_max) oben aus dem Diagramm heraus und der
        // Vergleich bricht ab.
        if (prevSeries && prevSeries.phi.length) {
            const lim = store.axisLimits.phit;
            const need = Math.max(...prevSeries.phi) * 1.1;
            if (lim && need > lim.yMax) lim.yMax = need;
        }
    }

    // -- Zeichnen an der aktuellen Zeit (kein Rebuild der Daten). ---------------
    function draw(t) {
        curT = t;
        updateScene(t, position(t), velocity(t), acceleration(t), sceneCenters);
        updateGraph(t);
        renderPrev();   // nach updateGraph: store.graphScale.single ist dann aktuell
        drawAngle((store.omega * t) * 180 / Math.PI);
    }

    // -- Analyse-/Slider-Werte (deutsches Dezimalkomma wie die Vorlage). --------
    //    Läuft inside withStore (liest store).
    function updateLabels(t, T) {
        const n = (x, d) => Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—';
        ge(p + 'ak_t_out').textContent = n(t, 2) + ' s';
        ge(p + 'ak_T_out').textContent = n(T, 1) + ' s';
        const vt = ge(p + 'ak_val_t');
        if (vt) {
            const phiDeg = (store.omega * t) * 180 / Math.PI;
            vt.textContent = n(t, 2) + ' s';
            ge(p + 'ak_val_phi').textContent = n(phiDeg, 0) + ' °';
            ge(p + 'ak_val_T').textContent = n(T, 2) + ' s';
            ge(p + 'ak_val_omega').textContent = n(store.omega, 3) + ' rad/s';
        }
    }

    // -- Rebuild: T geaendert -> Flags + Parameter, Datenreihe neu, Szene neu
    //    skalieren. Alle Motor-Aufrufe inside withStore (Singleton = diese Instanz).
    //    `paramChange` = der Aufruf kommt von einem Regler, der die KURVENFORM
    //    ändert (hier T): dann wird die eben gezeigte Kurve — falls "Letzte Kurve
    //    behalten" aktiv ist — als Geisterkurve eingefroren und die Laufzeit t
    //    springt auf 0 zurück, damit der neue Verlauf von vorn über dem alten
    //    entsteht und wirklich vergleichbar ist (wie in den Stand-alone-Sims,
    //    z. B. schiefer Wurf).
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                isStacked: false, graphType1: 'phit',
                showPositionVector: true, showPositionComponents: false, showTrajectory: true,
                showVelocityVector: false, showVelocityComponents: false,
                showAccelerationVector: false, showAccelerationComponents: false,
                isDigitalDisplay: false,
                graphFontScale: 1.5,  // Graph-Schrift ×1,5 (--kb-fs) -> render.js skaliert Padding/Label-Abstand
            });
            store.R = R_FIXED;
            const T = parseFloat(ak_T.value);
            store.phi0Deg = 0;
            store.omegaDeg = 360 / T;          // ω [deg/s] = 360 / T  (T = 2π/ω)
            recomputeDerived();
            precomputeRange(T_AUTO);          // fest 0 … 12 s (Auto-Stopp), nicht 1,5 T
            if (curT > T_AUTO) curT = T_AUTO;
            ak_t.max = T_AUTO.toFixed(3);
            ak_t.value = curT.toFixed(3);
            sceneCenters = setupScene();       // Neuskalierung (Zoom, Scheibe)
            // setupScene() ruft drawCoordSystem() der Sim -> eigene Achsen + x/y-Labels
            // in animation_coord_system. Leeren, sonst doppelt beschriftet.
            const cs = ge(p + 'animation_coord_system'); if (cs) cs.textContent = '';
            drawAxes();
            draw(curT);
            updateLabels(curT, T);
        });
    }

    function onInput(e) {
        if (e.target === ak_t) {
            const t = parseFloat(ak_t.value);
            const T = parseFloat(ak_T.value);
            rt.withStore(() => { draw(t); updateLabels(t, T); });
        } else {
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
        }
    }
    let paramGesture = false;
    [ak_T].forEach(inp => inp.addEventListener('change', () => { paramGesture = false; }));

    // -- Automatischer Ablauf (Sim-Zeit 0 … 12 s, Slow-Mo via Tempo-Pills, Auto-
    //    Stopp am Ende — kein Umbrechen). Pro Instanz im Closure; Knöpfe/Pills
    //    hängen direkt am Container (kein data-action — sie brauchen Instanz-
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
      // Vergleichslinie: am Ende angelangt -> die gerade fertige Kurve vor dem
      // Reset als Ghost einfrieren (nur bei echtem Neudurchlauf, nicht beim
      // Weiterlaufen aus der Mitte heraus).
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

    [ak_t, ak_T].forEach(inp => inp.addEventListener('input', onInput));
    rebuild();

    // Beim Oeffnen/Schliessen der Lupe sofort neu zeichnen: so greift der
    // schmal+Zoom-spezifische Diagramm-Layout-Switch ohne weitere Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => {
      rt.withStore(() => {
        draw(curT);
        updateLabels(curT, parseFloat(ak_T.value));
      });
    });

    // -- Graph-Hover (nur im Zoom/Overlay) — wie die Stand-alone-Sim: über dem
    //    Diagramm eine vertikale Linie + Punkt + Tooltip mit dem Wert an der
    //    Mausposition. Diese Figur nutzt den EINZELN-Modus (slot 'single').
    //    Bewusst NUR in der Lupe aktiv (onMove-Gate auf .aspekt-im-overlay) —
    //    der Lese-Modus bleibt ungestört; das CSS setzt die Hit-Rects außerhalb
    //    des Overlays auf pointer-events: none. Die Motor-Funktion updateGraphHover
    //    liest store.graphScale/hoverT/DOM.hover* der Instanz -> inside withStore.
    const hit = ge(p + 'graph_hit_rect');
    if (hit) {
        attachGraphHover(hit, {
            onMove: (x) => {
                if (!fig.classList.contains('aspekt-im-overlay')) {
                    rt.withStore(() => updateGraphHover('single', null));
                    return;
                }
                rt.withStore(() => updateGraphHover('single', x));
            },
            onLeave: () => rt.withStore(() => updateGraphHover('single', null)),
        });
    }
}