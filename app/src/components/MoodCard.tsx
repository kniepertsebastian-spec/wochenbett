import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import type { Mood } from '../domain/types'
import { Card } from './Card'

const moods: { value: Mood; label: string; icon: string }[] = [
  { value: 1, label: 'sehr schwer', icon: '😞' },
  { value: 2, label: 'schwer', icon: '🙁' },
  { value: 3, label: 'geht so', icon: '😐' },
  { value: 4, label: 'gut', icon: '🙂' },
  { value: 5, label: 'sehr gut', icon: '😊' },
]

const dayKey = (iso: string) => new Date(iso).toDateString()

/** Optionaler Tagescheck. Orientierung, keine Diagnose. Ein Tipp und klare Hilfe bei anhaltend schweren Tagen. */
export function MoodCard() {
  const recent = useLiveQuery(() => db.moodLogs.orderBy('date').reverse().limit(6).toArray(), [])
  if (!recent) return null
  const today = recent.find((m) => dayKey(m.date) === new Date().toDateString())
  // Drei verschiedene Tage in Folge "schwer" oder "sehr schwer"
  const days = [...new Map(recent.map((m) => [dayKey(m.date), m.mood])).values()]
  const lastThreeHeavy = days.slice(0, 3).length === 3 && days.slice(0, 3).every((m) => m <= 2)

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Wie fühlst du dich heute? <span className="font-normal text-stone-600 dark:text-stone-400">(freiwillig)</span></h2>
      <div className="grid grid-cols-5 gap-1" role="group" aria-label="Stimmung">
        {moods.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={today?.mood === m.value}
            onClick={() => db.moodLogs.add({ date: new Date().toISOString(), mood: m.value })}
            className={`flex min-h-16 flex-col items-center justify-center rounded-xl px-1 text-xs ${today?.mood === m.value ? 'bg-rose-700 text-white dark:bg-rose-600' : 'bg-stone-200 dark:bg-stone-800'}`}
          >
            <span aria-hidden="true" className="text-2xl">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
      {today && today.mood >= 3 && <p role="status">Danke, dass du kurz hingeschaut hast.</p>}
      {today && today.mood <= 2 && (
        <p role="status">
          Das darf sein. Schwere Tage gehören nach der Geburt dazu, und du musst das nicht allein tragen.{' '}
          <Link to="/more/wellbeing" className="underline">Was dir jetzt helfen kann</Link>
        </p>
      )}
      {lastThreeHeavy && (
        <p role="status" className="rounded-xl bg-amber-100 p-3 text-amber-950 dark:bg-amber-950 dark:text-amber-50">
          Seit einigen Tagen fühlst du dich schwer. Bitte sprich mit deiner Hebamme oder Ärztin darüber. Das ist keine Diagnose, aber du verdienst Unterstützung.{' '}
          <Link to="/more/wellbeing" className="font-medium underline">Hilfe und Rufnummern</Link>
        </p>
      )}
    </Card>
  )
}
