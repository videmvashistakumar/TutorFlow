// Reusable modal dialog. Props (unchanged): title, isOpen, onClose, children.
// Closes on backdrop click or Escape key. Returns null when closed. Default export (also re-exported as Modal from ui/index.js).
import { useEffect, useId } from 'react'
import { XIcon } from './icons.jsx'

export default function Modal({ title, isOpen, onClose, children }) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-dropdown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-navy-100 bg-white px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold text-navy-900">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-500 transition-colors duration-150 hover:bg-navy-50 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
