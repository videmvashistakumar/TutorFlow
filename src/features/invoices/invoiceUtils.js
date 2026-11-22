// Invoice status, totals and number helpers.
import { todayISO } from '../../lib/format.js'
import { loadSettings } from '../../lib/settingsStore.js'

export const INVOICE_STATUS = { DRAFT: 'Draft', SENT: 'Sent', PARTIAL: 'Partially Paid', PAID: 'Paid', OVERDUE: 'Overdue' }

export const PARTIAL_OVERDUE_STATUS = 'Partially Paid · Overdue'

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
]

export const STATUS_STYLES = {
  Draft: 'bg-navy-100 text-navy-700',
  Sent: 'bg-sky-50 text-sky-700',
  'Partially Paid': 'bg-amber-50 text-amber-700',
  Paid: 'bg-emerald-50 text-emerald-700',
  Overdue: 'bg-red-50 text-red-700',
  'Partially Paid · Overdue': 'bg-red-50 text-red-700',
}

export function getPaymentMethodLabel(value) {
  const found = PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)
  return found ? found.label : value
}

export function getAmountPaid(invoice) {
  return (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
}

export function getRemaining(invoice) {
  return Math.max(0, Number(invoice.amount) - getAmountPaid(invoice))
}

// Overdue is computed here, never stored.
export function getStatus(invoice, today = todayISO()) {
  if (!invoice.sent) return INVOICE_STATUS.DRAFT
  if (getRemaining(invoice) <= 0) return INVOICE_STATUS.PAID
  const paid = getAmountPaid(invoice) > 0
  if (invoice.dueDate < today) return paid ? PARTIAL_OVERDUE_STATUS : INVOICE_STATUS.OVERDUE
  if (paid) return INVOICE_STATUS.PARTIAL
  return INVOICE_STATUS.SENT
}

// Overdue = sent, money still owed, and past due date. Partial payments do not change this.
export function isOverdue(invoice, today = todayISO()) {
  return Boolean(invoice.sent) && getRemaining(invoice) > 0 && invoice.dueDate < today
}

// Partly paid = sent, some paid, some still owed (whether or not overdue).
export function isPartiallyPaid(invoice) {
  return Boolean(invoice.sent) && getAmountPaid(invoice) > 0 && getRemaining(invoice) > 0
}

export function nextInvoiceNumber(invoices, issueDate) {
  const year = issueDate.slice(0, 4)
  const numberPrefix = loadSettings().invoicePrefs.numberPrefix || ''
  const prefix = `${numberPrefix}INV-${year}-`
  const count = invoices.filter((inv) => String(inv.number).startsWith(prefix)).length
  return prefix + String(count + 1).padStart(3, '0')
}

export function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMonthlyFeeForStudent(student) {
  return student.feeType === 'monthly' ? Number(student.feeAmount) : null
}
