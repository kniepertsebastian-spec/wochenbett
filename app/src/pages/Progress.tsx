import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Modal } from '../components'
import { exerciseById, exercises } from '../content/exercises'
import { db } from '../db/db'
import { effectiveReaction } from '../db/reactions'
import { deleteWorkout } from '../db/workouts'
import type { PhaseId, Readiness } from '../domain/types'
import { GOALS } from '../engine/goals'
import { buildJourney } from '../engine/journey'
import { canAdvancePhase, maxSelectablePhase, SESSIONS_REQUIRED } from '../engine/progression'
import { useGoals } from '../hooks/useGoals'
import { useUserState } from '../hooks/useUserState'

const neutral: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }
const phaseNames = ['', 'Recovery & Wahrnehmung', 'Basis', 'Aufbau', 'Belastbarkeit']
const pelvicFloorIds = exercises.filter((e) => e.targetMuscles.includes('Beckenboden')).map((e) => e.id)

/** "Mein Weg": Entwicklung erzählen statt Leistung messen. Keine Streaks, keine Gewichts- oder Kalorienkurven. */
export function ProgressPage() {
  const { user } = useUserState()
  const [goals, setGoals] = useGoals()
  const [pick, setPick] = useState<PhaseId | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const data = useLiveQuery(async () => {
    const workouts = await db.workoutHistory.orderBy('date').toArray()
    const lastCheck = await db.readinessChecks.orderBy('date').last()
    const symptoms = await db.symptomLogs.orderBy('date').reverse().limit(10).toArray()
    return { workouts, lastCheck, symptoms }
  }, [])
  if (!user || !data) return null

  const journey = buildJourney(data.workouts, { phase: user.currentPhase, pelvicFloorIds })
  const recent = data.workouts.map(effectiveReaction)
  const check = canAdvancePhase(user, data.lastCheck?.readiness ?? neutral, recent)
  const maxPhase = maxSelectablePhase(user.daysSinceBirth, user.medicalClearance)
  const history = [...data.workouts].reverse().slice(0, 15)
  const achieved = journey.milestones.filter((m) => m.achieved)
  const open = journey.milestones.filter((m) => !m.achieved)

  async function setPhase(p: PhaseId) {
    await db.userProgress.put({ id: 'me', currentPhase: p, updatedAt: new Date().toISOString() })
    setPick(null)
  }
  const toggleGoal = (id: (typeof GOALS)[number]['id']) => setGoals(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id])

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Mein Weg</h1>
      <Card className="space-y-2">
        <p className="text-lg">{journey.story}</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">Pausen gehören dazu. Eine Pause kann ein Erfolg sein.</p>
      </Card>

      <Card className="grid grid-cols-2 gap-3 text-center">
        <div><p className="text-3xl font-semibold">{journey.sessions}</p><p className="text-sm">Einheiten</p></div>
        <div><p className="text-3xl font-semibold">{journey.restDays}</p><p className="text-sm">Mal bewusst ausgeruht</p></div>
        <div><p className="text-3xl font-semibold">{journey.sessions > 0 ? `${journey.wellTolerated}/${journey.sessions}` : '–'}</p><p className="text-sm">gut vertragen</p></div>
        <div><p className="text-3xl font-semibold">{journey.variety}</p><p className="text-sm">verschiedene Übungen</p></div>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Meilensteine</h2>
        {achieved.length === 0 ? <p>Der erste kommt von allein.</p> : (
          <ul className="space-y-2">{achieved.map((m) => <li key={m.id}><span aria-hidden="true">✓ </span><strong>{m.title}</strong><span className="block text-sm text-stone-600 dark:text-stone-400">{m.text}</span></li>)}</ul>
        )}
        {open.length > 0 && (
          <details>
            <summary className="min-h-10 cursor-pointer text-sm text-stone-600 dark:text-stone-400">Was noch kommen kann, wenn du magst</summary>
            <ul className="mt-1 list-disc pl-5 text-sm">{open.map((m) => <li key={m.id}>{m.title}</li>)}</ul>
          </details>
        )}
      </Card>

      <Card className="space-y-1">
        <h2 className="font-semibold">Was ist dir wichtig?</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">Freiwillig. Deine Ziele sortieren die Übungen, die dir vorgeschlagen werden. Sicherheit bleibt immer vorne.</p>
        {GOALS.map((g) => (
          <label key={g.id} className="flex min-h-12 items-center gap-3">
            <input type="checkbox" className="size-5" checked={goals.includes(g.id)} onChange={() => toggleGoal(g.id)} />
            {g.label}
          </label>
        ))}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Phase {user.currentPhase}: {phaseNames[user.currentPhase]}</h2>
        {user.currentPhase < 4 ? (
          check.allowed ? (
            <>
              <p>Die Voraussetzungen für Phase {user.currentPhase + 1} sind erfüllt. Du entscheidest, ob du bereit bist.</p>
              <Button onClick={() => setPick((user.currentPhase + 1) as PhaseId)}>Phase {user.currentPhase + 1} freischalten</Button>
            </>
          ) : (
            <>
              <p>Für die nächste Phase fehlt noch:</p>
              <ul className="list-disc pl-5">{check.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="text-sm text-stone-600 dark:text-stone-400">Mindestens {SESSIONS_REQUIRED} beschwerdefreie Einheiten in Folge, dazu Zeit und dein Befinden. Die Zeit allein schaltet nichts frei.</p>
            </>
          )
        ) : <p>Du bist in der höchsten Phase.</p>}
        <p className="text-sm text-stone-600 dark:text-stone-400">Du hast schon einen Rückbildungskurs gemacht oder eine Freigabe? Dann wähle deine Phase selbst:</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Phase">
          {([1, 2, 3, 4] as const).map((p) => (
            <Button key={p} variant={p === user.currentPhase ? 'primary' : 'secondary'} aria-pressed={p === user.currentPhase} disabled={p > maxPhase || p === user.currentPhase} onClick={() => setPick(p)}>
              Phase {p}
            </Button>
          ))}
        </div>
        {!user.medicalClearance && <p className="text-sm text-stone-600 dark:text-stone-400">Phase 4 braucht eine medizinische Freigabe, die du in den Einstellungen angibst.</p>}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Meine Einheiten</h2>
        {history.length === 0 ? <p>Noch keine Einheiten.</p> : (
          <ul className="space-y-2">
            {history.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {new Date(w.date).toLocaleDateString('de-DE')}, {w.kind === 'recovery' ? 'Erholung' : 'Einheit'}, {w.durationMin} Min
                  <span className="block text-stone-600 dark:text-stone-400">{w.completedExerciseIds.map((id) => exerciseById(id)?.name ?? id).join(', ') || 'keine abgeschlossen'}</span>
                </span>
                <Button variant="ghost" aria-label={`Einheit vom ${new Date(w.date).toLocaleDateString('de-DE')} löschen`} onClick={() => setConfirmDelete(w.id ?? null)}>Löschen</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Beckenboden-Symptome</h2>
        {data.symptoms.length === 0 ? <p>Noch keine Einträge.</p> : (
          <ul className="space-y-1 text-sm">
            {data.symptoms.map((s) => <li key={s.id}>{new Date(s.date).toLocaleDateString('de-DE')}: Druck {s.pressure}, Schmerz {s.pain}{s.urineLeakage ? ', Urinverlust' : ''}</li>)}
          </ul>
        )}
        <Link to="/pelvic-floor" className="flex min-h-12 items-center underline">Zum Beckenboden-Tagebuch</Link>
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
    </main>
  )
}
