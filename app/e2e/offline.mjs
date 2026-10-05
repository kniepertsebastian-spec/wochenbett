// Offline-Test: Flugmodus, Reload, "App schließen", Workout, Speichern
import { BASE, check, launch, onboard, startExercise } from './helpers.mjs'

const { browser, context, page, errors } = await launch()
let p = page
await p.goto(BASE)
await p.evaluate(() => navigator.serviceWorker.ready)
await p.reload()
await p.waitForTimeout(800)
await onboard(p)
await context.setOffline(true)
await p.reload()
await p.getByRole('heading', { name: 'Heute' }).waitFor()
check('Offline-Reload', true)
await p.close()
p = await context.newPage()
await p.goto(BASE + '/library')
await p.getByRole('heading', { name: 'Übungen', exact: true }).waitFor()
check('Offline neu öffnen (Deep-Link)', true)
await p.getByRole('button', { name: '2 Min', exact: true }).click()
await startExercise(p)
check('Offline Workout starten', true)
for (let i = 0; i < 12; i++) {
  if (await p.getByRole('heading', { name: 'Geschafft' }).isVisible()) break
  await p.getByRole('button', { name: 'Überspringen' }).click()
  await p.waitForTimeout(100)
}
await p.getByText('gut', { exact: true }).click()
await p.getByRole('button', { name: 'Speichern' }).click()
await p.getByRole('heading', { name: 'Heute' }).waitFor()
await p.reload()
const persisted = await p.getByText(/1 Einheit abgeschlossen/).waitFor({ timeout: 5000 }).then(() => true, () => false)
check('Offline gespeichert und persistent', persisted)
await p.goto(BASE + '/more/recipes')
await p.getByRole('heading', { name: 'Rezepte', exact: true }).waitFor()
await p.locator('main a[href^="/more/recipes/"]').first().click()
check('Rezepte offline verfügbar', await p.getByRole('heading', { name: 'Zutaten' }).waitFor({ timeout: 5000 }).then(() => true, () => false))
check('Keine Seitenfehler', errors.filter((e) => e.startsWith('PAGEERR')).length === 0)
await browser.close()
