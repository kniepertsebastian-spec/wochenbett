import { useEffect, useRef, useState } from 'react'

type Props = {
  seconds: number
  running: boolean
  onDone?: () => void
  onTick?: (left: number) => void
  /** Nur die Sekundenzahl im Fließtext anzeigen. */
  inline?: boolean
}

function format(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Countdown. Anzeige ist ein Text; die Ansage per aria-live nur alle 10 s und am Ende, um Screenreader nicht zu fluten. */
export function Timer({ seconds, running, onDone, onTick, inline }: Props) {
  const [left, setLeft] = useState(seconds)
  const doneRef = useRef(onDone)
  const tickRef = useRef(onTick)
  useEffect(() => {
    doneRef.current = onDone
    tickRef.current = onTick
  })

  // Bei geänderter Startzeit während des Renderns zurücksetzen (kein Effekt nötig).
  const [prevSeconds, setPrevSeconds] = useState(seconds)
  if (prevSeconds !== seconds) {
    setPrevSeconds(seconds)
    setLeft(seconds)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((l) => Math.max(0, l - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Seiteneffekte (Ansagen, Weiterschalten) außerhalb des State-Updaters, damit sie nur einmal laufen
  const prev = useRef(left)
  useEffect(() => {
    if (prev.current === left) return
    prev.current = left
    tickRef.current?.(left)
    if (left === 0) doneRef.current?.()
  }, [left])

  if (inline) return <span className="font-semibold tabular-nums">{left}</span>

  const announce = left === 0 || left % 10 === 0 ? `${left} Sekunden verbleibend` : ''
  return (
    <div>
      <span className="text-5xl font-semibold tabular-nums" aria-hidden="true">
        {format(left)}
      </span>
      <span className="sr-only" role="timer" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}
