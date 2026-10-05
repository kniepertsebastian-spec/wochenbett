import { useState } from 'react'
import { BackLink, Button, Card, Modal, WarningBanner } from '../components'
import { describeSyncError } from '../sync/messages'
import { LoginForm, RecoverForm, RegisterFlow } from '../sync/SyncForms'
import { SyncInfo } from '../sync/SyncInfo'
import { useSync } from '../sync/SyncProvider'

type Mode = 'start' | 'register' | 'login' | 'recover'

const statusText = {
  off: '',
  syncing: 'Wird abgeglichen …',
  ok: 'Alles gesichert',
  offline: 'Offline. Es wird automatisch nachgeholt, sobald du wieder Internet hast.',
  conflict: 'Konflikt: bitte entscheide unten, welcher Stand gelten soll.',
  login_required: 'Bitte melde dich erneut an.',
  error: 'Der Abgleich hat nicht geklappt. Er wird automatisch wiederholt.',
} as const

export function SyncPage() {
  const { client, status, username, lastSyncAt, syncNow } = useSync()
  const [mode, setMode] = useState<Mode>('start')
  const [relogPw, setRelogPw] = useState('')
  const [delOpen, setDelOpen] = useState(false)
  const [delPw, setDelPw] = useState('')
  const [msg, setMsg] = useState('')

  const act = async (fn: () => Promise<unknown>) => {
    setMsg('')
    try {
      await fn()
    } catch (e) {
      setMsg(describeSyncError(e))
    }
  }

  // Beim Anlegen muss der Wiederherstellungscode angezeigt bleiben, auch wenn die Anmeldung schon gespeichert ist
  if (!username || mode === 'register') {
    return (
      <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
        <BackLink to="/more">← Mehr</BackLink>
        <h1 className="text-2xl font-semibold">Sync & Sicherung</h1>
        {mode === 'start' && (
          <>
            <SyncInfo />
            <div className="grid gap-2">
              <Button onClick={() => setMode('register')}>Konto anlegen</Button>
              <Button variant="secondary" onClick={() => setMode('login')}>Ich habe schon ein Konto</Button>
              <Button variant="ghost" onClick={() => setMode('recover')}>Passwort vergessen</Button>
            </div>
          </>
        )}
        {mode !== 'start' && (
          <>
            <Button variant="ghost" onClick={() => setMode('start')}>← Zurück</Button>
            <Card>
              {mode === 'register' && <RegisterFlow onDone={() => setMode('start')} />}
              {mode === 'login' && <LoginForm onDone={() => setMode('start')} />}
              {mode === 'recover' && <RecoverForm onDone={() => setMode('start')} />}
            </Card>
            {mode === 'register' && <WarningBanner level="red">Vergiss dein Passwort nicht. Niemand kann es zurücksetzen.</WarningBanner>}
          </>
        )}
      </main>
    )
  }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <BackLink to="/more">← Mehr</BackLink>
      <h1 className="text-2xl font-semibold">Sync & Sicherung</h1>
      <Card className="space-y-2">
        <p>Angemeldet als <strong>{username}</strong></p>
        <p role="status">{statusText[status]}</p>
        {lastSyncAt && <p className="text-sm text-stone-600 dark:text-stone-400">Letzter Abgleich: {new Date(lastSyncAt).toLocaleString('de-DE')}</p>}
        <Button variant="secondary" onClick={() => void syncNow()}>Jetzt abgleichen</Button>
      </Card>

      {status === 'conflict' && (
        <Card className="space-y-3 border-2 border-amber-600">
          <h2 className="font-semibold">Welcher Stand soll gelten?</h2>
          <p>Auf diesem Gerät und auf dem Server wurde seit dem letzten Abgleich etwas geändert. Die App überschreibt nichts, ohne dass du es entscheidest.</p>
          <Button variant="secondary" onClick={() => act(() => client.resolveConflict('server'))}>Stand vom Server übernehmen</Button>
          <p className="text-sm text-stone-600 dark:text-stone-400">Änderungen nur auf diesem Gerät gehen verloren.</p>
          <Button variant="secondary" onClick={() => act(() => client.resolveConflict('local'))}>Diesen Stand behalten</Button>
          <p className="text-sm text-stone-600 dark:text-stone-400">Der Stand auf dem Server wird ersetzt.</p>
        </Card>
      )}

      {status === 'login_required' && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Erneut anmelden</h2>
          <label className="block">
            <span className="mb-1 block">Passwort</span>
            <input type="password" value={relogPw} onChange={(e) => setRelogPw(e.target.value)} autoComplete="current-password" className="min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" />
          </label>
          <Button disabled={!relogPw} onClick={() => act(async () => { await client.relogin(relogPw); setRelogPw('') })}>Anmelden</Button>
        </Card>
      )}
      {msg && <p role="alert" className="font-medium text-red-800 dark:text-red-300">{msg}</p>}

      <SyncInfo />

      <Card className="space-y-2">
        <h2 className="font-semibold">Konto verwalten</h2>
        <Button variant="secondary" onClick={() => act(() => client.logout())}>Auf diesem Gerät abmelden</Button>
        <p className="text-sm text-stone-600 dark:text-stone-400">Die Daten bleiben auf diesem Gerät und auf dem Server.</p>
        <Button variant="ghost" onClick={() => setDelOpen(true)}>Konto und Server-Daten löschen</Button>
      </Card>

      <Modal open={delOpen} title="Konto löschen?" onClose={() => setDelOpen(false)}>
        <p className="mb-3">Alle Daten auf dem Server werden unwiderruflich gelöscht. Die Daten auf diesem Gerät bleiben erhalten. Gib zur Bestätigung dein Passwort ein.</p>
        <input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} aria-label="Passwort" autoComplete="current-password" className="mb-3 min-h-12 w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700" />
        <div className="grid gap-2">
          <Button disabled={!delPw} onClick={() => act(async () => { await client.deleteServerAccount(delPw); setDelOpen(false); setDelPw('') })}>Endgültig löschen</Button>
          <Button variant="ghost" onClick={() => setDelOpen(false)}>Abbrechen</Button>
        </div>
      </Modal>
    </main>
  )
}
