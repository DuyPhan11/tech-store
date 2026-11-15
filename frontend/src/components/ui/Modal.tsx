import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './ui.module.css'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  actions: ReactNode
}

export function Modal({ open, title, onClose, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const heading = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [open])

  return (
    <dialog ref={ref} aria-labelledby={heading} className={styles.modal}
      onCancel={event => { event.preventDefault(); onClose() }}>
      <div className={styles.modalBody}>
        <h2 id={heading}>{title}</h2>
        <div>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </dialog>
  )
}
