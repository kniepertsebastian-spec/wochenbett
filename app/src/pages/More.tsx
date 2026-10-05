import { Link } from 'react-router-dom'

const items = [
  { to: '/more/recipes', icon: '🍲', title: 'Rezepte', text: 'Warm, einfach, einhändig oder zum Einfrieren' },
  { to: '/more/nutrition', icon: '🥦', title: 'Ernährung', text: 'Lebensmittel-Lexikon' },
  { to: '/more/tips', icon: '💡', title: 'Tipps', text: 'Kleine Helfer für den Alltag' },
  { to: '/more/timeline', icon: '🗓', title: 'Wochen-Orientierung', text: 'Wo du gerade stehst' },
  { to: '/more/appointments', icon: '📅', title: 'Termine', text: 'Hebamme, Nachuntersuchung, Erinnerungen' },
  { to: '/more/export', icon: '📄', title: 'Verlauf teilen', text: 'Bericht für Hebamme oder Ärztin' },
  { to: '/more/sync', icon: '☁️', title: 'Sync & Sicherung', text: 'Daten sichern und aufs neue Handy mitnehmen' },
  { to: '/more/settings', icon: '⚙️', title: 'Einstellungen & Daten', text: 'Audio, Profil, Export, Löschen' },
]

export function MorePage() {
  return (
    <main className="pt-safe mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-2xl font-semibold">Mehr</h1>
      {items.map((i) => (
        <Link key={i.to} to={i.to} className="flex min-h-16 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <span aria-hidden="true" className="text-2xl">{i.icon}</span>
          <span>
            <span className="block font-medium">{i.title}</span>
            <span className="block text-sm text-stone-600 dark:text-stone-400">{i.text}</span>
          </span>
        </Link>
      ))}
    </main>
  )
}
