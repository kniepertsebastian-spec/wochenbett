import { useId } from 'react'

type Option<T extends string | number> = { value: T; label: string }

type Props<T extends string | number> = {
  legend: string
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
}

/** Einzelauswahl (z. B. Energie 1–5) als Radiogruppe mit großen Touch-Flächen. */
export function CheckIn<T extends string | number>({ legend, options, value, onChange }: Props<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={String(o.value)}
            className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl border border-stone-300 px-4 has-checked:border-rose-700 has-checked:bg-rose-700 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-rose-600 dark:border-stone-700"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
