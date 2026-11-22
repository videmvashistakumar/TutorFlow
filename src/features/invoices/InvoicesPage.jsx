// Invoices page: list invoices, filter and search, create, edit, record payments, send reminders and preview.
import { useEffect, useMemo, useState } from 'react'
import { loadStudents } from '../students/studentStorage.js'
import { createId } from '../students/studentUtils.js'
import { formatCurrency, formatDate } from '../../lib/format.js'
import {
  AlertTriangleIcon,
  BellIcon,
  Button,
  CheckCircleIcon,
  cx,
  EyeIcon,
  Input,
  MailIcon,
  Modal,
  PageHeader,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Select,
  SendIcon,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  WalletIcon,
} from '../../components/ui/index.js'
import { loadInvoices, saveInvoices } from './invoiceStorage.js'
import {
  INVOICE_STATUS,
  PARTIAL_OVERDUE_STATUS,
  STATUS_STYLES,
  getAmountPaid,
  getRemaining,
  getStatus,
  isOverdue,
  isPartiallyPaid,
  nextInvoiceNumber,
} from './invoiceUtils.js'
import CreateInvoiceDialog from './CreateInvoiceDialog.jsx'
import EditInvoiceDialog from './EditInvoiceDialog.jsx'
import RecordPaymentDialog from './RecordPaymentDialog.jsx'
import InvoicePreview from './InvoicePreview.jsx'
import ReminderDialog from '../followups/ReminderDialog.jsx'
import RemindAllDialog from '../followups/RemindAllDialog.jsx'
import { getDaysOverdue, isReminderEligible } from '../followups/followupUtils.js'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(INVOICE_STATUS).map((s) => ({ value: s, label: s })),
]

// Status badge. Plain Partially Paid is amber; the combined overdue status is red with a warning icon and ring.
function StatusBadge({ status }) {
  const combined = status === PARTIAL_OVERDUE_STATUS
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        combined && 'ring-1 ring-inset ring-red-200',
      )}
    >
      {combined && <AlertTriangleIcon className="h-3 w-3" />}
      {status}
    </span>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(() => loadInvoices())
  const [students] = useState(() => loadStudents())
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [paymentInvoiceId, setPaymentInvoiceId] = useState(null)
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null)
  const [reminderInvoiceId, setReminderInvoiceId] = useState(null)
  const [editInvoiceId, setEditInvoiceId] = useState(null)
  const [isRemindAllOpen, setIsRemindAllOpen] = useState(false)

  useEffect(() => {
    saveInvoices(invoices)
  }, [invoices])

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  const rows = invoices.map((invoice) => ({
    invoice,
    status: getStatus(invoice),
    student: studentById.get(invoice.studentId) || null,
  }))

  const q = query.trim().toLowerCase()
  const visibleRows = rows.filter(({ invoice, status, student }) => {
    if (statusFilter === INVOICE_STATUS.OVERDUE && !isOverdue(invoice)) return false
    if (statusFilter === INVOICE_STATUS.PARTIAL && !isPartiallyPaid(invoice)) return false
    if (
      statusFilter !== 'all' &&
      statusFilter !== INVOICE_STATUS.OVERDUE &&
      statusFilter !== INVOICE_STATUS.PARTIAL &&
      status !== statusFilter
    )
      return false
    if (!q) return true
    return [invoice.number, student ? student.name : '', invoice.periodLabel].some((v) =>
      String(v || '').toLowerCase().includes(q)
    )
  })

  const totalOutstanding = invoices
    .filter((inv) => inv.sent)
    .reduce((sum, inv) => sum + getRemaining(inv), 0)
  const overdueCount = rows.filter((r) => isOverdue(r.invoice)).length
  const totalCollected = invoices.reduce((sum, inv) => sum + getAmountPaid(inv), 0)

  const paymentInvoice = invoices.find((inv) => inv.id === paymentInvoiceId) || null
  const previewInvoice = invoices.find((inv) => inv.id === previewInvoiceId) || null
  const reminderInvoice = invoices.find((inv) => inv.id === reminderInvoiceId) || null
  const editInvoice = invoices.find((inv) => inv.id === editInvoiceId) || null
  const overdueItems = rows
    .filter((r) => isOverdue(r.invoice) && r.student)
    .map((r) => ({ invoice: r.invoice, student: r.student, daysOverdue: getDaysOverdue(r.invoice) }))

  const handleCreate = (draft) => {
    setInvoices((prev) => [
      ...prev,
      {
        id: createId('inv'),
        number: nextInvoiceNumber(prev, draft.issueDate),
        ...draft,
        payments: [],
      },
    ])
    setIsCreateOpen(false)
  }

  const handleMarkSent = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, sent: true } : inv))
    )
  }

  const handleLogReminder = (invoiceId, reminder) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, reminders: [...(inv.reminders || []), reminder] } : inv
      )
    )
  }
  const handleRecordPayment = (invoiceId, payment) => {
    const amount = Number(payment.amount)
    if (!(amount > 0)) return
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              payments: [
                ...(inv.payments || []),
                { id: createId('pay'), ...payment, amount },
              ],
            }
          : inv
      )
    )
    setPaymentInvoiceId(null)
  }

  const handleEditInvoice = (invoiceId, fields) => {
    const current = invoices.find((inv) => inv.id === invoiceId)
    if (!current) return
    if (fields.amount !== undefined && Number(fields.amount) < getAmountPaid(current)) return
    const lockedStudent = (current.payments || []).length > 0 || (current.reminders || []).length > 0
    if (lockedStudent && fields.studentId !== undefined && fields.studentId !== current.studentId) return
    setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? { ...inv, ...fields } : inv)))
    setEditInvoiceId(null)
  }

  // Row actions, shared by the desktop table and the mobile cards. Same handlers in both.
  const renderActions = (invoice, status) => (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={<EyeIcon className="h-3.5 w-3.5" />}
        onClick={() => setPreviewInvoiceId(invoice.id)}
      >
        View
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<PencilIcon className="h-3.5 w-3.5" />}
        onClick={() => setEditInvoiceId(invoice.id)}
      >
        Edit
      </Button>
      {isReminderEligible(invoice) && (
        <Button
          variant="success"
          size="sm"
          icon={<MailIcon className="h-3.5 w-3.5" />}
          onClick={() => setReminderInvoiceId(invoice.id)}
        >
          Send Reminder
        </Button>
      )}
      {!invoice.sent && (
        <Button
          variant="primary"
          size="sm"
          icon={<SendIcon className="h-3.5 w-3.5" />}
          onClick={() => handleMarkSent(invoice.id)}
        >
          Mark as sent
        </Button>
      )}
      {invoice.sent && status !== INVOICE_STATUS.PAID && (
        <Button
          variant="accent"
          size="sm"
          icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
          onClick={() => setPaymentInvoiceId(invoice.id)}
        >
          Mark as Paid
        </Button>
      )}
    </div>
  )

  const summaryCards = [
    {
      label: 'Outstanding balance',
      value: formatCurrency(totalOutstanding),
      hint: 'Across sent invoices',
      icon: <WalletIcon className="h-4 w-4" />,
      tone: 'info',
    },
    {
      label: 'Overdue invoices',
      value: overdueCount,
      hint: 'Past due with a balance',
      icon: <AlertTriangleIcon className="h-4 w-4" />,
      tone: 'danger',
    },
    {
      label: 'Total collected',
      value: formatCurrency(totalCollected),
      hint: 'All recorded payments',
      icon: <CheckCircleIcon className="h-4 w-4" />,
      tone: 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoices`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<BellIcon className="h-4 w-4" />}
              onClick={() => setIsRemindAllOpen(true)}
              disabled={overdueItems.length === 0}
            >
              Remind All Overdue
            </Button>
            <Button
              variant="primary"
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input
            type="search"
            aria-label="Search invoices"
            placeholder="Search by invoice, student or period"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Desktop and tablet: full table. */}
      <TableWrap className="hidden md:block">
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Student</Th>
              <Th>Period</Th>
              <Th>Issued</Th>
              <Th>Due</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Paid</Th>
              <Th className="text-right">Balance</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <Tr>
                <Td colSpan={10} className="py-10 text-center text-navy-500">
                  No invoices match your filters.
                </Td>
              </Tr>
            ) : (
              visibleRows.map(({ invoice, status, student }) => {
                const remaining = getRemaining(invoice)
                return (
                  <Tr key={invoice.id}>
                    <Td className="whitespace-nowrap font-medium text-navy-900">{invoice.number}</Td>
                    <Td className="text-navy-900">{student ? student.name : 'Unknown student'}</Td>
                    <Td className="text-navy-700">{invoice.periodLabel}</Td>
                    <Td className="whitespace-nowrap text-navy-700">{formatDate(invoice.issueDate)}</Td>
                    <Td className="whitespace-nowrap text-navy-700">{formatDate(invoice.dueDate)}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums text-navy-900">
                      {formatCurrency(invoice.amount)}
                    </Td>
                    <Td className="whitespace-nowrap text-right tabular-nums text-navy-700">
                      {formatCurrency(getAmountPaid(invoice))}
                    </Td>
                    <Td
                      className={cx(
                        'whitespace-nowrap text-right font-semibold tabular-nums',
                        remaining > 0 ? 'text-red-700' : 'text-emerald-700',
                      )}
                    >
                      {formatCurrency(remaining)}
                    </Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                    <Td className="min-w-[260px]">{renderActions(invoice, status)}</Td>
                  </Tr>
                )
              })
            )}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile: one card per invoice so nothing needs horizontal scrolling. */}
      <div className="md:hidden">
        {visibleRows.length === 0 ? (
          <p className="rounded-xl border border-navy-100 bg-white px-4 py-10 text-center text-sm text-navy-500">
            No invoices match your filters.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleRows.map(({ invoice, status, student }) => {
              const remaining = getRemaining(invoice)
              return (
                <li key={invoice.id} className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{invoice.number}</p>
                      <p className="truncate text-sm text-navy-800">
                        {student ? student.name : 'Unknown student'}
                      </p>
                      <p className="truncate text-xs text-navy-500">{invoice.periodLabel}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-navy-50/60 p-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-navy-500">Total</dt>
                      <dd className="truncate font-medium tabular-nums text-navy-900">
                        {formatCurrency(invoice.amount)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-navy-500">Paid</dt>
                      <dd className="truncate font-medium tabular-nums text-navy-900">
                        {formatCurrency(getAmountPaid(invoice))}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-navy-500">Balance</dt>
                      <dd
                        className={cx(
                          'truncate font-semibold tabular-nums',
                          remaining > 0 ? 'text-red-700' : 'text-emerald-700',
                        )}
                      >
                        {formatCurrency(remaining)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-navy-500">
                    Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
                  </p>
                  <div className="mt-3 border-t border-navy-100 pt-3">{renderActions(invoice, status)}</div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal title="Create invoice" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        {isCreateOpen && (
          <CreateInvoiceDialog
            students={students}
            onCreate={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        )}
      </Modal>

      <Modal
        title="Record payment"
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoiceId(null)}
      >
        {paymentInvoice && (
          <RecordPaymentDialog
            invoice={paymentInvoice}
            onRecord={(payment) => handleRecordPayment(paymentInvoice.id, payment)}
            onCancel={() => setPaymentInvoiceId(null)}
          />
        )}
      </Modal>

      <Modal
        title="Edit invoice"
        isOpen={!!editInvoice}
        onClose={() => setEditInvoiceId(null)}
      >
        {editInvoice && (
          <EditInvoiceDialog
            invoice={editInvoice}
            students={students}
            onSave={(fields) => handleEditInvoice(editInvoice.id, fields)}
            onCancel={() => setEditInvoiceId(null)}
          />
        )}
      </Modal>

      <Modal title="Send reminder" isOpen={!!reminderInvoice} onClose={() => setReminderInvoiceId(null)}>
        {reminderInvoice && (
          <ReminderDialog
            invoice={reminderInvoice}
            student={studentById.get(reminderInvoice.studentId) || null}
            onLogReminder={(reminder) => handleLogReminder(reminderInvoice.id, reminder)}
          />
        )}
      </Modal>

      <Modal title="Remind all overdue" isOpen={isRemindAllOpen} onClose={() => setIsRemindAllOpen(false)}>
        {isRemindAllOpen && (
          <RemindAllDialog
            items={overdueItems}
            onLogReminder={handleLogReminder}
            onClose={() => setIsRemindAllOpen(false)}
          />
        )}
      </Modal>

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          student={studentById.get(previewInvoice.studentId) || null}
          onRecordPayment={() => setPaymentInvoiceId(previewInvoice.id)}
          onClose={() => setPreviewInvoiceId(null)}
        />
      )}
    </div>
  )
}
