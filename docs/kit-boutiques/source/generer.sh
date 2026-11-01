#!/bin/sh
# Regénère les PDF du kit boutiques à partir des pages HTML de ce dossier.
# Usage : sh docs/kit-boutiques/source/generer.sh
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for nom in guide-vendeur fiche-comptoir; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 \
    --print-to-pdf="$ICI/../$nom.pdf" \
    "$(python3 -I -c 'import pathlib, sys; print(pathlib.Path(sys.argv[1]).as_uri())' "$ICI/$nom.html")" 2>/dev/null
  echo "$nom.pdf"
done
