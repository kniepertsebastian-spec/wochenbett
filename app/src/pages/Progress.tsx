import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Card } from '../components'
import { db } from '../db/db'
import { canAdvancePhase, SESSIONS_REQUIRED } from '../engine/progression'
import type { Readiness } from '../domain/types'
import { useUserState } from '../hooks/useUserState'

const neutral: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }
const phaseNames = ['', 'Recovery & Wahrnehmung', 'Basis', 'Aufbau', 'Belastbarkeit']

export function ProgressPage() {
  const { user } = useUserState()
  const data = useLiveQuery(async () => {
    const workouts = await db.workoutHistory.orderBy('date').toArray()
    const lastCheck = await db.readinessChecks.orderBy('date').last()
    const symptoms = await db.symptomLogs.orderBy('date').reverse().limit(10).toArray()
    return { workouts, lastCheck, symptoms }
  }, [])
  if (!user || !data) return null

  const sessions = data.workouts.filter((w) => w.kind === 'workout').length
  const recoveryDays = new Set(data.workouts.filter((w) => w.kind === 'recovery').map((w) => w.date.slice(0, 10))).size
  const recent = data.workouts.map((w) => w.nextDayReaction ?? w.reaction)
  const check = canAdvancePhase(user, data.lastCheck?.readiness ?? neutral, recent)

  async function advance() {
    await db.userProgress.put({ id: 'me', currentPhase: Math.min(4, user!.currentPhase + 1) as 1 | 2 | 3 | 4, updatedAt: new Date().toISOString() })
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Verlauf</h1>
      <Card className="grid grid-cols-2 gap-3 text-center">
        <div><p className="text-3xl font-semibold">{sessions}</p><p className="text-sm">Übungseinheiten</p></div>
        <div><p className="text-3xl font-semibold">{recoveryDays}</p><p className="text-sm">Recovery-Tage</p></div>
      </Card>
      <p className="text-stone-600 dark:text-stone-400">Pausen gehören dazu. Hier zählt nur, was du geschafft hast.</p>

      <Card className="space-y-2">
        <h2 className="font-semibold">Phase {user.currentPhase}: {phaseNames[user.currentPhase]}</h2>
        {user.currentPhase < 4 ? (
          check.allowed ? (
            <>
              <p>Die Voraussetzungen für Phase {user.currentPhase + 1} sind erfüllt. Du entscheidest, ob du bereit bist.</p>
              <Button onClick={advance}>Phase {user.currentPhase + 1} freischalten</Button>
            </>
          ) : (
            <>
              <p>Für die nächste Phase fehlt noch:</p>
              <ul className="list-disc pl-5">{check.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="text-sm text-stone-600 dark:text-stone-400">Mindestens {SESSIONS_REQUIRED} beschwerdefreie Einheiten in Folge, dazu Zeit und dein Befinden. Die Zeit allein schaltet nichts frei.</p>
            </>
          )
        ) : <p>Du bist in der höchsten Phase.</p>}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Beckenboden-Symptome</h2>
        {data.symptoms.length === 0 ? <p>Noch keine Einträge.</p> : (
          <ul className="space-y-1 text-sm">
            {data.symptoms.map((s) => <li key={s.id}>{new Date(s.date).toLocaleDateString('de-DE')}: Druck {s.pressure}, Schmerz {s.pain}{s.urineLeakage ? ', Urinverlust' : ''}</li>)}
          </ul>
        )}
      </Card>
    </main>
  )
}
