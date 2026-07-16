// figures/fig_9.js — gc9: 2D-Kreisbahn mit kreis/xy-Slider-Sync (Koordinaten
// vs. Polardarstellung). Nicht animiert. Wie fig_1: implizite Globals -> const.

import { ge, show, hide, linspace } from '../core.js';

export function update9(koords){
    const svg = ge("svg9");
    const pl = ge("poly9_angle");
    const phi_degree = parseFloat(ge("range9_phi").value);
    let phi = phi_degree/180*Math.PI;
    let r = parseFloat(ge("range9_r").value);
    var koord_x = parseFloat(ge("range9_x").value);
    var koord_y = parseFloat(ge("range9_y").value);

    if(koords == "kreis"){
        koord_x = r*Math.cos(phi);
        koord_y = r*Math.sin(phi);
        ge("range9_x").value = koord_x;
        ge("range9_y").value = koord_y;

    }
    else if(koords == "xy"){
        phi = Math.atan(koord_y/koord_x);
        if(koord_x >= 0 && koord_y >= 0) { }
        else if(koord_x < 0 && koord_y >= 0) { phi = phi + Math.PI; }
        else if(koord_x < 0 && koord_y < 0) { phi = phi + Math.PI; }
        else if(koord_x >= 0 && koord_y < 0) { phi = phi + 2*Math.PI; }
        r = Math.sqrt(koord_x**2+koord_y**2);
        ge("range9_phi").value = phi*180/Math.PI;
        ge("range9_r").value = r;
    }
    else { //body onload
        //alert("unerwarteter Fehler 178358");
    }



    const line2 = ge("line9_phi");
    const fo_R = ge("fo9_R");
    const fo_x = ge("fo9_x");
    const fo_y = ge("fo9_y");
    const fo_phi = ge("fo9_phi");
    const dot = ge("point9");

    //degree_to_fraction(phi_degree,360);

    ge("range9_phi_span").innerHTML = phi_degree + "°";
    //ge("range1_phi_span_fraction").innerHTML=to_fraction(phi/Math.PI);
    //ge("range9_phi_span_fraction").innerHTML=degree_to_fraction(phi_degree);
    ge("range9_r_span").innerHTML = (r/100).toFixed(2);
    ge("range9_x_span").innerHTML = (koord_x/100).toFixed(2);
    ge("range9_y_span").innerHTML = (koord_y/100).toFixed(2);



    pl.points.clear();
        for(let i=0; i<=linspace; i++) {
        let p = pl.points.appendItem(svg.createSVGPoint());
        p.x = r/2*Math.cos(phi*i/linspace);
        p.y = -r/2*Math.sin(phi*i/linspace);
    }

    ge("circle9").setAttribute("r",r);



    line2.setAttribute("x2",r*Math.cos(phi));
    line2.setAttribute("y2",-r*Math.sin(phi));
    dot.setAttribute("cx",r*Math.cos(phi));
    dot.setAttribute("cy",-r*Math.sin(phi));
    fo_R.setAttribute("x",0.8*r*Math.cos(phi));
    fo_R.setAttribute("y",-0.8*r*Math.sin(phi));
    fo_phi.setAttribute("x",r/2*Math.cos(phi/2));
    fo_phi.setAttribute("y",-r/2*Math.sin(phi/2));

    ge("fo9_x").setAttribute("x",ge("line9_koord_x").getAttribute("x2"));
    ge("fo9_x").setAttribute("y",ge("line9_koord_x").getAttribute("y2"));
    ge("fo9_y").setAttribute("x",ge("line9_koord_y").getAttribute("x2"));
    ge("fo9_y").setAttribute("y",ge("line9_koord_y").getAttribute("y2"));

    ge("line9_x").setAttribute("x1",koord_x);
    ge("line9_x").setAttribute("x2",koord_x);
    ge("line9_x").setAttribute("y1",0);
    ge("line9_x").setAttribute("y2",-koord_y);

    ge("line9_y").setAttribute("y1",-koord_y);
    ge("line9_y").setAttribute("y2",-koord_y);
    ge("line9_y").setAttribute("x1",0);
    ge("line9_y").setAttribute("x2",koord_x);



    show("fo9_phi");
    show("poly9_angle");
    if(phi==0) {
        hide("fo9_phi");
        hide("poly9_angle");
    }
}

window.update9 = update9;