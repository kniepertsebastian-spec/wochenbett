import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackLink, Button, Card, Modal } from '../components'
import { db, requestPersistence } from '../db/db'
import { deleteAllData, exportAll, importAll, ImportError } from '../db/privacy'
import { useSync } from '../sync/SyncProvider'

const rows: [string, string][] = [
  ['Profil (Geburtsdatum, Geburtsart, Freigabe)', 'Phase und Empfehlungen werden daraus berechnet'],
  ['Check-ins und Einheiten', 'Verlauf, „Mein Weg“, Empfehlungen'],
  ['Beschwerden, Beckenboden und Bauchmitte', 'Tagebuch und Verlauf, nur für dich'],
  ['Stimmung (freiwillig)', 'nur für dich'],
  ['Termine, gemerkte Rezepte und Tipps', 'Gedächtnisstütze'],
  ['Einstellungen, Ziele und Trainingsmittel', 'damit die App zu dir passt'],
]

export function DataPage() {
  const { client: syncClient, username: syncUser } = useSync()
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)

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
    // Erst abmelden: sonst könnte der leere Stand später den Server-Stand überschreiben
    await syncClient.logout()
    await deleteAllData(db)
    setConfirm(false)
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Deine Daten</h1>
      <p className="text-stone-600 dark:text-stone-400">Du entscheidest, was mit deinen Daten passiert. Hier siehst du, was gespeichert wird und wo.</p>

      <Card className="space-y-3">
        <h2 className="font-semibold">Was wird gespeichert?</h2>
        <ul className="space-y-2">
          {rows.map(([what, why]) => (
            <li key={what}><span className="block font-medium">{what}</span><span className="block text-sm text-stone-600 dark:text-stone-400">{why}</span></li>
          ))}
        </ul>
        <p className="text-sm">Nicht gespeichert werden: Name, E-Mail, Standort, Gewicht, Kalorien. Es gibt kein Tracking und keine Werbung.</p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Wo liegen die Daten?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Immer lokal</strong> auf diesem Gerät, im Speicher deines Browsers. Die App funktioniert damit auch ohne Internet.</li>
          <li><strong>Mit Sync-Konto zusätzlich auf dem Server</strong>, aber nur verschlüsselt. Der Server kann sie nicht lesen. Das Konto ist freiwillig.</li>
          <li><strong>Das Passwort</strong> verlässt dein Gerät nie.</li>
        </ul>
        <p>{syncUser ? <>Du bist als <strong>{syncUser}</strong> angemeldet.</> : 'Du nutzt gerade kein Sync-Konto: alles bleibt auf diesem Gerät.'}</p>
        <Link to="/more/sync" className="flex min-h-12 items-center underline">Sync & Sicherung</Link>
        <p className="text-sm text-stone-600 dark:text-stone-400">Ohne Sync-Konto sind die Daten weg, wenn du Browserdaten löschst oder das Handy wechselst. Exportiere sie dann regelmäßig.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Sichern und löschen</h2>
        <Button variant="secondary" onClick={doExport}>Daten exportieren (Datei)</Button>
        <Button variant="secondary" onClick={() => file.current?.click()}>Daten importieren</Button>
        <input ref={file} type="file" accept="application/json" className="hidden" aria-label="Export-Datei auswählen" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <Link to="/more/export" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">Verlauf für Hebamme oder Ärztin erstellen</Link>
        <Button variant="secondary" onClick={() => requestPersistence().then((ok) => setMsg(ok ? 'Speicher wird vom Browser geschützt.' : 'Der Browser hat den Schutz nicht zugesagt. Exportiere deine Daten regelmäßig.'))}>Speicher schützen lassen</Button>
        <Button variant="ghost" onClick={() => setConfirm(true)}>Alle Daten löschen</Button>
        {msg && <p role="status">{msg}</p>}
      </Card>

      <Modal open={confirm} title="Alle Daten löschen?" onClose={() => setConfirm(false)}>
        <p className="mb-4">Dies löscht dein Profil, alle Einträge und Einstellungen auf diesem Gerät. Das kann nicht rückgängig gemacht werden.{syncUser ? ' Du wirst auch vom Sync abgemeldet. Deine gesicherten Daten auf dem Server bleiben erhalten und kommen nach erneutem Anmelden zurück.' : ''}</p>
        <div className="grid gap-2">
          <Button onClick={wipe}>Endgültig löschen</Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Abbrechen</Button>
        </div>
      </Modal>
    </main>
  )
}
