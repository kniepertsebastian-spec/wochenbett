type Props = { value: number; max: number; label: string }

export function ProgressBar({ value, max, label }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 text-sm text-stone-600 dark:text-stone-400">
        {label}: {value} / {max}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
      >
        <div className="h-full bg-rose-700 dark:bg-rose-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
