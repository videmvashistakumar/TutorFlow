// Form for logging a session for a student; date defaults to today and cannot be in the future.
import { useState } from 'react'
import { formatCurrency, todayISO } from '../../lib/format.js'
import { getChargeForSession } from './studentUtils.js'
import { Button, FormField, Input } from '../../components/ui/index.js'

export default function LogSessionDialog({ student, onLog, onCancel }) {
  const [date, setDate] = useState(() => todayISO())
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date) {
      setError('Please choose a date.')
      return
    }
    if (date > todayISO()) {
      setError('The session date cannot be in the future.')
      return
    }
    setError('')
    onLog(date)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField label="Session date" htmlFor="session-date" error={error}>
        <Input
          id="session-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          invalid={!!error}
        />
      </FormField>

      <p className="rounded-lg bg-navy-50/60 px-4 py-3 text-sm text-navy-700">
        {student.feeType === 'per-session'
          ? `This session will add ${formatCurrency(getChargeForSession(student))} to outstanding.`
          : 'Monthly student: no charge is added per session.'}
      </p>

      <div className="flex flex-col-reverse gap-3 border-t border-navy-100 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Log session</Button>
      </div>
    </form>
  )
}
