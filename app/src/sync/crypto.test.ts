import { describe, expect, it } from 'vitest'
import { decryptJson, deriveFromPassword, deriveFromRecoveryCode, encryptJson, generateDek, generateRecoveryCode, parseRecoveryCode, passwordProblem, toB64, unwrapDek, wrapDek } from './crypto'

const ITER = 1000 // nur für schnelle Tests

describe('Verschlüsselung', () => {
  it('Daten lassen sich nur mit dem richtigen Schlüssel entschlüsseln', async () => {
    const dek = await generateDek()
    const blob = await encryptJson(dek, { geheim: 'Wochenbett', n: [1, 2, 3] })
    expect(blob).not.toContain('Wochenbett')
    expect(await decryptJson(dek, blob)).toEqual({ geheim: 'Wochenbett', n: [1, 2, 3] })
    await expect(decryptJson(await generateDek(), blob)).rejects.toThrow()
  })

  it('Jede Verschlüsselung nutzt einen neuen IV', async () => {
    const dek = await generateDek()
    expect(await encryptJson(dek, 'x')).not.toBe(await encryptJson(dek, 'x'))
  })

  it('Passwort leitet stabil denselben Auth-Wert und Wrap-Schlüssel ab, der Auth-Wert verrät das Passwort nicht', async () => {
    const salt = toB64(new Uint8Array(16).fill(3))
    const a = await deriveFromPassword('correct horse battery', salt, ITER)
    const b = await deriveFromPassword('correct horse battery', salt, ITER)
    const c = await deriveFromPassword('correct horse batterz', salt, ITER)
    expect(a.authKey).toBe(b.authKey)
    expect(a.authKey).not.toBe(c.authKey)
    expect(a.authKey).not.toContain('correct')
    const dek = await generateDek()
    const wrapped = await wrapDek(dek, a.wrapKey)
    const back = await unwrapDek(wrapped, b.wrapKey)
    expect(await decryptJson(back, await encryptJson(dek, 'ok'))).toBe('ok')
    await expect(unwrapDek(wrapped, c.wrapKey)).rejects.toThrow()
  })

  it('Entpackter Datenschlüssel ist nicht auslesbar', async () => {
    const keys = await deriveFromPassword('ein langer sicherer satz', toB64(new Uint8Array(16)), ITER)
    const dek = await unwrapDek(await wrapDek(await generateDek(), keys.wrapKey), keys.wrapKey)
    expect(dek.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', dek)).rejects.toThrow()
  })

  it('Wiederherstellungscode: Format, Toleranz bei Schreibweise, eigener Schlüsselweg', async () => {
    const code = generateRecoveryCode()
    expect(code).toMatch(/^([A-Z2-7]{4}-){6}[A-Z2-7]{2}$/)
    expect(parseRecoveryCode(code.toLowerCase().replaceAll('-', ' '))).toEqual(parseRecoveryCode(code))
    expect(() => parseRecoveryCode('ABC')).toThrow()
    expect(() => parseRecoveryCode(code.replace(/^./, '1'))).toThrow()
    const dek = await generateDek()
    const keys = await deriveFromRecoveryCode(code)
    const wrapped = await wrapDek(dek, keys.wrapKey)
    const again = await deriveFromRecoveryCode(code.toLowerCase())
    expect(again.recoveryAuth).toBe(keys.recoveryAuth)
    const back = await unwrapDek(wrapped, again.wrapKey)
    expect(await decryptJson(back, await encryptJson(dek, 42))).toBe(42)
    expect(new Set(Array.from({ length: 20 }, generateRecoveryCode)).size).toBe(20)
  })

  it('Große Blöcke werden korrekt kodiert', async () => {
    const dek = await generateDek()
    const big = { text: 'ä'.repeat(500_000) }
    expect(await decryptJson(dek, await encryptJson(dek, big))).toEqual(big)
  })

  it('Passwortregeln', () => {
    expect(passwordProblem('kurz')).toContain('Mindestens')
    expect(passwordProblem('aaaaaaaaaaaaaaaa')).toContain('einfach')
    expect(passwordProblem('Hase Mond Kaffee Berg')).toBeNull()
  })
})
