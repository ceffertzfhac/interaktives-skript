#!/usr/bin/env python3
# doku_drift_check.py — mechanischer Wächter gegen Doku-Drift (P19-4).
#
# Prüft, ob Zahlen und Existenzaussagen in der Doku mit dem Code übereinstimmen.
# Die inhaltlichen Restbefunde aus dem Review nach P18 (15/14 statt 16 Aspekt-
# Figuren, fehlender vierter Motor, 18 statt 20 Paletten-Token, gc10 etc.) waren
# alle mechanisch auffindbar — dieses Skript fängt künftige Drift dieser Art.
#
# Aufruf:  python3 doku_drift_check.py     (aus der Repo-Wurzel oder darüber)
# Exit:    0 = alle Prüfungen bestanden · ≠0 = mindestens eine Abweichung
# Abhängigkeiten: KEINE (nur Python-stdlib; die „kein Paketmanager"-Vorgabe
#                 bleibt gewahrt).
#
# Wird ein Legacy-Name (factory.js, fig_5.js, transform.js) in einer Doku
# erwähnt, muss die erwähnende Datei den Marker „Abgelöst seit v1.7" tragen
# (P19-1) — sonst feuert der Wächter. Das ist eine grobe, aber wirksame Wache:
# wer den Marker entfernt, während der Legacy-Name bleibt, wird Drift gemeldet.

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WIP = ROOT / "InteraktivesSkript_WIP"
CHAPTERS = WIP / "chapters"
FIGURES = WIP / "src" / "figures"
MAIN_JS = WIP / "src" / "main.js"
README = ROOT / "README.md"
FIGURES_CLAUDE = FIGURES / "CLAUDE.md"
SRC_CLAUDE = WIP / "src" / "CLAUDE.md"
PALETTEN_CSS = FIGURES / "aspekt_paletten.css"
INDEX_HTML = WIP / "index.html"

MARKER = "Abgelöst seit v1.7"  # P19-1: Legacy-Abschnitte sind so markiert

failures: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


# --- Hilflein: ASPEKT_FACTORIES-Schlüssel aus main.js -----------------------

def aspekt_factories() -> list[str]:
    """Schlüssel des ASPEKT_FACTORIES-Objekts aus main.js (Reihenfolge wie Code)."""
    text = read(MAIN_JS)
    m = re.search(r"const\s+ASPEKT_FACTORIES\s*=\s*\{(.*?)\}\s*;", text, re.S)
    if not m:
        fail("Konnte `const ASPEKT_FACTORIES = { … };` in main.js nicht finden.")
        return []
    body = m.group(1)
    return re.findall(r"'([a-z0-9_-]+)'\s*:", body)


def chapter_aspekt_keys() -> set[str]:
    """Alle in chapters/*.html genutzten data-aspekt-Werte."""
    keys: set[str] = set()
    for f in sorted(CHAPTERS.glob("ch_*.html")):
        keys |= set(re.findall(r'data-aspekt="([^"]+)"', read(f)))
    return keys


# === Check 1: aspekt_*.js == ASPEKT_FACTORIES == README-Zahl ================

def check_aspekt_count() -> None:
    files = sorted(FIGURES.glob("aspekt_*.js"))
    factory_keys = aspekt_factories()
    readme = read(README)
    m = re.search(r"(\d+)\s+interaktive[ns]?\s+Aspekt-Figur", readme)
    readme_n = int(m.group(1)) if m else None

    n_files, n_fac = len(files), len(factory_keys)
    if not (n_files == n_fac == readme_n == 16):
        fail(
            "Check 1 (Aspekt-Figuren-Zahl): aspekt_*.js=%d · "
            "ASPEKT_FACTORIES=%d · README=%r — erwartet überall 16."
            % (n_files, n_fac, readme_n)
        )
        return
    # Dubletten im Factory-Objekt?
    if len(set(factory_keys)) != n_fac:
        fail("Check 1: ASPEKT_FACTORIES hat Duplikat-Schlüssel: %r" % factory_keys)


# === Check 2: data-aspekt in chapters ⊆ ASPEKT_FACTORIES ===================

def check_chapter_keys_subset() -> None:
    chap = chapter_aspekt_keys()
    fac = set(aspekt_factories())
    unknown = chap - fac
    if unknown:
        fail("Check 2 (data-aspekt ⊆ ASPEKT_FACTORIES): chapters referenzieren "
             "unbekannte Fabriken: %s" % sorted(unknown))
    extras = fac - chap
    if extras:
        fail("Check 2: ASPEKT_FACTORIES ohne data-aspekt-Vorkommen in chapters "
             "(Fabrik ohne Figur?): %s" % sorted(extras))


# === Check 3: Motor-Ordner == Motoren-Tabelle in figures/CLAUDE.md ==========

EXPECTED_MOTORS = {"bus_weg_zeit", "federpendel", "grundbegriffe", "kreis_spiral",
                   "kreisbewegung"}


def check_motors() -> None:
    dirs = {p.name for p in FIGURES.iterdir() if p.is_dir()}
    text = read(FIGURES_CLAUDE)
    # Motoren-Tabelle: Zeilen der Form | `kreisbewegung/` | …
    # Ueberschrift bewusst OHNE Zahl ("Die Motoren"): sonst muss sie bei jedem
    # weiteren Motor umbenannt werden — und mit ihr dieser Regex (P18: Mengen
    # nicht in Prosa zaehlen).
    section = re.search(r"## Die Motoren(.*?)(\n## |\Z)", text, re.S)
    table_names = set(re.findall(r"`([a-z_]+)/`", section.group(1))) if section else set()
    if not (dirs == table_names == EXPECTED_MOTORS):
        fail("Check 3 (Motoren): Ordner=%s · Tabelle=%s · erwartet=%s"
             % (sorted(dirs), sorted(table_names), sorted(EXPECTED_MOTORS)))


# === Check 4: README „Kapitel-Fragmente" == ch_*.html-Count; TK-Zahl =======

def check_chapter_count() -> None:
    n_html = len(list(CHAPTERS.glob("ch_*.html")))
    readme = read(README)
    m = re.search(r"(\d+)\s+Kapitel-Fragment", readme)
    readme_n = int(m.group(1)) if m else None
    if not (n_html == readme_n == 17):
        fail("Check 4 (Kapitel-Fragmente): ch_*.html=%d · README=%r — erwartet 17."
             % (n_html, readme_n))
    # Themenkomplexe: README sagt „Vier Themenkomplexe"; index.html data-tk-num.
    if not re.search(r"Vier\s+Themenkomplexe", readme):
        fail("Check 4: README erwähnt „Vier Themenkomplexe“ nicht.")
    tk = set(re.findall(r'data-tk-num="([^"]+)"', read(INDEX_HTML)))
    if len(tk) != 4:
        fail("Check 4: index.html führt %d distincte data-tk-num (erwartet 4): %s"
             % (len(tk), sorted(tk)))


# === Check 5: Paletten-Token-Zahl (eine Quelle: aspekt_paletten.css-Kopf) ==

def check_palette_tokens() -> None:
    css = read(PALETTEN_CSS)
    # Genannte Zahl im Kopfkommentar.
    m_kb = re.search(r"(\d+)\s+--kb-\*", css)
    m_gk = re.search(r"(\d+)\s+--gk-\*", css)
    stated_kb = int(m_kb.group(1)) if m_kb else None
    stated_gk = int(m_gk.group(1)) if m_gk else None
    # Tatsächliche Deklarationen (Name mit folgendem Doppelpunkt; der Kopf-
    # kommentar „20 --kb-*" matched NICHT, da kein echter Name).
    kb_decls = re.findall(r"--kb-[a-z0-9-]+:", css)
    gk_decls = re.findall(r"--gk-[a-z0-9-]+:", css)
    n_kb, n_gk = len(kb_decls), len(gk_decls)
    distinct_kb = len(set(kb_decls))
    # 4 Override-Blöcke (deuter/tritan × hell/dunkel) → je Block stated_kb.
    ok_kb = (stated_kb == 20 and distinct_kb == 20
             and n_kb % 4 == 0 and n_kb // 4 == 20)
    ok_gk = (stated_gk == 5 and n_gk % 4 == 0 and n_gk // 4 == 5)
    if not ok_kb:
        fail("Check 5 (--kb-*-Token): Kopf nennt %r · %d distincte Namen · "
             "%d Deklarationen (≈%d je Block) — erwartet 20 je Block (80 ges.)."
             % (stated_kb, distinct_kb, n_kb,
                n_kb // 4 if n_kb % 4 == 0 else -1))
    if not ok_gk:
        fail("Check 5 (--gk-*-Token): Kopf nennt %r · %d Deklarationen — "
             "erwartet 5 je Block (20 ges.)." % (stated_gk, n_gk))


# === Check 6: genannte Datei-/Symbolnamen existieren oder sind historisch ===

# (a) Live-Referenzen — diese Dateien MÜSSEN existieren.
LIVE_FILES = [
    FIGURES / "aspekt_kreisbahn.css",
    FIGURES / "aspekt_paletten.css",
    ROOT / ".claude/skills/interaktive-aspekt-figur/scripts/cvd_check.mjs",
    ROOT / ".claude/skills/interaktive-aspekt-figur/scripts/caption_farbwort_check.mjs",
    ROOT / ".claude/skills/v013-verifikation/scripts/dom_harness.mjs",
    ROOT / ".claude/skills/v013-verifikation/scripts/referenznummern.py",
    ROOT / ".claude/skills/v013-verifikation/scripts/mathjax_pruefen.cjs",
]

# (b) Legacy-Namen — erwähnt nur in Doku, die den P19-1-Marker trägt.
LEGACY_NAMES = ["factory.js", "fig_5.js", "transform.js"]
LEGACY_DOC_FILES = [FIGURES_CLAUDE, SRC_CLAUDE]


def check_named_files() -> None:
    for p in LIVE_FILES:
        if not p.exists():
            fail("Check 6a (Live-Referenz existiert): %s fehlt." % p)
    for name in LEGACY_NAMES:
        for doc in LEGACY_DOC_FILES:
            if name in read(doc) and MARKER not in read(doc):
                fail("Check 6b (Legacy-Name ohne Marker): %s erwähnt %r, aber die "
                     "Datei trägt nicht den Marker „%s“ (P19-1 entfernt?)."
                     % (doc, name, MARKER))


# === Check 7: kein id="gcN" in chapters (seit v1.7 wahr) ===================

def check_no_gcn() -> None:
    hits: list[str] = []
    for f in sorted(CHAPTERS.glob("ch_*.html")):
        for m in re.finditer(r'id="gc\d+"', read(f)):
            hits.append("%s: %s" % (f.name, m.group(0)))
    if hits:
        fail("Check 7 (kein id=\"gcN\" in chapters): %d Treffer — %s"
             % (len(hits), hits[:5]))


def main() -> int:
    checks = [
        check_aspekt_count,
        check_chapter_keys_subset,
        check_motors,
        check_chapter_count,
        check_palette_tokens,
        check_named_files,
        check_no_gcn,
    ]
    for c in checks:
        try:
            c()
        except FileNotFoundError as e:
            fail("Prüfung %s konnte Datei nicht öffnen: %s" % (c.__name__, e))

    if failures:
        print("doku_drift_check: %d Abweichung(en) gefunden.\n" % len(failures))
        for f in failures:
            print("  ✗ " + f)
        print("\nDoku sagt etwas, das der Code nicht bestätigt — eine Stelle "
              "anpassen (Doku oder Code), dann neu laufen lassen.")
        return 1
    print("doku_drift_check: alle 7 Prüfungen bestanden — Doku und Code sind "
          "konsistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())