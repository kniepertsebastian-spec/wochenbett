import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { AudioSettings } from './useAudio'

export type Settings = AudioSettings & {
  screenless: boolean
  /** Nächste Übung nach 10 Sekunden von selbst starten. Standard aus: jede Übung wird von Hand gestartet. */
  autoStartNext: boolean
}
export const defaultSettings: Settings = { speech: true, gong: true, vibration: false, screenless: false, autoStartNext: false }

export function useSettings(): [Settings, <K extends keyof Settings>(k: K, v: Settings[K]) => Promise<void>] {
  const stored = useLiveQuery(async () => (await db.appSettings.get('settings'))?.value as Partial<Settings> | undefined, [])
  const settings = { ...defaultSettings, ...(stored ?? {}) }
  const set = async <K extends keyof Settings>(k: K, v: Settings[K]) => {
    await db.appSettings.put({ key: 'settings', value: { ...settings, [k]: v } })
  }
  return [settings, set]
}
