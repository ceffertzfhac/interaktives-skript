<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P22 — Ladezeit: Bilder und MathJax beim Seitenstart

Eingetragen 2026-08-29 nach Nutzermeldung (*„check mal bitte die version, die auf
github liegt, mir werden ladeprobleme angezeigt"*). Gemessen an der
veröffentlichten Fassung <https://ceffertzfhac.github.io/interaktives-skript/>
(Stand `main` = v1.34.1), headless Chromium, **ungedrosselt** auf schneller
Leitung:

| Messgröße | Wert |
|---|---|
| Übertragene Daten | **38,9 MB** in 205 Anfragen |
| Prosa sichtbar | 1,6 s |
| **Formeln gesetzt** | **13,1 s** (4768 `mjx-container`) |
| Figuren gebaut | 13,5 s |
| Konsolenfehler / fehlgeschlagene Anfragen | keine |

Die Seite ist also **nicht kaputt** — sie ist zu schwer. Auf einer 16-Mbit/s-
Leitung dauert allein der Download rund 20 s, auf 1,6 Mbit/s über drei Minuten;
dazu kommen die 13 s MathJax, die den Hauptthread beschäftigen (Browser zeigen
in dieser Zeit gern „Seite reagiert nicht").

### Drei unabhängige Ursachen

1. **Alle 127 Bilder werden beim Start geladen**, obwohl immer nur *eine*
   Kapitelseite sichtbar ist. `pages.js` versteckt die übrigen mit
   `display:none` — das verhindert das Laden nicht. **Kein einziges `<img>`
   trägt `loading="lazy"`** (geprüft über alle Fragmente).
2. **Die Bilder sind 5- bis 20-fach zu groß** für ihre Anzeigebreite, Fotos
   liegen teils als PNG vor:

   | Datei | Pixel | Größe | angezeigt mit | Faktor |
   |---|---|---|---|---|
   | `STScI-…-inset-hw.png` (Weltraumteleskop) | 3840×2160 | **11 MB** | `width:100%` (~700 px) | ~5× |
   | `kinematik_geschwindigkeit_tachometer.jpg` | 3648×2736 | **4,6 MB** | `width:60%` (~420 px) | ~9× |
   | `skript_schlitten_schiefe_ebene.png` | 5494×4176 | 2,0 MB | `width:40%` (~280 px) | ~20× |
   | `rutsche.png` | 902×1354 | 1,9 MB | `width:40%` | Format (Foto als PNG) |

   `bilder/` gesamt: **38 MB, 127 Dateien, davon 12 über 500 kB.**
3. **MathJax setzt beim Start das gesamte Skript** (4768 Formeln über 137
   Seiten), obwohl nur eine Seite sichtbar ist. Das sind die 13 s.

### Maßnahmen (nach Aufwand/Wirkung gestaffelt)

- [x] **P22-1 `loading="lazy"` für alle Kapitelbilder** *(S)* — **erledigt
  2026-08-29 (v1.38.1)**: zentral in `chapters.js` beim Injizieren gesetzt
  (`loading="lazy"` + `decoding="async"`), `print.js` schaltet den Druck-Klon
  zurück auf `eager`. Gemessen: Bildanfragen beim Start von 127 auf **8**,
  Bilddaten von ~38 MB auf **70 kB**. *(ursprüngliche Beschreibung:)*
  zentral in JS setzen (nicht in 127 `<img>`-Tags), damit es für künftige Kapitel
  automatisch gilt: nach `loadChapters()`/`paginate()` einmal über
  `#paper img.grafik` laufen. Die Bilder der aktiven Seite lädt der Browser
  weiterhin sofort (sie stehen im Viewport), der Rest erst beim Blättern.
  Erwartete Wirkung: Startlast von ~39 MB auf die Bilder der ersten Seite.
  Prüfen: Übertragungsvolumen erneut messen, Blättern auf Bildseiten sichten
  (kurzes Nachladen ist hinzunehmen; ggf. die Nachbarseite vorwärmen).
- [x] **P22-2 Bilder auf Anzeigegröße bringen** *(M)* — **erledigt 2026-08-29**:
  71 der 123 Bilder auf die doppelte Anzeigebreite verkleinert (aus dem
  `style="width:NN%"` des jeweiligen `<img>` × 800 px Lesespalte, gedeckelt auf
  500…1600 px). Drei Dateien wurden zusätzlich umkodiert, weil PNG dort ein
  Vielfaches kostete: das Weltraumfoto (11,1 MB → JPEG), `rutsche` (1,9 MB →
  JPEG) und `skript_Bfeldkreisspule` (1,1 MB → 102 kB JPEG; sein Alphakanal war
  durchgehend deckend). Referenzen mitgezogen, kein `<img>` zeigt ins Leere,
  alle Dateien vollständig dekodierbar. **`bilder/` 37,5 MB → 10,9 MB.**
  *(ursprüngliche Beschreibung:)* Zielbreite
  = doppelte Anzeigebreite (Retina), also meist 600–1400 px; Fotos als JPEG/WebP
  statt PNG. Die vier Ausreißer oben zuerst. **Achtung:** dieselben Dateien
  gehen in den Druck (`print.js` klont `#container`) — 1400 px reichen für die
  700-px-Druckspalte auch dort. Quelle der Originale ist `Input/v0.13/
  PSkriptBilder` (bleibt unangetastet), verkleinert wird nur die Kopie in
  `InteraktivesSkript_WIP/bilder/`.
- [x] **P22-3a MathJax nicht selbst beim Laden setzen lassen** *(S)* —
  **erledigt 2026-08-31 (v1.38.3)**: `index.html` bekommt
  `startup: { typeset: false }`. Gemessen wurde, was vorher niemand vermutet
  hatte: MathJax setzte beim Start das gesamte Dokument von sich aus (ein
  voller Durchgang), dessen Ergebnis `typesetAfterLoad()` unmittelbar danach
  per `document.state(0)` wieder verwarf — die 12 s waren also **drei** volle
  Durchgänge, nicht einer. Formeln gesetzt nach **19,6 s → 14,1 s**.
- [x] **P22-3b Gleichungsnummern aus der Quelle statt aus dem gesetzten DOM**
  *(M)* — **erledigt 2026-08-31 (v1.39.0)**: `numbering.js::
  renumber_equations()` läuft jetzt **vor** dem Typeset (aus
  `init_numbering()`) und zählt die nummerierten Zeilen aus der LaTeX-Quelle,
  die solange im DOM-Text steht. Damit entfällt der zweite volle Durchgang,
  der bis v1.38.2 nur zum Zählen lief. Formeln gesetzt nach **14,1 s →
  8,2 s**. Der Zähler versteht genau so viel LaTeX, wie über die Zahl der
  Nummern entscheidet (equation/align nummeriert, Sternvarianten und `\[…\]`
  nicht, `\nonumber`/`\notag` unterdrückt die Zeile, `\\` in geschachtelten
  Umgebungen trennt nicht) — **eine weitere nummerierte Umgebung (z. B.
  `gather`) muss dort ergänzt werden**, sonst verschiebt sich ab dieser Stelle
  jede Nummer des Abschnitts. Gegengeprüft gegen die DOM-Wahrheit: 947 von 947
  nummerierten Zeilen auf allen 137 Seiten identisch, alle 91 `\label`-Verweise
  identisch, 101 Formelverweise aufgelöst, keine Konsolenfehler.

  **Nebenbefund: ein Fehler im Ausdruck ist damit mit behoben.** Der Vergleich
  des Druckpfads (`?print=true`) vor und nach der Änderung zeigt im Druckklon
  je 947 Nummern, aber mit Abschnittspräfix vorher nur **759**, nachher **856**
  (= Sollwert: 947 minus die 91 Gleichungen mit `\label`, deren Element-Id
  MathJax aus dem Label statt aus dem Tag bildet). Im alten Stand trugen also
  **97 Formeln im Ausdruck eine blanke laufende Nummer** — die letzten lauteten
  `944, 945, 946, 947` statt `3.1.64 … 3.1.67`. Ursache: `print.js::print_page()`
  klont `#container` nach `#print_container`, **bevor** MathJax gelaufen ist,
  und versteckt das Original; der alte `renumber_equations()`-Lauf zählte dann
  `mlabeledtr` in den Seiten des versteckten `#container` und fand dort nur 843
  — die Zuordnung endete bei 843, alles darüber fiel im Klon auf die laufende
  Nummer zurück. Der Quell-Zähler ist von der Sichtbarkeit unabhängig und
  liefert im Druck-Tab dieselben 947 wie am Bildschirm.

  **Zweiter, schwererer Druckfehler — gefunden bei der Freigabe-Prüfung
  2026-08-31, behoben in v1.39.1 (Nutzermeldung: *„die nummerierung fängt
  z. B. beim Abschnitt zur Lorentzkraft wieder bei 0.0.1 an"*).** Betroffen war
  der **Teildruck** über „Was drucken?" (`scope=abschnitt|kapitel|komplex`),
  nicht der volle Ausdruck. Reproduktion:
  `?print=true&scope=abschnitt&page=p-2-3-2` → die 22 Formeln der Seite trugen
  `0.1.1 … 0.2.10` statt `2.3.14 … 2.3.35`, und die 9 Formelverweise darin
  `(0.1.9) …` statt `(2.3.22) …`. **Bestand in `dd480dd` genauso** — also kein
  Zugang von P22-3, sondern ein Altfehler, der erst beim gezielten Prüfen des
  Druckpfads auffiel. Ursache: `tagformat.number()` bekommt nur einen laufenden
  Zähler ohne Kontext, und die Zuordnung war auf die Reihenfolge des
  Seitenregisters gebaut; im Druck-Tab steht aber der Klon in
  `#print_container` **vor** `#container`, und `applyPrintScope()` entfernt
  daraus Seiten — der Zähler begann stur bei 1 und traf den Anfang des Skripts.
  Behebung: `renumber_equations()` ermittelt erst die *autoritativen* Nummern je
  Seite aus dem Register und legt sie dann in Dokumentreihenfolge über alle
  vorhandenen `.chapter-page`; `print_page()` ruft es nach dem Klonen erneut
  auf. Die daraus folgende Regel steht in `src/CLAUDE.md`.

  **Lehre für künftige Druckprüfungen:** `?print=true` allein deckt den
  Druckpfad nicht ab — die drei Scope-Varianten sind eigene Fälle und müssen
  einzeln geprüft werden.
- [ ] **P22-3c MathJax seitenweise setzen** *(L, Wirkung mittel, Risiko mittel)*
  — beim Start nur die aktive Seite typesetten, den Rest beim Seitenwechsel
  (`pagechange`-Event gibt es schon) bzw. in Leerlauf-Häppchen. Der in der
  ursprünglichen Fassung genannte Fallstrick ist mit P22-3b **weg**: die
  Nummerierung kommt nicht mehr aus dem gesetzten DOM, sondern vorab aus dem
  Quelltext, gilt also unabhängig davon, welche Seiten schon gesetzt sind.
  Offen bleiben zwei Punkte: `resolve_eq_refs()` liest die Formelnummern aus
  MathJax' `allLabels` — ein Verweis auf eine noch nicht gesetzte Seite fände
  sein Ziel nicht (Abhilfe: die Labels beim Quell-Zählen gleich mitnehmen,
  `eq_rows_of_source` liefert sie ohnehin) — und der Druckpfad
  (`print.js` klont `#container`) braucht vorher ein erzwungenes
  „alles fertig setzen". Erst angehen, wenn die 8,2 s noch stören; die
  Größenordnung ist ein Achtel des ursprünglichen Aufwands. Gehört
  fachlich zu P1 (Architektur).
- [x] **P22-4 Gegenmessung an der veröffentlichten Fassung** *(S)* — **erledigt
  2026-08-29**, nach Merge nach `main` und erfolgreichem Pages-Build (v1.38.2),
  zwei saubere Läufe:

  | Messgröße | vorher (v1.34.1) | nachher (v1.38.2) |
  |---|---|---|
  | Übertragene Daten | 38,9 MB | **1,5–1,8 MB** |
  | Anfragen | 205 | 121–123 |
  | Prosa sichtbar | 1,6 s | 1,7–3,0 s |
  | Formeln gesetzt | 13,1 s | 11,9–12,7 s (unverändert → P22-3) |

  Größter Einzelposten ist jetzt MathJax selbst (`tex-svg.js`, 617 kB), das
  größte Bild 191 kB. Ein dritter Lauf zeigte 36 s für die Formeln — Ausreißer
  durch Last auf dem Messrechner, die beiden sauberen Läufe liegen bei 12 s.
  *(ursprünglich:)* nach jeder Stufe dieselbe Messung wiederholen
  (Skript im Scratchpad: `live_perf.mjs`; misst Übertragungsvolumen, Zeit bis
  Prosa/Formeln/Figuren) und die Tabelle oben fortschreiben.

- [ ] **P22-5 Gegenmessung von P22-3a/b an der veröffentlichten Fassung** *(S)*
  — dieselbe Messung wie P22-4, sobald v1.39.0 nach `main` gemerged und der
  Pages-Build durch ist. Lokal (headless Chromium, `python3 -m http.server`)
  gemessen: **Formeln gesetzt 19,6 s → 8,2 s**, Prosa sichtbar 18,0 s → 6,6 s;
  die absoluten Werte liegen lokal höher als live, weil der Messrechner
  langsamer ist — der Vergleich zählt, nicht der Absolutwert. Erwartung live:
  ~12 s → ~5 s.

**Nebenbefund (2026-08-29):** 29 Dateien in `bilder/` sind von keinem Kapitel
referenziert. Nicht gelöscht — erst prüfen, ob sie zu noch nicht migrierten
Abschnitten gehören. Eigener kleiner Punkt, wenn P12 dort ankommt.

### Zusammenhang mit anderen Items

- **P12** nennt eine „Asset-Pipeline" als offenen Punkt — P22-2 ist ihr
  konkreter, dringender Anteil.
- **P5** führt den MathJax-Ladewettlauf (sporadisch fehlende Formeln). P22-3
  fasst dieselbe Stelle an; beide zusammen entwerfen, sonst behebt man das eine
  und verschärft das andere.
- Die Messung betrifft **nicht** die interaktiven Figuren: sie sind nach 13,5 s
  gebaut, also unmittelbar nach dem MathJax-Lauf, und verursachen keine
  nennenswerte Last.

---
