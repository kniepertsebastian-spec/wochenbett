import type { Exercise, Readiness, Recommendation, Situation } from '../domain/types'

export type AlternativeId = 'three_min' | 'rest'
export type Alternative = { id: AlternativeId; label: string }

export type Summary = {
  title: string
  /** Höchstens zwei kurze, verständliche Gründe */
  reasons: string[]
  /** Höchstens zwei Alternativen */
  alternatives: Alternative[]
}

/** Geschätzte Dauer in Minuten inkl. Übergängen (15 s pro Übung). */
export const estimateMinutes = (list: Exercise[]): number => Math.max(1, Math.round(list.reduce((sum, e) => sum + e.duration + 15, 0) / 60))

const situationReason: Partial<Record<Situation, string>> = {
  baby_sleeping: 'Das Baby schläft, deshalb leise und ohne Ansagen.',
  baby_arm: 'Das Baby ist auf dem Arm, deshalb nur Übungen mit einer Hand.',
  one_hand: 'Du hast nur eine Hand frei, deshalb passende Übungen.',
  five_min: 'Du hast nur 5 Minuten.',
  time_10_20: 'Du hast 10 bis 20 Minuten Zeit.',
}

/** Menschlich formulierte Überschrift, Gründe und Alternativen für die Empfehlungskarte. */
export function summarize(rec: Recommendation, readiness: Readiness, situation?: Situation): Summary {
  if (rec.kind === 'stop') return { title: 'Heute lieber kein Training.', reasons: ['Dir ist etwas aufgefallen, das ernst genommen werden sollte.'], alternatives: [] }

  const minutes = estimateMinutes(rec.exercises)
  const title =
    rec.exercises.length === 0
      ? 'Heute passt Ausruhen.'
      : rec.kind === 'recovery'
        ? `Heute passt eine sanfte ${minutes}-Minuten-Erholung.`
        : `Heute passt eine ${minutes}-Minuten-Einheit.`

  // Gründe nach Wichtigkeit, die ersten zwei werden gezeigt
  const reasons: string[] = []
  if (readiness.pain === 'moderate' || readiness.pain === 'mild') reasons.push('Du hast Schmerzen angegeben.')
  if (readiness.pelvicPressure) reasons.push('Du hast Druckgefühl angegeben.')
  if (readiness.lastSession === 'symptoms') reasons.push('Die letzte Einheit hat Beschwerden gemacht.')
  if (readiness.energy <= 2) reasons.push('Du hast wenig Energie.')
  if (situation && situationReason[situation]) reasons.push(situationReason[situation]!)
  if (readiness.energy >= 4 && rec.kind === 'workout') reasons.push('Du hast heute gute Energie.')
  if (readiness.lastSession === 'good') reasons.push('Die letzte Einheit wurde gut vertragen.')
  if (rec.kind === 'recovery' && readiness.energy >= 4 && readiness.pain === 'none') reasons.push('Du startest mit Atmung und Wahrnehmung, das ist die Basis.')

  const alternatives: Alternative[] = []
  if (rec.exercises.length > 0) {
    if (rec.kind === 'workout' || (rec.kind === 'recovery' && rec.durationMin > 3)) alternatives.push({ id: 'three_min', label: 'Heute nur 3 Minuten?' })
    if (rec.kind === 'workout') alternatives.push({ id: 'rest', label: 'Heute lieber Erholung?' })
  }
  return { title, reasons: reasons.slice(0, 2), alternatives }
}
