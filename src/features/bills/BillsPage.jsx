import { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal.jsx'
import {
  AlertTriangleIcon,
  Badge,
  Button,
  CheckCircleIcon,
  ClockIcon,
  EmptyState,
  PageHeader,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  WalletIcon,
} from '../../components/ui/index.js'
import BillDialog from './BillDialog.jsx'
import { loadBills, saveBills } from './billStorage.js'
import {
  expandBill,
  getFrequencyLabel,
  getUnpaidBillsForForecast,
  withOccurrencePaid,
} from './billUtils.js'
import { addDaysISO } from '../invoices/invoiceUtils.js'
import { formatCurrency, formatDate, todayISO } from '../../lib/format.js'

// Frequency badge: neutral tone, with a clock icon for any recurring bill.
function FrequencyBadge({ frequency }) {
  const recurring = frequency !== 'one-time'
  return (
    <Badge tone="neutral">
      {recurring && <ClockIcon className="h-3 w-3" />}
      {getFrequencyLabel(frequency)}
    </Badge>
  )
}

export default function BillsPage() {
  const [bills, setBills] = useState(() => loadBills())
  const [editingBill, setEditingBill] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    saveBills(bills)
  }, [bills])

  const today = todayISO()
  const next30 = getUnpaidBillsForForecast(bills, today, addDaysISO(today, 29))
  const upcoming = getUnpaidBillsForForecast(bills, today, addDaysISO(today, 89))
  const unpaidTotal30 = next30.reduce((sum, item) => sum + item.amount, 0)
  const overdueCount = upcoming.filter((item) => item.overdue).length
  const recurringCount = bills.filter((bill) => bill.frequency !== 'one-time').length
  const frequencyByBillId = new Map(bills.map((bill) => [bill.id, bill.frequency]))

  function openAddForm() {
    setEditingBill(null)
    setIsFormOpen(true)
  }

  function openEditForm(bill) {
    setEditingBill(bill)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingBill(null)
  }

  function handleSave(saved) {
    if (editingBill) {
      setBills((prev) => prev.map((b) => (b.id === editingBill.id ? saved : b)))
    } else {
      setBills((prev) => [...prev, saved])
    }
    closeForm()
  }

  function markAsPaid(item) {
    setBills((prev) =>
      prev.map((b) => (b.id === item.billId ? withOccurrencePaid(b, item.dueDate, true) : b)),
    )
  }

  function deleteBill(bill) {
    if (window.confirm('Delete this bill?')) {
      setBills((prev) => prev.filter((b) => b.id !== bill.id))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description={`${bills.length} bills tracked`}
        actions={
          <Button onClick={openAddForm} icon={<PlusIcon className="h-4 w-4" />}>
            Add bill
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Unpaid in next 30 days"
          value={formatCurrency(unpaidTotal30)}
          hint="Unpaid bill occurrences due soon"
          icon={<WalletIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue unpaid bills"
          value={overdueCount}
          hint={overdueCount > 0 ? 'Needs attention' : 'Nothing overdue'}
          tone={overdueCount > 0 ? 'danger' : 'default'}
          icon={<AlertTriangleIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Recurring bills"
          value={recurringCount}
          hint="Bills that repeat on a schedule"
          icon={<ReceiptIcon className="h-4 w-4" />}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">Upcoming and overdue</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<CheckCircleIcon className="h-6 w-6" />}
            title="All caught up"
            description="No unpaid bills in the next 90 days."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Due date</Th>
                  <Th>Bill</Th>
                  <Th>Amount</Th>
                  <Th>Frequency</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((item) => (
                  <Tr key={item.key}>
                    <Td className="whitespace-nowrap">{formatDate(item.dueDate)}</Td>
                    <Td className="font-semibold text-navy-900">{item.name}</Td>
                    <Td className="whitespace-nowrap tabular-nums">{formatCurrency(item.amount)}</Td>
                    <Td>
                      <FrequencyBadge frequency={frequencyByBillId.get(item.billId)} />
                    </Td>
                    <Td>
                      {item.overdue ? (
                        <Badge tone="danger">
                          <AlertTriangleIcon className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge tone="info">Upcoming</Badge>
                      )}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markAsPaid(item)}
                        icon={<CheckCircleIcon className="h-3.5 w-3.5" />}
                      >
                        Mark as paid
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">All bills</h2>
        {bills.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon className="h-6 w-6" />}
            title="No bills yet"
            description="Add your first bill."
            action={
              <Button onClick={openAddForm} icon={<PlusIcon className="h-4 w-4" />}>
                Add bill
              </Button>
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Bill</Th>
                  <Th>Amount</Th>
                  <Th>Frequency</Th>
                  <Th>Next due</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const nextOccurrence = expandBill(bill, today, addDaysISO(today, 365)).find(
                    (occ) => !occ.paid,
                  )
                  return (
                    <Tr key={bill.id}>
                      <Td>
                        <p className="font-semibold text-navy-900">{bill.name}</p>
                        {bill.notes && <p className="text-xs text-navy-500">{bill.notes}</p>}
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatCurrency(bill.amount)}</Td>
                      <Td>
                        <FrequencyBadge frequency={bill.frequency} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        {nextOccurrence ? formatDate(nextOccurrence.dueDate) : 'No more dates'}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditForm(bill)}
                            icon={<PencilIcon className="h-3.5 w-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteBill(bill)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>

      <Modal
        title={editingBill ? 'Edit bill' : 'Add bill'}
        isOpen={isFormOpen}
        onClose={closeForm}
      >
        <BillDialog bill={editingBill} onSave={handleSave} onCancel={closeForm} />
      </Modal>
    </div>
  )
}
