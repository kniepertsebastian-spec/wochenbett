import { useState } from 'react'
import { Button, Card, WarningBanner } from '../components'
import { db } from '../db/db'
import { DEFAULT_EQUIPMENT, EQUIPMENT } from '../domain/equipment'
import type { BirthType, EquipmentId, GoalId } from '../domain/types'
import { GOALS } from '../engine/goals'
import { LoginForm } from '../sync/SyncForms'
import { suggestStartPhase, type ActivityLevel } from '../engine/progression'
import { daysBetween, todayISO } from '../hooks/useUserState'

const levels: { id: ActivityLevel; label: string }[] = [
  { id: 'none', label: 'Noch nichts, ich fange gerade erst an' },
  { id: 'light', label: 'Spaziergänge oder leichte Übungen, beschwerdefrei' },
  { id: 'course', label: 'Rückbildungskurs gemacht oder von Hebamme/Ärztin für Training freigegeben' },
]

export function Onboarding() {
  const [birthDate, setBirthDate] = useState('')
  const [birthType, setBirthType] = useState<BirthType | ''>('')
  const [level, setLevel] = useState<ActivityLevel | ''>('')
  const [clearance, setClearance] = useState(false)
  const [equipment, setEquipment] = useState<EquipmentId[]>(DEFAULT_EQUIPMENT)
  const [goals, setGoals] = useState<GoalId[]>([])
  const [accepted, setAccepted] = useState(false)
  const [login, setLogin] = useState(false)
  const valid = birthDate !== '' && birthDate <= todayISO() && birthType !== '' && level !== '' && accepted
  const phase = birthDate && level ? suggestStartPhase(daysBetween(birthDate), level) : null

  async function save() {
    if (!valid) return
    const now = new Date().toISOString()
    await db.userProfile.put({ id: 'me', birthDate, birthType, medicalClearance: clearance, createdAt: now })
    await db.userProgress.put({ id: 'me', currentPhase: suggestStartPhase(daysBetween(birthDate), level), updatedAt: now })
    await db.appSettings.put({ key: 'equipment', value: equipment })
    if (goals.length > 0) await db.appSettings.put({ key: 'goals', value: goals })
  }

  if (login) {
    return (
      <main className="pt-safe pb-safe mx-auto max-w-md space-y-4 p-4">
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <p className="text-stone-600 dark:text-stone-400">Melde dich mit deinem Sync-Konto an, um deine Daten auf dieses Gerät zu holen.</p>
        <Card><LoginForm /></Card>
        <Button variant="ghost" onClick={() => setLogin(false)}>← Zurück</Button>
      </main>
    )
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
          <input type="date" value={birthDate} max={todayISO()} onChange={(e) => setBirthDate(e.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" />
        </label>
        <fieldset>
          <legend className="mb-1 font-medium">Geburtsart</legend>
          <div className="flex flex-col gap-2">
            {([['vaginal', 'Spontangeburt'], ['cesarean', 'Kaiserschnitt'], ['unknown', 'Möchte ich nicht angeben']] as const).map(([v, label]) => (
              <label key={v} className="flex min-h-12 items-center gap-3">
                <input type="radio" name="birthType" className="size-5" checked={birthType === v} onChange={() => setBirthType(v)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-medium">Wie aktiv warst du seit der Geburt?</legend>
          <div className="flex flex-col gap-2">
            {levels.map((l) => (
              <label key={l.id} className="flex min-h-12 items-start gap-3 py-1">
                <input type="radio" name="level" className="mt-1 size-5" checked={level === l.id} onChange={() => { setLevel(l.id); if (l.id === 'course') setClearance(true) }} />
                {l.label}
              </label>
            ))}
          </div>
          {phase && <p className="mt-2 text-sm" role="status">Du startest in Phase {phase}. Das kannst du später unter Verlauf anpassen.</p>}
        </fieldset>
        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={clearance} onChange={(e) => setClearance(e.target.checked)} />
          <span>Meine Hebamme oder Ärztin hat mir sportliche Aktivität nach der Geburt freigegeben (optional).</span>
        </label>
        <fieldset>
          <legend className="mb-1 font-medium">Welche Trainingsmittel hast du?</legend>
          {EQUIPMENT.map((q) => (
            <label key={q.id} className="flex min-h-12 items-center gap-3">
              <input type="checkbox" className="size-5" checked={equipment.includes(q.id)} onChange={() => setEquipment((cur) => (cur.includes(q.id) ? cur.filter((x) => x !== q.id) : [...cur, q.id]))} />
              {q.label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-medium">Was ist dir wichtig? (freiwillig)</legend>
          {GOALS.map((g) => (
            <label key={g.id} className="flex min-h-12 items-center gap-3">
              <input type="checkbox" className="size-5" checked={goals.includes(g.id)} onChange={() => setGoals((cur) => (cur.includes(g.id) ? cur.filter((x) => x !== g.id) : [...cur, g.id]))} />
              {g.label}
            </label>
          ))}
        </fieldset>
        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Ich habe verstanden, dass die App keine medizinische Beratung ersetzt und ich bei Beschwerden Fachpersonen kontaktiere.</span>
        </label>
      </Card>
      <Button className="w-full" disabled={!valid} onClick={save}>
        Los geht's
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => setLogin(true)}>
        Ich habe schon ein Sync-Konto
      </Button>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">Ein Sync-Konto kannst du auch später unter Mehr → Sync & Sicherung anlegen.</p>
    </main>
  )
}
