// ui.js — Bootstrap + Event-Wiring der Kreisbewegung-Simulation (Portierung
// aus Input/Simulationen/Project_kreisbewegung_simulation/js/ui.js).
//
// Aenderungen gegenueber der Quelle: die Standalone-App-Chrome (Topbar mit
// Zurueck-Link, eigenem Dark/Light-Toggle, "Nebeneinander"-Layout-Umschalter)
// ist entfernt -- die Simulation lebt eingebettet in einer Sim-Panel-Karte
// innerhalb einer WIP-Sektion. Der Dark-Mode folgt jetzt dem globalen
// toggle_darkmode() der WIP (ueber darkmode.css-Overrides der --text/--accent/
// --c-*-Variablen auf #gc10, s. src/darkmode.css) statt eines eigenen
// localStorage-Toggles. Slider-Radiogruppen sind auf "kb_speed"/
// "kb_diagram_mode" umbenannt (s. state.js).
'use strict';

import { store, DOM, initDOM } from './state.js';
import { graphOptions, ANIM_CX } from './constants.js';
import {
    recomputeDerived, precompute, extendMotionData, recalculateAxisLimits,
    position, velocity, acceleration, angleDeg,
} from './physics.js';
import {
    setupScene, updateScene, updateGraph, updateKennwerte,
    drawStopwatchMarks, drawSubdialMarks, initDigitalDisplaySegments,
    updateGraphHover, ANIM_CY,
} from './render.js';
import { attachGraphHover } from './lib/hover.js';

function animCenter() {
    return { cx: ANIM_CX, cy: ANIM_CY };
}

// -- Diagramm-Dropdowns fuellen (zwei unabhaengige Picker) --------------------
function populateGraphSelects() {
    const dual = store.isStacked;
    [[DOM.graphSelect1, true], [DOM.graphSelect2, false]].forEach(([sel, allowTraj]) => {
        sel.innerHTML = '';
        for (const group in graphOptions) {
            const og = document.createElement('optgroup');
            og.label = group;
            for (const val in graphOptions[group]) {
                if ((!allowTraj || dual) && ['yx', 'xy'].includes(val)) continue;
                const o = document.createElement('option');
                o.value = val;
                o.innerHTML = graphOptions[group][val];
                og.appendChild(o);
            }
            if (og.children.length) sel.appendChild(og);
        }
    });
    if (!Array.from(DOM.graphSelect1.options).some(o => o.value === store.graphType1)) store.graphType1 = 'yt';
    if (!Array.from(DOM.graphSelect2.options).some(o => o.value === store.graphType2)) store.graphType2 = 'xt';
    DOM.graphSelect1.value = store.graphType1;
    DOM.graphSelect2.value = store.graphType2;
    DOM.dualGraphControl.style.display = dual ? '' : 'none';
}

function diagramModeIsStacked() {
    const r = Array.from(DOM.diagramModeRadios).find(x => x.checked);
    return r ? r.value === '2' : false;
}

function updateSpeedPills() {
    document.querySelectorAll('#gc10 .speed-pill').forEach(p => {
        p.classList.toggle('active', p.querySelector('input').checked);
    });
}

// Bahnkurve (yx/xy) hat keine Zeitachse -> beim Wechsel zu "Zwei Diagramme"
// springt Diagramm 1 auf einen Zeit-Paar-Default; die Auswahl wird gemerkt.
function handleDiagramModeSwitch(nowStacked) {
    if (nowStacked && !store.isStacked && ['yx', 'xy'].includes(store.graphType1)) {
        store.rememberedTrajType = store.graphType1;
        store.graphType1 = 'xt';
        store.graphType2 = 'yt';
    } else if (!nowStacked && store.isStacked && store.rememberedTrajType) {
        store.graphType1 = store.rememberedTrajType;
        store.rememberedTrajType = null;
    }
}

function liveObjects(t) {
    const p = position(t), v = velocity(t), a = acceleration(t);
    return {
        p: { x: p.x, y: p.y, phi: angleDeg(t), abs: Math.hypot(p.x, p.y) },
        v: { x: v.x, y: v.y, abs: Math.abs(store.R * store.omega) },
        a: { x: a.x, y: a.y, abs: Math.abs(store.R * store.omega * store.omega) },
    };
}

function applyStopwatchMode() {
    const showDigital = store.isDigitalDisplay;
    DOM.stopwatchCircle.style.visibility = showDigital ? 'hidden' : 'visible';
    DOM.mainHand.style.visibility = showDigital ? 'hidden' : 'visible';
    DOM.subHand.style.visibility = showDigital ? 'hidden' : 'visible';
    DOM.stopwatchMarks.style.visibility = showDigital ? 'hidden' : 'visible';
    DOM.subdial.style.visibility = showDigital ? 'hidden' : 'visible';
    DOM.digitalDisplayGroup.style.visibility = showDigital ? 'visible' : 'hidden';
}

// -- Reset ----------------------------------------------------------------------
function resetSim(isPlayTrigger = false) {
    stopAnimation();
    if (!isPlayTrigger) { store.visualTime = 0; store.simulatedTime = 0; }
    store.lastFrameTime = 0;

    store.R = parseFloat(DOM.radiusSlider.value);
    store.phi0Deg = parseFloat(DOM.phi0Slider.value);
    store.omegaDeg = parseFloat(DOM.omegaSlider.value);
    store.isStacked = diagramModeIsStacked();
    store.showPositionVector = DOM.togPositionVector.checked;
    store.showPositionComponents = DOM.togPositionComponents.checked;
    store.showVelocityVector = DOM.togVelocityVector.checked;
    store.showVelocityComponents = DOM.togVelocityComponents.checked;
    store.showAccelerationVector = DOM.togAccelerationVector.checked;
    store.showAccelerationComponents = DOM.togAccelerationComponents.checked;
    store.showTrajectory = DOM.togTrajectory.checked;
    DOM.speedRadios.forEach(r => { if (r.checked) store.speedFactor = parseFloat(r.value); });

    recomputeDerived();
    populateGraphSelects();

    DOM.radiusValue.textContent = `${store.R.toFixed(1)} m`;
    DOM.phi0Value.textContent = `${store.phi0Deg.toFixed(0)} °`;
    DOM.omegaValue.textContent = `${store.omegaDeg.toFixed(0)} °/s`;

    precompute();
    setupScene();

    const { p, v, a } = liveObjects(0);
    updateScene(0, p, v, a, animCenter());

    updateGraph(0);
    updateKennwerte();
    applyStopwatchMode();
}

// -- Animation --------------------------------------------------------------------
function animate(currentTime) {
    if (!store.lastFrameTime) store.lastFrameTime = currentTime;
    let deltaTime = (currentTime - store.lastFrameTime) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.1;
    store.lastFrameTime = currentTime;

    store.visualTime += deltaTime * store.speedFactor;
    store.simulatedTime += deltaTime * store.speedFactor;

    if (store.tData.length > 0 && store.simulatedTime >= store.tData[store.tData.length - 1]) {
        const duration = store.T === Infinity ? 10 : Math.max(4 * store.T, 10);
        extendMotionData(duration);
        recalculateAxisLimits();
    }

    const { p, v, a } = liveObjects(store.visualTime);
    updateScene(store.simulatedTime, p, v, a, animCenter());
    updateGraph(store.simulatedTime);

    store.aniFrameId = requestAnimationFrame(animate);
}

function startAnimation() {
    if (store.aniFrameId) return;
    if (store.visualTime < 1e-9) resetSim(true);
    store.lastFrameTime = 0;
    store.aniFrameId = requestAnimationFrame(animate);
    DOM.playBtn.disabled = true;
    DOM.pauseBtn.disabled = false;
    [DOM.radiusSlider, DOM.phi0Slider, DOM.omegaSlider].forEach(el => el.disabled = true);
}

function stopAnimation() {
    if (store.aniFrameId) cancelAnimationFrame(store.aniFrameId);
    store.aniFrameId = null;
    DOM.playBtn.disabled = false;
    DOM.pauseBtn.disabled = true;
    [DOM.radiusSlider, DOM.phi0Slider, DOM.omegaSlider].forEach(el => el.disabled = false);
}

// -- CSV-Export (sep=; * Semikolon-Trenner * Komma-Dezimal) -------------------
function toCsv(v, d = 4) {
    return Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '';
}

function downloadCSV(filename, rows) {
    const csv = 'sep=;\n' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function stripLabel(s) {
    return s.replace(/<i>|<\/i>/g, '').replace(/ᵧ/g, 'y').replace(/ₓ/g, 'x');
}

function exportAllCSV() {
    if (store.tData.length === 0) return;
    const rows = [[
        'Zeit t (s)', 'x (m)', 'y (m)',
        'vx (m/s)', 'vy (m/s)', '|v| (m/s)',
        'ax (m/s²)', 'ay (m/s²)', '|a| (m/s²)',
        'phi (°)',
    ]];
    for (let i = 0; i < store.tData.length; i++) {
        rows.push([
            toCsv(store.tData[i]), toCsv(store.xData[i]), toCsv(store.yData[i]),
            toCsv(store.vxData[i]), toCsv(store.vyData[i]), toCsv(store.vabsData[i]),
            toCsv(store.axData[i]), toCsv(store.ayData[i]), toCsv(store.aabsData[i]),
            toCsv(store.phitData[i], 2),
        ]);
    }
    downloadCSV('kreisbewegung_alle_daten.csv', rows);
}

function exportDiagramCSV() {
    if (store.tData.length === 0) return;
    if (store.isStacked) {
        const topL = store.axisLimits[store.graphType1], botL = store.axisLimits[store.graphType2];
        const rows = [[`Zeit t (s)`, stripLabel(topL.yLabel), stripLabel(botL.yLabel)]];
        for (let i = 0; i < store.tData.length; i++) {
            rows.push([toCsv(store.tData[i]), toCsv(topL.yArr[i]), toCsv(botL.yArr[i])]);
        }
        downloadCSV(`kreisbewegung_gestapelt_${store.graphType1}_${store.graphType2}.csv`, rows);
        return;
    }
    const type = store.graphType1;
    const limits = store.axisLimits[type];
    if (!limits) return;
    if (limits.xIsTime) {
        const rows = [['Zeit t (s)', stripLabel(limits.yLabel)]];
        for (let i = 0; i < store.tData.length; i++) {
            rows.push([toCsv(store.tData[i]), toCsv(limits.yArr[i])]);
        }
        downloadCSV(`kreisbewegung_${type}.csv`, rows);
    } else {
        const rows = [[stripLabel(limits.xLabel), stripLabel(limits.yLabel)]];
        for (let i = 0; i < limits.xArr.length; i++) {
            rows.push([toCsv(limits.xArr[i]), toCsv(limits.yArr[i])]);
        }
        downloadCSV(`kreisbewegung_bahn_${type}.csv`, rows);
    }
}

// -- Event-Wiring -----------------------------------------------------------------
function setupUI() {
    DOM.radiusSlider.addEventListener('input', () => {
        DOM.radiusValue.textContent = `${parseFloat(DOM.radiusSlider.value).toFixed(1)} m`;
        resetSim(false);
    });
    DOM.phi0Slider.addEventListener('input', () => {
        DOM.phi0Value.textContent = `${parseFloat(DOM.phi0Slider.value).toFixed(0)} °`;
        resetSim(false);
    });
    DOM.omegaSlider.addEventListener('input', () => {
        DOM.omegaValue.textContent = `${parseFloat(DOM.omegaSlider.value).toFixed(0)} °/s`;
        resetSim(false);
    });
    DOM.speedRadios.forEach(r => r.addEventListener('change', () => { store.speedFactor = parseFloat(r.value); }));

    DOM.graphSelect1.addEventListener('change', () => {
        store.graphType1 = DOM.graphSelect1.value;
        resetSim(false);
    });
    DOM.graphSelect2.addEventListener('change', () => {
        store.graphType2 = DOM.graphSelect2.value;
        resetSim(false);
    });

    DOM.diagramModeRadios.forEach(r => r.addEventListener('change', () => {
        const nowStacked = diagramModeIsStacked();
        handleDiagramModeSwitch(nowStacked);
        store.isStacked = nowStacked;
        updateSpeedPills();
        resetSim(false);
    }));

    const visToggles = [
        [DOM.togPositionVector, 'showPositionVector'],
        [DOM.togPositionComponents, 'showPositionComponents'],
        [DOM.togVelocityVector, 'showVelocityVector'],
        [DOM.togVelocityComponents, 'showVelocityComponents'],
        [DOM.togAccelerationVector, 'showAccelerationVector'],
        [DOM.togAccelerationComponents, 'showAccelerationComponents'],
        [DOM.togTrajectory, 'showTrajectory'],
    ];
    visToggles.forEach(([togEl, key]) => {
        togEl.addEventListener('change', () => { store[key] = togEl.checked; resetSim(false); });
    });

    DOM.playBtn.addEventListener('click', startAnimation);
    DOM.pauseBtn.addEventListener('click', stopAnimation);
    DOM.resetBtn.addEventListener('click', () => { store.visualTime = 0; store.simulatedTime = 0; resetSim(false); });
    DOM.exportDiagram.addEventListener('click', exportDiagramCSV);
    DOM.exportAll.addEventListener('click', exportAllCSV);

    DOM.stopwatch.addEventListener('click', () => {
        store.isDigitalDisplay = !store.isDigitalDisplay;
        applyStopwatchMode();
    });

    DOM.analysisToggle?.addEventListener('click', () => {
        const collapsed = DOM.appLayout.classList.toggle('analysis-collapsed');
        DOM.analysisToggle.setAttribute('aria-expanded', String(!collapsed));
    });

    document.querySelectorAll('#gc10 .panel-section.collapsible > .panel-label').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.parentElement;
            const collapsed = section.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });
    });
}

// -- Bootstrap --------------------------------------------------------------------
// Wird von main.js einmal aufgerufen (analog zu init_splitter/init_print),
// nicht ueber update_all/window.updateN -- die Simulation ist vollstaendig
// selbst-verdrahtet (eigene Slider-/Play-/Diagramm-Listener), nicht Teil des
// data-action-Binders.
let started = false;
export function initKreisbewegung() {
    if (started) return;
    if (!document.getElementById('kb_main_svg')) return; // Figur nicht im Dokument (z.B. andere Seite)
    started = true;
    initDOM();
    drawStopwatchMarks();
    drawSubdialMarks();
    initDigitalDisplaySegments();
    setupUI();
    updateSpeedPills();
    ;['single', 'top', 'bottom'].forEach(slot => {
        attachGraphHover(DOM.graphHitRect[slot], {
            onMove: x => updateGraphHover(slot, x),
            onLeave: () => updateGraphHover(slot, null),
        });
    });
    resetSim(false);
}
