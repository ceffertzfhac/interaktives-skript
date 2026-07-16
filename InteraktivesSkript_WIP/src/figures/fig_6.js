// figures/fig_6.js — gc6: geneigte Kreisbahn (z/beta-Sync), reiner omega-
// Antrieb. Eigener Render (tiltRender); die shared Hooks circleStep/Wrap/
// omegaCondition/omegaSnap passen (kein alpha, kein omega_r).

import { ge, show, hide } from '../core.js';
import { to2d, transform_line } from '../transform.js';
import { createFigure, circleStep, circleWrap, omegaCondition, omegaSnap } from './factory.js';

function tiltRender(ctx, arg){
    const P = ctx.P;
    const perspective = ge("select"+P).value;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    const omega = parseFloat(ge("range"+P+"_w").value);
    let z;
    if(arg == "beta"){
        const beta = parseFloat(ge("range"+P+"_beta").value);
        z = 100/Math.tan(beta*Math.PI/180);
        ge("range"+P+"_z").value = z;
    }
    else {
        z = parseFloat(ge("range"+P+"_z").value);
        const beta = Math.atan(100/z);
        ge("range"+P+"_beta").value = beta/Math.PI*180;
    }

    transform_line("line"+P+"_r",perspective);
    ctx.setCircleP3d(100,z);

    const v = [Math.cos(phi)*100, Math.sin(phi)*100, z];
    const v2 = [v[0]-Math.cos(Math.PI/2-phi)*omega*100, v[1]+Math.sin(Math.PI/2-phi)*omega*100, z];
    const v3 = [0, 0, z];
    const x_1 = to2d(v,perspective)[0];
    const y_1 = to2d(v,perspective)[1];
    const v_r = [v[0]*0.5, v[1]*0.5, v[2]*0.5];
    const x_r = to2d(v_r,perspective)[0];
    const y_r = to2d(v_r,perspective)[1];
    const v_R = [v[0]*0.5, v[1]*0.5, v[2]];
    const x_R = to2d(v_R,perspective)[0];
    const y_R = to2d(v_R,perspective)[1];

    ge("point"+P).setAttribute("cx",x_1);
    ge("point"+P).setAttribute("cy",y_1);
    ge("line"+P+"_r").setAttribute("x2",x_1);
    ge("line"+P+"_r").setAttribute("y2",y_1);
    ge("line"+P+"_v").setAttribute("x1",x_1);
    ge("line"+P+"_v").setAttribute("y1",y_1);
    ge("line"+P+"_R").setAttribute("x2",x_1);
    ge("line"+P+"_R").setAttribute("y2",y_1);
    ge("line"+P+"_R").setAttribute("x1",to2d(v3,perspective)[0]);
    ge("line"+P+"_R").setAttribute("y1",to2d(v3,perspective)[1]);
    ge("line"+P+"_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line"+P+"_v").setAttribute("y2",to2d(v2,perspective)[1]);
    ge("line"+P+"_w").setAttribute("y1",-z);
    ge("line"+P+"_w").setAttribute("y2",-z+to2d([0,0,100*omega],perspective)[1]);

    ctx.transformKoord(perspective);

    ge("fo"+P+"_v").setAttribute("x",ge("line"+P+"_v").getAttribute("x2"));
    ge("fo"+P+"_v").setAttribute("y",ge("line"+P+"_v").getAttribute("y2"));
    ge("fo"+P+"_w").setAttribute("x",ge("line"+P+"_w").getAttribute("x2"));
    ge("fo"+P+"_w").setAttribute("y",ge("line"+P+"_w").getAttribute("y2"));
    ge("fo"+P+"_r").setAttribute("x",x_r);
    ge("fo"+P+"_r").setAttribute("y",y_r);
    ge("fo"+P+"_R").setAttribute("x",x_R);
    ge("fo"+P+"_R").setAttribute("y",y_R);

    show("line"+P+"_v");
    show("line"+P+"_w");
    show("line"+P+"_koord_z");
    show("fo"+P+"_w");
    show("fo"+P+"_v");
    show("fo"+P+"_z");
    show("line"+P+"_koord_x");
    show("line"+P+"_koord_y");
    show("fo"+P+"_x");
    show("fo"+P+"_y");
    show("line"+P+"_r");
    show("fo"+P+"_r");
    if(omega == 0){
        hide("line"+P+"_v");
        hide("line"+P+"_w");
        hide("fo"+P+"_w");
        hide("fo"+P+"_v");
    }
    if(perspective == 1){
        hide("line"+P+"_koord_z");
        hide("line"+P+"_w");
        hide("line"+P+"_r");
        hide("fo"+P+"_r");
        hide("fo"+P+"_w");
        hide("fo"+P+"_z");
    }
    if(perspective == 3){
        hide("line"+P+"_koord_x");
        hide("line"+P+"_koord_y");
        hide("fo"+P+"_x");
        hide("fo"+P+"_y");
    }

    ge("pause"+P).removeAttribute("disabled");
    if(omega == 0) ge("pause"+P).setAttribute("disabled","true");
}
createFigure({id:"6", render:tiltRender, step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});