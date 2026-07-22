#!/usr/bin/env node
/**
 * Headless-Smoke-Test einer Aspekt-Figur (jsdom): baut die Figur auf und
 * uebt die Grundinteraktionen aus, ohne Browser. Findet vor allem die
 * Null-Zugriffe, die entstehen, wenn ein vom Motor dereferenziertes Element im
 * Skelett fehlt (Fallstrick #1) -- der haeufigste Bau-Fehler.
 *
 *   npm install --prefix /tmp jsdom
 *   node figur_smoke.mjs <modulpfad> [--init initAspektKreisbahn]
 *   node figur_smoke.mjs InteraktivesSkript_WIP/src/figures/aspekt_kreisbahn.js
 *
 * Prueft: Modul importiert, init() baut ohne Ausnahme, jeder range-Regler
 * feuert 'input' ohne Ausnahme, und -- falls exportiert -- toggle_aspekt /
 * close_aspekt_overlay (Overlay auf/zu) und toggle_analyse laufen fehlerfrei.
 *
 * GRENZE: kein Layout, keine Schrift, keine Farbe, kein MathJax. Optik prueft
 * nur der Browser (und das Auge des Nutzers).
 */
import path from 'path';

const args = process.argv.slice(2);
if (!args.length) { console.error('Aufruf: node figur_smoke.mjs <modulpfad> [--init <exportname>]'); process.exit(1); }
const modPath = path.resolve(args[0]);
const initName = (args.find(a => a.startsWith('--init=')) || '').split('=')[1]
    || (args.includes('--init') ? args[args.indexOf('--init') + 1] : 'initAspektKreisbahn');

const JSDOM_PATH = process.env.JSDOM_PREFIX || '/tmp/node_modules';
const { JSDOM } = await import(JSDOM_PATH + '/jsdom/lib/api.js');

const dom = new JSDOM(
    '<!doctype html><html data-width-mode="breit"><body><div id="content"></div><div id="host"></div></body></html>',
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

console.log('Modul:', modPath, '| init:', initName, '\n');

let mod;
try { mod = await import(modPath); }
catch (e) { console.log('  FEHLER Import:', e.message); process.exit(1); }
ok('Modul importiert', !!mod);
ok(`Export ${initName} vorhanden`, typeof mod[initName] === 'function');

const host = document.getElementById('host');
tryStep(`${initName}(host) baut ohne Ausnahme`, () => mod[initName](host));

// Jeder Regler: input-Event darf nicht werfen (haeufigster Null-Zugriff-Ort)
const ranges = [...host.querySelectorAll('input[type="range"]')];
ok(`Regler gefunden (${ranges.length})`, ranges.length > 0);
for (const r of ranges) {
    tryStep(`Regler #${r.id || '?'} input`, () => {
        for (const v of [r.min, r.max, (Number(r.min) + Number(r.max)) / 2]) {
            r.value = v; r.dispatchEvent(new window.Event('input'));
        }
    });
}

// Optional: Overlay auf/zu
if (typeof mod.toggle_aspekt === 'function') {
    const fig = document.querySelector('.aspekt-figur') || host.closest('.aspekt-figur') || host;
    // Falls init in ein Kind gebaut hat, die Figur ist evtl. der host selbst.
    const lupe = host.querySelector('.aspekt-lupe') || document.querySelector('.aspekt-lupe');
    if (lupe) {
        tryStep('toggle_aspekt (Overlay auf)', () => mod.toggle_aspekt(lupe));
        if (typeof mod.close_aspekt_overlay === 'function')
            tryStep('close_aspekt_overlay (Overlay zu)', () => mod.close_aspekt_overlay());
    }
}
// Optional: Analyse ein-/ausklappen
if (typeof mod.toggle_analyse === 'function') {
    const btn = document.querySelector('.panel-header[data-action="toggle_analyse"]');
    if (btn) tryStep('toggle_analyse', () => mod.toggle_analyse(btn));
}

console.log(`\nErgebnis: ${fails === 0 ? 'alle Schritte fehlerfrei' : fails + ' Fehler'}`);
process.exit(fails ? 1 : 0);
