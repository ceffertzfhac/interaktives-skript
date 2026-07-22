// aspekt_kreisbahn.js — interaktive Aspekt-Figur zu Abbildung 1.38 (1.4.1 „Die
// Kreisbahn"). Zeigt NUR den Positions-Aspekt: Ortsvektor r, seine Komponenten
// rx/ry, den bereits durchlaufenen (gestrichelten) Bogen und den Punkt auf der
// Kreisbahn. Regler: Winkel φ, Radius R, Anfangswinkel φ0 (wie die alte
// Legacy-Figur gc1).
//
// TECHNIK (Nutzerentscheidung): kein eigener Zeichencode, sondern der Motor der
// grossen Kreisbewegungs-Simulation (src/figures/kreisbewegung/), feature-gated
// auf den Positions-Aspekt -- so ist die Optik 1:1 wiedererkennbar. Der Motor
// ist zeit-/ω-getrieben (angleRad(t)=φ0+ω·t); der φ-Regler wird deshalb auf
// eine Pseudo-Zeit t=φ/ω abgebildet. Damit liefert precompute() den Bogen von
// φ0 bis φ und updateScene() zeichnet Punkt, r-Vektor und Komponenten -- ganz
// ohne Animationsschleife (ein Aufruf pro Reglerbewegung).
//
// Der Sim-Store (state.js) ist ein Modul-Singleton -> diese Figur und die volle
// Simulation koennen nicht gleichzeitig auf derselben Seite leben. Fuer den
// Prototyp (nur diese eine Figur in 1.4.1) ist das unkritisch; bei mehreren
// Aspekt-Figuren muss der Store instanziierbar werden (Backlog).

import { store, DOM, initDOM } from './kreisbewegung/state.js';
import { recomputeDerived, precompute, position, velocity, acceleration } from './kreisbewegung/physics.js';
import { setupScene, updateScene } from './kreisbewegung/render.js';
import { R_MIN, R_MAX, PHI0_MIN, PHI0_MAX } from './kreisbewegung/constants.js';

// Fixe Winkelgeschwindigkeit fuer die φ→Zeit-Abbildung. Der Wert ist beliebig
// (er wird nie als Geschwindigkeit gezeigt), nur ungleich null -- 60°/s ist der
// Sim-Default. t = φ[rad] / ω[rad/s].
const OMEGA_DEG = 60;

// SVG-Szene der Sim, reduziert auf die Elemente, die setupScene()/updateScene()
// anfassen (inkl. der versteckten Stubs, die updateScene am Ende schreibt --
// Stoppuhr, v/a-Vektoren). Alle IDs mit kb_-Praefix wie im Sim-Store erwartet.
const SVG_SCENE = `
<svg id="kb_main_svg" viewBox="0 0 450 480" preserveAspectRatio="xMidYMid meet" class="aspekt-svg">
  <defs>
    <marker id="kb_arrowhead-r"  markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-rx" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
    <marker id="kb_arrowhead-ry" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto"><polygon points="0 0, 5 1.75, 0 3.5"/></marker>
  </defs>
  <g id="kb_animation_group">
    <g id="kb_animation_coord_system"></g>
    <circle id="kb_disk" cx="225" cy="260" r="100" fill="none" stroke-width="0" opacity="0.06"/>
    <path id="kb_trajectory_path" fill="none" stroke-width="1.5" stroke-dasharray="4,4" d=""/>
    <circle id="kb_point" cx="325" cy="260" r="8" stroke-width="1"/>
    <text id="kb_zoom_text_display" x="12" y="20" class="zoom-text"></text>

    <line id="kb_position_vector"   stroke-width="2.5" marker-end="url(#kb_arrowhead-r)"  visibility="hidden"/>
    <line id="kb_position_vector_x" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-rx)" visibility="hidden"/>
    <line id="kb_position_vector_y" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#kb_arrowhead-ry)" visibility="hidden"/>

    <!-- v/a-Vektoren: bleiben unsichtbar (Flags aus), aber vorhanden, weil
         updateScene() ihre Sichtbarkeit setzt. -->
    <line id="kb_velocity_vector"/><line id="kb_velocity_vector_x"/><line id="kb_velocity_vector_y"/>
    <line id="kb_acceleration_vector"/><line id="kb_acceleration_vector_x"/><line id="kb_acceleration_vector_y"/>

    <!-- Stoppuhr-Stub: unsichtbar, aber vorhanden -- updateScene() schreibt am
         Ende die Zeiger; ohne die Elemente gaebe es Null-Zugriffe. -->
    <g id="kb_stopwatch" style="display:none">
      <circle id="kb_stopwatch_circle"/><g id="kb_stopwatch_marks"></g>
      <g id="kb_subdial"><g id="kb_subdial_marks"></g><line id="kb_stopwatch_sub_hand"/></g>
      <line id="kb_stopwatch_main_hand"/><g id="kb_digital_display_group"></g>
    </g>
  </g>
</svg>`;

function controls() {
    return `
<div class="aspekt-controls">
  <label class="aspekt-row">
    <span class="aspekt-name">Winkel <i>φ</i></span>
    <input id="ak_phi" type="range" min="0" max="360" step="0.5" value="60">
    <output id="ak_phi_out" class="aspekt-val"></output>
  </label>
  <label class="aspekt-row">
    <span class="aspekt-name">Radius <i>R</i></span>
    <input id="ak_r" type="range" min="${R_MIN}" max="${R_MAX}" step="0.05" value="1.5">
    <output id="ak_r_out" class="aspekt-val"></output>
  </label>
  <label class="aspekt-row">
    <span class="aspekt-name">Anfangswinkel <i>φ</i><sub>0</sub></span>
    <input id="ak_phi0" type="range" min="${PHI0_MIN}" max="${PHI0_MAX}" step="0.5" value="0">
    <output id="ak_phi0_out" class="aspekt-val"></output>
  </label>
</div>`;
}

let sceneCenters = null;

function draw(phiDeg) {
    // φ → Pseudo-Zeit; precompute() erzeugt den Bogen bis dahin.
    const t = (phiDeg * Math.PI / 180) / store.omega;
    precompute();
    const p = position(t), v = velocity(t), a = acceleration(t);
    updateScene(t, p, v, a, sceneCenters);
}

function readInputs(host) {
    const phi = host.querySelector('#ak_phi');
    const r = host.querySelector('#ak_r');
    const phi0 = host.querySelector('#ak_phi0');
    store.R = parseFloat(r.value);
    store.phi0Deg = parseFloat(phi0.value);
    store.omegaDeg = OMEGA_DEG;
    recomputeDerived();
    host.querySelector('#ak_phi_out').textContent = parseFloat(phi.value).toFixed(0) + '°';
    host.querySelector('#ak_r_out').textContent = store.R.toFixed(2) + ' m';
    host.querySelector('#ak_phi0_out').textContent = store.phi0Deg.toFixed(0) + '°';
    draw(parseFloat(phi.value));
}

// Baut die Figur in `host` (ein leeres Element) auf. Wird fuer die kleine
// Inline-Variante und die grosse (aufgeklappte) Variante gleichermassen
// genutzt -- der Unterschied ist reine CSS-Groesse ueber die Klasse am host.
// updateScene() beschreibt am Ende ein Live-Wert-Panel (Zeit + x/y/φ/v/a). Fuer
// die minimale Aspekt-Figur wird es nicht gezeigt, muss aber als Stub
// existieren, sonst gaebe es Null-Zugriffe. Ein einziges verstecktes Element
// mit allen erwarteten IDs.
const LIVE_STUB = `
<div style="display:none">
  <span id="kb_time_label"></span>
  <span id="kb_live_t"></span><span id="kb_live_phi"></span>
  <span id="kb_live_x"></span><span id="kb_live_y"></span>
  <span id="kb_live_vx"></span><span id="kb_live_vy"></span><span id="kb_live_vabs"></span>
  <span id="kb_live_ax"></span><span id="kb_live_ay"></span><span id="kb_live_aabs"></span>
</div>`;

export function initAspektKreisbahn(host) {
    host.innerHTML = `<div class="aspekt-scene">${SVG_SCENE}</div>${controls()}${LIVE_STUB}`;

    // Store auf den Positions-Aspekt gaten.
    Object.assign(store, {
        showPositionVector: true,
        showPositionComponents: true,
        showTrajectory: true,
        showVelocityVector: false, showVelocityComponents: false,
        showAccelerationVector: false, showAccelerationComponents: false,
        isDigitalDisplay: false,
    });

    initDOM();                 // fuellt den Sim-DOM-Cache (fehlende IDs -> null, unschaedlich)
    sceneCenters = setupScene();

    host.querySelectorAll('input[type="range"]').forEach(inp => {
        inp.addEventListener('input', () => readInputs(host));
    });
    readInputs(host);
}
