// Bett-Übungen, Übersicht aller Übungen, Hilfsmittel, Begründung, Startphase, Kalender, Einheit löschen, Auswahlliste im Dunkelmodus
import { BASE, check, launch, onboard } from './helpers.mjs'

const { browser, page: p, errors } = await launch({ colorScheme: 'dark' })
await onboard(p, { birth: '2026-04-01', level: /Rückbildungskurs/ })
await p.goto(BASE + '/progress')
check('Startphase aus Aktivität (Kurs, >6 Wochen) = Phase 3', await p.getByRole('heading', { name: /Phase 3/ }).waitFor({ timeout: 5000 }).then(() => true, () => false))

// Übersicht aller Übungen mit Gründen
await p.goto(BASE + '/library')
await p.getByRole('tab', { name: 'Alle Übungen' }).click()
const all = await p.locator('main h3').count()
check('Alle Übungen: mehr als 25', all > 25, String(all))
check('Nicht verfügbare mit Grund (Hilfsmittel/Phase)', (await p.getByText(/Aktuell nicht verfügbar: (Benötigt|Ab Phase)/).count()) > 0)

// Hilfsmittel angeben -> Ball-Übung wird verfügbar
await p.goto(BASE + '/more/settings')
await p.getByLabel('Gymnastikball').click()
await p.waitForTimeout(400)
await p.goto(BASE + '/library')
check('Mit Gymnastikball erscheint Ball-Übung unter "Für dich"', await p.getByText('Wand-Kniebeuge mit Ball').waitFor({ timeout: 5000 }).then(() => true, () => false))

// Bett-Übungen
await p.getByRole('button', { name: '2 Min im Bett' }).click()
await p.getByRole('button', { name: 'Start', exact: true }).waitFor()
check('Bett-Set startet im Bereit-Modus', await p.getByText('Warum diese Übung?').isVisible())

// Begründung im Plan
await p.goto(BASE + '/check-in')
for (const t of ['5', 'keine', 'nein', 'gut']) await p.getByText(t, { exact: true }).first().click()
await p.getByLabel('Nichts davon').check()
await p.getByRole('button', { name: 'Weiter' }).click()
await p.getByText('Warum dieser Vorschlag?').click()
check('Begründung nennt Energie', await p.getByText(/Energie 5 von 5/).isVisible())

// Kalender
await p.goto(BASE + '/more/appointments')
await p.getByRole('button', { name: /Nächster Monat/ }).click()
const dayBtn = p.getByRole('button', { name: /^15\. / })
await dayBtn.click()
await p.getByRole('button', { name: 'Hinzufügen' }).click()
await p.getByText(/Hebamme · /).first().waitFor()
check('Termin im Kalender markiert', (await p.getByRole('button', { name: /^15\. .*1 Termin/ }).count()) === 1)

// Auswahlliste lesbar (Dunkelmodus): Computed Styles der Option
await p.goto(BASE + '/more/nutrition')
await p.locator('select').waitFor()
const colors = await p.evaluate(() => { const o = document.querySelector('select option'); const cs = getComputedStyle(o); return [cs.backgroundColor, cs.color] })
// Chromium liefert oklch(L C H) oder rgb(r g b): auf Helligkeit 0..1 normieren
const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return c.startsWith('oklch') ? m[0] : (m[0] + m[1] + m[2]) / 3 / 255 }
check('Auswahlliste im Dunkelmodus: heller Text auf dunklem Grund', lum(colors[1]) > 0.7 && lum(colors[0]) < 0.4, colors.join(' / '))

// Einheit löschen
await p.goto(BASE + '/library')
await p.getByRole('button', { name: '2 Min', exact: true }).click()
await p.getByRole('button', { name: 'Start', exact: true }).waitFor()
for (let i = 0; i < 12; i++) {
  if (await p.getByRole('heading', { name: 'Geschafft' }).isVisible()) break
  await p.getByRole('button', { name: 'Überspringen' }).click()
  await p.waitForTimeout(100)
}
await p.getByText('gut', { exact: true }).click()
await p.getByRole('button', { name: 'Speichern' }).click()
await p.getByRole('heading', { name: 'Heute' }).waitFor()
await p.goto(BASE + '/progress')
await p.getByRole('button', { name: /Einheit vom .* löschen/ }).first().click()
await p.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click()
check('Einheit gelöscht', await p.getByText('Noch keine Einheiten.').waitFor({ timeout: 5000 }).then(() => true, () => false))

check('Keine Konsolenfehler', errors.length === 0, errors.join('; '))
await browser.close()
