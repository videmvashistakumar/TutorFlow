1// Bad Day Mode data: overdue invoice queue, priority scores, reminder drafts and potential recovery impact. Pure functions, no storage.
import { getRemaining, isOverdue } from '../invoices/invoiceUtils.js'
import { buildForecast } from '../cashForecast/forecastUtils.js'
import { buildReminderMessage, buildWhatsAppLink, hasWhatsAppNumber, suggestedTone } from '../followups/followupUtils.js'

export const BAD_DAY_THRESHOLD = 3
export const BAD_DAY_HORIZON_DAYS = 30

function dayNumber(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}

// Days overdue measured against the `today` passed in (one clock for the whole calculation).
export function daysOverdueAsOf(invoice, today) {
  return Math.max(0, dayNumber(today) - dayNumber(invoice.dueDate))
}

export function getOverdueInvoices(invoices, today) {
  return (invoices || []).filter((inv) => isOverdue(inv, today))
}

// Overdue invoices sorted by priority = outstanding amount x days overdue (highest first).
export function buildRecoveryQueue({ invoices, students, today }) {
  const studentById = new Map((students || []).map((s) => [s.id, s]))
  const queue = getOverdueInvoices(invoices, today).map((inv) => {
    const student = studentById.get(inv.studentId) || {}
    const remaining = getRemaining(inv)
    const daysOverdue = daysOverdueAsOf(inv, today)
    const message = buildReminderMessage({
      tone: suggestedTone(daysOverdue),
      parentName: student.parentName || 'Parent',
      studentName: student.name || 'your child',
      invoiceNumber: inv.number,
      periodLabel: inv.periodLabel,
      amount: remaining,
      dueDate: inv.dueDate,
      daysOverdue,
      paymentDetails: '',
    })
    return {
      invoice: inv,
      studentName: student.name || 'Unknown student',
      remaining,
      daysOverdue,
      priority: remaining * daysOverdue,
      message,
      whatsappLink: hasWhatsAppNumber(student) ? buildWhatsAppLink(student.parentWhatsApp, message) : null,
    }
  })
  return queue.sort((a, b) => b.priority - a.priority || a.invoice.dueDate.localeCompare(b.invoice.dueDate))
}

// Compares the existing 30-day cash forecast with and without collecting the overdue invoices.
// Potential recovery only: the forecast counts overdue invoices as income today, nothing is guaranteed.
export function buildRecoveryImpact({ invoices, bills, today, opening, buffer, delayDays }) {
  const overdueIds = new Set(getOverdueInvoices(invoices, today).map((inv) => inv.id))
  const common = { bills, today, horizonDays: BAD_DAY_HORIZON_DAYS, opening, buffer, delayDays }
  const withoutRecovery = buildForecast({
    ...common,
    invoices: (invoices || []).filter((inv) => !overdueIds.has(inv.id)),
  })
  const withRecovery = buildForecast({ ...common, invoices })
  return { withoutRecovery, withRecovery }
}