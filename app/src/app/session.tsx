import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Exercise, Recommendation, Readiness, Situation } from '../domain/types'

/** Flüchtiger Zustand im Speicher (nie in der URL, nie auf dem Server). */
export type PlannedSession = {
  kind: 'workout' | 'recovery'
  durationMin: number
  exercises: Exercise[]
  readiness: Readiness | null
  /** Baby schläft: keine Sprachansagen, kein Gong */
  silent?: boolean
}

type Ctx = {
  recommendation: Recommendation | null
  setRecommendation: (r: Recommendation | null, readiness?: Readiness, situation?: Situation) => void
  situation: Situation | null
  session: PlannedSession | null
  setSession: (s: PlannedSession | null) => void
  lastReadiness: Readiness | null
}

const SessionCtx = createContext<Ctx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [recommendation, setRec] = useState<Recommendation | null>(null)
  const [session, setSession] = useState<PlannedSession | null>(null)
  const [lastReadiness, setLast] = useState<Readiness | null>(null)
  const [situation, setSituation] = useState<Situation | null>(null)
  const setRecommendation = (r: Recommendation | null, readiness?: Readiness, sit?: Situation) => {
    setRec(r)
    if (readiness) setLast(readiness)
    setSituation(sit ?? null)
  }
  return <SessionCtx.Provider value={{ recommendation, setRecommendation, situation, session, setSession, lastReadiness }}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const c = useContext(SessionCtx)
  if (!c) throw new Error('SessionProvider fehlt')
  return c
}
