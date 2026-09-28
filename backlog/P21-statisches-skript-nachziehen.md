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

> *Stand 2026-09-10:* die unten in A3/A5 unter „nicht nachziehen" zitierte
> Wendung „diese Bildunterschrift läuft mit" **steht so nicht mehr im WIP** —
> v1.43.3 (`a57dc39`) hat den Selbstbezug aus allen Unterschriften entfernt
> (s. `chapters/CLAUDE.md`, „Bildunterschriften: über die Sache reden"). Die
> Regel bleibt richtig, die wörtliche Suche danach ist vergeblich.

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

> **HTML-`id` ist nicht LaTeX-`\label`.** Die Fragmente benennen ihre
> Abbildungen nach der Bilddatei (`fig-feder_masse_pendel_kinematik`,
> `fig-freierfall_1`), die Quelle nach dem Gegenstand
> (`fig:feder_masse_pendel`, `fig:freier_fall_1`). Beim Schreiben eines
> Eintrags immer das **`.tex`-Label** nachsehen, nicht die id abschreiben.
>
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
  `fig:feder_masse_pendel` voranstellen (**korrigiert 2026-09-10:** hier
  stand vorher `fig:feder_masse_pendel_kinematik` — das ist die HTML-`id`,
  nicht das LaTeX-Label; im `.tex` heißt nur die *Bilddatei*
  `feder_masse_pendel_kinematik.png`):

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

#### P21-A7 · „Beispiel" ist in zwei Kastentypen geteilt (Rechenbeispiel, D5)

- **Status:** **offen — zuerst upstream prüfen** (die Zuordnung wurde *nicht*
  hier getroffen, s. u.; gut möglich, dass die Druckseite schon weiter ist als
  der Checkout vom 2026-07-26) · *entstanden 2026-09-03 (`cee6cf1`, v1.47.0),
  hier nachgetragen 2026-09-10* · HTML: **9 Fragmente**, 28 Kästen
- **Abweichung:** v0.13 kennt **einen** Beispieltyp: `\bbsp`/`\bbspe` zählen
  beide auf `beispielcounter` (`\numberwithin{beispielcounter}{section}`) und
  schreiben „Beispiel~N" bzw. „Beispiele~N" mit `pen.png`. Das WIP führt seit
  v1.47.0 **zwei** Typen — `.beispiel` (64 Kästen, Label „Beispiel") und
  `.rechenbeispiel` (28 Kästen, Label „**Rechenbeispiel**", Taschenrechner-Icon,
  Blau-Ton „mitrechnend") — mit **eigenem Zähler je Typ**.
- **Folge (wichtig):** die **Beispielnummern beider Fassungen laufen
  auseinander**, weil die 28 herausgelösten Kästen im WIP nicht mehr im
  Beispiel-Zähler mitzählen. Das ist keine Optik-, sondern eine
  Nummern-Abweichung — sie trifft jeden `\ref` auf einen Beispielkasten.
- **Die Zuordnung ist NICHT neu zu treffen.** Sie stammt Kasten für Kasten aus
  `Project_Script/scripts/classification_report.md` (Druckseite) und wurde über
  die **Position** abgebildet, nicht über den Titel. Kontrollzahlen: **64
  Beispiel / 28 Rechenbeispiel**, je Quelldatei
  `11/17/11/12/6/1/12/3/4/1/6/5/3 = 92`. Eine zweite Heuristik wäre nur eine
  Gelegenheit, die beiden Fassungen auseinanderlaufen zu lassen.
- **Zu tun (Druckseite):**
  1. In `Physik_skript_header_gmni_v3.tex` Zähler und Box anlegen — Muster der
     bestehenden Definitionen (Zeilen ~124/132/184–187):

     ```latex
     \newcounter{rechenbeispielcounter}
     \numberwithin{rechenbeispielcounter}{section}
     \newtcolorbox{rechenbeispielbox}{mainboxstyle, colback=mutedBlue!30}
     \newcommand{\bbrsp}[1]{\refstepcounter{rechenbeispielcounter}\begin{rechenbeispielbox}\textbf{\icon{calculator.png}Rechenbeispiel~\therechenbeispielcounter: #1}\begin{quotation}}
     \newcommand{\ebrsp}{\end{quotation}\end{rechenbeispielbox}}
     ```

     *Zwei Dinge dort entscheiden, nicht hier:* der Farbton (`mutedBlue!30`
     kollidiert mit `lernzielbox` — die Design-Seite hat für „mitrechnend"
     einen eigenen Blau-Ton) und das Icon (`\icon{}` lädt **PNG** per
     `\includegraphics`; laut `cee6cf1` liegt `calculator.svg` in
     `v0.13/assets/` — ob eine PNG-Fassung daneben liegt, dort prüfen).
  2. Die 28 im Bericht als Rechenbeispiel geführten Kästen von `\bbsp`/`\bbspe`
     auf `\bbrsp` umstellen (Ende jeweils `\ebrsp`).
  3. `\ref`-Ketten auf Beispielkästen gegenprüfen — die Nummern verschieben
     sich auf beiden Seiten.
- **Herkunft der Entscheidung:** D5 der Design-System-Konvergenz
  (`physik-design-system/KONVERGENZ_ENTSCHEIDUNGEN.md`, in dieser VM nicht
  erreichbar — auf dem Mac nachlesen). Begründung: zwei verschiedene Objekte
  standen unter einem Namen — Kästen, die Theorie demonstrieren, und Kästen, in
  denen mitgerechnet wird.

#### P21-A8 · Fünf mehrfach vergebene `\label` im Druckskript

- **Status:** **erledigt 2026-09-14** im LaTeX-Repo, drei Commits
  (`54304e1` AP8a, `6b5566c` AP8b, `4063250` AP8c, Neubau `830dcf9`).
  Befund am selben Tag beim Abarbeiten von AP1–AP6 (Warnung „There were
  multiply-defined labels" im TeX-Log). Ergebnis der Rückmeldung:
  - `formel_freierfall4` heißt an der zweiten Stelle jetzt
    `formel_freierfall_fallzeit`, wörtlich wie im WIP. Die beiden falschen
    Verweise drucken wieder 1.1.6–1.1.9 bzw. 1.1.9, der dritte weiter 1.1.14.
  - Die drei Kreisbahn-Labels drucken wieder 1.4.5 / 1.4.7 / 1.4.8 statt
    1.4.1 / 1.4.1 / 1.4.9. Die Dopplung der Passage steht unverändert —
    gegengezählt: `equation`/`align`/`\[…\]`/`figure` vor und nach der
    Änderung 63/8/35/25.
  - Die drei Abbildungen haben eigene Labels; die Zuordnung Zeile→Nummer kam
    aus der `.aux`, nicht aus den Labelnamen (die Anweisung benennt je
    Abbildung das zweite Teilbild, die neuen Namen das erste — eine Falle, die
    dort nicht stand).
  - Log: `multiply` **0×** (vorher 6 Warnungen über 5 Labels), 0 Fehler,
    421 Seiten wie vor AP8 — also keine Nummer verschoben.
- **Warum das hierher gehört und nicht nur in `QUELLEN_FEHLER.md`:** eines der
  fünf Labels ist unten unter „Medienbedingte Unterschiede" schon aufgeführt —
  das WIP hat `formel_freierfall4` disambiguiert und der Druck nicht. Damit
  **zeigen die Querverweise der beiden Fassungen auf verschiedene Gleichungen**,
  und das ist genau der Fall, für den dieses Register da ist. Die vier anderen
  sind bisher nirgends erfasst.
- **Befund.** LaTeX nimmt bei doppeltem `\label` stillschweigend die **letzte**
  Definition; `\ref` zeigt dann auf ein anderes Objekt als gemeint. Betroffen:

  | Label | Datei | definiert als | `\ref` druckt |
  |---|---|---|---|
  | `formel_freierfall4` | `pskript_mech_kinematik_gmni_v4.tex` (Z. 184 und 209) | Gl. **1.1.9** (Fallgesetz) und Gl. **1.1.14** (Fallzeit) | 1.1.14 |
  | `eq_kreisbahn_position_zeit` | `pskript_mech_kin_dreh_und_kreis_v1.tex` (Z. 80 und 113) | Gl. **1.4.5** und ein `\[…\]` ohne Nummer | **1.4.1** |
  | `eq_kreisbahn_winkel_zeit_vereinfachte_form` | ebd. (Z. 92 und 118) | Gl. **1.4.7** und ein `\[…\]` ohne Nummer | **1.4.1** |
  | `eq_kreisbahn_position_zeit_vereinfachte_form` | ebd. (Z. 100 und 126) | Gl. **1.4.8** und Gl. **1.4.9** | 1.4.9 |
  | `fig_kreisbewegung_dphi_dr_pair` | ebd. (Z. 963, 1021, 1045) | Abb. **1.57**, **1.58**, **1.59** | 1.59 |

- **Zwei verschiedene Ursachen**, die getrennt zu behandeln sind:
  1. **`\label` in einer unnummerierten `\[…\]`-Umgebung** (die beiden
     Kreisbahn-Fälle mit „1.4.1"). Dort gibt es keine Gleichungsnummer, also
     hängt sich das Label an den zuletzt hochgezählten Zähler — hier an den
     Abschnitt. Das ist kein Tippfehler, sondern ein stiller Totalausfall des
     Verweises. In `pskript_mech_kin_dreh_und_kreis_v1.tex` steht die Passage ab
     Z. 105 ohnehin ein **zweites Mal** da (einmal nummeriert, einmal als
     `\[…\]`); die Dopplung selbst ist zu prüfen.
  2. **Dasselbe Label auf zwei bzw. drei wirklich nummerierten Objekten**
     (`formel_freierfall4`, `…vereinfachte_form`, `fig_…dphi_dr_pair`).

- **Schadwirkung, gemessen.** Bei `formel_freierfall4` sind **zwei von drei**
  Verweisen falsch:
  - Z. 202 „Den Streckengleichungen (Formel (1.1.6) bis (\ref{formel_freierfall4}))"
    meint die vier Fallgesetze 1.1.6–**1.1.9**, druckt aber „bis 1.1.14" und
    zieht damit die ganze Herleitung mit hinein.
  - Z. 204 „anhand von (\ref{formel_freierfall4}) … wie lange das Objekt braucht"
    meint **1.1.9**, druckt **1.1.14** — also das Ergebnis, das erst zehn Zeilen
    später hergeleitet wird.
  - Z. 214 „Mit Formel (\ref{formel_freierfall4}) … Fallzeit von 2 s" meint
    **1.1.14** und ist als einziger richtig.

  Bei den Kreisbahn-Gleichungen zeigen die drei Verweise im Fließtext
  („Ersetzen wir nun $\varphi(t)$ in der Gleichung …") auf **1.4.1** statt auf
  1.4.5 bzw. 1.4.7.

- **Export:** als **AP8** (Teilpakete AP8a/b/c) in `../UEBERGABE_Druckskript.md`
  — dort mit den Ankern im `.tex`, den vorgegebenen Ersatznamen (sie müssen zu
  den IDs des interaktiven Skripts passen) und der Warnung, die Dopplung der
  Kreisbahn-Passage nicht mitzuentfernen (das verschöbe Nummern auf beiden
  Seiten).
- **Zu tun:** je Fall das zweite (bzw. dritte) Label umbenennen oder streichen
  und die Verweise auf das gemeinte Objekt richten. Bei den drei Abbildungen
  1.57–1.59 entscheidet der Autor, welche das Label behalten soll bzw. ob drei
  eigene Labels gebraucht werden.
- **Nummern:** **keine.** Ein Label umzubenennen verschiebt kein Objekt — es
  ändert nur, welche Nummer der Verweis *druckt*. Dieser Punkt ist damit
  nummernneutral und kann unabhängig von allem anderen umgesetzt werden. Nach
  der Korrektur stimmen Druck und WIP bei `formel_freierfall4` überein, weil das
  WIP bereits disambiguiert hat.


#### P21-A9 · Erklärender Zusatz in der Unterschrift von Abb. 1.10

- **Status:** **offen — entstanden 2026-09-14** beim Bau der interaktiven Figur
  zu Abb. 1.10 (P17-2, WIP `b14f750`, v1.50.0). Entscheidung steht schon fest:
  **nachziehen** (Grundsatzregel „didaktischer Zusatz", P21-1).
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`, Abschnitt 1.1.
- **Stelle:** die `figure`-Umgebung mit
  `\includegraphics[width=0.85\textwidth]{kreisbewegung_1.png}` (im `.tex`
  ohne `\label`; sie folgt auf den Satz „Eine Kreisbewegung wird beschrieben
  durch:" und die zugehörige `equation`).
- **Bisher steht dort:**

  ```latex
  \caption{Weg-Zeit-Diagramme der Kreisbewegung mit $R=\SI{1,5}{\meter}$ und $T=\SI{6,0}{\second}$.}
  ```

- **Einzusetzen:**

  ```latex
  \caption{\textbf{Koordinatensystem:} die $x$- und die $y$-Achse spannen die
  Ebene auf, in der die Bewegung verläuft; ihr Nullpunkt liegt im Mittelpunkt
  der Kreisbahn. Der Ortsvektor $\vec s(t)$ zeigt vom Mittelpunkt zum Objekt,
  und seine beiden Komponenten $x(t)$ und $y(t)$ sind genau die beiden Kurven
  der Diagramme. Weg-Zeit-Diagramme der Kreisbewegung mit $R=\SI{1,5}{\meter}$
  und $T=\SI{6,0}{\second}$: oben $x(t)$, unten $y(t)$. Beide Kurven
  beschreiben \textbf{dieselbe} Bewegung mit demselben Parameter $t$ -- einzeln
  betrachtet sieht keine von beiden nach einer Kreisbahn aus, erst
  zusammengenommen ergeben sie eine.}
  ```

  **Vor dem Einsetzen einmal hinsehen:** ob die gedruckte Abbildung wirklich
  $x(t)$ oben und $y(t)$ unten zeigt, ist an der Bilddatei
  (`kreisbewegung_1.png`) zu prüfen — der Teilsatz „oben $x(t)$, unten $y(t)$"
  beschreibt die interaktive Figur und wird nur übernommen, wenn die statische
  dieselbe Reihenfolge hat; sonst entfällt er oder wird gedreht.

- **Was NICHT nachgezogen wird** (Sonderregel Bildunterschriften): der Satz
  „Interaktiv: der Zeit-Regler …" samt Regler-Hinweisen. Auf Papier gibt es
  keine Regler.
- **Nummern:** **keine.** Die Figur ersetzt am Bildschirm nur die Anzeige; die
  statische Abbildung bleibt an derselben Stelle (`.nur-druck`), alle
  Abbildungs- und Gleichungsnummern sind unverändert (nachgemessen mit
  `dom_harness.mjs`: 88 Abbildungen, gleiche Lücken).

#### P21-A10 · Erklärender Zusatz in der Unterschrift von Abb. 1.14

- **Status:** **offen — entstanden 2026-09-14** beim Bau der interaktiven Figur
  zu Abb. 1.14 (P16-7, WIP `033f2d3`, v1.52.0). Entscheidung steht fest:
  **nachziehen** (Grundsatzregel „didaktischer Zusatz").
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`.
- **Stelle:** die `figure` mit `\includegraphics[width=0.99\textwidth]{bahnkurve_schraeger_wurf.png}`
  (ohne `\label`), direkt nach dem Absatz „Wir sehen: Die Flug**bahn** … ist
  auch eine Parabel!".
- **Einzusetzen** — an die vorhandene Unterschrift anschließen:

  ```latex
  Diese Parabel ist eine \textbf{andere} als die von $y(t)$ in
  Abbildung~\ref{fig:schraeger_wurf}: sie beschreibt den Verlauf der Flugkurve
  durch den Raum -- die Spur im Schnee --, nicht den zeitlichen Verlauf der Höhe.
  ```

  Der Satz steht so schon im Fließtext **darüber**; in der Unterschrift steht er
  bisher nicht. Er ist der Grund, warum es diese Abbildung überhaupt gibt.
- **Was NICHT nachgezogen wird:** der Hinweis der interaktiven Fassung, dass
  sich der Zeitpunkt dort zeigen lässt (samt Regler-Hinweisen). Er benennt genau
  das, was Papier **nicht** kann.
- **Am gedruckten Satz ist nichts zu ändern.** Kurz erwogen und wieder
  verworfen: die gedruckte Unterschrift sagt, wo das Objekt zu einem Zeitpunkt
  ist, sei „nicht mehr erkennbar", während die interaktive Figur es zeigt — das
  klang zunächst nach einem Widerspruch. Ist es nicht (Nutzerformulierung
  2026-09-14): sichtbar ist es dort **während der Wiedergabe**, im Nachhinein
  auch dort nicht mehr, denn die fertige Kurve trägt die Zeit nicht in sich.
  Der gedruckte Satz gilt also uneingeschränkt; die interaktive Fassung fügt
  nur den Moment hinzu, und genau so steht es in ihrer Bildunterschrift.
- **Nummern:** **keine.** Die statische Abbildung bleibt an derselben Stelle
  (`.nur-druck`), `dom_harness.mjs` zeigt unverändert 88 Abbildungen.

#### P21-A11 · Unterschrift von Abb. 1.15: ILIAS-Verweis und Zuspitzung

- **Status:** **offen — entstanden 2026-09-14** beim Bau der interaktiven Figur
  zu Abb. 1.15 (P17-1, WIP `263c105`, v1.53.0). Zwei Punkte, einer davon
  **entscheidungsbedürftig**.
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`, die `figure`
  mit `\includegraphics[width=0.8\textwidth]{kinematik_geschwindigkeit_unterschied_durchschnitt_momentan.png}`.

1. **Zuspitzung (nachziehen).** Die gedruckte Unterschrift sagt, die Sekante sei
   „offensichtilch positiv" und die Tangente negativ, benennt aber nicht, was
   daran der Punkt ist. Einzusetzen, im Anschluss an den Tangenten-Satz:

   ```latex
   Die beiden Größen haben hier nicht einmal dasselbe Vorzeichen.
   ```

   *(Dass die gedruckte Fassung „offensichtilch" schreibt, ist ein Tippfehler
   der Quelle — er steht in `QUELLEN_FEHLER.md` 1.1 Nr. 3 und wird dort
   mitkorrigiert, nicht hier.)*

2. **ILIAS-Verweis (Entscheidung nötig).** Die gedruckte Unterschrift endet mit
   „Eine interaktive Animation hierzu finden Sie im ILIAS Lernraum unter
   *Zusatzmaterialieren - Interaktive Animationen zur Physik am FB 8*". Im
   interaktiven Skript ist dieser Satz **weggelassen**: die Figur daneben *ist*
   diese Animation, der Verweis zeigt vom Ziel weg.
   **Für das Druckskript ist zu entscheiden:** stehen lassen (das Papier hat die
   Animation nicht), oder auf das interaktive Skript umlenken, sobald es
   veröffentlicht ist. Das ist dieselbe Frage für **jede** Stelle, an der v0.13
   auf ILIAS-Animationen verweist — sie sollte einmal grundsätzlich entschieden
   werden, nicht pro Abbildung.
- **Was NICHT nachgezogen wird:** die Regler-Hinweise und die Aufforderung
  „Ziehen Sie \(\Delta t\) gegen null" — auf Papier gibt es nichts zu ziehen.
- **Nummern:** **keine.** Statische Abbildung bleibt an Ort und Stelle
  (`.nur-druck`), `dom_harness.mjs` zeigt unverändert 88 Abbildungen.

#### P21-A12 · Unterschrift von Abb. 1.19: Pfeil-Satz und korrigierte Formel

- **Status:** **entschieden: bewusst — nichts nachzuziehen** (bis auf den
  Quellfehler, s. u.). Entstanden 2026-09-26 beim Bau der interaktiven Figur
  zu Abb. 1.19 (P16-5, WIP `c15b70a`, v1.54.0).
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`, die
  `figure` mit `\label{fig:geschw_zeit_diagramm_senkr_wurf}`.
- **Was anders ist:** die interaktive Unterschrift ist die gedruckte, Wort für
  Wort, mit drei Unterschieden:
  1. \(v_0\), \(h_0\), \(t_\mathrm{max}\) und \(t_\textrm{Wurf}\) sind
     mitlaufende Zahlen — **nicht nachziehen** (Sonderregel Bildunterschriften).
  2. Ein angehängter Satz zum Geschwindigkeitspfeil an der Kugel („er wird zum
     Scheitel hin kürzer, ist bei \(t_\mathrm{max}\) verschwunden und zeigt
     danach nach unten — im selben Moment, in dem die Gerade \(v(t)\) die
     \(t\)-Achse kreuzt") und ein Regler-Hinweis — **nicht nachziehen**: die
     gedruckte Abbildung ist ein reines v-t-Diagramm ohne Szene, der Satz hätte
     dort keinen Gegenstand.
  3. Die \(t_\textrm{Wurf}\)-Formel ist korrigiert — das ist **kein
     didaktischer Zusatz, sondern ein Quellfehler**: `QUELLEN_FEHLER.md`
     Abschnitt 1.1 Nr. 7. Druckseitig einzusetzen (an der Stelle von
     `\left(\frac{v_0}{g}^2 \right)`):

     ```latex
     \left(\frac{v_0}{g}\right)^2
     ```
- **Nummern:** **keine.** Statische Abbildung bleibt an Ort und Stelle
  (`.nur-druck`), `dom_harness.mjs` zeigt unverändert 88 Abbildungen.

#### P21-A13 · Unterschrift von Abb. 1.18: ein Bild statt zwei

- **Status:** **entschieden: bewusst — nichts nachzuziehen** (bis auf die
  Quellfehler, s. u.). Entstanden 2026-09-26 beim Bau der interaktiven Figur
  zu Abb. 1.18 (P16-8, WIP `54b374a`, v1.55.0).
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`, die
  `figure` mit `\label{fig:geschwindigkeit_tangential}` (Teilbilder
  `fig:geschwindigkeit_tangential_1`/`_2`).
- **Was anders ist:** die gedruckte Abbildung hat zwei Teilbilder, die
  interaktive ist **eine** Figur mit Umschalter (Nutzerentscheidung
  2026-09-26). Deshalb heißt es interaktiv statt „Im Vergleich der beiden
  **Bilder**" nun „Im Vergleich der beiden **Koordinatensysteme** — (a) mit
  Ursprung am Boden, (b) mit Ursprung im Abwurfpunkt —". Dazu ein
  Regler-Hinweis am Ende, seit P16-8b (v1.55.2) mit dem Satz „die graue Linie
  durch das Objekt ist diese Tangente, sie lässt sich im Bedienfeld
  ausblenden" — ebenfalls nicht nachzuziehen (die gedruckten Teilbilder haben
  keine eingezeichnete Tangente; wenn doch, wäre das beim Nachziehen zu prüfen). **Nicht nachziehen:** gedruckt gibt es zwei Bilder,
  dort stimmt „der beiden Bilder"; der Regler-Hinweis gehört nicht aufs Papier.
- **Quellfehler — druckseitig mitzukorrigieren:** `QUELLEN_FEHLER.md`
  Abschnitt 1.1 Nr. 4 („abhänt") und Nr. 8 (fehlender Punkt nach
  „Bahnkurve", „vom Wahl"). Der korrigierte Wortlaut der betroffenen Stelle:

  ```latex
  Der Geschwindigkeitsvektor ist immer eine Tangente an die Bahnkurve. Im
  Vergleich der beiden Bilder sieht man auch, dass der Ortsvektor von der Wahl
  des Koordinatensystems abhängt, während der Geschwindigkeitsvektor in beiden
  Koordinatensystemen gleich ist.
  ```
- **Nummern:** **keine.** Die statische Doppelabbildung bleibt an Ort und
  Stelle (`.nur-druck`), `dom_harness.mjs` zeigt unverändert 88 Abbildungen.

#### P21-A14 · Unterschrift von Abb. 1.20: Komponentenpfeile

- **Status:** **entschieden: bewusst — nichts nachzuziehen** (bis auf den
  Quellfehler, s. u.). Entstanden 2026-09-26 beim Bau der interaktiven Figur
  zu Abb. 1.20 (P16-9, WIP `939d2f7`, v1.56.0).
- **Zieldatei:** `Input/v0.13/pskript_mech_kinematik_gmni_v4.tex`, die
  `figure` mit `\includegraphics[width=0.95\textwidth]{kinematik_geschwindigkeit_zeit_diagramm_schraeger_wurf.png}`
  (ohne `\label`).
- **Was anders ist:** die interaktive Unterschrift ist die gedruckte mit
  mitlaufenden Zahlen (\(|v_0|\), \(\alpha\), \(h_0\)), einem Satz zu den
  Komponentenpfeilen an der Kugel („\(v_x\) bleibt … gleich lang, \(v_y\) wird
  bis zum Scheitel kürzer und zeigt danach nach unten") und einem
  Regler-Hinweis. **Nicht nachziehen:** die gedruckte Abbildung zeigt nur die
  beiden Diagramme, keine Szene mit Pfeilen.
- **Quellfehler — druckseitig mitzukorrigieren:** `QUELLEN_FEHLER.md`
  Abschnitt 1.1 Nr. 9. Einzusetzen statt „Geschwindigkeits-Zeit Diagramm":

  ```latex
  Geschwindigkeits-Zeit-Diagramm
  ```
- **Nummern:** **keine.** Statische Abbildung bleibt (`.nur-druck`),
  `dom_harness.mjs` zeigt unverändert 88 Abbildungen.

---

### Medienbedingte Unterschiede (dokumentiert, nichts nachzuziehen)

Vollständigkeitshalber hier gelistet, damit niemand sie für vergessene
Abweichungen hält. Es sind Übersetzungen ins HTML-Medium, der Sachtext ist
unverändert; im `.tex` gibt es nichts zu tun. Details jeweils im Kopfkommentar
des Fragments.

- `ch_01_01`: `\bbspe` (Plural-Beispielbox) → einzelne `beispiel`-Boxen ·
  Quell-Artefakt „code/Code" in der Zusammenfassung übersprungen.
  *(Korrigiert 2026-09-14: das Doppel-Label `formel_freierfall4` stand hier
  als medienbedingt und „nichts nachzuziehen". Das war falsch — das WIP hat
  disambiguiert, der Druck nicht, also weichen die Querverweise beider
  Fassungen voneinander ab. Der Fall ist jetzt **P21-A8**.)*
- `ch_01_03`: Bildunterschrift „Abbildung zum Beispiel …" ohne Nummer — der
  HTML-Resolver kennt keine Box-Referenz; die Abbildung steht inline in der Box,
  der Verweis ist dadurch eindeutig.
- `ch_01_01`, Abb. 1.9 (schräger Wurf, interaktiv seit v1.43.0): die Formelkarte
  zeigt \(x(t)\) und \(y(t)\) — beides Komponenten der bereits gedruckten
  nummerierten Vektorgleichung, also **kein** Zusatz im Sinn von A3(b). Der
  didaktische Satz der Unterschrift („beide Kurven beschreiben dieselbe Bewegung
  mit demselben Parameter \(t\)") steht im Druck schon im Fließtext direkt vor
  der Abbildung. Offen ist dort nur der **Quellfehler** „links … und links" →
  `QUELLEN_FEHLER.md` (1.1, Nr. 6).
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
- [x] **P21-1a Übergabedokument** *(S)* — **erledigt 2026-09-10**: Export des
  Registers als `../UEBERGABE_Druckskript.md` (Arbeitspakete AP1–AP7 mit dem
  wörtlichen LaTeX, den Zieldateien, den Leitplanken und dem Prompt für die
  Session im LaTeX-Repo). Bei Widersprüchen gilt dieses Register; das
  Übergabedokument ist bei jeder neuen Abweichung mitzuziehen.
- [x] **P21-2 Angleichung im LaTeX-Repo** — **erledigt 2026-09-14**: A1–A8
  stehen druckseitig. Anleitung war `../UEBERGABE_Druckskript.md`.
  - **A1–A6** je ein Commit (`6c3b90f`, `3e0be3e`, `40cabda`, `ba1fc7d`,
    `e4e87e5`, `541c997`), dazu zwei Neubauten (`65c798d`, `8b1ac66`).
  - **A7** vollständig: Header definiert `rechenbeispielcounter`,
    `rechenbeispielbox` und `\brbsp`/`\erbsp` (+ Plural) mit
    `calculator`-Icon in `skriptblau` — die beiden im Übergabedokument offen
    gelassenen Entscheidungen (Farbton, Icon) sind damit getroffen —, und die
    Kästen sind umgestellt: **64 Beispiel / 28 Rechenbeispiel**, je
    eingebundener Datei `11/17/11/12/6/1/12/3/4/1/6/5/3 = 92`, Zahl für Zahl
    die Kontrollzahlen aus `scripts/classification_report.md`.
    *(Beim Nachmessen: der Makroname ist `\brbsp`, **nicht** `\bbrsp` wie im
    ursprünglichen Vorschlag des Übergabedokuments — mit dem falschen Namen
    findet `grep` nichts und A7 sieht offen aus.)*
  - **A8** drei Commits (`54304e1`, `6b5566c`, `4063250`), Neubau `830dcf9`,
    Log ohne „multiply-defined labels". Details oben bei P21-A8.
  - Die beiden Quellfehler 5 und 6 (Abschnitt 1.1) sind mitkorrigiert
    (`bdb4229`) und in `CORRECTIONS.md` des Quell-Repos eingetragen. In
    `QUELLEN_FEHLER.md` steht das noch nicht — die Tabelle führt nur eine
    Spalte „WIP", keine für den Druckstand; bei der Gegenprüfung ist zu
    entscheiden, ob die Einträge einen Vermerk „Druck: korrigiert 2026-09-14"
    bekommen.
  - **Offen: die fünf Commits sind noch nicht gepusht** (Stand 14.09.2026) —
    solange gibt es die Angleichung nur lokal.
  - **Für P21-3:** A7 ist der einzige nicht nummernneutrale Punkt; die
    Beispielnummern haben sich auf der Druckseite verschoben, dort muss die
    Gegenprüfung ansetzen. A8 ist nummernneutral (421 Seiten vor und nach).

- [x] **P21-3 Gegenprüfung** — **erledigt 2026-09-14**, gemessen gegen das
  PDF von `1c64edd` (421 Seiten). Ergebnis: **deckungsgleich in allen vier
  Größen**, keine Abweichung.

  | Was | PDF | WIP | Befund |
  |---|---|---|---|
  | Kästen Beispiel / Rechenbeispiel | 64 / 28 | 64 / 28 | **Typ, Nummer und Reihenfolge aller 92 identisch** — die Verschiebung aus A7 ist damit beidseitig angekommen |
  | Gleichungsnummern | 947 | 947 | identisch in **Wert und Reihenfolge**, über alle 22 Abschnitte |
  | Abbildungsnummern | 88 | 88 | identisch in Reihenfolge (23 Doppeleinträge = interaktive Figur + statisches Pendant unter derselben Nummer) |
  | Querverweise | — | 173 | 54 Abbildungs- + 24 Abschnitts-Verweise aufgelöst, 101 Formel-Verweise im Browser alle als `(X.Y.Z)` — kein „??" |

  **Wie gemessen.** Kästen und Abbildungen über `pdftotext` gegen die im
  Browser gerenderten Titel; Gleichungen seitenweise im echten Browser, weil
  MathJax pro Seite setzt (P22-3) — je Seite gegengeprüft, dass so viele Tags
  gelesen wurden, wie MathJax `mlabeledtr`-Zeilen angelegt hat (sonst zählt man
  bei `align`-Blöcken nur die erste Nummer und bekommt stillschweigend zu
  wenig: 802 statt 947). Dazu die Stufen 3, 4, 4b, 4c und 6 des Skills:
  DOM-Harness ohne Befund, 98 Bildpfade alle HTTP 200, 0 Formel-Übersteher in
  allen drei Breiten-Modi, 451 Sprungziele in Toleranz, `node --check` über
  alle Module, CSS-Klammern balanciert.

  **Dabei gefunden und behoben** (zwei Fehler, die nichts mit der Angleichung
  zu tun hatten): die abgeschnittene Bildunterschrift zu Abb. 1.58 (`4042021`)
  und das rohe `<` in Inline-Mathe, das in 2.2.7 eine Formel samt Satzrest
  verschluckte (`ee25b44`, P5).

  **Offen bleibt Stufe 5 (Sicht):** Prosa Wort für Wort gegen das PDF,
  Druckfluss, Optik — das braucht einen Menschen.

- [x] **P21-4 Zwei undefinierte Verweise in den Schwingungen (Quellfehler
  Nr. 7 und 8)** — **erledigt 2026-09-28** im LaTeX-Repo. Beide standen als
  „Offen" in `../UEBERGABE_Druckskript.md`, jetzt beauftragt und umgesetzt:
  Nr. 8 Label-Tippfehler `…schwingung2` → `…schwingung_2` (`e40973d`), Nr. 7
  Klammerzusatz „(siehe Abbildung …)" gestrichen wie im WIP (`432d30a`); beide
  nummernneutral, Neubau `0214009`, Log ohne „undefined". **Nr. 7: keine
  Abbildung ergänzt** — die Autorenentscheidung „Abbildung zeichnen" steht
  weiter aus und würde alle folgenden Abbildungsnummern auf einer Seite
  verschieben. Neu gefunden, nicht behoben: Z. 335 verweist auf die falsche
  Gleichungsform (definiert, daher ohne Warnung), s. Übergabe.
- [x] **P21-5 Hinweis für die nächste Gegenprüfung: Anhang A im Druckskript** —
  **2026-09-28**. Im LaTeX-Repo steht neu ein Anhang „Systematisches Lösen von
  Physikaufgaben" (`pskript_anhang_loesungsstrategie_v1.tex`, Kapitel **A**,
  Commits `98e24ac`…`b0f2536`). Er hat **kein Gegenstück im interaktiven Skript**
  und ist keine P21-Abweichung, verändert aber die Messgrößen von P21-3: das
  PDF hat jetzt **431 statt 421 Seiten**, und ein `pdftotext`-Zählen der
  Abbildungen findet **sechs zusätzliche** („Abbildung A.1"–„A.6", TikZ-
  Entscheidungsbäume) — sie gehören nicht zu den 88. Die Kapitel 0–3 sind
  unverändert (keine Kapitel-, Abschnitts-, Gleichungs- oder Beispielnummer
  verschoben; der Anhang enthält keine nummerierte Gleichung), nur Kästen
  „Wichtig" laufen mit („Wichtig A.1.1–A.1.3"). Beim Zählen also nach dem
  Buchstaben-Präfix filtern. Sieben Abschnitte darin sind mit rotem
  „[TODO …]" markiert — noch nicht ausformuliert, mit dem Autor zu klären.

---
