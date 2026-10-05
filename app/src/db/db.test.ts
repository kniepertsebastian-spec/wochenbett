import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { AppDB } from './db'
import { deleteAllData, exportAll, importAll, ImportError } from './privacy'

describe('Datenbank-Migration', () => {
  it('v1 → v2: bestehende Daten bleiben erhalten, reaction wird ergänzt', async () => {
    const name = 'migration-test'
    const old = new Dexie(name)
    old.version(1).stores({
      userProfile: 'id',
      userProgress: 'id',
      exerciseHistory: '++id, date, exerciseId',
      workoutHistory: '++id, date',
      readinessChecks: '++id, date',
      symptomLogs: '++id, date',
      diastasisLogs: '++id, date',
      dailyHabits: '++id, date, habitId',
      savedRecipes: 'id',
      savedTips: 'id',
      appSettings: 'key',
    })
    await old.table('workoutHistory').add({ date: '2026-10-01', kind: 'workout', durationMin: 5, exerciseIds: ['a'], completedExerciseIds: ['a'] })
    await old.table('symptomLogs').add({ date: '2026-10-01', pain: 'mild' })
    old.close()

    const db = new AppDB(name)
    const workouts = await db.workoutHistory.toArray()
    expect(workouts).toHaveLength(1)
    expect(workouts[0].reaction).toBe('ok')
    expect(workouts[0].exerciseIds).toEqual(['a'])
    expect(await db.symptomLogs.count()).toBe(1)
    // v3: neue Tabelle ist nutzbar, alte Daten bleiben
    await db.appointments.add({ date: '2026-11-01', title: 'Nachuntersuchung', kind: 'checkup' })
    expect(await db.appointments.count()).toBe(1)
    expect(await db.workoutHistory.count()).toBe(1)
    db.close()
  })
})

describe('Datenschutz', () => {
  it('Export → Löschen → Import stellt Daten wieder her', async () => {
    const db = new AppDB('privacy-test')
    await db.userProfile.put({ id: 'me', birthDate: '2026-09-01', birthType: 'vaginal', medicalClearance: false, createdAt: '2026-10-01' })
    await db.workoutHistory.add({ date: '2026-10-02', kind: 'recovery', durationMin: 2, exerciseIds: ['x'], completedExerciseIds: ['x'], reaction: 'good' })
    const exported = await exportAll(db)
    expect(exported.data.workoutHistory).toHaveLength(1)

    await deleteAllData(db)
    expect(await db.workoutHistory.count()).toBe(0)
    expect(await db.userProfile.count()).toBe(0)

    await importAll(db, JSON.parse(JSON.stringify(exported)))
    expect(await db.workoutHistory.count()).toBe(1)
    expect((await db.userProfile.get('me'))?.birthType).toBe('vaginal')
    db.close()
  })
  it('lehnt ungültige Dateien ab, ohne Daten zu löschen', async () => {
    const db = new AppDB('privacy-test-2')
    await db.appSettings.put({ key: 'a', value: 1 })
    await expect(importAll(db, { foo: 1 })).rejects.toBeInstanceOf(ImportError)
    await expect(importAll(db, { format: 'rueckbildung-export', version: 99, data: {} })).rejects.toBeInstanceOf(ImportError)
    expect(await db.appSettings.count()).toBe(1)
    db.close()
  })
})
