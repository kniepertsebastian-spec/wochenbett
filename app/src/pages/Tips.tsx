import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Button, Card, BackLink } from '../components'
import { db } from '../db/db'
import { tips, type TipCategory } from '../engine/tips'

const labels: Record<TipCategory, string> = { sneaky_exercise: 'Nebenbei bewegen', toddler_hack: 'Mit Kind', nutrition_shortcut: 'Ernährung', mindset: 'Mindset', recovery: 'Erholung', everyday_life: 'Alltag' }

export function TipsPage() {
  const [cat, setCat] = useState<TipCategory | null>(null)
  const saved = useLiveQuery(() => db.savedTips.toArray(), [])
  const list = tips.filter((t) => !cat || t.category === cat)
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Tipps</h1>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Kategorie">
        <Button variant={cat === null ? 'primary' : 'secondary'} onClick={() => setCat(null)}>alle</Button>
        {(Object.keys(labels) as TipCategory[]).map((c) => (
          <Button key={c} variant={cat === c ? 'primary' : 'secondary'} aria-pressed={cat === c} onClick={() => setCat(c)}>{labels[c]}</Button>
        ))}
      </div>
      {list.map((t) => {
        const isSaved = saved?.some((s) => s.id === t.id)
        return (
          <Card key={t.id} className="space-y-1">
            <p className="text-sm text-stone-600 dark:text-stone-400">{labels[t.category]} · {t.minutes === 0 ? 'ohne Zeitaufwand' : `${t.minutes} Min`}</p>
            <p>{t.text}</p>
            <Button variant="ghost" aria-pressed={!!isSaved} onClick={() => (isSaved ? db.savedTips.delete(t.id) : db.savedTips.put({ id: t.id, savedAt: new Date().toISOString() }))}>{isSaved ? '★ Gemerkt' : '☆ Merken'}</Button>
          </Card>
        )
      })}
    </main>
  )
}
