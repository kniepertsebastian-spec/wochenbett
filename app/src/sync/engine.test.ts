import 'fake-indexeddb/auto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// Echter Server (nur im Test, im Speicher), damit Verschlüsselung und Protokoll zusammen geprüft werden
// @ts-expect-error JavaScript-Modul außerhalb von src ohne Typen
import { createApp } from '../../../server/app.mjs'
import { AppDB } from '../db/db'
import { createApi } from './api'
import { classifyError, createSync } from './engine'
import { ApiError } from './api'
import { syncProblemHelp } from './messages'

type TestApp = {
  server: { listen: (port: number, host: string, cb: () => void) => void; address: () => unknown }
  db: { prepare: (s: string) => { all: () => { blob: string }[]; run: (...a: unknown[]) => unknown } }
  close: () => Promise<void>
}
let app: TestApp
let base: string
beforeAll(async () => {
  app = createApp({ inviteCode: 'einladung' })
  await new Promise<void>((r) => app.server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}/api`
})
afterAll(() => app.close())

let n = 0
const device = (iterations = 1000) => {
  const db = new AppDB(`sync-test-${n++}`)
  return { db, sync: createSync({ db, api: createApi(base), iterations }) }
}
const profile = (note: string) => ({ id: 'me' as const, birthDate: '2026-09-01', birthType: 'vaginal' as const, medicalClearance: false, createdAt: note })
const workout = (d: string) => ({ date: d, kind: 'workout' as const, durationMin: 5, exerciseIds: ['a'], completedExerciseIds: ['a'], reaction: 'good' as const })

describe('Sync Ende-zu-Ende', () => {
  it('Konto anlegen, Daten sichern, auf neuem Gerät anmelden und Historie erhalten', async () => {
    const A = device()
    await A.db.userProfile.put(profile('GEHEIMER-MARKER-123'))
    await A.db.workoutHistory.add(workout('2026-10-01T08:00:00.000Z'))
    const { recoveryCode } = await A.sync.register('Anna', 'Hase Mond Kaffee Berg', 'einladung')
    expect(recoveryCode).toMatch(/^[A-Z2-7-]{32}$/)
    expect((await A.db.syncState.get('me'))?.version).toBe(1)

    // Der Server hat nur Verschlüsseltes gesehen
    const blobs = app.db.prepare('SELECT blob FROM data').all().map((r) => r.blob).join('')
    expect(blobs).not.toContain('GEHEIMER-MARKER-123')
    expect(blobs).not.toContain('workout')

    const B = device()
    expect(await B.sync.login('anna', 'Hase Mond Kaffee Berg')).toBe('pulled')
    expect((await B.db.userProfile.get('me'))?.createdAt).toBe('GEHEIMER-MARKER-123')
    expect(await B.db.workoutHistory.count()).toBe(1)
  })

  it('Änderungen wandern in beide Richtungen', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Berta', 'Tisch Lampe Regen Wolke', 'einladung')
    await B.sync.login('berta', 'Tisch Lampe Regen Wolke')
    await B.db.workoutHistory.add(workout('2026-10-02T08:00:00.000Z'))
    expect(await B.sync.syncNow()).toBe('pushed')
    expect(await A.sync.syncNow()).toBe('pulled')
    expect(await A.db.workoutHistory.count()).toBe(1)
    expect(await A.sync.syncNow()).toBe('idle')
  })

  it('Änderungen auf beiden Geräten: Konflikt, nichts geht verloren, Nutzerin entscheidet', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Carla', 'Brot Sonne Fluss Tal', 'einladung')
    await B.sync.login('carla', 'Brot Sonne Fluss Tal')
    await A.db.workoutHistory.add(workout('2026-10-03T08:00:00.000Z'))
    await B.db.workoutHistory.add(workout('2026-10-04T08:00:00.000Z'))
    expect(await A.sync.syncNow()).toBe('pushed')
    expect(await B.sync.syncNow()).toBe('conflict')
    expect(await B.db.workoutHistory.count()).toBe(1) // lokaler Stand unangetastet
    expect(await B.sync.syncNow()).toBe('conflict')
    expect(await B.sync.resolveConflict('local')).toBe('pushed')
    expect(await A.sync.syncNow()).toBe('pulled')
    expect((await A.db.workoutHistory.toArray())[0].date).toContain('2026-10-04')
  })

  it('Konflikt: Server-Stand übernehmen', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Dora', 'Berg Apfel Zug Hut', 'einladung')
    await B.sync.login('dora', 'Berg Apfel Zug Hut')
    await A.db.workoutHistory.add(workout('2026-10-05T08:00:00.000Z'))
    await B.db.workoutHistory.add(workout('2026-10-06T08:00:00.000Z'))
    await A.sync.syncNow()
    expect(await B.sync.syncNow()).toBe('conflict')
    expect(await B.sync.resolveConflict('server')).toBe('pulled')
    expect((await B.db.workoutHistory.toArray())[0].date).toContain('2026-10-05')
    expect(await B.sync.syncNow()).toBe('idle')
  })

  it('Leeres neues Gerät löst keinen Konflikt aus; falsches Passwort wird abgelehnt', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Emma', 'Wald Stein Boot Kerze', 'einladung')
    await expect(B.sync.login('emma', 'falsches passwort hier')).rejects.toMatchObject({ status: 401 })
    expect(await B.sync.login('emma', 'Wald Stein Boot Kerze')).toBe('pulled')
  })

  it('Passwort vergessen: Wiederherstellungscode setzt ein neues Passwort, Daten bleiben lesbar', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('WIEDER-DA'))
    const { recoveryCode } = await A.sync.register('Frida', 'Alt Passwort Satz lang', 'einladung')
    expect(await B.sync.recover('frida', 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX'.replace(/X/g, 'A'), 'Neu Passwort Satz lang').catch((e) => e.status ?? e.message)).toBeTruthy()
    expect(await B.sync.recover('frida', recoveryCode.toLowerCase(), 'Neu Passwort Satz lang')).toBe('pulled')
    expect((await B.db.userProfile.get('me'))?.createdAt).toBe('WIEDER-DA')
    const C = device()
    await expect(C.sync.login('frida', 'Alt Passwort Satz lang')).rejects.toMatchObject({ status: 401 })
    expect(await C.sync.login('frida', 'Neu Passwort Satz lang')).toBe('pulled')
  })

  it('Offline: kein Fehler, lokale Daten bleiben, später wird nachgeholt', async () => {
    const A = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Gerda', 'Fisch Nebel Tür Ziegel', 'einladung')
    const offline = createSync({ db: A.db, api: createApi('http://127.0.0.1:1/api'), iterations: 1000 })
    await A.db.workoutHistory.add(workout('2026-10-07T08:00:00.000Z'))
    expect(await offline.syncNow()).toBe('offline')
    expect(await A.sync.syncNow()).toBe('pushed')
  })

  it('Abmelden beendet die Synchronisation; Server-Konto löschen entfernt die Server-Daten', async () => {
    const A = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Hanna', 'Quelle Pferd Kuchen Bad', 'einladung')
    await A.sync.logout()
    expect(await A.db.syncState.get('me')).toBeUndefined()
    expect(await A.sync.syncNow()).toBe('idle')
    await A.sync.login('hanna', 'Quelle Pferd Kuchen Bad')
    await A.sync.deleteServerAccount('Quelle Pferd Kuchen Bad')
    await expect(A.sync.login('hanna', 'Quelle Pferd Kuchen Bad')).rejects.toMatchObject({ status: 401 })
    expect(await A.db.userProfile.count()).toBe(1) // lokal bleibt alles
  })

  it('Sync-Zustand wird nie exportiert', async () => {
    const A = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Ida', 'Garten Zeit Licht Brücke', 'einladung')
    const { exportAll } = await import('../db/privacy')
    expect(Object.keys((await exportAll(A.db)).data)).not.toContain('syncState')
  })

  it('Fehler werden verständlich eingeordnet und mit nächstem Schritt erklärt', async () => {
    const A = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Jule', 'Brücke Tasse Wiese Nacht', 'einladung')
    await A.db.workoutHistory.add(workout('2026-10-08T08:00:00.000Z'))
    const broken = (status: number) => createSync({ db: A.db, api: createApi(base, async (input, init) => (String(input).endsWith('/data') && init?.method === 'GET' ? new Response('{}', { status }) : fetch(input, init))), iterations: 1000 })
    expect(await broken(500).syncNow()).toBe('error')
    expect((await A.db.syncState.get('me'))?.lastError).toBe('server')
    expect(await broken(429).syncNow()).toBe('error')
    expect((await A.db.syncState.get('me'))?.lastError).toBe('rate_limited')
    // Nach einem erfolgreichen Abgleich ist der Fehler weg
    expect(await A.sync.syncNow()).toBe('pushed')
    expect((await A.db.syncState.get('me'))?.lastError ?? null).toBeNull()
    for (const p of Object.values(syncProblemHelp)) {
      expect(p.text.length).toBeGreaterThan(20)
      expect(p.action.length).toBeGreaterThan(20)
    }
  })

  it('Nicht entschlüsselbare Daten werden erkannt und führen zu Hilfe statt Absturz', async () => {
    const A = device(), B = device()
    await A.db.userProfile.put(profile('x'))
    await A.sync.register('Kira', 'Sonne Tisch Wolke Stein', 'einladung')
    await B.sync.login('kira', 'Sonne Tisch Wolke Stein')
    await A.db.workoutHistory.add(workout('2026-10-09T08:00:00.000Z'))
    await A.sync.syncNow()
    // Server-Daten durch Unlesbares ersetzen
    app.db.prepare("UPDATE data SET blob = '{\"v\":1,\"iv\":\"AAAAAAAAAAAAAAAA\",\"ct\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\"}' WHERE version >= 1").run()
    expect(await B.sync.syncNow()).toBe('error')
    expect((await B.db.syncState.get('me'))?.lastError).toBe('decrypt')
    expect(await B.db.userProfile.count()).toBe(1) // lokale Daten unangetastet
  })

  it('Fehlerklassen', () => {
    expect(classifyError(new ApiError(413, 'too_large'))).toBe('too_large')
    expect(classifyError(new ApiError(503, 'x'))).toBe('server')
    expect(classifyError(new Error('boom'))).toBe('unknown')
  })
})
