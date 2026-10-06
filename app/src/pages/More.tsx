import { Link } from 'react-router-dom'

type Item = { to: string; icon: string; title: string; text: string }
const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Ich bin unsicher wegen etwas',
    items: [
      { to: '/more/normal', icon: '❓', title: 'Ist das normal?', text: 'Orientierung bei Beschwerden: beobachten, kontaktieren, dringend' },
      { to: '/pelvic-floor', icon: '🌸', title: 'Beckenboden', text: 'Wahrnehmen, üben, Symptom-Tagebuch' },
      { to: '/diastasis', icon: '🫶', title: 'Bauchmitte beobachten', text: 'Selbstbeobachtung mit Verlauf' },
    ],
  },
  {
    title: 'Ich brauche Ruhe',
    items: [
      { to: '/more/wellbeing', icon: '💛', title: 'Wohlbefinden', text: 'Gefühle, Unterstützung und Hilfe' },
      { to: '/more/tips', icon: '💡', title: 'Tipps', text: 'Kleine Karten für den Alltag' },
    ],
  },
  {
    title: 'Essen und Alltag',
    items: [
      { to: '/more/recipes', icon: '🍲', title: 'Rezepte', text: 'Warm, einfach, einhändig oder zum Einfrieren' },
      { to: '/more/nutrition', icon: '🥦', title: 'Ernährung', text: 'Lebensmittel-Lexikon' },
    ],
  },
  {
    title: 'Planung',
    items: [
      { to: '/more/timeline', icon: '🗓', title: 'Diese Woche', text: 'Wo du gerade stehst und was heute reicht' },
      { to: '/more/appointments', icon: '📅', title: 'Termine', text: 'Hebamme, Nachuntersuchung, Erinnerungen' },
      { to: '/more/export', icon: '📄', title: 'Verlauf teilen', text: 'Bericht für Hebamme oder Ärztin' },
    ],
  },
  {
    title: 'Meine Daten und Einstellungen',
    items: [
      { to: '/more/data', icon: '🔒', title: 'Deine Daten', text: 'Was gespeichert wird, Export, Löschen' },
      { to: '/more/sync', icon: '☁️', title: 'Sync & Sicherung', text: 'Daten sichern und aufs neue Handy mitnehmen' },
      { to: '/more/settings', icon: '⚙️', title: 'Einstellungen', text: 'Audio, Profil, Trainingsmittel' },
      { to: '/more/review', icon: '✓', title: 'Inhalte und Prüfstatus', text: 'Was ist fachlich geprüft?' },
    ],
  },
]

export function MorePage() {
  return (
    <main className="pt-safe mx-auto max-w-md space-y-5 p-4">
      <h1 className="text-2xl font-semibold">Mehr</h1>
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`g-${g.title}`} className="space-y-2">
          <h2 id={`g-${g.title}`} className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">{g.title}</h2>
          {g.items.map((i) => (
            <Link key={i.to} to={i.to} className="flex min-h-16 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <span aria-hidden="true" className="text-2xl">{i.icon}</span>
              <span>
                <span className="block font-medium">{i.title}</span>
                <span className="block text-sm text-stone-600 dark:text-stone-400">{i.text}</span>
              </span>
            </Link>
          ))}
        </section>
      ))}
    </main>
  )
}
