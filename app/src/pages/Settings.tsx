import { Link } from 'react-router-dom'
import { Card, WarningBanner } from '../components'
import { db } from '../db/db'
import type { BirthType } from '../domain/types'
import { useSettings } from '../hooks/useSettings'
import { DEFAULT_EQUIPMENT, EQUIPMENT } from '../domain/equipment'
import type { EquipmentId } from '../domain/types'
import { useProfile } from '../hooks/useUserState'
import { useLiveQuery } from 'dexie-react-hooks'

export function SettingsPage() {
  const profile = useProfile()
  const [settings, set] = useSettings()
  const owned = useLiveQuery(async () => ((await db.appSettings.get('equipment'))?.value as EquipmentId[] | undefined) ?? DEFAULT_EQUIPMENT, [])
  const toggleEquipment = (id: EquipmentId) => {
    const cur = owned ?? DEFAULT_EQUIPMENT
    return db.appSettings.put({ key: 'equipment', value: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }

  const toggles: { key: 'speech' | 'gong' | 'vibration'; label: string }[] = [
    { key: 'speech', label: 'Sprachansagen' },
    { key: 'gong', label: 'Gong' },
    { key: 'vibration', label: 'Vibration' },
  ]

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <Card className="space-y-1">
        <h2 className="font-semibold">Audio (alles optional)</h2>
        {toggles.map((t) => (
          <label key={t.key} className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="size-5" checked={settings[t.key]} onChange={(e) => set(t.key, e.target.checked)} />
            {t.label}
          </label>
        ))}
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-5" checked={settings.screenless} onChange={(e) => set('screenless', e.target.checked)} />
          Ohne Bildschirm trainieren (Audio führt durch)
        </label>
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-5" checked={settings.autoStartNext} onChange={(e) => set('autoStartNext', e.target.checked)} />
          Nächste Übung nach 10 Sekunden automatisch starten
        </label>
      </Card>

      <Card className="space-y-1">
        <h2 className="font-semibold">Meine Trainingsmittel</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">Übungen mit Hilfsmitteln erscheinen nur, wenn du sie hast.</p>
        {owned && EQUIPMENT.map((q) => (
          <label key={q.id} className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="size-5" checked={owned.includes(q.id)} onChange={() => toggleEquipment(q.id)} />
            {q.label}
          </label>
        ))}
      </Card>

      {profile && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Profil</h2>
          <label className="block">
            <span className="mb-1 block">Geburtsdatum</span>
            <input type="date" value={profile.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && db.userProfile.update('me', { birthDate: e.target.value })} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" />
          </label>
          <label className="block">
            <span className="mb-1 block">Geburtsart</span>
            <select value={profile.birthType} onChange={(e) => db.userProfile.update('me', { birthType: e.target.value as BirthType })} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700">
              <option value="vaginal">Spontangeburt</option>
              <option value="cesarean">Kaiserschnitt</option>
              <option value="unknown">Keine Angabe</option>
            </select>
          </label>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" className="mt-1 size-5" checked={profile.medicalClearance} onChange={(e) => db.userProfile.update('me', { medicalClearance: e.target.checked })} />
            <span>Medizinische Freigabe für sportliche Aktivität liegt vor</span>
          </label>
        </Card>
      )}

      <Link to="/more/data" className="block rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <span className="block font-medium">Deine Daten: Export, Import, Löschen</span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">Was gespeichert wird und wo</span>
      </Link>
      <WarningBanner level="yellow">Keine Diagnostik, keine Therapie. Die App ersetzt keine Hebamme, Physiotherapeutin oder Ärztin.</WarningBanner>

    </main>
  )
}
