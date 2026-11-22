// Payments page: read-only history of every recorded invoice payment, with summary, search and filters.
import { useEffect, useMemo, useState } from 'react'
import { loadStudents } from '../students/studentStorage.js'
import { loadInvoices } from '../invoices/invoiceStorage.js'
import { getPaymentMethodLabel, PAYMENT_METHOD_OPTIONS } from '../invoices/invoiceUtils.js'
import { formatCurrency, formatDate, todayISO } from '../../lib/format.js'
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Td,
  Th,
  TableWrap,
  Tr,
  CreditCardIcon,
  ClockIcon,
  InboxIcon,
  SearchIcon,
  WalletIcon,
  XIcon,
} from '../../components/ui/index.js'

const DATA_CHANGED_EVENT = 'tutorflow:data-changed'

const METHOD_FILTER_OPTIONS = [
  { value: 'all', label: 'All methods' },
  ...PAYMENT_METHOD_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
]

function monthLabel(ym) {
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState(() => loadInvoices())
  const [students, setStudents] = useState(() => loadStudents())
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  // Read-only page: refresh from storage when other pages change data. Never writes back.
  useEffect(() => {
    const refresh = () => {
      setInvoices(loadInvoices())
      setStudents(loadStudents())
    }
    window.addEventListener(DATA_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, refresh)
  }, [])

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  // One flat row per payment record, joined with its invoice and student.
  const allPayments = useMemo(() => {
    const rows = []
    for (const invoice of invoices) {
      const student = studentById.get(invoice.studentId) || null
      for (const payment of invoice.payments || []) {
        rows.push({
          id: payment.id,
          amount: Number(payment.amount) || 0,
          date: payment.date || '',
          method: payment.method || '',
          invoiceNumber: invoice.number || '',
          studentName: student ? student.name : 'Unknown student',
        })
      }
    }
    // Newest first: date desc, then id desc. Payments without a date sort last.
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      const ai = String(a.id)
      const bi = String(b.id)
      return ai < bi ? 1 : ai > bi ? -1 : 0
    })
    return rows
  }, [invoices, studentById])

  const thisMonth = todayISO().slice(0, 7)
  const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const collectedThisMonth = allPayments
    .filter((p) => p.date && p.date.slice(0, 7) === thisMonth)
    .reduce((sum, p) => sum + p.amount, 0)

  const monthOptions = useMemo(() => {
    const months = new Set()
    allPayments.forEach((p) => {
      if (p.date) months.add(p.date.slice(0, 7))
    })
    return [...months].sort((a, b) => (a < b ? 1 : -1))
  }, [allPayments])

  const q = query.trim().toLowerCase()
  const visiblePayments = allPayments.filter((p) => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false
    if (monthFilter !== 'all' && (!p.date || p.date.slice(0, 7) !== monthFilter)) return false
    if (!q) return true
    return [p.studentName, p.invoiceNumber].some((v) => String(v).toLowerCase().includes(q))
  })

  const hasPayments = allPayments.length > 0
  const hasActiveFilters = query !== '' || methodFilter !== 'all' || monthFilter !== 'all'

  // Resets the existing filter state to its defaults. Nothing else.
  const clearFilters = () => {
    setQuery('')
    setMethodFilter('all')
    setMonthFilter('all')
  }

  const clearButton = (
    <Button
      variant="secondary"
      size="sm"
      icon={<XIcon className="h-3.5 w-3.5" />}
      onClick={clearFilters}
    >
      Clear filters
    </Button>
  )

  const statCards = [
    {
      label: 'Total collected',
      value: formatCurrency(totalCollected),
      icon: <WalletIcon className="h-5 w-5" />,
      tone: 'success',
    },
    {
      label: 'Collected this month',
      value: formatCurrency(collectedThisMonth),
      icon: <ClockIcon className="h-5 w-5" />,
      tone: 'info',
    },
    {
      label: 'Number of payments',
      value: allPayments.length,
      icon: <CreditCardIcon className="h-5 w-5" />,
      tone: 'default',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="A read-only history of every recorded invoice payment, newest first."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      {hasPayments && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" />
            <Input
              type="search"
              aria-label="Search payments"
              placeholder="Search by student or invoice number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              aria-label="Filter by payment method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              {METHOD_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          {monthOptions.length > 0 && (
            <div className="w-full sm:w-52">
              <Select
                aria-label="Filter by month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="all">All months</option>
                {monthOptions.map((ym) => (
                  <option key={ym} value={ym}>
                    {monthLabel(ym)}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start sm:self-auto"
              icon={<XIcon className="h-3.5 w-3.5" />}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {!hasPayments ? (
        <EmptyState
          icon={<InboxIcon className="h-6 w-6" />}
          title="No payments recorded yet"
          description={'Record a payment from the Invoices page using “Mark as Paid”.'}
        />
      ) : visiblePayments.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="No payments match your filters"
          description="Try a different search term, payment method or month."
          action={clearButton}
        />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Student</Th>
                <Th>Invoice</Th>
                <Th className="text-right">Amount</Th>
                <Th>Method</Th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((p) => (
                <Tr key={p.id}>
                  <Td className="whitespace-nowrap tabular-nums text-navy-700">
                    {p.date ? formatDate(p.date) : '—'}
                  </Td>
                  <Td className="font-medium text-navy-900">{p.studentName}</Td>
                  <Td className="whitespace-nowrap font-medium text-navy-900">{p.invoiceNumber}</Td>
                  <Td className="whitespace-nowrap text-right font-semibold tabular-nums text-emerald-700">
                    {formatCurrency(p.amount)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Badge tone="neutral">{getPaymentMethodLabel(p.method) || '—'}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  )
}
