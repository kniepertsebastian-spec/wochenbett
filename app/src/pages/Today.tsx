import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, HabitsCard, WarningBanner } from '../components'
import { db } from '../db/db'
import { useUserState } from '../hooks/useUserState'

const situations = [
  { id: 'baby_sleeping', icon: '👶', label: 'Baby schläft' },
  { id: 'baby_arm', icon: '🤱', label: 'Baby auf dem Arm' },
  { id: 'one_hand', icon: '🖐', label: 'Eine Hand frei' },
  { id: 'exhausted', icon: '😴', label: 'Komplett erschöpft' },
  { id: 'five_min', icon: '⏱', label: 'Nur 5 Minuten' },
] as const

const linkBtn = 'block min-h-12 rounded-2xl bg-rose-700 px-5 py-3 text-center text-base font-medium text-white dark:bg-rose-600'

export function TodayPage() {
  const { user } = useUserState()
  const stats = useLiveQuery(async () => {
    const all = await db.workoutHistory.toArray()
    return { total: all.length, last: all.at(-1) }
  }, [])
  if (!user) return null
  const week = Math.floor(user.daysSinceBirth / 7) + 1
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-semibold">Heute</h1>
        <p className="text-stone-600 dark:text-stone-400">Woche {week} nach der Geburt. Jeder Tag darf anders sein.</p>
      </header>
      <Card className="space-y-3">
        <p className="font-medium">Wie geht es dir heute?</p>
        <p className="text-stone-600 dark:text-stone-400">Ein kurzer Check-in, dann bekommst du einen Vorschlag, der zu deinem Tag passt.</p>
        <Link to="/check-in" className={linkBtn}>
          Check-in starten
        </Link>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">Wie sieht dein Moment aus?</h2>
        <div className="grid grid-cols-2 gap-2">
          {situations.map((s) => (
            <Link key={s.id} to={`/check-in?s=${s.id}`} className="flex min-h-14 items-center gap-2 rounded-2xl bg-stone-200 px-3 py-2 dark:bg-stone-800">
              <span aria-hidden="true" className="text-xl">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">Der Check-in kommt immer zuerst, dann passt sich der Vorschlag an.</p>
      </Card>
      <HabitsCard />
      {stats && stats.total > 0 && (
        <Card>
          <p>{stats.total} {stats.total === 1 ? 'Einheit' : 'Einheiten'} abgeschlossen</p>
        </Card>
      )}
      <WarningBanner level="yellow">Keine Diagnostik, keine Therapie. Bei Beschwerden: Hebamme oder Ärztin fragen.</WarningBanner>
    </main>
  )
}
