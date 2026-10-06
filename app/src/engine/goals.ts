import type { Exercise, GoalId } from '../domain/types'

export const GOALS: { id: GoalId; label: string }[] = [
  { id: 'pelvic_floor', label: 'Beckenboden besser wahrnehmen' },
  { id: 'core', label: 'Rumpf und Core sanft stärken' },
  { id: 'back', label: 'Rücken entlasten' },
  { id: 'mobility', label: 'Beweglichkeit verbessern' },
  { id: 'energy', label: 'Mehr Energie im Alltag' },
  { id: 'confidence', label: 'Sicherheit und Vertrauen in den eigenen Körper' },
  { id: 'routine', label: 'Einfach wieder regelmäßig etwas für mich tun' },
]

const has = (e: Exercise, ...muscles: string[]) => muscles.some((m) => e.targetMuscles.includes(m))

const matchers: Record<GoalId, (e: Exercise) => boolean> = {
  pelvic_floor: (e) => has(e, 'Beckenboden'),
  core: (e) => has(e, 'Tiefe Bauchmuskeln', 'Bauchmuskeln', 'Rumpf'),
  back: (e) => has(e, 'Unterer Rücken', 'Oberer Rücken', 'Wirbelsäule', 'Nacken', 'Schultern'),
  mobility: (e) => has(e, 'Wirbelsäule', 'Hüfte', 'Becken', 'Nacken') || /mobilis|lockern|pendeln/i.test(`${e.name} ${e.description}`),
  energy: (e) => has(e, 'Zwerchfell', 'Oberschenkel', 'Gesäß'),
  confidence: (e) => e.difficulty <= 2, // vertraute, leichte Übungen zuerst
  routine: (e) => e.duration <= 120, // kurze Übungen sind leicht einzubauen
}

/** Wie viele der gewählten Ziele passen zur Übung? Nur zum Umsortieren, nie zur Freigabe. */
export const goalScore = (e: Exercise, goals: GoalId[]): number => goals.filter((g) => matchers[g](e)).length

/** Übungen, die zu den Zielen passen, kommen zuerst. Innerhalb der Gruppen wird für Abwechslung rotiert. */
export function orderPool(pool: Exercise[], goals: GoalId[], rotate: number): Exercise[] {
  const rot = (list: Exercise[]) => {
    if (list.length === 0) return list
    const s = rotate % list.length
    return [...list.slice(s), ...list.slice(0, s)]
  }
  if (goals.length === 0) return rot(pool)
  const matching = pool.filter((e) => goalScore(e, goals) > 0).sort((a, b) => goalScore(b, goals) - goalScore(a, goals))
  const rest = pool.filter((e) => goalScore(e, goals) === 0)
  return [...rot(matching), ...rot(rest)]
}
