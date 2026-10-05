import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createApp } from './app.mjs'

const port = Number(process.env.PORT ?? 3000)
const dbPath = process.env.DB_PATH ?? '/data/wochenbett.sqlite'
const inviteCode = process.env.INVITE_CODE ?? ''
mkdirSync(dirname(dbPath), { recursive: true })

const { server } = createApp({ dbPath, inviteCode, logger: (...a) => console.log(new Date().toISOString(), ...a) })
server.listen(port, '0.0.0.0', () => {
  console.log(`Sync-Server läuft auf Port ${port}. Registrierung: ${inviteCode ? 'mit Einladungscode' : 'GESCHLOSSEN (INVITE_CODE nicht gesetzt)'}`)
})
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)))
