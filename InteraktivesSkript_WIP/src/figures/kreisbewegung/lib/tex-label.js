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
const beobachtet = new WeakSet(); // Anker mit Sichtbarkeits-Spiegel
const vorgemerkt = new Set();    // Anker, die auf MathJax warten
const cache = new Map();         // tex -> { nodes: Node[], vb: number[] }
// Obergrenze: Wert-Labels („Δt = 1,23“) erzeugen beim Ziehen laufend neue
// Strings. Map haelt die Einfuegereihenfolge, also fliegt der aelteste raus.
const CACHE_MAX = 400;
let mjDoc = null;
let wartet = false;

export function setTexLabel(textEl, tex, { aria } = {}) {
    // Gleicher Inhalt, Gruppe steht schon: nur neu ausrichten (Motoren setzen
    // viele Labels in jedem Frame neu, meist unveraendert).
    const alt = gruppe.get(textEl);
    if (alt && textEl.__tex === tex && alt.isConnected) {
        if (aria) textEl.setAttribute('aria-label', aria);
        richteAus(textEl, alt, alt.__vb);
        return;
    }
    textEl.__tex = tex;
    entferneGruppe(textEl);
    // Leerer Inhalt = Label aus (z. B. Titel im Zwei-Diagramm-Modus).
    if (!tex) { textEl.textContent = ''; textEl.removeAttribute('aria-label'); vorgemerkt.delete(textEl); return; }
    textEl.setAttribute('aria-label', aria || texZuText(tex));
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
    try { satz = satzFuer(tex); }
    catch (err) {
        console.warn('tex-label: MathJax-Fehler bei', tex, err);
        textEl.textContent = texZuText(tex);
        return;
    }
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('aria-hidden', 'true');
    // Figuren-Stile adressieren Labels oft ueber die ID-Endung
    // ([id$="phi_label"] { fill: var(--kb-phi) }). Mit „tex_“ + Anker-ID
    // greifen dieselben Regeln auf die <g> — eindeutig, und der Anker
    // bleibt das erste Element mit dieser Endung (querySelector findet ihn).
    if (textEl.id) g.id = 'tex_' + textEl.id;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', em(satz.vb[2]));
    svg.setAttribute('height', em(satz.vb[3]));
    svg.setAttribute('viewBox', satz.vb.join(' '));
    svg.setAttribute('overflow', 'visible');
    for (const n of satz.nodes) svg.appendChild(n.cloneNode(true));
    g.appendChild(svg);
    g.__vb = satz.vb;
    richteAus(textEl, g, satz.vb);
    textEl.after(g);
    gruppe.set(textEl, g);
    spiegle(textEl);
    beobachte(textEl);
}

// Lage der Gruppe aus dem Anker: Position/Rotation als Transformation in
// Nutzereinheiten, Anker und Grundlinie als em-Versatz des inneren <svg>.
function richteAus(textEl, g, vb) {
    const [, vbY, vbW, vbH] = vb;
    const anker = textEl.getAttribute('text-anchor') || ausCss(textEl).anker;
    const basis = textEl.getAttribute('dominant-baseline') || ausCss(textEl).basis;
    // Oberkante relativ zur Grundlinie: vbY (= -Oberlaenge). Bei middle/central
    // die sichtbare Box (viewBox) um y zentrieren statt auf die Grundlinie.
    const oben = (basis === 'middle' || basis === 'central') ? -vbH / 2 : vbY;
    const links = anker === 'middle' ? -vbW / 2 : anker === 'end' ? -vbW : 0;
    const x = parseFloat(textEl.getAttribute('x')) || 0;
    const y = parseFloat(textEl.getAttribute('y')) || 0;
    const tf = textEl.getAttribute('transform') || '';
    g.setAttribute('transform', `${tf} translate(${x} ${y})`.trim());
    const svg = g.firstChild;
    svg.setAttribute('x', em(links));
    svg.setAttribute('y', em(oben));
}

// text-anchor/dominant-baseline aus einer Klassenregel: getComputedStyle
// erzwingt eine Stil-Neuberechnung, beim Ziehen also einmal je Label und
// Schritt. Deshalb nur, wenn das Attribut fehlt, und je Anker gemerkt.
const cssWerte = new WeakMap();
function ausCss(textEl) {
    let w = cssWerte.get(textEl);
    if (!w) {
        const cs = getComputedStyle(textEl);
        w = { anker: cs.textAnchor, basis: cs.dominantBaseline, aus: cs.display === 'none' };
        cssWerte.set(textEl, w);
    }
    return w;
}

// Die Motoren blenden Labels ueber das ANKER-<text> ein und aus
// (style.visibility/display, Klassen) und setzen mitunter Groesse oder Farbe
// als Attribut statt ueber eine Klasse. Die <g> daneben folgt dem hier, damit
// kein Motor davon wissen muss.
const GESPIEGELT = ['display', 'visibility', 'font-size', 'fill'];
function spiegle(textEl) {
    const g = gruppe.get(textEl);
    if (!g) return;
    g.setAttribute('class', ('tex-label ' + (textEl.getAttribute('class') || '')).trim());
    g.style.visibility = textEl.style.visibility;
    // display:none kann auch aus einer Stilregel auf die ANKER-ID kommen
    // ([id$="…_label"] { display: none }) — die trifft die <g> ohne ID nicht.
    g.style.display = ausCss(textEl).aus ? 'none' : textEl.style.display;
    for (const a of GESPIEGELT) {
        const w = textEl.getAttribute(a);
        if (w) g.setAttribute(a, w); else g.removeAttribute(a);
    }
}

// Lage-Attribute: viele Motoren verschieben ein Label je Frame nur ueber x/y
// (φ am Drehwinkel), ohne setTexLabel erneut zu rufen — die <g> zieht mit.
const LAGE = ['x', 'y', 'transform', 'text-anchor', 'dominant-baseline'];

function beobachte(textEl) {
    if (beobachtet.has(textEl)) return;
    beobachtet.add(textEl);
    new MutationObserver((eintraege) => {
        const g = gruppe.get(textEl);
        if (!g) return;
        // Stil nur bei Stil-Aenderungen neu lesen: x/y aendern sich je Frame,
        // ein getComputedStyle dort hiesse eine Stil-Neuberechnung je Frame.
        if (eintraege.some(e => !LAGE.includes(e.attributeName))) {
            cssWerte.delete(textEl);
            spiegle(textEl);
        }
        richteAus(textEl, g, g.__vb);
    }).observe(textEl, { attributes: true, attributeFilter: ['style', 'class', ...GESPIEGELT, ...LAGE] });
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

// Zahlen in Wert-Labels („Δt = 1,23“) aendern sich bei jedem Reglerschritt.
// Jeder neue String hiesse eine volle MathJax-Umwandlung (gemessen ~6 ms je
// Schritt bei drei Labels statt 0,6 ms vorher). texZahl() markiert die Zahl
// deshalb; hier wird nur der feste Teil umgewandelt (einmal, dann Cache), die
// Zahl wird aus einzeln gecachten Glyphen (0-9, Komma, Minus) nebeneinander
// gesetzt. Das ist in TeX dasselbe: Ziffern sind gewoehnliche Zeichen ohne
// Abstand dazwischen. Die leeren {} an den Fugen halten die Abstaende um
// Relationen/Operatoren so, wie sie im Ganzen waeren („m = {}“).
const Z_AUF = '\u0001', Z_ZU = '\u0002';

function satzFuer(tex) {
    if (!tex.includes(Z_AUF)) return setze(tex);
    const teile = [];
    for (const [i, stueck] of tex.split(new RegExp(`[${Z_AUF}${Z_ZU}]`)).entries()) {
        if (i % 2 === 0) { if (stueck) teile.push(setze(`{}${stueck}{}`)); continue; }
        for (const z of stueck.replace(/\{,\}/g, ',')) teile.push(setze(z === '-' ? '{-}' : `{${z}}`));
    }
    let x = 0, oben = 0, unten = 0;
    const nodes = [];
    for (const t of teile) {
        const [, vbY, vbW, vbH] = t.vb;
        const g = document.createElementNS(SVGNS, 'g');
        g.setAttribute('transform', `translate(${x} 0)`);
        for (const n of t.nodes) g.appendChild(n.cloneNode(true));
        nodes.push(g);
        x += vbW; oben = Math.min(oben, vbY); unten = Math.max(unten, vbY + vbH);
    }
    return { nodes, vb: [0, oben, x, unten - oben] };
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
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
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

// Zahl aus fmt() (Dezimalkomma) fuer TeX: {,} verhindert den Abstand, den TeX
// nach einem Komma im Mathe-Modus setzt; der Gedankenstrich fuer „kein Wert“
// wird Text.
export function texZahl(s) {
    s = String(s);
    if (!/^-?[0-9]+(,[0-9]+)?$/.test(s)) return s.replace(/—/g, '\\text{—}');
    return Z_AUF + s.replace(/,/g, '{,}') + Z_ZU;
}

// Einheit aus einem TeX-Achsenlabel („…\,/\,(\mathrm{m/s^2})“) als Klartext
// fuer Hover-Tooltips, die Text bleiben: „m/s²“ (ohne die Klammern, die nur
// im Achsenlabel stehen — hinter einer Zahl hiesse es „1,23 m/s“). Ohne Trenner: ''.
export function texEinheit(tex) {
    const i = tex.lastIndexOf('\\,/\\,');
    if (i < 0) return '';
    return tex.slice(i + 5).replace(/\\mathrm\{([^}]*)\}/g, '$1').replace(/\^2/g, '²')
        .replace(/^\((.*)\)$/, '$1');
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
        .replace(/[\u0001\u0002]/g, '')
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
