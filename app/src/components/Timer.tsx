import { useEffect, useRef, useState } from 'react'

type Props = {
  seconds: number
  running: boolean
  onDone?: () => void
}

function format(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Countdown. Anzeige ist ein Text; die Ansage per aria-live nur alle 10 s und am Ende, um Screenreader nicht zu fluten. */
export function Timer({ seconds, running, onDone }: Props) {
  const [left, setLeft] = useState(seconds)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
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
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id)
          doneRef.current?.()
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

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
