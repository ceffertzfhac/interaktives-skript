#!/usr/bin/env node
/**
 * Alle gerenderten Gleichungsnummern des WIP in Lesereihenfolge -- im ECHTEN
 * Browser, Seite fuer Seite. Gegenstueck zu referenznummern.py (Sollwerte aus
 * dem PDF): erst beide Listen nebeneinander zeigen, ob die Nummerierung des
 * interaktiven Skripts mit dem Druckskript uebereinstimmt.
 *
 * WARUM ES DAS GIBT (P21-3, 14.09.2026): Stufe 2 des Skills
 * (mathjax_pruefen.cjs, offline) kommt an mehreren Fragmenten nicht vorbei --
 * der lite-Parser von MathJax laedt fuer benannte Entities (&uuml; & Co.) eine
 * Tabelle asynchron nach und wirft ohne asyncLoad "MathJax retry". Ausserdem
 * nimmt er nur EIN Abschnitts-Praefix entgegen, waehrend ein Fragment mehrere
 * Abschnitte enthalten kann. Der Browser hat beide Probleme nicht.
 *
 * ZWEI FALLSTRICKE, die hier bewusst behandelt werden:
 *  1. MathJax setzt SEITENWEISE (P22-3). Wer alle .chapter-page einblendet und
 *     einmal liest, findet zwei Formeln statt tausend -- versteckte Seiten sind
 *     schlicht noch nicht gesetzt. Deshalb wird jede Seite ueber ihren Anker
 *     angesteuert und danach gelesen.
 *  2. Ein align-Block ist EIN mjx-container mit MEHREREN Nummern. Wer je
 *     Container nur die erste liest, bekommt stillschweigend zu wenig (im
 *     ganzen Skript 802 statt 947) und haelt das fuer eine Abweichung des WIP.
 *     Deshalb werden alle Treffer je Container gelesen und gegen die Zahl der
 *     von MathJax angelegten mlabeledtr-Zeilen geprueft.
 *
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8000 &
 *   node gleichungsnummern.mjs                    # eine Nummer je Zeile
 *   node gleichungsnummern.mjs --zaehlung         # nur Summe je Abschnitt
 *
 * Optionen:
 *   --url=<url>   Default http://localhost:8000/index.html
 *   --zaehlung    statt der Liste eine Tabelle "Abschnitt  Anzahl  hoechste"
 *
 * Exit-Code 1, sobald auf einer Seite weniger Nummern gelesen wurden als
 * MathJax Zeilen angelegt hat (die Messung waere dann selbst schuld), oder
 * wenn die Seite JS-Fehler wirft.
 */
import { browserUmgebung } from '../../_lib/browser.mjs';

let chromium, EXEC;
try { ({ chromium, executablePath: EXEC } = browserUmgebung()); }
catch (e) { console.error(e.message); process.exit(2); }

const args = process.argv.slice(2);
const opt = (n, d = null) => {
    const h = args.find(a => a === `--${n}` || a.startsWith(`--${n}=`));
    return h ? (h.includes('=') ? h.split('=').slice(1).join('=') : true) : d;
};
const url = opt('url', 'http://localhost:8000/index.html');
const nurZaehlung = !!opt('zaehlung');

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 2200, height: 1100 } });
const fehler = [];
page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
page.on('console', m => {
    if (m.type() !== 'error') return;
    if ((m.location()?.url || '').endsWith('/favicon.ico')) return;
    fehler.push('console: ' + m.text());
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('[data-page-id]').length > 0, null, { timeout: 30000 })
    .catch(() => { console.error('Keine Seiten gefunden -- laeuft der Server?'); process.exit(2); });
await page.waitForTimeout(1500);

const ids = await page.evaluate(() => [...document.querySelectorAll('[data-page-id]')].map(p => p.dataset.pageId));
const alle = [];
for (const id of ids) {
    await page.evaluate(i => { location.hash = '#' + i; }, id);
    await page.waitForTimeout(220);
    await page.evaluate(() => window.MathJax?.startup?.promise).catch(() => {});
    const r = await page.evaluate(() => {
        const p = [...document.querySelectorAll('[data-page-id]')].find(e => e.style.display !== 'none');
        if (!p) return { tags: [], erwartet: 0 };
        const tags = [];
        for (const c of p.querySelectorAll('mjx-container')) {
            const t = (c.textContent || '').replace(/\s+/g, '');
            for (const m of t.matchAll(/\((\d+\.\d+\.\d+)\)/g)) tags.push(m[1]);
        }
        return { tags, erwartet: p.querySelectorAll('[data-mml-node="mlabeledtr"]').length };
    });
    if (r.tags.length !== r.erwartet) fehler.push(`${id}: ${r.tags.length} Nummern gelesen, ${r.erwartet} erwartet`);
    alle.push(...r.tags);
}
await browser.close();

if (nurZaehlung) {
    const proAbschnitt = new Map();
    for (const t of alle) {
        const sec = t.slice(0, t.lastIndexOf('.'));
        const n = Number(t.slice(t.lastIndexOf('.') + 1));
        const e = proAbschnitt.get(sec) || { anzahl: 0, hoechste: 0 };
        e.anzahl++; e.hoechste = Math.max(e.hoechste, n);
        proAbschnitt.set(sec, e);
    }
    console.log('Abschnitt  Anzahl  hoechste');
    for (const [sec, e] of proAbschnitt) console.log(`${sec.padEnd(10)} ${String(e.anzahl).padStart(6)} ${String(e.hoechste).padStart(9)}`);
    console.log(`SUMME      ${String(alle.length).padStart(6)}`);
} else {
    console.log(alle.join('\n'));
}
console.error(`${ids.length} Seiten, ${alle.length} Gleichungsnummern`);
if (fehler.length) { console.error('BEFUND:\n  ' + fehler.join('\n  ')); process.exit(1); }
console.error('keine Auffaelligkeiten');
