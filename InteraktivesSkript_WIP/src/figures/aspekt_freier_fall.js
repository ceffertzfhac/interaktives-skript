// aspekt_freier_fall.js — interaktive Aspekt-Figuren des freier_fall-Motors
// in Abschnitt 1.1.7 („Die Strecke", Beispielbox „Freier Fall und senkrechter
// Wurf"): EINE Fabrik fuer die ganze Abbildungsfamilie.
//
//   Abb. 1.3  freier Fall,       y↑, Null Erdboden     (h0 = 10 m, v0 = 0 fest)
//   Abb. 1.4  senkrechter Wurf,  y↑, Null Erdboden     (h0 = 20 m, v0 = 10 m/s)
//   Abb. 1.5  senkrechter Wurf,  y↑, Null Abwurfpunkt
//   Abb. 1.6  senkrechter Wurf,  y↓, Null Erdboden
//   Abb. 1.7  senkrechter Wurf,  y↓, Null Abwurfpunkt
//
// Links die Fallszene (Haus, Strichmaennchen, Kugel, Hoehenskala, Stoppuhr und
// die kleine Achsen-Miniatur), rechts das Weg-Zeit-Diagramm y(t): waehrend die
// Kugel faellt bzw. fliegt, WAECHST die Kurve im Diagramm mit. Genau das ist
// der Aspekt dieser Abbildungen — „das zugehoerige Weg-Zeit-Diagramm" zu der
// Bewegung, die daneben stattfindet.
//
// WARUM EINE FABRIK FUER FUENF FIGUREN (und nicht fuenf Module):
// 1.4-1.7 zeigen ausdruecklich DIESELBE Bewegung in vier Koordinatensystemen —
// sie unterscheiden sich einzig in `yAxisConfig`, 1.3 zusaetzlich in v0 und h0.
// Fuenf Module waeren fuenfmal derselbe Code; die Skalierbarkeitsvorgabe des
// Projekts (eine Figur = O(1) Dateien, kleine Token-Kosten) verlangt hier das
// Gegenteil: die Unterschiede stehen als DATEN am Platzhalter im Kapitel
//
//   data-achse="up_ground|up_start|down_ground|down_start"   (Vorgabe up_ground)
//   data-v0="<m/s>"   vorhanden -> v0-Regler mit diesem Startwert
//                     fehlt     -> v0 = 0 fest, reiner freier Fall
//   data-h0="<m>"     Startwert der Fallhoehe (Vorgabe 10)
//
// und eine weitere Variante desselben Motors kostet EINE Zeile HTML. Die
// 1:1-Granularitaet des Skripts bleibt davon unberuehrt: jede Abbildung hat
// weiterhin ihre eigene Figur mit eigener Motor-Instanz und eigener
// Abbildungsnummer — es gibt bewusst KEINEN Achsen-Umschalter INNERHALB einer
// Figur (Nutzerentscheidung 2026-07-30, s. BACKLOG P16-0).
//
// ASPEKT-GATING (granulare Reduktion; der Motor kann deutlich mehr):
//   * Achsenkonfiguration je Figur FEST — sie IST der Aspekt von 1.4-1.7.
//   * Nur EIN Diagramm, Typ 'weg' (isStacked=false, graphType1='weg'). v-t ist
//     der Aspekt von Abb. 1.19, a-t kommt in 1.1 gar nicht vor.
//   * v- und a-Vektor AUS. Dieser Motor kennt keine show*-Flags — updateScene()
//     liest die Sichtbarkeit direkt von den Checkboxen (DOM.togVel/.togAcc),
//     gegatet wird also ueber versteckte Checkboxen ohne checked (Muster wie
//     aspekt_federpendel.js). An dieser Skriptstelle sind Geschwindigkeit und
//     Beschleunigung noch nicht eingefuehrt: der Text sagt ausdruecklich, dass
//     ueber die Bedeutung des Vorfaktors g „erst spaeter" gesprochen wird.
//     (v0 ist davon unberuehrt — der Wurf BRAUCHT die Anfangsgeschwindigkeit,
//     der Text fuehrt sie an dieser Stelle als Parameter ein.)
//   * Regler: h0 immer, v0 nur bei den Wurf-Figuren.
//   * Achsenname 'y' in allen fuenf Figuren (store.posChar) — v0.13 benennt die
//     Achse auch dann y, wenn ihr Nullpunkt im Abwurfpunkt liegt; die
//     Stand-alone-Sim schriebe dort 's'. S. PORT-AENDERUNG 4 in render.js.
//
// VORLAGE (Kaskade, s. INTERAKTIVE_ASPEKT_FIGUREN.md §0a):
//   1. Interaktionsmuster „Szene | Weg-Zeit-Diagramm, EIN Zeitcursor aus Regler
//      ODER Play/Pause": das ist aspekt_bus_weg_zeit.js (Abb. 1.2) — die
//      unmittelbar vorangehende Abbildung desselben Abschnitts. Uebernommen:
//      Aufbau der Factory, Panel-/Runbar-/Tempo-Pill-Markup, Zeit-Regler stoppt
//      die Wiedergabe, Lupe in der klebenden Runbar, data-caption-Bau.
//      Aus aspekt_federpendel.js (juengste Motor-Figur) kommen: versteckte
//      Gate-Checkboxen statt show*-Flags, Analyse-Zellen mit MOTOR-IDs (der
//      Motor fuellt sie selbst — eine Quelle weniger), Hover nur im Overlay.
//   2. Stand-alone-Sim (Input/Simulationen/Project_freier_fall_simulation,
//      v2.5.0): Szenen-Geometrie, Diagramm-Optik und der Ablauf sind 1:1 ihre —
//      der Motor zeichnet, hier steht kein eigener Zeichencode. Aus ihrer
//      ui.js (nicht portiert) ist nur die Bedienlogik nachgebaut, die eine
//      Aspekt-Figur ueberhaupt braucht (resetSim -> rebuild(), animate() ->
//      frame()).
//   3. Statische Abbildungen (bilder/freierfall_1.png, senkrechter_wurf_1..4):
//      Startwerte h0 und v0, Achsenwahl je Figur, Parabelast bis zum Aufschlag.
//
// BEWUSSTE ABWEICHUNGEN (sonst gelten sie spaeter als Fehler):
//   * Die Kurve WAECHST mit der Zeit, sie steht nicht von Anfang an komplett da
//     wie im Druckbild. Das ist das Verhalten der Stand-alone-Sim und der
//     didaktische Kern: das Diagramm entsteht aus der Bewegung. Wer die volle
//     Parabel sehen will, zieht den Zeit-Regler ans Ende (eine Geste) —
//     anders als in Abb. 1.2, wo die Kurve die GEGEBENE Messkurve ist und
//     deshalb dauerhaft steht.
//   * KEINE Vergleichskurve („letzte Kurve behalten") wie bei 1.41/Federpendel.
//     h0 und v0 skalieren hier BEIDE Achsen (die Zeitachse laeuft bis zur
//     Flugzeit), eine eingefrorene Kurve muesste also mitskaliert werden und
//     wuerde die Achsen der neuen aufspannen. Der Vergleich zweier Wuerfe waere
//     eine eigene Ausbaustufe.
//   * Abspieltempo-Vorgabe 1× wie in der Sim: ein Fall aus 10 m dauert 1,4 s.
//     Wer genauer hinsehen will, hat ½×/¼×/⅛× einen Klick entfernt.
//   * Die Szene bleibt ueber alle Reglerwerte gleich skaliert (feste viewBox der
//     Sim): bei h0 = 10 m steht die Kugel im unteren Drittel. Mitskalieren
//     wuerde bei jedem h0-Zug die Bildgroesse umrechnen und die Hoehenskala
//     entwerten — sie ist der Massstab, an dem man h0 ABLESEN soll.
//
// TECHNIK: kein eigener Zeichencode. Der Motor (src/figures/freier_fall/,
// BACKLOG P16-1) zeichnet Szene UND Diagramm; diese Datei baut Skelett,
// Bedienung und Verdrahtung. Alle Motor-Aufrufe laufen inside rt.withStore(...)
// (Per-Instanz-Isolation, s. freier_fall/runtime.js) — auf der Seite stehen
// fuenf Instanzen dieses Motors nebeneinander. Anders als federpendel/
// schraeger_wurf rechnet dieser Motor NICHT vorab durch, sondern zeichnet aus
// progressiv wachsenden Zeitreihen (store.t_data & Co.) — der Zeit-Regler
// erzeugt sie deshalb bei jedem Wert neu (sampleTo(), s. u.).

import { store } from './freier_fall/state.js';
import { flightTime, scaleY, getDisplayY, getDisplayV, getDisplayA } from './freier_fall/physics.js';
import { drawRuler, drawStickFigure, drawYAxisDisplay, drawStopwatchMarks, drawSubdialMarks,
         updateScene, updateGraphs, updateKennwerte, updateGraphHover, fmt } from './freier_fall/render.js';
import { G, PIXELS_PER_METER, BALL_X, GROUND_PX } from './freier_fall/constants.js';
import { createRuntime } from './freier_fall/runtime.js';
import { attachGraphHover } from './kreisbewegung/lib/hover.js';
import { resetOnPlayAfterAutoStop } from './playback.js';
import { ge } from '../core.js';

// Reglergrenzen der Stand-alone-Sim (1,8 m = Koerpergroesse des
// Strichmaennchens, darunter stuende es nicht mehr auf dem Haus).
const H0_MIN = 1.8, H0_MAX = 25, H0_STEP = 0.1, H0_DEFAULT = 10;
const V0_MIN = -10, V0_MAX = 10, V0_STEP = 1;
const T_STEP = 0.01;

// Abtastweite der Kurve. Bei der laengsten Flugzeit (h0 = 25 m, v0 = 10 m/s ->
// t_fall ≈ 3,5 s) sind das rund 420 Stuetzstellen — die komplette Reihe darf
// also bei JEDEM Reglerwert neu erzeugt werden, ohne dass es sich lohnt,
// inkrementell anzuhaengen (die Sim tut das, weil sie nur vorwaerts laeuft; ein
// Zeit-Regler muss auch rueckwaerts koennen).
const SAMPLE_DT = 1 / 120;

// Klartext der vier Achsenkonfigurationen fuer das Bedienfeld. Sie stehen dort
// als TEXT, nicht als Umschalter: welche Achse gilt, ist je Abbildung fest
// (s. Kopfkommentar) — die Zeile sagt dem Lesenden nur, in welchem der vier
// Koordinatensysteme er sich gerade befindet.
const ACHSEN_TEXT = {
    up_ground:   '\\(y\\) zeigt nach oben, Nullpunkt am Erdboden',
    up_start:    '\\(y\\) zeigt nach oben, Nullpunkt am Abwurfpunkt',
    down_ground: '\\(y\\) zeigt nach unten, Nullpunkt am Erdboden',
    down_start:  '\\(y\\) zeigt nach unten, Nullpunkt am Abwurfpunkt',
};

// Konfiguration einer Figur aus ihrem Platzhalter lesen (s. Kopfkommentar).
function leseKonfig(fig) {
    const achse = ACHSEN_TEXT[fig.dataset.achse] ? fig.dataset.achse : 'up_ground';
    const [direction, origin] = achse.split('_');
    const hatV0 = fig.dataset.v0 !== undefined && fig.dataset.v0 !== '';
    return {
        achse, direction, origin,
        achseText: ACHSEN_TEXT[achse],
        h0: parseFloat(fig.dataset.h0 || H0_DEFAULT),
        v0: hatV0 ? parseFloat(fig.dataset.v0) : 0,
        v0Regler: hatV0,          // Wurf-Figuren: v0 einstellbar; freier Fall: fest 0
        wurf: hatV0,              // steuert Beschriftungen (Ort statt Hoehe, Flugzeit)
    };
}

// ── Szene (links) ───────────────────────────────────────────────────────────
// Aufbau, Geometrie und Z-Ordnung 1:1 aus der Stand-alone-Sim; weggelassen sind
// nur deren Graph-Gruppen (die liegen hier im zweiten SVG) und die harten
// Farbattribute (CSS setzt sie, s. aspekt_freier_fall.css).
// Der Ausschnitt ist der Szenen-Teil ihrer viewBox (0 0 900 500): x 20…360
// (Lineal x=45, Haus 80…160, Kugel x=136, y-Achsen-Miniatur x=180, Stoppuhr
// 208…352), y 0…480 (Erdboden bei 440). Das Lineal reicht rechnerisch ueber den
// oberen Rand hinaus und wird dort beschnitten — wie in der Sim.
const SVG_SCENE = `
<svg id="ff_main_svg" viewBox="20 0 340 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="ff_arrow-y" markerWidth="15" markerHeight="10.5" refX="0" refY="5.25" orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
    <marker id="ff_arrow-vel" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="ff_arrow-acc" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="ff_animation_group">
    <rect id="ff_building" x="80" width="80"/>
    <line id="ff_ground-line" x1="20" y1="${GROUND_PX}" x2="360" y2="${GROUND_PX}" stroke-width="2"/>
    <g id="ff_ruler_group"></g>
    <g id="ff_stick_figure"></g>
    <circle id="ff_ball" r="8" cx="${BALL_X}"/>
    <line id="ff_acc_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#ff_arrow-acc)" visibility="hidden"/>
    <line id="ff_vel_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#ff_arrow-vel)" visibility="hidden"/>
    <g id="ff_y_axis_display"></g>
    <g id="ff_stopwatch">
      <circle id="ff_sw-face" cx="280" cy="120" r="72" stroke-width="2"/>
      <g id="ff_sw_marks"></g>
      <g id="ff_subdial">
        <circle id="ff_sd-face" cx="280" cy="150" r="16" stroke-width="1"/>
        <g id="ff_sd_marks"></g>
        <line id="ff_sw_sub_hand" x1="280" y1="150" x2="280" y2="135" stroke-width="1.5"/>
      </g>
      <line id="ff_sw_main_hand" x1="280" y1="120" x2="280" y2="60" stroke-width="3"/>
    </g>
  </g>
</svg>`;

// ── Weg-Zeit-Diagramm (rechts) ──────────────────────────────────────────────
// Der Motor zeichnet in eine Gruppe mit lokalem Nullpunkt links oben am
// Plotbereich (drawGraphSlot rechnet in 0…GRAPH_W × 0…graphHeight). Die
// Stand-alone-Sim setzt diese Gruppe mit translate(400,40) neben die Szene im
// GEMEINSAMEN SVG; hier hat das Diagramm ein eigenes SVG, also braucht es einen
// eigenen Rand. Er ist an der SKALIERTEN Schrift bemessen, nicht an den
// Rohwerten der Sim: --kb-fs vergroessert alle Diagramm-Beschriftungen um 1,5
// (s. aspekt_kreisbahn.css), der Titel steht also nicht 15 px, sondern gut
// 22 px hoch ueber der Grundlinie y=−22 -> 48 px oben (mit 40 px war er in
// jedem Breiten-Modus oben angeschnitten, im Screenshot aufgefallen).
// Links entsprechend 56 px fuer die y-Marken und die gedrehte
// Achsenbeschriftung bei x0−40.
// Die beiden gestapelten Slots sind reine DOM-Vertrags-Stubs: updateGraphs()
// fasst sie unbedingt an, gezeichnet wird in sie nur bei isStacked (hier nie).
const SVG_GRAPH = `
<svg id="ff_graph_svg" viewBox="0 0 560 495" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <defs>
    <marker id="ff_arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="ff_graph_group_single" transform="translate(56, 48)">
    <g id="ff_grid_group"></g>
    <polyline id="ff_graph_line" fill="none" stroke-width="2" points=""/>
    <circle id="ff_graph_point" r="5" visibility="hidden"/>
    <text id="ff_graph_title" x="240" y="-22" text-anchor="middle" class="graph-title-text"></text>
    <line id="ff_graph_hover_line" class="graph-hover-line" visibility="hidden"/>
    <circle id="ff_graph_hover_point" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="ff_graph_hover_tooltip" visibility="hidden">
      <rect id="ff_graph_hover_tooltip_bg" class="graph-hover-tooltip-bg"/>
      <text id="ff_graph_hover_tooltip_text" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="ff_graph_hit_rect" class="graph-hit-rect"/>
  </g>
  <g id="ff_graph_group_stacked_top" style="display:none">
    <g id="ff_grid_group_top"></g>
    <polyline id="ff_graph_line_top" fill="none" points=""/>
    <circle id="ff_graph_point_top" r="4" visibility="hidden"/>
    <text id="ff_graph_title_top" class="graph-title-text small"></text>
    <line id="ff_graph_hover_line_top" class="graph-hover-line" visibility="hidden"/>
    <circle id="ff_graph_hover_point_top" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="ff_graph_hover_tooltip_top" visibility="hidden">
      <rect id="ff_graph_hover_tooltip_bg_top" class="graph-hover-tooltip-bg"/>
      <text id="ff_graph_hover_tooltip_text_top" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="ff_graph_hit_rect_top" class="graph-hit-rect"/>
  </g>
  <g id="ff_graph_group_stacked_bottom" style="display:none">
    <g id="ff_grid_group_bottom"></g>
    <polyline id="ff_graph_line_bottom" fill="none" points=""/>
    <circle id="ff_graph_point_bottom" r="4" visibility="hidden"/>
    <text id="ff_graph_title_bottom" class="graph-title-text small"></text>
    <line id="ff_graph_hover_line_bottom" class="graph-hover-line" visibility="hidden"/>
    <circle id="ff_graph_hover_point_bottom" class="graph-hover-point" r="6" visibility="hidden"/>
    <g id="ff_graph_hover_tooltip_bottom" visibility="hidden">
      <rect id="ff_graph_hover_tooltip_bg_bottom" class="graph-hover-tooltip-bg"/>
      <text id="ff_graph_hover_tooltip_text_bottom" class="graph-hover-tooltip-text"></text>
    </g>
    <rect id="ff_graph_hit_rect_bottom" class="graph-hit-rect"/>
  </g>
</svg>`;

// ── Linkes Bedien-Panel ─────────────────────────────────────────────────────
// h0-/v0-Regler und ihre Wertanzeigen tragen die MOTOR-IDs (h0_slider/h0_value,
// v0_slider/v0_value): so bleibt die Zuordnung zum Motor sichtbar, gefuellt
// werden sie hier. Der Zeit-Regler ist figur-eigen (die Sim hat keinen — sie
// laeuft nur ab). Der v0-Block entfaellt bei der Freier-Fall-Figur.
const panelLeft = (cfg) => `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">${cfg.wurf ? 'Abwurfhöhe' : 'Fallhöhe'} \\(h_0\\)</div>
    <div class="slider-row">
      <input id="ff_h0_slider" type="range" min="${H0_MIN}" max="${H0_MAX}" step="${H0_STEP}" value="${cfg.h0}">
      <span class="slider-val" id="ff_h0_value"></span>
    </div>
${cfg.v0Regler ? `    <div class="slider-label">Anfangsgeschw. \\(v_0\\)</div>
    <div class="slider-row">
      <input id="ff_v0_slider" type="range" min="${V0_MIN}" max="${V0_MAX}" step="${V0_STEP}" value="${cfg.v0}">
      <span class="slider-val" id="ff_v0_value"></span>
    </div>
    <div class="ff-hinweis">\\(v_0>0\\): nach oben geworfen &middot; \\(v_0<0\\): nach unten &middot; \\(v_0=0\\): freier Fall</div>` : ''}
  </div>
  <div class="panel-section">
    <div class="panel-label">Ablauf</div>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ff_t_slider" type="range" min="0" max="2" step="${T_STEP}" value="0">
      <span class="slider-val" id="ff_t_value"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Tempo</div>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="ff_speed" value="1.0" checked><span>1×</span></label>
      <label class="speed-pill"><input type="radio" name="ff_speed" value="0.5"><span>½×</span></label>
      <label class="speed-pill"><input type="radio" name="ff_speed" value="0.25"><span>¼×</span></label>
      <label class="speed-pill"><input type="radio" name="ff_speed" value="0.125"><span>⅛×</span></label>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Koordinatensystem</div>
    <div class="ff-achse">${cfg.achseText}</div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="ff-fall"></div><div class="legend-label">Kugel und Kurve \\(y(t)\\)</div>
      <div class="legend-swatch" data-c="ff-ruler"></div><div class="legend-label">Höhenskala in \\(\\mathrm{m}\\)</div>
    </div>
  </div>
</div>`;

// Klebende Ablaufleiste ueber Szene + Diagramm (wie 1.2/Federpendel).
// ff_time_label ist die Zeitanzeige des Motors: updateScene() schreibt sie.
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: Bewegung abspielen" data-tip="Abspielen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Pause: anhalten" data-tip="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/><rect x="13.1" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" data-tip="Auf Anfang zurücksetzen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
  <div class="aspekt-ff-time" id="ff_time_label"></div>
</div>`;

// ── Rechtes Analyse-Panel ───────────────────────────────────────────────────
// Die Wertzellen tragen die MOTOR-IDs (live_*) — updateScene()/updateKennwerte()
// fuellen sie direkt, kein eigener Label-Code. KEINE statische .formula-box:
// die Physik-Sektion kommt dynamisch aus dem Kapiteltext (data-eqs ->
// main.js::fill_physik_panels). Beides zugleich ginge nicht — ein statischer
// Block gewinnt und data-eqs bliebe wirkungslos.
// Die Scheitelhoehe steht bewusst „ueber dem Boden" da: updateKennwerte()
// liefert sie als physikalische Hoehe, NICHT in der Achsenkonvention der Figur
// (in 1.6/1.7 waere der Anzeigewert negativ bzw. verschoben). So ist die Zeile
// in allen vier Koordinatensystemen dieselbe wahre Aussage.
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
        <div class="analysis-cell key">Zeit \\(t\\)</div>                              <div class="analysis-cell val" id="ff_live_t"></div>
        <div class="analysis-cell key">${cfg.wurf ? 'Ort' : 'Höhe'} \\(y(t)\\)</div>   <div class="analysis-cell val" id="ff_live_y"></div>
${cfg.wurf ? `        <div class="analysis-cell key">Scheitelhöhe über Boden</div>          <div class="analysis-cell val" id="ff_live_ymax"></div>
        <div class="analysis-cell key">Flugzeit \\(t_{\\mathrm{fall}}\\)</div>         <div class="analysis-cell val" id="ff_live_tfall"></div>`
            : `        <div class="analysis-cell key">Fallzeit \\(t_{\\mathrm{fall}}\\)</div>         <div class="analysis-cell val" id="ff_live_tfall"></div>`}
      </div>
    </div>
  </div>
</div>`;

// Versteckte Stubs: Groessen ausserhalb des Aspekts (v, a, Auftreffgeschwindig-
// keit, bei der Fall-Figur zusaetzlich die Scheitelhoehe = h0) und die zwei
// Checkboxen, ueber die dieser Motor die Vektor-Sichtbarkeit gatet (er kennt
// keine show*-Flags). Beide OHNE checked — v- und a-Pfeil bleiben aus, s.
// Kopfkommentar. Der Motor schreibt in alle diese Elemente unbedingt; fehlt
// eins, gibt es einen Null-Zugriff (Runbook-Fallstrick #1).
const hiddenStub = (cfg) => `
<div style="display:none">
  <span id="ff_live_v"></span><span id="ff_live_a"></span><span id="ff_live_vimpact"></span>
  ${cfg.wurf ? '' : '<span id="ff_live_ymax"></span>'}
  <input type="checkbox" id="ff_tog_vel">
  <input type="checkbox" id="ff_tog_acc">
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js definiert und in main.js
// verdrahtet — diese Figur nutzt sie unveraendert mit (DRY).

// ── Factory: baut EINE Figur der Familie mit eigener Motor-Instanz ───────────
export function buildFreierFallFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const cfg = leseKonfig(fig);
    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Alle IDs dieser Figur tragen einheitlich den ff_-Platzhalter (auch die
    // figur-eigenen wie ff_t_slider) -> EIN globaler Replace prefixt das
    // gesamte Skelett, Marker-Referenzen (url(#ff_arrow-vel)) eingeschlossen.
    // Die Tempo-Radios muessen mitprefixt werden (name="ff_speed" ->
    // name="ff0_speed"), sonst fasst der Browser die Radios zweier Figuren auf
    // derselben Seite zu EINER Auswahlgruppe zusammen (Fallstrick #14) — in
    // diesem Abschnitt stehen FUENF Figuren dieses Motors untereinander.
    scene.innerHTML = (
      `<div class="aspekt-body">${panelLeft(cfg)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_SCENE}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH}</div></div></div>` +
      `${panelRight(cfg)}</div>${hiddenStub(cfg)}`
    ).replace(/ff_/g, p);
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

    // Bildunterschrift aus data-caption (die statische Abbildung uebernimmt am
    // Bildschirm diese Rolle). Inside .aspekt-body, damit die Panel-Trennstreifen
    // im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        scene.querySelector('.aspekt-body').appendChild(cap);
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const sl_h0 = ge(p + 'h0_slider'), sl_t = ge(p + 't_slider');
    const sl_v0 = cfg.v0Regler ? ge(p + 'v0_slider') : null;
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let curT = 0;          // Laufzeit (s)
    let tFall = 0;         // Flugzeit zur aktuellen Parameterwahl (s)
    let speedFactor = 1.0;

    // -- Zeitreihe fuer 0 … t erzeugen. Der Motor zeichnet die Kurve aus
    //    store.t_data & Co. und setzt den Kurvenpunkt auf den LETZTEN Eintrag —
    //    die Reihe endet also genau bei t, und die Kurve waechst mit der
    //    Bewegung. Die Sim haengt pro Frame einen Punkt an; hier wird die Reihe
    //    komplett neu erzeugt, weil der Zeit-Regler auch rueckwaerts darf.
    //    Gespeichert werden ANZEIGE-Werte (getDisplayY/V/A) — genau wie in der
    //    Sim, damit die Achsenkonfiguration allein beim Anzeigen wirkt.
    //    Laeuft inside withStore.
    function sampleTo(t) {
        const { h0, v0 } = store;
        const tEnd = Math.min(t, tFall);
        const tt = [], yy = [], vv = [], aa = [];
        const push = (ts) => {
            const y = Math.max(0, h0 + v0 * ts - 0.5 * G * ts * ts);
            tt.push(ts); yy.push(getDisplayY(y)); vv.push(getDisplayV(v0 - G * ts)); aa.push(getDisplayA(-G));
        };
        for (let ts = 0; ts < tEnd; ts += SAMPLE_DT) push(ts);
        push(tEnd);   // exakter Endpunkt -> Kurvenpunkt sitzt genau auf t
        store.t_data = tt; store.y_data = yy; store.v_data = vv; store.a_data = aa;
    }

    // -- Zeichnen an der aktuellen Zeit (Parameter bleiben unveraendert). ------
    function draw(t) {
        rt.withStore(() => {
            curT = Math.max(0, Math.min(t, tFall));
            sampleTo(curT);
            const y = Math.max(0, store.h0 + store.v0 * curT - 0.5 * G * curT * curT);
            updateScene(curT, y, store.v0 - G * curT, -G);
            updateGraphs();
        });
        sl_t.value = String(curT);
        ge(p + 't_value').textContent = `${fmt(curT)} s`;
    }

    // -- Rebuild: Parameter aus den Reglern -> Szene neu aufbauen, Zeitachse des
    //    Reglers auf die neue Flugzeit setzen. `paramChange` = der Aufruf kommt
    //    von einem Regler, der die KURVENFORM aendert (h0 oder v0): dann springt
    //    die Laufzeit auf 0 zurueck und der Ablauf stoppt, damit die neue
    //    Bewegung von vorn beginnt (Fallstrick #20, Bedienkonvention der
    //    Stand-alone-Sims). Reihenfolge und Aufrufe wie resetSim() der Sim-ui.js.
    function rebuild(paramChange = false) {
        rt.withStore(() => {
            if (paramChange) { stop(); curT = 0; }
            Object.assign(store, {
                graphType1: 'weg',
                isStacked: false,
                posChar: 'y',                  // v0.13 nennt die Achse immer y
                yAxisConfig: { direction: cfg.direction, origin: cfg.origin },
            });
            store.h0 = parseFloat(sl_h0.value);
            store.v0 = sl_v0 ? parseFloat(sl_v0.value) : 0;
            tFall = flightTime();

            // Haus: reicht bis 1,8 m unter die Abwurfhoehe (Standhoehe des
            // Strichmaennchens), genau wie in der Sim.
            const bhM = Math.max(0, store.h0 - 1.8);
            ge(p + 'building').setAttribute('height', String(bhM * PIXELS_PER_METER));
            ge(p + 'building').setAttribute('y', String(scaleY(bhM)));

            drawStickFigure(bhM);
            drawRuler();
            drawStopwatchMarks();
            drawSubdialMarks();
            drawYAxisDisplay();
            updateKennwerte();

            ge(p + 'h0_value').textContent = `${fmt(store.h0, 1)} m`;
            if (sl_v0) ge(p + 'v0_value').textContent = `${fmt(store.v0, 0)} m/s`;
        });
        sl_t.max = String(tFall.toFixed(2));
        draw(curT);
    }

    // Parameter-Regler: schrubben stoppt den Ablauf und setzt ihn auf den Anfang.
    [sl_h0, sl_v0].forEach(s => s && s.addEventListener('input', () => rebuild(true)));
    // Zeit: schrubben stoppt die Wiedergabe und zeichnet direkt (wie Abb. 1.2).
    sl_t.addEventListener('input', () => { stop(); draw(parseFloat(sl_t.value)); });

    // ── Automatischer Ablauf (Sim-Zeit 0 … t_fall, Zeitlupe ueber die
    //    Tempo-Pills, Auto-Stopp beim Aufschlag — kein Umbrechen). Pro Instanz
    //    im Closure; die Knoepfe haengen am Container (kein data-action — sie
    //    brauchen Instanz-Zustand).
    let playing = false;
    let rafId = null;
    let lastTs = 0;

    function frame(ts) {
        if (!playing) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;    // Echtzeit-Sekunden
        lastTs = ts;
        let nt = curT + dt * speedFactor;
        if (nt >= tFall) nt = tFall;
        draw(nt);
        if (nt >= tFall) stop();
        if (playing) rafId = requestAnimationFrame(frame);
    }
    function start() {
        if (playing) return;
        resetOnPlayAfterAutoStop(curT, tFall, reset);   // am Boden -> neu starten
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
        draw(0);
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
    // overlay-spezifische Layout-Switch ohne weitere Nutzeraktion.
    fig.addEventListener('aspekt-overlay-toggled', () => draw(curT));

    // -- Diagramm-Hover (nur in der Lupe) — wie die Stand-alone-Sim: vertikale
    //    Linie + Punkt + Tooltip mit dem Wert an der Mausposition. Bewusst NUR
    //    im Overlay aktiv (der Lese-Modus bleibt ungestoert; das CSS setzt die
    //    Hit-Rects ausserhalb des Overlays auf pointer-events:none). Diese Figur
    //    nutzt nur den Slot 'single'; die gestapelten Slots sind Stubs.
    const hit = ge(p + 'graph_hit_rect');
    if (hit) {
        attachGraphHover(hit, {
            onMove: (x) => {
                const inOverlay = fig.classList.contains('aspekt-im-overlay');
                rt.withStore(() => updateGraphHover('single', inOverlay ? x : null));
            },
            onLeave: () => rt.withStore(() => updateGraphHover('single', null)),
        });
    }
}
