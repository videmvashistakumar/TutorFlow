// One-time migration of OLD demo values (pre-INR sample data) stored in localStorage to the new rupee sample values.
// A record is changed only when BOTH its id and its current value match the old demo data, so genuine user data is left alone.
const MIGRATION_FLAG_KEY = 'tutorflow.inrMigration.v1'
const STUDENTS_KEY = 'tutorflow.students.v1'
const INVOICES_KEY = 'tutorflow.invoices.v1'

// Student feeAmount (monthly fee, or per-session rate for per-session students), keyed by student id.
const STUDENT_FEE_MAP = {
  'stu-01': { from: 180, to: 3000 }, // Amara Okafor (monthly)
  'stu-02': { from: 160, to: 2500 }, // Oliver Hughes (monthly)
  'stu-03': { from: 30, to: 500 }, // Priya Patel (per-session)
  'stu-04': { from: 200, to: 4000 }, // Ethan Clarke (monthly)
  'stu-05': { from: 170, to: 3500 }, // Sophie Brennan (monthly)
  'stu-06': { from: 220, to: 4500 }, // Jamal Robinson (monthly)
  'stu-07': { from: 25, to: 450 }, // Lucy Ferguson (per-session)
  'stu-08': { from: 165, to: 3200 }, // Noah Williams (monthly)
  'stu-10': { from: 35, to: 550 }, // Daniel Mensah (per-session)
}

// Invoice amount (and total, if present), keyed by invoice id.
const INVOICE_AMOUNT_MAP = {
  'inv-01': { from: 180, to: 3000 },
  'inv-02': { from: 160, to: 2500 },
  'inv-03': { from: 200, to: 4000 },
  'inv-04': { from: 170, to: 3500 },
  'inv-05': { from: 220, to: 4500 },
  'inv-06': { from: 165, to: 3200 },
}

// Payment amount, keyed by payment id.
const PAYMENT_AMOUNT_MAP = {
  'pay-01': { from: 85, to: 1000 },
  'pay-02': { from: 220, to: 4500 },
}

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Sets record[field] to the new value only if the record id is mapped and the current value equals the old one.
function migrateField(record, field, map) {
  if (!record || typeof record !== 'object') return false
  const rule = map[record.id]
  if (!rule || record[field] !== rule.from) return false
  record[field] = rule.to
  return true
}

export function migrateToInr() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return

    let changed = false

    const students = readArray(STUDENTS_KEY)
    if (students) {
      let studentsChanged = false
      for (const student of students) {
        if (migrateField(student, 'feeAmount', STUDENT_FEE_MAP)) studentsChanged = true
        // Per-session fees on the student's sessions, only where they still hold the old rate.
        const rule = student && STUDENT_FEE_MAP[student.id]
        if (rule && Array.isArray(student.sessions)) {
          for (const session of student.sessions) {
            if (migrateField(session, 'fee', { [student.id]: rule })) studentsChanged = true
          }
        }
      }
      if (studentsChanged) {
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
        changed = true
      }
    }

    const invoices = readArray(INVOICES_KEY)
    if (invoices) {
      let invoicesChanged = false
      for (const invoice of invoices) {
        if (migrateField(invoice, 'amount', INVOICE_AMOUNT_MAP)) invoicesChanged = true
        if (migrateField(invoice, 'total', INVOICE_AMOUNT_MAP)) invoicesChanged = true
        if (invoice && Array.isArray(invoice.payments)) {
          for (const payment of invoice.payments) {
            if (migrateField(payment, 'amount', PAYMENT_AMOUNT_MAP)) invoicesChanged = true
          }
        }
      }
      if (invoicesChanged) {
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
        changed = true
      }
    }

    // Cash settings are intentionally not migrated: the sample defaults are all 0, so there is no old demo value to match.

    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorflow:data-changed'))
    }
  } catch {
    /* migration must never break app load */
  } finally {
    try {
      localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    } catch {
      /* storage unavailable: ignore */
    }
  }
}
