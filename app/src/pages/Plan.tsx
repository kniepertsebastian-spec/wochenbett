import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, ExerciseCard, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { RED_FLAGS, urgencyMessage } from '../engine/redflags'

export function PlanPage() {
  const nav = useNavigate()
  const { recommendation: r, setSession, lastReadiness, situation } = useSession()
  if (!r) return <Navigate to="/" replace />

  if (r.kind === 'stop') {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-24">
        <h1 className="text-2xl font-semibold">Heute kein Training</h1>
        <WarningBanner level="red">
          <p>{urgencyMessage(r.urgency)}</p>
          <ul className="mt-2 list-disc pl-5">
            {r.reasons.map((id) => (
              <li key={id}>{RED_FLAGS[id].label}</li>
            ))}
          </ul>
        </WarningBanner>
        <p className="text-stone-600 dark:text-stone-400">
          Die App kann nicht beurteilen, was dahintersteckt. Bitte lass es von einer Fachperson abklären. Training ist erst wieder sinnvoll, wenn das geklärt ist.
        </p>
        <Link to="/" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">
          Zurück
        </Link>
      </main>
    )
  }

  const start = () => {
    setSession({ kind: r.kind, durationMin: r.durationMin, exercises: r.exercises, readiness: lastReadiness, silent: situation === 'baby_sleeping' })
    nav('/workout')
  }
  const title = r.kind === 'recovery' ? `Recovery · ${r.durationMin} Minuten` : `Deine Einheit · ca. ${r.durationMin} Minuten`
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-32">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {r.light === 'yellow' && (
        <WarningBanner level="yellow">Heute geht es sanfter. Pausieren ist völlig in Ordnung, nichts muss.</WarningBanner>
      )}
      {r.kind === 'workout' && !r.allowProgression && (
        <Card>Heute bleibt es bei vertrauten Übungen, ohne Steigerung.</Card>
      )}
      <div className="space-y-3">
        {r.exercises.map((e) => (
          <ExerciseCard key={e.id} name={e.name} description={e.description} meta={`${Math.round(e.duration / 60)} Min${e.repetitions ? ` · ${e.repetitions} Wdh.` : ''}`} oneHandFriendly={e.oneHandFriendly} />
        ))}
      </div>
      {r.exercises.length === 0 && <Card>Heute gibt es keine passende Übung. Ruh dich aus.</Card>}
      <div className="pb-safe fixed inset-x-0 bottom-14 border-t border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto max-w-md">
          <Button className="w-full" disabled={r.exercises.length === 0} onClick={start}>
            Starten
          </Button>
        </div>
      </div>
    </main>
  )
}
