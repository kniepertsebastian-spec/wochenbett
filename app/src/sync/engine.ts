import type { AppDB, SyncState } from '../db/db'
import { EXPORT_FORMAT, EXPORT_VERSION, exportAll, importAll, type ExportFile } from '../db/privacy'
import { ApiError, type Api } from './api'
import {
  DEFAULT_KDF_ITERATIONS,
  decryptJson,
  deriveFromPassword,
  deriveFromRecoveryCode,
  encryptJson,
  generateDek,
  generateRecoveryCode,
  sha256Hex,
  toB64,
  randomBytes,
  unwrapDek,
  wrapDek,
} from './crypto'

export type SyncResult = 'idle' | 'pushed' | 'pulled' | 'conflict' | 'offline' | 'login_required' | 'error'

type SyncDeps = { db: AppDB; api: Api; iterations?: number }

/** Prüfsumme der synchronisierten Daten (ohne Export-Zeitstempel). */
async function snapshotHash(file: ExportFile): Promise<string> {
  return sha256Hex(JSON.stringify(file.data))
}
const isEmpty = (file: ExportFile) => Object.values(file.data).every((rows) => rows.length === 0)

export function createSync({ db, api, iterations = DEFAULT_KDF_ITERATIONS }: SyncDeps) {
  let running = false

  const state = () => db.syncState.get('me')
  const patch = (p: Partial<SyncState>) => db.syncState.update('me', p)

  async function applyServerBlob(s: SyncState, blob: string, version: number) {
    const file = await decryptJson<ExportFile>(s.dek, blob)
    if (file?.format !== EXPORT_FORMAT || file.version > EXPORT_VERSION) throw new Error('unsupported_snapshot')
    await importAll(db, file)
    await patch({ version, lastHash: await snapshotHash(await exportAll(db)), lastSyncAt: new Date().toISOString(), conflict: null, loginRequired: false })
  }

  async function push(s: SyncState, local: ExportFile, baseVersion: number): Promise<'pushed' | 'stale'> {
    const blob = await encryptJson(s.dek, local)
    try {
      const r = await api.putData(s.token, baseVersion, blob)
      await patch({ version: r.version, lastHash: await snapshotHash(local), lastSyncAt: new Date().toISOString(), conflict: null, loginRequired: false })
      return 'pushed'
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) return 'stale'
      throw e
    }
  }

  /** Gleicht lokalen Stand und Server ab. Bei Änderungen auf beiden Seiten wird nichts überschrieben (Konflikt). */
  async function syncNow(): Promise<SyncResult> {
    if (running) return 'idle'
    running = true
    try {
      const s = await state()
      if (!s) return 'idle'
      if (s.conflict) return 'conflict'
      try {
        const server = await api.getData(s.token)
        const local = await exportAll(db)
        const localHash = await snapshotHash(local)
        const localChanged = !isEmpty(local) && localHash !== s.lastHash
        const serverChanged = server.version > s.version

        if (!localChanged && !serverChanged) {
          await patch({ lastSyncAt: new Date().toISOString(), loginRequired: false })
          return 'idle'
        }
        if (!serverChanged) {
          const r = await push(s, local, s.version)
          if (r === 'pushed') return 'pushed'
          await patch({ conflict: { serverVersion: (await api.getData(s.token)).version } })
          return 'conflict'
        }
        if (!localChanged && server.blob) {
          await applyServerBlob(s, server.blob, server.version)
          return 'pulled'
        }
        await patch({ conflict: { serverVersion: server.version } })
        return 'conflict'
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) return 'offline'
        if (e instanceof ApiError && e.status === 401) {
          await patch({ loginRequired: true })
          return 'login_required'
        }
        return 'error'
      }
    } finally {
      running = false
    }
  }

  /** `server`: Stand vom Server übernehmen (lokale Änderungen gehen verloren). `local`: diesen Stand behalten und den Server überschreiben. */
  async function resolveConflict(choice: 'server' | 'local'): Promise<SyncResult> {
    const s = await state()
    if (!s?.conflict) return 'idle'
    try {
      const server = await api.getData(s.token)
      if (choice === 'server') {
        if (!server.blob) return 'error'
        await applyServerBlob(s, server.blob, server.version)
        return 'pulled'
      }
      const r = await push(s, await exportAll(db), server.version)
      if (r === 'pushed') return 'pushed'
      return 'conflict'
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) return 'offline'
      return 'error'
    }
  }

  async function saveLogin(username: string, token: string, dek: CryptoKey) {
    await db.syncState.put({ id: 'me', username, token, dek, version: 0, lastHash: null, conflict: null })
  }

  /** Neues Konto. Gibt den Wiederherstellungscode zurück, der der Nutzerin genau jetzt angezeigt werden muss. */
  async function register(username: string, password: string, inviteCode: string): Promise<{ recoveryCode: string }> {
    const salt = toB64(randomBytes(16))
    const pw = await deriveFromPassword(password, salt, iterations)
    const recoveryCode = generateRecoveryCode()
    const rec = await deriveFromRecoveryCode(recoveryCode)
    const dek = await generateDek()
    const wrappedDekPw = await wrapDek(dek, pw.wrapKey)
    const wrappedDekRecovery = await wrapDek(dek, rec.wrapKey)
    const r = await api.register({ username, inviteCode, salt, kdfIter: iterations, authKey: pw.authKey, recoveryAuth: rec.recoveryAuth, wrappedDekPw, wrappedDekRecovery })
    await saveLogin(username.trim().toLowerCase(), r.token, await unwrapDek(wrappedDekPw, pw.wrapKey))
    await syncNow() // lokale Daten sofort sichern
    return { recoveryCode }
  }

  async function login(username: string, password: string): Promise<SyncResult> {
    const name = username.trim().toLowerCase()
    const { salt, kdfIter } = await api.salt(name)
    const pw = await deriveFromPassword(password, salt, kdfIter)
    const r = await api.login(name, pw.authKey) // 401 bei falschem Passwort
    await saveLogin(name, r.token, await unwrapDek(r.wrappedDekPw, pw.wrapKey))
    return syncNow()
  }

  /** Erneut anmelden, ohne den lokalen Abgleichsstand zu verlieren (abgelaufene Sitzung). */
  async function relogin(password: string): Promise<SyncResult> {
    const s = await state()
    if (!s) return 'idle'
    const { salt, kdfIter } = await api.salt(s.username)
    const pw = await deriveFromPassword(password, salt, kdfIter)
    const r = await api.login(s.username, pw.authKey)
    await patch({ token: r.token, dek: await unwrapDek(r.wrappedDekPw, pw.wrapKey), loginRequired: false })
    return syncNow()
  }

  /** Passwort vergessen: mit Wiederherstellungscode Zugang zurückholen und neues Passwort setzen. */
  async function recover(username: string, recoveryCode: string, newPassword: string): Promise<SyncResult> {
    const name = username.trim().toLowerCase()
    const rec = await deriveFromRecoveryCode(recoveryCode)
    const r = await api.recover(name, rec.recoveryAuth)
    const dek = await unwrapDek(r.wrappedDekRecovery, rec.wrapKey, true)
    const salt = toB64(randomBytes(16))
    const pw = await deriveFromPassword(newPassword, salt, iterations)
    const wrappedDekPw = await wrapDek(dek, pw.wrapKey)
    await api.setCredentials(r.token, { authKey: pw.authKey, salt, kdfIter: iterations, wrappedDekPw })
    await saveLogin(name, r.token, await unwrapDek(wrappedDekPw, pw.wrapKey))
    return syncNow()
  }

  async function logout(): Promise<void> {
    const s = await state()
    if (s) await api.logout(s.token).catch(() => {})
    await db.syncState.delete('me')
  }

  /** Löscht das Konto und alle Daten auf dem Server (lokale Daten bleiben). */
  async function deleteServerAccount(password: string): Promise<void> {
    const s = await state()
    if (!s) return
    const { salt, kdfIter } = await api.salt(s.username)
    const pw = await deriveFromPassword(password, salt, kdfIter)
    await api.deleteAccount(s.token, pw.authKey)
    await db.syncState.delete('me')
  }

  return { syncNow, resolveConflict, register, login, relogin, recover, logout, deleteServerAccount }
}

export type SyncClient = ReturnType<typeof createSync>
