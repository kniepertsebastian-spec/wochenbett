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
  await page.getByRole('heading', { name: 'Heute' }).waitFor()
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
