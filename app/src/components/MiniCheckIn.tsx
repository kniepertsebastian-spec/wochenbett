import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import { recordNextDayReaction } from '../db/reactions'
import type { LastSession, PainLevel, Readiness, RedFlagId } from '../domain/types'
import { assessReadiness } from '../engine/readiness'
import { RED_FLAGS, RED_FLAG_IDS } from '../engine/redflags'
import { Button } from './Button'
import { CheckIn } from './CheckIn'

type Step = 'energy' | 'unusual' | 'details' | 'last'

const big = 'min-h-16 rounded-2xl bg-stone-200 px-3 py-3 text-lg font-medium active:bg-stone-300 dark:bg-stone-800 dark:active:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600'

/**
 * Mini-Check-in in drei Fingertipps: Energie, "Ist etwas auffällig?", ggf. letzte Einheit.
 * Nur bei "Ja" wird vertieft (Schmerzen, Druckgefühl, Warnzeichen).
 */
export function MiniCheckIn({ onDone }: { onDone: () => void }) {
  const lastWorkout = useLiveQuery(async () => (await db.workoutHistory.orderBy('date').last()) ?? null, [])
  const [step, setStep] = useState<Step>('energy')
  const [energy, setEnergy] = useState<Readiness['energy']>(3)
  const [unusual, setUnusual] = useState(false)
  const [pain, setPain] = useState<PainLevel>('none')
  const [pressure, setPressure] = useState<'yes' | 'no'>('no')
  const [flags, setFlags] = useState<RedFlagId[]>([])

  // Die letzte Einheit wird nur erfragt, wenn es eine gibt, sie nicht heute war und noch keine Folgetag-Reaktion vorliegt
  const askLast = !!lastWorkout && lastWorkout.nextDayReaction === undefined && new Date(lastWorkout.date).toDateString() !== new Date().toDateString()

  async function finish(last: LastSession) {
    const readiness: Readiness = unusual
      ? { energy, pain, pelvicPressure: pressure === 'yes', lastSession: last, redFlags: flags }
      : { energy, pain: 'none', pelvicPressure: false, lastSession: last, redFlags: [] }
    await db.readinessChecks.add({ date: new Date().toISOString(), readiness, light: assessReadiness(readiness).light })
    if (askLast) await recordNextDayReaction(db, last)
    onDone()
  }
  const afterUnusual = () => (askLast ? setStep('last') : void finish('ok'))

  return (
    <section aria-labelledby="ci-title" className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <h2 id="ci-title" className="text-xl font-semibold">
        Wie geht es dir heute?
      </h2>

      {step === 'energy' && (
        <div className="space-y-3" role="group" aria-label="Energie">
          <p className="text-stone-600 dark:text-stone-400">Wie viel Energie hast du? (1 = erschöpft, 5 = fit)</p>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={big}
                aria-label={`Energie ${v} von 5`}
                onClick={() => {
                  setEnergy(v)
                  setStep('unusual')
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'unusual' && (
        <div className="space-y-3" role="group" aria-label="Auffälligkeiten">
          <p>Ist heute etwas anders oder auffällig?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={big}
              onClick={() => {
                setUnusual(false)
                afterUnusual()
              }}
            >
              Nein
            </button>
            <button
              type="button"
              className={big}
              onClick={() => {
                setUnusual(true)
                setStep('details')
              }}
            >
              Ja
            </button>
          </div>
          <Button variant="ghost" onClick={() => setStep('energy')}>
            ← Zurück
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <CheckIn
            legend="Schmerzen"
            options={[
              { value: 'none', label: 'keine' },
              { value: 'mild', label: 'leicht' },
              { value: 'moderate', label: 'mittel' },
              { value: 'severe', label: 'stark' },
            ]}
            value={pain}
            onChange={setPain}
          />
          <CheckIn
            legend="Druck- oder Schweregefühl im Becken?"
            options={[
              { value: 'no', label: 'nein' },
              { value: 'yes', label: 'ja' },
            ]}
            value={pressure}
            onChange={setPressure}
          />
          <fieldset>
            <legend className="mb-1 font-medium">Ist dir davon etwas aufgefallen?</legend>
            {RED_FLAG_IDS.map((id) => (
              <label key={id} className="flex min-h-12 items-start gap-3 py-1">
                <input type="checkbox" className="mt-1 size-5" checked={flags.includes(id)} onChange={() => setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))} />
                <span>{RED_FLAGS[id].label}</span>
              </label>
            ))}
            <p className="text-sm text-stone-600 dark:text-stone-400">Nichts angekreuzt heißt: nichts davon.</p>
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setStep('unusual')}>
              ← Zurück
            </Button>
            <Button onClick={afterUnusual}>Weiter</Button>
          </div>
        </div>
      )}

      {step === 'last' && (
        <div className="space-y-3" role="group" aria-label="Letzte Einheit">
          <p>Wie war die letzte Einheit für dich?</p>
          <div className="grid grid-cols-3 gap-2">
            {([['good', 'gut'], ['ok', 'okay'], ['symptoms', 'Beschwerden']] as const).map(([v, label]) => (
              <button key={v} type="button" className={big} onClick={() => void finish(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
