# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

**Diese Datei ist bewusst kurz und muss es bleiben** — sie liegt in *jedem* Turn
im Kontext. Hier stehen nur Regeln, die für *jede* Aufgabe gelten. Alles
Subsystem-Wissen liegt in verschachtelten `CLAUDE.md`-Dateien, die Claude Code
automatisch nachlädt, sobald Dateien im jeweiligen Unterbaum gelesen oder
geändert werden (s. Wegweiser unten).

> **Doku-Regel (P18):** *Mengen werden nicht in Prosa aufgezählt, sondern
> verlinkt.* Eine neue Figur, ein neuer Motor, ein neues Kapitel dürfen **keine
> Zeile** in dieser Datei erzeugen — sonst wächst der Pflichtkontext mit dem
> Projekt. Detail gehört zum Code (Modul-Kopfkommentar) oder ins zuständige
> Runbook, nicht hierher.

## What this is

A static, single-page interactive physics script (German, topic: rotational
motion / *Drehbewegungen auf Kreisbahnen*) for an FH Aachen course. There is **no
build system, package manager, bundler, or test suite** — it is plain
HTML/CSS/vanilla JS served as static files. All interactivity is hand-written
DOM/SVG manipulation. Two third-party libraries: MathJax v3 `tex-svg` (LaTeX
rendering) from a CDN, and `qrjs2` (print QR codes) **vendored locally** at
`src/vendor/qrjs2.min.js` — see `src/vendor/README.md` for provenance/licence/
checksum and why it is not on a CDN.

> **Scalability is a hard constraint.** The final script will be a *complete*
> script with **15+ chapters and many more figures** — the content target lives
> in `Input/v0.13/`. The original monolithic, copy-paste-per-figure architecture
> (preserved in `Input/InteraktivesSkript_legacy/`) does not scale there. When
> proposing changes, optimize for "adding a chapter/figure is O(1) files and
> small token cost," not O(size-of-whole-file). The modernization plan toward
> that target lives in `BACKLOG.md` (with a target architecture sketch). When
> working in the WIP, also weigh **token efficiency of edits** — prefer edits
> that touch one small module over ones that require loading a whole large file.

## Running it

Serve `InteraktivesSkript_WIP/` with any static server and open `index.html`.
MathJax loads from a CDN, so a network connection is needed for formulas (qrjs2
is local); chapter prose is fetched at runtime (`src/chapters.js`), which
**requires an http(s) origin — `file://` will load no chapter content** (the page
shell still renders). A local server covers both:

```
cd InteraktivesSkript_WIP
python3 -m http.server 8000
# open http://localhost:8000/
```

## Repository layout

- `InteraktivesSkript_WIP/` — **the working copy. All edits go here.** This is
  the only folder you should modify. (Innerhalb davon ist `Archiv/` eine
  historische Kopie und ebenfalls in Ruhe zu lassen.)
- `InteraktivesSkript_DesignPrototype/` — a preserved snapshot kept as a
  design/diff reference. **Read-only, never edit.**
- `Input/` — drop folder for source material the user provides; **read-only
  reference, do not edit**. **Untracked and git-ignored on purpose** — the
  repository is public and this material must not be published, so it exists
  only in the local working copy (see `.gitignore`). **Never `git add` anything
  under `Input/`:**
  - `Input/InteraktivesSkript_legacy/` — the **frozen baseline** snapshot of the
    site as of the split. Do not edit; it exists for reference/diffing against
    WIP. Started byte-identical to WIP. *(The legacy `src/script.js` — the whole
    app in one 2787-line file — lives only here now.)*
  - `Input/v0.13/` — LaTeX source of the **complete target script** (`.tex` +
    compiled `.pdf`). This is the content target the WIP is being scaled toward.
  - `Input/Simulationen/` — standalone simulation projects; candidate source
    material for future interactive figures. Welche davon bereits als
    Figuren-Motor portiert sind (und mit welchen Port-Änderungen), steht in
    `InteraktivesSkript_WIP/src/figures/CLAUDE.md`.

## Arbeitsregeln (Nutzervorgaben — gelten bei JEDEM Aufruf)

- **Nur `InteraktivesSkript_WIP/` bearbeiten.** `Input/` und
  `InteraktivesSkript_DesignPrototype/` sind Referenz, niemals ändern.
- **Kleinschrittig commiten.** Änderungen werden **pro logischer Einheit** als
  eigener kleiner Commit abgegeben, nicht als ein großer Sammel-Commit. Eine
  logische Einheit = ein Feature/Aspekt/Fix samt seinen Dateien. Vor jedem
  Commit die betroffenen Dateien gezielt `git add`-en, `git diff --cached`
  prüfen (schon zweimal ein stale-Index-Bug: c9fff3f, a655912), eine knappe
  deutsche Commit-Message schreiben (Co-Authored-By-Footer nicht vergessen),
  dann den nächsten.
- **Nicht pushen/mergen ohne ausdrückliche Freigabe.** Committen ja, pushen nur
  auf Aufforderung.
- **Versionierung `#header_version`** (ab v1.15.1): **immer dreistellig**
  `MAJOR.MINOR.PATCH` (alle drei Stellen werden geschrieben, auch die `0`).
  **Neuer Abschnitt / größeres Feature → MINOR +1, PATCH auf 0**
  (`1.15.2 → 1.16.0 → 1.17.0 …`); **Kleinänderung (Fix, Text/Optik-Anpassung,
  Doku) → PATCH +1** (`1.16.0 → 1.16.1 …`). MAJOR bleibt vorerst `1`. Die Version
  steht als einzige Quelle in `index.html` (`#header_version`) und wird pro
  Commit-Einheit passend zur Änderungsart mitgezogen. (Historisch bis v1.15 wurde
  die MINOR-Stelle auch für Kleinänderungen genutzt und zweistellig geschrieben;
  die feinere Stufung gilt erst *ab jetzt*.)
- **README bei Stand-Wechsel nachziehen** (ab 2026-07-30): die Repo-`README.md`
  (Abschnitt „Was drin ist (Arbeitsstand)") muss bei **jeder inhaltlichen
  Stand-Änderung** nachgezogen werden — neue/entfernte interaktive Figur, neuer
  Motor, neues Kapitel/Themenkomplex, geänderte Figuren-/Fragment-/TK-Zahlen. Im
  selben Arbeitszyklus als **eigener kleiner `docs(readme):`-Commit** (nicht
  wochenlang aufschieben); auf GitHub steht die Änderung erst nach Merge/Push
  nach `main` (nur auf ausdrückliche Freigabe).
- **Druckskript und interaktives Skript bleiben synchron** (ab 2026-08-28,
  Nutzervorgabe: *„die Dokumentation der Abweichungen ist absolut
  missionskritisch"*). Das WIP **darf** inhaltlich von `Input/v0.13/` abweichen
  (Reihenfolge, Zusatzabsatz, Bildunterschrift, zusätzliche Formel) — aber
  **jede solche Abweichung zieht einen abhakbaren Backlog-Eintrag nach sich**
  (`backlog/P21-statisches-skript-nachziehen.md`), damit das Druckskript später
  nachgezogen werden kann — von **irgendwem**, nicht nur von dem, der sie
  gemacht hat: der Eintrag nennt Zieldatei, Stelle und den einzusetzenden Text
  wörtlich. Ohne diesen Eintrag ist die Änderung **nicht fertig**.
  Wohin was gehört (Fragmentkopf / P21 / Commit) und was *keine* Abweichung in
  diesem Sinn ist: `InteraktivesSkript_WIP/chapters/CLAUDE.md`. Fehler der
  Vorlage selbst laufen weiter über `QUELLEN_FEHLER.md`.
- **Sprache:** Inhalte und Code-Kommentare sind auf Deutsch; beim Bearbeiten von
  Prosa oder Kommentaren die umgebende Sprache übernehmen.

## Wegweiser — wo steht was

Diese Dateien laden sich **automatisch** nach, sobald Dateien im jeweiligen
Ordner gelesen/geändert werden. Bei reinen Planungsfragen ohne Dateizugriff
gezielt öffnen.

| Datei | Inhalt |
|---|---|
| `InteraktivesSkript_WIP/CLAUDE.md` | Ordneraufbau der Site, Runbook-Übersicht, „kein Build"-Entscheidung |
| `InteraktivesSkript_WIP/chapters/CLAUDE.md` | Fragment-Konvention, Nummerierung + Offsets, MathJax-Gleichungsnummern, Querverweis-Deskriptoren, Bildgrößen |
| `InteraktivesSkript_WIP/src/CLAUDE.md` | Modul-Layout, Dependency-Graph, `data-action`-Binder, Paginierung, App-Shell, Druck/QR/Zoom/Darkmode, Breiten-Modus, A11y, Safari-Workaround |
| `InteraktivesSkript_WIP/src/figures/CLAUDE.md` | Fabrik-Muster, die vier Figuren-Motoren, Aspekt-Figuren + Dispatch, Farbpaletten/CVD |
| `DOKUMENTATION.md` | Index **aller** Dokus mit „lies das, wenn …" |
| `BACKLOG.md` | **Index** des Arbeitsvorrats (ein Satz je Item); Details je Item in `backlog/<item>.md` |
| `README.md` | öffentliche Projektbeschreibung + Arbeitsstand |
