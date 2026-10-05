import { useCallback, useRef } from 'react'

export type AudioSettings = { speech: boolean; gong: boolean; vibration: boolean }

/** Sprachansagen über die Sprachausgabe des Geräts (funktioniert ohne Internet, wenn eine Stimme installiert ist), Gong per WebAudio. */
export function useAudio(settings: AudioSettings) {
  const ctx = useRef<AudioContext | null>(null)

  const speak = useCallback(
    (text: string) => {
      if (!settings.speech || typeof speechSynthesis === 'undefined') return
      try {
        speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'de-DE'
        u.rate = 0.9
        speechSynthesis.speak(u)
      } catch {
        /* Audio ist optional */
      }
    },
    [settings.speech],
  )

  const gong = useCallback(() => {
    if (!settings.gong) return
    try {
      const AC = window.AudioContext
      if (!AC) return
      ctx.current ??= new AC()
      const c = ctx.current
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'
      o.frequency.value = 528
      g.gain.setValueAtTime(0.0001, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.6)
      o.connect(g).connect(c.destination)
      o.start()
      o.stop(c.currentTime + 1.7)
    } catch {
      /* optional */
    }
  }, [settings.gong])

  const vibrate = useCallback(
    (pattern: number | number[] = 80) => {
      if (settings.vibration && 'vibrate' in navigator) navigator.vibrate(pattern)
    },
    [settings.vibration],
  )

  const stop = useCallback(() => {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  }, [])

  return { speak, gong, vibrate, stop }
}
