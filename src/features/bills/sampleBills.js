// Six realistic sample bills for an independent home tutor. Amounts are in rupees (INR).
import { daysAgoISO } from '../../lib/format.js'

export const sampleBills = [
  {
    id: 'bill-01',
    name: 'Mobile phone plan',
    amount: 599,
    frequency: 'monthly',
    startDate: daysAgoISO(12),
    notes: 'Used for parent messages and scheduling',
    paidDates: [daysAgoISO(12)],
  },
  {
    id: 'bill-02',
    name: 'Online teaching platform',
    amount: 999,
    frequency: 'monthly',
    startDate: daysAgoISO(20),
    notes: 'Video lessons and shared whiteboard',
    paidDates: [],
  },
  {
    id: 'bill-03',
    name: 'Printing and worksheets',
    amount: 250,
    frequency: 'weekly',
    startDate: daysAgoISO(3),
    notes: 'Practice papers and printed resources',
    paidDates: [],
  },
  {
    id: 'bill-04',
    name: 'Professional indemnity insurance',
    amount: 6500,
    frequency: 'yearly',
    startDate: daysAgoISO(200),
    notes: 'Annual policy renewal',
    paidDates: [],
  },
  {
    id: 'bill-05',
    name: 'Accountant (bookkeeping and tax)',
    amount: 3000,
    frequency: 'quarterly',
    startDate: daysAgoISO(40),
    notes: 'Quarterly bookkeeping review',
    paidDates: [],
  },
  {
    id: 'bill-06',
    name: 'Enhanced DBS check',
    amount: 2000,
    frequency: 'one-time',
    startDate: daysAgoISO(-9),
    notes: 'Background check needed before new students',
    paidDates: [],
  },
]
