// Dashboard calculations: totals, the 30-day income window and "Who Owes Me" rows. Pure functions over stored data.
import { addDaysISO, getRemaining, isOverdue } from '../invoices/invoiceUtils.js'
import { getDaysOverdue } from '../followups/followupUtils.js'

// Today plus the next 29 days: 30 days counting today.
export const EXPECTED_WINDOW_DAYS = 30

// Drafts are not owed yet, so only sent invoices count toward any total.
function isSent(invoice) {
  return Boolean(invoice.sent)
}

export function getOutstandingTotal(invoices) {
  return invoices
    .filter((inv) => isSent(inv))
    .reduce((sum, inv) => sum + getRemaining(inv), 0)
}

export function getOverdueTotal(invoices) {
  return invoices
    .filter((inv) => isOverdue(inv))
    .reduce((sum, inv) => sum + getRemaining(inv), 0)
}

export function getCollectedThisMonth(invoices, today) {
  const month = today.slice(0, 7)
  return invoices
    .filter((inv) => isSent(inv))
    .flatMap((inv) => inv.payments || [])
    .filter((p) => String(p.date || '').startsWith(month))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
}

export function getExpectedNext30Days(invoices, today) {
  const end = addDaysISO(today, EXPECTED_WINDOW_DAYS - 1)
  return invoices
    .filter(
      (inv) =>
        isSent(inv) &&
        getRemaining(inv) > 0 &&
        inv.dueDate >= today &&
        inv.dueDate <= end
    )
    .reduce((sum, inv) => sum + getRemaining(inv), 0)
}

function latestReminderAt(invoice) {
  const times = (invoice.reminders || []).map((r) => r.sentAt).filter(Boolean).sort()
  return times.length > 0 ? times[times.length - 1] : null
}

// Unpaid sent invoices, most days overdue first. Ties (e.g. not yet due) fall back to earliest due date.
export function buildOwesRows(invoices, students) {
  const studentById = new Map(students.map((s) => [s.id, s]))
  return invoices
    .filter((inv) => isSent(inv) && getRemaining(inv) > 0)
    .map((inv) => {
      const student = studentById.get(inv.studentId) || null
      return {
        id: inv.id,
        number: inv.number,
        studentName: student ? student.name : 'Unknown student',
        parentName: student ? student.parentName : '',
        outstanding: getRemaining(inv),
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        daysOverdue: getDaysOverdue(inv),
        lastReminderAt: latestReminderAt(inv),
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue || a.dueDate.localeCompare(b.dueDate))
}