#!/usr/bin/env node
/**
 * Kapitel-Fragment offline mit MathJax setzen: TeX-Fehler, Tag-Nummern pro
 * Unterabschnitt, unaufgeloeste Referenzen.
 *
 *   npm install --prefix /tmp mathjax-full
 *   node mathjax_pruefen.cjs chapters/ch_01_kreisbewegungen.html [praefix]
 *
 * Die Ausgabe wird gegen referenznummern.py gestellt: Anzahl UND Spanne
 * muessen pro Unterabschnitt uebereinstimmen -- nur so faellt ein Offset auf,
 * der sich durch das restliche Kapitel zieht.
 *
 * GRENZE: laeuft mit AllPackages und sieht daher Konfigurationsfehler der
 * echten Seite NICHT (z. B. tagformat per loader geladen, aber nicht in
 * tex.packages aktiviert -> im Browser erscheint "(1)" statt "(1.4.1)").
 * Tag-Format immer zusaetzlich im Browser pruefen.
 */
const fs = require('fs');
const path = process.env.MJ_PREFIX || '/tmp/node_modules';
const { mathjax } = require(path + '/mathjax-full/js/mathjax.js');
const { TeX } = require(path + '/mathjax-full/js/input/tex.js');
const { SVG } = require(path + '/mathjax-full/js/output/svg.js');
const { liteAdaptor } = require(path + '/mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require(path + '/mathjax-full/js/handlers/html.js');
const { AllPackages } = require(path + '/mathjax-full/js/input/tex/AllPackages.js');
const { SerializedMmlVisitor } = require(path + '/mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js');

const file = process.argv[2];
const prefix = process.argv[3] || '1.4';
if (!file) { console.error('Aufruf: node mathjax_pruefen.cjs <kapitel.html> [praefix]'); process.exit(1); }

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const visitor = new SerializedMmlVisitor();

function neuesTeX() {
    return new TeX({
        packages: AllPackages, tags: 'ams',
        inlineMath: [['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEnvironments: true, processRefs: true,
        tagformat: { number: (n) => prefix + '.' + n, tag: (t) => '(' + t + ')', id: (id) => 'eq-' + id },
    });
}

function setzen(html) {
    const doc = mathjax.document('<html><body>' + html + '</body></html>',
        { InputJax: neuesTeX(), OutputJax: new SVG() });
    doc.render();
    const tags = [];
    let anzahl = 0;
    for (const item of doc.math) {
        anzahl++;
        const mml = visitor.visitTree(item.root);
        for (const m of mml.matchAll(/<mtd[^>]*>\s*<mtext[^>]*>\(([^)<]*)\)<\/mtext>/g)) tags.push(m[1]);
    }
    const out = adaptor.outerHTML(adaptor.body(doc.document));
    return { tags, anzahl, fehler: out.match(/data-mjx-error="[^"]*"/g) || [], roh: out };
}

const quelle = fs.readFileSync(file, 'utf8');

// Gesamtlauf: Fehler und unaufgeloeste Referenzen
const gesamt = setzen(quelle);
console.log('Math-Ausdruecke gesamt :', gesamt.anzahl);
console.log('TeX-Fehler             :', gesamt.fehler.length);
[...new Set(gesamt.fehler)].slice(0, 15).forEach((f) => console.log('   ', f));
console.log('Unaufgeloeste Refs "??":', (gesamt.roh.match(/\?\?/g) || []).length);

// Pro Unterabschnitt: Tags zaehlen (jeder Abschnitt eigener Zaehler, danach kumuliert)
console.log('\n=== Nummerierte Gleichungen pro Unterabschnitt ===');
let summe = 0;
for (const teil of quelle.split(/(?=<h3)/)) {
    const t = /<h3[^>]*>([^<]*)</.exec(teil);
    const name = t ? t[1].trim() : '(Intro)';
    const n = setzen(teil).tags.length;
    console.log('  %s %s Gl. %s', name.slice(0, 52).padEnd(54), String(n).padStart(3),
        n ? '(' + (summe + 1) + '-' + (summe + n) + ')' : '');
    summe += n;
}
console.log('  SUMME:', summe);

// Labels ohne Ziel / Ziele ohne Label
const labels = new Set([...quelle.matchAll(/\\label\{([^}]*)\}/g)].map((m) => m[1]));
const refs = [...quelle.matchAll(/data-ref-eq="([^"]*)"|\\ref\{([^}]*)\}/g)].map((m) => m[1] || m[2]);
const ohne = refs.filter((r) => !labels.has(r));
console.log('\nLabels:', labels.size, '| Verweise:', refs.length,
    '| Verweise ohne Label:', ohne.length ? [...new Set(ohne)] : 'keine');
