# Sync & Sicherung

Optionale Synchronisation, damit die Historie beim Gerätewechsel erhalten bleibt. Ohne Konto arbeitet die App unverändert lokal und offline.

## Warum diese Lösung

Die App speichert Gesundheitsdaten (besondere Kategorie nach DSGVO Art. 9). Deshalb ist der Server bewusst **nicht vertrauenswürdig gebaut**: Er sieht nie Klartext.

- Die Daten werden **im Browser** mit einem zufälligen Datenschlüssel (AES-GCM) verschlüsselt, bevor sie hochgeladen werden.
- Der Datenschlüssel wird zweimal verpackt auf dem Server abgelegt: mit einem aus dem **Passwort** abgeleiteten Schlüssel (PBKDF2, 600.000 Runden) und mit einem **Wiederherstellungscode** (128 Bit, wird beim Anlegen einmalig angezeigt).
- Aus dem Passwort entstehen zwei getrennte Werte: einer zum Anmelden (geht zum Server, dort nochmals mit scrypt gehasht) und einer zum Entschlüsseln (bleibt im Browser). Das Passwort selbst verlässt das Gerät nie.
- Der entpackte Datenschlüssel ist im Browser nicht exportierbar (`extractable: false`).

Folge: **Weder der Betreiber noch ein Angreifer mit Zugriff auf die Datenbank kann die Daten lesen.** Zugleich kann niemand das Passwort zurücksetzen. Genau das erklärt die App den Nutzerinnen deutlich (siehe `app/src/sync/SyncInfo.tsx`): Passwort aufschreiben oder in einem Passwortmanager speichern, Wiederherstellungscode getrennt aufbewahren, ab und zu exportieren.

## Ablauf

- **Anlegen:** Mehr → Sync & Sicherung → Konto anlegen. Name, Passwort, Einladungscode. Danach wird der Wiederherstellungscode einmalig gezeigt (kopieren, als Datei speichern); die Seite warnt, bevor man sie vorher verlässt.
- **Neues Gerät:** In der Willkommensansicht „Ich habe schon ein Sync-Konto“ oder unter Mehr → Sync & Sicherung anmelden. Die Daten werden geladen.
- **Im Alltag:** Änderungen werden nach wenigen Sekunden automatisch hochgeladen; beim Öffnen, bei Internet und alle 60 Sekunden wird abgeglichen.
- **Konflikt:** Wurde auf zwei Geräten verschieden geändert, überschreibt die App nichts, sondern fragt, welcher Stand gelten soll.
- **Passwort vergessen:** Mit dem Wiederherstellungscode ein neues Passwort setzen. Ohne Code ist nichts zu retten.
- **Lokal löschen** meldet vom Sync ab (damit ein leerer Stand nie den Server überschreibt). Nach erneutem Anmelden sind die Daten wieder da.
- **Konto löschen:** entfernt alle Daten auf dem Server (Passwort zur Bestätigung).

## Betrieb

Der Dienst liegt in `server/` (Node 22 ohne Fremdpakete, SQLite in einem Docker-Volume) und läuft im Compose-Stack als `api`. Nginx der App leitet `/api` dorthin; am Tunnel ändert sich nichts.

```bash
# .env
INVITE_CODE=<langer zufälliger Wert>     # ohne Wert kann sich niemand registrieren

docker compose up -d --build
```

- Den Einladungscode gibst du nur den Personen, die ein Konto anlegen sollen. Danach kannst du ihn in `.env` leeren und neu starten, dann sind neue Konten gesperrt.
- **Backup:** Das Volume `wochenbett-data` enthält nur verschlüsselte Daten; ein Backup (`docker run --rm -v wochenbett_wochenbett-data:/data -v $PWD:/b alpine tar czf /b/wochenbett-data.tgz /data`) ist trotzdem sinnvoll. Die Daten sind ohne Passwort bzw. Code nutzlos, auch für dich.
- Schutz vor Raten: Anmelde-, Registrier- und Wiederherstellungsversuche sind pro IP und pro Name begrenzt.
- Logs enthalten nur Registrierungen (Name), keine Inhalte.

## Grenzen

- Pro Konto ein Datenstand (ein verschlüsselter Block, max. 5 MB). Es gibt kein Zusammenführen einzelner Einträge, bei Konflikten wählt die Nutzerin.
- Ein Passwort ändern geht über die Wiederherstellung (Code nötig); eine Funktion „Passwort ändern“ bei bekanntem Passwort ist nicht vorhanden.
- Sicherheit der Passwörter hängt von der Länge ab: Wer die Datenbank stiehlt, kann Passwörter offline raten. Darum mindestens 12 Zeichen, besser ein Satz.
