// AppLayout: page shell. Props: activeId, onSelect(id), children.
// Owns the mobile sidebar drawer state, renders TopBar + Sidebar, and wraps the page in the content container.
import { useState } from 'react'
import TopBar from './TopBar.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout({ activeId, onSelect, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col text-navy-900">
      <TopBar onToggleSidebar={() => setSidebarOpen((open) => !open)} onNavigate={onSelect} />
      <div className="flex min-w-0 flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          activeId={activeId}
          onSelect={onSelect}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
