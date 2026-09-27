// lib/tex-label.js — echter Formelsatz in SVG-Diagrammen (BACKLOG P28).
//
// setTexLabel(textEl, tex) setzt eine Beschriftung per MathJax, und zwar als
// PFADE DIREKT IM DIAGRAMM-SVG — kein foreignObject (WebKit-Bug 23113,
// Runbook-Fallstrick #17), kein tspan-Nachbau (Index, Vektorpfeil, Betrag …).
// Recherche, Messung und Plan: backlog/P28-formelsatz-in-diagrammen.md.
//
// Vertrag mit den Motoren: sie bauen ihr <text> wie bisher (x, y, text-anchor,
// dominant-baseline, transform/Rotation, class) und rufen setTexLabel statt
// textContent/setAxisLabel. Das <text> bleibt als ANKER im DOM (leer, traegt
// das aria-label); dahinter haengt eine <g class="tex-label <klassen>"> mit den
// MathJax-Pfaden. Die Farbe kommt aus den bestehenden Klassenregeln
// (.axis-label { fill: … }) ueber die Regel g.tex-label g { fill: inherit }.
//
// Warum das ohne Messen exakt sitzt: im MathJax-SVG liegt die GRUNDLINIE bei
// y = 0 des viewBox (1000 Einheiten = 1 em). Die <g> wird nur auf den
// Ankerpunkt geschoben; darin steckt das MathJax-<svg> mit Breite, Hoehe und
// Versatz in EM (Breite = viewBox[2]/1000 em) — kein getBBox, kein Layout.
// Die em loesen gegen die font-size der Klassenregel auf, und die haengt am
// Textgroessen-Regler (--paper-graphics-scale -> --kb-text-scale): das Label
// waechst also OHNE Neuzeichnen mit, wie ein <text>. Ein in die Transformation
// eingebackener Pixel-Massstab wuerde dabei stehen bleiben.
//
// Eigenes MathDocument mit fontCache 'none': keine IDs im Ergebnis (klon- und
// exportfest), und das Seitendokument (fontCache 'local', Gleichungs-
// nummerierung ueber tagformat) bleibt unberuehrt. Ergebnis je TeX-String im
// Cache, jede Nutzung ist ein cloneNode (gemessen 0,02 ms statt ~1 ms).
//
// Solange MathJax noch laedt (die Figuren bauen vor dem ersten Typeset, unter
// der Ladeblende), steht ein Klartext-Rueckfall im <text>; bei
// MathJax.startup.promise werden alle vorgemerkten Anker hochgestuft. Fehlt
// MathJax ganz, bleibt der Klartext stehen.
//
// Abhaengigkeitsfrei gehalten: geht 1:1 als shared/js/tex-label.js ins
// Sim-Repo (dort BACKLOG I18).

const SVGNS = 'http://www.w3.org/2000/svg';

// Feinabgleich der Formelgroesse gegen die Schriftgroesse der Klassenregel.
export const TEX_LABEL_SCALE = 1.0;
const em = (einheiten) => `${(einheiten / 1000 * TEX_LABEL_SCALE).toFixed(4)}em`;

const gruppe = new WeakMap();    // Anker-<text> -> eingehaengte <g>
const vorgemerkt = new Set();    // Anker, die auf MathJax warten
const cache = new Map();         // tex -> { nodes: Node[], vb: number[] }
let mjDoc = null;
let wartet = false;

export function setTexLabel(textEl, tex, { aria } = {}) {
    textEl.__tex = tex;
    textEl.setAttribute('aria-label', aria || texZuText(tex));
    entferneGruppe(textEl);
    if (!mathjaxBereit()) {
        textEl.textContent = texZuText(tex);
        vormerken(textEl);
        return;
    }
    textEl.textContent = '';
    // Noch nicht eingehaengt (Motor ruft setTexLabel vor appendChild):
    // Platzierung im Microtask — laeuft vor dem naechsten Zeichnen.
    if (textEl.isConnected) platziere(textEl);
    else queueMicrotask(() => wennVerbunden(textEl, tex, 0));
}

// Microtask reicht, wenn der Motor gleich im selben Durchgang appendChild
// ruft; baut er das SVG losgeloest und haengt es spaeter ein, noch ein paar
// Frames nachsehen.
function wennVerbunden(textEl, tex, frame) {
    if (textEl.__tex !== tex) return;           // inzwischen neu gesetzt
    if (textEl.isConnected) { platziere(textEl); return; }
    if (frame < 30) requestAnimationFrame(() => wennVerbunden(textEl, tex, frame + 1));
}

// ── Platzierung ──────────────────────────────────────────────────────────────

function platziere(textEl) {
    const tex = textEl.__tex;
    let satz;
    try { satz = setze(tex); }
    catch (err) {
        console.warn('tex-label: MathJax-Fehler bei', tex, err);
        textEl.textContent = texZuText(tex);
        return;
    }
    const cs = getComputedStyle(textEl);
    const [, vbY, vbW, vbH] = satz.vb;
    const anker = textEl.getAttribute('text-anchor') || cs.textAnchor;
    const basis = textEl.getAttribute('dominant-baseline') || cs.dominantBaseline;
    // Oberkante relativ zur Grundlinie: vbY (= -Oberlaenge). Bei middle/central
    // die sichtbare Box (viewBox) um y zentrieren statt auf die Grundlinie.
    const oben = (basis === 'middle' || basis === 'central') ? -vbH / 2 : vbY;
    const links = anker === 'middle' ? -vbW / 2 : anker === 'end' ? -vbW : 0;

    const x = parseFloat(textEl.getAttribute('x')) || 0;
    const y = parseFloat(textEl.getAttribute('y')) || 0;
    const tf = textEl.getAttribute('transform') || '';

    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', ('tex-label ' + (textEl.getAttribute('class') || '')).trim());
    g.setAttribute('aria-hidden', 'true');
    g.setAttribute('transform', `${tf} translate(${x} ${y})`.trim());
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('x', em(links));
    svg.setAttribute('y', em(oben));
    svg.setAttribute('width', em(vbW));
    svg.setAttribute('height', em(vbH));
    svg.setAttribute('viewBox', satz.vb.join(' '));
    svg.setAttribute('overflow', 'visible');
    for (const n of satz.nodes) svg.appendChild(n.cloneNode(true));
    g.appendChild(svg);
    textEl.after(g);
    gruppe.set(textEl, g);
}

function entferneGruppe(textEl) {
    const g = gruppe.get(textEl);
    if (g) { g.remove(); gruppe.delete(textEl); }
}

// ── MathJax ──────────────────────────────────────────────────────────────────

function mathjaxBereit() {
    const MJ = window.MathJax;
    return !!(MJ && MJ._ && MJ._.mathjax && MJ.startup && MJ.startup.output);
}

function setze(tex) {
    let satz = cache.get(tex);
    if (satz) return satz;
    const node = dokument().convert(tex, { display: false, em: 16, ex: 8 });
    const svg = node.querySelector ? node.querySelector('svg') : node;
    satz = {
        nodes: Array.from(svg.childNodes),
        vb: svg.getAttribute('viewBox').split(/\s+/).map(Number),
    };
    cache.set(tex, satz);
    return satz;
}

function dokument() {
    if (mjDoc) return mjDoc;
    const M = window.MathJax._;
    // Nur Pakete anfordern, die auch registriert sind (das Skript laedt
    // physics/color, eine Sim womoeglich nicht). Registerpfad in 3.2.x:
    // MathJax._.input.tex.Configuration.ConfigurationHandler.
    const CH = M.input.tex.Configuration.ConfigurationHandler;
    const verfuegbar = (name) => !!CH.get(name);
    const packages = ['base', 'ams', 'newcommand', 'noundefined', 'physics', 'color'].filter(verfuegbar);
    mjDoc = M.mathjax.mathjax.document(document, {
        InputJax: new M.input.tex_ts.TeX({ packages }),
        OutputJax: new M.output.svg_ts.SVG({ fontCache: 'none' }),
    });
    return mjDoc;
}

function vormerken(textEl) {
    vorgemerkt.add(textEl);
    if (wartet) return;
    const MJ = window.MathJax;
    const p = MJ && MJ.startup && MJ.startup.promise;
    if (!p) {
        // MathJax-Konfiguration steht, das Skript ist aber noch nicht da:
        // kurz nachsehen, bis startup.promise existiert (oder nie — CDN weg).
        wartet = true;
        let versuche = 0;
        const t = setInterval(() => {
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
                clearInterval(t); wartet = false; vormerken(vorgemerkt.values().next().value);
            } else if (++versuche > 300) { clearInterval(t); wartet = false; }
        }, 100);
        return;
    }
    wartet = true;
    p.then(() => {
        wartet = false;
        for (const a of vorgemerkt) {
            vorgemerkt.delete(a);
            if (a.isConnected && a.__tex != null) setTexLabel(a, a.__tex, { aria: a.getAttribute('aria-label') });
        }
    }).catch(() => { wartet = false; });
}

// ── Klartext (Rueckfall + aria-label) ────────────────────────────────────────

const GRIECHISCH = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', varepsilon: 'ε',
    epsilon: 'ε', eta: 'η', vartheta: 'ϑ', theta: 'θ', lambda: 'λ', mu: 'μ',
    pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', varphi: 'φ', phi: 'ϕ', omega: 'ω',
    Omega: 'Ω',
};

export function texZuText(tex) {
    return tex
        .replace(/\\(?:text|mathrm|mathit|mathbf|operatorname)\{([^{}]*)\}/g, '$1')
        .replace(/\\(?:vec|overrightarrow|hat|bar)\s*/g, '')
        .replace(/\\([A-Za-z]+)/g, (m, n) => GRIECHISCH[n] ?? (n === 'cdot' ? '·' : ''))
        .replace(/\\[,;:! ]/g, ' ')
        .replace(/[_^]\{([^{}]*)\}/g, '$1')
        .replace(/[_^]/g, '')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
