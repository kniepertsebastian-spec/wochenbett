import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, WarningBanner } from '../components'
import { db } from '../db/db'
import { buildReport, type ReportSections } from '../engine/report'

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function ExportPage() {
  const [days, setDays] = useState<28 | 84 | 0>(28)
  const [sections, setSections] = useState<ReportSections>({ exercises: true, symptoms: true, measurements: true, trend: true })
  const [report, setReport] = useState<string | null>(null)

  async function create() {
    const to = iso(new Date())
    const from = days === 0 ? '1970-01-01' : iso(new Date(Date.now() - days * 86_400_000))
    const [workouts, symptoms, diastasis] = await Promise.all([db.workoutHistory.orderBy('date').toArray(), db.symptomLogs.orderBy('date').toArray(), db.diastasisLogs.orderBy('date').toArray()])
    setReport(buildReport({ from, to, workouts, symptoms, diastasis }, sections))
  }
  function download() {
    if (!report) return
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `verlauf-${iso(new Date())}.txt`; a.click(); URL.revokeObjectURL(url)
  }
  const labels: Record<keyof ReportSections, string> = { exercises: 'Übungen', symptoms: 'Beschwerden', measurements: 'Messwerte Bauchmitte', trend: 'Verlauf (Zusammenfassung)' }

  return (
    <main className="pt-safe mx-auto max-w-md space-y-4 p-4">
      <Link to="/more" className="underline print:hidden">← Mehr</Link>
      <h1 className="text-2xl font-semibold print:hidden">Verlauf teilen</h1>
      {!report ? (
        <>
          <p className="text-stone-600 dark:text-stone-400">Du entscheidest, was in den Bericht kommt. Er wird nur auf deinem Gerät erstellt, nichts wird hochgeladen.</p>
          <Card className="space-y-2">
            <fieldset>
              <legend className="mb-1 font-medium">Zeitraum</legend>
              {([[28, 'Letzte 4 Wochen'], [84, 'Letzte 12 Wochen'], [0, 'Alles']] as const).map(([v, l]) => (
                <label key={v} className="flex min-h-12 items-center gap-3"><input type="radio" name="p" className="size-5" checked={days === v} onChange={() => setDays(v)} />{l}</label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="mb-1 font-medium">Inhalt</legend>
              {(Object.keys(labels) as (keyof ReportSections)[]).map((k) => (
                <label key={k} className="flex min-h-12 items-center gap-3"><input type="checkbox" className="size-5" checked={sections[k]} onChange={(e) => setSections({ ...sections, [k]: e.target.checked })} />{labels[k]}</label>
              ))}
            </fieldset>
          </Card>
          <Button className="w-full" disabled={!Object.values(sections).some(Boolean)} onClick={create}>Bericht erstellen</Button>
        </>
      ) : (
        <>
          <WarningBanner level="yellow"><span className="print:hidden">Prüfe den Bericht, bevor du ihn weitergibst. </span>Eigene Angaben, keine Diagnose.</WarningBanner>
          <pre className="whitespace-pre-wrap rounded-2xl border border-stone-200 p-4 text-sm dark:border-stone-800">{report}</pre>
          <div className="grid gap-2 print:hidden">
            <Button onClick={download}>Als Textdatei speichern</Button>
            <Button variant="secondary" onClick={() => window.print()}>Drucken / als PDF speichern</Button>
            <Button variant="ghost" onClick={() => setReport(null)}>Auswahl ändern</Button>
          </div>
        </>
      )}
    </main>
  )
}
