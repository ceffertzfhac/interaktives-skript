var interaktiv = true; //statisches oder interaktives Skript
var darkmode_on = false;
var linspace = 100;
var auto_print = false; //Safari blocks autoprint...
var speed_factor = 1;

function init() {
    bind_events();
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

// Zentrales Event-Binding (Stage 2): Inline-Handler sind durch data-action-
// Attribute ersetzt; ein delegierter Listener je Event-Typ dispatcht an die
// globalen Funktionen. data-event="change" markiert <select>/Radio, die wie
// bisher nur auf change (nicht input) reagieren sollen.
function fig_call(prefix, fig, arg) {
    const fn = window[prefix + fig];
    if (!fn) return;
    if (arg !== undefined && arg !== null && arg !== "") fn(arg);
    else fn();
}

function bind_events() {
    document.addEventListener("click", dispatch_click);
    document.addEventListener("input", dispatch_input);
    document.addEventListener("change", dispatch_change);
}

function dispatch_input(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.dataset.event === "change") return;
    if (el.dataset.action === "update") fig_call("update", el.dataset.fig, el.dataset.arg);
    else if (el.dataset.action === "animate") fig_call("animate", el.dataset.fig);
}

function dispatch_change(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.dataset.event !== "change") return;
    if (el.dataset.action === "update") fig_call("update", el.dataset.fig, el.dataset.arg);
}

function dispatch_click(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    switch (el.dataset.action) {
        case "toc": toc(); break;
        case "init_print": init_print(); break;
        case "kontakt": kontakt(); break;
        case "toggle_darkmode": toggle_darkmode(); break;
        case "close_zoom": close_zoom(); break;
        case "test": test(); break;
        case "reload-mathjax": reload_mathjax(); break;
        case "reset": reset(); break;
        case "clear": fig_call("clear", el.dataset.fig); break;
        case "zoom": zoom(el.parentElement.parentElement); break;
        case "pause-animate": pause(el); fig_call("animate", el.dataset.fig); break;
        case "hide": hide(el.dataset.target); break;
        default: break;
    }
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
        const a = document.getElementsByClassName(boxes[l][0]);
        for (let i=0; i < a.length; i++) {
            const a_content = a[i].innerHTML;
            a[i].innerHTML="";
            const a_title = document.createElement("div");
            a_title.setAttribute("class","highlight_box_title");
            a_title.innerHTML = capitalizeFirstLetter(boxes[l][0]);
            a[i].appendChild(a_title);

            const a_img = document.createElement("img");
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
    const e = ge(element_id);
    const d31 = ga(element_id,"d31");
    const d32 = ga(element_id,"d32");
    e.setAttribute("x1",to2d(d31,perspective)[0]);
    e.setAttribute("y1",to2d(d31,perspective)[1]);
    e.setAttribute("x2",to2d(d32,perspective)[0]);
    e.setAttribute("y2",to2d(d32,perspective)[1]);
}
function transform_polyline(element_id,perspective){
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

function ga(element_id,attr) { //get attribute
    return ge(element_id).getAttribute(attr).split(",");
}
function safari_bug() { //mit Positionierung von Text im SVG
    const IS_SAFARI = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const fo = document.getElementsByClassName("fo_inner");
    if(IS_SAFARI){
        for(let i = 0;i<fo.length;i++) {
            fo[i].classList.add("fixed");
        }
    }
}
function degree_to_fraction(value){ //180 -> 1/2 , 181 -> 181/360
    const gcd = gcd_rec(value,180);
    const z = parseInt(value/gcd);
    const n = parseInt(180/gcd);
    let r;
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
    const scource_div = parent_gc;
    show("zoom_overlay");
    const target_div = ge("zoom_content");
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
    const g = findGetParameter("g");
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
    const content = ge("toc_content");
    const e_id = "toc_container";
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
    const h = document.getElementsByClassName("inhaltsverzeichnis");
    const toc_c = ge("toc_content");
    for (let i = 0;i<h.length;i++) {
        h[i].setAttribute("id","toc_"+i);
        const t = h[i].innerHTML;
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
        ge("gc4").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/image002.png" class="grafik" id="" draggable="false"><br><img src="bilder/image003.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc1").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/phi_0.png" class="grafik" id="" draggable="false"><br></div>';
        
        ge("gc9").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/kreis-xy_koord.png" class="grafik" id="" draggable="false"><br></div>';
        
        ge("gc31").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/geschwindigkeit.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc32").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/winkelgeschwindigkeit_v.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc51").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/beschleunigung.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc3").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/omega_vektor.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc5").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/winkelbeschleunigung.png" class="grafik" id="" draggable="false"></div>';
        
        ge("gc6").innerHTML = "";
        
        ge("gc8").innerHTML = '<div class="grafik-container-inner"><div class="zoom_button zoom_maximize" data-action="zoom"></div><img src="bilder/radialgeschwindigkeit.png" class="grafik" id="" draggable="false"></div>';
        
        
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

// === Per-figure factory (Stage 3) ===
// createFigure fasst die gemeinsame Boilerplate aller animierten 3D-Kreisbahn-
// Figuren zusammen: rAF-Loop (~10 ms Akkumulator, ersetzt rekursives
// setTimeout(...,10)), Reentry-Guard, Slider-Snap, phi-Wrap + Revolutions-
// zaehler (state.n), gecachte statische Kreis-p3d (statt 100-Punkte-
// AppendItem pro Frame -- transform_polyline leitet points ohnehin aus p3d
// ab), Koordinaten-Transform + fo-Kopie, phi_span-Block. Pro Figur nur noch
// Hooks: render, step, wrap, condition, snap (optional clear). updateN /
// animateN / clearN werden via window[...] exponiert, damit update_all und der
// data-action-Binder unverändert arbeiten.
function createFigure(cfg){
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
function circleStep(ctx){
    const P = ctx.P;
    const phi = parseFloat(ge("range"+P+"_phi").value);
    const ome = parseFloat(ge("range"+P+"_w").value);
    const omega = ome/10*speed_factor;
    ge("range"+P+"_phi").value = phi+omega;
    ctx.phi = phi; ctx.ome = ome;
}
function circleWrap(ctx){
    const P = ctx.P;
    if(ctx.phi > 6.27){ ge("range"+P+"_phi").value = ctx.phi-6.27; ctx.state.n++; }
    if(ctx.phi == 0 && ctx.ome < 0){ ge("range"+P+"_phi").value = ctx.phi+6.27; ctx.state.n--; }
}
function omegaCondition(ctx){
    const P = ctx.P;
    return ge("pause"+P).value == "Pause" && parseFloat(ge("range"+P+"_w").value) != 0;
}
function omegaSnap(ctx){
    const P = ctx.P;
    const e = ge("range"+P+"_w");
    if(Math.abs(parseFloat(e.value)) < 0.1) e.value = 0;
}
function circleRender(opts){
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

createFigure({id:"3",  render:circleRender({hasW:true, hasA:true}),  step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});
createFigure({id:"31", render:circleRender({hasW:false, hasA:true}), step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});
createFigure({id:"32", render:circleRender({hasW:false, hasA:false}),step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});

// --- gc5/gc51: omega + alpha (Tangentialbeschleunigung) ---
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

// --- gc6: geneigte Kreisbahn (z/beta-Sync), reiner omega-Antrieb ---
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

// --- gc8: Radialgeschwindigkeit (omega_r) + Spur (tail), variabler Radius r8 ---
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

function update4() {
    const img = ge("img4-1");
    if(ge("radio4-1").checked) {
        img.src="bilder/image002.png";
    }
    else {
        img.src="bilder/image003.png";
    }
}

