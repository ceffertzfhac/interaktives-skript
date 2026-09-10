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
| WIP **transkribiert/verifiziert gegen** | `3122514` | 26.07.2026 |
| Quelle **aktuell** | `c6faf10` | 03.09.2026 |

```
ANKER_VERIFIZIERT=3122514
```

Die beiden Stände sind **nicht** deckungsgleich: die Quelle ist dem WIP
inzwischen voraus (13 `\blern`-Lernziel-Kästen, die das WIP nicht hat, sowie
zusätzliche Prosa in `pskript_grundlagen_gmni_v2.tex` und im Vorspann). Dieses
Delta ist Sync-Schuld in Richtung **Quelle → WIP** und gehört nachgezogen; die
Gegenrichtung (WIP → Quelle) führt `backlog/P21-statisches-skript-nachziehen.md`.

Wird das Delta nachgezogen, wird `ANKER_VERIFIZIERT` hier auf den dann
verifizierten Commit gesetzt — sonst weiß die nächste Session wieder nicht,
gegen was geprüft wurde.

## Die Prüfung

Vor jeder Migration, Abbildungsübernahme oder Verifikation:

```
bash .claude/skills/_lib/quelle_pruefen.sh
```

Das Skript sagt, wohin `Input/v0.13` auflöst, ob das der maßgebliche Ordner ist,
auf welchem Commit er steht, ob dort uncommittete Änderungen liegen und ob der
Stand vom Anker abweicht. Es ändert nichts.

## Stellen, die auf den Stand der Quelle empfindlich sind

- **`InteraktivesSkript_WIP/QUELLEN_FEHLER.md`** — verankert Fundstellen über
  Anker (Label/Abschnitt/Zitat), nicht über Zeilennummern; Zeilennummern
  verschieben sich bei jeder Quelländerung.
- **Fragmentköpfe** in `chapters/` — nennen Quelldatei und Verifikationsdatum.
  Das Datum bezieht sich auf den damaligen Quellstand, nicht auf den heutigen.
- **Skill `v013-verifikation`** — vergleicht Nummern gegen das PDF der Quelle.
  Das PDF im Repo ist am 16.07.2026 gebaut; nach dem nächsten Quell-Commit ist
  es nicht mehr automatisch aktuell.
