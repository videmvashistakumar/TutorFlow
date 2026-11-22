// Formatting helpers: INR (rupee) currency with Indian grouping, whole rupees for display, and local-date ISO strings (YYYY-MM-DD).
const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatCurrency = (amount) => inrFormatter.format(Number(amount) || 0)

// Alias so existing importers keep working.
export const formatRupees = formatCurrency

const isoFromDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayISO = () => isoFromDate(new Date())

export const daysAgoISO = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoFromDate(d)
}

export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
