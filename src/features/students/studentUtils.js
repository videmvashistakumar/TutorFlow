// Shared student constants and helpers: options, outstanding balance, ids and search matching.
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'finished', label: 'Finished' },
]

export const FEE_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'per-session', label: 'Per session' },
]

export const getOutstanding = (student) =>
  (student.sessions || []).filter((s) => !s.paid).reduce((sum, s) => sum + Number(s.fee || 0), 0)

export const getChargeForSession = (student) =>
  student.feeType === 'per-session' ? Number(student.feeAmount) : 0

export const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const matchesSearch = (student, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [student.name, student.parentName, student.subject, student.parentWhatsApp].some((v) =>
    String(v || '').toLowerCase().includes(q)
  )
}
