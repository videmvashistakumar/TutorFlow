// Form inside the Edit Invoice modal: edit student, period, amount and dates, then review before/after before saving.
import { useState } from 'react'
import { formatCurrency, formatDate } from '../../lib/format.js'
import {
  Badge,
  Button,
  FormField,
  Input,
  Select,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from '../../components/ui/index.js'
import { STATUS_STYLES, getAmountPaid, getRemaining, getStatus } from './invoiceUtils.js'

export default function EditInvoiceDialog({ invoice, students, onSave, onCancel }) {
  const paid = getAmountPaid(invoice)
  const studentLocked = (invoice.payments || []).length > 0 || (invoice.reminders || []).length > 0

  const [step, setStep] = useState('edit')
  const [studentId, setStudentId] = useState(invoice.studentId || '')
  const [periodLabel, setPeriodLabel] = useState(invoice.periodLabel || '')
  const [amount, setAmount] = useState(String(invoice.amount ?? ''))
  const [issueDate, setIssueDate] = useState(invoice.issueDate || '')
  const [dueDate, setDueDate] = useState(invoice.dueDate || '')
  const [errors, setErrors] = useState({})
  const [draft, setDraft] = useState(null)

  const studentName = (id) => {
    const s = students.find((st) => st.id === id)
    return s ? s.name : 'Unknown student'
  }

  // Validates the edit step and, if it passes, moves to the review step.
  const handleReview = (e) => {
    e.preventDefault()
    const next = {}
    const effectiveStudentId = studentLocked ? invoice.studentId : studentId
    if (!effectiveStudentId) next.studentId = 'Please choose a student.'
    const trimmedPeriod = periodLabel.trim()
    if (!trimmedPeriod) next.periodLabel = 'Please enter a billing period.'
    const numericAmount = Number(amount)
    if (!(numericAmount > 0)) {
      next.amount = 'Enter an amount greater than 0.'
    } else if (numericAmount < paid) {
      next.amount = `Amount cannot be less than the ${formatCurrency(paid)} already paid.`
    }
    if (!issueDate) next.issueDate = 'Please choose an issue date.'
    if (!dueDate) next.dueDate = 'Please choose a due date.'
    if (issueDate && dueDate && dueDate < issueDate) {
      next.dueDate = 'Due date cannot be before the issue date.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setDraft({
      studentId: effectiveStudentId,
      periodLabel: trimmedPeriod,
      amount: numericAmount,
      issueDate,
      dueDate,
    })
    setStep('review')
  }

  const handleConfirm = () => {
    if (!draft) return
    onSave({ ...draft })
  }

  if (step === 'review' && draft) {
    // One row per editable field; 'changed' decides which rows count as changes.
    const fieldRows = [
      {
        label: 'Student',
        from: studentName(invoice.studentId),
        to: studentName(draft.studentId),
        changed: draft.studentId !== invoice.studentId,
      },
      {
        label: 'Period',
        from: invoice.periodLabel || '',
        to: draft.periodLabel,
        changed: draft.periodLabel !== (invoice.periodLabel || ''),
      },
      {
        label: 'Amount',
        from: formatCurrency(invoice.amount),
        to: formatCurrency(draft.amount),
        changed: draft.amount !== Number(invoice.amount),
      },
      {
        label: 'Issue date',
        from: formatDate(invoice.issueDate),
        to: formatDate(draft.issueDate),
        changed: draft.issueDate !== invoice.issueDate,
      },
      {
        label: 'Due date',
        from: formatDate(invoice.dueDate),
        to: formatDate(draft.dueDate),
        changed: draft.dueDate !== invoice.dueDate,
      },
    ]
    const changes = fieldRows.filter((r) => r.changed)

    const newBalance = Math.max(0, draft.amount - paid)
    const statusAfter = getStatus({ ...invoice, ...draft })

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Review changes</p>
          <TableWrap className="mt-2 shadow-none">
            <Table>
              <thead>
                <tr>
                  <Th>Field</Th>
                  <Th>Before</Th>
                  <Th>After</Th>
                </tr>
              </thead>
              <tbody>
                {fieldRows.map((row) => (
                  <Tr key={row.label} className={row.changed ? 'bg-amber-50/60' : undefined}>
                    <Td className="font-medium text-navy-900">
                      {row.label}
                      {row.changed && (
                        <Badge tone="warning" className="ml-2">
                          Changed
                        </Badge>
                      )}
                    </Td>
                    <Td className={row.changed ? 'text-navy-500 line-through' : 'text-navy-600'}>{row.from}</Td>
                    <Td className={row.changed ? 'font-semibold text-navy-900' : 'text-navy-600'}>{row.to}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          {changes.length === 0 && (
            <p className="mt-2 text-sm text-navy-500">No changes to save.</p>
          )}
        </div>

        <dl className="grid gap-3 rounded-lg border border-navy-100 bg-navy-50/60 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-navy-500">Amount paid</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-navy-900">{formatCurrency(paid)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-500">New balance</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-navy-900">{formatCurrency(newBalance)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-500">Status after saving</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[statusAfter]}`}
              >
                {statusAfter}
              </span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setStep('edit')}>
            Back
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={changes.length === 0}>
            Confirm changes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReview} noValidate>
      <div className="space-y-6">
        <dl className="grid grid-cols-3 gap-3 rounded-lg border border-navy-100 bg-navy-50/60 p-4 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Invoice</dt>
            <dd className="mt-0.5 truncate font-semibold text-navy-900">{invoice.number}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Paid</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums text-navy-900">{formatCurrency(paid)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Balance</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums text-navy-900">
              {formatCurrency(getRemaining(invoice))}
            </dd>
          </div>
        </dl>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Student and period</p>
          <FormField
            label="Student"
            htmlFor="edit-invoice-student"
            required={!studentLocked}
            error={errors.studentId}
            hint={
              studentLocked
                ? 'Locked: student cannot be changed after payments or reminders are recorded.'
                : undefined
            }
          >
            <Select
              id="edit-invoice-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={studentLocked}
              invalid={!!errors.studentId}
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.feeType === 'monthly' ? 'monthly' : 'per session'})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Period" htmlFor="edit-invoice-period" required error={errors.periodLabel} hint="Shown on the invoice, for example 'March 2025 tuition'.">
            <Input
              id="edit-invoice-period"
              type="text"
              maxLength={80}
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              invalid={!!errors.periodLabel}
            />
          </FormField>
        </section>

        <section className="space-y-4 border-t border-navy-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Amount</p>
          <FormField
            label="Amount (₹)"
            htmlFor="edit-invoice-amount"
            required
            error={errors.amount}
            hint={`Cannot be set below the ${formatCurrency(paid)} already paid.`}
          >
            <Input
              id="edit-invoice-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              invalid={!!errors.amount}
            />
          </FormField>
        </section>

        <section className="space-y-4 border-t border-navy-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Dates</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Issue date" htmlFor="edit-invoice-issue" required error={errors.issueDate}>
              <Input
                id="edit-invoice-issue"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                invalid={!!errors.issueDate}
              />
            </FormField>

            <FormField label="Due date" htmlFor="edit-invoice-due" required error={errors.dueDate}>
              <Input
                id="edit-invoice-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                invalid={!!errors.dueDate}
              />
            </FormField>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Review changes
        </Button>
      </div>
    </form>
  )
}
