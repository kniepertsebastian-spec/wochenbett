import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { db } from '../db/db'
import { createApi } from './api'
import { createSync, type SyncClient, type SyncResult } from './engine'

export type SyncStatus = 'off' | 'syncing' | 'ok' | 'offline' | 'conflict' | 'login_required' | 'error'

type Ctx = {
  client: SyncClient
  status: SyncStatus
  username: string | null
  lastSyncAt: string | null
  /** Sofort abgleichen (z. B. nach dem Anmelden oder auf Knopfdruck) */
  syncNow: () => Promise<SyncResult>
}

const SyncCtx = createContext<Ctx | null>(null)

const DEBOUNCE_MS = 4000
const POLL_MS = 60_000

export function SyncProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createSync({ db, api: createApi('/api') }), [])
  const state = useLiveQuery(async () => (await db.syncState.get('me')) ?? null, [])
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<SyncResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const syncNow = useMemo(
    () => async () => {
      setBusy(true)
      try {
        const r = await client.syncNow()
        setLast(r)
        return r
      } finally {
        setBusy(false)
      }
    },
    [client],
  )

  const username = state?.username ?? null
  useEffect(() => {
    if (!username) return
    void syncNow()
    const schedule = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void syncNow(), DEBOUNCE_MS)
    }
    // Lokale Änderungen (außer am Sync-Zustand selbst) lösen nach kurzer Pause einen Abgleich aus
    const onMutated = (parts: Record<string, unknown>) => {
      if (Object.keys(parts).some((k) => !k.includes('/syncState/'))) schedule()
    }
    Dexie.on('storagemutated', onMutated)
    const onVisible = () => document.visibilityState === 'visible' && void syncNow()
    const onOnline = () => void syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const poll = setInterval(() => void syncNow(), POLL_MS)
    return () => {
      Dexie.on('storagemutated').unsubscribe(onMutated)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      clearInterval(poll)
      clearTimeout(timer.current)
    }
  }, [username, syncNow])

  let status: SyncStatus = 'off'
  if (state) {
    if (state.conflict) status = 'conflict'
    else if (state.loginRequired) status = 'login_required'
    else if (busy) status = 'syncing'
    else if (last === 'offline') status = 'offline'
    else if (last === 'error') status = 'error'
    else status = 'ok'
  }

  return <SyncCtx.Provider value={{ client, status, username, lastSyncAt: state?.lastSyncAt ?? null, syncNow }}>{children}</SyncCtx.Provider>
}

export function useSync() {
  const c = useContext(SyncCtx)
  if (!c) throw new Error('SyncProvider fehlt')
  return c
}
