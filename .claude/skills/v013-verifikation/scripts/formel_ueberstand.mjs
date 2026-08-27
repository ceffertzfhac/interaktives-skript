#!/usr/bin/env node
/**
 * Inventur der Ueberstaende ueber den Schreibbereich -- im ECHTEN Browser
 * (headless Chromium), je Breiten-Modus. Werkzeug zu BACKLOG P14-1.
 *
 * WARUM ES DAS GIBT: die Formel-Ueberstaende wurden bis v1.33.3 in drei
 * Batches nach Augenmass repariert (7d38da8, 9a30a6c, 4a0d3ac/1960fbc).
 * Ohne Messung laesst sich weder sagen, ob ein Batch vollstaendig war, noch
 * ob ein neues Kapitel neue Uebersteher mitbringt. Merksatz aus P14:
 * **modussensitiv** -- eine Formel, die im breit-Modus passt, kann im
 * schmal-Modus herausragen, also wird jeder Modus einzeln vermessen.
 *
 * ZWEI FALLSTRICKE, die hier bewusst behandelt werden:
 *  1. Der Breiten-Modus wird ueber die HEADER-BUTTONS gesetzt, nicht ueber
 *     `documentElement.dataset.widthMode`. Das dataset-Attribut ist nur das
 *     CSS-Signal; die wirksame Spaltenbreite setzt `core.js::set_width_mode`
 *     zusaetzlich als `#content.style.width` + `--paper-max-width`. Wer nur
 *     das dataset setzt, misst gegen die alte Breite und bekommt Unsinn.
 *  2. `pages.js` zeigt genau EINE `.chapter-page` (`display:none` fuer den
 *     Rest). Verstecktes DOM liefert lauter Nullen -- fuer die Gesamtinventur
 *     werden daher alle Seiten voruebergehend eingeblendet (wie im Druckfluss,
 *     aber ohne `showAllPagesForPrint`, das die Spalte auf 700 px zwingt).
 *
 *   npm install --prefix /tmp playwright-core     # Chromium: ~/.cache/ms-playwright
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8765 &
 *
 *   node formel_ueberstand.mjs
 *   node formel_ueberstand.mjs --mode=schmal --max=40
 *   node formel_ueberstand.mjs --ohne-figuren --json=/tmp/inventur.json
 *
 * Optionen:
 *   --url=<url>      Default http://localhost:8765/index.html
 *   --mode=<liste>   Komma-Liste. Default schmal,normal,breit
 *   --tol=<px>       Toleranz, ab der ein Ueberstand zaehlt. Default 1.
 *   --max=<n>        Hoechstens n Treffer je Modus ausgeben (sortiert nach
 *                    Ueberstand absteigend). 0 = alle. Default 25.
 *   --ohne-figuren   .aspekt-figur-Container ausklammern (die sind absichtlich
 *                    breit und uebertoenen sonst die Formel-Treffer).
 *   --gegen=<was>    Referenzrand: `content` (Textspalte, Default) oder `box`
 *                    (Innenrand der umgebenden Highlight-Box, sonst Textspalte).
 *                    `box` ist strenger -- eine Nummer, die aus dem farbigen
 *                    Kasten ragt, faellt auf, auch wenn sie die Spalte nie
 *                    erreicht. Gilt NUR fuer Formeln: Absaetze und Boxtitel
 *                    fuellen ihre Box bis zum Innenrand und wuerden sonst
 *                    reihenweise als Uebersteher gemeldet (126 statt 3).
 *                    Gemessen 2026-08-27: content 1 Treffer, box 3.
 *   --json=<pfad>    Vollstaendiges Ergebnis zusaetzlich als JSON ablegen.
 *
 * GEMESSEN WIRD DIE TINTE, NICHT DIE CONTAINER-BOX. Die `mjx-container`-Box
 * ist die Zeilenbox und ragt regelmaessig weit ueber die Glyphen hinaus: bei
 * (1.1.57) meldet sie +87,3 px, gezeichnet sind +11,6 px; zwei weitere
 * "Treffer" lagen sogar 2,6 bzw. 48,1 px INNERHALB der Spalte. Wer gegen den
 * Container misst, jagt Gespenster (gleiche Falle wie in figur_screenshot.mjs).
 *
 * NUMMER UND KOERPER WERDEN GETRENNT GEMESSEN (P14-Kriterium a gegen b).
 * MathJax markiert den Nummern-Teilbaum mit `data-labels="true"`; die
 * `eq-<nummer>`-id am zugehoerigen mtd stammt aus der tagformat.id-
 * Konfiguration der Seite. Die VORFAHREN der Nummer zaehlen nicht zum
 * Koerper -- ihre Box umschliesst die Nummer mit, sonst messen beide
 * denselben Rand. Ausgabe: `(1.1.57)  [NUR die Nummer]` bzw. `[Formelkoerper]`.
 *
 * Referenzrand ist die SICHTBARE TEXTSPALTE: `#content`-Rand abzueglich
 * padding-right (P14-0 Frage 1, so entschieden). `#paper` wird je Treffer
 * mitgemessen und ausgegeben, entscheidet aber nicht ueber den Verstoss.
 *
 * Gemeldet wird je Kette nur das AEUSSERSTE ueberstehende Element (ein
 * ueberstehendes `mjx-container` zieht sonst all seine Kinder mit in die
 * Liste). Exit-Code 1, sobald irgendein Modus Uebersteher hat -- damit taugt
 * das Skript als Gate fuer P14-4.
 */
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
    const hit = args.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
    if (!hit) return dflt;
    return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};

const url = opt('url', 'http://localhost:8765/index.html');
const modi = String(opt('mode', 'schmal,normal,breit')).split(',').filter(Boolean);
const tol = Number(opt('tol', 1));
const max = Number(opt('max', 25));
const ohneFiguren = !!opt('ohne-figuren');
// Referenzrand: 'content' = Textspalte (P14-0-Entscheidung, Default),
// 'box' = Innenrand der umgebenden Highlight-Box, falls es eine gibt.
// 'box' ist STRENGER und entspricht dem, was man sieht: eine Nummer, die
// aus dem farbigen Kasten ragt, faellt auf, auch wenn sie die Textspalte
// nie erreicht.
const gegen = String(opt('gegen', 'content'));
if (!['content', 'box'].includes(gegen)) { console.error(`--gegen: 'content' oder 'box', nicht '${gegen}'`); process.exit(2); }
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
const EXEC = path.join(cache, dir, 'chrome-linux/chrome');

const browser = await chromium.launch({ executablePath: EXEC });
// Viewport MUSS breiter sein als die breiteste Spalte (breit = 1800 px), sonst
// ueberlaeuft das Papier den Viewport, center.js schaltet auf Horizontal-Scroll
// und man misst Scroll-Artefakte statt Ueberstaende.
const page = await browser.newPage({ viewport: { width: 2200, height: 1100 } });
const fehler = [];
page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
page.on('console', m => {
    if (m.type() !== 'error') return;
    if ((m.location()?.url || '').endsWith('/favicon.ico')) return;
    fehler.push('console: ' + m.text());
});

await page.goto(url, { waitUntil: 'networkidle' });
// Kapitel werden zur Laufzeit geholt (chapters.js) und erst danach paginiert.
await page.waitForFunction(() => document.querySelectorAll('.chapter-page').length > 0, null, { timeout: 30000 })
    .catch(() => fehler.push('Keine .chapter-page gefunden -- laeuft der Server, wurden die Kapitel geladen?'));
await page.evaluate(() => window.MathJax?.startup?.promise).catch(() => {});
await page.waitForTimeout(1500);

/**
 * Misst einen Breiten-Modus durch. Laeuft komplett im Seitenkontext, damit
 * pro Modus nur EIN Roundtrip noetig ist.
 */
async function messen(mode) {
    // Modus ueber den echten Header-Button setzen (s. Fallstrick 1 im Kopf).
    const gesetzt = await page.evaluate(m => {
        const b = document.querySelector(`button[data-action="set_width_mode"][data-mode="${m}"]`);
        if (!b) return false;
        b.click();
        return true;
    }, mode);
    if (!gesetzt) { fehler.push(`Width-Button fuer "${mode}" nicht gefunden`); return null; }
    await page.waitForTimeout(400);

    return page.evaluate(async ({ tol, ohneFiguren, gegen }) => {
        const content = document.getElementById('content');
        const paper = document.getElementById('paper');
        if (!content) return { fehlt: true };

        // Alle Seiten einblenden und den vorherigen Zustand merken.
        const seiten = [...document.querySelectorAll('.chapter-page')];
        const vorher = seiten.map(p => p.style.display);
        seiten.forEach(p => { p.style.display = ''; });
        // Nach dem Einblenden neu setzen lassen, was an der Sichtbarkeit hing.
        window.relayout_eq_numbers?.();
        await new Promise(r => setTimeout(r, 300));

        const innenRand = (el) => {
            const r = el.getBoundingClientRect(), c = getComputedStyle(el);
            return r.right - parseFloat(c.paddingRight || 0) - parseFloat(c.borderRightWidth || 0);
        };
        const cRect = content.getBoundingClientRect();
        const limit = innenRand(content);
        const pLimit = paper ? paper.getBoundingClientRect().right : limit;
        // Bei --gegen=box entscheidet der Innenrand der umgebenden Box.
        const BOX = '.lernziel, .beispiel, .bemerkung, .wichtig, .aufgabe, .zusammenfassung';
        // Der Boxrand ist nur fuer FORMELN die sinnvolle Grenze. Absaetze,
        // Boxtitel und Tabellen fuellen ihre Box definitionsgemaess bis zum
        // Innenrand aus -- gegen ihn gemessen meldet die Vollinventur sie
        // reihenweise als "Uebersteher" (gemessen: 126 statt 3).
        const grenzeFuer = (el) => {
            if (gegen !== 'box') return limit;
            if (el.tagName.toLowerCase() !== 'mjx-container') return limit;
            const b = el.closest(BOX);
            return b ? innenRand(b) : limit;
        };

        const artVon = (el) => {
            const t = el.tagName.toLowerCase();
            if (el.closest('.aspekt-figur')) return 'figur';
            if (t === 'mjx-container') return el.getAttribute('display') === 'true' ? 'formel-display' : 'formel-inline';
            if (el.closest('mjx-container')) {
                const c = el.closest('mjx-container');
                return c.getAttribute('display') === 'true' ? 'formel-display-teil' : 'formel-inline-teil';
            }
            if (t === 'table' || el.closest('table')) return 'tabelle';
            if (t === 'img' || t === 'svg' || t === 'picture') return 'bild';
            if (t === 'pre' || t === 'code') return 'code';
            if (el.closest('.highlight_box, .beispiel, .bemerkung, .wichtig, .lernziel, .aufgabe, .zusammenfassung, .anmerkung')) return 'box';
            if (t === 'figure' || el.closest('figure')) return 'abbildung';
            return 'sonstiges';
        };

        // Sichtbare Ueberschrift oberhalb des Treffers -- macht die Liste
        // ohne Zeilennummern navigierbar.
        const kontextVon = (el) => {
            const seite = el.closest('.chapter-page');
            let h = null;
            for (let n = el; n && n !== seite; n = n.parentElement) {
                let s = n.previousElementSibling;
                while (s) { if (/^H[1-6]$/.test(s.tagName)) { h = s; break; } s = s.previousElementSibling; }
                if (h) break;
            }
            if (!h && seite) h = seite.querySelector('h1,h2,h3,h4');
            // .chapter-page traegt keine id (pages.js vergibt keine) -- der
            // Index in der Seitenfolge ist die brauchbare Adresse.
            return {
                seite: seite ? `Seite ${seiten.indexOf(seite) + 1}/${seiten.length}` : '',
                ueberschrift: h ? h.textContent.trim().slice(0, 70) : ''
            };
        };

        // INK-BOX statt Container-Box bei MathJax. Die `mjx-container`-Box ist
        // die ZEILENBOX und ragt regelmaessig deutlich ueber die gezeichneten
        // Glyphen hinaus -- gegen sie gemessen meldet das Skript Ueberstaende,
        // die niemand sieht (gemessen: Container +87 px, Tinte +11,6 px; zwei
        // weitere "Treffer" lagen 2,6 bzw. 48,1 px INNERHALB der Spalte).
        // Fuer alles ausser MathJax ist die Elementbox die Tinte.
        // Die GLEICHUNGSNUMMER ist ein eigener Teilbaum: MathJax markiert ihn
        // mit `data-labels="true"`, und dank der tagformat.id-Konfiguration
        // traegt ihr mtd die id `eq-<nummer>`. Nummer und Formelkoerper werden
        // deshalb getrennt vermessen -- P14-Kriterium (a) gegen (b).
        const maxRechts = (nodes) => {
            let r = -Infinity;
            for (const g of nodes) {
                const b = g.getBoundingClientRect();
                if (b.width > 0 && b.height > 0) r = Math.max(r, b.right);
            }
            return r;
        };
        const teileVon = (el) => {
            const alleG = [...el.querySelectorAll('g[data-mml-node]')];
            const nummerG = alleG.filter(g => g.closest('[data-labels="true"]'));
            // Nicht nur die Nummer selbst ausschliessen, sondern auch ihre
            // VORFAHREN: deren Box umschliesst die Nummer mit, sonst misst der
            // "Koerper" genau denselben Rand wie die Nummer.
            const koerperG = alleG.filter(g => !g.closest('[data-labels="true"]')
                                            && !g.querySelector('[data-labels="true"]'));
            const idEl = el.querySelector('[id^="eq-"]');
            return {
                nummer: maxRechts(nummerG),
                koerper: maxRechts(koerperG),
                eqId: idEl ? idEl.id.replace(/^eq-/, '') : null
            };
        };
        const rechtsKante = (el) => {
            if (el.tagName.toLowerCase() !== 'mjx-container') {
                return el.getBoundingClientRect().right;
            }
            const t = teileVon(el);
            const r = Math.max(t.nummer, t.koerper);
            return isFinite(r) ? r : el.getBoundingClientRect().right;
        };

        const ueber = new Set();
        const alle = content.querySelectorAll('*');
        for (const el of alle) {
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;          // unsichtbar
            // Teile einer Formel nicht einzeln bewerten -- die Formel als
            // Ganzes wird ueber ihre Ink-Box beurteilt.
            if (el.closest('mjx-container') && el.tagName.toLowerCase() !== 'mjx-container') continue;
            if (rechtsKante(el) > grenzeFuer(el) + tol) ueber.add(el);
        }

        const treffer = [];
        for (const el of ueber) {
            // Nur das AEUSSERSTE Element einer Kette melden.
            if (el.parentElement && ueber.has(el.parentElement)) continue;
            const art = artVon(el);
            if (ohneFiguren && art === 'figur') continue;
            const r = el.getBoundingClientRect();
            const kante = rechtsKante(el);
            const grenze = grenzeFuer(el);

            // Was genau ragt heraus -- die Nummer oder der Formelkoerper?
            let anteil = null;
            if (art === 'formel-display' || art === 'formel-inline') {
                const t = teileVon(el);
                anteil = {
                    gleichung: t.eqId,
                    nummerUeberstand: isFinite(t.nummer) ? +(t.nummer - grenze).toFixed(1) : null,
                    koerperUeberstand: isFinite(t.koerper) ? +(t.koerper - grenze).toFixed(1) : null,
                    nurNummer: isFinite(t.nummer) && t.nummer > grenze + tol
                               && !(isFinite(t.koerper) && t.koerper > grenze + tol)
                };
            }

            treffer.push({
                art,
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                klasse: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 40),
                ueberstand: +(kante - grenze).toFixed(1),
                ueberstandContainer: +(r.right - grenze).toFixed(1),
                box: (el.closest(BOX)?.className) || null,
                ueberstandPaper: +(kante - pLimit).toFixed(1),
                breite: +r.width.toFixed(1),
                text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
                ...kontextVon(el),
                ...(anteil ? { anteil } : {})
            });
        }

        seiten.forEach((p, i) => { p.style.display = vorher[i]; });
        treffer.sort((a, b) => b.ueberstand - a.ueberstand);
        return {
            limit: +limit.toFixed(1),
            spaltenbreite: +cRect.width.toFixed(1),
            geprueft: alle.length,
            seiten: seiten.length,
            treffer
        };
    }, { tol, ohneFiguren, gegen });
}

// Positivkontrolle: ein bewusst zu breites Element einhaengen und pruefen, dass
// der Messpfad es findet. Ohne das ist ein Ergebnis von "0 Uebersteher" nicht
// von "Messung kaputt" zu unterscheiden -- genau der Trugschluss, an dem die
// Verifikation schon einmal gescheitert ist (s. figur_screenshot.mjs-Kopf).
const selbsttest = await (async () => {
    await page.evaluate(() => {
        const c = document.getElementById('content');
        const d = document.createElement('div');
        d.id = '__ueberstand_probe';
        d.style.cssText = 'height:20px;background:red;width:' +
            (c.getBoundingClientRect().width + 200) + 'px';
        (document.querySelector('.chapter-page') || c).prepend(d);
    });
    const e = await messen(modi[0]);
    const gefunden = !!e && !!e.treffer?.some(t => t.id === '__ueberstand_probe');
    await page.evaluate(() => document.getElementById('__ueberstand_probe')?.remove());
    return gefunden;
})();
if (!selbsttest) {
    console.error('SELBSTTEST FEHLGESCHLAGEN: ein absichtlich zu breites Element wurde');
    console.error('NICHT gefunden. Das Ergebnis unten ist wertlos -- Messpfad pruefen.');
    await browser.close();
    process.exit(2);
}
console.log('Selbsttest: Probe-Element gefunden — der Messpfad funktioniert.');

const ergebnis = {};
for (const m of modi) ergebnis[m] = await messen(m);
await browser.close();

// ---------------------------------------------------------------- Ausgabe
let gesamt = 0;
for (const m of modi) {
    const e = ergebnis[m];
    console.log(`\n=== Modus ${m} ===`);
    if (!e || e.fehlt) { console.log('  nicht messbar (#content fehlt)'); continue; }
    console.log(`  Spalte ${e.spaltenbreite} px, Rand bei x=${e.limit}, ${e.seiten} Seiten, ${e.geprueft} Elemente geprueft`);
    gesamt += e.treffer.length;
    if (!e.treffer.length) { console.log('  ✓ keine Uebersteher'); continue; }
    const zeigen = max > 0 ? e.treffer.slice(0, max) : e.treffer;
    console.log(`  ${e.treffer.length} Uebersteher${zeigen.length < e.treffer.length ? ` (zeige die ${zeigen.length} groessten)` : ''}:`);
    const nach = {};
    e.treffer.forEach(t => { nach[t.art] = (nach[t.art] || 0) + 1; });
    console.log('  nach Art: ' + Object.entries(nach).map(([k, v]) => `${k} ${v}`).join(', '));
    for (const t of zeigen) {
        const a = t.anteil;
        const z = a ? (a.gleichung ? `  (${a.gleichung})` : '') +
                      (a.nurNummer ? '  [NUR die Nummer]' : (a.koerperUeberstand > 0 ? '  [Formelkörper]' : '')) : '';
        console.log(`   +${String(t.ueberstand).padStart(7)} px  ${t.art.padEnd(20)} ${t.ueberschrift || t.seite}${z}`);
        if (t.seite) console.log(`              ${t.seite}`);
        if (t.text) console.log(`              ${t.text}`);
    }
    // Nicht verschweigen, was --max abgeschnitten hat.
    if (zeigen.length < e.treffer.length) {
        console.log(`  … ${e.treffer.length - zeigen.length} weitere nicht gezeigt (--max=0 zeigt alle)`);
    }
}

if (fehler.length) {
    console.log('\n=== Browser-Fehler ===');
    fehler.forEach(f => console.log('  ' + f));
}

if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify({ url, tol, ohneFiguren, ergebnis, fehler }, null, 2));
    console.log(`\nJSON: ${jsonOut}`);
}

console.log(`\nSUMME ueber alle Modi: ${gesamt} Uebersteher`);
process.exit(gesamt > 0 ? 1 : 0);
