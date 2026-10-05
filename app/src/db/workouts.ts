import type { AppDB } from './db'

/** Löscht eine Einheit samt zugehöriger Übungs-Einträge (gleicher Zeitstempel). */
export async function deleteWorkout(db: AppDB, id: number): Promise<boolean> {
  const w = await db.workoutHistory.get(id)
  if (!w) return false
  await db.transaction('rw', db.workoutHistory, db.exerciseHistory, async () => {
    await db.exerciseHistory.where('date').equals(w.date).delete()
    await db.workoutHistory.delete(id)
  })
  return true
}
