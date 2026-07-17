// physics.js — Bewegungsgleichungen der gleichfoermigen ebenen Kreisbewegung
// (Portierung aus Input/Simulationen/Project_kreisbewegung_simulation/js/physics.js,
// unveraendert -- keine DOM-/Pfad-Abhaengigkeiten).
'use strict';

import { TIME_STEP } from './constants.js';
import { store } from './state.js';

// φ(t) = φ₀ + ω·t            (ω in rad/s)
// x(t) = R·cos(φ),  y(t) = R·sin(φ)
// vₓ = −R·ω·sin(φ),  vᵧ = R·ω·cos(φ)
// aₓ = −R·ω²·cos(φ), aᵧ = −R·ω²·sin(φ)   (Zentripetalbeschleunigung)
// |v| = |R·ω|,  |a| = |R·ω²|
// T = 2π/|ω|

export function recomputeDerived() {
    store.omega = store.omegaDeg * Math.PI / 180;
    store.T = Math.abs(store.omega) > 1e-9 ? (2 * Math.PI) / Math.abs(store.omega) : Infinity;
}

export function angleRad(t) {
    const phi0 = store.phi0Deg * Math.PI / 180;
    return phi0 + store.omega * t;
}

export function position(t) {
    const phi = angleRad(t);
    return { x: store.R * Math.cos(phi), y: store.R * Math.sin(phi) };
}
export function velocity(t) {
    const phi = angleRad(t), w = store.omega, R = store.R;
    return { x: -R * w * Math.sin(phi), y: R * w * Math.cos(phi) };
}
export function acceleration(t) {
    const phi = angleRad(t), w = store.omega, R = store.R;
    return { x: -R * w * w * Math.cos(phi), y: -R * w * w * Math.sin(phi) };
}
export function angleDeg(t) {
    const a = (angleRad(t) * 180) / Math.PI;
    return ((a % 360) + 360) % 360;
}

// Precompute: fuellt die Zeitreihen fuer die gesamte Darstellungsdauer (>=4 T, >=10 s).
export function precompute() {
    store.tData = [];
    store.xData = []; store.yData = [];
    store.vxData = []; store.vyData = [];
    store.axData = []; store.ayData = [];
    store.vabsData = []; store.aabsData = [];
    store.phitData = [];
    if (store.R <= 0) { recalculateAxisLimits(); return; }
    const duration = store.T === Infinity ? 10 : Math.max(4 * store.T, 10);
    extendMotionData(duration);
    recalculateAxisLimits();
}

export function extendMotionData(duration) {
    const lastT = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 0;
    for (let t = lastT + TIME_STEP; t <= lastT + duration + TIME_STEP; t += TIME_STEP) {
        const phi = angleRad(t), w = store.omega, R = store.R;
        const s = Math.sin(phi), c = Math.cos(phi);
        store.tData.push(t);
        store.xData.push(R * c); store.yData.push(R * s);
        store.vxData.push(-R * w * s); store.vyData.push(R * w * c);
        store.axData.push(-R * w * w * c); store.ayData.push(-R * w * w * s);
        store.vabsData.push(Math.abs(R * w)); store.aabsData.push(Math.abs(R * w * w));
        store.phitData.push(phi * 180 / Math.PI);
    }
}

// Achsengrenzen je Diagrammtyp.
export function recalculateAxisLimits() {
    const tMax = store.tData.length > 0 ? store.tData[store.tData.length - 1] : 10;
    const R = store.R;
    const Rpad = R * 1.1 || 1;
    const vMag = Math.abs(R * store.omega);
    const aMag = Math.abs(R * store.omega * store.omega);
    const maxPhi = store.phitData.length > 0 ? Math.max(...store.phitData) : 360;
    const osc = arr => {
        const m = arr.length > 0 ? Math.max(...arr.map(v => Math.abs(v))) : 1;
        return { yMin: -m * 1.1, yMax: m * 1.1 };
    };
    const pos = mx => ({ yMin: 0, yMax: (mx > 0 ? mx * 1.1 : 1) });
    const datasets = {
        yx: { xArr: store.xData, yArr: store.yData, xMin: -Rpad, xMax: Rpad, yMin: -Rpad, yMax: Rpad, xIsTime: false, xLabel: 'x / m', yLabel: 'y / m' },
        xy: { xArr: store.yData, yArr: store.xData, xMin: -Rpad, xMax: Rpad, yMin: -Rpad, yMax: Rpad, xIsTime: false, xLabel: 'y / m', yLabel: 'x / m' },
        xt: { xArr: store.tData, yArr: store.xData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'x / m', ...osc(store.xData) },
        yt: { xArr: store.tData, yArr: store.yData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'y / m', ...osc(store.yData) },
        vxt: { xArr: store.tData, yArr: store.vxData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'vₓ / (m/s)', ...osc(store.vxData) },
        vyt: { xArr: store.tData, yArr: store.vyData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'vᵧ / (m/s)', ...osc(store.vyData) },
        axt: { xArr: store.tData, yArr: store.axData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'aₓ / (m/s²)', ...osc(store.axData) },
        ayt: { xArr: store.tData, yArr: store.ayData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'aᵧ / (m/s²)', ...osc(store.ayData) },
        vabs: { xArr: store.tData, yArr: store.vabsData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: '|v| / (m/s)', ...pos(vMag) },
        aabs: { xArr: store.tData, yArr: store.aabsData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: '|a| / (m/s²)', ...pos(aMag) },
        phit: { xArr: store.tData, yArr: store.phitData, xMin: 0, xMax: tMax, xIsTime: true, xLabel: 't / s', yLabel: 'φ / °', ...pos(maxPhi) },
    };
    for (const key in datasets) {
        const d = datasets[key];
        store.axisLimits[key] = {
            xMin: d.xMin, xMax: d.xMax, yMin: d.yMin, yMax: d.yMax,
            xArr: d.xArr, yArr: d.yArr, xLabel: d.xLabel, yLabel: d.yLabel,
            xIsTime: d.xIsTime, tMax,
        };
    }
}

export function interpolateAt(t) {
    const { tData } = store;
    if (tData.length === 0) return null;
    let i = 0;
    if (t >= tData[tData.length - 1]) i = tData.length - 1;
    else while (i < tData.length - 1 && tData[i + 1] <= t) i++;
    const t1 = tData[i], t2 = tData[i + 1] ?? t1;
    const a = t2 > t1 ? (t - t1) / (t2 - t1) : 0;
    const lerp = (arr) => arr[i] + a * ((arr[i + 1] ?? arr[i]) - arr[i]);
    return {
        i, t,
        x: lerp(store.xData), y: lerp(store.yData),
        vx: lerp(store.vxData), vy: lerp(store.vyData),
        ax: lerp(store.axData), ay: lerp(store.ayData),
        vabs: lerp(store.vabsData), aabs: lerp(store.aabsData),
        phi: lerp(store.phitData),
    };
}

export function linePlotIndex(time) {
    const { tData } = store;
    let idx = tData.findIndex(t => t > time);
    if (idx === -1 && tData.length > 0) idx = tData.length;
    else if (tData.length === 0) idx = 0;
    return idx;
}

export function frequency() { return store.T > 0 && Number.isFinite(store.T) ? 1 / store.T : 0; }
