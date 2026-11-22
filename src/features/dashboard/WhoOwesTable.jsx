// "Who Owes Me" table: unpaid sent invoices sorted by days overdue, with the last reminder date.
import { formatCurrency, formatDate } from '../../lib/format.js'
import { formatReminderTime } from '../followups/followupUtils.js'
import { Badge, EmptyState, Table, Td, Th, Tr, CheckCircleIcon } from '../../components/ui/index.js'

export default function WhoOwesTable({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          icon={<CheckCircleIcon className="h-6 w-6" />}
          title="No unpaid invoices"
          description="You are all caught up."
          dashed={false}
        />
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <Th>Student</Th>
            <Th>Parent</Th>
            <Th>Outstanding</Th>
            <Th>Invoice date</Th>
            <Th>Due date</Th>
            <Th>Days overdue</Th>
            <Th>Last reminder</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td className="align-top">
                <p className="font-semibold text-navy-900">{r.studentName}</p>
                <p className="text-xs text-navy-500">{r.number}</p>
              </Td>
              <Td className="align-top text-navy-700">{r.parentName || '—'}</Td>
              <Td className="align-top font-semibold tabular-nums text-navy-900">{formatCurrency(r.outstanding)}</Td>
              <Td className="whitespace-nowrap align-top text-navy-700">{formatDate(r.issueDate)}</Td>
              <Td className="whitespace-nowrap align-top text-navy-700">{formatDate(r.dueDate)}</Td>
              <Td className="align-top">
                {r.daysOverdue > 0 ? (
                  <Badge tone="danger">{r.daysOverdue} days</Badge>
                ) : (
                  <Badge tone="neutral">Not due</Badge>
                )}
              </Td>
              <Td className="whitespace-nowrap align-top text-navy-700">
                {r.lastReminderAt ? formatReminderTime(r.lastReminderAt) : 'Never'}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
