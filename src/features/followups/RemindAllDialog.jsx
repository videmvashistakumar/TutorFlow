// Review step for Remind All Overdue: adjust each tone, preview the message, then open each WhatsApp chat.
import { useState } from 'react'
import { formatCurrency } from '../../lib/format.js'
import { Button, SendIcon, Select } from '../../components/ui/index.js'
import { getRemaining } from '../invoices/invoiceUtils.js'
import {
  TONE_OPTIONS,
  buildReminderMessage,
  buildWhatsAppLink,
  createReminder,
  hasWhatsAppNumber,
  loadPaymentDetails,
  suggestedTone,
} from './followupUtils.js'

export default function RemindAllDialog({ items, onLogReminder, onClose }) {
  const [paymentDetails] = useState(() => loadPaymentDetails())
  const [tones, setTones] = useState(() =>
    Object.fromEntries(items.map((i) => [i.invoice.id, suggestedTone(i.daysOverdue)]))
  )
  const [opened, setOpened] = useState({})

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <p className="text-sm text-navy-500">There are no overdue invoices with a balance right now.</p>
      ) : (
        <>
          <p className="text-sm text-navy-600">
            {items.length} overdue invoice(s). WhatsApp opens one chat per click, so review each message
            and open them one at a time.
          </p>
          <ul className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {items.map(({ invoice, student, daysOverdue }) => {
              const tone = tones[invoice.id]
              const message = buildReminderMessage({
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
              return (
                <li key={invoice.id} className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">{student.name}</p>
                      <p className="text-xs text-navy-500">
                        {invoice.number} · {invoice.periodLabel} · {daysOverdue} day(s) overdue
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-red-700">
                        {formatCurrency(getRemaining(invoice))} outstanding
                      </p>
                    </div>
                    <div className="w-full sm:w-44 sm:shrink-0">
                      <Select
                        aria-label={`Tone for ${student.name}`}
                        value={tone}
                        onChange={(e) => setTones((prev) => ({ ...prev, [invoice.id]: e.target.value }))}
                        className="h-9 text-sm"
                      >
                        {TONE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <details className="group mt-3 text-xs text-navy-700">
                    <summary className="cursor-pointer select-none font-medium text-emerald-700 hover:text-emerald-800">
                      Preview message
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-navy-50 p-3 leading-relaxed">{message}</p>
                  </details>
                  <div className="mt-3 flex items-center justify-end gap-3 border-t border-navy-100 pt-3">
                    {opened[invoice.id] && <span className="text-xs font-medium text-emerald-700">Logged</span>}
                    {hasWhatsAppNumber(student) ? (
                      <a
                        href={buildWhatsAppLink(student.parentWhatsApp, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          onLogReminder(invoice.id, createReminder({ tone, channel: 'whatsapp' }))
                          setOpened((prev) => ({ ...prev, [invoice.id]: true }))
                        }}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        <SendIcon className="h-3.5 w-3.5" />
                        Open in WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-red-600">No WhatsApp number</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
