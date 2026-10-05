# Rückbildung – PWA für den Wiedereinstieg nach der Geburt

Offline-fähige Progressive Web App, die Übungen, Recovery, Beckenboden-Wahrnehmung, Alltagstipps und Rezepte anbietet und dabei erkennt, wann Pause oder Fachabklärung sinnvoller ist als Training. Keine Diagnostik- oder Therapie-App. Siehe [`roadmap.md`](roadmap.md) für Konzept und Stand.

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

## Architektur

```
UI (src/pages, src/components)
 → Recommendation Engine (src/engine: Red Flags, Readiness, Eignung, Progression, Empfehlung)
   → Domain-Modell (src/domain) + Inhalte (src/content)
     → Lokale Persistenz (src/db, Dexie/IndexedDB, versionierte Schemas)
       → PWA/Service Worker (vite-plugin-pwa)
```

Die UI entscheidet nie selbst, ob eine Übung erlaubt ist; das macht `recommend()` zentral und fail-closed.

## Betrieb

Docker + Nginx + optional Cloudflare Tunnel: siehe [`docs/deployment.md`](docs/deployment.md).

```bash
docker compose up -d --build                 # http://127.0.0.1:18080
docker compose --profile tunnel up -d --build  # zusätzlich Cloudflare Tunnel (TUNNEL_TOKEN in .env)
```

## Datenschutz

Alle Gesundheitsdaten bleiben lokal im Browser (IndexedDB). Keine Registrierung, keine Analytics, keine Daten in URLs. Export/Import/Löschen unter *Mehr → Einstellungen*. Die Seite ist per `robots.txt`/`noindex` von Suchmaschinen ausgeschlossen.
