import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-rose-700 text-white active:bg-rose-800 dark:bg-rose-600 dark:active:bg-rose-700',
  secondary:
    'bg-stone-200 text-stone-900 active:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:active:bg-stone-700',
  ghost: 'bg-transparent text-stone-900 active:bg-stone-200 dark:text-stone-100 dark:active:bg-stone-800',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`min-h-12 min-w-12 rounded-2xl px-5 py-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
