// Dashboard page: page header, Bad Day Mode, today's actions, headline totals and the "Who Owes Me" table, calculated from stored data.
import { useState } from 'react'
import { loadInvoices } from '../invoices/invoiceStorage.js'
import { loadStudents } from '../students/studentStorage.js'
import { formatCurrency, formatDate, todayISO } from '../../lib/format.js'
import WhoOwesTable from './WhoOwesTable.jsx'
import TodaysActions from '../alerts/TodaysActions.jsx'
import BadDayMode from '../badDay/BadDayMode.jsx'
import {
  PageHeader,
  SectionCard,
  StatCard,
  WalletIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
} from '../../components/ui/index.js'
import {
  buildOwesRows,
  getCollectedThisMonth,
  getExpectedNext30Days,
  getOutstandingTotal,
  getOverdueTotal,
} from './dashboardUtils.js'

export default function DashboardPage({ onNavigate }) {
  const [invoices] = useState(() => loadInvoices())
  const [students] = useState(() => loadStudents())
  const today = todayISO()

  const stats = [
    {
      label: 'Total outstanding',
      value: formatCurrency(getOutstandingTotal(invoices)),
      hint: 'Unpaid sent invoices',
      tone: 'info',
      icon: <WalletIcon className="h-4 w-4" />,
    },
    {
      label: 'Overdue amount',
      value: formatCurrency(getOverdueTotal(invoices)),
      hint: 'Past due and not yet paid',
      tone: 'danger',
      icon: <AlertTriangleIcon className="h-4 w-4" />,
    },
    {
      label: 'Collected this month',
      value: formatCurrency(getCollectedThisMonth(invoices, today)),
      hint: 'Payments received this month',
      tone: 'success',
      icon: <CheckCircleIcon className="h-4 w-4" />,
    },
    {
      label: 'Expected in next 30 days',
      value: formatCurrency(getExpectedNext30Days(invoices, today)),
      hint: 'Due within the next 30 days',
      tone: 'info',
      icon: <TrendingUpIcon className="h-4 w-4" />,
    },
  ]
  const rows = buildOwesRows(invoices, students)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Welcome back to TutorFlow"
        description={`Here is where things stand as of ${formatDate(today)}.`}
      />

      <BadDayMode />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} tone={s.tone} icon={s.icon} />
        ))}
      </div>

      <TodaysActions onNavigate={onNavigate} />

      <SectionCard
        title="Who owes me?"
        description="Unpaid sent invoices, most overdue first."
        padded={false}
      >
        <WhoOwesTable rows={rows} />
      </SectionCard>
    </div>
  )
}
