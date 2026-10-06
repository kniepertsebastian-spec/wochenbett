import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { BackLink, Card, ReviewBadge, WarningBanner } from '../components'
import { topicById } from '../content/topics'
import { db } from '../db/db'

const label = { 1: 'sehr schwer', 2: 'schwer', 3: 'geht so', 4: 'gut', 5: 'sehr gut' } as const

export function WellbeingPage() {
  const logs = useLiveQuery(() => db.moodLogs.orderBy('date').reverse().limit(14).toArray(), [])
  const mood = topicById('mood')!
  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Wohlbefinden</h1>
      <p>
        Nach der Geburt schwanken Gefühle oft stark. Freude, Erschöpfung, Sorgen und Überforderung können am selben Tag vorkommen. Das ist normal und sagt nichts darüber, ob du eine gute Mutter bist.
      </p>
      <Card className="space-y-2">
        <h2 className="font-semibold">Was dir jetzt helfen kann</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sprich mit deinem Partner oder deiner Familie. Sag konkret, was dir helfen würde, zum Beispiel eine Stunde Schlaf.</li>
          <li>Nimm Hilfe an, auch für Kleinigkeiten wie Essen oder Einkäufe.</li>
          <li>Deine Hebamme begleitet dich auch bei Gefühlen, nicht nur bei Körperthemen.</li>
          <li>Eine Ärztin oder eine Beratungsstelle kann helfen, wenn die Last nicht kleiner wird.</li>
        </ul>
      </Card>
      <Card className="space-y-2 border-2 border-amber-600">
        <p className="text-sm font-semibold uppercase tracking-wide">Hebamme oder Ärztin kontaktieren</p>
        <ul className="list-disc space-y-1 pl-5">{mood.contact.map((c) => <li key={c}>{c}</li>)}</ul>
      </Card>
      <Card className="space-y-2 border-2 border-red-700 dark:border-red-400">
        <p className="text-sm font-semibold uppercase tracking-wide">Sofort Hilfe holen</p>
        <p>Wenn du daran denkst, dir oder dem Baby etwas anzutun, oder nicht mehr leben möchtest: Bitte hol jetzt Hilfe. Du bist damit nicht allein.</p>
        <div className="grid gap-2">
          <a href="tel:112" className="block min-h-12 rounded-2xl bg-rose-700 px-5 py-3 text-center font-medium text-white dark:bg-rose-600">Notruf 112</a>
          <a href="tel:08001110111" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">Telefonseelsorge 0800 111 0 111 (kostenlos, rund um die Uhr)</a>
          <a href="tel:116117" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">Ärztlicher Bereitschaftsdienst 116117</a>
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">Dein Verlauf</h2>
        {!logs || logs.length === 0 ? <p>Noch keine Einträge. Auf „Heute“ kannst du freiwillig festhalten, wie du dich fühlst.</p> : (
          <ul className="space-y-1 text-sm">{logs.map((l) => <li key={l.id}>{new Date(l.date).toLocaleDateString('de-DE')}: {label[l.mood]}</li>)}</ul>
        )}
        <Link to="/more/normal/mood" className="flex min-h-12 items-center underline">Mehr dazu: Ist das normal? Stimmung</Link>
      </Card>
      <WarningBanner level="yellow">Das ist keine Diagnose. Die Einträge sind nur für dich und bleiben auf deinem Gerät (bzw. verschlüsselt im Sync).</WarningBanner>
      <ReviewBadge meta={mood.meta} />
    </main>
  )
}
