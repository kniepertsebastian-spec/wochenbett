// ENTWURF (practical_tip), nicht fachlich geprüft.
export type Habit = { id: string; text: string }

export const habits: Habit[] = [
  { id: 'side_stand', text: 'Über die Seite aufstehen' },
  { id: 'lift_exhale', text: 'Beim Heben ausatmen, Last nah am Körper' },
  { id: 'cough_sneeze', text: 'Beim Husten oder Niesen bewusst ausatmen' },
  { id: 'carry_close', text: 'Lasten (auch das Baby) nah am Körper tragen' },
  { id: 'pause', text: 'Eine bewusste Pause einlegen' },
]
