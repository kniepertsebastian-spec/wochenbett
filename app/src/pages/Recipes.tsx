import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, WarningBanner, BackLink } from '../components'
import { recipes, weeklyRecipes, type RecipeTag } from '../content/recipes'
import { synergyNote } from '../content/nutrition'
import { db } from '../db/db'

const tagLabels: Record<RecipeTag, string> = { warm: 'warm', simple: 'einfach', oneHandFriendly: 'einhändig', quick: 'schnell', freezerFriendly: 'einfrierbar', proteinRich: 'eiweißreich', ironRich: 'eisenreich' }
const weekOfYear = () => Math.floor(Date.now() / (7 * 86_400_000))

export function RecipesPage() {
  const [tag, setTag] = useState<RecipeTag | null>(null)
  const saved = useLiveQuery(() => db.savedRecipes.toArray(), [])
  const week = weeklyRecipes(weekOfYear())
  const list = recipes.filter((r) => !tag || r.tags.includes(tag))
  const row = (r: (typeof recipes)[number]) => (
    <Link key={r.id} to={`/more/recipes/${r.id}`} className="block">
      <Card>
        <p className="font-medium">{r.title}{saved?.some((s) => s.id === r.id) ? ' ★' : ''}</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{r.minutes} Min · {r.tags.map((t) => tagLabels[t]).join(', ')}</p>
      </Card>
    </Link>
  )
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Rezepte</h1>
      <WarningBanner level="yellow">Entwurf: Rezepte und Nährstoffangaben sind noch nicht fachlich geprüft. Keine Therapieempfehlung.</WarningBanner>
      <h2 className="text-xl font-semibold">Diese Woche</h2>
      <div className="space-y-2">{week.map(row)}</div>
      <h2 className="text-xl font-semibold">Alle Rezepte</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
        <Button variant={tag === null ? 'primary' : 'secondary'} onClick={() => setTag(null)}>alle</Button>
        {(Object.keys(tagLabels) as RecipeTag[]).map((t) => (
          <Button key={t} variant={tag === t ? 'primary' : 'secondary'} aria-pressed={tag === t} onClick={() => setTag(t)}>{tagLabels[t]}</Button>
        ))}
      </div>
      <div className="space-y-2">{list.map(row)}</div>
    </main>
  )
}

export function RecipeDetailPage() {
  const { id } = useParams()
  const r = recipes.find((x) => x.id === id)
  const saved = useLiveQuery(() => (id ? db.savedRecipes.get(id) : undefined), [id])
  if (!r) return <main className="pt-safe p-4"><BackLink to="/more/recipes">← Rezept nicht gefunden</BackLink></main>
  const toggle = () => (saved ? db.savedRecipes.delete(r.id) : db.savedRecipes.put({ id: r.id, savedAt: new Date().toISOString() }))
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more/recipes">← Rezepte</BackLink>
      <h1 className="text-2xl font-semibold">{r.title}</h1>
      <p className="text-stone-600 dark:text-stone-400">{r.minutes} Min · {r.tags.map((t) => tagLabels[t]).join(', ')}</p>
      <Card><h2 className="mb-1 font-semibold">Zutaten</h2><ul className="list-disc pl-5">{r.ingredients.map((i) => <li key={i}>{i}</li>)}</ul></Card>
      <Card><h2 className="mb-1 font-semibold">Zubereitung</h2><ol className="list-decimal space-y-1 pl-5">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></Card>
      {r.synergy && <p className="text-sm text-stone-600 dark:text-stone-400">Kombination: {r.synergy}. {synergyNote}</p>}
      <Button variant="secondary" aria-pressed={!!saved} onClick={toggle}>{saved ? '★ Gemerkt' : '☆ Merken'}</Button>
    </main>
  )
}
