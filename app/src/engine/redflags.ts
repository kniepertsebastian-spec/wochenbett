import type { ContentMeta, RedFlagId, Urgency } from '../domain/types'

/** ENTWURF: Warnzeichen-Texte sind noch nicht fachlich geprüft (siehe docs/content-governance.md). */
export const redFlagMeta: ContentMeta = {
  evidenceLevel: 'practical_tip',
  sources: [],
  status: 'draft',
  draftedAt: '2026-10-05',
  reviewDue: '2027-10-05',
  note: 'Entwurf: Texte, Dringlichkeitsstufen und Rufnummern von Hebamme/Ärztin prüfen lassen.',
}

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

// ---------- Eindeutiger nächster Schritt ----------

export type Guidance = 'observe' | 'contact' | 'urgent'

export const GUIDANCE_LABEL: Record<Guidance, string> = {
  observe: 'Beobachten',
  contact: 'Hebamme oder Ärztin kontaktieren',
  urgent: 'Dringend abklären',
}

export type NextStep = {
  level: Guidance
  /** Kurzer, ruhiger Satz für die Überschrift */
  title: string
  text: string
  actions: { label: string; tel: string }[]
}

/** Bei jedem Warnzeichen gibt es genau einen klaren nächsten Schritt. Ruhig formuliert, ohne Diagnose. */
export function nextStep(u: Urgency): NextStep {
  switch (u) {
    case 'emergency':
      return {
        level: 'urgent',
        title: 'Bitte ruf jetzt den Notruf 112.',
        text: 'Bei Atemnot oder Brustschmerzen solltest du nicht abwarten. Sag, dass du vor kurzem entbunden hast. Wenn möglich, bleib nicht allein.',
        actions: [{ label: '112 anrufen', tel: '112' }],
      }
    case 'urgent':
      return {
        level: 'urgent',
        title: 'Bitte lass das heute noch ärztlich abklären.',
        text: 'Ruf deine Hebamme oder Ärztin an. Erreichst du niemanden, hilft der ärztliche Bereitschaftsdienst (116117). Bei starker Verschlechterung wähle 112.',
        actions: [
          { label: 'Bereitschaftsdienst 116117', tel: '116117' },
          { label: 'Notruf 112', tel: '112' },
        ],
      }
    case 'consult':
      return {
        level: 'contact',
        title: 'Sprich bitte bald mit deiner Hebamme oder Ärztin.',
        text: 'Ruf heute oder morgen an und beschreibe, was dir aufgefallen ist. Bis dahin: Ruh dich aus und pausiere das Training.',
        actions: [],
      }
  }
}
