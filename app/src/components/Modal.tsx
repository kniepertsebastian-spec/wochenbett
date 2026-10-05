import { useEffect, useRef, type ReactNode } from 'react'

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode }

/** Modal auf Basis von <dialog>: Fokusfalle und Esc kommen vom Browser. */
export function Modal({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="pb-safe m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-stone-900 backdrop:bg-black/50 dark:bg-stone-900 dark:text-stone-100"
    >
      <h2 id="modal-title" className="mb-3 text-xl font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  )
}
