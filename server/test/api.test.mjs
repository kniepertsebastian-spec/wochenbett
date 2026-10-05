import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../app.mjs'

let app, base
before(async () => {
  app = createApp({ inviteCode: 'geheim' })
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${app.server.address().port}/api`
})
after(() => app.close())

const b64 = (n) => Buffer.alloc(n, 7).toString('base64')
const reg = (over = {}) => ({
  username: 'Anna', inviteCode: 'geheim', salt: b64(16), kdfIter: 1000, authKey: b64(32), recoveryAuth: b64(32),
  wrappedDekPw: '{"iv":"a","ct":"b"}', wrappedDekRecovery: '{"iv":"c","ct":"d"}', ...over,
})
async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers }
}

describe('Sync-Server', () => {
  it('Registrierung braucht den Einladungscode', async () => {
    assert.equal((await call('POST', '/register', reg({ inviteCode: 'falsch' }))).status, 403)
    const ok = await call('POST', '/register', reg())
    assert.equal(ok.status, 201)
    assert.ok(ok.body.token)
    assert.equal((await call('POST', '/register', reg())).status, 409) // Name vergeben (Groß/Klein egal)
  })

  it('Login nur mit richtigem Auth-Wert, Antwort enthält nur verschlüsselte Daten', async () => {
    assert.equal((await call('POST', '/login', { username: 'anna', authKey: b64(31) })).status, 401)
    assert.equal((await call('POST', '/login', { username: 'unbekannt', authKey: b64(32) })).status, 401)
    const r = await call('POST', '/login', { username: 'ANNA', authKey: b64(32) })
    assert.equal(r.status, 200)
    assert.equal(r.body.wrappedDekPw, '{"iv":"a","ct":"b"}')
    assert.ok(!JSON.stringify(r.body).includes('authKey'))
  })

  it('Salt: bekannter Nutzer echter Salt, unbekannter stabiler Fake-Salt', async () => {
    const a = await call('GET', '/salt?username=anna')
    assert.equal(a.body.salt, b64(16))
    const x1 = await call('GET', '/salt?username=niemand')
    const x2 = await call('GET', '/salt?username=niemand')
    assert.equal(x1.body.salt, x2.body.salt)
    assert.notEqual(x1.body.salt, a.body.salt)
  })

  it('Daten: Versionierung, Konflikt bei veralteter Basis, Auth erforderlich', async () => {
    assert.equal((await call('GET', '/data')).status, 401)
    const { body: { token } } = await call('POST', '/login', { username: 'anna', authKey: b64(32) })
    const empty = await call('GET', '/data', undefined, token)
    assert.deepEqual([empty.body.version, empty.body.blob], [0, null])
    const p1 = await call('PUT', '/data', { baseVersion: 0, blob: 'AAA' }, token)
    assert.deepEqual([p1.status, p1.body.version], [200, 1])
    const stale = await call('PUT', '/data', { baseVersion: 0, blob: 'BBB' }, token)
    assert.deepEqual([stale.status, stale.body.version], [409, 1])
    assert.equal((await call('GET', '/data', undefined, token)).body.blob, 'AAA')
    assert.equal((await call('PUT', '/data', { baseVersion: 1, blob: 'CCC' }, token)).body.version, 2)
  })

  it('Nutzer sehen nur ihre eigenen Daten', async () => {
    await call('POST', '/register', reg({ username: 'berta', authKey: b64(33) }))
    const t = (await call('POST', '/login', { username: 'berta', authKey: b64(33) })).body.token
    assert.equal((await call('GET', '/data', undefined, t)).body.blob, null)
  })

  it('Wiederherstellung setzt neues Passwort, beendet andere Sitzungen', async () => {
    const old = (await call('POST', '/login', { username: 'anna', authKey: b64(32) })).body.token
    assert.equal((await call('POST', '/recover', { username: 'anna', recoveryAuth: b64(31) })).status, 401)
    const rec = await call('POST', '/recover', { username: 'anna', recoveryAuth: b64(32) })
    assert.equal(rec.status, 200)
    assert.equal(rec.body.wrappedDekRecovery, '{"iv":"c","ct":"d"}')
    const newAuth = Buffer.alloc(32, 9).toString('base64')
    const up = await call('PUT', '/credentials', { authKey: newAuth, salt: b64(16), kdfIter: 1000, wrappedDekPw: '{"iv":"n","ct":"w"}' }, rec.body.token)
    assert.equal(up.status, 200)
    assert.equal((await call('GET', '/data', undefined, old)).status, 401) // alte Sitzung beendet
    assert.equal((await call('POST', '/login', { username: 'anna', authKey: b64(32) })).status, 401) // altes Passwort ungültig
    assert.equal((await call('POST', '/login', { username: 'anna', authKey: newAuth })).status, 200)
  })

  it('Konto löschen braucht Auth-Wert und entfernt alles', async () => {
    const t = (await call('POST', '/login', { username: 'berta', authKey: b64(33) })).body.token
    assert.equal((await call('DELETE', '/account', { authKey: b64(1) }, t)).status, 401)
    assert.equal((await call('DELETE', '/account', { authKey: b64(33) }, t)).status, 200)
    assert.equal((await call('POST', '/login', { username: 'berta', authKey: b64(33) })).status, 401)
  })

  it('Eingaben werden geprüft, Antworten nie gecacht', async () => {
    assert.equal((await call('POST', '/register', reg({ username: 'a b' }))).status, 400)
    assert.equal((await call('POST', '/register', reg({ username: 'carla', salt: '###' }))).status, 400)
    const h = await call('GET', '/health')
    assert.equal(h.headers.get('cache-control'), 'no-store')
    assert.equal((await call('GET', '/gibtsnicht')).status, 404)
  })

  it('Ohne INVITE_CODE ist die Registrierung geschlossen', async () => {
    const closed = createApp({ inviteCode: '' })
    await new Promise((r) => closed.server.listen(0, '127.0.0.1', r))
    const res = await fetch(`http://127.0.0.1:${closed.server.address().port}/api/register`, { method: 'POST', body: JSON.stringify(reg({ inviteCode: '' })) })
    assert.equal(res.status, 403)
    await closed.close()
  })

  it('Rate Limit bremst wiederholte Anmeldeversuche', async () => {
    let last = 0
    for (let i = 0; i < 15; i++) last = (await call('POST', '/login', { username: 'ratelimit', authKey: b64(32) })).status
    assert.equal(last, 429)
  })
})
