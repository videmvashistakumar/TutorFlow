// Form inside the Record payment modal: amount (full or partial), date and payment method.
import { useState } from 'react'
import { formatCurrency, todayISO } from '../../lib/format.js'
import { Button, FormField, Input, Select } from '../../components/ui/index.js'
import { PAYMENT_METHOD_OPTIONS, getAmountPaid, getRemaining } from './invoiceUtils.js'

export default function RecordPaymentDialog({ invoice, onRecord, onCancel }) {
  const remaining = getRemaining(invoice)
  const paid = getAmountPaid(invoice)
  const today = todayISO()

  const [amount, setAmount] = useState(() => remaining.toFixed(2))
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState(PAYMENT_METHOD_OPTIONS[0].value)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    const numericAmount = Number(amount)
    if (!(numericAmount > 0)) next.amount = 'Enter an amount greater than 0.'
    else if (numericAmount > remaining) {
      next.amount = `The amount cannot be more than the balance of ${formatCurrency(remaining)}.`
    }
    if (!date) next.date = 'Please choose a payment date.'
    else if (date > today) next.date = 'The payment date cannot be in the future.'
    if (!method) next.method = 'Please choose a payment method.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onRecord({ amount: Math.round(numericAmount * 100) / 100, date, method })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-navy-500">Invoice</p>
          <p className="font-medium text-navy-900">{invoice.number}</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 rounded-lg border border-navy-100 bg-navy-50/60 p-4 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Invoice total</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums text-navy-900">
              {formatCurrency(invoice.amount)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Paid</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums text-navy-900">{formatCurrency(paid)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-navy-500">Balance due</dt>
            <dd className="mt-0.5 truncate font-semibold tabular-nums text-red-700">
              {formatCurrency(remaining)}
            </dd>
          </div>
        </dl>

        <FormField
          label="Payment amount (₹)"
          htmlFor="payment-amount"
          required
          error={errors.amount}
          hint="You can record a partial payment."
        >
          <div className="flex items-stretch gap-2">
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              invalid={!!errors.amount}
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              onClick={() => setAmount(remaining.toFixed(2))}
              className="shrink-0"
            >
              Pay full balance
            </Button>
          </div>
        </FormField>

        <FormField label="Payment date" htmlFor="payment-date" required error={errors.date}>
          <Input
            id="payment-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            invalid={!!errors.date}
          />
        </FormField>

        <FormField label="Payment method" htmlFor="payment-method" required error={errors.method}>
          <Select
            id="payment-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            invalid={!!errors.method}
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="accent">
          Record payment
        </Button>
      </div>
    </form>
  )
}
