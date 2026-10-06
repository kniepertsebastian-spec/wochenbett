import type { WorkoutReaction } from '../domain/types'

export type JourneyWorkout = {
  date: string
  kind: 'workout' | 'recovery'
  completedExerciseIds: string[]
  reaction: WorkoutReaction
  nextDayReaction?: WorkoutReaction
}

export type Milestone = { id: string; title: string; text: string; achieved: boolean }

export type Journey = {
  sessions: number
  /** Tage mit Recovery, bewusst gewählte Erholung zählt als Erfolg */
  restDays: number
  wellTolerated: number
  variety: number
  milestones: Milestone[]
  /** Kurzer Satz, der die Entwicklung erzählt */
  story: string
}

const eff = (w: JourneyWorkout): WorkoutReaction => w.nextDayReaction ?? w.reaction

/** Erzählt Entwicklung statt Leistung: keine Streaks, keine Pflichtziele, Pausen zählen. */
export function buildJourney(workouts: JourneyWorkout[], opts: { phase: number; pelvicFloorIds: string[] }): Journey {
  const sessions = workouts.length
  const wellTolerated = workouts.filter((w) => eff(w) !== 'symptoms').length
  const restDays = new Set(workouts.filter((w) => w.kind === 'recovery').map((w) => w.date.slice(0, 10))).size
  const variety = new Set(workouts.flatMap((w) => w.completedExerciseIds)).size
  const lastThree = workouts.slice(-3)
  const m = (id: string, title: string, text: string, achieved: boolean): Milestone => ({ id, title, text, achieved })

  const milestones: Milestone[] = [
    m('first', 'Die erste Einheit', 'Du hast angefangen. Das ist der schwerste Schritt.', sessions >= 1),
    m('first_rest', 'Bewusst ausgeruht', 'Du hast dir Erholung genommen. Das gehört zum Weg.', restDays >= 1),
    m('pelvic', 'Beckenboden wahrgenommen', 'Du hast eine Beckenboden-Übung gemacht.', workouts.some((w) => w.completedExerciseIds.some((id) => opts.pelvicFloorIds.includes(id)))),
    m('five', '5 Einheiten', 'Du bleibst dran, in deinem Tempo.', sessions >= 5),
    m('variety', '10 verschiedene Übungen', 'Du hast viel ausprobiert.', variety >= 10),
    m('three_good', '3 Einheiten in Folge gut vertragen', 'Dein Körper reagiert positiv.', lastThree.length === 3 && lastThree.every((w) => eff(w) !== 'symptoms')),
    m('phase', 'Eine neue Phase erreicht', 'Du bist in Phase ' + opts.phase + '.', opts.phase >= 2),
    m('ten', '10 Einheiten', 'Das sind schon richtig viele.', sessions >= 10),
    m('twentyfive', '25 Einheiten', 'Du hast eine feste Routine aufgebaut.', sessions >= 25),
  ]

  let story: string
  if (sessions === 0) story = 'Dein Weg beginnt, wann immer du magst. Auch Ausruhen ist ein guter Anfang.'
  else {
    const parts = [`Du hast ${sessions} ${sessions === 1 ? 'Einheit' : 'Einheiten'} gemacht`]
    if (restDays > 0) parts.push(`dir ${restDays} ${restDays === 1 ? 'Mal' : 'Mal'} bewusst Erholung genommen`)
    story = parts.join(' und ') + `. ${wellTolerated} von ${sessions} hat dein Körper gut vertragen.`
  }
  return { sessions, restDays, wellTolerated, variety, milestones, story }
}
