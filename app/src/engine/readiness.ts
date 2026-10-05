import type { Readiness, RedFlagId, TrafficLight } from '../domain/types'

export type ReadinessAssessment = { light: TrafficLight; redFlags: RedFlagId[]; reasons: string[] }

/**
 * Gesamtstatus = Maximum der Einzelbeiträge (Rot > Gelb > Grün).
 * Fail-closed: schwere Schmerzen gelten wie eine Red Flag.
 */
export function assessReadiness(r: Readiness): ReadinessAssessment {
  const redFlags = [...r.redFlags]
  if (r.pain === 'severe' && !redFlags.includes('pain_increasing')) redFlags.push('pain_increasing')
  if (redFlags.length > 0) return { light: 'red', redFlags, reasons: ['Red Flag gemeldet'] }

  const reasons: string[] = []
  if (r.pain === 'moderate') reasons.push('Mittlere Schmerzen')
  if (r.pain === 'mild') reasons.push('Leichte Schmerzen')
  if (r.pelvicPressure) reasons.push('Druckgefühl im Becken')
  if (r.energy <= 2) reasons.push('Wenig Energie')
  if (r.lastSession === 'symptoms') reasons.push('Beschwerden nach der letzten Einheit')
  return { light: reasons.length > 0 ? 'yellow' : 'green', redFlags: [], reasons }
}
