import Dexie, { type EntityTable } from 'dexie'
import type { PainLevel, PhaseId, Readiness, TrafficLight, UserProfile, WorkoutReaction } from '../domain/types'

export type UserProgress = { id: 'me'; currentPhase: PhaseId; updatedAt: string }

export type ExerciseHistoryEntry = {
  id?: number
  date: string
  exerciseId: string
  outcome: 'done' | 'skipped' | 'problem'
}

export type WorkoutRecord = {
  id?: number
  date: string
  kind: 'workout' | 'recovery'
  durationMin: number
  exerciseIds: string[]
  completedExerciseIds: string[]
  reaction: WorkoutReaction
  nextDayReaction?: WorkoutReaction
}

export type ReadinessCheck = { id?: number; date: string; readiness: Readiness; light: TrafficLight }

export type SymptomLog = {
  id?: number
  date: string
  urineLeakage: boolean
  pressure: PainLevel
  heaviness: PainLevel
  pain: PainLevel
  bowelProblems: boolean
  note?: string
}

/** Selbstbeobachtung, keine Diagnose. Messwerte in Fingerbreiten. */
export type DiastasisLog = {
  id?: number
  date: string
  widthFingers?: number
  depthFingers?: number
  doming: boolean
  note?: string
}

export type Appointment = { id?: number; date: string; title: string; kind: 'midwife' | 'gynecology' | 'checkup' | 'custom'; note?: string }
export type DailyHabit = { id?: number; date: string; habitId: string }
export type SavedItem = { id: string; savedAt: string }
export type AppSetting = { key: string; value: unknown }

export class AppDB extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>
  userProgress!: EntityTable<UserProgress, 'id'>
  exerciseHistory!: EntityTable<ExerciseHistoryEntry, 'id'>
  workoutHistory!: EntityTable<WorkoutRecord, 'id'>
  readinessChecks!: EntityTable<ReadinessCheck, 'id'>
  symptomLogs!: EntityTable<SymptomLog, 'id'>
  diastasisLogs!: EntityTable<DiastasisLog, 'id'>
  dailyHabits!: EntityTable<DailyHabit, 'id'>
  appointments!: EntityTable<Appointment, 'id'>
  savedRecipes!: EntityTable<SavedItem, 'id'>
  savedTips!: EntityTable<SavedItem, 'id'>
  appSettings!: EntityTable<AppSetting, 'key'>

  constructor(name = 'rueckbildung') {
    super(name)
    // Schema-Versionen: bestehende Daten werden migriert, nie verworfen.
    this.version(1).stores({
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
    // v2: Reaktion nach dem Training wird indiziert (Abfrage der letzten Reaktionen).
    this.version(2)
      .stores({ workoutHistory: '++id, date, reaction' })
      .upgrade((tx) =>
        tx
          .table('workoutHistory')
          .toCollection()
          .modify((w) => {
            if (!w.reaction) w.reaction = 'ok'
          }),
      )
    // v3: Termine & Erinnerungen
    this.version(3).stores({ appointments: '++id, date' })
  }
}

export const db = new AppDB()

/** Anfrage an den Browser, die Daten nicht automatisch zu verwerfen (best effort). */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
