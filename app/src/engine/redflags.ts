import type { RedFlagId, Urgency } from '../domain/types'

export const RED_FLAGS: Record<RedFlagId, { label: string; urgency: Urgency }> = {
  bleeding: { label: 'Ungewöhnlich starke oder zunehmende Blutung', urgency: 'urgent' },
  fever: { label: 'Fieber', urgency: 'urgent' },
  pain_increasing: { label: 'Zunehmender starker Schmerz', urgency: 'consult' },
  wound_problem: { label: 'Auffälligkeiten an Kaiserschnitt- oder Geburtsverletzungsstelle', urgency: 'urgent' },
  breathing_chest: { label: 'Atemnot oder Brustschmerzen', urgency: 'emergency' },
  leg_swelling: { label: 'Einseitige Schwellung oder starke Schmerzen im Bein', urgency: 'urgent' },
  pelvic_pressure_severe: { label: 'Ausgeprägtes Druck- oder Fremdkörpergefühl im Becken', urgency: 'consult' },
  symptom_worsening: { label: 'Neue oder deutliche Verschlechterung von Beschwerden', urgency: 'consult' },
}

export const RED_FLAG_IDS = Object.keys(RED_FLAGS) as RedFlagId[]

const rank: Record<Urgency, number> = { consult: 0, urgent: 1, emergency: 2 }

/** Höchste Dringlichkeit; ohne Flags 'consult' (wird dann nicht verwendet). */
export function highestUrgency(flags: RedFlagId[]): Urgency {
  return flags.reduce<Urgency>((acc, f) => (rank[RED_FLAGS[f].urgency] > rank[acc] ? RED_FLAGS[f].urgency : acc), 'consult')
}

/** Hinweistext. Bewusst ohne Diagnose, nur Abklärungsempfehlung. */
export function urgencyMessage(u: Urgency): string {
  switch (u) {
    case 'emergency':
      return 'Bitte beende das Training und suche sofort medizinische Hilfe bzw. rufe den Notruf (112).'
    case 'urgent':
      return 'Bitte beende das Training und lass das zeitnah ärztlich oder durch deine Hebamme abklären.'
    case 'consult':
      return 'Bitte beende das Training und sprich mit deiner Hebamme oder Ärztin darüber.'
  }
}
