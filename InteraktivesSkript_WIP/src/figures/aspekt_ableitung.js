// aspekt_ableitung.js — interaktive Aspekt-Figur zu Abbildung 1.15 (1.1.10
// „Geschwindigkeit"): der Unterschied zwischen DURCHSCHNITTS- und
// MOMENTANGESCHWINDIGKEIT an einem Ort-Zeit-Diagramm.
//
// Die Abbildung zeigt genau EINEN Sachverhalt, und zwar einen, den man sehen
// muss, um ihn zu glauben: im Intervall [8 s; 16 s] ist die Durchschnitts-
// geschwindigkeit (Steigung der SEKANTE) POSITIV, die Momentangeschwindigkeit
// bei t = 12 s (Steigung der TANGENTE) aber NEGATIV. Wer Δx/Δt nimmt, wo die
// Ableitung gemeint ist, bekommt hier nicht einmal das richtige Vorzeichen.
//
// Die gedruckte Abbildung nennt ihre Funktionsgleichung im Titel; sie ist als
// Funktion 'skript' im Motor hinterlegt (s. ableitung/constants.js) und
// zahlenmaessig nachgerechnet: x(12 s) = 0,46 m, Tangente −0,66 m/s, Sekante
// +0,11 m/s bei Δx = 0,84 m — dieselben Werte, die in der Abbildung stehen.
//
// VORLAGE (Kaskade, s. INTERAKTIVE_ASPEKT_FIGUREN.md Abschnitt 0a):
//   1. Interaktionsmuster: rein slider-/schalter-getrieben, keine Animation
//      -> aspekt_grundbegriffe.js (Abb. 1.1) ist die Modul-Vorlage. Uebernommen:
//      Factory-Signatur + Reentry-Guard, Skelett mit Prefix-Replace, bindDom,
//      Lupe, data-caption-Bau, Panel-/Legenden-Klassen, Steuerzeilen.
//   2. Stand-alone-Sim: Project_ableitung_simulation — sie IST dieser Aspekt,
//      deshalb ein eigener (fuenfter) Motor. Weggelassen: die Funktionsauswahl
//      (das Skript zeigt EINE Kurve), die Umschaltung zentriert/vorwaerts (die
//      Bildunterschrift spricht von einem Intervall UM t herum) und die
//      Schalter fuer Δ-Werte/Steigungs-Readouts (sie sind der Inhalt, nicht
//      eine Option).
//   3. Statische v0.13-Abbildung: gibt den Startzustand vor — t = 12 s,
//      Δt = 8 s, also die Stuetzpunkte 8 s und 16 s der Bildunterschrift.
//
// ASPEKT-GATING: funcKey fest 'skript', centered fest true, Definitionsbereich
// 0…20 s (die Abbildung zeigt genau das), δ bis 10 s statt der 5 der Sim (die
// Vorgabe der Abbildung ist 8 s). Beschriftung auf Zeit/Ort umgestellt: Achsen
// „t / s" und „x / m", Differenzen Δt und Δx, Steigungen in m/s — sonst stuende
// „Δy" an einer Groesse, die der Text x nennt.
//
// DER DIDAKTISCHE KERN ist der Δt-Regler: zieht man ihn gegen 0, legt sich die
// Sekante auf die Tangente und die beiden Zahlenwerte laufen zusammen. Genau
// das ist der Grenzuebergang, den der Abschnitt beschreibt.

import { store, DOM } from './ableitung/state.js';
import { sampleCurve, yRange, analyze, maxAbsDelta } from './ableitung/physics.js';
import { drawGraph, updateOverlay, updateAnalysis } from './ableitung/render.js';
import { GRAPH_W, GRAPH_H } from './ableitung/constants.js';
import { createRuntime } from './ableitung/runtime.js';
import { ge } from '../core.js';

// Startwerte = die gedruckte Abbildung.
const T_MIN = 1, T_MAX = 19, T_STEP = 0.1, T_DEFAULT = 12;
const DT_MIN = 0.2, DT_MAX = 10, DT_STEP = 0.1, DT_DEFAULT = 8;
const X_VON = 0, X_BIS = 20;

const SVG_SCENE = `
<svg id="ab_graph_svg" viewBox="0 0 ${GRAPH_W} ${GRAPH_H}" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <defs>
    <marker id="ab_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <clipPath id="ab_plot_clip"><rect id="ab_plot_clip_rect"/></clipPath>
  </defs>
  <!-- Gitter, Achsen, Ticks (drawGraph) -->
  <g id="ab_grid_group"></g>
  <!-- Titel-Platzhalter des Motors: hier ohne Inhalt, die Funktionsgleichung
       steht in der Physik-Sektion des rechten Panels. -->
  <foreignObject id="ab_graph_title_fo" height="34" style="overflow:visible"></foreignObject>
  <g clip-path="url(#ab_plot_clip)">
    <polyline id="ab_func_line" fill="none" points=""/>
    <line id="ab_tri_h"/><line id="ab_tri_v"/>
    <polyline id="ab_secant_line" fill="none" points=""/>
    <polyline id="ab_tangent_line" fill="none" points=""/>
    <circle id="ab_p1_dot" r="5"/><circle id="ab_p2_dot" r="5"/>
    <circle id="ab_point" r="6"/>
  </g>
  <text id="ab_dx_text" text-anchor="middle" class="ab-delta-text"></text>
  <text id="ab_dy_text" class="ab-delta-text"></text>
  <text id="ab_tan_slope_text" class="ab-slope-text ab-slope-tan"></text>
  <text id="ab_sec_slope_text" class="ab-slope-text ab-slope-sec"></text>
</svg>`;

const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">Zeitpunkt \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP}" value="${T_DEFAULT}">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
    <div class="slider-label">Intervallbreite \\(\\Delta t\\)</div>
    <div class="slider-row">
      <input id="ak_dt" type="range" min="${DT_MIN}" max="${DT_MAX}" step="${DT_STEP}" value="${DT_DEFAULT}">
      <span class="slider-val" id="ak_dt_out"></span>
    </div>
    <div class="aspekt-hint">Das Intervall liegt symmetrisch um \\(t\\): von \\(t-\\tfrac{\\Delta t}{2}\\) bis \\(t+\\tfrac{\\Delta t}{2}\\). Ziehen Sie \\(\\Delta t\\) gegen null — die Sekante legt sich auf die Tangente.</div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Darstellung</div>
    <div class="vis-control-row" id="ak_row_sek">
      <input type="checkbox" id="ak_tog_sek" checked>
      <span class="vis-control-label ab-label-sec">Sekante (Durchschnitt)</span>
    </div>
    <div class="vis-control-row" id="ak_row_tan">
      <input type="checkbox" id="ak_tog_tan" checked>
      <span class="vis-control-label ab-label-tan">Tangente (Momentan)</span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="ab-kurve"></div><div class="legend-label">Ort \\(x(t)\\)</div>
      <div class="legend-swatch" data-c="ab-sec"></div>  <div class="legend-label">Sekante: \\(\\bar v=\\tfrac{\\Delta x}{\\Delta t}\\)</div>
      <div class="legend-swatch" data-c="ab-tan"></div>  <div class="legend-label">Tangente: \\(v(t)=\\dot x(t)\\)</div>
      <div class="legend-swatch" data-c="ab-punkt"></div><div class="legend-label">Stützpunkt bei \\(t\\)</div>
    </div>
  </div>
</div>`;

const PANEL_RIGHT = `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" data-tip="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
      <div class="analysis-grid">
        <div class="analysis-cell key">Zeitpunkt \\(t\\)</div>                    <div class="analysis-cell val" id="ab_an_x0"></div>
        <div class="analysis-cell key">Intervall \\(\\Delta t\\)</div>            <div class="analysis-cell val" id="ab_an_dx"></div>
        <div class="analysis-cell key">Ortsänderung \\(\\Delta x\\)</div>         <div class="analysis-cell val" id="ab_an_dy"></div>
        <div class="analysis-cell key">Durchschnitt \\(\\bar v\\)</div>           <div class="analysis-cell val" id="ab_an_msec"></div>
        <div class="analysis-cell key">Momentan \\(v(t)\\)</div>                  <div class="analysis-cell val" id="ab_an_mtan"></div>
        <div class="analysis-cell key">Unterschied</div>                          <div class="analysis-cell val" id="ab_an_diff"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Zwei verschiedene Größen</div>
        <div>\\[\\bar v = \\frac{\\Delta x}{\\Delta t} \\qquad v(t) = \\dot x(t) = \\lim_{\\Delta t \\to 0}\\frac{\\Delta x}{\\Delta t}\\]</div>
        <div class="ff-formel-note">Die gezeigte Bewegung ist \\[x(t) = \\tfrac{1}{1000}\\left(-4\\,\\tfrac{\\mathrm m}{\\mathrm s^2}(t+2\\,\\mathrm s)^2 - 4\\,\\tfrac{\\mathrm m}{\\mathrm s}(t+2\\,\\mathrm s) - 20\\,\\mathrm m\\right)\\sin\\!\\left(\\tfrac{t}{1\\,\\mathrm s}\\right)\\]</div>
        <div class="ff-formel-note">In der Vorgabe \\(t=12\\,\\mathrm{s}\\), \\(\\Delta t=8\\,\\mathrm{s}\\) haben beide nicht einmal dasselbe <em>Vorzeichen</em>: die Sekante steigt, die Tangente fällt.</div>
      </div>
    </div>
  </div>
</div>`;

// ── Factory ──────────────────────────────────────────────────────────────────
export function buildAbleitungFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);
    scene.innerHTML =
        `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`)}` +
        `<div class="aspekt-main"><div class="aspekt-main-content">` +
        `<div class="aspekt-graph">${SVG_SCENE.replace(/ab_/g, p)}</div></div></div>` +
        `${PANEL_RIGHT.replace(/id="ab_/g, `id="${p}`)}</div>`;
    rt.bindDom();

    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.dataset.tip = 'Figur vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    scene.querySelector('.aspekt-graph').appendChild(lupe);

    if (fig.dataset.caption) {
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        scene.querySelector('.aspekt-body').appendChild(cap);
    }

    const tSlider = ge(p + 'ak_t'), dtSlider = ge(p + 'ak_dt');
    const togSek = ge(p + 'ak_tog_sek'), togTan = ge(p + 'ak_tog_tan');
    const n = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');

    function zeichne() {
        rt.withStore(() => {
            store.x0 = parseFloat(tSlider.value);
            // δ an den Rand koppeln (maxAbsDelta): naeher als Δt/2 an den Rand
            // geht nicht, sonst laege ein Stuetzpunkt ausserhalb der Kurve.
            const grenze = maxAbsDelta(store.x0);
            const dt = Math.min(parseFloat(dtSlider.value), grenze);
            store.delta = dt;
            dtSlider.max = String(Math.max(DT_MIN, grenze).toFixed(1));
            store.showSecant = togSek.checked;
            store.showTangent = togTan.checked;
            store.showSecantSlope = togSek.checked;
            store.showTangentSlope = togTan.checked;
            store.showDeltaValues = togSek.checked;   // Δ-Dreieck gehoert zur Sekante
            store.analysis = analyze(store.funcKey, store.x0, store.delta, true);
            drawGraph();
            updateOverlay();
            updateAnalysis();
            ge(p + 'ak_t_out').textContent = n(store.x0, 1) + ' s';
            ge(p + 'ak_dt_out').textContent = n(store.delta, 1) + ' s';
        });
    }

    [tSlider, dtSlider].forEach(el => el.addEventListener('input', zeichne));
    [togSek, togTan].forEach(el => el.addEventListener('change', zeichne));
    // Klick auf die Zeile schaltet die Checkbox mit (Vorlagen-Verhalten).
    for (const [row, box] of [[ge(p + 'ak_row_sek'), togSek], [ge(p + 'ak_row_tan'), togTan]]) {
        if (!row || !box) continue;
        row.addEventListener('click', e => {
            if (e.target !== box) { box.checked = !box.checked; box.dispatchEvent(new Event('change')); }
        });
    }

    // Erststand: Gating + Kurve einmal abtasten (sie aendert sich nie).
    rt.withStore(() => {
        Object.assign(store, {
            funcKey: 'skript',
            centered: true,
            xMin: X_VON, xMax: X_BIS,
            deltaLimit: DT_MAX,
            achsX: 't / s', achsY: 'x / m',
            symX: 't', symY: 'x',
            steigEinheit: ' m/s',
        });
        store.curve = sampleCurve(store.funcKey);
        const r = yRange(store.curve.ys);
        store.yMin = r.yMin; store.yMax = r.yMax;
    });
    zeichne();
}
