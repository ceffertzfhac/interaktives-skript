#!/usr/bin/env node
/**
 * Screenshot- und Messwerkzeug fuer Aspekt-Figuren im ECHTEN Browser
 * (headless Chromium). Ergaenzt figur_smoke.mjs: jsdom findet Null-Zugriffe,
 * dieses Skript findet alles Optische -- Platzierung, Kollisionen, Groessen,
 * Sichtbarkeit, Layout je Breiten-Modus.
 *
 * WARUM ES DAS GIBT: bei Abb. 1.41 wurde eine falsche φ-Platzierung dreimal
 * hintereinander per DOM-Messung als "korrekt" bestaetigt, weil die gemessene
 * Box (mjx-container = Zeilenbox) nicht das war, was man sieht (die Glyphe).
 * Ein Screenshot haette den Fehler in der ersten Runde gezeigt. Merksatz:
 * **anschauen schlaegt ausmessen** -- und wenn messen, dann die INK-Box
 * (innerstes <svg>/<g>/getBBox), nicht den Container.
 *
 *   npm install --prefix /tmp playwright-core        # Chromium: ~/.cache/ms-playwright
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8765 &
 *
 *   node figur_screenshot.mjs --fig=aspekt-winkel-zeit --out=/tmp/f.png
 *   node figur_screenshot.mjs --fig=aspekt-winkel-zeit --sel='svg[id$=main_svg]' \
 *        --set=ak_t=1.5,ak_T=4 --mode=breit --scale=3 --out=/tmp/szene.png
 *   node figur_screenshot.mjs --fig=aspekt-kreisbahn --measure='foreignObject[id$=angle_label]' \
 *        --ink --set=ak_phi=135
 *
 * Optionen:
 *   --fig=<id>        Pflicht. id des .aspekt-figur-Platzhalters im Kapitel.
 *   --url=<url>       Default http://localhost:8765/index.html
 *   --sel=<css>       Was fotografiert wird, relativ zur Figur. Default: die Figur.
 *   --set=k=v,k=v     Regler setzen; Schluessel = ID-Suffix (ak_t, ak_phi, ak_T, ak_r).
 *   --mode=<m>        Breiten-Modus: schmal | normal | breit. Default: unveraendert.
 *   --overlay         Vorher die Lupe klicken (Zoom-Ansicht fotografieren).
 *   --measure=<css>   Zusaetzlich Geometrie ausgeben (relativ zur Figur).
 *   --ink             --measure misst das innerste gezeichnete Element statt des
 *                     Containers (deckt Zeilenbox-/Grundlinien-Versatz auf).
 *   --scale=<n>       deviceScaleFactor, Default 2 (3-4 fuer Detailaufnahmen).
 *   --out=<pfad>      PNG-Ziel. Default /tmp/aspekt_<fig>.png
 *
 * Ausgabe: JSON mit Konsolenfehlern (leer = gut), optionaler Messung und
 * Screenshot-Pfad. Ein pageerror bedeutet fast immer: EIN Figurenmodul hat einen
 * Syntaxfehler und damit sind ALLE Figuren tot (main.js importiert sie alle als
 * Seiteneffekt) -- dann zuerst `node --input-type=module --check < <modul>.js`.
 */
import path from 'path';
import { createRequire } from 'module';

const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
    const hit = args.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
    if (!hit) return dflt;
    return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};

const figId = opt('fig');
if (!figId) { console.error('Aufruf: node figur_screenshot.mjs --fig=<id> [...]'); process.exit(1); }
const url = opt('url', 'http://localhost:8765/index.html');
const sel = opt('sel');
const mode = opt('mode');
const overlay = !!opt('overlay');
const dark = !!opt('dark');    // --dark: Dunkelmodus vor dem Foto einschalten
const measure = opt('measure');
const ink = !!opt('ink');
const scale = Number(opt('scale', 2));
const out = opt('out', `/tmp/aspekt_${figId}.png`);
const sets = String(opt('set', '')).split(',').filter(Boolean)
    .map(kv => { const [k, v] = kv.split('='); return { k, v }; });

const PW_PATH = process.env.PLAYWRIGHT_PREFIX || '/tmp/node_modules';
const require_ = createRequire(path.join(PW_PATH, 'noop.js'));
let chromium;
try { ({ chromium } = require_('playwright-core')); }
catch { console.error('playwright-core fehlt:  npm install --prefix /tmp playwright-core'); process.exit(1); }

// Chromium aus dem Playwright-Cache (kein System-Chrome noetig).
import fs from 'fs';
const cache = path.join(process.env.HOME, '.cache/ms-playwright');
const dir = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop() : null;
if (!dir) { console.error(`Kein Chromium in ${cache} (npx playwright install chromium)`); process.exit(1); }
const EXEC = path.join(cache, dir, 'chrome-linux/chrome');

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: scale });
const fehler = [];
page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
page.on('console', m => {
    // /favicon.ico fordert der Browser von sich aus an; die Seite deklariert
    // keins -> 404 als Dauerrauschen. Herausfiltern, damit echte Fehler auffallen.
    if (m.type() !== 'error') return;
    if ((m.location()?.url || '').endsWith('/favicon.ico')) return;
    fehler.push('console: ' + m.text());
});

await page.goto(url, { waitUntil: 'networkidle' });
// Kapitel werden zur Laufzeit nachgeladen -> auf die GEBAUTE Figur warten.
// Kriterium bewusst implementierungsfrei ("Platzhalter hat Inhalt bekommen")
// statt an `data-built` oder `.aspekt-body` zu haengen — beides sind interne
// Details der Factories und koennen sich aendern.
await page.waitForFunction(
    id => { const f = document.getElementById(id); return !!f && f.children.length > 0; },
    figId, { timeout: 20000 })
    .catch(() => fehler.push(`Figur #${figId} wurde nicht gebaut (Modul-Syntaxfehler? s. pageerror)`));
await page.waitForTimeout(1200);

const info = await page.evaluate(async ({ figId, mode, sets, overlay, dark }) => {
    if (mode) document.documentElement.dataset.widthMode = mode;
    // Dunkelmodus wie core.js::toggle_darkmode: das <link> freischalten UND das
    // Wurzel-Signal setzen -- die CVD-Paletten der Figuren verzweigen ueber
    // data-darkmode, ohne das bliebe die Szene hell auf dunklem Grund.
    if (dark) {
        const ds = document.getElementById('darkmode_stylesheet');
        if (ds) ds.disabled = false;
        document.documentElement.dataset.darkmode = '1';
        if (window.apply_farbwoerter) window.apply_farbwoerter();
    }
    const fig = document.getElementById(figId);
    if (!fig) return { fehlt: true };
    // Nur die Seite der Figur zeigen, sonst steht sie ausserhalb des Viewports.
    // UEBER DIE APP navigieren, nicht per style.display: seit dem seitenweisen
    // Setzen (BACKLOG P22-3c) typesetzt MathJax eine Seite erst, wenn sie ueber
    // showPage() aktiv wird und das pagechange-Event feuert. Wer stattdessen
    // direkt display umschaltet, bekommt eine Seite mit ROHEM LaTeX --
    // real passiert bei Abb. 1.9 (2026-08-31): der Screenshot zeigte
    // "\(h_0\)" und sah nach einem Figur-Fehler aus, den es nicht gab.
    // location.hash ist der Weg, den pages.js selbst abonniert (hashchange).
    const seite = fig.closest('.chapter-page');
    if (seite && seite.dataset.pageId) {
        location.hash = '#' + seite.dataset.pageId;
    } else if (seite) {
        document.querySelectorAll('.chapter-page').forEach(p => { p.style.display = (p === seite ? '' : 'none'); });
    }
    if (overlay) { const l = fig.querySelector('.aspekt-lupe'); if (l) l.click(); }
    const ziel = document.querySelector('.aspekt-im-overlay') || fig;
    for (const { k, v } of sets) {
        const s = [...ziel.querySelectorAll('input[type=range]')].find(x => x.id.endsWith(k));
        if (s) { s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    return { ok: true };
}, { figId, mode, sets, overlay, dark });
if (info.fehlt) { fehler.push(`#${figId} nicht im DOM`); }

await page.waitForTimeout(500);

// ERST HIER auf den fertigen MathJax-Satz warten -- die Navigation zur Seite
// der Figur ist im evaluate oben passiert, und seit dem seitenweisen Setzen
// (BACKLOG P22-3c) beginnt der Typeset dieser Seite erst danach. Vorher
// gewartet zu haben half nichts: der Screenshot zeigte die Bildunterschrift als
// rohes LaTeX ("\(h_0\)") und sah nach einem Figur-Fehler aus, den es nicht
// gab (real bei Abb. 1.9, 2026-08-31).
// Fallback ist die feste Wartezeit -- eine Figur ohne Formeln in der
// Unterschrift erfuellt die Bedingung nie.
await page.waitForFunction(
    id => {
        const f = document.getElementById(id);
        if (!f) return false;
        const cap = f.querySelector('.aspekt-caption');
        if (!cap) return true;
        return !/\\\(/.test(cap.textContent) || !!cap.querySelector('mjx-container');
    },
    figId, { timeout: 10000 })
    .catch(() => fehler.push('Bildunterschrift nach 10 s nicht gesetzt -- Screenshot zeigt evtl. rohes LaTeX'));
await page.waitForTimeout(400);

let messung = null;
if (measure) {
    messung = await page.evaluate(({ figId, measure, ink }) => {
        const fig = document.querySelector('.aspekt-im-overlay') || document.getElementById(figId);
        const el = fig && fig.querySelector(measure);
        if (!el) return { gefunden: false };
        // INK: innerstes gezeichnetes Element -- deckt auf, wenn der Container
        // (z. B. mjx-container = Zeilenbox) groesser ist als das Sichtbare.
        const inner = ink ? (el.querySelector('mjx-container svg g, svg g, svg, text') || el) : el;
        const r = e => { const b = e.getBoundingClientRect();
            return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
                     cx: +(b.x + b.width / 2).toFixed(2), cy: +(b.y + b.height / 2).toFixed(2) }; };
        const a = r(el), b = r(inner);
        return { gefunden: true, container: a, ink: b,
                 versatz: { dx: +(b.cx - a.cx).toFixed(2), dy: +(b.cy - a.cy).toFixed(2) } };
    }, { figId, measure, ink });
}

const shotSel = sel ? `${sel}` : null;
const handle = await page.evaluateHandle(({ figId, shotSel }) => {
    const fig = document.querySelector('.aspekt-im-overlay') || document.getElementById(figId);
    return shotSel ? fig.querySelector(shotSel) : fig;
}, { figId, shotSel });
const el = handle.asElement();
// NICHT el.screenshot() verwenden: in der schmalen Ansicht ist die Figur
// gestapelt und hoeher als das Sichtfeld; Playwright scrollt sie hinein, die
// klebende Ablaufleiste (position:sticky) verschiebt sie dabei, das loest den
// naechsten Scroll aus — "element is not stable", Endlosschleife. Betrifft ALLE
// Figuren (an 1.4 und 1.9 gleichermassen nachgewiesen, 2026-08-31).
// Stattdessen: Sichtfeld so hoch machen, dass die Figur ganz hineinpasst, nach
// oben scrollen und aus einem SEITEN-Screenshot ausschneiden. Damit entfaellt
// Playwrights Stabilitaetspruefung, und die klebende Leiste sitzt da, wo sie
// bei Scroll-Position 0 ohnehin sitzt.
if (el) {
    const mass = await page.evaluate((figId) => {
        const f = document.querySelector('.aspekt-im-overlay') || document.getElementById(figId);
        const r = f.getBoundingClientRect();
        return { top: r.top + window.scrollY, left: r.left + window.scrollX,
                 width: r.width, height: r.height };
    }, figId);
    const hoehe = Math.min(6000, Math.ceil(mass.height) + 160);
    if (hoehe > page.viewportSize().height) {
        await page.setViewportSize({ width: page.viewportSize().width, height: hoehe });
        await page.waitForTimeout(350);
    }
    // An den ANFANG DER FIGUR scrollen, nicht an den Seitenanfang: die Figur
    // steht mitten im Kapitel, bei scrollTo(0,0) laege sie ausserhalb des
    // Ausschnitts ("Clipped area is outside the resulting image").
    const jetzt = await page.evaluate((figId) => {
        const f = document.querySelector('.aspekt-im-overlay') || document.getElementById(figId);
        const oben = f.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, oben - 40));
        const r = f.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, figId);
    await page.waitForTimeout(200);
    await page.screenshot({ path: out, animations: 'disabled', clip: {
        x: Math.max(0, jetzt.x), y: Math.max(0, jetzt.y),
        width: Math.max(1, jetzt.width), height: Math.max(1, jetzt.height) } });
}

console.log(JSON.stringify({ figur: figId, modus: mode || '(unveraendert)', overlay,
    screenshot: el ? out : null, messung, fehler: fehler.length ? fehler : 'keine' }, null, 1));
await browser.close();
