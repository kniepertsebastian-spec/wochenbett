import { useState } from 'react'
import { Button, Card, WarningBanner } from '../components'
import { db } from '../db/db'
import type { BirthType } from '../domain/types'
import { todayISO } from '../hooks/useUserState'

export function Onboarding() {
  const [birthDate, setBirthDate] = useState('')
  const [birthType, setBirthType] = useState<BirthType | ''>('')
  const [clearance, setClearance] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const valid = birthDate !== '' && birthDate <= todayISO() && birthType !== '' && accepted

  async function save() {
    if (!valid) return
    await db.userProfile.put({ id: 'me', birthDate, birthType, medicalClearance: clearance, createdAt: new Date().toISOString() })
    await db.userProgress.put({ id: 'me', currentPhase: 1, updatedAt: new Date().toISOString() })
  }

  return (
    <main className="pt-safe pb-safe mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Willkommen</h1>
      <p className="text-stone-600 dark:text-stone-400">
        Diese App begleitet dich sanft zurück zu Bewegung und Belastbarkeit. Es gibt keine Registrierung, deine Daten bleiben auf diesem Gerät.
      </p>
      <WarningBanner level="yellow">
        Diese App ist keine Diagnostik- oder Therapie-App und ersetzt keine Hebamme, Physiotherapeutin oder Ärztin.
      </WarningBanner>

      <Card className="space-y-4">
        <label className="block">
          <span className="mb-1 block font-medium">Geburtsdatum deines Babys</span>
          <input
            type="date"
            value={birthDate}
            max={todayISO()}
            onChange={(e) => setBirthDate(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-transparent px-3 dark:border-stone-700"
          />
        </label>
        <fieldset>
          <legend className="mb-1 font-medium">Geburtsart</legend>
          <div className="flex flex-col gap-2">
            {(
              [
                ['vaginal', 'Spontangeburt'],
                ['cesarean', 'Kaiserschnitt'],
                ['unknown', 'Möchte ich nicht angeben'],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex min-h-12 items-center gap-3">
                <input type="radio" name="birthType" className="size-5" checked={birthType === v} onChange={() => setBirthType(v)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={clearance} onChange={(e) => setClearance(e.target.checked)} />
          <span>Meine Hebamme oder Ärztin hat mir sportliche Aktivität nach der Geburt freigegeben (optional).</span>
        </label>
        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Ich habe verstanden, dass die App keine medizinische Beratung ersetzt und ich bei Beschwerden Fachpersonen kontaktiere.</span>
        </label>
      </Card>
      <Button className="w-full" disabled={!valid} onClick={save}>
        Los geht's
      </Button>
    </main>
  )
}
