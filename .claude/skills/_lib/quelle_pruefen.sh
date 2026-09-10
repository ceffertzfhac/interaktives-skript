#!/usr/bin/env bash
# Prueft, ob Input/v0.13 auf den maßgeblichen Stand des Druckskripts zeigt.
# Regel und Anker: QUELLE_v013.md im Repo-Wurzelverzeichnis.
# Aendert nichts; Exit 0 = in Ordnung, 1 = Zugriffspfad falsch, 2 = Anker weicht ab.
set -uo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd)
LINK="$ROOT/Input/v0.13"
SOLL_REMOTE='ceffertzfhac/Project_Script'
SOLL_ORDNER="$(cd -- "$ROOT/.." 2>/dev/null && pwd)/Project_Script/v0.13"

fehler=0

if [ ! -e "$LINK" ]; then
    echo "FEHLT: $LINK existiert nicht."
    echo "  anlegen mit: ln -sfn ../../Project_Script/v0.13 Input/v0.13"
    exit 1
fi

ZIEL=$(readlink -f "$LINK")
echo "Input/v0.13  ->  $ZIEL"

if [ "$ZIEL" != "$SOLL_ORDNER" ]; then
    echo "  ABWEICHUNG: maßgeblich ist $SOLL_ORDNER"
    echo "  Das ist ein anderer Klon -- vermutlich ein Altstand (s. QUELLE_v013.md)."
    fehler=1
fi

REPO=$(git -C "$ZIEL" rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO" ]; then
    echo "  WARNUNG: kein git-Repo -- Stand nicht feststellbar."
    exit 1
fi

REMOTE=$(git -C "$REPO" remote get-url origin 2>/dev/null)
case "$REMOTE" in
    *"$SOLL_REMOTE"*) ;;
    *) echo "  ABWEICHUNG: origin ist '$REMOTE', erwartet wird $SOLL_REMOTE"; fehler=1 ;;
esac

HEAD_KURZ=$(git -C "$REPO" rev-parse --short=7 HEAD)
HEAD_DATUM=$(git -C "$REPO" log -1 --date=short --pretty=%ad)
echo "Quellstand   :  $HEAD_KURZ ($HEAD_DATUM)"

if [ -n "$(git -C "$REPO" status --porcelain 2>/dev/null)" ]; then
    echo "  ACHTUNG: uncommittete Aenderungen in der Quelle -- der Stand ist nicht"
    echo "  reproduzierbar. Vor dem Verifizieren dort committen oder stashen."
    fehler=1
fi

ANKER=$(grep -m1 '^ANKER_VERIFIZIERT=' "$ROOT/QUELLE_v013.md" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
if [ -z "$ANKER" ]; then
    echo "  WARNUNG: kein ANKER_VERIFIZIERT in QUELLE_v013.md gefunden."
elif [ "$ANKER" = "$HEAD_KURZ" ]; then
    echo "Anker        :  $ANKER -- Quelle steht auf dem verifizierten Stand."
else
    echo "Anker        :  $ANKER (verifiziert)  !=  $HEAD_KURZ (aktuell)"
    n=$(git -C "$REPO" rev-list --count "$ANKER..HEAD" 2>/dev/null)
    [ -n "$n" ] && echo "  Die Quelle ist $n Commits weiter als der Stand, gegen den das WIP"
    echo "  geprueft wurde. Nummern, Zeilenverweise und das PDF koennen abweichen."
    echo "  Delta und Vorgehen: QUELLE_v013.md"
    [ "$fehler" -eq 0 ] && fehler=2
fi

exit $fehler
