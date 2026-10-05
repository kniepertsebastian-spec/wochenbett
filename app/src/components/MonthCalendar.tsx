import { Button } from './Button'

export type DayMarker = { appointments: number; sessions: number }

type Props = {
  /** Beliebiger Tag im anzuzeigenden Monat */
  month: Date
  markers: Record<string, DayMarker>
  selected: string | null
  onSelect: (iso: string) => void
  onMonthChange: (d: Date) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
export const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Monatsansicht. Jeder Tag ist ein Button; Termine und Einheiten stehen auch im Text (nicht nur als Punkt). */
export function MonthCalendar({ month, markers, selected, onSelect, onMonthChange }: Props) {
  const y = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(y, m, 1)
  const offset = (first.getDay() + 6) % 7 // Montag = 0
  const days = new Date(y, m + 1, 0).getDate()
  const today = new Date()
  const todayIso = isoOf(today.getFullYear(), today.getMonth(), today.getDate())
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const title = first.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" aria-label="Vorheriger Monat" onClick={() => onMonthChange(new Date(y, m - 1, 1))}>‹</Button>
        <h2 className="font-semibold" aria-live="polite">{title}</h2>
        <Button variant="ghost" aria-label="Nächster Monat" onClick={() => onMonthChange(new Date(y, m + 1, 1))}>›</Button>
      </div>
      <table className="w-full table-fixed text-center">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>{weekdays.map((d) => <th key={d} scope="col" className="pb-1 text-sm font-medium text-stone-600 dark:text-stone-400">{d}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                if (d === null) return <td key={i} />
                const iso = isoOf(y, m, d)
                const mk = markers[iso]
                const label = `${d}. ${title}${mk?.appointments ? `, ${mk.appointments} Termin${mk.appointments > 1 ? 'e' : ''}` : ''}${mk?.sessions ? `, ${mk.sessions} Einheit${mk.sessions > 1 ? 'en' : ''}` : ''}`
                const isSel = selected === iso
                return (
                  <td key={i} className="p-px">
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={isSel}
                      aria-current={iso === todayIso ? 'date' : undefined}
                      onClick={() => onSelect(iso)}
                      className={`flex min-h-12 w-full flex-col items-center justify-center rounded-xl text-sm ${isSel ? 'bg-rose-700 text-white dark:bg-rose-600' : 'bg-stone-100 dark:bg-stone-800'} ${iso === todayIso ? 'font-bold underline' : ''}`}
                    >
                      <span aria-hidden="true">{d}</span>
                      <span aria-hidden="true" className="h-3 text-[10px] leading-3">
                        {mk?.appointments ? '●' : ''}{mk?.sessions ? '✓' : ''}
                      </span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">● Termin, ✓ Einheit</p>
    </div>
  )
}
