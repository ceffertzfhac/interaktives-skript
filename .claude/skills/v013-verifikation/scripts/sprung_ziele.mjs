#!/usr/bin/env node
/**
 * Inventur der SPRUNGZIELE -- landet ein Anker-Sprung dort, wo er soll?
 * Werkzeug zu BACKLOG P5 ("Sprungmarken landen nicht am Ziel").
 *
 * WARUM ES DAS GIBT: die Sprungmarken sind an drei unabhaengigen Stellen
 * kaputtgegangen, und keine davon faellt beim Lesen des Codes auf:
 *   1. Zentrieren statt Anlegen -- ein Ziel, das hoeher ist als das Fenster,
 *      verliert beim Zentrieren seinen ANFANG nach oben.
 *   2. Ziele mit `display:none` (.nur-druck, der Druck-Fallback einer
 *      interaktiven Figur) liefern ein Null-Rechteck; der Sprung landet am
 *      Seitenanfang. main.js lenkt sie ueber data-figref um.
 *   3. Die Kapitelbilder tragen loading="lazy" und sind im Moment des Sprungs
 *      0 px hoch. Wachsen sie OBERHALB des Ziels nach, rutscht das Ziel weg
 *      (gemessen: 1547 px bei Abb. 1.12). ui.js::scrollToAnchor fasst deshalb
 *      nach, solange Bilder laden.
 * Alle drei sind Geometrie, also messbar -- und jede Aenderung an Kopfleiste,
 * Paginierung oder Bildladen kann sie erneut brechen.
 *
 * GEMESSEN WIRD: der Abstand der Ziel-Oberkante zur UNTERKANTE der klebenden
 * Kopfleiste, nachdem der Sprung zur Ruhe gekommen ist. Soll: 0 bis --tol px
 * (ui.js legt ANKER_LUFT = 12 px an). Ein negativer Wert heisst "unter der
 * Kopfleiste verschwunden", ein grosser positiver "zu tief gelandet".
 * Ausgenommen sind Ziele am DOKUMENTENDE: dort kappt der Browser den Sprung,
 * das Ziel kann seine Sollposition gar nicht erreichen.
 *
 *   npm install --prefix /tmp playwright-core     # Chromium: ~/.cache/ms-playwright
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8000 &
 *
 *   node sprung_ziele.mjs
 *   node sprung_ziele.mjs --was=xref --seiten=p-1-1-4,p-1-3-1
 *
 * Optionen:
 *   --url=<url>      Default http://localhost:8000/index.html
 *   --was=<liste>    schiene,xref (Default beide). "schiene" = die Eintraege
 *                    der Spalte "Auf dieser Seite", "xref" = die Querverweise
 *                    im Fliesstext (a.xref auf Abbildung/Box).
 *   --seiten=<liste> nur diese page-ids (Default alle).
 *   --tol=<px>       oberer Grenzwert. Default 40 (Kopfleiste + Luft + etwas
 *                    Spiel fuer Marginalien).
 *   --ruhe=<ms>      Wartezeit nach dem Klick, bis nachgemessen wird.
 *                    Default 2000 -- ui.js fasst bis zu 2,5 s nach, aber nur,
 *                    solange sich noch etwas bewegt.
 *   --max=<n>        Hoechstens n Treffer ausgeben. 0 = alle. Default 25.
 *   --json=<pfad>    vollstaendiges Ergebnis als JSON.
 *
 * Exit-Code 1, sobald ein Sprung danebengeht (Gate); 2 bei kaputter Messung.
 */
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (name, def) => {
    const t = args.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
    if (!t) return def;
    return t.includes('=') ? t.slice(t.indexOf('=') + 1) : true;
};
const url = String(opt('url', 'http://localhost:8000/index.html'));
const was = String(opt('was', 'schiene,xref')).split(',').map(s => s.trim()).filter(Boolean);
const nurSeiten = opt('seiten') ? String(opt('seiten')).split(',').map(s => s.trim()) : null;
const tol = Number(opt('tol', 40));
const ruhe = Number(opt('ruhe', 2000));
const max = Number(opt('max', 25));
const jsonOut = opt('json');

const PW_PATH = process.env.PLAYWRIGHT_PREFIX || '/tmp/node_modules';
const require_ = createRequire(path.join(PW_PATH, 'noop.js'));
let chromium;
try { ({ chromium } = require_('playwright-core')); }
catch { console.error('playwright-core fehlt:  npm install --prefix /tmp playwright-core'); process.exit(2); }

const cache = path.join(process.env.HOME, '.cache/ms-playwright');
const dir = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop() : null;
if (!dir) { console.error(`Kein Chromium in ${cache} (npx playwright install chromium)`); process.exit(2); }
const browser = await chromium.launch({ executablePath: path.join(cache, dir, 'chrome-linux/chrome') });
// Fenster in Lesegroesse, nicht uebergross: ein zu hohes Fenster verdeckt
// genau den Fehler, um den es hier geht (ein Ziel, das hoeher ist als das
// Fenster, wird beim Zentrieren nach oben herausgeschoben).
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const fehler = [];
page.on('pageerror', e => fehler.push('pageerror: ' + e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('.chapter-page').length > 0, null, { timeout: 30000 })
    .catch(() => { console.error('Keine .chapter-page -- laeuft der Server?'); process.exit(2); });
await page.evaluate(() => window.MathJax?.startup?.promise).catch(() => {});
await page.waitForTimeout(1500);

const seiten = (await page.evaluate(() => [...document.querySelectorAll('.chapter-page')].map(e => e.dataset.pageId)))
    .filter(id => !nurSeiten || nurSeiten.includes(id));
if (seiten.length === 0) { console.error('Keine Seiten zu messen.'); process.exit(2); }

// SELBSTTEST: ein Sprung, der laut Messpfad danebengehen MUSS. Ohne ihn
// koennte "0 danebengegangen" auch von einer Messung kommen, die nichts sieht.
const selbsttest = await page.evaluate(async () => {
    const kopf = document.getElementById('header');
    const el = document.createElement('div');
    el.style.cssText = 'height:20px;background:red';
    const seite = document.querySelector('.chapter-page');
    seite.appendChild(el);
    window.scrollTo(0, 0);
    const delta = Math.round(el.getBoundingClientRect().top - (kopf ? kopf.getBoundingClientRect().height : 0));
    el.remove();
    return delta;      // ohne Sprung liegt das Element weit unter der Leiste
});
if (!(selbsttest > 40)) {
    console.error(`Selbsttest fehlgeschlagen (delta=${selbsttest}) -- der Messpfad misst nicht, was er soll.`);
    process.exit(2);
}
console.log('Selbsttest: ungesprungenes Element liegt ' + selbsttest + ' px unter der Leiste — der Messpfad greift.');

const treffer = [];
let gemessen = 0;
for (const seite of seiten) {
    const ergebnis = await page.evaluate(async ({ seite, was, ruhe }) => {
        const out = [];
        const nav = document.querySelector('[data-action="goto_page"][data-arg="' + CSS.escape(seite) + '"]');
        if (!nav) return out;
        nav.click();
        await new Promise(r => setTimeout(r, 250));
        const seitenEl = document.querySelector('.chapter-page[data-page-id="' + CSS.escape(seite) + '"]');
        if (!seitenEl) return out;
        const links = [];
        if (was.includes('schiene')) {
            document.querySelectorAll('.rail-onpage .rail-item').forEach(a => links.push({ a, art: 'schiene' }));
        }
        if (was.includes('xref')) {
            // Abschnittsverweise bleiben draussen: die wechseln die Seite und
            // haben kein Element-Ziel auf ihr.
            seitenEl.querySelectorAll('a.xref[href^="#"]').forEach(a => {
                if (a.dataset.refFig || a.dataset.refBox) links.push({ a, art: 'xref' });
            });
        }
        const kopf = document.getElementById('header');
        for (const { a, art } of links) {
            const id = decodeURIComponent(a.getAttribute('href').slice(1));
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 60));
            a.click();
            await new Promise(r => setTimeout(r, ruhe));
            // Ist das Ziel am Bildschirm unsichtbar (.nur-druck), gilt die
            // interaktive Figur, die es ersetzt -- genau wie in main.js.
            let el = document.getElementById(id);
            const versteckt = !!(el && getComputedStyle(el).display === 'none');
            if (versteckt) {
                const ers = document.querySelector('.aspekt-figur[data-figref="' + CSS.escape(id) + '"]');
                if (ers) el = ers;
            }
            if (!el) { out.push({ seite, art, id, fehlt: true }); continue; }
            const kh = kopf ? kopf.getBoundingClientRect().height : 0;
            const amEnde = Math.abs(window.scrollY - (document.documentElement.scrollHeight - window.innerHeight)) < 3;
            out.push({
                seite, art, id, versteckt, umgelenkt: versteckt && el.id !== id, amEnde,
                delta: Math.round(el.getBoundingClientRect().top - kh),
                text: (a.textContent || '').trim().slice(0, 60),
            });
        }
        return out;
    }, { seite, was, ruhe });
    for (const r of ergebnis) {
        gemessen++;
        const daneben = r.fehlt || (!r.amEnde && (r.delta < 0 || r.delta > tol));
        if (daneben) treffer.push(r);
    }
}

console.log(`\n${gemessen} Spruenge gemessen auf ${seiten.length} Seiten (${was.join('+')}), Toleranz 0..${tol} px`);
if (treffer.length === 0) console.log('  ✓ alle Ziele liegen dicht unter der Kopfleiste');
else {
    console.log(`  ✗ ${treffer.length} danebengegangen:`);
    for (const r of treffer.slice(0, max || treffer.length)) {
        console.log(`     ${r.seite}  ${r.art}  ${r.id}  ` +
                    (r.fehlt ? 'ZIEL FEHLT' : `delta=${r.delta} px`) + (r.text ? `  „${r.text}"` : ''));
    }
}
if (fehler.length) console.log(`\nKonsolenfehler: ${fehler.length}\n  ` + fehler.slice(0, 5).join('\n  '));
if (jsonOut) fs.writeFileSync(String(jsonOut), JSON.stringify({ gemessen, tol, treffer, fehler }, null, 1));

await browser.close();
process.exit(treffer.length ? 1 : 0);
