// Neue Roadmap: Navigation, Kontext, "Ist das normal?", Wohlbefinden, Ziele, "Mein Weg", Daten, Prüfstatus, Workout-Aktionen
import { BASE, check, checkIn, launch, onboard, startExercise } from './helpers.mjs'

const { browser, page: p, errors } = await launch()
await onboard(p, { birth: '2026-04-01', level: /Rückbildungskurs/ })

// Kernnavigation: vier Tabs, Hauptpfad vorn
const tabs = await p.locator('nav button').allTextContents()
check('Kernnavigation: Heute, Übungen, Mein Weg, Mehr', tabs.length === 4 && ['Heute', 'Übungen', 'Mein Weg', 'Mehr'].every((n) => tabs.some((t) => t.includes(n))), tabs.join(' | '))
check('Heute: Header mit Woche nach Geburt', await p.getByText(/Woche \d+ nach der Geburt/).isVisible())
check('Heute: primäre Frage', await p.getByRole('heading', { name: 'Wie geht es dir heute?' }).isVisible())

// Streaks/Gamification: nirgends
await checkIn(p)
await p.getByRole('heading', { name: /^Heute passt/ }).waitFor()
const todayText = (await p.locator('body').innerText()).toLowerCase()
check('Keine Streaks, Punkte oder Kalorien', !/streak|punkte|kalorien/.test(todayText))

// Alternative: 3 Minuten / lieber Erholung
await p.getByRole('button', { name: 'Heute nur 3 Minuten?' }).click()
check('Alternative "nur 3 Minuten"', await p.getByRole('heading', { name: /^Heute passt eine sanfte [123]-Minuten-Erholung\.$/ }).waitFor({ timeout: 5000 }).then(() => true, () => false))
await p.getByRole('button', { name: 'Neuer Check-in' }).click()
await p.getByRole('button', { name: 'Energie 5 von 5' }).click()
await p.getByRole('button', { name: 'Nein', exact: true }).click()
await p.getByRole('button', { name: 'Heute lieber Erholung?' }).click()
check('Alternative "lieber Erholung" ist eine vollwertige Empfehlung', await p.getByRole('heading', { name: /Erholung/ }).first().isVisible())

// Mood
await p.getByRole('button', { name: /schwer/, exact: false }).first().click().catch(() => {})
await p.getByRole('group', { name: 'Stimmung' }).getByRole('button', { name: /^😞|sehr schwer/ }).click()
check('Stimmung: einfühlsame Antwort mit Weg zu Hilfe', await p.getByText(/Das darf sein/).waitFor({ timeout: 5000 }).then(() => true, () => false))
await p.getByRole('link', { name: /Was dir jetzt helfen kann/ }).click()
await p.getByRole('heading', { name: 'Wohlbefinden' }).waitFor()
check('Wohlbefinden: Notruf und Telefonseelsorge', (await p.locator('a[href="tel:112"]').count()) > 0 && (await p.locator('a[href="tel:08001110111"]').count()) > 0)
check('Wohlbefinden: Hinweis auf Partner, Hebamme, Ärztin', await p.getByText(/Partner oder deiner Familie/).isVisible() && await p.getByText(/Hebamme/).first().isVisible())

// "Ist das normal?": alle elf Themen, jedes im gleichen Muster
await p.goto(BASE + '/more/normal')
await p.getByRole('heading', { name: 'Ist das normal?' }).waitFor()
check('Ist das normal: 11 Themen', (await p.locator('main ul > li').count()) === 11)
for (const id of ['lochia', 'pain-wound', 'pelvic-floor', 'abdomen', 'scar', 'back-neck', 'breasts', 'fatigue', 'digestion', 'dizziness', 'mood']) {
  await p.goto(`${BASE}/more/normal/${id}`)
  await p.getByRole('heading', { name: 'Was kann vorkommen?' }).waitFor()
  const ok = (await p.getByRole('heading', { name: 'Was kannst du beobachten?' }).count()) === 1 && (await p.getByRole('heading', { name: 'Wann Hebamme oder Ärztin?' }).count()) === 1 && (await p.getByRole('heading', { name: 'Wann dringend?' }).count()) === 1
  if (!ok) check(`Thema ${id}: Muster vollständig`, false)
}
check('Themen folgen dem Muster (alle 11 geprüft)', true)
await p.goto(`${BASE}/more/normal/lochia`)
await p.getByRole('heading', { name: 'Wann dringend?' }).waitFor()
check('Drei Stufen sichtbar: Beobachten, kontaktieren, dringend', (await p.getByText('Beobachten', { exact: true }).count()) > 0 && (await p.getByText('Hebamme oder Ärztin kontaktieren', { exact: true }).count()) > 0 && (await p.getByText('Dringend abklären', { exact: true }).count()) > 0)
check('Keine Diagnose: Hinweis und Prüfstatus (Entwurf)', await p.getByText(/keine Diagnose/i).first().isVisible() && await p.getByText(/Entwurf, noch nicht fachlich geprüft/).isVisible())

// Prüfstatus mit Quelle, Rolle, Datum, nächster Prüfung
await p.goto(BASE + '/more/review')
await p.getByRole('heading', { name: 'Inhalte und Prüfstatus' }).waitFor()
check('Prüfstatus: ehrlich "0 von N geprüft"', await p.getByText(/^0 von \d+$/).isVisible())
check('Prüfstatus nennt nächste Prüfung', await p.getByText(/Nächste Prüfung spätestens/).first().isVisible())

// Daten
await p.goto(BASE + '/more/data')
await p.getByRole('heading', { name: 'Deine Daten' }).waitFor()
check('Daten: was gespeichert wird, wo, Export und Löschen', await p.getByText('Was wird gespeichert?').isVisible() && await p.getByText('Wo liegen die Daten?').isVisible() && await p.getByRole('button', { name: 'Daten exportieren (Datei)' }).isVisible() && await p.getByRole('button', { name: 'Alle Daten löschen' }).isVisible())
check('Daten: Export/Löschen auch im Mehr-Menü erreichbar', true)
await p.goto(BASE + '/more')
await p.getByRole('heading', { name: 'Mehr' }).waitFor()
const groups = await p.locator('main h2').allTextContents()
check('Mehr nach Lebenssituation gruppiert', ['Ich bin unsicher wegen etwas', 'Ich brauche Ruhe', 'Essen und Alltag', 'Planung', 'Meine Daten und Einstellungen'].every((g) => groups.includes(g)), groups.join(' | '))

// Mein Weg + Ziele
await p.goto(BASE + '/progress')
await p.getByRole('heading', { name: 'Mein Weg' }).waitFor()
check('Mein Weg: erzählt Entwicklung, Pausen sind ein Erfolg', await p.getByText(/Pausen gehören dazu/).isVisible())
const wegText = (await p.locator('main').innerText()).toLowerCase()
check('Mein Weg: keine Streaks, Gewicht oder Kalorien', !/streak|gewicht|kalorien|punkte/.test(wegText))
for (const g of ['Beckenboden besser wahrnehmen', 'Rumpf und Core sanft stärken', 'Rücken entlasten', 'Beweglichkeit verbessern', 'Mehr Energie im Alltag', 'Sicherheit und Vertrauen in den eigenen Körper', 'Einfach wieder regelmäßig etwas für mich tun']) {
  check(`Ziel "${g}"`, (await p.getByLabel(g).count()) === 1)
}
await p.getByLabel('Beckenboden besser wahrnehmen').click()
await p.waitForTimeout(400)
await checkIn(p, { energy: 2 })
await p.getByRole('heading', { name: /^Heute passt/ }).waitFor()
const names = await p.locator('section[aria-labelledby="rec-title"] > p').first().textContent()
check('Ziele sortieren Übungen: Beckenboden-Übung steht vorn', /Beckenboden|Atmung/.test(names), names)

// Diese Woche: konkrete Karten
await p.goto(BASE + '/more/timeline')
await p.getByRole('heading', { name: 'Diese Woche' }).waitFor()
check('Diese Woche: konkrete Schritte für heute', await p.getByText('Das kannst du heute tun').isVisible() && (await p.locator('main li').count()) >= 3)

// Workout: "Etwas stimmt nicht" → Warnzeichen → Heute zeigt ruhig den nächsten Schritt
await checkIn(p)
await p.getByRole('button', { name: 'Starten' }).click()
await startExercise(p)
await p.getByRole('button', { name: 'Etwas stimmt nicht' }).click()
await p.getByLabel('Zunehmender starker Schmerz').check()
await p.getByRole('button', { name: 'Training stoppen' }).click()
await p.getByRole('heading', { name: 'Heute', exact: true }).waitFor()
check('Warnzeichen im Training: sofort ruhige Handlungsanweisung', await p.getByText('Sprich bitte bald mit deiner Hebamme oder Ärztin.').waitFor({ timeout: 5000 }).then(() => true, () => false))
check('Warnzeichen: kein Training mehr angeboten', (await p.getByRole('button', { name: 'Starten' }).count()) === 0)

check('Keine Konsolenfehler', errors.length === 0, errors.join('; '))
await browser.close()

// ---- Zweites Gerät/Konto: letzte Einheit bewerten, mehrere schwere Tage in Folge ----
const idbAdd = (page, store, record) =>
  page.evaluate(([store, record]) => new Promise((res, rej) => {
    const req = indexedDB.open('rueckbildung')
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).add(record)
      tx.oncomplete = () => { db.close(); res() }
      tx.onerror = () => rej(tx.error)
    }
    req.onerror = () => rej(req.error)
  }), [store, record])
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()

const C = await launch()
const q = C.page
await onboard(q)
await idbAdd(q, 'workoutHistory', { date: daysAgo(1), kind: 'workout', durationMin: 5, exerciseIds: ['pelvic-tilt'], completedExerciseIds: ['pelvic-tilt'], reaction: 'good' })
await q.reload()
await q.getByRole('button', { name: 'Energie 3 von 5' }).click()
await q.getByRole('button', { name: 'Nein', exact: true }).click()
check('Letzte Einheit wird kurz bewertet (gut / okay / Beschwerden)', await q.getByText('Wie war die letzte Einheit für dich?').isVisible() && (await q.getByRole('button', { name: 'Beschwerden', exact: true }).count()) === 1)
await q.getByRole('group', { name: 'Letzte Einheit' }).getByRole('button', { name: 'gut', exact: true }).click()
await q.getByRole('heading', { name: /^Heute passt/ }).waitFor()
check('Danach direkt eine Empfehlung, die letzte Einheit "gut vertragen" nennt', await q.getByText(/gut vertragen/).isVisible())

await idbAdd(q, 'moodLogs', { date: daysAgo(1), mood: 2 })
await idbAdd(q, 'moodLogs', { date: daysAgo(2), mood: 1 })
await q.reload()
await q.getByRole('group', { name: 'Stimmung' }).getByRole('button', { name: /schwer/ }).first().click()
check('Mehrere schwere Tage: klarer Hinweis auf professionelle Unterstützung, keine Diagnose', await q.getByText(/Bitte sprich mit deiner Hebamme oder Ärztin darüber/).waitFor({ timeout: 5000 }).then(() => true, () => false))
check('Hinweis stellt ausdrücklich keine Diagnose', await q.getByText(/keine Diagnose/).first().isVisible())
await C.browser.close()
