'use strict'

// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Federpendel-Motor
// (BACKLOG P12-E6).
//
// Identisches Muster wie bus_weg_zeit/runtime.js und grundbegriffe/runtime.js
// (dort die ausfuehrliche Begruendung): der Motor (state.js/render.js) kapselt
// `store` und `DOM` als Modul-Singletons. createRuntime() gibt jeder Figur
// einen isolierten Zustand + eindeutigen ID-Prefix ('fp<n>_'); withStore(fn)
// benutzt den Singleton nur als Scratch-Buffer waehrend eines SYNCHRONEN
// Zeichnens und stellt den vorherigen Stand danach wieder her (reentrant ueber
// depth). bindDom() cacht die prefixten Elemente dieser Instanz.
//
// Warum das noetig ist: ohne Prefix liefert getElementById immer das erste
// Vorkommen, und zwei Figuren auf derselben Seite ueberschreiben einander den
// Zustand. "Nur die aktive Seite bauen" reicht nicht — es koennen mehrere
// Figuren auf EINER Seite liegen.

import { store, DOM, initDOM } from './state.js'

const DEFAULT_STORE = { ...store }
const SAVED_STORE = {}
const SAVED_DOM = {}
let _uid = 0

export function createRuntime() {
    const prefix = 'fp' + (_uid++) + '_'

    const storeInstance = {
        ...DEFAULT_STORE,
        // Die Zeitreihen und die Achsengrenzen sind pro Instanz eigene Objekte —
        // ein flacher Spread wuerde sie sonst zwischen allen Figuren teilen.
        tData: [], xData: [], vData: [], aData: [],
        ekData: [], epData: [], egesData: [],
        axisLimits: {},
        centers: null,
        graphScale: null,
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
