// figures/fig_5.js — gc5/gc51: omega + alpha (Tangentialbeschleunigung).
// gc5 hat zusaetzlich den omega- und alpha-Vektor (hasW=true), gc51 nur die
// Beschleunigungskomponenten. Hooks sind figurenspezifisch (alpha*) und hier
// lokal; circleStep/Wrap wuerden nicht passen (alpha-Integration, clamp).

import { ge, show, hide, speed_factor } from '../core.js';
import { to2d, transform_line } from '../transform.js';
import { createFigure } from './factory.js';

function alphaStep(ctx){
    const P = ctx.P;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    let ome = parseFloat(ge("range"+P+"_w").value);
    const alp = parseFloat(ge("range"+P+"_a").value);
    ome = ome + alp/200;
    ge("range"+P+"_w").value = ome;
    const omega = ome/10*speed_factor;
    ge("range"+P+"_phi").value = phi+omega;
    ctx.phi = phi; ctx.ome = ome; ctx.omega = omega;
    // |ome|>=1-Begrenzung (aus do_animation5/51): alpha wird geloescht,
    // min/max-Span eingeblendet. Laeuft jeden Tick (wie im Original).
    hide("range"+P+"_w_span_min");
    hide("range"+P+"_w_span_max");
    if(Math.abs(ome) >= 1){
        ge("range"+P+"_a").value = 0;
        if(ome <= -1){ show("range"+P+"_w_span_min"); hide("range"+P+"_w_span_l0"); }
        else if(ome >= -1){ show("range"+P+"_w_span_max"); hide("range"+P+"_w_span_g0"); }
    }
}
function alphaWrap(opts){
    return function(ctx){
        const P = ctx.P;
        if(ctx.phi > 6.27){ ge("range"+P+"_phi").value = ctx.phi-6.27; opts.onRevolutionForward(ctx); }
        if(ctx.phi == 0 && ctx.omega < 0){ ge("range"+P+"_phi").value = ctx.phi+6.27; ctx.state.n--; }
    };
}
function alphaCondition(ctx){
    const P = ctx.P;
    return ge("pause"+P).value == "Pause" &&
        (parseFloat(ge("range"+P+"_w").value) != 0 || parseFloat(ge("range"+P+"_a").value) != 0);
}
function alphaSnap(ctx){
    const P = ctx.P;
    const we = ge("range"+P+"_w");
    const ae = ge("range"+P+"_a");
    if(Math.abs(parseFloat(we.value)) < 0.1 && parseFloat(ae.value) == 0) we.value = 0;
    if(Math.abs(parseFloat(ae.value)) < 0.1) ae.value = 0;
}
function alphaRender(opts){
    const hasW = opts.hasW;
    return function(ctx){
        const P = ctx.P;
        const perspective = ge("select"+P).value;
        const phi = parseFloat(ge("range"+P+"_phi").value);
        const phi_degree = Math.round(phi/Math.PI * 180);
        const omega = parseFloat(ge("range"+P+"_w").value);
        const alpha = parseFloat(ge("range"+P+"_a").value);

        transform_line("line"+P+"_phi",perspective);
        ctx.setCircleP3d(100,0);

        const v = [Math.cos(phi)*100, Math.sin(phi)*100, 0];
        const v2 = [v[0]-Math.cos(Math.PI/2-phi)*omega*100, v[1]+Math.sin(Math.PI/2-phi)*omega*100, 0];
        const v_a_r = [(1-0.8*Math.abs(omega))*v[0], (1-0.8*Math.abs(omega))*v[1], 0];
        const v_a_t = [v[0]-Math.cos(Math.PI/2-phi)*alpha*60, v[1]+Math.sin(Math.PI/2-phi)*alpha*60, 0];
        const x = to2d(v,perspective)[0];
        const y = to2d(v,perspective)[1];
        const x_a_r = to2d(v_a_r,perspective)[0];
        const y_a_r = to2d(v_a_r,perspective)[1];

        ge("point"+P).setAttribute("cx",x);
        ge("point"+P).setAttribute("cy",y);
        ge("line"+P+"_phi").setAttribute("x2",x);
        ge("line"+P+"_phi").setAttribute("y2",y);
        ge("line"+P+"_v").setAttribute("x1",x);
        ge("line"+P+"_v").setAttribute("y1",y);
        ge("line"+P+"_v").setAttribute("x2",to2d(v2,perspective)[0]);
        ge("line"+P+"_v").setAttribute("y2",to2d(v2,perspective)[1]);
        ge("line"+P+"_a_t").setAttribute("x1",x);
        ge("line"+P+"_a_t").setAttribute("y1",y);
        ge("line"+P+"_a_t").setAttribute("x2",to2d(v_a_t,perspective)[0]);
        ge("line"+P+"_a_t").setAttribute("y2",to2d(v_a_t,perspective)[1]);
        ge("line"+P+"_a_r").setAttribute("x1",x);
        ge("line"+P+"_a_r").setAttribute("y1",y);
        ge("line"+P+"_a_r").setAttribute("x2",x_a_r);
        ge("line"+P+"_a_r").setAttribute("y2",y_a_r);
        if(hasW){
            ge("line"+P+"_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);
            ge("line"+P+"_alpha").setAttribute("y2",to2d([0,0,50*alpha],perspective)[1]);
        }

        ctx.transformKoord(perspective);

        ge("fo"+P+"_v").setAttribute("x",ge("line"+P+"_v").getAttribute("x2"));
        ge("fo"+P+"_v").setAttribute("y",ge("line"+P+"_v").getAttribute("y2"));
        if(hasW){
            ge("fo"+P+"_w").setAttribute("x",ge("line"+P+"_w").getAttribute("x2"));
            ge("fo"+P+"_w").setAttribute("y",ge("line"+P+"_w").getAttribute("y2"));
            ge("fo"+P+"_alpha").setAttribute("x",ge("line"+P+"_alpha").getAttribute("x2"));
            ge("fo"+P+"_alpha").setAttribute("y",ge("line"+P+"_alpha").getAttribute("y2"));
        }
        ge("fo"+P+"_a_r").setAttribute("x",ge("line"+P+"_a_r").getAttribute("x2"));
        ge("fo"+P+"_a_r").setAttribute("y",ge("line"+P+"_a_r").getAttribute("y2"));
        ge("fo"+P+"_a_t").setAttribute("x",ge("line"+P+"_a_t").getAttribute("x2"));
        ge("fo"+P+"_a_t").setAttribute("y",ge("line"+P+"_a_t").getAttribute("y2"));

        ctx.phiSpan(phi_degree);

        show("line"+P+"_v");
        if(hasW){ show("line"+P+"_w"); show("line"+P+"_alpha"); }
        show("line"+P+"_a_r");
        show("line"+P+"_a_t");
        show("line"+P+"_koord_z");
        if(hasW){ show("fo"+P+"_w"); show("fo"+P+"_alpha"); }
        show("fo"+P+"_v");
        show("fo"+P+"_z");
        show("fo"+P+"_a_r");
        show("fo"+P+"_a_t");
        hide("range"+P+"_w_span_g0");
        hide("range"+P+"_w_span_e0");
        hide("range"+P+"_w_span_l0");
        hide("range"+P+"_a_span_g0");
        hide("range"+P+"_a_span_e0");
        hide("range"+P+"_a_span_l0");
        if(omega == 0){
            hide("line"+P+"_v");
            if(hasW){ hide("line"+P+"_w"); hide("fo"+P+"_w"); }
            hide("line"+P+"_a_r");
            hide("fo"+P+"_v");
            hide("fo"+P+"_a_r");
            show("range"+P+"_w_span_e0");
        }
        else if(omega > 0 && omega < 1){ show("range"+P+"_w_span_g0"); }
        else if(omega < 0 && omega > -1){ show("range"+P+"_w_span_l0"); }
        if(perspective == 1){
            hide("line"+P+"_koord_z");
            hide("fo"+P+"_z");
            if(hasW){ hide("line"+P+"_w"); hide("fo"+P+"_w"); }
        }
        if(alpha == 0){
            hide("line"+P+"_a_t");
            if(hasW) hide("line"+P+"_alpha");
            hide("fo"+P+"_a_t");
            if(hasW) hide("fo"+P+"_alpha");
            show("range"+P+"_a_span_e0");
        }
        else if(alpha > 0){ show("range"+P+"_a_span_g0"); }
        else if(alpha < 0){ show("range"+P+"_a_span_l0"); }

        ge("pause"+P).removeAttribute("disabled");
        if(omega == 0 && alpha == 0) ge("pause"+P).setAttribute("disabled","true");
    };
}

const fig5 = createFigure({id:"5", render:alphaRender({hasW:true}), step:alphaStep,
    wrap:alphaWrap({onRevolutionForward: function(ctx){ ctx.state.n++; }}),
    condition:alphaCondition, snap:alphaSnap});
// BUG (aus Legacy, bewusst erhalten): do_animation51 inkrementiert im >6.27-Zweig
// gc5_n statt gc51_n (Copy-Paste-Fehler). ctx.state.n++ wuerde es "reparieren";
// wir halten das Originalverhalten bei und markieren die Stelle. Bei Bedarf als
// eigener Fix aufwaermen.
createFigure({id:"51", render:alphaRender({hasW:false}), step:alphaStep,
    wrap:alphaWrap({onRevolutionForward: function(ctx){ fig5.state.n++; }}),
    condition:alphaCondition, snap:alphaSnap});