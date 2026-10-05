// Audio-Cues, Gong, Vibration, Wake Lock: API-Aufrufe per Spion und simulierter Zeit.
// (Hörbarkeit und echtes Display-Verhalten lassen sich nur auf einem echten Gerät prüfen.)
import { BASE, check, launch, onboard, startExercise } from './helpers.mjs'

const spies = () => {
  window.__spoken = []
  window.__vibrate = []
  window.__wake = { requested: 0, released: 0 }
  window.__gongs = 0
  const synth = {
    speak: (u) => window.__spoken.push(u.text),
    cancel: () => {},
  }
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
  window.SpeechSynthesisUtterance = function (t) { this.text = t }
  navigator.vibrate = (p) => { window.__vibrate.push(p); return true }
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request: async () => { window.__wake.requested++; return { release: async () => { window.__wake.released++ }, addEventListener() {} } } },
  })
  const RealAC = window.AudioContext
  window.AudioContext = class extends RealAC { createOscillator() { window.__gongs++; return super.createOscillator() } }
}

async function startRecovery(p, minutes = '2 Min') {
  await p.goto(BASE + '/library')
  await p.getByRole('button', { name: minutes, exact: true }).click()
  await p.getByRole('button', { name: 'Start', exact: true }).waitFor()
}

// 1) Normal: Ansagen, Gong, Vibration, Wake Lock
{
  const { browser, page: p, errors } = await launch()
  await p.addInitScript(spies)
  await p.clock.install(); await p.clock.resume()
  await onboard(p)
  await p.goto(BASE + '/more/settings')
  await p.getByLabel('Vibration').click()
  await p.waitForTimeout(300)
  await startRecovery(p)
  await p.clock.runFor(30_000)
  check('Bereit-Modus: keine Ansagen, kein Gong vor dem Start', (await p.evaluate(() => window.__spoken)).length === 0 && (await p.evaluate(() => window.__gongs)) === 0)
  await p.getByRole('button', { name: 'Start', exact: true }).click()
  await p.getByRole('button', { name: 'Pause' }).waitFor()
  await p.clock.runFor(1000)
  const w1 = await p.evaluate(() => window.__wake)
  check('Wake Lock beim Start angefordert', w1.requested >= 1, JSON.stringify(w1))
  const name = await p.getByRole('heading', { level: 1 }).textContent()
  await p.clock.runFor(60_000)
  const spoken = await p.evaluate(() => window.__spoken)
  check('Startansage zu Beginn der Übung', spoken.length > 0 && spoken[0].length > 0, spoken[0])
  check('Atem-Cues im Rhythmus oder Halbzeit', spoken.length >= 3, `${spoken.length} Ansagen in 60 s (${name})`)
  check('Gong zu Beginn', (await p.evaluate(() => window.__gongs)) >= 1)
  await p.getByRole('button', { name: 'Pause' }).click()
  await p.clock.runFor(1000)
  const before = (await p.evaluate(() => window.__spoken)).length
  await p.clock.runFor(30_000)
  check('Pause: keine weiteren Ansagen', (await p.evaluate(() => window.__spoken)).length === before)
  await p.getByRole('button', { name: 'Weiter' }).click()
  await p.clock.runFor(120_000)
  check('Vibration am Ende der Übung', (await p.evaluate(() => window.__vibrate)).length > 0)
  check('Keine Seitenfehler', errors.filter((e) => e.startsWith('PAGEERR')).length === 0, errors.join('; '))
  await browser.close()
}

// 2) Baby schläft: keine Sprachansagen, kein Gong
{
  const { browser, page: p } = await launch()
  await p.addInitScript(spies)
  await p.clock.install(); await p.clock.resume()
  await onboard(p)
  await p.goto(BASE + '/check-in?s=baby_sleeping')
  for (const t of ['5', 'keine', 'nein', 'gut']) await p.getByText(t, { exact: true }).first().click()
  await p.getByLabel('Nichts davon').check()
  await p.getByRole('button', { name: 'Weiter' }).click()
  await p.getByRole('button', { name: 'Starten' }).click()
  await startExercise(p)
  await p.clock.runFor(70_000)
  check('Baby schläft: keine Ansagen', (await p.evaluate(() => window.__spoken)).length === 0)
  check('Baby schläft: kein Gong', (await p.evaluate(() => window.__gongs)) === 0)
  await browser.close()
}

// 3) Screenless: Anleitung wird vorgelesen, Bildschirm schwarz
{
  const { browser, page: p } = await launch()
  await p.addInitScript(spies)
  await p.clock.install(); await p.clock.resume()
  await onboard(p)
  await startRecovery(p)
  await p.getByRole('button', { name: /Ohne Bildschirm/ }).click()
  await p.waitForTimeout(500)
  await p.clock.runFor(1500)
  const spoken = await p.evaluate(() => window.__spoken)
  check('Screenless: Anleitung wird vorgelesen', spoken.some((s) => s.length > 60), spoken.join(' | ').slice(0, 80))
  check('Screenless: Start-Knopf groß erreichbar', await p.getByRole('button', { name: 'Start', exact: true }).isVisible())
  await browser.close()
}

// 4) Fallback ohne Wake Lock
{
  const { browser, page: p } = await launch()
  await p.addInitScript(() => { Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true }); delete Navigator.prototype.wakeLock })
  await onboard(p)
  await startRecovery(p)
  check('Wake-Lock-Fallback: Hinweis sichtbar, App benutzbar', await p.getByText(/nicht wachhalten/).isVisible())
  await p.getByRole('button', { name: 'Start', exact: true }).click()
  await p.getByRole('button', { name: 'Pause' }).click()
  check('Wake-Lock-Fallback: Bedienung funktioniert', await p.getByRole('button', { name: 'Weiter' }).isVisible())
  await browser.close()
}
