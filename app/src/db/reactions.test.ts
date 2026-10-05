import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { canAdvancePhase } from '../engine/progression'
import { AppDB } from './db'
import { effectiveReaction, recordNextDayReaction } from './reactions'

const base = { kind: 'workout' as const, durationMin: 5, exerciseIds: [], completedExerciseIds: [] }

describe('Reaktion am Folgetag', () => {
  it('wird an der gestrigen Einheit gespeichert, nicht an der heutigen und nicht doppelt', async () => {
    const db = new AppDB('reaction-test')
    await db.workoutHistory.add({ ...base, date: '2026-10-04T09:00:00', reaction: 'good' })
    const now = new Date('2026-10-05T09:00:00')
    expect(await recordNextDayReaction(db, 'symptoms', now)).toBe(true)
    expect((await db.workoutHistory.toArray())[0].nextDayReaction).toBe('symptoms')
    expect(await recordNextDayReaction(db, 'good', now)).toBe(false)
    await db.workoutHistory.add({ ...base, date: '2026-10-05T08:00:00', reaction: 'good' })
    expect(await recordNextDayReaction(db, 'good', now)).toBe(false)
    db.close()
  })
  it('Folgetag-Beschwerden verhindern die Phasenfreigabe, obwohl direkt "gut"', () => {
    const user = { daysSinceBirth: 100, birthType: 'vaginal' as const, medicalClearance: true, currentPhase: 1 as const, doming: false }
    const ok = { energy: 5 as const, pain: 'none' as const, pelvicPressure: false, lastSession: 'good' as const, redFlags: [] }
    const direct = [{ reaction: 'good' as const }, { reaction: 'good' as const }, { reaction: 'good' as const }]
    expect(canAdvancePhase(user, ok, direct.map(effectiveReaction)).allowed).toBe(true)
    const withNextDay = [...direct.slice(0, 2), { reaction: 'good' as const, nextDayReaction: 'symptoms' as const }]
    expect(canAdvancePhase(user, ok, withNextDay.map(effectiveReaction)).allowed).toBe(false)
  })
})
