// Baby-Modus, Micro-Habits, Diastasis/Doming, Rezepte, Ernährung, Termine, Export
import { BASE, check, launch, onboard } from './helpers.mjs'

const { browser, page: p, errors } = await launch()
await onboard(p, { birth: '2026-08-20', type: 'Kaiserschnitt' })

await p.getByLabel('Über die Seite aufstehen').click()
await p.waitForTimeout(300)
await p.reload()
check('Micro-Habit bleibt gespeichert', await p.getByLabel('Über die Seite aufstehen').isChecked())

await p.getByRole('link', { name: /Baby auf dem Arm/ }).click()
for (const t of ['5', 'keine', 'nein', 'gut']) await p.getByText(t, { exact: true }).first().click()
await p.getByLabel('Nichts davon').check()
await p.getByRole('button', { name: 'Weiter' }).click()
await p.getByRole('heading', { name: /Recovery/ }).waitFor()
check('Baby auf dem Arm: nur Einhand-Übungen', (await p.getByText('Einhand-geeignet').count()) === (await p.locator('main h3').count()))

await p.goto(BASE + '/diastasis')
await p.locator('label', { hasText: /^2$/ }).first().click()
await p.locator('fieldset', { hasText: 'Wölbung' }).getByText('ja', { exact: true }).click()
await p.getByRole('button', { name: 'Eintragen' }).click()
await p.getByText(/Doming wurde beobachtet/).waitFor()
check('Doming-Hinweis', true)

await p.goto(BASE + '/more/recipes')
await p.locator('main a[href^="/more/recipes/"]').first().click()
await p.getByRole('button', { name: /Merken/ }).click()
await p.waitForTimeout(300)
check('Rezept merken', await p.getByRole('button', { name: /Gemerkt/ }).isVisible())

await p.goto(BASE + '/more/nutrition')
await p.getByLabel('Suche').fill('lin')
check('Ernährungs-Suche', /\d+ Lebensmittel/.test(await p.locator('p[role=status]').textContent()))

await p.goto(BASE + '/more/appointments')
await p.getByLabel('Datum').fill('2099-01-15')
await p.getByRole('button', { name: 'Hinzufügen' }).click()
await p.getByText(/· Hebamme/).first().waitFor()
check('Termin anlegen', true)

await p.goto(BASE + '/more/export')
await p.getByRole('button', { name: 'Bericht erstellen' }).click()
check('Bericht enthält Hinweis keine Diagnose', (await p.locator('pre').textContent()).includes('keine Diagnose'))
check('Keine Konsolenfehler', errors.length === 0, errors.join('; '))
await browser.close()
