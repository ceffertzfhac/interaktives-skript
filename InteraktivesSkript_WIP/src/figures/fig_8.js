// figures/fig_8.js — gc8: Radialgeschwindigkeit (omega_r) + Spur (tail),
// variabler Radius r8. Eigene Hooks (tail*); circleWrap passt (ome<0-Spawn).

import { ge, show, hide, speed_factor } from '../core.js';
import { to2d, transform_line, transform_polyline } from '../transform.js';
import { createFigure, circleWrap } from './factory.js';

function tailRender(ctx){
    const P = ctx.P;
    const perspective = ge("select"+P).value;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    const phi_degree = Math.round(phi/Math.PI * 180);
    const omega = parseFloat(ge("range"+P+"_w").value);
    const omega_r = parseFloat(ge("range"+P+"_w_r").value);
    const r8 = ctx.state.r8;

    transform_line("line"+P+"_phi",perspective);
    ctx.setCircleP3d(r8,0);

    const v = [Math.cos(phi)*r8, Math.sin(phi)*r8, 0];
    const v2 = [v[0]-Math.cos(Math.PI/2-phi)*omega*r8, v[1]+Math.sin(Math.PI/2-phi)*omega*r8, 0];
    const v_a = [(1-0.8*Math.abs(omega))*v[0], (1-0.8*Math.abs(omega))*v[1], 0];
    const v_r = [(1+omega_r*50/r8)*v[0], (1+omega_r*50/r8)*v[1], 0];
    const x = to2d(v,perspective)[0];
    const y = to2d(v,perspective)[1];
    const x_a = to2d(v_a,perspective)[0];
    const y_a = to2d(v_a,perspective)[1];

    // Spur als Array (P1-Item 9): bisher p3d-String mit split/join; Array ist
    // aequivalent. transform_polyline liest p3d und projiziert (laeszt wie im
    // Original den letzten Punkt beim includes(" ")-Zweig weg).
    ctx.tail.push(v[0]+","+v[1]+",0");
    if(ctx.tail.length >= 1000) ctx.tail.shift();
    ge("poly"+P+"_tail").setAttribute("p3d", ctx.tail.join(" "));
    transform_polyline("poly"+P+"_tail",perspective);

    // r8-Begrenzung [0,170] (aus Legacy, bewusst unverändert): hart Reset der
    // (Radial-)Geschwindigkeit, damit die Figur stabil bleibt.
    if(ctx.state.r8 < 0){
        ctx.state.r8 = 0;
        ge("range"+P+"_w_r").value = 0;
        ge("range"+P+"_w").value = 0;
    }
    else if(ctx.state.r8 > 170){
        ctx.state.r8 = 170;
        ge("range"+P+"_w_r").value = 0;
    }

    ge("point"+P).setAttribute("cx",x);
    ge("point"+P).setAttribute("cy",y);
    ge("line"+P+"_phi").setAttribute("x2",x);
    ge("line"+P+"_phi").setAttribute("y2",y);
    ge("line"+P+"_v").setAttribute("x1",x);
    ge("line"+P+"_v").setAttribute("y1",y);
    ge("line"+P+"_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line"+P+"_v").setAttribute("y2",to2d(v2,perspective)[1]);
    ge("line"+P+"_v_r").setAttribute("x1",x);
    ge("line"+P+"_v_r").setAttribute("y1",y);
    ge("line"+P+"_v_r").setAttribute("x2",to2d(v_r,perspective)[0]);
    ge("line"+P+"_v_r").setAttribute("y2",to2d(v_r,perspective)[1]);
    ge("line"+P+"_a").setAttribute("x1",x);
    ge("line"+P+"_a").setAttribute("y1",y);
    ge("line"+P+"_a").setAttribute("x2",x_a);
    ge("line"+P+"_a").setAttribute("y2",y_a);
    ge("line"+P+"_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);

    ctx.transformKoord(perspective);

    ge("fo"+P+"_v").setAttribute("x",ge("line"+P+"_v").getAttribute("x2"));
    ge("fo"+P+"_v").setAttribute("y",ge("line"+P+"_v").getAttribute("y2"));
    ge("fo"+P+"_v_r").setAttribute("x",ge("line"+P+"_v_r").getAttribute("x2"));
    ge("fo"+P+"_v_r").setAttribute("y",ge("line"+P+"_v_r").getAttribute("y2"));
    ge("fo"+P+"_w").setAttribute("x",ge("line"+P+"_w").getAttribute("x2"));
    ge("fo"+P+"_w").setAttribute("y",ge("line"+P+"_w").getAttribute("y2"));
    ge("fo"+P+"_a").setAttribute("x",ge("line"+P+"_a").getAttribute("x2"));
    ge("fo"+P+"_a").setAttribute("y",ge("line"+P+"_a").getAttribute("y2"));

    show("line"+P+"_v");
    show("line"+P+"_v_r");
    show("line"+P+"_w");
    show("line"+P+"_a");
    show("line"+P+"_koord_z");
    show("fo"+P+"_w");
    show("fo"+P+"_v");
    show("fo"+P+"_v_r");
    show("fo"+P+"_z");
    show("fo"+P+"_a");
    if(omega == 0){
        hide("line"+P+"_v");
        hide("line"+P+"_w");
        hide("line"+P+"_a");
        hide("fo"+P+"_w");
        hide("fo"+P+"_v");
        hide("fo"+P+"_a");
    }
    if(perspective == 1){
        hide("line"+P+"_koord_z");
        hide("line"+P+"_w");
        hide("fo"+P+"_w");
        hide("fo"+P+"_z");
    }
    if(omega_r == 0){
        hide("line"+P+"_v_r");
        hide("fo"+P+"_v_r");
    }

    ge("pause"+P).removeAttribute("disabled");
    if(omega == 0) ge("pause"+P).setAttribute("disabled","true");
}
function tailStep(ctx){
    const P = ctx.P;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    const ome = parseFloat(ge("range"+P+"_w").value);
    const ome_r = parseFloat(ge("range"+P+"_w_r").value);
    const omega = ome/10*speed_factor;
    ge("range"+P+"_phi").value = phi+omega;
    ctx.state.r8 = ctx.state.r8 + ome_r/2;
    ctx.phi = phi; ctx.ome = ome;
}
function tailCondition(ctx){
    const P = ctx.P;
    return ge("pause"+P).value == "Pause" &&
        (parseFloat(ge("range"+P+"_w").value) != 0 || parseFloat(ge("range"+P+"_w_r").value) != 0);
}
function tailSnap(ctx){
    const P = ctx.P;
    const we = ge("range"+P+"_w");
    if(Math.abs(parseFloat(we.value)) < 0.1) we.value = 0;
    const re = ge("range"+P+"_w_r");
    if(Math.abs(parseFloat(re.value)) < 0.1) re.value = 0;
}
createFigure({id:"8", render:tailRender, step:tailStep, wrap:circleWrap, condition:tailCondition, snap:tailSnap, tail:true,
    clear: function(ctx){
        return function(){
            ctx.tail.length = 0;
            ge("poly"+ctx.P+"_tail").setAttribute("p3d","");
            transform_polyline("poly"+ctx.P+"_tail", ge("select"+ctx.P).value);
            ctx.update();
        };
    }});