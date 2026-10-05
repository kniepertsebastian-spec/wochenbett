import { useState } from 'react'
import { Card, WarningBanner, BackLink } from '../components'
import { foods, nutrients, synergyNote, type Nutrient } from '../content/nutrition'

export function NutritionPage() {
  const [q, setQ] = useState('')
  const [n, setN] = useState<Nutrient | ''>('')
  const list = foods.filter((f) => (!n || f.nutrient === n) && f.food.toLowerCase().includes(q.toLowerCase()))
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Ernährung</h1>
      <WarningBanner level="yellow">Entwurf: nicht fachlich geprüft. Das Lexikon zeigt typische Quellen und ersetzt keine Ernährungsberatung. Bei Verdacht auf Mangel bitte ärztlich abklären lassen.</WarningBanner>
      <p className="text-sm text-stone-600 dark:text-stone-400">{synergyNote}</p>
      <label className="block"><span className="mb-1 block">Suche</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-stone-700" /></label>
      <label className="block"><span className="mb-1 block">Nährstoff</span>
        <select value={n} onChange={(e) => setN(e.target.value as Nutrient | '')} className="min-h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-stone-700">
          <option value="">alle</option>{nutrients.map((x) => <option key={x}>{x}</option>)}
        </select></label>
      <p role="status" className="text-sm">{list.length} Lebensmittel</p>
      <div className="space-y-2">
        {list.map((f) => (
          <Card key={f.food}>
            <p className="font-medium">{f.food} <span className="text-sm font-normal text-stone-600 dark:text-stone-400">· {f.nutrient}</span></p>
            <p className="text-sm">{f.claim}</p>
            <p className="text-sm text-stone-600 dark:text-stone-400">Tipp: {f.preparationTip}</p>
          </Card>
        ))}
      </div>
    </main>
  )
}
