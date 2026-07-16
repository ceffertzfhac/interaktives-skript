// figures/fig_3.js — gc3/gc31/gc32: reine omega-Kreisbahn (Geschwindigkeit /
// Winkelgeschwindigkeit / nur Kreis), unterschieden ueber hasW/hasA.
// Shared Hooks aus factory.js; createFigure registriert updateN/animateN.

import { createFigure, circleRender, circleStep, circleWrap, omegaCondition, omegaSnap } from './factory.js';

createFigure({id:"3",  render:circleRender({hasW:true, hasA:true}),  step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});
createFigure({id:"31", render:circleRender({hasW:false, hasA:true}), step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});
createFigure({id:"32", render:circleRender({hasW:false, hasA:false}),step:circleStep, wrap:circleWrap, condition:omegaCondition, snap:omegaSnap});