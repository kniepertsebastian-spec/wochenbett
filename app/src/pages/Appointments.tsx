import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BackLink, Button, Card, MonthCalendar, type DayMarker } from '../components'
import { db, type Appointment } from '../db/db'

const kinds: Record<Appointment['kind'], string> = { midwife: 'Hebamme', gynecology: 'Gynäkologie', checkup: 'Nachuntersuchung', custom: 'Eigene Erinnerung' }

export function AppointmentsPage() {
  const list = useLiveQuery(() => db.appointments.orderBy('date').toArray(), [])
  const sessionDates = useLiveQuery(async () => (await db.workoutHistory.toArray()).map((w) => w.date.slice(0, 10)), [])
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const markers: Record<string, DayMarker> = {}
  for (const a of list ?? []) (markers[a.date] ??= { appointments: 0, sessions: 0 }).appointments++
  for (const d of sessionDates ?? []) (markers[d] ??= { appointments: 0, sessions: 0 }).sessions++
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [kind, setKind] = useState<Appointment['kind']>('midwife')
  const today = new Date().toISOString().slice(0, 10)
  async function add() {
    if (!date) return
    await db.appointments.add({ date, title: title.trim() || kinds[kind], kind })
    setTitle(''); setDate('')
  }
  const upcoming = list?.filter((a) => a.date >= today) ?? []
  const past = list?.filter((a) => a.date < today) ?? []
  const row = (a: Appointment) => (
    <Card key={a.id} className="flex items-center justify-between gap-3">
      <span><span className="block font-medium">{a.title}</span><span className="text-sm text-stone-600 dark:text-stone-400">{new Date(a.date).toLocaleDateString('de-DE')} · {kinds[a.kind]}</span></span>
      <Button variant="ghost" aria-label={`${a.title} löschen`} onClick={() => a.id && db.appointments.delete(a.id)}>Löschen</Button>
    </Card>
  )
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Termine</h1>
      <p className="text-stone-600 dark:text-stone-400">Die App sendet keine Benachrichtigungen. Termine bleiben auf deinem Gerät und sind eine Gedächtnisstütze.</p>
      <Card className="p-2">
        <MonthCalendar month={month} markers={markers} selected={selected} onSelect={(iso) => { setSelected(iso); setDate(iso) }} onMonthChange={setMonth} />
      </Card>
      {selected && (
        <Card className="space-y-1" aria-live="polite">
          <h2 className="font-semibold">{new Date(selected).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          {(list ?? []).filter((a) => a.date === selected).map((a) => <p key={a.id}>{a.title} · {kinds[a.kind]}</p>)}
          {(sessionDates ?? []).filter((d) => d === selected).length > 0 && <p>{(sessionDates ?? []).filter((d) => d === selected).length} Einheit(en) abgeschlossen</p>}
          {!(list ?? []).some((a) => a.date === selected) && !(sessionDates ?? []).includes(selected) && <p className="text-stone-600 dark:text-stone-400">Nichts eingetragen. Unten kannst du einen Termin für diesen Tag anlegen.</p>}
        </Card>
      )}
      <Card className="space-y-3">
        <label className="block"><span className="mb-1 block">Art</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as Appointment['kind'])} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700">
            {(Object.keys(kinds) as Appointment['kind'][]).map((k) => <option key={k} value={k}>{kinds[k]}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block">Titel (optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" /></label>
        <label className="block"><span className="mb-1 block">Datum</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" /></label>
        <Button disabled={!date} onClick={add}>Hinzufügen</Button>
      </Card>
      <h2 className="text-xl font-semibold">Anstehend</h2>
      {upcoming.length === 0 ? <p>Keine anstehenden Termine.</p> : upcoming.map(row)}
      {past.length > 0 && (<><h2 className="text-xl font-semibold">Vergangen</h2>{past.map(row)}</>)}
    </main>
  )
}
