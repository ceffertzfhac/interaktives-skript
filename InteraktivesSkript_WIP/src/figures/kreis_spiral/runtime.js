// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Kreis-/Spiralbewegungs-Motor.
//
// Identisches Muster wie kreisbewegung/runtime.js (dort ist die ausfuehrliche
// Begruendung dokumentiert): der Motor (state.js/render.js/physics.js) kapselt
// `store` und `DOM` als Modul-Singletons. createRuntime() gibt jeder Figur einen
// isolierten Zustand + eindeutigen ID-Prefix ('ks<n>_'), withStore(fn) benutzt
// den Singleton nur als Scratch-Buffer waehrend eines synchronen Zeichnens und
// stellt den vorherigen Stand danach wieder her.
//
// Unterschied zum Kreisbewegungs-Motor: dieser Motor haelt seine Zeitreihen in
// EINEM flachen Objekt (store.fullData mit p_<groesse>-Arrays, gefuellt von
// physics.js::precompute) statt in vielen Einzel-Arrays, und seine Graph-Slots
// heissen 1/2 statt single/top/bottom. Entsprechend andere frische Container.

import { store, DOM, initDOM } from './state.js';

// Default-Store bei Modulladezeit (vor jeglicher Figuren-Mutation).
const DEFAULT_STORE = { ...store };
// Scratch-Buffer fuer den Singleton-Stand VOR einem withStore.
const SAVED_STORE = {};
const SAVED_DOM = {};
let _uid = 0;

export function createRuntime() {
    const prefix = 'ks' + (_uid++) + '_';

    // Per-Instanz-Store mit frischen Containern (kein geteilter Zustand).
    const storeInstance = {
        ...DEFAULT_STORE,
        fullData: {},
        axisLimits: {},
        graphScale: { 1: null, 2: null },
        hoverActive: { 1: false, 2: false },
        hoverLocalX: { 1: null, 2: null },
        hoverSourceSlot: null,
        hoverT: null,
        idPrefix: prefix,
    };

    let domInstance = null;
    let depth = 0;

    const swapIn = () => {
        Object.assign(store, storeInstance);   // Instanz -> Singleton (Scratch)
        store.idPrefix = prefix;
        if (domInstance) Object.assign(DOM, domInstance);
    };
    const swapOut = () => { Object.assign(storeInstance, store); }; // Scratch -> Instanz

    // Reentrant: nur die aeusserste withStore-Klammer swappt.
    const withStore = (fn) => {
        if (depth === 0) {
            Object.assign(SAVED_STORE, store);
            Object.assign(SAVED_DOM, DOM);
            swapIn();
        }
        depth++;
        try { return fn(); }
        finally {
            depth--;
            if (depth === 0) {
                swapOut();
                Object.assign(store, SAVED_STORE);
                Object.assign(DOM, SAVED_DOM);
            }
        }
    };

    // NACH dem Einhaengen des Skeletts (mit `prefix`-IDs) aufrufen.
    const bindDom = () => {
        const savedPrefix = store.idPrefix;
        store.idPrefix = prefix;
        initDOM();
        domInstance = { ...DOM };
        store.idPrefix = savedPrefix;
    };

    return { prefix, withStore, bindDom, storeInstance };
}
