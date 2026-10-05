import { describe, expect, it } from 'vitest'
import { pickTip, tips } from './tips'
import { foods, nutrients } from '../content/nutrition'
import { recipes, weeklyRecipes } from '../content/recipes'
import { validateMeta } from '../content/validate'

describe('ProTips', () => {
  it('deckt alle sechs Kategorien ab', () => {
    expect(new Set(tips.map((t) => t.category)).size).toBe(6)
  })
  it('niedrige Energie → 0-Minuten-Recovery/Mindset-Tipp', () => {
    for (let i = 0; i < tips.length; i++) {
      const t = pickTip({ energy: 1, rotate: i })
      expect(t.minutes).toBe(0)
      expect(['recovery', 'mindset']).toContain(t.category)
    }
  })
  it('Baby auf dem Arm → Alltagstipp, wenig Zeit → höchstens 2 Minuten', () => {
    expect(pickTip({ situation: 'baby_arm' }).category).toBe('everyday_life')
    for (let i = 0; i < tips.length; i++) expect(pickTip({ situation: 'five_min', rotate: i }).minutes).toBeLessThanOrEqual(2)
  })
})

describe('Ernährung & Rezepte', () => {
  it('Lexikon hat 50–60 Lebensmittel, alle Nährstoffe vertreten, Metadaten gültig', () => {
    expect(foods.length).toBeGreaterThanOrEqual(50)
    expect(foods.length).toBeLessThanOrEqual(60)
    for (const n of nutrients) expect(foods.some((f) => f.nutrient === n)).toBe(true)
    const errs = foods.flatMap((f) => validateMeta(f.meta, f.food, '2026-10-06'))
    expect(errs).toEqual([])
    expect(new Set(foods.map((f) => f.food)).size).toBe(foods.length)
  })
  it('Rezepte haben Zutaten und Schritte; Wochenauswahl rotiert', () => {
    for (const r of recipes) {
      expect(r.ingredients.length).toBeGreaterThan(0)
      expect(r.steps.length).toBeGreaterThan(0)
    }
    expect(weeklyRecipes(0).map((r) => r.id)).not.toEqual(weeklyRecipes(1).map((r) => r.id))
    expect(weeklyRecipes(3)).toHaveLength(5)
  })
})
