// figures/factory.js — Per-Figure-Fabrik (Stage 3).
// createFigure fasst die gemeinsame Boilerplate aller animierten 3D-Kreisbahn-
// Figuren zusammen: rAF-Loop (~10 ms Akkumulator, ersetzt rekursives
// setTimeout(...,10)), Reentry-Guard, Slider-Snap, phi-Wrap + Revolutions-
// zaehler (state.n), gecachte statische Kreis-p3d (statt 100-Punkte-
// AppendItem pro Frame -- transform_polyline leitet points ohnehin aus p3d
// ab), Koordinaten-Transform + fo-Kopie, phi_span-Block. Pro Figur nur noch
// Hooks: render, step, wrap, condition, snap (optional clear). updateN /
// animateN / clearN werden via window[...] exponiert, damit update_all und der
// data-action-Binder unverändert arbeiten.
//
// Zusaetzlich die gemeinsam genutzten Hook-Funktionen der reinen omega-Kreis-
// familie (gc3/31/32/6): circleStep/circleWrap/omegaCondition/omegaSnap/
// circleRender.

import { ge, show, hide, linspace, speed_factor } from '../core.js';
import { to2d, transform_line, transform_polyline } from '../transform.js';

export function createFigure(cfg){
    const P = cfg.id;
    const state = { n: 0, runs: false, raf: null, last: 0, r8: 100 };
    const circle = { key: null };

    const ctx = {
        P: P,
        state: state,
        setCircleP3d: function(radius, z){
            const key = radius + "," + z;
            if(key === circle.key) return;
            circle.key = key;
            let p3d = "";
            for(let i=0; i<=linspace; i++){
                const px = radius*Math.cos(2*Math.PI*i/linspace);
                const py = radius*Math.sin(2*Math.PI*i/linspace);
                p3d += px+","+py+","+z+" ";
            }
            ge("poly"+P+"_circle").setAttribute("p3d",p3d);
        },
        transformKoord: function(perspective){
            transform_polyline("poly"+P+"_circle",perspective);
            transform_line("line"+P+"_koord_x",perspective);
            transform_line("line"+P+"_koord_y",perspective);
            transform_line("line"+P+"_koord_z",perspective);
            ge("fo"+P+"_x").setAttribute("x",ge("line"+P+"_koord_x").getAttribute("x2"));
            ge("fo"+P+"_x").setAttribute("y",ge("line"+P+"_koord_x").getAttribute("y2"));
            ge("fo"+P+"_y").setAttribute("x",ge("line"+P+"_koord_y").getAttribute("x2"));
            ge("fo"+P+"_y").setAttribute("y",ge("line"+P+"_koord_y").getAttribute("y2"));
            ge("fo"+P+"_z").setAttribute("x",ge("line"+P+"_koord_z").getAttribute("x2"));
            ge("fo"+P+"_z").setAttribute("y",ge("line"+P+"_koord_z").getAttribute("y2"));
        },
        phiSpan: function(phi_degree){
            const s = ge("range"+P+"_phi_span");
            if(state.n >= 0){
                s.innerHTML = phi_degree + "°";
                if(state.n != 0){ s.innerHTML += " + " + state.n + " * 360°"; }
            }
            else {
                s.innerHTML = "- " + (360-phi_degree) + "° ";
                if(state.n != -1){ s.innerHTML += + state.n+1 + " * 360°"; }
            }
        }
    };

    function scheduleNext(){
        state.last = performance.now();
        const loop = function(t){
            if(t - state.last >= 10){ state.last = t; tick(); }
            else { state.raf = requestAnimationFrame(loop); }
        };
        state.raf = requestAnimationFrame(loop);
    }

    function tick(){
        cfg.step(ctx);
        if(cfg.condition(ctx)){
            cfg.wrap(ctx);
            scheduleNext();
        }
        else { state.runs = false; }
        cfg.render(ctx);
    }

    function animate(){
        cfg.snap(ctx);
        if(!state.runs && cfg.condition(ctx)){ state.runs = true; tick(); }
        else if(state.runs && !cfg.condition(ctx)){ state.runs = false; }
        else if(!state.runs && !cfg.condition(ctx)){
            if(ge("pause"+P).value == "Play") ge("pause"+P).click();
        }
    }

    function update(arg){ cfg.render(ctx, arg); }
    ctx.update = update;

    if(cfg.tail) ctx.tail = [];

    window["update"+P] = update;
    window["animate"+P] = animate;
    if(cfg.clear) window["clear"+P] = cfg.clear(ctx);
    return ctx;
}

// --- gemeinsam genutzte Hook-Funktionen (reine omega-Kreisbahn-Familie) ---
export function circleStep(ctx){
    const P = ctx.P;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    const ome = parseFloat(ge("range"+P+"_w").value);
    const omega = ome/10*speed_factor;
    ge("range"+P+"_phi").value = phi+omega;
    ctx.phi = phi; ctx.ome = ome;
}
export function circleWrap(ctx){
    const P = ctx.P;
    if(ctx.phi > 6.27){ ge("range"+P+"_phi").value = ctx.phi-6.27; ctx.state.n++; }
    if(ctx.phi == 0 && ctx.ome < 0){ ge("range"+P+"_phi").value = ctx.phi+6.27; ctx.state.n--; }
}
export function omegaCondition(ctx){
    const P = ctx.P;
    return ge("pause"+P).value == "Pause" && parseFloat(ge("range"+P+"_w").value) != 0;
}
export function omegaSnap(ctx){
    const P = ctx.P;
    const e = ge("range"+P+"_w");
    if(Math.abs(parseFloat(e.value)) < 0.1) e.value = 0;
}
export function circleRender(opts){
    const hasW = opts.hasW, hasA = opts.hasA;
    return function(ctx){
        const P = ctx.P;
        const perspective = ge("select"+P).value;
        const phi = parseFloat(ge("range"+P+"_phi").value);
        const phi_degree = Math.round(phi/Math.PI * 180);
        const omega = parseFloat(ge("range"+P+"_w").value);

        transform_line("line"+P+"_phi",perspective);
        ctx.setCircleP3d(100,0);

        const v = [Math.cos(phi)*100, Math.sin(phi)*100, 0];
        const v2 = [v[0]-Math.cos(Math.PI/2-phi)*omega*100, v[1]+Math.sin(Math.PI/2-phi)*omega*100, 0];
        const v_a = [(1-0.8*Math.abs(omega))*v[0], (1-0.8*Math.abs(omega))*v[1], 0];
        const x = to2d(v,perspective)[0];
        const y = to2d(v,perspective)[1];
        const x_a = to2d(v_a,perspective)[0];
        const y_a = to2d(v_a,perspective)[1];

        ge("point"+P).setAttribute("cx",x);
        ge("point"+P).setAttribute("cy",y);
        ge("line"+P+"_phi").setAttribute("x2",x);
        ge("line"+P+"_phi").setAttribute("y2",y);
        ge("line"+P+"_v").setAttribute("x1",x);
        ge("line"+P+"_v").setAttribute("y1",y);
        ge("line"+P+"_v").setAttribute("x2",to2d(v2,perspective)[0]);
        ge("line"+P+"_v").setAttribute("y2",to2d(v2,perspective)[1]);
        if(hasA){
            ge("line"+P+"_a").setAttribute("x1",x);
            ge("line"+P+"_a").setAttribute("y1",y);
            ge("line"+P+"_a").setAttribute("x2",x_a);
            ge("line"+P+"_a").setAttribute("y2",y_a);
        }
        if(hasW){
            ge("line"+P+"_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);
        }

        ctx.transformKoord(perspective);

        ge("fo"+P+"_v").setAttribute("x",ge("line"+P+"_v").getAttribute("x2"));
        ge("fo"+P+"_v").setAttribute("y",ge("line"+P+"_v").getAttribute("y2"));
        if(hasW){
            ge("fo"+P+"_w").setAttribute("x",ge("line"+P+"_w").getAttribute("x2"));
            ge("fo"+P+"_w").setAttribute("y",ge("line"+P+"_w").getAttribute("y2"));
        }
        if(hasA){
            ge("fo"+P+"_a").setAttribute("x",ge("line"+P+"_a").getAttribute("x2"));
            ge("fo"+P+"_a").setAttribute("y",ge("line"+P+"_a").getAttribute("y2"));
        }

        ctx.phiSpan(phi_degree);

        show("line"+P+"_v");
        if(hasW) show("line"+P+"_w");
        if(hasA) show("line"+P+"_a");
        show("line"+P+"_koord_z");
        if(hasW) show("fo"+P+"_w");
        show("fo"+P+"_v");
        show("fo"+P+"_z");
        if(hasA) show("fo"+P+"_a");
        hide("range"+P+"_w_span_l0");
        hide("range"+P+"_w_span_e0");
        hide("range"+P+"_w_span_g0");
        if(omega == 0){
            hide("line"+P+"_v");
            if(hasW){ hide("line"+P+"_w"); hide("fo"+P+"_w"); }
            if(hasA){ hide("line"+P+"_a"); hide("fo"+P+"_a"); }
            hide("fo"+P+"_v");
            show("range"+P+"_w_span_e0");
        }
        else if(omega > 0){ show("range"+P+"_w_span_g0"); }
        else if(omega < 0){ show("range"+P+"_w_span_l0"); }
        if(perspective == 1){
            hide("line"+P+"_koord_z");
            hide("fo"+P+"_z");
            if(hasW){ hide("line"+P+"_w"); hide("fo"+P+"_w"); }
        }

        ge("pause"+P).removeAttribute("disabled");
        if(omega == 0) ge("pause"+P).setAttribute("disabled","true");
    };
}