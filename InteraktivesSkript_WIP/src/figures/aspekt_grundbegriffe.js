// aspekt_grundbegriffe.js — interaktive Aspekt-Figur zu Abbildung 1.1
// (1.1.4 „Der Ort"). Zeigt die Grundbegriffe der Kinematik an EINER festen
// Bahnkurve: die ganze Strecke s(t), die Ortsvektoren s_A/s_B zu zwei frei
// waehlbaren Zeitpunkten, die Weglaenge s_AB entlang der Bahn, die
// Verschiebung Δs (beide Richtungen) und den Abstand |Δs|.
//
// VORLAGE (Kaskade, s. INTERAKTIVE_ASPEKT_FIGUREN.md Abschnitt 0a):
//   1. Interaktionsmuster: rein slider-/schalter-getrieben, keine Animation
//      -> aspekt_kreisbahn.js (Abb. 1.38) ist die Modul-Vorlage. Uebernommen:
//      Factory-Signatur + Reentry-Guard, Skelett-Templates mit Prefix-Replace,
//      rt.bindDom(), Lupe-Button, data-caption-Bau, Panel-/Legenden-Klassen.
//      NICHT uebernommen: Ablaufleiste/Auto-Stopp (gibt es hier nicht) und der
//      greifbare Punkt (A/B liegen auf einer Kurve, die Zeit ist der natuerliche
//      Freiheitsgrad — Ziehen wuerde denselben Regler doppelt bedienen).
//   2. Stand-alone-Sim: Input/Simulationen/Project_grundbegriffe_kinematik_-
//      simulation. Diese Sim IST die Figur — sie zeigt exakt die Begriffe der
//      Bildunterschrift von Abb. 1.1. Deshalb ein DRITTER Motor
//      (src/figures/grundbegriffe/): weder kreisbewegung (2D-Draufsicht) noch
//      kreis_spiral (ISO) koennen eine beliebige Bahnkurve zeichnen, beide sind
//      auf Kreis-/Spiralbahnen festgelegt. Aus der Sim uebernommen: Bahnkurve,
//      Diagramm-Geometrie, Steuerzeilen mit Hover-Hervorhebung + Wertanzeige,
//      die acht Erklaer-Varianten der Analyse-Seitenleiste.
//   3. Statische v0.13-Abbildung: gibt den START-Zustand vor (s. DEFAULT_TOGGLES).
//
// ABWEICHUNG von der Bildunterschrift (bewusst, v0.13-Quellenwiderspruch):
// Die Bildunterschrift von Abb. 1.1 nennt den Pfeil von A nach B „Δs_AB",
// waehrend Gleichung (2) desselben Abschnitts Δs_BA = s_B − s_A definiert —
// also den Pfeil von A nach B. Die interaktive Figur folgt der GLEICHUNG
// (Δs_BA zeigt von A nach B) und bietet die Gegenrichtung Δs_AB zusaetzlich
// als abschaltbaren Vektor an. Damit ist sie in sich konsistent und deckt den
// Widerspruch fuer die Lesenden auf, statt ihn zu wiederholen.
//
// TECHNIK: kein eigener Zeichencode — der Motor (src/figures/grundbegriffe/)
// zeichnet, diese Datei baut nur Skelett, Bedienung und Verdrahtung. Alle
// Motor-Aufrufe laufen inside rt.withStore(...) (Per-Instanz-Isolation, s.
// grundbegriffe/runtime.js).

import { store, DOM } from './grundbegriffe/state.js';
import { computePath, deriveAB } from './grundbegriffe/physics.js';
import { drawGrid, updateVisualization, updateAnalysisBox, computeBoundsFit } from './grundbegriffe/render.js';
import { T_MIN, T_MAX, T_STEP, TA_DEFAULT, TB_DEFAULT, TOGGLE_KEYS, GRAPH_W } from './grundbegriffe/constants.js';
import { createRuntime } from './grundbegriffe/runtime.js';
import { ge } from '../core.js';

// Start-Zustand = die STATISCHE Abb. 1.1 (Nutzervorgabe: Wiedererkennungswert).
// Dort sind Bahn, beide Ortsvektoren, das hervorgehobene Bahnstueck, EIN
// Verschiebungsvektor (A->B) und die Abstands-Bemassung zu sehen — die
// Gegenrichtung Δs_AB zeigt die Abbildung nicht, sie bleibt daher aus
// (zwei gestrichelte Pfeile auf derselben Linie wuerden sich ueberdecken).
const DEFAULT_TOGGLES = {
    pathBg: true, sA: true, sB: true, weg: true,
    verschiebung_BA: true, verschiebung_AB: false, abstand: true,
};

// Szene: die Diagramm-SVG der Vorlage. Die viewBox-Hoehe wird beim Bau aus dem
// DATENbereich gesetzt (computeBoundsFit, s. unten) — der Platzhalterwert hier
// ist nur gueltig, bis refresh() ihn ersetzt.
// Marker-Geometrie 1:1 aus der Sim (refX=0 + shortenEnd(…, 5·strokeWidth) in
// render.js) -> die Spitze landet exakt auf dem Zielpunkt. markerUnits bleibt
// der Default (strokeWidth), damit Spitze und Schaft gemeinsam skalieren —
// die Verkuerzung im Motor ist an dieselbe Strichstaerke gekoppelt.
const SVG_SCENE = `
<svg id="gk_graph_svg" viewBox="0 0 600 455" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="gk_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
    <marker id="gk_arrowhead-pos" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="gk_arrowhead-dba" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="gk_arrowhead-dab" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
  </defs>
  <!-- Statisches Gitter/Achsen/Titel (drawGrid(), einmalig — die Bounds sind
       fest, da die Bahnkurve keine Funktionsvariante hat) -->
  <g id="gk_grid_group"></g>
  <!-- Dynamischer Overlay (updateVisualization(), bei jeder Reglerbewegung
       bzw. jedem Umschalten neu befuellt) -->
  <g id="gk_plot_area"></g>
</svg>`;

// Eine Steuerzeile: Checkbox + farbiges Label + Wertanzeige. Die ganze Zeile
// ist hover-/klickbar (Vorlagen-Verhalten: Hover hebt das Element im Diagramm
// hervor und zeigt die passende Erklaerung, Klick neben der Checkbox schaltet).
const ctrlRow = (key, cls, label) => `
      <div class="vis-control-row" id="gk_control_${key}">
        <input type="checkbox" id="gk_toggle_${key}"${DEFAULT_TOGGLES[key] ? ' checked' : ''}>
        <span class="vis-control-label ${cls}">${label}</span>
        <span class="vis-control-value" id="gk_val_${key}"></span>
      </div>`;

const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Zeitpunkte</div>
    <div class="slider-label">Zeitpunkt \\(t_A\\)</div>
    <div class="slider-row">
      <input id="gk_tA_slider" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP}" value="${TA_DEFAULT}">
      <span class="slider-val" id="gk_tA_value"></span>
    </div>
    <div class="slider-label">Zeitpunkt \\(t_B\\)</div>
    <div class="slider-row">
      <input id="gk_tB_slider" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP}" value="${TB_DEFAULT}">
      <span class="slider-val" id="gk_tB_value"></span>
    </div>
    <div class="aspekt-hint">\\(t_A\\) kann \\(t_B\\) nicht überholen (und umgekehrt) — der jeweils andere Regler zieht nach.</div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Visualisierung</div>
${ctrlRow('pathBg', 'label-path', 'Ganze Strecke \\(\\vec{s}(t)\\)')}
${ctrlRow('sA', 'label-pos', 'Ortsvektor \\(\\vec{s}_A\\)')}
${ctrlRow('sB', 'label-pos', 'Ortsvektor \\(\\vec{s}_B\\)')}
${ctrlRow('weg', 'label-weg', 'Weglänge \\(s_{AB}\\)')}
${ctrlRow('verschiebung_BA', 'label-dba', 'Verschiebung \\(\\Delta\\vec{s}_{BA}\\) (A→B)')}
${ctrlRow('verschiebung_AB', 'label-dab', 'Verschiebung \\(\\Delta\\vec{s}_{AB}\\) (B→A)')}
${ctrlRow('abstand', 'label-dba', 'Abstand \\(|\\Delta\\vec{s}_{BA}|\\)')}
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="gk-path"></div><div class="legend-label">Ganze Strecke \\(\\vec{s}(t)\\)</div>
      <div class="legend-swatch" data-c="gk-pos"></div> <div class="legend-label">Ortsvektoren \\(\\vec{s}_A,\\vec{s}_B\\)</div>
      <div class="legend-swatch" data-c="gk-weg"></div> <div class="legend-label">Weglänge \\(s_{AB}\\)</div>
      <div class="legend-swatch" data-c="gk-dba"></div> <div class="legend-label">Verschiebung \\(\\Delta\\vec{s}_{BA}\\) / Abstand</div>
      <div class="legend-swatch" data-c="gk-dab"></div> <div class="legend-label">Verschiebung \\(\\Delta\\vec{s}_{AB}\\)</div>
    </div>
  </div>
</div>`;

// Analyse-Panel: die acht Erklaer-Varianten der Stand-alone-Sim (statisches
// MathJax, JS schaltet nur display um — kein Laufzeit-Typeset). Hover ueber
// eine Steuerzeile links blendet die passende Variante ein.
const VARIANTS = [
    ['default', 'Erklärung', 'Fahren Sie über einen Begriff in der Bedienung oder bewegen Sie die Zeit-Regler, um die Darstellung zu ändern.'],
    ['pathBg', 'Strecke \\(\\vec{s}(t)\\)', 'Die Strecke (Bahnkurve) ist die Menge aller Orte, die das Objekt im Laufe der Zeit durchläuft — die „Spur", die die Bewegung hinterlässt.'],
    ['sA', 'Ortsvektor \\(\\vec{s}_A = \\vec{s}(t_A)\\)', 'Der Ortsvektor zeigt vom Ursprung zum Ort A zur Zeit \\(t_A\\). Er beschreibt die genaue Position als Spaltenvektor \\((x_A, y_A)^T\\).'],
    ['sB', 'Ortsvektor \\(\\vec{s}_B = \\vec{s}(t_B)\\)', 'Der Ortsvektor zum Zeitpunkt \\(t_B\\). Der Vergleich von \\(\\vec{s}_A\\) und \\(\\vec{s}_B\\) zeigt die Bewegung des Objekts.'],
    ['weg', 'Weglänge \\(s_{AB}\\)', 'Die Weglänge ist die Länge des tatsächlichen Pfades, den das Objekt zwischen A und B zurückgelegt hat. Sie ist immer größer oder gleich dem Abstand.'],
    ['verschiebung_BA', 'Verschiebung \\(\\Delta\\vec{s}_{BA}\\)', 'Die Verschiebung von A nach B ist der Vektor, der direkt vom Startpunkt A zum Endpunkt B zeigt: \\(\\Delta\\vec{s}_{BA} = \\vec{s}_B - \\vec{s}_A\\). Er beschreibt die Netto-Ortsänderung.'],
    ['verschiebung_AB', 'Verschiebung \\(\\Delta\\vec{s}_{AB}\\)', 'Die Verschiebung von B nach A ist der Gegenvektor zu \\(\\Delta\\vec{s}_{BA}\\). Er zeigt vom Endpunkt B zurück zum Startpunkt A: \\(\\Delta\\vec{s}_{AB} = \\vec{s}_A - \\vec{s}_B = -\\Delta\\vec{s}_{BA}\\).'],
    ['abstand', 'Abstand \\(|\\Delta\\vec{s}_{BA}|\\)', 'Der Abstand ist der Betrag (die Länge) des Verschiebungsvektors. Er ist die direkte Distanz („Luftlinie") zwischen A und B und ist immer positiv: \\(|\\Delta\\vec{s}_{BA}| = |\\Delta\\vec{s}_{AB}|\\).'],
];

const PANEL_RIGHT = `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" title="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Erklärung</div>
${VARIANTS.map(([key, title, text], i) => `      <div class="analysis-variant" id="gk_analysis_${key}"${i ? ' style="display:none"' : ''}><h3>${title}</h3><p>${text}</p></div>`).join('\n')}
    </div>
  </div>
</div>`;

// ── Factory: baut EINE Grundbegriffe-Aspekt-Figur mit eigener Motor-Instanz ──
export function buildGrundbegriffeFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhaengen, dann DOM binden. Alle IDs der
    // Templates tragen 'gk_' -> ein einziges Replace genuegt.
    scene.innerHTML = (
        `<div class="aspekt-body">${PANEL_LEFT}` +
        `<div class="aspekt-scene">${SVG_SCENE}</div>` +
        `${PANEL_RIGHT}</div>`
    ).replace(/gk_/g, p);
    rt.bindDom();

    // Lupe-Button oben rechts in der Hauptspalte (keine Ablaufleiste in dieser
    // Figur -> wie 1.38 an die Szene gehaengt).
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    scene.querySelector('.aspekt-scene').appendChild(lupe);

    // Bildunterschrift aus data-caption (die statische Abbildung uebernimmt am
    // Bildschirm diese Rolle). Inside .aspekt-body, damit die Panel-Trennstreifen
    // im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        scene.querySelector('.aspekt-body').appendChild(cap);
    }

    // Per-Instanz-Regler (Closure, nicht Modul-Ebene).
    const tA = ge(p + 'tA_slider'), tB = ge(p + 'tB_slider');
    const n = (x, d = 2) => x.toFixed(d).replace('.', ',');   // deutsches Dezimalkomma

    function syncTimeLabels() {
        ge(p + 'tA_value').textContent = n(store.tA) + ' s';
        ge(p + 'tB_value').textContent = n(store.tB) + ' s';
    }

    // Neu ableiten + zeichnen. highlight = beim Hover hervorgehobenes Element.
    function refresh(highlight = null) {
        rt.withStore(() => {
            store.ab = deriveAB(store.path, store.tA, store.tB);
            updateVisualization(highlight);
        });
    }

    // Zeit-Regler: tA darf tB nicht ueberholen und umgekehrt (Vorlagen-Verhalten
    // — bewusst kein Vertauschen der Rollen, nur ein Nachziehen des anderen).
    function onTime(which) {
        rt.withStore(() => {
            if (which === 'A') {
                store.tA = parseFloat(tA.value);
                if (store.tA > store.tB) { store.tB = store.tA; tB.value = String(store.tB); }
            } else {
                store.tB = parseFloat(tB.value);
                if (store.tB < store.tA) { store.tA = store.tB; tA.value = String(store.tA); }
            }
            syncTimeLabels();
        });
        refresh();
    }
    tA.addEventListener('input', () => onTime('A'));
    tB.addEventListener('input', () => onTime('B'));

    // Steuerzeilen: Hover hebt hervor + zeigt die Erklaerung, Verlassen setzt
    // beides zurueck, Klick neben der Checkbox schaltet sie mit.
    for (const key of TOGGLE_KEYS) {
        const row = ge(p + 'control_' + key);
        const box = ge(p + 'toggle_' + key);
        if (!row || !box) continue;
        const enter = () => { refresh(key); rt.withStore(() => updateAnalysisBox(key)); };
        const leave = () => { refresh(null); rt.withStore(() => updateAnalysisBox('default')); };
        box.addEventListener('change', () => {
            rt.withStore(() => { store.toggles[key] = box.checked; });
            enter();
        });
        row.addEventListener('mouseenter', enter);
        row.addEventListener('mouseleave', leave);
        row.addEventListener('click', e => {
            if (e.target !== box) { box.checked = !box.checked; box.dispatchEvent(new Event('change')); }
        });
    }

    // Erst-Aufbau: feste Bahnkurve + Bounds EINMAL berechnen (sie aendern sich
    // nie, s. grundbegriffe/physics.js), Gitter einmal zeichnen.
    rt.withStore(() => {
        Object.assign(store.toggles, DEFAULT_TOGGLES);
        store.tA = TA_DEFAULT;
        store.tB = TB_DEFAULT;
        store.path = computePath();
        // computeBoundsFit statt computeBounds: die Zeichenflaeche folgt dem
        // Datenbereich statt umgekehrt -> gleicher Massstab in x und y, aber
        // kein toter Rand (455 -> ~402 viewBox-Einheiten Hoehe, s. render.js).
        const { xMaxBound, yMaxBound, plotH, graphH } = computeBoundsFit(store.path.yMax);
        Object.assign(store, { xMaxBound, yMaxBound, plotH });
        ge(p + 'graph_svg').setAttribute('viewBox', `0 0 ${GRAPH_W} ${graphH.toFixed(1)}`);
        drawGrid();
        syncTimeLabels();
        updateAnalysisBox('default');
    });
    refresh();
}
