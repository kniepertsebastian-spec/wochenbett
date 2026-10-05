import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../components'

/** Kontrolliertes Update: neue Version wartet, bis die Nutzerin sie aktiviert (nie mitten in einer Übung). */
export function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ immediate: true })
  if (!needRefresh) return null
  return (
    <div role="status" className="pt-safe fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 bg-stone-900 p-3 text-stone-50 dark:bg-stone-100 dark:text-stone-900">
      <span>Neue Version verfügbar.</span>
      <Button variant="secondary" onClick={() => updateServiceWorker(true)}>Aktualisieren</Button>
    </div>
  )
}
