<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P21 — Druckskript und interaktives Skript synchron halten

Eingetragen 2026-08-28 nach Nutzervorgabe (*„hinterlege ein backlog item, dass
seperat später das statische skript an das interaktive skript angepasst werden
muss"*), verschärft am selben Tag: *„Druckskript und interaktives Skript müssen
synchron bleiben. daher muss jede abweichung auch ein backlog item nach sich
ziehen. die dokumentation der abweichungen ist daher absolut missionskritisch."*

**Worum es geht.** Die Kapitel-Fragmente in `InteraktivesSkript_WIP/chapters/`
sind als **1:1-Transkription** von `Input/v0.13/*.tex` entstanden. Mit den
interaktiven Figuren wächst das interaktive Skript an einzelnen Stellen über die
Vorlage hinaus: Reihenfolgen ändern sich, überleitende Absätze kommen dazu,
Bildunterschriften werden ausführlicher, einzelne Formeln stehen nur noch in der
interaktiven Fassung. Damit driften **gedrucktes und interaktives Skript
auseinander** — beide sollen aber dasselbe lehren und, soweit möglich, dieselbe
Reihenfolge und dieselben Nummern haben.

**Dieses Item ist das Register dieser Abweichungen.** Jede Abweichung ist ein
eigener, einzeln abhakbarer Eintrag (P21-A*n*) mit Entscheidung und Status; die
Angleichung selbst passiert **nicht in diesem Repo**: die LaTeX-Quelle liegt in
einem eigenen, privaten Repository (`Input/v0.13` ist nur ein Symlink auf den
lokalen Checkout, s. [[reference-input-v013-git-checkout]]), und `Input/` ist
hier grundsätzlich lesend.

**Verbindliche Regel** (steht in der Wurzel-`CLAUDE.md`, Mechanik in
`InteraktivesSkript_WIP/chapters/CLAUDE.md`): Wer im WIP inhaltlich von v0.13
abweicht, dokumentiert das an **drei** Stellen — Kopfkommentar des Fragments,
Eintrag hier, Commit-Message. **Ohne diesen Eintrag ist die Änderung nicht
fertig.** Was als inhaltliche Abweichung zählt und was nur darstellungsbedingt
ist, steht in `chapters/CLAUDE.md`.

**Schwesterregister:** `InteraktivesSkript_WIP/QUELLEN_FEHLER.md` führt die
Fehler der Vorlage selbst (Tippfehler, Sachfehler, falsche Nummern). Auch die
sind Sync-Schulden — dort ist geregelt, dass eine Korrektur nur gemeinsam in
Quelle *und* WIP erfolgt. Hier stehen die Fälle, in denen das WIP **bewusst
besser oder anders** ist als eine korrekte Vorlage.

### Register der Abweichungen

Status je Eintrag: **offen** = im Druckskript noch nicht nachgezogen ·
**entschieden: bewusst** = Abweichung bleibt dauerhaft, kein Nachziehen ·
**erledigt** = im Druckskript umgesetzt.

- [ ] **P21-A1 · Kap. 1.1, Beispielbox „Freier Fall und senkrechter Wurf" ·
  Reihenfolge** *(2026-08-28)* — Abb. 1.5–1.7 stehen jetzt am **Ende** der Box
  statt unmittelbar hinter Abb. 1.4. Abbildungsnummern unverändert (relative
  Reihenfolge erhalten, keine andere Abbildung dazwischen).
  **Im Druckskript:** Reihenfolge im `.tex` gleichziehen. *Status: offen.*
- [ ] **P21-A2 · ebenda, nach Abb. 1.4 · neuer Absatz** *(2026-08-28)* — ein
  überleitender Absatz: Aussehen der Parabel *und* Formel hängen vom
  Koordinatensystem ab, eine Parabel bleibt es immer, siehe 1.5–1.7 am Ende der
  Box. Steht so nicht in v0.13.
  **Im Druckskript:** Absatz übernehmen. *Status: offen.*
- [ ] **P21-A3 · Kap. 1.1, Abb. 1.3–1.7 · Bildunterschriften** *(2026-08-28)* —
  die Unterschriften der **interaktiven** Figuren sind ausführlicher als die
  gedruckten: sie beginnen mit dem Koordinatensystem und übersetzen die
  Ausgangslage hinein („startet 20,0 m über dem Erdboden, in diesem
  Koordinatensystem also bei \(y=0\); der Erdboden liegt bei
  \(y=+20{,}0\,\mathrm{m}\)"), und ihre Zahlenwerte laufen mit den Reglern mit.
  Die gedruckten Unterschriften (`.nur-druck`) sind unverändert v0.13.
  **Im Druckskript:** zu entscheiden — Unterschriften nachziehen (der erklärende
  Teil ist auch auf Papier hilfreich) oder bewusst knapp lassen. *Status: offen,
  Entscheidung nötig.*
- [ ] **P21-A4 · Kap. 1.1, Abb. 1.5–1.7 · drei zusätzliche Gleichungen**
  *(2026-08-28)* — die Bewegungsgleichung in den drei übrigen
  Koordinatensystemen steht nur in der interaktiven Fassung (unnummeriert, in
  der Physik-Karte der Figur). v0.13 gibt für den Wurf nur die Variante „y nach
  oben, Null am Boden" an.
  **Im Druckskript:** zu entscheiden — aufnehmen (dann werden sie nummeriert und
  **die gesamte Gleichungszählung von 1.1 verschiebt sich**) oder weglassen.
  *Status: offen, Entscheidung nötig.*
- [ ] **P21-A5 · TK 3, Abschnittsnummern 3.0/3.1/3.2** *(2026-07, nachgetragen
  2026-08-28)* — v0.13 nummeriert die Einleitung fälschlich als „3.1" und
  „Schwingungen" ebenfalls als „3.1" (Dublette; Ursache ist ein
  `\addtocounter`-Fehler im Master, s. Kopfkommentare von
  `ch_04_00_einleitung.html` / `ch_04_01_schwingungen.html`). Das WIP führt die
  offensichtlich gewollte Zählung 3.0 / 3.1 / 3.2 — die **Abschnittsnummern der
  beiden Fassungen weichen also voneinander ab**.
  **Im Druckskript:** Quellfehler beheben (dann stimmen beide wieder überein).
  Grenzfall zum Schwesterregister — hier geführt, weil das WIP bewusst von der
  Vorlage abweicht, statt den Fehler zu übernehmen. *Status: offen.*

### Zu beachten bei der Angleichung

- **Nummern-Kopplung:** Abbildungs- und Gleichungsnummern des interaktiven
  Skripts entstehen aus der Reihenfolge im HTML (`src/numbering.js`), die des
  Druckskripts aus LaTeX. Jede Umstellung im HTML muss im `.tex` mitziehen —
  sonst zeigen Querverweise der beiden Fassungen auf verschiedene Abbildungen.
  P21-A1 ist zufällig nummernneutral; das ist Glück, keine Regel.
- **Zusätzliche nummerierte Gleichungen sind teuer:** eine neue verschiebt alle
  folgenden Nummern des Abschnitts (in 1.1 bis zu 99). Im interaktiven Skript
  stehen Zusatzgleichungen deshalb bewusst **unnummeriert** in der Figur.
- **Prüfen nach jeder Angleichung:** Skill `v013-verifikation` (Nummern,
  Querverweise, Bildbestand) auf beiden Seiten.

### Sub-Tasks

- [ ] **P21-1 Entscheidung je Abweichung** — für jeden A*n*-Eintrag festlegen:
  nachziehen oder dauerhaft bewusst abweichen. *(S)*
- [ ] **P21-2 Angleichung im LaTeX-Repo** — die entschiedenen Punkte in
  `Project_Script` umsetzen, `Input/v0.13` per `git pull` aktualisieren, PDF neu
  bauen. *(M, außerhalb dieses Repos)*
- [ ] **P21-3 Gegenprüfung** — nach der Angleichung Abbildungs-/Gleichungs-
  nummern und Querverweise beider Fassungen vergleichen. *(S)*

---
