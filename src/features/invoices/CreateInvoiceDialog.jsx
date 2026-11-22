// Form inside the Create Invoice modal: choose a student, billing month, amount and due date.
import { useState } from 'react'
import { formatCurrency, todayISO } from '../../lib/format.js'
import { Button, ClockIcon, FormField, Input, Select } from '../../components/ui/index.js'
import { addDaysISO, getMonthlyFeeForStudent } from './invoiceUtils.js'

const DEFAULT_TERMS_DAYS = 14

// Turns 'YYYY-MM' into a label such as 'March 2025 tuition'.
function periodLabelFor(yearMonth) {
  const date = new Date(`${yearMonth}-01T00:00:00`)
  const month = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return `${month} tuition`
}

export default function CreateInvoiceDialog({ students, onCreate, onCancel }) {
  const issueDate = todayISO()
  const currentMonth = issueDate.slice(0, 7)

  const [studentId, setStudentId] = useState('')
  const [yearMonth, setYearMonth] = useState(currentMonth)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(addDaysISO(issueDate, DEFAULT_TERMS_DAYS))
  const [errors, setErrors] = useState({})

  const selectedStudent = students.find((s) => s.id === studentId) || null
  const monthlyFee = selectedStudent ? getMonthlyFeeForStudent(selectedStudent) : null

  // Changing the student fills in the monthly fee automatically; per-session students start blank.
  const handleStudentChange = (id) => {
    setStudentId(id)
    const student = students.find((s) => s.id === id)
    const fee = student ? getMonthlyFeeForStudent(student) : null
    setAmount(fee !== null ? String(fee) : '')
    setErrors((prev) => ({ ...prev, studentId: undefined, amount: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    if (!studentId) next.studentId = 'Please choose a student.'
    if (!yearMonth) next.yearMonth = 'Please choose a billing month.'
    const numericAmount = Number(amount)
    if (!(numericAmount > 0)) next.amount = 'Enter an amount greater than 0.'
    if (!dueDate) next.dueDate = 'Please choose a due date.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onCreate({
      studentId,
      periodLabel: periodLabelFor(yearMonth),
      issueDate,
      dueDate,
      amount: numericAmount,
      sent: false,
    })
  }

  const amountHint =
    monthlyFee !== null
      ? `Monthly fee for this student: ${formatCurrency(monthlyFee)}. You can change it.`
      : selectedStudent
        ? 'Per-session student: enter the total for this invoice.'
        : 'Choose a student to fill in their fee.'

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Who and what</p>
          <FormField
            label="Student"
            htmlFor="invoice-student"
            required
            error={errors.studentId}
            hint="Monthly fee students are filled in automatically."
          >
            <Select
              id="invoice-student"
              value={studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
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

          <FormField
            label="Billing month"
            htmlFor="invoice-period"
            required
            error={errors.yearMonth}
            hint="The period label is generated from this month."
          >
            <Input
              id="invoice-period"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              invalid={!!errors.yearMonth}
            />
          </FormField>
        </section>

        <section className="space-y-4 border-t border-navy-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Amount and due date</p>
          <FormField label="Amount (₹)" htmlFor="invoice-amount" required error={errors.amount} hint={amountHint}>
            <Input
              id="invoice-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              invalid={!!errors.amount}
            />
          </FormField>

          <FormField label="Due date" htmlFor="invoice-due" required error={errors.dueDate}>
            <Input
              id="invoice-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              invalid={!!errors.dueDate}
            />
          </FormField>
        </section>

        <div className="flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-sm text-navy-700">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-sky-700">
            <ClockIcon className="h-4 w-4" />
          </span>
          <p>
            Issue date: <span className="font-medium text-navy-900">{issueDate}</span>. The invoice is
            saved as a draft until you mark it as sent.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Create invoice
        </Button>
      </div>
    </form>
  )
}
