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
            const html = await hole_fragment(id);
            // Bevor MathJax die Gleichungs-Umgebungen konsumiert (s.u.), aus dem
            // ROHEN HTML-String die LaTeX-Quelle jeder \label-fuehrenden Gleichung
            // extrahieren — ohne das \label. Das ist die Vorlage fuer die Physik-
            // Sektion der Aspekt-Figuren (main.js::fill_physik_panels), die die
            // relevante Formel UNNUMMERIERT (als \[...\]) neu rendert. Hier am
            // String arbeiten (vor der Injektion), weil MathJax nach dem Typeset
            // die LaTeX-Quelle durch den gerenderten mjx-container ersetzt.
            captureEqLatex(html);
            mount.innerHTML = html;
            markiere_bilder_lazy(mount);
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
            // Endgueltig gescheitert: NICHT still weiterlaufen. Vor dieser
            // Aenderung blieb nur ein console.warn -- die Seite sah vollstaendig
            // aus, nur ohne dieses Kapitel, und niemand bemerkte es. Bei 17
            // Fragmenten unwahrscheinlich, im Zielbild mit 15+ Kapiteln nicht
            // mehr (BACKLOG P23-3).
            console.error(`[chapters] Kapitel ${id} konnte nicht geladen werden:`, err);
            zeige_kapitel_fehler(mount, id, err);
        }
    }));
}

// Netzwerkfehler sind beim Laden von 17 Fragmenten ueber ein CDN normal --
// bei der Live-Pruefung von v1.41.0 kam ein einzelner 503 von GitHub Pages.
// Deshalb bis zu VERSUCHE Anlaeufe mit wachsender Wartezeit.
// NICHT wiederholt wird bei einer dauerhaften Antwort (404/410 -- das Fragment
// gibt es schlicht nicht, ein zweiter Versuch aendert daran nichts); wiederholt
// wird bei Netzwerkabbruch und bei 5xx/408/429, also allem, was voruebergehend
// sein kann.
const VERSUCHE = 3;
const WARTE_MS = 400;          // 400 ms, dann 800 ms

function dauerhaft(status) {
    return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

async function hole_fragment(id) {
    let letzter;
    for (let versuch = 1; versuch <= VERSUCHE; versuch++) {
        try {
            const resp = await fetch(`chapters/${id}.html`);
            if (resp.ok) return await resp.text();
            letzter = new Error(`HTTP ${resp.status}`);
            if (dauerhaft(resp.status)) break;
        } catch (err) {
            letzter = err;               // Netzwerkabbruch -- wiederholen
        }
        if (versuch < VERSUCHE) {
            console.warn(`[chapters] ${id}: Versuch ${versuch} fehlgeschlagen (${letzter.message}), neuer Versuch …`);
            await new Promise(r => setTimeout(r, WARTE_MS * versuch));
        }
    }
    throw letzter;
}

// Sichtbarer Platzhalter statt einer stillen Luecke. Bewusst schlicht und ohne
// eigene Klasse aus styles.css: der Fall soll nicht huebsch sein, sondern
// auffallen -- und er darf nicht davon abhaengen, dass ein Stylesheet geladen
// hat. Die Ueberschrift traegt KEINE .inhaltsverzeichnis-Klasse, damit
// paginate() daraus keine Kapitelseite baut und die Nummerierung unberuehrt
// bleibt.
function zeige_kapitel_fehler(mount, id, err) {
    const box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'border:2px solid #b00; padding:1rem; margin:1rem 0; ' +
                        'background:#fff4f4; color:#600;';
    const t = document.createElement('strong');
    t.textContent = 'Dieses Kapitel konnte nicht geladen werden.';
    const p2 = document.createElement('p');
    p2.style.margin = '0.5rem 0 0';
    p2.textContent = `chapters/${id}.html — ${err && err.message ? err.message : 'unbekannter Fehler'}. `
                   + 'Bitte die Seite neu laden. Bleibt der Fehler, fehlt die Datei auf dem Server.';
    box.appendChild(t);
    box.appendChild(p2);
    // An die Stelle des Platzhalters, damit der Hinweis dort steht, wo das
    // Kapitel hingehoert. mount bleibt hier stehen (kein Flatten) -- er traegt
    // kein .inhaltsverzeichnis, stoert die Paginierung also nicht.
    mount.appendChild(box);
}

// Kapitelbilder erst laden, wenn sie gebraucht werden (BACKLOG P22-1).
// Die Paginierung zeigt immer nur EINE Seite; die uebrigen stehen auf
// display:none — das verhindert das Laden aber nicht. Ohne loading="lazy" holt
// der Start daher alle Bilder des Skripts: an der veroeffentlichten Fassung
// gemessen 38,9 MB in 205 Anfragen. Mit lazy laedt der Browser nur, was im
// Viewport steht (also die aktive Seite), den Rest beim Blaettern.
// Zentral hier statt als Attribut in 127 <img>-Tags: so gilt es fuer jedes
// kuenftige Kapitel automatisch (O(1)-Regel). decoding="async" nimmt das
// Dekodieren zusaetzlich vom Hauptthread.
// AUSNAHME Druck: print.js schaltet die Bilder des Klons vor dem Drucken wieder
// auf eager — sonst blieben nie sichtbare Seiten im Ausdruck leer.
function markiere_bilder_lazy(wurzel) {
    wurzel.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
    });
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
// Liefert ein Promise, das erfuellt, wenn der Startlauf durch ist (auch wenn er
// scheitert -- s. catch). main.js haengt daran die Ladeblende (BACKLOG P23-1);
// ohne Rueckgabewert bliebe sie bis zum Notaus-Timer stehen.
// startlauf: was gesetzt werden soll, sobald MathJax bereit ist. Ohne Angabe
// das ganze Dokument (reload_mathjax) -- so laeuft der Druck-Tab. Im normalen
// Lesebetrieb reicht die aktive Seite (main.js, BACKLOG P22-3c); chapters.js
// bleibt dafuer bewusst dumm und kennt weiterhin nur core.js.
export function typesetAfterLoad(startlauf) {
    return new Promise(fertig => {
        (function waitForMathJax() {
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
                window.MathJax.startup.promise
                    .then(startlauf || reload_mathjax)
                    .then(() => { if (window.resolve_eq_refs) window.resolve_eq_refs(); })
                    .then(() => { if (window.fill_physik_panels) window.fill_physik_panels(); })
                    // Ein Fehler im Typeset darf den Aufrufer nicht haengen
                    // lassen: melden und trotzdem erfuellen -- die Seite ist dann
                    // zwar unvollstaendig gesetzt, aber lesbar.
                    .catch(err => console.warn("[chapters] Typeset-Startlauf fehlgeschlagen:", err))
                    .then(fertig);
            } else {
                setTimeout(waitForMathJax, 200);
            }
        })();
    });
}