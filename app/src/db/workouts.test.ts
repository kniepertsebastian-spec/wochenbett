import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { AppDB } from './db'
import { deleteWorkout } from './workouts'

describe('Einheit löschen', () => {
  it('entfernt Einheit und zugehörige Übungs-Einträge, andere bleiben', async () => {
    const db = new AppDB('workouts-test')
    const mk = (date: string) => ({ date, kind: 'workout' as const, durationMin: 5, exerciseIds: ['a'], completedExerciseIds: ['a'], reaction: 'good' as const })
    const a = await db.workoutHistory.add(mk('2026-10-01T08:00:00.000Z'))
    await db.workoutHistory.add(mk('2026-10-02T08:00:00.000Z'))
    await db.exerciseHistory.bulkAdd([
      { date: '2026-10-01T08:00:00.000Z', exerciseId: 'a', outcome: 'done' },
      { date: '2026-10-02T08:00:00.000Z', exerciseId: 'a', outcome: 'done' },
    ])
    expect(await deleteWorkout(db, a as number)).toBe(true)
    expect(await db.workoutHistory.count()).toBe(1)
    expect(await db.exerciseHistory.count()).toBe(1)
    expect(await deleteWorkout(db, 9999)).toBe(false)
    db.close()
  })
})
