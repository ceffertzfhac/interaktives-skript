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
            mount.innerHTML = html;
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

// Re-Typeset der per fetch injizierten Formeln. MathJax laedt asynchron; sein
// Auto-Typeset beim Laden kann je nach Timing vor oder nach der Injektion
// laufen. Diese Gate spiegelt numbering.js' waitForMathJax-Poll: erst warten,
// bis MathJax.startup.promise verfuegbar ist, dann reload_mathjax()
// (typesetPromise + renumber_equations) -- egal wann MathJax fertig wird.
export function typesetAfterLoad() {
    (function waitForMathJax() {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise.then(reload_mathjax);
        } else {
            setTimeout(waitForMathJax, 200);
        }
    })();
}