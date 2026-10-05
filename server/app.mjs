import crypto from 'node:crypto'
import http from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)

const MAX_BODY = 6 * 1024 * 1024 // verschlüsselter Datenblock
const MAX_BLOB = 5 * 1024 * 1024
const SESSION_MS = 90 * 24 * 3600 * 1000
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/

const sha256hex = (s) => crypto.createHash('sha256').update(s).digest('hex')
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

class HttpError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

/**
 * Sync-Server. Er sieht nie Klartext: Daten und Schlüssel liegen nur verschlüsselt vor.
 * Das Passwort (bzw. der Wiederherstellungscode) verlässt den Browser nie, nur davon abgeleitete Werte.
 */
export function createApp({ dbPath = ':memory:', inviteCode = '', now = () => Date.now(), logger = () => {} } = {}) {
  const db = new DatabaseSync(dbPath)
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL;')
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      kdf_iter INTEGER NOT NULL,
      auth_salt TEXT NOT NULL,
      auth_hash TEXT NOT NULL,
      wrapped_dek_pw TEXT NOT NULL,
      wrapped_dek_recovery TEXT NOT NULL,
      recovery_salt TEXT NOT NULL,
      recovery_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS data (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      blob TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
  `)

  // Geheimnis für gefälschte Salts (verhindert Nutzernamen-Abfrage über /salt)
  let secret = db.prepare("SELECT value FROM meta WHERE key = 'secret'").get()?.value
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex')
    db.prepare("INSERT INTO meta (key, value) VALUES ('secret', ?)").run(secret)
  }

  // ---------- Rate Limiting (im Speicher, reicht für wenige Nutzer) ----------
  const hits = new Map()
  function limited(key, max, windowMs) {
    const t = now()
    const list = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
    list.push(t)
    hits.set(key, list)
    return list.length > max
  }
  const clientIp = (req) => req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown'
  function throttle(req, username) {
    if (limited(`ip:${clientIp(req)}`, 40, 10 * 60 * 1000)) throw new HttpError(429, 'too_many_requests')
    if (username && limited(`user:${username}`, 12, 10 * 60 * 1000)) throw new HttpError(429, 'too_many_requests')
  }

  // ---------- Hilfen ----------
  const normUser = (u) => String(u ?? '').trim().toLowerCase()
  function requireString(v, name, max = 4096) {
    if (typeof v !== 'string' || v.length === 0 || v.length > max) throw new HttpError(400, `invalid_${name}`)
    return v
  }
  const requireB64 = (v, name, max = 200) => {
    requireString(v, name, max)
    if (!B64_RE.test(v)) throw new HttpError(400, `invalid_${name}`)
    return v
  }
  async function hashSecret(value, saltHex) {
    return (await scrypt(value, Buffer.from(saltHex, 'hex'), 32, { N: 16384, r: 8, p: 1 })).toString('hex')
  }
  const fakeSalt = (username) => crypto.createHmac('sha256', secret).update(`salt:${username}`).digest().subarray(0, 16).toString('base64')

  function newSession(userId) {
    const token = crypto.randomBytes(32).toString('base64url')
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256hex(token), userId, now() + SESSION_MS)
    return token
  }
  function authed(req) {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')
    if (!m) throw new HttpError(401, 'unauthorized')
    const row = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').get(sha256hex(m[1]))
    if (!row || row.expires_at < now()) throw new HttpError(401, 'unauthorized')
    return { userId: row.user_id, tokenHash: sha256hex(m[1]) }
  }

  async function readJson(req) {
    const chunks = []
    let size = 0
    for await (const c of req) {
      size += c.length
      if (size > MAX_BODY) throw new HttpError(413, 'too_large')
      chunks.push(c)
    }
    if (size === 0) return {}
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      throw new HttpError(400, 'invalid_json')
    }
  }

  function send(res, status, body) {
    const text = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    res.end(text)
  }

  // ---------- Routen ----------
  async function route(req, res) {
    const url = new URL(req.url ?? '/', 'http://x')
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const key = `${req.method} ${path}`

    switch (key) {
      case 'GET /health':
        return send(res, 200, { ok: true })

      case 'GET /config':
        return send(res, 200, { registrationOpen: inviteCode !== '' })

      case 'GET /salt': {
        const username = normUser(url.searchParams.get('username'))
        throttle(req, null)
        const u = db.prepare('SELECT salt, kdf_iter FROM users WHERE username = ?').get(username)
        // Unbekannte Nutzer bekommen einen stabilen, gefälschten Salt, damit man Namen nicht abfragen kann
        return send(res, 200, u ? { salt: u.salt, kdfIter: u.kdf_iter } : { salt: fakeSalt(username), kdfIter: 600000 })
      }

      case 'POST /register': {
        const b = await readJson(req)
        const username = normUser(b.username)
        throttle(req, username)
        if (inviteCode === '') throw new HttpError(403, 'registration_closed')
        if (!safeEqual(requireString(b.inviteCode, 'inviteCode', 200), inviteCode)) throw new HttpError(403, 'invalid_invite')
        if (!USERNAME_RE.test(username)) throw new HttpError(400, 'invalid_username')
        const salt = requireB64(b.salt, 'salt')
        const kdfIter = Number(b.kdfIter)
        if (!Number.isInteger(kdfIter) || kdfIter < 1000 || kdfIter > 5_000_000) throw new HttpError(400, 'invalid_kdfIter')
        const authKey = requireB64(b.authKey, 'authKey')
        const recoveryAuth = requireB64(b.recoveryAuth, 'recoveryAuth')
        const wrappedDekPw = requireString(b.wrappedDekPw, 'wrappedDekPw', 2000)
        const wrappedDekRecovery = requireString(b.wrappedDekRecovery, 'wrappedDekRecovery', 2000)
        if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) throw new HttpError(409, 'username_taken')
        const authSalt = crypto.randomBytes(16).toString('hex')
        const recoverySalt = crypto.randomBytes(16).toString('hex')
        const authHash = await hashSecret(authKey, authSalt)
        const recoveryHash = await hashSecret(recoveryAuth, recoverySalt)
        const r = db
          .prepare('INSERT INTO users (username, salt, kdf_iter, auth_salt, auth_hash, wrapped_dek_pw, wrapped_dek_recovery, recovery_salt, recovery_hash, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .run(username, salt, kdfIter, authSalt, authHash, wrappedDekPw, wrappedDekRecovery, recoverySalt, recoveryHash, now())
        logger('register', username)
        return send(res, 201, { token: newSession(Number(r.lastInsertRowid)), version: 0 })
      }

      case 'POST /login': {
        const b = await readJson(req)
        const username = normUser(b.username)
        throttle(req, username)
        const authKey = requireB64(b.authKey, 'authKey')
        const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
        // Auch bei unbekanntem Nutzer rechnen, damit die Antwortzeit nichts verrät
        const hash = await hashSecret(authKey, u?.auth_salt ?? '00'.repeat(16))
        if (!u || !safeEqual(hash, u.auth_hash)) throw new HttpError(401, 'invalid_credentials')
        const v = db.prepare('SELECT version FROM data WHERE user_id = ?').get(u.id)?.version ?? 0
        return send(res, 200, { token: newSession(u.id), wrappedDekPw: u.wrapped_dek_pw, version: v })
      }

      case 'POST /recover': {
        const b = await readJson(req)
        const username = normUser(b.username)
        throttle(req, username)
        const recoveryAuth = requireB64(b.recoveryAuth, 'recoveryAuth')
        const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
        const hash = await hashSecret(recoveryAuth, u?.recovery_salt ?? '00'.repeat(16))
        if (!u || !safeEqual(hash, u.recovery_hash)) throw new HttpError(401, 'invalid_credentials')
        return send(res, 200, { token: newSession(u.id), wrappedDekRecovery: u.wrapped_dek_recovery })
      }

      case 'PUT /credentials': {
        const { userId, tokenHash } = authed(req)
        const b = await readJson(req)
        const authKey = requireB64(b.authKey, 'authKey')
        const salt = requireB64(b.salt, 'salt')
        const kdfIter = Number(b.kdfIter)
        if (!Number.isInteger(kdfIter) || kdfIter < 1000 || kdfIter > 5_000_000) throw new HttpError(400, 'invalid_kdfIter')
        const wrappedDekPw = requireString(b.wrappedDekPw, 'wrappedDekPw', 2000)
        const authSalt = crypto.randomBytes(16).toString('hex')
        const authHash = await hashSecret(authKey, authSalt)
        db.prepare('UPDATE users SET salt = ?, kdf_iter = ?, auth_salt = ?, auth_hash = ?, wrapped_dek_pw = ? WHERE id = ?').run(salt, kdfIter, authSalt, authHash, wrappedDekPw, userId)
        // Alle anderen Sitzungen beenden (z. B. falls das alte Passwort gestohlen war)
        db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, tokenHash)
        return send(res, 200, { ok: true })
      }

      case 'GET /data': {
        const { userId } = authed(req)
        const d = db.prepare('SELECT version, blob, updated_at FROM data WHERE user_id = ?').get(userId)
        return send(res, 200, d ? { version: d.version, blob: d.blob, updatedAt: d.updated_at } : { version: 0, blob: null, updatedAt: null })
      }

      case 'PUT /data': {
        const { userId } = authed(req)
        const b = await readJson(req)
        const base = Number(b.baseVersion)
        if (!Number.isInteger(base) || base < 0) throw new HttpError(400, 'invalid_baseVersion')
        const blob = requireString(b.blob, 'blob', MAX_BLOB)
        const cur = db.prepare('SELECT version FROM data WHERE user_id = ?').get(userId)?.version ?? 0
        if (cur !== base) return send(res, 409, { error: 'version_conflict', version: cur })
        const next = cur + 1
        db.prepare('INSERT INTO data (user_id, version, blob, updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET version = excluded.version, blob = excluded.blob, updated_at = excluded.updated_at').run(userId, next, blob, now())
        return send(res, 200, { version: next })
      }

      case 'POST /logout': {
        const { tokenHash } = authed(req)
        db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash)
        return send(res, 200, { ok: true })
      }

      case 'DELETE /account': {
        const { userId } = authed(req)
        const b = await readJson(req)
        const authKey = requireB64(b.authKey, 'authKey')
        const u = db.prepare('SELECT auth_salt, auth_hash FROM users WHERE id = ?').get(userId)
        throttle(req, `del:${userId}`)
        if (!u || !safeEqual(await hashSecret(authKey, u.auth_salt), u.auth_hash)) throw new HttpError(401, 'invalid_credentials')
        db.prepare('DELETE FROM users WHERE id = ?').run(userId) // Daten und Sitzungen per CASCADE
        return send(res, 200, { ok: true })
      }

      default:
        throw new HttpError(404, 'not_found')
    }
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((e) => {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code })
      logger('error', e?.message)
      send(res, 500, { error: 'server_error' })
    })
  })
  // Abgelaufene Sitzungen regelmäßig entfernen
  const cleanup = setInterval(() => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now()), 3600_000)
  cleanup.unref()

  return {
    server,
    db,
    close: () =>
      new Promise((resolve) => {
        clearInterval(cleanup)
        server.close(() => {
          db.close()
          resolve()
        })
        server.closeAllConnections?.()
      }),
  }
}
