// aspekt_kreisbahn.js — interaktive Aspekt-Figur zu Abbildung 1.38 (1.4.1 „Die
// Kreisbahn"). Zeigt NUR den Positions-Aspekt: Ortsvektor r, Komponenten
// rx/ry, den durchlaufenen (gestrichelten) Bogen, den Punkt und den Winkel φ.
// Regler: Winkel φ und Radius R (φ0 fest 0).
//
// TECHNIK: kein eigener Zeichencode, sondern der Motor der grossen
// Kreisbewegungs-Simulation (src/figures/kreisbewegung/), feature-gated auf den
// Positions-Aspekt. Der Motor ist zeit-/ω-getrieben (angleRad(t)=φ0+ω·t); der
// φ-Regler wird auf eine Pseudo-Zeit t=φ/ω abgebildet, precompute()+
// updateScene() zeichnen daraus Punkt, Vektoren und Bogen -- ohne Anim-Schleife.
//
// OPTIK: Struktur und Klassen (panel-section/panel-label/slider-row/slider-val/
// legend-grid) sind der Stand-alone-Sim nachgebaut, damit der Wiedererkennungs-
// wert hoch ist. Die Pfeil-Geometrie ist die der Vorlage: Marker markerWidth=5
// (markerUnits=strokeWidth) + Strichstaerke 2.5/2, damit render.js' fixe
// Verkuerzung ARROW_LEN=5·strokeWidth die Spitze exakt auf den Zielpunkt setzt.
// Marker oder Strichstaerke zu aendern verschiebt die Pfeilspitze -> nicht tun.
//
// Layout je Breiten-Modus (data-width-mode an der Wurzel, core.js): schmal =
// gestapelt; normal = Panel links | Szene; breit = Panel links | Szene |
// Analyse rechts; Lupe = Overlay ueber dem Skript, ~0.95 Breite/Hoehe.
//
// PER-INSTANZ-ISOLATION: der Motor-Store ist ein Modul-Singleton. Diese Figur
// holt sich ueber createRuntime() einen EIGENEN Prefix (kb<n>_) + einen
// EIGENEN storeInstance/DOM-Cache; alle Motor-Aufrufe laufen inside
// rt.withStore(...), das den Singleton nur fuer die Dauer des Zeichnens auf
// diese Instanz schaltet und danach restauriert. So sind beliebig viele
// Aspekt-Figuren (auch auf derselben Seite) vollstaendig unabhaengig.
//
// GENERIC (geteilt mit allen Aspekt-Figuren, hier definiert): die Lupe/
// Overlay-Funktionen (toggle_aspekt, close_aspekt_overlay) und das Analyse-
// Klapp (toggle_analyse). Sie operieren rein auf .aspekt-figur/.aspekt-panel-
// right (kein Motor-Zustand) und sind in main.js zentral verdrahtet.

import { store } from './kreisbewegung/state.js';
import { recomputeDerived, precompute, position, velocity, acceleration } from './kreisbewegung/physics.js';
import { setupScene, updateScene } from './kreisbewegung/render.js';
import { R_MIN, R_MAX } from './kreisbewegung/constants.js';
import { createRuntime } from './kreisbewegung/runtime.js';
import { ge } from '../core.js';

const OMEGA_DEG = 60;
const ANIM_CX = 225, ANIM_CY = 260;   // = ANIM_CX / ANIM_CY_STACK (render.js)

// Szene: exakt die Vorlagen-Geometrie (Marker markerWidth=5, Strich 2.5/2,
// Kugel r=8). Reihenfolge Achsen -> Scheibe -> Bahn -> Kugel -> Vektoren, damit
// die Vektoren im Vordergrund liegen. Plus versteckte Stubs (v/a, Stoppuhr),
// die updateScene() anfasst. Die kb_-IDs werden pro Instanz durch den Prefix
// ersetzt (.replace unten).
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 0 450 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <!-- markerUnits=userSpaceOnUse: die Pfeilspitze hat eine FESTE Laenge in
         Nutzereinheiten, unabhaengig von der Strichstaerke. render.js verkuerzt
         jede Vektor-/Achsen-Linie um ihre ARROW_LEN (MAIN=5·2.5=12.5, COMP=5·2=10,
         AXIS=5·1.2=6) und setzt die Spitze (markerWidth, refY) per refX=0 aufs
         Linienende -> die Spitze landet exakt auf dem Zielpunkt, die Strichstaerke
         ist frei per CSS.
         Die Aspekt-Figuren skalieren die Szenen-Strichstärken ×1,5 (--kb-lw in
         aspekt_kreisbahn.css). Damit der Pfeilkopf mit dem dickeren Schaft
         weiter im gleichen Verhaeltnis bleibt (12.5:5 = 18.75:7.5 = 2.5:1),
         wird hier die Spitze ×1.5 vergroessert UND refX = markerWidth' − ARROW_LEN
         gesetzt (z.B. r: 18.75 − 12.5 = 6.25). So verschiebt sich der Referenz-
         punkt so, dass die Spitze weiterhin exakt auf dem Zielpunkt liegt, ohne
         render.js (mit dem gc10 die ARROW_LEN teilt) anfassen zu muessen. -->
    <marker id="kb_ax_arrow"     markerUnits="userSpaceOnUse" markerWidth="13.5" markerHeight="10.5"  refX="7.5" refY="5.25"  orient="auto"><polygon points="0 0, 13.5 5.25, 0 10.5"/></marker>
    <marker id="kb_arrowhead-r"  markerUnits="userSpaceOnUse" markerWidth="18.75" markerHeight="13.125" refX="6.25" refY="6.5625" orient="auto"><polygon points="0 0, 18.75 6.5625, 0 13.125"/></marker>
    <marker id="kb_arrowhead-rx" markerUnits="userSpaceOnUse" markerWidth="15"   markerHeight="10.5"  refX="5"    refY="5.25"  orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
    <marker id="kb_arrowhead-ry" markerUnits="userSpaceOnUse" markerWidth="15"   markerHeight="10.5"  refX="5"    refY="5.25"  orient="auto"><polygon points="0 0, 15 5.25, 0 10.5"/></marker>
  </defs>
  <g id="kb_animation_group">
    <g id="kb_aspekt_axes"></g>
    <g id="kb_animation_coord_system"></g>
    <circle id="kb_disk" cx="225" cy="260" r="100" fill="none" stroke-width="0" opacity="0.06"/>
    <g id="kb_aspekt_angle"></g>
    <!-- phi-Label als foreignObject mit MathJax (garantiert das geschwungene
         \varphi, unabhaengig vom Font). Separat von kb_aspekt_angle, das
         drawAngle() bei jedem Neuzeichnen leert; hier wird nur x/y gesetzt. -->
    <foreignObject id="kb_angle_label" width="30" height="30" style="overflow:visible; visibility:hidden">
      <div xmlns="http://www.w3.org/1999/xhtml" class="aspekt-angle-fo">\\(\\varphi\\)</div>
    </foreignObject>
    <path id="kb_trajectory_path" fill="none" stroke-width="2" stroke-dasharray="4,4" d=""/>
    <circle id="kb_point" cx="325" cy="260" r="8" stroke-width="1"/>
    <text id="kb_zoom_text_display" x="12" y="20" class="zoom-text"></text>

    <line id="kb_position_vector"   stroke-width="2.5" marker-end="url(#kb_arrowhead-r)"  visibility="hidden"/>
    <line id="kb_position_vector_x" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-rx)" visibility="hidden"/>
    <line id="kb_position_vector_y" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ry)" visibility="hidden"/>

    <line id="kb_velocity_vector"/><line id="kb_velocity_vector_x"/><line id="kb_velocity_vector_y"/>
    <line id="kb_acceleration_vector"/><line id="kb_acceleration_vector_x"/><line id="kb_acceleration_vector_y"/>

    <g id="kb_stopwatch" style="display:none">
      <circle id="kb_stopwatch_circle"/><g id="kb_stopwatch_marks"></g>
      <g id="kb_subdial"><g id="kb_subdial_marks"></g><line id="kb_stopwatch_sub_hand"/></g>
      <line id="kb_stopwatch_main_hand"/><g id="kb_digital_display_group"></g>
    </g>
  </g>
</svg>`;

// Linkes Bedien-Panel (Parameter + Legende) -- Klassen wie die Stand-alone-Sim.
const PANEL_LEFT = `
<div class="aspekt-panel aspekt-panel-left">
  <div class="panel-section">
    <div class="panel-label">Parameter</div>
    <div class="slider-label">Winkel \\(\\varphi\\)</div>
    <div class="slider-row">
      <input id="ak_phi" type="range" min="0" max="360" step="0.5" value="60">
      <span class="slider-val" id="ak_phi_out"></span>
    </div>
    <div class="slider-label">Radius \\(R\\)</div>
    <div class="slider-row">
      <input id="ak_r" type="range" min="${R_MIN}" max="${R_MAX}" step="0.05" value="1.5">
      <span class="slider-val" id="ak_r_out"></span>
    </div>
  </div>
  <div class="panel-section">
    <div class="panel-label">Legende</div>
    <div class="legend-grid">
      <div class="legend-swatch" data-c="r"></div>   <div class="legend-label">Ortsvektor \\(\\vec{r}\\)</div>
      <div class="legend-swatch" data-c="rx"></div>  <div class="legend-label">Komponente \\(r_x\\)</div>
      <div class="legend-swatch" data-c="ry"></div>  <div class="legend-label">Komponente \\(r_y\\)</div>
      <div class="legend-swatch" data-c="phi"></div> <div class="legend-label">Winkel \\(\\varphi\\)</div>
      <div class="legend-swatch" data-c="traj"></div><div class="legend-label">durchlaufener Bogen</div>
    </div>
  </div>
</div>`;

// Rechtes Analyse-Panel (breit + Lupe). Kopf-Leiste + Body wie die Stand-alone
// (panel-header mit ph-label + Doppel-Chevron, panel-body); eingeklappt wird
// der Body ausgeblendet und die Leiste zum schmalen vertikalen Streifen.
// Kopf-Leiste: Chevrons LINKS (zeigen zur Simulation), „Analyse" RECHTS —
// spiegelbildlich zum linken Bedienfeld (dessen Chevron nach rechts zeigt).
// Physik-Sektion: kompakt und NUR auf diese Figur gemünzt (R, φ — kein t, kein
// T), UNNUMMERIERT, inline als \[...\] (MathJax setzt es direkt, kein Umweg
// über window.eq_latex/label — das ist die Form, die vor „Physik raus" stand).
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
        <div class="analysis-cell key">Winkel \\(\\varphi\\)</div><div class="analysis-cell val" id="ak_val_phi"></div>
        <div class="analysis-cell key">Radius \\(R\\)</div><div class="analysis-cell val" id="ak_val_r"></div>
        <div class="analysis-cell key">Position \\(x = r_x\\)</div><div class="analysis-cell val" id="ak_val_x"></div>
        <div class="analysis-cell key">Position \\(y = r_y\\)</div><div class="analysis-cell val" id="ak_val_y"></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-label">Physik</div>
      <div class="formula-box">
        <div class="formula-box-cap">Position auf der Kreisbahn:</div>
        <div>\\[\\vec{r} = \\begin{pmatrix} R\\cos\\varphi \\\\ R\\sin\\varphi \\end{pmatrix}\\]</div>
      </div>
    </div>
  </div>
</div>`;

const LIVE_STUB = `
<div style="display:none">
  <span id="kb_time_label"></span>
  <span id="kb_live_t"></span><span id="kb_live_phi"></span>
  <span id="kb_live_x"></span><span id="kb_live_y"></span>
  <span id="kb_live_vx"></span><span id="kb_live_vy"></span><span id="kb_live_vabs"></span>
  <span id="kb_live_ax"></span><span id="kb_live_ay"></span><span id="kb_live_aabs"></span>
</div>`;

// ── Factory: baut EINE Kreisbahn-Aspekt-Figur mit eigener Motor-Instanz ──────
export function buildKreisbahnFig(fig) {
    if (fig.dataset.built) return;
    fig.dataset.built = '1';

    const rt = createRuntime();
    const p = rt.prefix;

    const scene = document.createElement('div');
    fig.appendChild(scene);

    // Skelett mit Per-Instanz-Prefix einhaengen, dann DOM binden.
    scene.innerHTML =
        `<div class="aspekt-body">${PANEL_LEFT.replace(/id="ak_/g, `id="${p}ak_`)}` +
        `<div class="aspekt-scene">${SVG_SCENE.replace(/kb_/g, p)}</div>` +
        `${PANEL_RIGHT.replace(/id="ak_/g, `id="${p}ak_`)}</div>${LIVE_STUB.replace(/kb_/g, p)}`;
    rt.bindDom();

    // Lupe-Button: IMMER oben rechts in der HAUPTSPALTE der Figur (Referenz 1.38).
    // Die Hauptspalte ist Grid-Spalte 2 des .aspekt-body: in 1.38 die .aspekt-scene,
    // in 1.39/1.41 die .aspekt-main (Runbar + Szene + Diagramm). Ihre rechte Kante
    // ist genau die Trennlinie zur Analyse-Leiste -> ist die Analyse sichtbar,
    // sitzt die Lupe links daneben; ist sie ausgeblendet, dehnt sich die
    // Hauptspalte bis zum Figurenrand und die Lupe steht mit denselben 8 px
    // Abstand in der oberen rechten Ecke der Figur. Positionierungsbasis kommt
    // aus dem CSS (beide Container sind position:relative).
    const lupe = document.createElement('button');
    lupe.type = 'button';
    lupe.className = 'aspekt-lupe';
    lupe.dataset.action = 'toggle_aspekt';
    lupe.setAttribute('aria-label', 'Figur vergrößern');
    lupe.title = 'Vergrößern';
    lupe.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.2-5.2"/></svg>';
    (scene.querySelector('.aspekt-main') || scene.querySelector('.aspekt-scene')).appendChild(lupe);

    // Bildunterschrift aus data-caption aufbauen (die statische Abbildung
    // uebernimmt am Bildschirm diese Rolle). Inside .aspekt-body, damit die
    // Panel-Trennstreifen im Grid bis unten durchlaufen (s. aspekt_kreisbahn.css).
    if (fig.dataset.caption) {
        const body = scene.querySelector('.aspekt-body');
        const cap = document.createElement('div');
        cap.className = 'aspekt-caption';
        cap.innerHTML = fig.dataset.caption;
        body.appendChild(cap);
    }

    // Per-Instanz-Regler + Zustand (Closure, nicht Modul-Ebene).
    const ak_phi = ge(p + 'ak_phi'), ak_r = ge(p + 'ak_r');
    let sceneCenters = null;

    // Eigene Achsen: Pfeil in positive Richtung, Fortsetzung in negative Richtung
    // (Vorlage zeichnet nur positiv). Marker wie die Vorlage (markerWidth=5).
    function drawAxes() {
        const g = ge(p + 'aspekt_axes');
        if (!g) return;
        const ppm = store.currentPixelsPerMeter;
        // Achsenlaenge gedeckelt, damit Pfeilspitze + Achsenlabel nicht an den
        // Rand des Darstellungsbereichs stossen (viewBox 450x480, Mitte 225/260;
        // der knappste Halbraum ist ANIM_CY..unten = 220 -> 194 laesst ~26 px fuer
        // Spitze + Label). Bei grossem R haelt updateZoom() den Kreis ohnehin
        // innerhalb, die Achse ragt dann knapp darueber hinaus.
        const len = Math.min(Math.max(2.0, store.R) * ppm * 1.08, 194);
        const NS = 'http://www.w3.org/2000/svg';
        g.textContent = '';
        const line = (x1, y1, x2, y2, arrow) => {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
            l.setAttribute('class', 'aspekt-axis');
            if (arrow) l.setAttribute('marker-end', `url(#${p}ax_arrow)`);
            g.appendChild(l);
        };
        const label = (x, y, t) => {
            const el = document.createElementNS(NS, 'text');
            el.setAttribute('x', x); el.setAttribute('y', y);
            el.setAttribute('class', 'aspekt-axis-label');
            el.textContent = t;
            g.appendChild(el);
        };
        line(ANIM_CX - len, ANIM_CY, ANIM_CX, ANIM_CY, false);
        line(ANIM_CX, ANIM_CY, ANIM_CX + len, ANIM_CY, true);
        label(ANIM_CX + len + 10, ANIM_CY + 4, 'x');
        line(ANIM_CX, ANIM_CY + len, ANIM_CX, ANIM_CY, false);
        line(ANIM_CX, ANIM_CY, ANIM_CX, ANIM_CY - len, true);
        label(ANIM_CX - 14, ANIM_CY - len - 8, 'y');
    }

    // Winkel-Visualisierung: kleiner Bogen am Ursprung zwischen der positiven
    // x-Achse und dem Radius (Ortsvektor), plus ein "φ"-Label -- die klassische
    // Darstellung (auch in Abb. 1.38 und der Legacy-Figur). Der Bogenradius
    // skaliert mit dem Kreis, gedeckelt, damit er den Punkt nicht ueberlappt.
    // Laeuft inside withStore (liest store).
    function drawAngle(phiDeg) {
        const g = ge(p + 'aspekt_angle');
        if (!g) return;
        g.textContent = '';
        const lbl0 = ge(p + 'angle_label');
        if (phiDeg <= 0.5) { if (lbl0) lbl0.style.visibility = 'hidden'; return; }
        const NS = 'http://www.w3.org/2000/svg';
        const cx = ANIM_CX, cy = ANIM_CY;
        const rArc = Math.min(46, store.R * store.currentPixelsPerMeter * 0.42);
        const rad = phiDeg * Math.PI / 180;
        // Bildschirm-y ist nach unten -> Winkel φ (math, CCW) endet bei y = cy - …
        const x0 = cx + rArc, y0 = cy;
        const x1 = cx + rArc * Math.cos(rad), y1 = cy - rArc * Math.sin(rad);
        const large = phiDeg > 180 ? 1 : 0;
        const arc = document.createElementNS(NS, 'path');
        arc.setAttribute('d', `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rArc.toFixed(2)} ${rArc.toFixed(2)} 0 ${large} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
        arc.setAttribute('class', 'aspekt-angle-arc');
        g.appendChild(arc);
        // varphi-Label (foreignObject/MathJax) auf der Winkelhalbierenden. Ob es
        // INNERHALB oder ausserhalb des Bogens sitzt, haengt vom Radius ab: ab
        // R >= 1.2 ist der Bogen gross genug -> Label innen (0.62*rArc); bei
        // kleinerem R ist der Bogen zu klein -> Label knapp ausserhalb (rArc+15).
        // (30x30-foreignObject -> um 15 zentrieren.)
        const lr = (store.R >= 1.2) ? rArc * 0.62 : rArc + 15;
        const mid = rad / 2;
        // Kleiner Versatz (nach rechts + halb so viel nach unten), damit das Label
        // nicht mit dem Ortsvektor kollidiert (z. B. bei 60 Grad).
        const OFF_X = 6, OFF_Y = 3;
        const lx = cx + lr * Math.cos(mid) + OFF_X, ly = cy - lr * Math.sin(mid) + OFF_Y;
        if (lbl0) {
            lbl0.setAttribute('x', (lx - 15).toFixed(2));
            lbl0.setAttribute('y', (ly - 15).toFixed(2));
            lbl0.style.visibility = 'visible';
        }
    }

    // Zeichnen + Analyse-Werte. Alle Motor-Aufrufe inside withStore.
    function draw(phiDeg) {
        const t = (phiDeg * Math.PI / 180) / store.omega;
        precompute();
        updateScene(t, position(t), velocity(t), acceleration(t), sceneCenters);
        drawAngle(phiDeg);
    }

    function refresh() {
        const phi = parseFloat(ak_phi.value);
        rt.withStore(() => {
            Object.assign(store, {
                showPositionVector: true, showPositionComponents: true, showTrajectory: true,
                showVelocityVector: false, showVelocityComponents: false,
                showAccelerationVector: false, showAccelerationComponents: false,
                isDigitalDisplay: false,
            });
            store.R = parseFloat(ak_r.value);
            store.phi0Deg = 0;
            store.omegaDeg = OMEGA_DEG;
            recomputeDerived();
            sceneCenters = setupScene();   // Neuskalierung bei R-Aenderung (Zoom, Scheibe)
            // setupScene() ruft drawCoordSystem() der Sim auf, das eigene Achsen +
            // x/y-Labels in animation_coord_system zeichnet -> leeren, sonst waeren
            // die Achsen doppelt beschriftet (wir zeichnen eigene mit Negativ-Ast).
            const cs = ge(p + 'animation_coord_system'); if (cs) cs.textContent = '';
            drawAxes();
            draw(phi);
            // Deutsches Dezimalkomma wie in der Vorlage.
            const n = (x, d) => x.toFixed(d).replace('.', ',');
            ge(p + 'ak_phi_out').textContent = n(phi, 0) + ' °';
            ge(p + 'ak_r_out').textContent = n(store.R, 2) + ' m';
            const vp = ge(p + 'ak_val_phi'); if (vp) {
                vp.textContent = n(phi, 1) + ' °';
                ge(p + 'ak_val_r').textContent = n(store.R, 2) + ' m';
                const rad = phi * Math.PI / 180;
                ge(p + 'ak_val_x').textContent = n(store.R * Math.cos(rad), 2) + ' m';
                ge(p + 'ak_val_y').textContent = n(store.R * Math.sin(rad), 2) + ' m';
            }
        });
    }

        // Punkt greifen/ziehen: Maus-/Touch-Position -> (R, phi) umrechnen und
        // dieselbe Render-Pipeline wie die Slider verwenden.
        const svg = ge(p + 'main_svg');
        const pointEl = ge(p + 'point');
        let draggingPoint = false;

        const snapToStep = (value, step) => Math.round(value / step) * step;
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

        function toSvgPoint(evt) {
          if (!svg) return null;
          const m = svg.getScreenCTM();
          if (!m) return null;
          const pt = svg.createSVGPoint();
          pt.x = evt.clientX;
          pt.y = evt.clientY;
          return pt.matrixTransform(m.inverse());
        }

        function updateFromPointer(evt) {
          const sp = toSvgPoint(evt);
          if (!sp) return;
          // SVG-y waechst nach unten -> fuer phi in Mathe-Konvention invertieren.
          const dx = sp.x - ANIM_CX;
          const dy = ANIM_CY - sp.y;
          const phiDegRaw = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          const ppm = store.currentPixelsPerMeter || 1;
          const rRaw = Math.hypot(dx, dy) / ppm;

          const phiDeg = snapToStep(phiDegRaw, 0.5);
          const r = snapToStep(clamp(rRaw, R_MIN, R_MAX), 0.05);

          ak_phi.value = String(phiDeg);
          ak_r.value = String(r);
          refresh();
        }

        function onPointerMove(evt) {
          if (!draggingPoint) return;
          evt.preventDefault();
          updateFromPointer(evt);
        }

        function stopPointDrag(evt) {
          if (!draggingPoint) return;
          draggingPoint = false;
          fig.classList.remove('is-dragging-point');
          if (pointEl && pointEl.releasePointerCapture && evt.pointerId !== undefined) {
            try { pointEl.releasePointerCapture(evt.pointerId); } catch {}
          }
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', stopPointDrag);
          window.removeEventListener('pointercancel', stopPointDrag);
        }

        function startPointDrag(evt) {
          if (evt.button !== undefined && evt.button !== 0) return;
          draggingPoint = true;
          fig.classList.add('is-dragging-point');
          if (pointEl && pointEl.setPointerCapture && evt.pointerId !== undefined) {
            try { pointEl.setPointerCapture(evt.pointerId); } catch {}
          }
          updateFromPointer(evt);
          window.addEventListener('pointermove', onPointerMove, { passive: false });
          window.addEventListener('pointerup', stopPointDrag);
          window.addEventListener('pointercancel', stopPointDrag);
        }

    [ak_phi, ak_r].forEach(inp => inp.addEventListener('input', refresh));
    refresh();
        if (pointEl) pointEl.addEventListener('pointerdown', startPointDrag);
}

// ── Lupe: Overlay ueber dem Skript (GENERISCH, alle Aspekt-Figuren) ────────────
let overlayReturn = null;

function openOverlay(fig) {
    const content = ge('content');
    const back = document.createElement('div');
    back.className = 'aspekt-overlay-back';
    back.dataset.action = 'close_aspekt_overlay';
    const wrap = document.createElement('div');
    wrap.className = 'aspekt-overlay-wrap';
    const w = content ? content.clientWidth * 0.95 : window.innerWidth * 0.9;
    const h = (window.innerHeight - 64) * 0.95;
    wrap.style.width = Math.round(w) + 'px';
    wrap.style.maxHeight = Math.round(h) + 'px';   // Deckel; die SVG begrenzt sich selbst per vh (s. CSS)
    overlayReturn = { parent: fig.parentNode, next: fig.nextSibling };
    fig.classList.add('aspekt-im-overlay');
    wrap.appendChild(fig);
    back.appendChild(wrap);
    document.body.appendChild(back);
    document.body.classList.add('aspekt-overlay-open');
    fig.dispatchEvent(new CustomEvent('aspekt-overlay-toggled', { detail: { open: true } }));
}

function closeOverlay() {
    const back = document.querySelector('.aspekt-overlay-back');
    if (!back) return;
    const fig = back.querySelector('.aspekt-figur');
    if (fig && overlayReturn) {
        fig.classList.remove('aspekt-im-overlay');
        overlayReturn.parent.insertBefore(fig, overlayReturn.next);
      fig.dispatchEvent(new CustomEvent('aspekt-overlay-toggled', { detail: { open: false } }));
    }
    back.remove();
    document.body.classList.remove('aspekt-overlay-open');
    overlayReturn = null;
}

export function toggle_aspekt(btn) {
    const fig = btn.closest('.aspekt-figur');
    if (!fig) return;
    if (fig.classList.contains('aspekt-im-overlay')) closeOverlay();
    else openOverlay(fig);
}

export function close_aspekt_overlay() { closeOverlay(); }

// Analyse-Panel ein-/ausklappen (Kopf-Leiste, wie die Stand-alone): der Body
// verschwindet, das Panel wird zum schmalen Streifen (CSS ueber .collapsed).
export function toggle_analyse(btn) {
    const panel = btn.closest('.aspekt-panel-right');
    if (!panel) return;
    const collapsed = panel.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

// Linkes Bedienfeld seitlich einklappen (Normal- + Breit-Modus): gibt der
// Simulation/den Diagrammen mehr Platz. Spiegelt toggle_analyse — der Streifen
// bleibt, die Sektionen verschwinden (CSS ueber .collapsed). Generisch fuer
// jede .aspekt-figur (kein Motor-Zustand).
export function toggle_panel_left(btn) {
    const panel = btn.closest('.aspekt-panel-left');
    if (!panel) return;
    const collapsed = panel.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}