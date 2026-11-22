// Notification bell: toggles a dropdown of alerts built from stored data; clicking an alert opens its page.
import { useEffect, useRef, useState } from 'react'
import useAlerts from './useAlerts.js'
import { BellIcon } from '../../components/ui/icons.jsx'

const PILLS = {
  danger: { label: 'Urgent', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  warning: { label: 'Soon', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  info: { label: 'Info', className: 'bg-navy-100 text-navy-700', dot: 'bg-sky-500' },
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const alerts = useAlerts()
  const wrapperRef = useRef(null)

  const handleToggle = () => {
    setOpen((value) => !value)
  }

  useEffect(() => {
    if (!open) return undefined

    const handleMouseDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const count = alerts.length

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={handleToggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-600 transition-colors duration-150 hover:bg-navy-50 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <BellIcon className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[90vw] rounded-xl border border-navy-100 bg-white p-3 shadow-dropdown">
          <h2 className="px-2 pt-1 text-sm font-semibold text-navy-900">Alerts</h2>
          {alerts.length === 0 ? (
            <p className="px-2 py-3 text-sm text-navy-500">You're all caught up.</p>
          ) : (
            <ul className="mt-2 max-h-96 space-y-1 overflow-y-auto">
              {alerts.map((item) => {
                const pill = PILLS[item.severity]
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(item.page)
                        setOpen(false)
                      }}
                      className="w-full rounded-lg p-2 text-left transition-colors duration-150 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${pill.dot}`} />
                          <p className="text-sm font-medium text-navy-900">{item.title}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>
                          {pill.label}
                        </span>
                      </div>
                      <p className="mt-0.5 pl-4 text-xs text-navy-500">{item.detail}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
