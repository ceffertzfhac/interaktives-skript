# Woher die v0.13-Quelle kommt (Zugriffsregel + Anker)

Dieses Repo transkribiert und verifiziert gegen die LaTeX-Quelle des
Druckskripts. Damit nicht jede Session gegen einen anderen Stand arbeitet, gilt:

## Die Regel

**Es gibt genau einen Zugriffspfad: `Input/v0.13/…`.** Jeder Verweis in Doku,
Backlog, Fragmentköpfen und Skills benutzt ihn. **Kein anderer Klon des
Skript-Repos wird angesprochen** — nicht per absolutem Pfad, nicht über einen
zweiten Symlink.

`Input/v0.13` ist ein Symlink und liegt unter `Input/`, ist also
**git-ignoriert**. Das Repo kann seinen Zielort daher nicht erzwingen — deshalb
diese Datei und die Prüfung unten. Auf einer neu aufgesetzten Maschine ist das
Anlegen des Symlinks ein bewusster Schritt:

```
ln -sfn ../../Project_Script/v0.13 Input/v0.13
```

**Maßgeblich ist der Arbeitsordner, aus dem nach GitHub gepusht wird:**
`…/VM_Exchange/Project_Script` (Remote `ceffertzfhac/Project_Script`, privat).
Auf dieser VM liegen zwei weitere Klone desselben Repos —
`Input/physik_skript_repo` (Altstand 26.07.2026) und `Share/Project_Script`
(Altstand 04.03.2026). **Beide sind keine Referenz.** Wer sie anfasst, arbeitet
gegen eine veraltete Vorlage, ohne es zu merken.

## Der Anker

| | Commit | Datum |
|---|---|---|
| WIP **inhaltlich nachgezogen bis** | `1c64edd` | 14.09.2026 |
| WIP **vollständig verifiziert gegen** | `1c64edd` | 14.09.2026 |
| Quelle **aktuell** | `1c64edd` | 14.09.2026 |

```
ANKER_VERIFIZIERT=1c64edd
ANKER_NACHGEZOGEN=1c64edd
```

**Die beiden Anker sagen Verschiedenes.** *Nachgezogen* heißt: das inhaltliche
Delta zwischen den Ständen ist Posten für Posten ins WIP übertragen.
*Verifiziert* heißt: der Skill `v013-verifikation` ist über Nummern, Verweise,
Formelsatz und Bildbestand gelaufen. Beides ist am 14.09.2026 gegen `1c64edd`
geschehen (Messwerte in `backlog/P21-statisches-skript-nachziehen.md`, P21-3).

**Was der Anker nicht einschließt:** die Sicht (Stufe 5 des Skills — Prosa
Wort für Wort gegen das PDF, Druckfluss, Optik). Sie braucht einen Menschen und
steht weiter aus; der Anker sagt nur, dass die *messbaren* Größen stimmen.

Was am 14.09.2026 (zweite Runde, Quelle `c6faf10` → `1c64edd`, gepusht)
nachgezogen wurde:

| Quell-Commit | Was | Wohin im WIP |
|---|---|---|
| `155587c`, `1c64edd` | die beiden Beispielzahlen in 0.1 ausgeschrieben (Elektronen-/Sonnenmasse) | `ch_00_grundlagen.html`, WIP `e46d382` (v1.49.3) |
| `54304e1`, `6b5566c`, `4063250` | AP8a–c, fünf doppelte `\label` | **kein WIP-Anteil** — stammen aus P21-A8, im WIP waren die Labels nie doppelt |
| `6c3b90f`…`541c997`, `bdb4229` | AP1–AP6 und zwei Quellfehler | **kein WIP-Anteil** — das WIP ist dort die Quelle (P21) |
| `e5afc53` | fünf fehlende Bilder ins Quell-Repo | **kein WIP-Anteil** — alle vier Abbildungen liegen im WIP bereits, das Logo hat es eigenständig (`d2db3fb`) |
| `65c798d`, `8b1ac66`, `830dcf9` | Neubauten des PDF | kein Inhalt — aber neue Verifikationsgrundlage (421 Seiten) |

Der Arbeitsvorrat dieser Richtung steht in
`backlog/P26-quelle-nach-wip-nachziehen.md`.

Erste Runde (Quelle → `c6faf10`):

| Quell-Commit | Was | Wohin im WIP |
|---|---|---|
| `a4d144b` | 13 `\blern`-Lernziel-Kästen (D4) | 10 Fragmente, WIP `8ec3d26` (v1.49.0) |
| `bb5f336` | 6 einleitende Sätze in Beispiel-Kästen (D6) | `ch_00_grundlagen.html`, WIP `9430479` (v1.49.1) |
| `2e6b8b7` | „Abbildung zum **Rechen**beispiel" in zwei Unterschriften | `ch_01_03_…html`, WIP `b81d2a6` (v1.49.2) |
| `1aceec7` | Aufteilung Beispiel/Rechenbeispiel (D5) | war im WIP schon vorher da (`cee6cf1`, v1.47.0) |
| `6fb53e9`, `4d83870` | Logo, Skizzenfarben, Titelblock, Inhaltsverzeichnis | **kein WIP-Anteil**: Vorspann und Satzspiegel des Druckdokuments; das Emblem hat das WIP eigenständig (`d2db3fb`, v1.48.0) |

Nebenbefund aus demselben Abgleich: zwei Unterschriften in
`pskript_mech_dyn_kraft_impuls_gmni_v3.tex` hat die Quelle bei `2e6b8b7`
**nicht** mitgezogen — sie stehen in `InteraktivesSkript_WIP/QUELLEN_FEHLER.md`
(1.2, Nr. 2 und 3).

Die Gegenrichtung (**WIP → Quelle**) führt
`backlog/P21-statisches-skript-nachziehen.md`; sie ist von diesem Anker
unberührt. Die Arbeitsposten **dieser** Richtung stehen seit dem 14.09.2026 in
`backlog/P26-quelle-nach-wip-nachziehen.md` — diese Datei führt den Stand, P26
die Posten.

## Die Prüfung

Vor jeder Migration, Abbildungsübernahme oder Verifikation:

```
bash .claude/skills/_lib/quelle_pruefen.sh
```

Das Skript sagt, wohin `Input/v0.13` auflöst, ob das der maßgebliche Ordner ist,
auf welchem Commit er steht, ob dort uncommittete Änderungen liegen und wie der
Stand zu **beiden** Ankern liegt (`ANKER_VERIFIZIERT`, `ANKER_NACHGEZOGEN`). Es
ändert nichts.

## Stellen, die auf den Stand der Quelle empfindlich sind

- **`InteraktivesSkript_WIP/QUELLEN_FEHLER.md`** — verankert Fundstellen über
  Anker (Label/Abschnitt/Zitat), nicht über Zeilennummern; Zeilennummern
  verschieben sich bei jeder Quelländerung.
- **Fragmentköpfe** in `chapters/` — nennen Quelldatei und Verifikationsdatum.
  Das Datum bezieht sich auf den damaligen Quellstand, nicht auf den heutigen.
- **Skill `v013-verifikation`** — vergleicht Nummern gegen das PDF der Quelle.
  Das PDF ist **mitversioniert** und wurde zuletzt in `1c64edd` erneuert (gebaut
  14.09.2026, **421 Seiten**) — es passt also zum aktuellen Quellstand, nicht
  mehr zu `ANKER_VERIFIZIERT`. Nach dem
  nächsten Quell-Commit ist es das nicht mehr automatisch. **Vorsicht bei einem
  laufenden LaTeX-Lauf im Quellordner:** ein abgebrochener Build hinterlässt dort
  eine winzige, unbrauchbare PDF-Datei. `quelle_pruefen.sh` meldet den Ordner
  dann als „uncommittete Änderungen" — dieser Hinweis ist genau dafür da.
