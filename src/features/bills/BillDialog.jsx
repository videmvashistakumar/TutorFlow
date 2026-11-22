import { useState } from 'react'
import { Button, FormField, Input, Select, Textarea } from '../../components/ui/index.js'
import { FREQUENCY_OPTIONS, validateBill, createBill } from './billUtils.js'
import { todayISO } from '../../lib/format.js'

function FormSection({ title, description, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-navy-900">{title}</legend>
      {description && <p className="-mt-2 text-xs text-navy-500">{description}</p>}
      {children}
    </fieldset>
  )
}

export default function BillDialog({ bill, onSave, onCancel }) {
  const [name, setName] = useState(bill ? bill.name : '')
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '')
  const [frequency, setFrequency] = useState(bill ? bill.frequency : 'monthly')
  const [startDate, setStartDate] = useState(bill ? bill.startDate : todayISO())
  const [notes, setNotes] = useState(bill && bill.notes ? bill.notes : '')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const fields = { name, amount, frequency, startDate, notes }
    const nextErrors = validateBill(fields)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (bill) {
      onSave({
        ...bill,
        name: name.trim(),
        amount: Number(amount),
        frequency,
        startDate,
        notes: notes.trim(),
      })
    } else {
      onSave(createBill(fields))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Bill details" description="What you pay and how much each time.">
        <FormField
          label="Name"
          htmlFor="bill-name"
          required
          hint="For example: Electricity, Internet or Car insurance."
          error={errors.name}
        >
          <Input
            id="bill-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={Boolean(errors.name)}
          />
        </FormField>

        <FormField
          label="Amount"
          htmlFor="bill-amount"
          required
          hint="The amount due each time this bill is paid."
          error={errors.amount}
        >
          <Input
            id="bill-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            invalid={Boolean(errors.amount)}
          />
        </FormField>
      </FormSection>

      <FormSection title="Schedule" description="When the bill is due and how often it repeats.">
        <FormField
          label="Frequency"
          htmlFor="bill-frequency"
          required
          hint="How often this bill is paid."
          error={errors.frequency}
        >
          <Select
            id="bill-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            invalid={Boolean(errors.frequency)}
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="First due date"
          htmlFor="bill-start-date"
          required
          hint="Later due dates follow from this one and the frequency."
          error={errors.startDate}
        >
          <Input
            id="bill-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            invalid={Boolean(errors.startDate)}
          />
        </FormField>
      </FormSection>

      <FormSection title="Notes">
        <FormField label="Notes (optional)" htmlFor="bill-notes" hint="Account number, provider contact or reminders.">
          <Textarea
            id="bill-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-navy-100 pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save bill</Button>
      </div>
    </form>
  )
}
