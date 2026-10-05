/** ENTWURF – Orientierung, KEINE medizinische Freigabe. */
export type TimelineStep = { from: number; to: number; title: string; text: string }

export const timeline: TimelineStep[] = [
  { from: 1, to: 2, title: 'Ankommen und Erholen', text: 'Viel Ruhe, Atmen, Beckenboden nur wahrnehmen. Beschwerden ernst nehmen.' },
  { from: 3, to: 4, title: 'Sanfte Mobilisation', text: 'Kurze, sanfte Einheiten, wenn es dir gut geht.' },
  { from: 5, to: 6, title: 'Alltag stabilisieren', text: 'Alltagsbewegungen bewusst gestalten, Pausen einplanen.' },
  { from: 7, to: 8, title: 'Nachsorge besprechen', text: 'Häufig liegt in dieser Zeit die Nachuntersuchung. Besprich dort, was für dich passt.' },
  { from: 9, to: 12, title: 'Aufbau nach Befinden', text: 'Schrittweise steigern, nur wenn der Körper positiv reagiert. Keine automatische Freigabe.' },
]
export const longTerm = { title: 'Langfristiger Aufbau', text: 'Belastbarkeit wächst individuell und nicht nach Kalender.' }
