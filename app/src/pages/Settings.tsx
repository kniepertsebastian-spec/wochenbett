import { useRef, useState } from 'react'
import { Button, Card, Modal, WarningBanner } from '../components'
import { db, requestPersistence } from '../db/db'
import { deleteAllData, exportAll, importAll, ImportError } from '../db/privacy'
import type { BirthType } from '../domain/types'
import { useSettings } from '../hooks/useSettings'
import { DEFAULT_EQUIPMENT, EQUIPMENT } from '../domain/equipment'
import type { EquipmentId } from '../domain/types'
import { useProfile } from '../hooks/useUserState'
import { useLiveQuery } from 'dexie-react-hooks'

export function SettingsPage() {
  const profile = useProfile()
  const [settings, set] = useSettings()
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const owned = useLiveQuery(async () => ((await db.appSettings.get('equipment'))?.value as EquipmentId[] | undefined) ?? DEFAULT_EQUIPMENT, [])
  const toggleEquipment = (id: EquipmentId) => {
    const cur = owned ?? DEFAULT_EQUIPMENT
    return db.appSettings.put({ key: 'equipment', value: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }

  async function doExport() {
    const data = await exportAll(db)
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `rueckbildung-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Export erstellt. Die Datei liegt nur bei dir.')
  }
  async function doImport(f: File) {
    try {
      await importAll(db, JSON.parse(await f.text()))
      setMsg('Import abgeschlossen.')
    } catch (e) {
      setMsg(e instanceof ImportError ? e.message : 'Die Datei konnte nicht gelesen werden.')
    }
  }
  async function wipe() {
    await deleteAllData(db)
    setConfirm(false)
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

      <Card className="space-y-3">
        <h2 className="font-semibold">Deine Daten</h2>
        <p className="text-stone-600 dark:text-stone-400">Alle Daten bleiben auf diesem Gerät. Es gibt keine Registrierung und kein Tracking.</p>
        <Button variant="secondary" onClick={doExport}>Daten exportieren (JSON)</Button>
        <Button variant="secondary" onClick={() => file.current?.click()}>Daten importieren</Button>
        <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <Button variant="secondary" onClick={() => requestPersistence().then((ok) => setMsg(ok ? 'Speicher wird vom Browser geschützt.' : 'Der Browser hat den Schutz nicht zugesagt. Exportiere deine Daten regelmäßig.'))}>Speicher schützen lassen</Button>
        <Button variant="ghost" onClick={() => setConfirm(true)}>Alle Daten löschen</Button>
        {msg && <p role="status">{msg}</p>}
      </Card>
      <WarningBanner level="yellow">Keine Diagnostik, keine Therapie. Die App ersetzt keine Hebamme, Physiotherapeutin oder Ärztin.</WarningBanner>

      <Modal open={confirm} title="Alle Daten löschen?" onClose={() => setConfirm(false)}>
        <p className="mb-4">Dies löscht dein Profil, alle Einträge und Einstellungen auf diesem Gerät. Das kann nicht rückgängig gemacht werden.</p>
        <div className="grid gap-2">
          <Button onClick={wipe}>Endgültig löschen</Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Abbrechen</Button>
        </div>
      </Modal>
    </main>
  )
}
