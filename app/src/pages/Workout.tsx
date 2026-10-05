import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CheckIn, Modal, ProgressBar, Timer, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { exercises as catalog } from '../content/exercises'
import { db } from '../db/db'
import type { Exercise, Readiness, RedFlagId, UserState, WorkoutReaction } from '../domain/types'
import { isEligible } from '../engine/eligibility'
import { regress } from '../engine/progression'
import { RED_FLAGS, RED_FLAG_IDS, highestUrgency } from '../engine/redflags'
import { useAudio } from '../hooks/useAudio'
import { useSettings } from '../hooks/useSettings'
import { useUserState } from '../hooks/useUserState'
import { useWakeLock } from '../hooks/useWakeLock'

const defaultReadiness: Readiness = { energy: 3, pain: 'none', pelvicPressure: false, lastSession: 'ok', redFlags: [] }

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
  const { setSession, setRecommendation } = useSession()
  const [settings, setSetting] = useSettings()
  const audio = useAudio(silent ? { speech: false, gong: false, vibration: settings.vibration } : settings)
  const [list, setList] = useState(initial)
  const [idx, setIdx] = useState(0)
  const [running, setRunning] = useState(true)
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({})
  const [problemIds, setProblemIds] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const [menu, setMenu] = useState(false)
  const [warn, setWarn] = useState(false)
  const [flags, setFlags] = useState<RedFlagId[]>([])
  const [reaction, setReaction] = useState<WorkoutReaction | null>(null)
  const wake = useWakeLock(!finished && running)

  const current = list[idx]
  const [startedAt] = useState(() => Date.now())
  const spoken = useRef(-1)
  const instructionsFor = useRef(-1)

  const mark = useCallback((id: string, o: Outcome) => setOutcomes((p) => ({ ...p, [id]: o })), [])

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= list.length) {
        setFinished(true)
        return i
      }
      return i + 1
    })
  }, [list.length])

  // Ansage zu Beginn jeder Übung (im Screenless-Modus inkl. Anleitung)
  useEffect(() => {
    if (!current || !running || spoken.current === idx) return
    spoken.current = idx
    audio.gong()
    const start = current.audioCues.find((c) => c.trigger === 'start')?.text ?? current.name
    audio.speak(settings.screenless ? `${current.name}. ${current.instructions.join(' ')}` : start)
    instructionsFor.current = settings.screenless ? idx : -1
  }, [current, idx, running, audio, settings.screenless])

  // Wechsel in den Screenless-Modus mitten in einer Übung: Anleitung nachholen
  useEffect(() => {
    if (!settings.screenless || !current || !running || instructionsFor.current === idx) return
    instructionsFor.current = idx
    audio.speak(`${current.name}. ${current.instructions.join(' ')}`)
  }, [settings.screenless, current, idx, running, audio])

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

  function swap() {
    setMenu(false)
    const lighter = regress(current, catalog, user, readiness)
    const alt =
      lighter ??
      catalog.find((e) => e.id !== current.id && e.phase <= current.phase && !list.some((l) => l.id === e.id) && isEligible(e, user, readiness))
    if (!alt) return
    setProblemIds((p) => [...p, current.id])
    setList((l) => l.map((e, i) => (i === idx ? alt : e)))
    spoken.current = -1
  }

  async function saveAndLeave(stopFlags?: RedFlagId[]) {
    const now = new Date().toISOString()
    const done = list.filter((e) => outcomes[e.id] === 'done').map((e) => e.id)
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
    setSession(null)
    if (stopFlags) {
      setRecommendation({ kind: 'stop', light: 'red', reasons: stopFlags, urgency: highestUrgency(stopFlags) })
      nav('/plan', { replace: true })
    } else nav('/', { replace: true })
  }

  function finishView() {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-32">
        <h1 className="text-2xl font-semibold">Geschafft</h1>
        <p className="text-stone-600 dark:text-stone-400">Wie fühlt sich dein Körper gerade an?</p>
        <CheckIn
          legend="Reaktion direkt nach der Einheit"
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

  const controls = (
    <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          Zurück
        </Button>
        <Button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Weiter'}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            mark(current.id, 'skipped')
            next()
          }}
        >
          Überspringen
        </Button>
        <Button variant="ghost" className="col-span-3" onClick={() => setMenu(true)}>
          Übung wechseln / Beschwerden
        </Button>
      </div>
    </div>
  )

  if (settings.screenless) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black p-6 text-stone-300">
        <p aria-live="polite">{current.name}. {running ? 'Läuft' : 'Pausiert'}</p>
        <div className="hidden">
          <Timer key={`${idx}-${current.id}`} seconds={current.duration} running={running} onTick={onTick} onDone={() => { mark(current.id, 'done'); setTimeout(next, 1200) }} />
        </div>
        <button type="button" onClick={() => setRunning((r) => !r)} className="min-h-40 w-full max-w-sm rounded-3xl bg-stone-800 text-2xl">
          {running ? 'Pause' : 'Weiter'}
        </button>
        <button type="button" onClick={() => setSetting('screenless', false)} className="min-h-14 w-full max-w-sm rounded-2xl border border-stone-600">
          Bildschirm wieder anzeigen
        </button>
      </div>
    )
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-48">
      <ProgressBar value={idx + 1} max={list.length} label="Übung" />
      <h1 className="text-2xl font-semibold">{current.name}</h1>
      <Timer key={`${idx}-${current.id}`} seconds={current.duration} running={running} onTick={onTick} onDone={() => { mark(current.id, 'done'); setTimeout(next, 1200) }} />
      <p className="text-stone-600 dark:text-stone-400">{current.description}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {current.instructions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p>
        <strong>Atmung:</strong> {current.breathing}
      </p>
      {current.domingWarning && <WarningBanner level="yellow">Wölbt sich der Bauch mittig nach oben, beende die Übung und wähle eine leichtere Variante.</WarningBanner>}
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Abbrechen bei: Schmerz, Druck im Becken{current.stopCriteria.includes('urine_leakage') ? ', Urinverlust' : ''}.
      </p>
      {!wake.supported && <p className="text-sm text-stone-600 dark:text-stone-400">Dein Browser kann das Display nicht wachhalten. Es kann sich zwischendurch sperren.</p>}
      <Button variant="secondary" onClick={() => setSetting('screenless', true)}>
        Ohne Bildschirm (Audio) fortfahren
      </Button>
      {controls}

      <Modal open={menu} title="Was möchtest du tun?" onClose={() => setMenu(false)}>
        <div className="space-y-3">
          <Button className="w-full" variant="secondary" onClick={swap}>
            Leichtere Variante / andere Übung
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => {
              setMenu(false)
              setWarn(true)
              setRunning(false)
            }}
          >
            Mir ist etwas Auffälliges aufgefallen
          </Button>
          <Button className="w-full" variant="ghost" onClick={() => setMenu(false)}>
            Zurück zur Übung
          </Button>
        </div>
      </Modal>

      <Modal open={warn} title="Was ist dir aufgefallen?" onClose={() => setWarn(false)}>
        <div className="space-y-1">
          {RED_FLAG_IDS.map((id) => (
            <label key={id} className="flex min-h-12 items-start gap-3 py-1">
              <input type="checkbox" className="mt-1 size-5" checked={flags.includes(id)} onChange={() => setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))} />
              <span>{RED_FLAGS[id].label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-2">
          <Button disabled={flags.length === 0} onClick={() => saveAndLeave(flags)}>
            Training beenden
          </Button>
          <Button variant="ghost" onClick={() => setWarn(false)}>
            Doch nichts, weiter
          </Button>
        </div>
      </Modal>
    </main>
  )
}
