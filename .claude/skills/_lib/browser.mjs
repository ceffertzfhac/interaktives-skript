/**
 * Gemeinsame Chromium-Aufloesung fuer alle Skill-Skripte, die einen echten
 * Browser brauchen.
 *
 * WARUM ES DAS GIBT: dieselben vier Zeilen standen in vier Skripten
 * (sprung_ziele.mjs, formel_ueberstand.mjs, figur_screenshot.mjs,
 * breiten_check.mjs) — und alle vier waren auf LINUX-Pfade verdrahtet:
 * `~/.cache/ms-playwright` und `chrome-linux/chrome`. Auf macOS liegt der
 * Cache unter `~/Library/Caches/ms-playwright`, und die Binaerdatei steckt in
 * einem .app-Bundle. Folge: jedes dieser Werkzeuge brach dort sofort mit
 * "Kein Chromium in …" ab — auch das Gate, das gerade erst dafuer gebaut
 * worden war. Vier Kopien einer Menge, die an genau einer Stelle stehen
 * sollte (P18).
 *
 * WARUM AUSSERHALB DER SKILLS: die Aufloesung wird von zwei verschiedenen
 * Skills gebraucht (`v013-verifikation` und `interaktive-aspekt-figur`).
 * Sie in einem der beiden zu fuehren hiesse, dass der andere ihn importiert —
 * eine stille Abhaengigkeit zwischen zwei sonst unabhaengigen Einheiten.
 * `_lib/` ist der neutrale Ort; der Unterstrich sagt, dass es kein Skill ist.
 *
 * BENUTZUNG:
 *
 *   import { playwrightLaden, chromiumPfad } from '../../_lib/browser.mjs';
 *   const { chromium } = playwrightLaden();          // wirft mit klarer Meldung
 *   const browser = await chromium.launch({ executablePath: chromiumPfad() });
 *
 * Beide Funktionen werfen einen Error mit einer Meldung, die sagt, was zu tun
 * ist. Der aufrufende Code faengt ihn und waehlt seinen eigenen Exit-Code —
 * die Skripte unterscheiden dort zwischen "Messung kaputt" (2) und "Befund"
 * (1), das gehoert ihnen, nicht diesem Modul.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

/** Wo `npm install --prefix …` die Pakete abgelegt hat. */
export const PW_PREFIX = process.env.PLAYWRIGHT_PREFIX || '/tmp/node_modules';

/**
 * playwright-core laden. Wirft, wenn es fehlt — mit dem Installationsbefehl.
 */
export function playwrightLaden(prefix = PW_PREFIX) {
    const require_ = createRequire(path.join(prefix, 'noop.js'));
    try {
        return require_('playwright-core');
    } catch {
        throw new Error(
            `playwright-core fehlt in ${prefix}.\n` +
            `  npm install --prefix ${path.dirname(prefix)} playwright-core`);
    }
}

/**
 * Die Browser-Cache-Verzeichnisse, in denen Playwright seine Downloads ablegt.
 * PLAYWRIGHT_BROWSERS_PATH ist Playwrights eigener Ueberschreib-Mechanismus und
 * gewinnt; danach der plattformuebliche Ort.
 */
function cacheOrte() {
    if (process.env.PLAYWRIGHT_BROWSERS_PATH) return [process.env.PLAYWRIGHT_BROWSERS_PATH];
    const home = os.homedir();
    switch (process.platform) {
        case 'darwin': return [path.join(home, 'Library/Caches/ms-playwright')];
        case 'win32':  return [path.join(home, 'AppData/Local/ms-playwright')];
        default:       return [path.join(home, '.cache/ms-playwright')];
    }
}

// Wo die ausfuehrbare Datei INNERHALB eines chromium-<rev>-Ordners liegt.
// Auf macOS steckt sie in einem .app-Bundle, unter Linux liegt sie flach.
const REL_VOLL = [
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-linux/chrome',
    'chrome-win/chrome.exe',
];
// Der Headless-Shell ist die abgespeckte Fassung, die `playwright install
// chromium` daneben ablegt. Er kann alles, was diese Werkzeuge brauchen
// (messen, fotografieren) — aber er ist der Rueckfall, nicht die erste Wahl:
// ohne vollen Browser fehlen z. B. Erweiterungen und einige Medien-Codecs.
const REL_SHELL = [
    'chrome-headless-shell-mac-arm64/chrome-headless-shell',
    'chrome-headless-shell-mac/chrome-headless-shell',
    'chrome-headless-shell-linux/chrome-headless-shell',
    'chrome-headless-shell-win/chrome-headless-shell.exe',
    'chrome-linux/headless_shell',
];

function suche(praefix, relPfade) {
    for (const cache of cacheOrte()) {
        if (!fs.existsSync(cache)) continue;
        // Hoechste Revision zuerst: "chromium-1234" vor "chromium-999".
        const ordner = fs.readdirSync(cache)
            .filter(d => new RegExp(`^${praefix}-\\d+$`).test(d))
            .sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop()))
            .reverse();
        for (const d of ordner) {
            for (const rel of relPfade) {
                const p = path.join(cache, d, rel);
                if (fs.existsSync(p)) return p;
            }
        }
    }
    return null;
}

/**
 * Pfad zur Chromium-Binaerdatei. Wirft, wenn keine da ist — mit dem
 * Installationsbefehl und den tatsaechlich durchsuchten Orten, damit ein
 * falsch gesetztes PLAYWRIGHT_BROWSERS_PATH sofort auffaellt.
 *
 * CHROMIUM_PATH ueberschreibt alles (Notausgang fuer ein System-Chrome).
 */
export function chromiumPfad() {
    if (process.env.CHROMIUM_PATH) {
        if (!fs.existsSync(process.env.CHROMIUM_PATH))
            throw new Error(`CHROMIUM_PATH zeigt ins Leere: ${process.env.CHROMIUM_PATH}`);
        return process.env.CHROMIUM_PATH;
    }
    const gefunden = suche('chromium', REL_VOLL) || suche('chromium_headless_shell', REL_SHELL);
    if (gefunden) return gefunden;
    throw new Error(
        `Kein Chromium gefunden. Durchsucht: ${cacheOrte().join(', ')}\n` +
        `  npx --prefix ${path.dirname(PW_PREFIX)} playwright install chromium\n` +
        `  (oder CHROMIUM_PATH auf eine vorhandene Chrome-Binaerdatei setzen)`);
}

/**
 * Beides in einem Schritt: geladenes playwright-core und der Browser-Pfad.
 * Deckt den Normalfall ab, in dem ein Skript nur starten will.
 */
export function browserUmgebung(prefix = PW_PREFIX) {
    const { chromium } = playwrightLaden(prefix);
    return { chromium, executablePath: chromiumPfad() };
}
