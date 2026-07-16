// figures/fig_1.js — gc1: 2D-Kreisbogen mit phi0-Offset (Winkelvisualisierung).
// Nicht animiert; baut den Bogen ueber polyline.points (SVGPointList). Der
// ESM-strict-mode erfordert explizite Deklarationen (urspruenglich implizite
// Globals); alle hier lokal als const/let -- Werte wurden nie figurenueber-
// greifend gelesen, daher verhaltenserhaltend.

import { ge, show, hide, linspace, degree_to_fraction } from '../core.js';

export function update1(){
    const svg = ge("svg1");
    const pl = ge("poly1_angle");
    const phi0 = parseFloat(ge("range1_phi0").value/180*Math.PI);
    const phi_degree = parseFloat(ge("range1_phi").value);
    const phi = phi_degree/180*Math.PI;
    const line1 = ge("line1_phi0");
    const line2 = ge("line1_phi");
    const fo_R = ge("fo1_R");
    const fo_phi = ge("fo1_phi");
    const fo_phi0 = ge("fo1_phi0");
    const dot = ge("point1");
    var r = parseFloat(ge("range1_r").value);

    degree_to_fraction(phi_degree,360);

    ge("range1_phi_span").innerHTML = phi_degree + "°";
    //ge("range1_phi_span_fraction").innerHTML=to_fraction(phi/Math.PI);
    ge("range1_phi_span_fraction").innerHTML=degree_to_fraction(phi_degree);
    ge("range1_r_span").innerHTML = r/100;



    pl.points.clear();
        for(let i=0; i<=linspace; i++) {
        let p = pl.points.appendItem(svg.createSVGPoint());
        p.x = r/2*Math.cos(phi*i/linspace+phi0);
        p.y = -r/2*Math.sin(phi*i/linspace+phi0);
    }

    ge("circle1").setAttribute("r",r);

    line1.setAttribute("x2",r*Math.cos(phi0));
    line1.setAttribute("y2",-r*Math.sin(phi0));
    fo_phi0.setAttribute("x",r*Math.cos(phi0));
    fo_phi0.setAttribute("y",-r*Math.sin(phi0));


    line2.setAttribute("x2",r*Math.cos(phi+phi0));
    line2.setAttribute("y2",-r*Math.sin(phi+phi0));
    dot.setAttribute("cx",r*Math.cos(phi+phi0));
    dot.setAttribute("cy",-r*Math.sin(phi+phi0));
    fo_R.setAttribute("x",0.8*r*Math.cos(phi+phi0));
    fo_R.setAttribute("y",-0.8*r*Math.sin(phi+phi0));
    fo_phi.setAttribute("x",r/2*Math.cos(phi/2+phi0));
    fo_phi.setAttribute("y",-r/2*Math.sin(phi/2+phi0));

    show("fo1_phi");
    show("poly1_angle");
    show("line1_phi0");
    if(phi==0) {
        hide("fo1_phi");
        hide("poly1_angle");
        hide("line1_phi0");
    }
}

window.update1 = update1;