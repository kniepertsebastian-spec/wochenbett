// Kernablauf: Onboarding → Mini-Check-in → Warnzeichen → Empfehlung → Player → Speichern → Löschen
import { BASE, check, checkIn, launch, onboard, startExercise } from './helpers.mjs'

const { browser, page: p, errors } = await launch()
await onboard(p)

// Warnzeichen: eindeutiger nächster Schritt, kein Training
await checkIn(p, { unusual: true, flags: ['Fieber'] })
await p.getByText('Bitte lass das heute noch ärztlich abklären.').waitFor()
check('Warnzeichen: klarer nächster Schritt', true)
check('Warnzeichen: Bereitschaftsdienst 116117 als Anruf-Link', (await p.locator('a[href="tel:116117"]').count()) > 0)
check('Warnzeichen: kein Start-Knopf für Training', (await p.getByRole('button', { name: 'Starten' }).count()) === 0)
await p.getByRole('button', { name: /neuer Check-in/ }).click()

// Normaler Check-in: wenige Fingertipps, direkt eine Empfehlung
const t0 = Date.now()
let taps = 0
await p.getByRole('button', { name: 'Energie 5 von 5' }).click(); taps++
await p.getByRole('button', { name: 'Nein', exact: true }).click(); taps++
await p.getByRole('heading', { name: /^Heute passt/ }).waitFor()
const secs = (Date.now() - t0) / 1000
check('Check-in: höchstens 3 Fingertipps bis zur Empfehlung', taps <= 3, `${taps} Taps`)
check('Check-in: schnell (skriptgesteuert unter 5 s, Mensch ca. 10–15 s)', secs < 5, `${secs.toFixed(1)} s`)
check('Genau eine Hauptempfehlung mit Starten-Knopf', (await p.getByRole('button', { name: 'Starten' }).count()) === 1)
check('Höchstens zwei Gründe', (await p.locator('section[aria-labelledby="rec-title"] > ul > li').count()) <= 2)
check('Höchstens zwei Alternativen', (await p.getByRole('button', { name: /Heute (nur 3 Minuten|lieber Erholung)\?/ }).count()) <= 2)
check('"Warum?" aufklappbar', await p.getByText('Warum?', { exact: true }).isVisible())
check('Keine Gesundheitsdaten in der URL', new URL(p.url()).search === '' && new URL(p.url()).pathname === '/')

await p.getByRole('button', { name: 'Starten' }).click()
await p.getByRole('button', { name: 'Start', exact: true }).waitFor()
check('Vor der Übung: Worauf achten', await p.getByText('Worauf du achten sollst').isVisible())
check('Warum-Erklärung vorhanden', await p.getByText('Warum diese Übung?').isVisible())
await p.waitForTimeout(2500)
check('Timer startet erst nach Start (pausiert im Bereit-Modus)', await p.getByText('Der Timer läuft erst, wenn du auf Start tippst.').isVisible())
await startExercise(p)
await p.getByRole('button', { name: 'Überspringen' }).click()
await p.getByRole('button', { name: 'Start', exact: true }).waitFor()
await p.waitForTimeout(11500)
check('Zweite Übung startet nicht von selbst (manuell per Start)', await p.getByRole('button', { name: 'Start', exact: true }).isVisible())
await startExercise(p)
await p.getByRole('button', { name: 'Pause' }).click()
check('Pause', await p.getByRole('button', { name: 'Weiter' }).isVisible())
for (const name of ['Leichtere Variante', 'Etwas stimmt nicht', 'Training beenden', 'Überspringen', 'Zurück']) {
  check(`Eigene Aktion: ${name}`, (await p.getByRole('button', { name, exact: true }).count()) === 1)
}
check('"Übung wechseln" und "Beschwerden" sind nicht kombiniert', (await p.getByRole('button', { name: /wechseln \/ Beschwerden/ }).count()) === 0)

// Training beenden → "Heute reicht das"
await p.getByRole('button', { name: 'Training beenden' }).click()
await p.getByText(/Du hast (heute schon etwas geschafft|noch keine Übung)/).waitFor()
await p.getByRole('button', { name: 'Zurück zur Übung' }).click()
for (let i = 0; i < 12; i++) {
  if (await p.getByRole('heading', { name: /Heute reicht das/ }).isVisible()) break
  await p.getByRole('button', { name: 'Überspringen' }).click()
  await p.waitForTimeout(100)
}
check('Abschluss: "Heute reicht das"', await p.getByRole('heading', { name: /Heute reicht das/ }).isVisible())
check('Abschluss: "Wie fühlt sich dein Körper jetzt an?"', await p.getByText('Wie fühlt sich dein Körper jetzt an?').isVisible())
await p.getByText('okay', { exact: true }).click()
await p.getByRole('button', { name: 'Speichern' }).click()
await p.getByRole('heading', { name: 'Heute', exact: true }).waitFor()
check('Speichern + kleiner Fortschritt auf Heute', await p.getByText(/Gespeichert\. Das war deine 1\. Einheit/).waitFor({ timeout: 5000 }).then(() => true, () => false))

await p.goto(BASE + '/more/data')
await p.getByRole('button', { name: 'Alle Daten löschen' }).click()
await p.getByRole('button', { name: 'Endgültig löschen' }).click()
await p.getByRole('heading', { name: 'Willkommen' }).waitFor()
check('Löschen setzt App zurück', true)
check('Keine Konsolenfehler', errors.length === 0, errors.join('; '))
await browser.close()
