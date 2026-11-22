// Assisted follow-ups: overdue days, suggested tone, message text, WhatsApp links and reminder history.
import { formatCurrency, formatDate, todayISO } from '../../lib/format.js'
import { getRemaining } from '../invoices/invoiceUtils.js'
import { createId } from '../students/studentUtils.js'

export const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'firm', label: 'Firm' },
  { value: 'final', label: 'Final Notice' },
]

export const PAYMENT_DETAILS_KEY = 'tutorflow.paymentDetails.v1'

export function getToneLabel(value) {
  const found = TONE_OPTIONS.find((o) => o.value === value)
  return found ? found.label : value
}

export function loadPaymentDetails() {
  try {
    return localStorage.getItem(PAYMENT_DETAILS_KEY) || ''
  } catch {
    return ''
  }
}

export function savePaymentDetails(text) {
  try {
    localStorage.setItem(PAYMENT_DETAILS_KEY, text)
  } catch {
    /* storage unavailable: ignore */
  }
}

function utcDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}

export function getDaysOverdue(invoice) {
  return Math.max(0, utcDay(todayISO()) - utcDay(invoice.dueDate))
}

export function isReminderEligible(invoice) {
  return Boolean(invoice.sent) && getRemaining(invoice) > 0
}

export function suggestedTone(daysOverdue) {
  if (daysOverdue >= 21) return 'final'
  if (daysOverdue >= 7) return 'firm'
  return 'friendly'
}

export function hasWhatsAppNumber(student) {
  return String(student.parentWhatsApp || '').replace(/\D/g, '').length >= 7
}

export function buildWhatsAppLink(phone, message) {
  const digits = String(phone).replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildReminderMessage({
  tone,
  parentName,
  studentName,
  invoiceNumber,
  periodLabel,
  amount,
  dueDate,
  daysOverdue,
  paymentDetails,
}) {
  const firstName = String(parentName || '').split(' ')[0] || 'there'
  const due = formatDate(dueDate)
  const owed = formatCurrency(amount)
  const overdue = daysOverdue > 0
  const dayText = `${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`
  const ref = `invoice ${invoiceNumber} for ${studentName} (${periodLabel})`
  const details = String(paymentDetails || '').trim()
  const detailsLine = details ? `\n\nPayment details: ${details}` : ''

  let body
  if (tone === 'final') {
    body = overdue
      ? `Dear ${parentName}, this is a final notice. The ${ref} is ${dayText} overdue, with ${owed} still outstanding since ${due}. Please pay in full within 7 days or contact me to discuss this. If you have already paid, please let me know so I can update my records.`
      : `Dear ${parentName}, this is a final notice for the ${ref}, due on ${due}, with ${owed} outstanding. Please pay in full by then.`
  } else if (tone === 'firm') {
    body = overdue
      ? `Hello ${firstName}, the ${ref} is now ${dayText} overdue. The outstanding balance of ${owed} was due on ${due}. Please arrange payment as soon as possible.`
      : `Hello ${firstName}, the ${ref} is due on ${due}. The outstanding balance is ${owed}. Please arrange payment by then.`
  } else {
    body = overdue
      ? `Hi ${firstName}, just a friendly reminder that the ${ref} was due on ${due} and is ${dayText} overdue. The balance is ${owed}. Thank you very much!`
      : `Hi ${firstName}, just a friendly reminder that the ${ref} is due on ${due}. The balance is ${owed}. Thank you!`
  }
  return body + detailsLine
}

export function createReminder({ tone, channel }) {
  return { id: createId('rem'), sentAt: new Date().toISOString(), tone, channel }
}

export function formatReminderTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${formatDate(d)}, ${time}`
}