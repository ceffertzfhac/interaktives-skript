#!/usr/bin/env python3
"""Referenznummern eines Abschnitts aus dem v0.13-PDF ziehen.

Das ist die Wahrheit, gegen die das migrierte HTML geprueft wird: Gleichungen
pro Unterabschnitt, Abbildungen und Boxen. Die .tex-Datei allein genuegt
nicht -- die Nummern entstehen erst aus Header-Deklarationen plus dem Zustand
vorheriger Abschnitte.

Beispiel:
    python3 referenznummern.py Input/v0.13/Physik_pskript_v0.13.pdf 1.4
"""
import bisect
import re
import subprocess
import sys
import tempfile
from collections import defaultdict


def pdf_text(pdf):
    out = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
    subprocess.run(['pdftotext', '-layout', pdf, out.name], check=True)
    return open(out.name, encoding='utf8', errors='replace').read()


def abschnitt_ausschneiden(txt, prefix):
    """Text von der Ueberschrift des Abschnitts bis zur naechsten Section."""
    kap, sec = prefix.split('.')[:2]
    start = None
    for m in re.finditer(r'(?m)^\s*%s\s+\S.*$' % re.escape(prefix), txt):
        # Erster Treffer, der nicht im Inhaltsverzeichnis steht (dort folgen Punkte)
        if '. . .' in m.group(0):
            continue
        start = m.start()
        break
    if start is None:
        sys.exit('Abschnitt %s im PDF nicht gefunden' % prefix)
    nxt = re.search(r'(?m)^\s*%s\.%d\s+\S.*$' % (re.escape(kap), int(sec) + 1), txt[start:])
    end = start + nxt.start() if nxt else len(txt)
    return txt[start:end]


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    pdf, prefix = sys.argv[1], sys.argv[2]
    kapitel = prefix.split('.')[0]
    txt = abschnitt_ausschneiden(pdf_text(pdf), prefix)

    # Unterabschnitts-Ueberschriften als Ankerpunkte
    subs = [(m.start(), ' '.join(m.group(0).split()))
            for m in re.finditer(r'(?m)^\s*%s\.\d+\s+[A-ZÄÖÜ][^\n]{5,70}$' % re.escape(prefix), txt)]
    subs = [s for s in subs if '. . .' not in s[1]]
    starts = [s[0] for s in subs]

    # Gleichungen in Dokumentreihenfolge, jede Nummer nur beim ersten Auftreten
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
    for _, name in subs:
        v = pro_sub.get(name, [])
        spanne = '%d-%d' % (min(v), max(v)) if v else '-'
        print('  %-52s %3d Gl.  %s' % (name[:52], len(v), spanne))
    alle = sorted(gesehen)
    print('  SUMME: %d  (%s.1 bis %s.%d)' % (len(alle), prefix, prefix, max(alle) if alle else 0))
    luecken = [i for i in range(1, (max(alle) if alle else 0) + 1) if i not in gesehen]
    print('  Luecken:', luecken or 'keine')

    print('\n=== Abbildungen (kapitelweiter Zaehler!) ===')
    abb = sorted({int(m.group(1)) for m in re.finditer(r'Abbildung %s\.(\d+):' % re.escape(kapitel), txt)})
    if abb:
        print('  %s.%d bis %s.%d  (%d Stueck)' % (kapitel, abb[0], kapitel, abb[-1], len(abb)))
        fehlend = [n for n in range(abb[0], abb[-1] + 1) if n not in abb]
        print('  Luecken:', fehlend or 'keine')
    else:
        print('  keine gefunden -- Praefix pruefen')

    print('\n=== Boxen ===')
    for typ in ('Beispiel', 'Bemerkung', 'Wichtig', 'Aufgabe', 'Lernziel', 'Zusammenfassung'):
        nums = sorted({m.group(1) for m in re.finditer(r'%s (%s\.[0-9.]+|%s\.\d+)' % (typ, re.escape(prefix), re.escape(kapitel)), txt)},
                      key=lambda x: [int(p) for p in x.split('.')])
        if nums:
            hinweis = ''
            if nums[0].count('.') == 1:
                hinweis = '   <- KAPITELWEIT gezaehlt, nicht pro Section!'
            print('  %-16s %s bis %s (%d)%s' % (typ, nums[0], nums[-1], len(nums), hinweis))


if __name__ == '__main__':
    main()
