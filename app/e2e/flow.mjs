// Kernablauf: Onboarding → Red Flag → Plan → Player → Speichern → Löschen
import { BASE, check, launch, onboard } from './helpers.mjs'

const { browser, page: p, errors } = await launch()
await onboard(p)

const fillCheckIn = async () => {
  await p.getByText('5', { exact: true }).first().click()
  await p.getByText('keine', { exact: true }).click()
  await p.getByText('nein', { exact: true }).click()
  await p.getByText('gut', { exact: true }).click()
}

await p.getByRole('link', { name: 'Check-in starten' }).click()
await fillCheckIn()
await p.getByLabel('Fieber').check()
await p.getByRole('button', { name: 'Weiter' }).click()
await p.getByRole('heading', { name: 'Heute kein Training' }).waitFor()
check('Red Flag stoppt das Training', true)
await p.getByRole('link', { name: 'Zurück' }).click()

await p.getByRole('link', { name: 'Check-in starten' }).click()
await fillCheckIn()
await p.getByLabel('Nichts davon').check()
await p.getByRole('button', { name: 'Weiter' }).click()
await p.getByRole('heading', { name: /Recovery|Deine Einheit/ }).waitFor()
check('Plan wird angezeigt', true)
check('Keine Gesundheitsdaten in der URL', new URL(p.url()).search === '' && new URL(p.url()).pathname === '/plan')
await p.getByRole('button', { name: 'Starten' }).click()
await p.getByRole('button', { name: 'Pause' }).waitFor()
await p.getByRole('button', { name: 'Pause' }).click()
check('Pause', await p.getByRole('button', { name: 'Weiter' }).isVisible())
await p.getByRole('button', { name: 'Übung wechseln / Beschwerden' }).click()
await p.getByRole('button', { name: 'Leichtere Variante / andere Übung' }).click()
await p.getByRole('button', { name: 'Zurück', exact: true }).click().catch(() => {})
for (let i = 0; i < 12; i++) {
  if (await p.getByRole('heading', { name: 'Geschafft' }).isVisible()) break
  await p.getByRole('button', { name: 'Überspringen' }).click()
  await p.waitForTimeout(100)
}
await p.getByText('okay', { exact: true }).click()
await p.getByRole('button', { name: 'Speichern' }).click()
await p.getByRole('heading', { name: 'Heute' }).waitFor()
check('Einheit gespeichert', await p.getByText(/1 Einheit abgeschlossen/).waitFor({ timeout: 5000 }).then(() => true, () => false))

await p.getByRole('button', { name: /Mehr/ }).click()
await p.getByRole('link', { name: /Einstellungen/ }).click()
await p.getByRole('button', { name: 'Alle Daten löschen' }).click()
await p.getByRole('button', { name: 'Endgültig löschen' }).click()
await p.getByRole('heading', { name: 'Willkommen' }).waitFor()
check('Löschen setzt App zurück', true)
check('Keine Konsolenfehler', errors.length === 0, errors.join('; '))
await browser.close()
