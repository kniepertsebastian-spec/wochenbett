/** ENTWURF – Orientierung, KEINE medizinische Freigabe. */
export type TimelineStep = { from: number; to: number; title: string; text: string; /** Konkrete kleine Schritte für heute */ today: string[] }

export const timeline: TimelineStep[] = [
  { from: 1, to: 2, title: 'Ankommen und Erholen', text: 'Viel Ruhe, Atmen, Beckenboden nur wahrnehmen. Beschwerden ernst nehmen.', today: ['Schlaf, wenn das Baby schläft.', 'Ein paar ruhige Atemzüge in den Bauch.', 'Stell dir ein Glas Wasser neben das Bett oder Sofa.'] },
  { from: 3, to: 4, title: 'Sanfte Mobilisation', text: 'Kurze, sanfte Einheiten, wenn es dir gut geht.', today: ['Nacken und Schultern kurz lockern.', 'Zwei Minuten Bauchatmung im Bett.', 'Steh über die Seite auf.'] },
  { from: 5, to: 6, title: 'Alltag stabilisieren', text: 'Alltagsbewegungen bewusst gestalten, Pausen einplanen.', today: ['Atme beim Heben aus.', 'Ein kurzer Spaziergang, wenn er sich gut anfühlt.', 'Plane eine bewusste Pause ein.'] },
  { from: 7, to: 8, title: 'Nachsorge besprechen', text: 'Häufig liegt in dieser Zeit die Nachuntersuchung. Besprich dort, was für dich passt.', today: ['Trag den Termin für die Nachuntersuchung ein.', 'Notiere Fragen zu Beckenboden, Bauch und Narbe.', 'Steigere erst nach Rücksprache.'] },
  { from: 9, to: 12, title: 'Aufbau nach Befinden', text: 'Schrittweise steigern, nur wenn der Körper positiv reagiert. Keine automatische Freigabe.', today: ['Steigere nur, wenn dein Körper gut reagiert.', 'Wenn etwas zieht oder drückt: eine Stufe leichter.', 'Erholung bleibt ein fester Teil.'] },
]
export const longTerm = { title: 'Langfristiger Aufbau', text: 'Belastbarkeit wächst individuell und nicht nach Kalender.', today: ['Such dir etwas, das dir Freude macht.', 'Kleine Einheiten zählen.', 'Hör auf deinen Körper.'] }
