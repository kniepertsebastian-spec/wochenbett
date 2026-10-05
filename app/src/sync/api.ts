export class ApiError extends Error {
  status: number
  code: string
  body?: Record<string, unknown>
  constructor(status: number, code: string, body?: Record<string, unknown>) {
    super(code)
    this.status = status
    this.code = code
    this.body = body
  }
}

export type RegisterPayload = {
  username: string
  inviteCode: string
  salt: string
  kdfIter: number
  authKey: string
  recoveryAuth: string
  wrappedDekPw: string
  wrappedDekRecovery: string
}

export type Api = ReturnType<typeof createApi>

/** Dünner Client für den Sync-Server. Status 0 = keine Verbindung. */
export function createApi(base = '/api', fetchFn: typeof fetch = (...a) => fetch(...a)) {
  async function req<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
    let res: Response
    try {
      res = await fetchFn(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new ApiError(0, 'offline')
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) throw new ApiError(res.status, String(json.error ?? 'error'), json)
    return json as T
  }

  return {
    config: () => req<{ registrationOpen: boolean }>('GET', '/config'),
    salt: (username: string) => req<{ salt: string; kdfIter: number }>('GET', `/salt?username=${encodeURIComponent(username)}`),
    register: (p: RegisterPayload) => req<{ token: string; version: number }>('POST', '/register', p),
    login: (username: string, authKey: string) => req<{ token: string; wrappedDekPw: string; version: number }>('POST', '/login', { username, authKey }),
    recover: (username: string, recoveryAuth: string) => req<{ token: string; wrappedDekRecovery: string }>('POST', '/recover', { username, recoveryAuth }),
    setCredentials: (token: string, p: { authKey: string; salt: string; kdfIter: number; wrappedDekPw: string }) => req<{ ok: true }>('PUT', '/credentials', p, token),
    getData: (token: string) => req<{ version: number; blob: string | null; updatedAt: number | null }>('GET', '/data', undefined, token),
    putData: (token: string, baseVersion: number, blob: string) => req<{ version: number }>('PUT', '/data', { baseVersion, blob }, token),
    logout: (token: string) => req<{ ok: true }>('POST', '/logout', {}, token),
    deleteAccount: (token: string, authKey: string) => req<{ ok: true }>('DELETE', '/account', { authKey }, token),
  }
}
