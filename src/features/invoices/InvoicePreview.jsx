// Invoice preview: printable document-style invoice with billed-to details, totals and payment history.
import { useEffect } from 'react'
import { formatCurrency, formatDate } from '../../lib/format.js'
import { AlertTriangleIcon, Button, FileTextIcon, WalletIcon } from '../../components/ui/index.js'
import {
  INVOICE_STATUS,
  PARTIAL_OVERDUE_STATUS,
  STATUS_STYLES,
  getAmountPaid,
  getPaymentMethodLabel,
  getRemaining,
  getStatus,
} from './invoiceUtils.js'

// Only the invoice panel prints; the rest of the app and the screen-only buttons are hidden.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .invoice-overlay, .invoice-overlay * { visibility: visible !important; }
  .invoice-overlay {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: #ffffff !important;
    padding: 0 !important;
    overflow: visible !important;
  }
}
`

export default function InvoicePreview({ invoice, student, onRecordPayment, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const status = getStatus(invoice)
  const paid = getAmountPaid(invoice)
  const remaining = getRemaining(invoice)
  const payments = [...(invoice.payments || [])].sort((a, b) => a.date.localeCompare(b.date))
  const canRecordPayment = invoice.sent && status !== INVOICE_STATUS.PAID
  const isCombined = status === PARTIAL_OVERDUE_STATUS

  const handleRecordPayment = () => {
    onClose()
    onRecordPayment()
  }

  return (
    <div
      className="invoice-overlay fixed inset-0 z-50 overflow-y-auto bg-navy-900/40 p-4 backdrop-blur-sm print:static print:bg-white print:p-0 print:backdrop-blur-none"
      onClick={onClose}
    >
      <style>{PRINT_CSS}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Invoice ${invoice.number}`}
        className="mx-auto my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-dropdown print:my-0 print:max-w-none print:rounded-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Document header: brand, invoice number and status. */}
        <div className="flex flex-col gap-4 border-b border-navy-100 px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 text-white">
              <FileTextIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">TutorFlow</p>
              <p className="text-xs text-navy-500">Tuition invoice</p>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Invoice</p>
            <p className="font-semibold text-navy-900">{invoice.number}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${
                isCombined ? 'ring-1 ring-inset ring-red-200' : ''
              }`}
            >
              {isCombined && <AlertTriangleIcon className="h-3 w-3" />}
              {status}
            </span>
          </div>
        </div>

        <div className="space-y-8 px-6 py-6 sm:px-8">
          {/* Parties and dates. */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Billed to</p>
              <p className="mt-1 font-semibold text-navy-900">{student ? student.name : 'Unknown student'}</p>
              {student && (
                <div className="mt-1 space-y-0.5 text-sm text-navy-700">
                  <p>Parent/guardian: {student.parentName}</p>
                  <p>WhatsApp: {student.parentWhatsApp}</p>
                  <p>Subject: {student.subject}</p>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:content-start">
              <div>
                <dt className="text-xs text-navy-500">Issue date</dt>
                <dd className="font-medium text-navy-900">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-500">Due date</dt>
                <dd className="font-medium text-navy-900">{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>
          </div>

          {/* Line items. */}
          <div className="overflow-hidden rounded-lg border border-navy-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50/60 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
                  <th scope="col" className="px-4 py-2.5">Description</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                <tr>
                  <td className="px-4 py-3 text-navy-900">
                    {invoice.periodLabel}
                    {student && <span className="block text-xs text-navy-500">{student.subject}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals and balance due. */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-navy-900">Payment history</h3>
              {payments.length === 0 ? (
                <p className="mt-2 text-sm text-navy-500">No payments recorded yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-navy-100 text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3 py-2">
                      <span className="text-navy-700">
                        {formatDate(p.date)} · {getPaymentMethodLabel(p.method)}
                      </span>
                      <span className="font-medium tabular-nums text-navy-900">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <dl className="w-full space-y-2 text-sm sm:w-64">
              <div className="flex justify-between text-navy-700">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(invoice.amount)}</dd>
              </div>
              <div className="flex justify-between text-navy-700">
                <dt>Amount paid</dt>
                <dd className="tabular-nums">{formatCurrency(paid)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-50/60 px-3 py-2.5">
                <dt className="font-semibold text-navy-900">Balance due</dt>
                <dd
                  className={`text-lg font-semibold tabular-nums ${remaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}
                >
                  {formatCurrency(remaining)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-navy-100 bg-navy-50/40 px-6 py-4 sm:px-8 print:hidden">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" icon={<FileTextIcon className="h-4 w-4" />} onClick={() => window.print()}>
            Print
          </Button>
          {canRecordPayment && (
            <Button variant="accent" icon={<WalletIcon className="h-4 w-4" />} onClick={handleRecordPayment}>
              Record payment
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
