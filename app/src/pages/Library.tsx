import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackLink, Button, Card, ExerciseCard, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { exerciseById, exercises } from '../content/exercises'
import { equipmentLabel } from '../domain/equipment'
import type { PhaseId, Readiness } from '../domain/types'
import { ineligibleReason } from '../engine/eligibility'
import { buildBedSet, buildRecoverySet } from '../engine/recommend'
import { useUserState } from '../hooks/useUserState'

const neutral: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }
const phaseNames: Record<PhaseId, string> = { 1: 'Recovery & Wahrnehmung', 2: 'Basis', 3: 'Aufbau', 4: 'Belastbarkeit' }
const day = () => Math.floor(Date.now() / 86_400_000)

export function LibraryPage() {
  const nav = useNavigate()
  const { user } = useUserState()
  const { setSession } = useSession()
  const [tab, setTab] = useState<'today' | 'all'>('today')
  const [oneHand, setOneHand] = useState(false)
  const [bed, setBed] = useState(false)
  const [phase, setPhase] = useState<PhaseId | 0>(0)

  const rows = useMemo(
    () =>
      user
        ? exercises
            .map((e) => ({ e, reason: ineligibleReason(e, user, neutral) }))
            .filter(({ e, reason }) => (tab === 'all' || reason === null) && (!oneHand || e.oneHandFriendly) && (!bed || e.bedFriendly) && (phase === 0 || e.phase === phase))
        : [],
    [user, tab, oneHand, bed, phase],
  )
  if (!user) return null

  const start = (kind: 'recovery', min: number, list: typeof exercises) => {
    setSession({ kind, durationMin: min, exercises: list, readiness: null })
    nav('/workout')
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Übungen</h1>

      <Card className="space-y-3">
        <h2 className="font-semibold">Recovery</h2>
        <p className="text-stone-600 dark:text-stone-400">Sanfte Einheiten für Tage mit wenig Energie. Kleine Einheiten zählen.</p>
        <div className="grid grid-cols-3 gap-2">
          {([2, 5, 10] as const).map((m) => (
            <Button key={m} variant="secondary" onClick={() => start('recovery', m, buildRecoverySet(user, neutral, exercises, m, day()))}>
              {m} Min
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Nebenbei im Bett</h2>
        <p className="text-stone-600 dark:text-stone-400">Kleine Übungen für Bett oder Sofa, ohne Aufbau, auch wenn das Baby neben dir liegt.</p>
        <div className="grid grid-cols-2 gap-2">
          {([2, 5] as const).map((m) => (
            <Button key={m} variant="secondary" onClick={() => start('recovery', m, buildBedSet(user, neutral, exercises, m, day()))}>
              {m} Min im Bett
            </Button>
          ))}
        </div>
      </Card>

      <Link to="/pelvic-floor" className="block rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <span className="block font-medium">Beckenboden</span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">Wahrnehmen, üben und Alltagssituationen</span>
      </Link>

      <div role="tablist" aria-label="Ansicht" className="grid grid-cols-2 gap-2">
        <Button role="tab" aria-selected={tab === 'today'} variant={tab === 'today' ? 'primary' : 'secondary'} onClick={() => setTab('today')}>Für dich</Button>
        <Button role="tab" aria-selected={tab === 'all'} variant={tab === 'all' ? 'primary' : 'secondary'} onClick={() => setTab('all')}>Alle Übungen</Button>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {tab === 'today' ? 'Übungen, die zu deinem aktuellen Stand passen.' : `Alle ${exercises.length} Übungen. Bei nicht verfügbaren steht der Grund dabei.`}
      </p>

      <div className="space-y-1">
        <label className="flex min-h-12 items-center gap-3"><input type="checkbox" className="size-5" checked={oneHand} onChange={(e) => setOneHand(e.target.checked)} />Nur Einhand-geeignete</label>
        <label className="flex min-h-12 items-center gap-3"><input type="checkbox" className="size-5" checked={bed} onChange={(e) => setBed(e.target.checked)} />Nur Bett-Übungen</label>
        <label className="block">
          <span className="mb-1 block">Phase</span>
          <select value={phase} onChange={(e) => setPhase(Number(e.target.value) as PhaseId | 0)} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700">
            <option value={0}>alle</option>
            {([1, 2, 3, 4] as const).map((p) => <option key={p} value={p}>Phase {p}: {phaseNames[p]}</option>)}
          </select>
        </label>
      </div>

      <p role="status" className="text-sm">{rows.length} Übungen</p>
      <div className="space-y-3">
        {rows.map(({ e, reason }) => (
          <Link key={e.id} to={`/library/${e.id}`} className="block">
            <ExerciseCard
              name={e.name}
              description={e.description}
              meta={[`Phase ${e.phase}`, e.bedFriendly ? 'im Bett' : '', e.requires.map(equipmentLabel).join(', ')].filter(Boolean).join(' · ')}
              oneHandFriendly={e.oneHandFriendly}
              note={reason ?? undefined}
            />
          </Link>
        ))}
        {rows.length === 0 && <Card>Keine passenden Übungen.</Card>}
      </div>
    </main>
  )
}

export function ExerciseDetailPage() {
  const { id } = useParams()
  const { user } = useUserState()
  const { setSession } = useSession()
  const nav = useNavigate()
  const e = id ? exerciseById(id) : undefined
  if (!user) return null
  if (!e) {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
        <BackLink to="/library">← Zurück</BackLink>
        <p>Diese Übung gibt es nicht.</p>
      </main>
    )
  }
  const reason = ineligibleReason(e, user, neutral)
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/library">← Übungen</BackLink>
      <h1 className="text-2xl font-semibold">{e.name}</h1>
      {reason && <WarningBanner level="yellow">Aktuell nicht verfügbar: {reason}</WarningBanner>}
      {e.media?.map((m) => (m.kind === 'image' ? <img key={m.src} src={m.src} alt={m.alt} className="w-full rounded-2xl" loading="lazy" /> : <video key={m.src} src={m.src} controls playsInline muted aria-label={m.alt} className="w-full rounded-2xl" />))}
      <p>{e.description}</p>
      <Card className="space-y-1">
        <h2 className="font-semibold">Warum diese Übung?</h2>
        <p>{e.why}</p>
      </Card>
      <h2 className="font-semibold">So geht's</h2>
      <ol className="list-decimal space-y-1 pl-5">
        {e.instructions.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      <p><strong>Atmung:</strong> {e.breathing}</p>
      <p><strong>Beansprucht:</strong> {e.targetMuscles.join(', ')}</p>
      {e.requires.length > 0 && <p><strong>Du brauchst:</strong> {e.requires.map(equipmentLabel).join(', ')}</p>}
      <Card className="space-y-1">
        <h2 className="font-semibold">Sicherheit</h2>
        <p>Abbrechen bei: Schmerz, Druck im Becken, Urinverlust{e.stopCriteria.includes('doming') ? ', Bauchwölbung' : ''}.</p>
        {e.contraindications.map((c, i) => <p key={i} className="text-sm text-stone-600 dark:text-stone-400">{c.note}</p>)}
      </Card>
      {e.meta.status === 'draft' && <WarningBanner level="yellow">Entwurf: Dieser Inhalt wurde noch nicht fachlich geprüft.</WarningBanner>}
      {!reason && (
        <Button className="w-full" onClick={() => { setSession({ kind: 'workout', durationMin: Math.ceil(e.duration / 60), exercises: [e], readiness: null }); nav('/workout') }}>
          Diese Übung starten
        </Button>
      )}
    </main>
  )
}
