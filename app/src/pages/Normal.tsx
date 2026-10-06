import { Link, useParams } from 'react-router-dom'
import { BackLink, Card, ReviewBadge, WarningBanner } from '../components'
import { topicById, topics } from '../content/topics'
import { GUIDANCE_LABEL } from '../engine/redflags'

const related: Record<string, { to: string; label: string }> = {
  'pelvic-floor': { to: '/pelvic-floor', label: 'Beckenboden-Übungen und Symptom-Tagebuch' },
  abdomen: { to: '/diastasis', label: 'Bauchmitte beobachten' },
  mood: { to: '/more/wellbeing', label: 'Wohlbefinden und Unterstützung' },
}

export function NormalPage() {
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Ist das normal?</h1>
      <p className="text-stone-600 dark:text-stone-400">
        Orientierung für Dinge, die nach der Geburt vorkommen. Zu jedem Thema: Was kann vorkommen, was beobachten, wann Hebamme oder Ärztin, wann dringend.
      </p>
      <WarningBanner level="yellow">Das ist keine Diagnose und ersetzt keine Untersuchung. Im Zweifel frag lieber nach. Bei Atemnot, Brustschmerzen oder sehr starker Blutung: Notruf 112.</WarningBanner>
      <ul className="space-y-2">
        {topics.map((t) => (
          <li key={t.id}>
            <Link to={`/more/normal/${t.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
              <span aria-hidden="true" className="text-2xl">{t.icon}</span>
              <span>
                <span className="block font-medium">{t.title}</span>
                <span className="block text-sm text-stone-600 dark:text-stone-400">{t.intro}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

function Section({ title, label, items, tone }: { title: string; label?: string; items: string[]; tone: 'plain' | 'contact' | 'urgent' }) {
  const box = tone === 'urgent' ? 'border-2 border-red-700 dark:border-red-400' : tone === 'contact' ? 'border-2 border-amber-600' : ''
  return (
    <Card className={`space-y-2 ${box}`}>
      {label && <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>}
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="list-disc space-y-1 pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </Card>
  )
}

export function NormalDetailPage() {
  const { id } = useParams()
  const t = id ? topicById(id) : undefined
  if (!t) return <main className="pt-safe mx-auto max-w-md p-4"><BackLink to="/more/normal">← Ist das normal?</BackLink><p>Dieses Thema gibt es nicht.</p></main>
  const rel = related[t.id]
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more/normal">← Ist das normal?</BackLink>
      <h1 className="text-2xl font-semibold"><span aria-hidden="true">{t.icon} </span>{t.title}</h1>
      <p>{t.intro}</p>
      <Section title="Was kann vorkommen?" items={t.canOccur} tone="plain" />
      <Section title="Was kannst du beobachten?" label={GUIDANCE_LABEL.observe} items={t.observe} tone="plain" />
      <Section title="Wann Hebamme oder Ärztin?" label={GUIDANCE_LABEL.contact} items={t.contact} tone="contact" />
      <Section title="Wann dringend?" label={GUIDANCE_LABEL.urgent} items={t.urgent} tone="urgent" />
      <div className="grid gap-2">
        <a href="tel:116117" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">Ärztlicher Bereitschaftsdienst 116117</a>
        <a href="tel:112" className="block min-h-12 rounded-2xl bg-rose-700 px-5 py-3 text-center font-medium text-white dark:bg-rose-600">Notruf 112</a>
      </div>
      {rel && <Link to={rel.to} className="block min-h-12 rounded-2xl border border-stone-300 px-5 py-3 text-center underline dark:border-stone-700">{rel.label}</Link>}
      <WarningBanner level="yellow">Orientierung, keine Diagnose. Jeder Körper und jede Geburt ist anders.</WarningBanner>
      <ReviewBadge meta={t.meta} />
    </main>
  )
}
