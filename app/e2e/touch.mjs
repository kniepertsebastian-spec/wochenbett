// Touch-Flächen (>= 44 px) und Reduced Motion
import { BASE, check, launch, onboard } from './helpers.mjs'

const { browser, page: p } = await launch({ reducedMotion: 'reduce' })
await onboard(p)
const routes = ['/', '/check-in', '/library', '/pelvic-floor', '/progress', '/more', '/more/settings', '/more/recipes', '/more/tips', '/more/appointments', '/diastasis']
let small = []
for (const r of routes) {
  await p.goto(BASE + r)
  await p.waitForLoadState('networkidle')
  const found = await p.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('button, a[href], label, select, input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea')) {
      if (el.closest('.sr-only, .hidden')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      // Textlinks im Fließtext ("← Mehr") ausnehmen: nur Elemente mit Mindestgröße prüfen, die Bedienelemente sind
      if (rect.height < 44 || rect.width < 44) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`)
    }
    return out
  })
  small.push(...found.map((f) => `${r}: ${f}`))
}
check('Touch-Flächen >= 44 px', small.length === 0, small.slice(0, 8).join(' | '))
const dur = await p.evaluate(() => getComputedStyle(document.querySelector('button')).transitionDuration)
check('Reduced Motion verkürzt Übergänge', parseFloat(dur) <= 0.001, `transition-duration: ${dur}`)
await browser.close()
