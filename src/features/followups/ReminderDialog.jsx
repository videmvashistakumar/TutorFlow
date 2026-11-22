// Reminder modal for one invoice: choose tone, edit and copy or open the WhatsApp message, and view history.
import { useState } from 'react'
import { getRemaining } from '../invoices/invoiceUtils.js'
import { Button, FormField, Input, SendIcon, Textarea, FileTextIcon, ClockIcon } from '../../components/ui/index.js'
import {
  TONE_OPTIONS,
  buildReminderMessage,
  buildWhatsAppLink,
  createReminder,
  formatReminderTime,
  getDaysOverdue,
  getToneLabel,
  hasWhatsAppNumber,
  loadPaymentDetails,
  savePaymentDetails,
  suggestedTone,
} from './followupUtils.js'

const CHANNEL_LABELS = { copy: 'Copied', whatsapp: 'Opened in WhatsApp' }

export default function ReminderDialog({ invoice, student, onLogReminder }) {
  const daysOverdue = getDaysOverdue(invoice)
  const [tone, setTone] = useState(() => suggestedTone(daysOverdue))
  const [paymentDetails, setPaymentDetails] = useState(() => loadPaymentDetails())
  const [editedMessage, setEditedMessage] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')

  if (!student) {
    return <p className="text-sm text-red-600">The student for this invoice could not be found.</p>
  }

  const generated = buildReminderMessage({
    tone,
    parentName: student.parentName,
    studentName: student.name,
    invoiceNumber: invoice.number,
    periodLabel: invoice.periodLabel,
    amount: getRemaining(invoice),
    dueDate: invoice.dueDate,
    daysOverdue,
    paymentDetails,
  })
  const message = editedMessage ?? generated
  const canOpen = hasWhatsAppNumber(student)
  const reminders = [...(invoice.reminders || [])].sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  const changeTone = (value) => {
    setTone(value)
    setEditedMessage(null)
  }

  const changePaymentDetails = (text) => {
    setPaymentDetails(text)
    savePaymentDetails(text)
    setEditedMessage(null)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopyStatus('Copied to clipboard.')
      onLogReminder(createReminder({ tone, channel: 'copy' }))
    } catch {
      setCopyStatus('Could not copy automatically. Select the text and copy it manually.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-navy-800">Tone</p>
        <div role="radiogroup" aria-label="Reminder tone" className="mt-2 grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={tone === opt.value}
              onClick={() => changeTone(opt.value)}
              className={`h-10 rounded-lg border px-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                tone === opt.value
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-navy-500">
          {daysOverdue > 0 ? `${daysOverdue} day(s) overdue. Suggested tone applied.` : 'Not overdue yet.'}
        </p>
      </div>

      <FormField label="Message" htmlFor="reminder-message">
        <Textarea
          id="reminder-message"
          rows={8}
          value={message}
          onChange={(e) => setEditedMessage(e.target.value)}
          className="leading-relaxed"
        />
        {editedMessage !== null && (
          <Button variant="ghost" size="sm" onClick={() => setEditedMessage(null)} className="self-start text-emerald-700">
            Reset to suggested text
          </Button>
        )}
      </FormField>

      <FormField
        label="Payment details"
        htmlFor="reminder-payment"
        hint="Optional. Remembered on this device."
      >
        <Input
          id="reminder-payment"
          type="text"
          value={paymentDetails}
          onChange={(e) => changePaymentDetails(e.target.value)}
          placeholder="e.g. UPI: name@bank, or sort code and account number"
        />
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="secondary"
          icon={<FileTextIcon className="h-4 w-4" />}
          onClick={handleCopy}
        >
          Copy Message
        </Button>
        {canOpen ? (
          <a
            href={buildWhatsAppLink(student.parentWhatsApp, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLogReminder(createReminder({ tone, channel: 'whatsapp' }))}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <SendIcon className="h-4 w-4" />
            Open in WhatsApp
          </a>
        ) : (
          <p className="text-sm text-red-600">Add a WhatsApp number to open this chat.</p>
        )}
      </div>
      {copyStatus && (
        <p role="status" className="text-right text-sm text-navy-600">
          {copyStatus}
        </p>
      )}

      <div className="border-t border-navy-100 pt-5">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-navy-500" />
          <h3 className="text-sm font-semibold text-navy-900">Reminder history</h3>
        </div>
        {reminders.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No reminders sent yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-100 text-sm">
            {reminders.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 py-2 text-navy-700">
                <span>{formatReminderTime(r.sentAt)}</span>
                <span>
                  {getToneLabel(r.tone)} · {CHANNEL_LABELS[r.channel] || r.channel}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-navy-500">
          A reminder is logged when you copy or open it. WhatsApp does not confirm delivery.
        </p>
      </div>
    </div>
  )
}
