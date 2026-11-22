// Sidebar: app navigation. Props: isOpen (mobile drawer open), activeId, onSelect(id), onClose().
// Desktop: sticky icon rail (w-16) under the top bar that widens on hover (w-60) and pushes page content, showing labels.
// Mobile: slide-in drawer with overlay; selecting an item or the overlay closes it.
// Icons are mapped by navigation item id here, so config/navigation.js stays unchanged.
import { useState } from 'react'
import { navigationItems } from '../../config/navigation.js'
import {
  CreditCardIcon,
  DashboardIcon,
  FileTextIcon,
  ReceiptIcon,
  TrendingUpIcon,
  UsersIcon,
  XIcon,
} from '../ui/icons.jsx'

// Gear icon for the Settings item, drawn inline to match the stroke style of ui/icons.jsx.
function SettingsIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const ITEM_ICONS = {
  dashboard: DashboardIcon,
  students: UsersIcon,
  invoices: ReceiptIcon,
  payments: CreditCardIcon,
  'cash-forecast': TrendingUpIcon,
  bills: FileTextIcon,
  settings: SettingsIcon,
}

export default function Sidebar({ isOpen, activeId, onSelect, onClose }) {
  const [isHovered, setIsHovered] = useState(false)

  const handleSelect = (id) => {
    onSelect(id)
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] transform flex-col bg-white dark:bg-navy-900 transition-[transform,width] duration-200 md:sticky md:top-16 md:z-40 md:h-[calc(100vh-4rem)] md:max-w-none md:translate-x-0 md:self-start ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isHovered ? 'md:w-60' : 'md:w-16'}`}
      >
        <div
          className="flex h-full w-full max-w-[85vw] flex-col overflow-hidden border-r border-navy-100 bg-white dark:border-navy-700 dark:bg-navy-900 transition-all duration-200 md:max-w-none"
        >
          <div className="flex h-16 items-center justify-between border-b border-navy-100 px-5 md:px-3.5">
            <div className="flex items-center gap-2.5">
              <img
                src="/tutorflow-logo.png"
                alt="TutorFlow logo"
                className="h-9 w-9 shrink-0 object-contain mix-blend-multiply"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span
                className={`text-lg font-semibold tracking-tight text-navy-900 dark:text-navy-50 transition-opacity duration-200 md:whitespace-nowrap ${
                  isHovered ? 'md:opacity-100' : 'md:opacity-0'
                }`}
              >
                TutorFlow
              </span>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-50 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 md:hidden"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 md:px-2.5">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = item.id === activeId
                const Icon = ITEM_ICONS[item.id]
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleSelect(item.id)}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                        isHovered ? '' : 'md:gap-0'
                      } ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                          : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-navy-50'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent-600"
                        />
                      )}
                      {Icon && <Icon className="h-5 w-5 shrink-0" />}
                      <span
                        className={`truncate transition-opacity duration-200 md:whitespace-nowrap ${
                          isHovered ? 'md:opacity-100' : 'md:opacity-0'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div
            className={`whitespace-nowrap border-t border-navy-100 px-5 py-4 text-xs text-navy-500 transition-opacity duration-200 md:px-3.5 ${
              isHovered ? 'md:opacity-100' : 'md:opacity-0'
            }`}
          >
            Tutoring finance &amp; billing
          </div>
        </div>
      </aside>
    </>
  )
}
