import AxeBuilder from '@axe-core/playwright'
import { BASE, check, launch, onboard } from './helpers.mjs'

const routes = ['/', '/check-in', '/library', '/library/belly-breathing', '/pelvic-floor', '/diastasis', '/progress', '/more', '/more/settings', '/more/recipes', '/more/recipes/linsensuppe', '/more/nutrition', '/more/tips', '/more/timeline', '/more/appointments', '/more/export', '/more/sync']

for (const scheme of ['light', 'dark']) {
  const { browser, page } = await launch({ colorScheme: scheme })
  await onboard(page)
  for (const r of routes) {
    await page.goto(BASE + r)
    await page.waitForLoadState('networkidle')
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    check(`a11y ${scheme} ${r}`, res.violations.length === 0, res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target}`).join('; '))
  }
  // Sync-Formulare (Anlegen, Anmelden, Wiederherstellen)
  for (const [btn, label] of [['Konto anlegen', 'Konto anlegen'], ['Ich habe schon ein Konto', 'Anmelden'], ['Passwort vergessen', 'Wiederherstellen']]) {
    await page.goto(BASE + '/more/sync')
    await page.getByRole('button', { name: btn }).click()
    await page.getByLabel('Name', { exact: true }).waitFor()
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    check(`a11y ${scheme} Sync ${label}`, res.violations.length === 0, res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target}`).join('; '))
  }
  await browser.close()
}
