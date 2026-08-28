<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P21 — Druckskript und interaktives Skript synchron halten

Eingetragen 2026-08-28 nach Nutzervorgabe (*„hinterlege ein backlog item, dass
seperat später das statische skript an das interaktive skript angepasst werden
muss"*), am selben Tag zweimal verschärft:

> *„Druckskript und interaktives Skript müssen synchron bleiben. daher muss jede
> abweichung auch ein backlog item nach sich ziehen. die dokumentation der
> abweichungen ist daher absolut missionskritisch."*
>
> *„JEDE Abweichung MUSS dringend und wichtig dokumentiert werden, damit später
> irgendwer JEDE Abweichung im statischen Skript nachziehen kann."*

**Was das für dieses Register heißt.** Die Dokumentation steht **nicht** zur
Entscheidung — sie ist Pflicht, ausnahmslos, für jede Abweichung. Zur
Entscheidung steht nur, *wie* im Druck umgesetzt wird. Und der Maßstab für einen
guten Eintrag ist: **jemand, der nicht dabei war, muss ihn im `.tex` umsetzen
können, ohne jemanden zu fragen.** Deshalb nennt jeder Eintrag unten die
Zieldatei, die Stelle (LaTeX-Label bzw. Anker) und den einzusetzenden Text
wörtlich — nicht nur eine Beschreibung dessen, was anders ist.

**Sonderregel Bildunterschriften** (Nutzervorgabe 2026-08-28): *„bei CAPTIONS
nur dann nachziehen, wenn es auch in einem statischen Skript sinnvoll ist!"* Die
Unterschriften der interaktiven Figuren enthalten Teile, die auf Papier keinen
Sinn ergeben (Regler-Hinweise, mitlaufende Zahlenwerte, „diese Bildunterschrift
läuft mit"). Dokumentiert wird die Abweichung vollständig; nachgezogen wird nur
der Teil, der auch gedruckt trägt.

**Wo die Arbeit stattfindet.** Nicht in diesem Repo: die LaTeX-Quelle liegt im
privaten Repository `Project_Script`, `Input/v0.13` ist nur ein lesender
Symlink-Checkout ([[reference-input-v013-git-checkout]]).

**Schwesterregister:** `InteraktivesSkript_WIP/QUELLEN_FEHLER.md` führt die
Fehler der Vorlage selbst (Tippfehler, Sachfehler, falsche Nummern). Auch die
sind Sync-Schulden; hier stehen die Fälle, in denen das WIP **bewusst anders**
ist als eine korrekte Vorlage.

---

### Register der Abweichungen

Jeder Eintrag: **wo** (HTML + `.tex`), **was** anders ist, **was zu tun** ist.
Status: `offen` · `entschieden: bewusst` (bleibt dauerhaft, mit Begründung) ·
`erledigt`. Zieldatei aller 1.1-Einträge:
`Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`.

> **Vorsicht bei den Labels der vier Wurf-Abbildungen:** sie heißen in der Quelle
> `fig:senkrechter_wurf_start` / `_aufstieg` / `_umkehr` / `_abstieg`, meinen
> aber **nicht** Flugphasen, sondern die vier Koordinatensysteme (in dieser
> Reihenfolge: ↑/Boden, ↑/Abwurfpunkt, ↓/Boden, ↓/Abwurfpunkt; Bilddateien
> `senkrechter_wurf_1..4.png`). Beim Umsortieren nicht nach dem Labelnamen gehen.

#### P21-A1 · Reihenfolge: Abb. 1.5–1.7 ans Ende der Beispielbox

- **Status:** offen · *2026-08-28* · HTML: `chapters/ch_01_01_kinematik.html`,
  Beispielbox „Freier Fall und senkrechter Wurf"
- **Abweichung:** in v0.13 stehen die vier Wurf-Abbildungen unmittelbar
  hintereinander (`fig:senkrechter_wurf_start` … `_abstieg`, Zeilen ~219–245).
  Im WIP steht nur noch die erste dort; die drei anderen stehen **am Ende der
  Box**, nach dem Absatz „Einige Erkenntnisse können wir sogar gewinnen …".
- **Zu tun:** die drei `figure`-Umgebungen mit den Labels
  `fig:senkrechter_wurf_aufstieg`, `_umkehr`, `_abstieg` als Block ausschneiden
  und unmittelbar **vor `\ebspe`** (Ende der Beispielbox) wieder einsetzen,
  Reihenfolge untereinander unverändert.
- **Nummern:** bleiben gleich (relative Reihenfolge erhalten, keine andere
  Abbildung dazwischen). Die beiden `\ref`-Ketten im Text („siehe Abbildungen …
  bis …") bleiben gültig.

#### P21-A2 · Neuer überleitender Absatz nach Abb. 1.4

- **Status:** offen · *2026-08-28* · gehört sachlich zu A1
- **Abweichung:** das WIP hat nach der ersten Wurf-Abbildung einen Absatz, den
  v0.13 nicht hat.
- **Zu tun:** direkt nach dem `\end{figure}` von `fig:senkrechter_wurf_start`
  einsetzen:

  ```latex
  Sowohl das \textbf{Aussehen} des Weg-Zeit-Diagramms als auch die
  \textbf{Formel}, mit der wir die Bewegung beschreiben, hängen von der Wahl des
  Koordinatensystems ab. Eine Parabel bleibt die Kurve dabei immer -- aber ob
  sie nach oben oder nach unten geöffnet ist, wo ihr Scheitelpunkt liegt und wo
  sie die Zeitachse schneidet, entscheidet erst die Wahl von Achsenrichtung und
  Nullpunkt. Am Ende dieses Beispiels ist dieselbe Bewegung mit denselben
  Zahlenwerten deshalb noch einmal in den drei übrigen Koordinatensystemen
  dargestellt, siehe Abbildungen \ref{fig:senkrechter_wurf_aufstieg} bis
  \ref{fig:senkrechter_wurf_abstieg}.
  ```

#### P21-A3 · Bildunterschriften der interaktiven Figuren (Abb. 1.3–1.7)

- **Status:** offen, Entscheidung nötig · *2026-08-28*
- **Abweichung:** die Unterschriften der **interaktiven** Figuren beginnen mit
  einer Erklärung des Koordinatensystems und übersetzen die Ausgangslage hinein;
  ihre Zahlenwerte laufen mit den Reglern mit. Die gedruckten Unterschriften
  (`.nur-druck` im HTML) sind unverändert v0.13.
- **Zu tun — nur der gedruckt sinnvolle Teil** (Sonderregel oben): den
  einleitenden Satz je Abbildung voranstellen, Muster (hier ↓/Abwurfpunkt =
  `fig:senkrechter_wurf_abstieg`):

  ```latex
  \textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
  zeigt nach unten, ihr Nullpunkt liegt im Abwurfpunkt. Das Objekt startet
  \SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei $y=0$;
  der Erdboden liegt bei $y=+\SI{20}{\meter}$.
  ```

  Richtung/Nullpunkt je Abbildung anpassen; Startkoordinate und Bodenlage sind
  bei Nullpunkt Erdboden gerade vertauscht ($y=\pm h_0$ bzw. $y=0$).
- **Nicht nachziehen:** alles Interaktive — „der Zeit-Regler \(t\) …", „diese
  Bildunterschrift läuft mit", die Farbnennung „rote Kurve" (die gedruckten
  Bilder sind graustufig bzw. eigenständig eingefärbt), die mitlaufenden Werte.
- **Nebenbefund:** die v0.13-Unterschriften der vier Wurf-Abbildungen sagen
  „losgelassen", obwohl mit \(v_0\) geworfen wird → als Quellfehler in
  `QUELLEN_FEHLER.md` (1.1, Nr. 5) erfasst; beim Nachziehen gleich mitkorrigieren.

#### P21-A4 · Drei zusätzliche Bewegungsgleichungen (Abb. 1.5–1.7)

- **Status:** offen, Entscheidung nötig · *2026-08-28*
- **Abweichung:** v0.13 gibt für den Wurf nur die Gleichung des Systems
  „↑/Boden" an (`formel_senkrechterwurf1`). Das interaktive Skript zeigt in jeder
  der vier Figuren die Gleichung **ihres** Koordinatensystems, unnummeriert in
  der Physik-Karte.
- **Zu tun (empfohlen: unnummeriert einsetzen):** zu den drei verschobenen
  Abbildungen jeweils die passende Gleichung ergänzen —

  ```latex
  % y nach oben, Nullpunkt im Abwurfpunkt (fig:senkrechter_wurf_aufstieg)
  \[ y(t) = -\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
  % y nach unten, Nullpunkt am Erdboden   (fig:senkrechter_wurf_umkehr)
  \[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t - h_0 \]
  % y nach unten, Nullpunkt im Abwurfpunkt (fig:senkrechter_wurf_abstieg)
  \[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
  ```

  \(v_0\) ist dabei **in der Achse der jeweiligen Abbildung** gezählt (bei nach
  unten zeigender Achse ist der Wurf nach oben also \(v_0<0\)); nur so bleibt der
  \(v_0\)-Term in allen vier Varianten `+v_0 t` und es kippen ausschließlich der
  \(g\)- und der \(h_0\)-Term. Diese Zählweise gehört in den Fließtext, wenn die
  Gleichungen aufgenommen werden.
- **Achtung, Kostenpunkt:** als **nummerierte** `equation` verschieben die drei
  jede folgende Gleichungsnummer in Abschnitt 1.1 (bis zu 99) — und damit auch
  die Nummern im interaktiven Skript, das seine Zählung aus derselben
  Reihenfolge ableitet. Unnummeriert (`\[…\]`) kostet die Aufnahme nichts.

#### P21-A5 · Abschnittsnummern 3.0 / 3.1 / 3.2 (TK 3)

- **Status:** offen · *2026-07 entstanden, 2026-08-28 nachgetragen* · HTML:
  `ch_04_00_einleitung.html`, `ch_04_01_schwingungen.html`
- **Abweichung:** v0.13 nummeriert die Einleitung fälschlich als „3.1" und
  „Schwingungen" ebenfalls als „3.1" (Dublette). Das WIP führt die offensichtlich
  gewollte Zählung 3.0 / 3.1 / 3.2 — **die Abschnittsnummern der beiden
  Fassungen weichen also voneinander ab.**
- **Zu tun:** im Master `Input/v0.13/Physik_pskript_v0.13.tex` das
  `\addtocounter{section}{-1}` **vor** `\section{Einleitung und Motivation}` des
  TK 3 setzen (bei Mechanik und Elektromagnetismus steht es dort korrekt und
  liefert 1.0 bzw. 2.0). Danach stimmen beide Fassungen ohne weiteres Zutun
  überein.

---

### Medienbedingte Unterschiede (dokumentiert, nichts nachzuziehen)

Vollständigkeitshalber hier gelistet, damit niemand sie für vergessene
Abweichungen hält. Es sind Übersetzungen ins HTML-Medium, der Sachtext ist
unverändert; im `.tex` gibt es nichts zu tun. Details jeweils im Kopfkommentar
des Fragments.

- `ch_01_01`: `\bbspe` (Plural-Beispielbox) → einzelne `beispiel`-Boxen ·
  Doppel-Label `formel_freierfall4` disambiguiert (Quellfehler-Workaround) ·
  Quell-Artefakt „code/Code" in der Zusammenfassung übersprungen.
- `ch_01_03`: Bildunterschrift „Abbildung zum Beispiel …" ohne Nummer — der
  HTML-Resolver kennt keine Box-Referenz; die Abbildung steht inline in der Box,
  der Verweis ist dadurch eindeutig.
- `ch_04_02`: Wellen-Stub — die Quelle enthält selbst nur den Vermerk, dass das
  Kapitel nicht behandelt wurde; treu transkribiert.

---

### Zu beachten bei der Angleichung

- **Nummern-Kopplung:** Abbildungs- und Gleichungsnummern des interaktiven
  Skripts entstehen aus der Reihenfolge im HTML (`src/numbering.js`), die des
  Druckskripts aus LaTeX. Jede Umstellung im HTML muss im `.tex` mitziehen —
  sonst zeigen Querverweise der beiden Fassungen auf verschiedene Abbildungen.
  A1 ist zufällig nummernneutral; das ist Glück, keine Regel.
- **Zusätzliche nummerierte Gleichungen sind teuer** (s. A4).
- **Prüfen nach jeder Angleichung:** Skill `v013-verifikation` (Nummern,
  Querverweise, Bildbestand) auf beiden Seiten.

### Sub-Tasks

- [ ] **P21-1 Entscheidung je Abweichung** — für A1–A5 festlegen: nachziehen
  oder dauerhaft bewusst abweichen (mit Begründung). Bei A3/A4 lohnt eine
  **Grundsatzentscheidung** statt einer Einzelfallprüfung, weil dieselbe Frage
  bei jeder weiteren interaktiven Figur wiederkommt. *(S)*
- [ ] **P21-2 Angleichung im LaTeX-Repo** — die entschiedenen Punkte in
  `Project_Script` umsetzen (die Einträge oben sind so geschrieben, dass sie
  direkt abgearbeitet werden können), `Input/v0.13` per `git pull` aktualisieren,
  PDF neu bauen. *(M, außerhalb dieses Repos)*
- [ ] **P21-3 Gegenprüfung** — nach der Angleichung Abbildungs-/Gleichungs-
  nummern und Querverweise beider Fassungen vergleichen. *(S)*

---
