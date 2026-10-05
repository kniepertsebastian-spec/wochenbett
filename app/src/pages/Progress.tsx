import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Button, Card, Modal } from '../components'
import { db } from '../db/db'
import { deleteWorkout } from '../db/workouts'
import { effectiveReaction } from '../db/reactions'
import { canAdvancePhase, maxSelectablePhase, SESSIONS_REQUIRED } from '../engine/progression'
import type { PhaseId } from '../domain/types'
import { exerciseById } from '../content/exercises'
import type { Readiness } from '../domain/types'
import { useUserState } from '../hooks/useUserState'

const neutral: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }
const phaseNames = ['', 'Recovery & Wahrnehmung', 'Basis', 'Aufbau', 'Belastbarkeit']

export function ProgressPage() {
  const { user } = useUserState()
  const [pick, setPick] = useState<PhaseId | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const data = useLiveQuery(async () => {
    const workouts = await db.workoutHistory.orderBy('date').toArray()
    const lastCheck = await db.readinessChecks.orderBy('date').last()
    const symptoms = await db.symptomLogs.orderBy('date').reverse().limit(10).toArray()
    return { workouts, lastCheck, symptoms }
  }, [])
  if (!user || !data) return null

  const sessions = data.workouts.filter((w) => w.kind === 'workout').length
  const recoveryDays = new Set(data.workouts.filter((w) => w.kind === 'recovery').map((w) => w.date.slice(0, 10))).size
  const recent = data.workouts.map(effectiveReaction)
  const check = canAdvancePhase(user, data.lastCheck?.readiness ?? neutral, recent)

  const maxPhase = maxSelectablePhase(user.daysSinceBirth, user.medicalClearance)
  async function setPhase(p: PhaseId) {
    await db.userProgress.put({ id: 'me', currentPhase: p, updatedAt: new Date().toISOString() })
    setPick(null)
  }
  const history = [...data.workouts].reverse().slice(0, 15)

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

      <Card className="space-y-2">
        <h2 className="font-semibold">Phase selbst festlegen</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Falls du schon aktiv bist, einen Rückbildungskurs gemacht hast oder eine Freigabe hast, kannst du hier eine Phase wählen. Es ist nur die Phase wählbar, für die die Zeit seit der Geburt passt{user.medicalClearance ? '' : ' (Phase 4 braucht eine medizinische Freigabe, die du in den Einstellungen angibst)'}. Du entscheidest nach deinem Befinden.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Phase">
          {([1, 2, 3, 4] as const).map((p) => (
            <Button key={p} variant={p === user.currentPhase ? 'primary' : 'secondary'} aria-pressed={p === user.currentPhase} disabled={p > maxPhase || p === user.currentPhase} onClick={() => setPick(p)}>
              Phase {p}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Meine Einheiten</h2>
        {history.length === 0 ? <p>Noch keine Einheiten.</p> : (
          <ul className="space-y-2">
            {history.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {new Date(w.date).toLocaleDateString('de-DE')}, {w.kind === 'recovery' ? 'Recovery' : 'Einheit'}, {w.durationMin} Min
                  <span className="block text-stone-600 dark:text-stone-400">{w.completedExerciseIds.map((id) => exerciseById(id)?.name ?? id).join(', ') || 'keine abgeschlossen'}</span>
                </span>
                <Button variant="ghost" aria-label={`Einheit vom ${new Date(w.date).toLocaleDateString('de-DE')} löschen`} onClick={() => setConfirmDelete(w.id ?? null)}>Löschen</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={confirmDelete !== null} title="Einheit löschen?" onClose={() => setConfirmDelete(null)}>
        <p className="mb-4">Die Einheit wird aus deinem Verlauf entfernt. Das kannst du nicht rückgängig machen.</p>
        <div className="grid gap-2">
          <Button onClick={async () => { if (confirmDelete !== null) await deleteWorkout(db, confirmDelete); setConfirmDelete(null) }}>Löschen</Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
        </div>
      </Modal>

      <Modal open={pick !== null} title={`Phase ${pick ?? ''} festlegen?`} onClose={() => setPick(null)}>
        <p className="mb-4">Das ist deine eigene Entscheidung. Bei Beschwerden wechsle bitte zurück und sprich mit deiner Hebamme oder Physiotherapeutin.</p>
        <div className="grid gap-2">
          <Button onClick={() => pick && setPhase(pick)}>Phase übernehmen</Button>
          <Button variant="ghost" onClick={() => setPick(null)}>Abbrechen</Button>
        </div>
      </Modal>

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
