'use strict'

// runtime.js — Per-Instanz-Laufzeitumgebung fuer den Bus-Weg-Zeit-Motor.
//
// Identisches Muster wie grundbegriffe/runtime.js (dort die Begruendung): der
// Motor (state.js/render.js) kapselt `store` und `DOM` als Modul-Singletons.
// createRuntime() gibt jeder Figur einen isolierten Zustand + eindeutigen
// ID-Prefix ('bw<n>_'); withStore(fn) benutzt den Singleton nur als Scratch-
// Buffer waehrend eines synchronen Zeichnens und stellt den vorherigen Stand
// danach wieder her (reentrant via depth). bindDom() cacht die prefixten
// Elemente dieser Instanz.

import { store, DOM, initDOM } from './state.js'

const DEFAULT_STORE = { ...store }
const SAVED_STORE = {}
const SAVED_DOM = {}
let _uid = 0

export function createRuntime() {
    const prefix = 'bw' + (_uid++) + '_'

    const storeInstance = {
        ...DEFAULT_STORE,
        toggles: { ...DEFAULT_STORE.toggles },
        path: null,
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