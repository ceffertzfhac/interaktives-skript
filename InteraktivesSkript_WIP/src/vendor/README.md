# src/vendor — mitgelieferte Fremdbibliotheken

Hier liegen Fremdbibliotheken **unverändert** (byte-identisch zur Quelle), damit
ihre Prüfsumme jederzeit nachrechenbar bleibt. Kein Build, kein Paketmanager —
die Dateien werden direkt per `<script src="…">` aus `index.html` geladen.

## qrjs2.min.js

| | |
|---|---|
| Zweck | QR-Codes im Druckpfad (`src/print.js::create_qr`, global `window.QRCode`) |
| Version | 0.1.12 |
| Quelle | <https://github.com/englishextra/qrjs2> (Tag `v0.1.12`, `js/qrjs2.min.js`) |
| Lizenz | MIT |
| SHA-384 | `e4gASyw+jQf1odtGlku0cODb6r8lWrOS/ciIXB3GEROyTCsfOVzUjdRXACbcDYk4` |

**Warum lokal statt CDN:** die Einbindung lief bis Juli 2026 über
`cdn.jsdelivr.net` mit `integrity="sha384-dGptHqaP5AGRc3+qdh8CmS8E2WEAs/swpat25AVKvKjdC/uoH5WSAhnk0yAZQjmv"`.
Dieser Hash passte nicht (mehr) zum ausgelieferten Skript — der Browser
blockierte die Datei, `window.QRCode` blieb undefiniert und die QR-Codes im
Ausdruck fehlten ersatzlos. Die ausgelieferten Bytes selbst sind echt: jsDelivr
und `raw.githubusercontent.com` (Tag `v0.1.12` **und** `master`) liefern
byte-identisch dieselben 9480 Bytes mit obigem SHA-384; der gepinnte Hash war
also schlicht falsch bzw. veraltet.

Lokal abgelegt entfällt diese ganze Fehlerklasse: kein Netz nötig, keine
Hash-Drift, die Version ist versioniert und reviewbar.

**Aktualisieren:** Datei neu herunterladen, `openssl dgst -sha384 -binary
src/vendor/qrjs2.min.js | openssl base64 -A` rechnen, Version + Prüfsumme oben
eintragen, Druckpfad testen (`?print=true`, QR pro Grafik-Container).
