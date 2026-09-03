<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P25 — Restpunkte der Design-Angleichung an das physik-design-system

Eingetragen 2026-09-03 nach der Angleichung (v1.45.0 – v1.48.0). Die sieben
Bausteine des Auftrags sind umgesetzt; was hier steht, sind die Punkte, die
dabei aufgefallen sind und bewusst **nicht** mitentschieden wurden — teils weil
sie eine Autorentscheidung brauchen, teils weil sie ein anderes Artefakt
betreffen.

Soll-Zustand und Begründungen stehen im Design-System-Repo:
`…/Physik Home/physik-design-system/KONVERGENZ_ENTSCHEIDUNGEN.md`
(Buchstaben-Kürzel unten beziehen sich darauf), Ist-Zustand in
`DESIGN_SYSTEM.md § 4`.

---

### P25-1 — `motivation` teilt sich den Stern mit `wichtig` *(S, Entscheidung nötig)*

**Befund.** `BOX_ICONS` ordnet `motivation` und `wichtig` beiden `star.svg` zu.
Nach E1-Regel 1 gehört ein Piktogramm einem Kastentyp **exklusiv**, sobald der
Typ in mindestens zwei Artefakten vorkommt — „Wichtig" kommt in Skript und
Interaktivem Skript vor und besitzt den Stern damit allein. „Motivation" gibt
es nur hier und ist ein Singleton, dürfte sich also nach E1-Regel 2 ein
Zeichen mit Singletons **anderer** Artefakte teilen — aber nicht mit einem
Nicht-Singleton im selben Dokument.

**Warum es heute nicht weh tut.** `motivation` hat in allen 17 Kapiteln
**null** Aufrufe. Die Kollision ist latent.

**Warum es trotzdem hier steht.** Sie wird in dem Moment sichtbar, in dem der
Typ zum ersten Mal benutzt wird — dann stehen zwei verschiedene Kastentypen mit
demselben Zeichen auf derselben Seite. Zu entscheiden **bevor** das passiert.

**Nicht selbst entschieden**, weil die Kandidaten alle eine Bedeutung mitbringen:
`bulb.svg` liegt ungenutzt hier (nach E1 aber „Hinweis/Ansatz"), `pen.svg` ist
seit v1.47.1 frei, soll aber laut Absprache frei **bleiben**, bis die
Praktikumsanleitung nachgezogen hat. Eine Neuzeichnung wäre die sechste
Zeichenaufgabe des Design-Systems.

---

### P25-2 — Vier Kastentypen ohne Aufruf *(S, bewusst offen)*

`lernziel`, `motivation`, `wiederholung` und `anmerkung` haben null Aufrufe.
**Autorentscheidung 2026-09-03: alle vier bleiben** — dieselbe Begründung, mit
der `\bueb` und `\hinweis` im Druckskript definiert und unbenutzt bleiben (D4).

Kein Handlungsbedarf, aber zwei Dinge sind zu wissen:

- `lernziel` wird im Druckskript nach D4 **wiederbelebt** (13 Kästen, an die
  Zusammenfassung gekoppelt). Wenn das hierher transkribiert wird, ist der Typ
  gestalterisch schon fertig (Mint, Zielscheibe, 6,1 % Fläche).
- `anmerkung` ist kein toter Name wie die beiden anderen: für sie existiert
  gebaute Infrastruktur — sie ist der einzige Typ, den `shell.js` in die
  Marginalienspalte verschiebt und `print.js` vor dem Drucken zurückholt.

---

### P25-3 — Kein Ersatz für `\point` / `\mar` *(M, bewusst zurückgestellt)*

F3 macht den Dreiklang aus fettem Begriff, serifenloser Marginalie und
Indexeintrag zum sechsten geteilten Baustein — im Druckskript mit 168
Vorkommen die häufigste Hervorhebung überhaupt. Eine Web-Entsprechung ist
beschlossen, aber ausdrücklich **später** zu bauen; sie war kein Teil dieses
Laufs.

Der Anknüpfungspunkt ist bekannt: `shell.js::landmarksFor` baut die Schiene
„Auf dieser Seite" heute aus Kästen und Abbildungen — Schlüsselbegriffe wären
dort eine dritte Landmarkenart. Der Indexeintrag, den `\point` im Druck
nebenbei erzeugt, bekäme erst mit einem Begriffsregister eine Entsprechung.

---

### P25-4 — Die Icon-Größe ist 2,375 em, kanonisch sind 1,3 em *(S, dokumentiert)*

E2 setzt 1,3 em als kanonische Piktogrammgröße, mit **einer** begründeten
Ausnahme: die Praktikumsanleitung nutzt 2,4 em, weil die Zeichen dort Wegweiser
sind und keine Lesezeichen im Fließtext.

Gemessen liegt dieses Repo mit 38 px bei 16 px Grundschrift faktisch **auf
dieser Ausnahme** (2,375 em) — und aus demselben Grund: die Icons sitzen in
einer eigenen 50-px-Randspalte außerhalb der Box, nicht inline vor dem
Titeltext. Die Randspalte ist als Divergenz dokumentiert, die Größe war es
bisher nicht.

**Kein Handlungsbedarf am Code**, aber die Divergenz gehört benannt statt still
zu bestehen — geschehen in `DESIGN_SYSTEM.md § 4`. Zu prüfen wäre allenfalls,
ob die Größe mit den fünf Textgrößenstufen mitwachsen soll; heute ist sie
absolut (38 px) und damit bei großer Schrift relativ kleiner.

---

### P25-5 — Der Schatten war nie eine Divergenz *(S, erledigt, hier nur vermerkt)*

Mehrere Dokumente führten das Interaktive Skript als schattenlos und begründeten
das medienbedingt. Gemessen tragen alle Kästen
`box-shadow: 0 2px 8px rgba(24,27,33,.03)`, im Druckpfad abgeschaltet. Bei 3 %
Deckkraft ist er sehr leise, aber vorhanden.

In `DESIGN_SYSTEM.md § 4` richtiggestellt. Wer das Skript oder die
Praktikumsanleitung angleicht, sollte wissen, dass es hier keinen bewussten
Verzicht gibt, an dem man sich orientieren könnte.
