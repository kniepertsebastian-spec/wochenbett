export type NavItem = { id: string; label: string; icon: string }

type Props = {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

/** Kernnavigation unten (One-Thumb-UX); Label immer sichtbar, nicht nur Icon. */
export function BottomNavigation({ items, activeId, onSelect }: Props) {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="pb-safe pl-safe pr-safe fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs ${
                  active
                    ? 'font-semibold text-rose-700 underline underline-offset-4 dark:text-rose-400'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
