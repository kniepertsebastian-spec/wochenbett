import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, CheckIn, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { exerciseById } from '../content/exercises'
import { db } from '../db/db'
import type { PainLevel } from '../domain/types'

const modules = [
  { id: 'pelvic-floor-awareness', title: 'Wahrnehmen', text: 'Spüren, wo dein Beckenboden sitzt und wie er sich anfühlt.' },
  { id: 'breath-pelvic-floor', title: 'Atmung + Beckenboden', text: 'Ausatmen: sanft anheben. Einatmen: ganz loslassen.' },
  { id: 'pelvic-floor-release', title: 'Entspannen', text: 'Loslassen ist genauso wichtig wie Anspannen. Es geht nicht um möglichst starke Kontraktion.' },
] as const

// ENTWURF, nicht fachlich geprüft (practical_tip)
const everyday = [
  { t: 'Husten & Niesen', d: 'Wenn du es kommen spürst: ausatmen und den Beckenboden sanft anheben, nicht dagegen pressen.' },
  { t: 'Lachen', d: 'Beckenboden bewusst weich halten und weiteratmen, nicht die Luft anhalten.' },
  { t: 'Heben', d: 'Last nah am Körper halten, beim Anheben ausatmen, nicht pressen.' },
  { t: 'Aufstehen', d: 'Über die Seite aufstehen, beim Aufrichten ausatmen.' },
  { t: 'Toilettengang', d: 'Zeit lassen, nicht pressen, Füße leicht erhöht abstellen und locker bleiben.' },
]

const levels: { value: PainLevel; label: string }[] = [
  { value: 'none', label: 'keins' },
  { value: 'mild', label: 'leicht' },
  { value: 'moderate', label: 'mittel' },
  { value: 'severe', label: 'stark' },
]

export function PelvicFloorPage() {
  const nav = useNavigate()
  const { setSession } = useSession()
  const [urine, setUrine] = useState<'yes' | 'no' | null>(null)
  const [pressure, setPressure] = useState<PainLevel | null>(null)
  const [heaviness, setHeaviness] = useState<PainLevel | null>(null)
  const [pain, setPain] = useState<PainLevel | null>(null)
  const [bowel, setBowel] = useState<'yes' | 'no' | null>(null)
  const [saved, setSaved] = useState(false)
  const logs = useLiveQuery(() => db.symptomLogs.orderBy('date').reverse().limit(5).toArray(), [])

  const start = (id: string) => {
    const e = exerciseById(id)
    if (!e) return
    setSession({ kind: 'recovery', durationMin: Math.ceil(e.duration / 60), exercises: [e], readiness: null })
    nav('/workout')
  }
  const complete = urine && pressure && heaviness && pain && bowel
  async function save() {
    if (!urine || !pressure || !heaviness || !pain || !bowel) return
    await db.symptomLogs.add({ date: new Date().toISOString(), urineLeakage: urine === 'yes', pressure, heaviness, pain, bowelProblems: bowel === 'yes' })
    setUrine(null); setPressure(null); setHeaviness(null); setPain(null); setBowel(null)
    setSaved(true)
  }
  const worrying = (l: { pressure: PainLevel; pain: PainLevel }) => l.pressure === 'severe' || l.pain === 'severe'

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Beckenboden</h1>
      <p className="text-stone-600 dark:text-stone-400">Wahrnehmen, anspannen, entspannen und mit der Atmung verbinden.</p>
      {modules.map((m) => (
        <Card key={m.id} className="space-y-2">
          <h2 className="font-semibold">{m.title}</h2>
          <p>{m.text}</p>
          <Button variant="secondary" onClick={() => start(m.id)}>Üben</Button>
        </Card>
      ))}

      <Card className="space-y-2">
        <h2 className="font-semibold">Bauchmitte beobachten</h2>
        <p>Selbstbeobachtung der Bauchmitte mit Verlauf, zum Besprechen mit deiner Fachperson.</p>
        <Link to="/diastasis" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">Öffnen</Link>
      </Card>

      <h2 className="text-xl font-semibold">Im Alltag</h2>
      <WarningBanner level="yellow">Entwurf: Diese Tipps wurden noch nicht fachlich geprüft.</WarningBanner>
      {everyday.map((e) => (
        <Card key={e.t}><p className="font-medium">{e.t}</p><p className="text-stone-600 dark:text-stone-400">{e.d}</p></Card>
      ))}

      <h2 className="text-xl font-semibold">Symptom-Tagebuch</h2>
      <Card className="space-y-4">
        <CheckIn legend="Urinverlust?" options={[{ value: 'no', label: 'nein' }, { value: 'yes', label: 'ja' }]} value={urine} onChange={setUrine} />
        <CheckIn legend="Druckgefühl" options={levels} value={pressure} onChange={setPressure} />
        <CheckIn legend="Schweregefühl" options={levels} value={heaviness} onChange={setHeaviness} />
        <CheckIn legend="Schmerzen" options={levels} value={pain} onChange={setPain} />
        <CheckIn legend="Probleme beim Stuhlgang?" options={[{ value: 'no', label: 'nein' }, { value: 'yes', label: 'ja' }]} value={bowel} onChange={setBowel} />
        <Button disabled={!complete} onClick={save}>Eintragen</Button>
        {saved && <p role="status">Gespeichert. Nur auf deinem Gerät.</p>}
      </Card>
      {logs?.some(worrying) && (
        <WarningBanner level="red">Starke Beschwerden: Bitte sprich mit deiner Hebamme, Physiotherapeutin oder Ärztin darüber.</WarningBanner>
      )}
      {logs && logs.length > 0 && (
        <Card>
          <h3 className="mb-2 font-medium">Letzte Einträge</h3>
          <ul className="space-y-1 text-sm">
            {logs.map((l) => (
              <li key={l.id}>{new Date(l.date).toLocaleDateString('de-DE')}: Druck {label(l.pressure)}, Schwere {label(l.heaviness)}, Schmerz {label(l.pain)}{l.urineLeakage ? ', Urinverlust' : ''}{l.bowelProblems ? ', Stuhlgang' : ''}</li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  )
}
const label = (p: PainLevel) => levels.find((l) => l.value === p)!.label
