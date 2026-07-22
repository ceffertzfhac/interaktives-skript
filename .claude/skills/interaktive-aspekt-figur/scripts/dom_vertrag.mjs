#!/usr/bin/env node
/**
 * DOM-Vertrag eines Sim-Motors ermitteln: welche kb_-Elemente muss das Skelett
 * einer Aspekt-Figur enthalten, weil der wiederverwendete render-Code sie
 * DEREFERENZIERT (setAttribute/textContent/style/appendChild …)?
 *
 *   node dom_vertrag.mjs <sim-verzeichnis> [--entry setupScene,updateScene]
 *   node dom_vertrag.mjs InteraktivesSkript_WIP/src/figures/kreisbewegung
 *
 * Hintergrund (Fallstrick #1 in INTERAKTIVE_ASPEKT_FIGUREN.md): initDOM() ist
 * null-sicher (DOM.x = q(id) schadet auch bei fehlendem Element nicht), aber
 * updateScene()/setupScene() dereferenzieren manche DOM.x -> fehlt das Element,
 * gibt es einen Null-Zugriff beim ersten Zeichnen. Diese Elemente muessen als
 * (ggf. versteckte) Stubs ins Skelett.
 *
 * Praezise statt pauschal: es werden NUR die vom Einstieg (default setupScene +
 * updateScene) transitiv erreichbaren render-Funktionen untersucht -- also
 * genau der Code, den die Aspekt-Figur wirklich aufruft. Graph-Funktionen, die
 * man nicht aufruft, fallen dadurch weg.
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (!args.length || args[0].startsWith('--')) {
    console.error('Aufruf: node dom_vertrag.mjs <sim-verzeichnis> [--entry setupScene,updateScene]');
    process.exit(1);
}
const dir = args[0];
const entryArg = (args.find(a => a.startsWith('--entry=')) || '').split('=')[1]
    || (args.includes('--entry') ? args[args.indexOf('--entry') + 1] : '');
const entries = (entryArg || 'setupScene,updateScene').split(',').map(s => s.trim()).filter(Boolean);

// 1) prop -> '<prefix>id' aus state.js. q() addiert den Prefix pro Instanz:
//    neu:  q = id => document.getElementById(store.idPrefix + id)   (Default idPrefix:'kb_')
//    alt:  q = id => document.getElementById('kb_' + id)              (festes Literal)
// Die q('main_svg')-Literale enthalten KEIN kb_ mehr — der Prefix wird hier addiert.
const stateSrc = fs.readFileSync(path.join(dir, 'state.js'), 'utf8');
const qMatch = stateSrc.match(/const\s+q\s*=\s*id\s*=>\s*document\.getElementById\(\s*(.+?)\s*\+\s*id\s*\)/);
let prefix = '';
if (qMatch) {
    const head = qMatch[1].trim();
    const litM = head.match(/^['"]([^'"]*)['"]$/);                  // festes Literal
    if (litM) prefix = litM[1];
    else if (/store\.idPrefix/.test(head)) {                        // store.idPrefix + id
        const def = stateSrc.match(/idPrefix:\s*['"]([^'"]+)['"]/); // Default in state.js
        prefix = def ? def[1] : 'kb_';
    }
}
const propToId = {};
for (const m of stateSrc.matchAll(/DOM\.(\w+)\s*=\s*q\(\s*['"]([^'"]+)['"]\s*\)/g)) propToId[m[1]] = prefix + m[2];
// Sammel-Objekte: DOM.x = { a: q('id'), … } -> die q('id') mit erfassen
for (const m of stateSrc.matchAll(/q\(\s*['"]([^'"]+)['"]\s*\)/g)) { /* nur Info */ }

// 2) Alle Funktionsdefinitionen in render.js mit brace-gematchtem Body
const renderSrc = fs.readFileSync(path.join(dir, 'render.js'), 'utf8');
const fnBodies = {};
const fnRe = /(?:export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
let fm;
while ((fm = fnRe.exec(renderSrc))) {
    const name = fm[1];
    let i = fm.index + fm[0].length - 1, depth = 0, start = i;
    for (; i < renderSrc.length; i++) {
        const c = renderSrc[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
    }
    fnBodies[name] = renderSrc.slice(start + 1, i);
}
const defined = new Set(Object.keys(fnBodies));

// 3) Transitive Huelle ab den Einstiegsfunktionen
const reachable = new Set();
const queue = entries.filter(e => defined.has(e));
entries.filter(e => !defined.has(e)).forEach(e =>
    console.error(`[warn] Einstiegsfunktion "${e}" nicht in render.js gefunden`));
while (queue.length) {
    const fn = queue.shift();
    if (reachable.has(fn)) continue;
    reachable.add(fn);
    const body = fnBodies[fn] || '';
    for (const m of body.matchAll(/\b(\w+)\s*\(/g)) {
        if (defined.has(m[1]) && !reachable.has(m[1])) queue.push(m[1]);
    }
}

// 4) Dereferenzierte DOM.<prop> nur im erreichbaren Code
const deref = new Set();
for (const fn of reachable) {
    for (const m of (fnBodies[fn] || '').matchAll(/DOM\.(\w+)\b/g)) deref.add(m[1]);
}

const isExtra = id => /graph|hover|grid|stopwatch|subdial|digital|hand|live_|time_label/.test(id);
const needed = [...deref].filter(p => propToId[p]).map(p => propToId[p]).sort();
const kern = needed.filter(id => !isExtra(id));
const extra = needed.filter(id => isExtra(id));

console.log(`Praefix "${prefix}"  |  erreichbare render-Funktionen ab [${entries.join(', ')}]: ${[...reachable].join(', ')}`);
console.log(`Hinweis: in der Aspekt-Figur stehen diese IDs als 'kb_…' im Skelett-Template und werden pro Instanz per .replace(/kb_/g, prefix) prefixt (createRuntime).`);
console.log('\n=== Skelett MUSS diese kb_-IDs enthalten (im erreichbaren Code dereferenziert) ===');
console.log('\nKern-Szene (meist SICHTBAR, als <line>/<circle>/<g>/<path>/<text> anlegen):');
kern.forEach(id => console.log('  ', id));
console.log('\nStubs (Stoppuhr/Live -- meist VERSTECKT, muessen aber existieren):');
extra.forEach(id => console.log('  ', id));
console.log('\n--- HTML-Stubzeile fuer die reinen Text-/Gruppen-Stubs (Live-Panel) ---');
const live = extra.filter(id => /live_|time_label/.test(id));
console.log('<div style="display:none">');
console.log('  ' + live.map(id => `<span id="${id}"></span>`).join(' '));
console.log('</div>');
console.log('\nHinweis: Stoppuhr-/Vektor-Stubs als SVG-Elemente (<g>/<line>/<circle>) anlegen.');
console.log('Definitive Absicherung: figur_smoke.mjs (jsdom) findet verbliebene Null-Zugriffe.');
