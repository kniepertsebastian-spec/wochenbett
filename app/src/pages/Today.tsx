import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, WarningBanner } from '../components'
import { db } from '../db/db'
import { useUserState } from '../hooks/useUserState'

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
      {stats && stats.total > 0 && (
        <Card>
          <p>{stats.total} {stats.total === 1 ? 'Einheit' : 'Einheiten'} abgeschlossen</p>
        </Card>
      )}
      <WarningBanner level="yellow">Keine Diagnostik, keine Therapie. Bei Beschwerden: Hebamme oder Ärztin fragen.</WarningBanner>
    </main>
  )
}
