// Sync im Browser: Konto anlegen auf Gerät A, Anmelden auf Gerät B, Hinweise, Fehlermeldungen.
// Benötigt laufenden Sync-Server hinter /api (Einladungscode siehe INVITE_CODE, Standard: test-einladung).
import { BASE, check, launch, onboard, openHabits } from './helpers.mjs'

const INVITE = process.env.INVITE_CODE ?? 'test-einladung'
const NAME = `anna${Date.now() % 100000}`
const PW = 'Hase Mond Kaffee Berg'

// ---- Gerät A ----
const A = await launch()
await onboard(A.page, { birth: '2026-08-01' })
const p = A.page
await p.goto(BASE + '/more/sync')
check('Hinweis: Passwort nicht vergessen', await p.getByText('Bitte vergiss dein Passwort nicht!').waitFor({ timeout: 10000 }).then(() => true, () => false))
check('Hinweis: Server kann Daten nicht lesen', await p.getByText(/Niemand kann sie lesen/).isVisible())
await p.getByRole('button', { name: 'Konto anlegen' }).click()
await p.getByLabel('Name', { exact: true }).fill(NAME)
await p.getByLabel('Passwort', { exact: true }).fill(PW)
await p.getByLabel('Passwort wiederholen', { exact: true }).fill(PW)
await p.getByLabel('Einladungscode', { exact: true }).fill('falscher-code')
await p.getByLabel(/Ich habe verstanden/).check()
await p.getByRole('button', { name: 'Konto anlegen' }).click()
check('Falscher Einladungscode: verständliche Meldung', await p.getByText('Der Einladungscode stimmt nicht.').waitFor({ timeout: 15000 }).then(() => true, () => false))
await p.getByLabel('Einladungscode', { exact: true }).fill(INVITE)
await p.getByRole('button', { name: 'Konto anlegen' }).click()
await p.getByRole('heading', { name: 'Dein Wiederherstellungscode' }).waitFor({ timeout: 15000 })
const code = (await p.locator('p.font-mono').textContent()).trim()
check('Wiederherstellungscode wird angezeigt', /^([A-Z2-7]{4}-){6}[A-Z2-7]{2}$/.test(code), code)
check('Warnung: Code nur jetzt sichtbar', await p.getByText(/nur jetzt angezeigt/).isVisible())
check('Fertig erst nach Bestätigung', await p.getByRole('button', { name: 'Fertig' }).isDisabled())
await p.getByLabel(/Ich habe den Code und mein Passwort sicher aufbewahrt/).check()
await p.getByRole('button', { name: 'Fertig' }).click()
check('Angemeldet und gesichert', await p.getByText('Alles gesichert').waitFor({ timeout: 15000 }).then(() => true, () => false))

// ---- Gerät B (neu, leer) ----
const B = await launch()
const q = B.page
await q.goto(BASE)
await q.getByRole('button', { name: 'Ich habe schon ein Sync-Konto' }).click()
await q.getByLabel('Name', { exact: true }).fill(NAME)
await q.getByLabel('Passwort', { exact: true }).fill('falsches passwort xyz')
await q.getByRole('button', { name: 'Anmelden' }).click()
check('Falsches Passwort: verständliche Meldung', await q.getByText(/Name und Passwort passen nicht zusammen/).waitFor({ timeout: 15000 }).then(() => true, () => false))
await q.getByLabel('Passwort', { exact: true }).fill(PW)
await q.getByRole('button', { name: 'Anmelden' }).click()
await q.getByRole('heading', { name: 'Heute', exact: true }).waitFor({ timeout: 20000 })
check('Gerät B hat die Daten von Gerät A (Profil, kein Onboarding)', await q.getByText(/Woche \d+ nach der Geburt/).isVisible())

// Änderung auf B (Micro-Habit) kommt auf A an
await openHabits(q)
await q.getByLabel('Über die Seite aufstehen').click()
await q.waitForTimeout(6000) // Verzögerung bis zum automatischen Abgleich
await p.goto(BASE + '/more/sync')
await p.getByRole('button', { name: 'Jetzt abgleichen' }).click()
await p.waitForTimeout(1500)
await p.goto(BASE)
await p.getByRole('heading', { name: 'Heute', exact: true }).waitFor()
await openHabits(p)
check('Änderung von B kam auf A an', await p.getByLabel('Über die Seite aufstehen').waitFor({ timeout: 5000 }).then(async () => p.getByLabel('Über die Seite aufstehen').isChecked(), () => false))

// Lokal löschen meldet ab, Server-Daten bleiben
await q.goto(BASE + '/more/data')
await q.getByRole('button', { name: 'Alle Daten löschen' }).click()
check('Löschen-Dialog erklärt Sync-Abmeldung', await q.getByText(/vom Sync abgemeldet/).isVisible())
await q.getByRole('button', { name: 'Endgültig löschen' }).click()
await q.getByRole('heading', { name: 'Willkommen' }).waitFor()
await q.getByRole('button', { name: 'Ich habe schon ein Sync-Konto' }).click()
await q.getByLabel('Name', { exact: true }).fill(NAME)
await q.getByLabel('Passwort', { exact: true }).fill(PW)
await q.getByRole('button', { name: 'Anmelden' }).click()
// Die Seite bleibt auf der Einstellungsseite, das Profil ist wieder da
check('Nach lokalem Löschen: erneutes Anmelden holt die Daten zurück', await q.getByRole('heading', { name: 'Deine Daten' }).waitFor({ timeout: 20000 }).then(async () => (await q.goto(BASE + '/more/settings'), q.getByRole('heading', { name: 'Profil' }).waitFor({ timeout: 20000 }))).then(() => true, () => false))

for (const d of [A, B]) {
  const errs = d.errors.filter((e) => !/401|Failed to load resource/.test(e))
  check('Keine Seitenfehler', errs.length === 0, errs.join('; '))
  await d.browser.close()
}
