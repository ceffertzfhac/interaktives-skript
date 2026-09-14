<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P26 — Sync-Schuld Quelle → WIP nachziehen

Angelegt 2026-09-14. **Gegenrichtung zu P21.** P21 führt die Abweichungen, die
das interaktive Skript aufgebaut hat und die das Druckskript nachziehen muss;
hier stehen die Änderungen, die **im Druckskript** entstanden sind und die das
WIP nachziehen muss.

**Warum getrennt von P21:** die beiden Richtungen haben verschiedene Auslöser
(hier: ein Commit im LaTeX-Repo; dort: eine Entscheidung im WIP), verschiedene
Bearbeiter und verschiedene Anker. Das Buchführungs-Instrument dieser Richtung
ist die Anker-Tabelle in `QUELLE_v013.md` (`ANKER_NACHGEZOGEN`): sie sagt, bis
zu welchem Quell-Commit das Delta übertragen ist. **Dieses Item hält die
Arbeitsposten, die Tabelle den Stand.** Ein Posten ist erst erledigt, wenn er
im WIP steht *und* der Anker nachgezogen ist.

**Zusammenhang mit P12:** P12 überträgt Inhalt, den das WIP **noch nie** hatte
(Migration). P26 überträgt Inhalt, den das WIP hatte und der sich in der Quelle
**geändert** hat. Wer hier arbeitet, prüft beides nicht doppelt.

---

### Runde `c6faf10` → `1c64edd` (14.09.2026, gepusht)

*(In `QUELLE_v013.md` heißt dieselbe Runde die „zweite" — die erste lief vor
diesem Register. Runden werden hier über die Commit-Spanne benannt, nicht
nummeriert.)*

**Ohne WIP-Anteil, geprüft am 2026-09-14** (hier nur, damit niemand sie ein
zweites Mal prüft):

| Quell-Commit | Was | Warum nichts zu tun |
|---|---|---|
| `6c3b90f`–`541c997` | AP1–AP6 der Übergabe | stammen **aus** dem WIP (P21), das WIP ist dort die Quelle |
| `bdb4229` | zwei Quellfehler in 1.1 | im WIP längst korrigiert, s. `QUELLEN_FEHLER.md` 1.1 Nr. 5/6 |
| `e5afc53` | fünf fehlende Bilder ins Repo | alle vier Abbildungen liegen im WIP bereits (`bilder/Flemings_right_hand_rule.png`, `…kippbedingung_1/2.png`, `Drehmoment_auf_Leiterschleife_Seitenansicht.png`); das Logo hat das WIP eigenständig (`d2db3fb`) |
| `65c798d`, `8b1ac66`, `830dcf9` | Neubauten des PDF | kein Inhalt — **aber** Verifikationsgrundlage, s. P26-2 |
| `54304e1`, `6b5566c`, `4063250` | AP8a–c, fünf doppelte `\label` | stammen **aus** diesem Register (P21-A8); im WIP waren die Labels nie doppelt |

### Sub-Tasks

- [x] **P26-1 Zehnerpotenzen 0.1: die beiden Beispielzahlen ausschreiben** *(S)*
  — **erledigt 2026-09-14** (`e46d382`, v1.49.3). Beide Gleichungen bleiben
  nummeriert, 0.1 führt weiter 12 Nummern; `formel_ueberstand.mjs` über alle
  drei Breiten-Modi: 0 Übersteher, die 31-stellige Zahl passt in die Spalte.
  Die Quelle war beim Nachziehen korrigiert (`1c64edd`, zehn Nullergruppen,
  im PDF nachgerechnet 9,1090E-31).
  **Quelle:** `pskript_grundlagen_gmni_v2.tex`, § „Rechnen mit Zehnerpotenzen"
  (Nutzeränderung vom 14.09.2026, Commits `155587c` + `1c64edd`).
  **Ziel:** `InteraktivesSkript_WIP/chapters/ch_00_grundlagen.html`, direkt unter
  `<h2 …>0.1 Rechnen mit Zehnerpotenzen</h2>`.

  **Was sich ändert.** Der Absatz begründet, *warum* man Zehnerpotenzen braucht
  — und zeigt die beiden Beispielzahlen bisher ausgerechnet in eben dieser
  Schreibweise (`9{,}109\cdot 10^{-31}\,\mathrm{kg}`). Die Quelle schreibt sie
  jetzt in voller Dezimalschreibweise aus; im `.tex` steht der Kommentar
  *„diese Zahlen unbedingt in Dezimalschreibweise stehen lassen, da sie als
  Beispiel dienen"*. Das WIP muss mit, sonst nimmt der Absatz sein eigenes
  Argument vorweg.

  **Einzusetzen** (die beiden vorhandenen `\begin{equation}`-Blöcke behalten
  und nur ihren Inhalt ersetzen; Ziffern in Dreiergruppen mit `\,`, wie in der
  Quelle):

  ```
  0{,}000\,000\,000\,000\,000\,000\,000\,000\,000\,000\,9109\,\mathrm{kg};
  ```
  ```
  1\,989\,000\,000\,000\,000\,000\,000\,000\,000\,000\,\mathrm{kg}.
  ```

  Dazu der Anschlusssatz: aus „während die Masse der Sonne extrem groß ist,
  etwa" wird „die Masse der Sonne ist dagegen extrem groß, etwa" (so steht es
  jetzt in der Quelle).

  **Nummerierung bleibt, wie sie ist** — geklärt am 14.09.2026: die Quelle
  setzt die beiden Zahlen weiter als **nummerierte** Gleichungen (`\be`/`\ee`,
  im `.tex` mit Kommentar begründet), nicht als `\[…\]`. Abschnitt 0.1 behält
  damit auf beiden Seiten seine **12** Gleichungsnummern; im WIP sind die
  beiden `equation`-Umgebungen also **unangetastet zu lassen**. (Der erste
  Entwurf dieses Eintrags ging noch von unnummerierten `\[…\]` aus — das ist
  erledigt, hier ist nichts mehr zu entscheiden.)

  **Zahlendreher, erledigt.** Die erste Fassung (`155587c`) hatte 27 Nullen
  nach dem Komma, also \(9{,}109\cdot 10^{-28}\) — eine Dreiergruppe fehlte.
  Mit `1c64edd` sind es zehn Gruppen; im neu gebauten PDF nachgerechnet
  9,1090E-31 bzw. 1,9890E+30. Nachgezogen wurde erst danach, der Fehler war
  also nie im WIP.

  **Erledigt, wenn:** beide Zahlen ausgeschrieben in Dezimalschreibweise
  stehen, die Elektronenmasse zehn Nullergruppen hat, Abschnitt 0.1 weiterhin
  12 Gleichungsnummern führt und der Absatz in beiden Fassungen dasselbe
  zeigt.

- [x] **P26-2 Anker und Verifikationsgrundlage nachziehen** *(S)* —
  **erledigt 2026-09-14**: `ANKER_NACHGEZOGEN` steht auf `1c64edd`, die
  Runde-2-Tabelle in `QUELLE_v013.md` nennt den einen Posten mit WIP-Anteil.
  `ANKER_VERIFIZIERT` bleibt auf `3122514`, bis ein Verifikationslauf gegen das
  neue PDF (421 Seiten, `1c64edd`) ihn nachzieht — das ist P21-3 bzw. P12-G.
  Auch der Hinweis zum `v013-verifikation`-Skill zeigt jetzt auf das neue PDF
  (vorher `4d83870`/419 Seiten).

- [ ] **P26-3 Routine festhalten** *(S)* — jetzt, wo zwei Runden durch sind: in einem Satz
  in `QUELLE_v013.md` verankern, dass ein Quell-Update immer diesen Weg geht
  (Delta ansehen → Posten hier → Anker setzen), damit die nächste Runde nicht
  wieder ad hoc läuft.
