#!/usr/bin/env node
// caption_farbwort_check.mjs — strukturelle Wächter für die palette-aware
// Farb-Nennungen in interaktiven Aspekt-Figuren-Captions (v1.25.3+).
//
// Die Einfärbung (.kb-sw-<tok> via var(--kb-*)) ist deklarativ und eine Quelle
// der Wahrheit. Die Farb-Nennung dagegen ist eine handgepflegte Wortmap
// (FARBWORT in aspekt_kreisbahn.js) — zwei stille Fehlerquellen, die dieser
// Test ans Licht zwingt, ohne die manuelle Wortwahl aufzugeben:
//
//   (a) Jedes in einer data-caption vorkommende data-vec="<tok>" hat einen
//       FARBWORT-Eintrag in ALLEN 6 Kombinationen (palette × hell/dunkel).
//       Fehlt der Eintrag, uebergeht apply_farbwoerter das Span per
//       `if (!w) return` STILLSCHWEIGEND -> das Wort folgt der Palette nicht.
//   (b) Pro Caption (d.h. pro Menge koexistierender Token) bekommt in KEINER
//       der 6 Kombinationen ein Token-Paar dasselbe Wort -> keine mehrdeutige
//       Caption (z. B. „ω (Blau), a_ZP (Blau)" in 1.58). Helligkeits-Qualifier
//       sind die Disambiguierung; dieser Test prueft, dass sie vorhanden sind.
//   (c) Jedes benutzte Token hat eine .kb-sw-<tok>-Klasse in
//       aspekt_kreisbahn.css -> die Einfärbung des Worts ist intakt.
//
// Aufruf:  node .claude/skills/interaktive-aspekt-figur/scripts/caption_farbwort_check.mjs
// Exit: 0 = ok, 1 = mindestens ein Wächter verletzt.

import fs from 'fs';
import path from 'path';
import url from 'url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');            // Repo-Wurzel
const WIP  = path.join(ROOT, 'InteraktivesSkript_WIP');
const CHAPTERS_DIR = path.join(WIP, 'chapters');
const CSS_PATH  = path.join(WIP, 'src/figures/aspekt_kreisbahn.css');
const MOD_PATH  = path.join(WIP, 'src/figures/aspekt_kreisbahn.js');

// ── jsdom-Bootstrap (core.js greift am Modulkopf auf `document` zu) ────────
const JSDOM_PATH = process.env.JSDOM_PREFIX || '/tmp/node_modules';
const { JSDOM } = await import(JSDOM_PATH + '/jsdom/lib/api.js');
const dom = new JSDOM('<!doctype html><html><body></body></html>',
    { url: 'http://localhost:8000/', pretendToBeVisual: true });
const { window } = dom;
window.CSS = { escape: s => String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&') };
Object.assign(global, {
    window, document: window.document, CustomEvent: window.CustomEvent,
    Node: window.Node, HTMLElement: window.HTMLElement,
    getComputedStyle: window.getComputedStyle, location: window.location,
    history: window.history, requestAnimationFrame: () => 0,
});

const { FARBWORT } = await import(MOD_PATH);
const PALETTES = Object.keys(FARBWORT);                     // ['normal','deuter','tritan']
const DARKS = [0, 1];

// ── Benutzte Token pro Caption aus allen Kapiteln sammeln ──────────────────
// data-caption="…data-vec=&quot;tok&quot;…"  (Quotes HTML-escaped im Attribut).
const captionTokenSets = [];                                 // {file, fig, toks:Set}
for (const fn of fs.readdirSync(CHAPTERS_DIR).filter(f => f.endsWith('.html'))) {
    const text = fs.readFileSync(path.join(CHAPTERS_DIR, fn), 'utf8');
    const capRe = /<div[^>]*\bdata-aspekt="[^"]*"[^>]*\bdata-caption="([^"]*)"/g;
    let m;
    while ((m = capRe.exec(text)) !== null) {
        const cap = m[1];
        const toks = new Set();
        const vecRe = /data-vec=&quot;([a-z]+)&quot;/g;
        let v;
        while ((v = vecRe.exec(cap)) !== null) toks.add(v[1]);
        if (toks.size) {
            const figM = /<div[^>]*\bid="(aspekt-[^"]+)"/.exec(m[0]);
            captionTokenSets.push({ file: fn, fig: figM ? figM[1] : '?', toks });
        }
    }
}

// ── Vorhandene .kb-sw-<tok>-Klassen aus der CSS ────────────────────────────
const css = fs.readFileSync(CSS_PATH, 'utf8');
const swatchClasses = new Set();
for (const m of css.matchAll(/\.kb-sw-([a-z]+)/g)) swatchClasses.add(m[1]);

let fails = 0;
const fail = (msg) => { console.log('  FEHLER  ' + msg); fails++; };
const ok = (msg) => { console.log('  OK      ' + msg); };

console.log('Benutzte Farbwort-Token (pro Caption):');
const allToks = new Set();
for (const c of captionTokenSets) {
    console.log(`  ${c.file}: ${c.fig} -> { ${[...c.toks].join(', ')} }`);
    c.toks.forEach(t => allToks.add(t));
}

// ── (a) jedes benutzte Token hat FARBWORT-Eintraege in allen 6 Kombinationen
console.log('\n(a) FARBWORT-Eintrag je Token × (palette × hell/dunkel):');
for (const tok of allToks) {
    const missing = [];
    for (const pal of PALETTES) for (const dark of DARKS) {
        const w = FARBWORT[pal] && FARBWORT[pal][dark] && FARBWORT[pal][dark][tok];
        if (!w) missing.push(`${pal}/${dark}`);
    }
    if (missing.length) fail(`Token "${tok}" fehlt in FARBWORT: ${missing.join(', ')}`);
    else ok(`Token "${tok}" hat Worte in allen ${PALETTES.length * DARKS.length} Kombinationen`);
}

// ── (c) jedes benutzte Token hat eine .kb-sw-<tok>-CSS-Klasse ──────────────
console.log('\n(c) .kb-sw-<tok>-Klasse in aspekt_kreisbahn.css:');
for (const tok of allToks) {
    if (swatchClasses.has(tok)) ok(`.kb-sw-${tok} vorhanden`);
    else fail(`.kb-sw-${tok} FEHLT -> Einfärbung des Worts kaputt`);
}

// ── (b) pro Caption: in keiner Kombination zwei Token mit gleichem Wort ────
console.log('\n(b) Disambiguierung pro Caption (kein Wort-Doppel pro Kombination):');
for (const c of captionTokenSets) {
    let capFails = 0;
    const collisions = [];
    for (const pal of PALETTES) for (const dark of DARKS) {
        const byWord = new Map();                            // wort -> [tok,...]
        for (const tok of c.toks) {
            const w = FARBWORT[pal][dark][tok];
            if (!w) continue;                                // (a) meldet das schon
            if (!byWord.has(w)) byWord.set(w, []);
            byWord.get(w).push(tok);
        }
        for (const [w, toks] of byWord) {
            if (toks.length > 1) collisions.push(`${pal}/${dark}: "${w}" = {${toks.join(',')}}`);
        }
    }
    if (collisions.length) {
        fail(`${c.file} ${c.fig}: Wort-Doppel ->\n      ` + collisions.join('\n      '));
    } else {
        ok(`${c.file} ${c.fig}: ${c.toks.size} Token in allen Kombinationen eindeutig`);
    }
}

console.log('');
if (fails) { console.log(`${fails} WÄCHTER VERLETZT.`); process.exit(1); }
console.log('OK: alle Farbwort-Token sind vollstaendig abgedeckt + eindeutig + eingefaerbt.');
process.exit(0);