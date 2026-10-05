import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { pickTip, type TipContext } from '../engine/tips'
import { Button } from './Button'
import { Card } from './Card'

export function TipCard({ ctx }: { ctx: TipContext }) {
  const tip = pickTip({ ...ctx, rotate: ctx.rotate ?? Math.floor(Date.now() / 86_400_000) })
  const saved = useLiveQuery(() => db.savedTips.get(tip.id), [tip.id])
  const toggle = () => (saved ? db.savedTips.delete(tip.id) : db.savedTips.put({ id: tip.id, savedAt: new Date().toISOString() }))
  return (
    <Card className="space-y-2">
      <h2 className="font-semibold">Tipp</h2>
      <p>{tip.text}</p>
      <Button variant="ghost" aria-pressed={!!saved} onClick={toggle}>{saved ? '★ Gemerkt' : '☆ Merken'}</Button>
    </Card>
  )
}
