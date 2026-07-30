<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P6 — Cross-Referenzing & Verweissystem („Karte der Physik") — großes Paket

**Vision:** Das Skript wächst auf 15+ Kapitel / ~400 Seiten. Heute sind Querverweise
einzelne, einzeln verdrahtete Mechanismen: `data-ref-fig`/`data-ref-sec`/
`data-ref-eq` (numbering.js), die Abschnitts-/Abbildungs-Spruenge in der Rail und
dem TOC (shell.js/ui.js) und der QR-Druckrueckverweis (print.js) — jeweils ad hoc,
ohne gemeinsames Modell. Ziel ist ein **einheitliches, datengetriebenes Verweis-
system**, das das gesamte Skript als miteinander verknuepfte „Karte der Physik"
auffasst: jeder Begriff, jede Formel, jede Abbildung, jeder Abschnitt ist ein
**Knoten** mit Typ, Kontext (Kapitel/Section, an welcher Stelle er steht) und
gerichteten Kanten („benoetigt", „vertieft", „folgt aus", „wird gezeigt in").
Daraus speisen sich Rueckverweise („siehe auch"), kontextsensitive „Physik"-Sektion
der Aspekt-Figuren (s. P-Aspekt-Figuren), TOC/Rail-Navigation und kuenftig
Begriffs-Netz/Suche — alle aus **einer** Quelldatei pro Kapitel, O(1) pro
Kapitel/Figur.

**Warum als Paket:** Die heutigen Verweismechanismen sind dupliziert (fuenf Stellen
zaehlen Box-Klassen, drei loesen Verweise auf) und skalierten nicht ins 15+-Kapitel-
Ziel; ein gemeinsamer Knoten/Graph-Kern ersetzt sie langfristig und macht neue
Verweis-Arten (Begriffs-Suche, „Voraussetzungen", „wird verwendet in") billig.

**Bausteine (Skizze, je S–M, Gesamt L):**

1. **Knoten-Modell + Deklaration:** ein einheitliches Attribut-Schema an den
   Kapitel-Fragmenten — z. B. `data-node="…" data-type="begriff|formel|abb|abschnitt|beispiel"`
   mit optionalen `data-needs`/`data-shows`/`data-context` (Leerzeichen-getrennte
   Knoten-IDs). Pro Kapitel deklarativ im HTML, kein JS pro Verweis.
   *(M, mittleres Risiko — Beruehrung aller Kapitel-Fragmente, aber rein deklarativ.)*
2. **Graph-Kern (Modul `src/xrefs.js`):** laedt die Knoten beim Kapitel-Laden, baut
   den Verweis-Graph (Adjazenz + Kontext/Position), stellt Lookup-Api fuer Rail/
   TOC/Physik-Sektion/Suche. Ersetzt langfristig `resolve_eq_refs`/`resolveFigRefs`/
   `resolveSecRefs` (numbering.js) durch einen gemeinsamen Aufloeser.
   *(M, mittleres Risiko — Azyklizitaet zum Rest wahren wie bei numbering.js, ggf.
   window-Bruecken.)*
3. **Kontextsensitive Physik-Sektion (weiterentwickelt):** die Aspekt-Figur holt
   statt der festen `data-eqs`-Liste die Formeln, die im Graph als „fuer diesen
   Aspekt relevant" markiert sind — automatisch je nach Skriptstelle (s. aktueller
   Stand `main.js::fill_physik_panels` + `data-eqs`).
   *(S, niedrig — auf dem Knoten-Modell aufbauend.)*
4. **Rueckverweise & „Auf dieser Seite":** Rail/TOC zeigen nicht nur die aktuelle
   Seite, sondern auch „Voraussetzungen"/„wird verwendet in" — aus dem Graph, ohne
   neue Handarbeit pro Kapitel. *(M)*
5. **Begriffs-Suche / Karte:** TOC-Suche erweitert zur Knoten-Suche (Begriff →
   Definition + alle Stellen, an denen er verwendet wird); optional eine visuelle
   „Karte der Physik" (Kapitel/Knoten als geknoteter Graph). *(M–L, kuenftig.)*

**Voraussetzungen/Reihenfolge:** Knoten-Modell (1) vor Graph-Kern (2) vor
Verbraucher (3/4/5). Vorab: entscheiden, ob die Knoten-IDs stabil (per
`\label`/`data-fig`/Abschnitts-ID schon vorhanden) sind oder ein eigenes
Namensschema eingefuehrt wird — Lets: vorhandene IDs (`eq_…`, `fig-…`,
Seiten-`data-page-id`) als Knoten-IDs weiter nutzen. *(Gesamt L, hohes T-Gewinn
langfristig — Verweise werden O(1) pro Knoten statt pro Mechanismus.)*

---

