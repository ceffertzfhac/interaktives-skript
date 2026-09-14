'use strict'

// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Ableitungs-Motor
// (BACKLOG P17-1).
//
// Identisches Muster wie die uebrigen Motoren (dort die ausfuehrliche
// Begruendung, z. B. freier_fall/runtime.js). Kurz: der Motor kapselt `store`
// und `DOM` als Modul-Singletons. createRuntime() gibt jeder Figur einen
// isolierten Zustand + eindeutigen ID-Prefix ('ab<n>_'); withStore(fn) benutzt
// den Singleton nur als Scratch-Buffer waehrend eines SYNCHRONEN Zeichnens und
// stellt den vorherigen Stand danach wieder her (reentrant ueber depth).
// bindDom() cacht die prefixten Elemente dieser Instanz.
//
// BESONDERHEIT dieses Motors: er ist ZUSTANDSLOS ueber die Zeit -- kein rAF,
// keine Zeitreihen, kein Play/Pause. Der Instanz-Zustand ist entsprechend
// klein; neu angelegt werden muss nur die Kurve (Arrays) und das
// Analyse-Objekt, damit zwei Figuren sie nicht teilen.

import { store, DOM, initDOM } from './state.js'

const DEFAULT_STORE = { ...store }
const SAVED_STORE = {}
const SAVED_DOM = {}
let _uid = 0

export function createRuntime() {
    const prefix = 'ab' + (_uid++) + '_'

    const storeInstance = {
        ...DEFAULT_STORE,
        // Verschachteltes pro Instanz NEU anlegen — ein flacher Spread wuerde
        // die Arrays sonst zwischen allen Figuren teilen.
        curve: { xs: [], ys: [] },
        analysis: null,
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
