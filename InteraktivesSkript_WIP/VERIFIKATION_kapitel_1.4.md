# Verifikationsplan — Kapitel 1.4 (v0.13-Transkription) + gc10-Wegfalle

Plan, nicht selbst ausgeführt. Jeder Schritt hat **Ausführung** + **Akzeptanzkriterium**.
Bezieht sich auf `chapters/ch_01_kreisbewegungen.html` (v0.13-Abschnitt 1.4,
*Kinematik der Drehbewegung und Kreisbahnen*, Quelle
`Input/v0.13/pskript_mech_kin_dreh_und_kreis_v1.tex`).

---

## Phase 0 — Setup
1. **Ausführung:** `cd InteraktivesSkript_WIP && python3 -m http.server 8000`
2. **Akzeptanz:** Server startet ohne Fehler; Browser öffnet `http://localhost:8000/`
   (nicht `file://` — sonst keine Chapter-Prosa, s. CLAUDE.md).
3. **Voraussetzung:** Netzverbindung für MathJax-/qrjs2-CDN.

## Phase 1 — Smoke-Test (Kapitel lädt)
4. **Ausführung:** Seite öffnen, Konsole beobachten.
5. **Akzeptanz:** Keine 404 (insbes. `chapters/ch_01_kreisbewegungen.html`,
   `src/numbering.js`, `bilder/*`), keine JS-Fehler. Header zeigt `v1.7`.

## Phase 2 — Inhaltsparität vs v0.13 (Stichproben)
6. **Ausführung:** v0.13-PDF (`Input/v0.13/Physik_pskript_v0.13.pdf`, Abschnitt 1.4)
   neben WIP-Seite öffnen.
7. **Akzeptanz (Stichproben je Unterabschnitt):** Prosa wortgleich; alle 12 h3-Titel
   vorhanden & nummeriert 1.4.1–1.4.12; Boxen-Texte und -Reihenfolge gleich.
8. **Konvertierungs-Sonderfälle prüfen:** `\SI`-Werte als `n\,\mathrm{unit}`
   (z. B. Sekundenzeiger `2\,\mathrm{min}`, `4{,}0\,\mathrm{s}`,
   `7{,}2722\cdot10^{-5}\,\mathrm{s}^{-1}`), deutsche Dezimalkommata `{,}`,
   `\point`/`\textcolor` korrekt umgesetzt.

## Phase 3 — MathJax & Formelnummerierung
9. **Ausführung:** Alle Formeln gerendert (kein rohes LaTeX sichtbar).
10. **Akzeptanz:** Nummerierte Gleichungen tragen `(1.4.1)`, `(1.4.2)`, … fortlaufend,
    lückenfrei; `equation*`/`align*`/`\[\]` **ohne** Tag; `\nonumber`-Zeilen in align
    unnummeriert; `\boxed`/`\underbrace` rendern.
11. **Ausführung:** `\ref`-Querverweise in Prosa suchen („siehe (1.4.n)“).
12. **Akzeptanz:** refs lösen zu klickbaren Links mit korrekter Nummer auf (nicht „??").

## Phase 4 — Abbildungsnummerierung & SVGs
13. **Ausführung:** Jede `figure.abbildung`-Beschriftung prüfen.
14. **Akzeptanz:** Fortlaufend `Abb. 1.4.1 … 1.4.23`, in DOM/Lesereihenfolge,
    keine Lücke/Doppelung.
15. **Spezial-Checks (TikZ-SVGs):**
    - Abb. **1.4.2** = inline-SVG „Radiale und tangentiale Richtung …“
      (in der Bemerkung-Box in 1.4.1).
    - Abb. **1.4.16** = inline-SVG „Kinematik-Flowchart“ (in 1.4.6).
16. **Akzeptanz (SVGs):** Beide SVGs skalieren korrekt (`max-width:100%`,
    `height:auto` — `svg.grafik`-CSS-Regel aus `styles.css` greift), Pfeilspitzen/Labels
    sichtbar, Unicode-Math (φ, ω, α, ∫) lesbar.
17. **Ausführung:** Prose-Querverweise auf Abbildungen prüfen.
18. **Akzeptanz:** Hardcodierte Abbildungsnummern stimmen mit tatsächlicher Zählung
    (insbes. die verschobenen: 1.4.2→1.4.3, 1.4.4→1.4.5, 1.4.7→1.4.8, 1.4.10→1.4.11,
    1.4.5→1.4.6 u. a.).

## Phase 5 — Box-Nummerierung
19. **Ausführung:** Box-Titel pro Typ zählen
    (Beispiel/Bemerkung/Wichtig/Aufgabe/Zusammenfassung/Lernziel).
20. **Akzeptanz:** Pro Typ fortlaufend `1.4.1, 1.4.2, …`, Reset nur am Sectionswechsel
    (hier nur eine Section → durchlaufend); `data-title` als Klartext angezeigt
    (kein rohes LaTeX, da über `textContent` gesetzt).

## Phase 6 — Pagination & Navigation
21. **Ausführung:** Durch alle Seiten blättern (Weiter/Zurück, Kapitel-Mini-Nav, Schiene).
22. **Akzeptanz:** Genau **12 Seiten** (eine pro h3); jede Seite zeigt nur ihren eigenen
    `<section>`-Inhalt; keine „verlorenen" Sibling-Elemente auf jeder Seite
    (`foldStraySiblings` greift — z. B. Zusammenfassungs-Box nach 1.4.10/1.4.12).
23. **Ausführung:** Browser-Hash/Deep-Link auf eine Seite setzen, reload.
24. **Akzeptanz:** Gleiche Seite aktiv; Breadcrumb + „Seite x/y" korrekt.

## Phase 7 — gc10-Wegfalle
25. **Ausführung:** In 1.4 nach kreisbewegungs-Simulation suchen; Konsole prüfen.
26. **Akzeptanz:** Kein `gc10`/Kreisbewegungs-Panel, kein `initKreisbewegung`-Fehler,
    keine `kb_`-Slider; ggf. verwaister `figures/kreisbewegung/styles.css`-Link
    (index.html L9) harmlos.
27. **Ausführung:** `make_static()`-Easter-Egg („Fa**ll**" im Kontakt) auslösen.
28. **Akzeptanz:** Alle `gcN` → statische Bilder, keine Ausnahme/Fehler für gc10;
    neu typengesetzte MathJax; zurück via `test()`.

## Phase 8 — Druckfluss
29. **Ausführung:** Toolbar „Drucken" → neuer Tab `?print=true`.
30. **Akzeptanz:** Druckansicht enthält **alle** 12 Unterabschnitte (nicht nur aktive
    Seite), Abbildungen + QR-Codes pro `gcN`/Abbildung (link `?g=…`);
    Bemerkungs-Marginalia zurück restauriert.
31. **Ausführung:** Druck als PDF speichern.
32. **Akzeptanz:** Formel-Tag-Nummerierung im Druck erhalten; keine abgeschnittenen SVGs.

## Phase 9 — TOC & Querverweise
33. **Ausführung:** „Inhaltsverzeichnis" öffnen.
34. **Akzeptanz:** Accordion mit Gruppe „1.4 …" + 12 verschachtelten h3-Links; aktive
    Seite hervorgehoben; Suche filtert.
35. **Ausführung:** Prose-`data-action="goto_page"`-Links (z. B. „Abschnitt 1.4.5") klicken.
36. **Akzeptanz:** Springt zur Zielseite.

## Phase 10 — Responsive / Darkmode / Static
37. **Ausführung:** Fenster < 1024px (Tablet).
38. **Akzeptanz:** Schiene/Marginalia versteckt, Drawer über ☰; keine Phone-CSS.
39. **Ausführung:** Darkmode umschalten.
40. **Akzeptanz:** Kein Kontrast-Bruch; inline-SVGs + Boxen bleiben lesbar.
41. **Ausführung:** Safari-foreignObject-Check nur falls Safari verfügbar (sonst überspringen).
42. **Akzeptanz:** `.fo_inner`-Verschiebung nur in Safari (`.fixed`-Klasse) — irrelevant,
    da keine foreignObject-Figuren mehr in 1.4, trotzdem kein Regress.

---

## Priorität
- **Must:** Phasen 1, 3, 4, 6, 7 (Laden, Formeln, Abbildungen, Pagination, gc10).
- **Should:** 2, 5, 8, 9.
- **Nice:** 10.

## Vermerk
Quelle der Abbildungs-Nummernverschiebung: die beiden ehemals weggelassenen TikZ-Figuren
wurden als inline-SVG rekonstruiert (1.4.2 radial/tangential, 1.4.16 Flowchart), damit die
Abbildungsnummerierung 1:1 zu v0.13 (1.4.1–1.4.23) passt. Dadurch verschoben sich die
folgenden hardcodierten Abbildungs-Querverweise in der Prosa um +1 bzw. +2.