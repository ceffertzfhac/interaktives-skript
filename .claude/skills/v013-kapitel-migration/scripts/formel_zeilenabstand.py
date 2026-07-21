#!/usr/bin/env python3
"""Zeilenabstand in mehrzeiligen Formeln setzen -- klammer-bewusst.

    python3 formel_zeilenabstand.py chapters/ch_NN.html [--gap 6pt] [--schreiben]

MathJax ignoriert \\setlength{\\jot} und \\renewcommand{\\arraystretch}
(nachgemessen: identische SVG-Hoehe). Wirksam sind nur explizite Abstaende
`\\\\[6pt]`.

Diese duerfen ausschliesslich an Zeilenumbruechen auf OBERSTER Ebene einer
align/gather/multline-Umgebung stehen. Ein naives Suchen-und-Ersetzen wuerde
auch die `\\\\` innerhalb von pmatrix, cases, array oder split treffen und
Matrizen auseinanderziehen -- deshalb zaehlt dieses Skript die Schachtelung.

Idempotent: bereits vorhandene `\\\\[...]` bleiben unangetastet.
"""
import re
import sys

AUSSEN = ('align', 'align*', 'gather', 'gather*', 'multline', 'multline*', 'eqnarray')
INNEN = ('pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'matrix', 'smallmatrix',
         'cases', 'array', 'split', 'aligned', 'gathered', 'substack')

TOKEN = re.compile(r'\\begin\{([A-Za-z*]+)\}|\\end\{([A-Za-z*]+)\}|\\\\(\[[^\]]*\])?')


def umbrueche_setzen(koerper, gap):
    teile, i, tiefe, n = [], 0, 0, 0
    while i < len(koerper):
        m = TOKEN.match(koerper, i)
        if not m:
            teile.append(koerper[i])
            i += 1
            continue
        tok = m.group(0)
        if m.group(1) in INNEN:
            tiefe += 1
        elif m.group(2) in INNEN:
            tiefe -= 1
        elif tok.startswith('\\\\') and tiefe == 0 and not m.group(3):
            tok = '\\\\[' + gap + ']'
            n += 1
        teile.append(tok)
        i = m.end()
    return ''.join(teile), n


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pfad = sys.argv[1]
    gap = sys.argv[sys.argv.index('--gap') + 1] if '--gap' in sys.argv else '6pt'
    schreiben = '--schreiben' in sys.argv

    s = open(pfad, encoding='utf8').read()
    gesamt = 0

    def ersetze(m):
        nonlocal gesamt
        koerper, n = umbrueche_setzen(m.group(2), gap)
        gesamt += n
        return '\\begin{%s}%s\\end{%s}' % (m.group(1), koerper, m.group(1))

    muster = re.compile(r'\\begin\{(' + '|'.join(re.escape(u) for u in AUSSEN) + r')\}(.*?)\\end\{\1\}', re.S)
    neu = muster.sub(ersetze, s)

    print('Umgebungen geprueft :', len(muster.findall(s)))
    print('Umbrueche mit Abstand:', gesamt, '(gap = %s)' % gap)
    if schreiben:
        open(pfad, 'w', encoding='utf8').write(neu)
        print('geschrieben:', pfad)
    else:
        print('(Probelauf -- mit --schreiben tatsaechlich aendern)')


if __name__ == '__main__':
    main()
