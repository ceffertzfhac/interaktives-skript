#!/usr/bin/env node
/**
 * breiten_check.mjs — misst, wie viel der verfuegbaren Breite eine Aspekt-Figur
 * in den drei Breiten-Modi tatsaechlich BENUTZT. Findet stille Klemmen, die
 * weder der Smoke-Test noch die Nummerierungspruefung sehen: die Figur
 * funktioniert, sie ist nur zu klein.
 *
 * Aufruf (lokaler Server muss laufen):
 *   cd InteraktivesSkript_WIP && python3 -m http.server 8765 &
 *   node breiten_check.mjs                       # alle Figuren
 *   node breiten_check.mjs --fig=aspekt-weg-zeit # nur eine
 *   node breiten_check.mjs --schwelle=35         # Meldeschwelle in Prozent
 *   node breiten_check.mjs --base=http://localhost:8765/
 *
 * ── Zwei Fallen, die beide real zugeschlagen haben (2026-08-31) ────────────
 *
 * 1. NICHT `document.documentElement.dataset.widthMode = m` setzen, um den
 *    Modus zu wechseln. core.js::set_width_mode setzt ausserdem die Breite von
 *    #content und #container sowie --paper-max-width; ohne das bleibt die
 *    Lesespalte breit und jede Prozentangabe ist zu schlecht. Dieses Skript
 *    klickt deshalb die echten Knoepfe im Einstellungen-Popover.
 *
 * 2. NICHT die Breite des <svg>-Elements messen. preserveAspectRatio="meet"
 *    passt die Zeichnung in das Element ein — bei einem hohen viewBox in einem
 *    breiten Element bleibt links und rechts Leerraum INNERHALB des Elements.
 *    Gemessen wird darum die GEZEICHNETE Breite:
 *        min(Elementbreite, Elementhoehe x viewBox-Seitenverhaeltnis)
 *
 * ── Lesehilfe ─────────────────────────────────────────────────────────────
 * In "normal" und "breit" stehen Szene und Diagramm NEBENEINANDER — dort sind
 * rund 38 %/60 % die gewollte Aufteilung und kein Befund. Aussagekraeftig ist
 * die Spalte "schmal", wo gestapelt wird: dort sollte jeder Teil den groessten
 * Teil der Spalte fuellen. Zum Vergleich (Stand 2026-08-31): die Wurf-Familie
 * erreicht dort 40 %/77 %, die Kreisbewegungs-Familie 34-47 %/38-54 %.
 */
import { browserUmgebung } from '../../_lib/browser.mjs';

// Chromium plattformunabhaengig aufloesen (macOS/Linux/Windows,
// voller Browser oder Headless-Shell) -- eine Quelle fuer alle
// Skill-Skripte, s. .claude/skills/_lib/browser.mjs.
let chromium, EXEC;
try { ({ chromium, executablePath: EXEC } = browserUmgebung()); }
catch (e) { console.error(e.message); process.exit(1); }


// Aufloesung wie in figur_screenshot.mjs: playwright-core liegt nicht im Repo
// (kein Paketmanager im Projekt, s. WIP/CLAUDE.md), sondern unter /tmp.

const args = process.argv.slice(2);
const opt = (name, vor) => {
    const t = args.find(a => a.startsWith(`--${name}=`));
    return t ? t.split('=').slice(1).join('=') : vor;
};
const base = opt('base', 'http://localhost:8765/');
const nurFigur = opt('fig', null);
const schwelle = Number(opt('schwelle', 35));


const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const fehler = [];
page.on('pageerror', e => fehler.push(e.message));

await page.goto(base, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(
    () => { const b = document.getElementById('app_loading'); return !b || b.hidden; },
    null, { timeout: 120000 }).catch(() => fehler.push('Ladeblende blieb stehen'));

const figuren = (await page.evaluate(() => [...document.querySelectorAll('.aspekt-figur[id]')]
    .map(f => ({ id: f.id, seite: f.closest('.chapter-page')?.dataset.pageId }))))
    .filter(f => f.seite && (!nurFigur || f.id === nurFigur));

if (!figuren.length) {
    console.error(nurFigur ? `Figur "${nurFigur}" nicht gefunden.` : 'Keine Aspekt-Figuren gefunden.');
    await browser.close();
    process.exit(1);
}

const messe = (figId) => page.evaluate((id) => {
    const f = document.getElementById(id);
    const mc = f && f.querySelector('.aspekt-main-content');
    if (!mc) return null;
    const verf = mc.getBoundingClientRect().width;
    if (verf < 2) return null;
    const teil = (sel) => {
        const e = f.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return null;
        const vb = (e.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
        const ratio = (vb.length === 4 && vb[3]) ? vb[2] / vb[3] : b.width / b.height;
        return Math.round(Math.min(b.width, b.height * ratio) / verf * 100);
    };
    return { verf: Math.round(verf), szene: teil('.aspekt-scene svg'), graph: teil('.aspekt-graph svg') };
}, figId);

const MODI = ['schmal', 'normal', 'breit'];
const befunde = [];
for (const { id, seite } of figuren) {
    await page.evaluate(s => { location.hash = '#' + s; }, seite);
    await page.waitForTimeout(260);
    const zeile = { id };
    for (const modus of MODI) {
        // Echter Umschalter, s. Falle 1 im Kopfkommentar.
        await page.evaluate(m => {
            const b = document.querySelector(`button[data-action="set_width_mode"][data-mode="${m}"]`);
            if (b) b.click();
        }, modus);
        await page.waitForTimeout(320);
        zeile[modus] = await messe(id);
    }
    befunde.push(zeile);
}
await browser.close();

const z = v => (v === null || v === undefined) ? ' — ' : String(v).padStart(3) + '%';
console.log('Anteil der GEZEICHNETEN Breite an der verfuegbaren Breite (Szene/Diagramm)\n');
console.log('Figur'.padEnd(34) + MODI.map(m => m.padEnd(16)).join(''));
for (const b of befunde) {
    const sp = m => b[m] ? `${z(b[m].szene)}/${z(b[m].graph)}` : '   —   ';
    console.log(b.id.padEnd(34) + MODI.map(m => sp(m).padEnd(16)).join(''));
}

// Gemeldet wird NUR die schmale Ansicht: dort ist gestapelt, dort ist ein
// kleiner Anteil ein echter Befund. In normal/breit ist die Aufteilung gewollt.
const auffaellig = [];
for (const b of befunde) {
    const v = b.schmal;
    if (!v) continue;
    for (const [name, wert] of [['Szene', v.szene], ['Diagramm', v.graph]]) {
        if (wert !== null && wert < schwelle) auffaellig.push(`  ${b.id} · ${name}: ${wert} %`);
    }
}
console.log(`\n--- schmale Ansicht unter ${schwelle} % gezeichneter Breite ---`);
console.log(auffaellig.length ? auffaellig.join('\n') : '  keine');
if (fehler.length) console.log('\nKonsolenfehler:\n  ' + fehler.slice(0, 5).join('\n  '));

console.log(`\nHinweis: ein kleiner Anteil ist nicht automatisch falsch — ein hochformatiger
Inhalt (Feder, senkrechter Fall) kann eine breite Spalte nicht fuellen, ohne
sehr hoch zu werden. Der Wert zeigt, WO hinzusehen ist, nicht was zu tun ist.`);
