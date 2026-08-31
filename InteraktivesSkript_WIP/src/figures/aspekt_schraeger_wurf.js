// aspekt_schraeger_wurf.js — interaktive Aspekt-Figur Abb. 1.9 (BACKLOG P16-6),
// Abschnitt 1.1.7 („Die Strecke"): der schraege Wurf als Bewegung, die sich in
// ZWEI Ort-Zeit-Gleichungen zerlegt.
//
// Links die Wurfszene (Strichmaennchen auf dem Haus, Kugel, Flugbahn, Hoehen-
// und Weiten-Lineal, Stoppuhr), rechts ZWEI gestapelte Weg-Zeit-Diagramme:
// oben y(t), unten x(t). Waehrend die Kugel fliegt, wachsen beide Kurven mit.
// Genau das ist der Aspekt der Abbildung — der Fliesstext sagt unmittelbar
// davor: „Die Bewegung wird nun durch zwei Gleichungen mit demselben Parameter
// t beschrieben, naemlich x(t) und y(t). Wollen wir nun die Bewegung
// visualisieren, so braucht es zwei Ort-Zeit-Diagramme."
//
// Vorlage ist aspekt_freier_fall.js (P16-3/P16-4): gleiches Kapitel, gleiche
// Motor-Familie, gleiche Bedienkonventionen — uebernommen wurden Aufbau,
// Runbar, Panels, Lupe und die mitlaufende Bildunterschrift. Neu gegenueber der
// Vorlage ist einzig der GESTAPELTE Diagramm-Modus (dort nur ein Diagramm) und
// der alpha-Regler.
//
// ASPEKT-GATING (der Motor kann deutlich mehr):
//   * Zwei Diagramme fest: isStacked = true, graphType1 = 'yt', graphType2 =
//     'xt'. Die Diagramm-Auswahl der Sim (acht Typen, zwei freie Picker) ist
//     ausgeblendet — die Paarung y(t)/x(t) IST der Aspekt dieser Abbildung.
//     Die Bahnkurve y(x) hat keine Zeitachse und ist der Aspekt von Abb. 1.14.
//   * v- und a-Vektor AUS. An dieser Skriptstelle sind Geschwindigkeit und
//     Beschleunigung noch nicht eingefuehrt (v0 ist davon unberuehrt — der Wurf
//     BRAUCHT die Anfangsgeschwindigkeit, der Text fuehrt sie hier als
//     Parameter ein). Dieser Motor kennt keine show*-Flags: updateScene() liest
//     die Sichtbarkeit direkt von den Checkboxen, gegatet wird also ueber
//     versteckte Checkboxen ohne checked (Muster wie aspekt_freier_fall.js).
//   * Flugbahn AN (togTrajectory checked) — sie ist der linke Teil der
//     Abbildung. Vergleichsbahn (frozenTraj) AUS: der Vergleich zweier Wuerfe
//     ist an dieser Stelle nicht das Thema.
//   * Achsenkonfiguration fest y nach oben, Nullpunkt Erdboden — die vier
//     Varianten sind der Aspekt von 1.4-1.7, nicht dieser Figur.
//   * Regler: h0, v0, alpha (die drei Parameter der Bildunterschrift) + Zeit.
//
// EINE Kurvenfarbe fuer BEIDE Diagramme (--k11-kurve, die gemeinsame
// Bewegungsfarbe von Kapitel 1.1): die beiden Diagramme sind getrennt
// beschriftet und uebereinander gestapelt, die Farbe muss also nichts
// unterscheiden. Ein zweiter Farbton muesste in darkmode.css UND in beiden
// CVD-Paletten mitgepflegt werden (aspekt_paletten.css ueberschreibt
// --k11-kurve viermal) — Aufwand und CVD-Risiko ohne Gegenwert.
//
// FALLSTRICK, hier zum ersten Mal relevant: updateGraphs() schaltet zwischen
// Einzel- und Stapelmodus ueber style.VISIBILITY, nicht ueber display. Die
// gestapelten Gruppen duerfen im Skelett deshalb KEIN display:none tragen —
// sonst bleiben sie unsichtbar, obwohl der Motor sie auf visible setzt.

import { store, DOM } from './schraeger_wurf/state.js';
import { recomputeDerived, precompute, interpolateAt, flightTime,
         scaleY } from './schraeger_wurf/physics.js';
import { updateScene, updateGraphs, updateKennwerte, updateZoomDisplay,
         drawRuler, drawHorizontalRuler, drawStickFigure,
         drawAnimationCoordSystem, drawStopwatchMarks, drawSubdialMarks,
         fmt } from './schraeger_wurf/render.js';
import { BALL_START_X_PX, GROUND_PX, BALL_RADIUS_BASE_PX,
         SF_ARM_LENGTH_M } from './schraeger_wurf/constants.js';
import { createRuntime } from './schraeger_wurf/runtime.js';

// ── Regler-Bereiche ─────────────────────────────────────────────────────────
// Die Vorgaben sind die Werte der v0.13-Bildunterschrift: h0 = 10 m,
// v0 = 10 m/s, alpha = 70 Grad.
const H0_MIN = 0, H0_MAX = 25, H0_STEP = 0.1, H0_DEFAULT = 10;
const V0_MIN = 1, V0_MAX = 25, V0_STEP = 0.5, V0_DEFAULT = 10;
// alpha ab 5 Grad: bei 0 Grad ist v0y = 0 und es entsteht ein waagerechter
// Wurf — zulaessig, aber dann ist das y(t)-Diagramm ein reiner freier Fall und
// die Abbildung zeigt ihren Aspekt nicht mehr. 90 Grad waere der senkrechte
// Wurf, also Abb. 1.4-1.7.
const ALPHA_MIN = 5, ALPHA_MAX = 85, ALPHA_STEP = 1, ALPHA_DEFAULT = 70;
const T_STEP = 0.01;

function leseKonfig(fig) {
    const zahl = (name, vorgabe) => {
        const v = parseFloat(fig.dataset[name]);
        return Number.isFinite(v) ? v : vorgabe;
    };
    return {
        h0: zahl('h0', H0_DEFAULT),
        v0: zahl('v0', V0_DEFAULT),
        alpha: zahl('alpha', ALPHA_DEFAULT),
    };
}

// ── Szene (links) ───────────────────────────────────────────────────────────
// Aufbau und Z-Ordnung 1:1 aus der Stand-alone-Sim; weggelassen sind deren
// Graph-Gruppen (die liegen hier im zweiten SVG) und die harten Farbattribute
// (CSS setzt sie). Der Ausschnitt ist der Szenen-Teil ihrer viewBox: x 20…370
// (Lineal links, Haus, Kugel bei x=136, Stoppuhr 208…352), Erdboden bei 440,
// Hoehe bis 500 fuer das Weiten-Lineal unter dem Boden.
const SVG_SCENE = `
<svg id="sw_main_svg" viewBox="20 0 350 500" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="sw_arrow-vel" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="sw_arrow-acc" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="sw_arrow-coord" markerWidth="15" markerHeight="10.5" refX="0" refY="5.25" orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
  </defs>
  <g id="sw_animation_group">
    <rect id="sw_building" x="80" width="80"/>
    <line id="sw_ground-line" x1="20" y1="${GROUND_PX}" x2="370" y2="${GROUND_PX}" stroke-width="2"/>
    <g id="sw_ruler_group"></g>
    <g id="sw_horizontal_ruler_group"></g>
    <g id="sw_stick_figure"></g>
    <polyline id="sw_frozen_trajectory_line" fill="none" stroke-width="2" stroke-dasharray="5 4" points=""/>
    <polyline id="sw_trajectory_line" fill="none" stroke-width="2" points=""/>
    <circle id="sw_ball" r="${BALL_RADIUS_BASE_PX}" cx="${BALL_START_X_PX}"/>
    <line id="sw_acceleration_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#sw_arrow-acc)" visibility="hidden"/>
    <line id="sw_velocity_vector_x" x1="0" y1="0" x2="0" y2="0" stroke-width="2" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <line id="sw_velocity_vector_y" x1="0" y1="0" x2="0" y2="0" stroke-width="2" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <line id="sw_velocity_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <g id="sw_animation_coord_system"></g>
    <text id="sw_zoom_text_display" x="24" y="18" class="aspekt-zoom-text"></text>
    <g id="sw_stopwatch">
      <circle id="sw_stopwatch_circle" cx="280" cy="120" r="72" stroke-width="2"/>
      <g id="sw_stopwatch_marks"></g>
      <g id="sw_subdial">
        <circle id="sw_subdial_face" cx="280" cy="150" r="16" stroke-width="1"/>
        <g id="sw_subdial_marks"></g>
        <line id="sw_stopwatch_sub_hand" x1="280" y1="150" x2="280" y2="135" stroke-width="1.5"/>
      </g>
      <line id="sw_stopwatch_main_hand" x1="280" y1="120" x2="280" y2="60" stroke-width="3"/>
    </g>
    <g id="sw_digital_display_group" style="display:none"></g>
  </g>
</svg>`;

// ── Die beiden Weg-Zeit-Diagramme (rechts) ──────────────────────────────────
// Der Motor zeichnet je Slot in eine Gruppe mit lokalem Nullpunkt links oben am
// Plotbereich (0…GRAPH_W x 0…GRAPH_H_STACKED). Die Stand-alone-Sim setzt die
// beiden Gruppen mit translate(400,20) und translate(400,255) neben die Szene
// im GEMEINSAMEN SVG; hier hat das Diagramm ein eigenes SVG, also braucht es
// einen eigenen Rand — bemessen an der SKALIERTEN Schrift (--kb-fs vergroessert
// die Beschriftungen um 1,5), wie in aspekt_freier_fall.js begruendet: 56 px
// links fuer y-Marken und gedrehte Achsenbeschriftung, 48 px oben fuer den
// Titel. Der Abstand der beiden Slots ist der der Sim (235 px), damit unter dem
// oberen Plot (210 px hoch) der Titel des unteren Platz hat.
// KEIN display:none auf den Stapel-Gruppen — updateGraphs() schaltet ueber
// style.visibility (s. Kopfkommentar).
const SVG_GRAPH = `
<svg id="sw_graph_svg" viewBox="0 0 560 545" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <g id="sw_graph_group_single" style="visibility:hidden" transform="translate(56, 48)">
    <g id="sw_grid_group"></g>
    <polyline id="sw_graph_line" fill="none" stroke-width="2" points=""/>
    <circle id="sw_graph_point" r="5" visibility="hidden"/>
    <text id="sw_graph_title" x="240" y="-22" text-anchor="middle" class="graph-title-text"></text>
    <line id="sw_graph_hover_line" class="graph-hover-line" visibility="hidden"/>
    <circle id="sw_graph_hover_point" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="sw_graph_hover_tooltip" visibility="hidden">
      <rect id="sw_graph_hover_tooltip_bg" class="graph-hover-tooltip-bg"/>
      <text id="sw_graph_hover_tooltip_text" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="sw_graph_hit_rect" class="graph-hit-rect"/>
  </g>
  <g id="sw_graph_group_stacked_top" transform="translate(56, 48)">
    <g id="sw_grid_group_top"></g>
    <polyline id="sw_graph_line_top" fill="none" stroke-width="2" points=""/>
    <circle id="sw_graph_point_top" r="4" visibility="hidden"/>
    <text id="sw_graph_title_top" x="240" y="-18" text-anchor="middle" class="graph-title-text small"></text>
    <line id="sw_graph_hover_line_top" class="graph-hover-line" visibility="hidden"/>
    <circle id="sw_graph_hover_point_top" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="sw_graph_hover_tooltip_top" visibility="hidden">
      <rect id="sw_graph_hover_tooltip_bg_top" class="graph-hover-tooltip-bg"/>
      <text id="sw_graph_hover_tooltip_text_top" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="sw_graph_hit_rect_top" class="graph-hit-rect"/>
  </g>
  <g id="sw_graph_group_stacked_bottom" transform="translate(56, 283)">
    <g id="sw_grid_group_bottom"></g>
    <polyline id="sw_graph_line_bottom" fill="none" stroke-width="2" points=""/>
    <circle id="sw_graph_point_bottom" r="4" visibility="hidden"/>
    <text id="sw_graph_title_bottom" x="240" y="-18" text-anchor="middle" class="graph-title-text small"></text>
    <line id="sw_graph_hover_line_bottom" class="graph-hover-line" visibility="hidden"/>
    <circle id="sw_graph_hover_point_bottom" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="sw_graph_hover_tooltip_bottom" visibility="hidden">
      <rect id="sw_graph_hover_tooltip_bg_bottom" class="graph-hover-tooltip-bg"/>
      <text id="sw_graph_hover_tooltip_text_bottom" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="sw_graph_hit_rect_bottom" class="graph-hit-rect"/>
  </g>
</svg>`;

// ── Linkes Bedien-Panel ─────────────────────────────────────────────────────
// Die Regler tragen die MOTOR-IDs (h0_slider/h0_value …), gefuellt werden sie
// hier. Der Zeit-Regler ist figur-eigen (die Sim hat keinen — sie laeuft nur
// ab).
const panelLeft = (cfg) => `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">Abwurfhöhe \\(h_0\\)</div>
    <div class="slider-row">
      <input id="sw_h0_slider" type="range" min="${H0_MIN}" max="${H0_MAX}" step="${H0_STEP}" value="${cfg.h0}">
      <span class="slider-val" id="sw_h0_value"></span>
    </div>
    <div class="slider-label">Abwurfgeschw. \\(v_0\\)</div>
    <div class="slider-row">
      <input id="sw_v0_slider" type="range" min="${V0_MIN}" max="${V0_MAX}" step="${V0_STEP}" value="${cfg.v0}">
      <span class="slider-val" id="sw_v0_value"></span>
    </div>
    <div class="slider-label">Abwurfwinkel \\(\\alpha\\)</div>
    <div class="slider-row">
      <input id="sw_alpha_slider" type="range" min="${ALPHA_MIN}" max="${ALPHA_MAX}" step="${ALPHA_STEP}" value="${cfg.alpha}">
      <span class="slider-val" id="sw_alpha_value"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Ablauf</div>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="sw_t_slider" type="range" min="0" max="2" step="${T_STEP}" value="0">
      <span class="slider-val" id="sw_t_value"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Tempo</div>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="sw_speed" value="1.0" checked><span>1×</span></label>
      <label class="speed-pill"><input type="radio" name="sw_speed" value="0.5"><span>½×</span></label>
      <label class="speed-pill"><input type="radio" name="sw_speed" value="0.25"><span>¼×</span></label>
      <label class="speed-pill"><input type="radio" name="sw_speed" value="0.125"><span>⅛×</span></label>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="sw-bahn"></div><div class="legend-label">Kugel, Flugbahn und beide Kurven</div>
      <div class="legend-swatch" data-c="sw-ruler"></div><div class="legend-label">Höhen- und Weitenskala in \\(\\mathrm{m}\\)</div>
    </div>
  </div>
</div>`;

// Klebende Ablaufleiste ueber Szene + Diagrammen (wie 1.3-1.7).
// sw_time_label ist die Zeitanzeige des Motors: updateScene() schreibt sie.
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: Bewegung abspielen" data-tip="Abspielen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Pause: anhalten" data-tip="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/><rect x="13.1" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" data-tip="Auf Anfang zurücksetzen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
  <div class="aspekt-ff-time" id="sw_time_label"></div>
</div>`;

// ── Rechtes Analyse-Panel ───────────────────────────────────────────────────
// Die Wertzellen tragen die MOTOR-IDs (live_*) — updateScene()/
// updateKennwerte() fuellen sie direkt, kein eigener Label-Code.
// Die Physik-Sektion ist ein STATISCHER Formelblock: die Abbildung lebt davon,
// dass BEIDE Gleichungen nebeneinander stehen — genau die Aussage des
// Fliesstextes davor. data-eqs (main.js::fill_physik_panels) koennte nur EINE
// Gleichung aus dem Text zeigen.
const panelRight = () => `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" data-tip="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>                          <div class="analysis-cell val" id="sw_live_t"></div>
        <div class="analysis-cell key">Höhe \\(y(t)\\)</div>                       <div class="analysis-cell val" id="sw_live_y"></div>
        <div class="analysis-cell key">Weite \\(x(t)\\)</div>                      <div class="analysis-cell val" id="sw_live_x"></div>
        <div class="analysis-cell key">Scheitelhöhe</div>                          <div class="analysis-cell val" id="sw_live_ymax"></div>
        <div class="analysis-cell key">Wurfweite</div>                             <div class="analysis-cell val" id="sw_live_xmax"></div>
        <div class="analysis-cell key">Flugzeit \\(t_{\\mathrm{fall}}\\)</div>     <div class="analysis-cell val" id="sw_live_tfall"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Zwei Gleichungen, ein Parameter \\(t\\)</div>
        <div>\\[x(t) = v_0\\cos(\\alpha)\\,t\\]</div>
        <div>\\[y(t) = -\\tfrac{1}{2}\\,g\\,t^2 + v_0\\sin(\\alpha)\\,t + h_0\\]</div>
        <div class="ff-formel-note">Beide Gleichungen beschreiben <em>dieselbe</em> Bewegung — deshalb braucht es zwei Ort-Zeit-Diagramme. Sie gelten vom Abwurf bis zum Aufschlag, also für \\(0 \\le t \\le t_{\\mathrm{fall}}\\).</div>
        <div class="ff-formel-note">Die Achse \\(y\\) zeigt nach oben und hat ihren Nullpunkt auf dem Erdboden; \\(x\\) zählt waagerecht ab dem Abwurfpunkt. \\(\\alpha\\) ist der Abwurfwinkel zum Erdboden.</div>
      </div>
    </div>
  </div>
</div>`;

// Versteckte Stubs: Groessen ausserhalb des Aspekts und die fuenf Checkboxen,
// ueber die dieser Motor die Sichtbarkeit gatet (er kennt keine show*-Flags).
// Nur die Flugbahn ist checked — sie ist der linke Teil der Abbildung. Der
// Motor schreibt in alle diese Elemente unbedingt; fehlt eins, gibt es einen
// Null-Zugriff (Runbook-Fallstrick #1).
const hiddenStub = `
<div style="display:none">
  <span id="sw_live_vx"></span><span id="sw_live_vy"></span><span id="sw_live_vabs"></span>
  <span id="sw_live_ay"></span><span id="sw_live_vimpact"></span><span id="sw_live_aimpact"></span>
  <input type="checkbox" id="sw_toggle_trajectory" checked>
  <input type="checkbox" id="sw_toggle_velocity_vector">
  <input type="checkbox" id="sw_toggle_velocity_components">
  <input type="checkbox" id="sw_toggle_acceleration_vector">
  <input type="checkbox" id="sw_toggle_compare_traj">
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js definiert und in main.js
// verdrahtet — diese Figur nutzt sie unveraendert mit (DRY).

// ── Fabrik ──────────────────────────────────────────────────────────────────
export function buildSchraegerWurfFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const cfg = leseKonfig(fig);
    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Alle IDs dieser Figur tragen einheitlich den sw_-Platzhalter (auch die
    // figur-eigenen wie sw_t_slider) -> EIN globaler Replace prefixt das
    // gesamte Skelett, Marker-Referenzen (url(#sw_arrow-vel)) eingeschlossen.
    // Die Tempo-Radios muessen mitprefixt werden (name="sw_speed" ->
    // name="sw0_speed"), sonst fasst der Browser die Radios zweier Figuren auf
    // derselben Seite zu EINER Auswahlgruppe zusammen (Fallstrick #14).
    scene.innerHTML = (
      `<div class="aspekt-body">${panelLeft(cfg)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_SCENE}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH}</div></div></div>` +
      `${panelRight()}</div>${hiddenStub}`
    ).replace(/sw_/g, p);
    rt.bindDom();

    // Lupe: in der klebenden Ablaufleiste verankert, damit sie beim Scrollen
    // sichtbar bleibt (Begruendung in aspekt_winkel_zeit.js).
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.dataset.tip = 'Figur vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption (die statische Abbildung uebernimmt am
    // Bildschirm diese Rolle).
    if (fig.dataset.caption) {
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        scene.querySelector('.aspekt-body').appendChild(cap);
    }

    // Mitlaufende Werte in der Bildunterschrift: die Unterschrift darf keine
    // Zahl behaupten, die der Lesende gerade verstellt hat (Nutzervorgabe
    // 2026-08-28). Plain Text statt LaTeX, weil MathJax die Unterschrift nur
    // EINMAL setzt — s. aspekt_freier_fall.js.
    const wertSpans = [...(scene.querySelectorAll('.aspekt-caption [data-wert]'))];
    function updateCaptionWerte() {          // inside withStore aufrufen
        if (!wertSpans.length) return;
        const werte = {
            h0: `${fmt(store.h0, 1)} m`,
            v0: `${fmt(store.v0, 1)} m/s`,
            alpha: `${fmt(store.alphaDeg, 0)} °`,
        };
        wertSpans.forEach(el => {
            const v = werte[el.dataset.wert];
            if (v !== undefined) el.textContent = v;
        });
    }

    // ── Elemente dieser Instanz ─────────────────────────────────────────────
    const q = id => scene.querySelector('#' + p + id);
    const h0Slider = q('h0_slider'), v0Slider = q('v0_slider'),
          alphaSlider = q('alpha_slider'), tSlider = q('t_slider');
    const tValue = q('t_value');
    const speedRadios = [...scene.querySelectorAll(`input[name="${p}speed"]`)];

    let t = 0;                 // aktuelle Zeit (s)
    let tEnd = 1;              // Flugzeit des aktuellen Wurfs
    let animId = null;
    let lastFrame = 0;

    // Szene + beide Diagramme zum Zeitpunkt t zeichnen. IMMER inside
    // rt.withStore(), damit der Motor auf dem Zustand DIESER Instanz arbeitet.
    function zeichne() {
        rt.withStore(() => {
            const s = interpolateAt(t);
            if (!s) return;
            updateScene(s.t, s.x, s.y, s.vx, s.vy);
            // updateGraphs(plotTime, wert1, wert2): Slot 1 ist y(t), Slot 2
            // x(t) — die Reihenfolge der Bildunterschrift von v0.13. Die
            // beiden weiteren Parameter (currentX/currentY) wertet der Motor
            // nur im EINZEL-Modus fuer die Bahnkurve aus; hier immer gestapelt,
            // also weggelassen.
            updateGraphs(s.t, s.y, s.x);
            updateKennwerte();
        });
        tValue.textContent = `${fmt(t, 2)} s`;
    }

    // Vollstaendiger Neuaufbau nach einer Parameteraenderung: Physik neu
    // rechnen, Szene neu aufbauen (Lineale, Strichmaennchen, Achsenkreuz haengen
    // an der Skalierung), Zeitregler neu bemessen.
    function rebuild(behalteZeit) {
        rt.withStore(() => {
            store.h0 = parseFloat(h0Slider.value);
            store.v0 = parseFloat(v0Slider.value);
            store.alphaDeg = parseFloat(alphaSlider.value);
            recomputeDerived();          // v0x/v0y + Zoom — s. physics.js
            precompute();
            tEnd = flightTime();

            // Statische Szenenteile neu zeichnen (Reihenfolge wie ui.js der Sim)
            updateZoomDisplay();
            DOM.ball.setAttribute('r', BALL_RADIUS_BASE_PX * store.zoomFactor);
            const alphaRad = store.alphaDeg * Math.PI / 180;
            const ballCx = BALL_START_X_PX, ballCy = scaleY(store.h0);
            const armLenPx = SF_ARM_LENGTH_M * store.currentPixelsPerMeter;
            const shoulderX = ballCx - armLenPx * Math.cos(alphaRad);
            const shoulderY = ballCy + armLenPx * Math.sin(alphaRad);
            const feetY = drawStickFigure(shoulderX, shoulderY, ballCx, ballCy);
            DOM.building.setAttribute('y', feetY);
            DOM.building.setAttribute('height', Math.max(0, GROUND_PX - feetY));
            drawRuler();
            drawHorizontalRuler();
            drawAnimationCoordSystem();

            q('h0_value').textContent = `${fmt(store.h0, 1)} m`;
            q('v0_value').textContent = `${fmt(store.v0, 1)} m/s`;
            q('alpha_value').textContent = `${fmt(store.alphaDeg, 0)} °`;
            updateCaptionWerte();
        });
        // Zeitregler an die neue Flugzeit anpassen. Ein kurvenformender Regler
        // setzt die Zeit auf 0 und stoppt (Runbook-Fallstrick #20) — sonst
        // stuende die Kugel nach einer Parameteraenderung mitten in einer
        // Bahn, die es so nie gab.
        tSlider.max = String(tEnd.toFixed(2));
        if (!behalteZeit) { stop(); t = 0; tSlider.value = '0'; }
        else if (t > tEnd) { t = tEnd; tSlider.value = String(tEnd); }
        zeichne();
    }

    // ── Ablaufsteuerung ─────────────────────────────────────────────────────
    function tempo() {
        const r = speedRadios.find(el => el.checked);
        return r ? parseFloat(r.value) : 1;
    }
    function frame(now) {
        if (!lastFrame) lastFrame = now;
        const dt = (now - lastFrame) / 1000;
        lastFrame = now;
        t = Math.min(tEnd, t + dt * tempo());
        tSlider.value = String(t);
        zeichne();
        if (t >= tEnd) { stop(); return; }   // Auto-Stopp am Aufschlag
        animId = requestAnimationFrame(frame);
    }
    function start() {
        if (animId) return;
        if (t >= tEnd) { t = 0; tSlider.value = '0'; }   // nach Auto-Stopp neu
        lastFrame = 0;
        animId = requestAnimationFrame(frame);
    }
    function stop() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        lastFrame = 0;
    }
    function reset() { stop(); t = 0; tSlider.value = '0'; zeichne(); }

    scene.querySelector('.aspekt-runbar').addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'start') start();
        else if (b.dataset.act === 'stop') stop();
        else if (b.dataset.act === 'reset') reset();
    });

    // ── Regler ──────────────────────────────────────────────────────────────
    [h0Slider, v0Slider, alphaSlider].forEach(el => {
        el.addEventListener('input', () => rebuild(false));
    });
    tSlider.addEventListener('input', () => {
        stop();
        t = parseFloat(tSlider.value);
        zeichne();
    });

    // ── Erststand ───────────────────────────────────────────────────────────
    rt.withStore(() => {
        // Aspekt-Gating: zwei Diagramme fest, Achse fest, keine Vergleichsbahn.
        Object.assign(store, {
            isStacked: true,
            graphType1: 'yt',
            graphType2: 'xt',
            yAxisConfig: { direction: 'up', origin: 'ground' },
            frozenTraj: null,
            isDigitalDisplay: false,
        });
        drawStopwatchMarks();
        drawSubdialMarks();
    });
    rebuild(false);
}
