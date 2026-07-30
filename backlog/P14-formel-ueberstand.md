<!-- Teil von ../BACKLOG.md (Index). Nicht umbenennen: der Index verlinkt diesen Pfad. -->
## P14 — Formel-Überstand je Width-Modus prüfen & beheben (schmal/normal/breit)

Eingetragen 2026-07-24 nach Nutzervorgabe (Feature-Wunsch, **nur aufgenommen,
noch nicht umgesetzt**). Das Dokument soll in **allen Width-Modi**
(schmal/normal/breit, s. `core.js::set_width_mode`) nach **Kandidaten-
Formeln** durchsucht werden, die über den Rand des **Schreibbereichs**
(`#paper` / `#content`) **herausragen** — **insbesondere, wenn die
Gleichungsnummerierung (Tag) übersteht, aber nicht ausschließlich** (also
auch Formelkörper selbst, lange `\frac`/Brüche, `\underbrace`-Texte etc.).
Die Darstellung dieser Formeln muss **modussensitiv überarbeitet** werden,
damit **kein Herausragen** mehr auftritt.

**Anforderungen (Nutzervorgabe):**
- **Automatische Suche** nach Kandidaten-Formeln im ganzen Dokument
  (alle Kapitel, nicht nur 1.4/1.5).
- **Alle drei Width-Modi** prüfen: schmal (schmalste Spalte → höchste
  Überstands-Wahrscheinlichkeit), normal, breit.
- **Kriterien:** (a) Tag/Nummerierung ragt über den Schreibbereich-Rand,
  (b) Formelkörper selbst ragt über (auch ohne Tag-Problem), (c) ggf.
  weitere (z. B. inline-Formel in zu schmaler Zeile).
- **Modussensitive Behebung:** pro problematischer Formel eine Lösung,
  die im jeweiligen Modus greift — keine globale Verbredung, die im breit-
  Modus dann zu viel Luft lässt.

**Offene Klärungsfragen (vor Umsetzung mit Nutzer klären — nicht jetzt):**
1. **Schreibbereich-Rand = was genau?** `#content` inline-width (set per
   `set_width_mode`) oder `#paper` (`--paper-max-width`)? Tag-Ragt-über
   bezieht sich vermutlich auf die sichtbare Textspalte (`#content` width
   abzüglich Padding). Klären, welchen Kasten messen.
2. **Behebungs-Strategien (welche bevorzugt der Nutzer?):**
   - Tag umbrechen/zweizeilig? (MathJax macht Tags normalerweise rechts;
     bei Überstand ggf. Tag nach unten oder `tagstyle` ändern).
   - Formel verkleinern (`\small`/`\scriptstyle` per MathJax-CSS im Modus)?
   - Formel umbrechen (`\\` in align, oder automatischer Zeilenumbruch)?
   - horizontal scrollbar im Container (unschön, eher nicht)?
   - Schreibbereich im Modus minimal verbreitern (verändert aber die
     Mode-Semantik — eher nicht)?
   Pro Formel wahrscheinlich Einzelfall-Entscheidung; ist eine globale
   Heuristik gewünscht (z. B. „über 95 % Spaltenbreite → automatisch
   `\small`") oder manuelle Einzelfall-Korrektur pro Formel?
3. **Kandidaten-Suche — automatisiert?** Ein Skript (z. B. im Screenshot/
   DOM-Harness, headless Chromium pro Width-Modus) misst jede
   `mjx-container[display="true"]`-`getBoundingClientRect().right` gegen
   `#content.getBoundingClientRect().right` und listet Übersteher. Soll
   dieses Werkzeug dauerhaft ins Repo (Verifikations-Skill) oder nur
   einmalig zur Inventur?
4. **Gilt auch für inline-Formeln** `\(...\)` (nicht nur Display)?
   Vermutlich ja, aber Fokus lag auf nummerierten Display-Gleichungen.
5. **Darkmode:** Überstand ist modus-, nicht farbabhängig — aber Behebung
   darf nicht die Neon-/Tag-Lesbarkeit (P13-Konflikt?) stören.
6. **Druck:** Druckspalte ist fix 700 px (print.js) — separat prüfen oder
   wird Druck aus dem breit-Modus-Klon ohnehin eng genug?

**Ansatz-Ideen (zur Planung, NICHT umgesetzt):**
- **Inventur-Werkzeug:** Erweiterung des bestehenden Screenshot-Skills
  (`.claude/skills/.../figur_screenshot.mjs`, playwright-core) oder des
  DOM-Harness (`.claude/skills/v013-verifikation/scripts/dom_harness.mjs`):
  pro Width-Modus Seite laden, alle `mjx-container[display=true]` +
  deren `.mjx-mtr`/Tag-Elemente vermessen, Übersteher (`right > rand +
  Toleranz`) auflisten mit Formel-Text/Tag/Seite. Output = Tabelle.
- **Modussensitive CSS-Regeln** (s. CLAUDE.md Width-Mode-Decoupling):
  `:root[data-width-mode="schmal"] …` gezielt problematische Formeln via
  data-Attribut/`\label`-Marker ansprechen (z. B. `data-formel-
  overflow`), dort `\small`-Äquivalent (MathJax-CSS-Skalierung) oder
  Zeilenumbruch. **Nie** globale `.mjx-container{font-size:…}` (skaliert
  alle, auch harmlose).
- **Pro-Formel-Markierung:** problematischen Formeln im Quell-HTML ein
  `data-…`-Merkmal geben, damit die modussensitive Regel sie greift —
  O(1) pro Formel, skalierbar (CLAUDE.md hard constraint).
- **Tag-Überstand separat:** MathJax-Tag liegt in `.mjx-mtext`/`.mjx-tlist`;
   wenn nur der Tag übersteht, ist die sauberste Lösung oft die Formel
   selbst (Box) so zu verengen, dass der Tag in die Spalte passt — oder
   das Tag-Layout anzupassen. Vorab klären, ob Tags überhaupt umbrechen
   dürfen.

**Sub-Tasks (Aufwand Schätzung — erst nach Klärung verlässlich):**
- [ ] **P14-0 Klärung** — die 6 offenen Fragen mit Nutzer klären
  (insb. Behebungs-Strategie & Inventur-Werkzeug-Dauerhaftigkeit),
  Ergebnis hier festhalten. *(M)*
- [ ] **P14-1 Inventur-Werkzeug** — headless-Chromium-Messung pro
  Width-Modus, listet Übersteher (Formel + Tag). *(M)*
- [ ] **P14-2 Inventur** — alle Kapitel/Modi durchmessen, Kandidaten-
  Liste erstellen (Markdown-Tabelle), mit Nutzer abstimmen. *(M)*
- [ ] **P14-3 Behebung** — pro Kandidat modussensitive Regel
  (data-Merkmal + `:root[data-width-mode=…]`-CSS); Einzelfall n. P14-0. *(L)*
- [ ] **P14-4 Verifikation** — Inventur-Werkzeug wiederholt: 0
  Übersteher in allen Modi; DOM-Harness (keine Seiten-/Nummern-
  Regression); Sicht (Stufe 5, Freigabe „JA"). *(M)*

---

