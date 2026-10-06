import { BackLink, Card } from '../components'
import { exercises } from '../content/exercises'
import { foods } from '../content/nutrition'
import { recipes } from '../content/recipes'
import { topics } from '../content/topics'
import type { ContentMeta } from '../domain/types'
import { redFlagMeta, RED_FLAG_IDS } from '../engine/redflags'

type Group = { name: string; where: string; items: { meta: ContentMeta }[] }

const groups: Group[] = [
  { name: 'Warnzeichen und nächste Schritte', where: 'Check-in, Training, Heute', items: [{ meta: redFlagMeta }] },
  { name: '„Ist das normal?“', where: 'Mehr → Ist das normal?', items: topics },
  { name: 'Übungen', where: 'Übungen', items: exercises },
  { name: 'Ernährung', where: 'Mehr → Ernährung', items: foods },
  { name: 'Rezepte', where: 'Mehr → Rezepte', items: recipes },
]

/** Transparenz: Welche Inhalte sind fachlich geprüft, welche noch Entwurf? */
export function ReviewPage() {
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const reviewed = groups.reduce((n, g) => n + g.items.filter((i) => i.meta.status === 'reviewed').length, 0)
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Inhalte und Prüfstatus</h1>
      <p>Die App unterscheidet ehrlich zwischen geprüften Inhalten und Entwürfen. Zu jedem Inhalt gehören Quelle, Rolle der prüfenden Person, Prüfdatum und die nächste Prüfung.</p>
      <Card className="text-center">
        <p className="text-3xl font-semibold">{reviewed} von {total}</p>
        <p>Inhalten sind fachlich geprüft</p>
        {reviewed === 0 && <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Noch keiner. Alle Inhalte sind Entwürfe und warten auf die Prüfung durch Hebamme, Physiotherapeutin oder Ärztin.</p>}
      </Card>
      {groups.map((g) => {
        const rev = g.items.filter((i) => i.meta.status === 'reviewed').length
        const due = g.items.map((i) => i.meta.reviewDue).sort()[0]
        return (
          <Card key={g.name} className="space-y-1">
            <h2 className="font-semibold">{g.name}</h2>
            <p>{g.items.length} Inhalte, davon {rev} geprüft</p>
            <p className="text-sm text-stone-600 dark:text-stone-400">Zu sehen unter: {g.where}. Nächste Prüfung spätestens: {new Date(due).toLocaleDateString('de-DE')}</p>
            {g.name.startsWith('Warnzeichen') && <p className="text-sm text-stone-600 dark:text-stone-400">{RED_FLAG_IDS.length} Warnzeichen mit Dringlichkeitsstufe</p>}
          </Card>
        )
      })}
    </main>
  )
}
