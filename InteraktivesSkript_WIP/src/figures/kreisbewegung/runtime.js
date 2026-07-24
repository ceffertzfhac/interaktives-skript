// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Kreisbewegungs-Motor.
//
// WARUM: der Motor (state.js/render.js/physics.js) kapselt `store` und `DOM`
// als Modul-Singletons und referenziert sie per Closure. Mehrere Aspekt-
// Figuren, die denselben Motor wiederverwenden, wuerden sich sonst diese
// Singletons (und die gemeinsamen kb_-IDs) teilen und sich gegenseitig
// ueberschreiben. createRuntime() erzeugt pro Figur einen isolierten Zustand:
//
//   - einen eindeutigen ID-Prefix (kb<n>_), den das Skelett der Figur fuer
//     alle Element-IDs nutzt -> keine getElementById-Kollision zwischen Figuren.
//   - einen persistenten `storeInstance` (Wahrheit dieser Figur) und einen
//     `domInstance`-Snapshot ihrer Elementreferenzen.
//
// Der Singleton-store/-DOM dient nur als Scratch-Buffer waehrend eines
// Zeichnens: withStore(fn) sichert VOR dem Aufruf den aktuellen Singleton-Stand,
// kopiert die Instanzwerte in den Singleton, fuehrt fn aus (die Motor-Funktionen
// arbeiten auf dem Singleton) und stellt DANACH den gesicherten Stand wieder
// her. So bleibt die schlafende gc10-Sim (die den Singleton direkt nutzt)
// unbeeinflusst — auch ihre store.idPrefix='kb_' ist nach jedem Aspekt-Zeichnen
// wiederhergestellt. Da JS single-threaded und Zeichnen synchron ist, ist nie
// mehr als eine Figur "aktiv" im Singleton -> volle Isolation, auch bei
// mehreren Figuren auf derselben Seite.
//
// Die einzig noetigen Motor-Aenderungen sind minimal + abwaertskompatibel:
// state.js liest store.idPrefix in q(); render.js baut Marker-URLs aus
// store.idPrefix. Default 'kb_' laesst die schlafende gc10-Sim unberuehrt.

import { store, DOM, initDOM } from './state.js';

// Default-Store bei Modulladezeit (vor jeglicher Figuren-Mutation) -> saubere
// Vorlage fuer jede Instanz. Skalare werden geteilt (unverfaelschbar), die
// Container unten pro Instanz neu angelegt (sonst wuerden alle Figuren dieselben
// tData/graphScale/axisLimits-Objekte teilen).
const DEFAULT_STORE = { ...store };
// Scratch-Buffer fuer den Singleton-Stand VOR einem withStore (s.o.).
const SAVED_STORE = {};
const SAVED_DOM = {};
let _uid = 0;

export function createRuntime() {
    const prefix = 'kb' + (_uid++) + '_';

    // Per-Instanz-Store mit frischen Containern (kein geteilter Zustand).
    const storeInstance = {
        ...DEFAULT_STORE,
        tData: [], xData: [], yData: [], vxData: [], vyData: [], axData: [], ayData: [],
        vabsData: [], aabsData: [], phitData: [], omegaData: [],
        atData: [], arData: [],
        graphScale: { single: null, top: null, bottom: null },
        axisLimits: {},
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

    // Reentrant: nur die aeusserste withStore blockiert swappt, verschachtelte
    // Aufrufe (z.B. draw innerhalb rebuild) bleiben im selben Swap-Kontext.
    const withStore = (fn) => {
        if (depth === 0) {
            Object.assign(SAVED_STORE, store);   // Singleton-Stand VOR dem Zeichnen
            Object.assign(SAVED_DOM, DOM);
            swapIn();
        }
        depth++;
        try { return fn(); }
        finally {
            depth--;
            if (depth === 0) {
                swapOut();                          // Instanz <- Singleton (Wahrheit updaten)
                Object.assign(store, SAVED_STORE);  // Singleton restaurieren (gc10 etc.)
                Object.assign(DOM, SAVED_DOM);
            }
        }
    };

    // NACH dem Einhaengen des Skeletts (mit `prefix`-IDs ins Dokument) aufrufen:
    // bindet den DOM-Cache an diese Instanz und snapshottet die Elementreferenzen.
    // idPrefix wird nur fuer die Dauer von initDOM temporaer auf prefix gesetzt,
    // damit der Singleton davor/dahinter unberuehrt bleibt.
    const bindDom = () => {
        const savedPrefix = store.idPrefix;
        store.idPrefix = prefix;
        initDOM();
        domInstance = { ...DOM };
        store.idPrefix = savedPrefix;
    };

    return { prefix, withStore, bindDom, storeInstance };
}