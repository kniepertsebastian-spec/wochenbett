// Ende-zu-Ende-Verschlüsselung für die Synchronisation (WebCrypto, keine Fremdbibliotheken).
//
// Schlüssel-Hierarchie:
//   Passwort  --PBKDF2-->  64 Byte:  [0..32) Wrap-Schlüssel (bleibt im Browser)   [32..64) Auth-Wert (geht zum Server)
//   Datenschlüssel (DEK, zufällig)  wird mit dem Wrap-Schlüssel UND mit dem Wiederherstellungscode verpackt.
//   Der Datenblock wird mit dem DEK verschlüsselt (AES-GCM). Der Server sieht nur verpackte Schlüssel und Blöcke.

const enc = new TextEncoder()
const dec = new TextDecoder()

export const DEFAULT_KDF_ITERATIONS = 600_000

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const randomBytes = (n: number): Uint8Array<ArrayBuffer> => crypto.getRandomValues(new Uint8Array(n))

export async function sha256Hex(text: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)))
  return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------- Passwort ----------

export type PasswordKeys = { authKey: string; wrapKey: CryptoKey }

export async function deriveFromPassword(password: string, saltB64: string, iterations: number): Promise<PasswordKeys> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits'])
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(saltB64), iterations }, base, 512))
  const wrapKey = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['wrapKey', 'unwrapKey'])
  return { authKey: toB64(bits.slice(32)), wrapKey }
}

// ---------- Wiederherstellungscode ----------

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' // Base32, ohne leicht verwechselbare Ziffern 0/1/8/9

/** 128 Bit zufällig, als 26 Zeichen in Vierergruppen: ABCD-EFGH-… */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(16)
  let bits = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  bits += '00' // 128 Bit -> 26 Zeichen à 5 Bit
  let out = ''
  for (let i = 0; i < 130; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  return out.match(/.{1,4}/g)!.join('-')
}

/** Akzeptiert Groß-/Kleinschreibung, Leerzeichen und Bindestriche. */
export function parseRecoveryCode(code: string): Uint8Array<ArrayBuffer> {
  const clean = code.toUpperCase().replace(/[\s-]/g, '')
  if (clean.length !== 26 || [...clean].some((c) => !ALPHABET.includes(c))) throw new Error('invalid_recovery_code')
  let bits = ''
  for (const c of clean) bits += ALPHABET.indexOf(c).toString(2).padStart(5, '0')
  const out = new Uint8Array(16)
  for (let i = 0; i < 16; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  return out
}

export type RecoveryKeys = { recoveryAuth: string; wrapKey: CryptoKey }

export async function deriveFromRecoveryCode(code: string): Promise<RecoveryKeys> {
  const bytes = parseRecoveryCode(code)
  const base = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveBits', 'deriveKey'])
  const info = (s: string) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(s) })
  const auth = new Uint8Array(await crypto.subtle.deriveBits(info('wochenbett-recovery-auth'), base, 256))
  const wrapKey = await crypto.subtle.deriveKey(info('wochenbett-recovery-wrap'), base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey'])
  return { recoveryAuth: toB64(auth), wrapKey }
}

// ---------- Datenschlüssel und Daten ----------

export const generateDek = () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])

type Sealed = { iv: string; ct: string }

export async function wrapDek(dek: CryptoKey, wrapKey: CryptoKey): Promise<string> {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.wrapKey('raw', dek, wrapKey, { name: 'AES-GCM', iv })
  return JSON.stringify({ iv: toB64(iv), ct: toB64(ct) } satisfies Sealed)
}

/** Standardmäßig NICHT exportierbar: der Schlüssel kann im Browser benutzt, aber nicht ausgelesen werden. */
export async function unwrapDek(wrapped: string, wrapKey: CryptoKey, extractable = false): Promise<CryptoKey> {
  const { iv, ct } = JSON.parse(wrapped) as Sealed
  return crypto.subtle.unwrapKey('raw', fromB64(ct), wrapKey, { name: 'AES-GCM', iv: fromB64(iv) }, { name: 'AES-GCM', length: 256 }, extractable, ['encrypt', 'decrypt'])
}

export async function encryptJson(dek: CryptoKey, value: unknown): Promise<string> {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, enc.encode(JSON.stringify(value)))
  return JSON.stringify({ v: 1, iv: toB64(iv), ct: toB64(ct) })
}

export async function decryptJson<T = unknown>(dek: CryptoKey, blob: string): Promise<T> {
  const { iv, ct } = JSON.parse(blob) as Sealed
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, dek, fromB64(ct))
  return JSON.parse(dec.decode(pt)) as T
}

// ---------- Passwortregeln ----------

export const MIN_PASSWORD_LENGTH = 12

/** Prüft nur die Mindestanforderungen. Ein langer Satz ist besser als ein kurzes kompliziertes Passwort. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen. Ein kurzer Satz ist ideal, z. B. drei bis vier zufällige Wörter.`
  if (new Set(pw).size < 5) return 'Zu einfach, bitte mehr unterschiedliche Zeichen.'
  return null
}
