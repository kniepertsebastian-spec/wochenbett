import { cloneElement, useEffect, useId, useState, type FormEvent, type ReactElement } from 'react'
import { Button, WarningBanner } from '../components'
import { passwordProblem } from './crypto'
import { describeSyncError } from './messages'
import { useSync } from './SyncProvider'

const input = 'min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700'

/** Beschriftung nur mit dem Label-Text; der Hinweis hängt per aria-describedby am Feld. */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = useId()
  return (
    <div>
      <label className="block">
        <span className="mb-1 block font-medium">{label}</span>
        {hint ? cloneElement(children, { 'aria-describedby': id }) : children}
      </label>
      {hint && (
        <span id={id} className="mt-1 block text-sm text-stone-600 dark:text-stone-400">
          {hint}
        </span>
      )}
    </div>
  )
}

function useAction() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(fn: () => Promise<void>) {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(describeSyncError(e))
    } finally {
      setBusy(false)
    }
  }
  return { error, busy, run }
}

const Error = ({ text }: { text: string }) => (text ? <p role="alert" className="font-medium text-red-800 dark:text-red-300">{text}</p> : null)

export function LoginForm({ onDone }: { onDone?: () => void }) {
  const { client } = useSync()
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const { error, busy, run } = useAction()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await client.login(name, pw)
      onDone?.()
    })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="none" className={input} required /></Field>
      <Field label="Passwort"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" className={input} required /></Field>
      <Error text={error} />
      <Button type="submit" className="w-full" disabled={busy || !name || !pw}>{busy ? 'Anmelden …' : 'Anmelden'}</Button>
    </form>
  )
}

export function RecoverForm({ onDone }: { onDone?: () => void }) {
  const { client } = useSync()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const { error, busy, run } = useAction()
  const problem = pw ? passwordProblem(pw) : null
  const mismatch = pw2 !== '' && pw !== pw2
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await client.recover(name, code, pw)
      onDone?.()
    })
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p>Mit deinem Wiederherstellungscode kommst du wieder an deine Daten und vergibst ein neues Passwort.</p>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="none" className={input} required /></Field>
      <Field label="Wiederherstellungscode" hint="26 Zeichen, z. B. ABCD-EFGH-…. Groß- und Kleinschreibung egal."><input value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoComplete="off" className={`${input} font-mono`} required /></Field>
      <Field label="Neues Passwort" hint={problem ?? undefined}><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={input} required /></Field>
      <Field label="Neues Passwort wiederholen" hint={mismatch ? 'Die Passwörter sind nicht gleich.' : undefined}><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" className={input} required /></Field>
      <Error text={error} />
      <Button type="submit" className="w-full" disabled={busy || !name || !code || !!passwordProblem(pw) || pw !== pw2}>{busy ? 'Einen Moment …' : 'Neues Passwort setzen'}</Button>
    </form>
  )
}

export function RegisterFlow({ onDone }: { onDone?: () => void }) {
  const { client, username } = useSync()
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [invite, setInvite] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const { error, busy, run } = useAction()
  const problem = pw ? passwordProblem(pw) : null
  const mismatch = pw2 !== '' && pw !== pw2
  // Solange der Code angezeigt wird und nicht bestätigt ist, vor versehentlichem Verlassen warnen
  useEffect(() => {
    if (!code || saved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [code, saved])
  const ready = name.trim().length >= 3 && !passwordProblem(pw) && pw === pw2 && invite !== '' && understood

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => setCode((await client.register(name, pw, invite)).recoveryCode))
  }

  if (code) {
    const download = () => {
      const text = `Wochenbett-App: Wiederherstellungscode\nName: ${username ?? name}\nCode: ${code}\n\nMit diesem Code kommst du wieder an deine Daten, falls du dein Passwort vergisst.\nBewahre ihn getrennt vom Passwort auf und gib ihn niemandem.\n`
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'wochenbett-wiederherstellungscode.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Dein Wiederherstellungscode</h2>
        <WarningBanner level="red">
          Dieser Code wird nur jetzt angezeigt. Wenn du dein Passwort vergisst, ist er die einzige Möglichkeit, an deine Daten zu kommen. Niemand kann ihn dir nachträglich zeigen.
        </WarningBanner>
        <p className="rounded-2xl border-2 border-stone-400 p-4 text-center font-mono text-xl tracking-wider break-all dark:border-stone-500" aria-label={`Wiederherstellungscode ${code.replaceAll('-', ' ')}`}>{code}</p>
        <div className="grid gap-2">
          <Button variant="secondary" onClick={async () => { await navigator.clipboard?.writeText(code).catch(() => {}); setCopied(true) }}>{copied ? 'Kopiert' : 'Code kopieren'}</Button>
          <Button variant="secondary" onClick={download}>Als Textdatei speichern</Button>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">Am besten in einem Passwortmanager speichern oder ausdrucken und getrennt vom Passwort aufbewahren.</p>
        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          <span>Ich habe den Code und mein Passwort sicher aufbewahrt.</span>
        </label>
        <Button className="w-full" disabled={!saved} onClick={() => onDone?.()}>Fertig</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" hint="Frei wählbar, z. B. dein Vorname. Keine E-Mail nötig."><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="none" className={input} required /></Field>
      <Field label="Passwort" hint={problem ?? 'Ein kurzer Satz oder mehrere zufällige Wörter sind ideal. Am besten in einem Passwortmanager speichern.'}><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={input} required /></Field>
      <Field label="Passwort wiederholen" hint={mismatch ? 'Die Passwörter sind nicht gleich.' : undefined}><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" className={input} required /></Field>
      <Field label="Einladungscode" hint="Den bekommst du von der Person, die den Server betreibt."><input value={invite} onChange={(e) => setInvite(e.target.value)} autoComplete="off" autoCapitalize="none" className={input} required /></Field>
      <label className="flex min-h-12 items-start gap-3">
        <input type="checkbox" className="mt-1 size-5" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
        <span>Ich habe verstanden: <strong>Niemand kann mein Passwort zurücksetzen.</strong> Ohne Passwort und Wiederherstellungscode sind meine Daten auf dem Server verloren.</span>
      </label>
      <Error text={error} />
      <Button type="submit" className="w-full" disabled={busy || !ready}>{busy ? 'Konto wird angelegt …' : 'Konto anlegen'}</Button>
    </form>
  )
}
