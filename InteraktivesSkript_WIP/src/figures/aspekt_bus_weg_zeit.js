// aspekt_bus_weg_zeit.js — interaktive Aspekt-Figur zu Abbildung 1.2
// (1.1.7 „Die Strecke"). Busfahrt der Linie 42: Gegenüberstellung einer realen
// Straßenszene (links, wandernder Bus) und des zugehörigen Weg-Zeit-Diagramms
// x(t) (rechts). Ein Zeitcursor — Regler ODER Play/Pause-Animation — bewegt
// Bus und Kurvenpunkt SYNCHRON und legt Ableselinien zu beiden Achsen, um die
// zwei Grundfragen der Kinematik zu beantworten (Ort zu gegebenem t, Zeitpunkt
// zu gegebenem x).
//
// VORLAGE (Kaskade, s. INTERAKTIVE_ASPEKT_FIGUREN.md Abschnitt 0a):
//   1. Interaktionsmuster: Single-Cursor + Play/Pause + Auto-Stopp + Single-
//      Graph -> aspekt_winkel_zeit.js (Abb. 1.41) ist die Modul-Vorlage.
//      Uebernommen: Factory-Skelett + Reentry-Guard, .aspekt-main mit Runbar
//      + .aspekt-main-content (Szene | Graph in Zeile), Skelett-Templates mit
//      Prefix-Replace, rt.bindDom(), Lupe-Button, data-caption-Bau, RAF-Schleife
//      mit speedFactor + Auto-Stopp via playback.js, Tempo-Pills, Runbar-Knoepfe.
//      NICHT uebernommen: Parameter-Kopplung (kein T/ω), Geisterkurve, Graph-
//      Hover (der Bus hat nur EINEN Parameter — die Zeit — und eine feste Kurve).
//   2. Motor: src/figures/bus_weg_zeit/ (NEU, figur-only — keine Stand-alone-
//      Sim in Input/Simulationen/ passt; die geschwindigkeit_simulation ist eine
//      reine Steigungsanalyse). Strukturmodelliert auf grundbegriffe/ (eigner
//      store/runtime, lib-Wiederverwendung, diagrammatisch). Aus dem Motor:
//      t-x-Diagramm + Straßenszene, stückweise x(t) (Halt + Fahrt-S-Kurve),
//      Toggles ohne Hover-Highlight (bewusste Vereinfachung gegenueber
//      grundbegriffe — die Schalter sind reine Ein-/Aus-Filter, kein Lehrtext).
//   3. Statische v0.13-Abbildung: gibt die Kurve (firebrick), die Haltestellen
//      H1–H4 (0/500/1000/1500 m), die Achsen (0–400 s, 0–1500 m) und die
//      Gegenüberstellung Szene|Diagramm vor (s. DEFAULT_TOGGLES = statische
//      Ansicht: einheitlich rote Kurve, Haltestellen- + Ereignis- + Ableselinien
//      an; Halt/Fahrt-Einfaerbung aus).
//
// DATEN: Kurve x(t) aus dem matplotlib-Notebook Input/v0.13/PSkriptBilder/
// weg_zeit_diagramm_bushaltestellen.ipynb (recoverable aus dem gerenderten SVG).
// Halte-/Fahrt-Dauern der Haltestellen 2–4 / Fahrten 2–3 sind im Notebook
// randomisiert; im Motor angepinnt (s. constants.js). Prosa-Beispiel t=75 s ->
// x≈250 m stimmt (konstante Phase der Fahrt H1→H2).
//
// TECHNIK: kein eigener Zeichencode ausser den Templates — der Motor
// (src/figures/bus_weg_zeit/) zeichnet, diese Datei baut Skelett, Bedienung und
// Verdrahtung. Alle Motor-Aufrufe laufen inside rt.withStore(...) (Per-Instanz-
// Isolation, s. bus_weg_zeit/runtime.js).

import { store } from './bus_weg_zeit/state.js';
import { computePath } from './bus_weg_zeit/physics.js';
import { drawGrid, drawStreetStatic, buildBus, updateVisualization, liveValues } from './bus_weg_zeit/render.js';
import { T_MIN, T_MAX, T_STEP, T_AUTO, T_DEFAULT, TOGGLE_KEYS, GRAPH_W, GRAPH_H, STREET_W, STREET_H } from './bus_weg_zeit/constants.js';
import { createRuntime } from './bus_weg_zeit/runtime.js';
import { resetOnPlayAfterAutoStop } from './playback.js';
import { ge } from '../core.js';

// Start-Zustand: ALLE Anzeige-Optionen aus (Nutzervorgabe) — nur die Kurve
// x(t) + der Kurvenpunkt + der wandernde Bus stehen am Anfang. Haltestellen-,
// Ereignis-, Ableselinien und die Halt/Fahrt-Einfaerbung werden per Toggle
// zugeschaltet. (Frueher die statische Ansicht als Default; v1.31.8 geaendert.)
const DEFAULT_TOGGLES = {
    haltestellen: false,
    ereignisse: false,
    ableselinien: false,
    haltFahrt: false,
};

// ── Straßenszene-SVG (links) ────────────────────────────────────────────────
// street_bg = Straße/Haltestellen (einmalig von drawStreetStatic gefuellt);
// street_bus = Bus-Gruppe (von buildBus gefuellt, pro Frame per transform
// verschoben). z-Order: bg vor bus -> Bus liegt oben auf der Straße.
const SVG_STREET = `
<svg id="bw_street_svg" viewBox="0 0 ${STREET_W} ${STREET_H}" width="${STREET_W}" height="${STREET_H}" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <g id="bw_street_bg"></g>
  <g id="bw_street_bus"></g>
</svg>`;

// ── t-x-Diagramm-SVG (rechts) ───────────────────────────────────────────────
// grid_group = statische Achsen/Ticks/Labels/Titel/Legende (drawGrid);
// plot_area = dynamischer Overlay (updateVisualization). Pfeilspitze refX=0 ->
// Spitze sitzt am Linienende (Achse zeigt nach aussen).
const SVG_GRAPH = `
<svg id="bw_graph_svg" viewBox="0 0 ${GRAPH_W} ${GRAPH_H}" preserveAspectRatio="xMidYMid meet" class="aspekt-graph-svg">
  <defs>
    <marker id="bw_graph-arrowhead" markerWidth="4.95" markerHeight="3.465" refX="0" refY="1.7325" orient="auto"><polygon points="0 0, 4.95 1.7325, 0 3.465"/></marker>
  </defs>
  <g id="bw_grid_group"></g>
  <g id="bw_plot_area"></g>
  <text id="bw_time_display" x="12" y="399" class="aspekt-time-text"></text>
</svg>`;

// Eine Toggle-Zeile (Checkbox + Label). Keine Wertanzeige (reine Ein-/Aus-
// Filter, kein Hover-Highlight — bewusste Vereinfachung gegenueber grundbegriffe).
const toggleRow = (key, label) => `
      <div class="vis-control-row" id="bw_control_${key}">
        <input type="checkbox" id="bw_toggle_${key}"${DEFAULT_TOGGLES[key] ? ' checked' : ''}>
        <span class="vis-control-label">${label}</span>
      </div>`;

// ── Linkes Bedien-Panel: Ablauf (Zeitregler), Tempo, Anzeige, Legende ────────
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Ablauf</div>
    <div class="slider-label">Zeit \\(t\\)</div>
    <div class="slider-row">
      <input id="ak_t" type="range" min="${T_MIN}" max="${T_MAX}" step="${T_STEP}" value="${T_DEFAULT}">
      <span class="slider-val" id="ak_t_out"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Tempo</div>
    <div class="speed-pills">
      <label class="speed-pill"><input type="radio" name="ak_speed" value="4"><span>4×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="12" checked><span>12×</span></label>
      <label class="speed-pill"><input type="radio" name="ak_speed" value="60"><span>60×</span></label>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Anzeige</div>
${toggleRow('haltestellen', 'Haltestellen')}
${toggleRow('ereignisse', 'Ereignisse (Ankunft/Abfahrt)')}
${toggleRow('ableselinien', 'Ableselinien')}
${toggleRow('haltFahrt', 'Halt/Fahrt einfärben')}
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="bw-kurve"></div><div class="legend-label">Ort \\(x(t)\\) — Linie 42</div>
      <div class="legend-swatch" data-c="bw-halt"></div>  <div class="legend-label">Halt (eingefärbt)</div>
      <div class="legend-swatch" data-c="bw-bus"></div>   <div class="legend-label">Bus</div>
    </div>
  </div>
</div>`;

// Klebende Ablaufleiste oberhalb von Szene + Diagramm (wie winkel_zeit).
const RUNBAR = `
<div class="aspekt-runbar" role="group" aria-label="Ablaufsteuerung">
  <div class="aspekt-btn-row">
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="start" aria-label="Start: Fahrtverlauf abspielen" title="Start"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="stop" aria-label="Pause: anhalten" title="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/><rect x="13.1" y="5.5" width="3.4" height="13" rx="1.5" fill="currentColor"/></svg></button>
    <button type="button" class="aspekt-btn aspekt-btn-icon" data-act="reset" aria-label="Reset: auf Anfang zurücksetzen" title="Reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.74 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" fill="currentColor"/></svg></button>
  </div>
</div>`;

// ── Rechtes Analyse-Panel: Live-Analyse + Physik (unnummeriert) ─────────────
const PANEL_RIGHT = `
<div class="aspekt-panel aspekt-panel-right">
  <button type="button" class="panel-header" data-action="toggle_analyse" aria-expanded="true" title="Analyse ein-/ausklappen">
    <svg class="ph-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4 L8 8 L3 12"/><path d="M8 4 L13 8 L8 12"/></svg>
    <span class="ph-label">Analyse</span>
  </button>
  <div class="panel-body">
    <div class="panel-section">
      <div class="panel-label">Live-Analyse</div>
      <div class="analysis-grid">
        <div class="analysis-cell key">Zeit \\(t\\)</div>       <div class="analysis-cell val" id="ak_val_t"></div>
        <div class="analysis-cell key">Ort \\(x(t)\\)</div>     <div class="analysis-cell val" id="ak_val_x"></div>
        <div class="analysis-cell key">Zustand</div>           <div class="analysis-cell val" id="ak_val_state"></div>
        <div class="analysis-cell key">Haltestelle</div>       <div class="analysis-cell val" id="ak_val_stop"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box bw-experten">
        <div class="bw-experten-badge">Für Experten und Interessierte</div>
        <div class="formula-box-cap">Weg-Zeit-Gesetz der Busfahrt (Halt bzw. Fahrt)</div>
        <div>\\[x(t)=\\begin{cases}x_0, & \\text{Halt } (\\dot x=0)\\\\[2pt] x_0+\\displaystyle\\int_{0}^{\\,t-t_0} v(\\tau)\\,d\\tau, & \\text{Fahrt}\\end{cases}\\]</div>
        <div class="formula-box-cap">Geschwindigkeit \\(v(\\tau)\\) — Trapez-Profil, je Phase einzeln (\\(\\tau=t-t_0\\))</div>
        <div>\\[\\text{Beschleunigen: }\\; v=a\\,\\tau,\\quad 0\\le\\tau\\le t_\\mathrm{acc}\\]</div>
        <div>\\[\\text{Konstant: }\\; v=v_{\\max},\\quad t_\\mathrm{acc}\\le\\tau\\le\\Delta t-t_\\mathrm{acc}\\]</div>
        <div>\\[\\text{Bremsen: }\\; v=v_{\\max}-a\\,u,\\quad \\Delta t-t_\\mathrm{acc}\\le\\tau\\le\\Delta t\\]</div>
        <div class="formula-box-cap">Weg \\(x(\\tau)=x_0+\\!\\int v\\,d\\tau\\) — S-Kurve, je Phase einzeln</div>
        <div>\\[\\text{Beschleunigen: }\\; x=x_0+\\tfrac12 a\\,\\tau^2\\]</div>
        <div>\\[\\text{Konstant: }\\; x=x_0+\\tfrac12 a\\,t_\\mathrm{acc}^2+v_{\\max}(\\tau-t_\\mathrm{acc})\\]</div>
        <div>\\[\\text{Bremsen: }\\; x=x_0+\\tfrac12 a\\,t_\\mathrm{acc}^2+v_{\\max}(\\Delta t-2t_\\mathrm{acc})+v_{\\max}u-\\tfrac12 a\\,u^2\\]</div>
        <div class="formula-box-cap">Definitionen (auf zwei Zeilen)</div>
        <div>\\[\\tau=t-t_0,\\quad u=\\tau-(\\Delta t-t_\\mathrm{acc}),\\quad r=0{,}3\\]</div>
        <div>\\[v_{\\max}=\\frac{\\Delta x}{(1-r)\\,\\Delta t},\\quad t_\\mathrm{acc}=r\\,\\Delta t,\\quad a=\\frac{v_{\\max}}{t_\\mathrm{acc}}\\]</div>
        <div class="formula-box-cap">Fahrplan (angepinnte Werte, \\(\\Delta x=500\\,\\mathrm{m}\\))</div>
        <table class="bw-fahrplan">
          <thead><tr><th>Fahrt</th><th>\\(\\Delta t\\)</th><th>\\(v_{\\max}\\)</th><th>\\(a\\)</th></tr></thead>
          <tbody>
            <tr><td>H1&nbsp;→&nbsp;H2</td><td>90&nbsp;s</td><td>7,94&nbsp;m/s</td><td>0,294&nbsp;m/s²</td></tr>
            <tr><td>H2&nbsp;→&nbsp;H3</td><td>85&nbsp;s</td><td>8,40&nbsp;m/s</td><td>0,330&nbsp;m/s²</td></tr>
            <tr><td>H3&nbsp;→&nbsp;H4</td><td>95&nbsp;s</td><td>7,52&nbsp;m/s</td><td>0,264&nbsp;m/s²</td></tr>
          </tbody>
        </table>
        <div class="bw-experten-note">Mit diesen Formeln und dem Fahrplan lässt sich \\(x(t)\\) für jeden Zeitpunkt der Busfahrt nachrechnen — Strecke für Strecke.</div>
      </div>
    </div>
  </div>
</div>`;

// Lupe/Overlay (toggle_aspekt, close_aspekt_overlay) und das Analyse-Klapp
// (toggle_analyse) sind GENERIC in aspekt_kreisbahn.js (arbeiten auf jedem
// .aspekt-figur, kein Motor-Zustand) und in main.js verdrahtet — diese Figur
// nutzt sie unverändert mit (DRY, kein Duplikat hier).

// ── Factory: baut EINE Bus-Weg-Zeit-Aspekt-Figur mit eigener Motor-Instanz ──
export function buildBusWegZeitFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhaengen, dann DOM binden. Motor-IDs
    // tragen 'bw_' -> ein Replace; Bedien-IDs tragen 'ak_' (und die Tempo-Pills
    // name="ak_speed") -> getrennt ersetzen, sonst greift querySelectorAll auf
    // nichts und das Abspieltempo bleibt wirkungslos (Fallstrick #14). Die
    // Toggle-IDs (bw_toggle_/bw_control_) liegen im PANEL_LEFT und muessen
    // Ebenfalls den Instanz-Prefix bekommen — die Verdrahtung greift per
    // ge(p+'toggle_'+key) auf sie zu, ohne Replace waeren sie prefixlos und
    // die Toggles wirkungslos (gefunden beim Toggle-Funktionstest).
    scene.innerHTML =
      `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`).replace(/name="ak_speed"/g, `name="${p}speed"`).replace(/bw_/g, p)}` +
      `<div class="aspekt-main">${RUNBAR}<div class="aspekt-main-content">` +
      `<div class="aspekt-scene">${SVG_STREET.replace(/bw_/g, p)}</div>` +
      `<div class="aspekt-graph">${SVG_GRAPH.replace(/bw_/g, p)}</div></div></div>` +
        `${PANEL_RIGHT.replace(/id="ak_/g, `id="${p}ak_`)}</div>`;
    rt.bindDom();

    // Lupe-Button in die Ablaufleiste (klebt oben, s. winkel_zeit — dort die
    // Begruendung warum nicht an .aspekt-main). Rueckfall: .aspekt-scene.
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-runbar') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption (die statische Abbildung uebernimmt am
    // Bildschirm diese Rolle). Inside .aspekt-body, damit die Panel-Trennstreifen
    // im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        scene.querySelector('.aspekt-body').appendChild(cap);
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const ak_t = ge(p + 'ak_t');
    const speedRadios = scene.querySelectorAll(`input[name="${p}speed"]`);
    let curT = T_DEFAULT;
    let speedFactor = 12;   // Default-Playback = 12× (die 400 s dauern sonst zu lang)

    // Zeichnen an der aktuellen Zeit + Live-Analyse aktualisieren.
    function draw(t) {
        curT = t;
        rt.withStore(() => updateVisualization(t));
        updateLabels(t);
    }

    // Live-Analyse + Slider-Wert (liveValues ist stateless -> kein withStore).
    function updateLabels(t) {
        const v = liveValues(t);
        ge(p + 'ak_t_out').textContent = v.t;
        ge(p + 'ak_val_t').textContent = v.t;
        ge(p + 'ak_val_x').textContent = v.x;
        ge(p + 'ak_val_state').textContent = v.state;
        ge(p + 'ak_val_stop').textContent = v.stop;
        // Zeit-Anzeige unten im Sim-Bereich (analog winkel_zeit: „t = … s").
        const td = ge(p + 'time_display'); if (td) td.textContent = `t = ${v.t}`;
    }

    // Toggles: reine Ein-/Aus-Filter (kein Hover-Highlight). Klick neben der
    // Checkbox schaltet sie mit (Vorlagen-Verhalten grundbegriffe).
    for (const key of TOGGLE_KEYS) {
        const box = ge(p + 'toggle_' + key);
        const row = ge(p + 'control_' + key);
        if (!box) continue;
        box.addEventListener('change', () => {
            rt.withStore(() => { store.toggles[key] = box.checked; });
            draw(curT);
        });
        if (row) row.addEventListener('click', e => {
            if (e.target !== box) { box.checked = !box.checked; box.dispatchEvent(new Event('change')); }
        });
    }

    // Zeit-Regler: Schrubben stoppt die Animation und zeichnet direkt.
    ak_t.addEventListener('input', () => { stop(); draw(parseFloat(ak_t.value)); });

    // ── Automatischer Ablauf (Sim-Zeit 0 … 400 s, SPEEDUP via Tempo-Pills
    //    4×/12×/60× — die 400 s wuerden sonst in Echtzeit ablaufen — Auto-Stopp
    //    am Ende, kein Umbrechen). Pro Instanz im Closure; Knöpfe/Pills hängen
    //    direkt am Container (kein data-action — sie brauchen Instanz-Zustand).
    let playing = false;
    let rafId = null;
    let lastTs = 0;

    function frame(ts) {
        if (!playing) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        let nt = curT + dt * speedFactor;
        if (nt >= T_AUTO) nt = T_AUTO;
        ak_t.value = String(nt);
        draw(nt);
        if (nt >= T_AUTO) stop();
        if (playing) rafId = requestAnimationFrame(frame);
    }
    function start() {
        if (playing) return;
        resetOnPlayAfterAutoStop(curT, T_AUTO, reset);   // am Ende -> neu starten
        playing = true;
        lastTs = 0;
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        playing = false;
        if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
        rafId = null;
    }
    function reset() {
        stop();
        ak_t.value = '0';
        draw(0);
    }

    fig.querySelectorAll('.aspekt-btn[data-act]').forEach(btn => {
        const act = btn.dataset.act;
        btn.addEventListener('click', () => {
            if (act === 'start') start();
            else if (act === 'stop') stop();
            else if (act === 'reset') reset();
        });
    });
    speedRadios.forEach(r => r.addEventListener('change', () => {
        speedFactor = parseFloat(r.value);
        speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));
    }));
    speedRadios.forEach(rr => rr.closest('.speed-pill').classList.toggle('active', rr.checked));

    // Erst-Aufbau: fester Fahrtverlauf EINMAL berechnen (aendert sich nie),
    // statische Diagramm-Teile + Straßenszene einmal zeichnen, Bus bauen.
    rt.withStore(() => {
        Object.assign(store.toggles, DEFAULT_TOGGLES);
        store.t = T_DEFAULT;
        store.path = computePath();
        drawGrid();
        drawStreetStatic();
        buildBus();
    });
    draw(curT);

    // ── Straßen-Hoehe synct auf die Diagramm-Hoehe (s. CSS-Kommentar oben).
    //    Das Diagramm ist breitentrieben (width:100%, height:auto, max-height);
    //    die hochformatige Straßenszene muss ihm in die Hoehe folgen, damit die
    //    Ordinate (linkes Plot-Ende) und das Straßenband auf derselben Skala
    //    liegen (s. constants.js) und die Bus-Hoehe pixelgenau der Kurven-Hoehe
    //    entspricht. CSS stretch/aspect-ratio scheitern daran (s. CSS-Kommentar),
    //    daher hier per JS: Diagramm-Hoehe messen, Straßen-SVG-height setzen,
    //    width:auto loest das viewBox-Verhaeltnis 220:404. Ein ResizeObserver
    //    fängt Modus-Wechsel, Lupe und Viewport-Aenderung ab. Im Schmal-Modus
    //    (flex-direction:column, Straße gestapelt) hat die Straße ihre eigene
    //    Hoehe (CSS) -> inline-height loeschen, nicht syncen.
    const streetSvg = ge(p + 'street_svg');
    const graphSvg = ge(p + 'graph_svg');
    const mainContent = scene.querySelector('.aspekt-main-content');
    function syncStreetHeight() {
        if (!streetSvg || !graphSvg || !mainContent) return;
        if (getComputedStyle(mainContent).flexDirection !== 'row') {
            streetSvg.style.height = '';          // CSS-Hoehe (30vh) greift
            return;
        }
        const h = graphSvg.getBoundingClientRect().height;
        if (h > 1) streetSvg.style.height = h + 'px';
    }
    if (typeof ResizeObserver !== 'undefined' && graphSvg) {
        const ro = new ResizeObserver(syncStreetHeight);
        ro.observe(graphSvg);
    }
    syncStreetHeight();

    // Beim Oeffnen/Schliessen der Lupe neu zeichnen (Layout-Switch Szene|Graph
    // <-> Stapelung wird vom CSS gehandhabt; Inhalt bleibt, nur sichern) +
    // Straßen-Hoehe neu syncen (Overlay aendert die Diagramm-Hoehe).
    fig.addEventListener('aspekt-overlay-toggled', () => { draw(curT); syncStreetHeight(); });
}