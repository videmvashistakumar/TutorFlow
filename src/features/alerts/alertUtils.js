// Alerts and today's actions built from stored invoices, bills and cash settings. Pure functions.
import { formatCurrency, formatDate } from '../../lib/format.js'
import { getRemaining, getStatus, addDaysISO, getMonthlyFeeForStudent } from '../invoices/invoiceUtils.js'
import { getUnpaidBillsForForecast } from '../bills/billUtils.js'
import { buildForecast } from '../cashForecast/forecastUtils.js'
import { loadCashSettings } from '../cashForecast/cashSettingsStorage.js'

const SEVERITY_RANK = { danger: 0, warning: 1, info: 2 }

const ACTION_LABELS = {
  invoices: 'Open invoices',
  bills: 'Open bills',
  'cash-forecast': 'Open cash forecast',
}

export function buildAlerts({ invoices, bills, students, today }) {
  const alerts = []

  for (const inv of invoices || []) {
    if (inv.sent !== true) continue
    const remaining = getRemaining(inv)
    if (!(remaining > 0)) continue
    if (getStatus(inv, today) === 'Draft') continue

    if (inv.dueDate < today) {
      alerts.push({
        id: `invoice|${inv.id}`,
        severity: 'danger',
        title: `Overdue invoice ${inv.number}`,
        detail: `${formatCurrency(remaining)} overdue since ${formatDate(inv.dueDate)}`,
        page: 'invoices',
      })
    } else if (inv.dueDate === addDaysISO(today, 2)) {
      alerts.push({
        id: `due2|${inv.id}`,
        severity: 'warning',
        title: `Payment due soon: ${inv.number}`,
        detail: `${formatCurrency(remaining)} due ${formatDate(inv.dueDate)}`,
        page: 'invoices',
      })
    }
  }

  for (const item of getUnpaidBillsForForecast(bills || [], today, addDaysISO(today, 7))) {
    if (item.overdue) {
      alerts.push({
        id: `bill|${item.key}`,
        severity: 'danger',
        title: `Overdue bill: ${item.name}`,
        detail: `${formatCurrency(item.amount)} was due ${formatDate(item.dueDate)}`,
        page: 'bills',
      })
    } else if (item.dueDate === today) {
      alerts.push({
        id: `bill|${item.key}`,
        severity: 'warning',
        title: `Bill due today: ${item.name}`,
        detail: `${formatCurrency(item.amount)} due today`,
        page: 'bills',
      })
    } else {
      alerts.push({
        id: `bill|${item.key}`,
        severity: 'info',
        title: `Bill due soon: ${item.name}`,
        detail: `${formatCurrency(item.amount)} due ${formatDate(item.dueDate)}`,
        page: 'bills',
      })
    }
  }

  const s = loadCashSettings()
  const f = buildForecast({
    invoices,
    bills,
    today,
    horizonDays: 30,
    opening: s.opening,
    buffer: s.buffer,
    delayDays: s.delayDays,
  })
  if (f.firstShortfall) {
    alerts.push({
      id: 'cash|shortfall',
      severity: 'danger',
      title: `Cash shortfall on ${formatDate(f.firstShortfall.date)}`,
      detail: `Projected balance ${formatCurrency(f.firstShortfall.balance)} is below your buffer of ${formatCurrency(s.buffer)}`,
      page: 'cash-forecast',
    })
  }

  const monthKey = today.slice(0, 7)
  const invoicedThisMonth = new Set(
    (invoices || [])
      .filter((inv) => String(inv.issueDate || '').slice(0, 7) === monthKey)
      .map((inv) => inv.studentId),
  )
  for (const student of students || []) {
    if (student.status !== 'active') continue
    const fee = getMonthlyFeeForStudent(student)
    if (!(fee > 0)) continue
    if (invoicedThisMonth.has(student.id)) continue
    alerts.push({
      id: `missing|${student.id}|${monthKey}`,
      severity: 'warning',
      title: `No invoice yet this month: ${student.name}`,
      detail: `Monthly fee of ${formatCurrency(fee)} has not been invoiced for ${monthKey}`,
      page: 'invoices',
    })
  }

  const latePaymentsByStudent = new Map()
  for (const inv of invoices || []) {
    if (!inv.dueDate) continue
    for (const p of inv.payments || []) {
      if (!p.date || !(p.date > inv.dueDate)) continue
      latePaymentsByStudent.set(inv.studentId, (latePaymentsByStudent.get(inv.studentId) || 0) + 1)
    }
  }
  for (const [studentId, count] of latePaymentsByStudent) {
    if (count < 2) continue
    const student = (students || []).find((s) => s.id === studentId)
    alerts.push({
      id: `late|${studentId}`,
      severity: 'info',
      title: `Repeated late payments: ${student ? student.name : studentId}`,
      detail: `${count} payments were made after their due date`,
      page: 'invoices',
    })
  }

  const seen = new Set()
  const unique = alerts.filter((a) => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  return unique.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}

export function getTodaysActions(alerts) {
  return alerts
    .filter((a) => a.severity === 'danger' || a.severity === 'warning')
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, 6)
    .map((a) => ({ ...a, actionLabel: ACTION_LABELS[a.page] }))
}

export function countUnread(alerts) {
  return alerts.filter((a) => a.severity !== 'info').length
}
