import type { ReactNode } from 'react'

export type WarningLevel = 'yellow' | 'red'

const styles: Record<WarningLevel, string> = {
  yellow: 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-50',
  red: 'border-red-700 bg-red-50 text-red-950 dark:bg-red-950 dark:text-red-50',
}
const labels: Record<WarningLevel, string> = { yellow: 'Hinweis', red: 'Wichtig' }

/** Farbe wird nie allein verwendet: Label + Icon transportieren die Stufe ebenfalls. */
export function WarningBanner({ level, children }: { level: WarningLevel; children: ReactNode }) {
  return (
    <div role={level === 'red' ? 'alert' : 'status'} className={`rounded-2xl border-2 p-4 ${styles[level]}`}>
      <p className="font-semibold">
        <span aria-hidden="true">{level === 'red' ? '⛔ ' : '⚠️ '}</span>
        {labels[level]}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
