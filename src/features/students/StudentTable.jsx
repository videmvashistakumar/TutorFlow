// Student table: avatar, name and subject, parent contact, fee, status badge, outstanding balance,
// expandable session list and the row action. Presentation only; handlers come from StudentsPage.
import { formatCurrency, formatDate } from '../../lib/format.js'
import { getOutstanding, STATUS_OPTIONS } from './studentUtils.js'
import {
  Badge,
  Button,
  TableWrap,
  Table,
  Th,
  Tr,
  Td,
  ClockIcon,
} from '../../components/ui/index.js'

// Only the active status gets the success tone; other statuses stay neutral.
const STATUS_TONES = { active: 'success' }

const COLUMNS = ['Student', 'Parent', 'Fee', 'Status', 'Outstanding', 'Actions']

const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

export default function StudentTable({ students, onLogSession, onToggleSessionPaid }) {
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <Th key={col} className={col === 'Actions' ? 'text-right' : 'text-left'}>
                {col}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <Tr>
              <Td colSpan={6} className="py-8 text-center text-navy-500">
                No students match your search.
              </Td>
            </Tr>
          ) : (
            students.map((student) => {
              const outstanding = getOutstanding(student)
              const sessions = student.sessions || []
              const statusLabel =
                STATUS_OPTIONS.find((o) => o.value === student.status)?.label ?? student.status

              return (
                <Tr key={student.id}>
                  <Td className="align-top">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700"
                      >
                        {getInitials(student.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{student.name}</p>
                        <p className="text-xs text-navy-500">{student.subject}</p>
                        {sessions.length > 0 && (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer font-medium text-emerald-700">
                              Sessions ({sessions.length})
                            </summary>
                            <ul className="mt-2 space-y-1.5">
                              {sessions.map((session) => (
                                <li key={session.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-navy-700">{formatDate(session.date)}</span>
                                  <span className="font-medium text-navy-800">{formatCurrency(session.fee)}</span>
                                  <Badge tone={session.paid ? 'success' : 'danger'}>
                                    {session.paid ? 'paid' : 'unpaid'}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() => onToggleSessionPaid(student.id, session.id)}
                                    className="font-medium text-navy-600 underline-offset-2 hover:text-navy-900 hover:underline"
                                  >
                                    {session.paid ? 'Mark unpaid' : 'Mark paid'}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="align-top">
                    <p className="text-navy-900">{student.parentName}</p>
                    <p className="text-xs text-navy-500">{student.parentWhatsApp}</p>
                  </Td>
                  <Td className="align-top">
                    <span className="font-medium text-navy-900">{formatCurrency(student.feeAmount)}</span>
                    <span className="text-xs text-navy-500">
                      {student.feeType === 'monthly' ? ' / month' : ' / session'}
                    </span>
                  </Td>
                  <Td className="align-top">
                    <Badge tone={STATUS_TONES[student.status] || 'neutral'}>{statusLabel}</Badge>
                  </Td>
                  <Td
                    className={`align-top font-semibold tabular-nums ${
                      outstanding === 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(outstanding)}
                  </Td>
                  <Td className="text-right align-top">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<ClockIcon className="h-3.5 w-3.5" />}
                      onClick={() => onLogSession(student)}
                    >
                      Log session
                    </Button>
                  </Td>
                </Tr>
              )
            })
          )}
        </tbody>
      </Table>
    </TableWrap>
  )
}
