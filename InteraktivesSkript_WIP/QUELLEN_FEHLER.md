# Quellen-Fehler (v0.13)

Verzeichnis der Tipp-, Sprach- und Sachfehler, die in der Vorlage
`Input/v0.13/` (LaTeX-Quellen des „Physik_pskript_v0.13") gefunden wurden.
Dies ist eine **lebende Dokumentation** — Funde werden nachgetragen.

## Konvention bei der Migration

Die WIP-Übertragung der Kapitel aus `Input/v0.13/` ist **grundsätzlich 1:1**,
d. h. Quellenfehler werden **bewusst unverändert** mit übernommen, nicht
stillschweigend korrigiert (Nutzervorgabe: die Vorlage ist die Referenz). Eine
spätere Korrektur erfolgt nur auf ausdrückliche Freigabe, dann **in der Quelle
wie im WIP** gemeinsam, damit beide nicht auseinanderlaufen.

**Diese Regel wurde jedoch nicht überall gleich streng angewandt.** Die Spalte
**WIP** in jeder Tabelle hält daher fest, wie es tatsächlich steht:

- **erhalten** — der Quellfehler steht (absichtlich) unverändert im WIP-HTML.
- **korrigiert** — der Quellfehler wurde bei der Migration bereits (still)
  behoben; im WIP-HTML steht die richtige Form. Betrifft v. a. **Abschnitt 1.5**
  (`ch_02_dynamik_drehbewegung.html`), der als einziger vollständig migrierter
  Abschnitt bei der Übertragung durchgehend korrekturgelesen wurde, sowie einen
  xref-bedingten Sonderfall in 2.2 (s. dort).

Aufgenommen werden:
- **Typo / Rechtschreibung** (T) — falsche Buchstaben, vertauscht, vergessen.
- **Sprache / Grammatik / Ausdruck** (S) — z. B. unleserliche Anführungszeichen,
  falscher Fachbegriff, alte Rechtschreibung, Satzfehler.
- **Sachlich** (F) — inhaltlich/physikalisch falsch, falls es auffällt
  (keine systematische Fachprüfung, nur offensichtliche Funde).

## Zur Erhebungsmethode (Vollständigkeit)

Die Funde ab TK 1 wurden halbautomatisch erhoben: deutscher Rechtschreib-Check
(`nspell` + `dictionary-de`) über die per `detex` von LaTeX befreiten Quellen,
Filterung auf Editierdistanz 1–2 zu einem echten Wörterbuchwort, danach
manuelle Triage und Abgleich jeder Fundstelle gegen Quellzeile **und** WIP-HTML.

**Grenze:** Vertipper *innerhalb von Komposita* rutschen durch — steht das
korrekte Kompositum nicht im Grundwörterbuch, gibt es keinen Vorschlag und der
Fehler wird nicht gemeldet (z. B. „Volumenmassedichte", „Gleichzeitszeichen" in
Kap. 0 wurden nur durch Lesen gefunden). Die Listen sind daher **nicht garantiert
vollständig**, decken aber die einfachen Wort-Tippfehler zuverlässig ab.

---

## Kapitel 0 — Grundlagen

Quelle: `Input/v0.13/pskript_grundlagen_gmni_v2.tex`
WIP: `InteraktivesSkript_WIP/chapters/ch_00_grundlagen.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 92 | „in unserem **Bespiel** also" | „Bespiel" statt „Beispiel" | Beispiel | erhalten |
| 2 | T | 300 | `\subsubsection*{Die **Defintion** von Ampere}` | „Defintion" | Definition | erhalten |
| 3 | T | 301 | „Wir **wefrden** uns die **Defintion** des Ampere" | „wefrden" + „Defintion" (zwei Fehler in einem Satz) | werden / Definition | erhalten |
| 4 | T | 390 | Formel-Label: `\text{**Volumenmassedichte**}` | „Volumenmassedichte" („n" in „massen" fehlt) | Volumenmassendichte | erhalten |
| 5 | T | 420 | „Während die **Volumenmassedichte** eine universelle …" | wie Nr. 4, im Fließtext | Volumenmassendichte | erhalten |
| 6 | T | 625 | `\subsection*{Das **Gleichzeitszeichen** mit Ausrufezeichen}` | „Gleichzeitszeichen" („heit" → „zeit") | Gleichheitszeichen | erhalten |
| 7 | S | 633 | „… liest sich als `,,f(x) sei gleich'' b''`." | Schluss-Anführungszeichen sitzt zu früh (nach „gleich"), danach ein verwaistes `b''` — die Lesart „f(x) sei gleich b" wird zerstückelt | „f(x) sei gleich b" | erhalten |
| 8 | T | 675 | „\item **Trignonometrische** Funktionen und ihre Eigenschaften" | „Trignonometrische" (zusätzliches „n") | Trigonometrische | erhalten |

Nr. 4/5 sind dieselbe Wurzel (Formel-Label Z. 390 + Fließtext Z. 420). Nr. 7 ist
ein Satzzeichenfehler; das WIP gibt die unreine Lesart mit einzelnen
typografischen Anführungszeichen wieder (s. `ch_00_grundlagen.html`).

---

## TK 1 — Mechanik

### 1.0 Einleitung und Motivation

Quelle: `pskript_mech_einleitung_und_motivation_gmni.tex` · WIP: `ch_01_00_einleitung.html`

*Keine einfachen Wort-Tippfehler gefunden.*

### 1.1 Kinematik

Quelle: `pskript_mech_kinematik_gmni_v4.tex` · WIP: `ch_01_01_kinematik.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 214 | „Nullpunkt auf dem **Erboden**" | „d" fehlt | Erdboden | erhalten |
| 2 | T | 320 | „ein Kind auf einer **schräubenförmigen** Rutsche" | „ä" statt „au" | schraubenförmigen | erhalten |
| 3 | T | 562 | „(gepunktete Linie), die **offensichtilch** positiv ist" | Buchstabendreher | offensichtlich | erhalten |
| 4 | T | 626 | „vom … Koordinatensystems **abhänt**" | „g" fehlt | abhängt | erhalten |
| 5 | S | 222, 229, 236, 243 | Bildunterschriften der vier Wurf-Abbildungen: „Das Objekt wird aus der Höhe \(h_0=20\,\mathrm{m}\) **losgelassen**" | Das Objekt wird nicht losgelassen, sondern mit \(v_0=10\,\mathrm{m/s}\) nach oben **geworfen** — dieselbe Unterschrift nennt die Anfangsgeschwindigkeit im Satz davor. Wortlaut aus der Freier-Fall-Unterschrift übernommen (Zeile 184), wo er richtig ist. | „abgeworfen" (oder „geworfen") | **korrigiert** in den interaktiven Bildunterschriften (dort „abgeworfen"); die statischen `.nur-druck`-Unterschriften sind unverändert v0.13 |

### 1.2 Dynamik: Impuls und Kraft

Quelle: `pskript_mech_dyn_kraft_impuls_gmni_v3.tex` · WIP: `ch_01_02_dynamik_impuls_kraft.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | S | 409 | „Das **heisst**, dass das Seil …" | „ss" statt „ß" | heißt | erhalten |

### 1.3 Dynamik: Arbeit, Leistung, Energie

Quelle: `pskript_mech_dyn_energie_arbeit_gmni_v3.tex` · WIP: `ch_01_03_dynamik_arbeit_energie.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | S | 527 | „**Konservativ heisst** so viel wie …" | „ss" statt „ß" | heißt | erhalten |

### 1.4 Kinematik der Drehbewegung / Kreisbahnen

Quelle: `pskript_mech_kin_dreh_und_kreis_v1.tex` · WIP: `ch_01_kreisbewegungen.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 49 | „einsetzen und die **draus** resultierenden …" | „draus" statt „daraus" | daraus | erhalten |

### 1.5 Dynamik der Drehbewegung / Rotation

Quelle: `pskript_mech_dyn_drehung_und_rotation_v1.tex` · WIP: `ch_02_dynamik_drehbewegung.html`

**Besonderheit:** Dieser Abschnitt wurde bei der Migration korrekturgelesen —
die meisten Quellfehler sind im WIP **korrigiert** (Status „korrigiert"), nur
wenige blieben erhalten. Der einzige migrierte Abschnitt, der so von der
1:1-Konvention abweicht.

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | S | 9 | „den starren Körper **physiklaisch** beschreiben" | Buchstabendreher | physikalisch | erhalten |
| 2 | T | 9 | „und **numerieren** diese Würfel" | alte Rechtschreibung | nummerieren | erhalten |
| 3 | T/S | 22 | „die Dichte ist im **allgmeinen einen Funktoin** des Orts" | „allgmeinen" (e fehlt); „einen Funktoin" (Dreher + „einen"→„eine") | allgemeinen / eine Funktion | erhalten |
| 4 | S | 41 | „das Volumenintegral **heisst** unter anderem" | „ss" statt „ß" | heißt | erhalten |
| 5 | T | 189 | „auch ohne **detailierte** Berechnung" | ein „l" fehlt | detaillierte | erhalten |
| 6 | T | 113 | „zum Quadrat des **Abstandses**" | zusätzliches „s" | Abstandes | korrigiert |
| 7 | T | 243 | „in unserer **Vorstellunng** massenlose Achse" | Doppel-„n" | Vorstellung | korrigiert |
| 8 | T | 263 | „bei **deisem** Abstand … Die Kraft **bewerkt** …" | „deisem" (Dreher); „bewerkt" statt „bewirkt" | diesem / bewirkt | korrigiert |
| 9 | T | 266 | „Unserer **Defintion** folgend" | „i" fehlt | Definition | korrigiert |
| 10 | T | 279 | „kann ein **Volumnen** definiert werden" | „mn" statt „m" | Volumen | korrigiert |
| 11 | T | 337 | „Masse A **befidnet** sich" | Buchstabendreher | befindet | korrigiert |
| 12 | T | 403 | „die **Acshse** nicht rotieren" | Buchstabendreher | Achse | korrigiert |
| 13 | T | 570 | „**Beachsten** Sie, dass …" | zusätzliches „s" | Beachten | korrigiert |
| 14 | T | 680 | „beiden Herleitungen **nuzten** wir" | „nuzten" | nutzten | korrigiert |
| 15 | T | 731 | „nur auf die **Kompoente** der Gewichtskraft" | „n" fehlt | Komponente | korrigiert |

### 1.6 Bezugsysteme und Scheinkräfte

Quelle: `pskript_mech_bezugsysteme_und_scheinkraefte.tex` · WIP: `ch_01_06_bezugsysteme_scheinkraefte.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 104 | „Ein **weiters** Bezugsystem bewegt sich …" | „e" fehlt (Adjektiv) | weiteres | erhalten |
| 2 | T | 277–278 | Beispiel-Titel „**Druchfluss**messer auf Basis …" | Buchstabendreher | Durchflussmesser | erhalten (2×) |

### 1.7 Stöße

Quelle: `pskript_mech_dyn_stoesse.tex` · WIP: `ch_01_07_stoesse.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 31 | „da jedoch keine **äußerden** Kräfte wirken" | zusätzliches „d" | äußeren | erhalten |
| 2 | T | 36 | „zur **Verfüggung** stehenden Mittel" | Doppel-„g" | Verfügung | erhalten |
| 3 | T | 101 | „mit … Geschwindigkeit frontal **aufeinadner**" | Dreher „dn"→„nd" | aufeinander | erhalten |

### 1.8 Gravitation

Quelle: `pskript_mech_gravitation_v1.tex` · WIP: `ch_01_08_gravitation.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 140 | „**Draus** ergibt sich …" | „a" fehlt | Daraus | erhalten |

---

## TK 2 — Elektromagnetismus

### 2.0 Einleitung und Motivation

Quelle: `pskript_em_einleitung_und_motivation.tex` · WIP: `ch_03_00_einleitung.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 1 | „in Fahr- und Flugzeugen, in **Robotoren**" | „Robotoren" statt „Robotern" | Robotern | erhalten |
| 2 | T | 1 | „der Elektrostatik, der **Elekrodynamik**" | „t" fehlt | Elektrodynamik | erhalten |
| 3 | S | 1 | „von großer **Bedeuten**" | falsche Endung | Bedeutung | erhalten |

### 2.1 Grundlagen der Elektrizitätslehre

Quelle: `pskript_em_grundlagen_der_elektrizitaetslehre.tex` · WIP: `ch_03_01_grundlagen_elektrizitaetslehre.html`

*Keine einfachen Wort-Tippfehler gefunden (Komposita-interne Fehler nicht ausgeschlossen, s. Methodenhinweis).*

### 2.2 Elektrostatik

Quelle: `pskript_em_elektrostatik.tex` · WIP: `ch_03_02_elektrostatik.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 6 | „also eine **insgesammt** große Ladungsmenge" | Doppel-„m" | insgesamt | erhalten |
| 2 | T | 66 | „Objekte wir zum **Bespiel** Blätter" | „i" fehlt | Beispiel | erhalten |
| 3 | T | 186 | Beispiel-Titel „**Überlagung** von Feldern" | „er" fehlt | Überlagerung | erhalten |
| 4 | S | 345 | „**Vektorell** gilt:" | falsche Endung | Vektoriell | erhalten |
| 5 | T | 445 | „Ladung bei der **Bewegun** von A nach B" | „g" fehlt | Bewegung | erhalten |
| 6 | T | 487 | „$\pm\sigma$ im **Berag** gleich" | Dreher | Betrag | erhalten |
| 7 | S | 523 | „… befindet, **heisst** \point{Kondensator}" | „ss" statt „ß" | heißt | erhalten |
| 8 | S | 562 | „anderererseits: **wieviel** Potentialdifferenz" | Getrenntschreibung | wie viel | erhalten |
| 9 | T | 6 | „hatten wir schon in **Abschnit** \ref{…}" | „t" fehlt — im WIP wurde das getippte Wort durch den `data-ref-sec`-Querverweis ersetzt (rendert „Abschnitt N"), der Fehler existiert dort nicht mehr | Abschnitt | korrigiert (via xref) |

Anmerkung zu Nr. 8: „anderererseits" (Z. 562) trägt zusätzlich ein zu viel
gesetztes „er" — steht so im Fließtext wie im WIP (erhalten).

### 2.3 Elektrodynamik und Magnetismus

Quelle: `pskript_em_elektrodynamik_und_magnetismus.tex` · WIP: `ch_03_03_elektrodynamik_magnetismus.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 4 | „der Platten des **Kondesators**, so **herscht** zwischen …" | „Kondesators" (n fehlt); „herscht" (r fehlt) | Kondensators / herrscht | erhalten |
| 2 | T | 20 | „da man heute **weiss**, dass …" | „ss" statt „ß" | weiß | erhalten |
| 3 | T | 68 | „… installation **beützt** wird" | „n" fehlt | benützt | erhalten |
| 4 | T | 86 | „auf den ersten Blick der **Intiution**" | Buchstabendreher | Intuition | erhalten |
| 5 | T | 20 / 32 / 412 | „**Defintion**" | „i" fehlt | Definition | erhalten (3×) |
| 6 | T | 429 | „**Wäherend** die Kraft immer …" | zusätzliches „e" | Während | erhalten |
| 7 | T | 432 | „im Raum ab, der **betrachet** wird" | „t" fehlt | betrachtet | erhalten |
| 8 | T | 465 | „Die **magentische Indukltion** ist zylindersymmetrisch" | „magentische" (Dreher); „Indukltion" (zusätzliches „l") | magnetische / Induktion | erhalten |
| 9 | T | 515 | „das Sie vielleicht schon **kennnen**" | Dreifach-„n" | kennen | erhalten |
| 10 | T | 778 | „ein **einzeles** Atom" | „n" fehlt | einzelnes | erhalten |

Ausgeschlossen als Nicht-Fehler: „**Weiss**'sche Bezirke" (Z. 783/838) —
Eigenname des Physikers Pierre Weiss, korrekt.

---

## TK 3 — Schwingungen und Wellen

### 3.0 Einleitung und Motivation

Quelle: `pskript_sw_einleitung_und_motivation.tex` · WIP: `ch_04_00_einleitung.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 1 | „dass das **Feder Masse**-Pendel eine periodische Bewegung ausführt" | Bindestrich fehlt | Feder-Masse-Pendel | erhalten |
| 2 | T | 1 | „im freien Fall die Masse **die Masse** von einer …" | Wortdopplung | (einmal „die Masse") | erhalten |
| 3 | T | 1 | „von einer **Strart**höhe bis zum Boden fällt" | Buchstabendreher | Starthöhe | erhalten |
| 4 | S | 3 | „ist jedoch nur **ein einzige** Beispiel" | falsche Flexion | ein einziges | erhalten |
| 5 | T | 9 | „bei der **c**harakterisierung von Materialien" | Kleinschreibung (Substantiv) | Charakterisierung | erhalten |

---

### 3.1 Schwingungen

Quelle: `pskript_sw_schwingungen.tex` · WIP: `ch_04_01_schwingungen.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 258 | „Gilt oben **dargesellte** Proportionalität" | Buchstabendreher (t fehlt) | dargestellte | erhalten |
| 2 | T | 264 | „unter **Anwednung** des zweiten Newtonschen Gesetzes" | n fehlt | Anwendung | erhalten |
| 3 | T | 370 | „müssen wir uns **zunäcsht** klar machen" | Buchstabendreher (cs statt n) | zunächst | erhalten |
| 4 | T | 537 | „Die Auslenkung des **Fadenpedels** aus seiner Ruhelage" | n fehlt | Fadenpendels | erhalten |
| 5 | S | 526 | „Es handelt sich also, das sieht man an den Eigenschaften …, um eine Rückstellkraft" | Satzbau (Einschub bricht „es handelt sich um") | (umformulieren) | erhalten |
| 6 | S | 526 | „Es handelt sich also **bei Schwingung** des Fadenpendels" | „der" fehlt | bei der Schwingung | erhalten |
| 7 | F | 412 | „(siehe Abbildung \ref{fig:feder_masse_schwingung_horizontal})" | Referenz auf **nicht existente** Abbildung (es gibt nur das vertikale Feder-Masse-Pendel, Abb. 3.3); im PDF „Abbildung ??" | (Klammusdruck weglassen) | korrigiert — Klammusdruck „(siehe Abbildung …)" weggelassen, Sachtext unverändert; in ch_04_01-Kopf dokumentiert |
| 8 | T | 334 | „die Funktion \ref{eq:allg_loesung_harmonische_schwingung2}" | Label-Tippfehler (Unterstrich vor der 2 fehlt) → undefiniertes Label | eq:allg_loesung_harmonische_schwingung_2 | korrigiert — data-ref-eq zeigt auf die offensichtlich gemeinte Kosinus-Form (Z. 359 verwendet sie korrekt); in ch_04_01-Kopf dokumentiert |
| 9 | S | 589 | „(Gleichung \ref{…_2}) und Gleichung \ref{…})" | Klammerfehler (unebenmäßige Klammern) | (Kommasetzung) | korrigiert — xref-bedingt zu „, (3.1.16) und (3.1.15)," umgeformt (Deskriptor-Verdopplung vermieden) |

---

### 3.2 Wellen

Quelle: `pskript_sw_wellen.tex` · WIP: `ch_04_02_wellen.html`

Die v0.13-Quelle enthält **keinen Inhalt** zu „Wellen" — die Datei besteht nur
aus dem Vermerk, dass das Kapitel im WS 2025/26 nicht behandelt wurde. Der
Abschnitt wurde als **Platzhalter-Stub** (h2 + Quellnotiz) migriert.

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt | WIP |
|---|-----|----------------|--------|--------|---------|-----|
| 1 | T | 1 | „wird dieser **Abschitt** zunächst ausgelassen" | n fehlt | Abschnitt | erhalten |

---

## Noch nicht migriert

- **Kapitel „Dynamik der Drehbewegung" (ch_02-Gerüst `ch_02_kinematik_starrer_koerper.html`)** — Altgerüst, nicht Teil der aktiven Migration.

*(Funde bei der jeweiligen Migration hier nachtragen.)*
