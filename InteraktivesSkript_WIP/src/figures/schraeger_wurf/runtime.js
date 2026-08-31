'use strict'

// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Schraeger-Wurf-Motor
// (BACKLOG P16-2).
//
// Identisches Muster wie freier_fall/runtime.js (P16-1) und
// federpendel/runtime.js — dort die ausfuehrliche Begruendung. Kurz: der Motor
// (state.js/render.js) kapselt `store` und `DOM` als Modul-Singletons.
// createRuntime() gibt jeder Figur einen isolierten Zustand + eindeutigen
// ID-Prefix ('sw<n>_'); withStore(fn) benutzt den Singleton nur als
// Scratch-Buffer waehrend eines SYNCHRONEN Zeichnens und stellt den vorherigen
// Stand danach wieder her (reentrant ueber depth). bindDom() cacht die
// prefixten Elemente dieser Instanz.
//
// Warum noetig: ohne Prefix liefert getElementById immer das erste Vorkommen,
// und zwei Figuren auf derselben Seite ueberschreiben einander den Zustand.
// Dieser Motor traegt in Kap. 1.1 die Abbildungen 1.9, 1.14 und 1.20.

import { store, DOM, initDOM } from './state.js'

const DEFAULT_STORE = { ...store }
const SAVED_STORE = {}
const SAVED_DOM = {}
let _uid = 0

export function createRuntime() {
    const prefix = 'sw' + (_uid++) + '_'

    const storeInstance = {
        ...DEFAULT_STORE,
        // Zeitreihen und verschachtelte Objekte pro Instanz NEU anlegen — ein
        // flacher Spread wuerde sie sonst zwischen allen Figuren teilen.
        // yAxisConfig ist dabei genau die Groesse, die verschiedene
        // Abbildungen desselben Motors voneinander unterscheiden kann.
        tData: [], xtData: [], ytData: [], vxtData: [], vytData: [],
        axtData: [], aytData: [], vabsData: [],
        axisLimits: {},
        yAxisConfig: { ...DEFAULT_STORE.yAxisConfig },
        graphScale: { single: null, top: null, bottom: null },
        hoverActive: { single: false, top: false, bottom: false },
        hoverLocalX: { single: null, top: null, bottom: null },
        frozenTraj: null,
        aniFrameId: null,
        idPrefix: prefix,
    }

    let domInstance = null
    let depth = 0

    const swapIn = () => {
        Object.assign(store, storeInstance)
        store.idPrefix = prefix
        if (domInstance) Object.assign(DOM, domInstance)
    }
    const swapOut = () => { Object.assign(storeInstance, store) }

    const withStore = (fn) => {
        if (depth === 0) {
            Object.assign(SAVED_STORE, store)
            Object.assign(SAVED_DOM, DOM)
            swapIn()
        }
        depth++
        try { return fn() }
        finally {
            depth--
            if (depth === 0) {
                swapOut()
                Object.assign(store, SAVED_STORE)
                Object.assign(DOM, SAVED_DOM)
            }
        }
    }

    const bindDom = () => {
        const savedPrefix = store.idPrefix
        store.idPrefix = prefix
        initDOM()
        domInstance = { ...DOM }
        store.idPrefix = savedPrefix
    }

    return { prefix, withStore, bindDom, storeInstance }
}
