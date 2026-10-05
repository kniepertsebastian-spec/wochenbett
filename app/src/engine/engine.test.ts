import { describe, expect, it } from 'vitest'
import { exercises } from '../content/exercises'
import { validateExercises, isServable } from '../content/validate'
import type { Readiness, UserState } from '../domain/types'
import { isEligible } from './eligibility'
import { applyRegressions, canAdvancePhase, regress } from './progression'
import { assessReadiness } from './readiness'
import { highestUrgency } from './redflags'
import { recommend } from './recommend'

const ok: Readiness = { energy: 5, pain: 'none', pelvicPressure: false, lastSession: 'good', redFlags: [] }
const vaginal: UserState = { daysSinceBirth: 120, birthType: 'vaginal', medicalClearance: true, currentPhase: 3, doming: false }
const byId = (id: string) => exercises.find((e) => e.id === id)!

describe('Katalog', () => {
  it('ist gültig (Referenzen, Sicherheitsfelder, Regressionen)', () => {
    expect(validateExercises(exercises, '2026-10-06')).toEqual([])
  })
  it('hat 20–25 Übungen', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(20)
    expect(exercises.length).toBeLessThanOrEqual(25)
  })
  it('Entwürfe werden in Produktion nicht ausgespielt', () => {
    expect(exercises.every((e) => !isServable(e.meta, true))).toBe(true)
    expect(exercises.every((e) => isServable(e.meta, false))).toBe(true)
  })
  it('erkennt fehlende Sicherheitsfelder und Quellen', () => {
    const bad = { ...byId('glute-bridge'), stopCriteria: [], meta: { ...byId('glute-bridge').meta, evidenceLevel: 'strong' as const } }
    const errs = validateExercises([bad, ...exercises.filter((e) => e.id !== 'glute-bridge')], '2026-10-06')
    expect(errs.some((e) => e.includes('Abbruchkriterien'))).toBe(true)
    expect(errs.some((e) => e.includes('Quelle fehlt'))).toBe(true)
  })
})

describe('Safety: Red Flags & Ampel', () => {
  it('Red Flag → stop, auch bei hoher Energie', () => {
    const r = recommend(vaginal, { ...ok, redFlags: ['fever'] }, exercises)
    expect(r.kind).toBe('stop')
  })
  it('Atemnot/Brustschmerz → Notruf-Dringlichkeit', () => {
    expect(highestUrgency(['fever', 'breathing_chest'])).toBe('emergency')
    const r = recommend(vaginal, { ...ok, redFlags: ['breathing_chest'] }, exercises)
    expect(r.kind === 'stop' && r.urgency).toBe('emergency')
  })
  it('starke Schmerzen gelten wie Red Flag', () => {
    expect(assessReadiness({ ...ok, pain: 'severe' }).light).toBe('red')
    expect(recommend(vaginal, { ...ok, pain: 'severe' }, exercises).kind).toBe('stop')
  })
  it('Beschwerden → Gelb → Recovery mit Phase-1-Übungen', () => {
    const r = recommend(vaginal, { ...ok, pain: 'mild' }, exercises)
    expect(r.kind).toBe('recovery')
    expect(r.kind === 'recovery' && r.exercises.every((e) => e.phase === 1)).toBe(true)
  })
  it('starke Erschöpfung → Recovery', () => {
    expect(recommend(vaginal, { ...ok, energy: 1 }, exercises).kind).toBe('recovery')
  })
  it('Energie 3 → 5-Minuten-Einheit, Energie 5 → geplante Einheit', () => {
    const r3 = recommend(vaginal, { ...ok, energy: 3 }, exercises)
    expect(r3.kind === 'recovery' && r3.durationMin).toBe(5)
    const r5 = recommend(vaginal, ok, exercises)
    expect(r5.kind).toBe('workout')
  })
  it('Phase 1 + volle Energie → 10-Minuten-Recovery statt Mini-Einheit', () => {
    const r = recommend({ ...vaginal, currentPhase: 1 }, ok, exercises)
    expect(r.kind).toBe('recovery')
    expect(r.kind === 'recovery' && r.exercises.length).toBeGreaterThan(2)
  })
  it('Druckgefühl → keine automatische Progression', () => {
    const user = { ...vaginal }
    const r = recommend(user, { ...ok, pelvicPressure: true }, exercises)
    expect(r.kind).not.toBe('workout')
    expect(canAdvancePhase({ ...user, currentPhase: 2 }, { ...ok, pelvicPressure: true }, ['good', 'good', 'good']).allowed).toBe(false)
  })
})

describe('Safety: Eignung', () => {
  const early: UserState = { daysSinceBirth: 20, birthType: 'cesarean', medicalClearance: false, currentPhase: 4, doming: false }
  it('Kaiserschnitt + frühe Phase → ungeeignete Übungen nicht anzeigen', () => {
    const r = recommend(early, ok, exercises)
    const list = r.kind === 'stop' ? [] : r.exercises
    expect(list.length).toBeGreaterThan(0)
    for (const e of list) expect(e.contraindications.some((c) => c.condition === 'cesarean_early')).toBe(false)
  })
  it('Phase 4 braucht medizinische Freigabe', () => {
    expect(isEligible(byId('dead-bug-alternating'), { ...vaginal, currentPhase: 4, medicalClearance: false }, ok)).toBe(false)
    expect(isEligible(byId('dead-bug-alternating'), { ...vaginal, currentPhase: 4 }, ok)).toBe(true)
  })
  it('Übung aus höherer Phase wird nie angeboten (nur Zeit reicht nicht)', () => {
    expect(isEligible(byId('bird-dog'), { ...vaginal, currentPhase: 2, daysSinceBirth: 365 }, ok)).toBe(false)
  })
  it('unbekannte Geburtsart wird wie Kaiserschnitt behandelt', () => {
    expect(isEligible(byId('glute-bridge'), { ...vaginal, birthType: 'unknown', daysSinceBirth: 30, currentPhase: 2 }, ok)).toBe(false)
  })
  it('Doming → Regression statt Progression', () => {
    const user = { ...vaginal, doming: true }
    expect(isEligible(byId('dead-bug-heel-tap'), user, ok)).toBe(false)
    const r = regress(byId('dead-bug-heel-tap'), exercises, user, ok)
    expect(r).not.toBeNull()
    expect(r!.difficulty).toBeLessThan(byId('dead-bug-heel-tap').difficulty)
  })
  it('Ohne Sicherheitsfelder wird nie angeboten (fail-closed)', () => {
    expect(isEligible({ ...byId('pelvic-tilt'), stopCriteria: [] }, vaginal, ok)).toBe(false)
  })
})

describe('Alltagssituationen', () => {
  it('Einhand/Baby auf dem Arm → nur Einhand-geeignete Übungen', () => {
    for (const s of ['one_hand', 'baby_arm'] as const) {
      const r = recommend(vaginal, ok, exercises, { situation: s })
      expect(r.kind).toBe('recovery')
      expect(r.kind === 'recovery' && r.exercises.length > 0 && r.exercises.every((e) => e.oneHandFriendly)).toBe(true)
    }
  })
  it('komplett erschöpft → 2-Minuten-Recovery, nur 5 Minuten → 5 Minuten', () => {
    const a = recommend(vaginal, ok, exercises, { situation: 'exhausted' })
    expect(a.kind === 'recovery' && a.durationMin).toBe(2)
    const b = recommend(vaginal, ok, exercises, { situation: 'five_min' })
    expect(b.kind === 'recovery' && b.durationMin).toBe(5)
  })
  it('Situation hebelt Red Flags nicht aus', () => {
    expect(recommend(vaginal, { ...ok, redFlags: ['bleeding'] }, exercises, { situation: 'five_min' }).kind).toBe('stop')
  })
})

describe('Progression (Empfehlung)', () => {
  it('Problem-Übungen werden in der Empfehlung automatisch regressiert', () => {
    const user = { ...vaginal, currentPhase: 3 as const }
    const base = recommend(user, ok, exercises)
    const target = base.kind === 'workout' ? base.exercises.find((e) => e.regressions.length > 0) : undefined
    expect(target).toBeDefined()
    const r = recommend(user, ok, exercises, { problemIds: [target!.id] })
    expect(r.kind === 'workout' && r.exercises.some((e) => e.id === target!.id)).toBe(false)
  })
})

describe('Progression', () => {
  it('Problem-Übung wird automatisch regressiert', () => {
    const out = applyRegressions([byId('marching-bridge')], ['marching-bridge'], exercises, vaginal, ok)
    expect(out.map((e) => e.id)).toEqual(['glute-bridge'])
  })
  it('Phasenfreigabe braucht Zeit UND beschwerdefreie Einheiten', () => {
    const u = { ...vaginal, currentPhase: 2 as const }
    expect(canAdvancePhase(u, ok, ['good', 'good', 'good']).allowed).toBe(true)
    expect(canAdvancePhase({ ...u, daysSinceBirth: 10 }, ok, ['good', 'good', 'good']).allowed).toBe(false)
    expect(canAdvancePhase(u, ok, ['good', 'symptoms', 'good']).allowed).toBe(false)
    expect(canAdvancePhase(u, ok, ['good']).allowed).toBe(false)
  })
})
