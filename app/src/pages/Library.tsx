import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, ExerciseCard, WarningBanner, BackLink } from '../components'
import { useSession } from '../app/session'
import { exerciseById, exercises } from '../content/exercises'
import type { Readiness } from '../domain/types'
import { isEligible } from '../engine/eligibility'
import { buildRecoverySet } from '../engine/recommend'
import { useUserState } from '../hooks/useUserState'

const neutral: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }

export function LibraryPage() {
  const nav = useNavigate()
  const { user } = useUserState()
  const { setSession } = useSession()
  const [oneHand, setOneHand] = useState(false)
  const list = useMemo(() => (user ? exercises.filter((e) => isEligible(e, user, neutral) && (!oneHand || e.oneHandFriendly)) : []), [user, oneHand])
  if (!user) return null

  const startRecovery = (min: 2 | 5 | 10) => {
    setSession({ kind: 'recovery', durationMin: min, exercises: buildRecoverySet(user, neutral, exercises, min, Math.floor(Date.now() / 86_400_000)), readiness: null })
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
            <Button key={m} variant="secondary" onClick={() => startRecovery(m)}>
              {m} Min
            </Button>
          ))}
        </div>
      </Card>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" className="size-5" checked={oneHand} onChange={(e) => setOneHand(e.target.checked)} />
        Nur Einhand-geeignete Übungen
      </label>
      <div className="space-y-3">
        {list.map((e) => (
          <Link key={e.id} to={`/library/${e.id}`} className="block">
            <ExerciseCard name={e.name} description={e.description} meta={`Phase ${e.phase}`} oneHandFriendly={e.oneHandFriendly} />
          </Link>
        ))}
        {list.length === 0 && <Card>Keine passenden Übungen.</Card>}
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">Es werden nur Übungen gezeigt, die zu deinem aktuellen Stand passen.</p>
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
  if (!e || !isEligible(e, user, neutral)) {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
        <p>Diese Übung ist für dich aktuell nicht verfügbar.</p>
        <BackLink to="/library">← Zurück</BackLink>
      </main>
    )
  }
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/library">← Übungen</BackLink>
      <h1 className="text-2xl font-semibold">{e.name}</h1>
      <p>{e.description}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {e.instructions.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      <p><strong>Atmung:</strong> {e.breathing}</p>
      <p><strong>Beansprucht:</strong> {e.targetMuscles.join(', ')}</p>
      {e.equipment.length > 0 && <p><strong>Du brauchst:</strong> {e.equipment.join(', ')}</p>}
      <Card className="space-y-1">
        <h2 className="font-semibold">Sicherheit</h2>
        <p>Abbrechen bei: Schmerz, Druck im Becken, Urinverlust{e.stopCriteria.includes('doming') ? ', Bauchwölbung' : ''}.</p>
        {e.contraindications.map((c, i) => <p key={i} className="text-sm text-stone-600 dark:text-stone-400">{c.note}</p>)}
      </Card>
      {e.meta.status === 'draft' && <WarningBanner level="yellow">Entwurf: Dieser Inhalt wurde noch nicht fachlich geprüft.</WarningBanner>}
      <Button className="w-full" onClick={() => { setSession({ kind: 'workout', durationMin: Math.ceil(e.duration / 60), exercises: [e], readiness: null }); nav('/workout') }}>
        Diese Übung starten
      </Button>
    </main>
  )
}
