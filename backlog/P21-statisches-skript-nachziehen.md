<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P21 — Statisches Skript an das interaktive nachziehen

Eingetragen 2026-08-28 nach Nutzervorgabe (*„hinterlege ein backlog item, dass
seperat später das statische skript an das interaktive skript angepasst werden
muss"*).

**Worum es geht.** Die Kapitel-Fragmente in `InteraktivesSkript_WIP/chapters/`
sind als **1:1-Transkription** von `Input/v0.13/*.tex` entstanden. Mit den
interaktiven Figuren wächst das interaktive Skript nun an einzelnen Stellen über
die Vorlage hinaus: Reihenfolgen ändern sich, es kommen überleitende Absätze und
ausführlichere Bildunterschriften dazu, und manche Aussage steht nur noch in der
interaktiven Fassung. Damit driften **gedrucktes und interaktives Skript
auseinander** — beide sollen aber dasselbe lehren und (soweit möglich) dieselbe
Reihenfolge und dieselben Abbildungsnummern haben.

**Dieses Item sammelt die Abweichungen, damit die spätere Angleichung nicht
rekonstruiert werden muss.** Die Angleichung selbst passiert **nicht hier**: die
LaTeX-Quelle liegt in einem eigenen, privaten Repository (`Input/v0.13` ist nur
ein Symlink auf den lokalen Checkout, s. [[reference-input-v013-git-checkout]]);
`Input/` ist in diesem Repo grundsätzlich lesend.

**Arbeitsregel ab sofort:** Wer im WIP inhaltlich von v0.13 abweicht (Reihenfolge,
neuer Text, geänderte Bildunterschrift, zusätzliche Formel), trägt es hier mit
Datum und Fundstelle ein — eine Zeile genügt. Der Kopfkommentar des jeweiligen
Fragments nennt die Abweichung ebenfalls (dort steht das *Was*, hier die
*Sammlung fürs Nachziehen*).

### Offene Abweichungen (chronologisch)

| Datum | Stelle | Abweichung | Im Druckskript zu tun |
|---|---|---|---|
| 2026-08-28 | Kap. 1.1, Beispielbox „Freier Fall und senkrechter Wurf" | **Abb. 1.5–1.7 ans Ende der Box verschoben** (in v0.13 stehen 1.4–1.7 unmittelbar hintereinander). Abbildungsnummern bleiben unverändert, weil die relative Reihenfolge erhalten bleibt und keine andere Abbildung dazwischen liegt. | Reihenfolge im `.tex` gleichziehen |
| 2026-08-28 | ebenda, nach Abb. 1.4 | **Neuer überleitender Absatz** (Nutzervorgabe): Aussehen der Parabel *und* Formel hängen vom Koordinatensystem ab, eine Parabel bleibt es immer, siehe 1.5–1.7 am Ende der Box. | Absatz übernehmen |
| 2026-08-28 | ebenda, Abb. 1.3–1.7 | **Bildunterschriften der interaktiven Figuren sind ausführlicher** als die gedruckten: sie beginnen mit dem Koordinatensystem und übersetzen die Ausgangslage hinein („startet 20,0 m über dem Erdboden, in diesem Koordinatensystem also bei \(y=0\); der Erdboden liegt bei \(y=+20{,}0\,\mathrm{m}\)"). | zu entscheiden: gedruckte Unterschriften nachziehen oder bewusst knapp lassen |
| 2026-08-28 | ebenda, Abb. 1.5–1.7 | **Die drei umgerechneten Bewegungsgleichungen** (y ↑/↓ × Null Boden/Abwurfpunkt) stehen nur in der interaktiven Fassung, in der Physik-Karte der Figur. v0.13 gibt für den Wurf nur die Variante „y nach oben, Null am Boden" an. | zu entscheiden: die drei Gleichungen ins Skript aufnehmen (dann werden sie nummeriert und die Gleichungszählung von 1.1 verschiebt sich!) oder nicht |

### Zu beachten bei der Angleichung

- **Nummern-Kopplung:** Abbildungs- und Gleichungsnummern des interaktiven
  Skripts entstehen aus der Reihenfolge im HTML (`src/numbering.js`), die des
  Druckskripts aus LaTeX. Jede Umstellung, die im HTML die Reihenfolge ändert,
  muss im `.tex` gleich mitziehen — sonst zeigen Querverweise in den beiden
  Fassungen auf verschiedene Abbildungen. Die bisher eingetragene Umstellung ist
  **nummernneutral**; das ist Glück, keine Regel.
- **Zusätzliche Gleichungen sind teuer:** eine neue nummerierte Gleichung
  verschiebt alle folgenden Nummern des Abschnitts (in 1.1 sind das bis zu 99).
  Im interaktiven Skript stehen die Zusatzgleichungen deshalb bewusst
  **unnummeriert** in der Figur, nicht im Fließtext.
- **Prüfen nach jeder Angleichung:** Skill `v013-verifikation` (Nummern,
  Querverweise, Bildbestand) auf beiden Seiten.

### Sub-Tasks

- [ ] **P21-1 Entscheidung je Abweichung** — für jede Zeile der Tabelle
  festlegen: Druckskript nachziehen, oder Abweichung dauerhaft akzeptieren
  (dann hier als „bewusst" markieren). *(S)*
- [ ] **P21-2 Angleichung im LaTeX-Repo** — die entschiedenen Punkte in
  `Project_Script` umsetzen, `Input/v0.13` per `git pull` aktualisieren, PDF neu
  bauen. *(M, außerhalb dieses Repos)*
- [ ] **P21-3 Gegenprüfung** — nach der Angleichung Abbildungs-/Gleichungs-
  nummern und Querverweise beider Fassungen vergleichen. *(S)*

---
