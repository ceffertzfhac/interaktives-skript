// lib/hover.js — Pointer-Hover auf SVG-Hit-Rects (portiert aus
// Projects_InteraktiveSimulation/shared/js/hover.js).
export function svgLocalPoint(referenceEl, evt) {
    const svg = referenceEl.ownerSVGElement || referenceEl;
    const ctm = referenceEl.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
}

export function attachGraphHover(hitRectEl, { onMove, onLeave }) {
    const move = evt => {
        const loc = svgLocalPoint(hitRectEl, evt);
        if (loc) onMove(loc.x, loc.y);
    };
    const leave = () => onLeave();
    hitRectEl.addEventListener('pointermove', move);
    hitRectEl.addEventListener('pointerleave', leave);
    hitRectEl.addEventListener('pointercancel', leave);
    return () => {
        hitRectEl.removeEventListener('pointermove', move);
        hitRectEl.removeEventListener('pointerleave', leave);
        hitRectEl.removeEventListener('pointercancel', leave);
    };
}
