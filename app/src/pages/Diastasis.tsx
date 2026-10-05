import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CheckIn, WarningBanner } from '../components'
import { db, type DiastasisLog } from '../db/db'

const widths = [0, 1, 2, 3, 4, 5].map((v) => ({ value: v, label: v === 5 ? '5+' : String(v) }))

function Chart({ logs }: { logs: DiastasisLog[] }) {
  const pts = logs.filter((l) => l.widthFingers !== undefined)
  if (pts.length < 2) return <p className="text-sm text-stone-600 dark:text-stone-400">Ab zwei Messungen siehst du hier den Verlauf.</p>
  const W = 320, H = 120, pad = 24
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (pts.length - 1)
  const y = (v: number) => H - pad - (v / 5) * (H - 2 * pad)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Verlauf der Breite in Fingerbreiten: ${pts.map((p) => p.widthFingers).join(', ')}`} className="w-full">
      {[0, 1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="currentColor" opacity="0.15" />
          <text x={4} y={y(v) + 4} fontSize="10" fill="currentColor">{v}</text>
        </g>
      ))}
      <polyline fill="none" stroke="#be123c" strokeWidth="2" points={pts.map((p, i) => `${x(i)},${y(p.widthFingers!)}`).join(' ')} />
      {pts.map((p, i) => <circle key={p.id} cx={x(i)} cy={y(p.widthFingers!)} r="4" fill={p.doming ? '#be123c' : 'none'} stroke="#be123c" strokeWidth="2" />)}
    </svg>
  )
}

export function DiastasisPage() {
  const logs = useLiveQuery(() => db.diastasisLogs.orderBy('date').toArray(), [])
  const [width, setWidth] = useState<number | null>(null)
  const [doming, setDoming] = useState<'yes' | 'no' | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  async function save() {
    if (width === null || !doming) return
    await db.diastasisLogs.add({ date: new Date().toISOString(), widthFingers: width, doming: doming === 'yes', note: note.trim() || undefined })
    setWidth(null); setDoming(null); setNote(''); setSaved(true)
  }
  const latest = logs?.at(-1)

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <Link to="/pelvic-floor" className="underline">← Beckenboden</Link>
      <h1 className="text-2xl font-semibold">Bauchmitte beobachten</h1>
      <WarningBanner level="yellow">
        Das ist eine Selbstbeobachtung und keine Diagnose. Die App kann nicht beurteilen, ob bei dir eine Rektusdiastase vorliegt. Lass Auffälligkeiten von deiner Hebamme oder Physiotherapeutin untersuchen. (Entwurf, noch nicht fachlich geprüft.)
      </WarningBanner>

      <Card className="space-y-3">
        <h2 className="font-semibold">So beobachtest du</h2>
        <svg viewBox="0 0 320 110" role="img" aria-label="Schema: zwei Bauchmuskelstränge mit Abstand in der Mitte, darüber flach aufgelegte Finger" className="w-full">
          <rect x="40" y="25" width="100" height="60" rx="14" fill="#fda4af" />
          <rect x="180" y="25" width="100" height="60" rx="14" fill="#fda4af" />
          <line x1="160" y1="15" x2="160" y2="95" stroke="currentColor" strokeDasharray="4 3" />
          <circle cx="160" cy="55" r="5" fill="currentColor" />
          <text x="160" y="108" fontSize="11" textAnchor="middle" fill="currentColor">Bauchnabel · Abstand in Fingerbreiten</text>
          <path d="M140 55h40" stroke="currentColor" strokeWidth="2" />
        </svg>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Rückenlage, Knie angestellt, Bauch locker.</li>
          <li>Finger flach quer auf Höhe des Bauchnabels auflegen.</li>
          <li>Ausatmen und den Kopf nur leicht anheben. Spüre, wie viele Fingerbreiten Platz zwischen den Muskelsträngen sind.</li>
          <li>Achte darauf, ob sich in der Mitte eine Wölbung zeigt (Doming). Wenn ja, trage das ein.</li>
          <li>Immer unter gleichen Bedingungen messen, höchstens einmal pro Woche.</li>
        </ol>
        <p className="text-sm text-stone-600 dark:text-stone-400">Bei Schmerzen oder Druck im Becken: nicht messen, sondern Fachperson fragen.</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Neue Beobachtung</h2>
        <CheckIn legend="Abstand in Fingerbreiten" options={widths} value={width} onChange={setWidth} />
        <CheckIn legend="Wölbung (Doming) beobachtet?" options={[{ value: 'no', label: 'nein' }, { value: 'yes', label: 'ja' }]} value={doming} onChange={setDoming} />
        <label className="block">
          <span className="mb-1 block">Notiz (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-stone-300 bg-transparent p-3 dark:border-stone-700" />
        </label>
        <Button disabled={width === null || !doming} onClick={save}>Eintragen</Button>
        {saved && <p role="status">Gespeichert. Nur auf deinem Gerät.</p>}
      </Card>

      {latest?.doming && (
        <WarningBanner level="yellow">Doming wurde beobachtet. Die App zeigt dir deshalb keine Übungen, die den Bauch stark belasten, und bietet leichtere Varianten an. Sprich bitte mit deiner Hebamme oder Physiotherapeutin darüber.</WarningBanner>
      )}

      <Card className="space-y-2">
        <h2 className="font-semibold">Verlauf</h2>
        {logs && <Chart logs={logs} />}
        {logs && logs.length > 0 && (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Beobachtungen</caption>
            <thead><tr><th scope="col">Datum</th><th scope="col">Fingerbreiten</th><th scope="col">Doming</th></tr></thead>
            <tbody>
              {[...logs].reverse().map((l) => (
                <tr key={l.id}><td>{new Date(l.date).toLocaleDateString('de-DE')}</td><td>{l.widthFingers ?? '–'}</td><td>{l.doming ? 'ja' : 'nein'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  )
}
