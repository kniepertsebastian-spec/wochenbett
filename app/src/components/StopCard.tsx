import { Link } from 'react-router-dom'
import type { RedFlagId } from '../domain/types'
import { GUIDANCE_LABEL, RED_FLAGS, highestUrgency, nextStep } from '../engine/redflags'
import { Button } from './Button'
import { WarningBanner } from './WarningBanner'

/** Ruhige, eindeutige Handlungsanweisung bei Warnzeichen. Kein Training, kein Diagnose-Urteil. */
export function StopCard({ reasons, onNewCheckIn }: { reasons: RedFlagId[]; onNewCheckIn: () => void }) {
  const step = nextStep(highestUrgency(reasons))
  const urgent = step.level === 'urgent'
  return (
    <div className="space-y-4">
      <WarningBanner level={urgent ? 'red' : 'yellow'}>
        <p className="text-sm font-medium">{GUIDANCE_LABEL[step.level]}</p>
        <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
        <p className="mt-2">{step.text}</p>
      </WarningBanner>
      {step.actions.length > 0 && (
        <div className="grid gap-2">
          {step.actions.map((a) => (
            <a key={a.tel} href={`tel:${a.tel}`} className="block min-h-14 rounded-2xl bg-rose-700 px-5 py-4 text-center text-lg font-semibold text-white dark:bg-rose-600">
              {a.label}
            </a>
          ))}
        </div>
      )}
      <div>
        <p className="mb-1 font-medium">Dir ist aufgefallen:</p>
        <ul className="list-disc pl-5">
          {reasons.map((id) => (
            <li key={id}>{RED_FLAGS[id].label}</li>
          ))}
        </ul>
      </div>
      <p className="text-stone-600 dark:text-stone-400">
        Die App kann nicht beurteilen, was dahintersteckt. Training ist erst wieder sinnvoll, wenn das geklärt ist.
      </p>
      <Link to="/more/normal" className="block min-h-12 rounded-2xl bg-stone-200 px-5 py-3 text-center dark:bg-stone-800">
        Orientierung: Ist das normal?
      </Link>
      <Button variant="ghost" className="w-full" onClick={onNewCheckIn}>
        Es geht mir besser: neuer Check-in
      </Button>
    </div>
  )
}
