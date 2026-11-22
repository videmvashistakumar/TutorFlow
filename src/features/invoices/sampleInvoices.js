// Sample invoices linked to sample students. Amounts match each student's monthly fee.
import { daysAgoISO } from '../../lib/format.js'

const issue1 = daysAgoISO(2)
const issue2 = daysAgoISO(5)
const issue3 = daysAgoISO(35)
const issue4 = daysAgoISO(40)
const issue5 = daysAgoISO(30)
const issue6 = daysAgoISO(7)

export const sampleInvoices = [
  {
    id: 'inv-01',
    number: `INV-${issue1.slice(0, 4)}-001`,
    studentId: 'stu-01',
    periodLabel: 'Monthly tuition',
    issueDate: issue1,
    dueDate: daysAgoISO(-12),
    amount: 3000,
    sent: false,
    payments: [],
  },
  {
    id: 'inv-02',
    number: `INV-${issue2.slice(0, 4)}-002`,
    studentId: 'stu-02',
    periodLabel: 'Monthly tuition',
    issueDate: issue2,
    dueDate: daysAgoISO(-10),
    amount: 2500,
    sent: true,
    payments: [],
  },
  {
    id: 'inv-03',
    number: `INV-${issue3.slice(0, 4)}-003`,
    studentId: 'stu-04',
    periodLabel: 'Monthly tuition',
    issueDate: issue3,
    dueDate: daysAgoISO(20),
    amount: 4000,
    sent: true,
    payments: [],
  },
  {
    id: 'inv-04',
    number: `INV-${issue4.slice(0, 4)}-004`,
    studentId: 'stu-05',
    periodLabel: 'Monthly tuition',
    issueDate: issue4,
    dueDate: daysAgoISO(15),
    amount: 3500,
    sent: true,
    payments: [{ id: 'pay-01', amount: 1000, date: daysAgoISO(10), method: 'bank-transfer' }],
  },
  {
    id: 'inv-05',
    number: `INV-${issue5.slice(0, 4)}-005`,
    studentId: 'stu-06',
    periodLabel: 'Monthly tuition',
    issueDate: issue5,
    dueDate: daysAgoISO(16),
    amount: 4500,
    sent: true,
    payments: [{ id: 'pay-02', amount: 4500, date: daysAgoISO(18), method: 'upi' }],
  },
  {
    id: 'inv-06',
    number: `INV-${issue6.slice(0, 4)}-006`,
    studentId: 'stu-08',
    periodLabel: 'Monthly tuition',
    issueDate: issue6,
    dueDate: daysAgoISO(-3),
    amount: 3200,
    sent: true,
    payments: [],
  },
]