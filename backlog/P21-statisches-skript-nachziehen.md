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

- **Status:** **entschieden 2026-08-28: nachziehen** (folgt der Grundsatzregel
  aus A3 — der Zusatz der interaktiven Fassung wird ins Druckskript übernommen;
  bei abweichendem Wunsch hier überschreiben). Umsetzung offen → P21-2.
  *2026-08-28* · HTML: `chapters/ch_01_01_kinematik.html`,
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

- **Status:** **entschieden 2026-08-28: nachziehen** (Grundsatzregel, s. A3) ·
  *2026-08-28* · gehört sachlich zu A1
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

#### P21-A3 · Didaktischer Zusatz der interaktiven Figuren (Abb. 1.3–1.7)

*Zusammengefasst 2026-08-28 aus den früheren Einträgen A3 (Bildunterschriften)
und A4 (drei zusätzliche Gleichungen): beides ist dieselbe Frage — **wie viel
von dem, was die interaktive Figur zusätzlich sagt, gehört ins Druckskript?** —
und beides sollte gemeinsam entschieden werden, weil dieselbe Frage bei jeder
weiteren interaktiven Figur wiederkommt. Der frühere A5 ist jetzt A4.*

- **Status:** **entschieden 2026-08-28: BEIDES nachziehen** (Nutzerentscheidung) —
  (a) der erklärende Koordinatensystem-Satz kommt in die vier gedruckten
  Unterschriften, (b) die drei umgerechneten Gleichungen kommen **unnummeriert**
  zu den Abbildungen. Begründung der Wahl: Papier und Bildschirm sollen dasselbe
  lehren; unnummeriert kostet die Aufnahme nichts an der Zählung. **Die
  Entscheidung gilt als Grundsatzregel für alle künftigen interaktiven Figuren**
  (s. `chapters/CLAUDE.md`). Umsetzung offen → P21-2.
- **Gemeinsamer Kern:** die interaktiven Figuren zu 1.3–1.7 erklären zwei Dinge,
  die im Druckskript fehlen — (a) in welchem Koordinatensystem man sich gerade
  befindet und wo Abwurfpunkt und Erdboden darin liegen, (b) wie die
  Bewegungsgleichung in genau diesem System lautet. Im Druck steht dazu nur die
  Gleichung des Systems „↑/Boden"; die drei anderen Abbildungen stehen ohne
  Formel da, und ihre Unterschriften nennen die Achsenwahl nur in einem
  Nebensatz.

**(a) Bildunterschriften.** Interaktiv beginnt jede Unterschrift mit dem
Koordinatensystem und übersetzt die Ausgangslage hinein; die Zahlenwerte laufen
mit den Reglern mit. Gedruckt (`.nur-druck`) sind sie unverändert v0.13.
Nachzuziehen wäre — **nur der gedruckt sinnvolle Teil** (Sonderregel oben) — der
einleitende Satz, Muster für ↓/Abwurfpunkt (`fig:senkrechter_wurf_abstieg`):

```latex
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach unten, ihr Nullpunkt liegt im Abwurfpunkt. Das Objekt startet
\SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei $y=0$;
der Erdboden liegt bei $y=+\SI{20}{\meter}$.
```

Richtung/Nullpunkt je Abbildung anpassen; bei Nullpunkt Erdboden sind
Startkoordinate und Bodenlage gerade vertauscht ($y=\pm h_0$ bzw. $y=0$).
**Nicht nachziehen:** „der Zeit-Regler \(t\) …", „diese Bildunterschrift läuft
mit", die Farbnennung „rote Kurve", die mitlaufenden Werte.
*Nebenbefund:* die v0.13-Unterschriften sagen „losgelassen", obwohl mit \(v_0\)
geworfen wird → `QUELLEN_FEHLER.md` (1.1, Nr. 5), beim Nachziehen mitkorrigieren.

**(b) Die drei umgerechneten Gleichungen.** Zu den drei verschobenen Abbildungen
jeweils die Gleichung ihres Systems, **unnummeriert** einsetzen:

```latex
% y nach oben, Nullpunkt im Abwurfpunkt  (fig:senkrechter_wurf_aufstieg)
\[ y(t) = -\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
% y nach unten, Nullpunkt am Erdboden    (fig:senkrechter_wurf_umkehr)
\[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t - h_0 \]
% y nach unten, Nullpunkt im Abwurfpunkt (fig:senkrechter_wurf_abstieg)
\[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
```

\(v_0\) ist **in der Achse der jeweiligen Abbildung** gezählt (bei nach unten
zeigender Achse ist der Wurf nach oben also \(v_0<0\)); nur so bleibt der
\(v_0\)-Term überall `+v_0 t` und es kippen ausschließlich der \(g\)- und der
\(h_0\)-Term. Diese Zählweise gehört in den Fließtext, wenn die Gleichungen
aufgenommen werden.
**Kostenpunkt:** als **nummerierte** `equation` verschieben die drei jede
folgende Gleichungsnummer in Abschnitt 1.1 (bis zu 99) — und damit auch die
Nummern im interaktiven Skript, das seine Zählung aus derselben Reihenfolge
ableitet. Unnummeriert (`\[…\]`) kostet die Aufnahme nichts.

**Zur Entscheidung stehen** (a) und (b) je einzeln, und ob die Antwort als
**Grundsatzregel** für alle künftigen interaktiven Figuren gilt — dann entfällt
die Frage pro Figur, und neue Einträge werden gleich mit der richtigen
Voreinstellung angelegt.

#### P21-A5 · Bildunterschrift Abb. 1.8 (Feder-Masse-Pendel)

- **Status:** **entschieden 2026-08-28: nachziehen** (Grundsatzregel aus A3) ·
  *2026-08-28* · HTML: `chapters/ch_01_01_kinematik.html`, Beispielbox
  „Feder-Masse-Pendel"
- **Abweichung:** die Unterschrift der **interaktiven** Abb. 1.8 beginnt — wie
  die übrigen Kapitel-1.1-Figuren — mit dem Koordinatensystem und nennt die
  Werte als mitlaufende Größen. Die gedruckte Unterschrift ist unverändert v0.13.
- **Zu tun:** in `pskript_mech_kinematik_gmni_v4.tex` der Unterschrift von
  `fig:feder_masse_pendel_kinematik` voranstellen:

  ```latex
  \textbf{Koordinatensystem:} die $y$-Achse zeigt entlang der Bewegungsrichtung
  der Masse nach oben, ihr Nullpunkt liegt in der Ruhelage -- die Masse schwingt
  also zwischen $y=+y_0$ und $y=-y_0$ hin und her.
  ```

  **Nicht nachziehen:** Regler-/Wiedergabe-Hinweise, „diese Bildunterschrift
  läuft mit", „Letzte Kurve behalten" und die mitlaufenden Zahlenwerte.
- **Kein Eintrag nötig für die Formelkarte der Figur:** sie zeigt Formel
  \ref{formel_feder_masse_pendel} des Fließtextes, also nichts Zusätzliches.

#### P21-A6 · Abschnittsnummern 3.0 / 3.1 / 3.2 (TK 3)

*(vormals A5, dann A4; A3 und A4 wurden zusammengefasst, danach kam A5 dazu.)*

- **Status:** **entschieden 2026-08-28: nachziehen** — hier ist es kein Zusatz,
  sondern ein Quellfehler; die Korrektur im Master bringt beide Fassungen ohne
  weiteres Zutun zur Deckung. Umsetzung offen → P21-2. ·
  *2026-07 entstanden, 2026-08-28 nachgetragen* · HTML:
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

- [x] **P21-1 Entscheidung je Abweichung** *(S)* — **erledigt 2026-08-28**:
  A1–A4 alle „nachziehen"; A3 (didaktischer Zusatz: Unterschriften **und**
  Gleichungen) zusätzlich als **Grundsatzregel** für alle künftigen interaktiven
  Figuren festgelegt und in `chapters/CLAUDE.md` verankert. Damit ist die Frage
  nicht mehr pro Figur zu stellen; neue Einträge entstehen mit dieser
  Voreinstellung.
- [ ] **P21-2 Angleichung im LaTeX-Repo** — die entschiedenen Punkte in
  `Project_Script` umsetzen (die Einträge oben sind so geschrieben, dass sie
  direkt abgearbeitet werden können), `Input/v0.13` per `git pull` aktualisieren,
  PDF neu bauen. *(M, außerhalb dieses Repos)*
- [ ] **P21-3 Gegenprüfung** — nach der Angleichung Abbildungs-/Gleichungs-
  nummern und Querverweise beider Fassungen vergleichen. *(S)*

---
