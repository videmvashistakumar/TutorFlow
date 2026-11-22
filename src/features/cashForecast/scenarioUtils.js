// What-if scenario maths: shift one student's invoice due dates in memory and compare against the baseline forecast. No storage.
import { buildForecast } from './forecastUtils.js'
import { getRemaining, getStatus, addDaysISO } from '../invoices/invoiceUtils.js'
import { formatCurrency, formatDate } from '../../lib/format.js'

// Indian rupee format with no decimals; delegates to the shared formatter.
export function formatRupees(n) {
  return formatCurrency(n)
}

// Signed rupee amount for deltas, e.g. +₹500 or −₹500.
function signedRupees(n) {
  if (n > 0) return '+' + formatRupees(n)
  if (n < 0) return '\u2212' + formatRupees(-n)
  return formatRupees(0)
}

// Sent, not draft, with money still owed; oldest due date first.
export function getUnpaidInvoicesForStudent(invoices, studentId) {
  return invoices
    .filter((inv) => inv.studentId === studentId && inv.sent === true && getStatus(inv) !== 'Draft' && getRemaining(inv) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

// Keeps the original student order.
export function getStudentsWithUnpaidInvoices(invoices, students) {
  return students.filter((s) => getUnpaidInvoicesForStudent(invoices, s.id).length > 0)
}

export function buildLateScenario({
  invoices,
  bills,
  today,
  horizonDays,
  opening,
  buffer,
  delayDays,
  studentId,
  studentName,
  scenarioDelay,
}) {
  // Baseline: the forecast as it stands.
  const baseline = buildForecast({ invoices, bills, today, horizonDays, opening, buffer, delayDays })

  // Copy the invoices, moving only this student's due dates. The originals are never changed.
  const shifted = invoices.map((inv) =>
    inv.studentId === studentId ? { ...inv, dueDate: addDaysISO(inv.dueDate, scenarioDelay) } : inv
  )

  // An overdue invoice shifted later still counts today if the new date is before today; that is correct, because the forecast counts overdue cash on today.
  const scenario = buildForecast({ invoices: shifted, bills, today, horizonDays, opening, buffer, delayDays })

  const affectedCount = getUnpaidInvoicesForStudent(invoices, studentId).length
  const lowestDelta = scenario.lowestBalance - baseline.lowestBalance
  const endDelta = scenario.endBalance - baseline.endBalance
  const baselineShortfall = baseline.firstShortfall
  const scenarioShortfall = scenario.firstShortfall

  // Plain-language summary of what the delay does.
  const d = scenarioDelay
  let explanation
  if (affectedCount === 0) {
    explanation = `${studentName} has no unpaid invoices to delay.`
  } else if (d === 0) {
    explanation = 'No delay selected. The forecast is unchanged.'
  } else if (scenarioShortfall && !baselineShortfall) {
    explanation = `If ${studentName}'s payment is delayed by ${d} days, your projected balance may fall below your cash buffer of ${formatRupees(buffer)} on ${formatDate(scenarioShortfall.date)}. The lowest balance would be ${formatRupees(scenario.lowestBalance)}.`
  } else if (scenarioShortfall && baselineShortfall && scenarioShortfall.date < baselineShortfall.date) {
    explanation = `If ${studentName}'s payment is delayed by ${d} days, the cash shortfall moves forward from ${formatDate(baselineShortfall.date)} to ${formatDate(scenarioShortfall.date)}.`
  } else if (scenarioShortfall && baselineShortfall) {
    explanation = `If ${studentName}'s payment is delayed by ${d} days, a shortfall still appears on ${formatDate(scenarioShortfall.date)}. The lowest balance changes by ${signedRupees(lowestDelta)}.`
  } else if (baselineShortfall && !scenarioShortfall) {
    explanation = 'The delay removes the shortfall from this window.'
  } else {
    explanation = `If ${studentName}'s payment is delayed by ${d} days, your projected balance stays above your cash buffer. The lowest balance changes by ${signedRupees(lowestDelta)}.`
  }

  return {
    baseline,
    scenario,
    affectedCount,
    lowestDelta,
    endDelta,
    baselineShortfall,
    scenarioShortfall,
    explanation,
  }
}
