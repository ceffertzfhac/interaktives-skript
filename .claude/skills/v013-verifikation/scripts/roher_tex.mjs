#!/usr/bin/env node
/**
 * Gate gegen den haeufigsten sichtbaren Fehler des Skripts: nach dem Setzen
 * darf auf KEINER Seite roher TeX-Quelltext im Fliesstext stehen bleiben.
 *
 * WARUM ES DAS GIBT (P5, gefunden am 14.09.2026): in 2.2.7 stand
 * `\(r_B<r_A\)`. Der HTML-Parser liest `<r_A\)` als Tag-Anfang -- der Absatz
 * brach im Browser mitten im Satz ab, die Formel blieb als Quelltext stehen,
 * der Rest des Satzes verschwand im Pseudo-Element. Sowas faellt beim Lesen
 * kaum auf ("der Satz ist halt kurz"), aber diese Messung findet es sofort.
 * Dieselbe Messung deckt den zweiten Weg zum selben Symptom ab: einen
 * MathJax-Lauf, der ueberholt wurde und Quelltext liegen laesst (P22-3).
 *
 * FALLSTRICK: MathJax setzt SEITENWEISE (P22-3) -- versteckte Seiten sind noch
 * gar nicht gesetzt und lieferten lauter Falschtreffer. Deshalb wird jede Seite
 * ueber ihren Anker angesteuert und erst danach gelesen.
 *
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8000 &
 *   node roher_tex.mjs
 *
 * Optionen:
 *   --url=<url>   Default http://localhost:8000/index.html
 *
 * Exit-Code 1 bei jedem Fund, 2 wenn die Messung selbst nicht laufen kann.
 */
import { browserUmgebung } from '../../_lib/browser.mjs';

let chromium, EXEC;
try { ({ chromium, executablePath: EXEC } = browserUmgebung()); }
catch (e) { console.error(e.message); process.exit(2); }

const args = process.argv.slice(2);
const url = (args.find(a => a.startsWith('--url=')) || '--url=http://localhost:8000/index.html').split('=').slice(1).join('=');

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 2200, height: 1100 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('[data-page-id]').length > 0, null, { timeout: 30000 })
    .catch(() => { console.error('Keine Seiten gefunden -- laeuft der Server?'); process.exit(2); });
await page.waitForTimeout(1200);

// Selbsttest: ein absichtlich roher Ausdruck muss gefunden werden, sonst misst
// die Suche ins Leere und "0 Funde" waere wertlos.
const selbsttest = await page.evaluate(() => {
    const p = [...document.querySelectorAll('[data-page-id]')].find(e => e.style.display !== 'none');
    const probe = document.createElement('p');
    probe.id = 'roher-tex-selbsttest';
    probe.textContent = 'Probe \\(x=1\\)';
    p.appendChild(probe);
    const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let n, gefunden = false;
    while ((n = walk.nextNode())) if (/\\\(/.test(n.nodeValue || '')) gefunden = true;
    probe.remove();
    return gefunden;
});
if (!selbsttest) { console.error('Selbsttest fehlgeschlagen -- die Suche findet nicht einmal die eigene Probe.'); process.exit(2); }
console.log('Selbsttest: Probe mit rohem TeX gefunden -- der Messpfad greift.');

const ids = await page.evaluate(() => [...document.querySelectorAll('[data-page-id]')].map(p => p.dataset.pageId));
let treffer = 0;
for (const id of ids) {
    await page.evaluate(i => { location.hash = '#' + i; }, id);
    await page.waitForTimeout(200);
    await page.evaluate(() => window.MathJax?.startup?.promise).catch(() => {});
    const funde = await page.evaluate(() => {
        const p = [...document.querySelectorAll('[data-page-id]')].find(e => e.style.display !== 'none');
        if (!p) return [];
        const out = [];
        const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) {
            if (n.parentElement?.closest('mjx-container, script, style')) continue;
            const t = n.nodeValue || '';
            if (/\\\(|\\\[|\\begin\{/.test(t)) out.push(t.replace(/\s+/g, ' ').trim().slice(0, 90));
        }
        return out;
    });
    for (const t of funde) { console.log(`  ${id}: ${t}`); treffer++; }
}
await browser.close();

console.log(`${ids.length} Seiten geprueft, ${treffer} Stellen mit rohem TeX im Text`);
if (treffer) { console.log('-> jede Stelle pruefen: meist ein rohes "<" in \\(...\\), das als Tag gelesen wird (dann &lt;).'); process.exit(1); }
console.log('  ✓ keine');
