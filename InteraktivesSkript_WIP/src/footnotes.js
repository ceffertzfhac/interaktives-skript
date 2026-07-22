// footnotes.js — Fussnoten als aufklappbare Info-Marker.
//
// Quelle sind die v0.13-\footnote-Stellen, die als <span class="fussnote">
// mitten im Fliesstext stehen. Ausgeschrieben unterbrechen sie den Satz; hier
// bleibt an der Stelle nur ein kleines (i) in Fliesstextgroesse stehen, das
// den Text bei Klick unterhalb des Absatzes aufklappt.
//
// Die Umwandlung passiert im JS und nicht im Kapitel-Markup: so gilt sie
// automatisch fuer jedes kuenftige Kapitel, das schlicht <span class="fussnote">
// schreibt (O(1) fuer neue Kapitel, s. CLAUDE.md).
//
// Reihenfolge in main.js: nach loadChapters()/paginate(), damit die Absaetze
// stehen; vor dem MathJax-Typeset ist unkritisch, weil nur verschoben und
// nicht umgeschrieben wird (die Formeln in der Fussnote bleiben erhalten).

let counter = 0;

// Block, unter dem die Fussnote aufklappt: der naechste Absatz bzw. das
// naechste Listenelement. Innerhalb einer Highlight-Box bleibt sie in der Box.
function blockFor(el) {
    return el.closest('p, li, figcaption, td, th') || el.parentElement;
}

function makeToggle(id, num) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fn-marker';
    btn.dataset.action = 'toggle_footnote';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.setAttribute('aria-label', 'Fussnote ' + num + ' anzeigen');
    btn.title = 'Fussnote ' + num;
    btn.textContent = 'i';
    return btn;
}

export function init_footnotes() {
    document.querySelectorAll('#paper span.fussnote').forEach(note => {
        if (note.dataset.fnDone) return;
        note.dataset.fnDone = '1';
        counter += 1;
        const id = 'fn-' + counter;

        const block = blockFor(note);
        if (!block) return;

        // Panel unter dem Block; mehrere Fussnoten desselben Blocks sammeln
        // sich in einem gemeinsamen Panel, damit nicht mehrere Kaesten
        // untereinander stehen.
        let panel = block.nextElementSibling;
        if (!panel || !panel.classList || !panel.classList.contains('fussnote-panel')) {
            panel = document.createElement('div');
            panel.className = 'fussnote-panel';
            panel.hidden = true;
            block.insertAdjacentElement('afterend', panel);
        }

        const item = document.createElement('div');
        item.className = 'fussnote-item';
        item.id = id;
        // Im aufgeklappten Eintrag steht dasselbe (i)-Pictogramm wie im Text
        // (Nutzer-Feedback), nicht die laufende Nummer -- der Bezug ist so
        // unmittelbar sichtbar. Die Nummer bleibt nur fuer Screenreader.
        const badge = document.createElement('span');
        badge.className = 'fussnote-icon';
        badge.textContent = 'i';
        badge.setAttribute('aria-hidden', 'true');
        item.appendChild(badge);
        const srNum = document.createElement('span');
        srNum.className = 'sr-only';
        srNum.textContent = 'Fussnote ' + counter + ': ';
        item.appendChild(srNum);
        // Inhalt uebernehmen (inkl. eventueller Inline-Formeln), Original leeren.
        while (note.firstChild) item.appendChild(note.firstChild);
        panel.appendChild(item);

        const btn = makeToggle(id, counter);
        note.replaceWith(btn);
    });
}

// Klick auf einen Marker: nur den zugehoerigen Eintrag zeigen/verbergen. Das
// Panel bleibt sichtbar, solange mindestens ein Eintrag offen ist.
export function toggle_footnote(btn) {
    const item = document.getElementById(btn.getAttribute('aria-controls'));
    if (!item) return;
    const panel = item.parentElement;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    btn.classList.toggle('open', !open);
    item.classList.toggle('open', !open);
    panel.hidden = !panel.querySelector('.fussnote-item.open');
}
