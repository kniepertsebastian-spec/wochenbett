import type { DiastasisLog, SymptomLog, WorkoutRecord } from '../db/db'
import { exerciseById } from '../content/exercises'

export type ReportSections = { exercises: boolean; symptoms: boolean; measurements: boolean; trend: boolean }
export type ReportInput = { from: string; to: string; workouts: WorkoutRecord[]; symptoms: SymptomLog[]; diastasis: DiastasisLog[] }

const d = (iso: string) => new Date(iso).toLocaleDateString('de-DE')
const inRange = (iso: string, from: string, to: string) => iso.slice(0, 10) >= from && iso.slice(0, 10) <= to
const reactionLabel = { good: 'gut', ok: 'okay', symptoms: 'Beschwerden' } as const
const level = { none: 'keine', mild: 'leicht', moderate: 'mittel', severe: 'stark' } as const

/** Erzeugt den Bericht lokal. Nur auf ausdrücklichen Wunsch, es erfolgt kein Upload. */
export function buildReport(input: ReportInput, sections: ReportSections): string {
  const { from, to } = input
  const w = input.workouts.filter((x) => inRange(x.date, from, to))
  const s = input.symptoms.filter((x) => inRange(x.date, from, to))
  const m = input.diastasis.filter((x) => inRange(x.date, from, to))
  const out: string[] = ['Verlauf Rückbildung (Selbstdokumentation)', `Zeitraum: ${d(from)} bis ${d(to)}`, 'Hinweis: Eigene Angaben der Nutzerin, keine Diagnose.', '']

  if (sections.exercises) {
    out.push('ÜBUNGEN')
    if (w.length === 0) out.push('Keine Einheiten im Zeitraum.')
    for (const x of w) {
      const names = x.completedExerciseIds.map((id) => exerciseById(id)?.name ?? id).join(', ') || '–'
      out.push(`${d(x.date)}: ${x.kind === 'recovery' ? 'Recovery' : 'Einheit'}, ${x.durationMin} Min, Reaktion: ${reactionLabel[x.reaction]}${x.nextDayReaction ? ` (Folgetag: ${reactionLabel[x.nextDayReaction]})` : ''}. Übungen: ${names}`)
    }
    out.push('')
  }
  if (sections.symptoms) {
    out.push('BESCHWERDEN')
    if (s.length === 0) out.push('Keine Einträge im Zeitraum.')
    for (const x of s) out.push(`${d(x.date)}: Urinverlust ${x.urineLeakage ? 'ja' : 'nein'}, Druckgefühl ${level[x.pressure]}, Schweregefühl ${level[x.heaviness]}, Schmerzen ${level[x.pain]}, Stuhlgang-Probleme ${x.bowelProblems ? 'ja' : 'nein'}`)
    out.push('')
  }
  if (sections.measurements) {
    out.push('MESSWERTE BAUCHMITTE (Selbstbeobachtung, Fingerbreiten)')
    if (m.length === 0) out.push('Keine Einträge im Zeitraum.')
    for (const x of m) out.push(`${d(x.date)}: Abstand ${x.widthFingers ?? '–'}, Doming ${x.doming ? 'ja' : 'nein'}${x.note ? `, Notiz: ${x.note}` : ''}`)
    out.push('')
  }
  if (sections.trend) {
    out.push('VERLAUF')
    const widths = m.filter((x) => x.widthFingers !== undefined)
    if (widths.length >= 2) out.push(`Abstand: ${widths[0].widthFingers} → ${widths.at(-1)!.widthFingers} Fingerbreiten (${widths.length} Messungen)`)
    const sym = s.filter((x) => x.pain !== 'none' || x.pressure !== 'none' || x.heaviness !== 'none' || x.urineLeakage)
    out.push(`Einträge mit Beschwerden: ${sym.length} von ${s.length}`)
    out.push(`Einheiten mit Beschwerden danach: ${w.filter((x) => x.reaction === 'symptoms').length} von ${w.length}`)
    out.push('')
  }
  return out.join('\n').trimEnd() + '\n'
}
