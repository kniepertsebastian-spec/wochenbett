import { describe, expect, it } from 'vitest'
import { buildReport } from './report'

const all = { exercises: true, symptoms: true, measurements: true, trend: true }
const input = {
  from: '2026-10-01',
  to: '2026-10-31',
  workouts: [
    { date: '2026-10-02T08:00:00Z', kind: 'workout' as const, durationMin: 10, exerciseIds: ['glute-bridge'], completedExerciseIds: ['glute-bridge'], reaction: 'good' as const },
    { date: '2026-09-01T08:00:00Z', kind: 'workout' as const, durationMin: 5, exerciseIds: [], completedExerciseIds: [], reaction: 'ok' as const },
  ],
  symptoms: [{ date: '2026-10-03T08:00:00Z', urineLeakage: true, pressure: 'mild' as const, heaviness: 'none' as const, pain: 'none' as const, bowelProblems: false }],
  diastasis: [
    { date: '2026-10-04T08:00:00Z', widthFingers: 3, doming: true },
    { date: '2026-10-20T08:00:00Z', widthFingers: 2, doming: false },
  ],
}

describe('Export-Bericht', () => {
  it('enthält nur Daten im Zeitraum und die gewählten Abschnitte', () => {
    const r = buildReport(input, all)
    expect(r).toContain('Glute Bridge')
    expect(r).not.toContain('09.2026')
    expect(r).toContain('Urinverlust ja')
    expect(r).toContain('3 → 2 Fingerbreiten')
    const only = buildReport(input, { exercises: false, symptoms: true, measurements: false, trend: false })
    expect(only).toContain('BESCHWERDEN')
    expect(only).not.toContain('ÜBUNGEN')
    expect(only).not.toContain('MESSWERTE')
  })
  it('weist auf Selbstdokumentation hin (keine Diagnose)', () => {
    expect(buildReport(input, all)).toContain('keine Diagnose')
  })
})
