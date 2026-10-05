import { equipmentLabel } from '../domain/equipment'
import type { Exercise, Readiness, UserState } from '../domain/types'

/**
 * Warum darf diese Übung heute NICHT angeboten werden? `null` = geeignet.
 * Die Zeit seit Geburt ist nur eine Untergrenze (Kontraindikation), nie eine alleinige Freigabe.
 */
export function ineligibleReason(e: Exercise, user: UserState, readiness: Readiness): string | null {
  // Fail-closed: ohne Sicherheitsfelder nie anbieten
  if (e.stopCriteria.length === 0 || e.redFlags.length === 0) return 'Sicherheitsangaben fehlen'
  if (e.phase > user.currentPhase) return `Ab Phase ${e.phase} (du bist in Phase ${user.currentPhase})`
  const missing = e.requires.filter((r) => !user.equipment.includes(r))
  if (missing.length > 0) return `Benötigt: ${missing.map(equipmentLabel).join(', ')}`

  for (const c of e.contraindications) {
    switch (c.condition) {
      case 'cesarean_early':
        // unbekannte Geburtsart wird konservativ wie Kaiserschnitt behandelt
        if (user.birthType !== 'vaginal' && user.daysSinceBirth < (c.minDaysSinceBirth ?? Infinity))
          return `Nach Kaiserschnitt frühestens ab Tag ${c.minDaysSinceBirth ?? '?'} (du bist bei Tag ${user.daysSinceBirth})`
        break
      case 'perineal_early':
        if (user.birthType !== 'cesarean' && user.daysSinceBirth < (c.minDaysSinceBirth ?? Infinity))
          return `Nach Spontangeburt frühestens ab Tag ${c.minDaysSinceBirth ?? '?'} (du bist bei Tag ${user.daysSinceBirth})`
        break
      case 'pelvic_pressure':
        if (readiness.pelvicPressure) return 'Heute nicht, weil du Druckgefühl im Becken angegeben hast'
        break
      case 'pain':
        if (readiness.pain === 'moderate' || readiness.pain === 'severe') return 'Heute nicht, weil du Schmerzen angegeben hast'
        break
      case 'doming':
        if (user.doming) return 'Nicht, solange Doming beobachtet wurde'
        break
      case 'no_clearance':
        if (!user.medicalClearance) return 'Nur mit medizinischer Freigabe'
        break
    }
  }
  return null
}

export const isEligible = (e: Exercise, user: UserState, readiness: Readiness): boolean => ineligibleReason(e, user, readiness) === null
