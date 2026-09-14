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

### Runde 1 — Quellstand `c6faf10` (03.09.2026) → `8b1ac66` + Folgecommit (14.09.2026)

**Ohne WIP-Anteil, geprüft am 2026-09-14** (hier nur, damit niemand sie ein
zweites Mal prüft):

| Quell-Commit | Was | Warum nichts zu tun |
|---|---|---|
| `6c3b90f`–`541c997` | AP1–AP6 der Übergabe | stammen **aus** dem WIP (P21), das WIP ist dort die Quelle |
| `bdb4229` | zwei Quellfehler in 1.1 | im WIP längst korrigiert, s. `QUELLEN_FEHLER.md` 1.1 Nr. 5/6 |
| `e5afc53` | fünf fehlende Bilder ins Repo | alle vier Abbildungen liegen im WIP bereits (`bilder/Flemings_right_hand_rule.png`, `…kippbedingung_1/2.png`, `Drehmoment_auf_Leiterschleife_Seitenansicht.png`); das Logo hat das WIP eigenständig (`d2db3fb`) |
| `65c798d`, `8b1ac66` | Neubauten des PDF | kein Inhalt — **aber** Verifikationsgrundlage, s. P26-2 |

### Sub-Tasks

- [ ] **P26-1 Zehnerpotenzen 0.1: die beiden Beispielzahlen ausschreiben** *(S)*.
  **Quelle:** `pskript_grundlagen_gmni_v2.tex`, § „Rechnen mit Zehnerpotenzen"
  (Nutzeränderung vom 14.09.2026, im Arbeitsbaum noch nicht committet — vor dem
  Nachziehen prüfen, ob sie so eingegangen ist).
  **Ziel:** `InteraktivesSkript_WIP/chapters/ch_00_grundlagen.html`, direkt unter
  `<h2 …>0.1 Rechnen mit Zehnerpotenzen</h2>`.

  **Was sich ändert.** Der Absatz begründet, *warum* man Zehnerpotenzen braucht
  — und zeigt die beiden Beispielzahlen bisher ausgerechnet in eben dieser
  Schreibweise (`9{,}109\cdot 10^{-31}\,\mathrm{kg}`). Die Quelle schreibt sie
  jetzt in voller Dezimalschreibweise aus; im `.tex` steht der Kommentar
  *„diese Zahlen unbedingt in Dezimalschreibweise stehen lassen, da sie als
  Beispiel dienen"*. Das WIP muss mit, sonst nimmt der Absatz sein eigenes
  Argument vorweg.

  **Einzusetzen** (die beiden `\begin{equation}`-Blöcke ersetzen; Ziffern in
  Dreiergruppen mit `\,`, wie in der Quelle):

  ```
  \[
  0{,}000\,000\,000\,000\,000\,000\,000\,000\,000\,000\,9109\,\mathrm{kg};
  \]
  ```
  ```
  \[
  1\,989\,000\,000\,000\,000\,000\,000\,000\,000\,000\,\mathrm{kg}.
  \]
  ```

  **Achtung, die Quelle hat dort einen Zahlendreher** (Stand 14.09.2026,
  uncommitted): die Elektronenmasse steht mit **27** Nullen nach dem Komma da,
  das ist \(9{,}109\cdot 10^{-28}\,\mathrm{kg}\) — Faktor 1000 zu groß.
  Für \(9{,}109\cdot 10^{-31}\) braucht es **30** Nullen, also **zehn**
  Dreiergruppen statt neun. Der Block oben ist bereits korrigiert. Ist die
  Quelle beim Nachziehen noch falsch, zuerst **dort** richtigstellen — das WIP
  darf den Fehler nicht übernehmen. (Die Sonnenmasse stimmt: 1989 + 27 Nullen
  = \(1{,}989\cdot 10^{30}\).)

  **Nicht übersehen — das ist der eigentliche Punkt:** die Quelle setzt sie als
  **unnummerierte** `\[…\]`, das WIP hat dort zwei **nummerierte** `equation`.
  Werden sie im WIP nummeriert gelassen, laufen die Gleichungsnummern in 0.1
  auseinander: im Abschnitt stehen 12 nummerierte Umgebungen, die zehn
  folgenden rutschen auf der Druckseite um **zwei** nach vorn. In 0.1 gibt es
  im WIP weder `\label` noch Querverweis (0 Treffer), der Schaden ist also rein
  optisch — aber die Gegenprüfung würde ihn melden.

  **Erledigt, wenn:** beide Zahlen ausgeschrieben und unnummeriert stehen, die
  erste Gleichungsnummer in 0.1 im WIP und im PDF dieselbe ist, und der Absatz
  in beiden Fassungen dasselbe zeigt.

- [ ] **P26-2 Anker und Verifikationsgrundlage nachziehen** *(S)* — nach der
  Sitzung im LaTeX-Repo (AP8, s. P21-2): in `QUELLE_v013.md` die Tabelle
  „Was nachgezogen wurde" um Runde 1 ergänzen, `ANKER_NACHGEZOGEN` auf den
  dann aktuellen Quell-Commit setzen. Dabei beachten: das mitversionierte
  Quell-PDF ist neu gebaut (**421 Seiten** statt 419), der Hinweis zum
  `v013-verifikation`-Skill in `QUELLE_v013.md` nennt noch `4d83870`/419 Seiten.
  `ANKER_VERIFIZIERT` bleibt stehen, bis ein Verifikationslauf ihn nachzieht.

- [ ] **P26-3 Routine festhalten** *(S)* — wenn Runde 1 durch ist: in einem Satz
  in `QUELLE_v013.md` verankern, dass ein Quell-Update immer diesen Weg geht
  (Delta ansehen → Posten hier → Anker setzen), damit die nächste Runde nicht
  wieder ad hoc läuft.
