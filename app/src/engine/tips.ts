import type { Situation } from '../domain/types'
import protips from '../content/protips.json'

export type TipCategory = 'sneaky_exercise' | 'toddler_hack' | 'nutrition_shortcut' | 'mindset' | 'recovery' | 'everyday_life'
export type Tip = { id: string; category: TipCategory; minutes: number; text: string }

export const tips = protips as Tip[]

export type TipContext = { energy?: 1 | 2 | 3 | 4 | 5; situation?: Situation; rotate?: number }

/**
 * Personalisierung (Phase 13.2):
 * Energie niedrig → 0-Minuten-Recovery-Tipp, Baby unruhig/auf dem Arm → Alltagstipp, wenig Zeit → 2-Minuten-Tipp.
 */
export function pickTip(ctx: TipContext, pool: Tip[] = tips): Tip {
  let candidates = pool
  if ((ctx.energy !== undefined && ctx.energy <= 2) || ctx.situation === 'exhausted') {
    candidates = pool.filter((t) => t.minutes === 0 && (t.category === 'recovery' || t.category === 'mindset'))
  } else if (ctx.situation === 'baby_arm' || ctx.situation === 'one_hand' || ctx.situation === 'baby_sleeping') {
    candidates = pool.filter((t) => t.category === 'everyday_life')
  } else if (ctx.situation === 'five_min') {
    candidates = pool.filter((t) => t.minutes <= 2)
  }
  if (candidates.length === 0) candidates = pool
  return candidates[(ctx.rotate ?? 0) % candidates.length]
}
