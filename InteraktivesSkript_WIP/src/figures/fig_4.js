// figures/fig_4.js — gc4: reiner Radio-Image-Swap (keine Animation, kein SVG).
// update4 nicht in update_all enthalten; wird nur vom data-action-Binder
// (Radio change) aufgerufen.

import { ge } from '../core.js';

export function update4() {
    const img = ge("img4-1");
    if(ge("radio4-1").checked) {
        img.src="bilder/image002.png";
    }
    else {
        img.src="bilder/image003.png";
    }
}

window.update4 = update4;