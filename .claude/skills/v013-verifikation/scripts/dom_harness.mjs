#!/usr/bin/env node
/**
 * Das Skript ohne Browser aufbauen und die zur Laufzeit vergebenen Nummern,
 * die Pagination und die Fussnoten pruefen.
 *
 *   npm install --prefix /tmp jsdom
 *   node dom_harness.mjs [pfad/zu/InteraktivesSkript_WIP]
 *
 * Vorgehen: index.html laden, Skript-Tags entfernen (kein CDN, kein Netz),
 * die Kapitel-Fragmente wie chapters.js einhaengen und flachziehen, dann die
 * Module in derselben Reihenfolge wie main.js::init() aufrufen.
 *
 * GRENZE: kein Layout, keine Schriftmetrik, keine Farben, kein MathJax.
 * Kollisionen, Bildgroessen, Kontrastwirkung und Formelsatz sieht nur ein
 * Mensch im Browser.
 */
import fs from 'fs';
import path from 'path';

const JSDOM_PATH = process.env.JSDOM_PREFIX || '/tmp/node_modules';
const { JSDOM } = await import(JSDOM_PATH + '/jsdom/lib/api.js');

const base = path.resolve(process.argv[2] || 'InteraktivesSkript_WIP') + '/';
const html = fs.readFileSync(base + 'index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const dom = new JSDOM(html, { url: 'http://localhost:8000/', pretendToBeVisual: true });
const { window } = dom;

global.window = window;
global.document = window.document;
global.CustomEvent = window.CustomEvent;
global.Node = window.Node;
global.HTMLElement = window.HTMLElement;
global.getComputedStyle = window.getComputedStyle;
global.location = window.location;
global.requestAnimationFrame = () => 0;

// chapters.js-Aequivalent: Fragment einhaengen und in #paper flachziehen
for (const ph of document.querySelectorAll('#paper [data-chapter]')) {
    ph.innerHTML = fs.readFileSync(base + 'chapters/' + ph.dataset.chapter + '.html', 'utf8');
    while (ph.firstChild) ph.parentNode.insertBefore(ph.firstChild, ph);
    ph.remove();
}

const core = await import(base + 'src/core.js');
core.generate_highlight_boxes();
const pages = await import(base + 'src/pages.js');
pages.paginate();
let footnotes = null;
try {
    footnotes = await import(base + 'src/footnotes.js');
    footnotes.init_footnotes();
} catch { /* Modul optional */ }
const numbering = await import(base + 'src/numbering.js');
numbering.init_numbering();

const reg = pages.getPages();
console.log('=== Seiten (' + reg.length + ') ===');
reg.forEach((p, i) => console.log(`  ${String(i).padStart(2)} ${p.level.padEnd(3)} ${p.title.slice(0, 62)}`));

const stray = [...document.querySelectorAll('#paper > *')].filter((e) => !e.classList.contains('chapter-page'));
console.log('\nLose Kinder in #paper (ausser .chapter-pagenav):',
    stray.map((e) => e.tagName + '.' + e.className).filter((s) => !s.includes('chapter-pagenav')).join(', ') || 'keine');

const labels = [...document.querySelectorAll('.fig-label')].map((e) => e.textContent);
console.log('\n=== Abbildungen (' + labels.length + ') ===');
console.log('  ' + (labels.length ? labels[0] + ' bis ' + labels[labels.length - 1] : '-'));
const nums = labels.map((l) => parseInt(l.split('.').pop(), 10));
const luecken = nums.length ? nums.filter((n, i) => i && n !== nums[i - 1] + 1) : [];
console.log('  Luecken/Spruenge:', luecken.length ? luecken : 'keine');

console.log('\n=== Boxen ===');
const proTyp = {};
for (const t of document.querySelectorAll('.highlight_box_title')) {
    const typ = (t.querySelector('.hb-type') || t).textContent.trim();
    const [art, nummer] = [typ.split(' ')[0], typ.split(' ')[1] || '-'];
    (proTyp[art] = proTyp[art] || []).push(nummer);
}
for (const [art, liste] of Object.entries(proTyp)) {
    console.log(`  ${art.padEnd(18)} ${liste[0]} bis ${liste[liste.length - 1]}  (${liste.length})`);
}

if (footnotes) {
    const marker = document.querySelectorAll('.fn-marker');
    console.log('\n=== Fussnoten ===');
    console.log('  Marker:', marker.length, '| Panels:', document.querySelectorAll('.fussnote-panel').length,
        '| nicht umgewandelt:', document.querySelectorAll('span.fussnote').length);
    if (marker.length) {
        const b = marker[0];
        footnotes.toggle_footnote(b);
        const item = document.getElementById(b.getAttribute('aria-controls'));
        const auf = item.classList.contains('open') && !item.parentElement.hidden;
        footnotes.toggle_footnote(b);
        const zu = item.parentElement.hidden;
        console.log('  Aufklappen:', auf ? 'ok' : 'FEHLER', '| Zuklappen:', zu ? 'ok' : 'FEHLER');
    }
}

const xref = [...document.querySelectorAll('a.xref')];
console.log('\n=== Querverweise (' + xref.length + ') ===');
for (const attr of ['data-ref-fig', 'data-ref-sec', 'data-ref-eq']) {
    const alle = xref.filter((a) => a.hasAttribute(attr));
    const gesetzt = alle.filter((a) => a.hasAttribute('href'));
    const hinweis = attr === 'data-ref-eq' ? '   (erst im Browser, braucht MathJax)' : '';
    console.log(`  ${attr.padEnd(14)} ${String(alle.length).padStart(2)} gesamt, ${String(gesetzt.length).padStart(2)} aufgeloest${hinweis}`);
    alle.filter((a) => !a.hasAttribute('href') && attr !== 'data-ref-eq')
        .forEach((a) => console.log('     OHNE ZIEL:', a.getAttribute(attr)));
}
