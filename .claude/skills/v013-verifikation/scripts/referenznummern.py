#!/usr/bin/env python3
"""Referenznummern eines Abschnitts aus dem v0.13-PDF ziehen.

Das ist die Wahrheit, gegen die das migrierte HTML geprueft wird: Gleichungen
pro Unterabschnitt, Abbildungen und Boxen. Die .tex-Datei allein genuegt
nicht -- die Nummern entstehen erst aus Header-Deklarationen plus dem Zustand
vorheriger Abschnitte.

    python3 referenznummern.py Input/v0.13/Physik_pskript_v0.13.pdf 1.5
    python3 referenznummern.py … 1.5 --debug     # Schnittgrenzen zeigen

ABGRENZUNG DES ABSCHNITTS -- der heikle Teil. Im pdftotext-Text steht die
Abschnittsnummer an drei Sorten von Stellen:
  1. im Inhaltsverzeichnis   ("1.5   Dynamik … . . . . . 218")
  2. als Kolumnentitel       ("1.5 Dynamik …        Kapitel 1 Mechanik")
  3. als echte Ueberschrift  ("1.5 Dynamik …")
… und ausserdem im Fliesstext ("1.5 m", "Abbildung 1.5"). Eine naive Suche
nach der Nummer traf deshalb irgendeine Textzeile mitten im Kapitel 0.
Deshalb wird der Titel zuerst aus dem Inhaltsverzeichnis gelesen und dann
gezielt die Zeile gesucht, die aus Nummer + genau diesem Titel besteht und
KEINEN Kolumnentitel-Anteil ("Kapitel N") enthaelt.
"""
import bisect
import re
import subprocess
import sys
import tempfile
from collections import defaultdict

DEBUG = '--debug' in sys.argv


def pdf_text(pdf):
    tmp = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
    subprocess.run(['pdftotext', '-layout', pdf, tmp.name], check=True)
    return open(tmp.name, encoding='utf8', errors='replace').read()


def titel_aus_inhaltsverzeichnis(txt, nummer):
    """Titel einer Nummer aus der Inhaltsverzeichnis-Zeile (die mit den Punkten)."""
    m = re.search(r'(?m)^\s*%s\s+(.+?)\s*\.\s*\.\s*\.' % re.escape(nummer), txt)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else None


def ueberschrift_position(txt, nummer, titel, ab=0):
    """Position der echten Ueberschrift: Nummer + Titel, ohne Kolumnentitel."""
    if titel:
        # Titel kann im Umbruch stehen -> nur die ersten Woerter verlangen
        anfang = ' '.join(titel.split()[:4])
        muster = re.compile(r'(?m)^[ \t]*%s[ \t]+%s' % (re.escape(nummer),
                                                        r'[ \t]*'.join(map(re.escape, anfang.split()))))
        for m in muster.finditer(txt, ab):
            zeile = txt[m.start():txt.find('\n', m.start())]
            if '. . .' in zeile or re.search(r'Kapitel\s+\d', zeile):
                continue
            return m.start()
    # Rueckfall: Nummer allein am Zeilenanfang, kein IV, kein Kolumnentitel
    for m in re.finditer(r'(?m)^[ \t]*%s[ \t]+\S.*$' % re.escape(nummer), txt[ab:]):
        if '. . .' in m.group(0) or re.search(r'Kapitel\s+\d', m.group(0)):
            continue
        return ab + m.start()
    return None


def abschnitt_ausschneiden(txt, prefix):
    kap, sec = prefix.split('.')[:2]
    folge = '%s.%d' % (kap, int(sec) + 1)
    start = ueberschrift_position(txt, prefix, titel_aus_inhaltsverzeichnis(txt, prefix))
    if start is None:
        sys.exit('Ueberschrift %s im PDF nicht gefunden' % prefix)
    ende = ueberschrift_position(txt, folge, titel_aus_inhaltsverzeichnis(txt, folge), start + 1)
    if ende is None:  # letzter Abschnitt des Kapitels -> naechstes Kapitel suchen
        m = re.search(r'(?m)^\s*Kapitel\s+%d\b' % (int(kap) + 1), txt[start:])
        ende = start + m.start() if m else len(txt)
    if DEBUG:
        print('[debug] %s: Zeile %d bis %d' % (prefix, txt[:start].count('\n') + 1,
                                               txt[:ende].count('\n') + 1), file=sys.stderr)
    return txt[start:ende]


def unterabschnitte(txt, prefix):
    """Ueberschriften 'prefix.n Titel' -- ohne IV-Zeilen und Kolumnentitel.
    Der Titel darf mit beliebigem Zeichen beginnen (v0.13 hat z. B.
    '1.5.4 (Massen-)Traegheitsmoment')."""
    treffer = []
    for m in re.finditer(r'(?m)^[ \t]*(%s\.\d+)[ \t]+(\S.*)$' % re.escape(prefix), txt):
        zeile = ' '.join(m.group(0).split())
        if '. . .' in zeile or re.search(r'Kapitel\s+\d', zeile):
            continue
        if len(zeile) > 90:          # Fliesstext, keine Ueberschrift
            continue
        if any(t[1] == m.group(1) for t in treffer):
            continue                  # nur das erste Vorkommen
        treffer.append((m.start(), m.group(1), zeile))
    return treffer


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 2:
        sys.exit(__doc__)
    pdf, prefix = args[0], args[1]
    kapitel = prefix.split('.')[0]
    txt = abschnitt_ausschneiden(pdf_text(pdf), prefix)

    subs = unterabschnitte(txt, prefix)
    starts = [s[0] for s in subs]

    gesehen, reihenfolge = set(), []
    for m in re.finditer(r'\(%s\.(\d+)\)' % re.escape(prefix), txt):
        n = int(m.group(1))
        if n not in gesehen:
            gesehen.add(n)
            reihenfolge.append((m.start(), n))

    pro_sub = defaultdict(list)
    for pos, n in reihenfolge:
        i = bisect.bisect_right(starts, pos) - 1
        pro_sub[subs[i][1] if i >= 0 else '(vor dem ersten Unterabschnitt)'].append(n)

    print('=== Gleichungen pro Unterabschnitt (Sollwerte) ===')
    if '(vor dem ersten Unterabschnitt)' in pro_sub:
        v = pro_sub['(vor dem ersten Unterabschnitt)']
        print('  %-54s %3d Gl.  %d-%d' % ('(Intro, vor dem ersten Unterabschnitt)', len(v), min(v), max(v)))
    for _, nummer, zeile in subs:
        v = pro_sub.get(nummer, [])
        print('  %-54s %3d Gl.  %s' % (zeile[:54], len(v),
                                       '%d-%d' % (min(v), max(v)) if v else '-'))
    alle = sorted(gesehen)
    print('  SUMME: %d  (%s.1 bis %s.%d)' % (len(alle), prefix, prefix, max(alle) if alle else 0))
    print('  Luecken:', [i for i in range(1, (max(alle) if alle else 0) + 1) if i not in gesehen] or 'keine')

    print('\n=== Abbildungen (v0.13: kapitelweiter Zaehler!) ===')
    abb = sorted({int(m.group(1)) for m in
                  re.finditer(r'Abbildung %s\.(\d+):' % re.escape(kapitel), txt)})
    if abb:
        print('  %s.%d bis %s.%d  (%d Stueck)' % (kapitel, abb[0], kapitel, abb[-1], len(abb)))
        print('  Luecken:', [n for n in range(abb[0], abb[-1] + 1) if n not in abb] or 'keine')
        print('  -> data-figure-offset="%d" am <h2> des Kapitels' % (abb[0] - 1))
    else:
        print('  keine Bildunterschriften gefunden')

    print('\n=== Boxen (Zaehlweise wird erkannt) ===')
    for typ in ('Lernziel', 'Beispiel', 'Bemerkung', 'Wichtig', 'Aufgabe', 'Zusammenfassung'):
        pro_section = sorted({m.group(1) for m in
                              re.finditer(r'%s\s+(%s\.\d+)\b' % (typ, re.escape(prefix)), txt)},
                             key=lambda x: int(x.split('.')[-1]))
        pro_kapitel = sorted({m.group(1) for m in
                              re.finditer(r'%s\s+(%s\.\d+)(?!\.)\b' % (typ, re.escape(kapitel)), txt)},
                             key=lambda x: int(x.split('.')[-1]))
        if pro_section:
            print('  %-16s %s bis %s (%d)   pro Section' % (typ, pro_section[0], pro_section[-1], len(pro_section)))
        elif pro_kapitel:
            print('  %-16s %s bis %s (%d)   KAPITELWEIT -> CHAPTER_SCOPED + Offset %d'
                  % (typ, pro_kapitel[0], pro_kapitel[-1], len(pro_kapitel),
                     int(pro_kapitel[0].split('.')[-1]) - 1))


if __name__ == '__main__':
    main()
