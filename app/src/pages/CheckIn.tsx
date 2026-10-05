import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exercises } from '../content/exercises'
import { Button, Card, CheckIn as Choice, WarningBanner } from '../components'
import { useSession } from '../app/session'
import { db } from '../db/db'
import { recordNextDayReaction } from '../db/reactions'
import type { LastSession, PainLevel, Readiness, RedFlagId, Situation } from '../domain/types'
import { assessReadiness } from '../engine/readiness'
import { RED_FLAGS, RED_FLAG_IDS } from '../engine/redflags'
import { recommend } from '../engine/recommend'
import { useUserState } from '../hooks/useUserState'

export function CheckInPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const sit = params.get('s')
  const situation = (['baby_sleeping', 'baby_arm', 'one_hand', 'exhausted', 'five_min'] as const).find((x) => x === sit) as Situation | undefined
  const { user } = useUserState()
  const { setRecommendation } = useSession()
  const [energy, setEnergy] = useState<Readiness['energy'] | null>(null)
  const [pain, setPain] = useState<PainLevel | null>(null)
  const [pressure, setPressure] = useState<'yes' | 'no' | null>(null)
  const [last, setLast] = useState<LastSession | null>(null)
  const [flags, setFlags] = useState<RedFlagId[]>([])
  const [noFlags, setNoFlags] = useState(false)

  const complete = energy && pain && pressure && last && (noFlags || flags.length > 0)
  const toggle = (id: RedFlagId) => {
    setNoFlags(false)
    setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  async function submit() {
    if (!user || !energy || !pain || !pressure || !last) return
    const readiness: Readiness = { energy, pain, pelvicPressure: pressure === 'yes', lastSession: last, redFlags: flags }
    const light = assessReadiness(readiness).light
    const now = new Date().toISOString()
    await db.readinessChecks.add({ date: now, readiness, light })
    // Reaktion am Folgetag der letzten Einheit festhalten
    await recordNextDayReaction(db, last)
    const day = Math.floor(Date.now() / 86_400_000)
    // Übungen mit gemeldeten Problemen in den letzten 14 Tagen
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString()
    const problems = (await db.exerciseHistory.where('date').above(since).toArray()).filter((h) => h.outcome === 'problem').map((h) => h.exerciseId)
    setRecommendation(recommend(user, readiness, exercises, { rotate: day, problemIds: problems, situation }), readiness, situation)
    nav('/plan')
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4 pb-40">
      <h1 className="text-2xl font-semibold">Wie fühlst du dich?</h1>
      <Card className="space-y-5">
        <Choice legend="Energie (1 = erschöpft, 5 = fit)" options={[1, 2, 3, 4, 5].map((v) => ({ value: v as Readiness['energy'], label: String(v) }))} value={energy} onChange={setEnergy} />
        <Choice
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
        <Choice
          legend="Druck- oder Schweregefühl im Becken?"
          options={[
            { value: 'no', label: 'nein' },
            { value: 'yes', label: 'ja' },
          ]}
          value={pressure}
          onChange={setPressure}
        />
        <Choice
          legend="Wie war die letzte Einheit für dich?"
          options={[
            { value: 'good', label: 'gut' },
            { value: 'ok', label: 'okay' },
            { value: 'symptoms', label: 'Beschwerden' },
          ]}
          value={last}
          onChange={setLast}
        />
      </Card>

      <Card>
        <fieldset>
          <legend className="mb-2 font-medium">Ist dir heute etwas davon aufgefallen?</legend>
          <div className="space-y-1">
            {RED_FLAG_IDS.map((id) => (
              <label key={id} className="flex min-h-12 items-start gap-3 py-1">
                <input type="checkbox" className="mt-1 size-5" checked={flags.includes(id)} onChange={() => toggle(id)} />
                <span>{RED_FLAGS[id].label}</span>
              </label>
            ))}
            <label className="flex min-h-12 items-start gap-3 py-1 font-medium">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={noFlags}
                onChange={(e) => {
                  setNoFlags(e.target.checked)
                  if (e.target.checked) setFlags([])
                }}
              />
              <span>Nichts davon</span>
            </label>
          </div>
        </fieldset>
      </Card>
      <WarningBanner level="yellow">Bei Unsicherheit lieber eine Fachperson fragen. Die App stellt keine Diagnose.</WarningBanner>

      <div className="pb-safe fixed inset-x-0 bottom-14 border-t border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto max-w-md">
          <Button className="w-full" disabled={!complete} onClick={submit}>
            Weiter
          </Button>
        </div>
      </div>
    </main>
  )
}
