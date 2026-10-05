// Domain-Modell. Keine UI-, keine DB-Abhängigkeiten.

export type EvidenceLevel = 'strong' | 'moderate' | 'limited' | 'practical_tip'

export type ContentSource = { title: string; url?: string; publisher?: string }

/** Review-Metadaten für medizinisch relevanten Content (siehe docs/content-governance.md). */
export type ContentMeta = {
  evidenceLevel: EvidenceLevel
  sources: ContentSource[]
  /** draft = nicht fachlich geprüft; reviewed = durch Fachperson geprüft */
  status: 'draft' | 'reviewed'
  draftedAt: string // ISO-Datum
  reviewDue: string // ISO-Datum
  reviewedAt?: string // Pflicht bei status 'reviewed'
  reviewedBy?: string // Rolle der prüfenden Person
  note?: string
}

export type RedFlagId =
  | 'bleeding'
  | 'fever'
  | 'pain_increasing'
  | 'wound_problem'
  | 'breathing_chest'
  | 'leg_swelling'
  | 'pelvic_pressure_severe'
  | 'symptom_worsening'

export type Urgency = 'emergency' | 'urgent' | 'consult'

export type BirthType = 'vaginal' | 'cesarean' | 'unknown'

/** 1 Recovery & Wahrnehmung → 4 Belastbarkeit. Wird nie allein über Wochen freigeschaltet. */
export type PhaseId = 1 | 2 | 3 | 4

export type ExerciseId = string

/** Bedingungen, bei denen eine Übung NICHT angeboten wird. */
export type ContraCondition =
  | 'cesarean_early' // früher Kaiserschnitt (Wundheilung)
  | 'perineal_early' // frühe Geburtsverletzung
  | 'pelvic_pressure' // Druck-/Schweregefühl im Becken
  | 'pain' // aktuelle Schmerzen mittel/stark
  | 'doming' // beobachtete Bauchwölbung
  | 'no_clearance' // ohne medizinische Freigabe

export type Contraindication = {
  condition: ContraCondition
  /** Mindest-Tage seit Geburt für diese Bedingung (nur Untergrenze, nie alleinige Freigabe). */
  minDaysSinceBirth?: number
  note: string
}

export type StopCriterion = 'pain' | 'pelvic_pressure' | 'urine_leakage' | 'doming' | 'dizziness'

export type AudioCue = {
  trigger: 'start' | 'inhale' | 'exhale' | 'halfway' | 'end'
  text: string
}

/** Trainingsmittel, die die Nutzerin besitzen kann. Übungen mit `requires` erscheinen nur, wenn alles vorhanden ist. */
export type EquipmentId = 'chair' | 'gymball' | 'band' | 'weight'

export type ExerciseMedia = { kind: 'image' | 'video'; src: string; alt: string }

export type Exercise = {
  id: ExerciseId
  name: string
  description: string
  instructions: string[]
  /** Warum diese Übung sinnvoll ist, in einfachen Worten (Entwurf, siehe meta). */
  why: string
  breathing: string
  targetMuscles: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  /** Dauer in Sekunden (oder Gesamtdauer für Wiederholungen). */
  duration: number
  repetitions?: number
  /** Frühestens in dieser Phase anzubieten. */
  phase: PhaseId
  regressions: ExerciseId[]
  progressions: ExerciseId[]
  contraindications: Contraindication[]
  stopCriteria: StopCriterion[]
  redFlags: RedFlagId[]
  domingWarning: boolean
  /** Benötigte Trainingsmittel (alle müssen vorhanden sein). */
  requires: EquipmentId[]
  oneHandFriendly: boolean
  /** Kann im Bett oder auf dem Sofa nebenbei gemacht werden (kurz, ohne Aufbau). */
  bedFriendly: boolean
  /** Optionale Abbildungen/Videos (liegen unter /media/ und werden offline gecacht). */
  media?: ExerciseMedia[]
  audioCues: AudioCue[]
  meta: ContentMeta
}

// ---------- Nutzerzustand ----------

export type PainLevel = 'none' | 'mild' | 'moderate' | 'severe'
export type LastSession = 'good' | 'ok' | 'symptoms'

export type Readiness = {
  energy: 1 | 2 | 3 | 4 | 5
  pain: PainLevel
  pelvicPressure: boolean
  lastSession: LastSession
  redFlags: RedFlagId[]
}

export type TrafficLight = 'green' | 'yellow' | 'red'

export type UserProfile = {
  id: 'me'
  birthDate: string // ISO-Datum
  birthType: BirthType
  medicalClearance: boolean
  createdAt: string
}

export type UserState = {
  daysSinceBirth: number
  birthType: BirthType
  medicalClearance: boolean
  currentPhase: PhaseId
  /** Beschwerden/Beobachtungen, die Übungen ausschließen können. */
  doming: boolean
  equipment: EquipmentId[]
}

export type WorkoutReaction = 'good' | 'ok' | 'symptoms'

/** `why`: nachvollziehbare Begründung, warum genau dieser Vorschlag entstanden ist. */
export type Recommendation =
  | { kind: 'stop'; light: 'red'; reasons: RedFlagId[]; urgency: Urgency; why: string[] }
  | { kind: 'recovery'; light: 'yellow' | 'green'; durationMin: 2 | 5 | 10; exercises: Exercise[]; why: string[] }
  | { kind: 'workout'; light: 'green'; durationMin: 5 | 10 | 15; exercises: Exercise[]; allowProgression: boolean; why: string[] }

/** Alltagssituation mit Baby (Phase 11). Ersetzt nie den Check-in. */
export type Situation = 'baby_sleeping' | 'baby_arm' | 'one_hand' | 'exhausted' | 'five_min'
