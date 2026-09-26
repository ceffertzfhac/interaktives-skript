// aspekt_schraeger_wurf.js — interaktive Aspekt-Figuren des schraegen Wurfs.
// EINE Fabrik fuer ZWEI Abbildungen desselben Abschnitts 1.1.7 („Die Strecke");
// was sie unterscheidet, steht als data-Attribut am Platzhalter im Kapitel:
//
//   Abb. 1.9  (ohne Zusatzattribut)      — die Bewegung zerlegt sich in ZWEI
//     Ort-Zeit-Gleichungen: gestapelt y(t) oben, x(t) unten.
//   Abb. 1.14 (data-kontext="bahn")      — dieselbe Bewegung als BAHNKURVE:
//     EIN Diagramm y(x), die Zeit ist keine Achse mehr. Der Fliesstext davor
//     stellt genau das gegenueber („diese Parabel ist eine andere Parabel als
//     die Parabel der Komponente y(t)").
//
//   Abb. 1.18 (data-kontext="vektor")    — KEIN Diagramm, nur die Szene: der
//     Ortsvektor (vom Ursprung zur Kugel) und der Geschwindigkeitsvektor
//     (Tangente an die Bahn). Ein Umschalter setzt den Ursprung auf den
//     Erdboden (a) oder in den Abwurfpunkt (b) — die beiden Teilbilder der
//     gedruckten Abbildung sind zwei Zustaende DIESER einen Figur
//     (Nutzerentscheidung 2026-09-26, BACKLOG P16-8).
//
// Alle teilen Szene, Regler, Ablaufsteuerung und Analyse — nur der
// Diagramm-Zuschnitt und einige Texte unterscheiden sich.
//
// ABB. 1.18 IM EINZELNEN (P16-8):
//   * Der Umschalter ist KEIN kurvenformender Regler: die Zeit laeuft weiter,
//     auch waehrend der Wiedergabe. Genau so sieht man den Kern der
//     Abbildung — der Ortsvektor springt, der Geschwindigkeitsvektor bleibt.
//   * Den Ortsvektor zeichnet die Figur SELBST (eigene <line>, der Motor kennt
//     ihn nicht). Er beginnt am Ursprung der Achsenskizze, die der Motor ueber
//     yAxisConfig.origin ohnehin mitverschiebt (drawAnimationCoordSystem).
//   * Farben wie die Unterschrift der Quelle: Ortsvektor blau (--kb-omega,
//     das Blau der Kreisbewegungs-Figuren samt Paletten), Geschwindigkeit orange
//     (--kb-vlat, wie v in 1.19 und Kapitel 1.4). Beide Farbwoerter der
//     Unterschrift laufen ueber apply_farbwoerter mit.
//   * Nach einem Parameterwechsel springt die Zeit nicht auf 0, sondern auf
//     40 % der Flugzeit: bei t = 0 hat der Ortsvektor in (b) die Laenge null
//     und die Figur zeigte ihren Gegenstand nicht (Lehre aus #20 wie bei 1.14:
//     „nicht in einem ungueltigen Zustand stehen bleiben").
//   * Stoppuhr aus (wie 1.14): ohne Zeitdiagramm hat sie nichts zu erklaeren
//     und stand dem Bahnscheitel im Weg.
//
// ZEITLAUF AUCH IN 1.14 (Nutzerentscheidung 2026-09-14): die gedruckte
// Unterschrift sagt, in der Bahnkurve sei „nicht mehr erkennbar", wo das Objekt
// zu einem Zeitpunkt ist. Die interaktive Figur laesst es trotzdem sehen — aber
// nur WAEHREND der Wiedergabe. Genau so steht es in der Bildunterschrift
// (Nutzerformulierung 2026-09-14): waehrend der Animation sieht man es, im
// Nachhinein auch hier nicht mehr, denn die fertige Kurve traegt die Zeit nicht
// in sich. Der gedruckte Satz bleibt damit uneingeschraenkt richtig; die
// interaktive Fassung widerspricht ihm nicht, sie fuegt den Moment hinzu.
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
import { recomputeDerived, precompute, interpolateAt, flightTime, maxHeight,
         scaleX, scaleY } from './schraeger_wurf/physics.js';
import { updateScene, updateGraphs, updateKennwerte, updateZoomDisplay,
         drawRuler, drawHorizontalRuler, drawStickFigure,
         drawAnimationCoordSystem, drawStopwatchMarks, drawSubdialMarks,
         fmt } from './schraeger_wurf/render.js';
import { BALL_START_X_PX, GROUND_PX, BALL_RADIUS_BASE_PX, ANIM_W,
         SF_ARM_LENGTH_M, DEFAULT_PIXELS_PER_METER } from './schraeger_wurf/constants.js';
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
        // Abb. 1.14: EIN Diagramm, die Bahnkurve y(x) (s. Kopf).
        bahn: fig.dataset.kontext === 'bahn',
        // Abb. 1.18: nur Szene, Orts- und Geschwindigkeitsvektor (s. Kopf).
        vektor: fig.dataset.kontext === 'vektor',
        // Ursprung beim Aufbau: 'ground' = (a), 'start' = (b).
        ursprung: fig.dataset.ursprung === 'start' ? 'start' : 'ground',
    };
}

// ── Szene (links) ───────────────────────────────────────────────────────────
// Aufbau und Z-Ordnung 1:1 aus der Stand-alone-Sim; weggelassen sind deren
// Graph-Gruppen (die liegen hier im zweiten SVG) und die harten Farbattribute
// (CSS setzt sie). Der Ausschnitt ist der Szenen-Teil ihrer viewBox: x 20…370
// (Lineal links, Haus, Kugel bei x=136, Stoppuhr 208…352), Erdboden bei 440,
// Hoehe bis 500 fuer das Weiten-Lineal unter dem Boden.
// ANIM_TOP_BAHN: oberer Beschnitt der Szene in Abb. 1.14. Die Szene der Sim ist
// hochformatig (350x500 mit Lineal und Haus), ein flacher Wurf ist querformatig
// — bei h0=10 m, v0=10 m/s, alpha=45 Grad nutzt er 150 der 440 px ueber dem
// Boden, also ein Drittel. Der Rest war leeres Lineal (Nutzerbefund 2026-09-14).
// Seit 2026-09-16 ist dies nur noch der STARTWERT fuer den ersten Aufbau:
// massstabAbgleichen() schneidet die Szene danach bei jedem rebuild() auf ihren
// Inhalt zu (und setzt store.animTopPx mit, gegen das physics.js und drawRuler
// rechnen). Ein fester Beschnitt konnte es nicht richtig machen — er passt
// immer nur zu EINER Reglerstellung.
const ANIM_TOP_BAHN = 150;

const SVG_SCENE = (cfg) => `
<svg id="sw_main_svg" viewBox="20 ${cfg.bahn ? ANIM_TOP_BAHN : 0} 350 ${500 - (cfg.bahn ? ANIM_TOP_BAHN : 0)}" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="sw_arrow-vel" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="sw_arrow-acc" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="sw_arrow-ort" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="sw_arrow-coord" markerWidth="15" markerHeight="10.5" refX="0" refY="5.25" orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
    <!-- Spitze der DIAGRAMM-Achsen (BACKLOG P5). Geometrie wie in den
         kreisbewegung-Figuren (kb_graph-arrowhead), damit die Diagramme aller
         Kapitel dieselbe Achsenspitze tragen. -->
    <marker id="sw_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="sw_animation_group">
    <rect id="sw_building" x="80" width="80"/>
    <line id="sw_ground-line" x1="20" y1="${GROUND_PX}" x2="370" y2="${GROUND_PX}" stroke-width="2"/>
    <g id="sw_ruler_group"></g>
    <g id="sw_horizontal_ruler_group"></g>
    <g id="sw_stick_figure"></g>
    <polyline id="sw_frozen_trajectory_line" fill="none" stroke-width="2" stroke-dasharray="5 4" points=""/>
    <polyline id="sw_trajectory_line" fill="none" stroke-width="2" points=""/>
    <!-- Ortsvektor (Abb. 1.18): figur-eigen, s. Kopfkommentar. UNTER der
         Kugel: seine Spitze endet im Kugelmittelpunkt, die Kugel („roter
         Kreis" der Unterschrift) bleibt sichtbar. Strichstaerke aus der
         kapitelweiten Regel fuer [id$="position_vector"] (aspekt_kreisbahn.css). -->
    <line id="sw_position_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#sw_arrow-ort)" visibility="hidden"/>
    <circle id="sw_ball" r="${BALL_RADIUS_BASE_PX}" cx="${BALL_START_X_PX}"/>
    <line id="sw_acceleration_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#sw_arrow-acc)" visibility="hidden"/>
    <line id="sw_velocity_vector_x" x1="0" y1="0" x2="0" y2="0" stroke-width="2" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <line id="sw_velocity_vector_y" x1="0" y1="0" x2="0" y2="0" stroke-width="2" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <line id="sw_velocity_vector" x1="0" y1="0" x2="0" y2="0" stroke-width="2.5" marker-end="url(#sw_arrow-vel)" visibility="hidden"/>
    <g id="sw_animation_coord_system"></g>
    <!-- Zoom-Anzeige in der freien Luecke zwischen Hoehenlineal (endet rund
         x=155) und Stoppuhr (beginnt rund x=277). Oben links lag sie auf dem
         Lineal, oben rechts unter der Uhr — beides im Screenshot aufgefallen. -->
    <text id="sw_zoom_text_display" x="175" y="${cfg.bahn ? ANIM_TOP_BAHN + 16 : 16}" text-anchor="start" class="aspekt-zoom-text"></text>
    <!-- Stoppuhr verkleinert in die rechte obere Ecke (Nutzervorgabe 2026-08-31:
         „der uhr verkleinern, aber immer noch oben rechts in der animation").
         Der Motor zeichnet Zifferblatt, Marken und Zeiger in ABSOLUTEN
         Koordinaten um (280,120) mit r=72 — verkleinert wird deshalb ueber eine
         Transformation der Gruppe, genau wie es die Stand-alone-Sim selbst tut
         (STOPWATCH_TRANSFORM in constants.js: translate(84,-24) scale(0.595)).
         Uebernommen ist deren Massstab 0.595; die Verschiebung ist groesser, weil
         der Wurf anders als der senkrechte Fall die Mitte der Szene fuellt: die
         Uhr sitzt damit um (320,50) statt um (251,47) und laesst den Bahnscheitel
         (rund x=234) frei. Ohne das lag die Kugel im Zifferblatt. -->
    <g id="sw_stopwatch" transform="translate(153, -21) scale(0.595)"${cfg.bahn || cfg.vektor ? ' style="display:none"' : ''}>
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
// Die viewBox-HOEHE haengt am Diagramm-Zuschnitt: gestapelt (Abb. 1.9) fuellen
// zwei Diagramme die 545; im Einzelmodus (Abb. 1.14) endet die Zeichnung bei
// y = 431, die restlichen 114 Einheiten waren leerer Raum UNTERHALB des
// Diagramms — bei "xMidYMid meet" wird er mitskaliert und schiebt sich als
// Weissraum in die Figur (Nutzerbefund 2026-09-14). 455 laesst 24 Einheiten
// Luft unter der x-Achsenbeschriftung, so viel wie oben ueber dem Titel.
const SVG_GRAPH = (cfg) => `
<svg id="sw_graph_svg" viewBox="0 0 560 ${cfg.bahn ? 455 : 545}" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
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
${cfg.vektor ? `  <div class="panel-section">
    <div class="panel-label">Koordinatensystem</div>
    <div class="speed-pills sw-ursprung">
      <label class="speed-pill"><input type="radio" name="sw_ursprung" value="ground"${cfg.ursprung === 'ground' ? ' checked' : ''}><span>(a) Boden</span></label>
      <label class="speed-pill"><input type="radio" name="sw_ursprung" value="start"${cfg.ursprung === 'start' ? ' checked' : ''}><span>(b) Abwurfpunkt</span></label>
    </div>
    <div class="ff-formel-note">Wo liegt der Ursprung? \\(x\\) zählt in beiden Fällen ab dem Abwurfpunkt, \\(y\\) zeigt nach oben.</div>
  </div>
` : ''}  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
${cfg.vektor ? `      <div class="legend-swatch" data-c="sw-bahn"></div><div class="legend-label">Kugel und Flugbahn</div>
      <div class="legend-swatch" data-c="sw-ort"></div><div class="legend-label">Ortsvektor \\(\\vec s(t)\\)</div>
      <div class="legend-swatch" data-c="sw-vel"></div><div class="legend-label">Geschwindigkeit \\(\\vec v(t)\\)</div>`
    : `      <div class="legend-swatch" data-c="sw-bahn"></div><div class="legend-label">Kugel, Flugbahn und ${cfg.bahn ? 'Bahnkurve' : 'beide Kurven'}</div>`}
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
const panelRight = (cfg) => `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" data-tip="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
${cfg.vektor ? `      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>                          <div class="analysis-cell val" id="sw_live_t"></div>
        <div class="analysis-cell key">\\(s_x = x(t)\\)</div>                     <div class="analysis-cell val" id="sw_live_x"></div>
        <div class="analysis-cell key">\\(s_y = y(t)\\)</div>                     <div class="analysis-cell val" id="sw_live_y"></div>
        <div class="analysis-cell key">\\(v_x(t)\\)</div>                         <div class="analysis-cell val" id="sw_live_vx"></div>
        <div class="analysis-cell key">\\(v_y(t)\\)</div>                         <div class="analysis-cell val" id="sw_live_vy"></div>
        <div class="analysis-cell key">\\(\\vert \\vec v(t) \\vert\\)</div>      <div class="analysis-cell val" id="sw_live_vabs"></div>
      </div>
      <div class="ff-formel-note">Beim Umschalten zwischen (a) und (b) ändert sich \\(s_y\\), die Geschwindigkeit nicht.</div>`
 : `      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>                          <div class="analysis-cell val" id="sw_live_t"></div>
        <div class="analysis-cell key">Höhe \\(y(t)\\)</div>                       <div class="analysis-cell val" id="sw_live_y"></div>
        <div class="analysis-cell key">Weite \\(x(t)\\)</div>                      <div class="analysis-cell val" id="sw_live_x"></div>
        <div class="analysis-cell key">Scheitelhöhe</div>                          <div class="analysis-cell val" id="sw_live_ymax"></div>
        <div class="analysis-cell key">Wurfweite</div>                             <div class="analysis-cell val" id="sw_live_xmax"></div>
        <div class="analysis-cell key">Flugzeit \\(t_{\\mathrm{fall}}\\)</div>     <div class="analysis-cell val" id="sw_live_tfall"></div>
      </div>`}
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
${cfg.vektor ? `        <div class="formula-box-cap">Ortsvektor — hängt vom Ursprung ab</div>
        <div class="sw-nur-ursprung" data-ursprung="ground">\\[\\vec s(t) = \\begin{pmatrix} v_0\\cos(\\alpha)\\,t \\\\ -\\tfrac{1}{2}\\,g\\,t^2 + v_0\\sin(\\alpha)\\,t + h_0 \\end{pmatrix}\\]</div>
        <div class="sw-nur-ursprung" data-ursprung="start">\\[\\vec s(t) = \\begin{pmatrix} v_0\\cos(\\alpha)\\,t \\\\ -\\tfrac{1}{2}\\,g\\,t^2 + v_0\\sin(\\alpha)\\,t \\end{pmatrix}\\]</div>
        <div class="formula-box-cap">Geschwindigkeit — in (a) und (b) dieselbe</div>
        <div>\\[\\vec v(t) = \\dot{\\vec s}(t) = \\begin{pmatrix} v_0\\cos(\\alpha) \\\\ -g\\,t + v_0\\sin(\\alpha) \\end{pmatrix}\\]</div>
        <div class="ff-formel-note">Den Ursprung zu verschieben ändert den Ortsvektor um einen konstanten Vektor — hier um \\(h_0\\) in \\(y\\). Beim Ableiten nach \\(t\\) fällt eine Konstante weg, deshalb bleibt \\(\\vec v\\) gleich.</div>`
 : cfg.bahn ? `        <div class="formula-box-cap">Die Bahn — eine Gleichung ohne \\(t\\)</div>
        <div>\\[y(x) = -\\tfrac{1}{2}\\,\\frac{g}{v_0^2\\cos^2(\\alpha)}\\,x^2 + \\tan(\\alpha)\\,x + h_0\\]</div>
        <div class="ff-formel-note">Diese Parabel ist eine <em>andere</em> als die von \\(y(t)\\): sie beschreibt den Verlauf der Flugkurve durch den Raum — die Spur im Schnee —, nicht den zeitlichen Verlauf der Höhe. Entstanden ist sie, indem \\(t\\) aus \\(x(t)\\) und \\(y(t)\\) eliminiert wurde.</div>
        <div class="ff-formel-note">Die Kurve selbst ändert sich nicht mit der Zeit. Wiedergabe und Zeit-Regler zeigen, <em>wo auf ihr</em> das Objekt gerade ist — an der fertigen Kurve ist das hinterher nicht mehr abzulesen.</div>`
 : `        <div class="formula-box-cap">Zwei Gleichungen, ein Parameter \\(t\\)</div>
        <div>\\[x(t) = v_0\\cos(\\alpha)\\,t\\]</div>
        <div>\\[y(t) = -\\tfrac{1}{2}\\,g\\,t^2 + v_0\\sin(\\alpha)\\,t + h_0\\]</div>
        <div class="ff-formel-note">Beide Gleichungen beschreiben <em>dieselbe</em> Bewegung — deshalb braucht es zwei Ort-Zeit-Diagramme. Sie gelten vom Abwurf bis zum Aufschlag, also für \\(0 \\le t \\le t_{\\mathrm{fall}}\\).</div>
        <div class="ff-formel-note">Die Achse \\(y\\) zeigt nach oben und hat ihren Nullpunkt auf dem Erdboden; \\(x\\) zählt waagerecht ab dem Abwurfpunkt. \\(\\alpha\\) ist der Abwurfwinkel zum Erdboden.</div>`}
      </div>
    </div>
  </div>
</div>`;

// Versteckte Stubs: Groessen ausserhalb des Aspekts und die fuenf Checkboxen,
// ueber die dieser Motor die Sichtbarkeit gatet (er kennt keine show*-Flags).
// Nur die Flugbahn ist checked — sie ist der linke Teil der Abbildung. Der
// Motor schreibt in alle diese Elemente unbedingt; fehlt eins, gibt es einen
// Null-Zugriff (Runbook-Fallstrick #1).
// Abb. 1.18 zeigt vx/vy/|v| im Panel und hat keine Kennwert-Zellen — die
// jeweils fehlenden stehen hier (doppelte IDs waeren ein stiller Fehler).
const hiddenStub = (cfg) => `
<div style="display:none">
  ${cfg.vektor ? '<span id="sw_live_ymax"></span><span id="sw_live_xmax"></span><span id="sw_live_tfall"></span>'
               : '<span id="sw_live_vx"></span><span id="sw_live_vy"></span><span id="sw_live_vabs"></span>'}
  <span id="sw_live_ay"></span><span id="sw_live_vimpact"></span><span id="sw_live_aimpact"></span>
  <input type="checkbox" id="sw_toggle_trajectory" checked>
  <input type="checkbox" id="sw_toggle_velocity_vector"${cfg.vektor ? ' checked' : ''}>
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
      `<div class="aspekt-scene">${SVG_SCENE(cfg)}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH(cfg)}</div></div></div>` +
      `${panelRight(cfg)}</div>${hiddenStub(cfg)}`
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
    // ── Massstab, Zuschnitt und Breitenaufteilung (Abb. 1.14) ───────────────
    // Zwei Anforderungen, die diese Funktion zusammenbringt:
    //
    //   MASSSTABSGLEICH (Nutzerwunsch 2026-09-14): die Parabel in der Szene und
    //   die Parabel im Diagramm sind gleich gross und gleich geformt — man
    //   koennte sie durch blosses VERSCHIEBEN zur Deckung bringen. Das verlangt
    //   x und y im Diagramm mit DEMSELBEN Massstab (isotrop) UND denselben
    //   Bildschirm-Massstab wie die Szene.
    //
    //   FLAECHE NUTZEN (Nutzerwunsch 2026-09-16): beide Bilder sollen ihr Feld
    //   fuellen. Die erste Fassung hat nur den Massstab abgeglichen und beide
    //   Felder fest gelassen — die Bahn klebte im Diagramm in der linken oberen
    //   Ecke (x-Achse bis 40 m fuer einen Wurf von 16 m), und ueber der Bahn in
    //   der Szene stand die halbe Feldhoehe leeres Lineal. Bei einem steilen
    //   Wurf blieben vier Fuenftel des Diagramms leer, bei einem flachen zwei
    //   Drittel der Hoehe.
    //
    // DER KNIFF: BEIDE SVGs RECHNEN IN DERSELBEN EINHEIT. Ein Meter ist links
    // wie rechts dieselbe Zahl von viewBox-Einheiten (store.currentPixelsPerMeter,
    // hier P), und die Zeilenbreite wird im Verhaeltnis der beiden viewBox-
    // Breiten aufgeteilt. Dann bildet jedes SVG seine Einheiten mit DEMSELBEN
    // Faktor auf den Schirm ab, und daraus folgt beides auf einmal:
    //   * derselbe Bildschirm-Massstab — Massstabsgleichheit, ohne Nachrechnen;
    //   * dieselbe Schrift- und Strichgroesse links wie rechts. Das ist nicht
    //     nur Kosmetik: alle Beschriftungen sind in viewBox-EINHEITEN bemessen,
    //     ein Diagrammfeld mit vielen Einheiten auf wenig Bildschirmbreite
    //     schrumpft seine Achsenbeschriftung mit. Genau daran ist der erste
    //     Anlauf dieser Umstellung gescheitert: Massstab und Hoehen stimmten
    //     auf den Pixel, aber das Diagramm bildete 0,51 px je Einheit ab und
    //     die Szene 1,10 — die Achsenzahlen waren halb so gross wie die des
    //     Lineals daneben und kaum lesbar.
    //
    // Damit bleiben nur noch die FORMATE zu bestimmen, und die kommen direkt
    // aus der Bounding-Box des Wurfs: die Zeichenflaeche des Diagramms ist so
    // gross wie die Bahn (in Einheiten), die Szene wird auf ihren Inhalt
    // zugeschnitten. Was danach an Hoehe fehlt, bekommt die niedrigere Seite
    // als Zugabe — bis zu einem Deckel, damit daraus kein leeres Feld wird.
    //
    // Warum nicht einfach jede Achse fuer sich an ihre Daten legen? Das fuellt
    // das Diagramm perfekt, verzerrt die Parabel aber — und genau das duerfen
    // wir hier nicht: die Gegenueberstellung mit Abb. 1.9 lebt davon, dass die
    // Form stimmt.

    const GRAPH_PAD_L = 45, GRAPH_PAD_R = 10, GRAPH_PAD_T = 10, GRAPH_PAD_B = 35;
    // Raender der Diagramm-viewBox um die Zeichenflaeche des Motors herum:
    // links y-Marken + gedrehte Achsenbeschriftung, oben der Titel, rechts die
    // Achsenspitze und das letzte x-Label, unten die x-Achsenbeschriftung.
    // Bemessen an der SKALIERTEN Schrift (--kb-fs = 1,5), s. SVG_GRAPH.
    const VB_L = 56, VB_T = 48, VB_R = 24, VB_B = 12, VB_X_LABEL = 58;
    // Szene: die viewBox beginnt bei x=20, die Kugel startet bei x=136 — davor
    // liegen Hoehenlineal und Haus. Dieser Vorspann ist FEST in Szeneneinheiten
    // und der Grund, warum die Szene breiter ist als das Diagramm.
    const SZ_X0 = 20, SZ_VORSPANN = BALL_START_X_PX - SZ_X0, SZ_RAND_R = 24;
    const SZ_BAHN_MAX = ANIM_W + SZ_X0 - BALL_START_X_PX - SZ_RAND_R;  // = 210
    const P_MAX = DEFAULT_PIXELS_PER_METER * 2.0;   // Deckel wie in der Sim:
    // darueber wuerden Linealbreite und Schriftgroessen (feste Szeneneinheiten)
    // gegenueber der Bahn zu klein.
    // Untergrenze der Zeichenflaeche: bei einem sehr flachen Wurf waere das
    // Diagrammfeld sonst 55 Einheiten hoch — bei 17 Einheiten Schrifthoehe
    // saessen die y-Marken uebereinander. Die betroffene Achse bekommt dann
    // mehr Bereich als noetig; isotrop bleibt es, weil nur eine Seite waechst
    // und die andere Achse denselben Massstab behaelt.
    const PLOT_MIN = 130;
    const klemm = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    // Waagerechte Polsterung eines Kastens. Sie ist links und rechts
    // verschieden (Szene 8/0, Diagramm 8/8, in der Lupe 12) und geht in die
    // Breitenaufteilung ein: aufgeteilt wird die Breite der BILDER, nicht die
    // der Kaesten — sonst bekommt die Seite mit mehr Polsterung zu wenig.
    function polsterung(elm) {
        const cs = getComputedStyle(elm);
        return parseFloat(cs.paddingLeft || 0) + parseFloat(cs.paddingRight || 0);
    }

    function massstabAbgleichen() {
        if (!cfg.bahn) { store.bahnAchse = null; store.graphSize = null; return; }
        const svgS = q('main_svg'), svgG = q('graph_svg');
        const kastenS = scene.querySelector('.aspekt-scene');
        const zeile = scene.querySelector('.aspekt-main-content');
        if (!svgS || !svgG || !kastenS || !zeile) return;

        // ── Bounding-Box des Wurfs ─────────────────────────────────────────
        // Aus den DATEN, nicht aus axisLimits.{min,max}: die tragen bereits
        // 10 % Rand des Motors, und diese Funktion legt ihren Rand selbst fest.
        // Mit den gepolsterten Werten gerechnet kam ein knappes Zehntel zu
        // wenig Zoom heraus (0,92x statt 1,02x).
        const xs = store.axisLimits.xt.fullData;
        const ys = store.axisLimits.yt_display.fullData;
        if (!xs || !xs.length || !ys || !ys.length) return;
        const bx = Math.max(0.01, Math.max(...xs));
        const yLo = Math.min(0, Math.min(...ys));
        const yHi = Math.max(...ys);
        const by = Math.max(0.01, yHi - yLo);
        const xNoetig = bx * 1.06;         // etwas Luft hinter dem Aufschlag
        const yNoetig = by * 1.10;         // Luft ueber Scheitel und unter Boden

        // ── Die gemeinsame Einheit ─────────────────────────────────────────
        // P = viewBox-Einheiten je Meter, in BEIDEN SVGs. Der Wurf soll die
        // Szene ausfuellen; begrenzt wird nur durch deren Breite und den Deckel.
        const P = Math.min(P_MAX, SZ_BAHN_MAX / xNoetig);
        store.currentPixelsPerMeter = P;
        store.zoomFactor = P / DEFAULT_PIXELS_PER_METER;

        // ── Formate ────────────────────────────────────────────────────────
        // Zeichenflaeche des Diagramms = die Bahn, in derselben Einheit.
        const plotW = Math.max(PLOT_MIN, xNoetig * P);
        const plotH = Math.max(PLOT_MIN, yNoetig * P);

        // Szenenbreite: Vorspann + Wurf + Rand. Das Achsenkreuz zeichnet
        // 60 * zoom Einheiten nach rechts und schreibt "x / m" dahinter — bei
        // kurzer Wurfweite ist ES das breiteste Element, nicht die Bahn.
        const szW = SZ_VORSPANN + Math.max(xNoetig * P, 60 * store.zoomFactor + 34)
                    + SZ_RAND_R;
        const vbW = VB_L + GRAPH_PAD_L + plotW + GRAPH_PAD_R + VB_R;

        // ── Hoehen angleichen ──────────────────────────────────────────────
        // y-Bereich zu einer gegebenen Feldhoehe: die Bahn sitzt darin, der
        // Ueberschuss geht ueberwiegend nach OBEN. Mittig zentriert stuende
        // unter dem Erdboden genauso viel negative Hoehe wie ueber dem Scheitel
        // Himmel — bei einem flachen Wurf, wo die Mindesthoehe des Feldes
        // greift, reichte die Achse bis -13 m. Unterhalb von 0 braucht es nur
        // so viel, dass die Nulllinie nicht auf dem Feldrand klebt.
        const bahnAchse = (ph) => {
            const spanne = ph / P;
            const unten = Math.min((spanne - by) / 2, 0.08 * spanne);
            return { xMax: plotW / P, yMin: yLo - unten, yMax: yLo - unten + spanne };
        };
        // Die x-Achse liegt bei y = 0 der Bahnachse, also nicht zwangslaeufig
        // am Feldboden; liegt sie hoeher, braucht die viewBox unten weniger.
        // nullLinie() ist ihre Hoehe in viewBox-Einheiten des Diagramms.
        const nullLinie = (ph) => {
            const a = bahnAchse(ph);
            return VB_T + GRAPH_PAD_T + ph * klemm(a.yMax / (a.yMax - a.yMin || 1), 0, 1);
        };
        const vbH = VB_T + Math.max(GRAPH_PAD_T + plotH, nullLinie(plotH) - VB_T + VB_X_LABEL) + VB_B;

        // ── Szene auf die Diagrammhoehe, Erdboden auf die Nulllinie ────────
        // P16-7a, Punkt 1 (Nutzerbefund 2026-09-14): die Nulllinien beider
        // Bilder sollen auf gleicher Hoehe liegen. Beide viewBoxen bilden mit
        // demselben Faktor ab (s. Breitenaufteilung) — ist die Szene also
        // genauso hoch wie das Diagramm und liegt ihr Erdboden genauso weit
        // unter der Oberkante wie dessen Nulllinie, stehen beide Linien auf
        // demselben Pixel. Platz ist immer da: ueber der Nulllinie hat das
        // Diagramm Titel und Rand PLUS die ganze Bahnhoehe, unter ihr die
        // x-Beschriftung — beides mehr, als die Szene braucht (Bahn + Luft
        // bzw. "x / m" unter dem Boden). Bis 2026-09-26 bekam die Szene nur eine
        // begrenzte Zugabe an Himmel und wurde mittig ausgerichtet; der Boden
        // lag dadurch 30-80 px unter der Nulllinie.
        const szH = vbH;
        const bodenAbstand = nullLinie(plotH);      // Oberkante -> Erdboden

        // ── Breitenaufteilung ──────────────────────────────────────────────
        const gestapelt = getComputedStyle(zeile).flexDirection.startsWith('column');
        let vbWeff = vbW, szWeff = szW;
        if (!gestapelt) {
            // Im Verhaeltnis der viewBox-Breiten aufteilen: dann bildet jede
            // Seite ihre Einheiten mit demselben Faktor ab (s. Kopf). Die
            // Polsterung beider Kaesten geht vorher ab und danach wieder drauf.
            const polS = polsterung(kastenS);
            const bilder = zeile.getBoundingClientRect().width
                         - polS - polsterung(scene.querySelector('.aspekt-graph'));
            if (bilder > 0) {
                // In Pixeln, nicht in Prozent: flex-basis meint bei
                // content-box die INNENbreite, und die ist es, die sich zur
                // viewBox-Breite verhaelt. Mit einem Prozentwert der
                // Zeilenbreite gerechnet wanderte die Polsterung zusaetzlich
                // in den Kasten und die beiden Faktoren liefen 5 % auseinander.
                const basis = bilder * szW / (szW + vbW)
                            + (getComputedStyle(kastenS).boxSizing === 'border-box' ? polS : 0);
                kastenS.style.flex = `0 0 ${basis.toFixed(1)}px`;
            }
        } else {
            // Gestapelt (schmaler Breiten-Modus) sind beide Kaesten gleich
            // breit — dann muessen es auch die beiden viewBoxen sein, sonst
            // faellt der gemeinsame Faktor auseinander. Die schmalere Seite
            // bekommt den Unterschied als symmetrischen Rand; als Nebeneffekt
            // stehen die beiden Bilder genau uebereinander.
            kastenS.style.flex = '';
            vbWeff = szWeff = Math.max(szW, vbW);
        }

        // ── viewBoxen und Achsen setzen ────────────────────────────────────
        store.graphSize = { w: GRAPH_PAD_L + plotW + GRAPH_PAD_R,
                            h: GRAPH_PAD_T + plotH + GRAPH_PAD_B };
        store.bahnAchse = bahnAchse(plotH);
        svgG.setAttribute('viewBox',
            `${(-(vbWeff - vbW) / 2).toFixed(1)} 0 ${vbWeff.toFixed(1)} ${vbH.toFixed(1)}`);

        const szTop = GROUND_PX - bodenAbstand;
        // Auch NEGATIV weitergeben: bei einem Wurf ueber 18 m reicht das Feld
        // hoeher hinauf als die viewBox der Sim (Erdboden bei 440 px). Auf 0
        // geklemmt endete das Hoehenlineal dann mitten im Bild, unterhalb des
        // Bahnscheitels — es rechnet gegen dieselbe Groesse (s. drawRuler).
        store.animTopPx = szTop;
        svgS.setAttribute('viewBox',
            `${(SZ_X0 - (szWeff - szW) / 2).toFixed(1)} ${szTop.toFixed(1)} ` +
            `${szWeff.toFixed(1)} ${szH.toFixed(1)}`);
        // Die Zoom-Anzeige sitzt in der Luecke ueber dem Hoehenlineal und muss
        // mit dem Zuschnitt mitwandern.
        const zt = q('zoom_text_display');
        if (zt) zt.setAttribute('y', (szTop + 16).toFixed(1));
    }

    // Ortsvektor (nur Abb. 1.18): vom Ursprung der Achsenskizze zur Kugel.
    // Der Ursprung liegt wie in drawAnimationCoordSystem() bei x = Abwurfpunkt
    // und y = Erdboden (a) bzw. Abwurfhoehe (b).
    // Die SPITZE soll im Kugelmittelpunkt enden: der Marker (refX = 0) setzt
    // sie HINTER das Linienende, 4,95 Strichstaerken lang — die Linie endet
    // also um genau diese Laenge vorher (dieselbe Kopplung wie ARROW_LEN in den
    // Kreisbewegungs-Figuren, s. aspekt_kreisbahn.css). Die Strichstaerke kommt
    // aus dem CSS und wird deshalb gemessen. Ist der Vektor kuerzer als seine
    // Spitze (kurz nach dem Start in (b)), bleibt er aus — eine Spitze, die
    // ueber den Ursprung hinausragt, waere falsch. Inside withStore aufrufen.
    const ortLinie = q('position_vector');
    const PFEIL_LAENGE = 4.95;                 // markerWidth von sw_arrow-ort
    function ortsvektor(x, y) {
        const x1 = scaleX(0), y1 = scaleY(store.yAxisConfig.origin === 'start' ? store.h0 : 0);
        const dx = scaleX(x) - x1, dy = scaleY(y) - y1;
        const len = Math.hypot(dx, dy);
        const spitze = PFEIL_LAENGE * (parseFloat(getComputedStyle(ortLinie).strokeWidth) || 2.5);
        if (len <= spitze) { ortLinie.setAttribute('visibility', 'hidden'); return; }
        const k = (len - spitze) / len;
        ortLinie.setAttribute('visibility', 'visible');
        ortLinie.setAttribute('x1', x1); ortLinie.setAttribute('y1', y1);
        ortLinie.setAttribute('x2', x1 + dx * k); ortLinie.setAttribute('y2', y1 + dy * k);
    }

    // Zuschnitt der Szene (nur Abb. 1.18). Ohne Diagramm ist die Szene das
    // ganze Bild; ungeschnitten nutzte ein ueblicher Wurf (h0 = v0 = 10,
    // 45 Grad) nur das untere Drittel, darueber stand leeres Lineal bis 35 m.
    // Einfacher als bei 1.14 (dort muss die Szene zum Diagramm passen): der
    // Zoom der Sim bleibt, wie er ist, nur der Himmel ueber dem Wurf wird
    // abgeschnitten — so weit, dass Scheitel, Achsenskizze in (b) und die
    // Zoom-Anzeige Platz haben. Danach rechnet recomputeDerived() gegen das
    // kleinere Feld noch einmal; weil das Feld gerade so hoch ist wie noetig,
    // kommt derselbe Zoom heraus. Inside withStore aufrufen.
    const ZS_LUFT_OBEN = 34;        // Zoom-Anzeige + Luft ueber dem Scheitel
    function szeneZuschneiden() {
        store.animTopPx = 0;
        recomputeDerived();
        const P = store.currentPixelsPerMeter;
        const noetig = Math.max(maxHeight() * 1.1 * P,
                                store.h0 * P + 60 * store.zoomFactor + 24)  // Achsenskizze in (b)
                     + ZS_LUFT_OBEN;
        const top = Math.max(0, GROUND_PX - noetig);
        store.animTopPx = top;
        recomputeDerived();
        q('main_svg').setAttribute('viewBox', `20 ${top.toFixed(1)} 350 ${(500 - top).toFixed(1)}`);
        const zt = q('zoom_text_display');
        if (zt) zt.setAttribute('y', (top + 16).toFixed(1));
    }

    function zeichne() {
        rt.withStore(() => {
            const s = interpolateAt(t);
            if (!s) return;
            updateScene(s.t, s.x, s.y, s.vx, s.vy);
            if (cfg.vektor) { ortsvektor(s.x, s.y); return; }   // kein Diagramm
            // Der Massstab haengt nicht von t ab: er wird in rebuild() gesetzt
            // (und bei Breitenaenderung), nicht je Frame. Frueher stand hier
            // bahnAchseSetzen(), das zwei getBoundingClientRect() pro Frame kostete.
            // updateGraphs(plotTime, wert1, wert2, currentX, currentY): Slot 1
            // ist y(t), Slot 2 x(t) — die Reihenfolge der Bildunterschrift von
            // v0.13. currentX/currentY wertet der Motor nur im EINZEL-Modus aus
            // — dort sind sie der mitlaufende Punkt AUF der Bahnkurve, ohne sie
            // waere die Bahn-Figur nur eine Kurve ohne Objekt.
            updateGraphs(s.t, s.y, s.x, s.x, s.y);
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
            if (cfg.vektor) szeneZuschneiden();
            precompute();
            tEnd = flightTime();

            // Abb. 1.14 rechnet Zoom, Zuschnitt und Achsen selbst — VOR den
            // statischen Szenenteilen, die alle am Zoom haengen (Lineale,
            // Strichmaennchen, Ballradius, Achsenkreuz).
            massstabAbgleichen();

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
        // Abb. 1.14 springt ans ENDE statt auf 0: dort ist die Bahnkurve
        // vollstaendig gezeichnet, und sie IST der Gegenstand dieser Abbildung.
        // Auf 0 zurueckzuspringen hiesse, nach jedem Regler-Zug ein leeres
        // Diagramm zu zeigen. Der Grund von Fallstrick #20 bleibt gewahrt: die
        // Kugel steht am Ende der NEUEN Bahn, nicht mitten in einer alten.
        // Abb. 1.18 springt auf 40 % der Flugzeit: dort sind Orts- und
        // Geschwindigkeitsvektor beide deutlich zu sehen (s. Kopf).
        const tNachParam = cfg.bahn ? tEnd : cfg.vektor ? 0.4 * tEnd : 0;
        if (!behalteZeit) { stop(); t = tNachParam; tSlider.value = String(t); }
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

    // Tempo-Pillen: der aktive Zustand ist eine KLASSE, nicht :checked — das
    // <input> liegt unsichtbar im <label> (s. aspekt_freier_fall.css). Ohne
    // dieses Nachziehen bliebe keine Pille hervorgehoben.
    speedRadios.forEach(r => r.addEventListener('change', () => {
        speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));
    }));
    speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));

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

    // ── Ursprung (a)/(b), nur Abb. 1.18 ────────────────────────────────────
    // Kein kurvenformender Regler: Zeit und Wiedergabe laufen weiter (s. Kopf).
    // Die Formelkarte zeigt die zum Ursprung passende Gleichung; beide sind
    // einmal gesetzt, umgeschaltet wird nur die Sichtbarkeit (MathJax setzt
    // die Karte nur einmal).
    const ursprungRadios = [...scene.querySelectorAll(`input[name="${p}ursprung"]`)];
    function ursprungSetzen(wert) {
        fig.dataset.ursprungAktiv = wert;
        ursprungRadios.forEach(r => r.closest('.speed-pill').classList.toggle('active', r.value === wert));
        rt.withStore(() => {
            store.yAxisConfig = { direction: 'up', origin: wert };
            drawAnimationCoordSystem();
        });
        zeichne();
    }
    ursprungRadios.forEach(r => r.addEventListener('change', () => { if (r.checked) ursprungSetzen(r.value); }));

    // ── Erststand ───────────────────────────────────────────────────────────
    rt.withStore(() => {
        // Aspekt-Gating: Diagramm-Zuschnitt je Abbildung (s. Kopf), Achse fest,
        // keine Vergleichsbahn. graphType2 bleibt gesetzt, im Einzelmodus liest
        // updateGraphs() ihn nicht.
        Object.assign(store, {
            // Der Zoom muss dasselbe Feld meinen wie die viewBox (s. ANIM_TOP_BAHN).
            animTopPx: cfg.bahn ? ANIM_TOP_BAHN : 0,
            isStacked: !cfg.bahn,
            graphType1: cfg.bahn ? 'yx' : 'yt',
            graphType2: 'xt',
            yAxisConfig: { direction: 'up', origin: cfg.vektor ? cfg.ursprung : 'ground' },
            frozenTraj: null,
            isDigitalDisplay: false,
        });
        drawStopwatchMarks();
        drawSubdialMarks();
    });
    rebuild(false);
    if (cfg.vektor) ursprungSetzen(cfg.ursprung);

    // Der Massstabsabgleich braucht die TATSAECHLICHEN Elementbreiten; beim
    // ersten rebuild() steht das Layout noch nicht (die Figur wird gebaut,
    // bevor sie ihre Breite hat) und die Achsen blieben die des Motors. Einmal
    // nach dem naechsten Frame nachziehen — und danach bei jeder Breiten-
    // aenderung, denn mit ihr aendert sich der Massstab beider Bilder.
    // Ohne ResizeObserver (jsdom im Smoke-Test) passiert schlicht nichts.
    if (cfg.bahn) {
        requestAnimationFrame(() => rebuild(true));
        if (typeof ResizeObserver !== 'undefined') {
            let letzteBreite = 0;
            new ResizeObserver(() => {
                // Gemessen wird die ZEILE, nicht eines der beiden SVGs: deren
                // Breite setzt diese Funktion selbst (flex-basis), ein Echo
                // waere eine Endlosschleife.
                const z = scene.querySelector('.aspekt-main-content');
                const b = z && z.getBoundingClientRect();
                if (!b || Math.abs(b.width - letzteBreite) < 1) return;   // kein Echo
                letzteBreite = b.width;
                rebuild(true);
            }).observe(scene);
        }
    }
}
