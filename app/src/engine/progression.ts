import type { Exercise, ExerciseId, PhaseId, Readiness, UserState, WorkoutReaction } from '../domain/types'
import { isEligible } from './eligibility'

/** Leichtere Variante, die heute angeboten werden darf (rekursiv bis eine passt). */
export function regress(e: Exercise, catalog: Exercise[], user: UserState, readiness: Readiness, seen = new Set<ExerciseId>()): Exercise | null {
  if (seen.has(e.id)) return null
  seen.add(e.id)
  for (const id of e.regressions) {
    const r = catalog.find((c) => c.id === id)
    if (!r) continue
    if (isEligible(r, user, readiness)) return r
    const deeper = regress(r, catalog, user, readiness, seen)
    if (deeper) return deeper
  }
  return null
}

/** Ersetzt gemeldete Problem-Übungen automatisch durch leichtere Varianten (oder entfernt sie). */
export function applyRegressions(
  list: Exercise[],
  problems: ExerciseId[],
  catalog: Exercise[],
  user: UserState,
  readiness: Readiness,
): Exercise[] {
  const out: Exercise[] = []
  for (const e of list) {
    if (!problems.includes(e.id)) {
      out.push(e)
      continue
    }
    const r = regress(e, catalog, user, readiness)
    if (r && !out.some((o) => o.id === r.id) && !list.some((o) => o.id === r.id)) out.push(r)
  }
  return out
}

// ---------- Phasen-Freischaltung ----------
// Zeit-Untergrenzen sind PLATZHALTER und müssen fachlich festgelegt werden.
export const PHASE_MIN_DAYS: Record<PhaseId, number> = { 1: 0, 2: 14, 3: 42, 4: 84 }
export const PHASE_REQUIRES_CLEARANCE: Record<PhaseId, boolean> = { 1: false, 2: false, 3: false, 4: true }
export const SESSIONS_REQUIRED = 3

export type PhaseCheck = { allowed: boolean; reasons: string[] }

/** Prüft, ob die nächste Phase freigeschaltet werden darf. Zeit allein genügt nie. */
export function canAdvancePhase(user: UserState, readiness: Readiness, recent: WorkoutReaction[]): PhaseCheck {
  if (user.currentPhase >= 4) return { allowed: false, reasons: ['Höchste Phase erreicht'] }
  const next = (user.currentPhase + 1) as PhaseId
  const reasons: string[] = []
  if (user.daysSinceBirth < PHASE_MIN_DAYS[next]) reasons.push('Zeit seit Geburt noch zu kurz')
  if (PHASE_REQUIRES_CLEARANCE[next] && !user.medicalClearance) reasons.push('Medizinische Freigabe fehlt')
  if (readiness.pelvicPressure) reasons.push('Druckgefühl: keine Progression')
  if (readiness.pain !== 'none') reasons.push('Schmerzen: keine Progression')
  if (readiness.redFlags.length > 0) reasons.push('Red Flag')
  if (user.doming) reasons.push('Doming beobachtet: keine Progression')
  const last = recent.slice(-SESSIONS_REQUIRED)
  if (last.length < SESSIONS_REQUIRED) reasons.push('Noch zu wenige Einheiten')
  else if (last.some((r) => r === 'symptoms')) reasons.push('Beschwerden nach einer der letzten Einheiten')
  return { allowed: reasons.length === 0, reasons }
}
