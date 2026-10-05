import { useLiveQuery } from 'dexie-react-hooks'
import { habits } from '../content/habits'
import { db } from '../db/db'
import { Card } from './Card'

const today = () => new Date().toISOString().slice(0, 10)

export function HabitsCard() {
  const done = useLiveQuery(() => db.dailyHabits.where('date').equals(today()).toArray(), [])
  if (!done) return null
  const toggle = async (habitId: string) => {
    const hit = done.find((d) => d.habitId === habitId)
    if (hit?.id) await db.dailyHabits.delete(hit.id)
    else await db.dailyHabits.add({ date: today(), habitId })
  }
  return (
    <Card>
      <h2 className="mb-1 font-semibold">Kleine Alltagshelfer</h2>
      <p className="mb-2 text-sm text-stone-600 dark:text-stone-400">Nichts davon ist Pflicht. Hake ab, was dir heute gelungen ist.</p>
      {habits.map((h) => (
        <label key={h.id} className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-5" checked={done.some((d) => d.habitId === h.id)} onChange={() => toggle(h.id)} />
          {h.text}
        </label>
      ))}
    </Card>
  )
}
