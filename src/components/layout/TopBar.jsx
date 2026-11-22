// TopBar: sticky slim header. Props: activeId (current page id; remounts the bell on page change), onToggleSidebar (mobile drawer toggle), onNavigate(pageId) (used by the alert bell).
// Shows the mobile menu button and a compact brand on small screens; the notification bell sits on the right.
import NotificationBell from '../../features/alerts/NotificationBell.jsx'
import { MenuIcon } from '../ui/icons.jsx'

export default function TopBar({ activeId, onToggleSidebar, onNavigate }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={onToggleSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 transition-colors duration-150 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 items-center gap-2">
        <img
          src="/tutorflow-logo.png"
          alt="TutorFlow logo"
          className="h-10 w-10 shrink-0 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <span className="truncate rounded-full px-3 py-1 text-base font-semibold tracking-tight text-white bg-navy-900">TutorFlow</span>
      </div>
      <div className="relative ml-auto">
        <NotificationBell key={activeId ?? 'page'} onNavigate={onNavigate} />
      </div>
    </header>
  )
}
