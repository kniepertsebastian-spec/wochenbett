import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { GoalId } from '../domain/types'

/** Persönliche Ziele (freiwillig, lokal). Leer = keine Gewichtung. */
export function useGoals(): [GoalId[], (goals: GoalId[]) => Promise<void>] {
  const stored = useLiveQuery(async () => ((await db.appSettings.get('goals'))?.value as GoalId[] | undefined) ?? [], [])
  return [stored ?? [], async (goals) => void (await db.appSettings.put({ key: 'goals', value: goals }))]
}
