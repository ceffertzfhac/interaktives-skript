# Quellen-Fehler (v0.13)

Verzeichnis der Tipp-, Sprach- und Sachfehler, die in der Vorlage
`Input/v0.13/` (LaTeX-Quellen des „Physik_pskript_v0.13") gefunden wurden.
Dies ist eine **lebende Dokumentation** — Funde werden nachgetragen.

## Konvention bei der Migration

Die WIP-Übertragung der Kapitel aus `Input/v0.13/` ist **1:1**, d. h. Quellen-
fehler werden **bewusst unverändert** mit übernommen, nicht stillschweigend
korrigiert (Nutzervorgabe: die Vorlage ist die Referenz). Jeder hier gelistete
Fehler ist also im WIP-HTML **absichtlich erhalten** und gegen diese Datei
dokumentiert. Eine spätere Korrektur erfolgt nur auf ausdrückliche Freigabe,
dann **in der Quelle wie im WIP** gemeinsam, damit beide nicht auseinanderlaufen.

Aufgenommen werden:
- **Typo / Rechtschreibung** (T) — falsche Buchstaben, vertauscht, vergessen.
- **Sprache / Grammatik / Ausdruck** (S) — z. B. unleserliche Anführungszeichen,
  falscher Fachbegriff, Satzfehler.
- **Sachlich** (F) — inhaltlich/physikalisch falsch, falls es auffällt
  (keine systematische Fachprüfung, nur offensichtliche Funde).

---

## Kapitel 0 — Grundlagen

Quelle: `Input/v0.13/pskript_grundlagen_gmni_v2.tex`
WIP: `InteraktivesSkript_WIP/chapters/ch_00_grundlagen.html`

| # | Art | Quelle (Zeile) | Stelle | Befund | Korrekt |
|---|-----|----------------|--------|--------|---------|
| 1 | T | 92 | „in unserem **Bespiel** also" | „Bespiel" statt „Beispiel" | Beispiel |
| 2 | T | 300 | `\subsubsection*{Die **Defintion** von Ampere}` | „Defintion" | Definition |
| 3 | T | 301 | „Wir **wefrden** uns die **Defintion** des Ampere" | „wefrden" + „Defintion" (zwei Fehler in einem Satz) | werden / Definition |
| 4 | T | 390 | Formel-Label: `\text{**Volumenmassedichte**}` | „Volumenmassedichte" („n" in „massen" fehlt) | Volumenmassendichte |
| 5 | T | 420 | „Während die **Volumenmassedichte** eine universelle …" | wie Nr. 4, im Fließtext | Volumenmassendichte |
| 6 | T | 625 | `\subsection*{Das **Gleichzeitszeichen** mit Ausrufezeichen}` | „Gleichzeitszeichen" („heit" → „zeit") | Gleichheitszeichen |
| 7 | S | 633 | „… liest sich als `,,f(x) sei gleich'' b''`." | Schluss-Anführungszeichen sitzt zu früh (nach „gleich"), danach ein verwaistes `b''` — die Lesart „f(x) sei gleich b" wird zerstückelt | „f(x) sei gleich b" |
| 8 | T | 675 | „\item **Trignonometrische** Funktionen und ihre Eigenschaften" | „Trignonometrische" (zusätzliches „n") | Trigonometrische |

### Anmerkungen

- Nr. 4 und 5 sind dieselbe Wurzel: der Begriff „Volumenmassendichte" taucht
  in der Quelle wie im WIP konsequent mit dem fehlenden „n" auf. Eine Korrektur
  müsste beide Stellen (Formel-Label Z. 390 und Fließtext Z. 420) erfassen.
- Nr. 7 ist ein Satzzeichen- und kein Buchstabenfehler; die WIP-Übertragung
  gibt die Lesart als „f(x) sei gleich" b" wieder (mit einzelnen
  typografischen Anführungszeichen, s. `ch_00_grundlagen.html` an der
  entsprechenden Stelle), da das Originalzitat selbst unrein ist.

---

## Kapitel 1 — Mechanik (Abschnitt 1.4)

Quelle: `Input/v0.13/pskript_mech_kin_dreh_und_kreis_v1.tex`
WIP: `InteraktivesSkript_WIP/chapters/ch_01_kreisbewegungen.html`

*(bisher keine Quellen-Fehler notiert)*

---

## Kapitel 2 — Dynamik der Drehbewegung

Quelle: — *(noch nicht migriert)*
WIP: `InteraktivesSkript_WIP/chapters/ch_02_kinematik_starrer_koerper.html` (Gerüst)

*(bisher keine Quellen-Fehler notiert)*

---

## Weitere Kapitel (3 Schwingungen, 4 … Elektro, …)

*(noch nicht migriert — Funde bei der jeweiligen Migration hier nachtragen)*