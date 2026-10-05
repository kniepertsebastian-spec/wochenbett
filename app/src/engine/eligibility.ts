import type { Exercise, Readiness, UserState } from '../domain/types'

/**
 * Darf diese Übung heute angeboten werden? Die Zeit seit Geburt ist nur eine
 * Untergrenze (Kontraindikation), nie eine alleinige Freigabe.
 */
export function isEligible(e: Exercise, user: UserState, readiness: Readiness): boolean {
  // Fail-closed: ohne Sicherheitsfelder nie anbieten
  if (e.stopCriteria.length === 0 || e.redFlags.length === 0) return false
  if (e.phase > user.currentPhase) return false

  for (const c of e.contraindications) {
    switch (c.condition) {
      case 'cesarean_early':
        // unbekannte Geburtsart wird konservativ wie Kaiserschnitt behandelt
        if (user.birthType !== 'vaginal' && user.daysSinceBirth < (c.minDaysSinceBirth ?? Infinity)) return false
        break
      case 'perineal_early':
        if (user.birthType !== 'cesarean' && user.daysSinceBirth < (c.minDaysSinceBirth ?? Infinity)) return false
        break
      case 'pelvic_pressure':
        if (readiness.pelvicPressure) return false
        break
      case 'pain':
        if (readiness.pain === 'moderate' || readiness.pain === 'severe') return false
        break
      case 'doming':
        if (user.doming) return false
        break
      case 'no_clearance':
        if (!user.medicalClearance) return false
        break
    }
  }
  return true
}
