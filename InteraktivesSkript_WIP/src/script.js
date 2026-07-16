var interaktiv = true; //statisches oder interaktives Skript
var darkmode_on = false;
var linspace = 100;
var auto_print = false; //Safari blocks autoprint...
var speed_factor = 1;

function init() {
    generate_highlight_boxes();
    safari_bug();
    generate_toc();
    offsetAnchor();
    make_static();
    if(interaktiv) {
        update_all();
    }
    from_qr();
    check_print();
}
function update_all() {
    update1();
    update9();
    update3();
    update31();
    update32();
    update5();
    update51();
    update6();
    update8();
}

function ge(element_id) { 
    return document.getElementById(element_id);
}

function show(element_id) {
    ge(element_id).classList.remove("hidden");
}
function hide(element_id) {
    ge(element_id).classList.add("hidden");
}
function toggle_visibility(element_id) {
    if(ge(element_id).classList.contains("hidden")) {
        show(element_id);
    }
    else {
        hide(element_id);
    }
}

function generate_highlight_boxes() {
    const boxes = [
        ["lernziel","target.svg"],
        ["motivation","star.svg"],
        ["wiederholung","head.svg"],
        ["beispiel","eye.svg"],
        ["zusammenfassung","noteblock.svg"],
        ["aufgabe","pen.svg"],
        ["anmerkung","eye.svg"]
    ];
    
    for (let l=0; l < boxes.length; l++) {
        a = document.getElementsByClassName(boxes[l][0]);
        for (let i=0; i < a.length; i++) {
            a_content = a[i].innerHTML;
            a[i].innerHTML="";
            a_title = document.createElement("div");
            a_title.setAttribute("class","highlight_box_title");
            a_title.innerHTML = capitalizeFirstLetter(boxes[l][0]);
            a[i].appendChild(a_title);

            a_img = document.createElement("img");
            a_img.setAttribute("src","src/assets/" + boxes[l][1]);
            a_img.setAttribute("class","highlight_box_img");
            a[i].appendChild(a_img);

            a[i].innerHTML+=a_content;
        }
    }
function capitalizeFirstLetter(string) { //foo -> Foo
    return string.charAt(0).toUpperCase() + string.slice(1);
}
}

function to2d(d3,perspective) {
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
function transform_line(element_id, perspective) {
    e = ge(element_id);
    d31 = ga(element_id,"d31");
    d32 = ga(element_id,"d32");
    e.setAttribute("x1",to2d(d31,perspective)[0]);
    e.setAttribute("y1",to2d(d31,perspective)[1]);
    e.setAttribute("x2",to2d(d32,perspective)[0]);
    e.setAttribute("y2",to2d(d32,perspective)[1]);
}
function transform_polyline(element_id,perspective){
    pl = ge(element_id);
    if(pl.getAttribute("p3d") == ""){
        p = ""
        return p;
    }
    else {
        p = "";
        if (pl.getAttribute("p3d").includes(" ")) {
            p3d = pl.getAttribute("p3d").split(" ");
            for (let i=0; i < p3d.length-1;i++) {
                p3d[i] =  p3d[i].split(",");
                p += to2d(p3d[i],perspective);
                p += " ";
            }
        }
        else {
            p3d = pl.getAttribute("p3d").split(",");            
            p = to2d(p3d,perspective);
        }

        pl.setAttribute("points",p);

        return p;
    }
}

function ga(element_id,attr) { //get attribute
    return ge(element_id).getAttribute(attr).split(",");
}
function safari_bug() { //mit Positionierung von Text im SVG
    const IS_SAFARI = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    fo = document.getElementsByClassName("fo_inner");
    if(IS_SAFARI){
        for(let i = 0;i<fo.length;i++) {
            fo[i].classList.add("fixed");
        }
    }
}
function degree_to_fraction(value){ //180 -> 1/2 , 181 -> 181/360
    gcd = gcd_rec(value,180);
    z = parseInt(value/gcd);
    n = parseInt(180/gcd);
    if(z==0) {
        r = 0;
    }
    else if(n == 1) {
        r = z;
    }
    else {
        r = z + "/" + n;
    }
    return r;    
}
function gcd_rec(a, b) { //größter gemeinsamer Teiler
    if (b) {
        return gcd_rec(b, a % b);
    } else {
        return Math.abs(a);
    }
}

function toggle_body_scroll() {
    const cl = document.body.classList;
    if(cl.contains("no_scroll")) {
        cl.remove("no_scroll");
    }
    else {
        cl.add("no_scroll");
    }
}

var zoom_enabled = false;

function zoom(parent_gc) {
    scource_div = parent_gc;
    show("zoom_overlay");
    target_div = ge("zoom_content");
    target_div.innerHTML = scource_div.innerHTML;
    target_div.firstElementChild.setAttribute("style","position:static;");
    //target_div.firstElementChild.classList.add("grafik-inner-zoom");
    show("zoom");
    if(zoom_enabled) {
        close_zoom();
        zoom_enabled = false;
    }
    else {
        zoom_enabled = true;
        toggle_body_scroll();
    }
       
    let wh = window.innerHeight-80;
    let ww = window.innerWidth-80;
    let th = target_div.clientHeight;
    let tw = target_div.clientWidth;
    let zoom_faktor = 1;
    zoom_faktor = Math.min(wh/th,ww/tw);
    if(zoom_faktor > 3){
        zoom_faktor = 3;
    }
    
    target_div.setAttribute("style","transform: scale("+zoom_faktor+");");   
    ge("zoom").setAttribute("style","width: " + (zoom_faktor*tw+20) + "px;height: " + (zoom_faktor*th+20) + "px;");  
    document.querySelector(".zoom_button").classList.add("zoom_minimize");
    
 
}

function close_zoom(){
    toggle_body_scroll();
    hide("zoom_overlay");
    hide("zoom");
    zoom_enabled = false;
    ge("zoom_content").innerHTML="";
    update_all();
}
function init_print() { //reopen in new tab
    let link = "";
    if(location.href.split("#").length==2) {
        link = location.href.split("#")[0]+"?print=true";
    }
    else {
        link = location.href+"?print=true";
    }
    window.open(link, '_blank').focus();
}
function check_print() { //check if this page was just opened in a new tab for printing
    if (findGetParameter("print") == "true") { 
        print_page();
    }
}

function print_page() {
    var pc = ge("print_container");
    pc.innerHTML = ge("container").innerHTML;
    show("print_container");
    show("print_instruction");
    hide("container");
    hide("header");
    hide("toc_container");
    
    const gci = pc.querySelectorAll(".grafik-container-inner");
    for(let i=0;i<gci.length;i++){
        gci[i].setAttribute("style","position:static;")
    }
    const zm = pc.querySelectorAll(".zoom_maximize");
    for(let i=0;i<zm.length;i++){
        zm[i].remove();
    }
    const gc = pc.querySelectorAll(".grafik-container");
    for(let i=0;i<gc.length;i++){
        create_qr(gc[i].id);
    }

    document.body.setAttribute("style","background-color:#fff;margin-top:0px;margin-left:100px;");
    
    if (auto_print) {
        window.print();
    }
}

window.addEventListener('afterprint', (event) => {
    window.history.replaceState(null, null, window.location.pathname);
});

function create_qr(element_id) {
    var div_container = document.createElement("div");
    var link = location.href.split("?")[0].split("#")[0]+"?g="+element_id;
    var div = document.createElement("div"),
    text = link,
    qr = QRCode.generateSVG(text, {
        ecclevel: "M",
        fillcolor: "#fff",
        textcolor: "#000",
        margin: 3,
        modulesize: 3
      });
    div.appendChild(qr);
    //ge(element_id).appendChild(div);
    div_container.appendChild(div);
    div_container.setAttribute("class","qr_container");

    var title2 = document.createElement("div");
    title2.setAttribute("class","qr_title");
    title2.innerHTML = "<a href='"+link+"'>"+link+"</a><br><br><i>Hinweis: Sie müssen im Ilias angemeldet sein</i>";
    div_container.appendChild(title2);
    

    ge(element_id).insertBefore(div_container,ge(element_id).firstChild);

}
function from_qr(){ //if user comes to this site via the qr code link
    g = findGetParameter("g");
    if(!interaktiv) { //statisch
        setTimeout(function(){
            if(g) {
                window.location = location.href.split("#")[0]+"#"+g;
                zoom(ge(g));

            }
        }, 100);
    }
    else { //interaktiv
        if(g) {
            window.location = location.href.split("#")[0]+"#"+g;
            zoom(ge(g));

        }
    }
}
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search.substr(1).split("&").forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}
function toc(){
    content = ge("toc_content");
    e_id = "toc_container";
    content.classList.remove("toc_hide");
    content.classList.remove("toc_show");
    if(ge(e_id).classList.contains("hidden")) {
        show(e_id);
        content.classList.add("toc_show");
    }
    else {
        content.classList.add("toc_hide");
        hide(e_id);
    }    
}
function generate_toc(){
    h = document.getElementsByClassName("inhaltsverzeichnis");
    toc_c = ge("toc_content");
    for (let i = 0;i<h.length;i++) {
        h[i].setAttribute("id","toc_"+i);
        t = h[i].innerHTML;
        toc_c.innerHTML += "<a href='#" + h[i].id + "' class='toc_" + h[i].tagName + "'>" + t + "</a><br>";
    }

    return h;
}
function kontakt() {
    if(window.scrollY >= 70) {
        show("kontakt");
    }
    else {
        toggle_visibility("kontakt");
    }
    window.scrollTo(0, 0);

}
function offsetAnchor() {
    if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 70);
    }
}
window.addEventListener("hashchange", offsetAnchor);

function pause(button) {
    //let gc_id = button.parentElement.parentElement.id.replace("gc","");
    if(button.value == "Pause") {
        button.value = "Play";
    }
    
    else if(button.value == "Play") {
        button.value = "Pause";
    }
    
    else {
        alert("ERROR: Pause Button unexpected value");
        }
}

function reset(){
    window.history.pushState("", "", window.location.href.split("#")[0]);

    document.location.reload();
    //window.location.href = window.location.href.split("#")[0];
}
function make_static(){ //interaktives Skript statisch machen für Evaluation
    if(!interaktiv){
        ge("gc4").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/image002.png" class="grafik" id="" draggable="false"><br><img src="bilder/image003.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc1").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/phi_0.png" class="grafik" id="" draggable="false"><br></div>';
        
        ge("gc9").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/kreis-xy_koord.png" class="grafik" id="" draggable="false"><br></div>';
        
        ge("gc31").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/geschwindigkeit.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc32").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/winkelgeschwindigkeit_v.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc51").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/beschleunigung.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc3").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/omega_vektor.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc5").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/winkelbeschleunigung.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc6").innerHTML = "";
        
        ge("gc8").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" onclick="zoom(this.parentElement.parentElement)"></div><img src="bilder/radialgeschwindigkeit.png" class="grafik" id="" draggable="false"></div>';
        
        
        reload_mathjax();
    }
}

// Osterei (Evaluation): Im Kontakt-Block sind einzelne Buchstaben klickbar.
//  - "ll" in "Falls"  -> test()           schaltet interaktiv/statisch um (make_static)
//  - "tt" in "bitte"  -> reload_mathjax()  re-rendert alle Formeln
// Bewusst gehalten, da test() der einzige Runtime-Weg ist, den statischen Modus
// (interaktiv=false) ohne Code-Änderung einzuschalten.
function test(){
    interaktiv = !interaktiv;
    make_static();
}
// MathJax v3 hat kein MathJax.Hub mehr (v2-API). typesetPromise() rendert
// (bzw. re-rendert) alle Formeln im Dokument; ohne geladenes MathJax no-op.
function reload_mathjax(){
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}
function toggle_darkmode(){
    darkmode_on = !darkmode_on;
    if(darkmode_on) {
        ge("darkmode_stylesheet").disabled=false
    }
    else {
        ge("darkmode_stylesheet").disabled=true
    }
}

/*******USER FUNCTIONS*******/

function update1(){
    svg = ge("svg1");
    pl = ge("poly1_angle");
    phi0 = parseFloat(ge("range1_phi0").value/180*Math.PI);
    phi_degree = parseFloat(ge("range1_phi").value);
    phi = phi_degree/180*Math.PI;
    line1 = ge("line1_phi0");
    line2 = ge("line1_phi");
    fo_R = ge("fo1_R");
    fo_phi = ge("fo1_phi");
    fo_phi0 = ge("fo1_phi0");
    dot = ge("point1");
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

function update9(koords){
    svg = ge("svg9");
    pl = ge("poly9_angle");
    phi_degree = parseFloat(ge("range9_phi").value);
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
    
    
    
    line2 = ge("line9_phi");
    fo_R = ge("fo9_R");
    fo_x = ge("fo9_x");
    fo_y = ge("fo9_y");
    fo_phi = ge("fo9_phi");
    dot = ge("point9");
    
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

var gc3_n = 0; //number of revolutions of phi

function update3(){
    svg = ge("svg3");
    pl_circle = ge("poly3_circle");
    pl_angle = ge("poly3_angle");
    perspective = ge("select3").value;
    phi = parseFloat(ge("range3_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range3_w").value);

    
    transform_line("line3_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3);
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = 0;
    
    v2 = new Array(3);
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = 0;
    
    
    v_a = new Array(3); //v_a radial
    v_a[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a[2] = 0;
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a = to2d(v_a,perspective)[0];
    y_a = to2d(v_a,perspective)[1];
    
    
    
    ge("point3").setAttribute("cx",x);
    ge("point3").setAttribute("cy",y);
    ge("line3_phi").setAttribute("x2",x);
    ge("line3_phi").setAttribute("y2",y);
    ge("line3_v").setAttribute("x1",x);
    ge("line3_v").setAttribute("y1",y);
    ge("line3_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line3_v").setAttribute("y2",to2d(v2,perspective)[1]);
    
    ge("line3_a").setAttribute("x1",x);
    ge("line3_a").setAttribute("y1",y);
    ge("line3_a").setAttribute("x2",x_a);
    ge("line3_a").setAttribute("y2",y_a);
    

    
    ge("line3_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);
    
    transform_polyline("poly3_circle",perspective);
    transform_line("line3_koord_x",perspective);
    transform_line("line3_koord_y",perspective);
    transform_line("line3_koord_z",perspective);
    
    ge("fo3_x").setAttribute("x",ge("line3_koord_x").getAttribute("x2"));
    ge("fo3_x").setAttribute("y",ge("line3_koord_x").getAttribute("y2"));
    ge("fo3_y").setAttribute("x",ge("line3_koord_y").getAttribute("x2"));
    ge("fo3_y").setAttribute("y",ge("line3_koord_y").getAttribute("y2"));
    ge("fo3_z").setAttribute("x",ge("line3_koord_z").getAttribute("x2"));
    ge("fo3_z").setAttribute("y",ge("line3_koord_z").getAttribute("y2"));
    
    ge("fo3_v").setAttribute("x",ge("line3_v").getAttribute("x2"));
    ge("fo3_v").setAttribute("y",ge("line3_v").getAttribute("y2"));
    ge("fo3_w").setAttribute("x",ge("line3_w").getAttribute("x2"));
    ge("fo3_w").setAttribute("y",ge("line3_w").getAttribute("y2"));    
    ge("fo3_a").setAttribute("x",ge("line3_a").getAttribute("x2"));
    ge("fo3_a").setAttribute("y",ge("line3_a").getAttribute("y2"));
    
    
    
    const phi_span = ge("range3_phi_span");
    
    if(gc3_n >= 0){
        phi_span.innerHTML = phi_degree + "°";
        if(gc3_n != 0) {
            //phi_span.innerHTML += " + " + gc3_n + " \\(*\\) 360°";
            phi_span.innerHTML += " + " + gc3_n + " * 360°";
        }
    }
    else {
        phi_span.innerHTML = "- " + (360-phi_degree) + "° ";
        if(gc3_n != -1) {
            phi_span.innerHTML += + gc3_n+1 + " * 360°";
        }
    }

    
    
    
    show("line3_v");
    show("line3_w");
    show("line3_a");
    show("line3_koord_z");
    show("fo3_w");
    show("fo3_v");
    show("fo3_z");
    show("fo3_a");
    hide("range3_w_span_l0");
    hide("range3_w_span_e0");
    hide("range3_w_span_g0");
    if(omega == 0) { 
        hide("line3_v"); 
        hide("line3_w"); 
        hide("line3_a"); 
        hide("fo3_w"); 
        hide("fo3_v"); 
        hide("fo3_a"); 
        show("range3_w_span_e0");
    }
    else if(omega > 0){
        show("range3_w_span_g0");

    }
    else if(omega < 0){
        show("range3_w_span_l0");
    }
    if(perspective == 1) { //top
        hide("line3_koord_z"); 
        hide("line3_w"); 
        hide("fo3_w"); 
        hide("fo3_z"); 
    } 
    if(omega == 0){

    }
    
    
    ge("pause3").removeAttribute("disabled");
    if(omega == 0) {
        ge("pause3").setAttribute("disabled","true");
    }
}

var animate3_runs = false;
function condition3() {
    let ome = parseFloat(ge("range3_w").value);
    if(ome != 0 && ge("pause3").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate3() {
    let ome = parseFloat(ge("range3_w").value);    
    
    if(Math.abs(ome) < 0.1) { //snap slider
        ome = 0;
        ge("range3_w").value = 0;
    }
    
    if(!animate3_runs && condition3() == true) {
            animate3_runs = true;
            do_animation3();
    }
    else if(animate3_runs && !condition3()) {
            animate3_runs = false;
    }
    else if(!animate3_runs && !condition3()) {
        if (ge("pause3").value == "Play") {
            ge("pause3").click(); 
        }
    }
    
}

function do_animation3() {
    phi = parseFloat(ge("range3_phi").value);
    ome = parseFloat(ge("range3_w").value);
    omega = ome/10*speed_factor;
    ge("range3_phi").value = phi+omega;
    
    if(condition3()) {
        if(phi>6.27) {
            ge("range3_phi").value = phi-6.27;
            gc3_n++;
        }
        if(phi == 0 && ome < 0) {
            ge("range3_phi").value = phi+6.27;
            gc3_n--;
        }
        setTimeout(function () {
            do_animation3();
        }, 10);
    }

    
    update3();
}

var gc32_n = 0; //number of revolutions of phi

function update32(){
    svg = ge("svg32");
    pl_circle = ge("poly32_circle");
    pl_angle = ge("poly32_angle");
    perspective = ge("select32").value;
    phi = parseFloat(ge("range32_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range32_w").value);

    
    transform_line("line32_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3);
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = 0;
    
    v2 = new Array(3);
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = 0;
    
    
    v_a = new Array(3); //v_a radial
    v_a[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a[2] = 0;
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a = to2d(v_a,perspective)[0];
    y_a = to2d(v_a,perspective)[1];
    
    
    
    ge("point32").setAttribute("cx",x);
    ge("point32").setAttribute("cy",y);
    ge("line32_phi").setAttribute("x2",x);
    ge("line32_phi").setAttribute("y2",y);
    ge("line32_v").setAttribute("x1",x);
    ge("line32_v").setAttribute("y1",y);
    ge("line32_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line32_v").setAttribute("y2",to2d(v2,perspective)[1]);
    

    
    
    transform_polyline("poly32_circle",perspective);
    transform_line("line32_koord_x",perspective);
    transform_line("line32_koord_y",perspective);
    transform_line("line32_koord_z",perspective);
    
    ge("fo32_x").setAttribute("x",ge("line32_koord_x").getAttribute("x2"));
    ge("fo32_x").setAttribute("y",ge("line32_koord_x").getAttribute("y2"));
    ge("fo32_y").setAttribute("x",ge("line32_koord_y").getAttribute("x2"));
    ge("fo32_y").setAttribute("y",ge("line32_koord_y").getAttribute("y2"));
    ge("fo32_z").setAttribute("x",ge("line32_koord_z").getAttribute("x2"));
    ge("fo32_z").setAttribute("y",ge("line32_koord_z").getAttribute("y2"));
    
    ge("fo32_v").setAttribute("x",ge("line32_v").getAttribute("x2"));
    ge("fo32_v").setAttribute("y",ge("line32_v").getAttribute("y2"));

    
    
    
    const phi_span = ge("range32_phi_span");
    
    if(gc32_n >= 0){
        phi_span.innerHTML = phi_degree + "°";
        if(gc32_n != 0) {
            //phi_span.innerHTML += " + " + gc3_n + " \\(*\\) 360°";
            phi_span.innerHTML += " + " + gc32_n + " * 360°";
        }
    }
    else {
        phi_span.innerHTML = "- " + (360-phi_degree) + "° ";
        if(gc32_n != -1) {
            phi_span.innerHTML += + gc32_n+1 + " * 360°";
        }
    }

    
    
    
    show("line32_v");
    show("line32_koord_z");
    show("fo32_v");
    show("fo32_z");
    hide("range32_w_span_l0");
    hide("range32_w_span_e0");
    hide("range32_w_span_g0");
    if(omega == 0) { 
        hide("line32_v"); 
        hide("fo32_v"); 
        show("range32_w_span_e0");
    }
    else if(omega > 0){
        show("range32_w_span_g0");

    }
    else if(omega < 0){
        show("range32_w_span_l0");
    }
    if(perspective == 1) { //top
        hide("line32_koord_z"); 
        hide("fo32_z"); 
    } 
    if(omega == 0){

    }
    
    
    ge("pause32").removeAttribute("disabled");
    if(omega == 0) {
        ge("pause32").setAttribute("disabled","true");
    }
}

var animate32_runs = false;
function condition32() {
    let ome = parseFloat(ge("range32_w").value);
    if(ome != 0 && ge("pause32").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate32() {
    let ome = parseFloat(ge("range32_w").value);    
    
    if(Math.abs(ome) < 0.1) { //snap slider
        ome = 0;
        ge("range32_w").value = 0;
    }
    
    if(!animate32_runs && condition32() == true) {
            animate32_runs = true;
            do_animation32();
    }
    else if(animate32_runs && !condition32()) {
            animate32_runs = false;
    }
    else if(!animate32_runs && !condition32()) {
        if (ge("pause32").value == "Play") {
            ge("pause32").click(); 
        }
    }
    
}

function do_animation32() {
    phi = parseFloat(ge("range32_phi").value);
    ome = parseFloat(ge("range32_w").value);
    omega = ome/10*speed_factor;
    ge("range32_phi").value = phi+omega;
    
    if(condition32()) {
        if(phi>6.27) {
            ge("range32_phi").value = phi-6.27;
            gc32_n++;
        }
        if(phi == 0 && ome < 0) {
            ge("range32_phi").value = phi+6.27;
            gc32_n--;
        }
        setTimeout(function () {
            do_animation32();
        }, 10);
    }

    
    update32();
}

var gc31_n = 0; //number of revolutions of phi

function update31(){
    svg = ge("svg31");
    pl_circle = ge("poly31_circle");
    pl_angle = ge("poly31_angle");
    perspective = ge("select31").value;
    phi = parseFloat(ge("range31_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range31_w").value);

    
    transform_line("line31_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3);
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = 0;
    
    v2 = new Array(3);
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = 0;
    
    
    v_a = new Array(3); //v_a radial
    v_a[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a[2] = 0;
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a = to2d(v_a,perspective)[0];
    y_a = to2d(v_a,perspective)[1];
    
    
    
    ge("point31").setAttribute("cx",x);
    ge("point31").setAttribute("cy",y);
    ge("line31_phi").setAttribute("x2",x);
    ge("line31_phi").setAttribute("y2",y);
    ge("line31_v").setAttribute("x1",x);
    ge("line31_v").setAttribute("y1",y);
    ge("line31_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line31_v").setAttribute("y2",to2d(v2,perspective)[1]);
    
    ge("line31_a").setAttribute("x1",x);
    ge("line31_a").setAttribute("y1",y);
    ge("line31_a").setAttribute("x2",x_a);
    ge("line31_a").setAttribute("y2",y_a);
    

    
    
    transform_polyline("poly31_circle",perspective);
    transform_line("line31_koord_x",perspective);
    transform_line("line31_koord_y",perspective);
    transform_line("line31_koord_z",perspective);
    
    ge("fo31_x").setAttribute("x",ge("line31_koord_x").getAttribute("x2"));
    ge("fo31_x").setAttribute("y",ge("line31_koord_x").getAttribute("y2"));
    ge("fo31_y").setAttribute("x",ge("line31_koord_y").getAttribute("x2"));
    ge("fo31_y").setAttribute("y",ge("line31_koord_y").getAttribute("y2"));
    ge("fo31_z").setAttribute("x",ge("line31_koord_z").getAttribute("x2"));
    ge("fo31_z").setAttribute("y",ge("line31_koord_z").getAttribute("y2"));
    
    ge("fo31_v").setAttribute("x",ge("line31_v").getAttribute("x2"));
    ge("fo31_v").setAttribute("y",ge("line31_v").getAttribute("y2"));
   
    ge("fo31_a").setAttribute("x",ge("line31_a").getAttribute("x2"));
    ge("fo31_a").setAttribute("y",ge("line31_a").getAttribute("y2"));
    
    
    
    const phi_span = ge("range31_phi_span");
    
    if(gc31_n >= 0){
        phi_span.innerHTML = phi_degree + "°";
        if(gc31_n != 0) {
            //phi_span.innerHTML += " + " + gc3_n + " \\(*\\) 360°";
            phi_span.innerHTML += " + " + gc31_n + " * 360°";
        }
    }
    else {
        phi_span.innerHTML = "- " + (360-phi_degree) + "° ";
        if(gc31_n != -1) {
            phi_span.innerHTML += + gc31_n+1 + " * 360°";
        }
    }

    
    
    
    show("line31_v");
    show("line31_a");
    show("line31_koord_z");
    show("fo31_v");
    show("fo31_z");
    show("fo31_a");
    hide("range31_w_span_l0");
    hide("range31_w_span_e0");
    hide("range31_w_span_g0");
    if(omega == 0) { 
        hide("line31_v"); 
        hide("line31_a"); 
        hide("fo31_v"); 
        hide("fo31_a"); 
        show("range31_w_span_e0");
    }
    else if(omega > 0){
        show("range31_w_span_g0");

    }
    else if(omega < 0){
        show("range31_w_span_l0");
    }
    if(perspective == 1) { //top
        hide("line31_koord_z"); 
        hide("fo31_z"); 
    } 
    if(omega == 0){

    }
    
    
    ge("pause31").removeAttribute("disabled");
    if(omega == 0) {
        ge("pause31").setAttribute("disabled","true");
    }
}

var animate31_runs = false;
function condition31() {
    let ome = parseFloat(ge("range31_w").value);
    if(ome != 0 && ge("pause31").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate31() {
    let ome = parseFloat(ge("range31_w").value);    
    
    if(Math.abs(ome) < 0.1) { //snap slider
        ome = 0;
        ge("range31_w").value = 0;
    }
    
    if(!animate31_runs && condition31() == true) {
            animate31_runs = true;
            do_animation31();
    }
    else if(animate31_runs && !condition31()) {
            animate31_runs = false;
    }
    else if(!animate31_runs && !condition31()) {
        if (ge("pause31").value == "Play") {
            ge("pause31").click(); 
        }
    }
    
}

function do_animation31() {
    phi = parseFloat(ge("range31_phi").value);
    ome = parseFloat(ge("range31_w").value);
    omega = ome/10*speed_factor;
    ge("range31_phi").value = phi+omega;
    
    if(condition31()) {
        if(phi>6.27) {
            ge("range31_phi").value = phi-6.27;
            gc31_n++;
        }
        if(phi == 0 && ome < 0) {
            ge("range31_phi").value = phi+6.27;
            gc31_n--;
        }
        setTimeout(function () {
            do_animation31();
        }, 10);
    }

    
    update31();
}

function update4() {
    img = ge("img4-1");
    if(ge("radio4-1").checked) {
        img.src="bilder/image002.png";
    }
    else {
        img.src="bilder/image003.png";
    }
}

var gc5_n = 0; //number of revolutions of phi

function update5(){
    svg = ge("svg5");
    pl_circle = ge("poly5_circle");
    pl_angle = ge("poly5_angle");
    perspective = ge("select5").value;
    phi = parseFloat(ge("range5_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range5_w").value);
    alpha = parseFloat(ge("range5_a").value);

    
    transform_line("line5_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3);
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = 0;
    
    v2 = new Array(3);
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = 0;
    
    
    v_a_r = new Array(3); //v_a radial
    v_a_r[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a_r[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a_r[2] = 0;
    
    v_a_t = new Array(3); //v_a tangential
    v_a_t[0] = v[0] - Math.cos(Math.PI/2-phi)*alpha*60;
    v_a_t[1] = v[1] + Math.sin(Math.PI/2-phi)*alpha*60;
    v_a_t[2] = 0;

    
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a_r = to2d(v_a_r,perspective)[0];
    y_a_r = to2d(v_a_r,perspective)[1];
    x_a_t = to2d(v_a_t,perspective)[0];
    y_a_t = to2d(v_a_t,perspective)[1];
    
    
    
    ge("point5").setAttribute("cx",x);
    ge("point5").setAttribute("cy",y);
    ge("line5_phi").setAttribute("x2",x);
    ge("line5_phi").setAttribute("y2",y);
    ge("line5_v").setAttribute("x1",x);
    ge("line5_v").setAttribute("y1",y);
    ge("line5_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line5_v").setAttribute("y2",to2d(v2,perspective)[1]);
    
    ge("line5_a_t").setAttribute("x1",x);
    ge("line5_a_t").setAttribute("y1",y);
    ge("line5_a_t").setAttribute("x2",to2d(v_a_t,perspective)[0]);
    ge("line5_a_t").setAttribute("y2",to2d(v_a_t,perspective)[1]);
    
    ge("line5_a_r").setAttribute("x1",x);
    ge("line5_a_r").setAttribute("y1",y);
    ge("line5_a_r").setAttribute("x2",x_a_r);
    ge("line5_a_r").setAttribute("y2",y_a_r);
    

    
    ge("line5_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);
    ge("line5_alpha").setAttribute("y2",to2d([0,0,50*alpha],perspective)[1]);
    
    transform_polyline("poly5_circle",perspective);
    transform_line("line5_koord_x",perspective);
    transform_line("line5_koord_y",perspective);
    transform_line("line5_koord_z",perspective);
    
    ge("fo5_x").setAttribute("x",ge("line5_koord_x").getAttribute("x2"));
    ge("fo5_x").setAttribute("y",ge("line5_koord_x").getAttribute("y2"));
    ge("fo5_y").setAttribute("x",ge("line5_koord_y").getAttribute("x2"));
    ge("fo5_y").setAttribute("y",ge("line5_koord_y").getAttribute("y2"));
    ge("fo5_z").setAttribute("x",ge("line5_koord_z").getAttribute("x2"));
    ge("fo5_z").setAttribute("y",ge("line5_koord_z").getAttribute("y2"));
    
    ge("fo5_v").setAttribute("x",ge("line5_v").getAttribute("x2"));
    ge("fo5_v").setAttribute("y",ge("line5_v").getAttribute("y2"));
    ge("fo5_w").setAttribute("x",ge("line5_w").getAttribute("x2"));
    ge("fo5_w").setAttribute("y",ge("line5_w").getAttribute("y2"));   
    ge("fo5_alpha").setAttribute("x",ge("line5_alpha").getAttribute("x2"));
    ge("fo5_alpha").setAttribute("y",ge("line5_alpha").getAttribute("y2")); 
    ge("fo5_a_r").setAttribute("x",ge("line5_a_r").getAttribute("x2"));
    ge("fo5_a_r").setAttribute("y",ge("line5_a_r").getAttribute("y2"));
    ge("fo5_a_t").setAttribute("x",ge("line5_a_t").getAttribute("x2"));
    ge("fo5_a_t").setAttribute("y",ge("line5_a_t").getAttribute("y2"));
    
    
    
    
    const phi_span = ge("range5_phi_span");
    
    if(gc5_n >= 0){
        phi_span.innerHTML = phi_degree + "°";
        if(gc5_n != 0) {
            //phi_span.innerHTML += " + " + gc3_n + " \\(*\\) 360°";
            phi_span.innerHTML += " + " + gc5_n + " * 360°";
        }
    }
    else {
        phi_span.innerHTML = "- " + (360-phi_degree) + "° ";
        if(gc5_n != -1) {
            phi_span.innerHTML += + gc5_n+1 + " * 360°";
        }
    }

    
    
    
 show("line5_v");
    show("line5_w");
    show("line5_alpha");
    show("line5_a_r");
    show("line5_a_t");
    show("line5_koord_z");
    show("fo5_w");
    show("fo5_v");
    show("fo5_z");
    show("fo5_a_r");
    show("fo5_a_t");
    show("fo5_alpha");
    hide("range5_w_span_g0");
    hide("range5_w_span_e0");
    hide("range5_w_span_l0");
    hide("range5_a_span_g0");
    hide("range5_a_span_e0");
    hide("range5_a_span_l0");
    if(omega == 0) { 
        hide("line5_v"); 
        hide("line5_w"); 
        hide("line5_a_r"); 
        hide("fo5_w"); 
        hide("fo5_v"); 
        hide("fo5_a_r"); 
        show("range5_w_span_e0");
    }
    else if(omega > 0 && omega < 1){
        show("range5_w_span_g0");

    }
    else if(omega < 0 && omega > -1){
        show("range5_w_span_l0");
    }
    if(perspective == 1) { 
        hide("line5_koord_z"); 
        hide("line5_w"); 
        hide("fo5_w"); 
        hide("fo5_z"); 
    }
    if (alpha == 0) {
        hide("line5_a_t");
        hide("line5_alpha");
        hide("fo5_a_t");
        hide("fo5_alpha");
        show("range5_a_span_e0");
    }
    else if(alpha > 0){
        show("range5_a_span_g0");
    }
    else if(alpha < 0){
        show("range5_a_span_l0");
    }
    
    ge("pause5").removeAttribute("disabled");
    if(omega == 0 && alpha == 0) {
        ge("pause5").setAttribute("disabled","true");
    }
}

var animate5_runs = false;
function condition5() {
    let ome = parseFloat(ge("range5_w").value);
    let alp = parseFloat(ge("range5_a").value);
    if((ome != 0 || alp != 0) && ge("pause5").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate5() {
    let ome = parseFloat(ge("range5_w").value);    
    let alp = parseFloat(ge("range5_a").value);    
    
    if(Math.abs(ome) < 0.1 && alp == 0) { //snap slider
        ome = 0;
        ge("range5_w").value = 0;
    }
    if(Math.abs(alp) < 0.1) { //snap slider
        alp = 0;
        ge("range5_a").value = 0;
    }
    
    if(!animate5_runs && condition5() == true) {
            animate5_runs = true;
            do_animation5();
    }
    else if(animate5_runs && !condition5()) {
            animate5_runs = false;
    }
    else if(!animate5_runs && !condition5()) {
        if (ge("pause5").value == "Play") {
            ge("pause5").click(); 
        }
    }
    
}

function do_animation5() {
    phi = parseFloat(ge("range5_phi").value);
    ome = parseFloat(ge("range5_w").value);
    alp = parseFloat(ge("range5_a").value);
    
    ome = ome + alp/200;
    ge("range5_w").value = ome;
    
    omega = ome/10*speed_factor;
    ge("range5_phi").value = phi+omega;
    
    if(condition5()) {
        if(phi>6.27) {
            ge("range5_phi").value = phi-6.27;
            gc5_n++;
        }
        if(phi == 0 && omega < 0) {
            ge("range5_phi").value = phi+6.27;
            gc5_n--;
        }
        setTimeout(function () {
            do_animation5();
        }, 10);
    }
    
    hide("range5_w_span_min");
    hide("range5_w_span_max");
    if(Math.abs(ome) >= 1) {
        alp = 0;
        ge("range5_a").value = 0;
        

        if(ome <= -1) {
            show("range5_w_span_min");
            hide("range5_w_span_l0");
        }
        else if(ome >= -1) {
            show("range5_w_span_max");
            hide("range5_w_span_g0");
        }

    }
    update5();
}

var gc51_n = 0; //number of revolutions of phi

function update51(){
    svg = ge("svg51");
    pl_circle = ge("poly51_circle");
    pl_angle = ge("poly51_angle");
    perspective = ge("select51").value;
    phi = parseFloat(ge("range51_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range51_w").value);
    alpha = parseFloat(ge("range51_a").value);

    
    transform_line("line51_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3);
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = 0;
    
    v2 = new Array(3);
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = 0;
    
    
    v_a_r = new Array(3); //v_a radial
    v_a_r[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a_r[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a_r[2] = 0;
    
    v_a_t = new Array(3); //v_a tangential
    v_a_t[0] = v[0] - Math.cos(Math.PI/2-phi)*alpha*60;
    v_a_t[1] = v[1] + Math.sin(Math.PI/2-phi)*alpha*60;
    v_a_t[2] = 0;

    
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a_r = to2d(v_a_r,perspective)[0];
    y_a_r = to2d(v_a_r,perspective)[1];
    x_a_t = to2d(v_a_t,perspective)[0];
    y_a_t = to2d(v_a_t,perspective)[1];
    
    
    
    ge("point51").setAttribute("cx",x);
    ge("point51").setAttribute("cy",y);
    ge("line51_phi").setAttribute("x2",x);
    ge("line51_phi").setAttribute("y2",y);
    ge("line51_v").setAttribute("x1",x);
    ge("line51_v").setAttribute("y1",y);
    ge("line51_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line51_v").setAttribute("y2",to2d(v2,perspective)[1]);
    
    ge("line51_a_t").setAttribute("x1",x);
    ge("line51_a_t").setAttribute("y1",y);
    ge("line51_a_t").setAttribute("x2",to2d(v_a_t,perspective)[0]);
    ge("line51_a_t").setAttribute("y2",to2d(v_a_t,perspective)[1]);
    
    ge("line51_a_r").setAttribute("x1",x);
    ge("line51_a_r").setAttribute("y1",y);
    ge("line51_a_r").setAttribute("x2",x_a_r);
    ge("line51_a_r").setAttribute("y2",y_a_r);
    

    
    transform_polyline("poly51_circle",perspective);
    transform_line("line51_koord_x",perspective);
    transform_line("line51_koord_y",perspective);
    transform_line("line51_koord_z",perspective);
    
    ge("fo51_x").setAttribute("x",ge("line51_koord_x").getAttribute("x2"));
    ge("fo51_x").setAttribute("y",ge("line51_koord_x").getAttribute("y2"));
    ge("fo51_y").setAttribute("x",ge("line51_koord_y").getAttribute("x2"));
    ge("fo51_y").setAttribute("y",ge("line51_koord_y").getAttribute("y2"));
    ge("fo51_z").setAttribute("x",ge("line51_koord_z").getAttribute("x2"));
    ge("fo51_z").setAttribute("y",ge("line51_koord_z").getAttribute("y2"));
    
    ge("fo51_v").setAttribute("x",ge("line51_v").getAttribute("x2"));
    ge("fo51_v").setAttribute("y",ge("line51_v").getAttribute("y2"));
   
    ge("fo51_a_r").setAttribute("x",ge("line51_a_r").getAttribute("x2"));
    ge("fo51_a_r").setAttribute("y",ge("line51_a_r").getAttribute("y2"));
    ge("fo51_a_t").setAttribute("x",ge("line51_a_t").getAttribute("x2"));
    ge("fo51_a_t").setAttribute("y",ge("line51_a_t").getAttribute("y2"));
    
    
    
    
    const phi_span = ge("range51_phi_span");
    
    if(gc51_n >= 0){
        phi_span.innerHTML = phi_degree + "°";
        if(gc51_n != 0) {
            //phi_span.innerHTML += " + " + gc3_n + " \\(*\\) 360°";
            phi_span.innerHTML += " + " + gc51_n + " * 360°";
        }
    }
    else {
        phi_span.innerHTML = "- " + (360-phi_degree) + "° ";
        if(gc51_n != -1) {
            phi_span.innerHTML += + gc51_n+1 + " * 360°";
        }
    }

    
    
    
    show("line51_v");
    show("line51_a_r");
    show("line51_a_t");
    show("line51_koord_z");

    show("fo51_v");
    show("fo51_z");
    show("fo51_a_r");
    show("fo51_a_t");

    hide("range51_w_span_g0");
    hide("range51_w_span_e0");
    hide("range51_w_span_l0");
    hide("range51_a_span_g0");
    hide("range51_a_span_e0");
    hide("range51_a_span_l0");
    if(omega == 0) { 
        hide("line51_v"); 
        hide("line51_a_r"); 
 
        hide("fo51_v"); 
        hide("fo51_a_r"); 
        show("range51_w_span_e0");
    }
    else if(omega > 0 && omega < 1){
        show("range51_w_span_g0");

    }
    else if(omega < 0 && omega > -1){
        show("range51_w_span_l0");
    }
    if(perspective == 1) { 
        hide("line51_koord_z"); 

        hide("fo51_z"); 
    }
    if (alpha == 0) {
        hide("line51_a_t");

        hide("fo51_a_t");

        show("range51_a_span_e0");
    }
    else if(alpha > 0){
        show("range51_a_span_g0");
    }
    else if(alpha < 0){
        show("range51_a_span_l0");
    }
    
    ge("pause51").removeAttribute("disabled");
    if(omega == 0 && alpha == 0) {
        ge("pause51").setAttribute("disabled","true");
    }
}

var animate51_runs = false;
function condition51() {
    let ome = parseFloat(ge("range51_w").value);
    let alp = parseFloat(ge("range51_a").value);
    if((ome != 0 || alp != 0) && ge("pause51").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate51() {
    let ome = parseFloat(ge("range51_w").value);    
    let alp = parseFloat(ge("range51_a").value);    
    
    if(Math.abs(ome) < 0.1 && alp == 0) { //snap slider
        ome = 0;
        ge("range51_w").value = 0;
    }
    if(Math.abs(alp) < 0.1) { //snap slider
        alp = 0;
        ge("range51_a").value = 0;
    }
    
    if(!animate51_runs && condition51() == true) {
            animate51_runs = true;
            do_animation51();
    }
    else if(animate51_runs && !condition51()) {
            animate51_runs = false;
    }
    else if(!animate51_runs && !condition51()) {
        if (ge("pause51").value == "Play") {
            ge("pause51").click(); 
        }
    }
    
}

function do_animation51() {
    phi = parseFloat(ge("range51_phi").value);
    ome = parseFloat(ge("range51_w").value);
    alp = parseFloat(ge("range51_a").value);
    
    ome = ome + alp/200;
    ge("range51_w").value = ome;
    
    omega = ome/10*speed_factor;
    ge("range51_phi").value = phi+omega;
    
    if(condition51()) {
        if(phi>6.27) {
            ge("range51_phi").value = phi-6.27;
            gc5_n++;
        }
        if(phi == 0 && omega < 0) {
            ge("range51_phi").value = phi+6.27;
            gc51_n--;
        }
        setTimeout(function () {
            do_animation51();
        }, 10);
    }
    
    hide("range51_w_span_min");
    hide("range51_w_span_max");
    if(Math.abs(ome) >= 1) {
        alp = 0;
        ge("range51_a").value = 0;
        

        if(ome <= -1) {
            show("range51_w_span_min");
            hide("range51_w_span_l0");
        }
        else if(ome >= -1) {
            show("range51_w_span_max");
            hide("range51_w_span_g0");
        }

    }
    update51();
}

var gc6_n = 0; //number of revolutions of phi

function update6(beta_or_z_changed){
    svg = ge("svg6");
    pl_circle = ge("poly6_circle");
    pl_angle = ge("poly6_angle");
    perspective = ge("select6").value;
    phi = parseFloat(ge("range6_phi").value);
    omega = parseFloat(ge("range6_w").value);

    
    
    
    if(beta_or_z_changed == "beta"){
        beta = parseFloat(ge("range6_beta").value);
        z = 100/Math.tan(beta*Math.PI / 180);
        ge("range6_z").value = z;
    }
    else { // z changed
        z = parseFloat(ge("range6_z").value);
        beta = Math.atan(100/z);
        ge("range6_beta").value = beta/Math.PI*180;
    }

    
    transform_line("line6_r",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = 100*Math.cos(2*Math.PI*i/linspace);
        p.y = 100*Math.sin(2*Math.PI*i/linspace);
        
        let px = 100*Math.cos(2*Math.PI*i/linspace);
        let py = 100*Math.sin(2*Math.PI*i/linspace);
        let pz = z;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    
    
    v = new Array(3); //Punkt-Objekt
    v[0] = Math.cos(phi)*100;
    v[1] = Math.sin(phi)*100;
    v[2] = z;
    
    v2 = new Array(3); //v Ziel
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*100;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*100;
    v2[2] = z;
    
    v3 = new Array(3); //R Ursprung
    v3[0] = 0;
    v3[1] = 0;
    v3[2] = z;
    
    x_1 = to2d(v,perspective)[0];
    y_1 = to2d(v,perspective)[1];
    
    v_r = new Array(3); //r text
    v_r[0] = v[0]*0.5;
    v_r[1] = v[1]*0.5;
    v_r[2] = v[2]*0.5;
    
    x_r = to2d(v_r,perspective)[0];
    y_r = to2d(v_r,perspective)[1];
    
    v_R = new Array(3); //R text
    v_R[0] = v[0]*0.5;
    v_R[1] = v[1]*0.5;
    v_R[2] = v[2];
    
    x_R = to2d(v_R,perspective)[0];
    y_R = to2d(v_R,perspective)[1];
    
    
 
    
    ge("point6").setAttribute("cx",x_1);
    ge("point6").setAttribute("cy",y_1);
    
    ge("line6_r").setAttribute("x2",x_1);
    ge("line6_r").setAttribute("y2",y_1);
    
    ge("line6_v").setAttribute("x1",x_1);
    ge("line6_v").setAttribute("y1",y_1);
    
    ge("line6_R").setAttribute("x2",x_1);
    ge("line6_R").setAttribute("y2",y_1);
    ge("line6_R").setAttribute("x1",to2d(v3,perspective)[0]);
    ge("line6_R").setAttribute("y1",to2d(v3,perspective)[1]);
    
    

    ge("line6_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line6_v").setAttribute("y2",to2d(v2,perspective)[1]);
    

    ge("line6_w").setAttribute("y1",-z);
    ge("line6_w").setAttribute("y2",-z+to2d([0,0,100*omega],perspective)[1]);
    
    transform_polyline("poly6_circle",perspective);
    transform_line("line6_koord_x",perspective);
    transform_line("line6_koord_y",perspective);
    transform_line("line6_koord_z",perspective);
    
    ge("fo6_x").setAttribute("x",ge("line6_koord_x").getAttribute("x2"));
    ge("fo6_x").setAttribute("y",ge("line6_koord_x").getAttribute("y2"));
    ge("fo6_y").setAttribute("x",ge("line6_koord_y").getAttribute("x2"));
    ge("fo6_y").setAttribute("y",ge("line6_koord_y").getAttribute("y2"));
    ge("fo6_z").setAttribute("x",ge("line6_koord_z").getAttribute("x2"));
    ge("fo6_z").setAttribute("y",ge("line6_koord_z").getAttribute("y2"));
    
    ge("fo6_v").setAttribute("x",ge("line6_v").getAttribute("x2"));
    ge("fo6_v").setAttribute("y",ge("line6_v").getAttribute("y2"));
    ge("fo6_w").setAttribute("x",ge("line6_w").getAttribute("x2"));
    ge("fo6_w").setAttribute("y",ge("line6_w").getAttribute("y2"));
    
    ge("fo6_r").setAttribute("x",x_r);
    ge("fo6_r").setAttribute("y",y_r);
    ge("fo6_R").setAttribute("x",x_R);
    ge("fo6_R").setAttribute("y",y_R);
    
    
    
    show("line6_v");
    show("line6_w");
    show("line6_koord_z");
    show("fo6_w");
    show("fo6_v");
    show("fo6_z");
    show("line6_koord_x"); 
    show("line6_koord_y"); 
    show("fo6_x"); 
    show("fo6_y"); 
    show("line6_r"); 
    show("fo6_r");
    if(omega == 0) { 
        hide("line6_v"); 
        hide("line6_w"); 
        hide("fo6_w"); 
        hide("fo6_v"); 
    }
    if(perspective == 1) { //top
        hide("line6_koord_z"); 
        hide("line6_w"); 
        hide("line6_r"); 
        hide("fo6_r"); 
        hide("fo6_w"); 
        hide("fo6_z"); 
        
    }
    if(perspective == 3) {  
        hide("line6_koord_x"); 
        hide("line6_koord_y"); 
        hide("fo6_x"); 
        hide("fo6_y"); 
    }
    
    ge("pause6").removeAttribute("disabled");
    if(omega == 0) {
        ge("pause6").setAttribute("disabled","true");
    }
    
}
var animate6_runs = false;
function condition6() {
    let ome = parseFloat(ge("range6_w").value);

    if(ome != 0 && ge("pause6").value == "Pause") { 
        return true;
    }
    else {
        return false;
    }
}

function animate6() {
    let ome = parseFloat(ge("range6_w").value);    
    
    if(Math.abs(ome) < 0.1) { //snap slider
        ome = 0;
        ge("range6_w").value = 0;
    }
    if(!animate6_runs && condition6() == true) {
            animate6_runs = true;
            do_animation6();
    }
    else if(animate6_runs && !condition6()) {
            animate6_runs = false;
    }
    else if(!animate6_runs && !condition6()) {
        if (ge("pause6").value == "Play") {
            ge("pause6").click(); 
        }
    }
    
}

function do_animation6() {
    phi = parseFloat(ge("range6_phi").value);
    ome = parseFloat(ge("range6_w").value);
    
    omega = ome/10*speed_factor;
    ge("range6_phi").value = phi+omega;
    
    
    if(condition6()) {
        if(phi>6.27) {
            ge("range6_phi").value = phi-6.27;
            gc6_n++;
        }
        if(phi == 0 && ome < 0) {
            ge("range6_phi").value = phi+6.27;
            gc6_n--;
        }
        setTimeout(function () {
            do_animation6();
        }, 10);
    }

    
    update6();
}

var gc8_n = 0; //number of revolutions of phi
var r8 = 100 //Radius default 

function update8(){
    svg = ge("svg8");
    pl_circle = ge("poly8_circle");
    pl_tail = ge("poly8_tail");
    pl_angle = ge("poly8_angle");
    perspective = ge("select8").value;
    phi = parseFloat(ge("range8_phi").value);
    phi_degree = Math.round(phi/Math.PI * 180);
    omega = parseFloat(ge("range8_w").value);
    omega_r = parseFloat(ge("range8_w_r").value); //müsste eigentlich velocity_r heißen...

    
    transform_line("line8_phi",perspective);

    var p3d = "";
    for(let i=0; i<=linspace; i++) {
        let p = pl_circle.points.appendItem(svg.createSVGPoint());
        p.x = r8*Math.cos(2*Math.PI*i/linspace);
        p.y = r8*Math.sin(2*Math.PI*i/linspace);
        
        let px = r8*Math.cos(2*Math.PI*i/linspace);
        let py = r8*Math.sin(2*Math.PI*i/linspace);
        let pz = 0;
        
        p3d += px+","+py+","+pz+" ";

    }
    pl_circle.setAttribute("p3d",p3d);
    

    
    v = new Array(3);
    v[0] = Math.cos(phi)*r8;
    v[1] = Math.sin(phi)*r8;
    v[2] = 0;
    
    v2 = new Array(3); //v_t
    v2[0] = v[0] - Math.cos(Math.PI/2-phi)*omega*r8;
    v2[1] = v[1] + Math.sin(Math.PI/2-phi)*omega*r8;
    v2[2] = 0;
    
    
    v_a = new Array(3); //w_a radial
    v_a[0] = (1-0.8*Math.abs(omega)) * v[0];
    v_a[1] = (1-0.8*Math.abs(omega)) * v[1];
    v_a[2] = 0;
    
    v_r = new Array(3); //v_r radial
    v_r[0] = (1+omega_r*50/r8) * v[0];
    v_r[1] = (1+omega_r*50/r8) * v[1];
    v_r[2] = 0;
    
    x = to2d(v,perspective)[0];
    y = to2d(v,perspective)[1];
    
    x_a = to2d(v_a,perspective)[0];
    y_a = to2d(v_a,perspective)[1];
    
    
    p3d_tail = pl_tail.getAttribute("p3d");
    if(p3d_tail == "") {
        p3d_tail += v[0]+","+v[1]+",0"; 
    }
    else {
        p3d_tail += " " + v[0]+","+v[1]+",0";
    }
    p_array = p3d_tail.split(" ");
    if(p_array.length >= 1000) {
        p_array.shift();
        p3d_tail = p_array.join(" ");
    }
    
    
    pl_tail.setAttribute("p3d",p3d_tail);
    transform_polyline("poly8_tail",perspective);

    
// Bounds-Clamp für r8 (Bahnradius): r8 wird in do_animation8 aus range8_w_r
// (Radialgeschwindigkeit) fortlaufend integriert und kann über/unter den
// darstellbaren Bereich [0,170] hinauslaufen. Hier wird es hart zurückgesetzt
// und die Radialgeschwindigkeit auf 0 gesetzt, damit die Figur stabil bleibt.
// TODO: sauberer wäre eine Begrenzung der Geschwindigkeit statt eines harten
// Resets nach Überschreitung; Verhalten bis zur Klärung bewusst unverändert.
    if (r8 < 0) {
        r8 = 0;
        ge("range8_w_r").value = 0;
        ge("range8_w").value = 0;
    }
    else if (r8 > 170) {
        r8 = 170;
        ge("range8_w_r").value = 0;
    }
    
    
    
    
    ge("point8").setAttribute("cx",x);
    ge("point8").setAttribute("cy",y);
    ge("line8_phi").setAttribute("x2",x);
    ge("line8_phi").setAttribute("y2",y);
    ge("line8_v").setAttribute("x1",x);
    ge("line8_v").setAttribute("y1",y);
    ge("line8_v").setAttribute("x2",to2d(v2,perspective)[0]);
    ge("line8_v").setAttribute("y2",to2d(v2,perspective)[1]);
    
    ge("line8_v_r").setAttribute("x1",x);
    ge("line8_v_r").setAttribute("y1",y);
    ge("line8_v_r").setAttribute("x2",to2d(v_r,perspective)[0]);
    ge("line8_v_r").setAttribute("y2",to2d(v_r,perspective)[1]);
    
    ge("line8_a").setAttribute("x1",x);
    ge("line8_a").setAttribute("y1",y);
    ge("line8_a").setAttribute("x2",x_a);
    ge("line8_a").setAttribute("y2",y_a);
    

    
    ge("line8_w").setAttribute("y2",to2d([0,0,100*omega],perspective)[1]);
    
    transform_polyline("poly8_circle",perspective);

    
    transform_line("line8_koord_x",perspective);
    transform_line("line8_koord_y",perspective);
    transform_line("line8_koord_z",perspective);
    
    ge("fo8_x").setAttribute("x",ge("line8_koord_x").getAttribute("x2"));
    ge("fo8_x").setAttribute("y",ge("line8_koord_x").getAttribute("y2"));
    ge("fo8_y").setAttribute("x",ge("line8_koord_y").getAttribute("x2"));
    ge("fo8_y").setAttribute("y",ge("line8_koord_y").getAttribute("y2"));
    ge("fo8_z").setAttribute("x",ge("line8_koord_z").getAttribute("x2"));
    ge("fo8_z").setAttribute("y",ge("line8_koord_z").getAttribute("y2"));
    
    ge("fo8_v").setAttribute("x",ge("line8_v").getAttribute("x2"));
    ge("fo8_v").setAttribute("y",ge("line8_v").getAttribute("y2"));
    ge("fo8_v_r").setAttribute("x",ge("line8_v_r").getAttribute("x2"));
    ge("fo8_v_r").setAttribute("y",ge("line8_v_r").getAttribute("y2"));
    ge("fo8_w").setAttribute("x",ge("line8_w").getAttribute("x2"));
    ge("fo8_w").setAttribute("y",ge("line8_w").getAttribute("y2"));    
    ge("fo8_a").setAttribute("x",ge("line8_a").getAttribute("x2"));
    ge("fo8_a").setAttribute("y",ge("line8_a").getAttribute("y2"));
    
    

    
    
    
    show("line8_v");
    show("line8_v_r");
    show("line8_w");
    show("line8_a");
    show("line8_koord_z");
    show("fo8_w");
    show("fo8_v");
    show("fo8_v_r");
    show("fo8_z");
    show("fo8_a");
    if(omega == 0) { 
        hide("line8_v"); 
        hide("line8_w"); 
        hide("line8_a"); 
        hide("fo8_w"); 
        hide("fo8_v"); 
        hide("fo8_a"); 
    }
    if(perspective == 1) { //top
        hide("line8_koord_z"); 
        hide("line8_w"); 
        hide("fo8_w"); 
        hide("fo8_z"); 
    } 
    if(omega_r == 0) {
        hide("line8_v_r");
        hide("fo8_v_r");
    }
    
    
    ge("pause8").removeAttribute("disabled");
    if(omega == 0) {
        ge("pause8").setAttribute("disabled","true");
    }
}

var animate8_runs = false;
function condition8() {
    let ome = parseFloat(ge("range8_w").value);
    let ome_r = parseFloat(ge("range8_w_r").value);

    if((ome != 0 || ome_r != 0) && ge("pause8").value == "Pause") {
        return true;
    }
    else {
        return false;
    }
}

function animate8() {
    let ome = parseFloat(ge("range8_w").value);    
    let vr = parseFloat(ge("range8_w_r").value);    
    
    if(Math.abs(ome) < 0.1) { //snap slider
        ome = 0;
        ge("range8_w").value = 0;
    }
    if(Math.abs(vr) < 0.1) { //snap slider
        vr = 0;
        ge("range8_w_r").value = 0;
    }
    
    if(!animate8_runs && condition8() == true) {
            animate8_runs = true;
            do_animation8();
    }
    else if(animate8_runs && !condition8()) {
            animate8_runs = false;
    }
    else if(!animate8_runs && !condition8()) {
        if (ge("pause8").value == "Play") {
            ge("pause8").click(); 
        }
    }
    
}

function do_animation8() {
    phi = parseFloat(ge("range8_phi").value);
    ome = parseFloat(ge("range8_w").value);
    ome_r = parseFloat(ge("range8_w_r").value);
    
    omega = ome/10*speed_factor;
    ge("range8_phi").value = phi+omega;
    
    r8 = r8 + ome_r/2;
    
    if(condition8()) {
        if(phi>6.27) {
            ge("range8_phi").value = phi-6.27;
            gc8_n++;
        }
        if(phi == 0 && ome < 0) {
            ge("range8_phi").value = phi+6.27;
            gc8_n--;
        }
        setTimeout(function () {
            do_animation8();
        }, 10);
    }

    
    update8();
}

function clear8() {
    pl_tail = ge("poly8_tail");
    perspective = ge("select8").value;
    
    pl_tail.setAttribute("p3d","");
    transform_polyline("poly8_tail",perspective);
    update8();
}

