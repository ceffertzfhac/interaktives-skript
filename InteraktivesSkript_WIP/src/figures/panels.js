// figures/panels.js — collapsible Praesentation fuer .grafik-container:
// standardmaessig eine kompakte Vorschau-Karte (Titel + Kurzbeschreibung +
// "Simulation oeffnen"-Button), die beim Klick zur vollen interaktiven Figur
// aufklappt. Ersetzt die fruehere sticky/skaliert-Spalte (splitter.js).
//
// Arbeitet rein additiv per JS-Wrapper (kein Antasten der bestehenden Figuren-
// Innenmarkup/-Logik): O(1) pro Figur ist nur ein optionales data-title/
// data-desc-Attribut am gcN-Container in index.html (s. CLAUDE.md-Vorgabe
// "neue Figur = kleiner Edit"). Wird einmalig in main.js's init() aufgerufen,
// nicht ueber update_all (kein Bezug zu Slider-Zustand).
import { ge } from '../core.js';

function buildHeader(container, title) {
    const header = document.createElement('div');
    header.className = 'gc_header';

    const label = document.createElement('span');
    label.className = 'gc_header_title';
    label.textContent = title;
    header.appendChild(label);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gc_toggle';
    toggle.dataset.action = 'toggle_panel';
    toggle.textContent = 'Simulation öffnen ▸';
    header.appendChild(toggle);

    return { header, toggle };
}

function buildPreview(desc) {
    const preview = document.createElement('div');
    preview.className = 'gc_preview';
    const p = document.createElement('p');
    p.textContent = desc;
    preview.appendChild(p);
    return preview;
}

export function init_figure_panels() {
    document.querySelectorAll('.grafik-container').forEach(container => {
        if (container.dataset.panelReady) return; // idempotent
        const title = container.dataset.title || 'Interaktive Simulation';
        const desc = container.dataset.desc || 'Zum Öffnen klicken.';
        const { header, toggle } = buildHeader(container, title);
        const preview = buildPreview(desc);
        container.insertBefore(preview, container.firstChild);
        container.insertBefore(header, container.firstChild);
        container.dataset.panelReady = 'true';
        container.dataset.panelToggleLabel = 'Simulation öffnen ▸';
        toggle.textContent = container.dataset.panelToggleLabel;
    });
}

export function toggle_panel(triggerEl) {
    const container = triggerEl.closest('.grafik-container');
    if (!container) return;
    const expanded = container.classList.toggle('gc-expanded');
    const toggleBtn = container.querySelector('.gc_toggle');
    if (toggleBtn) toggleBtn.textContent = expanded ? 'Einklappen ✕' : 'Simulation öffnen ▸';
}
