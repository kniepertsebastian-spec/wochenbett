import AxeBuilder from '@axe-core/playwright'
import { BASE, check, checkIn, launch, onboard } from './helpers.mjs'

const routes = ['/', '/library', '/library/belly-breathing', '/pelvic-floor', '/diastasis', '/progress', '/more', '/more/settings', '/more/recipes', '/more/recipes/linsensuppe', '/more/nutrition', '/more/tips', '/more/timeline', '/more/appointments', '/more/export', '/more/sync', '/more/normal', '/more/normal/lochia', '/more/normal/mood', '/more/wellbeing', '/more/data', '/more/review']

for (const scheme of ['light', 'dark']) {
  const { browser, page } = await launch({ colorScheme: scheme })
  await onboard(page)
  // Heute in allen Zuständen: Check-in, Empfehlung, Warnzeichen
  for (const [label, opts] of [['Empfehlung', {}], ['Warnzeichen', { unusual: true, flags: ['Atemnot oder Brustschmerzen'] }]]) {
    await checkIn(page, opts)
    await page.getByRole('heading', { name: /^Heute passt|Notruf 112|Heute lieber kein Training|Bitte ruf jetzt/ }).first().waitFor()
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    check(`a11y ${scheme} Heute ${label}`, res.violations.length === 0, res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target}`).join('; '))
  }
  await page.getByRole('button', { name: /neuer Check-in/ }).click()
  await page.getByRole('heading', { name: 'Wie geht es dir heute?' }).waitFor()
  const resC = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  check(`a11y ${scheme} Heute Mini-Check-in`, resC.violations.length === 0, resC.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target}`).join('; '))
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
