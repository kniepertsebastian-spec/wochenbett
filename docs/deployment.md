# Deployment (Docker + Cloudflare Tunnel)

## Lokal / Mini-PC

```bash
docker compose up -d --build        # App auf http://127.0.0.1:8080
```

Der Container ist ein Multi-Stage-Build (Node baut, Nginx Alpine liefert statisch aus). Nginx setzt SPA-Fallback, Caching-Regeln und Security-Header (`app/nginx.conf`, `app/security-headers.conf`).

| Datei | Cache |
|-------|-------|
| `/assets/*` (gehasht) | 1 Jahr, immutable |
| `/sw.js`, `/manifest.webmanifest`, HTML | `no-cache` (immer revalidieren, damit Updates ankommen) |
| `/icons/*` | 1 Woche |

## Von außen erreichbar: Cloudflare Tunnel

Der Tunnel baut eine ausgehende Verbindung zu Cloudflare auf. Es sind **keine Portfreigaben am Router** nötig, und HTTPS (auch das für PWA/Service Worker erforderliche) terminiert Cloudflare.

1. Cloudflare Zero Trust → Networks → Tunnels → Tunnel erstellen (Typ *Cloudflared*), Token kopieren.
2. Im Tunnel einen *Public Hostname* anlegen: Domain/Subdomain → Service `http://app:80`.
3. `.env.example` nach `.env` kopieren und `TUNNEL_TOKEN` eintragen (`.env` ist per `.gitignore` ausgeschlossen).
4. `docker compose --profile tunnel up -d --build`

Voraussetzung: eine Domain, die bei Cloudflare verwaltet wird. Ohne eigene Domain ist nur ein temporärer Quick Tunnel (`cloudflared tunnel --url http://localhost:8080`, wechselnde `trycloudflare.com`-URL) möglich, der sich für eine dauerhaft installierte PWA nicht eignet.

## Hinweise

- HSTS und HTTP→HTTPS-Redirect übernimmt Cloudflare (SSL/TLS-Modus *Full*, "Always Use HTTPS" aktivieren).
- Hinter Cloudflare Access lässt sich die App zusätzlich auf bestimmte Personen beschränken.
- Konfiguration wurde mit `nginx -t` und einem Header-Test geprüft; der Docker-Build selbst konnte in der Entwicklungsumgebung (kein Docker-Daemon) nicht ausgeführt werden.
