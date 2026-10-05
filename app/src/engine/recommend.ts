import type { Exercise, Readiness, Recommendation, UserState } from '../domain/types'
import { isEligible } from './eligibility'
import { assessReadiness } from './readiness'
import { highestUrgency } from './redflags'

const TRANSITION_SEC = 15

function pickWithinBudget(candidates: Exercise[], budgetSec: number, rotate: number): Exercise[] {
  if (candidates.length === 0) return []
  const start = rotate % candidates.length
  const ordered = [...candidates.slice(start), ...candidates.slice(0, start)]
  const out: Exercise[] = []
  let used = 0
  for (const e of ordered) {
    const cost = e.duration + TRANSITION_SEC
    if (out.length > 0 && used + cost > budgetSec) continue
    out.push(e)
    used += cost
    if (used >= budgetSec) break
  }
  return out
}

/**
 * Zentrale, reine Entscheidungsfunktion. Die UI entscheidet nie selbst über Freigaben.
 * `rotate` sorgt für Abwechslung (z. B. Tag des Jahres), das Ergebnis bleibt deterministisch.
 */
export function recommend(user: UserState, readiness: Readiness, catalog: Exercise[], rotate = 0): Recommendation {
  const assessment = assessReadiness(readiness)
  if (assessment.light === 'red') {
    return { kind: 'stop', light: 'red', reasons: assessment.redFlags, urgency: highestUrgency(assessment.redFlags) }
  }

  const eligible = catalog.filter((e) => isEligible(e, user, readiness))
  const recoveryPool = eligible.filter((e) => e.phase === 1)

  const light = assessment.light === 'green' ? 'green' : 'yellow'
  const recovery = (durationMin: 2 | 5 | 10): Extract<Recommendation, { kind: 'recovery' }> => ({
    kind: 'recovery',
    light,
    durationMin,
    exercises: pickWithinBudget(recoveryPool, durationMin * 60, rotate),
  })

  if (assessment.light === 'yellow') return recovery(readiness.energy <= 1 ? 2 : readiness.energy <= 3 ? 5 : 10)

  // Grün: Energie bestimmt die Länge
  if (readiness.energy <= 3) return recovery(readiness.energy <= 1 ? 2 : 5)

  const durationMin = readiness.energy === 4 ? 10 : 15
  // Aufwärmen mit Phase-1-Übung, danach Übungen der aktuellen/vorherigen Phase
  const main = eligible.filter((e) => e.phase > 1).sort((a, b) => b.phase - a.phase || a.difficulty - b.difficulty)
  const warmup = recoveryPool.slice(0, 1)
  const exercises = [...warmup, ...pickWithinBudget(main, durationMin * 60 - (warmup[0]?.duration ?? 0), rotate)]
  const allowProgression = readiness.pain === 'none' && !readiness.pelvicPressure && readiness.lastSession !== 'symptoms'
  if (exercises.length === 0) return recovery(5)
  return { kind: 'workout', light: 'green', durationMin, exercises, allowProgression }
}
