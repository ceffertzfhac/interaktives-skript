// core.js — zentrale Helfer, globaler State, Skript-Steuerung (statisch vs.
// interaktiv), Highlight-Boxen, Safari-Workaround, Bruchdarstellung, Darkmode,
// Reset sowie update_all (dispatcht via window.updateN -- siehe figures/*).
// Keine Abhaengigkeiten zu anderen Modulen (Wurzel des Abhaengigkeitsgraphen).

export let interaktiv = true; //statisches oder interaktives Skript
export let darkmode_on = false;
export const linspace = 100;
export const speed_factor = 1;

export function ge(element_id) {
    return document.getElementById(element_id);
}

export function show(element_id) {
    ge(element_id).classList.remove("hidden");
}
export function hide(element_id) {
    ge(element_id).classList.add("hidden");
}
export function toggle_visibility(element_id) {
    if(ge(element_id).classList.contains("hidden")) {
        show(element_id);
    }
    else {
        hide(element_id);
    }
}

//foo -> Foo (aus generate_highlight_boxes herausgeloest, Modul-Scope)
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function generate_highlight_boxes() {
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
}

export function safari_bug() { //mit Positionierung von Text im SVG
    const IS_SAFARI = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const fo = document.getElementsByClassName("fo_inner");
    if(IS_SAFARI){
        for(let i = 0;i<fo.length;i++) {
            fo[i].classList.add("fixed");
        }
    }
}

export function degree_to_fraction(value){ //180 -> 1/2 , 181 -> 181/360
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

export function make_static(){ //interaktives Skript statisch machen für Evaluation
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
export function test(){
    interaktiv = !interaktiv;
    make_static();
}
// MathJax v3 hat kein MathJax.Hub mehr (v2-API). typesetPromise() rendert
// (bzw. re-rendert) alle Formeln im Dokument; ohne geladenes MathJax no-op.
export function reload_mathjax(){
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}
export function toggle_darkmode(){
    darkmode_on = !darkmode_on;
    if(darkmode_on) {
        ge("darkmode_stylesheet").disabled=false
    }
    else {
        ge("darkmode_stylesheet").disabled=true
    }
}

export function reset(){
    window.history.pushState("", "", window.location.href.split("#")[0]);
    document.location.reload();
}

// Ruft jede interaktive Figur einmal auf. Die Figuren (figures/*) registrieren
// ihre updateN zur Ladezeit auf window; main.js importiert sie vor dem Aufruf
// von init(), sodass die Referenzen hier existieren. update_all selbst bleibt
// damit frei von Importen auf einzelne Figuren (keine Zyklen).
export function update_all() {
    window.update1();
    window.update9();
    window.update3();
    window.update31();
    window.update32();
    window.update5();
    window.update51();
    window.update6();
    window.update8();
}