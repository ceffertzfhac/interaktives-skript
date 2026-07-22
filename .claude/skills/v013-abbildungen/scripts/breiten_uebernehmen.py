#!/usr/bin/env python3
"""Abbildungsbreiten aus der v0.13-Quelle ins Kapitel-HTML uebernehmen.

    # nur anzeigen
    python3 breiten_uebernehmen.py kapitel.tex
    # ins HTML schreiben
    python3 breiten_uebernehmen.py kapitel.tex chapters/ch_NN.html --schreiben

v0.13 vergibt individuelle Breiten (im Kapitel 1.4 zwischen 0.25 und 0.99
\\textwidth). Ohne Uebernahme erscheinen alle Abbildungen gleich breit und
kleine Schemata werden ueber ihre native Aufloesung hinaus hochskaliert.

Zuordnung ueber den Dateinamen ohne Endung, in Dokumentreihenfolge -- taucht
dieselbe Datei mehrfach mit verschiedenen Breiten auf (z. B. einmal einzeln,
einmal als Teilabbildung), werden die Breiten der Reihe nach verbraucht.

WICHTIG: zusaetzlich muss in styles.css
    #paper figure.abbildung > img.grafik { width: auto; max-width: 100%; }
stehen, sonst gewinnt die Altregel `.grafik { width: 100% }`.
"""
import collections
import re
import sys


def breiten_aus_tex(tex):
    s = re.sub(r'(?m)^\s*%.*$', '', open(tex, encoding='utf8').read())
    breiten = collections.defaultdict(list)
    for m in re.finditer(r'\\includegraphics\[width=([0-9.]+)\\(?:textwidth|linewidth)\]\{([^}]*)\}', s):
        name = m.group(2).split('/')[-1].rsplit('.', 1)[0]
        breiten[name].append(float(m.group(1)))
    aussen = [float(m.group(1)) for m in
              re.finditer(r'\\begin\{subfigure\}(?:\[[^\]]*\])?\{([0-9.]+)\\textwidth\}', s)]
    return breiten, aussen


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    tex = sys.argv[1]
    html_pfad = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
    schreiben = '--schreiben' in sys.argv

    breiten, aussen = breiten_aus_tex(tex)
    print('=== Breiten aus %s ===' % tex)
    for name, liste in sorted(breiten.items()):
        print('  %-52s %s' % (name, ', '.join('%g' % b for b in liste)))
    print('  subfigure-Aussenbreiten:', ', '.join('%g' % a for a in aussen) or 'keine')

    if not html_pfad:
        return

    html = open(html_pfad, encoding='utf8').read()
    verbraucht = collections.Counter()
    protokoll = []

    def bild(m):
        tag = m.group(0)
        src = re.search(r'src="bilder/([^"]*)"', tag)
        if not src:
            return tag
        name = src.group(1).rsplit('.', 1)[0]
        liste = breiten.get(name)
        if not liste:
            protokoll.append(('KEINE BREITE', name))
            return tag
        b = liste[min(verbraucht[name], len(liste) - 1)]
        verbraucht[name] += 1
        prozent = ('%g%%' % (b * 100))
        protokoll.append((prozent, name))
        tag = re.sub(r'\s*style="[^"]*"', '', tag)
        return tag.replace('<img ', '<img style="width:%s" ' % prozent, 1)

    neu = re.sub(r'<img[^>]*class="grafik"[^>]*>', bild, html)

    it = iter(aussen)
    neu = re.sub(r'<div class="subfig"(?![^>]*style=)',
                 lambda m: '<div class="subfig" style="width:%g%%"' % (next(it, 0.48) * 100), neu)

    print('\n=== Zuordnung im HTML ===')
    for wert, name in protokoll:
        print('  %-14s %s' % (wert, name))

    if schreiben:
        open(html_pfad, 'w', encoding='utf8').write(neu)
        print('\ngeschrieben:', html_pfad)
    else:
        print('\n(Probelauf -- mit --schreiben tatsaechlich aendern)')


if __name__ == '__main__':
    main()
