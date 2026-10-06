# Rückbildung – PWA für den Wiedereinstieg nach der Geburt

Offline-fähige Progressive Web App, die Übungen, Recovery, Beckenboden-Wahrnehmung, Alltagstipps und Rezepte anbietet und dabei erkennt, wann Pause oder Fachabklärung sinnvoller ist als Training. Keine Diagnostik- oder Therapie-App. Siehe [`roadmap.md`](roadmap.md) für Konzept und Stand (die ältere technische Roadmap liegt unter [`docs/roadmap-archiv-v1.md`](docs/roadmap-archiv-v1.md)).

> **Wichtig:** Alle medizinischen Inhalte (Übungen, Kontraindikationen, Red Flags, Ernährung) sind **Entwürfe** und nicht fachlich geprüft (`status: 'draft'`). Vor echter Nutzung müssen Hebamme, Beckenboden-Physiotherapeutin und ggf. Gynäkologin sie prüfen, siehe [`docs/content-governance.md`](docs/content-governance.md).

## Entwicklung

```bash
cd app
npm install
npm run dev        # Entwicklungsserver
npm run check      # Typecheck, Lint, Unit-Tests
npm run build      # Produktions-Build inkl. Service Worker
```

### Browser-Tests (Playwright + axe)

```bash
npm run build && npx vite preview --port 4173 &   # in app/
CHROMIUM_PATH=/pfad/zu/chromium npm run e2e       # Standard: /opt/pw-browsers/chromium
```

Prüft Kernablauf, Offline-Betrieb, Features, Touch-Flächen/Reduced Motion und WCAG-2-AA (axe, hell/dunkel).

## Aufbau der App

- **Heute** ist der Einstieg: Mini-Check-in (Energie, „etwas auffällig?“, letzte Einheit), direkt darunter eine Empfehlung mit Begründung, Kontext („Was ist gerade möglich?“) und höchstens zwei Alternativen. Bei Warnzeichen steht stattdessen ein eindeutiger nächster Schritt.
- **Übungen**, **Mein Weg** (Entwicklung statt Leistung, Ziele, Meilensteine) und **Mehr** (nach Lebenssituation gruppiert: „Ist das normal?“, Wohlbefinden, Rezepte, Termine, Daten, Sync, Prüfstatus).
- Erfolgsmetriken und warum es kein Tracking gibt: [`docs/metrics.md`](docs/metrics.md).

## Architektur

```
UI (src/pages, src/components)
 → Recommendation Engine (src/engine: Red Flags, Readiness, Eignung, Progression, Empfehlung)
   → Domain-Modell (src/domain) + Inhalte (src/content)
     → Lokale Persistenz (src/db, Dexie/IndexedDB, versionierte Schemas)
       → PWA/Service Worker (vite-plugin-pwa)
```

Die UI entscheidet nie selbst, ob eine Übung erlaubt ist; das macht `recommend()` zentral und fail-closed.

## Sync (optional)

Verschlüsselte Synchronisation für den Gerätewechsel: [`docs/sync.md`](docs/sync.md). Server in `server/` (Tests: `cd server && npm test`).

## Betrieb

Docker + Nginx + optional Cloudflare Tunnel: siehe [`docs/deployment.md`](docs/deployment.md).

```bash
docker compose up -d --build                 # http://127.0.0.1:18080
docker compose --profile tunnel up -d --build  # zusätzlich Cloudflare Tunnel (TUNNEL_TOKEN in .env)
```

## Inhalte erweitern

- Übungen: `app/src/content/exercises.ts` (jede Übung braucht Erklärung `why`, Sicherheitsangaben, Regression; `bedFriendly` für Bett-Übungen, `requires` für Trainingsmittel, optional `media`). `npm run check` prüft Vollständigkeit.
- Bilder/Videos: Dateien unter `app/public/media/` ablegen und in `media` der Übung eintragen. Sie werden vom Service Worker offline gecacht.

## Datenschutz

Alle Gesundheitsdaten bleiben lokal im Browser (IndexedDB). Optional können sie Ende-zu-Ende-verschlüsselt synchronisiert werden; der Server sieht nie Klartext. Keine Registrierung, keine Analytics, keine Daten in URLs. Export/Import/Löschen unter *Mehr → Einstellungen*. Die Seite ist per `robots.txt`/`noindex` von Suchmaschinen ausgeschlossen.
