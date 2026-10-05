import type { AppDB } from './db'

export const EXPORT_FORMAT = 'rueckbildung-export'
export const EXPORT_VERSION = 1

const TABLES = [
  'userProfile',
  'userProgress',
  'exerciseHistory',
  'workoutHistory',
  'readinessChecks',
  'symptomLogs',
  'diastasisLogs',
  'dailyHabits',
  'appointments',
  'savedRecipes',
  'savedTips',
  'appSettings',
] as const

export type ExportFile = { format: typeof EXPORT_FORMAT; version: number; exportedAt: string; data: Record<string, unknown[]> }

/** Export nur auf Wunsch, lokal erzeugt, kein Upload. */
export async function exportAll(db: AppDB): Promise<ExportFile> {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) data[t] = await db.table(t).toArray()
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data }
}

export class ImportError extends Error {}

/** Ersetzt alle lokalen Daten durch den Inhalt der Datei (nach Validierung). */
export async function importAll(db: AppDB, file: unknown): Promise<void> {
  const f = file as Partial<ExportFile> | null
  if (!f || f.format !== EXPORT_FORMAT) throw new ImportError('Keine gültige Export-Datei.')
  if (typeof f.version !== 'number' || f.version > EXPORT_VERSION) throw new ImportError('Export-Version wird nicht unterstützt.')
  if (!f.data || typeof f.data !== 'object') throw new ImportError('Export-Datei enthält keine Daten.')
  const data = f.data as Record<string, unknown>
  for (const t of TABLES) if (data[t] !== undefined && !Array.isArray(data[t])) throw new ImportError(`Ungültige Daten: ${t}`)
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      const rows = data[t] as unknown[] | undefined
      if (rows?.length) await db.table(t).bulkAdd(rows)
    }
  })
}

/** Löscht alle lokalen Gesundheitsdaten. */
export async function deleteAllData(db: AppDB): Promise<void> {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear()
  })
}
