// transform.js — 3D->2D-Projektion und SVG-Transformationshelfer.
// to2d ist rein; transform_line/transform_polyline/ga greifen via ge() auf
// Elementattribute zu.

import { ge } from './core.js';

export function to2d(d3,perspective) {
    let x = 0;
    let y = 0;

    if(perspective == 1) {
        x = d3[0];
        y = -d3[1];
    }
    else if(perspective == 2) {
        x = d3[1] - d3[0]/2;
        y = - d3[2] + d3[0]/2;
    }
    else if(perspective == 3) {
        x = 0.866*(d3[1]-d3[0]);
        y = - d3[2] + d3[0]/2 +d3[1]/2;
    }
    else if(perspective == 4) {
        x = d3[0];
        y = - d3[2];
    }

    return [x,y];
}
export function transform_line(element_id, perspective) {
    const e = ge(element_id);
    const d31 = ga(element_id,"d31");
    const d32 = ga(element_id,"d32");
    e.setAttribute("x1",to2d(d31,perspective)[0]);
    e.setAttribute("y1",to2d(d31,perspective)[1]);
    e.setAttribute("x2",to2d(d32,perspective)[0]);
    e.setAttribute("y2",to2d(d32,perspective)[1]);
}
export function transform_polyline(element_id,perspective){
    const pl = ge(element_id);
    if(pl.getAttribute("p3d") == ""){
        const p = ""
        return p;
    }
    else {
        let p = "";
        if (pl.getAttribute("p3d").includes(" ")) {
            const p3d = pl.getAttribute("p3d").split(" ");
            for (let i=0; i < p3d.length-1;i++) {
                p3d[i] =  p3d[i].split(",");
                p += to2d(p3d[i],perspective);
                p += " ";
            }
        }
        else {
            const p3d = pl.getAttribute("p3d").split(",");
            p = to2d(p3d,perspective);
        }

        pl.setAttribute("points",p);

        return p;
    }
}

export function ga(element_id,attr) { //get attribute
    return ge(element_id).getAttribute(attr).split(",");
}