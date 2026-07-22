// playback.js — Gemeinsame Hilfen fuer Bedienlogik von Aspekt-Simulationen.
// Fokus hier: Auto-Stopp-Verhalten "Play nach Ende startet mit Reset".

const DEFAULT_EPS = 1e-6;

// Liefert true, wenn eine Auto-Stopp-Simulation als "am Ende" gilt.
export function isAtAutoStopEnd(currentTime, autoStopTime, eps = DEFAULT_EPS) {
    return currentTime >= autoStopTime - eps;
}

// Einheitliches Verhalten fuer den Play-Klick bei Auto-Stopp-Simulationen:
// steht die Simulation am Ende, zuerst resetten, dann starten.
export function resetOnPlayAfterAutoStop(currentTime, autoStopTime, resetFn, eps = DEFAULT_EPS) {
    if (isAtAutoStopEnd(currentTime, autoStopTime, eps)) resetFn();
}
