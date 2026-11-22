// Bills data layer: frequencies, occurrence dates, paid tracking, forecast selection and validation. Pure functions, no storage.
import { addDaysISO } from '../invoices/invoiceUtils.js'
import { createId } from '../students/studentUtils.js'

export const FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

// Months between occurrences for month-based frequencies.
const MONTHS_PER_FREQUENCY = { monthly: 1, quarterly: 3, yearly: 12 }

// Unpaid occurrences this many days in the past still count as due today in the forecast.
export const BILL_LOOKBACK_DAYS = 30

// Safety cap so a malformed bill can never loop forever.
const MAX_OCCURRENCES = 2000

export function getFrequencyLabel(value) {
  const found = FREQUENCY_OPTIONS.find((o) => o.value === value)
  return found ? found.label : value
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Adds whole months to an ISO date, keeping the day of month where possible (31 Jan + 1 month = 28/29 Feb).
function addMonthsISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const total = m - 1 + n
  const year = y + Math.floor(total / 12)
  const monthIndex = ((total % 12) + 12) % 12
  const day = Math.min(d, daysInMonth(year, monthIndex))
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

// Due date of the k-th occurrence (k = 0 is the start date). Returns null when there is no k-th occurrence.
export function occurrenceDate(startDate, frequency, k) {
  if (k === 0) return startDate
  if (frequency === 'weekly') return addDaysISO(startDate, 7 * k)
  const months = MONTHS_PER_FREQUENCY[frequency]
  if (months) return addMonthsISO(startDate, months * k)
  return null
}

export function isOccurrencePaid(bill, dueDate) {
  return Array.isArray(bill.paidDates) && bill.paidDates.includes(dueDate)
}

// Returns a new bill with one occurrence marked paid or unpaid. Does not mutate the input.
export function withOccurrencePaid(bill, dueDate, paid) {
  const current = Array.isArray(bill.paidDates) ? bill.paidDates : []
  const others = current.filter((d) => d !== dueDate)
  return { ...bill, paidDates: paid ? [...others, dueDate] : others }
}

// Every occurrence of one bill whose due date is within [fromISO, toISO], inclusive.
export function expandBill(bill, fromISO, toISO) {
  const results = []
  for (let k = 0; k < MAX_OCCURRENCES; k++) {
    const dueDate = occurrenceDate(bill.startDate, bill.frequency, k)
    if (!dueDate || dueDate > toISO) break
    if (dueDate >= fromISO) {
      results.push({
        key: `${bill.id}|${dueDate}`,
        billId: bill.id,
        name: bill.name,
        amount: Number(bill.amount) || 0,
        dueDate,
        paid: isOccurrencePaid(bill, dueDate),
      })
    }
  }
  return results
}

// Unpaid bill occurrences for a forecast starting on `today` and ending on `endISO`.
// Unpaid occurrences from the last BILL_LOOKBACK_DAYS count as due today (forecastDate = today) and are flagged overdue.
export function getUnpaidBillsForForecast(bills, today, endISO) {
  const fromISO = addDaysISO(today, -BILL_LOOKBACK_DAYS)
  return bills
    .flatMap((bill) => expandBill(bill, fromISO, endISO))
    .filter((occ) => !occ.paid)
    .map((occ) => ({
      ...occ,
      overdue: occ.dueDate < today,
      forecastDate: occ.dueDate < today ? today : occ.dueDate,
    }))
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate) || a.name.localeCompare(b.name))
}

// Returns field errors for the bill form (an empty object means valid).
export function validateBill(fields) {
  const errors = {}
  if (!String(fields.name || '').trim()) errors.name = 'Please enter a name for the bill.'
  if (!(Number(fields.amount) > 0)) errors.amount = 'Enter an amount greater than 0.'
  if (!FREQUENCY_OPTIONS.some((o) => o.value === fields.frequency)) {
    errors.frequency = 'Please choose how often this bill is paid.'
  }
  if (!fields.startDate) errors.startDate = 'Please choose the first due date.'
  return errors
}

// Builds a new bill record from validated form fields.
export function createBill(fields) {
  return {
    id: createId('bill'),
    name: String(fields.name).trim(),
    amount: Number(fields.amount),
    frequency: fields.frequency,
    startDate: fields.startDate,
    notes: String(fields.notes || '').trim(),
    paidDates: [],
  }
}