import { useEffect, useState } from 'react'

/** Hält das Display wach, solange `active`. Fallback: unterstützt = false, App bleibt benutzbar. */
export function useWakeLock(active: boolean) {
  const supported = typeof navigator !== 'undefined' && !!navigator.wakeLock
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (!active || !supported) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) return void lock.release()
        setHeld(true)
        lock.addEventListener('release', () => setHeld(false))
      } catch {
        setHeld(false)
      }
    }
    void acquire()
    // Beim Zurückkehren in den Tab muss die Sperre neu angefordert werden
    const onVisible = () => document.visibilityState === 'visible' && void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
      setHeld(false)
    }
  }, [active, supported])

  return { supported, held }
}
