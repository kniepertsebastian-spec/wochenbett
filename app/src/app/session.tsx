import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Exercise, Readiness, Situation } from '../domain/types'
import type { AlternativeId } from '../engine/summary'

/** Flüchtiger Zustand im Speicher (nie in der URL, nie auf dem Server). */
export type PlannedSession = {
  kind: 'workout' | 'recovery'
  durationMin: number
  exercises: Exercise[]
  readiness: Readiness | null
  /** Baby schläft: keine Sprachansagen, kein Gong */
  silent?: boolean
}

/** Auswahl der Nutzerin auf "Heute": Kontext ("Was ist gerade möglich?") oder Alternative. */
export type Choice = { situation?: Situation; alt?: AlternativeId }

type Ctx = {
  session: PlannedSession | null
  setSession: (s: PlannedSession | null) => void
  choice: Choice
  setChoice: (c: Choice) => void
  /** Kleine Rückmeldung nach dem Speichern einer Einheit (erscheint auf "Heute") */
  progressNote: string | null
  setProgressNote: (n: string | null) => void
}

const SessionCtx = createContext<Ctx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlannedSession | null>(null)
  const [choice, setChoice] = useState<Choice>({})
  const [progressNote, setProgressNote] = useState<string | null>(null)
  return <SessionCtx.Provider value={{ session, setSession, choice, setChoice, progressNote, setProgressNote }}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const c = useContext(SessionCtx)
  if (!c) throw new Error('SessionProvider fehlt')
  return c
}
