# Übergabe: das Druckskript an das interaktive Skript nachziehen

**Zweck.** Diese Datei ist die **Arbeitsanweisung für eine Session im
LaTeX-Repo** (`Project_Script`). Sie fasst alle inhaltlichen Abweichungen
zusammen, die das interaktive Skript (`InteraktivesSkript_WIP`) gegenüber
`v0.13` aufgebaut hat, und nennt für jede den einzusetzenden Text **wörtlich**.
Sie ist so geschrieben, dass sie ohne Rückfragen abgearbeitet werden kann —
auch von jemandem, der bei keiner der Änderungen dabei war.

**Woher das kommt.** Register der Wahrheit ist
`backlog/P21-statisches-skript-nachziehen.md` in diesem Repo; dort steht auch
die Begründung je Eintrag. Diese Datei ist der **Export daraus** (Stand
2026-09-10, WIP-Version v1.48.0; **AP8 nachgetragen 2026-09-14**) plus die
beiden Quellfehler, die beim Nachziehen mitzukorrigieren sind. Bei
Widersprüchen gilt P21.

**Warum das kritisch ist** (Nutzervorgabe 2026-08-28): *„Druckskript und
interaktives Skript müssen synchron bleiben; die Dokumentation der Abweichungen
ist absolut missionskritisch."* Abbildungs-, Gleichungs- und Kastennummern des
interaktiven Skripts entstehen aus der Reihenfolge im HTML, die des
Druckskripts aus LaTeX. Läuft eine Umstellung nur auf einer Seite, zeigen
Querverweise der beiden Fassungen auf **verschiedene** Objekte.

---

## So wird diese Datei benutzt

Die andere Session **im LaTeX-Repo** starten — nicht in diesem Repo:

```
cd /home/chris/shared/VM_Exchange/Project_Script
claude
```

Das ist der **maßgebliche** Arbeitsordner — der, aus dem nach GitHub gepusht
wird (Remote `ceffertzfhac/Project_Script`). Auf der VM liegen zwei weitere
Klone desselben Repos, `Project_InteraktivesSkript/Input/physik_skript_repo`
(Stand 26.07.2026) und `Share/Project_Script` (Stand 04.03.2026) — **beide sind
Altstände und nicht die Referenz** (s. `QUELLE_v013.md`). Der maßgebliche
Ordner hat **keine `CLAUDE.md`** — nur eine `GEMINI.md`, die Claude Code nicht
automatisch lädt, und die zudem veraltet ist (sie nennt `v0.12/` als aktuelle
Arbeitsversion). Deshalb trägt der Prompt unten die Konventionen selbst.

Dann diesen Prompt eingeben:

```text
Setze AP8 der Uebergabe um: die fuenf mehrfach vergebenen \label im
Druckskript.

Die vollstaendige Arbeitsanweisung liegt hier — lies sie zuerst ganz:
/home/chris/shared/VM_Exchange/Project_InteraktivesSkript/UEBERGABE_Druckskript.md

Stand: AP1-AP7 sind am 14.09.2026 umgesetzt und committet, offen ist nur AP8
(Abschnitt "AP8" der Datei, Teilpakete AP8a/b/c). Fang trotzdem mit Schritt 0
an und pruefe selbst nach, statt mir das zu glauben.

Zwei Dinge, bevor du anfaengst:
- Im Arbeitsbaum liegen drei geaenderte, nicht committete Dateien
  (Physik_pskript_v0.13.tex, pskript_grundlagen_gmni_v2.tex und das PDF). Die
  sind von mir und kommen mit rein — aber als EIGENER Commit VOR AP8, nicht
  vermischt. Inhalt: die beiden Beispielzahlen im Abschnitt "Rechnen mit
  Zehnerpotenzen" stehen jetzt ausgeschrieben in Dezimalschreibweise statt als
  \SI{...e...}{...} (mit Kommentar im .tex, dass das so bleiben muss — sie
  sind das Beispiel dafuer, warum man Zehnerpotenzen braucht), dazu ein paar
  \ Abstands-Korrekturen nach "ca." . Schau dir das Ganze vorher an und sag
  mir, was drin ist. Zwei Sachen dabei pruefen und mit mir klaeren, BEVOR du
  committest:
  (a) Die ausgeschriebene Elektronenmasse hat 27 Nullen nach dem Komma
      (9 Dreiergruppen) und ist damit 9,109e-28 statt 9,109e-31 -- Faktor 1000
      zu gross. Fuer 9,109e-31 braucht es 30 Nullen, also 10 Dreiergruppen.
      Die Sonnenmasse (1989 + 27 Nullen = 1,989e30) stimmt.
  (b) In Physik_pskript_v0.13.tex steht ein fuehrendes Leerzeichen vor
      \documentclass -- Absicht?
- Der Makroname fuer die Rechenbeispiele ist \brbsp, nicht \bbrsp. Der
  Vorschlag im AP7-Abschnitt traegt den falschen Namen; wer danach sucht, haelt
  AP7 faelschlich fuer offen.

Rahmen fuer diese Session:
- Sprache von Inhalt und Kommentaren: Deutsch.
- Kleinschrittig committen: ein Commit je Teilpaket (AP8a, AP8b, AP8c), vorher
  die betroffenen Dateien gezielt `git add`-en und `git diff --cached` pruefen.
  Nicht pushen ohne ausdrueckliche Freigabe.
- AP8 ist nummernneutral: ein Label umzubenennen verschiebt kein Objekt. Wenn
  sich doch eine Nummer bewegt, hast du zu viel angefasst.
- Die doppelte Kreisbahn-Passage in pskript_mech_kin_dreh_und_kreis_v1.tex
  NICHT entfernen, auch wenn sie offensichtlich redundant ist — das
  interaktive Skript hat sie 1:1 mit uebernommen, eine Gleichung dort zu
  streichen verschoebe die Nummern auf beiden Seiten. Nur die Labels anfassen.
- Die Ersatznamen aus der Anweisung woertlich uebernehmen — sie sind so
  gewaehlt, dass sie zu den IDs des interaktiven Skripts passen.
- Danach das PDF neu bauen und pruefen: im Log keine Warnung
  "multiply-defined labels" mehr, und die fuenf Verweisstellen drucken die
  Nummern, die in den Tabellen der Anweisung als "gemeint" stehen.

Melde am Ende je Teilpaket: umgesetzt / schon erledigt / offen (mit Grund),
welche Verweise jetzt welche Nummer drucken und ob das Log sauber ist — damit
ich P21 in meinem anderen Repo abhaken kann.
```

---
---

## Schritt 0 — Quellstand herstellen (immer zuerst)

Geschrieben wurde die Anweisung gegen `3122514` („Bilder 2.3 nachgeliefert.",
2026-07-26). **Am 2026-09-14 ist ein großer Teil davon umgesetzt worden**;
nachgemessen über `Input/v0.13` dieses Repos — der Symlink zeigt auf
`../../Project_Script/v0.13`, also auf **diesen** maßgeblichen Arbeitsordner
(nicht auf den Altstand `Input/physik_skript_repo`) —, Stand `8b1ac66`
(„Dokument auf dem Mac neu gebaut", 2026-09-14), deckungsgleich mit
`origin/main`:

| AP | Stand am 2026-09-14 | woran erkennbar |
|---|---|---|
| AP1–AP5 | **umgesetzt**, je ein Commit | `6c3b90f`, `3e0be3e`, `40cabda`, `ba1fc7d`, `e4e87e5` |
| AP6 | **umgesetzt** | `541c997` |
| AP7 | **umgesetzt und vollständig** — Header **und** alle Kästen; die Kontrollzahlen stimmen auf die Datei genau | `\brbsp`/`\erbsp` (+ Plural) im Header, in den eingebundenen `.tex` **64 Beispiel / 28 Rechenbeispiel**, je Datei `11/17/11/12/6/1/12/3/4/1/6/5/3 = 92` |
| AP8 | **offen**, neu am 2026-09-14 | Warnung „multiply-defined labels" im TeX-Log |
| Quellfehler 5 und 6 | **mitkorrigiert** | `bdb4229` |

Die beiden Neubauten (`65c798d`, `8b1ac66`, 421 Seiten, 0 Fehler) liegen danach.
Deshalb vor dem Anfangen **immer** selbst nachsehen — der Stand kann sich seit
diesem Eintrag wieder bewegt haben:

```
git pull
git log --oneline -15
grep -c '\\brbspe\?{' v0.13/*.tex | grep -v ':0'   # AP7: Kaesten umgestellt?
grep -n 'multiply' *.log v0.13/*.log 2>/dev/null     # AP8
```

**Der Makroname ist `\brbsp`, nicht `\bbrsp`** — der Vorschlag in AP7 unten
trägt den anderen Namen, umgesetzt wurde `\brbsp`. Wer nach `bbrsp` sucht,
findet nichts und hält AP7 fälschlich für offen.

- `\brbsp` schon in den Kapitel-`.tex` → **AP7 überspringen** (oder nur
  gegenprüfen) und das in der Rückmeldung sagen.
- Wäre AP7 doch noch offen und fehlte `scripts/classification_report.md` → AP7
  **nicht** nach eigener Einschätzung umsetzen, sondern zurückfragen. Die
  Zuordnung der 92 Kästen darf nicht zum zweiten Mal getroffen werden
  (Begründung in AP7).

**Zieldatei für AP1–AP5:** `v0.13/pskript_mech_kinematik_gmni_v4.tex`
(Abschnitt 1.1 „Kinematik").
**Für AP6:** `v0.13/Physik_pskript_v0.13.tex` (Master).
**Für AP7:** `v0.13/Physik_skript_header_gmni_v3.tex` + die Kapitel-`.tex`.
**Für AP8:** `v0.13/pskript_mech_kinematik_gmni_v4.tex` (ein Label) +
`v0.13/pskript_mech_kin_dreh_und_kreis_v1.tex` (vier Labels).

> **Fallstrick bei den vier Wurf-Abbildungen.** Ihre Labels heißen
> `fig:senkrechter_wurf_start` / `_aufstieg` / `_umkehr` / `_abstieg`, meinen
> aber **nicht** Flugphasen, sondern die vier **Koordinatensysteme** — in dieser
> Reihenfolge: ↑/Boden, ↑/Abwurfpunkt, ↓/Boden, ↓/Abwurfpunkt (Bilddateien
> `senkrechter_wurf_1..4.png`). Beim Umsortieren nicht nach dem Labelnamen
> gehen. Die Freier-Fall-Abbildung heißt im `.tex` `fig:freier_fall_1`
> (im HTML `fig-freierfall_1` — nicht verwechseln).

---

## AP1 — Abb. 1.5–1.7 an das Ende der Beispielbox (P21-A1)

**Was im WIP anders ist:** In v0.13 stehen die vier Wurf-Abbildungen
unmittelbar hintereinander. Im interaktiven Skript steht nur noch die **erste**
dort; die drei anderen stehen **am Ende** der Beispielbox „Freier Fall und
senkrechter Wurf", nach dem Absatz „Einige Erkenntnisse können wir sogar
gewinnen …".

**Zu tun:** Die drei `figure`-Umgebungen mit den Labels
`fig:senkrechter_wurf_aufstieg`, `fig:senkrechter_wurf_umkehr`,
`fig:senkrechter_wurf_abstieg` als Block ausschneiden und unmittelbar **vor
`\ebspe`** (Ende der Beispielbox) wieder einsetzen — Reihenfolge untereinander
unverändert.

**Nummern:** bleiben gleich, weil die relative Reihenfolge erhalten bleibt und
keine andere Abbildung dazwischen liegt. Die beiden `\ref`-Ketten im Text
(„siehe Abbildungen … bis …") bleiben gültig. *Das ist Glück, keine Regel* —
bei der nächsten Umstellung neu prüfen.

## AP2 — Überleitender Absatz nach Abb. 1.4 (P21-A2)

**Was im WIP anders ist:** Nach der ersten Wurf-Abbildung steht ein Absatz, den
v0.13 nicht hat. Er erklärt, warum dieselbe Bewegung in vier
Koordinatensystemen gezeigt wird — ohne ihn steht der verschobene Block aus AP1
unmotiviert am Boxende.

**Zu tun:** Direkt nach dem `\end{figure}` von `fig:senkrechter_wurf_start`
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

## AP3 — Koordinatensystem-Satz in fünf Bildunterschriften (P21-A3a)

**Grundsatzregel** (Nutzerentscheidung 2026-08-28, gilt für **alle** künftigen
interaktiven Figuren): Was eine interaktive Figur an *Erklärung* mitbringt,
wird ins Druckskript nachgezogen — der erklärende Teil der Unterschrift ja, die
interaktiven Teile nicht.

**Was im WIP anders ist:** Jede interaktive Unterschrift beginnt mit dem
Koordinatensystem und übersetzt die Ausgangslage hinein. Gedruckt nennen die
Unterschriften die Achsenwahl nur in einem Nebensatz am Ende und sagen nicht,
wo Abwurfpunkt und Erdboden in *diesem* System liegen.

**Zu tun:** Der jeweiligen `\caption{…}` **voranstellen** (der bestehende
v0.13-Text bleibt danach stehen):

```latex
% fig:freier_fall_1  --  y nach oben, Nullpunkt am Erdboden, h0 = 10 m
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach oben, ihr Nullpunkt liegt auf dem Erdboden. Das Objekt wird
\SI{10}{\meter} über dem Erdboden losgelassen, in diesem Koordinatensystem also
bei $y=+\SI{10}{\meter}$; der Erdboden liegt bei $y=0$.
```

```latex
% fig:senkrechter_wurf_start  --  y nach oben, Nullpunkt am Erdboden
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach oben, ihr Nullpunkt liegt auf dem Erdboden. Das Objekt startet
\SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei
$y=+\SI{20}{\meter}$; der Erdboden liegt bei $y=0$.
```

```latex
% fig:senkrechter_wurf_aufstieg  --  y nach oben, Nullpunkt im Abwurfpunkt
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach oben, ihr Nullpunkt liegt im Abwurfpunkt. Das Objekt startet
\SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei $y=0$;
der Erdboden liegt bei $y=-\SI{20}{\meter}$.
```

```latex
% fig:senkrechter_wurf_umkehr  --  y nach unten, Nullpunkt am Erdboden
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach unten, ihr Nullpunkt liegt auf dem Erdboden. Das Objekt startet
\SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei
$y=-\SI{20}{\meter}$; der Erdboden liegt bei $y=0$.
```

```latex
% fig:senkrechter_wurf_abstieg  --  y nach unten, Nullpunkt im Abwurfpunkt
\textbf{Koordinatensystem:} die $y$-Achse steht senkrecht auf dem Erdboden und
zeigt nach unten, ihr Nullpunkt liegt im Abwurfpunkt. Das Objekt startet
\SI{20}{\meter} über dem Erdboden, in diesem Koordinatensystem also bei $y=0$;
der Erdboden liegt bei $y=+\SI{20}{\meter}$.
```

**Nicht nachziehen** (interaktiv-only): „der Zeit-Regler \(t\) …", die
Farbnennung „rote Kurve", die mitlaufenden Zahlenwerte, „Letzte Kurve
behalten".

## AP4 — Drei unnummerierte Gleichungen zu den verschobenen Abbildungen (P21-A3b)

**Was im WIP anders ist:** Die interaktiven Figuren nennen für jedes
Koordinatensystem die Bewegungsgleichung *dieses* Systems. Gedruckt steht nur
die Gleichung des Systems „↑/Boden"
(`\label{formel_senkrechterwurf1}`); die drei anderen Abbildungen stehen ohne
Formel da.

**Zu tun:** Zu den drei in AP1 verschobenen Abbildungen jeweils die Gleichung
ihres Systems einsetzen — **unnummeriert**:

```latex
% y nach oben, Nullpunkt im Abwurfpunkt  (fig:senkrechter_wurf_aufstieg)
\[ y(t) = -\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
% y nach unten, Nullpunkt am Erdboden    (fig:senkrechter_wurf_umkehr)
\[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t - h_0 \]
% y nach unten, Nullpunkt im Abwurfpunkt (fig:senkrechter_wurf_abstieg)
\[ y(t) = +\tfrac{1}{2}\,g\,t^2 + v_0\,t \]
```

**Vorzeichen-Konvention, die dazugehört:** \(v_0\) ist **in der Achse der
jeweiligen Abbildung** gezählt — bei nach unten zeigender Achse ist der Wurf
nach oben also \(v_0<0\). Nur so bleibt der \(v_0\)-Term überall `+v_0 t`, und
es kippen ausschließlich der \(g\)- und der \(h_0\)-Term. **Dieser Satz gehört
mit in den Fließtext**, sonst lesen die drei Gleichungen sich falsch.

**Warum unnummeriert:** als nummerierte `equation` würden die drei jede
folgende Gleichungsnummer in Abschnitt 1.1 verschieben (bis 1.1.99) — und damit
auch die Nummern im interaktiven Skript, das seine Zählung aus derselben
Reihenfolge ableitet. Unnummeriert kostet die Aufnahme nichts.

## AP5 — Unterschrift Abb. 1.8, Feder-Masse-Pendel (P21-A5)

**Zu tun:** Der Unterschrift von `fig:feder_masse_pendel` voranstellen:

```latex
\textbf{Koordinatensystem:} die $y$-Achse zeigt entlang der Bewegungsrichtung
der Masse nach oben, ihr Nullpunkt liegt in der Ruhelage -- die Masse schwingt
also zwischen $y=+y_0$ und $y=-y_0$ hin und her.
```

**Nicht nachziehen:** Regler-/Wiedergabe-Hinweise, „Letzte Kurve behalten", die
mitlaufenden Zahlenwerte.
**Nichts zu tun für die Formelkarte der Figur:** sie zeigt
`\ref{formel_feder_masse_pendel}` des Fließtextes, also nichts Zusätzliches.

## AP6 — Abschnittsnummern 3.0 / 3.1 / 3.2 in TK 3 (P21-A6)

Hier ist es **kein** Zusatz des interaktiven Skripts, sondern ein Quellfehler:
v0.13 nummeriert die Einleitung des Themenkomplexes 3 fälschlich als „3.1" und
„Schwingungen" ebenfalls als „3.1" (Dublette). Das interaktive Skript führt die
offensichtlich gewollte Zählung 3.0 / 3.1 / 3.2 — **die Abschnittsnummern der
beiden Fassungen weichen also voneinander ab.**

**Zu tun:** Im Master `v0.13/Physik_pskript_v0.13.tex` das
`\addtocounter{section}{-1}` **vor** `\section{Einleitung und Motivation}` des
TK 3 setzen. Bei Mechanik und Elektromagnetismus steht es dort korrekt und
liefert 1.0 bzw. 2.0. Danach stimmen beide Fassungen ohne weiteres Zutun
überein.

## AP7 — „Beispiel" in zwei Kastentypen teilen (P21-A7, Design-Entscheidung D5)

**Erst Schritt 0 lesen — dieses Paket ist möglicherweise schon erledigt.**

**Was im WIP anders ist:** v0.13 kennt **einen** Beispieltyp — `\bbsp` und
`\bbspe` zählen beide auf `beispielcounter`
(`\numberwithin{beispielcounter}{section}`) und schreiben „Beispiel~N" bzw.
„Beispiele~N" mit `pen.png`. Das interaktive Skript führt seit v1.47.0 **zwei**
Typen: „Beispiel" (64 Kästen) und „**Rechenbeispiel**" (28 Kästen,
Taschenrechner-Icon, eigener Blau-Ton) — **mit eigenem Zähler je Typ**.

**Folge:** Die **Beispielnummern beider Fassungen laufen auseinander**, weil die
28 herausgelösten Kästen im interaktiven Skript nicht mehr im Beispiel-Zähler
mitzählen. Das trifft jeden `\ref` auf einen Beispielkasten.

**Die Zuordnung ist NICHT neu zu treffen.** Sie stammt Kasten für Kasten aus
`scripts/classification_report.md` **dieses Repos** und wurde über die
**Position** abgebildet, nicht über den Titel (Titel taugen nicht als
Schlüssel: der Bericht kürzt sie auf 80 Zeichen, schleppt `\footnote`-Reste mit,
und „Schlitten an Leine" kommt im Energiekapitel zweimal vor, je einmal pro
Sorte). Kontrollzahlen: **64 Beispiel / 28 Rechenbeispiel**, je Quelldatei
`11/17/11/12/6/1/12/3/4/1/6/5/3 = 92`.

> **Stand 2026-09-14: dieses Paket ist upstream vollständig erledigt.** Im
> Header stehen `\newcounter{rechenbeispielcounter}`,
> `\numberwithin{…}{section}`,
> `\newtcolorbox{rechenbeispielbox}{skriptbox={skriptblau}{5.1}}` sowie
> `\brbsp`/`\erbsp` und `\brbspe`/`\erbspe` (Plural) mit dem
> `calculator`-Icon — die beiden unten offen gelassenen Entscheidungen (Farbton,
> Icon-Format) sind also getroffen. **Der Makroname lautet `\brbsp`, nicht
> `\bbrsp` wie im Vorschlag unten.** Auch die Kästen sind umgestellt: in den
> eingebundenen `.tex` **64 `\bbsp`/`\bbspe` und 28 `\brbsp`/`\brbspe`**, je
> Datei `11/17/11/12/6/1/12/3/4/1/6/5/3 = 92` — Zahl für Zahl die
> Kontrollzahlen unten. Der Rest dieses Abschnitts bleibt als Beleg stehen,
> wonach gesucht wurde und warum die Zuordnung nicht neu zu treffen ist.

**Zu tun:**

1. In `Physik_skript_header_gmni_v3.tex` Zähler und Box anlegen, nach dem Muster
   der bestehenden Definitionen (Zeilen ~124 / 132 / 184–187):

   ```latex
   \newcounter{rechenbeispielcounter}
   \numberwithin{rechenbeispielcounter}{section}
   \newtcolorbox{rechenbeispielbox}{mainboxstyle, colback=mutedBlue!30}
   \newcommand{\bbrsp}[1]{\refstepcounter{rechenbeispielcounter}\begin{rechenbeispielbox}\textbf{\icon{calculator.png}Rechenbeispiel~\therechenbeispielcounter: #1}\begin{quotation}}
   \newcommand{\ebrsp}{\end{quotation}\end{rechenbeispielbox}}
   ```

   **Zwei Dinge dort entscheiden, nicht hier:** den Farbton — `mutedBlue!30`
   kollidiert mit `lernzielbox`, die Design-Seite hat für „mitrechnend" einen
   eigenen Blau-Ton — und das Icon: `\icon{}` lädt **PNG** per
   `\includegraphics`, während in `v0.13/assets/` eine `calculator.svg` liegt.
   Ob eine PNG-Fassung daneben liegt, dort prüfen.
2. Die 28 im Bericht als Rechenbeispiel geführten Kästen von `\bbsp`/`\bbspe`
   auf `\bbrsp` umstellen (Ende jeweils `\ebrsp`).
3. `\ref`-Ketten auf Beispielkästen gegenprüfen — die Nummern verschieben sich
   auf **beiden** Seiten.

**Herkunft:** D5 der Design-System-Konvergenz
(`physik-design-system/KONVERGENZ_ENTSCHEIDUNGEN.md`, liegt auf dem Mac in
iCloud, nicht auf dieser VM). Begründung: zwei verschiedene Objekte standen
unter einem Namen — Kästen, die Theorie demonstrieren, und Kästen, in denen
mitgerechnet werden soll.

---

## AP8 — Fünf mehrfach vergebene `\label` (P21-A8)

**Befund vom 2026-09-14**, aufgefallen an der Warnung „There were
multiply-defined labels" im TeX-Log beim Bauen nach AP6. LaTeX nimmt bei
doppeltem `\label` stillschweigend die **letzte** Definition; `\ref` zeigt dann
auf ein anderes Objekt als gemeint. **Nummernneutral:** ein Label umzubenennen
verschiebt kein Objekt, es ändert nur, welche Nummer der Verweis *druckt* —
dieses Paket ist deshalb unabhängig von allen anderen umsetzbar.

| Label | Datei | definiert als | `\ref` druckt |
|---|---|---|---|
| `formel_freierfall4` | `pskript_mech_kinematik_gmni_v4.tex` (2×) | Gl. **1.1.9** (Fallgesetz) und Gl. **1.1.14** (Fallzeit) | 1.1.14 |
| `eq_kreisbahn_position_zeit` | `pskript_mech_kin_dreh_und_kreis_v1.tex` (2×) | Gl. **1.4.5** und ein `\[…\]` ohne Nummer | **1.4.1** |
| `eq_kreisbahn_winkel_zeit_vereinfachte_form` | ebd. (2×) | Gl. **1.4.7** und ein `\[…\]` ohne Nummer | **1.4.1** |
| `eq_kreisbahn_position_zeit_vereinfachte_form` | ebd. (2×) | Gl. **1.4.8** und Gl. **1.4.9** | 1.4.9 |
| `fig_kreisbewegung_dphi_dr_pair` | ebd. (3×) | Abb. **1.57**, **1.58**, **1.59** | 1.59 |

### AP8a — `formel_freierfall4` (Abschnitt 1.1)

Das Label steht zweimal: an der Streckengleichung
`y(t) = -\frac{1}{2} g t^2 + h_0` (Gl. 1.1.9, im Fließtext-`\begin{equation}`
direkt vor `\begin{figure}` mit `\label{fig:freier_fall_1}`) **und** an der
letzten Zeile der `align`-Umgebung, die die Fallzeit herleitet
(`t = \sqrt{2 h_0/g}`, Gl. 1.1.14). Drei Verweise hängen daran, **zwei davon
drucken heute die falsche Nummer**:

| Stelle | gemeint | druckt |
|---|---|---|
| „Den Streckengleichungen (Formel (`\ref{formel_freierfall1}`) bis (`\ref{formel_freierfall4}`))" | 1.1.6–**1.1.9** | bis 1.1.14 — zieht die ganze Herleitung mit hinein |
| „Wir können uns z.~B. anhand von (`\ref{formel_freierfall4}`) … wie lange das Objekt braucht" | **1.1.9** | 1.1.14 — das Ergebnis, das erst zehn Zeilen später hergeleitet wird |
| „Mit Formel (`\ref{formel_freierfall4}`) … Fallzeit von ungefähr \SI{2}{\s}" | **1.1.14** | 1.1.14 — als einziger richtig |

**Zu tun:** das **zweite** Vorkommen (in der `align`, neben dem schon
vorhandenen `\label{formel_freierfall4a}`) umbenennen in
**`formel_freierfall_fallzeit`** und den dritten Verweis („Mit Formel …
Fallzeit") darauf umstellen. Die ersten beiden Verweise bleiben unverändert und
zeigen dann auf 1.1.9.

> Der Name ist **nicht frei wählbar**: das interaktive Skript hat denselben
> Quellfehler beim Migrieren gesehen und exakt so disambiguiert
> (`ch_01_01_kinematik.html`, `data-ref-eq="formel_freierfall_fallzeit"`).
> Ein anderer Name hier lässt die beiden Fassungen wieder auseinanderlaufen.

*(Achtung: `pskript_mech_kinematik_gmni_v3.tex` enthält denselben Verweis noch
einmal. Das ist der **abgelöste** Vorgängerstand der Datei und nicht im Master
eingebunden — dort nichts ändern.)*

### AP8b — die drei Kreisbahn-Gleichungen (Abschnitt 1.4)

Ursache ist hier eine andere: die Passage „Ersetzen wir … $\varphi(t)$ …" steht
in `pskript_mech_kin_dreh_und_kreis_v1.tex` **zweimal** — einmal mit
nummerierten `equation`-Umgebungen, danach noch einmal als Wiederholung, in der
die Zwischenschritte als unnummerierte `\[…\]` gesetzt sind. In dieser
Wiederholung stehen die Labels ein zweites Mal.

1. Die **drei `\label` in den `\[…\]`-Blöcken ersatzlos streichen.** Eine
   unnummerierte Umgebung hat keine Gleichungsnummer; das Label hängt sich an
   den zuletzt hochgezählten Zähler — hier an den Abschnitt, weshalb die
   Verweise „1.4.1" drucken. Nach dem Streichen zeigen die drei Verweise im
   Fließtext wieder auf 1.4.5 bzw. 1.4.7.
2. Das **zweite `\label{eq_kreisbahn_position_zeit_vereinfachte_form}`** an der
   wiederholten `equation` (Gl. 1.4.9) streichen; auf dieses Label verweist
   niemand, gemeint ist die erste Fassung (1.4.8).

> **Die Dopplung selbst hier nicht anfassen.** Ob die Passage wirklich zweimal
> im Skript stehen soll, ist eine Autorenentscheidung; das interaktive Skript
> hat sie **1:1 mit übernommen** (beide Fassungen, beide Gleichungen 1.4.8 und
> 1.4.9) und nur die Labels weggelassen. Eine der beiden zu streichen würde
> also eine nummerierte Gleichung entfernen und damit **auf beiden Seiten**
> alle folgenden Nummern verschieben — das wäre ein eigener Vorgang mit
> Gegenstück im interaktiven Skript, kein Teil von AP8.

### AP8c — die drei Abbildungen 1.57–1.59

`fig_kreisbewegung_dphi_dr_pair` steht an drei verschiedenen
`figure`-Umgebungen (Copy-Paste, Label nicht mitgezogen):
`skript_kreisbewegung_omega_neg.png` (1.57),
`skript_kreisbewegung_zentripetalkreuz1.png` (1.58) und
`skript_kreisbewegung_alphavecnegomegapos.png` (1.59). **Auf das Label
verweist bisher nichts** (`\ref` = 0×), das Umbenennen ist also risikofrei.

**Zu tun:** drei eigene Labels vergeben, nach den IDs, die das interaktive
Skript für dieselben drei Abbildungen führt:

| Abb. | neues Label | ID im interaktiven Skript |
|---|---|---|
| 1.57 | `fig_kreisbewegung_omegavecpos` | `fig-skript-kreisbewegung-omegavecpos` |
| 1.58 | `fig_kreisbewegung_zentripetalkreuz2` | `fig-skript-kreisbewegung-zentripetalkreuz2` |
| 1.59 | `fig_kreisbewegung_alphavecpos` | `fig-skript-kreisbewegung-alphavecpos` |

### Fertig, wenn

`grep -c 'multiply' ` über das TeX-Log **0** ergibt und die fünf Verweisstellen
oben im PDF die Nummern drucken, die in den Tabellen als „gemeint" stehen.

---

## Quellfehler, die beim Nachziehen mitzukorrigieren sind

Beide sind in `InteraktivesSkript_WIP/QUELLEN_FEHLER.md` (Abschnitt 1.1)
erfasst und im interaktiven Skript **schon korrigiert**; im `.tex` stehen sie
noch. Sie betreffen genau die Unterschriften, die in AP3 ohnehin angefasst
werden.

| Nr. | Stelle | Befund | Korrekt |
|---|---|---|---|
| 5 | Unterschriften der **vier** Wurf-Abbildungen | „Das Objekt wird aus der Höhe $h_0=\SI{20}{\meter}$ **losgelassen**" — es wird nicht losgelassen, sondern mit $v_0=\SI{10}{\meter\per\second}$ nach oben **geworfen**; dieselbe Unterschrift nennt die Anfangsgeschwindigkeit einen Satz davor (Wortlaut aus der Freier-Fall-Unterschrift übernommen, wo er richtig ist) | „**abgeworfen**" (oder „geworfen") |
| 6 | Unterschrift Abb. 1.9 (`fig:schraeger_wurf`) | „Zu sehen ist **links** die Flugbahn …, und **links** die beiden Weg-Zeit-Diagramme" — zweimal „links" | „… und **rechts** die beiden Weg-Zeit-Diagramme" |

Korrekturen an Rechtschreibung/Grammatik werden in diesem Repo in
`CORRECTIONS.md` geführt — die beiden dort mit eintragen.

---

## Leitplanken

- **Keine zusätzliche nummerierte Gleichung.** Zusätzliches kommt als `\[…\]`.
  Eine `equation` verschiebt jede folgende Nummer des Abschnitts und damit auch
  die Nummern im interaktiven Skript.
- **Bildunterschriften: nur der gedruckt sinnvolle Teil.** Regler-Hinweise,
  mitlaufende Zahlenwerte und Kurvenfarben bleiben draußen; ein erklärender
  Satz zum Koordinatensystem kommt hinein.
- **Nummern-Kopplung.** Nach jedem Arbeitspaket prüfen, dass sich Abbildungs-,
  Gleichungs- und Kastennummern des betroffenen Abschnitts nicht unbeabsichtigt
  verschoben haben. AP1 ist zufällig nummernneutral; AP7 ist es absichtlich
  **nicht**.
- **Stellen über Labels ansprechen, nicht über Zeilennummern** — die
  verschieben sich beim Arbeiten.

## Fertig ist es, wenn …

1. AP1–AP8 umgesetzt (oder als „upstream schon erledigt" bzw. „bewusst offen"
   begründet) sind,
2. das PDF fehlerfrei **und ohne die Warnung „multiply-defined labels"** baut,
3. die Abschnittsnummern in TK 3 als 3.0 / 3.1 / 3.2 erscheinen,
4. die Beispiel-/Rechenbeispiel-Zählung dem Klassifikationsbericht entspricht
   (64/28), und
5. die Rückmeldung unten geschrieben ist.

## Rückmeldung an dieses Repo

Damit P21 abgehakt werden kann, wird **je Arbeitspaket** gemeldet: umgesetzt /
war upstream schon erledigt / offen (mit Grund) — und welche Nummern sich
verschoben haben. Diese Rückmeldung wandert dann in
`backlog/P21-statisches-skript-nachziehen.md` (Sub-Tasks P21-2 und P21-3) und
in `InteraktivesSkript_WIP/QUELLEN_FEHLER.md` (Spalte „WIP" der beiden
Einträge). Anschließend `Input/v0.13` per `git pull` aktualisieren und die
Gegenprüfung mit dem Skill `v013-verifikation` laufen lassen.
