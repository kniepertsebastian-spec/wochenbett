import { describe, expect, it } from 'vitest'
import { exercises } from '../content/exercises'
import type { Readiness, UserState } from '../domain/types'
import { nextStep, GUIDANCE_LABEL } from './redflags'
import { recommend } from './recommend'
import { estimateMinutes, summarize } from './summary'

const ok: Readiness = { energy: 5, pain: 'none', pelvicPressure: false, lastSession: 'good', redFlags: [] }
const user: UserState = { daysSinceBirth: 120, birthType: 'vaginal', medicalClearance: true, currentPhase: 3, doming: false, equipment: ['chair', 'weight'] }

describe('Empfehlungskarte', () => {
  it('Überschrift nennt die Dauer, höchstens zwei Gründe und höchstens zwei Alternativen', () => {
    const rec = recommend(user, ok, exercises)
    const s = summarize(rec, ok)
    expect(s.title).toMatch(/^Heute passt eine \d+-Minuten-Einheit\.$/)
    expect(s.title).toContain(String(estimateMinutes(rec.kind === 'stop' ? [] : rec.exercises)))
    expect(s.reasons.length).toBeGreaterThan(0)
    expect(s.reasons.length).toBeLessThanOrEqual(2)
    expect(s.alternatives.map((a) => a.id)).toEqual(['three_min', 'rest'])
  })
  it('Gründe sind alltagssprachlich ("wenig Energie", "gut vertragen")', () => {
    const low = { ...ok, energy: 2 as const }
    expect(summarize(recommend(user, low, exercises), low).reasons.join(' ')).toContain('Du hast wenig Energie.')
    expect(summarize(recommend(user, ok, exercises), ok).reasons.join(' ')).toContain('gut vertragen')
  })
  it('Erholung ist eine vollwertige Empfehlung', () => {
    const rest = recommend(user, ok, exercises, { preferRecovery: true })
    expect(rest.kind).toBe('recovery')
    expect(summarize(rest, ok).title).toContain('Erholung')
  })
  it('"Nur 3 Minuten" liefert höchstens ca. 3 Minuten, ohne weitere Alternative', () => {
    const rec = recommend(user, ok, exercises, { maxMinutes: 3 })
    expect(rec.kind).toBe('recovery')
    expect(rec.kind === 'recovery' && rec.durationMin).toBe(3)
    expect(rec.kind !== 'stop' && estimateMinutes(rec.exercises)).toBeLessThanOrEqual(3)
    expect(summarize(rec, ok).alternatives).toEqual([])
  })
  it('"10–20 Minuten" bei guter Energie ergibt eine längere Einheit, bei wenig Energie bleibt es sanft', () => {
    const long = recommend(user, ok, exercises, { situation: 'time_10_20' })
    expect(long.kind === 'workout' && long.durationMin).toBe(20)
    const tired = recommend(user, { ...ok, energy: 2 }, exercises, { situation: 'time_10_20' })
    expect(tired.kind).toBe('recovery')
  })
  it('Warnzeichen: keine Alternativen, Training ist keine Option', () => {
    const s = summarize(recommend(user, { ...ok, redFlags: ['fever'] }, exercises), ok)
    expect(s.alternatives).toEqual([])
    expect(s.title).toContain('kein Training')
  })
})

describe('Nächster Schritt bei Warnzeichen', () => {
  it('jede Dringlichkeit hat genau einen eindeutigen Schritt mit passender Rufnummer', () => {
    expect(nextStep('emergency').actions.map((a) => a.tel)).toEqual(['112'])
    expect(nextStep('urgent').actions.map((a) => a.tel)).toContain('116117')
    expect(nextStep('consult').title).toContain('Hebamme')
    expect(nextStep('consult').level).toBe('contact')
  })
  it('drei klare Stufen: beobachten, kontaktieren, dringend', () => {
    expect(Object.values(GUIDANCE_LABEL)).toEqual(['Beobachten', 'Hebamme oder Ärztin kontaktieren', 'Dringend abklären'])
  })
})
