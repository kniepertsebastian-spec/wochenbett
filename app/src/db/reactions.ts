import type { WorkoutReaction } from '../domain/types'
import type { AppDB, WorkoutRecord } from './db'

/** Reaktion, die für Entscheidungen zählt: Folgetag-Reaktion hat Vorrang vor der direkten. */
export const effectiveReaction = (w: Pick<WorkoutRecord, 'reaction' | 'nextDayReaction'>): WorkoutReaction => w.nextDayReaction ?? w.reaction

/**
 * Hält die Reaktion am Folgetag an der letzten Einheit fest (einmalig, nur wenn die Einheit nicht heute war).
 * Die Angabe stammt aus dem Check-in ("Wie war die letzte Einheit für dich?").
 */
export async function recordNextDayReaction(db: AppDB, reaction: WorkoutReaction, now = new Date()): Promise<boolean> {
  const last = await db.workoutHistory.orderBy('date').last()
  if (!last?.id || last.nextDayReaction !== undefined) return false
  if (new Date(last.date).toDateString() === now.toDateString()) return false
  await db.workoutHistory.update(last.id, { nextDayReaction: reaction })
  return true
}
