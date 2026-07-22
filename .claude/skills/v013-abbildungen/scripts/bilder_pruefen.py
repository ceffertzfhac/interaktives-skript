#!/usr/bin/env python3
"""Bildbestand pruefen: Dateiendung gegen Inhalt, SVG-Schriften, Aufloesung.

    python3 bilder_pruefen.py InteraktivesSkript_WIP/bilder [kapitel.html]

Findet drei real aufgetretene Fehlerklassen:

1. ENDUNG LUEGT -- z. B. eine PDF-Datei mit .png-Endung. Der Browser zeigt ein
   kaputtes Bild. Kam in der v0.13-Quelle genau einmal vor und war visuell
   sofort, per Skript in einer Sekunde zu finden.
2. SVG OHNE EINGEBETTETE SCHRIFT -- Handexporte mit font-family "Palatino"
   o. ae. rendern mit Ersatzschrift und passen dann nicht zur LaTeX-Typografie
   der uebrigen Abbildungen. Besser aus der zugehoerigen PDF rendern.
3. ZU KLEINE RASTERBILDER -- werden im Layout hochskaliert und wirken unscharf.

Wird zusaetzlich das Kapitel-HTML uebergeben, werden verwaiste Dateien und
fehlende Referenzen gemeldet.
"""
import os
import re
import struct
import sys

SIGNATUREN = [(b'\x89PNG\r\n\x1a\n', 'PNG'), (b'\xff\xd8\xff', 'JPEG'),
              (b'%PDF', 'PDF'), (b'GIF8', 'GIF')]
PASSEND = {'png': 'PNG', 'jpg': 'JPEG', 'jpeg': 'JPEG', 'gif': 'GIF', 'svg': 'SVG'}


def inhaltstyp(kopf):
    for sig, name in SIGNATUREN:
        if kopf.startswith(sig):
            return name
    text = kopf.lstrip()[:200]
    if b'<svg' in text or b'<?xml' in text:
        return 'SVG'
    return 'UNBEKANNT'


def png_groesse(pfad):
    d = open(pfad, 'rb').read(33)
    if d[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', d[16:24])
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ordner = sys.argv[1]
    html = open(sys.argv[2], encoding='utf8').read() if len(sys.argv) > 2 else None

    dateien = sorted(f for f in os.listdir(ordner) if re.search(r'\.(png|jpe?g|gif|svg)$', f, re.I))
    fehler = warnungen = 0

    print('=== Endung gegen Inhalt (%d Dateien) ===' % len(dateien))
    for f in dateien:
        pfad = os.path.join(ordner, f)
        ext = f.rsplit('.', 1)[1].lower()
        typ = inhaltstyp(open(pfad, 'rb').read(400))
        if typ != PASSEND.get(ext):
            print('  FEHLER  %-55s Endung .%s, Inhalt %s' % (f, ext, typ))
            if typ == 'PDF':
                print('          -> pdftocairo -png -r 300 -singlefile <quelle>.pdf %s'
                      % f.rsplit('.', 1)[0])
            fehler += 1
    if not fehler:
        print('  alle Endungen stimmen mit dem Inhalt ueberein')

    print('\n=== SVG-Schriften ===')
    svgs = [f for f in dateien if f.lower().endswith('.svg')]
    for f in svgs:
        s = open(os.path.join(ordner, f), encoding='utf8', errors='replace').read()
        familien = sorted(set(re.findall(r'font-family\s*[:=]\s*["\']?([^"\';)]+)', s)))
        eingebettet = s.count('@font-face') + s.count('<font')
        if s.count('<text') and not eingebettet and familien:
            print('  WARNUNG %-40s <text> mit Systemschrift %s, nichts eingebettet'
                  % (f, familien[:3]))
            print('          -> besser aus der zugehoerigen PDF rendern')
            warnungen += 1
    if not svgs:
        print('  keine SVG-Dateien')
    elif not warnungen:
        print('  alle SVGs unbedenklich')

    print('\n=== Aufloesung (Rasterbilder) ===')
    klein = []
    for f in dateien:
        g = png_groesse(os.path.join(ordner, f))
        if g and g[0] < 700:
            klein.append((f, g))
    for f, (w, h) in klein:
        print('  HINWEIS %-45s nur %dx%d px -- bei Vollbreite unscharf' % (f, w, h))
    if not klein:
        print('  keine auffaellig kleinen Rasterbilder')

    if html is not None:
        print('\n=== Abgleich mit dem Kapitel ===')
        referenziert = {m.group(1) for m in re.finditer(r'src="bilder/([^"]+)"', html)}
        vorhanden = set(dateien)
        fehlt = sorted(referenziert - vorhanden)
        for f in fehlt:
            print('  FEHLER  referenziert, aber nicht vorhanden:', f)
            fehler += 1
        ungenutzt = sorted(vorhanden - referenziert)
        print('  referenziert: %d | im Ordner: %d | vom Kapitel ungenutzt: %d'
              % (len(referenziert), len(vorhanden), len(ungenutzt)))
        if ungenutzt:
            print('    (ungenutzt kann korrekt sein -- andere Kapitel, statischer Modus)')

    print('\nErgebnis: %d Fehler, %d Warnungen' % (fehler, warnungen))
    sys.exit(1 if fehler else 0)


if __name__ == '__main__':
    main()
