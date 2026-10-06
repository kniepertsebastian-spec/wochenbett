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
  const current = timeline.find((s) => week >= s.from && week <= s.to) ?? { from: 13, to: 99, ...longTerm }
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Diese Woche</h1>
      <WarningBanner level="yellow">Nur zur Orientierung, keine Freigabe. Was für dich passt, hängt von deinem Befinden und deiner Fachperson ab.</WarningBanner>
      <Card className="space-y-3 border-2 border-rose-700 dark:border-rose-400">
        <p className="text-sm text-stone-600 dark:text-stone-400">Du bist in Woche {week}</p>
        <h2 className="text-xl font-semibold">{current.title}</h2>
        <p>{current.text}</p>
        <div>
          <p className="mb-1 font-medium">Das kannst du heute tun</p>
          <ul className="list-disc space-y-1 pl-5">{current.today.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </Card>
      <details className="rounded-2xl border border-stone-200 p-3 dark:border-stone-800">
        <summary className="min-h-10 cursor-pointer font-medium">Alle Wochen</summary>
        <ol className="mt-2 space-y-3">
          {timeline.map((s) => {
            const here = week >= s.from && week <= s.to
            const n = inWeeks(s.from, s.to)
            return (
              <li key={s.from}>
                <Card className={here ? 'border-2 border-rose-700 dark:border-rose-400' : ''}>
                  <p className="font-semibold">Woche {s.from}{s.to !== s.from ? `–${s.to}` : ''}: {s.title}{here ? ' (jetzt)' : ''}</p>
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
      </details>
    </main>
  )
}
