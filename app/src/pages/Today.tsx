import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, HabitsCard, MiniCheckIn, MoodCard, StopCard, TipCard, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { exercises } from '../content/exercises'
import { db } from '../db/db'
import type { Readiness, Situation } from '../domain/types'
import { recommend } from '../engine/recommend'
import { estimateMinutes, summarize, type AlternativeId } from '../engine/summary'
import { useGoals } from '../hooks/useGoals'
import { useUserState } from '../hooks/useUserState'

const contexts: { id: Situation; icon: string; label: string }[] = [
  { id: 'baby_sleeping', icon: '👶', label: 'Baby schläft' },
  { id: 'baby_arm', icon: '🤱', label: 'Baby auf dem Arm' },
  { id: 'one_hand', icon: '🖐', label: 'Eine Hand frei' },
  { id: 'five_min', icon: '⏱', label: 'Ich habe 5 Minuten' },
  { id: 'exhausted', icon: '😴', label: 'Ich bin komplett erschöpft' },
  { id: 'time_10_20', icon: '💪', label: 'Ich habe 10–20 Minuten und möchte etwas tun' },
]

const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

export function TodayPage() {
  const nav = useNavigate()
  const { user } = useUserState()
  const { setSession, choice, setChoice, progressNote, setProgressNote } = useSession()
  const [goals] = useGoals()
  const [redo, setRedo] = useState(false)

  const check = useLiveQuery(async () => {
    const last = await db.readinessChecks.orderBy('date').last()
    return last && sameDay(last.date) ? last : null
  }, [])
  const problems = useLiveQuery(async () => {
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString()
    return (await db.exerciseHistory.where('date').above(since).toArray()).filter((h) => h.outcome === 'problem').map((h) => h.exerciseId)
  }, [])

  const rec = useMemo(() => {
    if (!user || !check) return null
    const day = Math.floor(Date.now() / 86_400_000)
    return recommend(user, check.readiness, exercises, {
      rotate: day,
      problemIds: problems ?? [],
      situation: choice.situation,
      goals,
      maxMinutes: choice.alt === 'three_min' ? 3 : undefined,
      preferRecovery: choice.alt === 'rest',
    })
  }, [user, check, problems, choice, goals])

  if (!user || check === undefined) return null
  const week = Math.floor(user.daysSinceBirth / 7) + 1
  const readiness: Readiness | null = check?.readiness ?? null
  const showCheckIn = !check || redo

  function start() {
    if (!rec || rec.kind === 'stop' || !readiness) return
    setSession({ kind: rec.kind, durationMin: estimateMinutes(rec.exercises), exercises: rec.exercises, readiness, silent: choice.situation === 'baby_sleeping' })
    nav('/workout')
  }
  const newCheckIn = () => {
    setChoice({})
    setRedo(true)
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-semibold">Heute</h1>
        <p className="text-stone-600 dark:text-stone-400">Woche {week} nach der Geburt. Jeder Tag darf anders sein.</p>
      </header>

      {progressNote && (
        <Card className="flex items-start justify-between gap-2" role="status">
          <span>{progressNote}</span>
          <Button variant="ghost" aria-label="Hinweis schließen" onClick={() => setProgressNote(null)}>OK</Button>
        </Card>
      )}

      {showCheckIn ? (
        <MiniCheckIn onDone={() => setRedo(false)} />
      ) : rec?.kind === 'stop' ? (
        <StopCard reasons={rec.reasons} onNewCheckIn={newCheckIn} />
      ) : rec && readiness ? (
        <RecommendationCard rec={rec} readiness={readiness} situation={choice.situation} onChoice={(situation) => setChoice({ ...choice, situation, alt: undefined })} onAlt={(alt) => setChoice({ ...choice, alt })} onStart={start} onNewCheckIn={newCheckIn} />
      ) : null}

      <Link to="/more/normal" className="block rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <span className="block font-medium">Unsicher wegen etwas? Ist das normal?</span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">Orientierung zu Blutungen, Schmerzen, Beckenboden, Stimmung und mehr</span>
      </Link>

      <MoodCard />
      <TipCard ctx={{ energy: readiness?.energy, situation: choice.situation }} />
      <details className="rounded-2xl border border-stone-200 p-3 dark:border-stone-800">
        <summary className="min-h-10 cursor-pointer font-medium">Kleine Alltagshelfer</summary>
        <div className="mt-2"><HabitsCard /></div>
      </details>
      <WarningBanner level="yellow">Keine Diagnostik, keine Therapie. Bei Beschwerden: Hebamme oder Ärztin fragen.</WarningBanner>
    </main>
  )
}

function RecommendationCard({
  rec,
  readiness,
  situation,
  onChoice,
  onAlt,
  onStart,
  onNewCheckIn,
}: {
  rec: Exclude<ReturnType<typeof recommend>, { kind: 'stop' }>
  readiness: Readiness
  situation: Situation | undefined
  onChoice: (s: Situation | undefined) => void
  onAlt: (a: AlternativeId) => void
  onStart: () => void
  onNewCheckIn: () => void
}) {
  const s = summarize(rec, readiness, situation)
  return (
    <section aria-labelledby="rec-title" className="space-y-4 rounded-2xl border-2 border-rose-700 bg-white p-4 dark:border-rose-500 dark:bg-stone-900">
      <h2 id="rec-title" className="text-xl font-semibold">{s.title}</h2>
      {s.reasons.length > 0 && (
        <ul className="space-y-1 text-stone-700 dark:text-stone-300">
          {s.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}

      {rec.exercises.length > 0 && (
        <p className="text-sm text-stone-600 dark:text-stone-400">{rec.exercises.map((e) => e.name).join(' · ')}</p>
      )}
      <Button className="w-full" disabled={rec.exercises.length === 0} onClick={onStart}>Starten</Button>

      <fieldset>
        <legend className="mb-2 font-medium">Was ist gerade möglich?</legend>
        <div className="grid grid-cols-2 gap-2">
          {contexts.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={situation === c.id}
              onClick={() => onChoice(situation === c.id ? undefined : c.id)}
              className={`flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm ${situation === c.id ? 'bg-rose-700 text-white dark:bg-rose-600' : 'bg-stone-200 dark:bg-stone-800'}`}
            >
              <span aria-hidden="true" className="text-xl">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      {s.alternatives.length > 0 && (
        <div className="grid gap-2">
          {s.alternatives.map((a) => <Button key={a.id} variant="secondary" onClick={() => onAlt(a.id)}>{a.label}</Button>)}
        </div>
      )}

      <details className="rounded-2xl border border-stone-200 p-3 dark:border-stone-800">
        <summary className="min-h-10 cursor-pointer font-medium">Warum?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">{rec.why.map((w) => <li key={w}>{w}</li>)}</ul>
      </details>
      <Button variant="ghost" className="w-full" onClick={onNewCheckIn}>Neuer Check-in</Button>
    </section>
  )
}
