import { useEffect, useId, useRef } from 'react'
import './Modal.css'

// Native <dialog>: focus trap, Esc to close and inert background come for free.
// Children mount only while open, so form state resets on every open.
export default function Modal({ open, onClose, title, size = 'narrow', children }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal ${size === 'wide' ? 'modal--wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="modal__body">
          <div className="modal__head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
