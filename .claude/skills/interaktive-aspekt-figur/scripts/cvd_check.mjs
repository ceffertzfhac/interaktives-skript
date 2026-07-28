#!/usr/bin/env node
// cvd_check.mjs — verifiziert die CVD-Vektor-Farbpaletten in
// InteraktivesSkript_WIP/src/figures/aspekt_paletten.css.
//
// Zwei Prüfungen pro Palette (deuter/tritan × hell/dunkel):
//   1. Paarweise Unterscheidbarkeit unter der jeweiligen Farbfehlsichtigkeit:
//      jede Vektorfarbe wird via Brettel-Dichromatie-Matrix simuliert (lineares
//      RGB) und im CIELAB-Raum gegen jede ANDERE, in derselben Figur
//      gleichzeitig gezeigte Vektorfarbe verglichen (ΔE76). Kleines ΔE =>
//      verwechselbar.
//   2. Luminanzkontrast jeder Vektorfarbe gegen den Figur-Hintergrund
//      (hell: #ffffff, dunkel: #1e2228) — sonst ist ein Vektor schlicht
//      unsichtbar (z. B. schwarz auf dunkel).
//
// Aufruf:  node .claude/skills/interaktive-aspekt-figur/scripts/cvd_check.mjs
// Exit-Code: 0 = alles über den Schwellen, 1 = mindestens ein Paar/Wert
//            eindeutig unter dem Schwellen (→ Werte nachjustieren).

// ── WERT-Tokens je Palette (Spiegel von aspekt_paletten.css) ──────────────
// 13 WERT-Tokens; ALIAS-Tokens (r, vel, acc, v, vx, vy, ay) spiegeln diese
// (s. CSS), daher hier nicht erneut aufgeführt.
const PALETTES = {
  normal:        { phi:"#28a745", point:"#dc3545", rlat:"#474747", vlat:"#F47A2D", azp:"#8361af", omega:"#1555A2", alpha:"#bf262d", at:"#d24b3e", ar:"#2f74d0", rx:"#1f77b4", ry:"#1a8a50", ax:"#17a2b8", traj:"#7f7f7f" },
  deuter_hell:   { phi:"#5a5a5a", point:"#B84DBF", rlat:"#000000", vlat:"#E69F00", azp:"#0072B2", omega:"#56B4E9", alpha:"#D55E00", at:"#CC79A7", ar:"#009E73", rx:"#0072B2", ry:"#009E73", ax:"#D55E00", traj:"#999999" },
  deuter_dunkel: { phi:"#9a9a9a", point:"#B84DBF", rlat:"#d0d0d0", vlat:"#E69F00", azp:"#0072B2", omega:"#56B4E9", alpha:"#D55E00", at:"#CC79A7", ar:"#009E73", rx:"#0072B2", ry:"#009E73", ax:"#F0E442", traj:"#9aa3b8" },
  tritan_hell:   { phi:"#5a5a5a", point:"#B84DBF", rlat:"#3a3a3a", vlat:"#E69F00", azp:"#2b6e51", omega:"#009E73", alpha:"#D55E00", at:"#c0392b", ar:"#009E73", rx:"#0072B2", ry:"#5fb88a", ax:"#8a2418", traj:"#999999" },
  tritan_dunkel: { phi:"#9a9a9a", point:"#B84DBF", rlat:"#d0d0d0", vlat:"#E69F00", azp:"#5fd49d", omega:"#4caa7d", alpha:"#e8703a", at:"#e05a4a", ar:"#4caa7d", rx:"#3f8fd6", ry:"#7fd4b0", ax:"#c45040", traj:"#9aa3b8" },
};

// ── Koexistierende Vektor-Farben je Figur (Tokens) ────────────────────────
// ay → ry-Token, vx → rx-Token, v → vlat-Token (Aliase, s. CSS).
const SETS = [
  { name:"1.38 Positionen",        toks:["rlat","rx","ry","phi","point"] },
  { name:"1.50 ax/ay-Zerlegung",   toks:["rlat","vlat","azp","ax","ry","phi","point"] },
  { name:"1.51 a_t/a_r-Zerlegung", toks:["rlat","vlat","azp","at","ar","phi","point"] },
  { name:"1.57 ω-Vektor",          toks:["rlat","vlat","omega","phi","point"] },
  { name:"1.58 a_ZP-Kreuz",        toks:["omega","vlat","azp","rlat","point"] },
  { name:"1.59 α/ω",               toks:["rlat","omega","alpha","phi","point"] },
];

// ── CVD-Simulation (Brettel 1997, lineares RGB, Schweregrad 1.0) ──────────
const CVD = {
  deuter: [
    [0.367322, 0.860646, 0.070158],
    [0.280093, 0.672501, 0.047406],
    [-0.011820, 0.042943, 0.968885],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
};

// ── Farbmathe ─────────────────────────────────────────────────────────────
function hexToSrgb(h) {
  const n = h.replace("#","");
  return [parseInt(n.slice(0,2),16)/255, parseInt(n.slice(2,4),16)/255, parseInt(n.slice(4,6),16)/255];
}
function srgbToLin(c) { return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function linToSrgb(c) { return c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }
function applyMat(M, v) { return M.map(row => row.reduce((s,m,i)=>s+m*v[i],0)); }
function relLum(lin) { return 0.2126*lin[0]+0.7152*lin[1]+0.0722*lin[2]; }
function contrastRatio(L1,L2){ const a=Math.max(L1,L2)+0.05, b=Math.min(L1,L2)+0.05; return a/b; }

// lineares sRGB(D65) → XYZ
function linToXyz(lin) {
  return [
    0.4124564*lin[0]+0.3575761*lin[1]+0.1804375*lin[2],
    0.2126729*lin[0]+0.7151522*lin[1]+0.0721750*lin[2],
    0.0193339*lin[0]+0.1191920*lin[1]+0.9503041*lin[2],
  ];
}
const Xn=0.95047, Yn=1.0, Zn=1.08883;
function fLab(t){ const d=6/29; return t>d*d*d ? Math.cbrt(t) : t/(3*d*d)+4/29; }
function xyzToLab(xyz){
  const fx=fLab(xyz[0]/Xn), fy=fLab(xyz[1]/Yn), fz=fLab(xyz[2]/Zn);
  return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
}
function dE76(a,b){ return Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2); }

// Farbe so, wie sie einem Dichromaten erscheint (→ Lab).
function simulatedLab(hex, cvdKey) {
  const s = hexToSrgb(hex);
  const lin = s.map(srgbToLin);
  const sim = applyMat(CVD[cvdKey], lin);          // wahrgenommenes lineares RGB
  const xyz = linToXyz(sim);
  return xyzToLab(xyz);
}

// ── Schwellen ─────────────────────────────────────────────────────────────
// ΔE76 unter der jeweiligen CVD-Simulation: primäres Unterscheidbarkeits-Maß.
const DE_WARN = 10;   // grenzwertig
const DE_FAIL = 5;    // eindeutig zu nah -> justieren
// Luminanzkontrast gegen den Figur-Hintergrund: sekundärer Sichtbarkeits-
// Wächter (fasst True-Invisibility wie Schwarz-auf-Dunkel, CR~1.3). WCAG 3.0
// gilt für TEXT; dünne Vektorlinien nutzen chromatischen Kontrast, und die
// Quellen-Palette selbst hat Orange #F47A2D nur bei CR 2.74 — also Schwellen
// bei 2.0 (Auf-Weiß-Line 2.2..2.7 ist akzeptiert, <2.0 wirklich zu blass).
const CONTRAST_FAIL = 2.0;
const BG = { hell: "#ffffff", dunkel: "#1e2228" };

let failed = false;
const failures = [];

// nurInfo: Messung ausgeben, aber NICHT den Exit-Code bestimmen. Genutzt fuer
// die Quellen-Palette ("normal") unter CVD-Simulation: deren Farben sind vom
// PDF-Skript vorgegeben (Wiedererkennungswert) und teils grundsaetzlich nicht
// farbfehlsicher -- der gruene Winkelbogen und der rote Massenpunkt liegen
// unter Deuteranopie bei DeltaE 4,4. Genau dafuer existieren die CVD-Paletten;
// ein Fehlschlag hier waere nicht behebbar, sondern nur die Wiederholung
// dessen, was die Umschaltung loest.
function checkPalette(name, cvdKey, bgKey, nurInfo = false) {
  const pal = PALETTES[name];
  const bgLin = hexToSrgb(BG[bgKey]).map(srgbToLin);
  const bgL = relLum(bgLin);
  console.log(`\n=== ${name}  (simuliert unter ${cvdKey}, Hintergrund ${BG[bgKey]}) ===`);

  // 1) Kontrast je Vektor
  for (const tok of Object.keys(pal)) {
    const lin = hexToSrgb(pal[tok]).map(srgbToLin);
    const cr = contrastRatio(relLum(lin), bgL);
    const flag = cr < CONTRAST_FAIL ? "  <<< KONTRAST" : "";
    console.log(`  Kontrast  ${tok.padEnd(6)} ${pal[tok]}  CR=${cr.toFixed(2)}${flag}`);
    if (cr < CONTRAST_FAIL && !nurInfo) { failed = true; failures.push(`${name}: Kontrast ${tok}=${pal[tok]} CR=${cr.toFixed(2)}`); }
  }

  // 2) Paarweises ΔE pro koexistierendem Set
  for (const set of SETS) {
    const labs = set.toks.map(t => simulatedLab(pal[t], cvdKey));
    let min = Infinity, minPair = null;
    for (let i=0;i<labs.length;i++) for (let j=i+1;j<labs.length;j++) {
      const d = dE76(labs[i],labs[j]);
      if (d < min) { min = d; minPair = [set.toks[i],set.toks[j]]; }
    }
    const flag = min < DE_FAIL ? "  <<< VERWECHSELBAR" : min < DE_WARN ? "  ~ grenzwertig" : "";
    console.log(`  ΔE76  ${set.name.padEnd(24)} min=${min.toFixed(1)}  (${minPair[0]}↔${minPair[1]})${flag}`);
    if (min < DE_FAIL && !nurInfo) { failed = true; failures.push(`${name}: ${set.name} ${minPair[0]}↔${minPair[1]} ΔE=${min.toFixed(1)}`); }
  }
}

// CVD-Palette unter der jeweiligen Sehschwäche; Normal zum Vergleich unter beiden.
checkPalette("deuter_hell",   "deuter", "hell");
checkPalette("deuter_dunkel", "deuter", "dunkel");
checkPalette("tritan_hell",   "tritan", "hell");
checkPalette("tritan_dunkel", "tritan", "dunkel");
console.log("\n--- INFO (kein Gate): Quellen-Palette (Normal) unter CVD -- so sieht es der CVD-Leser OHNE Palette ---");
checkPalette("normal", "deuter", "hell", true);
checkPalette("normal", "tritan", "hell", true);

console.log("");
if (failures.length) {
  console.log("ZU BEHEBEN:");
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
} else {
  console.log("OK: alle Paare ≥ ΔE "+DE_FAIL+" und alle Kontraste ≥ "+CONTRAST_FAIL+".");
  process.exit(0);
}