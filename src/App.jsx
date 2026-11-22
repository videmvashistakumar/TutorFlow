import { useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import ComingSoon from './components/layout/ComingSoon.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import StudentsPage from './features/students/StudentsPage.jsx'
import InvoicesPage from './features/invoices/InvoicesPage.jsx'
import BillsPage from './features/bills/BillsPage.jsx'
import CashForecastPage from './features/cashForecast/CashForecastPage.jsx'
import PaymentsPage from './features/payments/PaymentsPage.jsx'
import SettingsPage from './features/settings/SettingsPage.jsx'
import { navigationItems } from './config/navigation.js'

export default function App() {
  const [activeId, setActiveId] = useState('dashboard')
  const activeItem = navigationItems.find((item) => item.id === activeId)

  let page
  if (activeId === 'dashboard') page = <DashboardPage onNavigate={setActiveId} />
  else if (activeId === 'students') page = <StudentsPage />
  else if (activeId === 'invoices') page = <InvoicesPage />
  else if (activeId === 'bills') page = <BillsPage />
  else if (activeId === 'cash-forecast') page = <CashForecastPage />
  else if (activeId === 'payments') page = <PaymentsPage />
  else if (activeId === 'settings') page = <SettingsPage />
  else page = <ComingSoon title={activeItem ? activeItem.label : 'TutorFlow'} />

  return (
    <AppLayout activeId={activeId} onSelect={setActiveId}>
      {page}
    </AppLayout>
  )
}