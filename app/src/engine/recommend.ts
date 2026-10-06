import type { Exercise, GoalId, Readiness, Recommendation, Situation, UserState } from '../domain/types'
import { goalScore, orderPool } from './goals'
import { isEligible } from './eligibility'
import { assessReadiness } from './readiness'
import { applyRegressions, PHASE_MIN_DAYS, SESSIONS_REQUIRED } from './progression'
import { highestUrgency } from './redflags'

const TRANSITION_SEC = 15

/** Nimmt Übungen in der übergebenen Reihenfolge, bis das Zeitbudget (inkl. Übergängen) erreicht ist. */
function pickWithinBudget(ordered: Exercise[], budgetSec: number): Exercise[] {
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
const situationText: Record<Situation, string> = {
  baby_sleeping: 'Baby schläft: ohne Sprachansagen und Gong',
  baby_arm: 'Baby auf dem Arm: nur Einhand-geeignete Übungen',
  one_hand: 'Eine Hand frei: nur Einhand-geeignete Übungen',
  exhausted: 'Komplett erschöpft: kürzestes Recovery',
  five_min: 'Nur 5 Minuten: kurze Einheit',
  time_10_20: 'Du hast 10 bis 20 Minuten und möchtest etwas tun',
}
const painText = { none: 'keine Schmerzen', mild: 'leichte Schmerzen', moderate: 'mittlere Schmerzen', severe: 'starke Schmerzen' } as const

/** Nachvollziehbare Begründung aus den Eingaben, nicht aus Vermutungen. */
function explain(readiness: Readiness, situation?: Situation): string[] {
  const out = [`Energie ${readiness.energy} von 5, ${painText[readiness.pain]}${readiness.pelvicPressure ? ', Druckgefühl im Becken' : ''}`]
  if (readiness.lastSession === 'symptoms') out.push('Die letzte Einheit hat Beschwerden gemacht, deshalb heute sanfter')
  if (situation) out.push(situationText[situation])
  return out
}

function phaseHint(user: UserState): string {
  if (user.currentPhase >= 4) return 'Du bist in der höchsten Phase.'
  const next = (user.currentPhase + 1) as keyof typeof PHASE_MIN_DAYS
  return `Phase ${next} schaltest du unter Verlauf frei: nach ${SESSIONS_REQUIRED} beschwerdefreien Einheiten und frühestens ab Tag ${PHASE_MIN_DAYS[next]} nach der Geburt. Hast du bereits einen Rückbildungskurs gemacht oder eine Freigabe, kannst du die Phase dort auch selbst wählen.`
}

export type RecommendOptions = {
  rotate?: number
  problemIds?: string[]
  situation?: Situation
  goals?: GoalId[]
  /** "Heute nur 3 Minuten?" */
  maxMinutes?: 3
  /** "Heute lieber Erholung?" */
  preferRecovery?: boolean
}

export function recommend(user: UserState, readiness: Readiness, fullCatalog: Exercise[], opts: RecommendOptions = {}): Recommendation {
  const { rotate = 0, problemIds = [], situation, goals = [], maxMinutes, preferRecovery } = opts
  // Situationen engen nur ein, die Sicherheitslogik bleibt unverändert
  const catalog = situation === 'baby_arm' || situation === 'one_hand' ? fullCatalog.filter((e) => e.oneHandFriendly) : fullCatalog
  if (situation === 'exhausted') readiness = { ...readiness, energy: 1 }
  if (situation === 'five_min' && readiness.energy > 3) readiness = { ...readiness, energy: 3 }
  const assessment = assessReadiness(readiness)
  if (assessment.light === 'red') {
    return { kind: 'stop', light: 'red', reasons: assessment.redFlags, urgency: highestUrgency(assessment.redFlags), why: ['Ein Warnzeichen oder starke Schmerzen wurden angegeben. Die App bietet dann kein Training an.'] }
  }

  const eligible = catalog.filter((e) => isEligible(e, user, readiness))
  const recoveryPool = eligible.filter((e) => e.phase === 1)

  const light = assessment.light === 'green' ? 'green' : 'yellow'
  const base = explain(readiness, situation)
  const goalNote = goals.length > 0 && recoveryPool.some((e) => goalScore(e, goals) > 0) ? ['Übungen, die zu deinen Zielen passen, stehen vorne'] : []
  const recovery = (durationMin: 2 | 3 | 5 | 10, extra: string[] = []): Extract<Recommendation, { kind: 'recovery' }> => ({
    kind: 'recovery',
    light,
    durationMin,
    exercises: pickWithinBudget(orderPool(recoveryPool, goals, rotate), durationMin * 60),
    why: [...base, ...extra, ...goalNote],
  })

  if (maxMinutes === 3) return recovery(3, ['Du hast dir heute nur 3 Minuten vorgenommen, das zählt'])

  if (assessment.light === 'yellow') {
    const reasons = assessment.reasons.length > 0 ? [`Heute sanfter wegen: ${assessment.reasons.join(', ')}`] : []
    return recovery(readiness.energy <= 1 ? 2 : readiness.energy <= 3 ? 5 : 10, reasons)
  }

  if (preferRecovery) return recovery(readiness.energy >= 4 ? 10 : 5, ['Du hast dir heute Erholung gewünscht. Erholung ist ein vollwertiger Teil des Wegs'])

  // Grün: Energie bestimmt die Länge
  if (readiness.energy <= 3) return recovery(readiness.energy <= 1 ? 2 : 5, [`Bei Energie ${readiness.energy} von 5 gibt es eine kurze Einheit`])

  const durationMin: 10 | 15 | 20 = situation === 'time_10_20' ? 20 : readiness.energy === 4 ? 10 : 15
  // Aufwärmen mit Phase-1-Übung, danach Übungen der aktuellen/vorherigen Phase
  const main = eligible.filter((e) => e.phase > 1).sort((a, b) => b.phase - a.phase || a.difficulty - b.difficulty)
  // In Phase 1 gibt es nur Recovery-Übungen: dann ein volles Recovery-Set statt einer Mini-"Einheit"
  if (main.length === 0) {
    const blocked = catalog.filter((e) => e.phase > 1 && !isEligible(e, user, readiness))
    const reasons = [`Du bist in Phase ${user.currentPhase}. Hier gibt es bewusst Atmung, Beckenboden-Wahrnehmung und sanfte Mobilisation, weil sie die Grundlage für alles Weitere sind.`]
    if (user.currentPhase === 1) reasons.push(phaseHint(user))
    else if (blocked.length > 0) reasons.push('Weitere Übungen sind heute nicht passend (Hilfsmittel, Geburtsart oder Beschwerden). Alle Gründe findest du unter Übungen → Alle Übungen.')
    return recovery(10, reasons)
  }
  const warmup = recoveryPool.slice(0, 1)
  // Übungen, bei denen zuletzt Probleme gemeldet wurden, werden automatisch durch leichtere Varianten ersetzt
  const picked = [...warmup, ...pickWithinBudget(orderPool(main, goals, rotate), durationMin * 60 - (warmup[0]?.duration ?? 0))]
  const exercises = applyRegressions(picked, problemIds, catalog, user, readiness)
  const allowProgression = readiness.pain === 'none' && !readiness.pelvicPressure && readiness.lastSession !== 'symptoms'
  if (exercises.length === 0) return recovery(5, ['Heute passt keine Übung der aktuellen Phase, deshalb Recovery'])
  return { kind: 'workout', light: 'green', durationMin, exercises, allowProgression, why: [...base, `Phase ${user.currentPhase}: Übungen aus Phase ${user.currentPhase} und davor`, allowProgression ? 'Keine Beschwerden, deshalb ist eine Steigerung möglich' : 'Heute keine Steigerung wegen Beschwerden', ...(goals.length > 0 && main.some((e) => goalScore(e, goals) > 0) ? ['Übungen, die zu deinen Zielen passen, stehen vorne'] : [])] }
}

/** Recovery-Set (2/5/10 Minuten) aus allen heute geeigneten Phase-1-Übungen. */
export function buildRecoverySet(user: UserState, readiness: Readiness, catalog: Exercise[], minutes: 2 | 5 | 10, rotate = 0): Exercise[] {
  const pool = catalog.filter((e) => e.phase === 1 && isEligible(e, user, readiness))
  return pickWithinBudget(orderPool(pool, [], rotate), minutes * 60)
}

/** Kleine Übungen für nebenbei im Bett oder auf dem Sofa (nur geeignete, kurz, ohne Aufbau). */
export function buildBedSet(user: UserState, readiness: Readiness, catalog: Exercise[], minutes: 2 | 5, rotate = 0): Exercise[] {
  const pool = catalog.filter((e) => e.bedFriendly && isEligible(e, user, readiness))
  return pickWithinBudget(orderPool(pool, [], rotate), minutes * 60)
}
