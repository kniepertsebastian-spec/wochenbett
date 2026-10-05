import { useLiveQuery } from 'dexie-react-hooks'
import { Card, WarningBanner, BackLink } from '../components'
import { db } from '../db/db'
import { longTerm, timeline } from '../content/timeline'
import { useUserState } from '../hooks/useUserState'

export function TimelinePage() {
  const { user } = useUserState()
  const counts = useLiveQuery(async () => (await db.workoutHistory.toArray()).map((w) => w.date), [])
  if (!user || !counts) return null
  const week = Math.floor(user.daysSinceBirth / 7) + 1
  const birth = new Date(Date.now() - user.daysSinceBirth * 86_400_000)
  const inWeeks = (from: number, to: number) => counts.filter((d) => { const w = Math.floor((new Date(d).getTime() - birth.getTime()) / (7 * 86_400_000)) + 1; return w >= from && w <= to }).length
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Wochen-Orientierung</h1>
      <WarningBanner level="yellow">Nur zur Orientierung, keine Freigabe. Was für dich passt, hängt von deinem Befinden und deiner Fachperson ab.</WarningBanner>
      <ol className="space-y-3">
        {timeline.map((s) => {
          const current = week >= s.from && week <= s.to
          const n = inWeeks(s.from, s.to)
          return (
            <li key={s.from}>
              <Card className={current ? 'border-2 border-rose-700 dark:border-rose-400' : ''}>
                <p className="font-semibold">Woche {s.from}{s.to !== s.from ? `–${s.to}` : ''}: {s.title}{current ? ' (jetzt)' : ''}</p>
                <p>{s.text}</p>
                {n > 0 && <p className="text-sm text-stone-600 dark:text-stone-400">{n} Einheiten in dieser Zeit</p>}
              </Card>
            </li>
          )
        })}
        <li>
          <Card className={week > 12 ? 'border-2 border-rose-700 dark:border-rose-400' : ''}>
            <p className="font-semibold">{longTerm.title}{week > 12 ? ' (jetzt)' : ''}</p>
            <p>{longTerm.text}</p>
          </Card>
        </li>
      </ol>
    </main>
  )
}
