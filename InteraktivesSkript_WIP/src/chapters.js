// chapters.js — Kapitel-Loader (BACKLOG.md P1b). index.html enthaelt nur noch
// die Shell + ein <div data-chapter="...">-Platzhalter pro Kapitel in #paper;
// die Prosa selbst liegt als HTML-Fragment in chapters/ch_NN_*.html. Dieser
// Loader fetcht die Fragmente, injiziert sie und flacht sie auf, sodass die
// Fragment-Knoten zu direkten #paper-Children werden -- pages.js::paginate()
// arbeitet danach unveraendert (kein Eingriff in wrapHeading/foldStraySiblings).
//
// Auslieferung erfolgt ueber HTTPS (GitHub Pages); file://-Doppelklick
// funktioniert nicht (fetch blockiert dort), s. CLAUDE.md.
//
// Abhaengigkeiten: nur core.js::reload_mathjax (Re-Typeset der injizierten
// Formeln). Kein Import von pages/shell/numbering -> Graph bleibt azylisch.
import { reload_mathjax } from './core.js';

// Holt alle [data-chapter]-Platzhalter in #paper, fetcht das jeweilige
// Fragment, injiziert es und flacht auf (Kinder heben, Platzhalter-div
// entfernen). Per-Kapitel catch: ein fehlendes Fragment legt die App nicht
// lahm, die anderen Kapitel laden weiter.
export async function loadChapters() {
    const mounts = Array.from(document.querySelectorAll('[data-chapter]'));
    await Promise.all(mounts.map(async (mount) => {
        const id = mount.dataset.chapter;
        try {
            const resp = await fetch(`chapters/${id}.html`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const html = await resp.text();
            // Bevor MathJax die Gleichungs-Umgebungen konsumiert (s.u.), aus dem
            // ROHEN HTML-String die LaTeX-Quelle jeder \label-fuehrenden Gleichung
            // extrahieren — ohne das \label. Das ist die Vorlage fuer die Physik-
            // Sektion der Aspekt-Figuren (main.js::fill_physik_panels), die die
            // relevante Formel UNNUMMERIERT (als \[...\]) neu rendert. Hier am
            // String arbeiten (vor der Injektion), weil MathJax nach dem Typeset
            // die LaTeX-Quelle durch den gerenderten mjx-container ersetzt.
            captureEqLatex(html);
            mount.innerHTML = html;
            // Themenkomplex (v0.13-\chapter, 3-stufiges TOC, s. BACKLOG P8)
            // auf jede .inhaltsverzeichnis-Überschrift des Fragments stempeln,
            // GELESEN vom data-chapter-Platzhalter (data-tk-num/-title). Vor dem
            // Flatten nötig, weil der Platzhalter danach geloescht und nicht
            // mehr queryable ist; die dataset-Attribute wandern mit den
            // Überschrift-Knoten durch das Flatten und pages.js liest sie am
            // Heading wieder ab (-> page.tk). Seiten ohne TK-Attribut bleiben
            // tk=null (robust gegen kuenftige/themenkomplexlose Kapitel).
            const tkNum = mount.dataset.tkNum || '';
            const tkTitle = mount.dataset.tkTitle || '';
            if (tkNum || tkTitle) {
                mount.querySelectorAll('.inhaltsverzeichnis')
                    .forEach(h => { h.dataset.tkNum = tkNum; h.dataset.tkTitle = tkTitle; });
            }
            // Flatten: Kinder direkt unter den Parent des Platzhalters heben,
            // dann den Platzhalter entfernen. Damit sind die Fragment-Knoten
            // direkte #paper-Children -- exakt der Zustand, den paginate()
            // erwartet (s. Kommentar oben).
            const parent = mount.parentNode;
            while (mount.firstChild) parent.insertBefore(mount.firstChild, mount);
            parent.removeChild(mount);
        } catch (err) {
            console.warn(`[chapters] Laden von chapters/${id}.html fehlgeschlagen:`, err);
        }
    }));
}

// Extrahiert aus dem rohen Kapitel-HTML die LaTeX-Quelle jeder Gleichung mit
// \label{...} (equation/align, auch Sternvarianten) — das \label entfernt
// und gleich in eine UNNUMMERIERTE Display-Math-Form gebracht: equation ->
// \[...\], align -> \begin{align*}...\end{align*} (damit die &-Ausrichtung
// erhalten bleibt). Gespeichert unter window.eq_latex[label] = displayMath;
// gelesen von main.js::fill_physik_panels, das die Formel unverändert in die
// Physik-Sektion setzt. Nur am HTML-String lauffaehig (vor MathJax-Typeset).
window.eq_latex = window.eq_latex || {};
function captureEqLatex(html) {
    // HTML-Kommentare koennen dokumentarischen LaTeX-Text enthalten
    // (z. B. "\\begin{align}" in Hinweisen). Der Extractor darf diese
    // Marker NICHT als echte Umgebungen interpretieren.
    const source = html.replace(/<!--[\s\S]*?-->/g, '');
    const env = /\\begin\{(equation\*?|align\*?)\}([\s\S]*?)\\end\{\1\}/g;

    const decodeEntities = (s) => s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    let m;
    while ((m = env.exec(source)) !== null) {
        const envName = m[1].replace(/\*$/, '');
        const inner = decodeEntities(m[2].replace(/\\label\{[^}]+\}/, '')).trim();
        if (!inner) continue;
        const label = (m[2].match(/\\label\{([^}]+)\}/) || [])[1];
        if (!label) continue;
        window.eq_latex[label] = envName === 'align'
            ? '\\begin{align*}' + inner + '\\end{align*}'
            : '\\[' + inner + '\\]';
    }
}

// Re-Typeset der per fetch injizierten Formeln. MathJax laedt asynchron; sein
// Auto-Typeset beim Laden kann je nach Timing vor oder nach der Injektion
// laufen. Diese Gate spiegelt numbering.js' waitForMathJax-Poll: erst warten,
// bis MathJax.startup.promise verfuegbar ist, dann reload_mathjax()
// (typesetPromise + renumber_equations) -- egal wann MathJax fertig wird.
// Nach dem Typeset stehen die Formelnummern fest: window.resolve_eq_refs
// (numbering.js) traegt sie in die \ref-Anker ein, und window.fill_physik_panels
// (main.js) klonot die fuer die Aspekt-Figuren relevanten Formeln in deren
// rechte Seitenleiste -- bewusst ueber window statt per Import, chapters.js
// soll nur core.js kennen.
export function typesetAfterLoad() {
    (function waitForMathJax() {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise
                .then(reload_mathjax)
                .then(() => { if (window.resolve_eq_refs) window.resolve_eq_refs(); })
                .then(() => { if (window.fill_physik_panels) window.fill_physik_panels(); });
        } else {
            setTimeout(waitForMathJax, 200);
        }
    })();
}