import { describe, expect, it } from 'vitest'
import { buildJourney, type JourneyWorkout } from './journey'
import { topics } from '../content/topics'
import { validateMeta } from '../content/validate'

const w = (date: string, kind: 'workout' | 'recovery', ids: string[], reaction: 'good' | 'ok' | 'symptoms' = 'good', next?: 'good' | 'ok' | 'symptoms'): JourneyWorkout => ({ date, kind, completedExerciseIds: ids, reaction, nextDayReaction: next })

describe('Mein Weg', () => {
  it('beginnt freundlich ohne Leistungsdruck', () => {
    const j = buildJourney([], { phase: 1, pelvicFloorIds: [] })
    expect(j.story).toContain('Ausruhen')
    expect(j.milestones.some((m) => m.achieved)).toBe(false)
  })
  it('erzählt Entwicklung: Einheiten, Erholung, Verträglichkeit, Vielfalt', () => {
    const list = [w('2026-10-01T08:00:00Z', 'recovery', ['a', 'b']), w('2026-10-02T08:00:00Z', 'workout', ['c'], 'good', 'symptoms'), w('2026-10-03T08:00:00Z', 'workout', ['d'])]
    const j = buildJourney(list, { phase: 2, pelvicFloorIds: ['a'] })
    expect(j.sessions).toBe(3)
    expect(j.restDays).toBe(1)
    expect(j.wellTolerated).toBe(2) // Folgetag-Beschwerden zählen
    expect(j.variety).toBe(4)
    const done = j.milestones.filter((m) => m.achieved).map((m) => m.id)
    expect(done).toEqual(expect.arrayContaining(['first', 'first_rest', 'pelvic', 'phase']))
    expect(done).not.toContain('three_good')
    expect(j.story).toContain('3 Einheiten')
  })
  it('kennt weder Streaks noch Leistungsvergleiche', () => {
    const text = JSON.stringify(buildJourney([w('2026-10-01T08:00:00Z', 'workout', ['a'])], { phase: 1, pelvicFloorIds: [] }))
    expect(text.toLowerCase()).not.toMatch(/streak|punkte|kalorien|gewicht|rang/)
  })
})

describe('"Ist das normal?"', () => {
  it('hat alle elf Themen aus der Roadmap', () => {
    expect(topics).toHaveLength(11)
    expect(new Set(topics.map((t) => t.id)).size).toBe(11)
  })
  it('jedes Thema folgt demselben Muster: vorkommen, beobachten, kontaktieren, dringend', () => {
    for (const t of topics) {
      expect(t.canOccur.length, t.id).toBeGreaterThan(0)
      expect(t.observe.length, t.id).toBeGreaterThan(0)
      expect(t.contact.length, t.id).toBeGreaterThan(0)
      expect(t.urgent.length, t.id).toBeGreaterThan(0)
      expect(validateMeta(t.meta, t.id, '2026-10-07'), t.id).toEqual([])
      expect(t.meta.status).toBe('draft')
    }
  })
  it('stellt keine Diagnosen: keine Befundsprache', () => {
    const all = JSON.stringify(topics).toLowerCase()
    for (const bad of ['du hast eine ', 'ist eine thrombose', 'ist eine infektion', 'depression diagnos']) expect(all).not.toContain(bad)
  })
  it('Stimmung nennt bei Gefahr klare Hilfe (112, Telefonseelsorge)', () => {
    const mood = topics.find((t) => t.id === 'mood')!
    expect(mood.urgent.join(' ')).toContain('112')
    expect(mood.urgent.join(' ')).toContain('0800 111 0 111')
  })
})
