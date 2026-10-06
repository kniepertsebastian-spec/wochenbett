import { chromium } from 'playwright-core'

export const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
export const chromePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'

export async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: chromePath, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, ...opts })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return { browser, context, page, errors }
}

export async function onboard(page, { birth = '2026-07-01', type = 'Spontangeburt', level = /Noch nichts/ } = {}) {
  await page.goto(BASE)
  await page.getByLabel('Geburtsdatum deines Babys').fill(birth)
  await page.getByLabel(type).check()
  await page.getByLabel(level).check()
  await page.getByLabel(/Ich habe verstanden/).check()
  await page.getByRole('button', { name: "Los geht's" }).click()
  await page.getByRole('heading', { name: 'Heute', exact: true }).waitFor()
}

export function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' – ' + extra : ''}`)
  if (!cond) process.exitCode = 1
}

/** Startet die aktuelle Übung im Player (jede Übung beginnt im Bereit-Modus). */
export async function startExercise(page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Pause' }).waitFor()
}

/**
 * Mini-Check-in auf "Heute". Standard: Energie 5, nichts auffällig.
 * `unusual: true` öffnet die Vertiefung (Schmerzen, Druckgefühl, Warnzeichen).
 */
export async function checkIn(page, { energy = 5, unusual = false, pain, flags = [], last } = {}) {
  await page.goto(BASE)
  // Gab es heute schon einen Check-in, zeigt "Heute" die Empfehlung: dann einen neuen starten
  const heading = page.getByRole('heading', { name: 'Wie geht es dir heute?' })
  const redo = page.getByRole('button', { name: /^(Neuer|Es geht mir besser: neuer) Check-in$/ })
  await heading.or(redo).first().waitFor()
  if (await redo.isVisible()) await redo.click()
  await heading.waitFor()
  await page.getByRole('button', { name: `Energie ${energy} von 5` }).click()
  if (!unusual) {
    await page.getByRole('button', { name: 'Nein', exact: true }).click()
  } else {
    await page.getByRole('button', { name: 'Ja', exact: true }).click()
    if (pain) await page.getByText(pain, { exact: true }).click()
    for (const f of flags) await page.getByLabel(f).check()
    await page.getByRole('button', { name: 'Weiter' }).click()
  }
  if (last) await page.getByRole('group', { name: 'Letzte Einheit' }).getByRole('button', { name: last, exact: true }).click().catch(() => {})
}

/** Öffnet "Kleine Alltagshelfer" auf Heute (eingeklappt). */
export async function openHabits(page) {
  const d = page.locator('details', { hasText: 'Kleine Alltagshelfer' })
  if (!(await d.evaluate((el) => el.open))) await d.locator('summary').click()
}
