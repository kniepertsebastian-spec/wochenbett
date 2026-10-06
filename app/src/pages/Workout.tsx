import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CheckIn, Modal, ProgressBar, Timer, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { exercises as catalog } from '../content/exercises'
import { db } from '../db/db'
import type { Exercise, Readiness, RedFlagId, UserState, WorkoutReaction } from '../domain/types'
import { buildJourney } from '../engine/journey'
import { regress } from '../engine/progression'
import { assessReadiness } from '../engine/readiness'
import { RED_FLAGS, RED_FLAG_IDS } from '../engine/redflags'
import { useAudio } from '../hooks/useAudio'
import { useSettings } from '../hooks/useSettings'
import { useUserState } from '../hooks/useUserState'
import { useWakeLock } from '../hooks/useWakeLock'

const PREP_SECONDS = 10

const defaultReadiness: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }
const pelvicFloorIds = catalog.filter((e) => e.targetMuscles.includes('Beckenboden')).map((e) => e.id)

export function WorkoutPage() {
  const { session } = useSession()
  const { user } = useUserState()
  if (!session) return <Navigate to="/" replace />
  if (!user) return null
  return <Player key={session.exercises.map((e) => e.id).join()} initial={session.exercises} kind={session.kind} durationMin={session.durationMin} silent={session.silent ?? false} readiness={session.readiness ?? defaultReadiness} user={user} />
}

type Outcome = 'done' | 'skipped' | 'problem'

function Player({ initial, kind, durationMin, silent, readiness, user }: { initial: Exercise[]; kind: 'workout' | 'recovery'; durationMin: number; silent: boolean; readiness: Readiness; user: UserState }) {
  const nav = useNavigate()
  const { setSession, setProgressNote, setChoice } = useSession()
  const [settings, setSetting] = useSettings()
  const audio = useAudio(silent ? { speech: false, gong: false, vibration: settings.vibration } : settings)
  const [list, setList] = useState(initial)
  const [idx, setIdx] = useState(0)
  // Jede Übung beginnt im Bereit-Modus: erst lesen und in Position gehen, dann selbst starten.
  // Nur wenn "Nächste Übung automatisch starten" eingeschaltet ist, startet sie ab der zweiten Übung nach 10 Sekunden von selbst.
  const [prep, setPrep] = useState(true)
  const [running, setRunning] = useState(false)
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({})
  const [problemIds, setProblemIds] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [wrongOpen, setWrongOpen] = useState(false)
  const [flags, setFlags] = useState<RedFlagId[]>([])
  const [reaction, setReaction] = useState<WorkoutReaction | null>(null)
  const wake = useWakeLock(!finished)

  const current = list[idx]
  const [startedAt] = useState(() => Date.now())
  const spoken = useRef(-1)
  const instructionsFor = useRef(-1)

  const mark = useCallback((id: string, o: Outcome) => setOutcomes((p) => ({ ...p, [id]: o })), [])
  const doneCount = Object.values(outcomes).filter((o) => o === 'done').length

  // Leichtere Variante dieser Übung (nur wenn es eine gibt, die heute geeignet ist)
  const lighter = useMemo(() => (current ? regress(current, catalog, user, readiness) : null), [current, user, readiness])

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= list.length) {
        setFinished(true)
        return i
      }
      return i + 1
    })
    setPrep(true)
    setRunning(false)
  }, [list.length])

  const startExercise = useCallback(() => {
    setPrep(false)
    setRunning(true)
  }, [])

  // Beim Start der Übung (nicht im Bereit-Modus): Gong und Startansage
  useEffect(() => {
    if (!current || !running || prep || spoken.current === idx) return
    spoken.current = idx
    audio.gong()
    audio.speak(current.audioCues.find((c) => c.trigger === 'start')?.text ?? current.name)
  }, [current, idx, running, prep, audio])

  // Im Screenless-Modus: Anleitung und "Worauf achten" vorlesen (einmal pro Übung)
  useEffect(() => {
    if (!settings.screenless || !current || instructionsFor.current === idx) return
    instructionsFor.current = idx
    audio.speak(`${current.name}. ${current.instructions.join(' ')} ${current.focus}`)
  }, [settings.screenless, current, idx, audio])

  useEffect(() => {
    if (!running) audio.stop()
  }, [running, audio])
  useEffect(() => () => audio.stop(), [audio])

  if (finished) return finishView()

  function onTick(left: number) {
    if (!current) return
    const elapsed = current.duration - left
    const cue = (t: string) => current.audioCues.find((c) => c.trigger === t)?.text
    const hasBreath = current.audioCues.some((c) => c.trigger === 'inhale') && current.audioCues.some((c) => c.trigger === 'exhale')
    if (hasBreath && left > 0) {
      if (elapsed > 0 && elapsed % 10 === 0) audio.speak(cue('inhale')!)
      if (elapsed % 10 === 4) audio.speak(cue('exhale')!)
    }
    if (left === Math.floor(current.duration / 2) && cue('halfway')) audio.speak(cue('halfway')!)
    if (left === 0) {
      audio.gong()
      audio.vibrate([80, 60, 80])
      const end = cue('end')
      if (end) audio.speak(end)
    }
  }

  /** Ersetzt die aktuelle Übung durch ihre leichtere Variante und merkt das Problem für spätere Empfehlungen. */
  function easier() {
    setWrongOpen(false)
    if (!lighter) return
    setProblemIds((p) => [...p, current.id])
    setList((l) => l.map((e, i) => (i === idx ? lighter : e)))
    spoken.current = -1
    instructionsFor.current = -1
    setPrep(true)
    setRunning(false)
  }

  /** Speichert die bisherige Einheit. Mit Warnzeichen wird zusätzlich ein Check-in mit den Warnzeichen gespeichert; "Heute" zeigt dann den nächsten Schritt. */
  async function saveAndLeave(stopFlags?: RedFlagId[]) {
    const now = new Date().toISOString()
    const done = list.filter((e) => outcomes[e.id] === 'done').map((e) => e.id)
    const before = await db.workoutHistory.toArray()
    if (done.length > 0 || !stopFlags) {
      await db.workoutHistory.add({
        date: now,
        kind,
        durationMin: Math.max(1, Math.round((Date.now() - startedAt) / 60000)) || durationMin,
        exerciseIds: list.map((e) => e.id),
        completedExerciseIds: done,
        reaction: stopFlags ? 'symptoms' : (reaction ?? 'ok'),
      })
      await db.exerciseHistory.bulkAdd([
        ...list.map((e) => ({ date: now, exerciseId: e.id, outcome: outcomes[e.id] ?? ('skipped' as Outcome) })),
        ...problemIds.map((id) => ({ date: now, exerciseId: id, outcome: 'problem' as Outcome })),
      ])
    }
    setSession(null)
    setChoice({})
    if (stopFlags) {
      const r: Readiness = { ...readiness, redFlags: stopFlags }
      await db.readinessChecks.add({ date: now, readiness: r, light: assessReadiness(r).light })
      audio.speak('Bitte hör jetzt auf und atme ruhig. Auf dem nächsten Bildschirm steht, was du jetzt tun kannst.')
    } else {
      // Kleiner Fortschritt: ehrlich, ohne Druck
      const after = await db.workoutHistory.toArray()
      const phase = (await db.userProgress.get('me'))?.currentPhase ?? 1
      const j0 = buildJourney(before, { phase, pelvicFloorIds })
      const j1 = buildJourney(after, { phase, pelvicFloorIds })
      const fresh = j1.milestones.filter((m) => m.achieved && !j0.milestones.find((x) => x.id === m.id)?.achieved)
      setProgressNote(`Gespeichert. Das war deine ${j1.sessions}. Einheit.${fresh.length > 0 ? ` Neu: ${fresh[0].title}.` : ''}`)
    }
    nav('/', { replace: true })
  }

  function finishView() {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-32">
        <h1 className="text-2xl font-semibold">Heute reicht das. Gut gemacht.</h1>
        <p className="text-stone-600 dark:text-stone-400">
          {doneCount > 0 ? 'Jede Einheit zählt, egal wie kurz.' : 'Auch Ausruhen zählt.'}
        </p>
        <CheckIn
          legend="Wie fühlt sich dein Körper jetzt an?"
          options={[
            { value: 'good', label: 'gut' },
            { value: 'ok', label: 'okay' },
            { value: 'symptoms', label: 'Beschwerden' },
          ]}
          value={reaction}
          onChange={setReaction}
        />
        {reaction === 'symptoms' && <WarningBanner level="yellow">Danke fürs Ehrlichsein. Beim nächsten Mal wird es sanfter. Halten die Beschwerden an, sprich mit deiner Hebamme oder Ärztin.</WarningBanner>}
        <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
          <div className="mx-auto max-w-md">
            <Button className="w-full" disabled={!reaction} onClick={() => saveAndLeave()}>
              Speichern
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const toggleMain = () => (prep ? startExercise() : setRunning((r) => !r))
  const mainLabel = prep ? 'Start' : running ? 'Pause' : 'Weiter'

  // Getrennte Aktionen: Pause, Leichtere Variante, Etwas stimmt nicht, Training beenden
  const controls = (
    <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-md space-y-2">
        <Button className="w-full" onClick={toggleMain}>{mainLabel}</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!lighter} aria-describedby={lighter ? undefined : 'no-lighter'} onClick={easier}>
            Leichtere Variante
          </Button>
          <Button variant="secondary" onClick={() => { setRunning(false); setWrongOpen(true) }}>
            Etwas stimmt nicht
          </Button>
        </div>
        {!lighter && <p id="no-lighter" className="text-center text-xs text-stone-600 dark:text-stone-400">Für diese Übung gibt es keine leichtere Variante.</p>}
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            disabled={idx === 0}
            onClick={() => {
              setIdx((i) => Math.max(0, i - 1))
              setPrep(true)
              setRunning(false)
              spoken.current = -1
            }}
          >
            Zurück
          </Button>
          <Button variant="ghost" onClick={() => { mark(current.id, 'skipped'); next() }}>
            Überspringen
          </Button>
          <Button variant="ghost" onClick={() => { setRunning(false); setEndOpen(true) }}>
            Training beenden
          </Button>
        </div>
      </div>
    </div>
  )

  const onExerciseDone = () => {
    mark(current.id, 'done')
    setTimeout(next, 1200)
  }

  if (settings.screenless) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black p-6 text-stone-300">
        <p aria-live="polite">{current.name}. {prep ? 'Bereit, tippe auf Start' : running ? 'Läuft' : 'Pausiert'}</p>
        <div className="hidden">
          {prep ? (
            idx > 0 && settings.autoStartNext && <Timer key={`prep-${idx}`} seconds={PREP_SECONDS} running onDone={startExercise} />
          ) : (
            <Timer key={`${idx}-${current.id}`} seconds={current.duration} running={running} onTick={onTick} onDone={onExerciseDone} />
          )}
        </div>
        <button type="button" onClick={toggleMain} className="min-h-40 w-full max-w-sm rounded-3xl bg-stone-800 text-2xl">
          {mainLabel}
        </button>
        <button type="button" onClick={() => setSetting('screenless', false)} className="min-h-14 w-full max-w-sm rounded-2xl border border-stone-600">
          Bildschirm wieder anzeigen
        </button>
      </div>
    )
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-72">
      <ProgressBar value={idx + 1} max={list.length} label="Übung" />
      <h1 className="text-2xl font-semibold">{current.name}</h1>
      {prep ? (
        <div className="space-y-2 rounded-2xl border border-stone-300 p-4 dark:border-stone-700">
          <p className="font-medium">Mach dich bereit: lies die Anleitung und geh in Position.</p>
          {idx > 0 && settings.autoStartNext ? (
            <p>
              Die Übung startet automatisch in <Timer key={`prep-${idx}`} seconds={PREP_SECONDS} running={!endOpen && !wrongOpen} onDone={startExercise} inline /> Sekunden. Mit Start geht es sofort los.
            </p>
          ) : (
            <p className="text-stone-600 dark:text-stone-400">Der Timer läuft erst, wenn du auf Start tippst.</p>
          )}
          <p className="text-3xl font-semibold tabular-nums">{Math.floor(current.duration / 60)}:{String(current.duration % 60).padStart(2, '0')}</p>
        </div>
      ) : (
        <Timer key={`${idx}-${current.id}`} seconds={current.duration} running={running} onTick={onTick} onDone={onExerciseDone} />
      )}
      <p className="rounded-2xl bg-rose-50 p-3 font-medium dark:bg-rose-950"><span className="block text-sm font-normal text-stone-600 dark:text-stone-400">Worauf du achten sollst</span>{current.focus}</p>
      <p className="text-stone-600 dark:text-stone-400">{current.description}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {current.instructions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p><strong>Atmung:</strong> {current.breathing}</p>
      <details className="rounded-2xl border border-stone-200 p-3 dark:border-stone-800">
        <summary className="min-h-10 cursor-pointer font-medium">Warum diese Übung?</summary>
        <p className="mt-2">{current.why}</p>
      </details>
      {current.domingWarning && <WarningBanner level="yellow">Wölbt sich der Bauch mittig nach oben, tippe auf „Leichtere Variante“ oder „Etwas stimmt nicht“.</WarningBanner>}
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Abbrechen bei: Schmerz, Druck im Becken{current.stopCriteria.includes('urine_leakage') ? ', Urinverlust' : ''}.
      </p>
      {!wake.supported && <p className="text-sm text-stone-600 dark:text-stone-400">Dein Browser kann das Display nicht wachhalten. Es kann sich zwischendurch sperren.</p>}
      <Button variant="secondary" onClick={() => setSetting('screenless', true)}>
        Ohne Bildschirm (Audio) fortfahren
      </Button>
      {controls}

      <Modal open={endOpen} title="Training beenden?" onClose={() => setEndOpen(false)}>
        <p className="mb-4">{doneCount > 0 ? 'Du hast heute schon etwas geschafft. Das ist genug.' : 'Du hast noch keine Übung abgeschlossen. Auch das ist in Ordnung.'}</p>
        <div className="grid gap-2">
          {doneCount > 0 ? <Button onClick={() => { setEndOpen(false); setFinished(true) }}>Heute reicht das</Button> : <Button onClick={() => { setSession(null); nav('/', { replace: true }) }}>Beenden ohne Speichern</Button>}
          <Button variant="ghost" onClick={() => setEndOpen(false)}>Zurück zur Übung</Button>
        </div>
      </Modal>

      <Modal open={wrongOpen} title="Was stimmt nicht?" onClose={() => setWrongOpen(false)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Es ist mir zu anstrengend oder unangenehm</p>
            <Button className="w-full" variant="secondary" disabled={!lighter} onClick={easier}>Leichtere Variante</Button>
            {!lighter && <p className="text-sm text-stone-600 dark:text-stone-400">Dafür gibt es keine leichtere Variante. Du kannst pausieren oder das Training beenden.</p>}
          </div>
          <div className="space-y-1">
            <p className="font-medium">Mir ist ein Warnzeichen aufgefallen</p>
            {RED_FLAG_IDS.map((id) => (
              <label key={id} className="flex min-h-12 items-start gap-3 py-1">
                <input type="checkbox" className="mt-1 size-5" checked={flags.includes(id)} onChange={() => setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))} />
                <span>{RED_FLAGS[id].label}</span>
              </label>
            ))}
            <Button className="w-full" disabled={flags.length === 0} onClick={() => saveAndLeave(flags)}>Training stoppen</Button>
          </div>
          <Button className="w-full" variant="ghost" onClick={() => setWrongOpen(false)}>Doch nichts, zurück zur Übung</Button>
        </div>
      </Modal>
    </main>
  )
}

