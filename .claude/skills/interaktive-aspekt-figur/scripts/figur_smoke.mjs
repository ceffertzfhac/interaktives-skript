#!/usr/bin/env node
/**
 * Headless-Smoke-Test einer Aspekt-Figur (jsdom): baut die Figur auf und
 * uebt die Grundinteraktionen aus, ohne Browser. Findet vor allem die
 * Null-Zugriffe, die entstehen, wenn ein vom Motor dereferenziertes Element im
 * Skelett fehlt (Fallstrick #1) -- der haeufigste Bau-Fehler.
 *
 *   npm install --prefix /tmp jsdom
 *   node figur_smoke.mjs <modulpfad> [--init <exportname>]
 *   node figur_smoke.mjs InteraktivesSkript_WIP/src/figures/aspekt_kreisbahn.js
 *   node figur_smoke.mjs InteraktivesSkript_WIP/src/figures/aspekt_weg_zeit.js --init=buildWegZeitFig
 *
 * Die Figur wird ueber ihre buildXFig(fig)-Factory gebaut (fig = .aspekt-figur-
 * Element). Geprueft: Modul importiert, buildXFig(fig) baut ohne Ausnahme, jeder
 * range-Regler feuert 'input' ohne Ausnahme, -- falls exportiert --
 * toggle_aspekt / close_aspekt_overlay (Overlay auf/zu) und toggle_analyse, und
 * -- falls vorhanden -- die Runbar-Tasten (data-act start|stop|reset).
 *
 * GRENZE: kein Layout, keine Schrift, keine Farbe, kein MathJax. Optik prueft
 * nur der Browser (und das Auge des Nutzers).
 */
import path from 'path';

const args = process.argv.slice(2);
if (!args.length) { console.error('Aufruf: node figur_smoke.mjs <modulpfad> [--init <exportname>]'); process.exit(1); }
const modPath = path.resolve(args[0]);
const initName = (args.find(a => a.startsWith('--init=')) || '').split('=')[1]
    || (args.includes('--init') ? args[args.indexOf('--init') + 1] : 'buildKreisbahnFig');

const JSDOM_PATH = process.env.JSDOM_PREFIX || '/tmp/node_modules';
const { JSDOM } = await import(JSDOM_PATH + '/jsdom/lib/api.js');

const dom = new JSDOM(
    '<!doctype html><html data-width-mode="breit"><body><div id="content"></div></body></html>',
    { url: 'http://localhost:8000/', pretendToBeVisual: true });
const { window } = dom;
window.CSS = { escape: s => String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&') };
Object.assign(global, {
    window, document: window.document, CustomEvent: window.CustomEvent, Node: window.Node,
    HTMLElement: window.HTMLElement, getComputedStyle: window.getComputedStyle,
    location: window.location, history: window.history, requestAnimationFrame: () => 0,
});
window.HTMLElement.prototype.scrollIntoView = () => {};

let fails = 0;
const ok = (label, cond) => { console.log(`  ${cond ? 'OK ' : 'FEHLER'}  ${label}`); if (!cond) fails++; };
const tryStep = (label, fn) => {
    try { fn(); console.log(`  OK   ${label}`); }
    catch (e) { console.log(`  FEHLER ${label}: ${e.message}`); fails++; }
};

console.log('Modul:', modPath, '| build:', initName, '\n');

let mod;
try { mod = await import(modPath); }
catch (e) { console.log('  FEHLER Import:', e.message); process.exit(1); }
ok('Modul importiert', !!mod);
ok(`Export ${initName} vorhanden`, typeof mod[initName] === 'function');

// Echter .aspekt-figur-Host (buildXFig liest dataset.built/dataset.caption).
const fig = document.createElement('div');
fig.className = 'aspekt-figur';
fig.id = 'aspekt-test';
fig.dataset.aspekt = 'test';
fig.dataset.caption = 'Smoke-Test-Caption';
document.body.appendChild(fig);
tryStep(`${initName}(fig) baut ohne Ausnahme`, () => mod[initName](fig));

// Jeder Regler: input-Event darf nicht werfen (haeufigster Null-Zugriff-Ort)
const ranges = [...fig.querySelectorAll('input[type="range"]')];
ok(`Regler gefunden (${ranges.length})`, ranges.length > 0);
for (const r of ranges) {
    tryStep(`Regler #${r.id || '?'} input`, () => {
        for (const v of [r.min, r.max, (Number(r.min) + Number(r.max)) / 2]) {
            r.value = v; r.dispatchEvent(new window.Event('input'));
        }
    });
}

// Runbar-Tasten (data-act start|stop|reset) -- Listener haengen am Container.
const runbtns = [...fig.querySelectorAll('.aspekt-btn[data-act]')];
if (runbtns.length) {
    for (const b of runbtns) {
        tryStep(`Runbar-Taste data-act="${b.dataset.act}"`, () =>
            b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
    }
}

// Optional: Overlay auf/zu (nur im kreisbahn-Modul exportiert).
if (typeof mod.toggle_aspekt === 'function') {
    const lupe = fig.querySelector('.aspekt-lupe');
    if (lupe) {
        tryStep('toggle_aspekt (Overlay auf)', () => mod.toggle_aspekt(lupe));
        if (typeof mod.close_aspekt_overlay === 'function')
            tryStep('close_aspekt_overlay (Overlay zu)', () => mod.close_aspekt_overlay());
    }
}
// Optional: Analyse ein-/ausklappen.
if (typeof mod.toggle_analyse === 'function') {
    const btn = fig.querySelector('.panel-header[data-action="toggle_analyse"]');
    if (btn) tryStep('toggle_analyse', () => mod.toggle_analyse(btn));
}
// Optional: linkes Bedienfeld einklappen.
if (typeof mod.toggle_panel_left === 'function') {
    const btn = fig.querySelector('.panel-header[data-action="toggle_panel_left"]');
    if (btn) tryStep('toggle_panel_left', () => mod.toggle_panel_left(btn));
}

console.log(`\nErgebnis: ${fails === 0 ? 'alle Schritte fehlerfrei' : fails + ' Fehler'}`);
process.exit(fails ? 1 : 0);