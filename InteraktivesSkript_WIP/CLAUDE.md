# `InteraktivesSkript_WIP/` — die Arbeitskopie

Gilt zusätzlich zur Wurzel-`CLAUDE.md`. Tiefer liegende Regeln laden sich beim
Anfassen der jeweiligen Dateien nach: `chapters/CLAUDE.md`, `src/CLAUDE.md`,
`src/figures/CLAUDE.md`.

## Aufbau

```
index.html      NUR die Shell: Header/Overlays, #paper-Mount mit je einem
                <div data-chapter="…">-Platzhalter pro Kapitel + der globalen
                .chapter-pagenav. Die Kapitel-Prosa liegt in chapters/ und wird
                zur Laufzeit injiziert (src/chapters.js). Die MathJax-Formeln
                ($$…$$ / \[…\] / \(…\)) stehen in den Kapitel-Fragmenten, nicht hier.
chapters/       ein HTML-Fragment je v0.13-Abschnitt  -> chapters/CLAUDE.md
src/            die ESM-Module (main.js + core/transform/ui/print/pages/shell/
                chapters.js + figures/*.js); kein monolithisches script.js
                (das lebt nur noch in Input/InteraktivesSkript_legacy/)
src/styles.css  Stile; darkmode.css wird geladen, aber `disabled`, und zur
src/darkmode.css   Laufzeit umgeschaltet
bilder/         statische Abbildungs-PNGs/-SVGs für den statischen Modus + die Prosa
src/assets/     SVG/PNG-Icons, die in die Highlight-Boxen injiziert werden
Archiv/         ältere Momentaufnahme derselben Site, hier eingebettet
                (nur Referenz, nicht verlinkt/aktiv) — NICHT bearbeiten
```

`__MACOSX/`, `*.DS_Store`, `Archiv.zip` — macOS-Zip-Metadaten/-Müll; ignoriert,
nicht bearbeiten.

## Runbooks in diesem Ordner

| Datei | Wofür |
|---|---|
| `MIGRATION_v0.13_nach_HTML.md` | nächsten Abschnitt aus `Input/v0.13/` migrieren |
| `INTERAKTIVE_ASPEKT_FIGUREN.md` | eine interaktive Aspekt-Figur bauen |
| `CHANGES_aspekt_1.38_1.40_und_grundgeruest.md` | Änderungshistorie der Aspekt-Figuren |
| `VERIFIKATION_kapitel_1.4.md`, `VERIFIKATION_kapitel_1.1.md` | Prüfpläne je migriertem Kapitel |
| `QUELLEN_FEHLER.md` | Fehler in der v0.13-Quelle selbst |
| `src/vendor/README.md` | Herkunft/Lizenz/Prüfsumme von qrjs2 |

Vollständiger Doku-Index mit „lies das, wenn …": `../DOKUMENTATION.md`.

## Kein Build, kein Paketmanager (Entscheidung v1.6)

Das Projekt bleibt **bewusst** ohne Build und ohne Paketmanager. Neu bewerten,
wenn einer dieser Auslöser eintritt: voller ~400-Seiten-Umfang, mehrere
Co-Autoren, oder spürbare Ladezeiten.

Kapitel-Fragmente werden zur Laufzeit über HTTPS geholt (GitHub Pages);
**Doppelklick auf `file://` wird nicht unterstützt** (kein `fetch`).

Die abhängigkeitsfreie Werkzeug-Basis ist **`.editorconfig`** im Repo-Wurzel-
verzeichnis — Editoren mit EditorConfig-Unterstützung lesen sie automatisch,
nichts zu installieren. Prettier/ESLint/TypeScript sind absichtlich auf einen
späteren leichten Vite-/esbuild-Build vertagt (s. `backlog/P1-struktur-token-effizienz.md`,
Build-/Bundler-Entscheidung); bis
dahin **keine `package.json` und keine Linter-Konfiguration** anlegen.

## Ausführen

Es gibt nichts zu bauen, zu linten oder zu testen. Eine Änderung prüft man,
indem man die Seite neu lädt und den betroffenen Slider bzw. die betroffene
Figur bedient. Startbefehl: s. Wurzel-`CLAUDE.md`.
