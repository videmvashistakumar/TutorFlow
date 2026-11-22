import { getRemaining, getStatus, addDaysISO } from '../invoices/invoiceUtils.js'
import { getUnpaidBillsForForecast } from '../bills/billUtils.js'

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// Every ISO date from start to end inclusive.
function getDaysInWindow(start, end) {
  const dates = []
  let current = start
  while (current <= end) {
    dates.push(current)
    current = addDaysISO(current, 1)
  }
  return dates
}

export function buildForecast({
  invoices,
  bills,
  today,
  horizonDays,
  opening,
  buffer,
  delayDays,
}) {
  const endDate = addDaysISO(today, horizonDays - 1)
  const windowDates = getDaysInWindow(today, endDate)

  const byDate = new Map()
  for (const date of windowDates) byDate.set(date, { income: 0, bills: 0 })
  const bucket = (date) => {
    if (!byDate.has(date)) byDate.set(date, { income: 0, bills: 0 })
    return byDate.get(date)
  }

  const events = []
  let overdueIncome = 0
  let expectedIncome = 0
  let billsTotal = 0

  for (const inv of invoices || []) {
    if (!inv.sent) continue
    const remaining = getRemaining(inv)
    if (!(remaining > 0)) continue
    if (getStatus(inv) === 'Draft') continue

    if (inv.dueDate < today) {
      bucket(today).income += remaining
      overdueIncome += remaining
      events.push({
        date: today,
        kind: 'overdue',
        label: `Overdue invoice ${inv.number}`,
        amount: remaining,
      })
    } else {
      const due = addDaysISO(inv.dueDate, delayDays)
      if (due >= today && due <= endDate) {
        bucket(due).income += remaining
        expectedIncome += remaining
        events.push({
          date: due,
          kind: 'income',
          label: `Invoice ${inv.number}`,
          amount: remaining,
        })
      }
    }
  }

  for (const item of getUnpaidBillsForForecast(bills || [], today, endDate)) {
    bucket(item.forecastDate).bills += item.amount
    billsTotal += item.amount
    events.push({
      date: item.forecastDate,
      kind: 'bill',
      label: item.name,
      amount: item.amount,
    })
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const days = []
  let balance = Number(opening) || 0
  let firstShortfall = null
  let lowestBalance = null

  for (const date of windowDates) {
    const { income, bills: billsOut } = byDate.get(date)
    balance = balance + income - billsOut
    const belowBuffer = balance < buffer
    days.push({
      date,
      income: round2(income),
      bills: round2(billsOut),
      balance: round2(balance),
      belowBuffer,
    })
    if (belowBuffer && firstShortfall === null) {
      firstShortfall = { date, balance: round2(balance) }
    }
    if (lowestBalance === null || balance < lowestBalance) lowestBalance = balance
  }

  const endBalance = days.length ? days[days.length - 1].balance : round2(Number(opening) || 0)

  return {
    days,
    events,
    overdueIncome: round2(overdueIncome),
    expectedIncome: round2(expectedIncome),
    billsTotal: round2(billsTotal),
    endBalance,
    lowestBalance: lowestBalance === null ? endBalance : round2(lowestBalance),
    firstShortfall,
  }
}
