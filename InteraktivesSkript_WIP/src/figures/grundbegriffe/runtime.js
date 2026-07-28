// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Grundbegriffe-Motor.
//
// Identisches Muster wie kreisbewegung/runtime.js und kreis_spiral/runtime.js
// (dort steht die ausfuehrliche Begruendung): der Motor (state.js/render.js)
// kapselt `store` und `DOM` als Modul-Singletons. createRuntime() gibt jeder
// Figur einen isolierten Zustand + einen eindeutigen ID-Prefix ('gk<n>_');
// withStore(fn) benutzt den Singleton nur als Scratch-Buffer waehrend eines
// synchronen Zeichnens und stellt den vorherigen Stand danach wieder her.
//
// Unterschied zu den beiden anderen Motoren: dieser haelt keine Zeitreihen und
// keine Graph-Slots — nur die feste Bahnkurve (store.path), die daraus
// abgeleiteten A/B-Groessen (store.ab) und die Toggles. Frisch pro Instanz
// muessen daher nur `toggles` sein (ein Objekt; alles andere sind Skalare bzw.
// werden von der Figur ohnehin neu gesetzt).

import { store, DOM, initDOM } from './state.js';

// Default-Store bei Modulladezeit (vor jeglicher Figuren-Mutation).
const DEFAULT_STORE = { ...store };
// Scratch-Buffer fuer den Singleton-Stand VOR einem withStore.
const SAVED_STORE = {};
const SAVED_DOM = {};
let _uid = 0;

export function createRuntime() {
    const prefix = 'gk' + (_uid++) + '_';

    // Per-Instanz-Store mit frischen Containern (kein geteilter Zustand).
    const storeInstance = {
        ...DEFAULT_STORE,
        toggles: { ...DEFAULT_STORE.toggles },
        path: null,
        ab: null,
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
